import { users, vaccineDesigns, type User, type InsertUser, type VaccineDesign, type InsertVaccineDesign } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createVaccineDesign(design: InsertVaccineDesign): Promise<VaccineDesign>;
  getVaccineDesign(id: number): Promise<VaccineDesign | undefined>;
  updateVaccineDesign(id: number, updates: Partial<VaccineDesign>): Promise<VaccineDesign | undefined>;
  getUserVaccineDesigns(userId?: number): Promise<VaccineDesign[]>;
}

export class DatabaseStorage implements IStorage {
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
}

export const storage = new DatabaseStorage();
