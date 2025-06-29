import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { TrendingUp, Shield, Users, Dna, CheckCircle, Copy, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ResultsDisplay from "@/components/ResultsDisplay";

export default function ResultsPage() {
  const [location, setLocation] = useLocation();
  const designId = location.split('/')[2];

  const { data: design } = useQuery({
    queryKey: [`/api/vaccine-designs/${designId}`],
    enabled: !!designId,
  });

  if (!design || design.status !== 'completed') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-xl text-gray-600">Loading results...</div>
        </div>
      </div>
    );
  }

  const startNewAnalysis = () => {
    setLocation('/');
  };

  return (
    <section className="animate-fade-in">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-3xl mb-6 animate-bounce-gentle">
            <TrendingUp className="text-white w-8 h-8" />
          </div>
          <h1 className="text-4xl font-sf-pro font-bold text-gray-800 mb-4">Vaccine Design Results</h1>
          <p className="text-xl text-gray-600">Comprehensive analysis and optimized vaccine candidates</p>
        </div>

        {/* Results Summary Cards */}
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6 mb-8">
          <div className="result-card rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Shield className="text-green-500 w-6 h-6" />
            </div>
            <div className="text-2xl font-bold text-gray-800 mb-1">
              {(design.antigenicityScore * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Antigenicity Score</div>
          </div>
          <div className="result-card rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Users className="text-blue-500 w-6 h-6" />
            </div>
            <div className="text-2xl font-bold text-gray-800 mb-1">
              {(design.populationCoverage * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Population Coverage</div>
          </div>
          <div className="result-card rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Dna className="text-orange-500 w-6 h-6" />
            </div>
            <div className="text-2xl font-bold text-gray-800 mb-1">{design.epitopeCount}</div>
            <div className="text-sm text-gray-600">Selected Epitopes</div>
          </div>
          <div className="result-card rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="text-purple-500 w-6 h-6" />
            </div>
            <div className="text-2xl font-bold text-gray-800 mb-1">
              {(design.safetyScore * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Safety Score</div>
          </div>
        </div>

        <ResultsDisplay design={design} onNewAnalysis={startNewAnalysis} />

      </div>
    </section>
  );
}
