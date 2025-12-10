import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Zap, Target, TrendingUp, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Cell, ReferenceLine } from 'recharts';

export default function SpeedAnalysis({ attempts = [] }) {
  const analysis = useMemo(() => {
    // Necesitamos intentos con datos de tiempo
    const attemptsWithTime = attempts.filter(a => a.response_times?.length > 0);
    
    if (attemptsWithTime.length === 0) {
      return null;
    }

    // Agrupar respuestas por tiempo y resultado
    const responseData = [];
    attemptsWithTime.forEach(attempt => {
      attempt.response_times?.forEach((time, idx) => {
        if (time && time > 0) {
          responseData.push({
            time: Math.min(time, 120), // Cap at 120 seconds
            correct: idx < attempt.score,
            questionIndex: idx
          });
        }
      });
    });

    if (responseData.length < 10) return null;

    // Calcular estadísticas por rangos de tiempo
    const timeRanges = [
      { min: 0, max: 5, label: '0-5s' },
      { min: 5, max: 10, label: '5-10s' },
      { min: 10, max: 20, label: '10-20s' },
      { min: 20, max: 30, label: '20-30s' },
      { min: 30, max: 60, label: '30-60s' },
      { min: 60, max: 120, label: '60s+' }
    ];

    const rangeStats = timeRanges.map(range => {
      const inRange = responseData.filter(r => r.time >= range.min && r.time < range.max);
      const correct = inRange.filter(r => r.correct).length;
      const total = inRange.length;
      return {
        ...range,
        total,
        correct,
        accuracy: total > 0 ? (correct / total) * 100 : 0
      };
    }).filter(r => r.total > 0);

    // Encontrar rango óptimo
    const optimalRange = rangeStats.reduce((best, current) => {
      // Preferir rangos con al menos 5 respuestas y mejor accuracy
      if (current.total >= 5 && current.accuracy > (best?.accuracy || 0)) {
        return current;
      }
      return best;
    }, null);

    // Calcular tiempos promedio
    const correctTimes = responseData.filter(r => r.correct).map(r => r.time);
    const incorrectTimes = responseData.filter(r => !r.correct).map(r => r.time);
    
    const avgCorrectTime = correctTimes.length > 0 
      ? correctTimes.reduce((a, b) => a + b, 0) / correctTimes.length 
      : 0;
    const avgIncorrectTime = incorrectTimes.length > 0 
      ? incorrectTimes.reduce((a, b) => a + b, 0) / incorrectTimes.length 
      : 0;

    // Detectar patrones problemáticos
    const tooFast = responseData.filter(r => r.time < 5 && !r.correct).length;
    const tooSlow = responseData.filter(r => r.time > 45 && !r.correct).length;
    const totalIncorrect = responseData.filter(r => !r.correct).length;

    const rushingProblem = totalIncorrect > 0 && (tooFast / totalIncorrect) > 0.3;
    const overthinkingProblem = totalIncorrect > 0 && (tooSlow / totalIncorrect) > 0.3;

    // Datos para el gráfico de dispersión
    const scatterData = responseData.slice(-100).map((r, i) => ({
      x: r.time,
      y: r.correct ? 1 : 0,
      correct: r.correct
    }));

    return {
      rangeStats,
      optimalRange,
      avgCorrectTime,
      avgIncorrectTime,
      rushingProblem,
      overthinkingProblem,
      totalResponses: responseData.length,
      totalCorrect: responseData.filter(r => r.correct).length,
      scatterData
    };
  }, [attempts]);

  if (!analysis) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin datos suficientes</h3>
          <p className="text-gray-500 text-sm">
            Necesitas completar más cuestionarios para analizar tu velocidad óptima.
            <br />Los datos de tiempo se empezarán a guardar en tus próximos intentos.
          </p>
        </CardContent>
      </Card>
    );
  }

  const overallAccuracy = (analysis.totalCorrect / analysis.totalResponses) * 100;

  return (
    <div className="space-y-6">
      {/* Resumen principal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Target className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-indigo-600 font-medium">Tu tiempo óptimo</p>
                <p className="text-2xl font-bold text-indigo-900">
                  {analysis.optimalRange ? analysis.optimalRange.label : 'N/A'}
                </p>
                {analysis.optimalRange && (
                  <p className="text-xs text-indigo-600">
                    {analysis.optimalRange.accuracy.toFixed(0)}% acierto
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-green-600 font-medium">Tiempo promedio (correctas)</p>
                <p className="text-2xl font-bold text-green-900">
                  {analysis.avgCorrectTime.toFixed(1)}s
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-red-600 font-medium">Tiempo promedio (incorrectas)</p>
                <p className="text-2xl font-bold text-red-900">
                  {analysis.avgIncorrectTime.toFixed(1)}s
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de patrones */}
      {(analysis.rushingProblem || analysis.overthinkingProblem) && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800">Patrón detectado</p>
                {analysis.rushingProblem && (
                  <p className="text-sm text-amber-700 mt-1">
                    🏃 <strong>Respondes muy rápido:</strong> Más del 30% de tus errores ocurren cuando respondes en menos de 5 segundos. Tómate un poco más de tiempo para leer bien.
                  </p>
                )}
                {analysis.overthinkingProblem && (
                  <p className="text-sm text-amber-700 mt-1">
                    🤔 <strong>Piensas demasiado:</strong> Más del 30% de tus errores ocurren después de 45 segundos. Confía más en tu primera intuición.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráfico de aciertos por rango de tiempo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Aciertos por tiempo de respuesta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analysis.rangeStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  formatter={(value, name) => [`${value.toFixed(1)}%`, 'Acierto']}
                  labelFormatter={(label) => `Tiempo: ${label}`}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <defs>
                  <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="accuracy" 
                  stroke="#6366f1" 
                  fillOpacity={1} 
                  fill="url(#colorAccuracy)" 
                  strokeWidth={2}
                />
                {analysis.optimalRange && (
                  <ReferenceLine 
                    x={analysis.optimalRange.label} 
                    stroke="#10b981" 
                    strokeDasharray="5 5"
                    label={{ value: '✓ Óptimo', fill: '#10b981', fontSize: 12 }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Leyenda de rangos */}
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            {analysis.rangeStats.map((range, idx) => (
              <Badge 
                key={idx}
                variant="outline"
                className={`text-xs ${
                  analysis.optimalRange?.label === range.label 
                    ? 'bg-green-100 border-green-300 text-green-700' 
                    : 'bg-gray-50'
                }`}
              >
                {range.label}: {range.accuracy.toFixed(0)}% ({range.total} resp.)
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recomendación */}
      <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">Tu estrategia óptima</h3>
              {analysis.optimalRange ? (
                <p className="text-white/90">
                  Tus mejores resultados ocurren cuando respondes entre <strong>{analysis.optimalRange.min}-{analysis.optimalRange.max} segundos</strong>. 
                  En este rango tienes un <strong>{analysis.optimalRange.accuracy.toFixed(0)}%</strong> de acierto.
                  {analysis.avgCorrectTime < analysis.avgIncorrectTime 
                    ? " Cuando te equivocas, tardas más tiempo — confía en tu instinto inicial."
                    : " Cuando aciertas, te tomas más tiempo — sigue leyendo con calma."
                  }
                </p>
              ) : (
                <p className="text-white/90">
                  Continúa practicando para descubrir tu tiempo óptimo de respuesta.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}