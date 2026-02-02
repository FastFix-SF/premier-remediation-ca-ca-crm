// Roofing expert mapping: PIN types to material categories/names
// This maps each PIN category to the materials typically needed for that roofing element

export interface PinMaterialMapping {
  pinCategory: string;
  pinNamePattern?: string; // Optional regex pattern to match specific pin names
  materialCategories: string[]; // Categories to search in Materials tab
  materialNamePatterns?: string[]; // Specific material names or patterns to match
}

// Expert roofing material mappings for each PIN type
export const PIN_MATERIAL_MAPPINGS: PinMaterialMapping[] = [
  // EQUIPMENT CURB - needs curb materials, flashing, counterflashing
  {
    pinCategory: 'EQUIPMENT CURB',
    pinNamePattern: 'TPO',
    materialCategories: ['Equipment Curb', 'Ice & Water Shield', 'Underlayment Fasteners'],
    materialNamePatterns: ['TPO.*Termination', 'Counterflashing', 'TPO.*Flashing', 'Curb', 'Equipment']
  },
  {
    pinCategory: 'EQUIPMENT CURB',
    pinNamePattern: 'Torch',
    materialCategories: ['Equipment Curb', 'Ice & Water Shield', 'Underlayment Fasteners'],
    materialNamePatterns: ['Torch.*Flashing', 'Counterflashing', 'Curb', 'Equipment']
  },
  {
    pinCategory: 'EQUIPMENT CURB',
    pinNamePattern: 'Shingle',
    materialCategories: ['Equipment Curb', 'Step Flashing', 'Ice & Water Shield'],
    materialNamePatterns: ['Step.*Flashing', 'Saddle', 'Counterflashing', 'Curb']
  },
  {
    pinCategory: 'EQUIPMENT CURB',
    pinNamePattern: 'Standing Seam|Metal',
    materialCategories: ['Equipment Curb', 'Step Flashing'],
    materialNamePatterns: ['Metal.*Flashing', 'Counterflashing', 'Cleat', 'Curb']
  },
  {
    pinCategory: 'EQUIPMENT CURB',
    materialCategories: ['Equipment Curb'], // Generic equipment curb
    materialNamePatterns: ['Curb', 'Equipment', 'Flashing']
  },
  
  // HIP STARTERS - match hip starters and hip & ridge caps
  {
    pinCategory: 'HIP STARTERS',
    materialCategories: ['Hip & Ridge Cap', 'Architectural Shingles', 'Premium Architectural Shingles'],
    materialNamePatterns: ['Starter', 'Hip.*Ridge', 'Ridge.*Cap', 'Hip.*Cap']
  },
  
  // PLUMBING BOOTS - needs pipe boots, gaskets, flashing
  {
    pinCategory: 'PLUMBING BOOTS',
    materialCategories: ['Step Flashing', 'Ice & Water Shield', 'Miscellaneous'],
    materialNamePatterns: ['Pipe.*Boot', 'Jack.*Boot', 'Rubber.*Collar', 'Flashing.*Boot', 'Boot', 'Plumbing']
  },
  
  // SKYLIGHTS - needs curb flashing kit, sealant
  {
    pinCategory: 'SKYLIGHTS',
    materialCategories: ['Ice & Water Shield', 'Step Flashing', 'Miscellaneous'],
    materialNamePatterns: ['Skylight.*Flash', 'Curb.*Kit', 'Silicone', 'Sealant', 'Skylight']
  },
  
  // CHIMNEY FLASHING - needs step flashing, counter flashing, cricket
  {
    pinCategory: 'CHIMNEY FLASHING',
    materialCategories: ['Step Flashing', 'Ice & Water Shield', 'Miscellaneous'],
    materialNamePatterns: ['Chimney.*Flash', 'Step.*Flash', 'Counter.*Flash', 'Cricket', 'Base.*Flash', 'Chimney']
  },
  
  // FLUE & CHIMNEY CAPS - needs flue pipe flashing, caps
  {
    pinCategory: 'FLUE & CHIMNEY CAPS',
    materialCategories: ['Flue & Chimney Caps', 'Step Flashing', 'Miscellaneous'],
    materialNamePatterns: ['Flue.*Flash', 'Pipe.*Flash', 'Cap', 'Spark.*Arrestor', 'Chimney', 'Flue']
  },
  
  // OFF-RIDGE VENT - needs vent, shingles, nails
  {
    pinCategory: 'OFF-RIDGE VENT',
    materialCategories: ['Miscellaneous', 'Shingle Fasteners'],
    materialNamePatterns: ['Vent', 'Intake', 'Exhaust', 'Ridge']
  },
  
  // DOWNSPOUTS - needs downspout material, elbows, straps
  {
    pinCategory: 'DOWNSPOUTS',
    materialCategories: ['Downspouts', 'Gutters', 'Miscellaneous'],
    materialNamePatterns: ['Downspout', 'Elbow', 'Strap', 'Outlet', 'Gutter']
  },
  
  // PAINT & SEALANT - needs sealant, caulk, mastic
  {
    pinCategory: 'PAINT & SEALANT',
    materialCategories: ['Miscellaneous'],
    materialNamePatterns: ['Silicone', 'Sealant', 'Caulk', 'Mastic', 'Primer', 'Paint']
  },
  
  // INSULATION - needs insulation material
  {
    pinCategory: 'INSULATION',
    materialCategories: ['Insulation', 'Shingle Fasteners', 'Underlayment Fasteners'],
    materialNamePatterns: ['ISO', 'Insulation', 'Taper', 'Board', 'Screw']
  },
  
  // REMOVE AND REPLACE WOOD - needs plywood, lumber
  {
    pinCategory: 'REMOVE AND REPLACE WOOD',
    materialCategories: ['Remove and Replace Wood', 'Roof Decking (Actual Square)', 'Shingle Fasteners'],
    materialNamePatterns: ['Plywood', 'OSB', 'Deck.*Board', 'Nail', 'Screw', 'Wood', 'Decking']
  },
  
  // INSPECTION PINS
  {
    pinCategory: 'INSPECTION PINS',
    materialCategories: ['Inspection Pins', 'Miscellaneous'],
    materialNamePatterns: ['Pin', 'Inspection', 'Marker']
  },
  
  // EXCLUSIONS
  {
    pinCategory: 'EXCLUSIONS',
    materialCategories: ['Exclusions', 'Miscellaneous'],
    materialNamePatterns: []
  },
  
  // MISCELLANEOUS - general materials
  {
    pinCategory: 'MISCELLANEOUS',
    materialCategories: ['Miscellaneous', 'Shingle Fasteners', 'Ice & Water Shield'],
    materialNamePatterns: []
  }
];

