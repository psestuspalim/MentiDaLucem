import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Search, X, Globe, UserCheck, Link2 } from 'lucide-react';

export default function VisibilitySelector({ 
  visibility, 
  allowedUsers = [], 
  users = [], 
  showInherit = false,
  onChange 
}) {
  const [searchUser, setSearchUser] = useState('');

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchUser.toLowerCase())
  );

  const toggleUser = (email) => {
    const current = allowedUsers || [];
    if (current.includes(email)) {
      onChange({ visibility, allowedUsers: current.filter(e => e !== email) });
    } else {
      onChange({ visibility, allowedUsers: [...current, email] });
    }
  };

  const selectAll = () => {
    onChange({ visibility, allowedUsers: users.map(u => u.email) });
  };

  const selectNone = () => {
    onChange({ visibility, allowedUsers: [] });
  };

  return (
    <div className="space-y-4">
      <Label>Visibilidad</Label>
      <div className="flex flex-wrap gap-2">
        {showInherit && (
          <Button
            type="button"
            variant={visibility === 'inherit' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange({ visibility: 'inherit', allowedUsers })}
            className="flex items-center gap-2"
          >
            <Link2 className="w-4 h-4" />
            Heredar del padre
          </Button>
        )}
        <Button
          type="button"
          variant={visibility === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange({ visibility: 'all', allowedUsers })}
          className="flex items-center gap-2"
        >
          <Globe className="w-4 h-4" />
          Todos
        </Button>
        <Button
          type="button"
          variant={visibility === 'specific' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange({ visibility: 'specific', allowedUsers })}
          className="flex items-center gap-2"
        >
          <UserCheck className="w-4 h-4" />
          Específicos
        </Button>
      </div>

      {visibility === 'specific' && (
        <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4" />
              Usuarios seleccionados ({allowedUsers?.length || 0})
            </Label>
            <div className="flex gap-1">
              <Button type="button" variant="ghost" size="sm" onClick={selectAll} className="text-xs h-7">
                Todos
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={selectNone} className="text-xs h-7">
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
              className="pl-9 h-9"
            />
          </div>

          <ScrollArea className="h-40 border rounded-lg bg-white">
            <div className="p-2 space-y-1">
              {filteredUsers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No hay usuarios</p>
              ) : (
                filteredUsers.map((user) => (
                  <label
                    key={user.email}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={allowedUsers?.includes(user.email)}
                      onCheckedChange={() => toggleUser(user.email)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.username || user.full_name || 'Sin nombre'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    {allowedUsers?.includes(user.email) && (
                      <Badge variant="secondary" className="text-xs">✓</Badge>
                    )}
                  </label>
                ))
              )}
            </div>
          </ScrollArea>

          {allowedUsers?.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-2">
              {allowedUsers.slice(0, 4).map((email) => {
                const user = users.find(u => u.email === email);
                return (
                  <Badge key={email} variant="secondary" className="text-xs pr-1">
                    {user?.username || user?.full_name || email.split('@')[0]}
                    <button 
                      onClick={() => toggleUser(email)} 
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                );
              })}
              {allowedUsers.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{allowedUsers.length - 4} más
                </Badge>
              )}
            </div>
          )}
        </div>
      )}

      {visibility === 'inherit' && (
        <p className="text-xs text-gray-500 bg-blue-50 p-2 rounded-lg">
          Los permisos serán heredados del curso o carpeta padre
        </p>
      )}
    </div>
  );
}