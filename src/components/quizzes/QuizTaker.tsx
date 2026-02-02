import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, ArrowRight, RotateCcw, Trophy, FileText } from 'lucide-react';
import { useQuiz, useQuizQuestions, useSubmitQuizAttempt, QuizQuestion } from '@/hooks/useQuizzes';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface QuizTakerProps {
  quizId: string;
  onComplete?: () => void;
}

type QuizState = 'presentation' | 'quiz' | 'result';

export const QuizTaker: React.FC<QuizTakerProps> = ({ quizId, onComplete }) => {
  const { user } = useAuth();
  const { data: quiz } = useQuiz(quizId);
  const { data: questions } = useQuizQuestions(quizId);
  const submitAttempt = useSubmitQuizAttempt();

  const [state, setState] = useState<QuizState>('presentation');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [passed, setPassed] = useState(false);

  if (!quiz || !questions) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleStartQuiz = () => {
    setState('quiz');
    setCurrentQuestionIndex(0);
    setCorrectAnswers(0);
    setSelectedAnswerId(null);
    setShowFeedback(false);
  };

  const handleSelectAnswer = (answerId: string) => {
    if (showFeedback) return;
    setSelectedAnswerId(answerId);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswerId || !currentQuestion) return;
    
    const selectedAnswer = currentQuestion.answers?.find(a => a.id === selectedAnswerId);
    const isCorrect = selectedAnswer?.is_correct || false;
    
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
    }
    
    setShowFeedback(true);
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswerId(null);
      setShowFeedback(false);
    } else {
      // Quiz complete
      const totalCorrect = correctAnswers + (currentQuestion.answers?.find(a => a.id === selectedAnswerId)?.is_correct ? 0 : 0);
      const score = Math.round((correctAnswers / questions.length) * 100);
      const hasPassed = score >= (quiz.passing_score || 70);
      
      setFinalScore(score);
      setPassed(hasPassed);
      setState('result');
      
      if (user) {
        await submitAttempt.mutateAsync({
          quizId,
          userId: user.id,
          score,
          passed: hasPassed,
        });
      }
    }
  };

  const handleRetry = () => {
    setState('presentation');
    setCurrentQuestionIndex(0);
    setCorrectAnswers(0);
    setSelectedAnswerId(null);
    setShowFeedback(false);
    setFinalScore(0);
    setPassed(false);
  };

  // Presentation View
  if (state === 'presentation') {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {quiz.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {quiz.description && (
              <p className="text-muted-foreground">{quiz.description}</p>
            )}
            
            {quiz.presentation_url && (
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                {quiz.presentation_url.includes('youtube') || quiz.presentation_url.includes('youtu.be') ? (
                  <iframe
                    src={quiz.presentation_url.replace('watch?v=', 'embed/')}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : quiz.presentation_url.endsWith('.pdf') ? (
                  <iframe
                    src={quiz.presentation_url}
                    className="w-full h-full"
                  />
                ) : (
                  <a 
                    href={quiz.presentation_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center h-full text-primary hover:underline"
                  >
                    View Presentation
                  </a>
                )}
              </div>
            )}

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm"><strong>Questions:</strong> {questions.length}</p>
              <p className="text-sm"><strong>Passing Score:</strong> {quiz.passing_score}%</p>
              <p className="text-sm"><strong>Retries:</strong> Unlimited</p>
            </div>

            <Button onClick={handleStartQuiz} className="w-full" size="lg">
              Start Quiz
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Result View
  if (state === 'result') {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6 text-center space-y-6">
            {passed ? (
              <>
                <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <Trophy className="h-10 w-10 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-green-600">Congratulations!</h2>
                  <p className="text-muted-foreground mt-1">You passed the quiz!</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="h-10 w-10 text-red-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-red-600">Not Quite</h2>
                  <p className="text-muted-foreground mt-1">You didn't pass this time, but you can try again!</p>
                </div>
              </>
            )}

            <div className="bg-muted/50 rounded-lg p-6">
              <p className="text-4xl font-bold">{finalScore}%</p>
              <p className="text-sm text-muted-foreground mt-1">
                {correctAnswers} of {questions.length} correct
              </p>
              <p className="text-sm text-muted-foreground">
                Passing score: {quiz.passing_score}%
              </p>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleRetry} variant="outline" className="flex-1">
                <RotateCcw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              {onComplete && (
                <Button onClick={onComplete} className="flex-1">
                  Done
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Quiz View
  const correctAnswer = currentQuestion?.answers?.find(a => a.is_correct);
  const selectedAnswer = currentQuestion?.answers?.find(a => a.id === selectedAnswerId);
  const isSelectedCorrect = selectedAnswer?.is_correct;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{currentQuestion?.question_text}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentQuestion?.answers?.map((answer) => {
            const isSelected = selectedAnswerId === answer.id;
            const isCorrectAnswer = answer.is_correct;
            
            let variant = 'outline';
            let icon = null;
            
            if (showFeedback) {
              if (isCorrectAnswer) {
                variant = 'success';
                icon = <CheckCircle className="h-5 w-5 text-green-600" />;
              } else if (isSelected && !isCorrectAnswer) {
                variant = 'destructive';
                icon = <XCircle className="h-5 w-5 text-red-600" />;
              }
            }

            return (
              <button
                key={answer.id}
                onClick={() => handleSelectAnswer(answer.id)}
                disabled={showFeedback}
                className={cn(
                  "w-full p-4 rounded-lg border text-left transition-all flex items-center justify-between",
                  !showFeedback && isSelected && "border-primary bg-primary/5",
                  !showFeedback && !isSelected && "hover:border-muted-foreground/50",
                  showFeedback && isCorrectAnswer && "border-green-500 bg-green-50",
                  showFeedback && isSelected && !isCorrectAnswer && "border-red-500 bg-red-50",
                  showFeedback && "cursor-default"
                )}
              >
                <span>{answer.answer_text}</span>
                {icon}
              </button>
            );
          })}
        </CardContent>
      </Card>

      {showFeedback && (
        <Card className={cn(
          "border-2",
          isSelectedCorrect ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"
        )}>
          <CardContent className="pt-4">
            {isSelectedCorrect ? (
              <p className="text-green-700 font-medium flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Correct! Well done.
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-red-700 font-medium flex items-center gap-2">
                  <XCircle className="h-5 w-5" />
                  Incorrect
                </p>
                <p className="text-sm text-muted-foreground">
                  The correct answer is: <strong>{correctAnswer?.answer_text}</strong>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        {!showFeedback ? (
          <Button 
            onClick={handleSubmitAnswer} 
            disabled={!selectedAnswerId}
            className="w-full"
          >
            Submit Answer
          </Button>
        ) : (
          <Button onClick={handleNextQuestion} className="w-full">
            {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
