import React from 'react';
import { Users, Mail, Phone, MapPin, Clock, Calendar, ExternalLink, Copy, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerTrigger, DrawerClose } from '../ui/drawer';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

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
  converted_to_project_at?: string | null;
  roi_image_url?: string | null;
}

interface QuoteRequestSummaryDrawerProps {
  request: QuoteRequest;
  children: React.ReactNode;
  onConvertToProject: (request: QuoteRequest) => void;
  converting: boolean;
}

const QuoteRequestSummaryDrawer: React.FC<QuoteRequestSummaryDrawerProps> = ({
  request,
  children,
  onConvertToProject,
  converting
}) => {
  const navigate = useNavigate();

  const parseNotesData = (notes: string | null) => {
    if (!notes) return { address: '', urgency: '', additionalInfo: '' };
    
    try {
      const addressMatch = notes.match(/Property Address: ([^\n]+)/);
      const urgencyMatch = notes.match(/Project Urgency: ([^\n]+)/);
      const infoMatch = notes.match(/Additional Information: ([^\n]+)/);
      
      return {
        address: addressMatch ? addressMatch[1] : '',
        urgency: urgencyMatch ? urgencyMatch[1] : '',
        additionalInfo: infoMatch ? infoMatch[1] : ''
      };
    } catch {
      return { address: '', urgency: '', additionalInfo: '' };
    }
  };

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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copied to clipboard`);
    });
  };

  const notesData = parseNotesData(request.notes);
  const propertyAddress = request.property_address || notesData.address;

  const openInMaps = () => {
    if (propertyAddress) {
      const encodedAddress = encodeURIComponent(propertyAddress);
      window.open(`https://maps.google.com/?q=${encodedAddress}`, '_blank');
    }
  };

  const openFullWorkspace = () => {
    navigate(`/admin/quote-requests/${request.id}?tab=roof`);
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>
        {children}
      </DrawerTrigger>
      
      <DrawerContent className="max-w-none sm:max-w-full md:max-w-[720px] lg:max-w-[840px] mx-auto">
        <DrawerHeader>
          <DrawerTitle>Quote Request — Summary</DrawerTitle>
          <DrawerDescription>
            Quick overview and actions for {request.name}'s quote request
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-6 pb-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Customer Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{request.name}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{request.email}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(request.email, 'Email')}
                  aria-label="Copy email"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>

              {request.phone && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{request.phone}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(request.phone!, 'Phone')}
                      aria-label="Copy phone"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      aria-label="Call phone number"
                    >
                      <a href={`tel:${request.phone}`}>
                        <Phone className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Property Address Card */}
          {propertyAddress && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Property Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{propertyAddress}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={openInMaps}
                    aria-label="Open in Maps"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Project Details Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">Type:</span>
                  <div>{request.project_type || 'Not specified'}</div>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Property:</span>
                  <div>{request.property_type || 'Not specified'}</div>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Timeline:</span>
                  <div>{request.timeline || 'Not specified'}</div>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Status:</span>
                  <div>
                    <Badge variant="outline" className={getStatusColor(request.status)}>
                      {formatStatus(request.status)}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ROI Preview Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">ROI Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-60 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                {request.roi_image_url ? (
                  <img
                    src={request.roi_image_url}
                    alt="Roof ROI Preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No ROI image yet</p>
                    <p className="text-xs">Click "Open Full Workspace" to define the roof area</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Request Date */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Request Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{format(new Date(request.created_at), "MMMM dd, yyyy 'at' h:mm a")}</span>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            {/* Primary CTA */}
            <Button
              onClick={openFullWorkspace}
              size="lg"
              className="w-full"
            >
              Open Full Workspace
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            {/* Secondary CTAs */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => onConvertToProject(request)}
                disabled={converting}
                variant="outline"
              >
                {converting ? 'Converting...' : 'Convert to Project'}
              </Button>
              
              <div className="flex gap-2">
                {request.phone && (
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <a href={`tel:${request.phone}`}>
                      <Phone className="h-3 w-3 mr-1" />
                      Call
                    </a>
                  </Button>
                )}
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <a href={`mailto:${request.email}`}>
                    <Mail className="h-3 w-3 mr-1" />
                    Email
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default QuoteRequestSummaryDrawer;