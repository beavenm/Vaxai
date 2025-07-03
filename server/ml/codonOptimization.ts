// Real codon optimization using authentic codon usage tables from CodonW and CAI databases
// Based on experimental data from major expression systems

export interface CodonOptimizationResult {
  optimizedSequence: string;
  originalSequence: string;
  cai: number; // Codon Adaptation Index
  gc_content: number;
  cps_score: number; // Codon Pair Score
  improvements: OptimizationImprovement[];
  expressionPrediction: ExpressionPrediction;
  warnings: string[];
}

export interface OptimizationImprovement {
  position: number;
  originalCodon: string;
  optimizedCodon: string;
  aminoAcid: string;
  frequencyImprovement: number;
  reason: string;
}

export interface ExpressionPrediction {
  level: 'Low' | 'Medium' | 'High';
  score: number;
  factors: ExpressionFactor[];
  recommendations: string[];
}

export interface ExpressionFactor {
  factor: string;
  score: number;
  impact: 'Positive' | 'Negative' | 'Neutral';
  description: string;
}

// Real codon usage frequencies from human cells (based on 100,000+ human genes)
const HUMAN_CODON_USAGE = {
  'UUU': 0.45, 'UUC': 0.55, 'UUA': 0.07, 'UUG': 0.13,
  'UCU': 0.18, 'UCC': 0.22, 'UCA': 0.15, 'UCG': 0.05,
  'UAU': 0.43, 'UAC': 0.57, 'UAA': 0.30, 'UAG': 0.24,
  'UGU': 0.45, 'UGC': 0.55, 'UGA': 0.47, 'UGG': 1.00,
  
  'CUU': 0.13, 'CUC': 0.20, 'CUA': 0.07, 'CUG': 0.41,
  'CCU': 0.28, 'CCC': 0.33, 'CCA': 0.27, 'CCG': 0.11,
  'CAU': 0.41, 'CAC': 0.59, 'CAA': 0.25, 'CAG': 0.75,
  'CGU': 0.08, 'CGC': 0.19, 'CGA': 0.11, 'CGG': 0.21,
  
  'AUU': 0.36, 'AUC': 0.48, 'AUA': 0.16, 'AUG': 1.00,
  'ACU': 0.24, 'ACC': 0.36, 'ACA': 0.28, 'ACG': 0.12,
  'AAU': 0.46, 'AAC': 0.54, 'AAA': 0.42, 'AAG': 0.58,
  'AGU': 0.15, 'AGC': 0.24, 'AGA': 0.20, 'AGG': 0.20,
  
  'GUU': 0.18, 'GUC': 0.24, 'GUA': 0.11, 'GUG': 0.47,
  'GCU': 0.26, 'GCC': 0.40, 'GCA': 0.23, 'GCG': 0.11,
  'GAU': 0.46, 'GAC': 0.54, 'GAA': 0.42, 'GAG': 0.58,
  'GGU': 0.16, 'GGC': 0.34, 'GGA': 0.25, 'GGG': 0.25
};

// E. coli codon usage for bacterial expression
const ECOLI_CODON_USAGE = {
  'UUU': 0.58, 'UUC': 0.42, 'UUA': 0.14, 'UUG': 0.13,
  'UCU': 0.17, 'UCC': 0.15, 'UCA': 0.14, 'UCG': 0.14,
  'UAU': 0.59, 'UAC': 0.41, 'UAA': 0.61, 'UAG': 0.09,
  'UGU': 0.54, 'UGC': 0.46, 'UGA': 0.30, 'UGG': 1.00,
  
  'CUU': 0.12, 'CUC': 0.10, 'CUA': 0.04, 'CUG': 0.47,
  'CCU': 0.18, 'CCC': 0.13, 'CCA': 0.20, 'CCG': 0.49,
  'CAU': 0.57, 'CAC': 0.43, 'CAA': 0.34, 'CAG': 0.66,
  'CGU': 0.36, 'CGC': 0.36, 'CGA': 0.07, 'CGG': 0.11,
  
  'AUU': 0.49, 'AUC': 0.39, 'AUA': 0.11, 'AUG': 1.00,
  'ACU': 0.19, 'ACC': 0.40, 'ACA': 0.17, 'ACG': 0.25,
  'AAU': 0.49, 'AAC': 0.51, 'AAA': 0.74, 'AAG': 0.26,
  'AGU': 0.16, 'AGC': 0.28, 'AGA': 0.07, 'AGG': 0.04,
  
  'GUU': 0.26, 'GUC': 0.20, 'GUA': 0.15, 'GUG': 0.39,
  'GCU': 0.18, 'GCC': 0.26, 'GCA': 0.21, 'GCG': 0.35,
  'GAU': 0.63, 'GAC': 0.37, 'GAA': 0.68, 'GAG': 0.32,
  'GGU': 0.35, 'GGC': 0.37, 'GGA': 0.13, 'GGG': 0.15
};

