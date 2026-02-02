import React, { useState, useEffect } from 'react';
import { X, Search, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DEFAULT_LABELS, 
  COLOR_OPTIONS, 
  type Label,
  getAllLabels,
  saveCustomLabel,
  deleteCustomLabel,
  getCustomLabels
} from '@/mobile/constants/labels';

interface LabelSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLabels: string[];
  onConfirm: (labels: string[]) => void;
}

export const LabelSelectionModal: React.FC<LabelSelectionModalProps> = ({
  isOpen,
  onClose,
  selectedLabels,
  onConfirm
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tempSelected, setTempSelected] = useState<string[]>(selectedLabels);
  const [showCreateLabel, setShowCreateLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(COLOR_OPTIONS[0]);
  const [labels, setLabels] = useState<Label[]>(getAllLabels());

  // Refresh labels when modal opens
  useEffect(() => {
    if (isOpen) {
      setLabels(getAllLabels());
      setTempSelected(selectedLabels);
    }
  }, [isOpen, selectedLabels]);

  const filteredLabels = labels.filter(label => 
    label.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleLabel = (labelId: string) => {
    setTempSelected(prev => 
      prev.includes(labelId) 
        ? prev.filter(id => id !== labelId) 
        : [...prev, labelId]
    );
  };

  const handleDeleteLabel = (labelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Only allow deleting custom labels (not DEFAULT_LABELS)
    const isDefaultLabel = DEFAULT_LABELS.some(l => l.id === labelId);
    if (!isDefaultLabel) {
      deleteCustomLabel(labelId);
    }
    setLabels(prev => prev.filter(label => label.id !== labelId));
    setTempSelected(prev => prev.filter(id => id !== labelId));
  };

  const handleCreateLabel = () => {
    if (newLabelName.trim()) {
      const newLabel: Label = {
        id: `custom_${Date.now()}`,
        name: newLabelName.trim().toUpperCase(),
        color: newLabelColor
      };
      saveCustomLabel(newLabel);
      setLabels(prev => [...prev, newLabel]);
      setTempSelected(prev => [...prev, newLabel.id]);
      setNewLabelName('');
      setNewLabelColor(COLOR_OPTIONS[0]);
      setShowCreateLabel(false);
    }
  };

  const handleConfirm = () => {
    onConfirm(tempSelected);
  };

  const isCustomLabel = (labelId: string) => {
    return !DEFAULT_LABELS.some(l => l.id === labelId);
  };

  if (showCreateLabel) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="p-0 gap-0 w-[95vw] max-w-[90vw] sm:max-w-md rounded-2xl">
          <DialogTitle className="sr-only">Create a new label</DialogTitle>
          <DialogDescription className="sr-only">
            Enter a name and choose a color for your new label
          </DialogDescription>
          <div className="flex flex-col">
            <div className="flex items-center justify-center p-3 sm:p-4 border-b">
              <h2 className="text-base sm:text-lg font-semibold">Create a new label</h2>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <Input 
                placeholder="Label name" 
                value={newLabelName} 
                onChange={e => setNewLabelName(e.target.value)} 
                className="text-sm sm:text-base" 
              />

              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-11 gap-2">
                {COLOR_OPTIONS.map(color => (
                  <button 
                    key={color} 
                    onClick={() => setNewLabelColor(color)} 
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-transform hover:scale-110 active:scale-95" 
                    style={{ backgroundColor: color }}
                  >
                    {newLabelColor === color && <span className="text-white text-lg sm:text-xl">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 p-3 sm:p-4">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateLabel(false)} 
                className="flex-1 rounded-full h-11 sm:h-12 text-sm sm:text-base"
              >
                Close
              </Button>
              <Button 
                onClick={handleCreateLabel} 
                className="flex-1 rounded-full h-11 sm:h-12 text-sm sm:text-base bg-primary text-primary-foreground"
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 gap-0 w-[95vw] max-w-[90vw] sm:max-w-lg md:max-w-xl rounded-2xl max-h-[85vh] sm:max-h-[80vh] flex flex-col">
        <DialogTitle className="sr-only">Label Selection</DialogTitle>
        <DialogDescription className="sr-only">Manage labels</DialogDescription>

        <div className="flex items-center justify-center p-3 sm:p-4 border-b">
          <h2 className="text-base sm:text-lg font-semibold">Select Labels</h2>
        </div>

        <div className="p-3 sm:p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 sm:w-5 sm:h-5" />
            <Input 
              placeholder="Search" 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              className="pl-9 sm:pl-10 bg-muted/50 border-none rounded-full text-sm sm:text-base h-10 sm:h-auto" 
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 sm:px-4">
          <div className="space-y-1.5 sm:space-y-2">
            {filteredLabels.map(label => (
              <div 
                key={label.id} 
                className="w-full flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 hover:bg-muted/50 rounded-lg transition-colors group"
              >
                <button 
                  onClick={() => handleToggleLabel(label.id)} 
                  className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0"
                >
                  <div 
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: label.color }} 
                  />
                  <span className="text-sm sm:text-base flex-1 text-left truncate">{label.name}</span>
                  <Checkbox checked={tempSelected.includes(label.id)} className="flex-shrink-0" />
                </button>
                {isCustomLabel(label.id) && (
                  <button 
                    onClick={(e) => handleDeleteLabel(label.id, e)} 
                    className="opacity-0 group-hover:opacity-100 sm:transition-opacity p-1.5 sm:p-2 hover:bg-destructive/10 rounded-md flex-shrink-0" 
                    aria-label="Delete label"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-destructive" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <Button 
            variant="outline" 
            onClick={() => setShowCreateLabel(true)} 
            className="w-full mt-3 sm:mt-4 mb-3 sm:mb-4 rounded-full h-11 sm:h-12 border-primary/20 text-sm sm:text-base"
          >
            + Add a new label
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 p-3 sm:p-4 border-t">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="flex-1 rounded-full h-11 sm:h-12 text-sm sm:text-base"
          >
            Close
          </Button>
          <Button 
            onClick={handleConfirm} 
            className="flex-1 rounded-full h-11 sm:h-12 text-sm sm:text-base bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-500 hover:to-teal-600 text-white"
          >
            Confirm selection
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
