import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GraduationCap, Folder, BookOpen, X, Plus, Settings, Users } from 'lucide-react';
import QuizSettingsPanel from '../admin/QuizSettingsPanel';

const typeOptions = [
  { value: 'course', label: 'Curso', icon: GraduationCap, description: 'Agrupa carpetas y materias' },
  { value: 'folder', label: 'Carpeta', icon: Folder, description: 'Organiza contenido por temas' },
  { value: 'subject', label: 'Materia', icon: BookOpen, description: 'Contiene cuestionarios' }
];

const defaultColors = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', 
  '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'
];

export default function ContainerEditor({ container, users = [], onSave, onCancel, defaultType = 'folder' }) {
  const [formData, setFormData] = useState({
    name: container?.name || '',
    description: container?.description || '',
    type: container?.type || defaultType,
    color: container?.color || '#6366f1',
    icon: container?.icon || '',
    is_hidden: container?.is_hidden || false,
    visibility: container?.visibility || 'inherit',
    allowed_users: container?.allowed_users || []
  });

  const [newUserEmail, setNewUserEmail] = useState('');

  const handleAddUser = () => {
    if (newUserEmail && !formData.allowed_users.includes(newUserEmail)) {
      setFormData({
        ...formData,
        allowed_users: [...formData.allowed_users, newUserEmail]
      });
      setNewUserEmail('');
    }
  };

  const handleRemoveUser = (email) => {
    setFormData({
      ...formData,
      allowed_users: formData.allowed_users.filter(e => e !== email)
    });
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('El nombre es requerido');
      return;
    }
    onSave(formData);
  };

  const TypeIcon = typeOptions.find(t => t.value === formData.type)?.icon || Folder;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TypeIcon className="w-5 h-5" style={{ color: formData.color }} />
          {container ? 'Editar' : 'Crear'} {typeOptions.find(t => t.value === formData.type)?.label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="general">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="general" className="flex-1">
              <Settings className="w-4 h-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="access" className="flex-1">
              <Users className="w-4 h-4 mr-2" />
              Acceso
            </TabsTrigger>
            {container?.id && (
              <TabsTrigger value="quiz-settings" className="flex-1">
                Opciones Quiz
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            {/* Tipo */}
            <div>
              <Label>Tipo de contenedor</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {typeOptions.map(opt => {
                  const Icon = opt.icon;
                  const isSelected = formData.type === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: opt.value })}
                      className={`p-3 rounded-lg border-2 transition-all text-center ${
                        isSelected 
                          ? 'border-indigo-600 bg-indigo-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className={`w-6 h-6 mx-auto mb-1 ${isSelected ? 'text-indigo-600' : 'text-gray-400'}`} />
                      <p className={`text-sm font-medium ${isSelected ? 'text-indigo-600' : 'text-gray-700'}`}>
                        {opt.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{opt.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Nombre */}
            <div>
              <Label>Nombre *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre del contenedor"
              />
            </div>

            {/* Descripción */}
            <div>
              <Label>Descripción</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción opcional"
                rows={2}
              />
            </div>

            {/* Color e Icono */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Color</Label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {defaultColors.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: c })}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        formData.color === c ? 'ring-2 ring-offset-2 ring-indigo-600 scale-110' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-8 h-8 rounded-full cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <Label>Icono (emoji)</Label>
                <Input
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="📚"
                  className="text-center text-xl"
                  maxLength={2}
                />
              </div>
            </div>

            {/* Oculto */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-sm">Ocultar</p>
                <p className="text-xs text-gray-500">No visible para usuarios normales</p>
              </div>
              <Switch
                checked={formData.is_hidden}
                onCheckedChange={(checked) => setFormData({ ...formData, is_hidden: checked })}
              />
            </div>
          </TabsContent>

          <TabsContent value="access" className="space-y-4">
            {/* Visibilidad */}
            <div>
              <Label>Visibilidad</Label>
              <Select 
                value={formData.visibility} 
                onValueChange={(v) => setFormData({ ...formData, visibility: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inherit">Heredar del padre</SelectItem>
                  <SelectItem value="all">Todos los usuarios</SelectItem>
                  <SelectItem value="specific">Usuarios específicos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Usuarios permitidos */}
            {formData.visibility === 'specific' && (
              <div>
                <Label>Usuarios con acceso</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="email@ejemplo.com"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddUser()}
                  />
                  <Button type="button" onClick={handleAddUser} size="icon">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                {users.length > 0 && (
                  <Select onValueChange={(email) => {
                    if (!formData.allowed_users.includes(email)) {
                      setFormData({
                        ...formData,
                        allowed_users: [...formData.allowed_users, email]
                      });
                    }
                  }}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Seleccionar usuario existente" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.filter(u => !formData.allowed_users.includes(u.email)).map(u => (
                        <SelectItem key={u.id} value={u.email}>
                          {u.full_name || u.username || u.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {formData.allowed_users.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.allowed_users.map(email => (
                      <span 
                        key={email} 
                        className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs"
                      >
                        {email}
                        <button onClick={() => handleRemoveUser(email)} className="hover:text-red-600">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {container?.id && (
            <TabsContent value="quiz-settings">
              <QuizSettingsPanel
                entityType={container.type}
                entityId={container.id}
              />
            </TabsContent>
          )}
        </Tabs>

        <div className="flex gap-2 mt-6">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleSave} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
            {container ? 'Guardar cambios' : 'Crear'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}