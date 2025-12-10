import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Users, Lock, Globe, Play, Copy, ArrowLeft, 
  Gamepad2, Trophy, Clock, Loader2, RefreshCw 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import TaskProgressFloat from '../components/tasks/TaskProgressFloat';

export default function GameLobbyPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [newRoom, setNewRoom] = useState({
    name: '',
    is_public: true,
    quiz_id: '',
    question_count: 10,
    max_players: 10
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
    };
    loadUser();
  }, []);

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => base44.entities.Subject.list()
  });

  const { data: quizzes = [] } = useQuery({
    queryKey: ['quizzes'],
    queryFn: () => base44.entities.Quiz.list()
  });

  const { data: publicRooms = [], refetch: refetchRooms } = useQuery({
    queryKey: ['public-rooms'],
    queryFn: async () => {
      const rooms = await base44.entities.GameRoom.filter({ 
        is_public: true, 
        status: 'waiting' 
      }, '-created_date');
      return rooms;
    },
    refetchInterval: 5000
  });

  const { data: myRooms = [] } = useQuery({
    queryKey: ['my-rooms', currentUser?.email],
    queryFn: async () => {
      const asHost = await base44.entities.GameRoom.filter({ 
        host_email: currentUser?.email,
        status: 'waiting'
      });
      return asHost;
    },
    enabled: !!currentUser?.email,
    refetchInterval: 5000
  });

  const createRoomMutation = useMutation({
    mutationFn: async (roomData) => {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const quiz = quizzes.find(q => q.id === roomData.quiz_id);
      
      // Seleccionar preguntas aleatorias
      const shuffledQuestions = [...quiz.questions]
        .sort(() => Math.random() - 0.5)
        .slice(0, roomData.question_count)
        .map(q => ({
          ...q,
          answerOptions: [...q.answerOptions].sort(() => Math.random() - 0.5)
        }));

      return base44.entities.GameRoom.create({
        ...roomData,
        code,
        host_email: currentUser.email,
        host_username: currentUser.username,
        quiz_title: quiz.title,
        questions: shuffledQuestions,
        players: [{
          email: currentUser.email,
          username: currentUser.username,
          score: 0,
          finished: false,
          time: 0
        }]
      });
    },
    onSuccess: (room) => {
      queryClient.invalidateQueries(['public-rooms']);
      queryClient.invalidateQueries(['my-rooms']);
      setShowCreateDialog(false);
      window.location.href = `/GamePlay?code=${room.code}`;
    }
  });

  const joinRoomMutation = useMutation({
    mutationFn: async (code) => {
      const rooms = await base44.entities.GameRoom.filter({ code: code.toUpperCase() });
      if (rooms.length === 0) throw new Error('Sala no encontrada');
      
      const room = rooms[0];
      if (room.status !== 'waiting') throw new Error('La partida ya comenzó');
      if (room.players.length >= room.max_players) throw new Error('Sala llena');
      if (room.players.some(p => p.email === currentUser.email)) {
        return room; // Ya está en la sala
      }

      const updatedPlayers = [...room.players, {
        email: currentUser.email,
        username: currentUser.username,
        score: 0,
        finished: false,
        time: 0
      }];

      await base44.entities.GameRoom.update(room.id, { players: updatedPlayers });
      return room;
    },
    onSuccess: (room) => {
      window.location.href = `/GamePlay?code=${room.code}`;
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const handleCreateRoom = () => {
    if (!newRoom.quiz_id) {
      toast.error('Selecciona un quiz');
      return;
    }
    createRoomMutation.mutate(newRoom);
  };

  const handleJoinRoom = (code) => {
    joinRoomMutation.mutate(code);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to={createPageUrl('Quizzes')}>
            <Button variant="ghost" className="text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Gamepad2 className="w-6 h-6" />
            Modo Desafío
          </h1>
          <Button onClick={() => refetchRooms()} variant="ghost" className="text-white hover:bg-white/10">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Unirse con código */}
        <Card className="mb-6 bg-white/10 backdrop-blur border-white/20">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Input
                placeholder="Código de sala (ej: ABC123)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
              <Button 
                onClick={() => handleJoinRoom(joinCode)}
                disabled={!joinCode || joinRoomMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                Unirse
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="public" className="space-y-4">
          <TabsList className="bg-white/10 border-white/20">
            <TabsTrigger value="public" className="data-[state=active]:bg-white/20 text-white">
              <Globe className="w-4 h-4 mr-2" />
              Públicas
            </TabsTrigger>
            <TabsTrigger value="my" className="data-[state=active]:bg-white/20 text-white">
              <Users className="w-4 h-4 mr-2" />
              Mis Salas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="public">
            <div className="grid gap-4">
              {publicRooms.length === 0 ? (
                <Card className="bg-white/10 backdrop-blur border-white/20">
                  <CardContent className="p-8 text-center">
                    <Globe className="w-12 h-12 mx-auto mb-4 text-white/50" />
                    <p className="text-white/70">No hay salas públicas disponibles</p>
                    <p className="text-white/50 text-sm">¡Crea una nueva!</p>
                  </CardContent>
                </Card>
              ) : (
                publicRooms.map((room) => (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="bg-white/10 backdrop-blur border-white/20 hover:bg-white/15 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-white">{room.name || room.quiz_title}</h3>
                            <p className="text-sm text-white/60">
                              Host: {room.host_username} • {room.question_count} preguntas
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className="bg-white/20 text-white">
                                <Users className="w-3 h-3 mr-1" />
                                {room.players?.length || 1}/{room.max_players}
                              </Badge>
                              <Badge variant="outline" className="border-white/30 text-white">
                                {room.code}
                              </Badge>
                            </div>
                          </div>
                          <Button 
                            onClick={() => handleJoinRoom(room.code)}
                            className="bg-indigo-600 hover:bg-indigo-700"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Unirse
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="my">
            <div className="grid gap-4">
              {myRooms.map((room) => (
                <Card key={room.id} className="bg-white/10 backdrop-blur border-white/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-white">{room.name || room.quiz_title}</h3>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className="bg-white/20 text-white">
                            {room.is_public ? <Globe className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
                            {room.is_public ? 'Pública' : 'Privada'}
                          </Badge>
                          <Badge variant="outline" className="border-white/30 text-white">
                            {room.code}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="border-white/30 text-white hover:bg-white/10"
                          onClick={() => {
                            navigator.clipboard.writeText(room.code);
                            toast.success('Código copiado');
                          }}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button 
                          onClick={() => window.location.href = `/GamePlay?code=${room.code}`}
                          className="bg-indigo-600 hover:bg-indigo-700"
                        >
                          Entrar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Botón crear sala */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="fixed bottom-6 right-6 h-14 px-6 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 shadow-lg">
              <Plus className="w-5 h-5 mr-2" />
              Crear Sala
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Crear nueva sala</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Nombre de la sala (opcional)</Label>
                <Input
                  value={newRoom.name}
                  onChange={(e) => setNewRoom({...newRoom, name: e.target.value})}
                  placeholder="Mi sala de estudio"
                />
              </div>

              <div>
                <Label>Quiz</Label>
                <Select
                  value={newRoom.quiz_id}
                  onValueChange={(value) => setNewRoom({...newRoom, quiz_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un quiz" />
                  </SelectTrigger>
                  <SelectContent>
                    {quizzes.map((quiz) => (
                      <SelectItem key={quiz.id} value={quiz.id}>
                        {quiz.title} ({quiz.questions?.length || 0} preg.)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Preguntas</Label>
                  <Select
                    value={newRoom.question_count.toString()}
                    onValueChange={(value) => setNewRoom({...newRoom, question_count: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 10, 15, 20, 25, 30].map((n) => (
                        <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Máx. jugadores</Label>
                  <Select
                    value={newRoom.max_players.toString()}
                    onValueChange={(value) => setNewRoom({...newRoom, max_players: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2, 5, 10, 20, 50].map((n) => (
                        <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label>Sala pública</Label>
                <Switch
                  checked={newRoom.is_public}
                  onCheckedChange={(checked) => setNewRoom({...newRoom, is_public: checked})}
                />
              </div>

              <Button 
                onClick={handleCreateRoom} 
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                disabled={createRoomMutation.isPending}
              >
                {createRoomMutation.isPending ? 'Creando...' : 'Crear sala'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <TaskProgressFloat />
    </div>
  );
}