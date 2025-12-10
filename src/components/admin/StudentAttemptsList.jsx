import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, Calendar, Clock, Filter } from 'lucide-react';
import { format } from 'date-fns';
import MathText from '../quiz/MathText';

export default function StudentAttemptsList({ attempts = [], quizzes = [] }) {
  const [expandedAttempt, setExpandedAttempt] = useState(null);
  const [filterType, setFilterType] = useState('all'); // all, correct, wrong
  const [selectedQuizId, setSelectedQuizId] = useState('all');

  const getQuizTitle = (quizId) => {
    const quiz = quizzes.find(q => q.id === quizId);
    return quiz?.title || 'Cuestionario eliminado';
  };

  // Agrupar intentos por quiz
  const quizOptions = useMemo(() => {
    const uniqueQuizzes = {};
    attempts.forEach(a => {
      if (!uniqueQuizzes[a.quiz_id]) {
        uniqueQuizzes[a.quiz_id] = getQuizTitle(a.quiz_id);
      }
    });
    return Object.entries(uniqueQuizzes).map(([id, title]) => ({ id, title }));
  }, [attempts, quizzes]);

  // Filtrar intentos
  const filteredAttempts = useMemo(() => {
    return attempts.filter(attempt => {
      if (selectedQuizId !== 'all' && attempt.quiz_id !== selectedQuizId) return false;
      return true;
    });
  }, [attempts, selectedQuizId]);

  // Para cada intento expandido, filtrar las preguntas según el tipo
  const getFilteredQuestions = (attempt) => {
    const quiz = quizzes.find(q => q.id === attempt.quiz_id);
    if (!quiz?.questions) return { correct: [], wrong: attempt.wrong_questions || [] };

    const wrongSet = new Set((attempt.wrong_questions || []).map(wq => wq.question));
    
    const correct = quiz.questions
      .filter(q => !wrongSet.has(q.question))
      .slice(0, attempt.score);
    
    return {
      correct,
      wrong: attempt.wrong_questions || []
    };
  };

  if (attempts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay intentos registrados
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <Select value={selectedQuizId} onValueChange={setSelectedQuizId}>
            <SelectTrigger className="w-[200px] h-9">
              <SelectValue placeholder="Todos los quizzes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los quizzes</SelectItem>
              {quizOptions.map(q => (
                <SelectItem key={q.id} value={q.id}>{q.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-1">
          <Button
            variant={filterType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('all')}
            className="h-8 text-xs"
          >
            Todas
          </Button>
          <Button
            variant={filterType === 'correct' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('correct')}
            className="h-8 text-xs text-green-600 border-green-200 hover:bg-green-50"
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Correctas
          </Button>
          <Button
            variant={filterType === 'wrong' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('wrong')}
            className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
          >
            <XCircle className="w-3 h-3 mr-1" />
            Falladas
          </Button>
        </div>
      </div>

      {/* Lista de intentos */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {filteredAttempts.map((attempt) => {
          const percentage = Math.round((attempt.score / attempt.total_questions) * 100);
          const isExpanded = expandedAttempt === attempt.id;
          const { correct, wrong } = getFilteredQuestions(attempt);
          
          const questionsToShow = filterType === 'correct' ? correct 
            : filterType === 'wrong' ? wrong 
            : [...correct.map(q => ({...q, isCorrect: true})), ...wrong.map(q => ({...q, isCorrect: false}))];

          return (
            <Card key={attempt.id} className="overflow-hidden">
              <button
                onClick={() => setExpandedAttempt(isExpanded ? null : attempt.id)}
                className="w-full p-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {getQuizTitle(attempt.quiz_id)}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(attempt.completed_at || attempt.created_date), 'dd/MM/yy HH:mm')}
                      </span>
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="w-3 h-3" />
                        {attempt.score}
                      </span>
                      <span className="flex items-center gap-1 text-red-600">
                        <XCircle className="w-3 h-3" />
                        {attempt.total_questions - attempt.score}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${
                      percentage >= 70 ? 'bg-green-100 text-green-800' :
                      percentage >= 50 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {percentage}%
                    </Badge>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>
              </button>

              {isExpanded && (
                <CardContent className="border-t bg-gray-50 p-3">
                  {questionsToShow.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No hay preguntas {filterType === 'correct' ? 'correctas' : filterType === 'wrong' ? 'incorrectas' : ''} para mostrar
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {questionsToShow.map((q, idx) => {
                        const isCorrectQuestion = q.isCorrect !== undefined ? q.isCorrect : !q.selected_answer;
                        
                        return (
                          <div 
                            key={idx} 
                            className={`rounded-lg p-3 border ${
                              isCorrectQuestion 
                                ? 'bg-green-50 border-green-200' 
                                : 'bg-red-50 border-red-200'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {isCorrectQuestion ? (
                                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">
                                  <MathText text={q.question || q.questionText} />
                                </p>
                                
                                {!isCorrectQuestion && (
                                  <div className="mt-2 space-y-1">
                                    <p className="text-xs">
                                      <span className="text-red-600 font-medium">Seleccionó:</span>{' '}
                                      <span className="text-red-700"><MathText text={q.selected_answer} /></span>
                                    </p>
                                    <p className="text-xs">
                                      <span className="text-green-600 font-medium">Correcta:</span>{' '}
                                      <span className="text-green-700"><MathText text={q.correct_answer} /></span>
                                    </p>
                                  </div>
                                )}

                                {isCorrectQuestion && q.answerOptions && (
                                  <p className="text-xs text-green-700 mt-1">
                                    <span className="font-medium">Respuesta:</span>{' '}
                                    <MathText text={q.answerOptions?.find(o => o.isCorrect)?.text || ''} />
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}