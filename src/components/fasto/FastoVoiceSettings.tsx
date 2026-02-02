import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Settings2, Volume2, Check, Star, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FastoVoiceSettingsProps {
  availableVoices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  onSelectVoice: (voice: SpeechSynthesisVoice) => void;
  speechRate: number;
  onSpeechRateChange: (rate: number) => void;
}

const QUALITY_INDICATORS: Record<string, { stars: number; label: string }> = {
  'Microsoft Aria Online (Natural)': { stars: 5, label: 'Neural' },
  'Microsoft Jenny Online (Natural)': { stars: 5, label: 'Neural' },
  'Microsoft Guy Online (Natural)': { stars: 5, label: 'Neural' },
  'Google US English': { stars: 4, label: 'HD' },
  'Google UK English Female': { stars: 4, label: 'HD' },
  'Samantha': { stars: 4, label: 'Premium' },
  'Daniel': { stars: 3, label: 'Good' },
  'Alex': { stars: 3, label: 'Good' },
};

function getVoiceQuality(voiceName: string): { stars: number; label: string } {
  for (const [key, quality] of Object.entries(QUALITY_INDICATORS)) {
    if (voiceName.includes(key) || key.includes(voiceName)) {
      return quality;
    }
  }
  
  if (voiceName.toLowerCase().includes('natural') || voiceName.toLowerCase().includes('neural')) {
    return { stars: 5, label: 'Neural' };
  }
  if (voiceName.toLowerCase().includes('online')) {
    return { stars: 4, label: 'Online' };
  }
  
  return { stars: 2, label: 'Standard' };
}

export const FastoVoiceSettings: React.FC<FastoVoiceSettingsProps> = ({
  availableVoices,
  selectedVoice,
  onSelectVoice,
  speechRate,
  onSpeechRateChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);

  const previewVoice = (voice: SpeechSynthesisVoice) => {
    if (!window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    setPreviewingVoice(voice.name);
    
    const utterance = new SpeechSynthesisUtterance("Hi, I'm Fasto. How can I help you today?");
    utterance.voice = voice;
    utterance.rate = speechRate;
    utterance.pitch = 0.95;
    
    utterance.onend = () => setPreviewingVoice(null);
    utterance.onerror = () => setPreviewingVoice(null);
    
    window.speechSynthesis.speak(utterance);
  };

  const handleSelectVoice = (voice: SpeechSynthesisVoice) => {
    onSelectVoice(voice);
    previewVoice(voice);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <Settings2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-primary" />
            Fasto Voice Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Speech Rate */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Speech Speed</label>
              <span className="text-sm text-muted-foreground">{speechRate.toFixed(1)}x</span>
            </div>
            <Slider
              value={[speechRate]}
              onValueChange={([value]) => onSpeechRateChange(value)}
              min={0.5}
              max={2}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Slower</span>
              <span>Normal</span>
              <span>Faster</span>
            </div>
          </div>

          {/* Voice Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Voice</label>
            <div className="max-h-64 overflow-y-auto space-y-1 pr-2">
              {availableVoices.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Loading voices...
                </p>
              ) : (
                availableVoices.map((voice) => {
                  const quality = getVoiceQuality(voice.name);
                  const isSelected = selectedVoice?.name === voice.name;
                  const isPreviewing = previewingVoice === voice.name;
                  
                  return (
                    <div
                      key={voice.name}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                        isSelected 
                          ? "bg-primary/10 border border-primary/30" 
                          : "hover:bg-muted/50 border border-transparent"
                      )}
                      onClick={() => handleSelectVoice(voice)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">
                            {voice.name.replace(/Microsoft |Google |Apple /g, '')}
                          </span>
                          {isSelected && (
                            <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "h-2.5 w-2.5",
                                  i < quality.stars ? "text-amber-500 fill-amber-500" : "text-muted"
                                )}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {quality.label}
                          </span>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          previewVoice(voice);
                        }}
                      >
                        <Play className={cn(
                          "h-3.5 w-3.5",
                          isPreviewing && "text-primary animate-pulse"
                        )} />
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
