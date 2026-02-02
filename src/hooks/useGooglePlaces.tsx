import { useEffect, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { supabase } from '@/integrations/supabase/client';

let googleMapsLoaded = false;
let loadPromise: Promise<void> | null = null;

// Get the functions base URL from supabase client
const getFunctionsUrl = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  return `${supabaseUrl}/functions/v1`;
};

export const useGooglePlaces = () => {
  const [isLoaded, setIsLoaded] = useState(googleMapsLoaded);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (googleMapsLoaded) {
      setIsLoaded(true);
      return;
    }

    if (loadPromise) {
      loadPromise.then(() => setIsLoaded(true)).catch((err) => setError(err.message));
      return;
    }

    const loadGoogleMaps = async () => {
      try {
        // Get the current session for auth token
        const { data: { session } } = await supabase.auth.getSession();
        const authToken = session?.access_token;

        // Fetch API key from edge function
        const functionsUrl = getFunctionsUrl();
        const response = await fetch(
          `${functionsUrl}/get-google-maps-key`,
          {
            headers: authToken ? {
              Authorization: `Bearer ${authToken}`,
            } : {},
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch Google Maps API key');
        }

        const { apiKey } = await response.json();

        const loader = new Loader({
          apiKey,
          version: 'weekly',
          libraries: ['places'],
        });

        await loader.load();
        googleMapsLoaded = true;
        setIsLoaded(true);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load Google Maps';
        setError(errorMessage);
        console.error('Error loading Google Maps:', err);
      }
    };

    loadPromise = loadGoogleMaps();
  }, []);

  return { isLoaded, error };
};
