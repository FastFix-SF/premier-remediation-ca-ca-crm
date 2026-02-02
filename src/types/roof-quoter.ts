// Roof Quoter Types

export type EdgeLabel = 'EAVE' | 'RAKE' | 'RIDGE' | 'HIP' | 'VALLEY' | 'STEP' | 'WALL' | 'PITCH_CHANGE';

export interface Point {
  x: number;
  y: number;
}

export interface RoofQuoterProject {
  id: string;
  project_id: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  meta: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ImageryAsset {
  id: string;
  project_id: string;
  vendor: string;
  url: string;
  capture_date?: string;
  bounds_geojson?: any;
  created_at: string;
  updated_at: string;
}

export interface Facet {
  id: string;
  project_id: string;
  polygon_geojson: any;
  pitch: number;
  story: number;
  flags: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Edge {
  id: string;
  project_id: string;
  facet_id?: string;
  line_geojson: any;
  label: EdgeLabel;
  length_ft: number;
  created_at: string;
  updated_at: string;
}

export interface Pin {
  id: string;
  project_id: string;
  type: string;
  subtype?: string;
  size?: string;
  qty: number;
  position_point_geojson: any;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Quantities {
  project_id: string;
  area_sq: number;
  eave_lf: number;
  rake_lf: number;
  ridge_lf: number;
  hip_lf: number;
  valley_lf: number;
  wall_lf: number;
  step_lf: number;
  updated_at: string;
}

export interface PriceSheetLine {
  code: string;
  label: string;
  unit: 'SQ' | 'LF' | 'EA';
  qtyFrom: string;
  wastePct: number;
  unitCost: number;
  markupPct: number;
  notes?: string;
}

export interface PriceSheet {
  id: string;
  name: string;
  system: 'TPO' | 'METAL' | 'SHINGLE';
  lines: PriceSheetLine[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Estimate {
  id: string;
  project_id: string;
  price_sheet_id?: string;
  settings: {
    wastePct?: number;
    pitchFactors?: Record<string, number>;
    laborBurdenPct?: number;
    overheadPct?: number;
    markupPct?: number;
  };
  totals: {
    direct?: number;
    op?: number;
    total?: number;
    tax?: number;
  };
  created_at: string;
  updated_at: string;
}

export type QuoterTab = 'imagery' | 'draw' | 'edges' | 'facets' | 'pins' | 'estimate' | 'export';

export interface PinCategory {
  name: string;
  types: string[];
}

export const PIN_CATEGORIES: PinCategory[] = [
  {
    name: 'Equipment Curb',
    types: ['HVAC Unit', 'Exhaust Fan', 'Kitchen Hood']
  },
  {
    name: 'Skylight',
    types: ['Fixed Skylight', 'Venting Skylight', 'VSS 3040', 'VSS 2244']
  },
  {
    name: 'Sun Tunnel',
    types: ['10" Tunnel', '14" Tunnel', '18" Tunnel']
  },
  {
    name: 'Plumbing Boot',
    types: ['1.5" Boot', '2" Boot', '3" Boot', '4" Boot']
  },
  {
    name: 'Off-Ridge Vent',
    types: ['Static Vent', 'Power Vent', 'Turbine Vent']
  },
  {
    name: 'Chimney Flashing',
    types: ['Step Flashing', 'Pan Flashing', 'Cricket']
  },
  {
    name: 'Paint & Sealant',
    types: ['Sealant', 'Touch-up Paint', 'Primer']
  },
  {
    name: 'Misc',
    types: ['Drain', 'Scupper', 'Overflow Drain', 'Hatch', 'Access Panel']
  }
];

export const EDGE_COLORS: Record<EdgeLabel, string> = {
  EAVE: '#3B82F6', // blue
  RAKE: '#10B981', // green
  RIDGE: '#F59E0B', // yellow
  HIP: '#EF4444', // red
  VALLEY: '#8B5CF6', // purple
  STEP: '#F97316', // orange
  WALL: '#6B7280', // gray
  PITCH_CHANGE: '#EC4899' // pink
};