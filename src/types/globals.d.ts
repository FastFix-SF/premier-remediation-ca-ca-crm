declare global {
  interface Window {
    dataLayer?: Array<Record<string, any>>;
    google?: {
      maps?: {
        places?: {
          AutocompleteService: new () => google.maps.places.AutocompleteService;
          PlacesService: new (map: google.maps.Map) => google.maps.places.PlacesService;
          PlacesServiceStatus: typeof google.maps.places.PlacesServiceStatus;
        };
        Map: new (element: Element, opts?: google.maps.MapOptions) => google.maps.Map;
      };
    };
  }
}

declare namespace google {
  namespace maps {
    class Map {
      constructor(element: Element, opts?: MapOptions);
    }
    
    interface MapOptions {
      center?: LatLng | LatLngLiteral;
      zoom?: number;
    }
    
    interface LatLng {
      lat(): number;
      lng(): number;
    }
    
    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    interface LatLngAltitudeLiteral {
      lat: number;
      lng: number;
      altitude: number;
    }
    
    // Google Maps 3D API types
    function importLibrary(libraryName: string): Promise<any>;

    namespace maps3d {
      interface Map3DElementOptions {
        center?: LatLngAltitudeLiteral;
        range?: number;
        tilt?: number;
        heading?: number;
        roll?: number;
      }

      class Map3DElement extends HTMLElement {
        constructor(options?: Map3DElementOptions);
        center: LatLngAltitudeLiteral;
        range: number;
        tilt: number;
        heading: number;
        roll: number;
      }

      enum MapMode {
        SATELLITE = 'SATELLITE',
        HYBRID = 'HYBRID'
      }
    }
    
    namespace places {
      class AutocompleteService {
        getPlacePredictions(
          request: AutocompletionRequest,
          callback: (predictions: AutocompletePrediction[] | null, status: PlacesServiceStatus) => void
        ): void;
      }
      
      class PlacesService {
        constructor(map: Map);
        getDetails(
          request: PlaceDetailsRequest,
          callback: (result: PlaceResult | null, status: PlacesServiceStatus) => void
        ): void;
      }
      
      interface AutocompletionRequest {
        input: string;
        types?: string[];
        componentRestrictions?: ComponentRestrictions;
      }
      
      interface ComponentRestrictions {
        country?: string | string[];
      }
      
      interface AutocompletePrediction {
        description: string;
        place_id: string;
        types: string[];
      }
      
      interface PlaceDetailsRequest {
        placeId: string;
        fields?: string[];
      }
      
      interface PlaceResult {
        address_components?: AddressComponent[];
        formatted_address?: string;
        geometry?: PlaceGeometry;
      }
      
      interface AddressComponent {
        long_name: string;
        short_name: string;
        types: string[];
      }
      
      interface PlaceGeometry {
        location?: LatLng;
      }
      
      enum PlacesServiceStatus {
        OK = 'OK',
        UNKNOWN_ERROR = 'UNKNOWN_ERROR',
        OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
        REQUEST_DENIED = 'REQUEST_DENIED',
        INVALID_REQUEST = 'INVALID_REQUEST',
        ZERO_RESULTS = 'ZERO_RESULTS',
        NOT_FOUND = 'NOT_FOUND'
      }
    }
  }
}

export {};