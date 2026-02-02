import React from 'react';
import { MapPin, Calendar } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { format, isToday } from 'date-fns';

interface QuoteRequest {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  project_type: string | null;
  property_type: string | null;
  timeline: string | null;
  notes: string | null;
  property_address: string | null;
  created_at: string;
  measurements?: any | null;
  converted_to_project_at?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  roof_roi?: any | null;
  roi_image_url?: string | null;
  ai_measurements?: any | null;
  ai_measurements_status?: string | null;
  ai_measurements_updated_at?: string | null;
  selected_imagery?: any | null;
  pitch_schema?: any | null;
}

interface QuoteCardProps {
  quote: QuoteRequest;
  onOpenRoofQuoter: (quote: QuoteRequest) => void;
}

const QuoteCard = ({ quote, onOpenRoofQuoter }: QuoteCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'qualified': return 'bg-green-100 text-green-800 border-green-200';
      case 'contacted': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'converted': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Project': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const parseNotesData = (notes: string | null) => {
    if (!notes) return { address: '' };
    try {
      const addressMatch = notes.match(/Property Address: ([^\n]+)/);
      return { address: addressMatch ? addressMatch[1] : '' };
    } catch {
      return { address: '' };
    }
  };

  const notesData = parseNotesData(quote.notes);
  const displayAddress = quote.property_address || notesData.address || 'Address not provided';

  const [imageError, setImageError] = React.useState(false);
  
  // Get the imagery URL - prioritize roi_image_url (captured thumbnails)
  const imageryUrl = React.useMemo(() => {
    // Reset error state when URL changes
    setImageError(false);
    
    if (quote.roi_image_url) {
      return quote.roi_image_url;
    }
    // Don't try to load from edge function - it has CORS issues
    // Users should capture a thumbnail instead
    return null;
  }, [quote.roi_image_url]);
  
  // Use address as title
  const createdDate = new Date(quote.created_at);
  const cardTitle = displayAddress;

  return (
    <Card 
      className="h-full hover:shadow-lg transition-shadow duration-300 overflow-hidden cursor-pointer"
      onClick={() => onOpenRoofQuoter(quote)}
    >
      {/* Imagery Preview */}
      {imageryUrl && !imageError ? (
        <div className="relative w-full h-64 bg-muted overflow-hidden">
          <img 
            src={imageryUrl} 
            alt={cardTitle}
            className="w-full h-full object-cover"
            onError={() => {
              console.error('Failed to load image:', imageryUrl);
              setImageError(true);
            }}
          />
        </div>
      ) : (
        <div className="w-full h-64 bg-muted flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <MapPin className="h-12 w-12 opacity-30" />
          <p className="text-xs">No thumbnail captured</p>
        </div>
      )}

      <CardContent className="p-4 space-y-3">
        {/* Title */}
        <h3 className="text-lg font-semibold text-foreground line-clamp-1">
          {cardTitle}
        </h3>


        {/* Status and Date */}
        <div className="flex items-center justify-between pt-2">
          <Badge variant="outline" className={getStatusColor(quote.status)}>
            {formatStatus(quote.status)}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{format(createdDate, 'MMM dd, yyyy')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuoteCard;