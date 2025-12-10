import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { X, Save, Users, Search, Settings } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import QuizSettingsPanel from '../admin/QuizSettingsPanel';

const EMOJI_OPTIONS = ['📚', '🎓', '🔬', '💊', '🏥', '🧬', '🩺', '📖', '✏️', '🎯', '💡', '⚕️'];

export default function CourseEditor({ course, users = [], onSave, onCancel }) {
  const [editedCourse, setEditedCourse] = useState({
    name: course?.name || '',
    description: course?.description || '',
    color: course?.color || '#6366f1',
    icon: course?.icon || '📚',
    is_hidden: course?.is_hidden || false,
    visibility: course?.visibility || 'all',
    allowed_users: course?.allowed_users || []
  });
  const [searchUser, setSearchUser] = useState('');

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchUser.toLowerCase())
  );

  const toggleUser = (email) => {
    const current = editedCourse.allowed_users || [];
    if (current.includes(email)) {
      setEditedCourse({ ...editedCourse, allowed_users: current.filter(e => e !== email) });
    } else {
      setEditedCourse({ ...editedCourse, allowed_users: [...current, email] });
    }
  };

  const selectAll = () => {
    setEditedCourse({ ...editedCourse, allowed_users: users.map(u => u.email) });
  };

  const selectNone = () => {
    setEditedCourse({ ...editedCourse, allowed_users: [] });
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{course?.id ? 'Editar Curso' : 'Nuevo Curso'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="quiz-settings" disabled={!course?.id}>
              <Settings className="w-4 h-4 mr-2" />
              Vista Quiz
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-6">
        {/* Información básica */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label>Nombre del curso</Label>
            <Input
              value={editedCourse.name}
              onChange={(e) => setEditedCourse({ ...editedCourse, name: e.target.value })}
              placeholder="Ej: Semestre Selectivo"
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Descripción</Label>
            <Input
              value={editedCourse.description}
              onChange={(e) => setEditedCourse({ ...editedCourse, description: e.target.value })}
              placeholder="Descripción opcional"
            />
          </div>
          <div>
            <Label>Color</Label>
            <div className="flex gap-2">
              <input
                type="color"
                value={editedCourse.color}
                onChange={(e) => setEditedCourse({ ...editedCourse, color: e.target.value })}
                className="w-12 h-10 rounded border cursor-pointer"
              />
              <Input
                value={editedCourse.color}
                onChange={(e) => setEditedCourse({ ...editedCourse, color: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>
          <div>
            <Label>Icono</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setEditedCourse({ ...editedCourse, icon: emoji })}
                  className={`w-10 h-10 rounded-lg border-2 text-xl flex items-center justify-center transition-all ${
                    editedCourse.icon === emoji 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Visibilidad */}
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <Label>Ocultar curso</Label>
              <p className="text-xs text-gray-500">Solo visible para administradores</p>
            </div>
            <Switch
              checked={editedCourse.is_hidden}
              onCheckedChange={(checked) => setEditedCourse({ ...editedCourse, is_hidden: checked })}
            />
          </div>

          <div className="space-y-3">
            <Label>Visibilidad</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={editedCourse.visibility === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEditedCourse({ ...editedCourse, visibility: 'all' })}
              >
                Todos los usuarios
              </Button>
              <Button
                type="button"
                variant={editedCourse.visibility === 'specific' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEditedCourse({ ...editedCourse, visibility: 'specific' })}
              >
                <Users className="w-4 h-4 mr-1" />
                Usuarios específicos
              </Button>
            </div>
          </div>

          {editedCourse.visibility === 'specific' && (
            <div className="space-y-3 mt-4 p-3 bg-white rounded-lg border">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Seleccionar usuarios ({editedCourse.allowed_users?.length || 0})
                </Label>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={selectAll}>
                    Todos
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={selectNone}>
                    Ninguno
                  </Button>
                </div>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  placeholder="Buscar usuario..."
                  className="pl-9"
                />
              </div>

              <ScrollArea className="h-48 border rounded-lg">
                <div className="p-2 space-y-1">
                  {filteredUsers.map((user) => (
                    <label
                      key={user.email}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <Checkbox
                        checked={editedCourse.allowed_users?.includes(user.email)}
                        onCheckedChange={() => toggleUser(user.email)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {user.username || user.full_name || 'Sin nombre'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </ScrollArea>

              {editedCourse.allowed_users?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {editedCourse.allowed_users.slice(0, 5).map((email) => {
                    const user = users.find(u => u.email === email);
                    return (
                      <Badge key={email} variant="secondary" className="text-xs">
                        {user?.username || email.split('@')[0]}
                        <button onClick={() => toggleUser(email)} className="ml-1">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    );
                  })}
                  {editedCourse.allowed_users.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{editedCourse.allowed_users.length - 5} más
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button 
            onClick={() => onSave(editedCourse)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Guardar
          </Button>
        </div>
          </TabsContent>
          
          <TabsContent value="quiz-settings">
            {course?.id && (
              <QuizSettingsPanel
                entityType="course"
                entityId={course.id}
                entityName={course.name}
              />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}