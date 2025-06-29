import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Settings, Check, Clock, Loader2 } from "lucide-react";
import ProcessingPipeline from "@/components/ProcessingPipeline";

export default function ProcessingPage() {
  const [location, setLocation] = useLocation();
  const designId = location.split('/')[2];

  const { data: design, refetch } = useQuery({
    queryKey: [`/api/vaccine-designs/${designId}`],
    refetchInterval: 2000,
    enabled: !!designId,
  });

  useEffect(() => {
    if (design?.status === 'completed') {
      setTimeout(() => {
        setLocation(`/results/${designId}`);
      }, 1000);
    }
  }, [design?.status, designId, setLocation]);

  if (!design) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <section className="animate-fade-in">
      <div className="max-w-4xl mx-auto px-6">
        
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-3xl mb-6 animate-pulse">
            <Settings className="text-white w-8 h-8" />
          </div>
          <h1 className="text-4xl font-sf-pro font-bold text-gray-800 mb-4">Processing Your Design</h1>
          <p className="text-xl text-gray-600">Our AI is analyzing your sequence and generating optimized vaccine candidates</p>
        </div>

        <ProcessingPipeline design={design} />

        {/* Processing Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="glass-card rounded-2xl p-6 text-center">
            <div className="text-3xl font-bold text-blue-500 mb-2">127</div>
            <div className="text-gray-600">Epitopes Identified</div>
          </div>
          <div className="glass-card rounded-2xl p-6 text-center">
            <div className="text-3xl font-bold text-green-500 mb-2">43</div>
            <div className="text-gray-600">HLA Alleles Tested</div>
          </div>
          <div className="glass-card rounded-2xl p-6 text-center">
            <div className="text-3xl font-bold text-orange-500 mb-2">
              {Math.floor((Date.now() - new Date(design.createdAt).getTime()) / 1000)}s
            </div>
            <div className="text-gray-600">Processing Time</div>
          </div>
        </div>

      </div>
    </section>
  );
}
