/**
 * Constants for the Clients section of Command Center
 */

export const PLAN_OPTIONS = [
  { value: 'starter', label: 'Starter', color: 'bg-slate-500/20 text-slate-400' },
  { value: 'growth', label: 'Growth', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'pro', label: 'Pro', color: 'bg-purple-500/20 text-purple-400' },
  { value: 'advanced', label: 'Advanced', color: 'bg-amber-500/20 text-amber-400' },
  { value: 'fasto', label: 'FASTO', color: 'bg-indigo-500/20 text-indigo-400' },
] as const;

export const STATUS_OPTIONS = [
  { value: 'LEAD', label: 'Lead', color: 'bg-gray-500/20 text-gray-400' },
  { value: 'PROSPECT', label: 'Prospect', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'PROPOSAL_SENT', label: 'Proposal Sent', color: 'bg-yellow-500/20 text-yellow-400' },
  { value: 'CONTRACT_SENT', label: 'Contract Sent', color: 'bg-orange-500/20 text-orange-400' },
  { value: 'ACTIVE', label: 'Active', color: 'bg-green-500/20 text-green-400' },
  { value: 'INACTIVE', label: 'Inactive', color: 'bg-red-500/20 text-red-400' },
  { value: 'CLOSED', label: 'Closed', color: 'bg-slate-500/20 text-slate-400' },
  { value: 'LOST', label: 'Lost', color: 'bg-red-600/20 text-red-500' },
] as const;

export const CATEGORY_ICONS: Record<string, string> = {
  website: '🌐',
  crm: '📊',
  analytics: '📈',
  onboarding: '🎓',
  receptionist: '📞',
  social: '📱',
  operations: '⚙️',
  support: '🛟',
  voice: '🎙️',
  general: '📋',
};

export const CATEGORY_LABELS: Record<string, string> = {
  website: 'Website',
  crm: 'CRM',
  analytics: 'Analytics',
  onboarding: 'Onboarding',
  receptionist: 'Receptionist',
  social: 'Social Media',
  operations: 'Operations',
  support: 'Support',
  voice: 'Voice AI',
  general: 'General',
};

export const INDUSTRIES = [
  'Plumbing',
  'HVAC',
  'Electrical',
  'Roofing',
  'Solar',
  'General Contractor',
  'Landscaping',
  'Painting',
  'Flooring',
  'Kitchen & Bath',
  'Other',
] as const;

export const COMPANY_SIZES = [
  'Solo (1 person)',
  '2-5 employees',
  '6-10 employees',
  '11-20 employees',
  '21-50 employees',
  '50+ employees',
] as const;

export const LEAD_SOURCES = [
  'Referral',
  'Google Search',
  'Social Media',
  'Cold Outreach',
  'Website',
  'Trade Show',
  'Other',
] as const;

export const TIMEZONES = [
  { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
  { value: 'America/Denver', label: 'Mountain (MT)' },
  { value: 'America/Chicago', label: 'Central (CT)' },
  { value: 'America/New_York', label: 'Eastern (ET)' },
] as const;

export const CONTACT_METHODS = [
  { value: 'phone', label: 'Phone' },
  { value: 'sms', label: 'SMS' },
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
] as const;

export const getPlanColor = (planType: string | null | undefined): string => {
  const plan = PLAN_OPTIONS.find(p => p.value === planType);
  return plan?.color || 'bg-gray-500/20 text-gray-400';
};

export const getStatusColor = (status: string | null | undefined): string => {
  const statusOption = STATUS_OPTIONS.find(s => s.value === status);
  return statusOption?.color || 'bg-gray-500/20 text-gray-400';
};

export const getPlanLabel = (planType: string | null | undefined): string => {
  const plan = PLAN_OPTIONS.find(p => p.value === planType);
  return plan?.label || 'No Plan';
};

export const getStatusLabel = (status: string | null | undefined): string => {
  const statusOption = STATUS_OPTIONS.find(s => s.value === status);
  return statusOption?.label || 'Unknown';
};
