import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation, PermissionStatus } from '@capacitor/geolocation';

interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
}

type PermissionState = 'prompt' | 'granted' | 'denied' | 'denied-always';

interface UseSmartGeolocationResult {
  location: Location | null;
  error: string | null;
  permissionState: PermissionState;
  loading: boolean;
  requestPermission: () => Promise<boolean>;
  openSettings: () => Promise<void>;
  refresh: () => Promise<void>;
  canRequestAgain: boolean;
}

export const useSmartGeolocation = (): UseSmartGeolocationResult => {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState>('prompt');
  const [loading, setLoading] = useState(true);
  
  const isNative = Capacitor.isNativePlatform();

  // Check current permission status
  const checkPermission = useCallback(async (): Promise<PermissionState> => {
    if (isNative) {
      try {
        const status: PermissionStatus = await Geolocation.checkPermissions();
        console.log('[SmartGeo] Native permission status:', status.location);
        
        // Capacitor returns: 'prompt' | 'prompt-with-rationale' | 'granted' | 'denied'
        // On Android, 'denied' means "denied once" (can re-prompt)
        // 'denied' with coarseLocation also denied means "denied always"
        if (status.location === 'granted') {
          return 'granted';
        } else if (status.location === 'denied') {
          // Check if coarseLocation is also denied - this indicates permanent denial on Android
          if (status.coarseLocation === 'denied') {
            return 'denied-always';
          }
          return 'denied';
        }
        return 'prompt';
      } catch (err) {
        console.error('[SmartGeo] Error checking native permissions:', err);
        return 'prompt';
      }
    } else {
      // Web/PWA - use navigator.permissions API
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        console.log('[SmartGeo] Web permission status:', permission.state);
        
        if (permission.state === 'granted') {
          return 'granted';
        } else if (permission.state === 'denied') {
          return 'denied-always'; // Web doesn't allow re-prompting after denial
        }
        return 'prompt';
      } catch (err) {
        console.error('[SmartGeo] Error checking web permissions:', err);
        return 'prompt';
      }
    }
  }, [isNative]);

  // Get current position
  const getCurrentPosition = useCallback(async (): Promise<Location | null> => {
    if (isNative) {
      try {
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 300000,
        });
        
        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
      } catch (err: any) {
        console.error('[SmartGeo] Native getCurrentPosition error:', err);
        throw err;
      }
    } else {
      // Web fallback
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            });
          },
          (err) => {
            reject(err);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 300000,
          }
        );
      });
    }
  }, [isNative]);

  // Request permission (for native apps, this will show the permission dialog again if denied once)
  const requestPermission = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      if (isNative) {
        console.log('[SmartGeo] Requesting native permission...');
        const status = await Geolocation.requestPermissions();
        console.log('[SmartGeo] Permission result:', status.location);
        
        if (status.location === 'granted') {
          setPermissionState('granted');
          
          // Try to get location immediately
          try {
            const pos = await getCurrentPosition();
            setLocation(pos);
          } catch (posErr) {
            console.error('[SmartGeo] Error getting position after grant:', posErr);
          }
          
          setLoading(false);
          return true;
        } else {
          // Check if it's denied-always
          const currentState = await checkPermission();
          setPermissionState(currentState);
          setError(currentState === 'denied-always' 
            ? 'Location permanently denied. Please enable in Settings.'
            : 'Location denied. Tap to try again.');
          setLoading(false);
          return false;
        }
      } else {
        // Web - just try to get position, which will trigger permission prompt
        console.log('[SmartGeo] Requesting web permission via getCurrentPosition...');
        const pos = await getCurrentPosition();
        setLocation(pos);
        setPermissionState('granted');
        setError(null);
        setLoading(false);
        return true;
      }
    } catch (err: any) {
      console.error('[SmartGeo] Permission request error:', err);
      const currentState = await checkPermission();
      setPermissionState(currentState);
      
      if (isNative) {
        setError(currentState === 'denied-always'
          ? 'Location permanently denied. Please enable in Settings.'
          : 'Location denied. Tap to try again.');
      } else {
        setError('Location denied. Please enable in browser settings.');
      }
      
      setLoading(false);
      return false;
    }
  }, [isNative, getCurrentPosition, checkPermission]);

  // Open device settings (native only)
  const openSettings = useCallback(async () => {
    if (isNative) {
      try {
        // On Android/iOS, requesting permissions again when permanently denied 
        // will often open settings or show a dialog directing to settings
        await Geolocation.requestPermissions();
      } catch (err) {
        console.error('[SmartGeo] Error opening settings:', err);
      }
    } else {
      // For web, we can't open settings programmatically
      setError('Please enable location in your browser settings, then tap retry.');
    }
  }, [isNative]);

  // Refresh location
  const refresh = useCallback(async () => {
    setLoading(true);
    
    const currentPermission = await checkPermission();
    setPermissionState(currentPermission);
    
    if (currentPermission === 'granted') {
      try {
        const pos = await getCurrentPosition();
        setLocation(pos);
        setError(null);
      } catch (err: any) {
        console.error('[SmartGeo] Refresh error:', err);
        setError('Unable to get location. Please try again.');
      }
    } else if (currentPermission === 'prompt') {
      // Can request permission
      await requestPermission();
    } else {
      // Denied
      if (currentPermission === 'denied-always' || !isNative) {
        setError('Location denied. Please enable in settings.');
      } else {
        setError('Location denied. Tap to request again.');
      }
    }
    
    setLoading(false);
  }, [checkPermission, getCurrentPosition, requestPermission, isNative]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      
      const currentPermission = await checkPermission();
      setPermissionState(currentPermission);
      
      if (currentPermission === 'granted') {
        try {
          const pos = await getCurrentPosition();
          setLocation(pos);
          setError(null);
        } catch (err: any) {
          console.error('[SmartGeo] Init position error:', err);
          setError('Unable to get location');
        }
      } else if (currentPermission === 'prompt') {
        // Auto-request on first load
        await requestPermission();
      } else {
        // Denied state
        if (currentPermission === 'denied-always' || !isNative) {
          setError('Location denied. Please enable in settings.');
        } else {
          setError('Location denied. Tap to request again.');
        }
      }
      
      setLoading(false);
    };

    init();
    
    // Refresh location periodically (every 5 minutes)
    const interval = setInterval(() => {
      if (permissionState === 'granted') {
        getCurrentPosition().then(setLocation).catch(console.error);
      }
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Can we show the permission prompt again?
  const canRequestAgain = isNative && permissionState === 'denied';

  return {
    location,
    error,
    permissionState,
    loading,
    requestPermission,
    openSettings,
    refresh,
    canRequestAgain,
  };
};
