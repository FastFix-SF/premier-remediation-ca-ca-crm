import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Mic, Square, Loader2, Check, ChevronRight, WifiOff, Image as ImageIcon, Plus } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useMobilePhotoUpload, useMobilePhotoUpdateCaption, useMobilePhotoUpdateRecommendation } from '@/mobile/hooks/useMobilePhotos';
import { MobilePhotoEditor } from '@/mobile/components/MobilePhotoEditor';
import { offlineQueue } from '@/lib/offline-queue';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProjectPhotoCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onPhotoUploaded?: () => void;
}

type FlowStep = 'capture' | 'rapid-capture' | 'confirm-done' | 'edit' | 'recap';

interface SessionPhoto {
  id: string;
  previewUrl: string;
  caption?: string;
  recommendation?: string;
  offlineNotesSaved?: boolean;
  offlineRecommendationSaved?: boolean;
}

export const ProjectPhotoCaptureModal: React.FC<ProjectPhotoCaptureModalProps> = ({
  isOpen,
  onClose,
  projectId,
  onPhotoUploaded
}) => {
  const [currentStep, setCurrentStep] = useState<FlowStep>('capture');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [totalToUpload, setTotalToUpload] = useState(0);

  // Rapid capture & recap state
  const [sessionUploadedPhotos, setSessionUploadedPhotos] = useState<SessionPhoto[]>([]);
  const [recapIndex, setRecapIndex] = useState(0);
  const [recapField, setRecapField] = useState<'notes' | 'recommendation'>('notes');
  const [currentRecapNote, setCurrentRecapNote] = useState('');
  const [currentRecapRecommendation, setCurrentRecapRecommendation] = useState('');
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  
  const { toast } = useToast();
  const { t } = useLanguage();
  const uploadPhotoMutation = useMobilePhotoUpload();
  const updateCaptionMutation = useMobilePhotoUpdateCaption();
  const updateRecommendationMutation = useMobilePhotoUpdateRecommendation();

  // Handle camera capture (single photo)
  const handleCameraSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await uploadSinglePhoto(file);
    
    // Reset input
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  // Handle gallery selection (multiple photos)
  const handleGallerySelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    setTotalToUpload(fileArray.length);
    setUploadProgress(0);
    setIsUploading(true);

    try {
      for (let i = 0; i < fileArray.length; i++) {
        await uploadSinglePhoto(fileArray[i]);
        setUploadProgress(i + 1);
      }
    } finally {
      setIsUploading(false);
      setTotalToUpload(0);
      setUploadProgress(0);
    }

    // Reset input
    if (galleryInputRef.current) {
      galleryInputRef.current.value = '';
    }
  };

  // Upload a single photo
  const uploadSinglePhoto = async (file: File) => {
    setIsUploading(true);
    
    try {
      let photoResult;
      
      if (navigator.onLine) {
        // Upload immediately without caption/recommendation
        photoResult = await uploadPhotoMutation.mutateAsync({
          projectId,
          file,
        });
        
        // Add to session photos for recap
        const previewUrl = URL.createObjectURL(file);
        setSessionUploadedPhotos(prev => [...prev, {
          id: photoResult.id,
          previewUrl,
        }]);
      } else {
        // Add to offline queue
        await offlineQueue.addPhotoToQueue(projectId, file, '');
        toast({
          title: "Photo Queued",
          description: "Photo queued for upload when online.",
        });
      }

      // Move to rapid-capture mode
      setCurrentStep('rapid-capture');
      
    } catch (error) {
      console.error('Failed to upload photo:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload photo.",
        variant: "destructive"
      });
    } finally {
      if (totalToUpload === 0) {
        setIsUploading(false);
      }
    }
  };

  const handleStartCamera = () => {
    cameraInputRef.current?.click();
  };

  const handleStartGallery = () => {
    galleryInputRef.current?.click();
  };

  const handleDoneCapturing = () => {
    if (sessionUploadedPhotos.length > 0) {
      // Go to confirm-done step
      setCurrentStep('confirm-done');
    } else {
      handleClose();
    }
  };

  const handleAddMorePhotos = () => {
    setCurrentStep('rapid-capture');
  };

  const handleStartRecap = () => {
    if (sessionUploadedPhotos.length > 0) {
      // Reset recap state
      setRecapIndex(0);
      setRecapField('notes');
      setCurrentRecapNote('');
      setCurrentRecapRecommendation('');
      setCurrentStep('recap');
    } else {
      handleClose();
    }
  };

  const handleCancelExit = () => {
    handleClose();
  };

  // Voice recording functions
  const startRecording = async (target: 'notes' | 'recommendation') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        
        // Check if online - if not, queue the voice note for later
        if (!navigator.onLine) {
          await handleOfflineVoiceNote(audioBlob, target);
        } else {
          await transcribeAudio(audioBlob, target);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Microphone access error:', error);
      toast({
        title: "Microphone access denied",
        description: "Please enable microphone access to record voice notes.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Handle offline voice note - queue for later transcription
  const handleOfflineVoiceNote = async (audioBlob: Blob, target: 'notes' | 'recommendation') => {
    const photoId = sessionUploadedPhotos[recapIndex].id;
    
    try {
      await offlineQueue.addVoiceNoteToQueue(photoId, projectId, audioBlob, target);
      
      // Update local state to show saved indicator
      if (target === 'notes') {
        setSessionUploadedPhotos(prev => prev.map((p, i) => 
          i === recapIndex ? { ...p, offlineNotesSaved: true } : p
        ));
        setRecapField('recommendation');
      } else {
        setSessionUploadedPhotos(prev => prev.map((p, i) => 
          i === recapIndex ? { ...p, offlineRecommendationSaved: true } : p
        ));
      }
      
      toast({
        title: t('photo.savedOffline'),
        description: t('photo.voiceNoteQueued'),
      });
      
    } catch (error) {
      console.error('Failed to queue voice note:', error);
      toast({
        title: "Failed to save",
        description: "Could not save voice note for later.",
        variant: "destructive"
      });
    }
  };

  const transcribeAudio = async (audioBlob: Blob, target: 'notes' | 'recommendation') => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(audioBlob);
      const base64Audio = await base64Promise;

      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { audio: base64Audio }
      });

      if (error) throw error;

      const transcribedText = data.text;

      if (target === 'notes') {
        setCurrentRecapNote(transcribedText);
        // Auto-save and move to recommendation
        await handleSaveRecapNote(transcribedText);
      } else {
        setCurrentRecapRecommendation(transcribedText);
        // Auto-save recommendation
        await handleSaveRecapRecommendation(transcribedText);
      }
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: "Transcription failed",
        description: "Please try recording again.",
        variant: "destructive"
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSaveRecapNote = async (text: string) => {
    const photoId = sessionUploadedPhotos[recapIndex].id;
    try {
      await updateCaptionMutation.mutateAsync({ photoId, caption: text });
      setSessionUploadedPhotos(prev => prev.map((p, i) => 
        i === recapIndex ? { ...p, caption: text } : p
      ));
      // Move to recommendation field
      setRecapField('recommendation');
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  };

  const handleSaveRecapRecommendation = async (text: string) => {
    const photoId = sessionUploadedPhotos[recapIndex].id;
    try {
      await updateRecommendationMutation.mutateAsync({ photoId, recommendation: text });
      setSessionUploadedPhotos(prev => prev.map((p, i) => 
        i === recapIndex ? { ...p, recommendation: text } : p
      ));
    } catch (error) {
      console.error('Failed to save recommendation:', error);
    }
  };

  const handleSkipPhoto = () => {
    handleNextPhoto();
  };

  const handleNextPhoto = () => {
    if (recapIndex < sessionUploadedPhotos.length - 1) {
      setRecapIndex(prev => prev + 1);
      setRecapField('notes');
      setCurrentRecapNote('');
      setCurrentRecapRecommendation('');
    } else {
      // Done with all photos
      handleFinishRecap();
    }
  };

  const handleSkipAllNotes = () => {
    handleFinishRecap();
  };

  const handleFinishRecap = () => {
    // Notify parent that photos were uploaded
    if (sessionUploadedPhotos.length > 0) {
      onPhotoUploaded?.();
    }
    handleClose();
  };

  const handleClose = () => {
    // Stop any active recording
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Clean up session photos
    sessionUploadedPhotos.forEach(photo => {
      URL.revokeObjectURL(photo.previewUrl);
    });
    
    // Reset all state
    setSelectedFile(null);
    setSessionUploadedPhotos([]);
    setRecapIndex(0);
    setRecapField('notes');
    setCurrentRecapNote('');
    setCurrentRecapRecommendation('');
    setCurrentStep('capture');
    setIsUploading(false);
    setIsRecording(false);
    setIsTranscribing(false);
    setUploadProgress(0);
    setTotalToUpload(0);
    onClose();
  };

  // Handle edit flow (for single photo with annotations)
  const handleEditPhoto = () => {
    if (selectedFile) {
      setCurrentStep('edit');
    }
  };

  const handleSaveAnnotatedPhoto = async (annotatedFile: File) => {
    setIsUploading(true);
    try {
      const photoResult = await uploadPhotoMutation.mutateAsync({
        projectId,
        file: annotatedFile,
      });
      
      const previewUrl = URL.createObjectURL(annotatedFile);
      setSessionUploadedPhotos(prev => [...prev, {
        id: photoResult.id,
        previewUrl,
      }]);
      
      setSelectedFile(null);
      setCurrentStep('rapid-capture');
      
      // Auto-trigger camera for next photo
      setTimeout(() => {
        if (cameraInputRef.current) {
          cameraInputRef.current.value = '';
          cameraInputRef.current.click();
        }
      }, 300);
    } catch (error) {
      console.error('Failed to upload annotated photo:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload photo.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelEdit = () => {
    setSelectedFile(null);
    setCurrentStep('rapid-capture');
  };

  // Photo Editor Step
  if (currentStep === 'edit' && selectedFile) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="p-0 max-w-full h-screen max-h-screen border-0 rounded-none bg-background">
          <MobilePhotoEditor imageFile={selectedFile} onSave={handleSaveAnnotatedPhoto} onCancel={handleCancelEdit} />
        </DialogContent>
      </Dialog>
    );
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 'capture': return t('photo.addPhotos');
      case 'rapid-capture': return t('photo.rapidCapture');
      case 'confirm-done': return t('photo.confirmDone');
      case 'recap': return `${t('photo.photoOf')} ${recapIndex + 1}/${sessionUploadedPhotos.length}`;
      default: return 'Upload Photo';
    }
  };

  const currentPhoto = sessionUploadedPhotos[recapIndex];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="p-0 max-w-full h-screen max-h-screen border-0 rounded-none bg-background [&>button]:hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border bg-background/95 backdrop-blur-sm shrink-0 relative z-50">
            <Button 
              type="button"
              variant="ghost" 
              size="sm" 
              className="min-h-[44px] min-w-[44px] touch-manipulation pointer-events-auto"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (currentStep === 'recap') {
                  handleSkipAllNotes();
                } else {
                  handleClose();
                }
              }}
            >
              <X className="w-5 h-5 mr-1" />
              <span className="text-sm">{currentStep === 'recap' ? t('photo.skipAllNotes') : t('common.cancel')}</span>
            </Button>
            <h2 className="text-base sm:text-lg font-semibold text-foreground">{getStepTitle()}</h2>
            <div className="w-16 sm:w-20" />
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Initial Capture Step */}
            {currentStep === 'capture' && (
              <div className="p-4 space-y-4 h-full flex flex-col justify-center">
                <div className="text-center space-y-4">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 sm:p-8 text-center">
                    <Camera className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                      {t('photo.tapToContinue')}
                    </p>
                  </div>

                  {/* Camera Button */}
                  <Button 
                    type="button"
                    onClick={handleStartCamera} 
                    size="lg" 
                    className="min-h-[56px] w-full touch-manipulation"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    {t('photo.takePhoto')}
                  </Button>

                  {/* Gallery Button */}
                  <Button 
                    type="button"
                    onClick={handleStartGallery} 
                    variant="outline"
                    size="lg" 
                    className="min-h-[56px] w-full touch-manipulation"
                  >
                    <ImageIcon className="w-5 h-5 mr-2" />
                    {t('photo.chooseFromGallery')}
                  </Button>
                </div>

                {/* Hidden file inputs */}
                <input 
                  ref={cameraInputRef} 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  onChange={handleCameraSelect} 
                  className="hidden" 
                />
                <input 
                  ref={galleryInputRef} 
                  type="file" 
                  accept="image/*" 
                  multiple
                  onChange={handleGallerySelect} 
                  className="hidden" 
                />
              </div>
            )}

            {/* Rapid Capture Step - Shows counter and last photo thumbnail */}
            {currentStep === 'rapid-capture' && (
              <div className="p-4 space-y-6 h-full flex flex-col justify-center">
                {/* Counter */}
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
                    <Check className="w-5 h-5" />
                    <span className="text-lg font-semibold">
                      {sessionUploadedPhotos.length} {t('photo.photosUploaded')}
                    </span>
                  </div>
                </div>

                {/* Last uploaded photo thumbnail */}
                {sessionUploadedPhotos.length > 0 && (
                  <div className="flex justify-center">
                    <div className="grid grid-cols-3 gap-2 max-w-[280px]">
                      {sessionUploadedPhotos.slice(-3).map((photo, index) => (
                        <div key={photo.id} className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border-2 border-primary/20">
                          <img 
                            src={photo.previewUrl} 
                            alt={`Photo ${index + 1}`} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Loading indicator */}
                {isUploading && (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    {totalToUpload > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Uploading {uploadProgress} of {totalToUpload}...
                      </p>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="space-y-3">
                  <Button 
                    type="button"
                    onClick={handleStartCamera} 
                    size="lg" 
                    className="w-full min-h-[56px] touch-manipulation"
                    disabled={isUploading}
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    {t('photo.takeAnotherPhoto')}
                  </Button>

                  <Button 
                    type="button"
                    onClick={handleStartGallery} 
                    variant="outline"
                    size="lg" 
                    className="w-full min-h-[56px] touch-manipulation"
                    disabled={isUploading}
                  >
                    <ImageIcon className="w-5 h-5 mr-2" />
                    {t('photo.chooseFromGallery')}
                  </Button>
                  
                  <Button 
                    type="button"
                    onClick={handleDoneCapturing} 
                    variant="secondary" 
                    size="lg" 
                    className="w-full min-h-[56px] touch-manipulation"
                    disabled={isUploading}
                  >
                    <Check className="w-5 h-5 mr-2" />
                    {t('photo.doneCapturing')} ({sessionUploadedPhotos.length})
                  </Button>
                </div>

                {/* Hidden file inputs */}
                <input 
                  ref={cameraInputRef} 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  onChange={handleCameraSelect} 
                  className="hidden" 
                />
                <input 
                  ref={galleryInputRef} 
                  type="file" 
                  accept="image/*" 
                  multiple
                  onChange={handleGallerySelect} 
                  className="hidden" 
                />
              </div>
            )}

            {/* Confirm Done Step */}
            {currentStep === 'confirm-done' && (
              <div className="p-4 space-y-6 h-full flex flex-col justify-center">
                {/* Photo count summary */}
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-6 py-3 rounded-full">
                    <Check className="w-6 h-6" />
                    <span className="text-xl font-bold">
                      {sessionUploadedPhotos.length} {t('photo.photosUploaded')}
                    </span>
                  </div>
                  <p className="text-muted-foreground">
                    {t('photo.confirmDoneQuestion')}
                  </p>
                </div>

                {/* Photo thumbnails */}
                {sessionUploadedPhotos.length > 0 && (
                  <div className="flex justify-center">
                    <div className="grid grid-cols-4 gap-2 max-w-[320px]">
                      {sessionUploadedPhotos.slice(-8).map((photo, index) => (
                        <div key={photo.id} className="w-16 h-16 rounded-lg overflow-hidden border-2 border-primary/20">
                          <img 
                            src={photo.previewUrl} 
                            alt={`Photo ${index + 1}`} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Cards */}
                <div className="space-y-3">
                  {/* Add More Photos */}
                  <button
                    type="button"
                    onClick={handleAddMorePhotos}
                    className="w-full p-4 rounded-xl border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors flex items-center gap-4 touch-manipulation min-h-[72px]"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <Plus className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-foreground">{t('photo.addMorePhotos')}</p>
                      <p className="text-sm text-muted-foreground">{t('photo.addMorePhotosDesc')}</p>
                    </div>
                  </button>

                  {/* Done - Start Recap */}
                  <button
                    type="button"
                    onClick={handleStartRecap}
                    className="w-full p-4 rounded-xl border-2 border-accent/30 bg-accent/10 hover:bg-accent/20 transition-colors flex items-center gap-4 touch-manipulation min-h-[72px]"
                  >
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                      <Mic className="w-6 h-6 text-accent-foreground" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-foreground">{t('photo.startRecap')}</p>
                      <p className="text-sm text-muted-foreground">{t('photo.startRecapDesc')}</p>
                    </div>
                  </button>

                  {/* Cancel & Exit */}
                  <button
                    type="button"
                    onClick={handleCancelExit}
                    className="w-full p-4 rounded-xl border-2 border-muted hover:bg-muted/50 transition-colors flex items-center gap-4 touch-manipulation min-h-[72px]"
                  >
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <X className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-foreground">{t('photo.cancelExit')}</p>
                      <p className="text-sm text-muted-foreground">{t('photo.cancelExitDesc')}</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Recap Step - Large photo with voice notes */}
            {currentStep === 'recap' && sessionUploadedPhotos.length > 0 && currentPhoto && (
              <div className="flex flex-col h-full">
                {/* Header with counter */}
                <div className="text-center py-2 sm:py-3 shrink-0">
                  <p className="text-sm text-muted-foreground">
                    {t('photo.recapTitle')}
                  </p>
                  {/* Progress dots */}
                  <div className="flex justify-center gap-1.5 mt-2">
                    {sessionUploadedPhotos.map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-2 h-2 rounded-full transition-colors ${
                          i === recapIndex 
                            ? 'bg-primary' 
                            : i < recapIndex 
                              ? 'bg-primary/40' 
                              : 'bg-muted-foreground/20'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Large Photo - takes up most of screen */}
                <div className="px-3 sm:px-4 shrink-0">
                  <div className="relative w-full rounded-xl overflow-hidden border-2 border-primary/20 bg-muted/10" style={{ height: '40vh', maxHeight: '350px' }}>
                    <img 
                      src={currentPhoto.previewUrl} 
                      alt={`Photo ${recapIndex + 1}`} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                {/* Voice Notes Section */}
                <div className="flex-1 px-3 sm:px-4 py-3 sm:py-4 space-y-3 overflow-y-auto">
                  {/* Offline indicator */}
                  {!navigator.onLine && (
                    <div className="flex items-center justify-center gap-2 text-warning bg-warning/10 rounded-lg p-2 text-sm">
                      <WifiOff className="w-4 h-4" />
                      <span>{t('photo.voiceNoteQueued')}</span>
                    </div>
                  )}

                  <Card className={`border-2 ${recapField === 'notes' ? 'border-primary/40 bg-primary/5' : 'border-muted'}`}>
                    <CardContent className="pt-4 sm:pt-6 text-center space-y-3 sm:space-y-4">
                      <p className="text-base sm:text-lg font-medium text-foreground">
                        {t('photo.whatSeeing')}
                      </p>

                      {recapField === 'notes' && !currentPhoto.offlineNotesSaved && (
                        <>
                          {/* Recording Button */}
                          <Button
                            type="button"
                            size="lg"
                            variant={isRecording ? "destructive" : "default"}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full touch-manipulation"
                            onClick={isRecording ? stopRecording : () => startRecording('notes')}
                            disabled={isTranscribing}
                          >
                            {isRecording ? (
                              <Square className="w-6 h-6 sm:w-8 sm:h-8" />
                            ) : isTranscribing ? (
                              <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin" />
                            ) : (
                              <Mic className="w-6 h-6 sm:w-8 sm:h-8" />
                            )}
                          </Button>

                          {isRecording && (
                            <p className="text-sm text-destructive animate-pulse">{t('photo.recording')}</p>
                          )}

                          {isTranscribing && (
                            <p className="text-sm text-muted-foreground">{t('photo.transcribing')}</p>
                          )}
                        </>
                      )}

                      {/* Show offline saved indicator */}
                      {currentPhoto.offlineNotesSaved && (
                        <div className="flex items-center justify-center gap-2 text-accent-foreground bg-accent/20 rounded-lg p-3">
                          <Check className="w-5 h-5" />
                          <span className="font-medium">{t('photo.savedOffline')}</span>
                        </div>
                      )}

                      {/* Show transcribed/saved text */}
                      {(currentPhoto.caption || currentRecapNote) && (
                        <div className="bg-background rounded-lg p-2 sm:p-3 text-left border">
                          <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">{t('photo.notes')}</p>
                          <p className="text-xs sm:text-sm text-foreground">{currentPhoto.caption || currentRecapNote}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Recommendation section - only show after notes done */}
                  {recapField === 'recommendation' && (
                    <Card className="border-2 border-accent/40 bg-accent/5">
                      <CardContent className="pt-4 sm:pt-6 text-center space-y-3 sm:space-y-4">
                        <p className="text-base sm:text-lg font-medium text-foreground">
                          {t('photo.whatRecommendation')}
                        </p>

                        {!currentPhoto.offlineRecommendationSaved && (
                          <>
                            {/* Recording Button */}
                            <Button
                              type="button"
                              size="lg"
                              variant={isRecording ? "destructive" : "default"}
                              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full touch-manipulation"
                              onClick={isRecording ? stopRecording : () => startRecording('recommendation')}
                              disabled={isTranscribing}
                            >
                              {isRecording ? (
                                <Square className="w-6 h-6 sm:w-8 sm:h-8" />
                              ) : isTranscribing ? (
                                <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin" />
                              ) : (
                                <Mic className="w-6 h-6 sm:w-8 sm:h-8" />
                              )}
                            </Button>

                            {isRecording && (
                              <p className="text-sm text-destructive animate-pulse">{t('photo.recording')}</p>
                            )}

                            {isTranscribing && (
                              <p className="text-sm text-muted-foreground">{t('photo.transcribing')}</p>
                            )}
                          </>
                        )}

                        {/* Show offline saved indicator */}
                        {currentPhoto.offlineRecommendationSaved && (
                          <div className="flex items-center justify-center gap-2 text-accent-foreground bg-accent/20 rounded-lg p-3">
                            <Check className="w-5 h-5" />
                            <span className="font-medium">{t('photo.savedOffline')}</span>
                          </div>
                        )}

                        {/* Show transcribed/saved text */}
                        {(currentPhoto.recommendation || currentRecapRecommendation) && (
                          <div className="bg-background rounded-lg p-2 sm:p-3 text-left border">
                            <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">{t('photo.recommendation')}</p>
                            <p className="text-xs sm:text-sm text-foreground">{currentPhoto.recommendation || currentRecapRecommendation}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Navigation */}
                <div className="px-3 sm:px-4 pb-4 sm:pb-6 pt-2 flex gap-2 sm:gap-3 shrink-0 border-t border-border bg-background">
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={handleSkipPhoto} 
                    className="flex-1 min-h-[48px] touch-manipulation"
                    disabled={isRecording || isTranscribing}
                  >
                    {t('photo.skip')}
                  </Button>
                  <Button 
                    type="button"
                    onClick={handleNextPhoto} 
                    disabled={isRecording || isTranscribing} 
                    className="flex-1 min-h-[48px] touch-manipulation"
                  >
                    {recapIndex < sessionUploadedPhotos.length - 1 ? (
                      <>
                        {t('photo.nextPhoto')}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        {t('photo.finish')}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
