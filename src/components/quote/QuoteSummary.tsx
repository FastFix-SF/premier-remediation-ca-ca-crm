import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Home, Calendar, Wrench } from 'lucide-react';

interface QuoteSummaryProps {
  formData: {
    firstName?: string;
    lastName?: string;
    address?: string;
    city?: string;
    state?: string;
    roofType?: string;
    propertyType?: string;
    projectType?: string;
    timeline?: string;
  };
  isFormValid: boolean;
  onSubmit: () => void;
}

const roofTypeLabels: Record<string, string> = {
  'shingle': 'Asphalt Shingle',
  'metal-standing-seam': 'Metal - Standing Seam',
  'metal-corrugated': 'Metal - Corrugated',
  'tile': 'Tile',
  'flat-tpo': 'Flat/TPO',
  'not-sure': 'Not Sure'
};

const propertyTypeLabels: Record<string, string> = {
  'single-family': 'Single Family Home',
  'multi-family': 'Multi-Family Home',
  'commercial': 'Commercial Building',
  'industrial': 'Industrial Building',
  'other': 'Other'
};

const projectTypeLabels: Record<string, string> = {
  'residential-roofing': 'Residential Roofing',
  'commercial-roofing': 'Commercial Roofing',
  'metal-roofing': 'Metal Roofing',
  'roof-repair': 'Roof Repair',
  'roof-replacement': 'Roof Replacement',
  'roof-inspection': 'Roof Inspection'
};

const timelineLabels: Record<string, string> = {
  'asap': 'As Soon As Possible',
  '1-month': 'Within 1 Month',
  '3-months': 'Within 3 Months',
  '6-months': 'Within 6 Months',
  'planning': 'Just Planning / Getting Quotes'
};

export function QuoteSummary({ formData, isFormValid, onSubmit }: QuoteSummaryProps) {
  const fullAddress = formData.address && formData.city && formData.state 
    ? `${formData.address}, ${formData.city}, ${formData.state}`
    : null;

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Quote Summary</span>
          <Badge variant="outline" className="text-xs">Draft</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contact Info */}
        {(formData.firstName || formData.lastName) && (
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="font-medium">
              {[formData.firstName, formData.lastName].filter(Boolean).join(' ')}
            </span>
          </div>
        )}

        {/* Address */}
        {fullAddress ? (
          <div className="space-y-1">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Property Address</p>
                <p className="text-sm text-muted-foreground">{fullAddress}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>Address not provided</span>
          </div>
        )}

        {/* Project Type */}
        {formData.projectType ? (
          <div className="space-y-1">
            <div className="flex items-start gap-2">
              <Wrench className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Project Type</p>
                <p className="text-sm text-muted-foreground">
                  {projectTypeLabels[formData.projectType] || formData.projectType}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wrench className="w-4 h-4" />
            <span>Project type not selected</span>
          </div>
        )}

        {/* Roof Type */}
        {formData.roofType ? (
          <div className="space-y-1">
            <div className="flex items-start gap-2">
              <Home className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Roof Type</p>
                <p className="text-sm text-muted-foreground">
                  {roofTypeLabels[formData.roofType] || formData.roofType}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Home className="w-4 h-4" />
            <span>Roof type not specified</span>
          </div>
        )}

        {/* Property Type */}
        {formData.propertyType && (
          <div className="space-y-1">
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 mt-0.5 bg-muted-foreground/20 rounded flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Property Type</p>
                <p className="text-sm text-muted-foreground">
                  {propertyTypeLabels[formData.propertyType] || formData.propertyType}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        {formData.timeline ? (
          <div className="space-y-1">
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Timeline</p>
                <p className="text-sm text-muted-foreground">
                  {timelineLabels[formData.timeline] || formData.timeline}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Timeline not selected</span>
          </div>
        )}

        <div className="pt-4 border-t">
          <Button 
            onClick={onSubmit}
            disabled={!isFormValid}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-md hover:shadow-lg transition-shadow"
            size="lg"
          >
            Get My Professional Quote
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Free, no obligation. We typically deliver within 24 hours.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}