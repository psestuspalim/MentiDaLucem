import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Folder, ChevronRight, ChevronDown, Search, 
  GraduationCap, BookOpen, Check, FolderInput
} from 'lucide-react';

const typeIcons = {
  course: GraduationCap,
  folder: Folder,
  subject: BookOpen
};

export default function MoveQuizModal({ 
  open, 
  onClose, 
  quiz, 
  containers, 
  onMove 
}) {
  const [selectedId, setSelectedId] = useState(quiz?.subject_id || null);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [isMoving, setIsMoving] = useState(false);

  // Build tree structure
  const containerTree = useMemo(() => {
    const buildTree = (parentId = null) => {
      return containers
        .filter(c => c.parent_id === parentId)
        .map(c => ({
          ...c,
          children: buildTree(c.id)
        }));
    };
    return buildTree(null);
  }, [containers]);

  // Filter containers by search
  const filteredContainers = useMemo(() => {
    if (!search.trim()) return containerTree;
    
    const searchLower = search.toLowerCase();
    const matchingIds = new Set();
    
    // Find all matching containers and their ancestors
    const findMatches = (items, ancestors = []) => {
      items.forEach(item => {
        if (item.name.toLowerCase().includes(searchLower)) {
          matchingIds.add(item.id);
          ancestors.forEach(id => matchingIds.add(id));
        }
        findMatches(item.children, [...ancestors, item.id]);
      });
    };
    
    findMatches(containerTree);
    
    // Filter tree to only show matching branches
    const filterTree = (items) => {
      return items
        .filter(item => matchingIds.has(item.id))
        .map(item => ({
          ...item,
          children: filterTree(item.children)
        }));
    };
    
    return filterTree(containerTree);
  }, [containerTree, search]);

  const toggleExpand = (id) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const handleMove = async () => {
    if (!selectedId || selectedId === quiz?.subject_id) return;
    
    setIsMoving(true);
    try {
      await onMove(quiz.id, selectedId);
      onClose();
    } catch (error) {
      console.error('Error moving quiz:', error);
      alert('Error al mover el quiz');
    } finally {
      setIsMoving(false);
    }
  };

  const renderItem = (item, level = 0) => {
    const Icon = typeIcons[item.type] || Folder;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedIds.has(item.id) || search.trim();
    const isSelected = selectedId === item.id;
    const isCurrent = quiz?.subject_id === item.id;

    return (
      <div key={item.id}>
        <div
          className={`flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors ${
            isSelected 
              ? 'bg-indigo-100 border-2 border-indigo-500' 
              : 'hover:bg-gray-100 border-2 border-transparent'
          } ${isCurrent ? 'opacity-50' : ''}`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => !isCurrent && setSelectedId(item.id)}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(item.id);
              }}
              className="p-0.5 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>
          ) : (
            <div className="w-5" />
          )}
          
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${item.color || '#6366f1'}20` }}
          >
            {item.icon ? (
              <span className="text-sm">{item.icon}</span>
            ) : (
              <Icon className="w-4 h-4" style={{ color: item.color || '#6366f1' }} />
            )}
          </div>
          
          <span className={`flex-1 text-sm truncate ${isSelected ? 'font-medium' : ''}`}>
            {item.name}
          </span>
          
          {isCurrent && (
            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
              Actual
            </span>
          )}
          
          {isSelected && !isCurrent && (
            <Check className="w-4 h-4 text-indigo-600" />
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {item.children.map(child => renderItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderInput className="w-5 h-5 text-indigo-600" />
            Mover Quiz
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-600">Moviendo:</p>
            <p className="font-medium truncate">{quiz?.title}</p>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar destino..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <ScrollArea className="h-[300px] border rounded-lg p-2">
            {filteredContainers.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No se encontraron contenedores
              </p>
            ) : (
              filteredContainers.map(item => renderItem(item))
            )}
          </ScrollArea>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={handleMove} 
              disabled={!selectedId || selectedId === quiz?.subject_id || isMoving}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              {isMoving ? 'Moviendo...' : 'Mover aquí'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}