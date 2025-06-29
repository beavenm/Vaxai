import { pgTable, text, serial, integer, boolean, jsonb, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
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

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertVaccineDesignSchema = createInsertSchema(vaccineDesigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  inputSequence: z.string().min(10, "Sequence must be at least 10 characters"),
  name: z.string().min(1, "Name is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type VaccineDesign = typeof vaccineDesigns.$inferSelect;
export type InsertVaccineDesign = z.infer<typeof insertVaccineDesignSchema>;
