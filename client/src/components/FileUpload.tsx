import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface FileUploadProps {
  onSubmit: (data: {
    file?: File;
    sequence?: string;
    name: string;
    targetPopulation: string;
    vaccineType: string;
  }) => void;
  isLoading?: boolean;
}

export default function FileUpload({ onSubmit, isLoading }: FileUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [sequence, setSequence] = useState("");
  const [name, setName] = useState("");
  const [targetPopulation, setTargetPopulation] = useState("Global Population");
  const [vaccineType, setVaccineType] = useState("Multi-epitope");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setUploadedFile(file);
      if (!name) {
        setName(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  }, [name]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.fasta', '.gb', '.gbk', '.txt'],
      'application/octet-stream': ['.fasta', '.gb', '.gbk']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: false,
  });

  const removeFile = () => {
    setUploadedFile(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = () => {
    if (!uploadedFile && !sequence.trim()) {
      alert('Please upload a file or enter a sequence');
      return;
    }
    
    if (!name.trim()) {
      alert('Please enter a name for your vaccine design');
      return;
    }

    onSubmit({
      file: uploadedFile || undefined,
      sequence: sequence.trim() || undefined,
      name,
      targetPopulation,
      vaccineType,
    });
  };

  return (
    <div className="glass-card rounded-3xl p-8 mb-8 animate-slide-up">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-sf-pro font-semibold text-gray-800 mb-2">Upload Sequence Data</h2>
        <p className="text-gray-600">Supported formats: FASTA, GenBank (.fasta, .gb, .gbk)</p>
      </div>
      
      {/* Drag & Drop Zone */}
      <div
        {...getRootProps()}
        className={`drag-drop-zone rounded-2xl p-12 text-center mb-6 cursor-pointer hover:bg-blue-500/5 transition-all duration-300 ${
          isDragActive ? 'drag-over' : ''
        }`}
      >
        <input {...getInputProps()} />
        <div className="mb-4">
          <Upload className="w-16 h-16 text-blue-500/60 mx-auto mb-4" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          {isDragActive ? 'Drop files here' : 'Drop files here or click to browse'}
        </h3>
        <p className="text-gray-500 mb-4">Maximum file size: 50MB</p>
        <div className="flex justify-center space-x-4">
          <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-sm">.fasta</span>
          <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-sm">.gb</span>
          <span className="px-3 py-1 bg-orange-500/10 text-orange-500 rounded-full text-sm">.gbk</span>
        </div>
      </div>
      
      {/* File Info Display */}
      {uploadedFile && (
        <div className="bg-gray-50/50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="text-blue-500 w-5 h-5" />
              <div>
                <p className="font-medium text-gray-800">{uploadedFile.name}</p>
                <p className="text-sm text-gray-500">{formatFileSize(uploadedFile.size)}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={removeFile}
              className="text-red-500 hover:bg-red-50"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Direct Text Input */}
      <div className="mb-6">
        <Label className="block text-sm font-medium text-gray-700 mb-2">
          Or paste sequence directly:
        </Label>
        <Textarea 
          className="w-full h-32 p-4 resize-none backdrop-blur-sm bg-white/50" 
          placeholder=">sequence_name&#10;ATGCGATCGATCGATCGATCG..."
          value={sequence}
          onChange={(e) => setSequence(e.target.value)}
        />
      </div>

      {/* Design Name */}
      <div className="mb-6">
        <Label className="block text-sm font-medium text-gray-700 mb-2">
          Design Name *
        </Label>
        <input
          type="text"
          className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70"
          placeholder="Enter a name for your vaccine design"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      
      {/* Advanced Options */}
      <details className="mb-6">
        <summary className="cursor-pointer text-blue-500 font-medium mb-4 flex items-center">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
          </svg>
          Advanced Options
        </summary>
        <div className="grid md:grid-cols-2 gap-4 p-4 bg-gray-50/30 rounded-xl">
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">Target Population</Label>
            <Select value={targetPopulation} onValueChange={setTargetPopulation}>
              <SelectTrigger className="bg-white/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Global Population">Global Population</SelectItem>
                <SelectItem value="North American">North American</SelectItem>
                <SelectItem value="European">European</SelectItem>
                <SelectItem value="Asian">Asian</SelectItem>
                <SelectItem value="African">African</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">Vaccine Type</Label>
            <Select value={vaccineType} onValueChange={setVaccineType}>
              <SelectTrigger className="bg-white/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Multi-epitope">Multi-epitope</SelectItem>
                <SelectItem value="Subunit">Subunit</SelectItem>
                <SelectItem value="DNA Vaccine">DNA Vaccine</SelectItem>
                <SelectItem value="mRNA Vaccine">mRNA Vaccine</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </details>
      
      {/* Generate Button */}
      <Button
        className="glass-button w-full py-4 rounded-2xl text-white font-semibold text-lg shadow-lg"
        onClick={handleSubmit}
        disabled={isLoading}
      >
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2L3 7v11a1 1 0 001 1h3v-5a1 1 0 011-1h4a1 1 0 011 1v5h3a1 1 0 001-1V7l-7-5z"/>
        </svg>
        {isLoading ? 'Processing...' : 'Generate Vaccine Design'}
      </Button>
    </div>
  );
}
