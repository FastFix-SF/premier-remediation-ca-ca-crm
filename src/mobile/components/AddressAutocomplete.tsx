import React, { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader } from '@googlemaps/js-api-loader';
import { supabase } from '@/integrations/supabase/client';

interface AddressDetails {
  fullAddress: string;
  streetAddress: string; // Number + street name only
  city?: string;
  state?: string;
  zip?: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onPlaceSelected?: (details: AddressDetails) => void;
  placeholder?: string;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  onPlaceSelected,
  placeholder = 'Enter address'
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.warn('No session found');
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-google-maps-key`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch Google Maps API key');
        }

        const { apiKey: key } = await response.json();
        setApiKey(key);
      } catch (error) {
        console.error('Error fetching API key:', error);
      }
    };

    fetchApiKey();
  }, []);

  useEffect(() => {
    if (!apiKey) {
      return;
    }

    const loader = new Loader({
      apiKey: apiKey,
      version: 'weekly',
      libraries: ['places']
    });

    loader.load().then(() => {
      setIsLoaded(true);
      if (inputRef.current) {
        const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
          types: ['address'],
          fields: ['formatted_address', 'address_components', 'geometry']
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.formatted_address) {
            onChange(place.formatted_address);
            
            // Parse address components
            if (onPlaceSelected && place.address_components) {
              let streetNumber = '';
              let route = '';
              let city = '';
              let state = '';
              let zip = '';
              
              for (const component of place.address_components) {
                const types = component.types;
                if (types.includes('street_number')) {
                  streetNumber = component.long_name;
                } else if (types.includes('route')) {
                  route = component.long_name;
                } else if (types.includes('locality')) {
                  city = component.long_name;
                } else if (types.includes('administrative_area_level_1')) {
                  state = component.short_name;
                } else if (types.includes('postal_code')) {
                  zip = component.long_name;
                }
              }
              
              const streetAddress = streetNumber && route 
                ? `${streetNumber} ${route}`
                : route || streetNumber || place.formatted_address.split(',')[0];
              
              onPlaceSelected({
                fullAddress: place.formatted_address,
                streetAddress,
                city,
                state,
                zip
              });
            }
          }
        });
      }
    }).catch((error) => {
      console.error('Error loading Google Maps:', error);
    });
  }, [apiKey, onChange, onPlaceSelected]);

  return (
    <div className="flex items-center gap-3 py-4 border-b border-border">
      <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      <div className="flex-1">
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="border-none shadow-none p-0 h-auto focus-visible:ring-0"
        />
      </div>
    </div>
  );
};
