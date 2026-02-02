import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import CustomerStarRating from '@/components/CustomerStarRating';
import ReviewPromptModal from '@/components/ReviewPromptModal';
import CustomerFeedbackForm from '@/components/CustomerFeedbackForm';
import SmartReviewCommentModal from '@/components/SmartReviewCommentModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Heart, Loader2 } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description?: string;
  customer_email: string;
  customer_rating?: number;
  rating_submitted_at?: string;
  address?: string;
}

interface ProjectPhoto {
  id: string;
  photo_url: string;
  caption?: string;
  display_order: number;
}

const CustomerProjectView = () => {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [photos, setPhotos] = useState<ProjectPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentRating, setCurrentRating] = useState<number>(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showSmartCommentModal, setShowSmartCommentModal] = useState(false);

  const fetchProjectData = async () => {
    if (!id) {
      setError('No project ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Starting fetch for project:', id);
      
      // Simple, direct query for public projects
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .eq('is_public', true)
        .maybeSingle();

      console.log('📊 Project result:', { projectData, projectError });

      if (projectError || !projectData) {
        console.error('❌ Project error:', projectError);
        setError('Project not found or not accessible');
        return;
      }

      // Fetch tagged photos
      const { data: photosData } = await supabase
        .from('project_photos')
        .select('*')
        .eq('project_id', id)
        .not('photo_tag', 'is', null)
        .order('display_order');

      console.log('📸 Photos loaded:', photosData?.length || 0);

      setProject(projectData);
      setPhotos(photosData || []);
      setCurrentRating(projectData.customer_rating || 0);
      
    } catch (err: any) {
      console.error('💥 Fetch error:', err);
      setError('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🚀 Component mounted, id:', id);
    fetchProjectData();
  }, [id]);

  const handleRatingSubmit = async (rating: number) => {
    if (!project) return;

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          customer_rating: rating,
          rating_submitted_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setCurrentRating(rating);
      
      // Show appropriate response based on rating
      if (rating === 5) {
        console.log('🌟 5-star rating received, showing smart comment modal');
        setShowSmartCommentModal(true);
      } else if (rating === 4) {
        console.log('🌟 4-star rating received, showing review modal with data:', {
          projectId: project.id,
          customerEmail: project.customer_email,
          shippingAddress: project.address,
          rating
        });
        setShowReviewModal(true);
      } else {
        setShowFeedbackForm(true);
      }

      toast.success('Thank you for your rating!');
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Failed to submit rating. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading your project...</span>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertDescription>
            {error || 'Project not found. Please check your link.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Welcome Message */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Heart className="w-6 h-6 text-accent" />
              Thank you for trusting us with your home
            </CardTitle>
            <p className="text-muted-foreground text-lg">
              We're happy to make it more beautiful!
            </p>
          </CardHeader>
        </Card>

        {/* Project Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{project.name}</CardTitle>
            {project.description && (
              <p className="text-muted-foreground">{project.description}</p>
            )}
          </CardHeader>
        </Card>

        {/* Star Rating */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <CustomerStarRating
              onRatingSubmit={handleRatingSubmit}
              disabled={currentRating > 0}
              currentRating={currentRating}
            />
          </CardContent>
        </Card>

        {/* Feedback Form (for low ratings) */}
        {showFeedbackForm && currentRating <= 3 && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <CustomerFeedbackForm
                projectId={project.id}
                customerEmail={project.customer_email}
                onFeedbackSubmitted={() => setShowFeedbackForm(false)}
              />
            </CardContent>
          </Card>
        )}

        {/* Photo Gallery */}
        <Card>
          <CardHeader>
            <CardTitle>Project Photos</CardTitle>
          </CardHeader>
          <CardContent>
            {photos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="space-y-2">
                    <img
                      src={photo.photo_url}
                      alt={photo.caption || 'Project photo'}
                      className="w-full h-64 object-cover rounded-lg border"
                    />
                    {photo.caption && (
                      <p className="text-sm text-muted-foreground text-center">
                        {photo.caption}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No photos have been shared for this project yet.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Smart Comment Modal for 5-star reviews */}
        <SmartReviewCommentModal
          isOpen={showSmartCommentModal}
          onClose={() => {
            console.log('🚪 Closing smart comment modal');
            setShowSmartCommentModal(false);
          }}
          onContinueToReview={(comment) => {
            console.log('💬 Comment created, transitioning to review modal:', comment);
            setShowSmartCommentModal(false);
            setShowReviewModal(true);
          }}
          projectId={project.id}
        />

        {/* Review Modal */}
        <ReviewPromptModal
          isOpen={showReviewModal}
          onClose={() => {
            console.log('🚪 Closing review modal');
            setShowReviewModal(false);
          }}
          rating={currentRating}
          projectId={project.id}
        />
      </div>
    </div>
  );
};

export default CustomerProjectView;