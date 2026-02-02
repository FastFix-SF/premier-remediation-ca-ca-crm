-- Create signature envelopes table
CREATE TABLE IF NOT EXISTS public.signature_envelopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES public.project_proposals(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  voided_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'draft',
  subject TEXT NOT NULL,
  message TEXT,
  email_settings JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  CONSTRAINT valid_status CHECK (status IN ('draft', 'sent', 'delivered', 'completed', 'declined', 'voided', 'expired'))
);

-- Create envelope documents table
CREATE TABLE IF NOT EXISTS public.envelope_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  envelope_id UUID NOT NULL REFERENCES public.signature_envelopes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  document_order INTEGER NOT NULL DEFAULT 0,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  page_count INTEGER NOT NULL DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create envelope recipients table
CREATE TABLE IF NOT EXISTS public.envelope_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  envelope_id UUID NOT NULL REFERENCES public.signature_envelopes(id) ON DELETE CASCADE,
  signing_order INTEGER NOT NULL DEFAULT 1,
  sent_at TIMESTAMP WITH TIME ZONE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  signed_at TIMESTAMP WITH TIME ZONE,
  declined_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'signer',
  status TEXT NOT NULL DEFAULT 'pending',
  access_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'base64'),
  ip_address TEXT,
  user_agent TEXT,
  decline_reason TEXT,
  CONSTRAINT valid_recipient_status CHECK (status IN ('pending', 'sent', 'delivered', 'viewed', 'signed', 'declined')),
  CONSTRAINT valid_role CHECK (role IN ('signer', 'cc', 'viewer'))
);

-- Create document fields table
CREATE TABLE IF NOT EXISTS public.document_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.envelope_documents(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.envelope_recipients(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  field_type TEXT NOT NULL,
  field_label TEXT,
  page_number INTEGER NOT NULL DEFAULT 1,
  x_position NUMERIC NOT NULL,
  y_position NUMERIC NOT NULL,
  width NUMERIC NOT NULL,
  height NUMERIC NOT NULL,
  is_required BOOLEAN DEFAULT true,
  tab_order INTEGER,
  validation_pattern TEXT,
  default_value TEXT,
  options JSONB DEFAULT '{}'::jsonb,
  CONSTRAINT valid_field_type CHECK (field_type IN ('signature', 'initial', 'date', 'text', 'email', 'number', 'checkbox', 'radio', 'dropdown', 'name', 'title', 'company'))
);

-- Create field completions table
CREATE TABLE IF NOT EXISTS public.field_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES public.document_fields(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.envelope_recipients(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  value TEXT,
  signature_image_url TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create signature sessions table
CREATE TABLE IF NOT EXISTS public.signature_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES public.envelope_recipients(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  completed_at TIMESTAMP WITH TIME ZONE,
  ip_address TEXT,
  user_agent TEXT,
  device_info JSONB DEFAULT '{}'::jsonb,
  session_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'base64')
);

-- Create envelope audit trail table
CREATE TABLE IF NOT EXISTS public.envelope_audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  envelope_id UUID NOT NULL REFERENCES public.signature_envelopes(id) ON DELETE CASCADE,
  user_id UUID,
  recipient_id UUID REFERENCES public.envelope_recipients(id) ON DELETE SET NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT
);

-- Enable RLS
ALTER TABLE public.signature_envelopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.envelope_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.envelope_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signature_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.envelope_audit_trail ENABLE ROW LEVEL SECURITY;

-- RLS Policies for signature_envelopes
CREATE POLICY "Admins can manage all envelopes"
  ON public.signature_envelopes
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true
  ));

CREATE POLICY "Users can view envelopes they created"
  ON public.signature_envelopes
  FOR SELECT
  USING (created_by = auth.uid());

-- RLS Policies for envelope_documents
CREATE POLICY "Admins can manage all envelope documents"
  ON public.envelope_documents
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true
  ));

