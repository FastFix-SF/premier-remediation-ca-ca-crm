import React, { useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuizList } from '@/components/quizzes/QuizList';
import { QuizTaker } from '@/components/quizzes/QuizTaker';
import { QuizCreator } from '@/components/quizzes/QuizCreator';

type View = 'list' | 'take' | 'create';

const QuizzesPage: React.FC = () => {
  // Since this page is wrapped in MobileAdminGuard, user is already admin
  const [view, setView] = useState<View>('list');
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);

  const handleBack = () => {
    setView('list');
    setSelectedQuizId(null);
  };

  const handleSelectQuiz = (quizId: string) => {
    setSelectedQuizId(quizId);
    setView('take');
  };

  const handleCreateQuiz = () => {
    setView('create');
  };

  const getTitle = () => {
    switch (view) {
      case 'take': return 'Quiz';
      case 'create': return 'Create Quiz';
      default: return 'Training Quizzes';
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="sticky top-0 z-10 bg-background border-b px-3 xs:px-4 py-2 xs:py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 xs:gap-3 min-w-0 flex-1">
            {view !== 'list' && (
              <Button variant="ghost" size="icon" onClick={handleBack} className="h-9 w-9 xs:h-10 xs:w-10 flex-shrink-0">
                <ArrowLeft className="h-4 w-4 xs:h-5 xs:w-5" />
              </Button>
            )}
            <h1 className="text-lg xs:text-xl font-bold truncate">{getTitle()}</h1>
          </div>
          
          {view === 'list' && (
            <Button size="sm" onClick={handleCreateQuiz} className="flex-shrink-0 text-xs xs:text-sm">
              <Plus className="h-3.5 w-3.5 xs:h-4 xs:w-4 mr-1" />
              <span className="hidden xs:inline">Create</span>
              <span className="xs:hidden">+</span>
            </Button>
          )}
        </div>
      </div>

      <div className="p-3 xs:p-4">
        {view === 'list' && (
          <QuizList onSelectQuiz={handleSelectQuiz} />
        )}
        
        {view === 'take' && selectedQuizId && (
          <QuizTaker 
            quizId={selectedQuizId} 
            onComplete={handleBack}
          />
        )}
        
        {view === 'create' && (
          <QuizCreator onComplete={handleBack} />
        )}
      </div>
    </div>
  );
};

export default QuizzesPage;
