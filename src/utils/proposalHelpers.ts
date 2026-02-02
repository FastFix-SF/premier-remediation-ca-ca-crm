/**
 * Utility functions for proposal management
 */

/**
 * Removes material lists and SKU references from scope of work
 */
export const stripMaterialsFromScope = (scope: string): string => {
  if (!scope) return '';
  
  // Remove any lines that look like material lists or SKU references
  const lines = scope.split('\n');
  return lines
    .filter(line => {
      // Remove lines with SKU patterns, pricing patterns, or quantity patterns
      const hasSKU = /\b[A-Z0-9]{3,}-[A-Z0-9]+\b/i.test(line);
      const hasPrice = /\$[\d,]+\.\d{2}/i.test(line);
      const hasQty = /\d+\s*(sq\.?\s*ft|linear\s*ft|ft|sheets?|pieces?|units?)/i.test(line);
      return !(hasSKU || (hasPrice && hasQty));
    })
    .join('\n')
    .trim();
};
