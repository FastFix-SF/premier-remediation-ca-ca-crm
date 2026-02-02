import { useState, useEffect, useCallback } from 'react';

interface PlaceDetails {
  description: string;
  place_id: string;
  city?: string;
  state?: string;
  zipCode?: string;
  lat?: number;
  lng?: number;
}

interface UsePlacesAutocompleteProps {
  onPlaceSelect: (place: PlaceDetails) => void;
  debounceMs?: number;
}

export function usePlacesAutocomplete({ 
  onPlaceSelect, 
  debounceMs = 300 
}: UsePlacesAutocompleteProps) {
  const [addressValue, setAddressValue] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [autocompleteService, setAutocompleteService] = useState<any>(null);
  const [placesService, setPlacesService] = useState<any>(null);

  // Initialize Google Places services
  useEffect(() => {
    const initializeServices = async () => {
      if (window.google?.maps?.places) {
        setAutocompleteService(new window.google.maps.places.AutocompleteService());
        // Create a dummy map for PlacesService (required but not displayed)
        const map = new window.google.maps.Map(document.createElement('div'));
        setPlacesService(new window.google.maps.places.PlacesService(map));
      } else {
        // Fallback: show manual address entry without Places API
        console.warn('Google Places API not available');
      }
    };

    initializeServices();
  }, []);

  // Debounced search function
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (addressValue && autocompleteService) {
        searchPlaces(addressValue);
      } else {
        setSuggestions([]);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [addressValue, autocompleteService, debounceMs]);

  const searchPlaces = useCallback((input: string) => {
    if (!autocompleteService || input.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);

    const request = {
      input,
      types: ['address'],
      componentRestrictions: { country: 'us' }
    };

    autocompleteService.getPlacePredictions(request, (predictions: any, status: any) => {
      setLoading(false);
      
      if (status === 'OK' && predictions) {
        const formattedSuggestions: PlaceDetails[] = predictions.map((prediction: any) => ({
          description: prediction.description,
          place_id: prediction.place_id
        }));
        setSuggestions(formattedSuggestions);
      } else {
        setSuggestions([]);
      }
    });
  }, [autocompleteService]);

  const selectPlace = useCallback((place: PlaceDetails) => {
    if (!placesService) return;

    setAddressValue(place.description);
    setSuggestions([]);
    setLoading(true);

    const request = {
      placeId: place.place_id,
      fields: ['address_components', 'geometry', 'formatted_address']
    };

    placesService.getDetails(request, (result: any, status: any) => {
      setLoading(false);
      
      if (status === 'OK' && result) {
        let city = '';
        let state = '';
        let zipCode = '';

        // Extract address components
        if (result.address_components) {
          for (const component of result.address_components) {
            const types = component.types;
            
            if (types.includes('locality')) {
              city = component.long_name;
            } else if (types.includes('administrative_area_level_1')) {
              state = component.short_name;
            } else if (types.includes('postal_code')) {
              zipCode = component.long_name;
            }
          }
        }

        const detailedPlace: PlaceDetails = {
          ...place,
          description: result.formatted_address || place.description,
          city,
          state,
          zipCode,
          lat: result.geometry?.location?.lat(),
          lng: result.geometry?.location?.lng()
        };

        onPlaceSelect(detailedPlace);
      } else {
        // Fallback: still call onPlaceSelect with basic info
        onPlaceSelect(place);
      }
    });
  }, [placesService, onPlaceSelect]);

  return {
    addressValue,
    setAddressValue,
    suggestions,
    loading,
    selectPlace
  };
}