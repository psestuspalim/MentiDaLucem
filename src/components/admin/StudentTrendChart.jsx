import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

export default function StudentTrendChart({ trendData = [] }) {
  if (!trendData || trendData.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No hay suficientes datos de tendencia</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = trendData.map((item, idx) => ({
    name: item.date ? format(new Date(item.date), 'dd/MM') : `#${idx + 1}`,
    score: item.score
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          Tendencia de Desempeño
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip 
              formatter={(value) => [`${value}%`, 'Puntaje']}
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="score" 
              stroke="#6366f1" 
              strokeWidth={2}
              dot={{ fill: '#6366f1', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>

        {trendData.length >= 2 && (
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {Math.max(...trendData.map(d => d.score))}%
              </p>
              <p className="text-xs text-gray-500">Mejor puntaje</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-indigo-600">
                {Math.round(trendData.reduce((sum, d) => sum + d.score, 0) / trendData.length)}%
              </p>
              <p className="text-xs text-gray-500">Promedio</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {trendData[trendData.length - 1].score > trendData[0].score ? '↑' : 
                 trendData[trendData.length - 1].score < trendData[0].score ? '↓' : '→'}
              </p>
              <p className="text-xs text-gray-500">Tendencia</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}