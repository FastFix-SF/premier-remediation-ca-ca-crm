
import React, { useState } from 'react';
import { Star } from 'lucide-react';
import ReviewsModal from '../ReviewsModal';

const HeroReviewsPreview = () => {
  const [showReviewsModal, setShowReviewsModal] = useState(false);

  return (
    <>
      <div 
        className="flex items-center justify-center lg:justify-start gap-4 pt-4 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => setShowReviewsModal(true)}
      >
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 fill-accent text-accent" />
          ))}
        </div>
        <div className="text-white/90 text-sm sm:text-base">
          <span className="font-semibold">4.9/5</span> from 150+ customers
        </div>
      </div>
      
      <ReviewsModal 
        isOpen={showReviewsModal} 
        onClose={() => setShowReviewsModal(false)} 
      />
    </>
  );
};

export default HeroReviewsPreview;
