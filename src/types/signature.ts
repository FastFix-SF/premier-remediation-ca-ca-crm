export interface SignatureEnvelope {
  id: string;
  proposal_id?: string;
  created_by: string;
  sent_at?: string;
  completed_at?: string;
  voided_at?: string;
  created_at: string;
  updated_at: string;
  status: 'draft' | 'sent' | 'delivered' | 'completed' | 'declined' | 'voided' | 'expired';
  subject: string;
  message?: string;
  email_settings?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface EnvelopeDocument {
  id: string;
  envelope_id: string;
  created_at: string;
  document_order: number;
  name: string;
  file_url: string;
  page_count: number;
  metadata?: Record<string, any>;
}

export interface EnvelopeRecipient {
  id: string;
  envelope_id: string;
  signing_order: number;
  sent_at?: string;
  viewed_at?: string;
  signed_at?: string;
  declined_at?: string;
  created_at: string;
  updated_at: string;
  name: string;
  email: string;
  role: 'signer' | 'cc' | 'viewer';
  status: 'pending' | 'sent' | 'delivered' | 'viewed' | 'signed' | 'declined';
  access_token?: string;
  ip_address?: string;
  user_agent?: string;
  decline_reason?: string;
}

export interface DocumentField {
  id: string;
  document_id: string;
  recipient_id: string;
  created_at: string;
  field_type: 'signature' | 'initial' | 'date' | 'text' | 'email' | 'number' | 'checkbox' | 'radio' | 'dropdown' | 'name' | 'title' | 'company';
  field_label?: string;
  page_number: number;
  x_position: number;
  y_position: number;
  width: number;
  height: number;
  is_required: boolean;
  tab_order?: number;
  validation_pattern?: string;
  default_value?: string;
  options?: Record<string, any>;
}

export interface FieldCompletion {
  id: string;
  field_id: string;
  recipient_id: string;
  completed_at: string;
  value?: string;
  signature_image_url?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
}

export interface SignatureSession {
  id: string;
  recipient_id: string;
  started_at: string;
  last_activity_at: string;
  expires_at: string;
  completed_at?: string;
  ip_address?: string;
  user_agent?: string;
  device_info?: Record<string, any>;
  session_token?: string;
}

export interface EnvelopeAuditTrail {
  id: string;
  envelope_id: string;
  user_id?: string;
  recipient_id?: string;
  timestamp: string;
  action: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}
