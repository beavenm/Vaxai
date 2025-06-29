import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Microscope } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import { apiRequest } from "@/lib/queryClient";

export default function InputPage() {
  const [, setLocation] = useLocation();

  const createDesignMutation = useMutation({
    mutationFn: async (data: {
      file?: File;
      sequence?: string;
      name: string;
      targetPopulation: string;
      vaccineType: string;
    }) => {
      const formData = new FormData();
      
      if (data.file) {
        formData.append('file', data.file);
      }
      
      formData.append('name', data.name);
      formData.append('targetPopulation', data.targetPopulation);
      formData.append('vaccineType', data.vaccineType);
      formData.append('sequenceType', 'protein');
      
      if (data.sequence) {
        formData.append('inputSequence', data.sequence);
      }

      const res = await fetch('/api/vaccine-designs', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!res.ok) {
        throw new Error(`${res.status}: ${await res.text()}`);
      }
      
      return res.json();
    },
    onSuccess: (design) => {
      setLocation(`/processing/${design.id}`);
    },
  });

  return (
    <section className="animate-fade-in">
      <div className="max-w-4xl mx-auto px-6">
        
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl mb-6 animate-bounce-gentle">
            <Microscope className="text-white w-8 h-8" />
          </div>
          <h1 className="text-5xl font-sf-pro font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
            AI-Powered Vaccine Design
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Upload your viral genome or protein sequence to generate optimized multi-epitope vaccine candidates with advanced immunoinformatics.
          </p>
        </div>

        <FileUpload 
          onSubmit={(data) => createDesignMutation.mutate(data)}
          isLoading={createDesignMutation.isPending}
        />

      </div>
    </section>
  );
}
