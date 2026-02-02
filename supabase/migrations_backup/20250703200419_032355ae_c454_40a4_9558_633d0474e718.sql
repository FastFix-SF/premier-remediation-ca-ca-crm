-- Advanced Features Schema
-- User roles and permissions
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('customer', 'admin', 'sales_rep')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policies for user_roles
CREATE POLICY "Users can view their own role" ON public.user_roles
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles" ON public.user_roles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- CRM Leads table
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost')),
  source TEXT,
  notes TEXT,
  estimated_value DECIMAL(10,2),
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Policies for leads
CREATE POLICY "Admins and sales reps can view all leads" ON public.leads
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'sales_rep')
  )
);

CREATE POLICY "Users can view their assigned leads" ON public.leads
FOR SELECT USING (assigned_to = auth.uid());

-- Quotes table
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  quote_number TEXT UNIQUE NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  valid_until DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Policies for quotes
CREATE POLICY "Admins and sales reps can view all quotes" ON public.quotes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'sales_rep')
  )
);

-- Chat conversations
CREATE TABLE public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

-- Policies for chat_conversations
CREATE POLICY "Users can view their own conversations" ON public.chat_conversations
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own conversations" ON public.chat_conversations
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Chat messages
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for chat_messages
CREATE POLICY "Users can view messages from their conversations" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_conversations cc 
    WHERE cc.id = conversation_id AND cc.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create messages in their conversations" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_conversations cc 
    WHERE cc.id = conversation_id AND cc.user_id = auth.uid()
  )
);

-- Triggers for updated_at
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_conversations_updated_at
  BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Generate quote number function
CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  quote_num TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(quote_number FROM 'Q-(\d+)') AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.quotes
  WHERE quote_number ~ '^Q-\d+$';
  
  quote_num := 'Q-' || LPAD(next_num::TEXT, 6, '0');
  RETURN quote_num;
END;
$$ LANGUAGE plpgsql;