import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function RemoveDuplicateQuestionsButton() {
  const [isRemoving, setIsRemoving] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState([]);
  const [showDialog, setShowDialog] = useState(false);

  const analyzeDuplicates = async () => {
    setIsRemoving(true);
    try {
      const quizzes = await base44.entities.Quiz.list();
      
      // Agrupar por preguntas idénticas
      const questionSignature = (quiz) => {
        if (!quiz.questions || quiz.questions.length === 0) return 'empty';
        // Crear firma única basada en las preguntas
        return quiz.questions
          .map(q => q.question?.trim().toLowerCase())
          .filter(Boolean)
          .sort()
          .join('||');
      };

      const groups = {};
      quizzes.forEach(quiz => {
        const signature = questionSignature(quiz);
        if (signature !== 'empty') {
          if (!groups[signature]) {
            groups[signature] = [];
          }
          groups[signature].push(quiz);
        }
      });

      // Filtrar solo grupos con duplicados
      const duplicates = Object.values(groups).filter(group => group.length > 1);
      
      if (duplicates.length === 0) {
        toast.info('No se encontraron quizzes con preguntas duplicadas');
        setIsRemoving(false);
        return;
      }

      setDuplicateGroups(duplicates);
      setShowDialog(true);
      setIsRemoving(false);
    } catch (error) {
      console.error('Error al analizar duplicados:', error);
      toast.error('Error al analizar quizzes');
      setIsRemoving(false);
    }
  };

  const handleConfirmRemove = async () => {
    setIsRemoving(true);
    try {
      let totalDeleted = 0;

      for (const group of duplicateGroups) {
        // Ordenar por fecha de creación, mantener el más reciente
        const sorted = group.sort((a, b) => 
          new Date(b.created_date) - new Date(a.created_date)
        );
        
        // Eliminar todos excepto el primero (más reciente)
        for (let i = 1; i < sorted.length; i++) {
          await base44.entities.Quiz.delete(sorted[i].id);
          totalDeleted++;
        }
      }

      toast.success(`${totalDeleted} quizzes duplicados eliminados`);
      setShowDialog(false);
      setDuplicateGroups([]);
      
      // Recargar página
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error('Error al eliminar duplicados:', error);
      toast.error('Error al eliminar duplicados');
    } finally {
      setIsRemoving(false);
    }
  };

  const totalDuplicates = duplicateGroups.reduce((sum, group) => sum + group.length - 1, 0);

  return (
    <>
      <Button
        variant="outline"
        onClick={analyzeDuplicates}
        disabled={isRemoving}
        className="w-full text-orange-600 border-orange-200 hover:bg-orange-50 h-8 text-xs"
      >
        {isRemoving ? (
          <Loader2 className="w-3 h-3 mr-2 animate-spin" />
        ) : (
          <Trash2 className="w-3 h-3 mr-2" />
        )}
        Eliminar preguntas duplicadas
      </Button>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar quizzes duplicados</AlertDialogTitle>
            <AlertDialogDescription>
              Se encontraron {duplicateGroups.length} grupos de quizzes con las mismas preguntas.
              Se eliminarán {totalDuplicates} quizzes duplicados, manteniendo el más reciente de cada grupo.
              
              <div className="mt-4 max-h-60 overflow-y-auto space-y-2">
                {duplicateGroups.map((group, idx) => (
                  <div key={idx} className="text-xs bg-gray-50 p-2 rounded">
                    <strong>Grupo {idx + 1}:</strong> {group.length} quizzes
                    <ul className="ml-4 mt-1">
                      {group.map((quiz, i) => (
                        <li key={quiz.id} className={i === 0 ? 'text-green-600' : 'text-red-600'}>
                          {i === 0 ? '✓ ' : '✗ '}{quiz.title} ({quiz.total_questions} preguntas)
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmRemove}
              disabled={isRemoving}
              className="bg-red-600 hover:bg-red-700"
            >
              {isRemoving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                `Eliminar ${totalDuplicates} duplicados`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}