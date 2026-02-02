
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export type SortOption = 'newest' | 'oldest' | 'photos';
export type CategorySlug = 'residential' | 'commercial';
export type RoofTypeSlug = 'standing_seam' | 'metal_panels' | 'stone_coated' | 'shingles' | 'flat_roof';

const categoryMap: Record<CategorySlug, string> = {
  residential: 'Residential',
  commercial: 'Commercial',
};
const categoryMapReverse: Record<string, CategorySlug> = {
  Residential: 'residential',
  Commercial: 'commercial',
};

const roofTypeMap: Record<RoofTypeSlug, string> = {
  standing_seam: 'Standing Seam',
  metal_panels: 'Metal Panels',
  stone_coated: 'Stone Coated',
  shingles: 'Shingles',
  flat_roof: 'Flat Roof',
};
const roofTypeMapReverse: Record<string, RoofTypeSlug> = {
  'Standing Seam': 'standing_seam',
  'Metal Panels': 'metal_panels',
  'Stone Coated': 'stone_coated',
  'Shingles': 'shingles',
  'Flat Roof': 'flat_roof',
};

export const useUrlProjectFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const parseCsv = (v: string | null) => (v ? v.split(',').filter(Boolean) : []);

  const initial = useMemo(() => {
    const catSlugs = parseCsv(searchParams.get('category')) as CategorySlug[];
    const roofSlugs = parseCsv(searchParams.get('roofType')) as RoofTypeSlug[];
    const sort = (searchParams.get('sort') as SortOption) || 'newest';
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.max(parseInt(searchParams.get('pageSize') || '12', 10), 1);

    return {
      selectedCategories: catSlugs.map((s) => categoryMap[s] || s),
      selectedRoofTypes: roofSlugs.map((s) => roofTypeMap[s] || s),
      sort,
      page,
      pageSize,
    };
  }, [searchParams]);

  const [selectedCategories, setSelectedCategories] = useState<string[]>(initial.selectedCategories);
  const [selectedRoofTypes, setSelectedRoofTypes] = useState<string[]>(initial.selectedRoofTypes);
  const [sort, setSort] = useState<SortOption>(initial.sort);
  const [page, setPage] = useState<number>(initial.page);
  const [pageSize, setPageSize] = useState<number>(initial.pageSize);

  // Update URL when filters change, debounced ~150ms
  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      const cat = selectedCategories.map((l) => categoryMapReverse[l] || l).join(',');
      const roof = selectedRoofTypes.map((l) => roofTypeMapReverse[l] || l).join(',');

      if (cat) params.set('category', cat); else params.delete('category');
      if (roof) params.set('roofType', roof); else params.delete('roofType');
      if (sort && sort !== 'newest') params.set('sort', sort); else params.delete('sort');

      // Reset to page 1 on filter/sort change
      params.set('page', '1');
      params.set('pageSize', String(pageSize));

      // Avoid full navigation when only search params change
      setSearchParams(params, { replace: false });
    }, 150);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategories, selectedRoofTypes, sort, pageSize]);

  // Expose helpers
  const toggleCategory = (label: string) => {
    setSelectedCategories((prev) =>
      prev.includes(label) ? prev.filter((v) => v !== label) : [...prev, label]
    );
    setPage(1);
  };

  const toggleRoofType = (label: string) => {
    setSelectedRoofTypes((prev) =>
      prev.includes(label) ? prev.filter((v) => v !== label) : [...prev, label]
    );
    setPage(1);
  };

  const clearAll = () => {
    setSelectedCategories([]);
    setSelectedRoofTypes([]);
    setSort('newest');
    setPage(1);
  };

  return {
    selectedCategories,
    selectedRoofTypes,
    sort,
    page,
    pageSize,
    setSort,
    setPage,
    setPageSize,
    toggleCategory,
    toggleRoofType,
    clearAll,
    navigate, // in case the page needs navigation
  };
};
