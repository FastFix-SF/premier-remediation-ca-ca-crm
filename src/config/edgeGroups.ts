export type EdgeCategoryKey =
  | 'wall_parapet' | 'eave' | 'rake' | 'ridge' | 'valley' | 'step' | 'pitch_change';

export const EDGE_GROUPS: { key: EdgeCategoryKey; label: string }[] = [
  { key: 'wall_parapet', label: 'Wall/Parapet' },
  { key: 'eave',         label: 'Eave' },
  { key: 'rake',         label: 'Rake' },
  { key: 'ridge',        label: 'Ridge' },
  { key: 'valley',       label: 'Valley' },
  { key: 'step',         label: 'Step' },
  { key: 'pitch_change', label: 'Pitch change' },
];

export type EdgeActionItem = {
  id?: string;
  quote_id?: string;
  category: EdgeCategoryKey;
  label: string;
  color: string;
  is_custom?: boolean;
};

export const DEFAULT_EDGE_ACTIONS: EdgeActionItem[] = [
  // Wall/Parapet defaults
  { category: 'wall_parapet', label: 'Reglet',           color: '#3B82F6', is_custom: false },
  { category: 'wall_parapet', label: 'Counter Flashing', color: '#EF4444', is_custom: false },
  { category: 'wall_parapet', label: 'Coping Combo',     color: '#22C55E', is_custom: false },
  { category: 'wall_parapet', label: 'Break Stucco',     color: '#EAB308', is_custom: false },
];
