import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, Star, CheckCircle2, Circle, 
  Sparkles, Medal, Crown
} from 'lucide-react';

export default function QuizCompletionBadges({ quizzes, attempts, subjects }) {
  // Calcular estado de completado por quiz
  const quizCompletionStatus = quizzes.map(quiz => {
    const quizAttempts = attempts.filter(a => a.quiz_id === quiz.id && a.is_completed);
    const bestAttempt = quizAttempts.reduce((best, current) => {
      const currentScore = current.total_questions > 0 
        ? (current.score / current.total_questions) * 100 
        : 0;
      const bestScore = best?.total_questions > 0 
        ? (best.score / best.total_questions) * 100 
        : 0;
      return currentScore > bestScore ? current : best;
    }, null);

    const bestScore = bestAttempt?.total_questions > 0 
      ? (bestAttempt.score / bestAttempt.total_questions) * 100 
      : 0;

    const subject = subjects.find(s => s.id === quiz.subject_id);

    return {
      ...quiz,
      subject,
      isCompleted: quizAttempts.length > 0,
      attemptCount: quizAttempts.length,
      bestScore: Math.round(bestScore),
      isPerfect: bestScore === 100,
      badge: getBadgeForScore(bestScore)
    };
  });

  function getBadgeForScore(score) {
    if (score === 100) return { icon: Crown, color: 'text-yellow-500', bg: 'bg-yellow-100', label: 'Oro' };
    if (score >= 90) return { icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-100', label: 'Plata' };
    if (score >= 80) return { icon: Medal, color: 'text-orange-500', bg: 'bg-orange-100', label: 'Bronce' };
    if (score >= 70) return { icon: Star, color: 'text-blue-500', bg: 'bg-blue-100', label: 'Aprobado' };
    if (score > 0) return { icon: CheckCircle2, color: 'text-gray-500', bg: 'bg-gray-100', label: 'Intentado' };
    return { icon: Circle, color: 'text-gray-300', bg: 'bg-gray-50', label: 'Sin intentar' };
  }

  // Estadísticas de completado
  const completedQuizzes = quizCompletionStatus.filter(q => q.isCompleted).length;
  const perfectQuizzes = quizCompletionStatus.filter(q => q.isPerfect).length;
  const completionPercentage = quizzes.length > 0 
    ? Math.round((completedQuizzes / quizzes.length) * 100) 
    : 0;

  // Agrupar por materia
  const groupedBySubject = subjects.map(subject => {
    const subjectQuizzes = quizCompletionStatus.filter(q => q.subject_id === subject.id);
    const completed = subjectQuizzes.filter(q => q.isCompleted).length;
    const total = subjectQuizzes.length;
    const avgScore = subjectQuizzes.filter(q => q.isCompleted).length > 0
      ? subjectQuizzes.filter(q => q.isCompleted).reduce((sum, q) => sum + q.bestScore, 0) / completed
      : 0;

    return {
      ...subject,
      quizzes: subjectQuizzes,
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      avgScore: Math.round(avgScore)
    };
  }).filter(s => s.total > 0);

  return (
    <div className="space-y-6">
      {/* Resumen general */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
          <CardContent className="p-6 text-center">
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-80" />
            <p className="text-4xl font-bold">{completedQuizzes}/{quizzes.length}</p>
            <p className="text-sm opacity-80">Quizzes Completados</p>
            <Progress value={completionPercentage} className="mt-3 bg-white/20" />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-400 to-orange-500 text-white">
          <CardContent className="p-6 text-center">
            <Crown className="w-8 h-8 mx-auto mb-2 opacity-80" />
            <p className="text-4xl font-bold">{perfectQuizzes}</p>
            <p className="text-sm opacity-80">Puntajes Perfectos</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-teal-600 text-white">
          <CardContent className="p-6 text-center">
            <Trophy className="w-8 h-8 mx-auto mb-2 opacity-80" />
            <p className="text-4xl font-bold">{completionPercentage}%</p>
            <p className="text-sm opacity-80">Progreso Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Progreso por materia */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Medal className="w-5 h-5 text-indigo-600" />
            Progreso por Materia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {groupedBySubject.map(subject => (
              <div key={subject.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: subject.color || '#6366f1' }}
                    />
                    <span className="font-medium text-gray-900">{subject.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {subject.completed}/{subject.total} quizzes
                    </Badge>
                    {subject.avgScore > 0 && (
                      <Badge className="bg-indigo-100 text-indigo-800 text-xs">
                        Promedio: {subject.avgScore}%
                      </Badge>
                    )}
                  </div>
                </div>
                
                <Progress value={subject.percentage} className="h-2 mb-3" />
                
                <div className="flex flex-wrap gap-2">
                  {subject.quizzes.map(quiz => {
                    const BadgeIcon = quiz.badge.icon;
                    return (
                      <div
                        key={quiz.id}
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${quiz.badge.bg}`}
                        title={`${quiz.title} - ${quiz.bestScore}%`}
                      >
                        <BadgeIcon className={`w-3 h-3 ${quiz.badge.color}`} />
                        <span className={quiz.isCompleted ? 'text-gray-700' : 'text-gray-400'}>
                          {quiz.title.length > 20 ? quiz.title.substring(0, 20) + '...' : quiz.title}
                        </span>
                        {quiz.isCompleted && (
                          <span className="font-medium">{quiz.bestScore}%</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}