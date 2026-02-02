-- Create quizzes table
CREATE TABLE public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  presentation_url TEXT,
  passing_score INTEGER NOT NULL DEFAULT 70,
  is_active BOOLEAN NOT NULL DEFAULT true,
  week_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz questions table
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz answers table
CREATE TABLE public.quiz_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  answer_order INTEGER NOT NULL DEFAULT 0
);

-- Create quiz attempts table
CREATE TABLE public.quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  score INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Policies for quizzes (public read, admin write)
CREATE POLICY "Anyone can view active quizzes" ON public.quizzes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage quizzes" ON public.quizzes FOR ALL USING (auth.uid() IS NOT NULL);

-- Policies for questions
CREATE POLICY "Anyone can view questions" ON public.quiz_questions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage questions" ON public.quiz_questions FOR ALL USING (auth.uid() IS NOT NULL);

-- Policies for answers
CREATE POLICY "Anyone can view answers" ON public.quiz_answers FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage answers" ON public.quiz_answers FOR ALL USING (auth.uid() IS NOT NULL);

-- Policies for attempts
CREATE POLICY "Users can view their own attempts" ON public.quiz_attempts FOR SELECT USING (true);
CREATE POLICY "Users can create attempts" ON public.quiz_attempts FOR INSERT WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);
CREATE INDEX idx_quiz_answers_question_id ON public.quiz_answers(question_id);
CREATE INDEX idx_quiz_attempts_user_id ON public.quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON public.quiz_attempts(quiz_id);