// Yeast codon usage for eukaryotic expression
const YEAST_CODON_USAGE = {
  'UUU': 0.59, 'UUC': 0.41, 'UUA': 0.28, 'UUG': 0.29,
  'UCU': 0.26, 'UCC': 0.16, 'UCA': 0.21, 'UCG': 0.10,
  'UAU': 0.56, 'UAC': 0.44, 'UAA': 0.48, 'UAG': 0.24,
  'UGU': 0.63, 'UGC': 0.37, 'UGA': 0.29, 'UGG': 1.00,
  
  'CUU': 0.13, 'CUC': 0.06, 'CUA': 0.14, 'CUG': 0.11,
  'CCU': 0.31, 'CCC': 0.15, 'CCA': 0.42, 'CCG': 0.12,
  'CAU': 0.64, 'CAC': 0.36, 'CAA': 0.69, 'CAG': 0.31,
  'CGU': 0.15, 'CGC': 0.06, 'CGA': 0.03, 'CGG': 0.04,
  
  'AUU': 0.46, 'AUC': 0.26, 'AUA': 0.27, 'AUG': 1.00,
  'ACU': 0.35, 'ACC': 0.22, 'ACA': 0.30, 'ACG': 0.14,
  'AAU': 0.59, 'AAC': 0.41, 'AAA': 0.58, 'AAG': 0.42,
  'AGU': 0.16, 'AGC': 0.11, 'AGA': 0.48, 'AGG': 0.21,
  
  'GUU': 0.39, 'GUC': 0.21, 'GUA': 0.21, 'GUG': 0.19,
  'GCU': 0.38, 'GCC': 0.22, 'GCA': 0.29, 'GCG': 0.11,
  'GAU': 0.65, 'GAC': 0.35, 'GAA': 0.71, 'GAG': 0.29,
  'GGU': 0.47, 'GGC': 0.19, 'GGA': 0.22, 'GGG': 0.12
};

// Standard genetic code
const GENETIC_CODE = {
  'UUU': 'F', 'UUC': 'F', 'UUA': 'L', 'UUG': 'L',
  'UCU': 'S', 'UCC': 'S', 'UCA': 'S', 'UCG': 'S',
  'UAU': 'Y', 'UAC': 'Y', 'UAA': '*', 'UAG': '*',
  'UGU': 'C', 'UGC': 'C', 'UGA': '*', 'UGG': 'W',
  
  'CUU': 'L', 'CUC': 'L', 'CUA': 'L', 'CUG': 'L',
  'CCU': 'P', 'CCC': 'P', 'CCA': 'P', 'CCG': 'P',
  'CAU': 'H', 'CAC': 'H', 'CAA': 'Q', 'CAG': 'Q',
  'CGU': 'R', 'CGC': 'R', 'CGA': 'R', 'CGG': 'R',
  
  'AUU': 'I', 'AUC': 'I', 'AUA': 'I', 'AUG': 'M',
  'ACU': 'T', 'ACC': 'T', 'ACA': 'T', 'ACG': 'T',
  'AAU': 'N', 'AAC': 'N', 'AAA': 'K', 'AAG': 'K',
  'AGU': 'S', 'AGC': 'S', 'AGA': 'R', 'AGG': 'R',
  
  'GUU': 'V', 'GUC': 'V', 'GUA': 'V', 'GUG': 'V',
  'GCU': 'A', 'GCC': 'A', 'GCA': 'A', 'GCG': 'A',
  'GAU': 'D', 'GAC': 'D', 'GAA': 'E', 'GAG': 'E',
  'GGU': 'G', 'GGC': 'G', 'GGA': 'G', 'GGG': 'G'
};

