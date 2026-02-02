import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Quiz {
  id: string;
  title: string;
  description: string | null;
  presentation_url: string | null;
  passing_score: number;
  is_active: boolean;
  week_number: number | null;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_order: number;
  created_at: string;
  answers?: QuizAnswer[];
}

export interface QuizAnswer {
  id: string;
  question_id: string;
  answer_text: string;
  is_correct: boolean;
  answer_order: number;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  passed: boolean;
  completed_at: string;
}

export const useQuizzes = () => {
  return useQuery({
    queryKey: ['quizzes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Quiz[];
    },
  });
};

export const useQuiz = (quizId: string | undefined) => {
  return useQuery({
    queryKey: ['quiz', quizId],
    queryFn: async () => {
      if (!quizId) return null;
      
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .maybeSingle();
      
      if (error) throw error;
      return data as Quiz;
    },
    enabled: !!quizId,
  });
};

export const useQuizQuestions = (quizId: string | undefined) => {
  return useQuery({
    queryKey: ['quiz-questions', quizId],
    queryFn: async () => {
      if (!quizId) return [];
      
      const { data: questions, error: questionsError } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('question_order', { ascending: true });
      
      if (questionsError) throw questionsError;
      
      // Fetch answers for all questions
      const questionIds = questions.map(q => q.id);
      const { data: answers, error: answersError } = await supabase
        .from('quiz_answers')
        .select('*')
        .in('question_id', questionIds)
        .order('answer_order', { ascending: true });
      
      if (answersError) throw answersError;
      
      // Combine questions with their answers
      return questions.map(question => ({
        ...question,
        answers: answers.filter(a => a.question_id === question.id),
      })) as QuizQuestion[];
    },
    enabled: !!quizId,
  });
};

export const useQuizAttempts = (quizId: string | undefined, userId: string | undefined) => {
  return useQuery({
    queryKey: ['quiz-attempts', quizId, userId],
    queryFn: async () => {
      if (!quizId || !userId) return [];
      
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('quiz_id', quizId)
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });
      
      if (error) throw error;
      return data as QuizAttempt[];
    },
    enabled: !!quizId && !!userId,
  });
};

export const useSubmitQuizAttempt = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ quizId, userId, score, passed }: { 
      quizId: string; 
      userId: string; 
      score: number; 
      passed: boolean;
    }) => {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .insert({
          quiz_id: quizId,
          user_id: userId,
          score,
          passed,
        })
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quiz-attempts', variables.quizId] });
    },
  });
};

// Admin hooks
export const useCreateQuiz = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (quiz: { title: string; description?: string; presentation_url?: string; passing_score?: number; week_number?: number }) => {
      const { data, error } = await supabase
        .from('quizzes')
        .insert(quiz)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      toast.success('Quiz created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create quiz: ' + error.message);
    },
  });
};

export const useUpdateQuiz = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Quiz> & { id: string }) => {
      const { data, error } = await supabase
        .from('quizzes')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      toast.success('Quiz updated successfully');
    },
  });
};

export const useCreateQuestion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ question, answers }: { 
      question: { quiz_id: string; question_text: string; question_order?: number }; 
      answers: { answer_text: string; is_correct?: boolean; answer_order?: number }[];
    }) => {
      const { data: questionData, error: questionError } = await supabase
        .from('quiz_questions')
        .insert(question)
        .select()
        .maybeSingle();
      
      if (questionError) throw questionError;
      
      const answersWithQuestionId = answers.map(a => ({
        ...a,
        question_id: questionData.id,
      }));
      
      const { error: answersError } = await supabase
        .from('quiz_answers')
        .insert(answersWithQuestionId);
      
      if (answersError) throw answersError;
      
      return questionData;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quiz-questions', variables.question.quiz_id] });
      toast.success('Question added successfully');
    },
  });
};

export const useDeleteQuestion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ questionId, quizId }: { questionId: string; quizId: string }) => {
      const { error } = await supabase
        .from('quiz_questions')
        .delete()
        .eq('id', questionId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quiz-questions', variables.quizId] });
      toast.success('Question deleted');
    },
  });
};
