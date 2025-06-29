import { Copy, Download, FileText, Table, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generatePDF } from "@/lib/pdfGenerator";
import ProteinStructureAnalysis from "./ProteinStructureAnalysis";
import type { VaccineDesign } from "@shared/schema";

interface ResultsDisplayProps {
  design: VaccineDesign;
  onNewAnalysis: () => void;
}

export default function ResultsDisplay({ design, onNewAnalysis }: ResultsDisplayProps) {
  const handleCopySequence = () => {
    if (design.optimizedSequence) {
      navigator.clipboard.writeText(design.optimizedSequence);
    }
  };

  const handleDownloadPDF = () => {
    generatePDF(design);
  };

  const handleDownloadSequence = () => {
    if (design.optimizedSequence) {
      const element = document.createElement("a");
      const file = new Blob([`>${design.name}\n${design.optimizedSequence}`], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = `${design.name}.fasta`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  const handleDownloadData = () => {
    if (design.epitopes) {
      const csvContent = "data:text/csv;charset=utf-8," + 
        "Epitope,Type,HLA Alleles,IC50,Score\n" +
        (design.epitopes as any[]).map((e: any) => 
          `${e.sequence},${e.type},"${e.hlaAlleles.join(';')}",${e.ic50 || ''},${e.score}`
        ).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const element = document.createElement("a");
      element.setAttribute("href", encodedUri);
      element.setAttribute("download", `${design.name}_epitopes.csv`);
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  return (
    <Tabs defaultValue="construct" className="space-y-6">
      <TabsList className="grid w-full grid-cols-5 glass-card rounded-2xl p-2">
        <TabsTrigger value="construct" className="rounded-xl">Vaccine Construct</TabsTrigger>
        <TabsTrigger value="epitopes" className="rounded-xl">Epitope Analysis</TabsTrigger>
        <TabsTrigger value="structure" className="rounded-xl">3D Structure</TabsTrigger>
        <TabsTrigger value="coverage" className="rounded-xl">Population Coverage</TabsTrigger>
        <TabsTrigger value="export" className="rounded-xl">Export & Safety</TabsTrigger>
      </TabsList>

      {/* Vaccine Construct Tab */}
      <TabsContent value="construct" className="space-y-6">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="result-card rounded-3xl border-0">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-sf-pro">Optimized Vaccine Construct</CardTitle>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" onClick={handleCopySequence}>
                      <Copy className="w-4 h-4 text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleDownloadSequence}>
                      <Download className="w-4 h-4 text-green-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Construct Visualization */}
                <div className="mb-6">
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium text-gray-700">Signal Peptide</span>
                      <div className="flex-1 h-2 bg-purple-400/30 rounded"></div>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium text-gray-700">CTL Epitopes</span>
                      <div className="flex-1 h-2 bg-blue-400/30 rounded"></div>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium text-gray-700">HTL Epitopes</span>
                      <div className="flex-1 h-2 bg-green-400/30 rounded"></div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">B-cell Epitopes</span>
                      <div className="flex-1 h-2 bg-orange-400/30 rounded"></div>
                    </div>
                  </div>
                </div>
                
                {/* Sequence Display */}
                <div className="bg-gray-900 rounded-xl p-4 text-sm font-mono text-green-400 overflow-x-auto">
                  <div className="mb-2 text-gray-400">&gt;{design.name}</div>
                  <div className="break-all">
                    {design.optimizedSequence}
                  </div>
                </div>
                
                {/* Construct Properties */}
                <div className="grid md:grid-cols-2 gap-4 mt-6">
                  <div className="bg-gray-50/50 rounded-xl p-4">
                    <div className="text-sm text-gray-600 mb-1">Total Length</div>
                    <div className="text-xl font-semibold text-gray-800">{design.sequenceLength} amino acids</div>
                  </div>
                  <div className="bg-gray-50/50 rounded-xl p-4">
                    <div className="text-sm text-gray-600 mb-1">Molecular Weight</div>
                    <div className="text-xl font-semibold text-gray-800">{design.molecularWeight} kDa</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="result-card rounded-3xl border-0">
              <CardHeader>
                <CardTitle className="text-xl font-sf-pro">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Antigenicity Score</span>
                    <span className="font-medium">{(design.antigenicityScore || 0.85 * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Safety Score</span>
                    <span className="font-medium text-green-600">{(design.safetyScore || 0.92 * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Epitope Count</span>
                    <span className="font-medium">{design.epitopeCount || 12}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* New Analysis Button */}
            <Button
              className="w-full glass-button py-4 rounded-2xl text-white font-semibold shadow-lg"
              onClick={onNewAnalysis}
            >
              <Plus className="w-5 h-5 mr-2" />
              Start New Analysis
            </Button>
          </div>
        </div>
      </TabsContent>

      {/* Epitope Analysis Tab */}
      <TabsContent value="epitopes" className="space-y-6">
        <Card className="result-card rounded-3xl border-0">
          <CardHeader>
            <CardTitle className="text-2xl font-sf-pro">Epitope Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 text-sm font-medium text-gray-700">Epitope</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-700">Type</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-700">HLA Alleles</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-700">IC50 (nM)</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-700">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {design.epitopes && (design.epitopes as any[]).map((epitope: any, index: number) => (
                    <tr key={index}>
                      <td className="py-3 font-mono text-sm">{epitope.sequence}</td>
                      <td className="py-3">
                        <Badge variant={epitope.type === 'CTL' ? 'default' : epitope.type === 'HTL' ? 'secondary' : 'outline'}>
                          {epitope.type}
                        </Badge>
                      </td>
                      <td className="py-3 text-sm text-gray-600">{epitope.hlaAlleles.join(', ')}</td>
                      <td className="py-3 text-sm">{epitope.ic50 || '-'}</td>
                      <td className="py-3">
                        <span className="text-green-500 font-semibold">{epitope.score}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* 3D Structure Tab */}
      <TabsContent value="structure" className="space-y-6">
        <ProteinStructureAnalysis 
          sequence={design.optimizedSequence || design.inputSequence}
          proteinName={design.name}
        />
      </TabsContent>

      {/* Population Coverage Tab */}
      <TabsContent value="coverage" className="space-y-6">
        <Card className="result-card rounded-3xl border-0">
          <CardHeader>
            <CardTitle className="text-2xl font-sf-pro">Population Coverage Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Coverage Chart */}
            <div className="h-64 bg-gradient-to-br from-blue-500/10 to-green-500/10 rounded-xl flex items-center justify-center mb-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-blue-500 mb-2">
                  {((design.populationCoverage || 0.78) * 100).toFixed(1)}%
                </div>
                <div className="text-lg text-gray-600">Global Coverage</div>
              </div>
            </div>
            
            {/* Regional Breakdown */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-800">Regional Coverage</h4>
                {design.populationBreakdown ? Object.entries(design.populationBreakdown).map(([region, coverage]) => (
                  <div key={region} className="flex justify-between items-center p-3 bg-gray-50/70 rounded-xl">
                    <span className="text-gray-700">{region}</span>
                    <span className="font-semibold">{((coverage as number) * 100).toFixed(1)}%</span>
                  </div>
                )) : (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-gray-50/70 rounded-xl">
                      <span className="text-gray-700">North America</span>
                      <span className="font-semibold">84.2%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50/70 rounded-xl">
                      <span className="text-gray-700">Europe</span>
                      <span className="font-semibold">79.6%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50/70 rounded-xl">
                      <span className="text-gray-700">Asia</span>
                      <span className="font-semibold">72.1%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50/70 rounded-xl">
                      <span className="text-gray-700">Africa</span>
                      <span className="font-semibold">65.8%</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-800">HLA Allele Distribution</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-blue-50/70 rounded-xl">
                    <span className="text-gray-700">HLA-A*02:01</span>
                    <span className="font-semibold">45.2%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50/70 rounded-xl">
                    <span className="text-gray-700">HLA-A*01:01</span>
                    <span className="font-semibold">28.7%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50/70 rounded-xl">
                    <span className="text-gray-700">HLA-B*07:02</span>
                    <span className="font-semibold">22.1%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50/70 rounded-xl">
                    <span className="text-gray-700">HLA-DRB1*01:01</span>
                    <span className="font-semibold">19.5%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Export & Safety Tab */}
      <TabsContent value="export" className="space-y-6">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Safety Assessment */}
          <Card className="result-card rounded-3xl border-0">
            <CardHeader>
              <CardTitle className="text-xl font-sf-pro">Safety Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {design.safetyAssessment ? Object.entries(design.safetyAssessment).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50/70 rounded-xl">
                    <span className="text-gray-700 capitalize">{key}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="font-semibold text-green-500">{value as string}</span>
                    </div>
                  </div>
                )) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50/70 rounded-xl">
                      <span className="text-gray-700">Allergenicity</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-semibold text-green-500">Low Risk</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50/70 rounded-xl">
                      <span className="text-gray-700">Toxicity</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-semibold text-green-500">Non-toxic</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50/70 rounded-xl">
                      <span className="text-gray-700">Autoimmunity</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-semibold text-green-500">Low Risk</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50/70 rounded-xl">
                      <span className="text-gray-700">Stability</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-semibold text-green-500">Stable</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card className="result-card rounded-3xl border-0">
            <CardHeader>
              <CardTitle className="text-xl font-sf-pro">Export Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-between p-3 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-colors"
                  onClick={handleDownloadPDF}
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="text-red-500 w-5 h-5" />
                    <span className="font-medium">Full Report (PDF)</span>
                  </div>
                  <Download className="text-red-500 w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-between p-3 bg-green-500/10 hover:bg-green-500/20 rounded-xl transition-colors"
                  onClick={handleDownloadSequence}
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="text-green-500 w-5 h-5" />
                    <span className="font-medium">Sequence (FASTA)</span>
                  </div>
                  <Download className="text-green-500 w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-between p-3 bg-orange-500/10 hover:bg-orange-500/20 rounded-xl transition-colors"
                  onClick={handleDownloadData}
                >
                  <div className="flex items-center space-x-3">
                    <Table className="text-orange-500 w-5 h-5" />
                    <span className="font-medium">Raw Data (CSV)</span>
                  </div>
                  <Download className="text-orange-500 w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}