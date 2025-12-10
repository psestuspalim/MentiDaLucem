import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Save, X, Users, Globe, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import QuizSettingsPanel from '../admin/QuizSettingsPanel';

export default function SubjectEditor({ subject, users = [], onSave, onCancel }) {
  const [edited, setEdited] = useState({
    ...subject,
    is_hidden: subject.is_hidden || false,
    visibility: subject.visibility || 'all',
    allowed_users: subject.allowed_users || []
  });
  const [newUserEmail, setNewUserEmail] = useState('');

  const addUser = () => {
    const email = newUserEmail.trim().toLowerCase();
    if (email && !edited.allowed_users.includes(email)) {
      setEdited({ ...edited, allowed_users: [...edited.allowed_users, email] });
      setNewUserEmail('');
    }
  };

  const removeUser = (email) => {
    setEdited({ ...edited, allowed_users: edited.allowed_users.filter(u => u !== email) });
  };

  const selectFromList = (email) => {
    if (!edited.allowed_users.includes(email)) {
      setEdited({ ...edited, allowed_users: [...edited.allowed_users, email] });
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Editar Materia</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="quiz-settings" disabled={!subject?.id}>
              <Settings className="w-4 h-4 mr-2" />
              Vista Quiz
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-6">
        <div>
          <Label>Nombre</Label>
          <Input
            value={edited.name}
            onChange={(e) => setEdited({ ...edited, name: e.target.value })}
          />
        </div>

        <div>
          <Label>Descripción</Label>
          <Input
            value={edited.description || ''}
            onChange={(e) => setEdited({ ...edited, description: e.target.value })}
          />
        </div>

        <div>
          <Label>Color</Label>
          <input
            type="color"
            value={edited.color || '#6366f1'}
            onChange={(e) => setEdited({ ...edited, color: e.target.value })}
            className="w-full h-10 rounded-md border cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <Label>Ocultar materia</Label>
            <p className="text-sm text-gray-500">No será visible para nadie</p>
          </div>
          <Switch
            checked={edited.is_hidden}
            onCheckedChange={(checked) => setEdited({ ...edited, is_hidden: checked })}
          />
        </div>

        <div className="space-y-4">
          <Label>Visibilidad</Label>
          <RadioGroup
            value={edited.visibility}
            onValueChange={(value) => setEdited({ ...edited, visibility: value })}
          >
            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all" className="flex items-center gap-2 cursor-pointer flex-1">
                <Globe className="w-4 h-4 text-green-600" />
                <div>
                  <div className="font-medium">Todos los usuarios</div>
                  <div className="text-sm text-gray-500">Cualquier usuario puede ver esta materia</div>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="specific" id="specific" />
              <Label htmlFor="specific" className="flex items-center gap-2 cursor-pointer flex-1">
                <Users className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="font-medium">Usuarios específicos</div>
                  <div className="text-sm text-gray-500">Solo usuarios seleccionados</div>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {edited.visibility === 'specific' && (
          <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
            <Label>Usuarios con acceso</Label>
            
            <div className="flex gap-2">
              <Input
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="email@ejemplo.com"
                onKeyPress={(e) => e.key === 'Enter' && addUser()}
              />
              <Button onClick={addUser} size="sm">Agregar</Button>
            </div>

            {users.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-600 mb-2">Usuarios registrados:</p>
                <div className="flex flex-wrap gap-1">
                  {users.filter(u => u.role !== 'admin').map(user => (
                    <Badge
                      key={user.email}
                      variant="outline"
                      className={`cursor-pointer text-xs ${
                        edited.allowed_users.includes(user.email)
                          ? 'bg-blue-100 border-blue-400'
                          : 'hover:bg-gray-100'
                      }`}
                      onClick={() => selectFromList(user.email)}
                    >
                      {user.username || user.email}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {edited.allowed_users.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-600 mb-2">Usuarios seleccionados:</p>
                <div className="flex flex-wrap gap-2">
                  {edited.allowed_users.map(email => (
                    <Badge key={email} className="bg-blue-600">
                      {email}
                      <button
                        className="ml-1 hover:text-red-200"
                        onClick={() => removeUser(email)}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={() => onSave(edited)} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
            <Save className="w-4 h-4 mr-2" />
            Guardar
          </Button>
        </div>
          </TabsContent>
          
          <TabsContent value="quiz-settings">
            {subject?.id && (
              <QuizSettingsPanel
                entityType="subject"
                entityId={subject.id}
                entityName={subject.name}
              />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}