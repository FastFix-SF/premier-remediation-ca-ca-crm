export interface Contractor {
  id: string;
  company: string;
  name: string;
  phone: string;
  cell: string;
  address: string;
  type: 'contractors';
  isFavorite?: boolean;
}

export const contractors: Contractor[] = [
  { id: 'c1', company: 'US Builders', name: 'Gustavo', phone: '', cell: '', address: '', type: 'contractors' },
  { id: 'c2', company: 'MIDSTATE CONSTRUCTION CORPORATION', name: 'Carly .', phone: '(707) 762-3200', cell: '(707) 762-3200', address: '', type: 'contractors' },
  { id: 'c3', company: 'MC MECHANICAL', name: 'Mario Cabrera', phone: '(415) 571-7775', cell: '(415) 806-4619', address: 'PO Box 3284, Daly City, CA 94015', type: 'contractors' },
  { id: 'c4', company: '.', name: 'Eric Chen', phone: '', cell: '(510) 579-0647', address: '4330 Bidwell Drive, Fremont, CA 94538', type: 'contractors' },
  { id: 'c5', company: 'GTM Roofing', name: 'Meyder Garcia', phone: '', cell: '(415) 608-0857', address: '', type: 'contractors' },
  { id: 'c6', company: 'Dublin Unified School District', name: 'Nelson Kirk "BO"', phone: '(925) 828-2551', cell: '(925) 383-9485', address: '7471 Larkdale Avenue, Dublin, CA 94568', type: 'contractors' },
  { id: 'c7', company: 'South Creek & Waterproofing INC.', name: 'Adrian Lopez', phone: '', cell: '(669) 213-2867', address: '130 Lewis Road, San Jose, CA 95111', type: 'contractors' },
  { id: 'c8', company: 'California Dream Builders', name: 'Marc MacDonald', phone: '', cell: '(650) 771-4732', address: '', type: 'contractors' },
  { id: 'c9', company: 'Stroub Construction', name: 'Roberto Meneses', phone: '(510) 502-3347', cell: '(510) 502-3347', address: '', type: 'contractors' },
  { id: 'c10', company: 'Mirana Framing', name: 'Leonel Miranda', phone: '', cell: '(650) 208-8650', address: '', type: 'contractors' },
  { id: 'c11', company: 'Baldomero Ricalday', name: 'Baldomero Ricalday', phone: '', cell: '(650) 922-4995', address: '', type: 'contractors' },
  { id: 'c12', company: 'South Creek & Waterproofing INC', name: 'Uriel Valenzuela', phone: '', cell: '(831) 707-0933', address: '', type: 'contractors' },
  { id: 'c13', company: 'Brayan Vega', name: 'Bryan Vega', phone: '', cell: '', address: '', type: 'contractors' },
  { id: 'c14', company: 'ANBE Contractors removal& Demolition', name: 'Henry Vega', phone: '(866) 262-3315', cell: '(650) 656-0047', address: '2059 Camden Avenue, San Jose, CA 95124', type: 'contractors' },
  { id: 'c15', company: 'XL Construction', name: 'Kim Wilson', phone: '', cell: '', address: '', type: 'contractors' },
];
