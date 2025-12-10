import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, Target, Clock, TrendingUp, BookOpen, 
  CheckCircle2, XCircle, Flame, Award, Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function StudentDashboard({ analytics, attempts = [], subjects = [] }) {
  if (!analytics) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Sin datos disponibles</p>
        </CardContent>
      </Card>
    );
  }

  // Calcular estadísticas adicionales
  const recentAttempts = attempts.slice(0, 5);
  const perfectScores = attempts.filter(a => a.score === a.total_questions).length;
  const improvingTrend = analytics.last30Days?.length >= 2 
    ? analytics.last30Days[analytics.last30Days.length - 1]?.score > analytics.last30Days[0]?.score
    : false;

  // Calcular racha de estudio
  const getDayStreak = () => {
    if (!attempts.length) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dates = attempts
      .map(a => {
        const d = new Date(a.completed_at || a.created_date);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => b - a);
    
    let streak = 0;
    let currentDate = today.getTime();
    
    for (const date of dates) {
      const diff = (currentDate - date) / (1000 * 60 * 60 * 24);
      if (diff <= 1) {
        streak++;
        currentDate = date;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const streak = getDayStreak();
  const avgTimePerQuestion = attempts
    .filter(a => a.response_times?.length)
    .flatMap(a => a.response_times)
    .reduce((acc, t, _, arr) => acc + t / arr.length, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Tarjetas principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 opacity-80" />
              <Badge className="bg-white/20 text-white">Principal</Badge>
            </div>
            <p className="text-3xl font-bold">{Math.round(analytics.averageScore)}%</p>
            <p className="text-sm opacity-80">Precisión general</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="w-8 h-8 opacity-80" />
            </div>
            <p className="text-3xl font-bold">{analytics.totalCorrect}</p>
            <p className="text-sm opacity-80">Respuestas correctas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Flame className="w-8 h-8 opacity-80" />
              {streak >= 3 && <Badge className="bg-white/20 text-white">🔥</Badge>}
            </div>
            <p className="text-3xl font-bold">{streak}</p>
            <p className="text-sm opacity-80">Días de racha</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Trophy className="w-8 h-8 opacity-80" />
            </div>
            <p className="text-3xl font-bold">{perfectScores}</p>
            <p className="text-sm opacity-80">Puntajes perfectos</p>
          </CardContent>
        </Card>
      </div>

      {/* Estadísticas detalladas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resumen de actividad */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Resumen de Actividad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{analytics.totalAttempts}</p>
                <p className="text-xs text-gray-500">Cuestionarios</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{analytics.totalQuestions}</p>
                <p className="text-xs text-gray-500">Preguntas</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{analytics.subjectStats?.length || 0}</p>
                <p className="text-xs text-gray-500">Materias</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{avgTimePerQuestion.toFixed(1)}s</p>
                <p className="text-xs text-gray-500">Tiempo prom.</p>
              </div>
            </div>

            {/* Barra de progreso correctas/incorrectas */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> {analytics.totalCorrect} correctas
                </span>
                <span className="text-red-600 flex items-center gap-1">
                  <XCircle className="w-4 h-4" /> {analytics.totalQuestions - analytics.totalCorrect} incorrectas
                </span>
              </div>
              <div className="h-3 bg-red-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${analytics.averageScore}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actividad reciente */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {recentAttempts.map((attempt, idx) => {
                const percentage = attempt.total_questions > 0 
                  ? Math.round((attempt.score / attempt.total_questions) * 100) 
                  : 0;
                
                return (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {attempt.quiz_title || 'Cuestionario'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(attempt.completed_at || attempt.created_date), "d MMM, HH:mm", { locale: es })}
                      </p>
                    </div>
                    <Badge className={`ml-2 ${
                      percentage >= 80 ? 'bg-green-100 text-green-700' :
                      percentage >= 60 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {attempt.score}/{attempt.total_questions}
                    </Badge>
                  </div>
                );
              })}
              
              {recentAttempts.length === 0 && (
                <p className="text-center text-gray-500 py-4">Sin actividad reciente</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rendimiento por materia (mini) */}
      {analytics.subjectStats?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              Rendimiento por Materia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {analytics.subjectStats.slice(0, 6).map((subject, idx) => (
                <div key={idx} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900 truncate flex-1">
                      {subject.name}
                    </p>
                    <Badge variant="outline" className={`ml-2 text-xs ${
                      subject.accuracy >= 80 ? 'bg-green-50 text-green-700' :
                      subject.accuracy >= 60 ? 'bg-amber-50 text-amber-700' :
                      'bg-red-50 text-red-700'
                    }`}>
                      {Math.round(subject.accuracy)}%
                    </Badge>
                  </div>
                  <Progress value={subject.accuracy} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">
                    {subject.correct}/{subject.totalQuestions} correctas • {subject.attempts} intentos
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}