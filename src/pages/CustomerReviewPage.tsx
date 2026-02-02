import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Check, Copy, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const EMOTION_OPTIONS = [
  { emoji: '🤩', label: 'Amazing', value: 'amazing' },
  { emoji: '😌', label: 'Relieved', value: 'relieved' },
  { emoji: '💪', label: 'Proud', value: 'proud' },
  { emoji: '😊', label: 'Happy', value: 'happy' },
  { emoji: '👏', label: 'Impressed', value: 'impressed' },
  { emoji: '🏠', label: 'Safe', value: 'safe' },
  { emoji: '🎉', label: 'Excited', value: 'excited' },
  { emoji: '🙏', label: 'Thankful', value: 'thankful' },
];

interface ProjectInfo {
  id: string;
  name: string;
  address: string;
  description?: string;
  project_type?: string;
  roof_type?: string;
  client_name?: string;
}

const CustomerReviewPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [generatedReview, setGeneratedReview] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentStep, setCurrentStep] = useState<'emotion' | 'review' | 'share'>('emotion');
  const [reviewStep, setReviewStep] = useState(1); // 1: Google, 2: Yelp, 3: Done
  const ctaButtonsRef = useRef<HTMLDivElement>(null);

  // Fetch project info
  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;
      
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name, address, description, project_type, roof_type, client_name')
          .eq('id', projectId)
          .maybeSingle();

        if (error) throw error;
        setProject(data);
      } catch (error) {
        console.error('Error fetching project:', error);
        toast.error('Could not load project information');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  const handleEmotionSelect = async (emotion: string) => {
    setSelectedEmotion(emotion);
    setIsGenerating(true);
    setCurrentStep('review');

    try {
      // Generate review using project info + emotion
      const { data, error } = await supabase.functions.invoke('generate-review-comment', {
        body: { 
          emotions: [emotion],
          projectInfo: project ? {
            name: project.name,
            address: project.address,
            projectType: project.project_type,
            roofType: project.roof_type,
          } : undefined
        }
      });

      if (error) throw error;
      setGeneratedReview(data.review);
    } catch (error) {
      console.error('Error generating review:', error);
      // Fallback generic review
      setGeneratedReview(`I'm so ${emotion.toLowerCase()} with the work Roofing Friend did on my roof! The team was professional and the results exceeded my expectations. Highly recommend!`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyReview = async () => {
    try {
      await navigator.clipboard.writeText(generatedReview);
      setCopied(true);
      setCurrentStep('share');
      
      setTimeout(() => {
        ctaButtonsRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 300);

      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy review');
    }
  };

  const openGoogleReview = () => {
    window.open('https://g.page/r/CR9CtPcwM9h8EAE/review', '_blank');
    setReviewStep(2);
  };

  const openYelpReview = () => {
    window.open('https://www.yelp.com/writeareview/biz/KhPXt_NOkqUQ02pTpQFvGA?return_url=%2Fbiz%2FKhPXt_NOkqUQ02pTpQFvGA&review_origin=biz-details-war-button', '_blank');
    setReviewStep(3);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-4 sm:p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-4">
          <div className="inline-flex p-3 bg-gradient-to-br from-primary to-accent rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            Review in Under 1 Minute! 🚀
          </h1>
          {project && (
            <p className="text-muted-foreground text-sm">
              {project.name}
              {project.address && <span className="block text-xs mt-1">{project.address}</span>}
            </p>
          )}
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-8 text-2xl font-bold mb-8">
          <span className={currentStep === 'emotion' ? 'text-primary' : 'text-muted-foreground'}>1</span>
          <span className={currentStep === 'review' || currentStep === 'share' ? 'text-primary' : 'text-muted-foreground'}>2</span>
          <span className={currentStep === 'share' ? 'text-primary' : 'text-muted-foreground'}>3</span>
        </div>

        {/* Step 1: Emotion Selection */}
        {currentStep === 'emotion' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-center text-lg font-semibold mb-4">
              How did your new roof make you feel?
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {EMOTION_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-1 text-lg hover:scale-105 hover:border-primary/50 transition-all"
                  onClick={() => handleEmotionSelect(option.label)}
                >
                  <span className="text-2xl">{option.emoji}</span>
                  <span className="font-medium">{option.label}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Generated Review */}
        {currentStep === 'review' && (
          <div className="space-y-6 animate-fade-in">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground">Crafting your perfect review...</p>
              </div>
            ) : (
              <>
                <div className="bg-card rounded-xl p-4 shadow-sm border">
                  <p className="text-foreground leading-relaxed">{generatedReview}</p>
                </div>
                
                <Button
                  onClick={handleCopyReview}
                  size="lg"
                  className={`w-full h-14 text-lg font-bold transition-all ${
                    copied ? 'bg-green-600 hover:bg-green-700' : 'bg-accent hover:bg-accent/90'
                  }`}
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
              </>
            )}
          </div>
        )}

        {/* Step 3: Share on Platforms */}
        {currentStep === 'share' && (
          <div ref={ctaButtonsRef} className="space-y-4 animate-fade-in">
            {reviewStep < 3 ? (
              <>
                {reviewStep === 1 && (
                  <Button
                    onClick={openGoogleReview}
                    size="lg"
                    variant="outline"
                    className="w-full h-16 text-lg font-semibold animate-pulse ring-2 ring-blue-500 ring-opacity-75 shadow-lg shadow-blue-500/25 hover:scale-105 transition-all"
                  >
                    Post on Google ⭐️
                  </Button>
                )}

                {reviewStep === 2 && (
                  <div className="space-y-4">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full h-16 text-lg font-semibold bg-green-50 border-green-300 text-green-700"
                      disabled
                    >
                      Google ⭐️ ✓
                    </Button>
                    <Button
                      onClick={openYelpReview}
                      size="lg"
                      variant="outline"
                      className="w-full h-16 text-lg font-semibold animate-pulse ring-2 ring-red-500 ring-opacity-75 shadow-lg shadow-red-500/25 hover:scale-105 transition-all"
                    >
                      Post on Yelp ⭐️
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 animate-fade-in">
                <div className="text-6xl mb-4">🌟</div>
                <h3 className="text-2xl font-bold text-primary mb-2">
                  Thank You!
                </h3>
                <p className="text-muted-foreground">
                  Your review helps us grow and serve more homeowners like you!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerReviewPage;
