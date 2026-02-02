import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SubContract, useSubContractFiles, SubContractFile } from "@/hooks/useSubContracts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, File, Trash2, Download, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface SubContractFilesTabProps {
  subContract: SubContract;
}

export function SubContractFilesTab({ subContract }: SubContractFilesTabProps) {
  const queryClient = useQueryClient();
  const { data: files = [], isLoading } = useSubContractFiles(subContract.id);
  const [uploading, setUploading] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${subContract.id}/${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('sub-contract-files')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('sub-contract-files')
        .getPublicUrl(fileName);
      
      const { error: dbError } = await supabase
        .from('sub_contract_files')
        .insert([{
          sub_contract_id: subContract.id,
          file_name: file.name,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size,
        }]);
      
      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-contract-files', subContract.id] });
      toast.success('File uploaded');
    },
    onError: (error) => {
      toast.error('Failed to upload file');
      console.error(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (file: SubContractFile) => {
      const { error } = await supabase
        .from('sub_contract_files')
        .delete()
        .eq('id', file.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-contract-files', subContract.id] });
      toast.success('File deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete file');
      console.error(error);
    },
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    for (const file of acceptedFiles) {
      await uploadMutation.mutateAsync(file);
    }
    setUploading(false);
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <File className="w-4 h-4" />
        Files
      </h3>

      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
        `}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-lg border-2 border-dashed border-muted-foreground/50 flex items-center justify-center">
              <Plus className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              {isDragActive ? 'Drop files here' : 'Click or drag files to upload'}
            </p>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : files.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No files uploaded</p>
      ) : (
        <div className="grid gap-2">
          {files.map((file) => (
            <Card key={file.id} className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <File className="w-8 h-8 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">{file.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.file_size)} • {format(new Date(file.uploaded_at), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => window.open(file.file_url, '_blank')}
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMutation.mutate(file)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
