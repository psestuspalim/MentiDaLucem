import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, Play, Copy, ArrowLeft, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function TournamentLobby() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTournament, setNewTournament] = useState({
    name: '',
    quiz_id: '',
    question_count: 10,
    time_per_question: 30
  });
  
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me()
      .then(setCurrentUser)
      .catch(console.error)
      .finally(() => setUserLoading(false));
  }, []);

  const { data: quizzes = [] } = useQuery({
    queryKey: ['quizzes'],
    queryFn: () => base44.entities.Quiz.list('-created_date'),
  });

  const { data: tournaments = [], refetch } = useQuery({
    queryKey: ['tournaments-waiting'],
    queryFn: () => base44.entities.Tournament.filter({ status: 'waiting' }, '-created_date'),
    refetchInterval: 3000,
  });

  const createTournamentMutation = useMutation({
    mutationFn: async (data) => {
      if (!currentUser?.email) throw new Error('Usuario no autenticado');
      
      const quiz = quizzes.find(q => q.id === data.quiz_id);
      if (!quiz) throw new Error('Quiz no encontrado');
      if (!quiz.questions?.length) throw new Error('El quiz no tiene preguntas');

      const shuffledQuestions = [...quiz.questions]
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(data.question_count, quiz.questions.length))
        .map(q => ({
          ...q,
          answerOptions: [...(q.answerOptions || [])].sort(() => Math.random() - 0.5)
        }));

      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      const tournamentData = {
        code,
        name: data.name || quiz.title,
        host_email: currentUser.email,
        host_username: currentUser.username || 'Anónimo',
        quiz_id: data.quiz_id,
        quiz_title: quiz.title,
        questions: shuffledQuestions,
        question_count: shuffledQuestions.length,
        time_per_question: data.time_per_question || 30,
        players: [{
          email: currentUser.email,
          username: currentUser.username || 'Anónimo',
          score: 0,
          current_answer: -1
        }],
        status: 'waiting',
        current_question: 0,
        results_per_question: []
      };

      console.log('Creating tournament with data:', tournamentData);
      const result = await base44.entities.Tournament.create(tournamentData);
      console.log('Tournament created:', result);
      return result;
    },
    onSuccess: (tournament) => {
      setShowCreateDialog(false);
      window.location.href = createPageUrl(`TournamentPlay?code=${tournament.code}`);
    },
    onError: (error) => {
      console.error('Error creating tournament:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      toast.error(error?.message || error?.toString() || 'Error al crear el torneo');
    }
  });

  const joinTournamentMutation = useMutation({
    mutationFn: async (code) => {
      const tournaments = await base44.entities.Tournament.filter({ code: code.toUpperCase() });
      if (tournaments.length === 0) throw new Error('Torneo no encontrado');
      
      const tournament = tournaments[0];
      if (tournament.status !== 'waiting') throw new Error('El torneo ya comenzó');
      if (tournament.players.length >= 3) throw new Error('El torneo está lleno');
      if (tournament.players.some(p => p.email === currentUser.email)) {
        return tournament;
      }

      await base44.entities.Tournament.update(tournament.id, {
        players: [...tournament.players, {
          email: currentUser.email,
          username: currentUser.username,
          score: 0,
          current_answer: -1
        }]
      });
      return tournament;
    },
    onSuccess: (tournament) => {
      window.location.href = createPageUrl(`TournamentPlay?code=${tournament.code}`);
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const handleJoin = () => {
    if (!joinCode.trim()) return;
    joinTournamentMutation.mutate(joinCode.trim());
  };

  const selectedQuiz = quizzes.find(q => q.id === newTournament.quiz_id);

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <Link to={createPageUrl('Quizzes')}>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver
          </Button>
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 mb-4">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Torneos</h1>
          <p className="text-gray-600">Compite con 2 amigos en tiempo real</p>
        </div>

        {/* Unirse a torneo */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Unirse a un torneo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Código del torneo"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="uppercase"
                maxLength={6}
              />
              <Button 
                onClick={handleJoin}
                disabled={!joinCode.trim() || joinTournamentMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Unirse
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Crear torneo */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="w-full mb-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 h-12">
              <Plus className="w-5 h-5 mr-2" />
              Crear nuevo torneo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear torneo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Nombre del torneo</Label>
                <Input
                  value={newTournament.name}
                  onChange={(e) => setNewTournament({...newTournament, name: e.target.value})}
                  placeholder="Mi torneo épico"
                />
              </div>
              <div>
                <Label>Cuestionario</Label>
                <Select 
                  value={newTournament.quiz_id} 
                  onValueChange={(v) => setNewTournament({...newTournament, quiz_id: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un quiz" />
                  </SelectTrigger>
                  <SelectContent>
                    {quizzes.filter(q => !q.is_hidden && q.questions?.length > 0).map(quiz => (
                      <SelectItem key={quiz.id} value={quiz.id}>
                        {quiz.title} ({quiz.questions?.length} preg.)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Preguntas</Label>
                  <Input
                    type="number"
                    min={5}
                    max={selectedQuiz?.questions?.length || 20}
                    value={newTournament.question_count}
                    onChange={(e) => setNewTournament({...newTournament, question_count: parseInt(e.target.value) || 10})}
                  />
                </div>
                <div>
                  <Label>Segundos/pregunta</Label>
                  <Input
                    type="number"
                    min={10}
                    max={60}
                    value={newTournament.time_per_question}
                    onChange={(e) => setNewTournament({...newTournament, time_per_question: parseInt(e.target.value) || 30})}
                  />
                </div>
              </div>
              <Button
                onClick={() => createTournamentMutation.mutate(newTournament)}
                disabled={!newTournament.quiz_id || createTournamentMutation.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Crear torneo
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Torneos disponibles */}
        <h2 className="text-lg font-semibold mb-3">Torneos esperando jugadores</h2>
        {tournaments.length === 0 ? (
          <Card className="text-center py-8 text-gray-500">
            No hay torneos disponibles. ¡Crea uno!
          </Card>
        ) : (
          <div className="space-y-3">
            {tournaments.map(t => (
              <Card key={t.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{t.name || t.quiz_title}</h3>
                      <p className="text-sm text-gray-500">{t.quiz_title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">
                          <Users className="w-3 h-3 mr-1" />
                          {t.players?.length || 0}/3
                        </Badge>
                        <Badge variant="outline">{t.question_count} preg.</Badge>
                      </div>
                    </div>
                    <Button
                      onClick={() => joinTournamentMutation.mutate(t.code)}
                      disabled={t.players?.length >= 3}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Unirse
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}