import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Star, ExternalLink, ArrowRight, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReviewPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  rating: number;
  projectId?: string;
}

export default function ReviewPromptModal({ 
  isOpen, 
  onClose, 
  rating, 
  projectId
}: ReviewPromptModalProps) {
  const [currentStep, setCurrentStep] = useState<'intro' | 'google' | 'yelp' | 'complete' | 'mug-offer' | 'gift-accepted'>('intro');
  const [completedReviews, setCompletedReviews] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  
  const googleReviewUrl = "https://g.page/r/CR9CtPcwM9h8EAI/review";
  const yelpReviewUrl = "https://www.yelp.com/writeareview/biz/KhPXt_NOkqUQ02pTpQFvGA?return_url=%2Fbiz%2FKhPXt_NOkqUQ02pTpQFvGA&review_origin=biz-details-war-button";

  const saveMugRequest = async (mugAccepted: boolean) => {
    if (!projectId) return;

    try {
      // First fetch the project address
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('address')
        .eq('id', projectId)
        .maybeSingle();

      if (projectError || !project?.address) {
        console.error('Error fetching project:', projectError);
        toast({
          title: "Error",
          description: "Could not find project address. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Insert mug request with project address
      const { error } = await supabase
        .from('mug_requests')
        .insert({
          project_address: project.address,
          mug_accepted: mugAccepted
        } as any);

      if (error) {
        console.error('Error saving mug request:', error);
        toast({
          title: "Error",
          description: "Failed to save your response. Please try again.",
          variant: "destructive",
        });
      } else {
        if (mugAccepted) {
          setCurrentStep('gift-accepted');
        } else {
          setCurrentStep('complete');
        }
      }
    } catch (error) {
      console.error('Error saving mug request:', error);
      toast({
        title: "Error", 
        description: "Failed to save your response. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openReviewPopup = (url: string, platform: string) => {
    const popup = window.open(
      url, 
      `${platform}Review`,
      'width=600,height=800,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,directories=no,status=no'
    );
    
    if (popup) {
      // Center the popup
      const left = (screen.width / 2) - (600 / 2);
      const top = (screen.height / 2) - (800 / 2);
      popup.moveTo(left, top);
    }
    
    setCompletedReviews(prev => new Set(prev).add(platform));
    
    if (platform === 'google') {
      setCurrentStep('yelp');
    } else if (platform === 'yelp') {
      // Check if both reviews are completed for mug offer
      const newCompletedReviews = new Set(completedReviews).add(platform);
      if (newCompletedReviews.size === 2) {
        setCurrentStep('mug-offer');
      } else {
        setCurrentStep('complete');
      }
    }
  };

  const handleClose = () => {
    setCurrentStep('intro');
    setCompletedReviews(new Set());
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-xl font-bold">Thanks for the {rating}-star rating!</span>
              <div className="flex">
                {[...Array(rating)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 fill-orange-400 text-orange-400" />
                ))}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        {/* Progress Indicator */}
        {currentStep !== 'intro' && currentStep !== 'complete' && (
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                currentStep === 'google' || completedReviews.has('google') 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {completedReviews.has('google') ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <span className={`text-sm font-medium ${
                currentStep === 'google' ? 'text-blue-600' : 'text-gray-500'
              }`}>
                Google
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 mx-2" />
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                currentStep === 'yelp' || completedReviews.has('yelp')
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {completedReviews.has('yelp') ? <Check className="w-4 h-4" /> : '2'}
              </div>
              <span className={`text-sm font-medium ${
                currentStep === 'yelp' ? 'text-red-600' : 'text-gray-500'
              }`}>
                Yelp
              </span>
            </div>
          </div>
        )}

        <div className="text-center space-y-6">
          {/* Intro Step */}
          {currentStep === 'intro' && (
            <>
              <p className="text-muted-foreground text-lg">
                Would you mind sharing your experience with others?
              </p>
              <p className="text-sm text-muted-foreground">
                We'll guide you through both Google and Yelp reviews to help other customers find us.
              </p>
              
              <Button
                onClick={() => setCurrentStep('google')}
                className="w-full h-14 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <div className="flex items-center justify-center gap-3">
                  <span>Start Review Process</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              </Button>
            </>
          )}

          {/* Google Review Step */}
          {currentStep === 'google' && (
            <>
              <div className="space-y-2">
                <p className="text-lg font-semibold">Step 1: Google Review</p>
                <p className="text-muted-foreground">
                  Let's start with Google - this helps us appear in local searches.
                </p>
              </div>
              
              <Button
                onClick={() => openReviewPopup(googleReviewUrl, 'google')}
                className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <div className="flex items-center justify-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">G</span>
                  </div>
                  <span>Open Google Review</span>
                  <ExternalLink className="w-5 h-5" />
                </div>
              </Button>
              
              <Button
                onClick={() => setCurrentStep('yelp')}
                variant="ghost"
                className="w-full text-muted-foreground hover:text-foreground"
              >
                Skip to Yelp
              </Button>
            </>
          )}

          {/* Yelp Review Step */}
          {currentStep === 'yelp' && (
            <>
              <div className="space-y-2">
                <p className="text-lg font-semibold">
                  {completedReviews.has('google') ? "Almost done! " : ""}Step 2: Yelp Review
                </p>
                <p className="text-muted-foreground">
                  {completedReviews.has('google') 
                    ? "Great job! Now let's add a Yelp review to complete the process."
                    : "Yelp reviews help customers make informed decisions about our services."
                  }
                </p>
              </div>
              
              <Button
                onClick={() => openReviewPopup(yelpReviewUrl, 'yelp')}
                className="w-full h-14 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <div className="flex items-center justify-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-bold text-sm">Y</span>
                  </div>
                  <span>Open Yelp Review</span>
                  <ExternalLink className="w-5 h-5" />
                </div>
              </Button>
              
              <Button
                onClick={() => setCurrentStep('complete')}
                variant="ghost"
                className="w-full text-muted-foreground hover:text-foreground"
              >
                Finish later
              </Button>
            </>
          )}

          {/* Mug Offer Step - Only shown if both reviews completed */}
          {currentStep === 'mug-offer' && (
            <>
              <div className="space-y-4">
                <div className="w-32 h-32 mx-auto mb-4 rounded-lg overflow-hidden shadow-lg">
                  <img 
                    src="/lovable-uploads/6b68b6af-3575-4b37-adb9-6055892de22e.png" 
                    alt="Roofing Mug Gift" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Image failed to load:', e);
                      e.currentTarget.style.display = 'none';
                    }}
                    onLoad={() => console.log('Image loaded successfully')}
                  />
                </div>
                <div className="space-y-3">
                  <p className="text-xl font-bold text-primary">We really appreciate this!</p>
                  <p className="text-muted-foreground text-base leading-relaxed">
                    We want to send you our roofing mug to couple with your amazing home! 
                    Click on accept and we'll send it to the address on file.
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <Button
                  onClick={() => saveMugRequest(true)}
                  className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  Yes, I'd love a mug! 🎁
                </Button>
                <Button
                  onClick={() => saveMugRequest(false)}
                  variant="ghost"
                  className="w-full text-muted-foreground hover:text-foreground"
                >
                  No thanks
                </Button>
              </div>
            </>
          )}

          {/* Gift Accepted Step */}
          {currentStep === 'gift-accepted' && (
            <>
              <div className="space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <div className="space-y-3">
                  <p className="text-xl font-bold text-green-600">Gift Accepted!</p>
                  <p className="text-muted-foreground text-center leading-relaxed">
                    We'll start the shipping process to the property on file. 
                    Have a blessed day and week from your Roofing Friend!
                  </p>
                </div>
              </div>
              
              <Button
                onClick={handleClose}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold"
              >
                Close
              </Button>
            </>
          )}

          {/* Complete Step */}
          {currentStep === 'complete' && (
            <>
              <div className="space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <div className="space-y-2">
                  <p className="text-xl font-bold text-green-600">Thank You!</p>
                  <p className="text-muted-foreground">
                    {completedReviews.size === 2 
                      ? "You've completed both reviews! Your feedback means the world to us and we hope you enjoy your gift!"
                      : completedReviews.size === 1
                      ? "Thanks for leaving a review! Every review helps us serve customers better."
                      : "Thanks for considering leaving a review. We appreciate you!"
                    }
                  </p>
                </div>
              </div>
              
              <Button
                onClick={handleClose}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold"
              >
                Close
              </Button>
            </>
          )}

          {/* Always show close option for intro step */}
          {currentStep === 'intro' && (
            <Button
              onClick={handleClose}
              variant="ghost"
              className="w-full text-muted-foreground hover:text-foreground mt-4"
            >
              Maybe later
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}