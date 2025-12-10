import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function TrendAnalysis({ last30Days, attempts }) {
  const trendData = last30Days.map((attempt, idx) => {
    const score = attempt.total_questions > 0 
      ? (attempt.score / attempt.total_questions) * 100 
      : 0;
    
    return {
      name: format(new Date(attempt.completed_at || attempt.created_date), 'dd/MM'),
      score: Math.round(score),
      correct: attempt.score,
      wrong: attempt.total_questions - attempt.score
    };
  });

  // Calcular promedio móvil
  const movingAverage = trendData.map((point, idx, arr) => {
    const window = 3;
    const start = Math.max(0, idx - window + 1);
    const slice = arr.slice(start, idx + 1);
    const avg = slice.reduce((sum, p) => sum + p.score, 0) / slice.length;
    return { ...point, promedio: Math.round(avg) };
  });

  // Agrupar por semana
  const weeklyData = React.useMemo(() => {
    const weeks = new Map();
    
    attempts.forEach(attempt => {
      const date = new Date(attempt.completed_at || attempt.created_date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = format(weekStart, 'dd/MM');
      
      if (!weeks.has(weekKey)) {
        weeks.set(weekKey, { total: 0, correct: 0, attempts: 0 });
      }
      
      const week = weeks.get(weekKey);
      week.total += attempt.total_questions;
      week.correct += attempt.score;
      week.attempts += 1;
    });
    
    return Array.from(weeks.entries()).map(([week, data]) => ({
      week,
      accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
      attempts: data.attempts
    })).slice(-8);
  }, [attempts]);

  return (
    <>
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Tendencia de Desempeño (Últimos 30 días)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={movingAverage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-3 rounded-lg shadow-lg border">
                        <p className="font-semibold mb-1">{payload[0].payload.name}</p>
                        <p className="text-indigo-600">Puntaje: {payload[0].value}%</p>
                        <p className="text-blue-600">Promedio: {payload[1]?.value}%</p>
                        <p className="text-xs text-gray-500 mt-1">
                          ✓ {payload[0].payload.correct} • ✗ {payload[0].payload.wrong}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#6366f1" 
                strokeWidth={2}
                name="Puntaje"
                dot={{ fill: '#6366f1', r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="promedio" 
                stroke="#3b82f6" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Promedio Móvil"
                dot={{ fill: '#3b82f6', r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Resumen Semanal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-3 rounded-lg shadow-lg border">
                        <p className="font-semibold mb-1">Semana {payload[0].payload.week}</p>
                        <p className="text-indigo-600">Precisión: {payload[0].value}%</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {payload[0].payload.attempts} intentos
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="accuracy" 
                stroke="#6366f1" 
                fill="#6366f1" 
                fillOpacity={0.6}
                name="Precisión %"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <p className="text-sm text-gray-500 mb-2">Mejor Racha</p>
            <p className="text-3xl font-bold text-green-600">
              {Math.max(...trendData.map(d => d.score), 0)}%
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <p className="text-sm text-gray-500 mb-2">Promedio Mensual</p>
            <p className="text-3xl font-bold text-indigo-600">
              {trendData.length > 0 
                ? Math.round(trendData.reduce((sum, d) => sum + d.score, 0) / trendData.length)
                : 0}%
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <p className="text-sm text-gray-500 mb-2">Tendencia</p>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold text-blue-600">
                {trendData.length >= 2
                  ? trendData[trendData.length - 1].score > trendData[0].score
                    ? '↑'
                    : trendData[trendData.length - 1].score < trendData[0].score
                    ? '↓'
                    : '→'
                  : '→'}
              </p>
              <p className="text-sm text-gray-600">
                {trendData.length >= 2
                  ? Math.abs(trendData[trendData.length - 1].score - trendData[0].score) + '%'
                  : 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}