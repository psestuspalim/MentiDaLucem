import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingDown } from 'lucide-react';
import MathText from '../quiz/MathText';

export default function StudentWeakPointsList({ weakPoints = [] }) {
  if (!weakPoints || weakPoints.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">¡Sin puntos débiles!</h3>
          <p className="text-gray-500">No hay preguntas falladas recurrentemente</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingDown className="w-5 h-5 text-red-600" />
          Preguntas con Más Errores
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {weakPoints.map((wp, idx) => (
            <div key={idx} className="border-l-4 border-red-500 bg-red-50/50 rounded-r-lg p-3">
              <div className="flex items-start justify-between mb-2">
                <Badge variant="destructive" className="text-xs">
                  Fallada {wp.count} {wp.count === 1 ? 'vez' : 'veces'}
                </Badge>
              </div>
              <p className="text-sm text-gray-900 mb-2">
                <MathText text={wp.question} />
              </p>
              {wp.correct_answer && (
                <p className="text-xs text-green-700 bg-green-50 p-2 rounded">
                  ✓ Respuesta correcta: <MathText text={wp.correct_answer} />
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}