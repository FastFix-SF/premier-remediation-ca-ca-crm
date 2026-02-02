import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Upload, X } from 'lucide-react';
import { usePlacesAutocomplete } from '@/hooks/usePlacesAutocomplete';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().regex(/^\(\d{3}\) \d{3}-\d{4}$/, 'Please enter a valid phone number'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code'),
  projectType: z.string().min(1, 'Please select a project type'),
  propertyType: z.string().min(1, 'Please select a property type'),
  timeline: z.string().min(1, 'Please select a timeline'),
  notes: z.string().optional(),
  roofType: z.string().optional(),
  placeId: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface QuoteFormProps {
  onSubmitSuccess: (data: FormData) => void;
  onFieldChange: (field: string, value: any) => void;
}

const roofTypes = [
  { id: 'shingle', label: 'Asphalt Shingle', color: 'bg-slate-500' },
  { id: 'metal-standing-seam', label: 'Metal - Standing Seam', color: 'bg-zinc-600' },
  { id: 'metal-corrugated', label: 'Metal - Corrugated', color: 'bg-zinc-500' },
  { id: 'tile', label: 'Tile', color: 'bg-orange-600' },
  { id: 'flat-tpo', label: 'Flat/TPO', color: 'bg-gray-400' },
  { id: 'not-sure', label: 'Not Sure', color: 'bg-gray-300' },
];

export function QuoteForm({ onSubmitSuccess, onFieldChange }: QuoteFormProps) {
  const [currentStep, setCurrentStep] = useState('contact');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onBlur',
  });

  const { register, handleSubmit, formState: { errors, isValid }, watch, setValue, trigger } = form;
  const watchedValues = watch();

  const { 
    addressValue, 
    setAddressValue, 
    suggestions, 
    loading, 
    selectPlace 
  } = usePlacesAutocomplete({
    onPlaceSelect: (place) => {
      setValue('address', place.description);
      setValue('city', place.city || '');
      setValue('state', place.state || '');
      setValue('zipCode', place.zipCode || '');
      setValue('placeId', place.place_id);
      setValue('lat', place.lat);
      setValue('lng', place.lng);
      trigger(['address', 'city', 'state', 'zipCode']);
      onFieldChange('address', place.description);
      onFieldChange('city', place.city);
      onFieldChange('state', place.state);
      onFieldChange('zipCode', place.zipCode);
    }
  });

  const formatPhoneNumber = (value: string) => {
    const phoneNumber = value.replace(/\D/g, '');
    if (phoneNumber.length >= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    } else if (phoneNumber.length >= 3) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    } else {
      return phoneNumber;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setValue('phone', formatted);
    onFieldChange('phone', formatted);
  };

  const handleRoofTypeSelect = (roofTypeId: string) => {
    setValue('roofType', roofTypeId);
    onFieldChange('roofType', roofTypeId);
    
    // Auto-set project type based on roof type
    if (roofTypeId.includes('metal')) {
      setValue('projectType', 'metal-roofing');
    } else if (roofTypeId === 'shingle') {
      setValue('projectType', 'residential-roofing');
    }
    trigger('roofType');
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    
    const newFiles = Array.from(files).slice(0, 5 - uploadedFiles.length);
    const validFiles = newFiles.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      return isValidType && isValidSize;
    });

    if (validFiles.length !== newFiles.length) {
      toast({
        title: "Some files were skipped",
        description: "Only image files under 10MB are allowed.",
        variant: "destructive"
      });
    }

    setUploadedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    try {
      // Track analytics
      if (typeof window !== 'undefined' && window.dataLayer) {
        window.dataLayer.push({
          event: 'quote_form_submitted',
          project_type: data.projectType,
          roof_type: data.roofType,
          property_type: data.propertyType
        });
      }

      // Submit to existing endpoint
      const response = await supabase.functions.invoke('create-crm-lead', {
        body: {
          ...data,
          photos: uploadedFiles.length > 0 ? uploadedFiles : undefined
        }
      });

      if (response.error) {
        throw response.error;
      }

      // Track success
      if (typeof window !== 'undefined' && window.dataLayer) {
        window.dataLayer.push({ event: 'quote_form_success' });
      }

      onSubmitSuccess(data);
      
      toast({
        title: "Quote Request Submitted!",
        description: "We'll analyze your roof and send a detailed proposal within 24 hours."
      });

    } catch (error) {
      toast({
        title: "Error submitting quote request",
        description: "Please try again or contact us directly.",
        variant: "destructive"
      });
    }
  };

  const getProgress = () => {
    const contactValid = watchedValues.firstName && watchedValues.lastName && watchedValues.email && watchedValues.phone;
    const addressValid = watchedValues.address && watchedValues.city && watchedValues.state && watchedValues.zipCode;
    const projectValid = watchedValues.projectType && watchedValues.propertyType && watchedValues.timeline;
    
    if (projectValid) return 100;
    if (addressValid) return 66;
    if (contactValid) return 33;
    return 0;
  };

  const isStepValid = (step: string) => {
    switch (step) {
      case 'contact':
        return !errors.firstName && !errors.lastName && !errors.email && !errors.phone && 
               watchedValues.firstName && watchedValues.lastName && watchedValues.email && watchedValues.phone;
      case 'address':
        return !errors.address && !errors.city && !errors.state && !errors.zipCode &&
               watchedValues.address && watchedValues.city && watchedValues.state && watchedValues.zipCode;
      case 'project':
        return !errors.projectType && !errors.propertyType && !errors.timeline &&
               watchedValues.projectType && watchedValues.propertyType && watchedValues.timeline;
      default:
        return false;
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Mobile Progress Bar */}
      <div className="md:hidden">
        <Progress value={getProgress()} className="h-2" />
        <p className="text-sm text-muted-foreground mt-2">{getProgress()}% Complete</p>
      </div>

      <Accordion type="single" value={currentStep} onValueChange={setCurrentStep} className="w-full">
        {/* Contact Information */}
        <AccordionItem value="contact">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                isStepValid('contact') ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {isStepValid('contact') ? <CheckCircle className="w-5 h-5" /> : '1'}
              </div>
              <span className="font-semibold">Contact Information</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardHeader>
                <CardTitle>Let's get your contact details</CardTitle>
                <p className="text-muted-foreground">We'll only use this to deliver your quote—no spam.</p>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    {...register('firstName', {
                      onChange: (e) => onFieldChange('firstName', e.target.value)
                    })}
                    className={errors.firstName ? 'border-destructive' : ''}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-destructive mt-1">{errors.firstName.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    {...register('lastName', {
                      onChange: (e) => onFieldChange('lastName', e.target.value)
                    })}
                    className={errors.lastName ? 'border-destructive' : ''}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-destructive mt-1">{errors.lastName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email', {
                      onChange: (e) => onFieldChange('email', e.target.value)
                    })}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    placeholder="(555) 123-4567"
                    {...register('phone')}
                    onChange={handlePhoneChange}
                    className={errors.phone ? 'border-destructive' : ''}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Property Address */}
        <AccordionItem value="address" disabled={!isStepValid('contact')}>
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                isStepValid('address') ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {isStepValid('address') ? <CheckCircle className="w-5 h-5" /> : '2'}
              </div>
              <span className="font-semibold">Property Address</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardHeader>
                <CardTitle>Where is your property located?</CardTitle>
                <p className="text-muted-foreground">Type your street address and select from the list.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Label htmlFor="address">Property Address *</Label>
                  <Input
                    id="address"
                    value={addressValue}
                    onChange={(e) => setAddressValue(e.target.value)}
                    placeholder="123 Main Street, City, State"
                    className={errors.address ? 'border-destructive' : ''}
                  />
                  {suggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          className="w-full px-4 py-2 text-left hover:bg-muted"
                          onClick={() => selectPlace(suggestion)}
                        >
                          {suggestion.description}
                        </button>
                      ))}
                    </div>
                  )}
                  {errors.address && (
                    <p className="text-sm text-destructive mt-1">{errors.address.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      {...register('city')}
                      className={errors.city ? 'border-destructive' : ''}
                      readOnly
                    />
                    {errors.city && (
                      <p className="text-sm text-destructive mt-1">{errors.city.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      {...register('state')}
                      className={errors.state ? 'border-destructive' : ''}
                      readOnly
                    />
                    {errors.state && (
                      <p className="text-sm text-destructive mt-1">{errors.state.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="zipCode">ZIP Code *</Label>
                    <Input
                      id="zipCode"
                      {...register('zipCode')}
                      className={errors.zipCode ? 'border-destructive' : ''}
                      readOnly
                    />
                    {errors.zipCode && (
                      <p className="text-sm text-destructive mt-1">{errors.zipCode.message}</p>
                    )}
                  </div>
                </div>

                {watchedValues.address && isStepValid('address') && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span>Address confirmed</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Project Details */}
        <AccordionItem value="project" disabled={!isStepValid('address')}>
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                isStepValid('project') ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {isStepValid('project') ? <CheckCircle className="w-5 h-5" /> : '3'}
              </div>
              <span className="font-semibold">Project Details</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardHeader>
                <CardTitle>Tell us about your roofing project</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Roof Type Chips */}
                <div>
                  <Label>What type of roof do you have? (Optional)</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {roofTypes.map((roof) => (
                      <Badge
                        key={roof.id}
                        variant={watchedValues.roofType === roof.id ? "default" : "outline"}
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                        onClick={() => handleRoofTypeSelect(roof.id)}
                      >
                        <div className={`w-3 h-3 rounded-full ${roof.color} mr-2`} />
                        {roof.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="projectType">Project Type *</Label>
                    <Select onValueChange={(value) => {
                      setValue('projectType', value);
                      onFieldChange('projectType', value);
                      trigger('projectType');
                    }}>
                      <SelectTrigger className={errors.projectType ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select project type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="residential-roofing">Residential Roofing</SelectItem>
                        <SelectItem value="commercial-roofing">Commercial Roofing</SelectItem>
                        <SelectItem value="metal-roofing">Metal Roofing</SelectItem>
                        <SelectItem value="roof-repair">Roof Repair</SelectItem>
                        <SelectItem value="roof-replacement">Roof Replacement</SelectItem>
                        <SelectItem value="roof-inspection">Roof Inspection</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.projectType && (
                      <p className="text-sm text-destructive mt-1">{errors.projectType.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="propertyType">Property Type *</Label>
                    <Select onValueChange={(value) => {
                      setValue('propertyType', value);
                      onFieldChange('propertyType', value);
                      trigger('propertyType');
                    }}>
                      <SelectTrigger className={errors.propertyType ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select property type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single-family">Single Family Home</SelectItem>
                        <SelectItem value="multi-family">Multi-Family Home</SelectItem>
                        <SelectItem value="commercial">Commercial Building</SelectItem>
                        <SelectItem value="industrial">Industrial Building</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.propertyType && (
                      <p className="text-sm text-destructive mt-1">{errors.propertyType.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="timeline">Project Timeline *</Label>
                  <Select onValueChange={(value) => {
                    setValue('timeline', value);
                    onFieldChange('timeline', value);
                    trigger('timeline');
                  }}>
                    <SelectTrigger className={errors.timeline ? 'border-destructive' : ''}>
                      <SelectValue placeholder="When would you like to start?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asap">As Soon As Possible</SelectItem>
                      <SelectItem value="1-month">Within 1 Month</SelectItem>
                      <SelectItem value="3-months">Within 3 Months</SelectItem>
                      <SelectItem value="6-months">Within 6 Months</SelectItem>
                      <SelectItem value="planning">Just Planning / Getting Quotes</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.timeline && (
                    <p className="text-sm text-destructive mt-1">{errors.timeline.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Tell us about leaks, skylights, or preferred materials…"
                    {...register('notes', {
                      onChange: (e) => onFieldChange('notes', e.target.value)
                    })}
                    rows={4}
                  />
                </div>

                {/* Photo Upload */}
                <div>
                  <Label>Property Photos (Optional)</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Optional—front, back, and any trouble spots (max 5)
                  </p>
                  
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      handleFileUpload(e.dataTransfer.files);
                    }}
                  >
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground mb-2">
                      Drag and drop images here, or{' '}
                      <label className="text-primary cursor-pointer hover:underline">
                        browse files
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e.target.files)}
                        />
                      </label>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Max 5 images, up to 10MB each
                    </p>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-20 object-cover rounded border"
                          />
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/80"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <p className="text-xs truncate mt-1">{file.name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </form>
  );
}