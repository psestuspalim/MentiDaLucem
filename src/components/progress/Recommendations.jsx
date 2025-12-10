import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, BookOpen, TrendingUp, Award, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Recommendations({ analytics, quizzes, subjects }) {
  const recommendations = React.useMemo(() => {
    const recs = [];

    // Materias con baja precisión
    const weakSubjects = analytics.subjectStats
      .filter(s => s.accuracy < 70)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 3);

    if (weakSubjects.length > 0) {
      recs.push({
        priority: 'high',
        icon: AlertTriangle,
        color: 'red',
        title: 'Reforzar materias débiles',
        description: `Tu precisión en ${weakSubjects.map(s => s.name).join(', ')} está por debajo del 70%. Dedica más tiempo a estas materias.`,
        action: 'Practicar ahora',
        subjects: weakSubjects
      });
    }

    // Cuestionarios no intentados
    const unattemptedQuizzes = quizzes.filter(q => 
      !analytics.quizStats.some(qs => qs.id === q.id)
    );

    if (unattemptedQuizzes.length > 0) {
      recs.push({
        priority: 'medium',
        icon: BookOpen,
        color: 'blue',
        title: 'Explorar nuevos cuestionarios',
        description: `Tienes ${unattemptedQuizzes.length} cuestionario${unattemptedQuizzes.length > 1 ? 's' : ''} sin intentar. Amplía tu conocimiento probando nuevos temas.`,
        action: 'Ver cuestionarios',
        quizzes: unattemptedQuizzes.slice(0, 5)
      });
    }

    // Cuestionarios con potencial de mejora
    const improvableQuizzes = analytics.quizStats
      .filter(q => q.bestScore < 90 && q.attempts >= 2)
      .sort((a, b) => (b.bestScore - b.avgScore) - (a.bestScore - a.avgScore))
      .slice(0, 3);

    if (improvableQuizzes.length > 0) {
      recs.push({
        priority: 'medium',
        icon: TrendingUp,
        color: 'orange',
        title: 'Mejorar puntajes existentes',
        description: 'Estos cuestionarios tienen espacio para mejorar. Un repaso podría elevar significativamente tu puntaje.',
        action: 'Repasar',
        quizzes: improvableQuizzes
      });
    }

    // Mantener racha en buenos cuestionarios
    const strongQuizzes = analytics.quizStats
      .filter(q => q.avgScore >= 85)
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 3);

    if (strongQuizzes.length > 0) {
      recs.push({
        priority: 'low',
        icon: Award,
        color: 'green',
        title: 'Mantener el dominio',
        description: 'Excelente desempeño en estos cuestionarios. Mantén la práctica para no perder el conocimiento.',
        action: 'Mantener',
        quizzes: strongQuizzes
      });
    }

    // Recomendación de práctica diaria
    if (analytics.last30Days.length < 20) {
      recs.push({
        priority: 'medium',
        icon: Target,
        color: 'indigo',
        title: 'Establecer rutina de estudio',
        description: 'La práctica constante es clave. Intenta completar al menos un cuestionario al día para mejores resultados.',
        action: 'Comenzar rutina'
      });
    }

    return recs.sort((a, b) => {
      const priority = { high: 0, medium: 1, low: 2 };
      return priority[a.priority] - priority[b.priority];
    });
  }, [analytics, quizzes]);

  const priorityColors = {
    high: 'border-red-500 bg-red-50',
    medium: 'border-orange-500 bg-orange-50',
    low: 'border-green-500 bg-green-50'
  };

  const priorityBadges = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-orange-100 text-orange-800',
    low: 'bg-green-100 text-green-800'
  };

  const priorityLabels = {
    high: 'Alta Prioridad',
    medium: 'Prioridad Media',
    low: 'Recomendado'
  };

  return (
    <>
      <div className="space-y-6">
        {recommendations.map((rec, idx) => {
          const Icon = rec.icon;
          return (
            <Card key={idx} className={`border-l-4 ${priorityColors[rec.priority]} shadow-lg`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-${rec.color}-100 flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 text-${rec.color}-600`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg">{rec.title}</CardTitle>
                        <Badge className={priorityBadges[rec.priority]}>
                          {priorityLabels[rec.priority]}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{rec.description}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              {(rec.subjects || rec.quizzes) && (
                <CardContent>
                  <div className="space-y-2">
                    {rec.subjects?.map(subject => (
                      <div key={subject.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                        <div>
                          <p className="font-medium text-gray-900">{subject.name}</p>
                          <p className="text-xs text-gray-500">
                            Precisión actual: {Math.round(subject.accuracy)}%
                          </p>
                        </div>
                        <Link to={createPageUrl('Quizzes')}>
                          <Button size="sm" variant="outline">
                            Practicar
                          </Button>
                        </Link>
                      </div>
                    ))}
                    
                    {rec.quizzes?.map(quiz => (
                      <div key={quiz.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{quiz.title}</p>
                          <p className="text-xs text-gray-500">
                            {quiz.bestScore ? `Mejor: ${Math.round(quiz.bestScore)}%` : 'Sin intentos'}
                          </p>
                        </div>
                        <Link to={createPageUrl('Quizzes')}>
                          <Button size="sm" variant="outline">
                            Intentar
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
        <CardContent className="p-8 text-center">
          <Award className="w-12 h-12 mx-auto mb-4 opacity-80" />
          <h3 className="text-2xl font-bold mb-2">¡Sigue así!</h3>
          <p className="text-indigo-100 mb-4">
            Has completado {analytics.totalAttempts} intentos con una precisión promedio del {Math.round(analytics.averageScore)}%
          </p>
          <Link to={createPageUrl('Quizzes')}>
            <Button className="bg-white text-indigo-600 hover:bg-indigo-50">
              Continuar aprendiendo
            </Button>
          </Link>
        </CardContent>
      </Card>
    </>
  );
}