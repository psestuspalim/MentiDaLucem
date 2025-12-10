import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Folder, BookOpen, FileText, GraduationCap, X, ChevronDown,
  ArrowRightLeft, Move
} from 'lucide-react';
import { canMoveItemToTarget } from '../utils/contentTree';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const typeIcons = {
  course: GraduationCap,
  folder: Folder,
  subject: BookOpen,
  quiz: FileText
};

export default function FileExplorer({
  containers = [],
  quizzes = [],
  onMoveItems,
  onItemClick,
  isAdmin = false
}) {
  const [selectedItems, setSelectedItems] = useState([]);
  const [expandedContainers, setExpandedContainers] = useState(new Set());
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState(null);

  // --- Selection Logic ---
  const toggleSelect = (type, id) => {
    const key = `${type}-${id}`;
    setSelectedItems(prev =>
      prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key]
    );
  };

  const clearSelection = () => setSelectedItems([]);

  // --- Navigation Logic (Strict Hierarchy) ---
  // Course -> Subject -> Folder -> Quiz
  const getChildren = (containerId, containerType) => {
    // 1. Subjects lives in Courses
    if (containerType === 'course') {
      return containers.filter(c => c.type === 'subject' && c.parent_id === containerId);
    }
    // 2. Folders lives in Subjects or other Folders
    if (containerType === 'subject') {
      return containers.filter(c => c.type === 'folder' && c.parent_id === containerId);
    }
    // 3. Quizzes live in Folders (and subfolders in folders)
    if (containerType === 'folder') {
      const subfolders = containers.filter(c => c.type === 'folder' && c.parent_id === containerId);
      const childQuizzes = quizzes.filter(q => q.folder_id === containerId); // Assuming prepared data puts folder_id
      // Fallback: Check if we are using the normalized parent_id for quizzes too? 
      // Usually quizzes have specific fields. Let's assume standard 'folder_id'.
      return [...subfolders, ...childQuizzes];
    }
    return [];
  };

  const toggleExpand = (containerId) => {
    setExpandedContainers(prev => {
      const next = new Set(prev);
      next.has(containerId) ? next.delete(containerId) : next.add(containerId);
      return next;
    });
  };

  // --- Drag & Drop ---
  const handleDragEnd = async (result) => {
    const { draggableId, destination, source } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const [dragType, dragId] = draggableId.split('-');
    const [destType, destId] = destination.droppableId.split('-');

    // Strict Validation
    let targetType = destType === 'root' ? null :
      (containers.find(c => c.id === destId)?.type || destType); // Resolve real type if possible

    // Special case: Dropping into Expanded area of a container uses "containerType-containerId"
    // The droppableId is constructed as `${type}-${item.id}` in renderItem

    if (destType === 'root') {
      // Only courses can be root in strict mode
      if (dragType !== 'course') {
        toast.error(`Solo los cursos pueden estar en la raíz`);
        return;
      }
      targetType = null;
    }

    if (!canMoveItemToTarget(dragType, targetType)) {
      toast.error(`No puedes mover ${dragType} dentro de ${targetType || 'raíz'}`);
      return;
    }

    // Prepare Items
    const itemsToMove = selectedItems.includes(draggableId)
      ? selectedItems.map(k => { const [t, i] = k.split('-'); return { type: t, id: i }; })
      : [{ type: dragType, id: dragId }];

    try {
      await onMoveItems(itemsToMove, destId === 'root' ? null : destId, destId === 'root' ? null : targetType);
      clearSelection();
      toast.success('Elementos movidos');
    } catch (error) {
      console.error(error);
      toast.error('Error al mover');
    }
  };

  // --- Transfer Mode ---
  const handleTransfer = async () => {
    if (!transferTarget) return;
    const [targetType, targetId] = transferTarget.split('-');

    const itemsToMove = selectedItems.map(k => {
      const [t, i] = k.split('-');
      return { type: t, id: i };
    });

    // Validate all
    const invalid = itemsToMove.find(i => !canMoveItemToTarget(i.type, targetType));
    if (invalid) {
      toast.error(`No se puede mover ${invalid.type} a ${targetType}`);
      return;
    }

    try {
      await onMoveItems(itemsToMove, targetId, targetType);
      clearSelection();
      setTransferDialogOpen(false);
      setTransferTarget(null);
      toast.success('Transferencia completada');
    } catch (e) {
      toast.error('Error en transferencia');
    }
  };

  // --- Renders ---
  const renderItem = (item, type, index) => {
    const Icon = typeIcons[type] || FileText;
    const key = `${type}-${item.id}`;
    const isSelected = selectedItems.includes(key);
    const isExpanded = expandedContainers.has(item.id);
    const children = type !== 'quiz' ? getChildren(item.id, type) : [];

    return (
      <Draggable draggableId={key} index={index} key={key} isDragDisabled={!isAdmin}>
        {(provided, snapshot) => (
          <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="mb-2">
            <div className={`
              flex items-center gap-2 p-2 rounded-md border transition-colors
              ${isSelected ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-gray-200'}
              ${snapshot.isDragging ? 'shadow-lg opacity-80' : 'hover:border-indigo-200'}
            `}>
              {isAdmin && (
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleSelect(type, item.id)}
                  className="mr-2"
                />
              )}

              {children.length > 0 || type === 'course' || type === 'subject' || type === 'folder' ? (
                <Button variant="ghost" size="icon" className="h-6 w-6 p-0" onClick={() => toggleExpand(item.id)}>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                </Button>
              ) : <div className="w-6" />}

              <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => onItemClick && onItemClick(type, item)}>
                <Icon className={`w-4 h-4 ${type === 'course' ? 'text-blue-600' : type === 'subject' ? 'text-green-600' : type === 'folder' ? 'text-amber-500' : 'text-gray-500'}`} />
                <span className="text-sm font-medium">{item.name || item.title}</span>
              </div>
            </div>

            <AnimatePresence>
              {isExpanded && (children.length > 0 || type !== 'quiz') && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="pl-6 pt-2"
                >
                  <Droppable droppableId={`${type}-${item.id}`} type="ITEM">
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1 min-h-[10px] border-l-2 border-dashed border-gray-100 pl-2">
                        {children.map((child, idx) => {
                          const childType = child.folder_id ? 'quiz' : child.type;
                          // Note: Using child.type if available, otherwise guessing quiz if folder_id present.
                          // Better to use strict types from inputs.
                          const finalType = child.title ? 'quiz' : child.type;
                          return renderItem(child, finalType, idx);
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </Draggable>
    );
  };

  // Root = Courses only
  const rootCourses = containers.filter(c => c.type === 'course');

  return (
    <>
      <div className="flex flex-col gap-4">
        {isAdmin && selectedItems.length > 0 && (
          <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg flex items-center justify-between sticky top-0 z-10 shadow-sm">
            <div className="flex items-center gap-2">
              <Badge className="bg-indigo-600 hover:bg-indigo-700 transition-colors">{selectedItems.length} seleccionados</Badge>
              <span className="text-xs text-brand-text-secondary">Listos para mover</span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="default" onClick={() => setTransferDialogOpen(true)}>
                <Move className="w-4 h-4 mr-2" />
                Mover a...
              </Button>
              <Button size="sm" variant="ghost" onClick={clearSelection}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="root" type="ITEM">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                {rootCourses.map((course, idx) => renderItem(course, 'course', idx))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Transfer Dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mover {selectedItems.length} elementos</DialogTitle>
            <DialogDescription>
              Selecciona el destino para mover los elementos seleccionados.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 h-[300px] overflow-y-auto border rounded-md p-2">
            <p className="text-sm text-gray-500 mb-2">Selecciona el destino:</p>
            {/* Recursive tree for selection */}
            {containers.filter(c => c.type === 'course').map(course => (
              <div key={course.id} className="mb-1">
                <div
                  className={`p-2 rounded cursor-pointer hover:bg-gray-100 flex items-center gap-2 ${transferTarget === `course-${course.id}` ? 'bg-indigo-100' : ''}`}
                  onClick={() => setTransferTarget(`course-${course.id}`)}
                >
                  <GraduationCap className="w-4 h-4" /> {course.name}
                </div>
                {/* Subjects */}
                {containers.filter(s => s.type === 'subject' && s.parent_id === course.id).map(subject => (
                  <div key={subject.id} className="ml-4 mb-1">
                    <div
                      className={`p-2 rounded cursor-pointer hover:bg-gray-100 flex items-center gap-2 ${transferTarget === `subject-${subject.id}` ? 'bg-indigo-100' : ''}`}
                      onClick={() => setTransferTarget(`subject-${subject.id}`)}
                    >
                      <BookOpen className="w-4 h-4 text-green-600" /> {subject.name}
                    </div>
                    {/* Folders */}
                    {containers.filter(f => f.type === 'folder' && f.parent_id === subject.id).map(folder => (
                      <div key={folder.id} className="ml-8 mb-1">
                        <div
                          className={`p-2 rounded cursor-pointer hover:bg-gray-100 flex items-center gap-2 ${transferTarget === `folder-${folder.id}` ? 'bg-indigo-100' : ''}`}
                          onClick={() => setTransferTarget(`folder-${folder.id}`)}
                        >
                          <Folder className="w-4 h-4 text-amber-500" /> {folder.name}
                        </div>
                        {/* Subfolders? */}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleTransfer} disabled={!transferTarget}>Mover</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}