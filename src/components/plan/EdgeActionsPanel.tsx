import { useState, useEffect } from 'react';
import { type EdgeGroup, type EdgeItem } from '@/config/edgeActions';
import { useEdgeCategories } from '@/hooks/useEdgeCategories';
import { useUpdateEdgeCategory, useCreateEdgeCategory } from '@/hooks/useUpdateEdgeCategory';
import AddCustomEdgeModal from './AddCustomEdgeModal';
import { Button } from '../ui/button';
import { Plus, Pencil, Check } from 'lucide-react';
import { toast } from 'sonner';

const STORAGE_KEY = 'edge-action-groups';

type Props = {
  value: string | null;
  selectedLabels?: string[];
  selectedGroupId?: string | null;
  onChange: (edgeKey: string, item: EdgeItem) => void;
  onMultiChange?: (labels: string[], color: string, groupId: string) => void;
  mode?: 'draw' | 'edges';
  onDeselect?: () => void;
};

export default function EdgeActionsPanel({
  value,
  selectedLabels = [],
  selectedGroupId = null,
  onChange,
  onMultiChange,
  mode = 'edges',
  onDeselect
}: Props) {
  const { data: edgeCategories, isLoading } = useEdgeCategories();
  const { mutate: updateCategory } = useUpdateEdgeCategory();
  const { mutate: createCategory } = useCreateEdgeCategory();
  
  // Define which categories should be main categories
  const MAIN_CATEGORIES = ['unlabeled', 'eave', 'rake', 'ridge', 'hip', 'valley', 'step', 'wall', 'pitch_change'];
  
  // Transform database categories into EdgeGroup format
  const dbGroups: EdgeGroup[] = edgeCategories ? (() => {
    const groups: EdgeGroup[] = [];
    
    // First pass: create groups for main categories
    edgeCategories.forEach(cat => {
      if (MAIN_CATEGORIES.includes(cat.key)) {
        groups.push({
          id: cat.key,
          title: cat.label,
          items: [{
            key: cat.key,
            label: cat.label,
            color: cat.color,
            dbId: cat.id,
            isMainCategory: true // Mark as main category
          }]
        });
      }
    });
    
    // Second pass: add subcategories to their parent groups
    edgeCategories.forEach(cat => {
      if (!MAIN_CATEGORIES.includes(cat.key) && cat.group_name) {
        const parentGroup = groups.find(g => g.id === cat.group_name);
        if (parentGroup) {
          parentGroup.items.push({
            key: cat.key,
            label: cat.label,
            color: cat.color,
            dbId: cat.id
          });
        }
      }
    });
    
    return groups;
  })() : [];

  const [groups, setGroups] = useState<EdgeGroup[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });
  
  const [openId, setOpenId] = useState<string | null>('unlabeled');
  const [showAdd, setShowAdd] = useState(false);
  const [targetGroup, setTargetGroup] = useState<string>('unlabeled');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');

  // Merge database groups with custom groups from localStorage
  useEffect(() => {
    if (edgeCategories && edgeCategories.length > 0) {
      const customGroups = groups.filter(g => 
        !dbGroups.find(dbG => dbG.id === g.id)
      );
      const mergedGroups = [...dbGroups, ...customGroups];
      
      // Remove any duplicate groups by id (keep first occurrence)
      const uniqueGroups = mergedGroups.filter((g, index, self) => 
        self.findIndex(sg => sg.id === g.id) === index
      );
      
      setGroups(uniqueGroups);
    }
  }, [edgeCategories]);

  useEffect(() => {
    // Only save custom groups (not database groups)
    const customGroups = groups.filter(g => 
      !dbGroups.find(dbG => dbG.id === g.id)
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customGroups));
  }, [groups, dbGroups]);

  const handleAdd = (groupId: string, item: EdgeItem) => {
    // Save custom subcategory to database
    createCategory({
      key: item.key,
      label: item.label,
      color: item.color,
      parentKey: groupId // Link to parent group
    });
    
    // Note: The local state will be updated automatically when the database
    // query invalidates and refetches the edge categories
  };

  const handleEdit = (item: EdgeItem) => {
    setEditingKey(item.key);
    setEditLabel(item.label);
  };

  const handleSaveEdit = (groupId: string, itemKey: string) => {
    if (!editLabel.trim()) {
      setEditingKey(null);
      return;
    }
    
    // Find the item to get its dbId
    const group = groups.find(g => g.id === groupId);
    const item = group?.items.find(i => i.key === itemKey);
    
    if (!item?.dbId) {
      console.error('Cannot save: item has no database ID', item);
      toast.error('Cannot save: subcategory not found in database');
      setEditingKey(null);
      return;
    }
    
    // Save subcategory to database (does NOT change main button)
    updateCategory({
      id: item.dbId,
      label: editLabel.trim()
    });
    
    // Update local state to reflect the change immediately
    setGroups(g => g.map(gr => gr.id === groupId ? {
      ...gr,
      items: gr.items.map(it => 
        it.key === itemKey ? { ...it, label: editLabel.trim() } : it
      )
    } : gr));
    
    setEditingKey(null);
    setEditLabel('');
  };

  // Filter groups based on mode and remove duplicates by id
  const visibleGroups = mode === 'draw' 
    ? groups.filter(g => g.id === 'unlabeled')
    : groups.filter((g, index, self) => {
        // Only show groups that are not unlabeled
        if (g.id === 'unlabeled') return false;
        
        // Remove duplicates by id (keep first occurrence from DB)
        const firstIndex = self.findIndex(sg => sg.id === g.id);
        if (firstIndex !== index) return false;
        
        // Ensure this is a main category we want to show
        return MAIN_CATEGORIES.includes(g.id);
      });

  return <div className="space-y-0">
      <div className="space-y-0">
        {visibleGroups.map(gr => {
          const mainItem = gr.items.find(item => item.isMainCategory);
          const subcategories = gr.items.filter(item => !item.isMainCategory);
          const selectedItem = subcategories.find(item => item.key === value);
          const displayColor = selectedItem?.color || mainItem?.color || '#94A3B8';
          const isOpen = openId === gr.id;
          const isUnlabeled = gr.id === 'unlabeled';
          const isActiveGroup = selectedGroupId === gr.id;
          const hasSelections = isActiveGroup && selectedLabels.length > 0;
          
          // For unlabeled, render as a direct button without dropdown
          if (isUnlabeled) {
            const item = mainItem || gr.items[0]; // Get main item or fallback
            if (!item) return null;
            const selected = value === item.key;
            
            return <div key={gr.id}>
              <button
                onClick={() => {
                  // Toggle: if already selected, deselect it
                  if (selected && onDeselect) {
                    onDeselect();
                  } else {
                    onChange(item.key, item);
                  }
                }}
                className={`w-full flex items-center gap-2 px-0 py-2 transition-all
                  ${selected ? 'ring-2 ring-offset-2 ring-primary' : 'opacity-70 hover:opacity-100'}`}
              >
                <span className="inline-block w-10 h-10 flex-shrink-0" style={{
                  backgroundColor: displayColor
                }} />
                <span className="text-base font-normal uppercase underline">{gr.title}</span>
              </button>
            </div>;
          }
          
          return <div key={gr.id}>
            <button 
              onClick={() => {
                // Toggle dropdown
                setOpenId(isOpen ? null : gr.id);
                
                // Select the main category item for drawing (color only, no label)
                if (mainItem) {
                  onChange(mainItem.key, {
                    ...mainItem,
                    label: '' // Empty label so only color is applied
                  });
                }
              }} 
              className={`w-full flex items-center gap-2 px-0 py-2 transition-colors
                ${isOpen || hasSelections || value === mainItem?.key ? 'opacity-100' : 'opacity-70 hover:opacity-100'}
                ${(hasSelections && !isOpen) || value === mainItem?.key ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
            >
              <span className="inline-block w-10 h-10 flex-shrink-0" style={{
                backgroundColor: displayColor
              }} />
              <span className="text-base font-normal uppercase underline">
                {gr.title}
                {hasSelections && ` (${selectedLabels.length})`}
              </span>
            </button>

            {isOpen && <div className="pl-12 space-y-1 pb-2 relative z-50">
              {subcategories.map(item => {
                const isLabelSelected = isActiveGroup && selectedLabels.includes(item.label);
                const isEditing = editingKey === item.key;
                
                return <div 
                  key={item.key} 
                  className={`group w-full flex items-center gap-2 px-2 py-1.5 rounded transition-all text-sm font-medium
                    ${isLabelSelected ? 'ring-2 ring-offset-2 ring-primary' : 'hover:scale-[1.02]'}`}
                  style={{
                    backgroundColor: displayColor,
                    color: 'white'
                  }}
                >
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(gr.id, item.key);
                          if (e.key === 'Escape') setEditingKey(null);
                        }}
                        className="flex-1 bg-white/20 border border-white/30 rounded px-2 py-0.5 text-white placeholder:text-white/60 focus:outline-none focus:ring-1 focus:ring-white"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(gr.id, item.key)}
                        className="p-1 hover:bg-white/20 rounded"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <>
                      <input
                        type="checkbox"
                        checked={isLabelSelected}
                        onChange={() => {
                          // If selecting from a different group, clear previous selections
                          const newLabels = isLabelSelected
                            ? selectedLabels.filter(l => l !== item.label)
                            : (isActiveGroup ? [...selectedLabels, item.label] : [item.label]);
                          onMultiChange?.(newLabels, displayColor, gr.id);
                        }}
                        className="w-4 h-4 cursor-pointer accent-white"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <label
                        className="flex-1 cursor-pointer"
                        onClick={() => {
                          const newLabels = isLabelSelected
                            ? selectedLabels.filter(l => l !== item.label)
                            : (isActiveGroup ? [...selectedLabels, item.label] : [item.label]);
                          onMultiChange?.(newLabels, displayColor, gr.id);
                        }}
                      >
                        {item.label}
                      </label>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(item);
                        }}
                        className="p-1 hover:bg-white/20 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>;
              })}
              <button
                onClick={() => {
                  setTargetGroup(gr.id);
                  setShowAdd(true);
                }} 
                className="w-full text-left text-xs text-primary hover:underline px-2 py-1"
              >
                + Add Custom
              </button>
            </div>}
          </div>;
        })}
      </div>

      {showAdd && <AddCustomEdgeModal 
        groupId={targetGroup} 
        defaultColor={groups.find(g => g.id === targetGroup)?.items[0]?.color}
        onClose={() => setShowAdd(false)} 
        onSave={item => {
          handleAdd(targetGroup, item);
          setShowAdd(false);
        }} 
      />}
    </div>;
}
