import * as tf from '@tensorflow/tfjs-node';

// Amino acid encoding for neural networks
const AMINO_ACIDS = 'ACDEFGHIKLMNPQRSTVWY';
const AA_TO_INDEX = Object.fromEntries(AMINO_ACIDS.split('').map((aa, i) => [aa, i]));

export interface EpitopeScore {
  position: number;
  sequence: string;
  score: number;
  method: string;
  confidence: number;
}

export interface HLABinding {
  allele: string;
  peptide: string;
  ic50: number;
  percentileRank: number;
  bindingLevel: 'Strong' | 'Weak' | 'None';
  score: number;
}

export interface StructuralFeatures {
  accessibility: number;
  flexibility: number;
  hydrophobicity: number;
  charge: number;
  beta_turn_propensity: number;
}

// Physicochemical properties for amino acids
const AA_PROPERTIES: { [key: string]: { hydrophobicity: number; charge: number; flexibility: number; accessibility: number; beta_turn: number } } = {
  A: { hydrophobicity: 1.8, charge: 0, flexibility: 0.36, accessibility: 0.74, beta_turn: 0.66 },
  C: { hydrophobicity: 2.5, charge: 0, flexibility: 0.31, accessibility: 0.91, beta_turn: 1.19 },
  D: { hydrophobicity: -3.5, charge: -1, flexibility: 0.51, accessibility: 0.62, beta_turn: 1.46 },
  E: { hydrophobicity: -3.5, charge: -1, flexibility: 0.5, accessibility: 0.62, beta_turn: 0.74 },
  F: { hydrophobicity: 2.8, charge: 0, flexibility: 0.31, accessibility: 0.88, beta_turn: 0.60 },
  G: { hydrophobicity: -0.4, charge: 0, flexibility: 0.54, accessibility: 0.48, beta_turn: 1.56 },
  H: { hydrophobicity: -3.2, charge: 0.5, flexibility: 0.32, accessibility: 0.68, beta_turn: 0.95 },
  I: { hydrophobicity: 4.5, charge: 0, flexibility: 0.42, accessibility: 0.88, beta_turn: 0.47 },
  K: { hydrophobicity: -3.9, charge: 1, flexibility: 0.49, accessibility: 0.52, beta_turn: 1.01 },
  L: { hydrophobicity: 3.8, charge: 0, flexibility: 0.37, accessibility: 0.85, beta_turn: 0.51 },
  M: { hydrophobicity: 1.9, charge: 0, flexibility: 0.30, accessibility: 0.85, beta_turn: 0.60 },
  N: { hydrophobicity: -3.5, charge: 0, flexibility: 0.46, accessibility: 0.63, beta_turn: 1.56 },
  P: { hydrophobicity: -1.6, charge: 0, flexibility: 0.51, accessibility: 0.64, beta_turn: 1.52 },
  Q: { hydrophobicity: -3.5, charge: 0, flexibility: 0.49, accessibility: 0.62, beta_turn: 0.98 },
  R: { hydrophobicity: -4.5, charge: 1, flexibility: 0.53, accessibility: 0.64, beta_turn: 0.95 },
  S: { hydrophobicity: -0.8, charge: 0, flexibility: 0.51, accessibility: 0.66, beta_turn: 1.43 },
  T: { hydrophobicity: -0.7, charge: 0, flexibility: 0.44, accessibility: 0.70, beta_turn: 0.96 },
  V: { hydrophobicity: 4.2, charge: 0, flexibility: 0.39, accessibility: 0.86, beta_turn: 0.50 },
  W: { hydrophobicity: -0.9, charge: 0, flexibility: 0.31, accessibility: 0.85, beta_turn: 0.96 },
  Y: { hydrophobicity: -1.3, charge: 0, flexibility: 0.42, accessibility: 0.76, beta_turn: 1.14 }
};

export class EpitopePredictor {
  private bCellModel: tf.LayersModel | null = null;
  private tCellModel: tf.LayersModel | null = null;
  private hlaBindingModel: tf.LayersModel | null = null;

  constructor() {
    this.initializeModels();
  }

  private async initializeModels() {
    // Initialize B-cell epitope prediction model (CNN + LSTM)
    this.bCellModel = tf.sequential({
      layers: [
        tf.layers.conv1d({
          inputShape: [null, 20], // Variable sequence length, 20 amino acids
          filters: 64,
          kernelSize: 3,
          activation: 'relu',
          padding: 'same'
        }),
        tf.layers.conv1d({
          filters: 128,
          kernelSize: 3,
          activation: 'relu',
          padding: 'same'
        }),
        tf.layers.maxPooling1d({ poolSize: 2 }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.lstm({
          units: 64,
          returnSequences: true,
          dropout: 0.3,
          recurrentDropout: 0.3
        }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
      ]
    });

    // Initialize T-cell epitope prediction model (Transformer-like attention)
    this.tCellModel = tf.sequential({
      layers: [
        tf.layers.embedding({
          inputDim: 21, // 20 amino acids + padding
          outputDim: 128,
          inputShape: [9] // Typical MHC-I binding peptide length
        }),
        tf.layers.dense({ units: 256, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 128, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
      ]
    });

    // Initialize HLA binding prediction model
    this.hlaBindingModel = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [45], // 9 peptide positions * 5 properties
          units: 512,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 256, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 128, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'linear' }) // Regression for IC50 values
      ]
    });

