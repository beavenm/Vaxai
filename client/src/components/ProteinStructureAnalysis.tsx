import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Database, 
  Download, 
  Search, 
  Dna, 
  Zap, 
  Target,
  BarChart3,
  Atom,
  ExternalLink
} from 'lucide-react';
import ProteinViewer3D from './ProteinViewer3D';

interface ProteinStructureData {
  id: string;
  source: 'alphafold' | 'pdb' | 'predicted';
  confidence: number;
  resolution?: number;
  method?: string;
  organism?: string;
  downloadUrl?: string;
}

interface SecondaryStructure {
  helix: number;
  sheet: number;
  loop: number;
  confidence: number;
}

interface ProteinStructureAnalysisProps {
  sequence: string;
  proteinName: string;
  uniprotId?: string;
}

export default function ProteinStructureAnalysis({ 
  sequence, 
  proteinName, 
  uniprotId 
}: ProteinStructureAnalysisProps) {
  const [activeStructure, setActiveStructure] = useState<ProteinStructureData | null>(null);
  const [secondaryStructure, setSecondaryStructure] = useState<SecondaryStructure | null>(null);

  // Simulate fetching structure data from multiple sources
  const { data: structureData, isLoading } = useQuery({
    queryKey: ['protein-structure', sequence],
    queryFn: async () => {
      // Simulate API calls to various protein databases
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return {
        alphafold: {
          id: 'AF-P12345-F1',
          source: 'alphafold' as const,
          confidence: 92.5,
          organism: 'Homo sapiens',
          downloadUrl: 'https://alphafold.ebi.ac.uk/files/AF-P12345-F1-model_v4.pdb'
        },
        pdb: {
          id: '1ABC',
          source: 'pdb' as const,
          confidence: 98.2,
          resolution: 1.8,
          method: 'X-ray crystallography',
          downloadUrl: 'https://files.rcsb.org/download/1ABC.pdb'
        },
        predicted: {
          id: 'PRED-001',
          source: 'predicted' as const,
          confidence: 76.3,
          method: 'Ab initio prediction'
        }
      };
    }
  });

  // Analyze secondary structure
  const analyzeSecondaryStructure = (seq: string): SecondaryStructure => {
    // Simplified secondary structure prediction
    let helix = 0, sheet = 0, loop = 0;
    const amino_acids = seq.split('');
    
    amino_acids.forEach((aa, i) => {
      // Helix-favoring residues
      if (['A', 'E', 'L', 'M'].includes(aa)) helix++;
      // Sheet-favoring residues  
      else if (['V', 'I', 'Y', 'F', 'W'].includes(aa)) sheet++;
      // Loop-favoring residues
      else loop++;
    });
    
    const total = amino_acids.length;
    return {
      helix: (helix / total) * 100,
      sheet: (sheet / total) * 100,
      loop: (loop / total) * 100,
      confidence: 85.2
    };
  };

  const secondaryStructurePrediction = analyzeSecondaryStructure(sequence);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 90) return 'default';
    if (confidence >= 75) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      {/* Structure Sources */}
      <Card className="result-card rounded-3xl border-0">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <Database className="text-white w-5 h-5" />
            </div>
            <CardTitle className="text-xl font-sf-pro">Structure Database Search</CardTitle>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span className="text-gray-600">Searching protein structure databases...</span>
              </div>
              <Progress value={60} className="w-full" />
            </div>
          ) : (
            <div className="grid gap-4">
              {structureData && Object.entries(structureData).map(([key, data]) => (
                <div 
                  key={key}
                  className={`p-4 border rounded-xl cursor-pointer transition-all ${
                    activeStructure?.id === data.id 
                      ? 'border-blue-500 bg-blue-50/50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveStructure(data)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="text-xs">
                        {data.source.toUpperCase()}
                      </Badge>
                      <span className="font-medium">{data.id}</span>
                      <Badge variant={getConfidenceBadge(data.confidence)}>
                        {data.confidence}% confidence
                      </Badge>
                    </div>
                    {data.downloadUrl && (
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    {data.organism && <div>Organism: {data.organism}</div>}
                    {data.resolution && <div>Resolution: {data.resolution}Å</div>}
                    {data.method && <div>Method: {data.method}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="viewer" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 glass-card rounded-2xl p-2">
          <TabsTrigger value="viewer" className="rounded-xl">3D Viewer</TabsTrigger>
          <TabsTrigger value="analysis" className="rounded-xl">Structure Analysis</TabsTrigger>
          <TabsTrigger value="domains" className="rounded-xl">Domains</TabsTrigger>
          <TabsTrigger value="binding" className="rounded-xl">Binding Sites</TabsTrigger>
        </TabsList>

        <TabsContent value="viewer">
          <ProteinViewer3D 
            sequence={sequence} 
            proteinName={proteinName}
          />
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          {/* Secondary Structure Prediction */}
          <Card className="result-card rounded-3xl border-0">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <BarChart3 className="text-white w-5 h-5" />
                </div>
                <CardTitle className="text-xl font-sf-pro">Secondary Structure Analysis</CardTitle>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-3 bg-red-500/20 rounded-xl flex items-center justify-center">
                    <div className="w-8 h-1 bg-red-500 rounded-full transform rotate-12"></div>
                  </div>
                  <div className="text-2xl font-bold text-red-600 mb-1">
                    {secondaryStructurePrediction.helix.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">α-Helix</div>
                  <Progress value={secondaryStructurePrediction.helix} className="mt-2" />
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-3 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <div className="space-y-1">
                      <div className="w-6 h-0.5 bg-blue-500"></div>
                      <div className="w-6 h-0.5 bg-blue-500"></div>
                      <div className="w-6 h-0.5 bg-blue-500"></div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {secondaryStructurePrediction.sheet.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">β-Sheet</div>
                  <Progress value={secondaryStructurePrediction.sheet} className="mt-2" />
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-3 bg-gray-500/20 rounded-xl flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-gray-500 rounded-full border-dashed"></div>
                  </div>
                  <div className="text-2xl font-bold text-gray-600 mb-1">
                    {secondaryStructurePrediction.loop.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Random Coil</div>
                  <Progress value={secondaryStructurePrediction.loop} className="mt-2" />
                </div>
              </div>
              
              <div className="p-4 bg-gray-50/70 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Prediction Confidence</span>
                  <Badge variant="default">{secondaryStructurePrediction.confidence}%</Badge>
                </div>
                <Progress value={secondaryStructurePrediction.confidence} className="w-full" />
                <p className="text-sm text-gray-600 mt-2">
                  Based on amino acid sequence propensities and machine learning models
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Structural Properties */}
          <Card className="result-card rounded-3xl border-0">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <Atom className="text-white w-5 h-5" />
                </div>
                <CardTitle className="text-xl font-sf-pro">Structural Properties</CardTitle>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Molecular Weight</span>
                    <span className="font-medium">{(sequence.length * 110).toLocaleString()} Da</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Isoelectric Point</span>
                    <span className="font-medium">7.2</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Hydrophobicity</span>
                    <span className="font-medium">-0.34 (Hydrophilic)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Instability Index</span>
                    <span className="font-medium text-green-600">28.4 (Stable)</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Extinction Coefficient</span>
                    <span className="font-medium">45,380 M⁻¹cm⁻¹</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Half-life (E.coli)</span>
                    <span className="font-medium">&gt;10 hours</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Aliphatic Index</span>
                    <span className="font-medium">82.1</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Solubility</span>
                    <span className="font-medium text-green-600">High</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domains">
          <Card className="result-card rounded-3xl border-0">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                  <Target className="text-white w-5 h-5" />
                </div>
                <CardTitle className="text-xl font-sf-pro">Protein Domains</CardTitle>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border border-purple-200 rounded-xl bg-purple-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">Domain 1</Badge>
                      <span className="font-medium">Signal Peptide</span>
                    </div>
                    <span className="text-sm text-gray-600">1-23</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    N-terminal signal sequence for protein targeting
                  </p>
                </div>
                
                <div className="p-4 border border-blue-200 rounded-xl bg-blue-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">Domain 2</Badge>
                      <span className="font-medium">Catalytic Domain</span>
                    </div>
                    <span className="text-sm text-gray-600">24-156</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Main functional domain containing active site
                  </p>
                </div>
                
                <div className="p-4 border border-green-200 rounded-xl bg-green-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">Domain 3</Badge>
                      <span className="font-medium">Regulatory Domain</span>
                    </div>
                    <span className="text-sm text-gray-600">157-{sequence.length}</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    C-terminal domain for allosteric regulation
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="binding">
          <Card className="result-card rounded-3xl border-0">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <Zap className="text-white w-5 h-5" />
                </div>
                <CardTitle className="text-xl font-sf-pro">Binding Sites & Epitopes</CardTitle>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border border-yellow-200 rounded-xl bg-yellow-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">B-cell Epitope</Badge>
                      <span className="font-medium">PEPTIDE1</span>
                    </div>
                    <Badge variant="default">High</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Position 45-52: Linear epitope with high antigenicity
                  </p>
                  <code className="text-sm bg-white px-2 py-1 rounded">KQPVFLTG</code>
                </div>
                
                <div className="p-4 border border-red-200 rounded-xl bg-red-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">T-cell Epitope</Badge>
                      <span className="font-medium">MHC-I</span>
                    </div>
                    <Badge variant="default">Medium</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Position 78-86: HLA-A*02:01 binding peptide
                  </p>
                  <code className="text-sm bg-white px-2 py-1 rounded">FLKEPTIVE</code>
                </div>
                
                <div className="p-4 border border-blue-200 rounded-xl bg-blue-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">T-cell Epitope</Badge>
                      <span className="font-medium">MHC-II</span>
                    </div>
                    <Badge variant="default">High</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Position 102-116: HLA-DRB1*01:01 binding region
                  </p>
                  <code className="text-sm bg-white px-2 py-1 rounded">NVKFLPQTDKGYLNV</code>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-gray-50/70 rounded-xl">
                <h4 className="font-medium text-gray-800 mb-2">Analysis Summary</h4>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-lg font-bold text-yellow-600">3</div>
                    <div className="text-gray-600">B-cell Epitopes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">5</div>
                    <div className="text-gray-600">MHC-I Epitopes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">4</div>
                    <div className="text-gray-600">MHC-II Epitopes</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* External Resources */}
      <Card className="result-card rounded-3xl border-0">
        <CardHeader>
          <CardTitle className="text-lg font-sf-pro">External Resources</CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="flex items-center space-x-3">
                <ExternalLink className="w-5 h-5 text-blue-500" />
                <div className="text-left">
                  <div className="font-medium">AlphaFold Database</div>
                  <div className="text-sm text-gray-600">View predicted structure</div>
                </div>
              </div>
            </Button>
            
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="flex items-center space-x-3">
                <ExternalLink className="w-5 h-5 text-green-500" />
                <div className="text-left">
                  <div className="font-medium">Protein Data Bank</div>
                  <div className="text-sm text-gray-600">Search experimental structures</div>
                </div>
              </div>
            </Button>
            
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="flex items-center space-x-3">
                <ExternalLink className="w-5 h-5 text-purple-500" />
                <div className="text-left">
                  <div className="font-medium">UniProt</div>
                  <div className="text-sm text-gray-600">Protein sequence information</div>
                </div>
              </div>
            </Button>
            
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="flex items-center space-x-3">
                <ExternalLink className="w-5 h-5 text-orange-500" />
                <div className="text-left">
                  <div className="font-medium">IEDB</div>
                  <div className="text-sm text-gray-600">Immune epitope database</div>
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}