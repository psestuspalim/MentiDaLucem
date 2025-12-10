import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileJson, Loader2, CheckCircle2, FolderDown } from 'lucide-react';
import { toast } from 'sonner';

export default function QuizExporter({ onClose }) {
  const [exporting, setExporting] = useState(false);
  const [exportedCount, setExportedCount] = useState(0);

  const { data: quizzes = [], isLoading } = useQuery({
    queryKey: ['all-quizzes'],
    queryFn: () => base44.entities.Quiz.list('-created_date'),
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => base44.entities.Subject.list(),
  });

  const downloadJSON = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportAll = async () => {
    setExporting(true);
    setExportedCount(0);

    try {
      for (const quiz of quizzes) {
        const subject = subjects.find(s => s.id === quiz.subject_id);
        const subjectName = subject?.name || 'Sin_Materia';
        const safeName = quiz.title.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s-]/g, '').replace(/\s+/g, '_');
        const filename = `${subjectName}_${safeName}.json`;

        const exportData = {
          title: quiz.title,
          description: quiz.description,
          questions: quiz.questions,
          total_questions: quiz.total_questions,
          metadata: {
            subject: subjectName,
            created_date: quiz.created_date,
            file_name: quiz.file_name
          }
        };

        downloadJSON(exportData, filename);
        setExportedCount(prev => prev + 1);
        
        // Pequeña pausa para no saturar el navegador
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      toast.success(`${quizzes.length} quizzes exportados exitosamente`);
    } catch (error) {
      console.error('Error exportando:', error);
      toast.error('Error al exportar algunos quizzes');
    } finally {
      setExporting(false);
    }
  };

  const handleExportSingle = (quiz) => {
    const subject = subjects.find(s => s.id === quiz.subject_id);
    const subjectName = subject?.name || 'Sin_Materia';
    const safeName = quiz.title.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s-]/g, '').replace(/\s+/g, '_');
    const filename = `${subjectName}_${safeName}.json`;

    const exportData = {
      title: quiz.title,
      description: quiz.description,
      questions: quiz.questions,
      total_questions: quiz.total_questions,
      metadata: {
        subject: subjectName,
        created_date: quiz.created_date,
        file_name: quiz.file_name
      }
    };

    downloadJSON(exportData, filename);
    toast.success('Quiz exportado');
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FolderDown className="w-5 h-5 text-indigo-600" />
            Exportar Quizzes
          </CardTitle>
          {onClose && (
            <Button variant="ghost" onClick={onClose}>
              ✕
            </Button>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Descarga todos tus quizzes como archivos JSON individuales
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium text-indigo-900">
                {quizzes.length} quizzes disponibles
              </p>
              <p className="text-sm text-indigo-700 mt-1">
                Cada quiz se descargará como un archivo JSON independiente
              </p>
            </div>
            <Button
              onClick={handleExportAll}
              disabled={exporting || quizzes.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {exportedCount}/{quizzes.length}
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Descargar todos
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
          {quizzes.map((quiz) => {
            const subject = subjects.find(s => s.id === quiz.subject_id);
            return (
              <div key={quiz.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{quiz.title}</p>
                  <p className="text-xs text-gray-500">
                    {subject?.name || 'Sin materia'} • {quiz.total_questions || quiz.questions?.length || 0} preguntas
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExportSingle(quiz)}
                  disabled={exporting}
                  className="ml-2"
                >
                  <FileJson className="w-4 h-4 mr-1" />
                  Descargar
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}