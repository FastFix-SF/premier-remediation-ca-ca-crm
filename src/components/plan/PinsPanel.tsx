import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PINS_LIBRARY, PIN_CATEGORIES, PinItem, getPinsByCategory } from '@/config/pinsLibrary';

interface PinsPanelProps {
  quoteId: string;
  selectedPin?: string | null;
  onPinSelect?: (pin: PinItem | null) => void;
}

export default function PinsPanel({ quoteId, selectedPin, onPinSelect }: PinsPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  
  // Use the centralized pins library available to all projects
  const getCategoryItems = (category: string) => {
    return getPinsByCategory(category);
  };

  return (
    <div className="space-y-2">
      {/* Material Items Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-primary hover:bg-muted/50 rounded-lg transition-colors"
      >
        <span className="text-blue-600">Material Items</span>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Material Items List */}
      {isOpen && (
        <ScrollArea className="h-[500px]">
          <div className="space-y-0.5 px-2">
            {PIN_CATEGORIES.map((category) => {
                const categoryItems = getCategoryItems(category);
                const isSelected = selectedPin === category;

              return (
                <DropdownMenu key={category}>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={`w-full text-left px-4 py-3 rounded transition-colors text-sm font-medium
                        ${isSelected 
                          ? 'bg-primary/10 text-primary' 
                          : 'text-foreground hover:bg-muted/50'
                        }`}
                    >
                      {category} {categoryItems.length > 0 && `(${categoryItems.length})`}
                    </button>
                  </DropdownMenuTrigger>
                  {categoryItems.length > 0 && (
                    <DropdownMenuContent 
                      align="start" 
                      className="w-80 max-h-96 overflow-y-auto bg-card border border-border shadow-lg z-[9999]"
                      side="right"
                    >
                      {categoryItems.map((item) => (
                        <DropdownMenuItem
                          key={item.id}
                          className="flex items-center gap-3 p-2 cursor-pointer"
                          onClick={() => {
                            onPinSelect?.(item);
                          }}
                        >
                          {item.picture && (
                            <img 
                              src={item.picture} 
                              alt={item.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <span className="text-sm flex-1">{item.name}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  )}
                </DropdownMenu>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
