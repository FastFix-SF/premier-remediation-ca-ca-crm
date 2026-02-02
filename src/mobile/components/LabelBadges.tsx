import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getAllLabels } from '@/mobile/constants/labels';

interface LabelBadgesProps {
  labelIds: string[];
  maxVisible?: number;
}

export const LabelBadges: React.FC<LabelBadgesProps> = ({ 
  labelIds, 
  maxVisible = 2 
}) => {
  if (!labelIds || labelIds.length === 0) return null;

  const allLabels = getAllLabels();
  const visibleLabels = labelIds.slice(0, maxVisible);
  const hiddenLabels = labelIds.slice(maxVisible);
  const hasMore = hiddenLabels.length > 0;

  const getLabelConfig = (labelId: string) => 
    allLabels.find(l => l.id === labelId);

  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      {visibleLabels.map(labelId => {
        const labelConfig = getLabelConfig(labelId);
        if (!labelConfig) return null;
        return (
          <Badge 
            key={labelId}
            className="text-[10px] px-1.5 py-0 text-white border-0"
            style={{ backgroundColor: labelConfig.color }}
          >
            {labelConfig.name}
          </Badge>
        );
      })}
      
      {hasMore && (
        <Popover>
          <PopoverTrigger asChild>
            <button 
              className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              +{hiddenLabels.length}
            </button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-auto p-2 z-50 bg-popover border border-border shadow-lg" 
            align="end"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-muted-foreground font-medium px-1">
                All Labels
              </span>
              <div className="flex flex-wrap gap-1 max-w-48">
                {labelIds.map(labelId => {
                  const labelConfig = getLabelConfig(labelId);
                  if (!labelConfig) return null;
                  return (
                    <Badge 
                      key={labelId}
                      className="text-[10px] px-1.5 py-0.5 text-white border-0"
                      style={{ backgroundColor: labelConfig.color }}
                    >
                      {labelConfig.name}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};
