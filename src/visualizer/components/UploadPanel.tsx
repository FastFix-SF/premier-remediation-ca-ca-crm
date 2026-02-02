import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Image, FileImage } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UploadPanelProps {
  onImageUpload: (file: File) => void;
  loading?: boolean;
}

export const UploadPanel = ({ onImageUpload, loading = false }: UploadPanelProps) => {
  const { toast } = useToast();
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, or WebP image.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (12MB limit)
    if (file.size > 12 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 12MB.",
        variant: "destructive"
      });
      return;
    }

    onImageUpload(file);
  }, [onImageUpload, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxFiles: 1,
    disabled: loading,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
    onDropAccepted: () => setDragActive(false),
    onDropRejected: () => setDragActive(false)
  });

  const loadDemoImage = () => {
    // Create a demo image (placeholder)
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d')!;
    
    // Draw a simple house shape
    ctx.fillStyle = 'hsl(var(--muted))';
    ctx.fillRect(0, 0, 800, 600);
    
    // House body
    ctx.fillStyle = 'hsl(var(--card))';
    ctx.fillRect(200, 300, 400, 250);
    
    // Roof
    ctx.fillStyle = 'hsl(var(--accent))';
    ctx.beginPath();
    ctx.moveTo(150, 300);
    ctx.lineTo(400, 150);
    ctx.lineTo(650, 300);
    ctx.closePath();
    ctx.fill();
    
    // Convert to blob and create file
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'demo-house.png', { type: 'image/png' });
        onImageUpload(file);
      }
    }, 'image/png');
  };

  return (
    <div className="space-y-4">
      <Card className={`transition-colors ${dragActive ? 'border-primary bg-primary/5' : ''}`}>
        <CardContent className="p-8">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors duration-200
              ${isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
              }
              ${loading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            <div className="flex flex-col items-center space-y-4">
              {isDragActive ? (
                <FileImage className="h-12 w-12 text-primary" />
              ) : (
                <Upload className="h-12 w-12 text-muted-foreground" />
              )}
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  {isDragActive ? 'Drop your image here' : 'Upload your house photo'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Drag and drop or click to select • JPEG, PNG, WebP • Max 12MB
                </p>
              </div>

              {!isDragActive && (
                <Button 
                  variant="outline" 
                  disabled={loading}
                  className="mt-4"
                >
                  <Image className="mr-2 h-4 w-4" />
                  Choose Image
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button 
          variant="ghost" 
          onClick={loadDemoImage}
          disabled={loading}
          className="text-sm"
        >
          Try with demo image
        </Button>
      </div>
    </div>
  );
};