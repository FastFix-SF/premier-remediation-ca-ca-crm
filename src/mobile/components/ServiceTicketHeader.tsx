import React from 'react';
import { ArrowLeft, MapPin, Star, Camera, Home, DollarSign, CheckSquare, FileText, FolderOpen, ChevronRight, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { TICKET_STATUSES } from '@/hooks/useServiceTickets';

interface ServiceTicketHeaderProps {
  ticket: any;
  photos: any[];
  address?: string;
  onEdit?: () => void;
  onSeeAllPhotos?: () => void;
  onPhotoClick?: (index: number) => void;
  onPaymentsClick?: () => void;
  onCustomerClick?: () => void;
  onTasksClick?: () => void;
  onReportsClick?: () => void;
  onFilesClick?: () => void;
}

export const ServiceTicketHeader: React.FC<ServiceTicketHeaderProps> = ({
  ticket,
  photos,
  address,
  onSeeAllPhotos,
  onPhotoClick,
  onPaymentsClick,
  onCustomerClick,
  onTasksClick,
  onReportsClick,
  onFilesClick
}) => {
  const navigate = useNavigate();
  const heroPhoto = photos[0];
  
  const getStatusConfig = (status: string) => {
    const config = TICKET_STATUSES.find(s => s.key === status);
    return config || { label: status, color: 'bg-secondary text-secondary-foreground' };
  };

  const statusConfig = getStatusConfig(ticket.status);

  return (
    <div className="relative">
      {/* Hero Image Background */}
      {heroPhoto && (
        <div className="absolute inset-0 w-full h-48 overflow-hidden">
          <img src={heroPhoto.file_url} alt="Ticket photo" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/50 to-background/20" />
        </div>
      )}

      {/* Header Content */}
      <div className="relative z-10 p-4 pb-8">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/mobile/projects')} 
            className="bg-background/80 backdrop-blur-sm border border-border/50"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </div>

        {/* Ticket Info Card */}
        <Card className="bg-background/95 backdrop-blur-sm border border-border/50 shadow-card">
          <CardContent className="p-6">
            {/* Ticket Number Badge */}
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                <Wrench className="w-3 h-3 mr-1" />
                {ticket.ticket_number}
              </Badge>
            </div>

            {/* Ticket Title */}
            <div className="mb-3">
              <h1 className="text-xl font-semibold text-foreground">{ticket.title}</h1>
            </div>

            {/* Address */}
            {address && (
              <div className="flex items-start space-x-2 mb-2">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{address}</span>
              </div>
            )}

            {/* Customer Name with House Icon */}
            {ticket.customer?.name && (
              <button 
                onClick={onCustomerClick}
                className="flex items-center space-x-2 mb-2 group"
              >
                <Home className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-medium group-hover:underline">{ticket.customer.name}</span>
                <ChevronRight className="w-3 h-3 text-primary opacity-60 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}

            {/* Payments */}
            <button 
              onClick={onPaymentsClick}
              className="flex items-center space-x-2 mb-4 group"
            >
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium group-hover:underline">Payments</span>
              <ChevronRight className="w-3 h-3 text-primary opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Quick Stats */}
            <div className="flex items-center justify-around pt-4 border-t border-border/50">
              <div className="flex flex-col items-center px-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-1.5">
                  <Camera className="w-5 h-5 text-primary" />
                </div>
                <span className="text-base font-semibold text-foreground">{photos.length}</span>
                <p className="text-xs text-muted-foreground">Photos</p>
              </div>
              
              <div className="w-px h-12 bg-border/50" />
              
              <div className="flex flex-col items-center px-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center mb-1.5">
                  <Star className="w-5 h-5 text-amber-500" />
                </div>
                <span className="text-base font-semibold text-foreground">
                  {ticket.is_billable ? '$' + (ticket.total_amount || 0).toLocaleString() : '--'}
                </span>
                <p className="text-xs text-muted-foreground">Amount</p>
              </div>
              
              <div className="w-px h-12 bg-border/50" />
              
              <div className="flex flex-col items-center px-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-1.5">
                  <Wrench className="w-5 h-5 text-primary" />
                </div>
                <span className="text-base font-semibold text-foreground">
                  {ticket.duration_hours || '--'}
                </span>
                <p className="text-xs text-muted-foreground">Hours</p>
              </div>
            </div>

            {/* Photo Thumbnails */}
            {photos.length > 0 && (
              <div className="pt-4 border-t border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Photos</span>
                  {onSeeAllPhotos && photos.length > 4 && (
                    <button 
                      onClick={onSeeAllPhotos}
                      className="text-xs text-primary hover:underline"
                    >
                      See all ({photos.length})
                    </button>
                  )}
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {photos.slice(0, 4).map((photo, index) => (
                    <button
                      key={photo.id || index}
                      onClick={() => onPhotoClick?.(index)}
                      className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-border/50 hover:border-primary/50 transition-colors"
                    >
                      <img 
                        src={photo.file_url} 
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Status and Updated */}
            <div className="flex items-center space-x-4 pt-4 border-t border-border/50">
              <Badge className={statusConfig.color}>
                {statusConfig.label}
              </Badge>
              
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <span>Updated {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-border/50 space-y-2">
              {onTasksClick && (
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={onTasksClick} 
                  className="w-full text-sm h-12"
                >
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Tasks
                </Button>
              )}
              {onReportsClick && (
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={onReportsClick} 
                  className="w-full text-sm h-12"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Reports
                </Button>
              )}
              {onFilesClick && (
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={onFilesClick} 
                  className="w-full text-sm h-12"
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Files
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
