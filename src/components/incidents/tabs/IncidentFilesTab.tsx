import { useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, File, Trash2, Image } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useIncidentFiles } from '@/hooks/useIncidents';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface IncidentFilesTabProps {
  incidentId: string;
}

export function IncidentFilesTab({ incidentId }: IncidentFilesTabProps) {
  const { data: files = [], isLoading } = useIncidentFiles(incidentId);
  const queryClient = useQueryClient();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      try {
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `incident-files/${incidentId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('project-files')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('project-files')
          .getPublicUrl(filePath);

        const { error: insertError } = await supabase
          .from('incident_files')
          .insert({
            incident_id: incidentId,
            file_name: file.name,
            file_url: urlData.publicUrl,
            file_type: file.type,
            file_size: file.size,
          });

        if (insertError) throw insertError;

        toast.success(`${file.name} uploaded successfully`);
      } catch (error) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    queryClient.invalidateQueries({ queryKey: ['incident-files', incidentId] });
  }, [incidentId, queryClient]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleDelete = async (fileId: string) => {
    try {
      const { error } = await supabase
        .from('incident_files')
        .delete()
        .eq('id', fileId);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['incident-files', incidentId] });
      toast.success('File deleted');
    } catch (error) {
      toast.error('Failed to delete file');
    }
  };

  const isImage = (type: string | null) => type?.startsWith('image/');

  return (
    <div className="space-y-4 py-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {isDragActive ? 'Drop files here...' : 'Drag & drop files or click to upload'}
            </p>
          </div>

          {isLoading ? (
            <div className="mt-4 text-center text-muted-foreground">Loading files...</div>
          ) : files.length > 0 ? (
            <div className="mt-4 grid gap-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg group"
                >
                  {isImage(file.file_type) ? (
                    <Image className="h-5 w-5 text-blue-500" />
                  ) : (
                    <File className="h-5 w-5 text-muted-foreground" />
                  )}
                  <a 
                    href={file.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 text-sm hover:underline truncate"
                  >
                    {file.file_name}
                  </a>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDelete(file.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 text-center text-muted-foreground text-sm">
              No files uploaded yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
