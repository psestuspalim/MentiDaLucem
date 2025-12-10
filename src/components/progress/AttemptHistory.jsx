import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  History, CheckCircle2, XCircle, Clock, Trophy, 
  ChevronDown, ChevronUp, Calendar, Target
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AttemptHistory({ attempts, quizzes, subjects }) {
  const [expandedAttempt, setExpandedAttempt] = useState(null);
  const [filter, setFilter] = useState('all'); // all, completed, partial

  const getQuiz = (quizId) => quizzes.find(q => q.id === quizId);
  const getSubject = (subjectId) => subjects.find(s => s.id === subjectId);

  const filteredAttempts = attempts.filter(a => {
    if (filter === 'completed') return a.is_completed;
    if (filter === 'partial') return !a.is_completed;
    return true;
  });

  const getScoreBadge = (score, total) => {
    const percentage = total > 0 ? (score / total) * 100 : 0;
    if (percentage === 100) return { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Trophy, label: 'Perfecto' };
    if (percentage >= 80) return { color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle2, label: 'Excelente' };
    if (percentage >= 60) return { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: Target, label: 'Bueno' };
    if (percentage >= 40) return { color: 'bg-orange-100 text-orange-800 border-orange-300', icon: Clock, label: 'Regular' };
    return { color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle, label: 'Mejorable' };
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            Historial de Intentos ({filteredAttempts.length})
          </CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              className="text-xs"
            >
              Todos
            </Button>
            <Button
              size="sm"
              variant={filter === 'completed' ? 'default' : 'outline'}
              onClick={() => setFilter('completed')}
              className="text-xs"
            >
              Completados
            </Button>
            <Button
              size="sm"
              variant={filter === 'partial' ? 'default' : 'outline'}
              onClick={() => setFilter('partial')}
              className="text-xs"
            >
              Parciales
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-3">
            {filteredAttempts.map((attempt) => {
              const quiz = getQuiz(attempt.quiz_id);
              const subject = getSubject(attempt.subject_id);
              const percentage = attempt.total_questions > 0 
                ? Math.round((attempt.score / attempt.total_questions) * 100) 
                : 0;
              const scoreBadge = getScoreBadge(attempt.score, attempt.total_questions);
              const ScoreIcon = scoreBadge.icon;
              const isExpanded = expandedAttempt === attempt.id;

              return (
                <div 
                  key={attempt.id}
                  className="border rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow"
                >
                  <div 
                    className="p-4 cursor-pointer"
                    onClick={() => setExpandedAttempt(isExpanded ? null : attempt.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="font-medium text-gray-900 truncate">
                            {quiz?.title || 'Quiz eliminado'}
                          </h4>
                          {!attempt.is_completed && (
                            <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                              Parcial
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                          {subject && (
                            <span 
                              className="px-2 py-0.5 rounded-full text-white"
                              style={{ backgroundColor: subject.color || '#6366f1' }}
                            >
                              {subject.name}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(attempt.completed_at || attempt.created_date), "d MMM yyyy, HH:mm", { locale: es })}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <span className="text-xl font-bold text-gray-900">{attempt.score}</span>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-500">{attempt.total_questions}</span>
                          </div>
                          <Badge className={`${scoreBadge.color} border text-xs`}>
                            <ScoreIcon className="w-3 h-3 mr-1" />
                            {percentage}%
                          </Badge>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t bg-gray-50 p-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                        <div className="text-center p-2 bg-white rounded-lg">
                          <p className="text-2xl font-bold text-green-600">{attempt.score}</p>
                          <p className="text-xs text-gray-500">Correctas</p>
                        </div>
                        <div className="text-center p-2 bg-white rounded-lg">
                          <p className="text-2xl font-bold text-red-600">
                            {attempt.wrong_questions?.length || 0}
                          </p>
                          <p className="text-xs text-gray-500">Incorrectas</p>
                        </div>
                        <div className="text-center p-2 bg-white rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">
                            {attempt.answered_questions || attempt.total_questions}
                          </p>
                          <p className="text-xs text-gray-500">Respondidas</p>
                        </div>
                        <div className="text-center p-2 bg-white rounded-lg">
                          <p className="text-2xl font-bold text-indigo-600">{percentage}%</p>
                          <p className="text-xs text-gray-500">Precisión</p>
                        </div>
                      </div>

                      {attempt.wrong_questions?.length > 0 && (
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2 text-sm">
                            Preguntas incorrectas:
                          </h5>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {attempt.wrong_questions.slice(0, 5).map((wq, idx) => (
                              <div key={idx} className="bg-white p-2 rounded border text-xs">
                                <p className="text-gray-800 font-medium mb-1 line-clamp-2">
                                  {wq.question}
                                </p>
                                <div className="flex gap-2 text-xs">
                                  <span className="text-red-600">
                                    Tu respuesta: {wq.selected_answer?.substring(0, 30)}...
                                  </span>
                                </div>
                              </div>
                            ))}
                            {attempt.wrong_questions.length > 5 && (
                              <p className="text-xs text-gray-500 text-center">
                                +{attempt.wrong_questions.length - 5} más
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredAttempts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No hay intentos en esta categoría
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}