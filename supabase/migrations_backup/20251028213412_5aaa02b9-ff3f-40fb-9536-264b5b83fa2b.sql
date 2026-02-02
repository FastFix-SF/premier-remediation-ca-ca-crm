
-- Update the Insulation items in rf_items for the specific quote
UPDATE quote_requests
SET rf_items = (
  SELECT jsonb_agg(item)
  FROM (
    -- Keep all non-Insulation items
    SELECT value as item
    FROM jsonb_array_elements(rf_items)
    WHERE value->>'category' != 'Insulation'
    
    UNION ALL
    
    -- Add the 20 new Insulation items
    SELECT jsonb_build_object(
      'id', 'rf-insulation-1',
      'name', 'Install Tapered Insulation "X"1/4" slope per foot, mechanically attach',
      'total', 24.00,
      'unit', '$/Ea.',
      'category', 'Insulation',
      'showInApp', true,
      'showOnEstimate', true,
      'showOnMaterialOrder', true,
      'showOnContract', true,
      'showOnLaborReport', true,
      'picture', '/src/assets/materials/insulation.jpg',
      'coverage', 1,
      'labor', 8.00,
      'material', 16.00,
      'factor', 1.00
    )
    UNION ALL
    SELECT jsonb_build_object(
      'id', 'rf-insulation-2',
      'name', 'Install Tapered Insulation "Y"1/4" slope per foot, mechanically attach',
      'total', 42.00,
      'unit', '$/Ea.',
      'category', 'Insulation',
      'showInApp', true,
      'showOnEstimate', true,
      'showOnMaterialOrder', true,
      'showOnContract', true,
      'showOnLaborReport', true,
      'picture', '/src/assets/materials/insulation.jpg',
      'coverage', 1,
      'labor', 8.00,
      'material', 34.00,
      'factor', 1.00
    )
    UNION ALL
    SELECT jsonb_build_object(
      'id', 'rf-insulation-3',
      'name', 'Install 2" ISO Insulation 4x8 Panels Mechanically attached to roof deck',
      'total', 250.00,
      'unit', '$/Ea.',
      'category', 'Insulation',
      'showInApp', true,
      'showOnEstimate', true,
      'showOnMaterialOrder', true,
      'showOnContract', true,
      'showOnLaborReport', true,
      'picture', '/src/assets/materials/insulation.jpg',
      'coverage', 1,
      'labor', 65.00,
      'material', 185.00,
      'factor', 1.00
    )
    UNION ALL
    SELECT jsonb_build_object(
      'id', 'rf-insulation-4',
      'name', 'Install 6" Taper Edge where needed',
      'total', 277.50,
      'unit', '$/Ea.',
      'category', 'Insulation',
      'showInApp', true,
      'showOnEstimate', true,
      'showOnMaterialOrder', true,
      'showOnContract', true,
      'showOnLaborReport', true,
      'picture', '/src/assets/materials/insulation.jpg',
      'coverage', 1,
      'labor', 52.50,
      'material', 225.00,
      'factor', 1.00
    )
    UNION ALL
    SELECT jsonb_build_object(
      'id', 'rf-insulation-5',
      'name', '2" #14 (1000 Count) Screws-',
      'total', 122.60,
      'unit', '$/Ea.',
      'category', 'Insulation',
      'showInApp', true,
      'showOnEstimate', true,
      'showOnMaterialOrder', true,
      'showOnContract', true,
      'showOnLaborReport', true,
      'picture', '/src/assets/materials/insulation.jpg',
      'coverage', 18,
      'labor', 0.00,
      'material', 122.60,
      'factor', 1.00
    )
    UNION ALL
    SELECT jsonb_build_object(
      'id', 'rf-insulation-6',
      'name', '2.5" #14(1000 Count) Screws-',
      'total', 142.90,
      'unit', '$/Ea.',
      'category', 'Insulation',
      'showInApp', true,
      'showOnEstimate', true,
      'showOnMaterialOrder', true,
      'showOnContract', true,
      'showOnLaborReport', true,
      'picture', '/src/assets/materials/insulation.jpg',
      'coverage', 18,
      'labor', 0.00,
      'material', 142.90,
      'factor', 1.00
    )
    UNION ALL
    SELECT jsonb_build_object(
      'id', 'rf-insulation-7',
      'name', '3" #14 (1000 Count) Screws-',
      'total', 170.10,
      'unit', '$/Ea.',
      'category', 'Insulation',
      'showInApp', true,
      'showOnEstimate', true,
      'showOnMaterialOrder', true,
      'showOnContract', true,
      'showOnLaborReport', true,
      'picture', '/src/assets/materials/insulation.jpg',
      'coverage', 18,
      'labor', 0.00,
      'material', 170.10,
      'factor', 1.00
    )
    UNION ALL
    SELECT jsonb_build_object(
      'id', 'rf-insulation-8',
      'name', '3.5" #14 (1000 Count) Screws-',
      'total', 219.00,
      'unit', '$/Ea.',
      'category', 'Insulation',
      'showInApp', true,
      'showOnEstimate', true,
      'showOnMaterialOrder', true,
      'showOnContract', true,
      'showOnLaborReport', true,
      'picture', '/src/assets/materials/insulation.jpg',
      'coverage', 18,
      'labor', 0.00,
      'material', 219.00,
      'factor', 1.00
    )
    UNION ALL
    SELECT jsonb_build_object(
      'id', 'rf-insulation-9',
      'name', '4" #14 (1000 Count) Screws-',
      'total', 255.20,
      'unit', '$/Ea.',
      'category', 'Insulation',
      'showInApp', true,
      'showOnEstimate', true,
      'showOnMaterialOrder', true,
      'showOnContract', true,
      'showOnLaborReport', true,
      'picture', '/src/assets/materials/insulation.jpg',
      'coverage', 18,
      'labor', 0.00,
      'material', 255.20,
      'factor', 1.00
    )
    UNION ALL
    SELECT jsonb_build_object(
      'id', 'rf-insulation-10',
      'name', '5" #14 (1000 Count) Screws-',
      'total', 349.50,
      'unit', '$/Ea.',
      'category', 'Insulation',
      'showInApp', true,
      'showOnEstimate', true,
      'showOnMaterialOrder', true,
      'showOnContract', true,
      'showOnLaborReport', true,
      'picture', '/src/assets/materials/insulation.jpg',
      'coverage', 18,
      'labor', 0.00,
      'material', 349.50,
      'factor', 1.00
    )
    UNION ALL
    SELECT jsonb_build_object(
      'id', 'rf-insulation-11',
      'name', '6" #14 (1000 Count) Screws-',
      'total', 432.90,
      'unit', '$/Ea.',
      'category', 'Insulation',
      'showInApp', true,
      'showOnEstimate', true,
      'showOnMaterialOrder', true,
      'showOnContract', true,
      'showOnLaborReport', true,
      'picture', '/src/assets/materials/insulation.jpg',
      'coverage', 18,
      'labor', 0.00,
      'material', 432.90,
      'factor', 1.00
    )
    UNION ALL
    SELECT jsonb_build_object(
      'id', 'rf-insulation-12',
      'name', 'Install Tapered Insulation "A"1/8" slope per foot,',
      'total', 22.30,
      'unit', '$/Ea.',
      'category', 'Insulation',
      'showInApp', true,
      'showOnEstimate', true,
      'showOnMaterialOrder', true,
      'showOnContract', true,
      'showOnLaborReport', true,
      'picture', '/src/assets/materials/insulation.jpg',
      'coverage', 1,
      'labor', 5.30,
      'material', 17.00,
      'factor', 1.00
    )
    UNION ALL
    SELECT jsonb_build_object(
      'id', 'rf-insulation-13',
      'name', 'Install Tapered Insulation "AA"1/8" slope per foot,',
      'total', 18.55,
      'unit', '$/Ea.',
      'category', 'Insulation',
      'showInApp', true,
      'showOnEstimate', true,
      'showOnMaterialOrder', true,
      'showOnContract', true,
      'showOnLaborReport', true,
      'picture', '/src/assets/materials/insulation.jpg',
      'coverage', 1,
      'labor', 5.30,
      'material', 13.25,
      'factor', 1.00
    )
    UNION ALL
    SELECT jsonb_build_object(
      'id', 'rf-insulation-14',
      'name', 'Install Tapered Insulation "B"1/6" slope per foot,',
      'total', 28.60,
      'unit', '$/Ea.',
      'category', 'Insulation',
      'showInApp', true,
      'showOnEstimate', true,
      'showOnMaterialOrder', true,
      'showOnContract', true,
      'showOnLaborReport', true,
      'picture', '/src/assets/materials/insulation.jpg',
      'coverage', 1,
      'labor', 5.30,
      'material', 23.30,
      'factor', 1.00
    )
    UNION ALL
    SELECT jsonb_build_object(
      'id', 'rf-insulation-15',
      'name', 'Install Tapered Insulation "C"1/8" slope per foot,',
      'total', 35.50,
      'unit', '$/Ea.',
      'category', 'Insulation',
      'showInApp', true,
      'showOnEstimate', true,
      'showOnMaterialOrder', true,
      'showOnContract', true,
      'showOnLaborReport', true,
      'picture', '/src/assets/materials/insulation.jpg',
      'coverage', 1,
      'labor', 5.30,
      'material', 30.20,
      'factor', 1.00
    )
    UNION ALL
    SELECT jsonb_build_object(
      'id', 'rf-insulation-16',
      'name', 'Install Tapered Insulation "D"1/8" slope per foot,',
      'total', 41.30,
      'unit', '$/Ea.',
      'category', 'Insulation',
      'showInApp', true,
      'showOnEstimate', true,
      'showOnMaterialOrder', true,
      'showOnContract', true,
      'showOnLaborReport', true,
      'picture', '/src/assets/materials/insulation.jpg',
      'coverage', 1,
      'labor', 5.30,
      'material', 36.00,
      'factor', 1.00
    )
    UNION ALL
    SELECT jsonb_build_object(
      'id', 'rf-insulation-17',
      'name', 'Install Tapered Insulation "E"1/8" slope per foot,',
      'total', 48.45,
      'unit', '$/Ea.',
      'category', 'Insulation',
      'showInApp', true,
      'showOnEstimate', true,
      'showOnMaterialOrder', true,
      'showOnContract', true,
      'showOnLaborReport', true,
      'picture', '/src/assets/materials/insulation.jpg',
      'coverage', 1,
      'labor', 5.30,
      'material', 43.15,
      'factor', 1.00
    )
    UNION ALL
    SELECT jsonb_build_object(
      'id', 'rf-insulation-18',
      'name', 'Install Tapered Insulation "F"1/8" slope per foot,',
      'total', 54.20,
      'unit', '$/Ea.',
      'category', 'Insulation',
      'showInApp', true,
      'showOnEstimate', true,
      'showOnMaterialOrder', true,
      'showOnContract', true,
      'showOnLaborReport', true,
      'picture', '/src/assets/materials/insulation.jpg',
      'coverage', 1,
      'labor', 5.30,
      'material', 48.90,
      'factor', 1.00
    )
    UNION ALL
    SELECT jsonb_build_object(
      'id', 'rf-insulation-19',
      'name', 'Install Tapered Insulation "FF"1/8" slope per foot,',
      'total', 63.95,
      'unit', '$/Ea.',
      'category', 'Insulation',
      'showInApp', true,
      'showOnEstimate', true,
      'showOnMaterialOrder', true,
      'showOnContract', true,
      'showOnLaborReport', true,
      'picture', '/src/assets/materials/insulation.jpg',
      'coverage', 1,
      'labor', 5.30,
      'material', 58.65,
      'factor', 1.00
    )
    UNION ALL
    SELECT jsonb_build_object(
      'id', 'rf-insulation-20',
      'name', 'Install R-SEAL 4" R-30',
      'total', 1140.00,
      'unit', '$/Ea.',
      'category', 'Insulation',
      'showInApp', true,
      'showOnEstimate', true,
      'showOnMaterialOrder', true,
      'showOnContract', true,
      'showOnLaborReport', true,
      'picture', '/src/assets/materials/insulation.jpg',
      'coverage', 3.3,
      'labor', 40.00,
      'material', 1100.00,
      'factor', 1.00
    )
  ) AS combined_items
)
WHERE id = 'd38f1c58-c166-4aad-8348-ad91c4c01b44';
