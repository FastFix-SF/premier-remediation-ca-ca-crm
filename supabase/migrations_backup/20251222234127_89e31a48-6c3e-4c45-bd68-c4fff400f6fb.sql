-- Update Level 1 to Spanish
UPDATE skill_levels SET 
  name = 'Ayudante / Entrada',
  short_name = 'Ayudante',
  description = 'Aprendiz – No puede trabajar solo',
  competencies = '[
    {"id": "follow_instructions", "category": "must_do", "text": "Seguir instrucciones"},
    {"id": "ladder_safety", "category": "must_do", "text": "Usar escalera de forma segura"},
    {"id": "roof_access", "category": "must_do", "text": "Acceder al techo de forma segura"},
    {"id": "carry_materials", "category": "must_do", "text": "Cargar materiales"},
    {"id": "basic_tools", "category": "must_do", "text": "Usar herramientas básicas (martillo, taladro, tijeras)"},
    {"id": "clean_jobsite", "category": "must_do", "text": "Mantener el sitio de trabajo limpio"},
    {"id": "safety_ppe", "category": "must_do", "text": "Entender seguridad básica y EPP"},
    {"id": "assist_tearoff", "category": "may_assist", "text": "Desmontaje"},
    {"id": "assist_loading", "category": "may_assist", "text": "Carga / descarga"},
    {"id": "assist_passing", "category": "may_assist", "text": "Pasar materiales"},
    {"id": "assist_fastening", "category": "may_assist", "text": "Fijación básica (supervisado)"}
  ]'::jsonb
WHERE level = 1;

-- Update Level 2 to Spanish
UPDATE skill_levels SET 
  name = 'Techador (Habilidad Básica)',
  short_name = 'Techador',
  description = 'Puede trabajar independientemente en tareas estándar',
  competencies = '[
    {"id": "install_shingles", "category": "must_know", "text": "Instalar tejas correctamente"},
    {"id": "install_underlayment", "category": "must_know", "text": "Instalar membrana"},
    {"id": "install_basic_flashing", "category": "must_know", "text": "Instalar tapajuntas básico"},
    {"id": "nail_gun_safety", "category": "must_know", "text": "Usar pistola de clavos de forma segura"},
    {"id": "follow_layout", "category": "must_know", "text": "Seguir líneas de diseño"},
    {"id": "identify_leaks", "category": "must_know", "text": "Identificar fugas obvias"},
    {"id": "metal_handle", "category": "metal_basic", "text": "Manejar paneles"},
    {"id": "metal_cut", "category": "metal_basic", "text": "Cortar paneles"},
    {"id": "metal_fasten", "category": "metal_basic", "text": "Fijar paneles correctamente"},
    {"id": "metal_overlaps", "category": "metal_basic", "text": "Entender traslapos"},
    {"id": "work_alone", "category": "can_do", "text": "Trabajar solo en áreas asignadas"},
    {"id": "complete_unsupervised", "category": "can_do", "text": "Completar tareas sin supervisión"}
  ]'::jsonb
WHERE level = 2;

-- Update Level 3 to Spanish
UPDATE skill_levels SET 
  name = 'Techador Senior / Instalador Líder',
  short_name = 'Senior',
  description = 'Alta habilidad – ejecución de confianza',
  competencies = '[
    {"id": "diagnose_leaks", "category": "must_know", "text": "Diagnosticar fugas (no obvias)"},
    {"id": "install_full_systems", "category": "must_know", "text": "Instalar sistemas de techo completos"},
    {"id": "valleys_hips_ridges", "category": "must_know", "text": "Manejar valles, limahoyas, cumbres"},
    {"id": "advanced_flashing", "category": "must_know", "text": "Instalar tapajuntas avanzado (chimenea, tragaluces)"},
    {"id": "read_plans", "category": "must_know", "text": "Leer planos y especificaciones"},
    {"id": "fix_mistakes", "category": "must_know", "text": "Corregir errores de otros"},
    {"id": "metal_standing_seam", "category": "metal_advanced", "text": "Sistemas de junta alzada"},
    {"id": "metal_trim", "category": "metal_advanced", "text": "Detalles de molduras (alero, borde, cumbrera)"},
    {"id": "metal_expansion", "category": "metal_advanced", "text": "Problemas de expansión / contracción"},
    {"id": "metal_identify_bad", "category": "metal_advanced", "text": "Identificar instalaciones defectuosas"},
    {"id": "train_others", "category": "can_do", "text": "Entrenar Nivel 1-2"},
    {"id": "protect_materials", "category": "can_do", "text": "Proteger materiales"},
    {"id": "prevent_waste", "category": "can_do", "text": "Prevenir desperdicio"},
    {"id": "communicate_issues", "category": "can_do", "text": "Comunicar problemas claramente"}
  ]'::jsonb
WHERE level = 3;

-- Update Level 4 to Spanish
UPDATE skill_levels SET 
  name = 'Capataz / Líder de Cuadrilla',
  short_name = 'Capataz',
  description = 'Liderazgo + autoridad técnica',
  competencies = '[
    {"id": "lead_crews", "category": "must_do", "text": "Liderar cuadrillas eficientemente"},
    {"id": "assign_by_skill", "category": "must_do", "text": "Asignar tareas por habilidad"},
    {"id": "enforce_safety", "category": "must_do", "text": "Hacer cumplir la seguridad"},
    {"id": "verify_materials", "category": "must_do", "text": "Verificar materiales antes de empezar"},
    {"id": "ensure_punctuality", "category": "must_do", "text": "Asegurar puntualidad"},
    {"id": "report_daily", "category": "must_do", "text": "Reportar estado del trabajo diariamente"},
    {"id": "prevent_delays", "category": "must_do", "text": "Prevenir retrasos y errores"},
    {"id": "crew_performance", "category": "responsible_for", "text": "Desempeño de la cuadrilla"},
    {"id": "quality_control", "category": "responsible_for", "text": "Control de calidad"},
    {"id": "attendance", "category": "responsible_for", "text": "Asistencia"},
    {"id": "site_cleanliness", "category": "responsible_for", "text": "Limpieza del sitio"},
    {"id": "communication", "category": "responsible_for", "text": "Comunicación con el Gerente de Área"}
  ]'::jsonb
WHERE level = 4;