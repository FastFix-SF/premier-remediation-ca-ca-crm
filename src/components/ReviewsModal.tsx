import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Star, ExternalLink } from 'lucide-react';

interface Review {
  name: string;
  rating: number;
  text: string;
  platform: 'Google' | 'Yelp';
}

interface ReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const reviews: Review[] = [
  {
    name: "Chad Hamilton",
    rating: 5,
    text: "The Roofing Friend did a great job re-roofing our old roof - they did everything they said they would do, were very cooperative, showed up when they said they would, and completed on time. They left the site very clean. We really enjoyed working with them!",
    platform: "Google"
  },
  {
    name: "James Berg",
    rating: 5,
    text: "Friendly Roofing was easy to work with and accommodated our special requests in a timely manner. Our 1910 house had a complex roofline with 4 dormers - they handled everything professionally with organized supplies, correct equipment, and great communication throughout.",
    platform: "Google"
  },
  {
    name: "Jen L.",
    rating: 5,
    text: "This company was hired by my contractor to come in and put a metal roof on my new home. My roof is pretty complex with all of the angles, but they did an outstanding job as you can see from the photos.",
    platform: "Yelp"
  },
  {
    name: "Runfang Z.",
    rating: 5,
    text: "Pedro and his team are superb!! Responsive, organized, hardworking and very professional. They went above and beyond. Finished the job nicely and timely. It is so nice to work with someone who really care!",
    platform: "Yelp"
  }
];

const ReviewsModal: React.FC<ReviewsModalProps> = ({ isOpen, onClose }) => {
  const handleViewReviews = (platform: string) => {
    let url = '';
    switch (platform) {
      case 'Google':
        url = 'https://www.google.com/search?sca_esv=b729f3036b67240b&sxsrf=AE3TifMT4g5v2kYgFAiYYStiqDZSwnHwiQ:1753976867034&q=roofing+friend+team&source=lnms&fbs=AIIjpHz30rPMyW-0vSP0k1VTNmO_kCOARpjPjQRkBWH2HwUIz5XUSIJvSK0oms7XOxizDlksSxoUg32ymGSEgM5nnZAUMufphj-RCYzWdYYKgzspi6GP9RcF0jmdK6KfByTrAEreWTVcv9mSjL9jbj5H5TJGSmDx3GDhl5RdkdGfKN8oX6rnXPdztDKMvIPn-D0EbliPnt0A2eIk0mGZGeeHuODBzm5onSii0HdBod7Gb61598xM4cU&sa=X&ved=2ahUKEwiDjeqAueeOAxVXIUQIHSSvHSYQ0pQJegQIDxAB&biw=1920&bih=1102&dpr=1.8#lrd=0x808f9111316b258b:0x7cd83330f7b4421f,1,,,,';
        break;
      case 'Yelp':
        url = 'https://www.yelp.com/biz/the-roofing-friend-hayward#reviews';
        break;
    }
    window.open(url, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold mb-4">Customer Reviews</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mb-6">
          {reviews.map((review, index) => (
            <div key={index} className="border border-border rounded-lg p-4 bg-card">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{review.name}</span>
                  <span className="text-xs px-2 py-1 bg-muted rounded text-muted-foreground">
                    {review.platform}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-4 h-4 ${
                        i < review.rating 
                          ? 'fill-accent text-accent' 
                          : 'text-muted-foreground'
                      }`} 
                    />
                  ))}
                </div>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">{review.text}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-4">
          <p className="text-sm text-muted-foreground mb-4">
            View all our reviews on these platforms:
          </p>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleViewReviews('Google')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Google Reviews
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleViewReviews('Yelp')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Yelp Reviews
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewsModal;