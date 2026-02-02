export interface Label {
  id: string;
  name: string;
  color: string;
}

export const DEFAULT_LABELS: Label[] = [
  { id: '1', name: 'METAL ROOF', color: '#8D6E63' },
  { id: '2', name: 'SHINGLE ROOF', color: '#64B5F6' },
  { id: '3', name: 'TILE ROOF', color: '#FF8A65' },
  { id: '4', name: 'TPO/PVC ROOF', color: '#81C784' },
  { id: '5', name: 'CUT AND DROP', color: '#FFB74D' },
  { id: '6', name: 'ROOF REPAIR', color: '#FF7043' },
  { id: '7', name: 'ROOF LEAK', color: '#D32F2F' },
  { id: '8', name: 'ROOF INSPECTOR REPORT', color: '#BA9B7C' },
  { id: '9', name: 'COMPLETED', color: '#66BB6A' },
  { id: '10', name: 'PAID', color: '#9CCC65' },
  { id: '11', name: 'APPROVED', color: '#D4C357' },
  { id: '12', name: 'PUBLIC WORKS', color: '#4A90E2' },
  { id: '13', name: 'GUTTER CLEANING', color: '#FDD835' },
  { id: '14', name: 'ON HOLD', color: '#C4C91F' }
];

export const COLOR_OPTIONS = [
  '#64B5F6', '#8D6E63', '#BA9B7C', '#FF8A65', '#FF7043', 
  '#FFB74D', '#FDD835', '#D4C357', '#9CCC65', '#81C784', '#66BB6A'
];

const CUSTOM_LABELS_KEY = 'custom_labels';

export const getCustomLabels = (): Label[] => {
  try {
    const stored = localStorage.getItem(CUSTOM_LABELS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveCustomLabel = (label: Label): void => {
  const customLabels = getCustomLabels();
  customLabels.push(label);
  localStorage.setItem(CUSTOM_LABELS_KEY, JSON.stringify(customLabels));
};

export const deleteCustomLabel = (labelId: string): void => {
  const customLabels = getCustomLabels().filter(l => l.id !== labelId);
  localStorage.setItem(CUSTOM_LABELS_KEY, JSON.stringify(customLabels));
};

export const getAllLabels = (): Label[] => {
  return [...DEFAULT_LABELS, ...getCustomLabels()];
};
