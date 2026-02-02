import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, MapPin, Search } from 'lucide-react';
import { Loader } from '@googlemaps/js-api-loader';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface LocationSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (location: string) => void;
}

type ViewMode = 'menu' | 'search';

export const LocationSelectionModal: React.FC<LocationSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('menu');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [apiKey, setApiKey] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

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
        toast.error('Failed to load location services');
      }
    };

    fetchApiKey();
  }, []);

  useEffect(() => {
    if (viewMode === 'search' && inputRef.current && apiKey && !autocompleteRef.current) {
      initializeAutocomplete();
    }
  }, [viewMode, apiKey]);

  const initializeAutocomplete = async () => {
    if (!apiKey || !inputRef.current) {
      return;
    }

    try {
      const loader = new Loader({
        apiKey,
        version: 'weekly',
        libraries: ['places'],
      });

      await loader.load();

      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        fields: ['formatted_address', 'address_components', 'geometry']
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        console.log('Place selected:', place);
        
        if (place?.formatted_address) {
          onSelect(place.formatted_address);
          // Small delay to ensure the selection is processed
          setTimeout(() => {
            handleClose();
          }, 100);
        }
      });

      autocompleteRef.current = autocomplete;
    } catch (error) {
      console.error('Error loading Google Maps:', error);
      toast.error('Failed to load location search');
    }
  };

  const handleSelectCurrentLocation = async () => {
    if (!apiKey) {
      toast.error('Location services not available');
      return;
    }

    setLoading(true);
    
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
          );
          const data = await response.json();
          
          if (data.results && data.results[0]) {
            onSelect(data.results[0].formatted_address);
            handleClose();
          } else {
            onSelect(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
            handleClose();
          }
        } catch (error) {
          console.error('Error reverse geocoding:', error);
          onSelect(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          handleClose();
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        toast.error('Unable to retrieve your location');
        setLoading(false);
      }
    );
  };

  const handleClose = () => {
    setViewMode('menu');
    setSearchQuery('');
    autocompleteRef.current = null;
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="p-0 gap-0 max-w-[90vw] rounded-2xl z-[100]">
        <div className="p-6 pb-2 text-center">
          <DialogTitle className="text-xl font-semibold text-foreground">
            {viewMode === 'menu' ? 'Select Location' : 'Search Location'}
          </DialogTitle>
          <DialogDescription className="mt-2 text-muted-foreground">
            {viewMode === 'menu' 
              ? 'Choose to use your current location or search for an address' 
              : 'Enter an address to search'}
          </DialogDescription>
        </div>
        
        {viewMode === 'menu' ? (
          <div className="flex flex-col">
            <div className="p-6 space-y-3">
              <Button
                onClick={handleSelectCurrentLocation}
                disabled={loading}
                className="w-full h-14 rounded-full text-primary bg-transparent hover:bg-primary/5 text-base font-normal flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Getting location...
                  </>
                ) : (
                  <>
                    <MapPin className="w-5 h-5" />
                    My current location
                  </>
                )}
              </Button>
              
              <Button
                onClick={() => setViewMode('search')}
                className="w-full h-14 rounded-full text-primary bg-transparent hover:bg-primary/5 text-base font-normal flex items-center justify-center gap-2"
              >
                <Search className="w-5 h-5" />
                Search location
              </Button>
            </div>

            <div className="p-4">
              <Button
                variant="outline"
                onClick={handleClose}
                className="w-full rounded-full h-12"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="p-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  ref={inputRef}
                  placeholder="Enter an address"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 rounded-full"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-3 p-4 border-t">
              <Button
                variant="outline"
                onClick={() => setViewMode('menu')}
                className="flex-1 rounded-full h-12"
              >
                Back
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