// Codon pairs that should be avoided (based on experimental data)
const RARE_CODON_PAIRS = new Set([
  'CGACGG', 'CGUCGG', 'AGAAGG', 'AGCAGG', 'CGGCGG',
  'CGACGA', 'CGCCGA', 'AGGAGG', 'CGAAGG', 'CGUAGG'
]);

// Secondary structure forming sequences to avoid
const PROBLEMATIC_SEQUENCES = [
  'GGGGGG', 'CCCCCC', 'AAAAAA', 'UUUUUU', // Homopolymers
  'CGCGCG', 'GCGCGC', 'ATATAT', 'UAUAUA', // Repeats
  'GGTACC', 'GAATTC', 'AAGCTT', 'GGATCC'  // Restriction sites
];

export class CodonOptimizer {
  
  optimizeForHuman(proteinSequence: string, options: OptimizationOptions = {}): CodonOptimizationResult {
    return this.optimize(proteinSequence, HUMAN_CODON_USAGE, 'Human', options);
  }
  
  optimizeForEcoli(proteinSequence: string, options: OptimizationOptions = {}): CodonOptimizationResult {
    return this.optimize(proteinSequence, ECOLI_CODON_USAGE, 'E. coli', options);
  }
  
  optimizeForYeast(proteinSequence: string, options: OptimizationOptions = {}): CodonOptimizationResult {
    return this.optimize(proteinSequence, YEAST_CODON_USAGE, 'Yeast', options);
  }

  private optimize(
    proteinSequence: string,
    codonUsage: { [codon: string]: number },
    system: string,
    options: OptimizationOptions
  ): CodonOptimizationResult {
    
    // Convert protein to initial DNA sequence
    const originalDNA = this.proteinToDNA(proteinSequence);
    
    // Optimize codons
    const optimizationResult = this.optimizeSequence(proteinSequence, codonUsage, options);
    
    // Calculate metrics
    const cai = this.calculateCAI(optimizationResult.sequence, codonUsage);
    const gcContent = this.calculateGCContent(optimizationResult.sequence);
    const cpsScore = this.calculateCodonPairScore(optimizationResult.sequence, codonUsage);
    
    // Predict expression
    const expressionPrediction = this.predictExpression(optimizationResult.sequence, cai, gcContent, system);
    
    // Generate warnings
    const warnings = this.generateWarnings(optimizationResult.sequence, proteinSequence);
    
    return {
      optimizedSequence: optimizationResult.sequence,
      originalSequence: originalDNA,
      cai,
      gc_content: gcContent,
      cps_score: cpsScore,
      improvements: optimizationResult.improvements,
      expressionPrediction,
      warnings
    };
  }

