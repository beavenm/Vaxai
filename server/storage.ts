import { users, vaccineDesigns, type User, type InsertUser, type VaccineDesign, type InsertVaccineDesign } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createVaccineDesign(design: InsertVaccineDesign): Promise<VaccineDesign>;
  getVaccineDesign(id: number): Promise<VaccineDesign | undefined>;
  updateVaccineDesign(id: number, updates: Partial<VaccineDesign>): Promise<VaccineDesign | undefined>;
  getUserVaccineDesigns(userId?: number): Promise<VaccineDesign[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private vaccineDesigns: Map<number, VaccineDesign>;
  private currentUserId: number;
  private currentDesignId: number;

  constructor() {
    this.users = new Map();
    this.vaccineDesigns = new Map();
    this.currentUserId = 1;
    this.currentDesignId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createVaccineDesign(insertDesign: InsertVaccineDesign): Promise<VaccineDesign> {
    const id = this.currentDesignId++;
    const design: VaccineDesign = {
      id,
      userId: insertDesign.userId || null,
      name: insertDesign.name,
      inputSequence: insertDesign.inputSequence,
      sequenceType: insertDesign.sequenceType,
      targetPopulation: insertDesign.targetPopulation || null,
      vaccineType: insertDesign.vaccineType || null,
      status: "processing",
      progress: 0,
      optimizedSequence: null,
      antigenicityScore: null,
      populationCoverage: null,
      safetyScore: null,
      epitopeCount: null,
      molecularWeight: null,
      sequenceLength: null,
      epitopes: null,
      hlaAnalysis: null,
      safetyAssessment: null,
      populationBreakdown: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.vaccineDesigns.set(id, design);
    return design;
  }

  async getVaccineDesign(id: number): Promise<VaccineDesign | undefined> {
    return this.vaccineDesigns.get(id);
  }

  async updateVaccineDesign(id: number, updates: Partial<VaccineDesign>): Promise<VaccineDesign | undefined> {
    const existing = this.vaccineDesigns.get(id);
    if (!existing) return undefined;
    
    const updated: VaccineDesign = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.vaccineDesigns.set(id, updated);
    return updated;
  }

  async getUserVaccineDesigns(userId?: number): Promise<VaccineDesign[]> {
    return Array.from(this.vaccineDesigns.values()).filter(
      design => !userId || design.userId === userId
    );
  }
}

export const storage = new MemStorage();
