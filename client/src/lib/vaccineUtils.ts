export interface AminoAcidProperties {
  [key: string]: number[];
}

export const aminoAcidProperties: AminoAcidProperties = {
  'A': [1.8, 0, 0, 0, 89.1],     // Alanine
  'R': [-4.5, 1, 0, 0, 174.2],   // Arginine
  'N': [-3.5, 0, 0, 0, 132.1],   // Asparagine
  'D': [-3.5, -1, 1, 0, 133.1],  // Aspartic acid
  'C': [2.5, 0, 0, 0, 121.0],    // Cysteine
  'Q': [-3.5, 0, 0, 0, 146.1],   // Glutamine
  'E': [-3.5, -1, 1, 0, 147.1],  // Glutamic acid
  'G': [-0.4, 0, 0, 0, 75.1],    // Glycine
  'H': [-3.2, 0, 0, 1, 155.2],   // Histidine
  'I': [4.5, 0, 0, 0, 131.2],    // Isoleucine
  'L': [3.8, 0, 0, 0, 131.2],    // Leucine
  'K': [-3.9, 1, 0, 0, 146.2],   // Lysine
  'M': [1.9, 0, 0, 0, 149.2],    // Methionine
  'F': [2.8, 0, 0, 0, 165.2],    // Phenylalanine
  'P': [-1.6, 0, 0, 0, 115.1],   // Proline
  'S': [-0.8, 0, 0, 0, 105.1],   // Serine
  'T': [-0.7, 0, 0, 0, 119.1],   // Threonine
  'W': [-0.9, 0, 0, 0, 204.2],   // Tryptophan
  'Y': [-1.3, 0, 0, 1, 181.2],   // Tyrosine
  'V': [4.2, 0, 0, 0, 117.1]     // Valine
};

export function parseSequence(input: string): string {
  // Remove FASTA header if present
  const lines = input.trim().split('\n');
  const sequence = lines.filter(line => !line.startsWith('>')).join('');
  
  // Remove whitespace and convert to uppercase
  return sequence.replace(/\s/g, '').toUpperCase();
}

export function validateSequence(sequence: string): boolean {
  const validAminoAcids = Object.keys(aminoAcidProperties);
  return sequence.split('').every(aa => validAminoAcids.includes(aa));
}

export function calculateMolecularWeight(sequence: string): number {
  let weight = 18.015; // Water molecule
  
  for (const aa of sequence) {
    if (aminoAcidProperties[aa]) {
      weight += aminoAcidProperties[aa][4]; // Molecular weight is at index 4
    }
  }
  
  return Math.round(weight / 1000 * 100) / 100; // Convert to kDa and round to 2 decimal places
}

export function predictEpitopes(sequence: string): Array<{
  sequence: string;
  type: string;
  position: number;
  score: number;
}> {
  const epitopes = [];
  
  // Simple epitope prediction (this would be replaced with actual ML models)
  for (let i = 0; i < sequence.length - 8; i++) {
    const peptide = sequence.slice(i, i + 9);
    const score = Math.random() * 0.5 + 0.5; // Mock score between 0.5-1.0
    
    if (score > 0.8) {
      epitopes.push({
        sequence: peptide,
        type: Math.random() > 0.5 ? 'CTL' : 'HTL',
        position: i,
        score: Math.round(score * 100) / 100
      });
    }
  }
  
  return epitopes;
}

export function optimizeCodonUsage(sequence: string): string {
  // Mock codon optimization - would use actual codon tables
  return sequence; // Return original for now
}