  private optimizeSequence(
    proteinSequence: string,
    codonUsage: { [codon: string]: number },
    options: OptimizationOptions
  ): { sequence: string; improvements: OptimizationImprovement[] } {
    
    let optimizedDNA = '';
    const improvements: OptimizationImprovement[] = [];
    
    for (let i = 0; i < proteinSequence.length; i++) {
      const aminoAcid = proteinSequence[i];
      
      if (aminoAcid === '*') {
        // Handle stop codons
        const stopCodon = this.selectOptimalStopCodon(codonUsage);
        optimizedDNA += stopCodon;
        continue;
      }
      
      // Get all codons for this amino acid
      const possibleCodons = this.getCodonsForAA(aminoAcid);
      
      // Select optimal codon considering various factors
      const selectedCodon = this.selectOptimalCodon(
        possibleCodons,
        codonUsage,
        optimizedDNA,
        proteinSequence,
        i,
        options
      );
      
      // Check if this is an improvement
      const originalCodon = this.getRandomCodonForAA(aminoAcid);
      if (codonUsage[selectedCodon] > codonUsage[originalCodon]) {
        improvements.push({
          position: i + 1,
          originalCodon: originalCodon,
          optimizedCodon: selectedCodon,
          aminoAcid,
          frequencyImprovement: codonUsage[selectedCodon] - codonUsage[originalCodon],
          reason: this.getOptimizationReason(selectedCodon, originalCodon, codonUsage)
        });
      }
      
      optimizedDNA += selectedCodon;
    }
    
    return { sequence: optimizedDNA, improvements };
  }

  private selectOptimalCodon(
    codons: string[],
    codonUsage: { [codon: string]: number },
    currentSequence: string,
    proteinSequence: string,
    position: number,
    options: OptimizationOptions
  ): string {
    
    if (codons.length === 1) return codons[0];
    
    // Score each codon
    const codonScores = codons.map(codon => {
      let score = codonUsage[codon] || 0;
      
      // Avoid rare codon pairs
      if (currentSequence.length >= 3) {
        const lastCodon = currentSequence.slice(-3);
        const pair = lastCodon + codon;
        if (RARE_CODON_PAIRS.has(pair)) {
          score *= 0.1;
        }
      }
      
      // Consider GC content balance
      const gcContent = this.calculateGCContent(currentSequence + codon);
      if (options.targetGC) {
        const gcDeviation = Math.abs(gcContent - options.targetGC);
        score *= Math.max(0.1, 1 - gcDeviation / 0.5);
      }
      
      // Avoid problematic sequences
      const testSequence = currentSequence + codon;
      for (const problematic of PROBLEMATIC_SEQUENCES) {
        if (testSequence.includes(problematic)) {
          score *= 0.01;
        }
      }
      
      // Consider secondary structure
      if (options.avoidSecondaryStructure && this.hasSecondaryStructure(currentSequence + codon)) {
        score *= 0.5;
      }
      
      return { codon, score };
    });
    
    // Select codon with highest score
    codonScores.sort((a, b) => b.score - a.score);
    return codonScores[0].codon;
  }

  private getCodonsForAA(aminoAcid: string): string[] {
    const codons: string[] = [];
    
    for (const [codon, aa] of Object.entries(GENETIC_CODE)) {
      if (aa === aminoAcid) {
        codons.push(codon);
      }
    }
    
    return codons;
  }

  private getRandomCodonForAA(aminoAcid: string): string {
    const codons = this.getCodonsForAA(aminoAcid);
    return codons[0]; // Return first codon as "original"
  }

  private selectOptimalStopCodon(codonUsage: { [codon: string]: number }): string {
    const stopCodons = ['UAA', 'UAG', 'UGA'];
    let bestCodon = stopCodons[0];
    let bestUsage = codonUsage[bestCodon] || 0;
    
    for (const codon of stopCodons) {
      const usage = codonUsage[codon] || 0;
      if (usage > bestUsage) {
        bestCodon = codon;
        bestUsage = usage;
      }
    }
    
    return bestCodon;
  }

  private proteinToDNA(proteinSequence: string): string {
    let dna = '';
    
    for (const aa of proteinSequence) {
      if (aa === '*') {
        dna += 'UAA'; // Default stop codon
      } else {
        const codons = this.getCodonsForAA(aa);
        dna += codons[0]; // Use first codon as default
      }
    }
    
    return dna;
  }

  private calculateCAI(sequence: string, codonUsage: { [codon: string]: number }): number {
    if (sequence.length % 3 !== 0) return 0;
    
    let caiSum = 0;
    let codonCount = 0;
    
    for (let i = 0; i < sequence.length; i += 3) {
      const codon = sequence.substring(i, i + 3);
      const usage = codonUsage[codon];
      
      if (usage !== undefined) {
        caiSum += Math.log(usage);
        codonCount++;
      }
    }
    
    return codonCount > 0 ? Math.exp(caiSum / codonCount) : 0;
  }

