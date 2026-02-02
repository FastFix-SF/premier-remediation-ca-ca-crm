import React from 'react';
import { BulkProjectImporter } from './BulkProjectImporter';
import { TrainingContextDisplay } from './TrainingContextDisplay';
import { VisionAnalysisTester } from './VisionAnalysisTester';
import ScrollLink from '../ui/scroll-link';
import { Database } from 'lucide-react';

interface TrainingTabProps {
  quoteId: string;
  latitude?: number;
  longitude?: number;
}

export function TrainingTab({ quoteId, latitude, longitude }: TrainingTabProps) {
  return (
    <div className="space-y-6">
      <VisionAnalysisTester quoteId={quoteId} latitude={latitude} longitude={longitude} />
      
      <TrainingContextDisplay quoteId={quoteId} />
      
      <div className="bg-card rounded-lg p-6 border">
        <div className="flex items-start justify-between mb-2">
          <h2 className="text-2xl font-bold">🧠 AI Training Data</h2>
          <ScrollLink to="/admin/learning-dashboard">
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              <Database className="h-4 w-4" />
              View Training Database
            </button>
          </ScrollLink>
        </div>
        <p className="text-muted-foreground mb-6">
          Train the AI by providing examples and historical project data. 
          The system learns from measurements, estimates, and your 20+ years of roofing expertise.
        </p>
        
        <BulkProjectImporter quoteId={quoteId} />
      </div>
    </div>
  );
}
