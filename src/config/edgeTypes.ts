export type EdgeType = 'unlabeled' | 'eave' | 'rake' | 'ridge' | 'hip' | 'valley' | 'step' | 'wall';

export interface EdgeDef {
  key: EdgeType;
  label: string;
  color: string;
  hotkey?: string;
  group?: string;
}

export const EDGE_TYPES: EdgeDef[] = [
  { key: 'unlabeled', label: 'UNLABELED', color: '#FCD34D', hotkey: '0', group: 'Special' },
  { key: 'eave',      label: 'EAVE',      color: '#EF4444', hotkey: '1', group: 'Edges' },
  { key: 'rake',      label: 'RAKE',      color: '#9CA3AF', hotkey: '2', group: 'Edges' },
  { key: 'ridge',     label: 'RIDGE',     color: '#A855F7', hotkey: '3', group: 'Edges' },
  { key: 'hip',       label: 'HIP',       color: '#92400E', hotkey: '4', group: 'Edges' },
  { key: 'valley',    label: 'VALLEY',    color: '#EC4899', hotkey: '5', group: 'Edges' },
  { key: 'step',      label: 'STEP',      color: '#3B82F6', hotkey: '6', group: 'Walls/Steps' },
  { key: 'wall',      label: 'WALL',      color: '#06B6D4', hotkey: '7', group: 'Walls/Steps' },
];

// Helper maps for quick lookups
export const EDGE_COLORS = EDGE_TYPES.reduce((acc, edge) => {
  acc[edge.key] = edge.color;
  return acc;
}, {} as Record<EdgeType, string>);

export const EDGE_LABELS = EDGE_TYPES.reduce((acc, edge) => {
  acc[edge.key] = edge.label;
  return acc;
}, {} as Record<EdgeType, string>);