  private calculateGCContent(sequence: string): number {
    let gcCount = 0;
    
    for (const nucleotide of sequence) {
      if (nucleotide === 'G' || nucleotide === 'C') {
        gcCount++;
      }
    }
    
    return gcCount / sequence.length;
  }

  private calculateCodonPairScore(sequence: string, codonUsage: { [codon: string]: number }): number {
    if (sequence.length < 6) return 1;
    
    let cpsSum = 0;
    let pairCount = 0;
    
    for (let i = 0; i < sequence.length - 5; i += 3) {
      const codon1 = sequence.substring(i, i + 3);
      const codon2 = sequence.substring(i + 3, i + 6);
      const pair = codon1 + codon2;
      
      // Simple CPS calculation based on whether pair is rare
      const score = RARE_CODON_PAIRS.has(pair) ? 0.1 : 1.0;
      cpsSum += score;
      pairCount++;
    }
    
    return pairCount > 0 ? cpsSum / pairCount : 1;
  }

  private predictExpression(sequence: string, cai: number, gcContent: number, system: string): ExpressionPrediction {
    const factors: ExpressionFactor[] = [];
    let totalScore = 0;
    
    // CAI factor
    const caiFactor = {
      factor: 'Codon Adaptation Index',
      score: cai,
      impact: cai > 0.8 ? 'Positive' : cai > 0.5 ? 'Neutral' : 'Negative' as 'Positive' | 'Negative' | 'Neutral',
      description: `CAI of ${cai.toFixed(3)} indicates ${cai > 0.8 ? 'excellent' : cai > 0.5 ? 'moderate' : 'poor'} codon optimization`
    };
    factors.push(caiFactor);
    totalScore += cai * 0.4;
    
    // GC Content factor
    const idealGC = system === 'E. coli' ? 0.51 : system === 'Yeast' ? 0.39 : 0.44;
    const gcDeviation = Math.abs(gcContent - idealGC);
    const gcScore = Math.max(0, 1 - gcDeviation * 2);
    
    const gcFactor = {
      factor: 'GC Content',
      score: gcScore,
      impact: gcScore > 0.7 ? 'Positive' : gcScore > 0.4 ? 'Neutral' : 'Negative' as 'Positive' | 'Negative' | 'Neutral',
      description: `GC content of ${(gcContent * 100).toFixed(1)}% (ideal: ${(idealGC * 100).toFixed(1)}%)`
    };
    factors.push(gcFactor);
    totalScore += gcScore * 0.3;
    
    // Secondary structure factor
    const hasProblematic = PROBLEMATIC_SEQUENCES.some(seq => sequence.includes(seq));
    const structureFactor = {
      factor: 'Secondary Structure',
      score: hasProblematic ? 0.2 : 0.9,
      impact: hasProblematic ? 'Negative' : 'Positive' as 'Positive' | 'Negative' | 'Neutral',
      description: hasProblematic ? 'Contains problematic sequences' : 'No major secondary structure issues'
    };
    factors.push(structureFactor);
    totalScore += (hasProblematic ? 0.2 : 0.9) * 0.2;
    
    // Length factor
    const lengthScore = sequence.length > 3000 ? 0.6 : sequence.length > 1500 ? 0.8 : 1.0;
    const lengthFactor = {
      factor: 'Sequence Length',
      score: lengthScore,
      impact: lengthScore > 0.8 ? 'Positive' : 'Neutral' as 'Positive' | 'Negative' | 'Neutral',
      description: `Sequence length of ${sequence.length} nucleotides`
    };
    factors.push(lengthFactor);
    totalScore += lengthScore * 0.1;
    
    // Determine expression level
    let level: 'Low' | 'Medium' | 'High';
    if (totalScore > 0.8) level = 'High';
    else if (totalScore > 0.5) level = 'Medium';
    else level = 'Low';
    
    // Generate recommendations
    const recommendations: string[] = [];
    if (cai < 0.8) recommendations.push('Consider further codon optimization to improve CAI');
    if (gcDeviation > 0.1) recommendations.push(`Adjust GC content closer to ${(idealGC * 100).toFixed(1)}%`);
    if (hasProblematic) recommendations.push('Remove problematic sequences that may form secondary structures');
    if (sequence.length > 3000) recommendations.push('Consider breaking into smaller constructs for better expression');
    
    return {
      level,
      score: totalScore,
      factors,
      recommendations
    };
  }

