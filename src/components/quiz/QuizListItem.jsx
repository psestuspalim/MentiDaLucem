import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Play, ChevronRight, CheckCircle2, XCircle, HelpCircle, BarChart3, Smartphone, FolderInput } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';

export default function QuizListItem({ 
  quiz, 
  attempts = [], 
  isAdmin, 
  onStart, 
  onEdit, 
  onDelete,
  onStartSwipe,
  onMove,
  isSelected = false,
  onSelect
}) {
  const totalQuestions = quiz.total_questions || quiz.questions?.length || 0;
  const hasAttempts = attempts.length > 0;
  
  // Calcular estadísticas
  const wrongSet = new Set();
  const correctSet = new Set();
  let totalAnswered = 0;
  
  attempts.forEach(attempt => {
    totalAnswered += attempt.answered_questions || attempt.total_questions || 0;
    attempt.wrong_questions?.forEach(wq => wrongSet.add(wq.question));
  });
  
  // Calcular correctas únicas (preguntas que nunca se han fallado)
  const allQuestions = quiz.questions?.map(q => q.question) || [];
  allQuestions.forEach(q => {
    if (!wrongSet.has(q)) {
      // Verificar si fue contestada en algún intento
      const wasAnswered = attempts.some(a => a.answered_questions > 0);
      if (wasAnswered) correctSet.add(q);
    }
  });
  
  const uniqueWrong = wrongSet.size;
  const uniqueCorrect = correctSet.size;
  const avgScore = attempts.length > 0 
    ? Math.round(attempts.reduce((sum, a) => sum + ((a.score / a.total_questions) * 100), 0) / attempts.length)
    : 0;
  const bestScore = attempts.length > 0
    ? Math.round(Math.max(...attempts.map(a => (a.score / a.total_questions) * 100)))
    : 0;
  const progressPercent = totalQuestions > 0 
    ? Math.min(100, Math.round(((uniqueCorrect + uniqueWrong) / totalQuestions) * 100))
    : 0;

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBorderColor = () => {
    if (!hasAttempts) return 'border-gray-200 hover:border-indigo-300';
    if (avgScore >= 80) return 'border-green-200 hover:border-green-400 bg-green-50/30';
    if (avgScore >= 50) return 'border-yellow-200 hover:border-yellow-400 bg-yellow-50/30';
    return 'border-red-200 hover:border-red-400 bg-red-50/30';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`group flex items-center gap-3 p-3 rounded-xl border-2 transition-all hover:shadow-md cursor-pointer ${getBorderColor()} ${isSelected ? 'ring-2 ring-indigo-500 bg-indigo-50/50' : ''}`}
      onClick={() => onStart(quiz, totalQuestions, 'all', attempts)}
    >
      {/* Checkbox para selección múltiple */}
      {isAdmin && onSelect && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(quiz.id)}
          className="w-4 h-4 text-indigo-600 rounded cursor-pointer flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        />
      )}
      
      {/* Indicador de progreso circular */}
      <div className="relative flex-shrink-0">
        <svg className="w-12 h-12 transform -rotate-90">
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="#e5e7eb"
            strokeWidth="4"
            fill="none"
          />
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke={avgScore >= 80 ? '#22c55e' : avgScore >= 50 ? '#eab308' : avgScore > 0 ? '#ef4444' : '#6366f1'}
            strokeWidth="4"
            fill="none"
            strokeDasharray={`${(progressPercent / 100) * 125.6} 125.6`}
            strokeLinecap="round"
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${hasAttempts ? getScoreColor(avgScore) : 'text-gray-400'}`}>
          {hasAttempts ? `${avgScore}%` : 'Nuevo'}
        </span>
      </div>

      {/* Información del quiz */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-gray-900 truncate">
            {quiz.title}
          </h4>
          {quiz.is_hidden && (
            <Badge variant="outline" className="text-xs bg-gray-100">🔒</Badge>
          )}
        </div>
        
        {/* Stats en línea */}
        <div className="flex items-center gap-3 mt-1 text-xs">
          <span className="flex items-center gap-1 text-gray-500">
            <HelpCircle className="w-3 h-3" />
            {totalQuestions}
          </span>
          
          {hasAttempts && (
            <>
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="w-3 h-3" />
                {uniqueCorrect}
              </span>
              <span className="flex items-center gap-1 text-red-500">
                <XCircle className="w-3 h-3" />
                {uniqueWrong}
              </span>
              <span className="flex items-center gap-1 text-indigo-600">
                <BarChart3 className="w-3 h-3" />
                Mejor: {bestScore}%
              </span>
            </>
          )}
        </div>
      </div>

      {/* Badges de estado */}
      <div className="hidden sm:flex items-center gap-2">
        {hasAttempts ? (
          <>
            <Badge 
              className={`text-xs ${
                avgScore >= 80 
                  ? 'bg-green-100 text-green-700 border-green-300' 
                  : avgScore >= 50 
                    ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                    : 'bg-red-100 text-red-700 border-red-300'
              }`}
            >
              {progressPercent}% completado
            </Badge>
          </>
        ) : (
          <Badge className="bg-indigo-100 text-indigo-700 border-indigo-300 text-xs">
            Sin intentar
          </Badge>
        )}
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        {/* Botón de modo swipe */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onStartSwipe && onStartSwipe(quiz)}
          className="h-8 w-8 text-purple-500 hover:text-purple-700 hover:bg-purple-50"
          title="Modo V/F (deslizar)"
        >
          <Smartphone className="w-4 h-4" />
        </Button>
        
        {isAdmin && (
          <>
            {onMove && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onMove(quiz)}
                className="h-8 w-8 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-amber-600"
                title="Mover quiz"
              >
                <FolderInput className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(quiz)}
              className="h-8 w-8 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-indigo-600"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(quiz.id)}
              className="h-8 w-8 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </>
        )}
        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 transition-colors" />
      </div>
    </motion.div>
  );
}