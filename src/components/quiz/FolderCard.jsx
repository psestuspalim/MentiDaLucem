import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Folder, Trash2, Pencil, EyeOff } from 'lucide-react';

export default function FolderCard({ folder, itemCount, isAdmin, onDelete, onEdit, onClick }) {
  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-amber-300"
      style={{ borderColor: folder.color || '#f59e0b' }}
      onClick={onClick}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: (folder.color || '#f59e0b') + '20' }}
            >
              <Folder className="w-6 h-6" style={{ color: folder.color || '#f59e0b' }} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-gray-900 truncate">{folder.name}</h3>
                {folder.is_hidden && (
                  <EyeOff className="w-4 h-4 text-orange-500" />
                )}
              </div>
              {folder.description && (
                <p className="text-sm text-gray-500 line-clamp-1">{folder.description}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {itemCount} {itemCount === 1 ? 'elemento' : 'elementos'}
              </p>
            </div>
          </div>
          
          {isAdmin && (
            <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); onEdit(folder); }}
                className="text-gray-400 hover:text-indigo-600 h-8 w-8"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); onDelete(folder.id); }}
                className="text-gray-400 hover:text-red-600 h-8 w-8"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}