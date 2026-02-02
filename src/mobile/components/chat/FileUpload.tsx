import React, { useState, useRef } from 'react';
import { Upload, X, File, Image, Video, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface FileUploadProps {
  onFileUploaded: (fileUrl: string, fileName: string, fileType: string, fileSize?: number) => void;
  onCancel: () => void;
  channelId: string;
}

interface UploadFile {
  file: File;
  preview?: string;
  progress: number;
  uploaded: boolean;
  error?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileUploaded,
  onCancel,
  channelId
}) => {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (type.startsWith('video/')) return <Video className="w-5 h-5" />;
    if (type.includes('pdf') || type.includes('document')) return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const getFilePreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        resolve(undefined);
      }
    });
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    const newFiles: UploadFile[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const preview = await getFilePreview(file);
      
      newFiles.push({
        file,
        preview,
        progress: 0,
        uploaded: false,
      });
    }

    setUploadFiles(prev => [...prev, ...newFiles]);

    // Start uploading files
    newFiles.forEach(uploadFile => {
      uploadFileToStorage(uploadFile);
    });
  };

  const uploadFileToStorage = async (uploadFile: UploadFile) => {
    try {
      const fileName = `${Date.now()}_${uploadFile.file.name}`;
      const filePath = `chat-files/${channelId}/${fileName}`;

      // Update progress
      setUploadFiles(prev => prev.map(f => 
        f.file === uploadFile.file 
          ? { ...f, progress: 10 }
          : f
      ));

      const { data, error } = await supabase.storage
        .from('project-photos')
        .upload(filePath, uploadFile.file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Update progress
      setUploadFiles(prev => prev.map(f => 
        f.file === uploadFile.file 
          ? { ...f, progress: 70 }
          : f
      ));

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('project-photos')
        .getPublicUrl(filePath);

      // Update progress to complete
      setUploadFiles(prev => prev.map(f => 
        f.file === uploadFile.file 
          ? { ...f, progress: 100, uploaded: true }
          : f
      ));

      // Notify parent component
      onFileUploaded(urlData.publicUrl, uploadFile.file.name, uploadFile.file.type, uploadFile.file.size);

    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadFiles(prev => prev.map(f => 
        f.file === uploadFile.file 
          ? { ...f, error: 'Upload failed', progress: 0 }
          : f
      ));
    }
  };

  const removeFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-4 space-y-4">
      {/* File Drop Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/30 hover:border-primary/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          Drop files here or click to browse
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Images, videos, documents up to 10MB each
        </p>
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
        >
          Select Files
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,.pdf,.doc,.docx,.txt"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>

      {/* File List */}
      {uploadFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">
            Files ({uploadFiles.length})
          </h4>
          {uploadFiles.map((uploadFile, index) => (
            <Card key={index} className="p-3">
              <div className="flex items-center space-x-3">
                {/* File Preview/Icon */}
                <div className="flex-shrink-0">
                  {uploadFile.preview ? (
                    <img
                      src={uploadFile.preview}
                      alt={uploadFile.file.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                      {getFileIcon(uploadFile.file.type)}
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {uploadFile.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(uploadFile.file.size)}
                  </p>
                  
                  {/* Progress Bar */}
                  {!uploadFile.uploaded && !uploadFile.error && (
                    <Progress value={uploadFile.progress} className="mt-1 h-1" />
                  )}
                  
                  {/* Status */}
                  {uploadFile.uploaded && (
                    <p className="text-xs text-green-600 mt-1">✓ Uploaded</p>
                  )}
                  
                  {uploadFile.error && (
                    <p className="text-xs text-red-600 mt-1">✗ {uploadFile.error}</p>
                  )}
                </div>

                {/* Remove Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1"
                  onClick={() => removeFile(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={onCancel}
          disabled={uploadFiles.some(f => !f.uploaded && !f.error)}
        >
          Done
        </Button>
      </div>
    </div>
  );
};