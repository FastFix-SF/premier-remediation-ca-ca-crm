import React from 'react';
import { Card } from '@/components/ui/card';
import { FileText, TrendingUp, Loader2 } from 'lucide-react';
import { useTrainingContext } from '@/hooks/useTrainingContext';

interface TrainingContextDisplayProps {
  quoteId: string;
}

export function TrainingContextDisplay({ quoteId }: TrainingContextDisplayProps) {
  const { data, isLoading, error } = useTrainingContext(quoteId);

  if (isLoading) {
    return (
      <Card className="p-4 bg-muted/30">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading training context...
        </div>
      </Card>
    );
  }

  if (error || !data || data.count === 0) {
    return (
      <Card className="p-4 bg-muted/30">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          No training data available yet. Upload project documents to train the AI.
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-primary">AI Training Context Active</h3>
        </div>
        
        <p className="text-sm text-muted-foreground">
          AI predictions are enhanced using {data.count} historical project document{data.count !== 1 ? 's' : ''}:
        </p>

        <div className="space-y-2">
          {data.trainingDocuments.map((doc) => (
            <div 
              key={doc.id} 
              className="bg-background/50 rounded-lg p-3 border border-border/50"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-xs font-medium text-primary uppercase tracking-wide">
                  {doc.category.replace('_', ' ')}
                </span>
                <FileText className="h-3 w-3 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {doc.fileName}
              </p>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground italic">
            💡 The AI uses data from these documents to make more accurate predictions based on your company's actual project history.
          </p>
        </div>
      </div>
    </Card>
  );
}
