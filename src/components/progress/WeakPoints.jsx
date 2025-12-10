import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingDown } from 'lucide-react';
import MathText from '../quiz/MathText';

export default function WeakPoints({ weakPoints }) {
  if (weakPoints.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            ¡Excelente trabajo!
          </h3>
          <p className="text-gray-500">
            No tienes puntos débiles recurrentes identificados
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            Preguntas con Más Errores
          </CardTitle>
          <p className="text-sm text-gray-500 mt-2">
            Estas son las preguntas que has fallado con mayor frecuencia. Dedica tiempo extra a estudiar estos temas.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {weakPoints.map((wp, idx) => (
              <Card key={idx} className="border-l-4 border-red-500 bg-red-50/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant="destructive" className="text-xs">
                      Fallada {wp.errorCount} {wp.errorCount === 1 ? 'vez' : 'veces'}
                    </Badge>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Nivel de dificultad</p>
                      <div className="flex gap-1 mt-1">
                        {[...Array(Math.min(5, wp.errorCount))].map((_, i) => (
                          <div key={i} className="w-2 h-2 rounded-full bg-red-500" />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 mb-1">Pregunta:</p>
                      <p className="text-sm text-gray-700">
                        <MathText text={wp.question} />
                      </p>
                    </div>
                    
                    {wp.details && (
                      <div className="border-t pt-2 mt-2">
                        <p className="text-xs font-semibold text-gray-700 mb-1">Respuesta correcta:</p>
                        <p className="text-xs text-green-700">
                          <MathText text={wp.details.correct_answer} />
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-50">
        <CardHeader>
          <CardTitle className="text-orange-900">💡 Consejos para Mejorar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-orange-900">
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-orange-200 flex items-center justify-center flex-shrink-0 mt-0.5">
              1
            </div>
            <p>Revisa el material de estudio relacionado con estas preguntas</p>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-orange-200 flex items-center justify-center flex-shrink-0 mt-0.5">
              2
            </div>
            <p>Practica estas preguntas específicas usando el deck de "Incorrectas"</p>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-orange-200 flex items-center justify-center flex-shrink-0 mt-0.5">
              3
            </div>
            <p>Toma descansos entre intentos para consolidar el aprendizaje</p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}