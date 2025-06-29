import { Check, Clock, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { VaccineDesign } from "@shared/schema";

interface ProcessingPipelineProps {
  design: VaccineDesign;
}

export default function ProcessingPipeline({ design }: ProcessingPipelineProps) {
  const steps = [
    {
      title: "Sequence Analysis",
      description: "Analyzing viral genome structure and identifying key regions",
      progress: design.progress >= 20 ? 100 : (design.progress / 20) * 100,
      status: design.progress >= 20 ? 'complete' : design.progress > 0 ? 'processing' : 'queued'
    },
    {
      title: "Epitope Prediction",
      description: "Identifying T-cell and B-cell epitopes using ML models",
      progress: design.progress >= 40 ? 100 : design.progress > 20 ? ((design.progress - 20) / 20) * 100 : 0,
      status: design.progress >= 40 ? 'complete' : design.progress > 20 ? 'processing' : 'queued'
    },
    {
      title: "HLA Binding Simulation",
      description: "Predicting MHC Class I and II binding affinities",
      progress: design.progress >= 60 ? 100 : design.progress > 40 ? ((design.progress - 40) / 20) * 100 : 0,
      status: design.progress >= 60 ? 'complete' : design.progress > 40 ? 'processing' : 'queued'
    },
    {
      title: "Vaccine Construction",
      description: "Assembling multi-epitope construct with linkers",
      progress: design.progress >= 80 ? 100 : design.progress > 60 ? ((design.progress - 60) / 20) * 100 : 0,
      status: design.progress >= 80 ? 'complete' : design.progress > 60 ? 'processing' : 'queued'
    },
    {
      title: "Sequence Optimization",
      description: "Codon optimization and safety analysis",
      progress: design.progress >= 100 ? 100 : design.progress > 80 ? ((design.progress - 80) / 20) * 100 : 0,
      status: design.progress >= 100 ? 'complete' : design.progress > 80 ? 'processing' : 'queued'
    }
  ];

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <Check className="text-white w-5 h-5" />;
      case 'processing':
        return <Loader2 className="text-white w-5 h-5 animate-spin" />;
      default:
        return <Clock className="text-white w-5 h-5" />;
    }
  };

  const getStepClasses = (status: string) => {
    switch (status) {
      case 'complete':
        return "bg-green-500/10 border-green-500";
      case 'processing':
        return "bg-blue-500/10 border-blue-500";
      default:
        return "bg-gray-100 border-gray-300";
    }
  };

  const getIconBg = (status: string) => {
    switch (status) {
      case 'complete':
        return "bg-green-500";
      case 'processing':
        return "bg-blue-500";
      default:
        return "bg-gray-300";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'complete':
        return "Complete";
      case 'processing':
        return "Processing...";
      default:
        return "Queued";
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'complete':
        return "text-green-500";
      case 'processing':
        return "text-blue-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="glass-card rounded-3xl p-8 mb-8">
      <div className="space-y-6">
        {steps.map((step, index) => (
          <div key={index} className={`processing-step flex items-center space-x-4 p-4 rounded-xl border-l-4 ${getStepClasses(step.status)}`}>
            <div className="flex-shrink-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getIconBg(step.status)}`}>
                {getStepIcon(step.status)}
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800">{step.title}</h3>
              <p className="text-sm text-gray-600">{step.description}</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    step.status === 'complete' ? 'bg-green-500' : 
                    step.status === 'processing' ? 'bg-blue-500 progress-shimmer' : 'bg-gray-300'
                  }`}
                  style={{ width: `${step.progress}%` }}
                />
              </div>
            </div>
            <span className={`font-semibold ${getStatusTextColor(step.status)}`}>
              {getStatusText(step.status)}
            </span>
          </div>
        ))}
      </div>
      
      {/* Overall Progress */}
      <div className="mt-8 p-4 bg-gray-50/50 rounded-xl">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium text-gray-800">Overall Progress</span>
          <span className="text-blue-500 font-semibold">{design.progress}%</span>
        </div>
        <Progress value={design.progress} className="h-3" />
      </div>
    </div>
  );
}
