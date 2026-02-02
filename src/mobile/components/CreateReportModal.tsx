import React, { useState, useRef, useEffect } from 'react';
import { X, Mic, Square, Check, ImagePlus, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useMobilePhotos } from '@/mobile/hooks/useMobilePhotos';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

export const CreateReportModal: React.FC<CreateReportModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
}) => {
  const { data: photos = [] } = useMobilePhotos(projectId);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'record' | 'preview'>('select');
  const [isEditingPreview, setIsEditingPreview] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const previewEditRef = useRef<HTMLDivElement>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setSelectedPhotos([]);
      setAudioBlob(null);
      setRecordingTime(0);
      setIsGenerating(false);
      setGeneratedReport(null);
      setStep('select');
      setIsEditingPreview(false);
    }
  }, [isOpen]);

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos(prev => 
      prev.includes(photoId) 
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    );
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const generateReport = async () => {
    if (!audioBlob || selectedPhotos.length === 0) {
      toast.error('Please select photos and record a voice note');
      return;
    }

    setIsGenerating(true);

    try {
      // Convert audio to base64
      const reader = new FileReader();
      const audioBase64 = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      // Get selected photos with metadata (captions)
      const selectedPhotoData = photos
        .filter(p => selectedPhotos.includes(p.id))
        .map(p => ({
          url: p.photo_url,
          caption: p.caption || '',
        }));

      // Fetch comments for selected photos
      const { data: commentsData } = await supabase
        .from('photo_comments')
        .select('photo_id, comment_text')
        .in('photo_id', selectedPhotos);

      // Attach comments to photos
      const photosWithComments = selectedPhotoData.map(photo => {
        const photoComments = commentsData
          ?.filter(c => {
            const matchingPhoto = photos.find(p => p.photo_url === photo.url);
            return matchingPhoto && c.photo_id === matchingPhoto.id;
          })
          .map(c => c.comment_text) || [];
        return { ...photo, comments: photoComments };
      });

      // Call edge function to generate report
      const { data, error } = await supabase.functions.invoke('generate-project-report', {
        body: {
          projectName,
          projectId,
          photos: photosWithComments,
          audioBase64,
        },
      });

      if (error) throw error;

      setGeneratedReport(data.report);
      setStep('preview');
      toast.success('Report generated successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveReport = async () => {
    // Get the content - either from the editable ref (if editing) or the generated report
    const contentToSave = isEditingPreview && previewEditRef.current 
      ? previewEditRef.current.innerHTML 
      : generatedReport;
      
    if (!contentToSave) return;

    try {
      // Create HTML file content
      const reportDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const fileName = `field-report-${Date.now()}.html`;
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Field Report - ${projectName}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
    h2 { color: #1a1a1a; border-bottom: 2px solid #e5e5e5; padding-bottom: 10px; margin-top: 0; }
    h3 { color: #333; margin-top: 24px; }
    .meta { color: #666; margin-bottom: 20px; font-style: italic; }
    img { max-width: 400px; width: 60%; height: auto; border-radius: 8px; margin: 16px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .photo-section { margin: 20px 0; padding: 16px; background: #f9f9f9; border-radius: 12px; }
    .caption { color: #555; font-size: 14px; margin-top: 8px; font-style: italic; }
    .photo-notes { color: #666; font-size: 13px; margin-top: 4px; padding-left: 12px; border-left: 2px solid #ddd; }
    ul { padding-left: 20px; }
    li { margin-bottom: 8px; }
  </style>
</head>
<body>
  ${contentToSave}
</body>
</html>`;

      // Upload HTML file to storage - using project-reports bucket
      const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
      const filePath = `${projectId}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('project-reports')
        .upload(filePath, htmlBlob, {
          contentType: 'text/html',
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('project-reports')
        .getPublicUrl(filePath);

      // Save document record to project_documents
      const { error: dbError } = await supabase
        .from('project_documents')
        .insert({
          project_id: projectId,
          name: `Field Report - ${reportDate}`,
          file_url: urlData.publicUrl,
          file_type: 'text/html',
          category: 'reports',
          description: `Field report with ${selectedPhotos.length} photos`,
        });

      if (dbError) {
        console.error('DB error:', dbError);
        throw dbError;
      }

      toast.success('Report saved successfully!');
      onClose();
    } catch (error: any) {
      console.error('Error saving report:', error);
      toast.error(error.message || 'Failed to save report');
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-xl p-0">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle>
              {step === 'select' && 'Select Photos'}
              {step === 'record' && 'Record Voice Note'}
              {step === 'preview' && 'Report Preview'}
            </SheetTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex flex-col h-[calc(90vh-80px)]">
          {step === 'select' && (
            <>
              <ScrollArea className="flex-1 p-4">
                {photos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <ImagePlus className="h-12 w-12 mb-4" />
                    <p>No photos in this project yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {photos.map((photo) => (
                      <button
                        key={photo.id}
                        onClick={() => togglePhotoSelection(photo.id)}
                        className={cn(
                          "relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
                          selectedPhotos.includes(photo.id)
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-transparent"
                        )}
                      >
                        <img
                          src={photo.photo_url}
                          alt={photo.caption || 'Project photo'}
                          className="w-full h-full object-cover"
                        />
                        {selectedPhotos.includes(photo.id) && (
                          <div className="absolute top-1 right-1 bg-primary rounded-full p-1">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <div className="p-4 border-t">
                <Button
                  className="w-full"
                  disabled={selectedPhotos.length === 0}
                  onClick={() => setStep('record')}
                >
                  Continue with {selectedPhotos.length} photo{selectedPhotos.length !== 1 ? 's' : ''}
                </Button>
              </div>
            </>
          )}

          {step === 'record' && (
            <>
              <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8">
                <div className="text-center space-y-2">
                  <p className="text-lg font-medium">
                    {isRecording ? 'Recording...' : audioBlob ? 'Recording complete' : 'Describe what happened'}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {isRecording 
                      ? 'Tap to stop recording' 
                      : audioBlob 
                        ? 'Tap to re-record or continue' 
                        : 'Talk about the work done, observations, or any notes for the report'}
                  </p>
                </div>

                <div className="text-4xl font-mono text-muted-foreground">
                  {formatTime(recordingTime)}
                </div>

                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={cn(
                    "w-24 h-24 rounded-full flex items-center justify-center transition-all",
                    isRecording 
                      ? "bg-destructive animate-pulse" 
                      : audioBlob 
                        ? "bg-primary/20 border-2 border-primary"
                        : "bg-primary"
                  )}
                >
                  {isRecording ? (
                    <Square className="h-8 w-8 text-destructive-foreground" />
                  ) : (
                    <Mic className={cn("h-10 w-10", audioBlob ? "text-primary" : "text-primary-foreground")} />
                  )}
                </button>

                {audioBlob && !isRecording && (
                  <p className="text-sm text-muted-foreground">
                    Voice note recorded • Tap mic to re-record
                  </p>
                )}
              </div>

              <div className="p-4 border-t flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep('select')}>
                  Back
                </Button>
                <Button 
                  className="flex-1" 
                  disabled={!audioBlob || isGenerating}
                  onClick={generateReport}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Report
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {step === 'preview' && generatedReport && (
            <>
              <ScrollArea className="flex-1 p-4">
                <div className="prose prose-sm max-w-none">
                  {isEditingPreview ? (
                    <div
                      ref={previewEditRef}
                      contentEditable
                      suppressContentEditableWarning
                      className="whitespace-pre-wrap text-foreground border-2 border-primary/20 rounded-lg p-4 outline-none min-h-[200px] focus:border-primary/40"
                      dangerouslySetInnerHTML={{ __html: generatedReport }}
                    />
                  ) : (
                    <div 
                      className="whitespace-pre-wrap text-foreground" 
                      dangerouslySetInnerHTML={{ __html: generatedReport }} 
                    />
                  )}
                </div>
              </ScrollArea>

              <div className="p-4 border-t flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep('record')}>
                  Back
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditingPreview(!isEditingPreview)}
                >
                  {isEditingPreview ? 'Done' : 'Edit'}
                </Button>
                <Button className="flex-1" onClick={handleSaveReport}>
                  Save Report
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
