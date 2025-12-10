import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Plus, Users, Target, Clock, CheckCircle2, 
  AlertCircle, Trash2, BookOpen, User 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function AdminTasksPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [newTask, setNewTask] = useState({
    quiz_ids: [],
    target_score: 70,
    due_date: '',
    notes: ''
  });
  const [quizSearch, setQuizSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
    };
    loadUser();
  }, []);

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
    enabled: currentUser?.role === 'admin'
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => base44.entities.Subject.list()
  });

  const { data: quizzes = [] } = useQuery({
    queryKey: ['quizzes'],
    queryFn: () => base44.entities.Quiz.list()
  });

  const { data: allTasks = [] } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: () => base44.entities.AssignedTask.list('-created_date'),
    enabled: currentUser?.role === 'admin'
  });

  const createTasksMutation = useMutation({
    mutationFn: async (taskData) => {
      const promises = [];
      
      for (const quizId of taskData.quiz_ids) {
        const quiz = quizzes.find(q => q.id === quizId);
        const subject = subjects.find(s => s.id === quiz?.subject_id);
        
        for (const userEmail of selectedUsers) {
          const user = users.find(u => u.email === userEmail);
          promises.push(
            base44.entities.AssignedTask.create({
              user_email: userEmail,
              user_username: user?.username || user?.full_name,
              assigned_by: currentUser.email,
              quiz_id: quizId,
              quiz_title: quiz?.title,
              subject_id: quiz?.subject_id,
              subject_name: subject?.name,
              target_score: taskData.target_score,
              due_date: taskData.due_date || null,
              notes: taskData.notes,
              status: 'pending'
            })
          );
        }
      }
      
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-tasks']);
      setShowAssignDialog(false);
      setSelectedUsers([]);
      setNewTask({ quiz_ids: [], target_score: 70, due_date: '', notes: '' });
      toast.success('Tareas asignadas correctamente');
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId) => base44.entities.AssignedTask.delete(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-tasks']);
      toast.success('Tarea eliminada');
    }
  });

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Solo administradores pueden acceder a esta página</p>
      </div>
    );
  }

  // Estadísticas
  const stats = {
    total: allTasks.length,
    pending: allTasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length,
    completed: allTasks.filter(t => t.status === 'completed').length,
    overdue: allTasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed').length
  };

  // Agrupar por usuario
  const tasksByUser = {};
  allTasks.forEach(task => {
    if (!tasksByUser[task.user_email]) {
      tasksByUser[task.user_email] = {
        email: task.user_email,
        username: task.user_username,
        tasks: [],
        completed: 0,
        total: 0
      };
    }
    tasksByUser[task.user_email].tasks.push(task);
    tasksByUser[task.user_email].total++;
    if (task.status === 'completed') {
      tasksByUser[task.user_email].completed++;
    }
  });

  const toggleUserSelection = (email) => {
    if (selectedUsers.includes(email)) {
      setSelectedUsers(selectedUsers.filter(e => e !== email));
    } else {
      setSelectedUsers([...selectedUsers, email]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <Link to={createPageUrl('Quizzes')}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Tareas</h1>
            <p className="text-gray-600">Asigna y monitorea tareas para los usuarios</p>
          </div>
          
          <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Asignar tarea
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Asignar nueva tarea</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                                <Label>Quizzes ({newTask.quiz_ids.length} seleccionados)</Label>

                                {/* Filtro por materia */}
                                <Select
                                  value={subjectFilter}
                                  onValueChange={setSubjectFilter}
                                >
                                  <SelectTrigger className="mb-2">
                                    <SelectValue placeholder="Filtrar por materia" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all">Todas las materias</SelectItem>
                                    {subjects.map((subject) => (
                                      <SelectItem key={subject.id} value={subject.id}>
                                        {subject.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>

                                {/* Búsqueda */}
                                <Input
                                  placeholder="Buscar quiz..."
                                  value={quizSearch}
                                  onChange={(e) => setQuizSearch(e.target.value)}
                                  className="mb-2"
                                />

                                {/* Botones de selección rápida */}
                                <div className="flex gap-2 mb-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    type="button"
                                    onClick={() => {
                                      const filtered = quizzes
                                        .filter(quiz => {
                                          const matchesSubject = subjectFilter === 'all' || quiz.subject_id === subjectFilter;
                                          const matchesSearch = quiz.title.toLowerCase().includes(quizSearch.toLowerCase());
                                          return matchesSubject && matchesSearch;
                                        })
                                        .map(q => q.id);
                                      setNewTask({...newTask, quiz_ids: filtered});
                                    }}
                                  >
                                    Seleccionar filtrados
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    type="button"
                                    onClick={() => setNewTask({...newTask, quiz_ids: []})}
                                  >
                                    Limpiar
                                  </Button>
                                </div>

                                {/* Lista de quizzes filtrada */}
                                <div className="border rounded-lg max-h-48 overflow-y-auto">
                                  {quizzes
                                    .filter(quiz => {
                                      const matchesSubject = subjectFilter === 'all' || quiz.subject_id === subjectFilter;
                                      const matchesSearch = quiz.title.toLowerCase().includes(quizSearch.toLowerCase());
                                      return matchesSubject && matchesSearch;
                                    })
                                    .map((quiz) => {
                                      const subject = subjects.find(s => s.id === quiz.subject_id);
                                      const isSelected = newTask.quiz_ids.includes(quiz.id);
                                      return (
                                        <div
                                          key={quiz.id}
                                          className={`flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 ${
                                            isSelected ? 'bg-indigo-50' : ''
                                          }`}
                                          onClick={() => {
                                            if (isSelected) {
                                              setNewTask({...newTask, quiz_ids: newTask.quiz_ids.filter(id => id !== quiz.id)});
                                            } else {
                                              setNewTask({...newTask, quiz_ids: [...newTask.quiz_ids, quiz.id]});
                                            }
                                          }}
                                        >
                                          <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
                                            isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
                                          }`}>
                                            {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm truncate">{quiz.title}</div>
                                            <div className="text-xs text-gray-500 flex items-center gap-2">
                                              <span>{subject?.name || 'Sin materia'}</span>
                                              <span>•</span>
                                              <span>{quiz.questions?.length || 0} preguntas</span>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  {quizzes.filter(quiz => {
                                    const matchesSubject = subjectFilter === 'all' || quiz.subject_id === subjectFilter;
                                    const matchesSearch = quiz.title.toLowerCase().includes(quizSearch.toLowerCase());
                                    return matchesSubject && matchesSearch;
                                  }).length === 0 && (
                                    <div className="p-4 text-center text-gray-500 text-sm">
                                      No se encontraron quizzes
                                    </div>
                                  )}
                                </div>
                              </div>

                <div>
                  <Label>Meta de puntaje (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={newTask.target_score}
                    onChange={(e) => setNewTask({...newTask, target_score: parseInt(e.target.value)})}
                  />
                </div>

                <div>
                  <Label>Fecha límite (opcional)</Label>
                  <Input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({...newTask, due_date: e.target.value})}
                  />
                </div>

                <div>
                  <Label>Notas (opcional)</Label>
                  <Textarea
                    value={newTask.notes}
                    onChange={(e) => setNewTask({...newTask, notes: e.target.value})}
                    placeholder="Instrucciones o comentarios..."
                  />
                </div>

                <div>
                  <Label>Usuarios ({selectedUsers.length} seleccionados)</Label>
                  <div className="border rounded-lg max-h-48 overflow-y-auto mt-2">
                    {users.filter(u => u.role !== 'admin').map((user) => (
                      <div
                        key={user.email}
                        className={`flex items-center justify-between p-2 hover:bg-gray-50 cursor-pointer ${
                          selectedUsers.includes(user.email) ? 'bg-indigo-50' : ''
                        }`}
                        onClick={() => toggleUserSelection(user.email)}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded border ${
                            selectedUsers.includes(user.email) 
                              ? 'bg-indigo-600 border-indigo-600' 
                              : 'border-gray-300'
                          }`}>
                            {selectedUsers.includes(user.email) && (
                              <CheckCircle2 className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <span>{user.username || user.full_name || user.email}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedUsers(users.filter(u => u.role !== 'admin').map(u => u.email))}
                    >
                      Seleccionar todos
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedUsers([])}
                    >
                      Limpiar
                    </Button>
                  </div>
                </div>

                <Button 
                  onClick={() => createTasksMutation.mutate(newTask)}
                  disabled={newTask.quiz_ids.length === 0 || selectedUsers.length === 0 || createTasksMutation.isPending}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {createTasksMutation.isPending ? 'Asignando...' : `Asignar ${newTask.quiz_ids.length} quiz(zes) a ${selectedUsers.length} usuario(s)`}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-indigo-600">{stats.total}</div>
              <div className="text-sm text-gray-500">Total asignadas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-500">Pendientes</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-gray-500">Completadas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-red-600">{stats.overdue}</div>
              <div className="text-sm text-gray-500">Vencidas</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="by-user" className="space-y-4">
          <TabsList>
            <TabsTrigger value="by-user">
              <Users className="w-4 h-4 mr-2" />
              Por usuario
            </TabsTrigger>
            <TabsTrigger value="all">
              <BookOpen className="w-4 h-4 mr-2" />
              Todas las tareas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="by-user">
            <div className="grid gap-4">
              {Object.values(tasksByUser).map((userData, idx) => (
                <motion.div
                  key={userData.email}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <User className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{userData.username || userData.email}</h3>
                            <p className="text-sm text-gray-500">{userData.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-indigo-600">
                            {Math.round((userData.completed / userData.total) * 100)}%
                          </div>
                          <div className="text-xs text-gray-500">
                            {userData.completed}/{userData.total} completadas
                          </div>
                        </div>
                      </div>
                      
                      <Progress 
                        value={(userData.completed / userData.total) * 100} 
                        className="h-2 mb-3" 
                      />

                      <div className="space-y-2">
                        {userData.tasks.slice(0, 3).map((task) => (
                          <div key={task.id} className="flex items-center justify-between text-sm bg-gray-50 rounded p-2">
                            <span className="truncate flex-1">{task.quiz_title}</span>
                            <div className="flex items-center gap-2">
                              {task.status === 'completed' ? (
                                <Badge className="bg-green-100 text-green-700 text-xs">
                                  {task.best_score}%
                                </Badge>
                              ) : task.due_date && new Date(task.due_date) < new Date() ? (
                                <Badge className="bg-red-100 text-red-700 text-xs">Vencida</Badge>
                              ) : (
                                <Badge className="bg-yellow-100 text-yellow-700 text-xs">Pendiente</Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-red-500 hover:text-red-700"
                                onClick={() => deleteTaskMutation.mutate(task.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {userData.tasks.length > 3 && (
                          <p className="text-xs text-center text-gray-500">
                            +{userData.tasks.length - 3} más
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {Object.keys(tasksByUser).length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">No hay tareas asignadas</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="all">
            <div className="grid gap-3">
              {allTasks.map((task) => (
                <Card key={task.id} className={`${
                  task.status === 'completed' ? 'border-green-200' : 
                  task.due_date && new Date(task.due_date) < new Date() ? 'border-red-200' : ''
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{task.quiz_title}</h3>
                          {task.status === 'completed' ? (
                            <Badge className="bg-green-100 text-green-700">Completada</Badge>
                          ) : task.due_date && new Date(task.due_date) < new Date() ? (
                            <Badge className="bg-red-100 text-red-700">Vencida</Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-700">Pendiente</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          Asignada a: {task.user_username || task.user_email}
                        </p>
                        <div className="flex gap-4 mt-1 text-xs text-gray-400">
                          <span>Meta: {task.target_score}%</span>
                          {task.best_score > 0 && <span>Mejor: {task.best_score}%</span>}
                          {task.due_date && <span>Fecha: {new Date(task.due_date).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => deleteTaskMutation.mutate(task.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}