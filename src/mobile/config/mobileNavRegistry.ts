// Mobile Navigation Registry for Fasto Voice Navigation
// Maps voice commands to mobile app routes

interface MobileNavEntry {
  label: string;
  url: string;
  synonyms: string[];
}

const MOBILE_NAV_ENTRIES: MobileNavEntry[] = [
  // Main tabs
  { label: 'Home', url: '/mobile/home', synonyms: ['home', 'main', 'dashboard', 'inicio', 'principal'] },
  { label: 'Projects', url: '/mobile/projects', synonyms: ['projects', 'jobs', 'proyectos', 'trabajos', 'my projects'] },
  { label: 'Messages', url: '/mobile/messages/chat/general', synonyms: ['messages', 'chat', 'mensajes', 'conversation', 'inbox'] },
  { label: 'Profile', url: '/mobile/profile', synonyms: ['profile', 'my profile', 'account', 'perfil', 'mi perfil'] },
  { label: 'Admin', url: '/mobile/admin', synonyms: ['admin', 'administration', 'administración', 'admin panel'] },
  
  // Employee features
  { label: 'Time Clock', url: '/mobile/time-clock', synonyms: ['time clock', 'clock in', 'clock out', 'punch in', 'punch out', 'reloj', 'fichar', 'entrada', 'salida', 'check in', 'check out'] },
  { label: 'My Schedule', url: '/mobile/schedule', synonyms: ['schedule', 'my schedule', 'shifts', 'horario', 'mi horario', 'turnos', 'calendar', 'work schedule'] },
  { label: 'Tasks', url: '/mobile/tasks', synonyms: ['tasks', 'my tasks', 'to do', 'tareas', 'mis tareas', 'todo', 'assignments'] },
  { label: 'Recognitions', url: '/mobile/recognitions', synonyms: ['recognitions', 'kudos', 'recognition', 'reconocimientos', 'badges', 'awards'] },
  
  // Service & Operations
  { label: 'Service Tickets', url: '/mobile/service-tickets', synonyms: ['service tickets', 'tickets', 'service', 'servicio', 'boletos', 'support tickets'] },
  { label: 'Inventory', url: '/mobile/inventory', synonyms: ['inventory', 'stock', 'materials', 'inventario', 'materiales', 'supplies'] },
  { label: 'Work Orders', url: '/mobile/work-orders', synonyms: ['work orders', 'work order', 'órdenes de trabajo', 'orden de trabajo', 'wo'] },
  { label: 'Inspections', url: '/mobile/inspections', synonyms: ['inspections', 'inspection', 'inspecciones', 'inspeccion', 'inspect'] },
  { label: 'Punchlists', url: '/mobile/punchlists', synonyms: ['punchlists', 'punchlist', 'punch list', 'punch', 'snag list', 'defects'] },
  { label: 'Incidents', url: '/mobile/incidents', synonyms: ['incidents', 'incident', 'incidentes', 'incidente', 'accident', 'safety incident'] },
  { label: 'Daily Logs', url: '/mobile/daily-logs', synonyms: ['daily logs', 'daily log', 'bitácora', 'bitacora diaria', 'field log', 'job log'] },
  
  // Team & HR
  { label: 'Team', url: '/mobile/team', synonyms: ['team', 'team directory', 'directory', 'employees', 'equipo', 'directorio', 'coworkers', 'staff'] },
  { label: 'Safety Meetings', url: '/mobile/safety-meetings', synonyms: ['safety meetings', 'safety meeting', 'toolbox talk', 'reuniones de seguridad', 'safety', 'tailgate'] },
  { label: 'Quizzes', url: '/mobile/quizzes', synonyms: ['quizzes', 'quiz', 'training', 'test', 'examen', 'cuestionario', 'assessment'] },
  { label: 'Scoring', url: '/mobile/scoring', synonyms: ['scoring', 'score', 'employee scoring', 'performance', 'puntuación', 'desempeño'] },
  { label: 'Time Off Requests', url: '/mobile/requests/time-off', synonyms: ['time off', 'time off request', 'vacation', 'pto', 'leave', 'vacaciones', 'permiso', 'day off'] },
  
  // Documents & Media
  { label: 'Documents', url: '/mobile/documents', synonyms: ['documents', 'files', 'documentos', 'archivos', 'papers', 'docs'] },
  { label: 'Photo Gallery', url: '/mobile/all-photos', synonyms: ['photos', 'photo gallery', 'gallery', 'pictures', 'fotos', 'galería', 'images'] },
  
  // Equipment & Vehicles
  { label: 'Equipment', url: '/mobile/equipment', synonyms: ['equipment', 'equipment logs', 'tools', 'equipo', 'herramientas', 'machinery'] },
  { label: 'Vehicles', url: '/mobile/vehicles', synonyms: ['vehicles', 'vehicle logs', 'trucks', 'vans', 'cars', 'vehículos', 'camiones', 'fleet'] },
  { label: 'Permits', url: '/mobile/permits', synonyms: ['permits', 'permit', 'permisos', 'permiso', 'license', 'authorization'] },
  
  // Settings
  { label: 'Settings', url: '/mobile/profile/settings', synonyms: ['settings', 'preferences', 'configuración', 'ajustes', 'config'] },
  { label: 'Notifications', url: '/mobile/profile/notifications', synonyms: ['notifications', 'alerts', 'notificaciones', 'alertas', 'bell'] },
];

// Normalize text for matching
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?;:'"]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Resolve a voice command to a mobile URL
export function resolveMobileNavigationUrl(input: string): string | null {
  const normalized = normalizeText(input);
  
  // Check each entry's synonyms for a match
  for (const entry of MOBILE_NAV_ENTRIES) {
    const allTerms = [entry.label.toLowerCase(), ...entry.synonyms.map(s => s.toLowerCase())];
    
    for (const term of allTerms) {
      // Exact match
      if (normalized === term) {
        return entry.url;
      }
      
      // Phrase match (e.g., "go to projects", "show me my schedule")
      if (normalized.includes(term)) {
        return entry.url;
      }
    }
  }
  
  return null;
}

// Get all available mobile routes for display
export function getMobileNavEntries(): MobileNavEntry[] {
  return MOBILE_NAV_ENTRIES;
}

// Get label for a mobile URL
export function getMobileNavLabel(url: string): string | null {
  const entry = MOBILE_NAV_ENTRIES.find(e => e.url === url);
  return entry?.label || null;
}
