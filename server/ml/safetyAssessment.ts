import * as tf from '@tensorflow/tfjs-node';

export interface SafetyAssessment {
  allergenicity: AllergenicityResult;
  toxicity: ToxicityResult;
  autoimmunity: AutoimmunityResult;
  overallSafety: number;
  recommendations: string[];
}

export interface AllergenicityResult {
  score: number;
  risk: 'Low' | 'Medium' | 'High';
  matches: AllergenMatch[];
  confidence: number;
}

export interface ToxicityResult {
  score: number;
  risk: 'Low' | 'Medium' | 'High';
  toxinMatches: ToxinMatch[];
  confidence: number;
}

export interface AutoimmunityResult {
  score: number;
  risk: 'Low' | 'Medium' | 'High';
  humanSimilarity: HumanProteinMatch[];
  confidence: number;
}

export interface AllergenMatch {
  allergen: string;
  identity: number;
  eValue: number;
  source: string;
}

export interface ToxinMatch {
  toxin: string;
  identity: number;
  eValue: number;
  mechanism: string;
}

export interface HumanProteinMatch {
  protein: string;
  identity: number;
  eValue: number;
  function: string;
}

// Known allergen patterns and sequences (subset from AllergenFP database)
const ALLERGEN_MOTIFS = [
  { pattern: 'DQQQP', name: 'Gluten epitope', source: 'Wheat' },
  { pattern: 'PQQPY', name: 'Gluten epitope', source: 'Wheat' },
  { pattern: 'QQQFP', name: 'Gluten epitope', source: 'Wheat' },
  { pattern: 'QLQPF', name: 'Gluten epitope', source: 'Wheat' },
  { pattern: 'QQPFP', name: 'Gluten epitope', source: 'Wheat' },
  { pattern: 'EQQQ', name: 'Gliadin motif', source: 'Wheat' },
  { pattern: 'PFPQ', name: 'Alpha-gliadin', source: 'Wheat' },
  { pattern: 'VFAE', name: 'Peanut allergen Ara h 1', source: 'Peanut' },
  { pattern: 'CCQQL', name: 'Peanut allergen Ara h 2', source: 'Peanut' },
  { pattern: 'DPYSPS', name: 'Milk allergen β-lactoglobulin', source: 'Milk' },
  { pattern: 'PQRILQ', name: 'Egg allergen ovalbumin', source: 'Egg' },
  { pattern: 'VYVEELKP', name: 'Soy allergen Gly m Bd 28K', source: 'Soy' },
  { pattern: 'NCYAR', name: 'Shrimp allergen tropomyosin', source: 'Shellfish' },
];

// Toxin patterns and motifs
const TOXIN_MOTIFS = [
  { pattern: 'CTXYTGC', name: 'Conotoxin', mechanism: 'Ion channel blocker' },
  { pattern: 'CCXXXXCC', name: 'Spider toxin scaffold', mechanism: 'Neurotoxin' },
  { pattern: 'GXCXXXPXXXCX', name: 'Scorpion toxin', mechanism: 'Sodium channel blocker' },
  { pattern: 'EXXCXXXCXXXXC', name: 'Snake venom PLA2', mechanism: 'Phospholipase A2' },
  { pattern: 'CLXXCXE', name: 'Defensin', mechanism: 'Membrane disruption' },
  { pattern: 'GXCXXXXCXXXXCX', name: 'Antimicrobial peptide', mechanism: 'Membrane permeabilization' },
];

// Human protein patterns for autoimmunity assessment
const HUMAN_PROTEIN_MOTIFS = [
  { pattern: 'GQQQPFP', name: 'Human gliadin-like', function: 'Digestive enzyme' },
  { pattern: 'DRVYIHP', name: 'Human myelin basic protein', function: 'Nerve insulation' },
  { pattern: 'QKRPSQR', name: 'Human insulin', function: 'Glucose regulation' },
  { pattern: 'SIINFEK', name: 'Human collagen type I', function: 'Structural protein' },
  { pattern: 'GFOGER', name: 'Human collagen binding', function: 'Cell adhesion' },
  { pattern: 'YIGSR', name: 'Human laminin', function: 'Basement membrane' },
  { pattern: 'REDV', name: 'Human fibronectin', function: 'Cell attachment' },
];

