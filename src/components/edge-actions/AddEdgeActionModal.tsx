import { useState } from 'react';
import { EDGE_GROUPS, EdgeCategoryKey } from '@/config/edgeGroups';

export default function AddEdgeActionModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (input: { label: string; color: string; category: EdgeCategoryKey }) => Promise<void>;
}) {
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('#64748B');
  const [category, setCategory] = useState<EdgeCategoryKey>('wall_parapet');

  if (!open) return null;

  const handleCreate = async () => {
    if (!label.trim()) return;
    await onCreate({ label: label.trim(), color, category });
    setLabel('');
    setColor('#64748B');
    setCategory('wall_parapet');
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-5 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold">Add Custom Item</h3>

        <div className="space-y-2">
          <label className="text-sm font-medium">Name</label>
          <input
            className="w-full border rounded-md px-3 py-2"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Counter Flashing (special)"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <select
            className="w-full border rounded-md px-3 py-2"
            value={category}
            onChange={(e) => setCategory(e.target.value as EdgeCategoryKey)}
          >
            {EDGE_GROUPS.map((g) => (
              <option key={g.key} value={g.key}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Color</label>
          <input
            type="color"
            className="h-10 w-16 border rounded"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button className="px-4 py-2 rounded-md border hover:bg-gray-50" onClick={onClose}>
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-md bg-black text-white hover:bg-gray-800"
            onClick={handleCreate}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
