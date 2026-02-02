import React from 'react';
import { ChevronDown, X } from 'lucide-react';
import { Button } from './ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';

interface FilterSidebarProps {
  filterGauge: string;
  setFilterGauge: (value: string) => void;
  filterColor: string;
  setFilterColor: (value: string) => void;
  filterSupport: string;
  setFilterSupport: (value: string) => void;
  filterProductType: string;
  setFilterProductType: (value: string) => void;
  uniqueGauges: string[];
  uniqueColors: string[];
  uniqueSupports: string[];
  productTypes: string[];
  clearFilters: () => void;
  filteredCount: number;
  totalCount: number;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filterGauge,
  setFilterGauge,
  filterColor,
  setFilterColor,
  filterSupport,
  setFilterSupport,
  filterProductType,
  setFilterProductType,
  uniqueGauges,
  uniqueColors,
  uniqueSupports,
  productTypes,
  clearFilters,
  filteredCount,
  totalCount,
}) => {
  const hasActiveFilters = filterGauge || filterColor || filterSupport || filterProductType;

  const FilterSection = ({ title, options, value, onChange, defaultOpen = true }: {
    title: string;
    options: string[];
    value: string;
    onChange: (value: string) => void;
    defaultOpen?: boolean;
  }) => (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-left font-medium text-foreground hover:bg-muted/50 rounded-lg transition-colors group">
        {title}
        <ChevronDown className="w-4 h-4 transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3">
        <div className="space-y-2">
          {options.map((option) => (
            <label
              key={option}
              className="flex items-center space-x-3 cursor-pointer group"
            >
              <input
                type="radio"
                name={title}
                value={option}
                checked={value === option}
                onChange={(e) => onChange(e.target.checked ? option : '')}
                className="w-4 h-4 text-primary border-border focus:ring-primary/20 focus:ring-2"
              />
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                {option}
              </span>
            </label>
          ))}
          {value && (
            <button
              onClick={() => onChange('')}
              className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center space-x-1"
            >
              <X className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );

  return (
    <div className="w-64 bg-card border-r shadow-sm h-fit sticky top-20">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-foreground">Filters</h2>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs text-primary hover:text-primary/80"
            >
              Clear All
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {filteredCount} of {totalCount} products
        </p>
      </div>

      <div className="p-4 space-y-4">
        <FilterSection
          title="Product Type"
          options={productTypes}
          value={filterProductType}
          onChange={setFilterProductType}
        />

        <FilterSection
          title="Gauge"
          options={uniqueGauges}
          value={filterGauge}
          onChange={setFilterGauge}
        />

        <FilterSection
          title="Color"
          options={uniqueColors}
          value={filterColor}
          onChange={setFilterColor}
        />

        <FilterSection
          title="Panel Profile"
          options={uniqueSupports}
          value={filterSupport}
          onChange={setFilterSupport}
        />
      </div>
    </div>
  );
};

export default FilterSidebar;