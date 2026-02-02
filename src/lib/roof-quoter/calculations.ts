// Roof Quoter Calculation Utilities

import type { Facet, Edge, Quantities, PriceSheetLine } from '@/types/roof-quoter';

/**
 * Calculate slope factor for pitch (e.g., 4/12 pitch)
 * Formula: sqrt(1 + (rise/run)²)
 */
export const slopeFactor = (pitch: number): number => {
  const rise = pitch;
  const run = 12;
  return Math.sqrt(1 + Math.pow(rise / run, 2));
};

/**
 * Calculate polygon area using shoelace formula
 * Expects coordinates in feet
 */
export function planAreaSqFt(coords: [number, number][]): number {
  if (coords.length < 3) return 0;

  let area = 0;
  const n = coords.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += coords[i][0] * coords[j][1];
    area -= coords[j][0] * coords[i][1];
  }

  return Math.abs(area) / 2;
}

/**
 * Calculate line length between two points in feet
 */
export function lineLengthFt(a: [number, number], b: [number, number]): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Convert polygon coordinates from GeoJSON format to coordinate pairs
 */
export function extractCoordinates(geojson: any): [number, number][] {
  if (!geojson || !geojson.coordinates) return [];
  
  // Handle different GeoJSON structures
  if (geojson.type === 'Polygon') {
    return geojson.coordinates[0]; // First ring (exterior)
  } else if (geojson.type === 'LineString') {
    return geojson.coordinates;
  } else if (Array.isArray(geojson.coordinates)) {
    return geojson.coordinates;
  }
  
  return [];
}

/**
 * Aggregate quantities from facets and edges
 */
export function aggregateQuantities(facets: Facet[], edges: Edge[]): Quantities {
  // Calculate total sloped area from facets
  const areaSlope = facets.reduce((sum, facet) => {
    const coords = extractCoordinates(facet.polygon_geojson);
    const planArea = planAreaSqFt(coords);
    const slope = slopeFactor(Number(facet.pitch) || 4);
    return sum + (planArea * slope);
  }, 0);

  // Sum linear feet by edge type
  const sumLF = (label: string) => 
    edges.filter(e => e.label === label).reduce((sum, e) => sum + Number(e.length_ft), 0);

  return {
    project_id: facets[0]?.project_id || edges[0]?.project_id || '',
    area_sq: areaSlope / 100, // Convert to squares (100 sq ft each)
    eave_lf: sumLF('EAVE'),
    rake_lf: sumLF('RAKE'),
    ridge_lf: sumLF('RIDGE'),
    hip_lf: sumLF('HIP'),
    valley_lf: sumLF('VALLEY'),
    wall_lf: sumLF('WALL'),
    step_lf: sumLF('STEP'),
    updated_at: new Date().toISOString()
  };
}

/**
 * Calculate panels needed for metal roofing
 * Default panel width is 15 5/8" = 1.302 ft
 */
export const panelsNeeded = (runFt: number, panelWidthFt: number = 1.302): number => {
  return Math.ceil(runFt / panelWidthFt);
};

/**
 * Calculate quantity for a price sheet line based on qtyFrom field
 */
export function calculateLineQuantity(
  line: PriceSheetLine,
  quantities: Quantities,
  pins: any[] = [],
  manualQty: number = 0
): number {
  const { qtyFrom } = line;

  // Manual quantity
  if (qtyFrom === 'manual') {
    return manualQty;
  }

  // Direct quantity mappings
  const quantityMap: Record<string, number> = {
    area_sq: quantities.area_sq,
    eave_lf: quantities.eave_lf,
    rake_lf: quantities.rake_lf,
    ridge_lf: quantities.ridge_lf,
    hip_lf: quantities.hip_lf,
    valley_lf: quantities.valley_lf,
    wall_lf: quantities.wall_lf,
    step_lf: quantities.step_lf
  };

  if (quantityMap[qtyFrom] !== undefined) {
    return quantityMap[qtyFrom];
  }

  // Pin-based quantities (e.g., "pins:type=Drain")
  if (qtyFrom.startsWith('pins:')) {
    const filter = qtyFrom.replace('pins:', '');
    const [key, value] = filter.split('=');
    
    if (key === 'type') {
      return pins.filter(pin => pin.type === value).reduce((sum, pin) => sum + pin.qty, 0);
    }
  }

  return 0;
}

