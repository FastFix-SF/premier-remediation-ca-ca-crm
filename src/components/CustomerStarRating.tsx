import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomerStarRatingProps {
  onRatingSubmit: (rating: number) => void;
  disabled?: boolean;
  currentRating?: number;
}

const CustomerStarRating = ({ onRatingSubmit, disabled, currentRating }: CustomerStarRatingProps) => {
  const [hoveredRating, setHoveredRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(currentRating || 0);

  const handleStarClick = (rating: number) => {
    if (disabled) return;
    setSelectedRating(rating);
    onRatingSubmit(rating);
  };

  const handleStarHover = (rating: number) => {
    if (disabled) return;
    setHoveredRating(rating);
  };

  const handleMouseLeave = () => {
    if (disabled) return;
    setHoveredRating(0);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <h3 className="text-lg font-semibold text-foreground">How did we do?</h3>
      <div 
        className="flex gap-1" 
        onMouseLeave={handleMouseLeave}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isActive = star <= (hoveredRating || selectedRating);
          return (
            <button
              key={star}
              type="button"
              onClick={() => handleStarClick(star)}
              onMouseEnter={() => handleStarHover(star)}
              disabled={disabled}
              className={cn(
                "transition-all duration-200 hover:scale-110",
                disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
              )}
            >
              <Star
                className={cn(
                  "w-8 h-8 transition-colors duration-200",
                  isActive 
                    ? "fill-accent text-accent" 
                    : "text-muted-foreground hover:text-accent"
                )}
              />
            </button>
          );
        })}
      </div>
      {selectedRating > 0 && (
        <p className="text-sm text-muted-foreground">
          {disabled ? "Thank you for your rating!" : "Click to submit your rating"}
        </p>
      )}
    </div>
  );
};

export default CustomerStarRating;