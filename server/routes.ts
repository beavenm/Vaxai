import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertVaccineDesignSchema, insertTeamSchema, insertTeamMemberSchema, 
  insertProjectShareSchema, insertCommentSchema, insertDesignVersionSchema 
} from "@shared/schema";
import multer from "multer";
import { z } from "zod";

interface MulterRequest extends Request {
  file?: any;
}

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Create vaccine design
  app.post("/api/vaccine-designs", upload.single('file'), async (req: MulterRequest, res) => {
    try {
      let inputData = req.body;
      
      // Handle file upload
      if (req.file) {
        const fileContent = req.file.buffer.toString('utf-8');
        inputData.inputSequence = fileContent;
        inputData.name = inputData.name || req.file.originalname;
      }
      
      const validatedData = insertVaccineDesignSchema.parse(inputData);
      const design = await storage.createVaccineDesign(validatedData);
      
      // Start processing simulation
      processVaccineDesign(design.id);
      
      res.json(design);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof z.ZodError ? error.errors : "Invalid input data" 
      });
    }
  });

  // Get vaccine design
  app.get("/api/vaccine-designs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const design = await storage.getVaccineDesign(id);
      
      if (!design) {
        return res.status(404).json({ message: "Vaccine design not found" });
      }
      
      res.json(design);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all vaccine designs
  app.get("/api/vaccine-designs", async (req, res) => {
    try {
      const designs = await storage.getUserVaccineDesigns();
      res.json(designs);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Team Management Routes
  app.post("/api/teams", async (req, res) => {
    try {
      const validatedData = insertTeamSchema.parse(req.body);
      const team = await storage.createTeam(validatedData);
      
      // Add creator as owner
      await storage.addTeamMember({
        teamId: team.id,
        userId: team.createdBy!,
        role: "owner"
      });
      
      res.json(team);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof z.ZodError ? error.errors : "Invalid input data" 
      });
    }
  });

  app.get("/api/teams/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const teams = await storage.getUserTeams(userId);
      res.json(teams);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/teams/:id/members", async (req, res) => {
    try {
      const teamId = parseInt(req.params.id);
      const members = await storage.getTeamMembers(teamId);
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/teams/:id/members", async (req, res) => {
    try {
      const teamId = parseInt(req.params.id);
      const validatedData = insertTeamMemberSchema.parse({
        ...req.body,
        teamId
      });
      const member = await storage.addTeamMember(validatedData);
      res.json(member);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof z.ZodError ? error.errors : "Invalid input data" 
      });
    }
  });

  app.delete("/api/teams/:teamId/members/:userId", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const userId = parseInt(req.params.userId);
      const success = await storage.removeTeamMember(teamId, userId);
      
      if (success) {
        res.json({ message: "Member removed successfully" });
      } else {
        res.status(404).json({ message: "Member not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Project Sharing Routes
  app.post("/api/designs/:id/share", async (req, res) => {
    try {
      const designId = parseInt(req.params.id);
      const validatedData = insertProjectShareSchema.parse({
        ...req.body,
        designId
      });
      const share = await storage.shareDesign(validatedData);
      res.json(share);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof z.ZodError ? error.errors : "Invalid input data" 
      });
    }
  });

  app.get("/api/designs/:id/shares", async (req, res) => {
    try {
      const designId = parseInt(req.params.id);
      const shares = await storage.getDesignShares(designId);
      res.json(shares);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/shares/:id", async (req, res) => {
    try {
      const shareId = parseInt(req.params.id);
      const success = await storage.removeShare(shareId);
      
      if (success) {
        res.json({ message: "Share removed successfully" });
      } else {
        res.status(404).json({ message: "Share not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/users/:userId/shared-designs", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const designs = await storage.getSharedDesigns(userId);
      res.json(designs);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Comments Routes
  app.post("/api/designs/:id/comments", async (req, res) => {
    try {
      const designId = parseInt(req.params.id);
      const validatedData = insertCommentSchema.parse({
        ...req.body,
        designId
      });
      const comment = await storage.addComment(validatedData);
      res.json(comment);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof z.ZodError ? error.errors : "Invalid input data" 
      });
    }
  });

  app.get("/api/designs/:id/comments", async (req, res) => {
    try {
      const designId = parseInt(req.params.id);
      const comments = await storage.getDesignComments(designId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/comments/:id", async (req, res) => {
    try {
      const commentId = parseInt(req.params.id);
      const success = await storage.deleteComment(commentId);
      
      if (success) {
        res.json({ message: "Comment deleted successfully" });
      } else {
        res.status(404).json({ message: "Comment not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Design Versions Routes
  app.post("/api/designs/:id/versions", async (req, res) => {
    try {
      const designId = parseInt(req.params.id);
      const validatedData = insertDesignVersionSchema.parse({
        ...req.body,
        designId
      });
      const version = await storage.createDesignVersion(validatedData);
      res.json(version);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof z.ZodError ? error.errors : "Invalid input data" 
      });
    }
  });

  app.get("/api/designs/:id/versions", async (req, res) => {
    try {
      const designId = parseInt(req.params.id);
      const versions = await storage.getDesignVersions(designId);
      res.json(versions);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Simulate vaccine processing
async function processVaccineDesign(designId: number) {
  const steps = [
    { progress: 20, field: 'status', value: 'analyzing' },
    { progress: 40, field: 'status', value: 'predicting_epitopes' },
    { progress: 60, field: 'status', value: 'hla_binding' },
    { progress: 80, field: 'status', value: 'constructing' },
    { progress: 100, field: 'status', value: 'completed' }
  ];

  for (const step of steps) {
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    const updates: any = { progress: step.progress };
    
    if (step.progress === 100) {
      // Generate mock results
      updates.status = 'completed';
      updates.optimizedSequence = generateMockSequence();
      updates.antigenicityScore = 0.942;
      updates.populationCoverage = 0.875;
      updates.safetyScore = 0.987;
      updates.epitopeCount = 23;
      updates.molecularWeight = 37.8;
      updates.sequenceLength = 342;
      updates.epitopes = generateMockEpitopes();
      updates.hlaAnalysis = generateMockHLAAnalysis();
      updates.safetyAssessment = generateMockSafetyAssessment();
      updates.populationBreakdown = generateMockPopulationBreakdown();
    }
    
    await storage.updateVaccineDesign(designId, updates);
  }
}

function generateMockSequence(): string {
  return "MKFLVNVALVFMVVYISYIYAAYPGDVPDYAGMETMETTMETTKRIPAATKKAGQAKKKKELYLQENQRFMETMETTMETTKRIPEYLPYVLQNQRVVQNQRWLQENQRFMETMETTMETTKKAGQAKKKKELMETMETTMETTLYPYVLQNQRFVVQNQRWLQENQRFKKKAGQAKKKKELMETMETTMETTLYPYVLQNQRFVVQNQRWLQENQRFKKKAGQAKKKKELMETMETTMETTLYPYVLQNQRFVVQNQRWLQENQRFKKKAGQAKKKKEL";
}

function generateMockEpitopes() {
  return [
    {
      sequence: "YLQENQRF",
      type: "CTL",
      hlaAlleles: ["HLA-A*02:01", "HLA-A*24:02"],
      ic50: 12.5,
      score: 0.96
    },
    {
      sequence: "VVQNQRWLQENQRF",
      type: "HTL",
      hlaAlleles: ["HLA-DRB1*07:01", "HLA-DRB1*15:01"],
      ic50: 8.3,
      score: 0.94
    },
    {
      sequence: "AGQAKKKKEL",
      type: "B-cell",
      hlaAlleles: ["Linear epitope"],
      ic50: null,
      score: 0.92
    }
  ];
}

function generateMockHLAAnalysis() {
  return {
    classI: { coverage: 0.89, alleles: 43 },
    classII: { coverage: 0.86, alleles: 38 }
  };
}

function generateMockSafetyAssessment() {
  return {
    allergenicity: "Low Risk",
    toxicity: "Non-toxic",
    autoimmunity: "Low Risk",
    stability: "Stable"
  };
}

function generateMockPopulationBreakdown() {
  return {
    "North America": 0.921,
    "Europe": 0.897,
    "Asia": 0.843,
    "Africa": 0.819
  };
}
