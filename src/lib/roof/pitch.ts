/**
 * Roof pitch calculation utilities
 */

export interface PitchData {
  rise: number;
  run: number;
  angle: number;
  factor: number;
}

/**
 * Parse pitch string (e.g., "4/12", "6:12", "4") into rise and run
 */
export function parsePitch(pitchStr: string): { rise: number; run: number } {
  if (!pitchStr) return { rise: 4, run: 12 }; // Default 4/12 pitch
  
  const normalized = pitchStr.trim().replace(':', '/');
  
  if (normalized.includes('/')) {
    const parts = normalized.split('/');
    return {
      rise: parseFloat(parts[0]) || 4,
      run: parseFloat(parts[1]) || 12
    };
  } else {
    // Single number, assume /12
    return {
      rise: parseFloat(normalized) || 4,
      run: 12
    };
  }
}

/**
 * Calculate pitch factor for surface area calculations
 * Formula: sqrt(1 + (rise/run)²)
 */
export function calculatePitchFactor(rise: number, run: number): number {
  if (run === 0) return 1;
  
  const slope = rise / run;
  return Math.sqrt(1 + (slope * slope));
}

/**
 * Calculate pitch angle in degrees
 */
export function calculatePitchAngle(rise: number, run: number): number {
  if (run === 0) return 0;
  
  const radians = Math.atan(rise / run);
  return (radians * 180) / Math.PI;
}

/**
 * Get complete pitch data from pitch string
 */
export function getPitchData(pitchStr: string): PitchData {
  const { rise, run } = parsePitch(pitchStr);
  const factor = calculatePitchFactor(rise, run);
  const angle = calculatePitchAngle(rise, run);
  
  return { rise, run, angle, factor };
}

/**
 * Calculate surface area from plan area using pitch factor
 */
export function calculateSurfaceArea(planArea: number, pitchStr: string): number {
  const { factor } = getPitchData(pitchStr);
  return planArea * factor;
}

/**
 * Calculate plan squares (plan area / 100)
 */
export function calculatePlanSquares(planArea: number): number {
  return planArea / 100;
}

/**
 * Calculate surface squares (surface area / 100)
 */
export function calculateSurfaceSquares(surfaceArea: number): number {
  return surfaceArea / 100;
}

/**
 * Common pitch presets
 */
export const PITCH_PRESETS = [
  { label: '2/12 (Low)', value: '2/12' },
  { label: '3/12 (Low)', value: '3/12' },
  { label: '4/12 (Standard)', value: '4/12' },
  { label: '5/12 (Standard)', value: '5/12' },
  { label: '6/12 (Standard)', value: '6/12' },
  { label: '7/12 (Steep)', value: '7/12' },
  { label: '8/12 (Steep)', value: '8/12' },
  { label: '9/12 (Steep)', value: '9/12' },
  { label: '10/12 (Very Steep)', value: '10/12' },
  { label: '12/12 (Very Steep)', value: '12/12' }
];