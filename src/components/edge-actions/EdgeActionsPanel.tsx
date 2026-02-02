import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_EDGE_ACTIONS, EDGE_GROUPS, EdgeActionItem, EdgeCategoryKey } from '@/config/edgeGroups';
import AddEdgeActionModal from './AddEdgeActionModal';
import { toast } from 'sonner';

function Dot({ color }: { color: string }) {
  return <span className="inline-block w-3 h-3 rounded-full mr-3" style={{ backgroundColor: color }} />;
}

export default function EdgeActionsPanel({
  quoteId,
  selectedKey,
  onSelect,
}: {
  quoteId: string;
  selectedKey?: string;
  onSelect: (key: string, item: EdgeActionItem) => void;
}) {
  const [items, setItems] = useState<EdgeActionItem[]>([]);
  const [open, setOpen] = useState<Record<EdgeCategoryKey, boolean>>({
    wall_parapet: true,
    eave: false,
    rake: false,
    ridge: false,
    valley: false,
    step: false,
    pitch_change: false,
  });
  const [showAdd, setShowAdd] = useState(false);

  const keyOf = (i: EdgeActionItem) => `${i.category}:${i.label}`;

  useEffect(() => {
    let canceled = false;
    (async () => {
      const { data, error } = await supabase
        .from('edge_actions')
        .select('*')
        .eq('quote_id', quoteId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching edge actions:', error);
        toast.error('Failed to load custom edge actions');
      }

      if (!canceled) {
        setItems([...DEFAULT_EDGE_ACTIONS, ...(data ?? []).map(d => d as EdgeActionItem)]);
      }
    })();
    return () => {
      canceled = true;
    };
  }, [quoteId]);

  const grouped = useMemo(() => {
    const map: Record<EdgeCategoryKey, EdgeActionItem[]> = {
      wall_parapet: [],
      eave: [],
      rake: [],
      ridge: [],
      valley: [],
      step: [],
      pitch_change: [],
    };
    for (const i of items) map[i.category].push(i);
    return map;
  }, [items]);

  async function handleCreate(input: { label: string; color: string; category: EdgeCategoryKey }) {
    const row = { ...input, quote_id: quoteId, is_custom: true };
    const { data, error } = await supabase.from('edge_actions').insert(row).select().maybeSingle();

    if (error) {
      console.error('Error creating edge action:', error);
      toast.error('Failed to create custom item');
      return;
    }

    setItems((prev) => [...prev, data as EdgeActionItem]);
    setOpen((o) => ({ ...o, [input.category]: true }));
    toast.success('Custom item added');
  }

  async function handleDelete(item: EdgeActionItem) {
    if (!item.id) return;

    const { error } = await supabase.from('edge_actions').delete().eq('id', item.id);

    if (error) {
      console.error('Error deleting edge action:', error);
      toast.error('Failed to delete item');
      return;
    }

    setItems((prev) => prev.filter((x) => x.id !== item.id));
    toast.success('Item deleted');
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Edge Actions</h3>

      {EDGE_GROUPS.map((group) => (
        <div key={group.key} className="border rounded-xl overflow-hidden bg-white">
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50"
            onClick={() => setOpen((o) => ({ ...o, [group.key]: !o[group.key] }))}
          >
            <span className="font-semibold">{group.label}</span>
            <span className="text-gray-500">{open[group.key] ? '▴' : '▾'}</span>
          </button>

          {open[group.key] && (
            <div className="px-2 py-2 border-t">
              {grouped[group.key].length === 0 && (
                <div className="text-sm text-gray-500 px-2 py-2">No items</div>
              )}

              <ul className="space-y-2">
                {grouped[group.key].map((item) => {
                  const key = keyOf(item);
                  const active = key === selectedKey;
                  return (
                    <li key={key} className="flex items-center justify-between px-2">
                      <button
                        className={`flex-1 text-left flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                          active ? 'bg-black text-white border-black' : 'bg-white hover:bg-gray-50'
                        }`}
                        onClick={() => onSelect(key, item)}
                      >
                        <Dot color={item.color} />
                        <span className="text-sm">{item.label}</span>
                      </button>

                      {item.is_custom && (
                        <button
                          onClick={() => handleDelete(item)}
                          className="ml-2 px-2 py-1 text-gray-500 hover:text-red-600 transition-colors"
                          title="Delete custom item"
                        >
                          🗑
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      ))}

      <button
        type="button"
        className="w-full border rounded-xl py-3 font-medium flex items-center justify-center gap-2 bg-white hover:bg-gray-50 transition-colors"
        onClick={() => setShowAdd(true)}
      >
        <span>＋</span> <span>Add Custom Item</span>
      </button>

      <AddEdgeActionModal open={showAdd} onClose={() => setShowAdd(false)} onCreate={handleCreate} />
    </div>
  );
}
