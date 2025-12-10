import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, Clock, Trophy, Crown, Medal, Award, 
  Play, Loader2, Copy, ArrowLeft, Zap 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import QuestionView from '../components/quiz/QuestionView';

export default function GamePlayPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [room, setRoom] = useState(null);
  const [gameState, setGameState] = useState('lobby'); // lobby, countdown, playing, finished
  const [countdown, setCountdown] = useState(3);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [rankings, setRankings] = useState([]);
  
  const timerRef = useRef(null);
  const pollingRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadData = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      if (code) {
        const rooms = await base44.entities.GameRoom.filter({ code });
        if (rooms.length > 0) {
          setRoom(rooms[0]);
          if (rooms[0].status === 'in_progress') {
            setGameState('playing');
          }
        }
      }
    };
    loadData();
  }, []);

  // Polling para actualizar sala
  useEffect(() => {
    if (!room || gameState === 'finished') return;

    pollingRef.current = setInterval(async () => {
      const rooms = await base44.entities.GameRoom.filter({ code: room.code });
      if (rooms.length > 0) {
        const updatedRoom = rooms[0];
        setRoom(updatedRoom);
        
        if (updatedRoom.status === 'in_progress' && gameState === 'lobby') {
          setGameState('countdown');
        }
        
        if (updatedRoom.status === 'completed') {
          calculateRankings(updatedRoom);
          setGameState('finished');
        }
      }
    }, 2000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [room, gameState]);

  // Countdown
  useEffect(() => {
    if (gameState !== 'countdown') return;
    
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setGameState('playing');
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
  }, [gameState, countdown]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const isHost = room?.host_email === currentUser?.email;

  const startGameMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.GameRoom.update(room.id, {
        status: 'in_progress',
        started_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      setGameState('countdown');
    }
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({ score, finished, time }) => {
      const updatedPlayers = room.players.map(p => {
        if (p.email === currentUser.email) {
          return { ...p, score, finished, time };
        }
        return p;
      });

      // Verificar si todos terminaron
      const allFinished = updatedPlayers.every(p => p.finished);
      
      await base44.entities.GameRoom.update(room.id, {
        players: updatedPlayers,
        status: allFinished ? 'completed' : 'in_progress'
      });

      if (allFinished) {
        calculateRankings({ ...room, players: updatedPlayers });
        setGameState('finished');
      }
    }
  });

  const calculateRankings = (roomData) => {
    const sorted = [...roomData.players]
      .filter(p => p.finished)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.time - b.time;
      });
    setRankings(sorted);
    
    if (sorted[0]?.email === currentUser?.email) {
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
    }
  };

  const handleAnswer = async (isCorrect, selectedOption, question) => {
    const newScore = isCorrect ? score + 1 : score;
    
    if (isCorrect) {
      setScore(newScore);
    } else {
      setWrongAnswers([...wrongAnswers, question]);
    }

    const isLastQuestion = currentQuestionIndex >= room.questions.length - 1;
    
    if (!isLastQuestion) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      await updateProgressMutation.mutateAsync({
        score: newScore,
        finished: true,
        time: elapsedTime
      });
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRankIcon = (index) => {
    if (index === 0) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (index === 2) return <Award className="w-6 h-6 text-amber-600" />;
    return <span className="w-6 h-6 flex items-center justify-center font-bold text-gray-500">{index + 1}</span>;
  };

  if (!room || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  // Lobby - Esperando jugadores
  if (gameState === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-4">
        <div className="max-w-lg mx-auto">
          <Button 
            variant="ghost" 
            className="text-white hover:bg-white/10 mb-4"
            onClick={() => window.location.href = '/GameLobby'}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Salir
          </Button>

          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">{room.name || room.quiz_title}</h2>
                <div className="flex items-center justify-center gap-2">
                  <Badge className="bg-white/20 text-white text-lg px-4 py-1">
                    {room.code}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10"
                    onClick={() => {
                      navigator.clipboard.writeText(room.code);
                      toast.success('Código copiado');
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-white/60 mt-2">{room.question_count} preguntas</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-white/80">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Jugadores
                  </span>
                  <span>{room.players?.length || 0}/{room.max_players}</span>
                </div>
                
                <div className="space-y-2">
                  {room.players?.map((player, idx) => (
                    <motion.div
                      key={player.email}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center justify-between bg-white/10 rounded-lg px-4 py-2"
                    >
                      <span className="text-white">{player.username}</span>
                      {player.email === room.host_email && (
                        <Badge className="bg-yellow-500/20 text-yellow-300">Host</Badge>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              {isHost ? (
                <Button
                  onClick={() => startGameMutation.mutate()}
                  disabled={room.players?.length < 1 || startGameMutation.isPending}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 h-12"
                >
                  <Play className="w-5 h-5 mr-2" />
                  {startGameMutation.isPending ? 'Iniciando...' : 'Iniciar partida'}
                </Button>
              ) : (
                <div className="text-center text-white/60">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Esperando que el host inicie...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Countdown
  if (gameState === 'countdown') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center">
        <motion.div
          key={countdown}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.5, opacity: 0 }}
          className="text-center"
        >
          {countdown > 0 ? (
            <div className="text-9xl font-bold text-white">{countdown}</div>
          ) : (
            <div className="text-6xl font-bold text-white flex items-center gap-4">
              <Zap className="w-16 h-16" />
              ¡A jugar!
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // Resultados
  if (gameState === 'finished') {
    const myRank = rankings.findIndex(p => p.email === currentUser.email);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-4">
        <div className="max-w-lg mx-auto">
          <Card className="bg-white/10 backdrop-blur border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 text-center">
              <Trophy className="w-16 h-16 mx-auto mb-2 text-white" />
              <h2 className="text-2xl font-bold text-white">Resultados</h2>
            </div>
            
            <CardContent className="p-6">
              <div className="space-y-3 mb-6">
                {rankings.map((player, idx) => (
                  <motion.div
                    key={player.email}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`flex items-center justify-between p-4 rounded-xl ${
                      player.email === currentUser.email 
                        ? 'bg-indigo-500/30 ring-2 ring-indigo-400' 
                        : 'bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {getRankIcon(idx)}
                      <div>
                        <div className="font-semibold text-white">{player.username}</div>
                        <div className="text-xs text-white/60 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(player.time)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">{player.score}</div>
                      <div className="text-xs text-white/60">puntos</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/10 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-white">{score}</div>
                  <div className="text-sm text-white/60">Tu puntaje</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-white">#{myRank + 1}</div>
                  <div className="text-sm text-white/60">Tu posición</div>
                </div>
              </div>

              <Button 
                onClick={() => window.location.href = '/GameLobby'}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                Volver al lobby
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Jugando
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header con progreso */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className="bg-indigo-100 text-indigo-700">
                <Users className="w-3 h-3 mr-1" />
                {room.players?.filter(p => !p.finished).length} jugando
              </Badge>
            </div>
            
            <div className="text-lg font-bold text-indigo-600">{score} pts</div>
            
            <div className="flex items-center gap-1 text-sm font-mono bg-gray-100 px-2 py-1 rounded">
              <Clock className="w-3 h-3 text-gray-500" />
              <span>{formatTime(elapsedTime)}</span>
            </div>
          </div>
          
          <Progress 
            value={((currentQuestionIndex + 1) / room.questions.length) * 100} 
            className="h-1.5 mt-2" 
          />
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        <QuestionView
          key={currentQuestionIndex}
          question={room.questions[currentQuestionIndex]}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={room.questions.length}
          correctAnswers={score}
          wrongAnswers={wrongAnswers.length}
          onAnswer={handleAnswer}
        />
      </div>
    </div>
  );
}