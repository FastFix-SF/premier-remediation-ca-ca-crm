import { useState, useEffect } from 'react';

interface PricingEntry {
  panelName: string;
  lfPrice: number | null;
}

interface PricingLookup {
  [key: string]: number;
}

// Parse CSV and create pricing lookup
const parseCSV = (csvText: string): PricingEntry[] => {
  const lines = csvText.split('\n');
  const entries: PricingEntry[] = [];
  
  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parse CSV line - handle quoted values
    let panelName = '';
    let priceStr = '';
    
    if (line.startsWith('"')) {
      // Quoted panel name
      const endQuoteIndex = line.indexOf('",');
      if (endQuoteIndex > 0) {
        panelName = line.slice(1, endQuoteIndex);
        priceStr = line.slice(endQuoteIndex + 2).trim();
      }
    } else {
      // Unquoted
      const parts = line.split(',');
      panelName = parts[0] || '';
      priceStr = parts[1] || '';
    }
    
    const price = parseFloat(priceStr);
    entries.push({
      panelName: panelName.trim(),
      lfPrice: isNaN(price) ? null : price,
    });
  }
  
  return entries;
};

// Normalize panel name for matching
const normalizePanelName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[""]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
};

// Create search key from product attributes
const createSearchKey = (
  title: string,
  color: string,
  gauge: string
): string => {
  const colorPart = color && color !== 'N/A' && color !== '—' && color !== 'Standard' 
    ? ` ${color}` 
    : '';
  return normalizePanelName(`${title}${colorPart} ${gauge}`);
};

export const usePanelPricing = () => {
  const [pricing, setPricing] = useState<PricingLookup>({});
  const [rawEntries, setRawEntries] = useState<PricingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await fetch('/data/panel-pricing.csv');
        if (!response.ok) {
          throw new Error('Failed to load pricing data');
        }
        
        const csvText = await response.text();
        const entries = parseCSV(csvText);
        setRawEntries(entries);
        
        // Create lookup map
        const lookup: PricingLookup = {};
        entries.forEach(entry => {
          if (entry.lfPrice !== null) {
            const key = normalizePanelName(entry.panelName);
            lookup[key] = entry.lfPrice;
          }
        });
        
        setPricing(lookup);
        setLoading(false);
      } catch (err) {
        console.error('Error loading pricing:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    fetchPricing();
  }, []);

  // Get price for a specific product/color/gauge combo
  const getPrice = (title: string, color?: string, gauge?: string): number | null => {
    if (loading || !title) return null;
    
    // Try exact match with color and gauge
    if (color && gauge) {
      const fullKey = createSearchKey(title, color, gauge);
      if (pricing[fullKey] !== undefined) {
        return pricing[fullKey];
      }
    }
    
    // Try matching without color
    if (gauge) {
      const noColorKey = createSearchKey(title, '', gauge);
      if (pricing[noColorKey] !== undefined) {
        return pricing[noColorKey];
      }
    }
    
    // Fuzzy match: find entries that contain the product title
    const normalizedTitle = normalizePanelName(title);
    const matchingKeys = Object.keys(pricing).filter(key => 
      key.includes(normalizedTitle) || normalizedTitle.includes(key.split(' ')[0])
    );
    
    if (matchingKeys.length > 0) {
      // Return the first matching price
      return pricing[matchingKeys[0]];
    }
    
    return null;
  };

  // Get all prices for a product (all color/gauge variants)
  const getPricesForProduct = (title: string): { variant: string; price: number }[] => {
    if (loading || !title) return [];
    
    const normalizedTitle = normalizePanelName(title);
    const matches: { variant: string; price: number }[] = [];
    
    rawEntries.forEach(entry => {
      const normalizedEntry = normalizePanelName(entry.panelName);
      if (normalizedEntry.includes(normalizedTitle) && entry.lfPrice !== null) {
        matches.push({
          variant: entry.panelName,
          price: entry.lfPrice,
        });
      }
    });
    
    return matches;
  };

  return {
    loading,
    error,
    pricing,
    getPrice,
    getPricesForProduct,
    rawEntries,
  };
};

export default usePanelPricing;
