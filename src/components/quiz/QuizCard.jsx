import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, PlayCircle, Trash2, CheckCircle2, XCircle, Clock, History, Bookmark, Pencil, EyeOff, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function QuizCard({ quiz, attempts = [], onStart, onDelete, onEdit, isAdmin }) {
  const [showDialog, setShowDialog] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [questionCount, setQuestionCount] = useState(quiz.total_questions);
  const [selectedDeck, setSelectedDeck] = useState('all');
  
  // Calcular estadísticas
  const quizAttempts = attempts.filter(a => a.quiz_id === quiz.id);
  
  // Recopilar preguntas únicas correctas e incorrectas
  const correctQuestions = new Set();
  const wrongQuestions = new Map();
  
  quizAttempts.forEach(attempt => {
    // Agregar preguntas incorrectas
    attempt.wrong_questions?.forEach(wq => {
      wrongQuestions.set(wq.question, wq);
    });
  });
  
  // Las preguntas del quiz que no están en wrongQuestions y fueron respondidas son correctas
  // Usamos la info de los intentos para determinar cuáles se respondieron correctamente
  quiz.questions?.forEach(q => {
    if (!wrongQuestions.has(q.question)) {
      // Verificar si esta pregunta fue respondida en algún intento
      // Si hay intentos y la pregunta no está en las incorrectas, asumimos que se respondió bien
    }
  });
  
  // Contar preguntas respondidas (correctas + incorrectas únicas)
  const totalWrong = wrongQuestions.size;
  
  // Calcular correctas: preguntas del quiz que no están en wrongQuestions pero fueron contestadas
  // Necesitamos trackear qué preguntas se han contestado
  const allAnsweredQuestions = new Set();
  quizAttempts.forEach(attempt => {
    attempt.wrong_questions?.forEach(wq => allAnsweredQuestions.add(wq.question));
  });
  
  // Las correctas son las que están en el quiz, no están en wrong, pero sí fueron parte de algún intento
  // Aproximación: total respondidas - incorrectas únicas
  const totalQuestionsAnswered = allAnsweredQuestions.size;
  
  // Para saber las correctas únicas, necesitamos ver qué preguntas del quiz original 
  // fueron contestadas y no están en wrongQuestions
  quiz.questions?.forEach(q => {
    // Si la pregunta fue respondida en algún intento y no está en wrong, es correcta
    const wasAnsweredCorrectly = quizAttempts.some(attempt => {
      // Si el intento incluyó esta pregunta y no está en sus wrong_questions
      const isInWrong = attempt.wrong_questions?.some(wq => wq.question === q.question);
      // Asumimos que fue parte del intento si el intento tiene preguntas
      return !isInWrong && attempt.answered_questions > 0;
    });
    if (wasAnsweredCorrectly && !wrongQuestions.has(q.question)) {
      correctQuestions.add(q.question);
    }
  });
  
  const totalCorrect = correctQuestions.size;
  const totalAnswered = totalCorrect + totalWrong;
  const totalRemaining = Math.max(0, quiz.total_questions - totalAnswered);
  
  // Contar preguntas marcadas
  const allMarkedQuestions = quizAttempts.flatMap(a => a.marked_questions || []);
  const uniqueMarked = new Map();
  allMarkedQuestions.forEach(mq => {
    uniqueMarked.set(mq.question, mq);
  });
  const totalMarked = uniqueMarked.size;
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border border-gray-200">
      <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 sm:mb-2 flex-wrap">
                                  <CardTitle className="text-sm sm:text-lg font-semibold text-gray-900 break-words">
                                    {quiz.title}
                                  </CardTitle>
                                  {quiz.is_hidden && (
                                    <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs">
                                      <EyeOff className="w-3 h-3 mr-1" />
                                      Oculto
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs sm:text-sm text-gray-500 line-clamp-2">{quiz.description}</p>
                              </div>
                              {isAdmin && (
                                <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onEdit(quiz)}
                                    className="text-gray-400 hover:text-indigo-600 h-8 w-8"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onDelete(quiz.id)}
                                    className="text-gray-400 hover:text-red-600 h-8 w-8"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
              </CardHeader>
      
      <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{quiz.total_questions} preg.</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{format(new Date(quiz.created_date), 'dd/MM/yy')}</span>
                    </div>
                  </div>
                </div>

                {/* Estadísticas */}
                {quizAttempts.length > 0 && (
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-1.5 sm:p-2 text-center">
                      <div className="flex items-center justify-center gap-1 text-green-700">
                        <CheckCircle2 className="w-3 h-3" />
                        <span className="text-xs sm:text-sm font-semibold">{totalCorrect}</span>
                      </div>
                      <div className="text-[10px] sm:text-xs text-green-600 mt-0.5">Correctas</div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-1.5 sm:p-2 text-center">
                      <div className="flex items-center justify-center gap-1 text-red-700">
                        <XCircle className="w-3 h-3" />
                        <span className="text-xs sm:text-sm font-semibold">{totalWrong}</span>
                      </div>
                      <div className="text-[10px] sm:text-xs text-red-600 mt-0.5">Incorrectas</div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-1.5 sm:p-2 text-center">
                      <div className="flex items-center justify-center gap-1 text-gray-700">
                        <Clock className="w-3 h-3" />
                        <span className="text-xs sm:text-sm font-semibold">{totalRemaining}</span>
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-600 mt-0.5">Faltantes</div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowDialog(true)}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-xs sm:text-sm h-9 sm:h-10"
                  >
                    <PlayCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Comenzar
                  </Button>
                  {quizAttempts.length > 0 && (
                    <Button
                      onClick={() => setShowHistory(true)}
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 sm:h-10 sm:w-10"
                    >
                      <History className="w-4 h-4" />
                    </Button>
                  )}
                </div>

        {/* Dialog para configurar quiz */}
                  <Dialog open={showDialog} onOpenChange={setShowDialog}>
                    <DialogContent className="max-w-[95vw] sm:max-w-lg mx-auto">
                      <DialogHeader>
                        <DialogTitle className="text-base sm:text-lg">Configurar intento</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                        <div>
                          <Label className="text-sm">Tipo de preguntas</Label>
                          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mt-2">
                            <Button
                              variant={selectedDeck === 'all' ? 'default' : 'outline'}
                              onClick={() => setSelectedDeck('all')}
                              className="w-full text-xs sm:text-sm h-9 sm:h-10"
                            >
                              Todas
                            </Button>
                            <Button
                              variant={selectedDeck === 'remaining' ? 'default' : 'outline'}
                              onClick={() => setSelectedDeck('remaining')}
                              className="w-full text-xs sm:text-sm h-9 sm:h-10"
                              disabled={totalRemaining === 0}
                            >
                              <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              Faltantes ({totalRemaining})
                            </Button>
                            <Button
                              variant={selectedDeck === 'wrong' ? 'default' : 'outline'}
                              onClick={() => setSelectedDeck('wrong')}
                              className="w-full text-xs sm:text-sm h-9 sm:h-10"
                              disabled={totalWrong === 0}
                            >
                              <XCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              Incorrectas ({totalWrong})
                            </Button>
                            <Button
                              variant={selectedDeck === 'correct' ? 'default' : 'outline'}
                              onClick={() => setSelectedDeck('correct')}
                              className="w-full text-xs sm:text-sm h-9 sm:h-10"
                              disabled={totalCorrect === 0}
                            >
                              <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              Correctas ({totalCorrect})
                            </Button>
                            <Button
                              variant={selectedDeck === 'marked' ? 'default' : 'outline'}
                              onClick={() => setSelectedDeck('marked')}
                              className="w-full text-xs sm:text-sm h-9 sm:h-10"
                              disabled={totalMarked === 0}
                            >
                              <Bookmark className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              Marcadas ({totalMarked})
                            </Button>
                            <Button
                              variant={selectedDeck === 'review' ? 'default' : 'outline'}
                              onClick={() => setSelectedDeck('review')}
                              className="w-full text-xs sm:text-sm h-9 sm:h-10 col-span-2"
                            >
                              <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              Repasar (SRS)
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm">Número de preguntas</Label>
                          <Input
                            type="number"
                            min="1"
                            max={quiz.total_questions}
                            value={questionCount}
                            onChange={(e) => setQuestionCount(Math.min(quiz.total_questions, Math.max(1, parseInt(e.target.value) || 1)))}
                            className="h-9 sm:h-10"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Máximo: {quiz.total_questions} preguntas
                          </p>
                        </div>
                        <Button
                          onClick={() => {
                            onStart(quiz, questionCount, selectedDeck, quizAttempts);
                            setShowDialog(false);
                          }}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 h-10 sm:h-11"
                        >
                          Comenzar
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

        {/* Dialog para historial */}
                  <Dialog open={showHistory} onOpenChange={setShowHistory}>
                    <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[80vh] overflow-y-auto mx-auto">
                      <DialogHeader>
                        <DialogTitle className="text-base sm:text-lg">Historial de intentos</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-2 sm:space-y-3 mt-3 sm:mt-4">
                        {quizAttempts.map((attempt) => {
                          const percentage = attempt.total_questions > 0 
                            ? Math.round((attempt.score / attempt.total_questions) * 100) 
                            : 0;
                          const isPartial = !attempt.is_completed;

                          return (
                            <div key={attempt.id} className="border rounded-lg p-3 sm:p-4">
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                                  <span className="text-xs sm:text-sm text-gray-600">
                                    {format(new Date(attempt.completed_at || attempt.created_date), 'dd/MM/yy HH:mm')}
                                  </span>
                                  {isPartial && (
                                    <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                                      Parcial
                                    </Badge>
                                  )}
                                </div>
                                <Badge
                                  className={`text-xs ${
                                    percentage >= 70 ? 'bg-green-100 text-green-800' :
                                    percentage >= 50 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {attempt.score}/{attempt.total_questions} ({percentage}%)
                                </Badge>
                              </div>
                              {isPartial && (
                                <div className="text-xs text-gray-500">
                                  {attempt.answered_questions || 0} de {attempt.total_questions} respondidas
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </DialogContent>
                  </Dialog>
      </CardContent>
    </Card>
  );
}