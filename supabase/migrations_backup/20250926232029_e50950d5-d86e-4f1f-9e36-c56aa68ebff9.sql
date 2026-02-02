-- Enhanced Materials Tracking and Billing Integration

-- Create material_bills table for tracking material orders and billing
CREATE TABLE public.material_bills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  bill_number TEXT NOT NULL DEFAULT ('BILL-' || EXTRACT(EPOCH FROM NOW())::TEXT),
  vendor TEXT NOT NULL,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  delivery_date DATE,
  status TEXT NOT NULL DEFAULT 'ordered' CHECK (status IN ('ordered', 'partial', 'complete', 'returned')),
  checked_by UUID,
  total_amount NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create material_documents table for storing delivery tickets, invoices, receipts
CREATE TABLE public.material_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('delivery_ticket', 'vendor_invoice', 'return_receipt', 'other')),
  document_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enhance project_materials table with new tracking fields
ALTER TABLE public.project_materials 
ADD COLUMN IF NOT EXISTS bill_id UUID,
ADD COLUMN IF NOT EXISTS quantity_ordered NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS quantity_received NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS quantity_remaining NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'received', 'returned', 'sent_to_yard')),
ADD COLUMN IF NOT EXISTS is_returned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sent_to_yard BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS checked_by UUID,
ADD COLUMN IF NOT EXISTS delivery_date DATE,
ADD COLUMN IF NOT EXISTS return_date DATE;

-- Enable RLS on new tables
ALTER TABLE public.material_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for material_bills
CREATE POLICY "Admins can manage all material bills" 
ON public.material_bills 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "Team members can view project material bills" 
ON public.material_bills 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM project_team_assignments 
  WHERE project_id = material_bills.project_id AND user_id = auth.uid()
));

-- RLS policies for material_documents
CREATE POLICY "Admins can manage all material documents" 
ON public.material_documents 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "Team members can view project material documents" 
ON public.material_documents 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM material_bills mb
  JOIN project_team_assignments pta ON pta.project_id = mb.project_id
  WHERE mb.id = material_documents.bill_id AND pta.user_id = auth.uid()
));

-- Add foreign key constraints
ALTER TABLE public.material_documents 
ADD CONSTRAINT fk_material_documents_bill_id 
FOREIGN KEY (bill_id) REFERENCES public.material_bills(id) ON DELETE CASCADE;

ALTER TABLE public.project_materials 
ADD CONSTRAINT fk_project_materials_bill_id 
FOREIGN KEY (bill_id) REFERENCES public.material_bills(id) ON DELETE SET NULL;

-- Create updated_at triggers
CREATE TRIGGER update_material_bills_updated_at 
BEFORE UPDATE ON public.material_bills 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_material_bills_project_id ON public.material_bills(project_id);
CREATE INDEX idx_material_bills_status ON public.material_bills(status);
CREATE INDEX idx_material_documents_bill_id ON public.material_documents(bill_id);
CREATE INDEX idx_project_materials_bill_id ON public.project_materials(bill_id);
CREATE INDEX idx_project_materials_status ON public.project_materials(status);