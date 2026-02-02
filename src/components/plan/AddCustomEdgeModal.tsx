import { useState } from 'react';
import { Button } from '../ui/button';

export default function AddCustomEdgeModal({
  groupId, 
  onClose, 
  onSave,
  defaultColor = '#64748B'
}: { 
  groupId: string; 
  onClose: () => void; 
  onSave: (item: { key: string; label: string; color: string }) => void;
  defaultColor?: string;
}) {
  const [label, setLabel] = useState('');
  const [color, setColor] = useState(defaultColor);

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center" onClick={onClose}>
      <div className="bg-card text-card-foreground rounded-lg p-4 w-[320px] shadow-lg" onClick={e => e.stopPropagation()}>
        <h4 className="font-semibold mb-3 text-sm">Add Custom Item</h4>
        
        <div className="space-y-3">
          <div>
            <label className="block text-xs mb-1.5 font-medium">Label</label>
            <input 
              value={label} 
              onChange={e => setLabel(e.target.value)} 
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="e.g. Custom Flashing"
            />
          </div>
          
          <div>
            <label className="block text-xs mb-1.5 font-medium">Color</label>
            <input 
              type="color" 
              value={color} 
              onChange={e => setColor(e.target.value)} 
              className="w-full h-10 border rounded-md"
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={onClose} variant="outline" size="sm">
            Cancel
          </Button>
          <Button
            onClick={() => {
              // Generate a unique key using timestamp and random string
              const uniqueKey = `${label.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              onSave({ key: uniqueKey, label, color });
            }}
            disabled={!label.trim()}
            size="sm"
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
