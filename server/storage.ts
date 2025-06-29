import { 
  users, vaccineDesigns, teams, teamMembers, projectShares, comments, designVersions,
  type User, type InsertUser, type VaccineDesign, type InsertVaccineDesign,
  type Team, type InsertTeam, type TeamMember, type InsertTeamMember,
  type ProjectShare, type InsertProjectShare, type Comment, type InsertComment,
  type DesignVersion, type InsertDesignVersion
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Vaccine Designs
  createVaccineDesign(design: InsertVaccineDesign): Promise<VaccineDesign>;
  getVaccineDesign(id: number): Promise<VaccineDesign | undefined>;
  updateVaccineDesign(id: number, updates: Partial<VaccineDesign>): Promise<VaccineDesign | undefined>;
  getUserVaccineDesigns(userId?: number): Promise<VaccineDesign[]>;
  getSharedDesigns(userId: number): Promise<VaccineDesign[]>;
  
  // Teams
  createTeam(team: InsertTeam): Promise<Team>;
  getTeam(id: number): Promise<Team | undefined>;
  getUserTeams(userId: number): Promise<Team[]>;
  addTeamMember(teamMember: InsertTeamMember): Promise<TeamMember>;
  getTeamMembers(teamId: number): Promise<TeamMember[]>;
  removeTeamMember(teamId: number, userId: number): Promise<boolean>;
  
  // Sharing
  shareDesign(share: InsertProjectShare): Promise<ProjectShare>;
  getDesignShares(designId: number): Promise<ProjectShare[]>;
  removeShare(shareId: number): Promise<boolean>;
  
  // Comments
  addComment(comment: InsertComment): Promise<Comment>;
  getDesignComments(designId: number): Promise<Comment[]>;
  deleteComment(commentId: number): Promise<boolean>;
  
  // Versions
  createDesignVersion(version: InsertDesignVersion): Promise<DesignVersion>;
  getDesignVersions(designId: number): Promise<DesignVersion[]>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Vaccine Designs
  async createVaccineDesign(insertDesign: InsertVaccineDesign): Promise<VaccineDesign> {
    const [design] = await db
      .insert(vaccineDesigns)
      .values(insertDesign)
      .returning();
    return design;
  }

  async getVaccineDesign(id: number): Promise<VaccineDesign | undefined> {
    const [design] = await db.select().from(vaccineDesigns).where(eq(vaccineDesigns.id, id));
    return design || undefined;
  }

  async updateVaccineDesign(id: number, updates: Partial<VaccineDesign>): Promise<VaccineDesign | undefined> {
    const [updated] = await db
      .update(vaccineDesigns)
      .set(updates)
      .where(eq(vaccineDesigns.id, id))
      .returning();
    return updated || undefined;
  }

  async getUserVaccineDesigns(userId?: number): Promise<VaccineDesign[]> {
    if (userId) {
      return await db.select().from(vaccineDesigns).where(eq(vaccineDesigns.userId, userId));
    }
    return await db.select().from(vaccineDesigns);
  }

  async getSharedDesigns(userId: number): Promise<VaccineDesign[]> {
    const sharedDesigns = await db
      .select({ 
        id: vaccineDesigns.id,
        userId: vaccineDesigns.userId,
        name: vaccineDesigns.name,
        inputSequence: vaccineDesigns.inputSequence,
        sequenceType: vaccineDesigns.sequenceType,
        targetPopulation: vaccineDesigns.targetPopulation,
        vaccineType: vaccineDesigns.vaccineType,
        status: vaccineDesigns.status,
        progress: vaccineDesigns.progress,
        optimizedSequence: vaccineDesigns.optimizedSequence,
        antigenicityScore: vaccineDesigns.antigenicityScore,
        populationCoverage: vaccineDesigns.populationCoverage,
        safetyScore: vaccineDesigns.safetyScore,
        epitopeCount: vaccineDesigns.epitopeCount,
        molecularWeight: vaccineDesigns.molecularWeight,
        sequenceLength: vaccineDesigns.sequenceLength,
        epitopes: vaccineDesigns.epitopes,
        hlaAnalysis: vaccineDesigns.hlaAnalysis,
        safetyAssessment: vaccineDesigns.safetyAssessment,
        populationBreakdown: vaccineDesigns.populationBreakdown,
        createdAt: vaccineDesigns.createdAt,
        updatedAt: vaccineDesigns.updatedAt
      })
      .from(vaccineDesigns)
      .innerJoin(projectShares, eq(projectShares.designId, vaccineDesigns.id))
      .where(
        or(
          eq(projectShares.sharedWithUserId, userId),
          eq(projectShares.teamId, 
            db.select({ teamId: teamMembers.teamId })
              .from(teamMembers)
              .where(eq(teamMembers.userId, userId))
          )
        )
      );
    return sharedDesigns;
  }

  // Teams
  async createTeam(team: InsertTeam): Promise<Team> {
    const [newTeam] = await db
      .insert(teams)
      .values(team)
      .returning();
    return newTeam;
  }

  async getTeam(id: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team || undefined;
  }

  async getUserTeams(userId: number): Promise<Team[]> {
    const userTeams = await db
      .select({
        id: teams.id,
        name: teams.name,
        description: teams.description,
        createdBy: teams.createdBy,
        createdAt: teams.createdAt,
        updatedAt: teams.updatedAt
      })
      .from(teams)
      .innerJoin(teamMembers, eq(teamMembers.teamId, teams.id))
      .where(eq(teamMembers.userId, userId));
    return userTeams;
  }

  async addTeamMember(teamMember: InsertTeamMember): Promise<TeamMember> {
    const [member] = await db
      .insert(teamMembers)
      .values(teamMember)
      .returning();
    return member;
  }

  async getTeamMembers(teamId: number): Promise<TeamMember[]> {
    return await db.select().from(teamMembers).where(eq(teamMembers.teamId, teamId));
  }

  async removeTeamMember(teamId: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(teamMembers)
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
    return (result.rowCount || 0) > 0;
  }

  // Sharing
  async shareDesign(share: InsertProjectShare): Promise<ProjectShare> {
    const [newShare] = await db
      .insert(projectShares)
      .values(share)
      .returning();
    return newShare;
  }

  async getDesignShares(designId: number): Promise<ProjectShare[]> {
    return await db.select().from(projectShares).where(eq(projectShares.designId, designId));
  }

  async removeShare(shareId: number): Promise<boolean> {
    const result = await db
      .delete(projectShares)
      .where(eq(projectShares.id, shareId));
    return (result.rowCount || 0) > 0;
  }

  // Comments
  async addComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db
      .insert(comments)
      .values(comment)
      .returning();
    return newComment;
  }

  async getDesignComments(designId: number): Promise<Comment[]> {
    return await db.select().from(comments).where(eq(comments.designId, designId));
  }

  async deleteComment(commentId: number): Promise<boolean> {
    const result = await db
      .delete(comments)
      .where(eq(comments.id, commentId));
    return (result.rowCount || 0) > 0;
  }

  // Versions
  async createDesignVersion(version: InsertDesignVersion): Promise<DesignVersion> {
    const [newVersion] = await db
      .insert(designVersions)
      .values(version)
      .returning();
    return newVersion;
  }

  async getDesignVersions(designId: number): Promise<DesignVersion[]> {
    return await db.select().from(designVersions).where(eq(designVersions.designId, designId));
  }
}

export const storage = new DatabaseStorage();