CREATE POLICY "Recipients can view documents in their envelopes"
  ON public.envelope_documents
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.envelope_recipients
    WHERE envelope_recipients.envelope_id = envelope_documents.envelope_id
    AND envelope_recipients.email = auth.email()
  ));

-- RLS Policies for envelope_recipients
CREATE POLICY "Admins can manage all recipients"
  ON public.envelope_recipients
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true
  ));

CREATE POLICY "Recipients can view their own recipient record"
  ON public.envelope_recipients
  FOR SELECT
  USING (email = auth.email());

CREATE POLICY "Public can view recipients with valid access token"
  ON public.envelope_recipients
  FOR SELECT
  USING (access_token = current_setting('request.headers', true)::json->>'x-signature-token');

-- RLS Policies for document_fields
CREATE POLICY "Admins can manage all document fields"
  ON public.document_fields
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true
  ));

CREATE POLICY "Recipients can view fields assigned to them"
  ON public.document_fields
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.envelope_recipients
    WHERE envelope_recipients.id = document_fields.recipient_id
    AND envelope_recipients.email = auth.email()
  ));

-- RLS Policies for field_completions
CREATE POLICY "Admins can view all field completions"
  ON public.field_completions
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true
  ));

CREATE POLICY "Recipients can manage their own field completions"
  ON public.field_completions
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.envelope_recipients
    WHERE envelope_recipients.id = field_completions.recipient_id
    AND envelope_recipients.email = auth.email()
  ));

-- RLS Policies for signature_sessions
CREATE POLICY "Admins can view all signature sessions"
  ON public.signature_sessions
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true
  ));

CREATE POLICY "Recipients can manage their own sessions"
  ON public.signature_sessions
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.envelope_recipients
    WHERE envelope_recipients.id = signature_sessions.recipient_id
    AND envelope_recipients.email = auth.email()
  ));

-- RLS Policies for envelope_audit_trail
CREATE POLICY "Admins can view all audit trail entries"
  ON public.envelope_audit_trail
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true
  ));

CREATE POLICY "System can insert audit trail entries"
  ON public.envelope_audit_trail
  FOR INSERT
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_signature_envelopes_proposal_id ON public.signature_envelopes(proposal_id);
CREATE INDEX idx_signature_envelopes_status ON public.signature_envelopes(status);
CREATE INDEX idx_signature_envelopes_created_by ON public.signature_envelopes(created_by);

CREATE INDEX idx_envelope_documents_envelope_id ON public.envelope_documents(envelope_id);
CREATE INDEX idx_envelope_documents_order ON public.envelope_documents(envelope_id, document_order);

CREATE INDEX idx_envelope_recipients_envelope_id ON public.envelope_recipients(envelope_id);
CREATE INDEX idx_envelope_recipients_email ON public.envelope_recipients(email);
CREATE INDEX idx_envelope_recipients_access_token ON public.envelope_recipients(access_token);
CREATE INDEX idx_envelope_recipients_status ON public.envelope_recipients(status);

CREATE INDEX idx_document_fields_document_id ON public.document_fields(document_id);
CREATE INDEX idx_document_fields_recipient_id ON public.document_fields(recipient_id);

CREATE INDEX idx_field_completions_field_id ON public.field_completions(field_id);
CREATE INDEX idx_field_completions_recipient_id ON public.field_completions(recipient_id);

CREATE INDEX idx_signature_sessions_recipient_id ON public.signature_sessions(recipient_id);
CREATE INDEX idx_signature_sessions_token ON public.signature_sessions(session_token);

CREATE INDEX idx_envelope_audit_trail_envelope_id ON public.envelope_audit_trail(envelope_id);
CREATE INDEX idx_envelope_audit_trail_timestamp ON public.envelope_audit_trail(timestamp DESC);

-- Create triggers for updated_at
CREATE TRIGGER update_signature_envelopes_updated_at
  BEFORE UPDATE ON public.signature_envelopes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_envelope_recipients_updated_at
  BEFORE UPDATE ON public.envelope_recipients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();