    // Compile models
    this.bCellModel.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    this.tCellModel.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    this.hlaBindingModel.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });
  }

  // Enhanced B-cell epitope prediction using CNN-LSTM
  async predictBCellEpitopes(sequence: string, windowSize: number = 15): Promise<EpitopeScore[]> {
    if (!this.bCellModel) {
      throw new Error('B-cell model not initialized');
    }

    const epitopes: EpitopeScore[] = [];
    const seqLength = sequence.length;

    for (let i = 0; i <= seqLength - windowSize; i++) {
      const peptide = sequence.substring(i, i + windowSize);
      const features = this.extractStructuralFeatures(peptide);
      const encoded = this.encodeSequenceForCNN(peptide);
      
      const prediction = this.bCellModel.predict(encoded) as tf.Tensor;
      const score = await prediction.data();
      
      // Calculate confidence based on structural features
      const confidence = this.calculateBCellConfidence(features, score[0]);

      if (score[0] > 0.5) { // Threshold for positive prediction
        epitopes.push({
          position: i + 1,
          sequence: peptide,
          score: score[0],
          method: 'CNN-LSTM',
          confidence
        });
      }

      prediction.dispose();
      encoded.dispose();
    }

    return epitopes.sort((a, b) => b.score - a.score);
  }

  // Enhanced T-cell epitope prediction with HLA binding
  async predictTCellEpitopes(sequence: string, hlaAlleles: string[] = ['HLA-A*02:01', 'HLA-A*01:01', 'HLA-B*07:02']): Promise<EpitopeScore[]> {
    if (!this.tCellModel) {
      throw new Error('T-cell model not initialized');
    }

    const epitopes: EpitopeScore[] = [];
    const windowSizes = [8, 9, 10, 11]; // Different peptide lengths for MHC binding

    for (const windowSize of windowSizes) {
      for (let i = 0; i <= sequence.length - windowSize; i++) {
        const peptide = sequence.substring(i, i + windowSize);
        
        // Predict immunogenicity
        const encoded = this.encodePeptide(peptide, 9); // Pad/truncate to 9 residues
        const prediction = this.tCellModel.predict(encoded) as tf.Tensor;
        const immunogenicity = await prediction.data();

        // Calculate average HLA binding across alleles
        const hlaBindings = await this.predictHLABinding(peptide, hlaAlleles);
        const avgBindingScore = hlaBindings.reduce((sum, binding) => sum + binding.score, 0) / hlaBindings.length;
        
        // Combine immunogenicity and binding scores
        const combinedScore = (immunogenicity[0] * 0.6 + avgBindingScore * 0.4);
        const confidence = this.calculateTCellConfidence(immunogenicity[0], avgBindingScore);

        if (combinedScore > 0.5) {
          epitopes.push({
            position: i + 1,
            sequence: peptide,
            score: combinedScore,
            method: 'Transformer-HLA',
            confidence
          });
        }

        prediction.dispose();
        encoded.dispose();
      }
    }

    return epitopes.sort((a, b) => b.score - a.score);
  }

  // Advanced HLA binding prediction using neural networks
  async predictHLABinding(peptide: string, alleles: string[]): Promise<HLABinding[]> {
    if (!this.hlaBindingModel) {
      throw new Error('HLA binding model not initialized');
    }

    const bindings: HLABinding[] = [];

    for (const allele of alleles) {
      // Pad or truncate peptide to 9 residues for MHC-I
      const normalizedPeptide = this.normalizePeptideLength(peptide, 9);
      const features = this.extractPeptideFeatures(normalizedPeptide);
      const encoded = tf.tensor2d([features]);

      const prediction = this.hlaBindingModel.predict(encoded) as tf.Tensor;
      const ic50Pred = await prediction.data();
      const ic50 = Math.exp(ic50Pred[0]); // Convert from log space

      // Calculate percentile rank (approximated)
      const percentileRank = this.calculatePercentileRank(ic50);
      
      // Determine binding level
      let bindingLevel: 'Strong' | 'Weak' | 'None';
      if (ic50 < 50) bindingLevel = 'Strong';
      else if (ic50 < 500) bindingLevel = 'Weak';
      else bindingLevel = 'None';

      // Convert IC50 to binding score (0-1 scale)
      const score = Math.max(0, Math.min(1, 1 - (Math.log10(ic50) - 1) / 4));

      bindings.push({
        allele,
        peptide: normalizedPeptide,
        ic50,
        percentileRank,
        bindingLevel,
        score
      });

      prediction.dispose();
      encoded.dispose();
    }

    return bindings;
  }

  // Extract structural features for B-cell epitope prediction
  private extractStructuralFeatures(peptide: string): StructuralFeatures {
    const features = {
      accessibility: 0,
      flexibility: 0,
      hydrophobicity: 0,
      charge: 0,
      beta_turn_propensity: 0
    };

    for (const aa of peptide) {
      const props = AA_PROPERTIES[aa as keyof typeof AA_PROPERTIES];
      if (props) {
        features.accessibility += props.accessibility;
        features.flexibility += props.flexibility;
        features.hydrophobicity += props.hydrophobicity;
        features.charge += props.charge;
        features.beta_turn_propensity += props.beta_turn;
      }
    }

    // Normalize by peptide length
    const length = peptide.length;
    features.accessibility /= length;
    features.flexibility /= length;
    features.hydrophobicity /= length;
    features.charge /= length;
    features.beta_turn_propensity /= length;

    return features;
  }

  // Encode sequence for CNN input
  private encodeSequenceForCNN(sequence: string): tf.Tensor3D {
    const encoded = [];
    for (const aa of sequence) {
      const vector = new Array(20).fill(0);
      if (AA_TO_INDEX[aa] !== undefined) {
        vector[AA_TO_INDEX[aa]] = 1;
      }
      encoded.push(vector);
    }
    return tf.tensor3d([encoded]);
  }

  // Encode peptide for neural network input
  private encodePeptide(peptide: string, targetLength: number): tf.Tensor2D {
    const encoded = [];
    for (let i = 0; i < targetLength; i++) {
      if (i < peptide.length) {
        const aa = peptide[i];
        encoded.push(AA_TO_INDEX[aa] !== undefined ? AA_TO_INDEX[aa] + 1 : 0);
      } else {
        encoded.push(0); // Padding
      }
    }
    return tf.tensor2d([encoded]);
  }

  // Extract physicochemical features for HLA binding prediction
  private extractPeptideFeatures(peptide: string): number[] {
    const features: number[] = [];
    
    for (let i = 0; i < 9; i++) {
      if (i < peptide.length) {
        const aa = peptide[i];
        const props = AA_PROPERTIES[aa as keyof typeof AA_PROPERTIES];
        if (props) {
          features.push(
            props.hydrophobicity,
            props.charge,
            props.flexibility,
            props.accessibility,
            props.beta_turn
          );
        } else {
          features.push(0, 0, 0, 0, 0);
        }
      } else {
        features.push(0, 0, 0, 0, 0); // Padding
      }
    }
    
    return features;
  }

  // Normalize peptide length for consistent input
  private normalizePeptideLength(peptide: string, targetLength: number): string {
    if (peptide.length === targetLength) {
      return peptide;
    } else if (peptide.length > targetLength) {
      // Truncate from center, keeping anchor residues
      const start = Math.floor((peptide.length - targetLength) / 2);
      return peptide.substring(start, start + targetLength);
    } else {
      // Pad with 'X' (unknown amino acid)
      const padding = 'X'.repeat(targetLength - peptide.length);
      return peptide + padding;
    }
  }

  // Calculate percentile rank for HLA binding
  private calculatePercentileRank(ic50: number): number {
    // Approximation based on typical IC50 distributions
    if (ic50 < 50) return 2.0;
    if (ic50 < 500) return 10.0;
    if (ic50 < 5000) return 50.0;
    return 90.0;
  }

  // Calculate confidence for B-cell epitope predictions
  private calculateBCellConfidence(features: StructuralFeatures, score: number): number {
    // Higher confidence for epitopes with favorable structural properties
    let confidence = score;
    
    // Accessibility bonus
    if (features.accessibility > 0.7) confidence += 0.1;
    
    // Flexibility bonus
    if (features.flexibility > 0.4) confidence += 0.05;
    
    // Beta-turn propensity bonus
    if (features.beta_turn_propensity > 1.0) confidence += 0.05;
    
    return Math.min(1.0, confidence);
  }

  // Calculate confidence for T-cell epitope predictions
  private calculateTCellConfidence(immunogenicity: number, bindingScore: number): number {
    // Higher confidence when both immunogenicity and binding are strong
    const baseConfidence = (immunogenicity + bindingScore) / 2;
    
    // Bonus for high binding affinity
    if (bindingScore > 0.8) return Math.min(1.0, baseConfidence + 0.1);
    
    return baseConfidence;
  }

  // Clean up TensorFlow resources
  dispose() {
    if (this.bCellModel) {
      this.bCellModel.dispose();
    }
    if (this.tCellModel) {
      this.tCellModel.dispose();
    }
    if (this.hlaBindingModel) {
      this.hlaBindingModel.dispose();
    }
  }
}

export const epitopePredictor = new EpitopePredictor();