/**
 * Calculate extended price for a line item
 */
export function calculateExtendedPrice(
  baseQty: number,
  wastePct: number,
  unitCost: number,
  markupPct: number
): number {
  const wastedQty = baseQty * (1 + wastePct / 100);
  const materialCost = wastedQty * unitCost;
  const markedUpCost = materialCost * (1 + markupPct / 100);
  return markedUpCost;
}

/**
 * Calculate estimate totals
 */
export interface EstimateTotals {
  subtotal: number;
  overhead: number;
  profit: number;
  total: number;
}

export function calculateEstimateTotals(
  subtotal: number,
  overheadPct: number = 10,
  profitPct: number = 15
): EstimateTotals {
  const overhead = subtotal * (overheadPct / 100);
  const profit = (subtotal + overhead) * (profitPct / 100);
  const total = subtotal + overhead + profit;

  return {
    subtotal,
    overhead,
    profit,
    total
  };
}

/**
 * Generate scope letter content based on system type
 */
export function generateScopeContent(system: string, quantities: Quantities): string {
  const templates = {
    TPO: `
SCOPE OF WORK - TPO ROOFING SYSTEM

Substrate Preparation & Protection:
• Remove existing roofing materials as required
• Inspect and repair substrate as needed
• Install temporary protection as required

Insulation System:
• Install polyiso rigid insulation - final R-value/thickness per RFI
• Tapered ISO crickets where needed (parapets, upslope of RTUs, vents)
• Total area: ${quantities.area_sq.toFixed(1)} squares

Cover Board:
• Install 1/2" DensDeck cover board over insulation
• Mechanically fasten per manufacturer specifications

TPO Membrane System:
• Install 60-mil TPO membrane, mechanically attached
• Heat-welded seams throughout
• Compatible accessories and flashings
• Total membrane area: ${quantities.area_sq.toFixed(1)} squares

Perimeter Details:
• Counter-flash/term bars at walls: ${quantities.wall_lf.toFixed(0)} LF
• Reglet where TPO terminates into stucco/CMU
• Eave treatments: ${quantities.eave_lf.toFixed(0)} LF
• Rake treatments: ${quantities.rake_lf.toFixed(0)} LF

Additional Work:
• Walk pads at service paths
• Hatch/curb install labor only (Owner/GC provides units)
• Daily and final clean-up

EXCLUSIONS:
• Plumbing, electrical/mechanical work beyond flashing
• Structural repairs beyond normal substrate prep
• Building permits and fees
• Prevailing wage rates unless specifically directed
    `,
    METAL: `
SCOPE OF WORK - STANDING SEAM METAL ROOFING

Substrate Preparation:
• Install high-temp synthetic underlayment (40-mil minimum)
• Rigid insulation placeholder (confirm requirements via RFI)

Metal Panel System:
• Panels: 2" mechanical lock, 18" coverage, 22 ga minimum
• Kynar finish, double-lock seam construction
• Field-cut on site for precise fit
• Total area: ${quantities.area_sq.toFixed(1)} squares

Trim & Flashing Package:
• Eave trim: ${quantities.eave_lf.toFixed(0)} LF
• Rake trim: ${quantities.rake_lf.toFixed(0)} LF  
• Ridge cap: ${quantities.ridge_lf.toFixed(0)} LF
• Hip cap: ${quantities.hip_lf.toFixed(0)} LF
• Valley metal: ${quantities.valley_lf.toFixed(0)} LF
• Wall flashings: ${quantities.wall_lf.toFixed(0)} LF
• Color matched throughout

Additional Items:
• Gutters/downspouts as specified (manual LF/EA entry)
• Site clean-up and debris removal

EXCLUSIONS:
• Structural deck repair beyond normal prep
• HVAC equipment/curb supply
• Interior drainage/piping modifications  
• Building permits and inspection fees
• Prevailing wage rates unless specifically directed
    `
  };

  return templates[system as keyof typeof templates] || 'Scope of work to be determined based on selected system.';
}