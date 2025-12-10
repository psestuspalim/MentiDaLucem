import React, { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X } from 'lucide-react';

import OverviewStats from '../progress/OverviewStats';
import SubjectProgress from '../progress/SubjectProgress';
import WeakPoints from '../progress/WeakPoints';
import SpeedAnalysis from '../progress/SpeedAnalysis';
import StudentTrendChart from './StudentTrendChart';
import StudentWeakPointsList from './StudentWeakPointsList';
import StudentAttemptsList from './StudentAttemptsList';

export default function StudentProgressModal({ 
  open, 
  onClose, 
  student, 
  subjects, 
  quizzes 
}) {
  const analytics = useMemo(() => {
    if (!student || !student.attempts || !Array.isArray(student.attempts) || student.attempts.length === 0) return null;

    const attempts = [...student.attempts];

    // Calcular estadísticas generales
    const totalAttempts = attempts.length;
    const totalCorrect = attempts.reduce((sum, a) => sum + a.score, 0);
    const totalQuestions = attempts.reduce((sum, a) => sum + a.total_questions, 0);
    const overallAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
    const completedAttempts = attempts.filter(a => a.is_completed).length;

    // Progreso por materia
    const subjectProgress = {};
    attempts.forEach(attempt => {
      const subjectId = attempt.subject_id || 'sin-materia';
      if (!subjectProgress[subjectId]) {
        const subject = subjects.find(s => s.id === subjectId);
        subjectProgress[subjectId] = {
          subjectId,
          subjectName: subject?.name || 'Sin materia',
          color: subject?.color || '#6366f1',
          correct: 0,
          total: 0,
          attempts: []
        };
      }
      subjectProgress[subjectId].correct += attempt.score;
      subjectProgress[subjectId].total += attempt.total_questions;
      subjectProgress[subjectId].attempts.push(attempt);
    });

    // Tendencia (últimos 10 intentos)
    const sortedAttempts = [...attempts].sort((a, b) => 
      new Date(a.completed_at || a.created_date) - new Date(b.completed_at || b.created_date)
    );
    const trendData = sortedAttempts.slice(-10).map((a, idx) => ({
      index: idx + 1,
      score: Math.round((a.score / a.total_questions) * 100),
      date: a.completed_at || a.created_date
    }));

    // Puntos débiles (preguntas más falladas)
    const weakPoints = {};
    attempts.forEach(attempt => {
      attempt.wrong_questions?.forEach(wq => {
        const key = wq.question;
        if (!weakPoints[key]) {
          weakPoints[key] = {
            question: wq.question,
            count: 0,
            correct_answer: wq.correct_answer,
            quizId: attempt.quiz_id
          };
        }
        weakPoints[key].count++;
      });
    });
    const topWeakPoints = Object.values(weakPoints)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Análisis de velocidad
    const speedData = attempts
      .filter(a => a.response_times?.length > 0)
      .map(a => ({
        avgTime: a.response_times.reduce((sum, t) => sum + t, 0) / a.response_times.length,
        score: Math.round((a.score / a.total_questions) * 100),
        date: a.completed_at || a.created_date
      }));

    return {
      totalAttempts,
      totalCorrect,
      totalQuestions,
      overallAccuracy,
      completedAttempts,
      subjectProgress: Object.values(subjectProgress),
      trendData,
      topWeakPoints,
      speedData,
      attempts: sortedAttempts.reverse()
    };
  }, [student, subjects]);

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">
                Análisis de {student.username || student.email}
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">{student.email}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {analytics ? (
          <Tabs defaultValue="overview" className="mt-4">
            <TabsList className="grid grid-cols-6 w-full">
              <TabsTrigger value="overview" className="text-xs">General</TabsTrigger>
              <TabsTrigger value="attempts" className="text-xs">Intentos</TabsTrigger>
              <TabsTrigger value="subjects" className="text-xs">Materias</TabsTrigger>
              <TabsTrigger value="trend" className="text-xs">Tendencia</TabsTrigger>
              <TabsTrigger value="weak" className="text-xs">Débiles</TabsTrigger>
              <TabsTrigger value="speed" className="text-xs">Velocidad</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-indigo-600">{analytics.totalAttempts}</p>
                  <p className="text-sm text-gray-500">Intentos</p>
                </div>
                <div className="bg-white border rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-blue-600">{analytics.totalQuestions}</p>
                  <p className="text-sm text-gray-500">Preguntas</p>
                </div>
                <div className="bg-white border rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-green-600">{analytics.totalCorrect}</p>
                  <p className="text-sm text-gray-500">Correctas</p>
                </div>
                <div className="bg-white border rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-purple-600">{Math.round(analytics.overallAccuracy)}%</p>
                  <p className="text-sm text-gray-500">Precisión</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="attempts" className="mt-4">
              <StudentAttemptsList attempts={analytics.attempts} quizzes={quizzes} />
            </TabsContent>

            <TabsContent value="subjects" className="mt-4">
              <div className="space-y-3">
                {analytics.subjectProgress.map((subject) => {
                  const accuracy = subject.total > 0 ? (subject.correct / subject.total) * 100 : 0;
                  return (
                    <div key={subject.subjectId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{subject.subjectName}</span>
                        <span className="text-sm font-semibold text-indigo-600">{Math.round(accuracy)}%</span>
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        {subject.correct}/{subject.total} correctas • {subject.attempts.length} intentos
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${accuracy}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="trend" className="mt-4">
              <StudentTrendChart trendData={analytics.trendData} />
            </TabsContent>

            <TabsContent value="weak" className="mt-4">
              <StudentWeakPointsList weakPoints={analytics.topWeakPoints} />
            </TabsContent>

            <TabsContent value="speed" className="mt-4">
              <SpeedAnalysis attempts={analytics.attempts} />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-12 text-gray-500">
            Este estudiante no tiene datos suficientes para analizar
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}