// Helper function to find matching materials for a given pin
export function getMaterialsForPin(
  pinName: string,
  pinCategory: string,
  availableMaterials: any[]
): any[] {
  // Find all mappings that match this pin
  const matchingMappings = PIN_MATERIAL_MAPPINGS.filter(mapping => {
    // Check if category matches
    if (mapping.pinCategory !== pinCategory) return false;
    
    // If there's a name pattern, check if pin name matches
    if (mapping.pinNamePattern) {
      const regex = new RegExp(mapping.pinNamePattern, 'i');
      return regex.test(pinName);
    }
    
    // If no pattern, it's a category-wide match
    return true;
  });
  
  if (matchingMappings.length === 0) {
    console.log(`⚠️ No material mapping found for PIN: ${pinCategory} - ${pinName}`);
    return [];
  }
  
  const selectedMaterials: any[] = [];
  
  // For each matching mapping, find materials
  matchingMappings.forEach(mapping => {
    // Search by category
    mapping.materialCategories.forEach(category => {
      const categoryMaterials = availableMaterials.filter(m => 
        m.category && m.category.toLowerCase().includes(category.toLowerCase())
      );
      
      // If we have specific name patterns, filter further
      if (mapping.materialNamePatterns && mapping.materialNamePatterns.length > 0) {
        mapping.materialNamePatterns.forEach(pattern => {
          const regex = new RegExp(pattern, 'i');
          const matches = categoryMaterials.filter(m => regex.test(m.name));
          selectedMaterials.push(...matches);
        });
      } else {
        // No specific patterns, add all materials from this category (limited)
        selectedMaterials.push(...categoryMaterials.slice(0, 2));
      }
    });
  });
  
  // Remove duplicates based on material name (since materials from JSONB don't have unique IDs)
  const uniqueMaterials = Array.from(
    new Map(selectedMaterials.map(m => [m.name, m])).values()
  );
  
  console.log(`✅ Found ${uniqueMaterials.length} unique materials for PIN: ${pinName}`);
  return uniqueMaterials;
}
