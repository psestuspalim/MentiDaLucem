import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, XCircle, Clock, Calendar, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import MathText from '../quiz/MathText';

export default function AttemptDetailModal({ attempt, quizTitle, open, onClose, onDelete }) {
  if (!attempt) return null;

  const percentage = Math.round((attempt.score / attempt.total_questions) * 100);
  const avgTime = attempt.response_times?.length > 0 
    ? Math.round(attempt.response_times.reduce((a, b) => a + b, 0) / attempt.response_times.length)
    : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-xl">{quizTitle}</DialogTitle>
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                {format(new Date(attempt.completed_at || attempt.created_date), 'dd/MM/yyyy HH:mm')}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`text-sm ${
                percentage >= 70 ? 'bg-green-100 text-green-800' :
                percentage >= 50 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {attempt.score}/{attempt.total_questions} ({percentage}%)
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(attempt.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] p-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{attempt.score}</div>
              <div className="text-xs text-green-700">Correctas</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-600">{attempt.wrong_questions?.length || 0}</div>
              <div className="text-xs text-red-700">Incorrectas</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{attempt.answered_questions || attempt.total_questions}</div>
              <div className="text-xs text-blue-700">Respondidas</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-purple-600">{avgTime ? `${avgTime}s` : '-'}</div>
              <div className="text-xs text-purple-700">Tiempo prom.</div>
            </div>
          </div>

          {/* Wrong Questions */}
          {attempt.wrong_questions?.length > 0 && (
            <div>
              <h3 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                Preguntas Incorrectas ({attempt.wrong_questions.length})
              </h3>
              <div className="space-y-4">
                {attempt.wrong_questions.map((wq, idx) => (
                  <div key={idx} className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="font-medium text-gray-900 mb-3">
                      <span className="text-red-600 mr-2">#{idx + 1}</span>
                      <MathText text={wq.question} />
                    </p>
                    
                    {/* All options if available */}
                    {wq.answerOptions && (
                      <div className="space-y-2 mb-3">
                        {wq.answerOptions.map((opt, optIdx) => (
                          <div
                            key={optIdx}
                            className={`flex items-start gap-2 p-2 rounded-lg text-sm ${
                              opt.isCorrect
                                ? 'bg-green-100 border border-green-300'
                                : opt.text === wq.selected_answer
                                ? 'bg-red-100 border border-red-300'
                                : 'bg-white border border-gray-200'
                            }`}
                          >
                            {opt.isCorrect ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                            ) : opt.text === wq.selected_answer ? (
                              <XCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border-2 border-gray-300 mt-0.5 shrink-0" />
                            )}
                            <span className={opt.isCorrect ? 'text-green-800' : opt.text === wq.selected_answer ? 'text-red-800' : 'text-gray-700'}>
                              <MathText text={opt.text} />
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Fallback if no options */}
                    {!wq.answerOptions && (
                      <div className="space-y-2 mb-3">
                        <div className="flex items-start gap-2 p-2 rounded-lg bg-red-100 border border-red-300 text-sm">
                          <XCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                          <span className="text-red-800"><MathText text={wq.selected_answer} /></span>
                        </div>
                        <div className="flex items-start gap-2 p-2 rounded-lg bg-green-100 border border-green-300 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                          <span className="text-green-800"><MathText text={wq.correct_answer} /></span>
                        </div>
                      </div>
                    )}

                    {/* Rationale */}
                    {wq.answerOptions?.find(o => o.isCorrect)?.rationale && (
                      <div className="bg-white rounded-lg p-3 text-sm text-gray-600 border">
                        <span className="font-medium text-gray-700">Explicación: </span>
                        <MathText text={wq.answerOptions.find(o => o.isCorrect).rationale} />
                      </div>
                    )}

                    {/* Response time */}
                    {wq.response_time && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {wq.response_time}s
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Marked questions */}
          {attempt.marked_questions?.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-amber-700 mb-3">
                📑 Preguntas Marcadas ({attempt.marked_questions.length})
              </h3>
              <div className="space-y-3">
                {attempt.marked_questions.map((mq, idx) => (
                  <div key={idx} className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-sm text-gray-800">
                      <MathText text={mq.question} />
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No wrong questions */}
          {(!attempt.wrong_questions || attempt.wrong_questions.length === 0) && (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-green-700 font-medium">
                {attempt.score === attempt.total_questions 
                  ? '¡Puntaje perfecto! Todas las respuestas fueron correctas.'
                  : 'No hay registro de preguntas incorrectas para este intento.'}
              </p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}