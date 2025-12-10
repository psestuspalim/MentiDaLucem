import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Wrench, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function FixQuizzesButton() {
  const [isFixing, setIsFixing] = useState(false);

  const fixQuizzes = async () => {
    setIsFixing(true);
    try {
      const quizzes = await base44.entities.Quiz.list();
      let fixed = 0;

      for (const quiz of quizzes) {
        // Solo arreglar si tiene answerOptions vacío o no tiene
        const needsFix = quiz.questions?.some(q => 
          !q.answerOptions || q.answerOptions.length === 0
        );

        if (!needsFix) continue;

        const fixedQuestions = quiz.questions.map(q => {
          // Si ya tiene answerOptions válido, dejarlo
          if (q.answerOptions && q.answerOptions.length > 0) {
            return q;
          }

          // Intentar obtener opciones de q.options o generar desde el hint
          let options = q.options || [];
          
          // Si no hay opciones, necesitamos generarlas con IA
          // Por ahora, retornar la pregunta marcada para revisión manual
          return {
            ...q,
            answerOptions: options.length > 0 ? options.map(opt => ({
              text: opt.text || opt,
              isCorrect: opt.isCorrect === true,
              rationale: opt.rationale || opt.feedback || ''
            })) : []
          };
        });

        await base44.entities.Quiz.update(quiz.id, {
          questions: fixedQuestions
        });
        fixed++;
      }

      toast.success(`${fixed} quizzes actualizados`);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al arreglar quizzes');
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <Button
      onClick={fixQuizzes}
      disabled={isFixing}
      variant="outline"
      className="border-amber-300 text-amber-600 hover:bg-amber-50"
    >
      {isFixing ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Wrench className="w-4 h-4 mr-2" />
      )}
      {isFixing ? 'Reparando...' : 'Reparar quizzes'}
    </Button>
  );
}