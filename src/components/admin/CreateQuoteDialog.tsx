import React, { useState } from 'react';
import { Plus, Satellite, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { GooglePlacesAutocomplete } from '@/components/ui/google-places-autocomplete';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Import shingles images
import cedarShingles from '@/assets/shingles/cedar-shingles.jpg';
import cedarShake from '@/assets/shingles/cedar-shake.jpg';
import syntheticShake from '@/assets/shingles/synthetic-shake.jpg';
import slate from '@/assets/shingles/slate.jpg';
import davinciSlate from '@/assets/shingles/davinci-slate.jpg';
import concreteTile from '@/assets/shingles/concrete-tile.jpg';
import standingSeam from '@/assets/shingles/standing-seam.jpg';
import stoneCoated from '@/assets/shingles/stone-coated.jpg';
import presidentialShake from '@/assets/shingles/presidential-shake.jpg';
import landmark from '@/assets/shingles/landmark.jpg';
import timberline from '@/assets/shingles/timberline.jpg';
import oakridge from '@/assets/shingles/oakridge.jpg';
import bravaTile from '@/assets/shingles/brava-tile.jpg';
interface CreateQuoteDialogProps {
  onQuoteCreated?: () => void;
}

// Roof type to image mapping
const ROOF_IMAGES: Record<string, string> = {
  // Architectural Shingles
  'GAF Timberline HDZ': timberline,
  'GAF Timberline Ultra HD': timberline,
  'GAF Grand Canyon': timberline,
  'CertainTeed Landmark': landmark,
  'CertainTeed Landmark TL': landmark,
  'CertainTeed Landmark PRO': landmark,
  'CertainTeed Landmark Premium': landmark,
  'Owens Corning Oakridge': oakridge,
  'Owens Corning TruDefinition Duration': oakridge,
  'Malarkey Ecoasis 282': timberline,
  'Malarkey Highlander 241': timberline,
  // Premium Architectural Shingles
  'GAF Grand Sequoia': timberline,
  'CertainTeed Presidential Shake': presidentialShake,
  'CertainTeed Presidential TL': presidentialShake,
  'CertainTeed Presidential Solaris': presidentialShake,
  'Owens Corning TruDefinition Duration Premium': oakridge,
  // Stone-Coated
  'Boral Barrel Vault': stoneCoated,
  'Boral Pine Crest Shake': stoneCoated,
  'Boral Cottage Shingle': stoneCoated,
  'Boral Pacific Tile Stone': stoneCoated,
  // Standing Seam
  'Steel Sheffield 24 Gage 15" S50 Snap lock': standingSeam,
  'Steel Sheffield 24 Gage 14" Mechanical seam SS200': standingSeam,
  'Steel Sheffield 24 Gage 18" S50 Snap lock': standingSeam,
  'Steel McElroy 24 Gage 15" S50 Snap lock': standingSeam,
  'Aluminum Sheffield 0.040 18" S50 Snap lock': standingSeam,
  // Concrete Tile
  'Eagle Capistrano': concreteTile,
  'Eagle Malibu': concreteTile,
  'Eagle Bel Air': concreteTile,
  'Boral Saxony 900 Shake': concreteTile,
  // Wood Shakes
  'Cedar Shingles': cedarShingles,
  'Cedar Shake Medium Premium': cedarShake,
  'Cedur Synthetic Shake': syntheticShake,
  // Slate
  'Tru Slate': slate,
  'DaVinci Slate': davinciSlate,
  // Other
  '3-Tab Shingles': timberline,
  'Brava Tile': bravaTile
};

// Architectural Shingles Options
const ARCHITECTURAL_SHINGLES = ['GAF Timberline HDZ', 'GAF Timberline Ultra HD', 'GAF Grand Canyon', 'CertainTeed Landmark', 'CertainTeed Landmark TL', 'CertainTeed Landmark PRO', 'CertainTeed Landmark Premium', 'Owens Corning Oakridge', 'Owens Corning TruDefinition Duration', 'Malarkey Ecoasis 282', 'Malarkey Highlander 241'];

// Premium Architectural Shingles Options
const PREMIUM_ARCHITECTURAL_SHINGLES = ['GAF Grand Sequoia', 'CertainTeed Presidential Shake', 'CertainTeed Presidential TL', 'CertainTeed Presidential Solaris', 'Owens Corning TruDefinition Duration Premium'];

// Stone-Coated Options
const STONE_COATED = ['Boral Barrel Vault', 'Boral Pine Crest Shake', 'Boral Cottage Shingle', 'Boral Pacific Tile Stone'];

// Standing Seam Options
const STANDING_SEAM = ['Steel Sheffield 24 Gage 15" S50 Snap lock', 'Steel Sheffield 24 Gage 14" Mechanical seam SS200', 'Steel Sheffield 24 Gage 18" S50 Snap lock', 'Steel McElroy 24 Gage 15" S50 Snap lock', 'Aluminum Sheffield 0.040 18" S50 Snap lock'];

// Concrete Tile Options  
const CONCRETE_TILE = ['Eagle Capistrano', 'Eagle Malibu', 'Eagle Bel Air', 'Boral Saxony 900 Shake'];

// Wood Shakes & Shingles Options
const WOOD_SHAKES = ['Cedar Shingles', 'Cedar Shake Medium Premium', 'Cedur Synthetic Shake'];

// Slate Options
const SLATE = ['Tru Slate', 'DaVinci Slate'];

// Roof Deck Options
const ROOF_DECK_OPTIONS = ['OSB (Oriented Strand Board)', 'Plywood'];

// Insulation Options (thickness in inches)
const INSULATION_OPTIONS = ['1/2"', '1"', '1 1/2"', '2"', '3"', '4"'];
export function CreateQuoteDialog({
  onQuoteCreated
}: CreateQuoteDialogProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    property_address: '',
    project_type: '',
    property_type: '',
    existing_roof: '',
    wanted_roof: '',
    existing_roof_deck: '',
    wanted_roof_deck: '',
    insulation: '',
    timeline: '',
    notes: ''
  });
  const {
    toast
  } = useToast();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.property_address.trim()) {
      toast({
        title: "Required Fields",
        description: "Please enter name, email, and property address.",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      // Step 1: Create the quote request
      const {
        data: quote,
        error: quoteError
      } = await supabase.from('quote_requests').insert({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        property_address: formData.property_address.trim(),
        project_type: formData.project_type || null,
        property_type: formData.property_type || null,
        timeline: formData.timeline || null,
        notes: formData.notes.trim() || null,
        existing_roof: formData.existing_roof || null,
        wanted_roof: formData.wanted_roof || null,
        existing_roof_deck: formData.existing_roof_deck || null,
        wanted_roof_deck: formData.wanted_roof_deck || null,
        insulation: formData.insulation || null,
        status: 'new'
      }).select().maybeSingle();
      if (quoteError) throw quoteError;

      // Step 2: Geocode the address
      const {
        data: geocodeData,
        error: geocodeError
      } = await supabase.functions.invoke('geocode-address', {
        body: {
          quote_request_id: quote.id,
          address: formData.property_address.trim()
        }
      });
      if (geocodeError) {
        console.warn('Geocoding failed:', geocodeError);
      }
      toast({
        title: "Quote Created",
        description: "Opening Solar API tab..."
      });

      // Close dialog and reset form
      setOpen(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        property_address: '',
        project_type: '',
        property_type: '',
        existing_roof: '',
        wanted_roof: '',
        existing_roof_deck: '',
        wanted_roof_deck: '',
        insulation: '',
        timeline: '',
        notes: ''
      });

      // Refresh parent component
      onQuoteCreated?.();

      // Navigate directly to Solar API tab
      navigate(`/quote/${quote.id}?tab=solar`);
    } catch (error) {
      console.error('Error creating quote:', error);
      toast({
        title: "Error",
        description: "Failed to create quote. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleCancel = () => {
    setOpen(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      property_address: '',
      project_type: '',
      property_type: '',
      existing_roof: '',
      wanted_roof: '',
      existing_roof_deck: '',
      wanted_roof_deck: '',
      insulation: '',
      timeline: '',
      notes: ''
    });
  };
  return <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create New Quote
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto" onInteractOutside={e => {
        // Prevent dialog from closing when clicking on Google Places autocomplete dropdown
        const target = e.target as HTMLElement;
        if (target.closest('.pac-container')) {
          e.preventDefault();
        }
      }}>
          <DialogHeader className="pb-2">
            <DialogTitle>Create New Quote</DialogTitle>
            <DialogDescription>
              Enter the quote details to get started with the roof quoter.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="name" className="text-xs">Customer Name *</Label>
                <Input id="name" placeholder="John Smith" value={formData.name} onChange={e => setFormData(prev => ({
                ...prev,
                name: e.target.value
              }))} disabled={loading} className="h-9" />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs">Email *</Label>
                <Input id="email" type="email" placeholder="john@example.com" value={formData.email} onChange={e => setFormData(prev => ({
                ...prev,
                email: e.target.value
              }))} disabled={loading} className="h-9" />
              </div>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="phone" className="text-xs">Phone</Label>
              <Input id="phone" type="tel" placeholder="(555) 123-4567" value={formData.phone} onChange={e => setFormData(prev => ({
              ...prev,
              phone: e.target.value
            }))} disabled={loading} className="h-9" />
            </div>
            
            <div className="space-y-1 mb-16">
              <Label htmlFor="property_address" className="text-xs">Property Address *</Label>
              <GooglePlacesAutocomplete value={formData.property_address} onChange={value => setFormData(prev => ({
              ...prev,
              property_address: value
            }))} onPlaceSelected={place => {
              console.log('Selected place:', place);
            }} placeholder="Start typing an address..." disabled={loading} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="project_type" className="text-xs">Project Type</Label>
                <Select value={formData.project_type} onValueChange={value => setFormData(prev => ({
                ...prev,
                project_type: value
              }))} disabled={loading}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new_roof">New Roof</SelectItem>
                    <SelectItem value="roof_replacement">Roof Replacement</SelectItem>
                    <SelectItem value="roof_repair">Roof Repair</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="property_type" className="text-xs">Property Type</Label>
                <Select value={formData.property_type} onValueChange={value => setFormData(prev => ({
                ...prev,
                property_type: value
              }))} disabled={loading}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="existing_roof" className="text-xs">Existing Roof</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-auto min-h-[36px] w-full justify-start text-sm font-normal py-2 px-3" disabled={loading}>
                      {formData.existing_roof ? (() => {
                      const match = formData.existing_roof.match(/(Low Heavy|Medium Heavy|Very Heavy)[^(]*\(([^:)]+)/);
                      let displayText = formData.existing_roof;
                      let roofType = '';
                      let imageUrl = null;
                      if (match) {
                        const weightCategory = match[1];
                        roofType = match[2].trim();

                        // Map abbreviations to full names
                        if (roofType === 'Arch') roofType = 'Architectural Shingles';else if (roofType === 'Premium') roofType = 'Premium Architectural';else if (roofType === '3-Tab Standard') roofType = '3-Tab Shingles';else if (roofType.includes('Boral') && formData.existing_roof.includes('1.5 lbs')) roofType = 'Stone-Coated Steel';else if (roofType.includes('Aluminum')) roofType = 'Standing Seam Metal';else if (roofType.includes('Steel')) roofType = 'Standing Seam Metal';else if (roofType.includes('Eagle')) roofType = 'Concrete Tile';else if (roofType.includes('DaVinci')) roofType = 'Slate';else if (roofType.includes('Natural')) roofType = 'Slate';else if (roofType.includes('Cedur')) roofType = 'Wood Shakes';else if (roofType.includes('Cedar')) roofType = 'Wood Shakes';
                        displayText = `${roofType} - ${weightCategory}`;

                        // Find matching image
                        if (roofType === 'Architectural Shingles') imageUrl = timberline;else if (roofType === 'Premium Architectural') imageUrl = presidentialShake;else if (roofType === '3-Tab Shingles') imageUrl = timberline;else if (roofType === 'Stone-Coated Steel') imageUrl = stoneCoated;else if (roofType === 'Standing Seam Metal') imageUrl = standingSeam;else if (roofType === 'Concrete Tile') imageUrl = concreteTile;else if (roofType === 'Slate') imageUrl = slate;else if (roofType === 'Wood Shakes') imageUrl = cedarShake;
                      }
                      return <>
                            {imageUrl && <img src={imageUrl} alt={roofType} className="w-8 h-8 object-cover rounded flex-shrink-0" />}
                            <span className={`flex-1 text-left pr-2 whitespace-normal break-words ${imageUrl ? 'ml-2' : ''} text-white`}>
                              {displayText}
                            </span>
                          </>;
                    })() : <span className="flex-1 text-left pr-2 whitespace-normal break-words text-muted-foreground">
                          Select roof type
                        </span>}
                      <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80 bg-popover text-popover-foreground z-[100]">
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="text-popover-foreground">Architectural Shingles</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-80 bg-popover text-popover-foreground z-[100]">
                        <DropdownMenuItem onClick={() => setFormData(prev => ({
                        ...prev,
                        existing_roof: 'Low Heavy - 2.9 lbs/sqft (Arch: Timberline HDZ, Landmark, Oakridge)'
                      }))} className="text-popover-foreground">
                          Low Heavy - 2.9 lbs/sqft (Timberline HDZ, Landmark, Oakridge)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFormData(prev => ({
                        ...prev,
                        existing_roof: 'Medium Heavy - 3.2 lbs/sqft (Arch: Landmark TL, Landmark PRO)'
                      }))} className="text-popover-foreground">
                          Medium Heavy - 3.2 lbs/sqft (Landmark TL, Landmark PRO)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFormData(prev => ({
                        ...prev,
                        existing_roof: 'Very Heavy - 3.8 lbs/sqft (Arch: Grand Canyon, Malarkey)'
                      }))} className="text-popover-foreground">
                          Very Heavy - 3.8 lbs/sqft (Grand Canyon, Malarkey)
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="text-popover-foreground">Premium Architectural Shingles</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-80 bg-popover text-popover-foreground z-[100]">
                        <DropdownMenuItem onClick={() => setFormData(prev => ({
                        ...prev,
                        existing_roof: 'Medium Heavy - 4.1 lbs/sqft (Premium: Presidential Shake, Presidential TL)'
                      }))} className="text-popover-foreground">
                          Medium Heavy - 4.1 lbs/sqft (Presidential Shake, Presidential TL)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFormData(prev => ({
                        ...prev,
                        existing_roof: 'Very Heavy - 4.6 lbs/sqft (Premium: Grand Sequoia, Presidential Solaris, Duration Premium)'
                      }))} className="text-popover-foreground">
                          Very Heavy - 4.6 lbs/sqft (Grand Sequoia, Presidential Solaris, Duration Premium)
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="text-popover-foreground">3-Tab Shingles</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-80 bg-popover text-popover-foreground z-[100]">
                        <DropdownMenuItem onClick={() => setFormData(prev => ({
                        ...prev,
                        existing_roof: 'Low Heavy - 2.4 lbs/sqft (3-Tab Standard)'
                      }))} className="text-popover-foreground">
                          Low Heavy - 2.4 lbs/sqft (3-Tab Standard)
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="text-popover-foreground">Stone-Coated Steel</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-80 bg-popover text-popover-foreground z-[100]">
                        <DropdownMenuItem onClick={() => setFormData(prev => ({
                        ...prev,
                        existing_roof: 'Low Heavy - 1.5 lbs/sqft (Boral Barrel Vault, Pine Crest, Cottage, Pacific Tile)'
                      }))} className="text-popover-foreground">
                          Low Heavy - 1.5 lbs/sqft (Boral Barrel Vault, Pine Crest, Cottage, Pacific Tile)
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="text-popover-foreground">Standing Seam Metal</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-80 bg-popover text-popover-foreground z-[100]">
                        <DropdownMenuItem onClick={() => setFormData(prev => ({
                        ...prev,
                        existing_roof: 'Low Heavy - 0.6 lbs/sqft (Aluminum Sheffield)'
                      }))} className="text-popover-foreground">
                          Low Heavy - 0.6 lbs/sqft (Aluminum Sheffield)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFormData(prev => ({
                        ...prev,
                        existing_roof: 'Low Heavy - 1.0 lbs/sqft (Steel Sheffield, Steel McElroy)'
                      }))} className="text-popover-foreground">
                          Low Heavy - 1.0 lbs/sqft (Steel Sheffield, Steel McElroy)
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="text-popover-foreground">Concrete Tile</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-80 bg-popover text-popover-foreground z-[100]">
                        <DropdownMenuItem onClick={() => setFormData(prev => ({
                        ...prev,
                        existing_roof: 'Very Heavy - 7.2 lbs/sqft (Eagle Lightweight)'
                      }))} className="text-popover-foreground">
                          Very Heavy - 7.2 lbs/sqft (Eagle Lightweight)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFormData(prev => ({
                        ...prev,
                        existing_roof: 'Very Heavy - 9.7 lbs/sqft (Eagle Standard, Boral Saxony)'
                      }))} className="text-popover-foreground">
                          Very Heavy - 9.7 lbs/sqft (Eagle Standard, Boral Saxony)
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="text-popover-foreground">Slate</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-80 bg-popover text-popover-foreground z-[100]">
                        <DropdownMenuItem onClick={() => setFormData(prev => ({
                        ...prev,
                        existing_roof: 'Medium Heavy - 3.8 lbs/sqft (DaVinci Synthetic Slate)'
                      }))} className="text-popover-foreground">
                          Medium Heavy - 3.8 lbs/sqft (DaVinci Synthetic Slate)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFormData(prev => ({
                        ...prev,
                        existing_roof: 'Very Heavy - 8.5 lbs/sqft (Natural Tru Slate)'
                      }))} className="text-popover-foreground">
                          Very Heavy - 8.5 lbs/sqft (Natural Tru Slate)
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="text-popover-foreground">Wood Shakes & Shingles</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-80 bg-popover text-popover-foreground z-[100]">
                        <DropdownMenuItem onClick={() => setFormData(prev => ({
                        ...prev,
                        existing_roof: 'Low Heavy - 1.8 lbs/sqft (Cedur Synthetic Shake)'
                      }))} className="text-popover-foreground">
                          Low Heavy - 1.8 lbs/sqft (Cedur Synthetic Shake)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFormData(prev => ({
                        ...prev,
                        existing_roof: 'Low Heavy - 2.5 lbs/sqft (Cedar Shingles)'
                      }))} className="text-popover-foreground">
                          Low Heavy - 2.5 lbs/sqft (Cedar Shingles)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFormData(prev => ({
                        ...prev,
                        existing_roof: 'Medium Heavy - 3.5 lbs/sqft (Cedar Shake Medium Premium)'
                      }))} className="text-popover-foreground">
                          Medium Heavy - 3.5 lbs/sqft (Cedar Shake Medium Premium)
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-1">
                <Label htmlFor="wanted_roof" className="text-xs">Wanted Roof</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-auto min-h-[36px] w-full justify-start text-sm font-normal py-2 px-3" disabled={loading}>
                      {formData.wanted_roof ? (() => {
                      // Extract the specific roof type from the selection
                      const parts = formData.wanted_roof.split(' - ');
                      let imageUrl = null;
                      if (parts.length > 1) {
                        const specificType = parts[1];
                        imageUrl = ROOF_IMAGES[specificType] || null;
                      } else {
                        imageUrl = ROOF_IMAGES[formData.wanted_roof] || null;
                      }
                      return <>
                            {imageUrl && <img src={imageUrl} alt={formData.wanted_roof} className="w-8 h-8 object-cover rounded flex-shrink-0" />}
                            <span className={`flex-1 text-left pr-2 whitespace-normal break-words ${imageUrl ? 'ml-2' : ''} text-white`}>
                              {formData.wanted_roof}
                            </span>
                          </>;
                    })() : <span className="flex-1 text-left pr-2 whitespace-normal break-words text-muted-foreground">
                          Select roof type
                        </span>}
                      <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-72 bg-popover text-popover-foreground z-[100]">
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="text-popover-foreground">Architectural Shingles</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-72 bg-popover text-popover-foreground z-[100]">
                        {ARCHITECTURAL_SHINGLES.map(shingle => <DropdownMenuItem key={shingle} onClick={() => setFormData(prev => ({
                        ...prev,
                        wanted_roof: `Architectural Shingles - ${shingle}`
                      }))} className="text-popover-foreground flex items-center gap-2">
                            {ROOF_IMAGES[shingle] && <img src={ROOF_IMAGES[shingle]} alt={shingle} className="w-8 h-8 object-cover rounded" />}
                            <span>{shingle}</span>
                          </DropdownMenuItem>)}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="text-popover-foreground">Premium Architectural Shingles</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-72 bg-popover text-popover-foreground z-[100]">
                        {PREMIUM_ARCHITECTURAL_SHINGLES.map(shingle => <DropdownMenuItem key={shingle} onClick={() => setFormData(prev => ({
                        ...prev,
                        wanted_roof: `Premium Architectural - ${shingle}`
                      }))} className="text-popover-foreground flex items-center gap-2">
                            {ROOF_IMAGES[shingle] && <img src={ROOF_IMAGES[shingle]} alt={shingle} className="w-8 h-8 object-cover rounded" />}
                            <span>{shingle}</span>
                          </DropdownMenuItem>)}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuItem onClick={() => setFormData(prev => ({
                    ...prev,
                    wanted_roof: '3-Tab Shingles'
                  }))} className="text-popover-foreground flex items-center gap-2">
                      {ROOF_IMAGES['3-Tab Shingles'] && <img src={ROOF_IMAGES['3-Tab Shingles']} alt="3-Tab Shingles" className="w-8 h-8 object-cover rounded" />}
                      <span>3-Tab Shingles</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFormData(prev => ({
                    ...prev,
                    wanted_roof: 'Brava Tile'
                  }))} className="text-popover-foreground flex items-center gap-2">
                      {ROOF_IMAGES['Brava Tile'] && <img src={ROOF_IMAGES['Brava Tile']} alt="Brava Tile" className="w-8 h-8 object-cover rounded" />}
                      <span>Brava Tile</span>
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="text-popover-foreground">Stone-Coated</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-72 bg-popover text-popover-foreground z-[100]">
                        {STONE_COATED.map(item => <DropdownMenuItem key={item} onClick={() => setFormData(prev => ({
                        ...prev,
                        wanted_roof: `Stone-Coated - ${item}`
                      }))} className="text-popover-foreground flex items-center gap-2">
                            {ROOF_IMAGES[item] && <img src={ROOF_IMAGES[item]} alt={item} className="w-8 h-8 object-cover rounded" />}
                            <span>{item}</span>
                          </DropdownMenuItem>)}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="text-popover-foreground">Standing Seam</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-80 bg-popover text-popover-foreground z-[100]">
                        {STANDING_SEAM.map(item => <DropdownMenuItem key={item} onClick={() => setFormData(prev => ({
                        ...prev,
                        wanted_roof: `Standing Seam - ${item}`
                      }))} className="text-popover-foreground flex items-center gap-2">
                            {ROOF_IMAGES[item] && <img src={ROOF_IMAGES[item]} alt={item} className="w-8 h-8 object-cover rounded" />}
                            <span>{item}</span>
                          </DropdownMenuItem>)}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="text-popover-foreground">Concrete Tile</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-72 bg-popover text-popover-foreground z-[100]">
                        {CONCRETE_TILE.map(item => <DropdownMenuItem key={item} onClick={() => setFormData(prev => ({
                        ...prev,
                        wanted_roof: `Concrete Tile - ${item}`
                      }))} className="text-popover-foreground flex items-center gap-2">
                            {ROOF_IMAGES[item] && <img src={ROOF_IMAGES[item]} alt={item} className="w-8 h-8 object-cover rounded" />}
                            <span>{item}</span>
                          </DropdownMenuItem>)}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="text-popover-foreground">Slate</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-72 bg-popover text-popover-foreground z-[100]">
                        {SLATE.map(item => <DropdownMenuItem key={item} onClick={() => setFormData(prev => ({
                        ...prev,
                        wanted_roof: `Slate - ${item}`
                      }))} className="text-popover-foreground flex items-center gap-2">
                            {ROOF_IMAGES[item] && <img src={ROOF_IMAGES[item]} alt={item} className="w-8 h-8 object-cover rounded" />}
                            <span>{item}</span>
                          </DropdownMenuItem>)}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="text-popover-foreground">Wood Shakes & Shingles</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-72 bg-popover text-popover-foreground z-[100]">
                        {WOOD_SHAKES.map(item => <DropdownMenuItem key={item} onClick={() => setFormData(prev => ({
                        ...prev,
                        wanted_roof: `Wood Shakes - ${item}`
                      }))} className="text-popover-foreground flex items-center gap-2">
                            {ROOF_IMAGES[item] && <img src={ROOF_IMAGES[item]} alt={item} className="w-8 h-8 object-cover rounded" />}
                            <span>{item}</span>
                          </DropdownMenuItem>)}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="existing_roof_deck" className="text-xs">Existing Roof Deck</Label>
                <Select value={formData.existing_roof_deck} onValueChange={value => setFormData(prev => ({
                ...prev,
                existing_roof_deck: value
              }))} disabled={loading}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select deck type" />
                  </SelectTrigger>
                  <SelectContent className="z-[100]">
                    {ROOF_DECK_OPTIONS.map(option => <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="wanted_roof_deck" className="text-xs">Wanted Roof Deck</Label>
                <Select value={formData.wanted_roof_deck} onValueChange={value => setFormData(prev => ({
                ...prev,
                wanted_roof_deck: value
              }))} disabled={loading}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select deck type" />
                  </SelectTrigger>
                  <SelectContent className="z-[100]">
                    {ROOF_DECK_OPTIONS.map(option => <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="insulation" className="text-xs">Insulation</Label>
                <Select value={formData.insulation} onValueChange={value => setFormData(prev => ({
                ...prev,
                insulation: value
              }))} disabled={loading}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select insulation" />
                  </SelectTrigger>
                  <SelectContent className="z-[100]">
                    {INSULATION_OPTIONS.map(option => <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="timeline" className="text-xs">Timeline</Label>
                <Select value={formData.timeline} onValueChange={value => setFormData(prev => ({
                ...prev,
                timeline: value
              }))} disabled={loading}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select timeline" />
                  </SelectTrigger>
                  <SelectContent className="z-[100]">
                    <SelectItem value="asap">ASAP</SelectItem>
                    <SelectItem value="1_month">Within 1 month</SelectItem>
                    <SelectItem value="3_months">Within 3 months</SelectItem>
                    <SelectItem value="6_months">Within 6 months</SelectItem>
                    <SelectItem value="planning">Just planning</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="notes" className="text-xs">Customer Notes & Requirements (AI-Powered)</Label>
              <Textarea id="notes" value={formData.notes} onChange={e => setFormData(prev => ({
              ...prev,
              notes: e.target.value
            }))} disabled={loading} rows={4} className="min-h-[100px]" placeholder="Customer Emails + SMS + Call Transcripts + Recordings from Consultation" />
              <p className="text-xs text-muted-foreground">
                💡 The more detailed the notes, the more accurate the AI-generated quote will be
              </p>
            </div>
          </form>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleSubmit} disabled={loading}>
              {loading ? <>
                  <Satellite className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </> : <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Quote
                </>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>;
}