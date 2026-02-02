import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CustomerFeedbackFormProps {
  projectId: string;
  customerEmail: string;
  onFeedbackSubmitted?: () => void;
}

const CustomerFeedbackForm = ({ projectId, customerEmail, onFeedbackSubmitted }: CustomerFeedbackFormProps) => {
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('customer_feedback')
        .insert({
          project_id: projectId,
          customer_email: customerEmail,
          content: feedback.trim(),
          feedback_type: 'comment',
          feedback_source: 'rating_based'
        });

      if (error) throw error;

      setIsSubmitted(true);
      toast.success('Thank you for your feedback!');
      onFeedbackSubmitted?.();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Alert className="border-primary/20 bg-primary/5">
        <MessageSquare className="h-4 w-4" />
        <AlertDescription>
          Thank you for your feedback! We'll review it and get back to you soon.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Alert className="border-destructive/20 bg-destructive/5">
        <AlertDescription>
          We're sorry to hear that. Please share any feedback here:
        </AlertDescription>
      </Alert>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Please tell us how we can improve..."
          className="min-h-[100px]"
          required
        />
        
        <Button 
          type="submit" 
          disabled={isSubmitting || !feedback.trim()}
          className="w-full"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </Button>
      </form>
    </div>
  );
};

export default CustomerFeedbackForm;