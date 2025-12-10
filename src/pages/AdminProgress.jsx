import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, TrendingUp, AlertCircle, Calendar, Trash2, Eye, RefreshCw, Loader2, ChevronDown, ChevronUp, FileDown, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import MathText from '../components/quiz/MathText';
import AttemptDetailModal from '../components/admin/AttemptDetailModal';
import StudentProgressModal from '../components/admin/StudentProgressModal';
import QuizMasterDocs from '../components/admin/QuizMasterDocs';

export default function AdminProgress() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [isPurging, setIsPurging] = useState(false);
  const [expandedAttempts, setExpandedAttempts] = useState({});
  const [showProgressModal, setShowProgressModal] = useState(false);

  const queryClient = useQueryClient();

  const { data: attempts = [], isLoading: attemptsLoading } = useQuery({
    queryKey: ['quiz-attempts'],
    queryFn: () => base44.entities.QuizAttempt.list('-created_date', 2000),
  });

  // Filter out incomplete attempts (0 score with 0 answered)
  const validAttempts = attempts.filter(a => 
    a.answered_questions > 0 || a.score > 0 || a.is_completed
  );

  const deleteAttemptMutation = useMutation({
    mutationFn: (id) => base44.entities.QuizAttempt.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['quiz-attempts']);
      toast.success('Intento eliminado');
      setSelectedAttempt(null);
    },
    onError: () => toast.error('Error al eliminar')
  });

  const purgeFailedAttempts = async () => {
    const failedAttempts = attempts.filter(a => 
      (a.answered_questions === 0 || !a.answered_questions) && 
      a.score === 0 && 
      !a.is_completed
    );
    
    if (failedAttempts.length === 0) {
      toast.info('No hay intentos fallidos para eliminar');
      return;
    }

    setIsPurging(true);
    try {
      for (const attempt of failedAttempts) {
        await base44.entities.QuizAttempt.delete(attempt.id);
      }
      queryClient.invalidateQueries(['quiz-attempts']);
      toast.success(`${failedAttempts.length} intentos fallidos eliminados`);
    } catch (error) {
      toast.error('Error al purgar intentos');
    } finally {
      setIsPurging(false);
    }
  };

  const { data: quizzes = [] } = useQuery({
    queryKey: ['quizzes'],
    queryFn: () => base44.entities.Quiz.list(),
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => base44.entities.Subject.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list('-created_date', 1000),
  });

  // Crear objeto con todos los usuarios
  const studentStats = users.reduce((acc, user) => {
    acc[user.email] = {
      email: user.email,
      username: user.username || user.full_name || 'Sin nombre',
      attempts: [],
      totalQuizzes: 0,
      totalCorrect: 0,
      totalQuestions: 0,
    };
    return acc;
  }, {});

  // Agregar intentos válidos a los usuarios
  validAttempts.forEach(attempt => {
    if (studentStats[attempt.user_email]) {
      studentStats[attempt.user_email].attempts.push(attempt);
      studentStats[attempt.user_email].totalQuizzes += 1;
      studentStats[attempt.user_email].totalCorrect += attempt.score;
      studentStats[attempt.user_email].totalQuestions += attempt.total_questions;
    }
  });

  const failedAttemptsCount = attempts.length - validAttempts.length;

  const toggleAttemptExpand = (attemptId) => {
    setExpandedAttempts(prev => ({
      ...prev,
      [attemptId]: !prev[attemptId]
    }));
  };

  const students = Object.values(studentStats).filter(student =>
    student.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getQuizTitle = (quizId) => {
    const quiz = quizzes.find(q => q.id === quizId);
    return quiz?.title || 'Cuestionario eliminado';
  };

  const getSubjectName = (subjectId) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.name || 'Sin materia';
  };

  // Generar PDF por quiz
  const generateQuizPDF = (student, quizStat) => {
    const quizAttempts = quizStat.attempts;
    
    // Recopilar preguntas incorrectas de este quiz
    const wrongQuestionsMap = new Map();
    quizAttempts.forEach(attempt => {
      attempt.wrong_questions?.forEach(wq => {
        const key = wq.question;
        if (!wrongQuestionsMap.has(key)) {
          wrongQuestionsMap.set(key, {
            question: wq.question,
            selectedAnswer: wq.selected_answer,
            correctAnswer: wq.correct_answer,
            answerOptions: wq.answerOptions || [],
            hint: wq.hint,
            count: 1
          });
        } else {
          wrongQuestionsMap.get(key).count++;
        }
      });
    });

    const wrongQuestions = Array.from(wrongQuestionsMap.values()).sort((a, b) => b.count - a.count);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reporte ${quizStat.quizTitle} - ${student.username}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          h1 { color: #1f2937; border-bottom: 2px solid #6366f1; padding-bottom: 10px; }
          h2 { color: #374151; margin-top: 30px; }
          .header-info { background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .header-info p { margin: 5px 0; color: #4b5563; }
          .stats { display: flex; gap: 20px; margin-top: 10px; }
          .stat { text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; color: #6366f1; }
          .stat-label { font-size: 12px; color: #6b7280; }
          .attempts-section { margin-top: 20px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; }
          .attempt-item { border-bottom: 1px solid #e5e7eb; padding: 10px 0; }
          .attempt-item:last-child { border-bottom: none; }
          .question-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 15px; page-break-inside: avoid; }
          .question-title { font-weight: bold; color: #1f2937; margin-bottom: 10px; }
          .options-list { margin-top: 12px; }
          .option { display: flex; align-items: flex-start; gap: 8px; padding: 8px 12px; margin: 4px 0; border-radius: 6px; background: #f9fafb; border: 1px solid #e5e7eb; }
          .option-correct { background: #f0fdf4; border-color: #86efac; }
          .option-selected:not(.option-correct) { background: #fef2f2; border-color: #fecaca; }
          .option-letter { font-weight: bold; color: #6b7280; min-width: 20px; }
          .option-text { flex: 1; }
          .check { color: #16a34a; font-weight: bold; }
          .cross { color: #dc2626; font-weight: bold; }
          .rationale { margin-top: 10px; padding: 10px; background: #eff6ff; border-radius: 6px; font-size: 13px; color: #1e40af; }
          .hint { margin-top: 8px; padding: 8px; background: #fdf4ff; border-radius: 6px; font-size: 12px; color: #86198f; }
          .count-badge { display: inline-block; background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 10px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>📊 ${quizStat.quizTitle}</h1>
        <div class="header-info">
          <p><strong>Estudiante:</strong> ${student.username || 'Sin nombre'}</p>
          <p><strong>Email:</strong> ${student.email}</p>
          <p><strong>Fecha:</strong> ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
          <div class="stats">
            <div class="stat">
              <div class="stat-value">${quizStat.totalAttempts}</div>
              <div class="stat-label">Intentos</div>
            </div>
            <div class="stat">
              <div class="stat-value">${Math.round(quizStat.bestScore)}%</div>
              <div class="stat-label">Mejor</div>
            </div>
            <div class="stat">
              <div class="stat-value">${Math.round(quizStat.avgScore)}%</div>
              <div class="stat-label">Promedio</div>
            </div>
          </div>
        </div>

        <h2>Historial de Intentos</h2>
        <div class="attempts-section">
          ${quizAttempts.map((att, idx) => `
            <div class="attempt-item">
              <strong>Intento ${idx + 1}</strong> - 
              ${format(new Date(att.completed_at || att.created_date), 'dd/MM/yyyy HH:mm')} - 
              <span style="color: ${(att.score / att.total_questions) * 100 >= 70 ? '#16a34a' : '#dc2626'}">
                ${att.score}/${att.total_questions} (${Math.round((att.score / att.total_questions) * 100)}%)
              </span>
            </div>
          `).join('')}
        </div>

        ${wrongQuestions.length > 0 ? `
          <h2>Preguntas Incorrectas (${wrongQuestions.length})</h2>
          ${wrongQuestions.map((wq, idx) => `
            <div class="question-card">
              <div class="question-title">
                ${idx + 1}. ${wq.question}
                ${wq.count > 1 ? `<span class="count-badge">Fallada ${wq.count}x</span>` : ''}
              </div>
              ${wq.answerOptions && wq.answerOptions.length > 0 ? `
                <div class="options-list">
                  ${wq.answerOptions.map((opt, i) => `
                    <div class="option ${opt.isCorrect ? 'option-correct' : ''} ${opt.text === wq.selectedAnswer ? 'option-selected' : ''}">
                      <span class="option-letter">${String.fromCharCode(65 + i)}</span>
                      <span class="option-text">${opt.text}</span>
                      ${opt.isCorrect ? '<span class="check">✓</span>' : ''}
                      ${opt.text === wq.selectedAnswer && !opt.isCorrect ? '<span class="cross">✗</span>' : ''}
                    </div>
                  `).join('')}
                </div>
                ${wq.answerOptions.find(o => o.isCorrect)?.rationale ? `
                  <div class="rationale">
                    <strong>💡 Explicación:</strong> ${wq.answerOptions.find(o => o.isCorrect).rationale}
                  </div>
                ` : ''}
              ` : ''}
              ${wq.hint ? `<div class="hint">🎬 <em>${wq.hint}</em></div>` : ''}
            </div>
          `).join('')}
        ` : '<p style="text-align: center; color: #16a34a; padding: 20px;">✓ Sin errores registrados</p>'}

        <div style="margin-top: 40px; text-align: center; color: #9ca3af; font-size: 12px;">
          Generado automáticamente • ${format(new Date(), 'dd/MM/yyyy')}
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  // Generar PDF de errores
  const generateErrorsPDF = (student) => {
    // Recopilar todas las preguntas incorrectas únicas con todas las opciones
    const wrongQuestionsMap = new Map();
    student.attempts.forEach(attempt => {
      attempt.wrong_questions?.forEach(wq => {
        const key = wq.question;
        if (!wrongQuestionsMap.has(key)) {
          wrongQuestionsMap.set(key, {
            question: wq.question,
            selectedAnswer: wq.selected_answer,
            correctAnswer: wq.correct_answer,
            answerOptions: wq.answerOptions || [],
            hint: wq.hint,
            quizTitle: getQuizTitle(attempt.quiz_id),
            count: 1
          });
        } else {
          wrongQuestionsMap.get(key).count++;
        }
      });
    });

    const wrongQuestions = Array.from(wrongQuestionsMap.values())
      .sort((a, b) => b.count - a.count);

    if (wrongQuestions.length === 0) {
      toast.info('Este estudiante no tiene preguntas incorrectas');
      return;
    }

    // Crear contenido HTML para el PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reporte de Errores - ${student.username}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          h1 { color: #1f2937; border-bottom: 2px solid #6366f1; padding-bottom: 10px; }
          h2 { color: #374151; margin-top: 30px; }
          .header-info { background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .header-info p { margin: 5px 0; color: #4b5563; }
          .question-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 15px; page-break-inside: avoid; }
          .question-title { font-weight: bold; color: #1f2937; margin-bottom: 10px; }
          .quiz-source { font-size: 12px; color: #6b7280; margin-bottom: 8px; }
          .answer-row { display: flex; gap: 10px; margin-top: 10px; }
          .answer-box { flex: 1; padding: 10px; border-radius: 6px; font-size: 14px; }
          .wrong { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
          .correct { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }
          .count-badge { display: inline-block; background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 10px; }
          .options-list { margin-top: 12px; }
          .option { display: flex; align-items: flex-start; gap: 8px; padding: 8px 12px; margin: 4px 0; border-radius: 6px; background: #f9fafb; border: 1px solid #e5e7eb; }
          .option-correct { background: #f0fdf4; border-color: #86efac; }
          .option-selected:not(.option-correct) { background: #fef2f2; border-color: #fecaca; }
          .option-letter { font-weight: bold; color: #6b7280; min-width: 20px; }
          .option-text { flex: 1; }
          .check { color: #16a34a; font-weight: bold; }
          .cross { color: #dc2626; font-weight: bold; }
          .rationale { margin-top: 10px; padding: 10px; background: #eff6ff; border-radius: 6px; font-size: 13px; color: #1e40af; }
          .hint { margin-top: 8px; padding: 8px; background: #fdf4ff; border-radius: 6px; font-size: 12px; color: #86198f; }
          .stats { display: flex; gap: 20px; margin-top: 10px; }
          .stat { text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; color: #6366f1; }
          .stat-label { font-size: 12px; color: #6b7280; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>📋 Reporte de Preguntas Incorrectas</h1>
        <div class="header-info">
          <p><strong>Estudiante:</strong> ${student.username || 'Sin nombre'}</p>
          <p><strong>Email:</strong> ${student.email}</p>
          <p><strong>Fecha:</strong> ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
          <div class="stats">
            <div class="stat">
              <div class="stat-value">${student.totalQuizzes}</div>
              <div class="stat-label">Intentos</div>
            </div>
            <div class="stat">
              <div class="stat-value">${wrongQuestions.length}</div>
              <div class="stat-label">Errores únicos</div>
            </div>
            <div class="stat">
              <div class="stat-value">${student.totalQuestions > 0 ? Math.round((student.totalCorrect / student.totalQuestions) * 100) : 0}%</div>
              <div class="stat-label">Promedio</div>
            </div>
          </div>
        </div>

        <h2>Preguntas a Repasar (${wrongQuestions.length})</h2>
        ${wrongQuestions.map((wq, idx) => `
          <div class="question-card">
            <div class="quiz-source">📚 ${wq.quizTitle}</div>
            <div class="question-title">
              ${idx + 1}. ${wq.question}
              ${wq.count > 1 ? `<span class="count-badge">Fallada ${wq.count}x</span>` : ''}
            </div>
            ${wq.answerOptions && wq.answerOptions.length > 0 ? `
              <div class="options-list">
                ${wq.answerOptions.map((opt, i) => `
                  <div class="option ${opt.isCorrect ? 'option-correct' : ''} ${opt.text === wq.selectedAnswer ? 'option-selected' : ''}">
                    <span class="option-letter">${String.fromCharCode(65 + i)}</span>
                    <span class="option-text">${opt.text}</span>
                    ${opt.isCorrect ? '<span class="check">✓</span>' : ''}
                    ${opt.text === wq.selectedAnswer && !opt.isCorrect ? '<span class="cross">✗</span>' : ''}
                  </div>
                `).join('')}
              </div>
              ${wq.answerOptions.find(o => o.isCorrect)?.rationale ? `
                <div class="rationale">
                  <strong>💡 Explicación:</strong> ${wq.answerOptions.find(o => o.isCorrect).rationale}
                </div>
              ` : ''}
            ` : `
              <div class="answer-row">
                <div class="answer-box wrong">
                  <strong>❌ Respondió:</strong><br>${wq.selectedAnswer}
                </div>
                <div class="answer-box correct">
                  <strong>✓ Correcta:</strong><br>${wq.correctAnswer}
                </div>
              </div>
            `}
            ${wq.hint ? `<div class="hint">🎬 <em>${wq.hint}</em></div>` : ''}
          </div>
        `).join('')}

        <div style="margin-top: 40px; text-align: center; color: #9ca3af; font-size: 12px;">
          Generado automáticamente • ${format(new Date(), 'dd/MM/yyyy')}
        </div>
      </body>
      </html>
    `;

    // Abrir ventana para imprimir/guardar como PDF
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  // Calcular estadísticas por quiz para el estudiante seleccionado
  const getQuizStats = (student) => {
    const quizStats = {};
    student.attempts.forEach(attempt => {
      if (!quizStats[attempt.quiz_id]) {
        quizStats[attempt.quiz_id] = {
          quizId: attempt.quiz_id,
          quizTitle: getQuizTitle(attempt.quiz_id),
          subjectId: attempt.subject_id,
          attempts: [],
          bestScore: 0,
          avgScore: 0,
          totalAttempts: 0
        };
      }
      const percentage = (attempt.score / attempt.total_questions) * 100;
      quizStats[attempt.quiz_id].attempts.push(attempt);
      quizStats[attempt.quiz_id].bestScore = Math.max(quizStats[attempt.quiz_id].bestScore, percentage);
      quizStats[attempt.quiz_id].totalAttempts += 1;
    });

    // Calcular promedio por quiz
    Object.values(quizStats).forEach(stat => {
      const total = stat.attempts.reduce((sum, att) => sum + (att.score / att.total_questions) * 100, 0);
      stat.avgScore = total / stat.attempts.length;
    });

    return Object.values(quizStats);
  };

  // Calcular estadísticas por tema
  const getSubjectStats = (student) => {
    const subjectStats = {};
    student.attempts.forEach(attempt => {
      const subjectId = attempt.subject_id || 'sin-materia';
      if (!subjectStats[subjectId]) {
        subjectStats[subjectId] = {
          subjectId,
          subjectName: getSubjectName(subjectId),
          totalCorrect: 0,
          totalQuestions: 0,
          attempts: []
        };
      }
      subjectStats[subjectId].totalCorrect += attempt.score;
      subjectStats[subjectId].totalQuestions += attempt.total_questions;
      subjectStats[subjectId].attempts.push(attempt);
    });

    return Object.values(subjectStats).map(stat => ({
      ...stat,
      avgPercentage: (stat.totalCorrect / stat.totalQuestions) * 100
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2">
                Progreso de Estudiantes
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Panel administrativo para seguimiento de rendimiento
              </p>
            </div>
            <div className="flex items-center gap-3">
              {failedAttemptsCount > 0 && (
                <Button
                  variant="outline"
                  onClick={purgeFailedAttempts}
                  disabled={isPurging}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  {isPurging ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Purgar {failedAttemptsCount} fallidos
                </Button>
              )}
              <Badge variant="outline" className="text-sm py-1 px-3">
                {validAttempts.length} intentos válidos
              </Badge>
            </div>
          </div>
        </div>

        <Tabs defaultValue="students" className="mb-6">
          <TabsList>
            <TabsTrigger value="students">Estudiantes</TabsTrigger>
            <TabsTrigger value="docs">
              <BookOpen className="w-4 h-4 mr-2" />
              Documentación
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students">{/* Contenido de estudiantes */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Lista de estudiantes */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Estudiantes</CardTitle>
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar estudiante..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent className="max-h-[400px] sm:max-h-[600px] overflow-y-auto space-y-2 p-3 sm:p-6">
                {students.map((student) => {
                  const avgScore = student.totalQuestions > 0
                    ? Math.round((student.totalCorrect / student.totalQuestions) * 100)
                    : 0;

                  return (
                    <button
                      key={student.email}
                      onClick={() => setSelectedStudent(student)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedStudent?.email === student.email
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold text-gray-900">
                        {student.username || 'Sin nombre'}
                      </div>
                      <div className="text-sm text-gray-500 mb-2">
                        {student.email}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">
                          {student.totalQuizzes} intentos
                        </span>
                        <Badge
                          className={
                            avgScore >= 70 ? 'bg-green-100 text-green-800' :
                            avgScore >= 50 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }
                        >
                          {avgScore}%
                        </Badge>
                      </div>
                    </button>
                  );
                })}
                {students.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No se encontraron estudiantes
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detalles del estudiante */}
          <div className="lg:col-span-2">
            {selectedStudent ? (
              <div className="space-y-6">
                {/* Resumen */}
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                      <CardTitle>
                        {selectedStudent.username || 'Sin nombre'}
                      </CardTitle>
                      <p className="text-sm text-gray-500">{selectedStudent.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => generateErrorsPDF(selectedStudent)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <FileDown className="w-4 h-4 mr-2" />
                        PDF Errores
                      </Button>
                      <Button
                        onClick={() => setShowProgressModal(true)}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Ver análisis
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                      <div className="text-center">
                        <div className="text-xl sm:text-3xl font-bold text-indigo-600">
                          {selectedStudent.totalQuizzes}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500">Intentos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl sm:text-3xl font-bold text-green-600">
                          {selectedStudent.totalCorrect}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500">Correctas</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl sm:text-3xl font-bold text-gray-900">
                          {Math.round((selectedStudent.totalCorrect / selectedStudent.totalQuestions) * 100)}%
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500">Promedio</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Progreso por Tema */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Progreso por Tema</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {getSubjectStats(selectedStudent).map((subjectStat) => (
                        <div key={subjectStat.subjectId} className="border rounded-lg p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900 text-sm sm:text-base">{subjectStat.subjectName}</h4>
                            <Badge className={
                              subjectStat.avgPercentage >= 70 ? 'bg-green-100 text-green-800' :
                              subjectStat.avgPercentage >= 50 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {Math.round(subjectStat.avgPercentage)}%
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            {subjectStat.totalCorrect}/{subjectStat.totalQuestions} correctas • {subjectStat.attempts.length} intentos
                          </div>
                          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-600 transition-all"
                              style={{ width: `${subjectStat.avgPercentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Progreso por Quiz */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Progreso por Cuestionario</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {getQuizStats(selectedStudent).map((quizStat) => (
                        <div key={quizStat.quizId} className="border rounded-lg p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                            <h4 className="font-medium text-gray-900 text-sm sm:text-base">{quizStat.quizTitle}</h4>
                            <div className="flex gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                Mejor: {Math.round(quizStat.bestScore)}%
                              </Badge>
                              <Badge className={`text-xs ${
                              quizStat.avgScore >= 70 ? 'bg-green-100 text-green-800' :
                              quizStat.avgScore >= 50 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                              }`}>
                              Prom: {Math.round(quizStat.avgScore)}%
                              </Badge>
                              </div>
                              </div>
                              <div className="flex items-center justify-between">
                              <div className="text-xs text-gray-500">
                              {quizStat.totalAttempts} {quizStat.totalAttempts === 1 ? 'intento' : 'intentos'}
                              </div>
                              <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => generateQuizPDF(selectedStudent, quizStat)}
                              className="h-7 text-xs text-indigo-600 hover:bg-indigo-50"
                              >
                              <FileDown className="w-3 h-3 mr-1" />
                              PDF
                              </Button>
                              </div>
                              </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Historial de intentos */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Historial de Intentos ({selectedStudent.attempts.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 max-h-[500px] sm:max-h-[600px] overflow-y-auto p-3 sm:p-6">
                    {(selectedStudent.attempts && Array.isArray(selectedStudent.attempts) ? [...selectedStudent.attempts].sort((a, b) => 
                      new Date(b.completed_at || b.created_date) - new Date(a.completed_at || a.created_date)
                    ) : []).map((attempt) => {
                      const percentage = Math.round((attempt.score / attempt.total_questions) * 100);
                      const isPartial = !attempt.is_completed;
                      const isExpanded = expandedAttempts[attempt.id];
                      const quizTitle = getQuizTitle(attempt.quiz_id);
                      
                      return (
                        <div key={attempt.id} className="border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                          {/* Header - Always visible */}
                          <div className="p-4 bg-white">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <h4 className="font-semibold text-gray-900 text-sm truncate max-w-[200px]" title={quizTitle}>
                                    {quizTitle}
                                  </h4>
                                  {isPartial && (
                                    <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                                      Parcial
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {format(new Date(attempt.completed_at || attempt.created_date), 'dd/MM/yy HH:mm')}
                                  </span>
                                  {attempt.wrong_questions?.length > 0 && (
                                    <span className="text-red-500">
                                      {attempt.wrong_questions.length} errores
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={`text-xs ${
                                  percentage >= 70 ? 'bg-green-100 text-green-800' :
                                  percentage >= 50 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {attempt.score}/{attempt.total_questions} ({percentage}%)
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedAttempt({ attempt, quizTitle })}
                                  className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteAttemptMutation.mutate(attempt.id)}
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                                {attempt.wrong_questions?.length > 0 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleAttemptExpand(attempt.id)}
                                    className="h-8 w-8 p-0"
                                  >
                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Expanded wrong questions */}
                          {isExpanded && attempt.wrong_questions?.length > 0 && (
                            <div className="border-t bg-gray-50 p-4">
                              <div className="flex items-center gap-2 text-sm font-medium text-red-600 mb-3">
                                <AlertCircle className="w-4 h-4" />
                                Preguntas incorrectas
                              </div>
                              <div className="space-y-3">
                                {attempt.wrong_questions.slice(0, 5).map((wq, idx) => (
                                  <div key={idx} className="bg-white rounded-lg p-3 border text-sm">
                                    <p className="font-medium text-gray-900 mb-2">
                                      <MathText text={wq.question} />
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      <div className="flex items-start gap-2 text-red-700 bg-red-50 rounded p-2">
                                        <span className="shrink-0">❌</span>
                                        <MathText text={wq.selected_answer} />
                                      </div>
                                      <div className="flex items-start gap-2 text-green-700 bg-green-50 rounded p-2">
                                        <span className="shrink-0">✓</span>
                                        <MathText text={wq.correct_answer} />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                {attempt.wrong_questions.length > 5 && (
                                  <Button
                                    variant="link"
                                    onClick={() => setSelectedAttempt({ attempt, quizTitle })}
                                    className="text-blue-600 p-0 h-auto"
                                  >
                                    Ver todas las {attempt.wrong_questions.length} preguntas incorrectas →
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {selectedStudent.attempts.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        Este estudiante no tiene intentos registrados
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="h-full">
                <CardContent className="flex items-center justify-center h-full min-h-[400px]">
                  <div className="text-center text-gray-500">
                    <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p>Selecciona un estudiante para ver sus detalles</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Attempt Detail Modal */}
        <AttemptDetailModal
          attempt={selectedAttempt?.attempt}
          quizTitle={selectedAttempt?.quizTitle}
          open={!!selectedAttempt}
          onClose={() => setSelectedAttempt(null)}
          onDelete={(id) => deleteAttemptMutation.mutate(id)}
        />

        {/* Student Progress Modal */}
        <StudentProgressModal
          open={showProgressModal}
          onClose={() => setShowProgressModal(false)}
          student={selectedStudent}
          subjects={subjects}
          quizzes={quizzes}
        />
        </TabsContent>

        <TabsContent value="docs">
          <QuizMasterDocs />
        </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}