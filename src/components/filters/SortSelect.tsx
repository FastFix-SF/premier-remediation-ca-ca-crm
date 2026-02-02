
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type SortOption = 'newest' | 'oldest' | 'photos';

interface SortSelectProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
  className?: string;
}

const SortSelect: React.FC<SortSelectProps> = ({ value, onChange, className }) => {
  return (
    <div className={className}>
      <Select value={value} onValueChange={(v) => onChange(v as SortOption)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest</SelectItem>
          <SelectItem value="oldest">Oldest</SelectItem>
          <SelectItem value="photos">Most Photos</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default SortSelect;
