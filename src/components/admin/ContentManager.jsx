import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Trash2, Search, GraduationCap, Folder, BookOpen, 
  CheckSquare, Square, Eye, EyeOff, MoreVertical,
  ChevronRight, AlertTriangle, X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export default function ContentManager({ 
  courses, 
  folders, 
  subjects, 
  quizzes,
  onDeleteCourses,
  onDeleteFolders,
  onDeleteSubjects,
  onUpdateCourse,
  onUpdateFolder,
  onUpdateSubject,
  onClose 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [selectedFolders, setSelectedFolders] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, type: null, items: [] });

  const filteredCourses = courses.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredFolders = folders.filter(f => 
    f.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredSubjects = subjects.filter(s => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSelected = selectedCourses.length + selectedFolders.length + selectedSubjects.length;

  const toggleCourse = (id) => {
    setSelectedCourses(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleFolder = (id) => {
    setSelectedFolders(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSubject = (id) => {
    setSelectedSubjects(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAll = (type) => {
    if (type === 'courses') {
      setSelectedCourses(selectedCourses.length === filteredCourses.length ? [] : filteredCourses.map(c => c.id));
    } else if (type === 'folders') {
      setSelectedFolders(selectedFolders.length === filteredFolders.length ? [] : filteredFolders.map(f => f.id));
    } else if (type === 'subjects') {
      setSelectedSubjects(selectedSubjects.length === filteredSubjects.length ? [] : filteredSubjects.map(s => s.id));
    }
  };

  const clearSelection = () => {
    setSelectedCourses([]);
    setSelectedFolders([]);
    setSelectedSubjects([]);
  };

  const handleBulkDelete = () => {
    const items = [];
    if (selectedCourses.length > 0) items.push({ type: 'courses', ids: selectedCourses, count: selectedCourses.length });
    if (selectedFolders.length > 0) items.push({ type: 'folders', ids: selectedFolders, count: selectedFolders.length });
    if (selectedSubjects.length > 0) items.push({ type: 'subjects', ids: selectedSubjects, count: selectedSubjects.length });
    
    setDeleteDialog({ open: true, type: 'bulk', items });
  };

  const confirmDelete = async () => {
    const { type, items } = deleteDialog;
    
    try {
      if (type === 'bulk') {
        for (const item of items) {
          if (item.type === 'courses') await onDeleteCourses(item.ids);
          if (item.type === 'folders') await onDeleteFolders(item.ids);
          if (item.type === 'subjects') await onDeleteSubjects(item.ids);
        }
      } else {
        if (type === 'course') await onDeleteCourses(items);
        if (type === 'folder') await onDeleteFolders(items);
        if (type === 'subject') await onDeleteSubjects(items);
      }
      
      clearSelection();
      toast.success('Elementos eliminados correctamente');
    } catch (error) {
      toast.error('Error al eliminar');
    }
    
    setDeleteDialog({ open: false, type: null, items: [] });
  };

  const toggleVisibility = async (type, item) => {
    const newHidden = !item.is_hidden;
    if (type === 'course') await onUpdateCourse(item.id, { is_hidden: newHidden });
    if (type === 'folder') await onUpdateFolder(item.id, { is_hidden: newHidden });
    if (type === 'subject') await onUpdateSubject(item.id, { is_hidden: newHidden });
    toast.success(newHidden ? 'Oculto' : 'Visible');
  };

  const getQuizCount = (subjectId) => quizzes.filter(q => q.subject_id === subjectId).length;
  const getSubjectCount = (folderId) => subjects.filter(s => s.folder_id === folderId).length;
  const getCourseSubjectCount = (courseId) => subjects.filter(s => s.course_id === courseId).length;

  const ItemRow = ({ item, type, isSelected, onToggle, onDelete }) => (
    <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
      isSelected ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-gray-200 hover:border-gray-300'
    }`}>
      <Checkbox 
        checked={isSelected} 
        onCheckedChange={onToggle}
        className="shrink-0"
      />
      
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
        type === 'course' ? 'bg-indigo-100' : type === 'folder' ? 'bg-amber-100' : 'bg-emerald-100'
      }`}>
        {type === 'course' && <GraduationCap className="w-4 h-4 text-indigo-600" />}
        {type === 'folder' && <Folder className="w-4 h-4 text-amber-600" />}
        {type === 'subject' && <BookOpen className="w-4 h-4 text-emerald-600" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 truncate">{item.name}</span>
          {item.is_hidden && (
            <Badge variant="outline" className="text-xs text-gray-500">
              <EyeOff className="w-3 h-3 mr-1" />
              Oculto
            </Badge>
          )}
        </div>
        <div className="text-xs text-gray-500">
          {type === 'course' && `${getCourseSubjectCount(item.id)} materias`}
          {type === 'folder' && `${getSubjectCount(item.id)} materias`}
          {type === 'subject' && `${getQuizCount(item.id)} cuestionarios`}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => toggleVisibility(type, item)}>
            {item.is_hidden ? (
              <><Eye className="w-4 h-4 mr-2" /> Mostrar</>
            ) : (
              <><EyeOff className="w-4 h-4 mr-2" /> Ocultar</>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setDeleteDialog({ open: true, type, items: [item.id] })}
            className="text-red-600"
          >
            <Trash2 className="w-4 h-4 mr-2" /> Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  const SectionHeader = ({ title, icon: Icon, count, selectedCount, onSelectAll, allSelected }) => (
    <div className="flex items-center justify-between py-2 px-1">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-gray-500" />
        <span className="font-medium text-gray-700">{title}</span>
        <Badge variant="secondary" className="text-xs">{count}</Badge>
        {selectedCount > 0 && (
          <Badge className="bg-indigo-100 text-indigo-700 text-xs">{selectedCount} seleccionados</Badge>
        )}
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onSelectAll}
        className="text-xs h-7"
      >
        {allSelected ? 'Deseleccionar' : 'Seleccionar todo'}
      </Button>
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Gestión de Contenido</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          {totalSelected > 0 && (
            <div className="flex items-center gap-2">
              <Badge className="bg-indigo-600">{totalSelected} seleccionados</Badge>
              <Button variant="outline" size="sm" onClick={clearSelection}>
                Limpiar
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleBulkDelete}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Eliminar
              </Button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 border-b">
          {[
            { id: 'all', label: 'Todo' },
            { id: 'courses', label: 'Cursos', count: courses.length },
            { id: 'folders', label: 'Carpetas', count: folders.length },
            { id: 'subjects', label: 'Materias', count: subjects.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1 text-xs text-gray-400">({tab.count})</span>
              )}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="max-h-[500px] overflow-y-auto space-y-6">
        {/* Courses */}
        {(activeTab === 'all' || activeTab === 'courses') && filteredCourses.length > 0 && (
          <div>
            <SectionHeader 
              title="Cursos" 
              icon={GraduationCap}
              count={filteredCourses.length}
              selectedCount={selectedCourses.length}
              onSelectAll={() => selectAll('courses')}
              allSelected={selectedCourses.length === filteredCourses.length}
            />
            <div className="space-y-2">
              {filteredCourses.map(course => (
                <ItemRow
                  key={course.id}
                  item={course}
                  type="course"
                  isSelected={selectedCourses.includes(course.id)}
                  onToggle={() => toggleCourse(course.id)}
                  onDelete={() => setDeleteDialog({ open: true, type: 'course', items: [course.id] })}
                />
              ))}
            </div>
          </div>
        )}

        {/* Folders */}
        {(activeTab === 'all' || activeTab === 'folders') && filteredFolders.length > 0 && (
          <div>
            <SectionHeader 
              title="Carpetas" 
              icon={Folder}
              count={filteredFolders.length}
              selectedCount={selectedFolders.length}
              onSelectAll={() => selectAll('folders')}
              allSelected={selectedFolders.length === filteredFolders.length}
            />
            <div className="space-y-2">
              {filteredFolders.map(folder => (
                <ItemRow
                  key={folder.id}
                  item={folder}
                  type="folder"
                  isSelected={selectedFolders.includes(folder.id)}
                  onToggle={() => toggleFolder(folder.id)}
                  onDelete={() => setDeleteDialog({ open: true, type: 'folder', items: [folder.id] })}
                />
              ))}
            </div>
          </div>
        )}

        {/* Subjects */}
        {(activeTab === 'all' || activeTab === 'subjects') && filteredSubjects.length > 0 && (
          <div>
            <SectionHeader 
              title="Materias" 
              icon={BookOpen}
              count={filteredSubjects.length}
              selectedCount={selectedSubjects.length}
              onSelectAll={() => selectAll('subjects')}
              allSelected={selectedSubjects.length === filteredSubjects.length}
            />
            <div className="space-y-2">
              {filteredSubjects.map(subject => (
                <ItemRow
                  key={subject.id}
                  item={subject}
                  type="subject"
                  isSelected={selectedSubjects.includes(subject.id)}
                  onToggle={() => toggleSubject(subject.id)}
                  onDelete={() => setDeleteDialog({ open: true, type: 'subject', items: [subject.id] })}
                />
              ))}
            </div>
          </div>
        )}

        {filteredCourses.length === 0 && filteredFolders.length === 0 && filteredSubjects.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No se encontraron elementos
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, type: null, items: [] })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Confirmar eliminación
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog.type === 'bulk' ? (
                <div className="space-y-2">
                  <p>¿Estás seguro de eliminar los siguientes elementos?</p>
                  <ul className="list-disc list-inside text-sm">
                    {deleteDialog.items.map((item, idx) => (
                      <li key={idx}>
                        {item.count} {item.type === 'courses' ? 'cursos' : item.type === 'folders' ? 'carpetas' : 'materias'}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p>¿Estás seguro de eliminar este elemento? Esta acción no se puede deshacer.</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}