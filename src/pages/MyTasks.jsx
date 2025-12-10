import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, CheckCircle2, Clock, AlertCircle, 
  Target, Play, BookOpen, Trophy 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import TaskProgressFloat from '../components/tasks/TaskProgressFloat';

export default function MyTasksPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
    };
    loadUser();
  }, []);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['my-tasks', currentUser?.email],
    queryFn: () => base44.entities.AssignedTask.filter({ user_email: currentUser?.email }, '-created_date'),
    enabled: !!currentUser?.email
  });

  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const overdueTasks = tasks.filter(t => {
    if (!t.due_date || t.status === 'completed') return false;
    return new Date(t.due_date) < new Date();
  });

  const getStatusBadge = (task) => {
    const isOverdue = task.due_date && new Date(task.due_date) < new Date();
    
    if (task.status === 'completed') {
      return <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3 mr-1" />Completada</Badge>;
    }
    if (isOverdue) {
      return <Badge className="bg-red-100 text-red-700"><AlertCircle className="w-3 h-3 mr-1" />Vencida</Badge>;
    }
    if (task.status === 'in_progress') {
      return <Badge className="bg-blue-100 text-blue-700"><Clock className="w-3 h-3 mr-1" />En progreso</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
  };

  const handleStartQuiz = (task) => {
    window.location.href = createPageUrl('Quizzes') + `?quizId=${task.quiz_id}&taskId=${task.id}`;
  };

  if (!currentUser) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  const overallProgress = tasks.length > 0 
    ? Math.round((completedTasks.length / tasks.length) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <Link to={createPageUrl('Quizzes')}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Tareas</h1>
          <p className="text-gray-600">Tareas asignadas por el administrador</p>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-indigo-600">{tasks.length}</div>
              <div className="text-sm text-gray-500">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-yellow-600">{pendingTasks.length}</div>
              <div className="text-sm text-gray-500">Pendientes</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{completedTasks.length}</div>
              <div className="text-sm text-gray-500">Completadas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-red-600">{overdueTasks.length}</div>
              <div className="text-sm text-gray-500">Vencidas</div>
            </CardContent>
          </Card>
        </div>

        {/* Progreso general */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Progreso general</span>
              <span className="text-2xl font-bold text-indigo-600">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-3" />
          </CardContent>
        </Card>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">
              Pendientes ({pendingTasks.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completadas ({completedTasks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <div className="space-y-6">
              {pendingTasks.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
                    <p className="text-gray-600">¡No tienes tareas pendientes!</p>
                  </CardContent>
                </Card>
              ) : (
                Object.entries(
                  pendingTasks.reduce((acc, task) => {
                    const subjectName = task.subject_name || 'Sin materia';
                    if (!acc[subjectName]) acc[subjectName] = [];
                    acc[subjectName].push(task);
                    return acc;
                  }, {})
                ).map(([subjectName, subjectTasks]) => (
                  <div key={subjectName}>
                    <h3 className="font-semibold text-lg text-gray-800 mb-3 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-indigo-600" />
                      {subjectName}
                      <Badge variant="outline">{subjectTasks.length}</Badge>
                    </h3>
                    <div className="grid gap-3">
                      {subjectTasks.map((task, idx) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className={`${
                      task.due_date && new Date(task.due_date) < new Date() 
                        ? 'border-red-300 bg-red-50/50' 
                        : ''
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <BookOpen className="w-4 h-4 text-indigo-600" />
                              <h3 className="font-semibold">{task.quiz_title}</h3>
                            </div>
                            <p className="text-sm text-gray-500 mb-2">{task.subject_name}</p>
                            
                            <div className="flex flex-wrap gap-2 mb-3">
                              {getStatusBadge(task)}
                              <Badge variant="outline">
                                <Target className="w-3 h-3 mr-1" />
                                Meta: {task.target_score}%
                              </Badge>
                              {task.due_date && (
                                <Badge variant="outline">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {new Date(task.due_date).toLocaleDateString()}
                                </Badge>
                              )}
                            </div>

                            {task.best_score > 0 && (
                              <div className="mb-2">
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                  <span>Mejor puntaje: {task.best_score}%</span>
                                  <span>{task.attempts} intentos</span>
                                </div>
                                <Progress 
                                  value={Math.min((task.best_score / task.target_score) * 100, 100)} 
                                  className="h-2" 
                                />
                              </div>
                            )}

                            {task.notes && (
                              <p className="text-sm text-gray-600 bg-gray-100 rounded p-2">
                                📝 {task.notes}
                              </p>
                            )}
                          </div>

                          <Button 
                            onClick={() => handleStartQuiz(task)}
                            className="bg-indigo-600 hover:bg-indigo-700"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            {task.attempts > 0 ? 'Reintentar' : 'Comenzar'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="space-y-6">
              {completedTasks.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-600">Aún no has completado ninguna tarea</p>
                  </CardContent>
                </Card>
              ) : (
                Object.entries(
                  completedTasks.reduce((acc, task) => {
                    const subjectName = task.subject_name || 'Sin materia';
                    if (!acc[subjectName]) acc[subjectName] = [];
                    acc[subjectName].push(task);
                    return acc;
                  }, {})
                ).map(([subjectName, subjectTasks]) => (
                  <div key={subjectName}>
                    <h3 className="font-semibold text-lg text-gray-800 mb-3 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-green-600" />
                      {subjectName}
                      <Badge className="bg-green-100 text-green-700">{subjectTasks.length}</Badge>
                    </h3>
                    <div className="grid gap-3">
                      {subjectTasks.map((task) => (
                        <Card key={task.id} className="border-green-200 bg-green-50/30">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-semibold">{task.quiz_title}</h3>
                                <div className="flex gap-2 mt-2">
                                  <Badge className="bg-green-100 text-green-700">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    {task.best_score}%
                                  </Badge>
                                  <Badge variant="outline">
                                    {task.attempts} intentos
                                  </Badge>
                                </div>
                              </div>
                              <Trophy className="w-8 h-8 text-green-500" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}