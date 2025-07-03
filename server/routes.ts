import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertVaccineDesignSchema, insertTeamSchema, insertTeamMemberSchema, 
  insertProjectShareSchema, insertCommentSchema, insertDesignVersionSchema 
} from "@shared/schema";
import multer from "multer";
import { z } from "zod";
import { epitopePredictor } from './ml/epitopePredictor.js';
import { safetyAssessmentEngine } from './ml/safetyAssessment.js';
import { populationCoverageAnalyzer } from './ml/populationCoverage.js';
import { codonOptimizer } from './ml/codonOptimization.js';

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
  try {
    console.log(`Starting advanced ML processing for design ${designId}`);
    
    // Get design data
    const design = await storage.getVaccineDesign(designId);
    if (!design || !design.inputSequence) {
      throw new Error('Design or sequence not found');
    }

    const sequence = design.inputSequence;
    
    // Advanced processing steps with real ML algorithms
    const steps = [
      { progress: 10, name: 'Validating sequence and initializing models', duration: 2000 },
      { progress: 25, name: 'Running CNN-LSTM B-cell epitope prediction', duration: 4000 },
      { progress: 40, name: 'Executing Transformer T-cell epitope analysis', duration: 5000 },
      { progress: 55, name: 'Performing neural network HLA binding prediction', duration: 4500 },
      { progress: 70, name: 'Conducting comprehensive safety assessment', duration: 3500 },
      { progress: 85, name: 'Analyzing global population coverage', duration: 3000 },
      { progress: 95, name: 'Optimizing codon usage with CAI analysis', duration: 4000 },
      { progress: 100, name: 'Finalizing results', duration: 2000 }
    ];

    let stepResults: any = {};

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      console.log(`Processing step: ${step.name}`);
      
      // Update progress in database
      await storage.updateVaccineDesign(designId, {
        status: 'processing',
        progress: step.progress,
        processingStep: step.name
      });

      // Execute real ML algorithms at each step
      if (step.progress === 25) {
        // B-cell epitope prediction using CNN-LSTM
        stepResults.bCellEpitopes = await epitopePredictor.predictBCellEpitopes(sequence, 15);
      } else if (step.progress === 40) {
        // T-cell epitope prediction with HLA binding
        const commonHLAAlleles = ['HLA-A*02:01', 'HLA-A*01:01', 'HLA-A*03:01', 'HLA-A*24:02', 
                                 'HLA-B*07:02', 'HLA-B*08:01', 'HLA-B*44:02', 'HLA-B*40:01'];
        stepResults.tCellEpitopes = await epitopePredictor.predictTCellEpitopes(sequence, commonHLAAlleles);
        stepResults.hlaAlleles = commonHLAAlleles;
      } else if (step.progress === 55) {
        // HLA binding analysis
        const allEpitopes = [...(stepResults.bCellEpitopes || []), ...(stepResults.tCellEpitopes || [])];
        stepResults.hlaBindingResults = await Promise.all(
          allEpitopes.slice(0, 20).map(epitope => 
            epitopePredictor.predictHLABinding(epitope.sequence, stepResults.hlaAlleles)
          )
        );
      } else if (step.progress === 70) {
        // Safety assessment using real algorithms
        stepResults.safetyAssessment = await safetyAssessmentEngine.assessSafety(sequence);
      } else if (step.progress === 85) {
        // Population coverage analysis
        const epitopeSequences = [...(stepResults.bCellEpitopes || []), ...(stepResults.tCellEpitopes || [])].map(e => e.sequence);
        stepResults.populationCoverage = populationCoverageAnalyzer.calculateCoverage(
          epitopeSequences, 
          stepResults.hlaAlleles
        );
      } else if (step.progress === 95) {
        // Codon optimization
        stepResults.codonOptimization = codonOptimizer.optimizeForHuman(sequence, {
          targetGC: 0.45,
          avoidSecondaryStructure: true
        });
      }

      await new Promise(resolve => setTimeout(resolve, step.duration));
    }

    // Calculate overall score based on real metrics
    const overallScore = calculateOverallScore(
      stepResults.bCellEpitopes || [],
      stepResults.tCellEpitopes || [],
      stepResults.safetyAssessment,
      stepResults.populationCoverage,
      stepResults.codonOptimization
    );

    const results = {
      optimizedSequence: stepResults.codonOptimization?.optimizedSequence || sequence,
      originalSequence: sequence,
      epitopes: {
        bCell: stepResults.bCellEpitopes || [],
        tCell: stepResults.tCellEpitopes || [],
        totalCount: (stepResults.bCellEpitopes?.length || 0) + (stepResults.tCellEpitopes?.length || 0)
      },
      hlaAnalysis: {
        bindings: stepResults.hlaBindingResults?.flat() || [],
        coverage: stepResults.populationCoverage?.hlaAnalysis || {},
        recommendations: stepResults.populationCoverage?.hlaAnalysis?.ethnicSpecificRecommendations || []
      },
      safetyAssessment: stepResults.safetyAssessment,
      populationCoverage: stepResults.populationCoverage,
      codonOptimization: stepResults.codonOptimization,
      overallScore,
      mlMetrics: {
        cai: stepResults.codonOptimization?.cai || 0,
        gcContent: stepResults.codonOptimization?.gc_content || 0,
        safetyScore: stepResults.safetyAssessment?.overallSafety || 0,
        coverageScore: stepResults.populationCoverage?.totalCoverage || 0
      },
      recommendations: generateIntelligentRecommendations(
        stepResults.safetyAssessment,
        stepResults.populationCoverage,
        stepResults.codonOptimization,
        stepResults.bCellEpitopes || [],
        stepResults.tCellEpitopes || []
      )
    };

    // Mark as completed with all the computed values
    await storage.updateVaccineDesign(designId, {
      status: 'completed',
      progress: 100,
      processingStep: 'Complete',
      results: JSON.stringify(results),
      optimizedSequence: results.optimizedSequence,
      antigenicityScore: Math.min(1, overallScore / 100),
      populationCoverage: stepResults.populationCoverage?.totalCoverage || 0,
      safetyScore: stepResults.safetyAssessment?.overallSafety || 0,
      epitopeCount: results.epitopes.totalCount,
      molecularWeight: calculateMolecularWeight(sequence),
      sequenceLength: sequence.length,
      epitopes: JSON.stringify(results.epitopes),
      hlaAnalysis: JSON.stringify(results.hlaAnalysis),
      safetyAssessment: JSON.stringify(results.safetyAssessment),
      populationBreakdown: JSON.stringify(results.populationCoverage)
    });

    console.log(`Completed advanced ML processing for design ${designId} with score: ${overallScore}`);
  } catch (error) {
    console.error(`Error processing design ${designId}:`, error);
    await storage.updateVaccineDesign(designId, {
      status: 'failed',
      progress: 0,
      processingStep: `Error: ${error.message}`
    });
  }
}

