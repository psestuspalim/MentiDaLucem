import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Swords, Circle, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function OnlineUsersPanel({ currentUser, quizzes, subjects, onChallengeStart }) {
  const [showChallengeDialog, setShowChallengeDialog] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  
  const queryClient = useQueryClient();

  // Actualizar presencia cada 30 segundos
  useEffect(() => {
    if (!currentUser?.email) return;

    const updatePresence = async () => {
      try {
        const existing = await base44.entities.OnlineUser.filter({ user_email: currentUser.email });
        if (existing.length > 0) {
          await base44.entities.OnlineUser.update(existing[0].id, {
            last_seen: new Date().toISOString(),
            username: currentUser.username
          });
        } else {
          await base44.entities.OnlineUser.create({
            user_email: currentUser.email,
            username: currentUser.username,
            last_seen: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error updating presence:', error);
      }
    };

    updatePresence();
    const interval = setInterval(updatePresence, 30000);
    
    return () => clearInterval(interval);
  }, [currentUser]);

  // Obtener usuarios en línea (activos en últimos 2 minutos)
  const { data: onlineUsers = [] } = useQuery({
    queryKey: ['online-users'],
    queryFn: async () => {
      const users = await base44.entities.OnlineUser.list('-last_seen', 50);
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      return users.filter(u => 
        u.user_email !== currentUser?.email && 
        new Date(u.last_seen) > twoMinutesAgo
      );
    },
    refetchInterval: 15000,
    enabled: !!currentUser?.email
  });

  const createChallengeMutation = useMutation({
    mutationFn: (data) => base44.entities.Challenge.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['challenges']);
      setShowChallengeDialog(false);
      setSelectedOpponent(null);
      setSelectedQuiz('');
    }
  });

  const handleChallenge = (opponent) => {
    setSelectedOpponent(opponent);
    setShowChallengeDialog(true);
  };

  const handleSendChallenge = async () => {
    if (!selectedQuiz || !selectedOpponent) return;
    
    const quiz = quizzes.find(q => q.id === selectedQuiz);
    if (!quiz) return;

    // Seleccionar preguntas aleatorias
    const shuffledQuestions = [...quiz.questions]
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(questionCount, quiz.questions.length))
      .map(q => ({
        ...q,
        answerOptions: [...(q.answerOptions || [])].sort(() => Math.random() - 0.5)
      }));

    await createChallengeMutation.mutateAsync({
      challenger_email: currentUser.email,
      challenger_username: currentUser.username,
      opponent_email: selectedOpponent.user_email,
      opponent_username: selectedOpponent.username,
      quiz_id: quiz.id,
      quiz_title: quiz.title,
      subject_id: quiz.subject_id,
      question_count: shuffledQuestions.length,
      questions: shuffledQuestions,
      status: 'pending'
    });
  };

  const selectedQuizData = quizzes.find(q => q.id === selectedQuiz);

  return (
    <>
      <Card className="border-indigo-200 bg-indigo-50/50">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2 text-indigo-700">
            <Users className="w-4 h-4" />
            En línea ({onlineUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          {onlineUsers.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-2">
              No hay usuarios en línea
            </p>
          ) : (
            <ScrollArea className="max-h-40">
              <div className="space-y-1">
                {onlineUsers.map((user) => (
                  <div 
                    key={user.user_email}
                    className="flex items-center justify-between p-2 rounded-lg bg-white border"
                  >
                    <div className="flex items-center gap-2">
                      <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                      <span className="text-sm font-medium truncate max-w-[100px]">
                        {user.username || 'Usuario'}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleChallenge(user)}
                      className="h-7 px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100"
                    >
                      <Swords className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Dialog para enviar reto */}
      <Dialog open={showChallengeDialog} onOpenChange={setShowChallengeDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Swords className="w-5 h-5 text-indigo-600" />
              Retar a {selectedOpponent?.username}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Seleccionar cuestionario</Label>
              <Select value={selectedQuiz} onValueChange={setSelectedQuiz}>
                <SelectTrigger>
                  <SelectValue placeholder="Elige un cuestionario" />
                </SelectTrigger>
                <SelectContent>
                  {quizzes.filter(q => !q.is_hidden).map((quiz) => (
                    <SelectItem key={quiz.id} value={quiz.id}>
                      {quiz.title} ({quiz.total_questions} preg.)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Número de preguntas</Label>
              <Input
                type="number"
                min="5"
                max={selectedQuizData?.total_questions || 20}
                value={questionCount}
                onChange={(e) => setQuestionCount(Math.max(5, parseInt(e.target.value) || 5))}
              />
              {selectedQuizData && (
                <p className="text-xs text-gray-500 mt-1">
                  Máximo: {selectedQuizData.total_questions} preguntas
                </p>
              )}
            </div>

            <Button
              onClick={handleSendChallenge}
              disabled={!selectedQuiz || createChallengeMutation.isPending}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              <Swords className="w-4 h-4 mr-2" />
              {createChallengeMutation.isPending ? 'Enviando...' : 'Enviar reto'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}