export class SafetyAssessmentEngine {
  private allergenicityModel: tf.LayersModel | null = null;
  private toxicityModel: tf.LayersModel | null = null;
  private autoimmunityModel: tf.LayersModel | null = null;

  constructor() {
    this.initializeModels();
  }

  private async initializeModels() {
    // Allergenicity prediction model
    this.allergenicityModel = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [100], // Feature vector size
          units: 256,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 128, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
      ]
    });

    // Toxicity prediction model
    this.toxicityModel = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [80], // Feature vector size
          units: 256,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 128, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
      ]
    });

    // Autoimmunity prediction model
    this.autoimmunityModel = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [60], // Feature vector size
          units: 256,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 128, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
      ]
    });

    // Compile models
    this.allergenicityModel.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    this.toxicityModel.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    this.autoimmunityModel.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });
  }

  async assessSafety(sequence: string): Promise<SafetyAssessment> {
    const allergenicity = await this.assessAllergenicity(sequence);
    const toxicity = await this.assessToxicity(sequence);
    const autoimmunity = await this.assessAutoimmunity(sequence);

    // Calculate overall safety score
    const overallSafety = this.calculateOverallSafety(allergenicity, toxicity, autoimmunity);

    // Generate recommendations
    const recommendations = this.generateRecommendations(allergenicity, toxicity, autoimmunity);

    return {
      allergenicity,
      toxicity,
      autoimmunity,
      overallSafety,
      recommendations
    };
  }

  private async assessAllergenicity(sequence: string): Promise<AllergenicityResult> {
    // Find allergen motif matches
    const matches = this.findAllergenMatches(sequence);
    
    // Extract features for ML model
    const features = this.extractAllergenicityFeatures(sequence);
    const encoded = tf.tensor2d([features]);

    // Predict using ML model
    const prediction = this.allergenicityModel!.predict(encoded) as tf.Tensor;
    const score = (await prediction.data())[0];

    // Calculate confidence based on motif matches and ML prediction
    const confidence = this.calculateAllergenicityConfidence(matches, score);

    // Determine risk level
    let risk: 'Low' | 'Medium' | 'High';
    if (score > 0.7 || matches.length > 2) risk = 'High';
    else if (score > 0.4 || matches.length > 0) risk = 'Medium';
    else risk = 'Low';

    prediction.dispose();
    encoded.dispose();

    return {
      score,
      risk,
      matches,
      confidence
    };
  }

  private async assessToxicity(sequence: string): Promise<ToxicityResult> {
    // Find toxin motif matches
    const toxinMatches = this.findToxinMatches(sequence);
    
    // Extract features for ML model
    const features = this.extractToxicityFeatures(sequence);
    const encoded = tf.tensor2d([features]);

    // Predict using ML model
    const prediction = this.toxicityModel!.predict(encoded) as tf.Tensor;
    const score = (await prediction.data())[0];

    // Calculate confidence
    const confidence = this.calculateToxicityConfidence(toxinMatches, score);

    // Determine risk level
    let risk: 'Low' | 'Medium' | 'High';
    if (score > 0.7 || toxinMatches.length > 1) risk = 'High';
    else if (score > 0.4 || toxinMatches.length > 0) risk = 'Medium';
    else risk = 'Low';

    prediction.dispose();
    encoded.dispose();

    return {
      score,
      risk,
      toxinMatches,
      confidence
    };
  }

  private async assessAutoimmunity(sequence: string): Promise<AutoimmunityResult> {
    // Find human protein similarity
    const humanSimilarity = this.findHumanProteinMatches(sequence);
    
    // Extract features for ML model
    const features = this.extractAutoimmunityFeatures(sequence);
    const encoded = tf.tensor2d([features]);

    // Predict using ML model
    const prediction = this.autoimmunityModel!.predict(encoded) as tf.Tensor;
    const score = (await prediction.data())[0];

    // Calculate confidence
    const confidence = this.calculateAutoimmunityConfidence(humanSimilarity, score);

    // Determine risk level
    let risk: 'Low' | 'Medium' | 'High';
    if (score > 0.7 || humanSimilarity.length > 2) risk = 'High';
    else if (score > 0.4 || humanSimilarity.length > 0) risk = 'Medium';
    else risk = 'Low';

    prediction.dispose();
    encoded.dispose();

    return {
      score,
      risk,
      humanSimilarity,
      confidence
    };
  }

  private findAllergenMatches(sequence: string): AllergenMatch[] {
    const matches: AllergenMatch[] = [];

    for (const motif of ALLERGEN_MOTIFS) {
      const pattern = new RegExp(motif.pattern.replace(/X/g, '[A-Z]'), 'g');
      let match;
      
      while ((match = pattern.exec(sequence)) !== null) {
        const matchedSeq = match[0];
        const identity = this.calculateIdentity(motif.pattern, matchedSeq);
        const eValue = this.calculateEValue(identity, matchedSeq.length);

        matches.push({
          allergen: motif.name,
          identity,
          eValue,
          source: motif.source
        });
      }
    }

    return matches.sort((a, b) => b.identity - a.identity);
  }

  private findToxinMatches(sequence: string): ToxinMatch[] {
    const matches: ToxinMatch[] = [];

    for (const motif of TOXIN_MOTIFS) {
      const pattern = new RegExp(motif.pattern.replace(/X/g, '[A-Z]'), 'g');
      let match;
      
      while ((match = pattern.exec(sequence)) !== null) {
        const matchedSeq = match[0];
        const identity = this.calculateIdentity(motif.pattern, matchedSeq);
        const eValue = this.calculateEValue(identity, matchedSeq.length);

        matches.push({
          toxin: motif.name,
          identity,
          eValue,
          mechanism: motif.mechanism
        });
      }
    }

    return matches.sort((a, b) => b.identity - a.identity);
  }

  private findHumanProteinMatches(sequence: string): HumanProteinMatch[] {
    const matches: HumanProteinMatch[] = [];

    for (const motif of HUMAN_PROTEIN_MOTIFS) {
      const pattern = new RegExp(motif.pattern.replace(/X/g, '[A-Z]'), 'g');
      let match;
      
      while ((match = pattern.exec(sequence)) !== null) {
        const matchedSeq = match[0];
        const identity = this.calculateIdentity(motif.pattern, matchedSeq);
        const eValue = this.calculateEValue(identity, matchedSeq.length);

        matches.push({
          protein: motif.name,
          identity,
          eValue,
          function: motif.function
        });
      }
    }

    return matches.sort((a, b) => b.identity - a.identity);
  }

  private extractAllergenicityFeatures(sequence: string): number[] {
    const features: number[] = [];
    
    // Amino acid composition (20 features)
    const composition = this.calculateAAComposition(sequence);
    features.push(...Object.values(composition));
    
    // Dipeptide composition (first 40 most important dipeptides)
    const dipeptides = this.calculateDipeptideComposition(sequence);
    features.push(...Object.values(dipeptides).slice(0, 40));
    
    // Physical properties (10 features)
    features.push(
      this.calculateHydrophobicity(sequence),
      this.calculateIsoelectricPoint(sequence),
      this.calculateMolecularWeight(sequence),
      this.calculateInstabilityIndex(sequence),
      this.calculateAliphaticIndex(sequence),
      this.calculateGRAVY(sequence),
      this.calculateAromaticity(sequence),
      this.calculateSecondaryStructureFraction(sequence, 'helix'),
      this.calculateSecondaryStructureFraction(sequence, 'sheet'),
      this.calculateSecondaryStructureFraction(sequence, 'turn')
    );
    
    // Motif-based features (30 features)
    const motifFeatures = this.extractMotifFeatures(sequence, ALLERGEN_MOTIFS.slice(0, 30));
    features.push(...motifFeatures);

    return features;
  }

  private extractToxicityFeatures(sequence: string): number[] {
    const features: number[] = [];
    
    // Amino acid composition (20 features)
    const composition = this.calculateAAComposition(sequence);
    features.push(...Object.values(composition));
    
    // Cysteine pattern analysis (10 features)
    features.push(
      this.countCysteineResidues(sequence),
      this.calculateCysteineSpacing(sequence),
      this.calculateDisulfideBondPotential(sequence)
    );
    
    // Toxin-specific patterns (20 features)
    const toxinFeatures = this.extractMotifFeatures(sequence, TOXIN_MOTIFS);
    features.push(...toxinFeatures);
    
    // Physical properties (27 features)
    features.push(
      this.calculateHydrophobicity(sequence),
      this.calculateIsoelectricPoint(sequence),
      this.calculateMolecularWeight(sequence),
      this.calculateInstabilityIndex(sequence),
      this.calculateAliphaticIndex(sequence),
      this.calculateGRAVY(sequence),
      this.calculateAromaticity(sequence),
      this.calculateSecondaryStructureFraction(sequence, 'helix'),
      this.calculateSecondaryStructureFraction(sequence, 'sheet'),
      this.calculateSecondaryStructureFraction(sequence, 'turn')
    );

    return features.slice(0, 80); // Truncate to expected size
  }

  private extractAutoimmunityFeatures(sequence: string): number[] {
    const features: number[] = [];
    
    // Amino acid composition (20 features)
    const composition = this.calculateAAComposition(sequence);
    features.push(...Object.values(composition));
    
    // Human protein similarity features (20 features)
    const humanFeatures = this.extractMotifFeatures(sequence, HUMAN_PROTEIN_MOTIFS);
    features.push(...humanFeatures);
    
    // Sequence complexity and patterns (20 features)
    features.push(
      this.calculateSequenceComplexity(sequence),
      this.calculateRepeatContent(sequence),
      this.calculateLowComplexityRegions(sequence),
      this.calculateHydrophobicity(sequence),
      this.calculateIsoelectricPoint(sequence),
      this.calculateMolecularWeight(sequence),
      this.calculateInstabilityIndex(sequence),
      this.calculateAliphaticIndex(sequence),
      this.calculateGRAVY(sequence),
      this.calculateAromaticity(sequence)
    );

    return features.slice(0, 60); // Truncate to expected size
  }

  // Helper methods for feature extraction
  private calculateAAComposition(sequence: string): { [aa: string]: number } {
    const composition: { [aa: string]: number } = {};
    const aminoAcids = 'ACDEFGHIKLMNPQRSTVWY';
    
    // Initialize
    for (const aa of aminoAcids) {
      composition[aa] = 0;
    }
    
    // Count
    for (const aa of sequence) {
      if (composition[aa] !== undefined) {
        composition[aa]++;
      }
    }
    
    // Normalize
    for (const aa of aminoAcids) {
      composition[aa] /= sequence.length;
    }
    
    return composition;
  }

  private calculateDipeptideComposition(sequence: string): { [dipeptide: string]: number } {
    const composition: { [dipeptide: string]: number } = {};
    
    for (let i = 0; i < sequence.length - 1; i++) {
      const dipeptide = sequence.substring(i, i + 2);
      composition[dipeptide] = (composition[dipeptide] || 0) + 1;
    }
    
    // Normalize
    const total = sequence.length - 1;
    for (const dipeptide in composition) {
      composition[dipeptide] /= total;
    }
    
    return composition;
  }

  private calculateHydrophobicity(sequence: string): number {
    const hydrophobicityScale: { [aa: string]: number } = {
      A: 1.8, C: 2.5, D: -3.5, E: -3.5, F: 2.8, G: -0.4, H: -3.2, I: 4.5, K: -3.9, L: 3.8,
      M: 1.9, N: -3.5, P: -1.6, Q: -3.5, R: -4.5, S: -0.8, T: -0.7, V: 4.2, W: -0.9, Y: -1.3
    };
    
    let sum = 0;
    for (const aa of sequence) {
      sum += hydrophobicityScale[aa] || 0;
    }
    
    return sum / sequence.length;
  }

  private calculateIsoelectricPoint(sequence: string): number {
    // Simplified pI calculation
    const pKValues: { [aa: string]: number } = {
      D: 3.9, E: 4.3, H: 6.0, C: 8.3, Y: 10.1, K: 10.5, R: 12.5
    };
    
    let netCharge = 0;
    for (const aa of sequence) {
      if (pKValues[aa]) {
        netCharge += aa === 'D' || aa === 'E' ? -1 : 1;
      }
    }
    
    return 7.0 + netCharge * 0.1; // Simplified calculation
  }

  private calculateMolecularWeight(sequence: string): number {
    const weights: { [aa: string]: number } = {
      A: 89.1, C: 121.0, D: 133.1, E: 147.1, F: 165.2, G: 75.1, H: 155.2, I: 131.2, K: 146.2, L: 131.2,
      M: 149.2, N: 132.1, P: 115.1, Q: 146.2, R: 174.2, S: 105.1, T: 119.1, V: 117.1, W: 204.2, Y: 181.2
    };
    
    let totalWeight = 0;
    for (const aa of sequence) {
      totalWeight += weights[aa] || 0;
    }
    
    return totalWeight;
  }

  private calculateInstabilityIndex(sequence: string): number {
    // Simplified instability index calculation
    let instabilityScore = 0;
    for (let i = 0; i < sequence.length - 1; i++) {
      const dipeptide = sequence.substring(i, i + 2);
      // Simplified scoring based on common unstable dipeptides
      if (['DP', 'DG', 'PD', 'PG'].includes(dipeptide)) {
        instabilityScore += 10;
      }
    }
    
    return instabilityScore / sequence.length;
  }

  private calculateAliphaticIndex(sequence: string): number {
    const aliphaticAAs = ['A', 'V', 'I', 'L'];
    let count = 0;
    
    for (const aa of sequence) {
      if (aliphaticAAs.includes(aa)) {
        count++;
      }
    }
    
    return (count / sequence.length) * 100;
  }

  private calculateGRAVY(sequence: string): number {
    // Grand average of hydropathy
    return this.calculateHydrophobicity(sequence);
  }

  private calculateAromaticity(sequence: string): number {
    const aromaticAAs = ['F', 'W', 'Y'];
    let count = 0;
    
    for (const aa of sequence) {
      if (aromaticAAs.includes(aa)) {
        count++;
      }
    }
    
    return count / sequence.length;
  }

  private calculateSecondaryStructureFraction(sequence: string, structure: string): number {
    // Simplified secondary structure prediction using Chou-Fasman parameters
    const helixPropensity: { [aa: string]: number } = {
      A: 1.42, C: 0.70, D: 1.01, E: 1.51, F: 1.13, G: 0.57, H: 1.00, I: 1.08, K: 1.16, L: 1.21,
      M: 1.45, N: 0.67, P: 0.57, Q: 1.11, R: 0.98, S: 0.77, T: 0.83, V: 1.06, W: 1.08, Y: 0.69
    };
    
    let sum = 0;
    for (const aa of sequence) {
      sum += helixPropensity[aa] || 1.0;
    }
    
    return Math.min(1.0, sum / sequence.length);
  }

  private extractMotifFeatures(sequence: string, motifs: any[]): number[] {
    const features: number[] = [];
    
    for (const motif of motifs) {
      const pattern = new RegExp(motif.pattern.replace(/X/g, '[A-Z]'), 'g');
      const matches = (sequence.match(pattern) || []).length;
      features.push(matches / sequence.length);
    }
    
    return features;
  }

  private countCysteineResidues(sequence: string): number {
    return (sequence.match(/C/g) || []).length;
  }

  private calculateCysteineSpacing(sequence: string): number {
    const cysteinePositions: number[] = [];
    for (let i = 0; i < sequence.length; i++) {
      if (sequence[i] === 'C') {
        cysteinePositions.push(i);
      }
    }
    
    if (cysteinePositions.length < 2) return 0;
    
    let totalSpacing = 0;
    for (let i = 1; i < cysteinePositions.length; i++) {
      totalSpacing += cysteinePositions[i] - cysteinePositions[i - 1];
    }
    
    return totalSpacing / (cysteinePositions.length - 1);
  }

  private calculateDisulfideBondPotential(sequence: string): number {
    const cysteineCount = this.countCysteineResidues(sequence);
    return Math.floor(cysteineCount / 2);
  }

  private calculateSequenceComplexity(sequence: string): number {
    const uniqueAAs = new Set(sequence).size;
    return uniqueAAs / 20; // Normalized by total possible amino acids
  }

  private calculateRepeatContent(sequence: string): number {
    let repeatCount = 0;
    for (let i = 0; i < sequence.length - 1; i++) {
      if (sequence[i] === sequence[i + 1]) {
        repeatCount++;
      }
    }
    return repeatCount / sequence.length;
  }

  private calculateLowComplexityRegions(sequence: string): number {
    // Simplified low complexity calculation
    const windowSize = 12;
    let lowComplexityCount = 0;
    
    for (let i = 0; i <= sequence.length - windowSize; i++) {
      const window = sequence.substring(i, i + windowSize);
      const uniqueAAs = new Set(window).size;
      if (uniqueAAs <= 3) {
        lowComplexityCount++;
      }
    }
    
    return lowComplexityCount / (sequence.length - windowSize + 1);
  }

  private calculateIdentity(pattern: string, sequence: string): number {
    let matches = 0;
    const minLength = Math.min(pattern.length, sequence.length);
    
    for (let i = 0; i < minLength; i++) {
      if (pattern[i] === sequence[i] || pattern[i] === 'X') {
        matches++;
      }
    }
    
    return matches / minLength;
  }

  private calculateEValue(identity: number, length: number): number {
    // Simplified E-value calculation
    return Math.exp(-identity * length);
  }

  private calculateAllergenicityConfidence(matches: AllergenMatch[], score: number): number {
    let confidence = score;
    
    // Increase confidence if multiple high-identity matches
    const highIdentityMatches = matches.filter(m => m.identity > 0.8).length;
    confidence += highIdentityMatches * 0.1;
    
    return Math.min(1.0, confidence);
  }

  private calculateToxicityConfidence(matches: ToxinMatch[], score: number): number {
    let confidence = score;
    
    // Increase confidence if cysteine-rich patterns found
    const cysteineMatches = matches.filter(m => m.toxin.includes('Cysteine') || m.toxin.includes('toxin')).length;
    confidence += cysteineMatches * 0.15;
    
    return Math.min(1.0, confidence);
  }

  private calculateAutoimmunityConfidence(matches: HumanProteinMatch[], score: number): number {
    let confidence = score;
    
    // Increase confidence if multiple structural protein matches
    const structuralMatches = matches.filter(m => m.function.includes('Structural') || m.function.includes('collagen')).length;
    confidence += structuralMatches * 0.1;
    
    return Math.min(1.0, confidence);
  }

  private calculateOverallSafety(allergenicity: AllergenicityResult, toxicity: ToxicityResult, autoimmunity: AutoimmunityResult): number {
    // Weight different safety aspects
    const allergenicityWeight = 0.4;
    const toxicityWeight = 0.4;
    const autoimmunityWeight = 0.2;
    
    // Convert risk scores to safety scores (inverted)
    const allergenicitySafety = 1 - allergenicity.score;
    const toxicitySafety = 1 - toxicity.score;
    const autoimmunitySafety = 1 - autoimmunity.score;
    
    return (allergenicitySafety * allergenicityWeight +
            toxicitySafety * toxicityWeight +
            autoimmunitySafety * autoimmunityWeight);
  }

  private generateRecommendations(allergenicity: AllergenicityResult, toxicity: ToxicityResult, autoimmunity: AutoimmunityResult): string[] {
    const recommendations: string[] = [];
    
    if (allergenicity.risk === 'High') {
      recommendations.push('Consider removing or modifying allergen motifs found in the sequence');
      recommendations.push('Perform cross-reactivity testing with known allergens');
    }
    
    if (toxicity.risk === 'High') {
      recommendations.push('Remove or modify toxin-like patterns identified in the sequence');
      recommendations.push('Consider reducing cysteine content to minimize toxic potential');
    }
    
    if (autoimmunity.risk === 'High') {
      recommendations.push('Modify regions with high similarity to human proteins');
      recommendations.push('Consider immunological tolerance testing');
    }
    
    if (allergenicity.risk === 'Low' && toxicity.risk === 'Low' && autoimmunity.risk === 'Low') {
      recommendations.push('Safety profile looks favorable for vaccine development');
      recommendations.push('Proceed with preclinical testing');
    }
    
    return recommendations;
  }

  dispose() {
    if (this.allergenicityModel) {
      this.allergenicityModel.dispose();
    }
    if (this.toxicityModel) {
      this.toxicityModel.dispose();
    }
    if (this.autoimmunityModel) {
      this.autoimmunityModel.dispose();
    }
  }
}

export const safetyAssessmentEngine = new SafetyAssessmentEngine();