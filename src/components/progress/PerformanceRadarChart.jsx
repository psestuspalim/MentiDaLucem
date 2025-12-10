import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Target } from 'lucide-react';

export default function PerformanceRadarChart({ subjectStats = [] }) {
  if (!subjectStats.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Sin datos de materias para mostrar</p>
        </CardContent>
      </Card>
    );
  }

  // Limitar a 8 materias para el radar
  const data = subjectStats
    .slice(0, 8)
    .map(s => ({
      subject: s.name?.length > 12 ? s.name.substring(0, 12) + '...' : s.name,
      accuracy: Math.round(s.accuracy || 0),
      attempts: s.attempts || 0,
      fullMark: 100
    }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-600" />
          Rendimiento por Materia
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fontSize: 11, fill: '#6b7280' }}
              />
              <PolarRadiusAxis 
                angle={30} 
                domain={[0, 100]} 
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => `${v}%`}
              />
              <Radar
                name="Precisión"
                dataKey="accuracy"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.5}
                strokeWidth={2}
              />
              <Tooltip
                formatter={(value, name) => [`${value}%`, name]}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}