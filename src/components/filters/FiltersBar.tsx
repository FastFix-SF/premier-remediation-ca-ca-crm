
import React from 'react';
import FilterChip from './FilterChip';
import SortSelect, { SortOption } from './SortSelect';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Filter } from 'lucide-react';

export type CategoryValue = 'Residential' | 'Commercial';
export type RoofTypeValue = 'Standing Seam' | 'Metal Panels' | 'Stone Coated' | 'Shingles' | 'Flat Roof';

export interface Option<T extends string = string> {
  label: string;
  value: T;
  count?: number;
}

interface FiltersBarProps {
  categories: Option<CategoryValue>[];
  roofTypes: Option<RoofTypeValue>[];
  selectedCategories: CategoryValue[];
  selectedRoofTypes: RoofTypeValue[];
  onToggleCategory: (value: CategoryValue) => void;
  onToggleRoofType: (value: RoofTypeValue) => void;
  sort: SortOption;
  onSortChange: (value: SortOption) => void;
  onClearAll: () => void;
  resultCount?: number;
  totalCount?: number;
  className?: string;
}

const FiltersBar: React.FC<FiltersBarProps> = ({
  categories,
  roofTypes,
  selectedCategories,
  selectedRoofTypes,
  onToggleCategory,
  onToggleRoofType,
  sort,
  onSortChange,
  onClearAll,
  resultCount,
  totalCount,
  className,
}) => {
  const hasActive = selectedCategories.length > 0 || selectedRoofTypes.length > 0 || sort !== 'newest';

  const Content = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Category</span>
        <div className="flex flex-wrap gap-2">
          {categories.map((opt) => (
            <FilterChip
              key={opt.value}
              label={opt.label + (typeof opt.count === 'number' ? ` (${opt.count})` : '')}
              selected={selectedCategories.includes(opt.value)}
              onClick={() => onToggleCategory(opt.value)}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Roof Type</span>
        <div className="flex flex-wrap gap-2">
          {roofTypes.map((opt) => (
            <FilterChip
              key={opt.value}
              label={opt.label + (typeof opt.count === 'number' ? ` (${opt.count})` : '')}
              selected={selectedRoofTypes.includes(opt.value)}
              onClick={() => onToggleRoofType(opt.value)}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <SortSelect value={sort} onChange={onSortChange} />
        {hasActive && (
          <Button variant="ghost" size="sm" onClick={onClearAll} className="text-muted-foreground hover:text-foreground">
            Clear all
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-3">
        <div className="hidden sm:block w-full">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Content />
            </div>
            {(typeof resultCount === 'number' && typeof totalCount === 'number') && (
              <div aria-live="polite" className="ml-4 text-sm text-muted-foreground whitespace-nowrap">
                Showing {resultCount} of {totalCount} projects
              </div>
            )}
          </div>
        </div>

        {/* Mobile */}
        <div className="sm:hidden flex items-center justify-between w-full">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filter
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[70vh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filter projects</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <Content />
                <div className="mt-4 flex items-center justify-between">
                  <Button variant="ghost" onClick={onClearAll}>Clear all</Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {(typeof resultCount === 'number' && typeof totalCount === 'number') && (
            <div aria-live="polite" className="text-sm text-muted-foreground">
              {resultCount}/{totalCount}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FiltersBar;
