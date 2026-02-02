import React, { useState, useRef, useEffect } from 'react';
import { Check, Sparkles, Copy } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SmartReviewCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueToReview: (comment: string) => void;
  projectId: string;
}

const EMOTION_CHIPS = [
  "Amazing", "Relieved", "Proud", "Happy", 
  "Impressed", "Safe", "Excited", "Thankful"
];

const SmartReviewCommentModal = ({ 
  isOpen, 
  onClose, 
  onContinueToReview, 
  projectId 
}: SmartReviewCommentModalProps) => {
  const [comment, setComment] = useState('');
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [reviewStep, setReviewStep] = useState(1); // 1: Google, 2: Yelp, 3: Thank You
  const copyButtonRef = useRef<HTMLButtonElement>(null);
  const ctaButtonsRef = useRef<HTMLDivElement>(null);

  // localStorage helpers
  const saveProgress = () => {
    const progress = {
      comment,
      copied,
      currentStep,
      reviewStep,
      selectedEmotions,
      googleCompleted: reviewStep >= 2,
      yelpCompleted: reviewStep >= 3
    };
    localStorage.setItem(`review_progress_${projectId}`, JSON.stringify(progress));
  };

  const loadProgress = () => {
    try {
      const saved = localStorage.getItem(`review_progress_${projectId}`);
      if (saved) {
        const progress = JSON.parse(saved);
        setComment(progress.comment || '');
        setSelectedEmotions(progress.selectedEmotions || []);
        setCopied(progress.copied || false);
        setCurrentStep(progress.currentStep || 1);
        setReviewStep(progress.reviewStep || 1);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const clearProgress = () => {
    localStorage.removeItem(`review_progress_${projectId}`);
  };

  // Load progress when modal opens
  useEffect(() => {
    if (isOpen) {
      loadProgress();
    }
  }, [isOpen, projectId]);

  const handleEmotionToggle = (emotion: string) => {
    setSelectedEmotions(prev => {
      const newEmotions = prev.includes(emotion) 
        ? prev.filter(e => e !== emotion)
        : prev.length < 3 ? [...prev, emotion] : prev;
      
      if (newEmotions.length > 0 && currentStep === 1) {
        setCurrentStep(2);
        setTimeout(saveProgress, 100); // Save after state updates
      }
      return newEmotions;
    });
  };

  const generateReviewFromEmotions = async () => {
    if (selectedEmotions.length === 0) {
      toast.error('Please select at least one emotion');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-review-comment', {
        body: { emotions: selectedEmotions }
      });

      if (error) throw error;
      setComment(data.review);
      setCurrentStep(3);
      setTimeout(saveProgress, 100); // Save after state updates
    } catch (error) {
      console.error('Error generating review:', error);
      toast.error('Failed to generate review. Please write your own comment.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateSurpriseReview = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-review-comment', {
        body: { surpriseMe: true }
      });

      if (error) throw error;
      setComment(data.review);
      setCurrentStep(3);
      setTimeout(saveProgress, 100); // Save after state updates
    } catch (error) {
      console.error('Error generating surprise review:', error);
      toast.error('Failed to generate review. Please write your own comment.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyComment = async () => {
    if (!comment.trim()) return;

    try {
      await navigator.clipboard.writeText(comment);
      setCopied(true);
      setReviewStep(1); // Start review flow with Google
      
      // Auto-scroll to CTA buttons after copying
      setTimeout(() => {
        ctaButtonsRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 500);
      
      setTimeout(() => setCopied(false), 5000);
      saveProgress();
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value);
    if (e.target.value.trim() && currentStep < 3) {
      setCurrentStep(3);
    }
    setTimeout(saveProgress, 300); // Save after typing pause
  };

  const openGoogleReview = () => {
    window.open('https://g.page/r/CR9CtPcwM9h8EAE/review', '_blank');
    setReviewStep(2); // Move to Yelp step
    setTimeout(saveProgress, 100); // Save after state updates
  };

  const openYelpReview = () => {
    window.open('https://www.yelp.com/writeareview/biz/KhPXt_NOkqUQ02pTpQFvGA?return_url=%2Fbiz%2FKhPXt_NOkqUQ02pTpQFvGA&review_origin=biz-details-war-button', '_blank');
    setReviewStep(3); // Move to Thank You step
    setTimeout(saveProgress, 100); // Save after state updates
  };

  // Clear progress when thank you step is reached
  useEffect(() => {
    if (reviewStep === 3 && copied) {
      setTimeout(clearProgress, 2000); // Clear after 2 seconds of showing thank you
    }
  }, [reviewStep, copied]);


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[95vh] overflow-y-auto p-6 text-center">
        {/* Ultra-Minimal Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6">
            Review us in less than one minute with AI! 🚀
          </h1>
          
          {/* Simple Step Tracker */}
          <div className="flex items-center justify-center gap-8 text-2xl font-bold">
            {copied ? (
              <>
                <span className={reviewStep >= 1 ? 'text-primary' : 'text-muted-foreground'}>1</span>
                <span className={reviewStep >= 2 ? 'text-primary' : 'text-muted-foreground'}>2</span>
                <span className={reviewStep >= 3 ? 'text-primary' : 'text-muted-foreground'}>3</span>
              </>
            ) : (
              <>
                <span className={currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}>1</span>
                <span className={currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}>2</span>
                <span className={currentStep >= 3 ? 'text-primary' : 'text-muted-foreground'}>3</span>
              </>
            )}
          </div>
        </div>

        {/* Step 1: Emotion Selection */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {EMOTION_CHIPS.map((emotion) => (
                <Button
                  key={emotion}
                  variant={selectedEmotions.includes(emotion) ? "default" : "outline"}
                  className="h-16 sm:h-20 text-base sm:text-lg font-semibold hover:scale-105 transition-all duration-200"
                  onClick={() => handleEmotionToggle(emotion)}
                >
                  {emotion}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Review Generation */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            <Button
              onClick={generateReviewFromEmotions}
              disabled={selectedEmotions.length === 0 || isGenerating}
              size="lg"
              className="w-full h-16 text-lg font-bold hover:scale-105 transition-transform duration-200"
            >
              {isGenerating ? 'Generating...' : '✨ Generate Your Review from Emotions'}
            </Button>
            
            <Button
              onClick={generateSurpriseReview}
              disabled={isGenerating}
              variant="outline"
              size="lg"
              className="w-full h-12 text-base hover:scale-105 transition-transform duration-200"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Surprise Me!
            </Button>

            {comment && (
              <div className="space-y-3">
                <Textarea
                  value={comment}
                  onChange={handleCommentChange}
                  className="min-h-[120px] text-left"
                />
                <p className="text-sm text-muted-foreground">(Edit if you like!)</p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Copy & Share */}
        {currentStep === 3 && comment.trim() && (
          <div className="space-y-6 animate-fade-in">
            {comment && !copied && (
              <div className="space-y-3 mb-6">
                <Textarea
                  value={comment}
                  onChange={handleCommentChange}
                  className="min-h-[120px] text-left"
                />
                <p className="text-sm text-muted-foreground">(Edit if you like!)</p>
              </div>
            )}
            
            <Button
              ref={copyButtonRef}
              onClick={handleCopyComment}
              size="lg"
              className={`w-full h-16 text-lg font-bold transition-all duration-300 ${!copied ? 'bg-accent hover:bg-accent/90' : 'bg-green-600 hover:bg-green-700'} hover:scale-105`}
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Copied! ✨
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 mr-2" />
                  📋 Copy Review
                </>
              )}
            </Button>

            {copied && reviewStep < 3 && (
              <div ref={ctaButtonsRef} className="space-y-4">
                {/* Step 1: Google Review Only */}
                {reviewStep === 1 && (
                  <Button
                    onClick={openGoogleReview}
                    size="lg"
                    variant="outline"
                    className="w-full h-16 text-base font-semibold animate-pulse ring-2 ring-blue-500 ring-opacity-75 shadow-lg shadow-blue-500/25 hover:scale-105 transition-all duration-200"
                  >
                    Google ⭐️
                  </Button>
                )}

                {/* Step 2: Yelp Review Only */}
                {reviewStep === 2 && (
                  <div className="space-y-4">
                    <Button
                      onClick={openGoogleReview}
                      size="lg"
                      variant="outline"
                      className="w-full h-16 text-base font-semibold bg-green-50 border-green-300 text-green-700"
                      disabled
                    >
                      Google ⭐️ ✓
                    </Button>
                    <Button
                      onClick={openYelpReview}
                      size="lg"
                      variant="outline"
                      className="w-full h-16 text-base font-semibold animate-pulse ring-2 ring-red-500 ring-opacity-75 shadow-lg shadow-red-500/25 hover:scale-105 transition-all duration-200"
                    >
                      Yelp ⭐️
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Thank You */}
            {reviewStep === 3 && (
              <div className="space-y-4 animate-fade-in">
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🌟</div>
                  <h3 className="text-xl font-bold text-primary">
                    Thank you! You helped us grow 🌟
                  </h3>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SmartReviewCommentModal;