import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useMapboxToken = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('map-config');
        
        if (error) throw error;
        
        if (data?.mapboxPublicToken) {
          setToken(data.mapboxPublicToken);
        } else {
          setError('Mapbox token not configured');
        }
      } catch (err) {
        console.error('Error fetching Mapbox token:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch Mapbox token');
      } finally {
        setIsLoading(false);
      }
    };

    fetchToken();
  }, []);

  return { token, isLoading, error };
};
