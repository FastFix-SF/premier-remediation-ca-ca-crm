import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, CheckCircle, Play } from 'lucide-react';
import { useQuizzes, useQuizAttempts } from '@/hooks/useQuizzes';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface QuizListProps {
  onSelectQuiz: (quizId: string) => void;
}

export const QuizList: React.FC<QuizListProps> = ({ onSelectQuiz }) => {
  const { user } = useAuth();
  const { data: quizzes, isLoading } = useQuizzes();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!quizzes || quizzes.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold">No Quizzes Available</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Check back later for new training quizzes.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {quizzes.map((quiz) => (
        <QuizCard 
          key={quiz.id} 
          quiz={quiz} 
          userId={user?.id}
          onSelect={() => onSelectQuiz(quiz.id)} 
        />
      ))}
    </div>
  );
};

interface QuizCardProps {
  quiz: {
    id: string;
    title: string;
    description: string | null;
    passing_score: number;
    week_number: number | null;
    created_at: string;
  };
  userId?: string;
  onSelect: () => void;
}

const QuizCard: React.FC<QuizCardProps> = ({ quiz, userId, onSelect }) => {
  const { data: attempts } = useQuizAttempts(quiz.id, userId);
  
  const hasPassed = attempts?.some(a => a.passed);
  const bestScore = attempts?.length 
    ? Math.max(...attempts.map(a => a.score)) 
    : null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              {quiz.title}
              {hasPassed && (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
            </CardTitle>
            {quiz.week_number && (
              <Badge variant="secondary" className="text-xs">
                Week {quiz.week_number}
              </Badge>
            )}
          </div>
          {bestScore !== null && (
            <Badge variant={hasPassed ? "default" : "secondary"}>
              Best: {bestScore}%
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {quiz.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {quiz.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatDistanceToNow(new Date(quiz.created_at), { addSuffix: true })}
            </span>
            <span>Pass: {quiz.passing_score}%</span>
          </div>
          
          <Button size="sm" onClick={onSelect}>
            <Play className="h-4 w-4 mr-1" />
            {hasPassed ? 'Retake' : 'Start'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