function calculateOverallScore(bCellEpitopes: any[], tCellEpitopes: any[], safety: any, coverage: any, codon: any): number {
  let score = 0;
  
  // Epitope quality (30%)
  const epitopeScore = Math.min(100, (bCellEpitopes.length + tCellEpitopes.length) * 2);
  score += epitopeScore * 0.3;
  
  // Safety assessment (25%)
  const safetyScore = (safety?.overallSafety || 0) * 100;
  score += safetyScore * 0.25;
  
  // Population coverage (25%)
  const coverageScore = (coverage?.totalCoverage || 0) * 100;
  score += coverageScore * 0.25;
  
  // Codon optimization (20%)
  const codonScore = ((codon?.cai || 0) * 0.6 + (1 - Math.abs((codon?.gc_content || 0.45) - 0.45) * 2) * 0.4) * 100;
  score += codonScore * 0.2;
  
  return Math.round(Math.min(100, Math.max(0, score)));
}

function generateIntelligentRecommendations(safety: any, coverage: any, codon: any, bCell: any[], tCell: any[]): string[] {
  const recommendations: string[] = [];
  
  // Safety recommendations
  if (!safety || safety.overallSafety < 0.7) {
    recommendations.push('Safety assessment indicates potential concerns - review allergenicity and toxicity analysis');
  } else {
    recommendations.push('Excellent safety profile confirmed through comprehensive ML analysis');
  }
  
  // Coverage recommendations  
  if (coverage?.totalCoverage > 0.8) {
    recommendations.push('Outstanding global population coverage achieved (>80%)');
  } else if (coverage?.totalCoverage > 0.6) {
    recommendations.push('Good population coverage achieved - consider additional HLA alleles for optimization');
  } else {
    recommendations.push('Limited population coverage detected - HLA expansion strongly recommended');
  }
  
  // Epitope recommendations
  if (bCell.length < 5) {
    recommendations.push('Consider targeting additional B-cell epitopes for enhanced humoral immunity');
  }
  
  if (tCell.length < 10) {
    recommendations.push('Increase T-cell epitope count to strengthen cellular immune response');
  }
  
  // Codon optimization recommendations
  if (codon && codon.cai < 0.7) {
    recommendations.push('Codon Adaptation Index below optimal - further optimization recommended');
  }
  
  // Expression system recommendations
  if (codon?.expressionPrediction?.level === 'Low') {
    recommendations.push('Low expression prediction - consider alternative expression systems or further optimization');
  }
  
  return recommendations;
}

function calculateMolecularWeight(sequence: string): number {
  const weights: { [aa: string]: number } = {
    A: 89.1, C: 121.0, D: 133.1, E: 147.1, F: 165.2, G: 75.1, H: 155.2, I: 131.2, K: 146.2, L: 131.2,
    M: 149.2, N: 132.1, P: 115.1, Q: 146.2, R: 174.2, S: 105.1, T: 119.1, V: 117.1, W: 204.2, Y: 181.2
  };
  
  let totalWeight = 0;
  for (const aa of sequence) {
    totalWeight += weights[aa] || 0;
  }
  
  return Math.round(totalWeight / 1000 * 100) / 100; // Convert to kDa and round
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
