/// <reference types="@types/google.maps" />
import React, { useEffect, useRef, useState } from 'react';
import { Input } from './input';
import { useGooglePlaces } from '@/hooks/useGooglePlaces';
import { MapPin, Loader2 } from 'lucide-react';

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelected?: (place: any) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const GooglePlacesAutocomplete: React.FC<GooglePlacesAutocompleteProps> = ({
  value,
  onChange,
  onPlaceSelected,
  placeholder = 'Enter an address',
  disabled = false,
  className = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const positionDropdownRef = useRef<(() => void) | null>(null);
  const positionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { isLoaded, error } = useGooglePlaces();
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current || disabled) {
      return;
    }

    // Remove any existing pac-containers before creating new one
    const existingContainers = document.querySelectorAll('.pac-container');
    existingContainers.forEach(container => container.remove());

    setIsInitializing(true);

    try {
      // Initialize autocomplete
      const autocomplete = new (window as any).google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'us' }, // Restrict to US addresses
        fields: ['formatted_address', 'geometry', 'address_components', 'place_id'],
      });

      // Fix positioning and styles for dropdown
      positionDropdownRef.current = () => {
        const pacContainers = document.querySelectorAll('.pac-container') as NodeListOf<HTMLElement>;
        pacContainers.forEach((pacContainer, index) => {
          if (index === 0 && inputRef.current) {
            // Show and position only the first dropdown
            const rect = inputRef.current.getBoundingClientRect();
            pacContainer.style.position = 'fixed';
            pacContainer.style.left = `${rect.left}px`;
            pacContainer.style.top = `${rect.bottom + 2}px`;
            pacContainer.style.width = `${rect.width}px`;
            pacContainer.style.zIndex = '99999';
            pacContainer.style.display = 'block';
            pacContainer.style.visibility = 'visible';
            pacContainer.style.opacity = '1';
            pacContainer.style.pointerEvents = 'auto';
            
            // Mark it so dialog knows not to close
            pacContainer.setAttribute('data-google-autocomplete', 'true');
          } else {
            // Hide any duplicate dropdowns
            pacContainer.style.display = 'none';
          }
        });
      };

      // Continuously monitor and position pac-container
      positionIntervalRef.current = setInterval(() => {
        const pacContainer = document.querySelector('.pac-container');
        if (pacContainer && inputRef.current) {
          positionDropdownRef.current?.();
        }
      }, 100);

      // Wait for pac-container to be created and position it
      const observer = new MutationObserver(() => {
        const pacContainer = document.querySelector('.pac-container');
        if (pacContainer) {
          positionDropdownRef.current?.();
          observer.disconnect();
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });

      // Reposition on scroll and resize
      window.addEventListener('scroll', positionDropdownRef.current, true);
      window.addEventListener('resize', positionDropdownRef.current);

      // Trigger positioning on input interactions
      inputRef.current.addEventListener('focus', positionDropdownRef.current);
      inputRef.current.addEventListener('input', positionDropdownRef.current);

      // Listen for place selection
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        
        if (place.formatted_address) {
          // Small delay to ensure the autocomplete has finished processing
          setTimeout(() => {
            onChange(place.formatted_address);
            onPlaceSelected?.(place);
            
            // Keep focus on input to prevent dialog from closing
            if (inputRef.current) {
              inputRef.current.focus();
            }
          }, 0);
        }
      });

      autocompleteRef.current = autocomplete;
      setIsInitializing(false);
    } catch (err) {
      console.error('Error initializing autocomplete:', err);
      setIsInitializing(false);
    }

    // Cleanup
    return () => {
      if (autocompleteRef.current && (window as any).google?.maps?.event) {
        (window as any).google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
      if (positionIntervalRef.current) {
        clearInterval(positionIntervalRef.current);
        positionIntervalRef.current = null;
      }
      if (positionDropdownRef.current) {
        window.removeEventListener('scroll', positionDropdownRef.current, true);
        window.removeEventListener('resize', positionDropdownRef.current);
        if (inputRef.current) {
          inputRef.current.removeEventListener('focus', positionDropdownRef.current);
          inputRef.current.removeEventListener('input', positionDropdownRef.current);
        }
      }
      // Remove all pac-containers on cleanup
      const pacContainers = document.querySelectorAll('.pac-container');
      pacContainers.forEach(container => container.remove());
    };
  }, [isLoaded, disabled, onChange, onPlaceSelected]);

  if (error) {
    return (
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`pl-10 ${className}`}
        />
        <p className="text-xs text-red-500 mt-1">Address autocomplete unavailable</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {isInitializing ? (
        <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 animate-spin" />
      ) : (
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
      )}
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          // Prevent Enter key from submitting forms when selecting from dropdown
          if (e.key === 'Enter') {
            const pacContainer = document.querySelector('.pac-container:not([style*="display: none"])');
            if (pacContainer) {
              e.preventDefault();
            }
          }
        }}
        placeholder={placeholder}
        disabled={disabled || !isLoaded}
        className={`pl-10 ${className}`}
        autoComplete="off"
      />
      {!isLoaded && !error && (
        <p className="text-xs text-muted-foreground mt-1">Loading address autocomplete...</p>
      )}
    </div>
  );
};
