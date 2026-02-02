import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Mic, Square, Loader2, CheckCircle, XCircle, Pencil, Trash2, Save, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCreateQuiz, useCreateQuestion } from '@/hooks/useQuizzes';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface GeneratedQuestion {
  question_text: string;
  answers: {
    answer_text: string;
    is_correct: boolean;
  }[];
}

interface GeneratedQuiz {
  title: string;
  description: string;
  questions: GeneratedQuestion[];
}

interface QuizCreatorProps {
  onComplete?: () => void;
}

export const QuizCreator: React.FC<QuizCreatorProps> = ({ onComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [transcription, setTranscription] = useState('');
  const [generatedQuiz, setGeneratedQuiz] = useState<GeneratedQuiz | null>(null);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const createQuiz = useCreateQuiz();
  const createQuestion = useCreateQuestion();
  const { language } = useLanguage();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await processAudio(audioBlob);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      toast.info('Recording started - describe your quiz topic');
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Failed to access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      // Step 1: Transcribe audio
      setProcessingStep('Transcribing your voice note...');
      
      const reader = new FileReader();
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      const { data: transcribeData, error: transcribeError } = await supabase.functions.invoke('transcribe-audio', {
        body: { audio: base64Audio }
      });

      if (transcribeError) throw transcribeError;
      
      const transcribedText = transcribeData.text;
      setTranscription(transcribedText);
      toast.success('Voice note transcribed');

      // Step 2: Generate quiz from transcription
      setProcessingStep(language === 'es' ? 'Generando preguntas del quiz...' : 'Generating quiz questions...');
      
      const { data: quizData, error: quizError } = await supabase.functions.invoke('generate-quiz', {
        body: { transcription: transcribedText, language }
      });

      if (quizError) throw quizError;
      
      setGeneratedQuiz(quizData);
      toast.success('Quiz generated with 10 questions');
      
    } catch (error) {
      console.error('Error processing audio:', error);
      toast.error('Failed to process voice note');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const updateQuestion = (index: number, updates: Partial<GeneratedQuestion>) => {
    if (!generatedQuiz) return;
    
    const updatedQuestions = [...generatedQuiz.questions];
    updatedQuestions[index] = { ...updatedQuestions[index], ...updates };
    setGeneratedQuiz({ ...generatedQuiz, questions: updatedQuestions });
  };

  const updateAnswer = (questionIndex: number, answerIndex: number, updates: { answer_text?: string; is_correct?: boolean }) => {
    if (!generatedQuiz) return;
    
    const updatedQuestions = [...generatedQuiz.questions];
    const updatedAnswers = [...updatedQuestions[questionIndex].answers];
    
    if (updates.is_correct) {
      // Ensure only one answer is correct
      updatedAnswers.forEach((a, i) => {
        a.is_correct = i === answerIndex;
      });
    } else {
      updatedAnswers[answerIndex] = { ...updatedAnswers[answerIndex], ...updates };
    }
    
    updatedQuestions[questionIndex].answers = updatedAnswers;
    setGeneratedQuiz({ ...generatedQuiz, questions: updatedQuestions });
  };

  const deleteQuestion = (index: number) => {
    if (!generatedQuiz) return;
    
    const updatedQuestions = generatedQuiz.questions.filter((_, i) => i !== index);
    setGeneratedQuiz({ ...generatedQuiz, questions: updatedQuestions });
    toast.info('Question removed');
  };

  const saveQuiz = async () => {
    if (!generatedQuiz || generatedQuiz.questions.length === 0) {
      toast.error('No questions to save');
      return;
    }

    try {
      setIsProcessing(true);
      setProcessingStep('Saving quiz...');

      // Create the quiz
      const quizResult = await createQuiz.mutateAsync({
        title: generatedQuiz.title,
        description: generatedQuiz.description,
        passing_score: 70,
      });

      // Create each question with answers
      for (let i = 0; i < generatedQuiz.questions.length; i++) {
        const q = generatedQuiz.questions[i];
        await createQuestion.mutateAsync({
          question: {
            quiz_id: quizResult.id,
            question_text: q.question_text,
            question_order: i,
          },
          answers: q.answers.map((a, j) => ({
            answer_text: a.answer_text,
            is_correct: a.is_correct,
            answer_order: j,
          })),
        });
      }

      toast.success('Quiz saved successfully!');
      onComplete?.();
    } catch (error) {
      console.error('Error saving quiz:', error);
      toast.error('Failed to save quiz');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  // Recording State
  if (!generatedQuiz && !isProcessing) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Create Quiz from Voice</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              Record a voice note describing your quiz topic. Include:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>The main topic (e.g., "Fall Protection")</li>
              <li>Key concepts to cover</li>
              <li>Specific points you want questions about</li>
            </ul>

            <div className="flex flex-col items-center gap-4 py-8">
              <Button
                size="lg"
                variant={isRecording ? "destructive" : "default"}
                className={cn(
                  "w-24 h-24 rounded-full",
                  isRecording && "animate-pulse"
                )}
                onClick={isRecording ? stopRecording : startRecording}
              >
                {isRecording ? (
                  <Square className="h-8 w-8" />
                ) : (
                  <Mic className="h-8 w-8" />
                )}
              </Button>
              <p className="text-sm text-muted-foreground">
                {isRecording ? 'Tap to stop recording' : 'Tap to start recording'}
              </p>
            </div>

            {transcription && (
              <div className="space-y-2">
                <Label>Transcription</Label>
                <Textarea
                  value={transcription}
                  onChange={(e) => setTranscription(e.target.value)}
                  rows={4}
                  className="text-sm"
                />
                <Button 
                  onClick={() => {
                    setIsProcessing(true);
                    setProcessingStep(language === 'es' ? 'Generando preguntas del quiz...' : 'Generating quiz questions...');
                    supabase.functions.invoke('generate-quiz', {
                      body: { transcription, language }
                    }).then(({ data, error }) => {
                      if (error) throw error;
                      setGeneratedQuiz(data);
                      toast.success(language === 'es' ? 'Quiz regenerado' : 'Quiz regenerated');
                    }).catch((err) => {
                      toast.error(language === 'es' ? 'Error al generar el quiz' : 'Failed to generate quiz');
                    }).finally(() => {
                      setIsProcessing(false);
                      setProcessingStep('');
                    });
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Regenerate Quiz from Text
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Processing State
  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg font-medium">{processingStep}</p>
      </div>
    );
  }

  // Review & Edit State
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Review Quiz</span>
            <Badge variant="secondary">{generatedQuiz?.questions.length} Questions</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Quiz Title</Label>
            <Input
              value={generatedQuiz?.title || ''}
              onChange={(e) => setGeneratedQuiz(prev => prev ? { ...prev, title: e.target.value } : null)}
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={generatedQuiz?.description || ''}
              onChange={(e) => setGeneratedQuiz(prev => prev ? { ...prev, description: e.target.value } : null)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {generatedQuiz?.questions.map((question, qIndex) => (
        <Card key={qIndex} className="overflow-hidden">
          <CardHeader className="pb-3 bg-muted/30">
            <div className="flex items-start justify-between">
              <Badge variant="outline">Question {qIndex + 1}</Badge>
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setEditingQuestionIndex(editingQuestionIndex === qIndex ? null : qIndex)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => deleteQuestion(qIndex)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {editingQuestionIndex === qIndex ? (
              <Textarea
                value={question.question_text}
                onChange={(e) => updateQuestion(qIndex, { question_text: e.target.value })}
                rows={2}
              />
            ) : (
              <p className="font-medium">{question.question_text}</p>
            )}

            <div className="space-y-2">
              {question.answers.map((answer, aIndex) => (
                <div
                  key={aIndex}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border",
                    answer.is_correct && "border-green-500 bg-green-50"
                  )}
                >
                  <button
                    onClick={() => updateAnswer(qIndex, aIndex, { is_correct: true })}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                      answer.is_correct ? "border-green-500 bg-green-500" : "border-muted-foreground"
                    )}
                  >
                    {answer.is_correct && <CheckCircle className="h-4 w-4 text-white" />}
                  </button>
                  
                  {editingQuestionIndex === qIndex ? (
                    <Input
                      value={answer.answer_text}
                      onChange={(e) => updateAnswer(qIndex, aIndex, { answer_text: e.target.value })}
                      className="flex-1"
                    />
                  ) : (
                    <span className="flex-1">{answer.answer_text}</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex gap-3 sticky bottom-4">
        <Button
          variant="outline"
          onClick={() => {
            setGeneratedQuiz(null);
            setTranscription('');
          }}
          className="flex-1"
        >
          Start Over
        </Button>
        <Button onClick={saveQuiz} className="flex-1">
          <Save className="h-4 w-4 mr-2" />
          Save Quiz
        </Button>
      </div>
    </div>
  );
};
