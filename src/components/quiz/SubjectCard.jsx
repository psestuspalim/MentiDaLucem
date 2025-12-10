import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FolderOpen, FileText, CheckCircle2, XCircle, Trash2, Pencil, EyeOff, Users, RotateCcw } from 'lucide-react';

export default function SubjectCard({ subject, quizCount, stats, onClick, onDelete, onEdit, isAdmin, onReviewWrong }) {
  const { totalCorrect = 0, totalWrong = 0, totalAnswered = 0 } = stats || {};
  const correctPercentage = totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0;
  const wrongPercentage = totalAnswered > 0 ? (totalWrong / totalAnswered) * 100 : 0;
  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 relative"
      style={{ borderColor: subject.color || '#6366f1' }}
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
                        onEdit(subject);
                      }}
                      className="text-gray-400 hover:text-indigo-600"
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
                        onDelete(subject.id);
                      }}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              )}
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div 
            className="w-16 h-16 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${subject.color || '#6366f1'}20` }}
          >
            <FolderOpen 
              className="w-8 h-8"
              style={{ color: subject.color || '#6366f1' }}
            />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {subject.name}
                              </h3>
                              {subject.is_hidden && (
                                <EyeOff className="w-4 h-4 text-orange-500" />
                              )}
                              {subject.visibility === 'specific' && (
                                <Users className="w-4 h-4 text-blue-500" />
                              )}
                            </div>
            {subject.description && (
              <p className="text-sm text-gray-500 mb-3">
                {subject.description}
              </p>
            )}
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <FileText className="w-4 h-4" />
              <span>{quizCount} cuestionarios</span>
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
                      onReviewWrong(subject.id);
                    }}
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Repasar {totalWrong} incorrectas
                  </Button>
                )}
              </div>
            )}
            </div>
            </div>
            </CardContent>
            </Card>
            );
            }