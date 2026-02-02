import React, { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, Link, CheckCircle2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';

interface SubmitProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (proofUrl: string, proofDescription: string) => void;
}

export const SubmitProofModal: React.FC<SubmitProofModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [loading, setLoading] = useState(false);
  const [proofUrl, setProofUrl] = useState('');
  const [proofDescription, setProofDescription] = useState('');
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setLoading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `proofs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('task-proofs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('task-proofs')
        .getPublicUrl(filePath);

      setUploadedFile(publicUrl);
      setProofUrl(publicUrl);
      toast.success('File uploaded successfully');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleSubmit = () => {
    if (!proofUrl.trim() && !uploadedFile) {
      toast.error('Please provide proof URL or upload a file');
      return;
    }

    onSubmit(proofUrl || uploadedFile || '', proofDescription);
    resetForm();
  };

  const handleSkip = () => {
    onSubmit('', '');
    resetForm();
  };

  const resetForm = () => {
    setProofUrl('');
    setProofDescription('');
    setUploadedFile(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-slate-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            Complete Subtask
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Add proof of completion (optional but recommended)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Upload Zone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-indigo-500 bg-indigo-500/10'
                : uploadedFile
                ? 'border-green-500 bg-green-500/10'
                : 'border-white/20 hover:border-white/40'
            }`}
          >
            <input {...getInputProps()} />
            {uploadedFile ? (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
                <p className="text-sm text-green-400">File uploaded</p>
                <p className="text-xs text-white/40 truncate max-w-full">
                  {uploadedFile.split('/').pop()}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-white/40" />
                <p className="text-sm text-white/60">
                  {isDragActive ? 'Drop file here' : 'Drag & drop or click to upload'}
                </p>
                <p className="text-xs text-white/40">
                  Images or PDFs up to 10MB
                </p>
              </div>
            )}
          </div>

          <div className="text-center text-white/40 text-sm">or</div>

          {/* URL Input */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Link className="w-4 h-4" />
              Proof URL
            </Label>
            <Input
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="https://..."
              className="bg-white/5 border-white/10 text-white"
              disabled={!!uploadedFile}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={proofDescription}
              onChange={(e) => setProofDescription(e.target.value)}
              placeholder="Describe what was done..."
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t border-white/10">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-white/60"
          >
            Skip (No Proof)
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} className="text-white/60">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-gradient-to-r from-green-500 to-emerald-500"
            >
              {loading ? 'Uploading...' : 'Complete'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
