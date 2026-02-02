import { useState } from 'react';
import { Waves, MinusCircle, TrendingUp, Building2, Layers, ChevronDown, PlusCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface FacetOption {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const FACET_OPTIONS: FacetOption[] = [
  { id: 'dormer', label: 'DORMER', icon: Waves },
  { id: 'remove', label: 'REMOVE', icon: MinusCircle },
  { id: 'pitch', label: 'PITCH', icon: TrendingUp },
  { id: '2-story', label: '2 STORY', icon: Building2 },
  { id: 'two-layer', label: 'TWO LAYER', icon: Layers },
  { id: 'low-slope', label: 'LOW SLOPE', icon: TrendingUp },
];

interface FacetsPanelProps {
  selectedFacet?: string | null;
  onFacetSelect?: (facetId: string, value?: string) => void;
  onApplyPitchToAll?: (pitch: string) => void;
}

// Generate pitch options from 0 to 24
const PITCH_OPTIONS = Array.from({ length: 25 }, (_, i) => `${i}`);

export default function FacetsPanel({ selectedFacet, onFacetSelect, onApplyPitchToAll }: FacetsPanelProps) {
  const [isLabelsOpen, setIsLabelsOpen] = useState(true);
  const [pitchPopoverOpen, setPitchPopoverOpen] = useState(false);

  return (
    <div className="space-y-2">
      {/* Facet Labels Header */}
      <button
        onClick={() => setIsLabelsOpen(!isLabelsOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-primary hover:bg-muted/50 rounded-lg transition-colors"
      >
        <span>Facet Labels</span>
        <ChevronDown 
          className={`w-4 h-4 transition-transform ${isLabelsOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Facet Options */}
      {isLabelsOpen && (
        <div className="space-y-1 px-2">
          {FACET_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedFacet === option.id;

            // Special handling for PITCH option with dropdown
            if (option.id === 'pitch') {
              return (
                <Popover key={option.id} open={pitchPopoverOpen} onOpenChange={setPitchPopoverOpen}>
                  <PopoverTrigger asChild>
                    <button
                      onClick={(e) => {
                        // If already selected, deselect instead of opening popover
                        if (isSelected) {
                          e.preventDefault();
                          onFacetSelect?.('', undefined);
                          setPitchPopoverOpen(false);
                        }
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium
                        ${isSelected 
                          ? 'bg-primary/10 text-primary ring-2 ring-primary/20' 
                          : 'text-foreground/70 hover:bg-muted/50 hover:text-foreground'
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{option.label}</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-0 z-[9999]" align="start" side="right">
                    <div className="bg-background border-border">
                      {/* Header */}
                      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                        <span className="font-semibold text-foreground">{option.label}</span>
                      </div>
                      
                      {/* Pitch Options List */}
                      <ScrollArea className="h-[400px]">
                        <div className="py-2">
                          {PITCH_OPTIONS.map((pitch) => (
                            <div
                              key={pitch}
                              className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-foreground group"
                            >
                              <button
                                onClick={() => {
                                  // Clicking pitch text selects it for individual application
                                  onFacetSelect?.(option.id, pitch);
                                  setPitchPopoverOpen(false);
                                }}
                                className="flex-1 text-left"
                              >
                                <span className="text-base">{pitch}</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Clicking + icon applies to all facets
                                  if (pitch !== '0' && onApplyPitchToAll) {
                                    onApplyPitchToAll(pitch);
                                    setPitchPopoverOpen(false);
                                    toast.success(`Applying ${pitch} to all sections`);
                                  }
                                }}
                                className="p-1 hover:bg-muted rounded transition-colors"
                                disabled={pitch === '0'}
                              >
                                <PlusCircle className={`w-5 h-5 ${pitch !== '0' ? 'text-primary hover:text-primary/80' : 'text-muted-foreground/50'}`} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </PopoverContent>
                </Popover>
              );
            }

            // Regular buttons for other options - toggle on/off
            return (
              <button
                key={option.id}
                onClick={() => {
                  // Toggle: if already selected, deselect (null); otherwise select
                  if (isSelected) {
                    onFacetSelect?.('', undefined); // Deselect by passing empty string
                  } else {
                    onFacetSelect?.(option.id);
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium
                  ${isSelected 
                    ? 'bg-primary/10 text-primary ring-2 ring-primary/20' 
                    : 'text-foreground/70 hover:bg-muted/50 hover:text-foreground'
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
