-- Create store_orders table
CREATE TABLE public.store_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  shipping DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  notes TEXT,
  shipping_address JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for user orders lookup
CREATE INDEX idx_store_orders_user_id ON public.store_orders(user_id);
CREATE INDEX idx_store_orders_order_number ON public.store_orders(order_number);
CREATE INDEX idx_store_orders_status ON public.store_orders(status);

-- Enable Row Level Security
ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view their own orders
CREATE POLICY "Users can view their own orders"
ON public.store_orders
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own orders
CREATE POLICY "Users can create their own orders"
ON public.store_orders
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can manage all orders
CREATE POLICY "Admins can manage all orders"
ON public.store_orders
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.is_active = true
  )
);

-- Create function to generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate order number
CREATE TRIGGER set_order_number
  BEFORE INSERT ON public.store_orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
  EXECUTE FUNCTION public.generate_order_number();

-- Create updated_at trigger
CREATE TRIGGER update_store_orders_updated_at
  BEFORE UPDATE ON public.store_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();