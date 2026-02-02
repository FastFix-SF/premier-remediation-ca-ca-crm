import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, ImageIcon, Loader2 } from "lucide-react";
import { FUNCTIONS_BASE } from "@/lib/functionsBase";

interface ImageTrainingImporterProps {
  quoteId?: string;
}

export function ImageTrainingImporter({ quoteId }: ImageTrainingImporterProps) {
  const [images, setImages] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    
    if (imageFiles.length !== files.length) {
      toast.warning('Only image files are supported');
    }
    
    setImages(prev => [...prev, ...imageFiles]);
    toast.success(`Added ${imageFiles.length} image${imageFiles.length > 1 ? 's' : ''}`);
  };

  const processImages = async () => {
    if (images.length === 0) {
      toast.error("Please select images first");
      return;
    }

    setIsProcessing(true);
    setProgress({ current: 0, total: images.length });
    let successCount = 0;

    try {
      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        setProgress({ current: i + 1, total: images.length });
        
        toast.loading(`Processing image ${i + 1}/${images.length}: ${file.name}`, { 
          id: 'process-image' 
        });

        try {
          // Convert image to base64
          const base64 = await fileToBase64(file);
          
          // Call AI vision to extract roof lines from the image
          const response = await fetch(`${FUNCTIONS_BASE}/ai-roof-prediction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageUrl: base64,
              quoteId: quoteId,
              latitude: 0, // Not used for training extraction
              longitude: 0,
              existingLines: [],
              extractTrainingOnly: true // Signal to extract lines from annotated image
            })
          });

          if (!response.ok) {
            throw new Error(`AI vision failed: ${response.status}`);
          }

          const { lines } = await response.json();

          if (lines && lines.length > 0) {
            // Save extracted lines as training data
            const records = lines.map((line: any) => ({
              quote_id: quoteId || null,
              edge_type: line.edgeType || 'EAVE',
              start_lat: line.start[1],
              start_lon: line.start[0],
              end_lat: line.end[1],
              end_lon: line.end[0],
              length_ft: line.length,
              angle_degrees: line.angle || 0,
              line_geometry: {
                type: 'LineString',
                coordinates: [line.start, line.end]
              },
              notes: `Extracted from inspection photo: ${file.name}`,
            }));

            const { error } = await supabase
              .from('edge_training_data')
              .insert(records);

            if (error) throw error;

            successCount += records.length;
            toast.success(`✓ ${file.name}: ${records.length} lines`, { id: 'process-image' });
          } else {
            toast.warning(`⊘ ${file.name}: No roof lines detected`, { id: 'process-image' });
          }
        } catch (error: any) {
          console.error(`Error processing ${file.name}:`, error);
          toast.error(`✗ ${file.name}: ${error.message}`, { id: 'process-image' });
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      toast.success(`✅ Imported ${successCount} training examples from ${images.length} images`, {
        id: 'process-image'
      });
      
      setImages([]);
      setProgress({ current: 0, total: 0 });
    } catch (error: any) {
      console.error('Batch processing error:', error);
      toast.error(`Processing failed: ${error.message}`, { id: 'process-image' });
    } finally {
      setIsProcessing(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Image Training Import
        </CardTitle>
        <CardDescription>
          Upload inspection photos with roof lines already drawn. AI will extract the lines as training data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
          <input
            type="file"
            id="training-images"
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            disabled={isProcessing}
          />
          <label htmlFor="training-images" className="cursor-pointer">
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">Click to select images</p>
            <p className="text-xs text-muted-foreground mt-1">
              JPG, PNG with roof lines visible
            </p>
          </label>
        </div>

        {images.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">
              {images.length} image{images.length > 1 ? 's' : ''} ready
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {images.map((img, idx) => (
                <div key={idx} className="text-xs text-muted-foreground flex items-center gap-2">
                  <ImageIcon className="h-3 w-3" />
                  {img.name}
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImages([])}
              disabled={isProcessing}
              className="w-full"
            >
              Clear All
            </Button>
          </div>
        )}

        <Button
          onClick={processImages}
          disabled={isProcessing || images.length === 0}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing {progress.current}/{progress.total}...
            </>
          ) : (
            <>
              <ImageIcon className="mr-2 h-4 w-4" />
              Extract Training Data
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Upload photos with roof lines already drawn (like RoofSnap exports)</p>
          <p>• AI vision will detect and extract the roof edge lines</p>
          <p>• Extracted lines become training data for better predictions</p>
          <p>• Process up to 20 images at once</p>
        </div>
      </CardContent>
    </Card>
  );
}
