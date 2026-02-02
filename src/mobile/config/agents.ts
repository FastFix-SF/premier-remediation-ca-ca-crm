// Agent definitions for the AI Agent Command Center

export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  capabilities: string[];
}

export const AGENTS: Record<string, AgentDefinition> = {
  operations: {
    id: 'operations',
    name: 'Operations Agent',
    description: 'Projects, schedules, and team management',
    icon: '🏗️',
    color: 'hsl(var(--primary))',
    capabilities: ['projects', 'schedules', 'timesheets', 'crews', 'employees']
  },
  procurement: {
    id: 'procurement',
    name: 'Procurement Agent',
    description: 'Materials, quotes, and inventory',
    icon: '📦',
    color: 'hsl(142, 76%, 36%)',
    capabilities: ['materials', 'quotes', 'inventory', 'vendors', 'orders']
  },
  sales: {
    id: 'sales',
    name: 'Sales Agent',
    description: 'Leads, proposals, and CRM',
    icon: '💼',
    color: 'hsl(217, 91%, 60%)',
    capabilities: ['leads', 'proposals', 'crm', 'contacts', 'follow-ups']
  },
  analytics: {
    id: 'analytics',
    name: 'Analytics Agent',
    description: 'Reports, metrics, and insights',
    icon: '📊',
    color: 'hsl(280, 65%, 60%)',
    capabilities: ['reports', 'metrics', 'profitability', 'performance', 'trends']
  }
};

// Determine agent type from message content
export const detectAgentType = (content: string): string => {
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('material') || lowerContent.includes('quote') || 
      lowerContent.includes('inventory') || lowerContent.includes('vendor') ||
      lowerContent.includes('order') || lowerContent.includes('procurement')) {
    return 'procurement';
  }
  
  if (lowerContent.includes('lead') || lowerContent.includes('proposal') ||
      lowerContent.includes('crm') || lowerContent.includes('sales') ||
      lowerContent.includes('customer') || lowerContent.includes('contact')) {
    return 'sales';
  }
  
  if (lowerContent.includes('report') || lowerContent.includes('metric') ||
      lowerContent.includes('analytics') || lowerContent.includes('profit') ||
      lowerContent.includes('performance') || lowerContent.includes('insight')) {
    return 'analytics';
  }
  
  return 'operations';
};
