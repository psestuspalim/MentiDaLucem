import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Brain, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import MathText from '../quiz/MathText';

export default function DifficultQuestionsAnalysis({ attempts = [] }) {
  const [expandedCategories, setExpandedCategories] = React.useState({});

  const analysis = useMemo(() => {
    // Recopilar todas las preguntas incorrectas
    const wrongQuestions = [];
    const correctQuestions = [];

    attempts.forEach(attempt => {
      // Preguntas incorrectas
      attempt.wrong_questions?.forEach(wq => {
        wrongQuestions.push({
          question: wq.question,
          selectedAnswer: wq.selected_answer,
          correctAnswer: wq.correct_answer,
          time: wq.response_time,
          quizId: attempt.quiz_id
        });
      });

      // Para estimar correctas, calculamos la diferencia
      const wrongCount = attempt.wrong_questions?.length || 0;
      const correctCount = attempt.score || 0;
      
      // No tenemos las preguntas correctas exactas, pero podemos estimar patrones
      if (attempt.response_times?.length) {
        attempt.response_times.forEach((time, idx) => {
          if (idx < correctCount) {
            correctQuestions.push({ time });
          }
        });
      }
    });

    // Agrupar errores por frecuencia
    const errorMap = new Map();
    wrongQuestions.forEach(wq => {
      const key = wq.question;
      if (!errorMap.has(key)) {
        errorMap.set(key, {
          question: wq.question,
          correctAnswer: wq.correctAnswer,
          count: 0,
          times: []
        });
      }
      const entry = errorMap.get(key);
      entry.count++;
      if (wq.time) entry.times.push(wq.time);
    });

    // Ordenar por frecuencia de error
    const frequentErrors = Array.from(errorMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    // Categorizar por patrón de tiempo
    const quickErrors = wrongQuestions.filter(wq => wq.time && wq.time < 10);
    const slowErrors = wrongQuestions.filter(wq => wq.time && wq.time > 30);
    const normalErrors = wrongQuestions.filter(wq => wq.time && wq.time >= 10 && wq.time <= 30);

    // Calcular estadísticas
    const totalWrong = wrongQuestions.length;
    const quickPercentage = totalWrong > 0 ? (quickErrors.length / totalWrong) * 100 : 0;
    const slowPercentage = totalWrong > 0 ? (slowErrors.length / totalWrong) * 100 : 0;

    return {
      frequentErrors,
      totalWrong,
      patterns: {
        quick: { count: quickErrors.length, percentage: quickPercentage },
        slow: { count: slowErrors.length, percentage: slowPercentage },
        normal: { count: normalErrors.length, percentage: totalWrong > 0 ? (normalErrors.length / totalWrong) * 100 : 0 }
      }
    };
  }, [attempts]);

  const toggleCategory = (cat) => {
    setExpandedCategories(prev => ({
      ...prev,
      [cat]: !prev[cat]
    }));
  };

  if (analysis.totalWrong === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Brain className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">¡Excelente!</h3>
          <p className="text-gray-500">No hay suficientes datos de errores para analizar.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Patrones de error */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            Patrones de Error
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Analizamos cuándo cometes más errores según el tiempo de respuesta.
          </p>

          {/* Errores rápidos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">🏃 Respuestas rápidas (&lt;10s)</span>
                <Badge variant="outline" className="text-xs">
                  {analysis.patterns.quick.count} errores
                </Badge>
              </div>
              <span className="text-sm text-gray-500">{analysis.patterns.quick.percentage.toFixed(0)}%</span>
            </div>
            <Progress value={analysis.patterns.quick.percentage} className="h-2" />
            {analysis.patterns.quick.percentage > 40 && (
              <p className="text-xs text-amber-600">
                ⚠️ Muchos errores por responder muy rápido. Tómate más tiempo para leer.
              </p>
            )}
          </div>

          {/* Errores normales */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">⏱️ Tiempo normal (10-30s)</span>
                <Badge variant="outline" className="text-xs">
                  {analysis.patterns.normal.count} errores
                </Badge>
              </div>
              <span className="text-sm text-gray-500">{analysis.patterns.normal.percentage.toFixed(0)}%</span>
            </div>
            <Progress value={analysis.patterns.normal.percentage} className="h-2" />
          </div>

          {/* Errores lentos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">🤔 Respuestas lentas (&gt;30s)</span>
                <Badge variant="outline" className="text-xs">
                  {analysis.patterns.slow.count} errores
                </Badge>
              </div>
              <span className="text-sm text-gray-500">{analysis.patterns.slow.percentage.toFixed(0)}%</span>
            </div>
            <Progress value={analysis.patterns.slow.percentage} className="h-2" />
            {analysis.patterns.slow.percentage > 40 && (
              <p className="text-xs text-amber-600">
                ⚠️ Muchos errores cuando piensas demasiado. Confía más en tu instinto.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preguntas más difíciles */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Preguntas con Mayor Dificultad
            </CardTitle>
            <Badge className="bg-red-100 text-red-700">
              {analysis.frequentErrors.length} preguntas
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Estas son las preguntas que has fallado más veces. Repásalas para mejorar.
          </p>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {analysis.frequentErrors.map((error, idx) => (
              <div 
                key={idx}
                className={`p-3 rounded-lg border transition-all ${
                  error.count >= 3 
                    ? 'bg-red-50 border-red-200' 
                    : error.count >= 2 
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      <MathText text={error.question} />
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          error.count >= 3 ? 'bg-red-100 text-red-700' : 'bg-gray-100'
                        }`}
                      >
                        Fallada {error.count}x
                      </Badge>
                      {error.times.length > 0 && (
                        <span>
                          Tiempo prom: {Math.round(error.times.reduce((a,b) => a+b, 0) / error.times.length)}s
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {error.correctAnswer && (
                  <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                    <p className="text-xs text-green-700">
                      <span className="font-medium">✓ Respuesta correcta:</span>{' '}
                      <MathText text={error.correctAnswer} />
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}