import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Phone, Mail, MapPin, Award, User } from 'lucide-react';

// Validation schema
export const businessProfileSchema = z.object({
  business_name: z.string().min(2, 'Business name must be at least 2 characters'),
  tagline: z.string().optional(),
  description: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address_line_1: z.string().optional(),
  address_line_2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  license_number: z.string().optional(),
  years_in_business: z.number().min(0).optional(),
  owner_name: z.string().optional(),
  owner_title: z.string().optional(),
});

export type BusinessProfileFormData = z.infer<typeof businessProfileSchema>;

interface BusinessProfileFormProps {
  defaultValues?: Partial<BusinessProfileFormData>;
  onSubmit: (data: BusinessProfileFormData) => void;
  isLoading?: boolean;
  submitLabel?: string;
  showCard?: boolean;
}

export const BusinessProfileForm: React.FC<BusinessProfileFormProps> = ({
  defaultValues,
  onSubmit,
  isLoading = false,
  submitLabel = 'Save',
  showCard = true,
}) => {
  const form = useForm<BusinessProfileFormData>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: {
      business_name: '',
      tagline: '',
      description: '',
      phone: '',
      email: '',
      address_line_1: '',
      address_line_2: '',
      city: '',
      state: '',
      zip_code: '',
      license_number: '',
      years_in_business: undefined,
      owner_name: '',
      owner_title: '',
      ...defaultValues,
    },
  });

  const content = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Business Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Building2 className="h-5 w-5" />
            <span>Business Information</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="business_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Roofing Co." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tagline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tagline</FormLabel>
                  <FormControl>
                    <Input placeholder="Quality roofing since 1990" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us about your business..."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  A brief description of your business that will appear on the website.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Phone className="h-5 w-5" />
            <span>Contact Information</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="(555) 123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="info@acmeroofing.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Address */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <MapPin className="h-5 w-5" />
            <span>Address</span>
          </div>

          <FormField
            control={form.control}
            name="address_line_1"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address Line 1</FormLabel>
                <FormControl>
                  <Input placeholder="123 Main Street" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address_line_2"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address Line 2</FormLabel>
                <FormControl>
                  <Input placeholder="Suite 100" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="San Francisco" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <FormControl>
                    <Input placeholder="CA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="zip_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ZIP Code</FormLabel>
                  <FormControl>
                    <Input placeholder="94102" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Credentials */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Award className="h-5 w-5" />
            <span>Credentials</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="license_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>License Number</FormLabel>
                  <FormControl>
                    <Input placeholder="CSLB #123456" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="years_in_business"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Years in Business</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="15"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Owner Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <User className="h-5 w-5" />
            <span>Owner Information</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="owner_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="owner_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner Title</FormLabel>
                  <FormControl>
                    <Input placeholder="CEO & Founder" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );

  if (!showCard) {
    return content;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Profile</CardTitle>
        <CardDescription>
          Enter your business information. This will be displayed on your public website.
        </CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
};
