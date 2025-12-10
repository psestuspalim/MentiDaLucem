import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function QuizTimeStats({ attempts = [], quizzes = [] }) {
  const stats = useMemo(() => {
    // Agrupar por quiz y calcular tiempos promedio
    const quizTimeMap = {};
    
    attempts.forEach(attempt => {
      if (!attempt.response_times?.length) return;
      
      const quizId = attempt.quiz_id;
      const avgTime = attempt.response_times.reduce((a, b) => a + b, 0) / attempt.response_times.length;
      const score = attempt.total_questions > 0 
        ? (attempt.score / attempt.total_questions) * 100 
        : 0;
      
      if (!quizTimeMap[quizId]) {
        const quiz = quizzes.find(q => q.id === quizId);
        quizTimeMap[quizId] = {
          quizId,
          title: quiz?.title || 'Quiz eliminado',
          times: [],
          scores: []
        };
      }
      
      quizTimeMap[quizId].times.push(avgTime);
      quizTimeMap[quizId].scores.push(score);
    });

    // Calcular promedios y tendencias
    const quizStats = Object.values(quizTimeMap)
      .filter(q => q.times.length > 0)
      .map(q => {
        const avgTime = q.times.reduce((a, b) => a + b, 0) / q.times.length;
        const avgScore = q.scores.reduce((a, b) => a + b, 0) / q.scores.length;
        
        // Tendencia: comparar primera mitad vs segunda mitad
        const mid = Math.floor(q.times.length / 2);
        const firstHalf = q.times.slice(0, mid);
        const secondHalf = q.times.slice(mid);
        
        let trend = 'stable';
        if (firstHalf.length && secondHalf.length) {
          const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
          const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
          const diff = ((secondAvg - firstAvg) / firstAvg) * 100;
          
          if (diff < -15) trend = 'faster';
          else if (diff > 15) trend = 'slower';
        }
        
        return {
          ...q,
          avgTime: Math.round(avgTime),
          avgScore: Math.round(avgScore),
          trend,
          attemptCount: q.times.length
        };
      })
      .sort((a, b) => b.attemptCount - a.attemptCount)
      .slice(0, 10);

    // Estadísticas globales
    const allTimes = attempts
      .filter(a => a.response_times?.length)
      .flatMap(a => a.response_times);
    
    const globalAvg = allTimes.length > 0 
      ? allTimes.reduce((a, b) => a + b, 0) / allTimes.length 
      : 0;

    return { quizStats, globalAvg };
  }, [attempts, quizzes]);

  if (!stats.quizStats.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No hay datos de tiempo disponibles</p>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'faster': return <TrendingDown className="w-4 h-4 text-green-600" />;
      case 'slower': return <TrendingUp className="w-4 h-4 text-red-600" />;
      default: return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTrendText = (trend) => {
    switch (trend) {
      case 'faster': return 'Más rápido';
      case 'slower': return 'Más lento';
      default: return 'Estable';
    }
  };

  const getBarColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            Tiempo Promedio por Cuestionario
          </CardTitle>
          <Badge variant="outline" className="bg-indigo-50">
            Promedio global: {stats.globalAvg.toFixed(1)}s
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.quizStats} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                type="number" 
                domain={[0, 'auto']}
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `${v}s`}
              />
              <YAxis 
                type="category" 
                dataKey="title"
                width={120}
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => v.length > 15 ? v.substring(0, 15) + '...' : v}
              />
              <Tooltip
                formatter={(value, name, props) => {
                  if (name === 'avgTime') return [`${value}s`, 'Tiempo prom.'];
                  return [value, name];
                }}
                labelFormatter={(label) => label}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="avgTime" radius={[0, 4, 4, 0]}>
                {stats.quizStats.map((entry, index) => (
                  <Cell key={index} fill={getBarColor(entry.avgScore)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Lista detallada */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {stats.quizStats.map((quiz, idx) => (
            <div 
              key={idx}
              className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{quiz.title}</p>
                <p className="text-xs text-gray-500">{quiz.attemptCount} intentos</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold">{quiz.avgTime}s</p>
                  <p className="text-xs text-gray-500">{quiz.avgScore}% acierto</p>
                </div>
                <div className="flex items-center gap-1" title={getTrendText(quiz.trend)}>
                  {getTrendIcon(quiz.trend)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}