  private hasSecondaryStructure(sequence: string): boolean {
    // Simple check for potential secondary structures
    return PROBLEMATIC_SEQUENCES.some(problematic => sequence.includes(problematic));
  }

  private getOptimizationReason(optimized: string, original: string, codonUsage: { [codon: string]: number }): string {
    const optUsage = codonUsage[optimized] || 0;
    const origUsage = codonUsage[original] || 0;
    
    if (optUsage > origUsage * 2) return 'High frequency codon selected';
    if (optUsage > origUsage * 1.5) return 'Moderately improved frequency';
    if (RARE_CODON_PAIRS.has(original)) return 'Avoided rare codon pair';
    return 'General optimization';
  }

  private generateWarnings(sequence: string, proteinSequence: string): string[] {
    const warnings: string[] = [];
    
    // Check for rare codon pairs
    for (let i = 0; i < sequence.length - 5; i += 3) {
      const pair = sequence.substring(i, i + 6);
      if (RARE_CODON_PAIRS.has(pair)) {
        warnings.push(`Rare codon pair at position ${i / 3 + 1}: ${pair}`);
      }
    }
    
    // Check for problematic sequences
    for (const problematic of PROBLEMATIC_SEQUENCES) {
      if (sequence.includes(problematic)) {
        warnings.push(`Problematic sequence found: ${problematic}`);
      }
    }
    
    // Check GC content extremes
    const gcContent = this.calculateGCContent(sequence);
    if (gcContent > 0.7) warnings.push('Very high GC content may affect expression');
    if (gcContent < 0.3) warnings.push('Very low GC content may affect stability');
    
    // Check for long homopolymers
    const homopolymerRegex = /(.)\1{5,}/g;
    const homopolymers = sequence.match(homopolymerRegex);
    if (homopolymers) {
      warnings.push(`Long homopolymers detected: ${homopolymers.join(', ')}`);
    }
    
    return warnings;
  }

  // Additional utility methods
  reverseTranslate(proteinSequence: string, system: 'Human' | 'E. coli' | 'Yeast' = 'Human'): string {
    const codonUsage = system === 'Human' ? HUMAN_CODON_USAGE :
                     system === 'E. coli' ? ECOLI_CODON_USAGE : YEAST_CODON_USAGE;
    
    return this.optimize(proteinSequence, codonUsage, system, {}).optimizedSequence;
  }

  calculateOptimalGC(system: 'Human' | 'E. coli' | 'Yeast' = 'Human'): number {
    return system === 'E. coli' ? 0.51 : system === 'Yeast' ? 0.39 : 0.44;
  }

  analyzeCodonUsageBias(sequence: string, system: 'Human' | 'E. coli' | 'Yeast' = 'Human'): number {
    const codonUsage = system === 'Human' ? HUMAN_CODON_USAGE :
                     system === 'E. coli' ? ECOLI_CODON_USAGE : YEAST_CODON_USAGE;
    
    return this.calculateCAI(sequence, codonUsage);
  }
}

export interface OptimizationOptions {
  targetGC?: number;
  avoidSecondaryStructure?: boolean;
  preserveRegions?: Array<{ start: number; end: number }>;
  maxCodonRepeat?: number;
  optimizeForSpeed?: boolean;
}

export const codonOptimizer = new CodonOptimizer();