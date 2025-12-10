import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap, Folder, BookOpen, FileText, 
  CheckCircle2, XCircle, Trash2, Pencil, EyeOff, 
  Users, RotateCcw, ChevronRight 
} from 'lucide-react';

const typeIcons = {
  course: GraduationCap,
  folder: Folder,
  subject: BookOpen
};

const typeLabels = {
  course: 'Curso',
  folder: 'Carpeta',
  subject: 'Materia'
};

export default function ContainerCard({ 
  container, 
  childCount = 0, 
  quizCount = 0,
  stats, 
  onClick, 
  onDelete, 
  onEdit, 
  isAdmin,
  onReviewWrong 
}) {
  const { totalCorrect = 0, totalWrong = 0, totalAnswered = 0 } = stats || {};
  const correctPercentage = totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0;
  const wrongPercentage = totalAnswered > 0 ? (totalWrong / totalAnswered) * 100 : 0;
  
  const Icon = typeIcons[container.type] || Folder;
  const color = container.color || '#6366f1';

  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 relative overflow-hidden"
      style={{ borderColor: color }}
      onClick={onClick}
    >
      {isAdmin && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(container);
              }}
              className="text-gray-400 hover:text-indigo-600 h-8 w-8"
            >
              <Pencil className="w-4 h-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('¿Eliminar este elemento?')) {
                  onDelete(container.id);
                }
              }}
              className="text-gray-400 hover:text-red-600 h-8 w-8"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}

      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <div 
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${color}20` }}
          >
            {container.icon ? (
              <span className="text-xl sm:text-2xl">{container.icon}</span>
            ) : (
              <Icon className="w-6 h-6 sm:w-7 sm:h-7" style={{ color }} />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                {container.name}
              </h3>
              {container.is_hidden && (
                <EyeOff className="w-4 h-4 text-orange-500 flex-shrink-0" />
              )}
              {container.visibility === 'specific' && (
                <Users className="w-4 h-4 text-blue-500 flex-shrink-0" />
              )}
            </div>
            
            {container.description && (
              <p className="text-xs sm:text-sm text-gray-500 mb-2 line-clamp-2">
                {container.description}
              </p>
            )}
            
            <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-600 flex-wrap">
              <Badge variant="outline" className="text-xs" style={{ borderColor: color, color }}>
                {typeLabels[container.type]}
              </Badge>
              
              {childCount > 0 && (
                <span className="flex items-center gap-1">
                  <Folder className="w-3 h-3" />
                  {childCount}
                </span>
              )}
              
              {quizCount > 0 && (
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {quizCount}
                </span>
              )}
            </div>

            {totalAnswered > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                    {totalCorrect}
                  </span>
                  <span className="flex items-center gap-1">
                    <XCircle className="w-3 h-3 text-red-600" />
                    {totalWrong}
                  </span>
                </div>
                <div className="flex h-2 rounded-full overflow-hidden bg-gray-200">
                  <div 
                    className="bg-green-500 transition-all duration-300"
                    style={{ width: `${correctPercentage}%` }}
                  />
                  <div 
                    className="bg-red-500 transition-all duration-300"
                    style={{ width: `${wrongPercentage}%` }}
                  />
                </div>
                {totalWrong > 0 && onReviewWrong && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 text-xs h-7 border-red-200 text-red-600 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReviewWrong(container.id);
                    }}
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Repasar {totalWrong} incorrectas
                  </Button>
                )}
              </div>
            )}
          </div>
          
          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </CardContent>
    </Card>
  );
}