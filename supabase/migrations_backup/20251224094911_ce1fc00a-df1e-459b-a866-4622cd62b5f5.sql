-- Create todos table for project-related to-do items
CREATE TABLE public.todos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'critical', 'low')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'complete')),
  due_date DATE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  assigned_to UUID,
  assigned_to_name TEXT,
  address TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Create policies - all authenticated users can view todos
CREATE POLICY "Authenticated users can view todos" 
ON public.todos 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create todos" 
ON public.todos 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update todos" 
ON public.todos 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete todos" 
ON public.todos 
FOR DELETE 
TO authenticated
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_todos_updated_at
BEFORE UPDATE ON public.todos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();