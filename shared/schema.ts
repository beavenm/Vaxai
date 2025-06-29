import { pgTable, text, serial, integer, boolean, jsonb, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  fullName: text("full_name"),
  role: text("role").default("researcher"), // 'admin', 'researcher', 'viewer'
  createdAt: timestamp("created_at").defaultNow(),
});

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").references(() => teams.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  role: text("role").notNull().default("member"), // 'owner', 'admin', 'member', 'viewer'
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const projectShares = pgTable("project_shares", {
  id: serial("id").primaryKey(),
  designId: integer("design_id").references(() => vaccineDesigns.id).notNull(),
  teamId: integer("team_id").references(() => teams.id),
  sharedWithUserId: integer("shared_with_user_id").references(() => users.id),
  permission: text("permission").notNull().default("view"), // 'view', 'edit', 'admin'
  sharedBy: integer("shared_by").references(() => users.id).notNull(),
  sharedAt: timestamp("shared_at").defaultNow(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  designId: integer("design_id").references(() => vaccineDesigns.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const designVersions = pgTable("design_versions", {
  id: serial("id").primaryKey(),
  designId: integer("design_id").references(() => vaccineDesigns.id).notNull(),
  version: integer("version").notNull(),
  changes: jsonb("changes").notNull(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  description: text("description"),
});

export const vaccineDesigns = pgTable("vaccine_designs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  name: text("name").notNull(),
  inputSequence: text("input_sequence").notNull(),
  sequenceType: text("sequence_type").notNull(), // 'protein' | 'dna' | 'rna'
  targetPopulation: text("target_population").default("Global Population"),
  vaccineType: text("vaccine_type").default("Multi-epitope"),
  status: text("status").notNull().default("processing"), // 'processing' | 'completed' | 'failed'
  progress: integer("progress").default(0),
  
  // Results
  optimizedSequence: text("optimized_sequence"),
  antigenicityScore: real("antigenicity_score"),
  populationCoverage: real("population_coverage"),
  safetyScore: real("safety_score"),
  epitopeCount: integer("epitope_count"),
  molecularWeight: real("molecular_weight"),
  sequenceLength: integer("sequence_length"),
  
  // Detailed results as JSON
  epitopes: jsonb("epitopes"),
  hlaAnalysis: jsonb("hla_analysis"),
  safetyAssessment: jsonb("safety_assessment"),
  populationBreakdown: jsonb("population_breakdown"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = {
  teams: {
    many: true,
    table: teamMembers,
    foreignKey: 'userId',
  },
  createdTeams: {
    many: true,
    table: teams,
    foreignKey: 'createdBy',
  },
  comments: {
    many: true,
    table: comments,
    foreignKey: 'userId',
  },
};

export const teamsRelations = {
  members: {
    many: true,
    table: teamMembers,
    foreignKey: 'teamId',
  },
  creator: {
    one: true,
    table: users,
    foreignKey: 'createdBy',
  },
};

export const vaccineDesignsRelations = {
  comments: {
    many: true,
    table: comments,
    foreignKey: 'designId',
  },
  shares: {
    many: true,
    table: projectShares,
    foreignKey: 'designId',
  },
  versions: {
    many: true,
    table: designVersions,
    foreignKey: 'designId',
  },
};

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertProjectShareSchema = createInsertSchema(projectShares).omit({
  id: true,
  sharedAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDesignVersionSchema = createInsertSchema(designVersions).omit({
  id: true,
  createdAt: true,
});

export const insertVaccineDesignSchema = createInsertSchema(vaccineDesigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  inputSequence: z.string().min(10, "Sequence must be at least 10 characters"),
  name: z.string().min(1, "Name is required"),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;
export type ProjectShare = typeof projectShares.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type DesignVersion = typeof designVersions.$inferSelect;
export type VaccineDesign = typeof vaccineDesigns.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type InsertProjectShare = z.infer<typeof insertProjectShareSchema>;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type InsertDesignVersion = z.infer<typeof insertDesignVersionSchema>;
export type InsertVaccineDesign = z.infer<typeof insertVaccineDesignSchema>;
