export interface HLAAllele {
  name: string;
  frequency: number;
  population: string;
}

export interface BindingPrediction {
  allele: string;
  peptide: string;
  ic50: number;
  percentileRank: number;
  bindingLevel: 'Strong' | 'Weak' | 'None';
}

export const commonHLAAlleles: HLAAllele[] = [
  { name: 'HLA-A*02:01', frequency: 0.285, population: 'Global' },
  { name: 'HLA-A*01:01', frequency: 0.162, population: 'Global' },
  { name: 'HLA-A*24:02', frequency: 0.124, population: 'Global' },
  { name: 'HLA-A*03:01', frequency: 0.122, population: 'Global' },
  { name: 'HLA-B*07:02', frequency: 0.095, population: 'Global' },
  { name: 'HLA-B*08:01', frequency: 0.081, population: 'Global' },
  { name: 'HLA-DRB1*07:01', frequency: 0.123, population: 'Global' },
  { name: 'HLA-DRB1*15:01', frequency: 0.108, population: 'Global' },
  { name: 'HLA-DRB1*04:01', frequency: 0.089, population: 'Global' },
  { name: 'HLA-DRB1*01:01', frequency: 0.087, population: 'Global' },
];

export function predictHLABinding(peptide: string, alleles: string[]): BindingPrediction[] {
  return alleles.map(allele => {
    // Mock binding prediction - would use NetMHCpan or similar tools
    const ic50 = Math.random() * 5000 + 50; // Random IC50 between 50-5000 nM
    const percentileRank = Math.random() * 100;
    
    let bindingLevel: 'Strong' | 'Weak' | 'None';
    if (ic50 < 500) bindingLevel = 'Strong';
    else if (ic50 < 5000) bindingLevel = 'Weak';
    else bindingLevel = 'None';
    
    return {
      allele,
      peptide,
      ic50: Math.round(ic50 * 100) / 100,
      percentileRank: Math.round(percentileRank * 100) / 100,
      bindingLevel
    };
  });
}

export function calculatePopulationCoverage(
  epitopes: Array<{ sequence: string; hlaAlleles: string[] }>,
  population: string = 'Global'
): number {
  const relevantAlleles = commonHLAAlleles.filter(allele => 
    allele.population === population || population === 'Global'
  );
  
  let totalCoverage = 0;
  
  for (const allele of relevantAlleles) {
    const isCovered = epitopes.some(epitope => 
      epitope.hlaAlleles.includes(allele.name)
    );
    
    if (isCovered) {
      totalCoverage += allele.frequency;
    }
  }
  
  return Math.min(totalCoverage, 1.0);
}

export function assessAllergenicity(sequence: string): {
  risk: 'Low' | 'Medium' | 'High';
  score: number;
  matches: string[];
} {
  // Mock allergenicity assessment - would use AllerTOP or similar
  const score = Math.random() * 0.3; // Assume most sequences are low risk
  
  return {
    risk: score < 0.1 ? 'Low' : score < 0.2 ? 'Medium' : 'High',
    score: Math.round(score * 1000) / 1000,
    matches: [] // Would contain matching allergen sequences
  };
}

export function assessToxicity(sequence: string): {
  isToxic: boolean;
  score: number;
  confidence: number;
} {
  // Mock toxicity assessment - would use ToxinPred or similar
  const score = Math.random() * 0.2; // Assume most sequences are non-toxic
  
  return {
    isToxic: score > 0.5,
    score: Math.round(score * 1000) / 1000,
    confidence: Math.random() * 0.3 + 0.7 // High confidence
  };
}

export function assessAutoimmunity(sequence: string): {
  risk: 'Low' | 'Medium' | 'High';
  score: number;
  similarityMatches: number;
} {
  // Mock autoimmunity assessment - would check against human proteome
  const score = Math.random() * 0.2; // Assume most are low risk
  
  return {
    risk: score < 0.05 ? 'Low' : score < 0.15 ? 'Medium' : 'High',
    score: Math.round(score * 1000) / 1000,
    similarityMatches: Math.floor(Math.random() * 3) // Few matches expected
  };
}

export function predictAntigenicity(sequence: string): number {
  // Mock antigenicity prediction - would use VaxiJen or similar
  let score = 0;
  
  // Simple heuristic based on amino acid composition
  const hydrophobic = ['A', 'I', 'L', 'M', 'F', 'W', 'Y', 'V'];
  const charged = ['R', 'K', 'D', 'E'];
  
  let hydrophobicCount = 0;
  let chargedCount = 0;
  
  for (const aa of sequence) {
    if (hydrophobic.includes(aa)) hydrophobicCount++;
    if (charged.includes(aa)) chargedCount++;
  }
  
  // Balance of hydrophobic and charged residues often correlates with antigenicity
  const hydrophobicRatio = hydrophobicCount / sequence.length;
  const chargedRatio = chargedCount / sequence.length;
  
  score = 0.3 + (hydrophobicRatio * 0.4) + (chargedRatio * 0.3) + (Math.random() * 0.2);
  
  return Math.min(Math.round(score * 1000) / 1000, 1.0);
}
