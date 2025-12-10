import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, GraduationCap, Users, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CourseCard({ course, subjectCount, isAdmin, onEdit, onDelete, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        onClick={onClick}
        className="cursor-pointer hover:shadow-lg transition-all border-l-4 overflow-hidden"
        style={{ borderLeftColor: course.color || '#6366f1' }}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: `${course.color}20` || '#6366f120' }}
              >
                {course.icon || '📚'}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  {course.name}
                  {course.is_hidden && <EyeOff className="w-4 h-4 text-gray-400" />}
                </h3>
                {course.description && (
                  <p className="text-sm text-gray-500 line-clamp-1">{course.description}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    <GraduationCap className="w-3 h-3 mr-1" />
                    {subjectCount} materias
                  </Badge>
                  {course.visibility === 'specific' && (
                    <Badge variant="outline" className="text-xs text-purple-600 border-purple-300">
                      <Users className="w-3 h-3 mr-1" />
                      {course.allowed_users?.length || 0} usuarios
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            {isAdmin && (
              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(course)}
                  className="h-8 w-8 text-gray-400 hover:text-indigo-600"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(course.id)}
                  className="h-8 w-8 text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}