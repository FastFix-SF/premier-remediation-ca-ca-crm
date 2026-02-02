export type EdgeKey = 'unlabeled'|'eave'|'rake'|'ridge'|'hip'|'valley'|'step'|'wall'|'pitch_change';

export type EdgeItem = {
  key: EdgeKey | string;
  label: string;
  color: string;
  dbId?: string;
  isMainCategory?: boolean;
};

export type EdgeGroup = {
  id: string;
  title: string;
  items: EdgeItem[];
};

export const DEFAULT_EDGE_GROUPS: EdgeGroup[] = [
  { id: 'unlabeled', title: 'Unlabeled', items: [{ key: 'unlabeled', label: 'Unlabeled', color: '#FCD34D' }] },
  { id: 'eave', title: 'Eave', items: [{ key: 'eave', label: 'Eave', color: '#DC2626' }] },
  { id: 'rake', title: 'Rake', items: [{ key: 'rake', label: 'Rake', color: '#9CA3AF' }] },
  { id: 'ridge', title: 'Ridge', items: [{ key: 'ridge', label: 'Ridge', color: '#A855F7' }] },
  { id: 'hip', title: 'Hip', items: [{ key: 'hip', label: 'Hip', color: '#92400E' }] },
  { id: 'valley', title: 'Valley', items: [{ key: 'valley', label: 'Valley', color: '#EC4899' }] },
  { id: 'step', title: 'Step', items: [{ key: 'step', label: 'Step', color: '#3B82F6' }] },
  { id: 'wall', title: 'Wall', items: [{ key: 'wall', label: 'Wall', color: '#06B6D4' }] },
];
