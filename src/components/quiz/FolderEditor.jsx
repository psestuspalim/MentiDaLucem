import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { X, UserPlus, Settings } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import QuizSettingsPanel from '../admin/QuizSettingsPanel';

export default function FolderEditor({ folder, users = [], onSave, onCancel }) {
  const [editedFolder, setEditedFolder] = useState({
    name: folder.name || '',
    description: folder.description || '',
    color: folder.color || '#f59e0b',
    is_hidden: folder.is_hidden || false,
    visibility: folder.visibility || 'all',
    allowed_users: folder.allowed_users || []
  });

  const [newUserEmail, setNewUserEmail] = useState('');

  const handleAddUser = () => {
    if (newUserEmail && !editedFolder.allowed_users.includes(newUserEmail)) {
      setEditedFolder({
        ...editedFolder,
        allowed_users: [...editedFolder.allowed_users, newUserEmail]
      });
      setNewUserEmail('');
    }
  };

  const handleRemoveUser = (email) => {
    setEditedFolder({
      ...editedFolder,
      allowed_users: editedFolder.allowed_users.filter(e => e !== email)
    });
  };

  const handleSelectUser = (email) => {
    if (email && !editedFolder.allowed_users.includes(email)) {
      setEditedFolder({
        ...editedFolder,
        allowed_users: [...editedFolder.allowed_users, email]
      });
    }
  };

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Editar carpeta</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="quiz-settings" disabled={!folder?.id}>
              <Settings className="w-4 h-4 mr-2" />
              Vista Quiz
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4">
        <div>
          <Label>Nombre</Label>
          <Input
            value={editedFolder.name}
            onChange={(e) => setEditedFolder({ ...editedFolder, name: e.target.value })}
          />
        </div>
        
        <div>
          <Label>Descripción</Label>
          <Input
            value={editedFolder.description}
            onChange={(e) => setEditedFolder({ ...editedFolder, description: e.target.value })}
          />
        </div>
        
        <div>
          <Label>Color</Label>
          <input
            type="color"
            value={editedFolder.color}
            onChange={(e) => setEditedFolder({ ...editedFolder, color: e.target.value })}
            className="w-full h-10 rounded-md border cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Ocultar carpeta</Label>
          <Switch
            checked={editedFolder.is_hidden}
            onCheckedChange={(checked) => setEditedFolder({ ...editedFolder, is_hidden: checked })}
          />
        </div>

        <div className="space-y-3">
          <Label>Visibilidad</Label>
          <RadioGroup
            value={editedFolder.visibility}
            onValueChange={(value) => setEditedFolder({ ...editedFolder, visibility: value })}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all" className="font-normal">Todos los usuarios</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="specific" id="specific" />
              <Label htmlFor="specific" className="font-normal">Usuarios específicos</Label>
            </div>
          </RadioGroup>
        </div>

        {editedFolder.visibility === 'specific' && (
          <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
            <Label>Usuarios con acceso</Label>
            
            {/* Lista de usuarios permitidos */}
            <div className="flex flex-wrap gap-2">
              {editedFolder.allowed_users.map((email) => (
                <Badge key={email} variant="secondary" className="flex items-center gap-1">
                  {email}
                  <button onClick={() => handleRemoveUser(email)}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              {editedFolder.allowed_users.length === 0 && (
                <span className="text-sm text-gray-500">No hay usuarios agregados</span>
              )}
            </div>

            {/* Agregar por email */}
            <div className="flex gap-2">
              <Input
                placeholder="Email del usuario"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddUser()}
              />
              <Button type="button" variant="outline" onClick={handleAddUser}>
                <UserPlus className="w-4 h-4" />
              </Button>
            </div>

            {/* Seleccionar de lista */}
            {users.length > 0 && (
              <div>
                <Label className="text-xs text-gray-500">O seleccionar de usuarios registrados:</Label>
                <Select onValueChange={handleSelectUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter(u => !editedFolder.allowed_users.includes(u.email))
                      .map((user) => (
                        <SelectItem key={user.id} value={user.email}>
                          {user.full_name || user.email}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
          <Button
            onClick={() => onSave(editedFolder)}
            className="flex-1 bg-amber-500 hover:bg-amber-600"
          >
            Guardar
          </Button>
        </div>
          </TabsContent>
          
          <TabsContent value="quiz-settings">
            {folder?.id && (
              <QuizSettingsPanel
                entityType="folder"
                entityId={folder.id}
                entityName={folder.name}
              />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}