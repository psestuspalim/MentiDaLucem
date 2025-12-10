import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import { Clock, TrendingUp, Brain, Zap } from 'lucide-react';
import moment from 'moment';

export default function TimeVsPerformance({ attempts, sessionLogs = [] }) {
  const analysis = useMemo(() => {
    if (!attempts || attempts.length === 0) return null;

    // Agrupar intentos por día
    const attemptsByDay = {};
    attempts.forEach(attempt => {
      const day = moment(attempt.created_date).format('YYYY-MM-DD');
      if (!attemptsByDay[day]) {
        attemptsByDay[day] = {
          attempts: [],
          totalQuestions: 0,
          totalCorrect: 0
        };
      }
      attemptsByDay[day].attempts.push(attempt);
      attemptsByDay[day].totalQuestions += attempt.total_questions || 0;
      attemptsByDay[day].totalCorrect += attempt.score || 0;
    });

    // Calcular datos para el gráfico
    const chartData = Object.entries(attemptsByDay)
      .map(([date, data]) => {
        const avgScore = data.totalQuestions > 0 
          ? Math.round((data.totalCorrect / data.totalQuestions) * 100) 
          : 0;
        
        // Estimar tiempo de estudio (promedio 30 seg por pregunta)
        const estimatedMinutes = Math.round((data.totalQuestions * 0.5));
        
        return {
          date,
          displayDate: moment(date).format('DD/MM'),
          avgScore,
          questionsAnswered: data.totalQuestions,
          attemptsCount: data.attempts.length,
          studyMinutes: estimatedMinutes
        };
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-14); // Últimos 14 días

    // Calcular estadísticas generales
    const totalStudyMinutes = chartData.reduce((sum, d) => sum + d.studyMinutes, 0);
    const totalQuestions = chartData.reduce((sum, d) => sum + d.questionsAnswered, 0);
    const avgScoreOverall = totalQuestions > 0 
      ? Math.round(chartData.reduce((sum, d) => sum + (d.avgScore * d.questionsAnswered), 0) / totalQuestions)
      : 0;

    // Calcular tendencia (mejora o empeora)
    let trend = 0;
    if (chartData.length >= 3) {
      const firstHalf = chartData.slice(0, Math.floor(chartData.length / 2));
      const secondHalf = chartData.slice(Math.floor(chartData.length / 2));
      
      const firstAvg = firstHalf.reduce((s, d) => s + d.avgScore, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((s, d) => s + d.avgScore, 0) / secondHalf.length;
      
      trend = Math.round(secondAvg - firstAvg);
    }

    // Calcular correlación tiempo-rendimiento
    const correlation = chartData.length >= 3 ? calculateCorrelation(chartData) : null;

    return {
      chartData,
      totalStudyMinutes,
      totalQuestions,
      avgScoreOverall,
      trend,
      correlation,
      activeDays: chartData.length
    };
  }, [attempts]);

  if (!analysis || analysis.chartData.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          No hay suficientes datos para el análisis
        </CardContent>
      </Card>
    );
  }

  const { chartData, totalStudyMinutes, totalQuestions, avgScoreOverall, trend, correlation, activeDays } = analysis;

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">Tiempo total</span>
            </div>
            <p className="text-2xl font-bold text-blue-800">
              {totalStudyMinutes >= 60 
                ? `${Math.floor(totalStudyMinutes / 60)}h ${totalStudyMinutes % 60}m`
                : `${totalStudyMinutes}m`
              }
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <Brain className="w-4 h-4" />
              <span className="text-xs font-medium">Preguntas</span>
            </div>
            <p className="text-2xl font-bold text-green-800">{totalQuestions}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-purple-600 mb-1">
              <Zap className="w-4 h-4" />
              <span className="text-xs font-medium">Promedio</span>
            </div>
            <p className="text-2xl font-bold text-purple-800">{avgScoreOverall}%</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-600 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium">Tendencia</span>
            </div>
            <p className={`text-2xl font-bold ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-amber-800'}`}>
              {trend > 0 ? '+' : ''}{trend}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            Evolución: Tiempo de estudio vs Rendimiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="displayDate" 
                  tick={{ fontSize: 11 }} 
                  tickLine={false}
                />
                <YAxis 
                  yAxisId="left"
                  tick={{ fontSize: 11 }} 
                  tickLine={false}
                  domain={[0, 100]}
                  label={{ value: '%', position: 'insideTopLeft', fontSize: 10 }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11 }} 
                  tickLine={false}
                  label={{ value: 'min', position: 'insideTopRight', fontSize: 10 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: '1px solid #e5e7eb',
                    fontSize: '12px'
                  }}
                  formatter={(value, name) => [
                    name === 'avgScore' ? `${value}%` : `${value} min`,
                    name === 'avgScore' ? 'Rendimiento' : 'Tiempo'
                  ]}
                />
                <Legend 
                  formatter={(value) => value === 'avgScore' ? 'Rendimiento' : 'Tiempo de estudio'}
                  wrapperStyle={{ fontSize: '12px' }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="avgScore"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#colorScore)"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="studyMinutes"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#colorTime)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Insights */}
          {correlation !== null && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-medium">📊 Análisis: </span>
                {correlation > 0.5 ? (
                  <span className="text-green-600">
                    Existe una correlación positiva fuerte entre tu tiempo de estudio y tu rendimiento. ¡Sigue así!
                  </span>
                ) : correlation > 0.2 ? (
                  <span className="text-blue-600">
                    Tu rendimiento mejora moderadamente con más tiempo de estudio.
                  </span>
                ) : correlation > -0.2 ? (
                  <span className="text-amber-600">
                    No hay una correlación clara. Intenta enfocarte en calidad sobre cantidad.
                  </span>
                ) : (
                  <span className="text-purple-600">
                    Parece que estudiar más no mejora directamente tu rendimiento. Considera cambiar tu método de estudio.
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Basado en {activeDays} días de actividad
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Función para calcular correlación de Pearson
function calculateCorrelation(data) {
  const n = data.length;
  if (n < 3) return null;

  const x = data.map(d => d.studyMinutes);
  const y = data.map(d => d.avgScore);

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumX2 = x.reduce((a, b) => a + b * b, 0);
  const sumY2 = y.reduce((a, b) => a + b * b, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return 0;
  return numerator / denominator;
}