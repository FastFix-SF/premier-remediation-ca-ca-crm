import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FolderOpen, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BulkProjectImporterProps {
  quoteId: string;
}

interface ProjectFile {
  file: File;
  type: 'image';
  category?: string;
}

export function BulkProjectImporter({ quoteId }: BulkProjectImporterProps) {
  const [folderName, setFolderName] = useState('');
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const { toast } = useToast();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp']
    },
    onDrop: (acceptedFiles) => {
      const categorized = acceptedFiles.map(file => ({
        file,
        type: 'image' as const,
        category: categorizeImageByName(file.name)
      }));
      setFiles(prev => [...prev, ...categorized]);
      toast({
        title: "Images Added",
        description: `${acceptedFiles.length} images ready to process`,
      });
    }
  });

  const categorizeImageByName = (filename: string): string => {
    const lower = filename.toLowerCase();
    if (lower.includes('sketch')) return 'sketch_report';
    if (lower.includes('estimate')) return 'estimate';
    if (lower.includes('material')) return 'material_order';
    if (lower.includes('labor')) return 'labor_report';
    if (lower.includes('contract')) return 'contract';
    if (lower.includes('roof') || lower.includes('photo')) return 'roof_photo';
    return 'other';
  };

  const processFiles = async () => {
    if (!folderName.trim()) {
      toast({
        title: "Project Name Required",
        description: "Please enter a project/folder name",
        variant: "destructive"
      });
      return;
    }

    if (files.length === 0) {
      toast({
        title: "No Files",
        description: "Please add files to process",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setResults([]);

    try {
      // Upload files to storage first
      const uploadedFiles = await uploadFiles();
      
      // Process in batches for better performance
      const batchSize = 3;
      const batches = [];
      for (let i = 0; i < uploadedFiles.length; i += batchSize) {
        batches.push(uploadedFiles.slice(i, i + batchSize));
      }

      let processedCount = 0;
      const allResults = [];

      for (const batch of batches) {
        const batchPromises = batch.map(file => 
          processFile(file.url, file.type, file.category, file.name)
        );
        
        const batchResults = await Promise.allSettled(batchPromises);
        allResults.push(...batchResults);
        
        processedCount += batch.length;
        setProgress((processedCount / uploadedFiles.length) * 100);
      }

      setResults(allResults);
      
      const successful = allResults.filter(r => r.status === 'fulfilled').length;
      toast({
        title: "Processing Complete",
        description: `Successfully processed ${successful} of ${allResults.length} files`,
      });
      
      setFiles([]);
    } catch (error) {
      console.error('Error processing files:', error);
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process files",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const uploadFiles = async () => {
    const uploadPromises = files.map(async ({ file, type, category }) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${quoteId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('training-data')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('training-data')
        .getPublicUrl(fileName);

      return { url: publicUrl, type, category, name: file.name };
    });

    return Promise.all(uploadPromises);
  };

  const processFile = async (fileUrl: string, fileType: string, category: string, fileName: string) => {
    const { data, error } = await supabase.functions.invoke('process-project-training', {
      body: {
        fileUrl,
        fileType,
        category,
        fileName,
        quoteId
      }
    });

    if (error) throw error;
    return data;
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">📦 Project Training Import</h3>
          <p className="text-sm text-muted-foreground">
            Add screenshots of your project documents (sketch reports, estimates, etc.)
          </p>
          <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-2 font-medium">
            💡 Tip: Take screenshots of PDF pages for best results
          </p>
        </div>

        {/* Folder Name Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Project Folder Name</label>
          <input
            type="text"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="e.g., 123 Main St - Roof Replacement 2024"
            className="w-full px-3 py-2 rounded-md border border-input bg-background"
            disabled={isProcessing}
          />
        </div>

        {/* File Upload Area */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          } ${!folderName.trim() ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            {isDragActive ? (
              <Upload className="w-8 h-8 text-primary animate-bounce" />
            ) : (
              <FolderOpen className="w-8 h-8 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium text-sm">Drop images here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">
                Screenshots of: Sketch Reports, Estimates, Contracts, Material Orders, Photos
              </p>
            </div>
          </div>
        </div>

        {/* Files List */}
        {files.length > 0 && (
          <div className="space-y-2 border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium">{folderName || 'Project Files'}</p>
                <p className="text-xs text-muted-foreground">{files.length} files</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFiles([])}
                disabled={isProcessing}
              >
                Clear All
              </Button>
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-xs p-1 rounded hover:bg-muted">
                  <span className="truncate flex-1">{f.file.name}</span>
                  {f.category !== 'other' && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-primary/20 text-primary shrink-0">
                      {f.category.replace('_', ' ')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Processing files...</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Processing Results:</h4>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {results.map((result, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {result.status === 'fulfilled' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-destructive" />
                  )}
                  <span className="text-muted-foreground">
                    File {i + 1}: {result.status === 'fulfilled' ? 'Success' : 'Failed'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={processFiles}
          disabled={!folderName.trim() || files.length === 0 || isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing {files.length} files...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Import Project
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
