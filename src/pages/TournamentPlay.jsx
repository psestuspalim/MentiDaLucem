import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Users, Copy, Play, Clock, CheckCircle2, XCircle, Crown, Medal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import MathText from '../components/quiz/MathText';

export default function TournamentPlay() {
  const [currentUser, setCurrentUser] = useState(null);
  const [tournament, setTournament] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(-1);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [showingResults, setShowingResults] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(console.error);
  }, []);

  // Polling del torneo
  const { data: tournamentData } = useQuery({
    queryKey: ['tournament', code],
    queryFn: async () => {
      const tournaments = await base44.entities.Tournament.filter({ code });
      return tournaments[0] || null;
    },
    refetchInterval: 500,
    enabled: !!code,
  });

  useEffect(() => {
    if (tournamentData) {
      setTournament(tournamentData);
      
      // Sincronizar estado de respuesta
      if (tournamentData.status === 'in_progress') {
        const myPlayer = tournamentData.players?.find(p => p.email === currentUser?.email);
        if (myPlayer && myPlayer.current_answer !== -1) {
          setSelectedAnswer(myPlayer.current_answer);
          setHasAnswered(true);
        } else if (myPlayer && myPlayer.current_answer === -1) {
          setSelectedAnswer(-1);
          setHasAnswered(false);
        }
      }
      
      if (tournamentData.status === 'showing_results') {
        setShowingResults(true);
      } else {
        setShowingResults(false);
      }

    }
  }, [tournamentData, currentUser]);

  // Countdown timer
  useEffect(() => {
    if (!tournament || tournament.status !== 'countdown' || !tournament.question_started_at) return;

    const interval = setInterval(() => {
      const startTime = new Date(tournament.question_started_at).getTime();
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(3 - elapsed, 0);
      setCountdown(remaining);
    }, 100);

    return () => clearInterval(interval);
  }, [tournament]);

  // Timer de pregunta
  useEffect(() => {
    if (!tournament || tournament.status !== 'in_progress' || !tournament.question_started_at) return;

    const interval = setInterval(() => {
      const startTime = new Date(tournament.question_started_at).getTime();
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(tournament.time_per_question - elapsed, 0);
      setTimeLeft(remaining);

      // Si es el host y el tiempo acabó, avanzar
      if (remaining === 0 && tournament.host_email === currentUser?.email) {
        handleTimeUp();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [tournament, currentUser]);

  const isHost = tournament?.host_email === currentUser?.email;

  const startTournamentMutation = useMutation({
    mutationFn: async () => {
      const tournamentId = tournament.id;
      const players = [...tournament.players];
      
      // Primero actualizar a countdown
      await base44.entities.Tournament.update(tournamentId, {
        status: 'countdown',
        question_started_at: new Date().toISOString()
      });

      // Esperar 3 segundos y luego iniciar
      return new Promise((resolve) => {
        setTimeout(async () => {
          try {
            await base44.entities.Tournament.update(tournamentId, {
              status: 'in_progress',
              current_question: 0,
              question_started_at: new Date().toISOString(),
              players: players.map(p => ({ 
                email: p.email,
                username: p.username,
                score: 0,
                current_answer: -1, 
                answer_time: null 
              }))
            });
            resolve();
          } catch (err) {
            console.error('Error starting tournament:', err);
            resolve();
          }
        }, 3000);
      });
    }
  });

  const answerMutation = useMutation({
    mutationFn: async (answerIndex) => {
      const answerTime = Date.now() - new Date(tournament.question_started_at).getTime();
      const updatedPlayers = tournament.players.map(p => 
        p.email === currentUser.email 
          ? { ...p, current_answer: answerIndex, answer_time: answerTime }
          : p
      );

      await base44.entities.Tournament.update(tournament.id, {
        players: updatedPlayers
      });
    }
  });

  const handleAnswer = (index) => {
    if (hasAnswered || timeLeft === 0) return;
    setSelectedAnswer(index);
    setHasAnswered(true);
    answerMutation.mutate(index);
  };

  const handleTimeUp = useCallback(async () => {
    if (!isHost || !tournament) return;

    const question = tournament.questions[tournament.current_question];
    const correctIndex = question.answerOptions?.findIndex(o => o.isCorrect) ?? -1;

    // Calcular puntos
    const updatedPlayers = tournament.players.map(p => {
      let addedPoints = 0;
      if (p.current_answer === correctIndex) {
        // Más puntos por responder rápido
        const speedBonus = Math.max(0, (tournament.time_per_question * 1000 - (p.answer_time || tournament.time_per_question * 1000)) / 100);
        addedPoints = 100 + Math.floor(speedBonus);
      }
      return { ...p, score: (p.score || 0) + addedPoints };
    });

    // Guardar resultados de esta pregunta
    const questionResult = {
      question_index: tournament.current_question,
      correct_answer: correctIndex,
      player_answers: tournament.players.map(p => ({
        email: p.email,
        answer: p.current_answer,
        time: p.answer_time,
        correct: p.current_answer === correctIndex
      }))
    };

    await base44.entities.Tournament.update(tournament.id, {
      status: 'showing_results',
      players: updatedPlayers,
      results_per_question: [...(tournament.results_per_question || []), questionResult]
    });

    // Después de 4 segundos, siguiente pregunta o finalizar
    setTimeout(async () => {
      const latestTournament = await base44.entities.Tournament.filter({ code });
      const t = latestTournament[0];
      
      if (t.current_question >= t.questions.length - 1) {
        await base44.entities.Tournament.update(t.id, {
          status: 'completed'
        });
      } else {
        await base44.entities.Tournament.update(t.id, {
          status: 'in_progress',
          current_question: t.current_question + 1,
          question_started_at: new Date().toISOString(),
          players: t.players.map(p => ({ ...p, current_answer: -1, answer_time: null }))
        });
        setSelectedAnswer(-1);
        setHasAnswered(false);
      }
    }, 4000);
  }, [isHost, tournament, code]);

  const copyCode = () => {
    navigator.clipboard.writeText(tournament?.code);
    toast.success('Código copiado');
  };

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando torneo...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = tournament.questions?.[tournament.current_question];
  const sortedPlayers = [...(tournament.players || [])].sort((a, b) => (b.score || 0) - (a.score || 0));

  // Sala de espera
  if (tournament.status === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto">
          <Card className="text-center">
            <CardContent className="p-8">
              <Trophy className="w-16 h-16 text-purple-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">{tournament.name || tournament.quiz_title}</h1>
              <p className="text-gray-500 mb-6">{tournament.quiz_title}</p>

              <div className="bg-purple-100 rounded-xl p-4 mb-6">
                <p className="text-sm text-purple-600 mb-1">Código del torneo</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-3xl font-mono font-bold text-purple-700">{tournament.code}</span>
                  <Button variant="ghost" size="sm" onClick={copyCode}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-3">Jugadores ({tournament.players?.length}/3)</p>
                <div className="space-y-2">
                  {tournament.players?.map((player, idx) => (
                    <div key={player.email} className="flex items-center justify-center gap-2 p-2 bg-gray-50 rounded-lg">
                      {idx === 0 && <Crown className="w-4 h-4 text-yellow-500" />}
                      <span className="font-medium">{player.username}</span>
                      {player.email === currentUser?.email && (
                        <Badge variant="secondary" className="text-xs">Tú</Badge>
                      )}
                    </div>
                  ))}
                  {Array.from({ length: 3 - (tournament.players?.length || 0) }).map((_, i) => (
                    <div key={i} className="p-2 bg-gray-100 rounded-lg text-gray-400 border-2 border-dashed">
                      Esperando jugador...
                    </div>
                  ))}
                </div>
              </div>

              {isHost ? (
                <Button
                  onClick={() => startTournamentMutation.mutate()}
                  disabled={tournament.players?.length < 2 || startTournamentMutation.isPending}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  <Play className="w-5 h-5 mr-2" />
                  {tournament.players?.length < 2 ? 'Esperando más jugadores...' : 'Iniciar torneo'}
                </Button>
              ) : (
                <p className="text-gray-500">Esperando a que el anfitrión inicie el torneo...</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Countdown
  if (tournament.status === 'countdown') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={countdown}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-9xl font-bold text-white"
          >
            {countdown > 0 ? countdown : '¡YA!'}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // Resultados finales
  if (tournament.status === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold mb-6">¡Torneo finalizado!</h1>

              <div className="space-y-3 mb-8">
                {sortedPlayers.map((player, idx) => (
                  <div 
                    key={player.email}
                    className={`p-4 rounded-xl flex items-center gap-3 ${
                      idx === 0 ? 'bg-yellow-100 border-2 border-yellow-400' :
                      idx === 1 ? 'bg-gray-100 border-2 border-gray-300' :
                      'bg-orange-50 border-2 border-orange-200'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold ${
                      idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                      idx === 1 ? 'bg-gray-300 text-gray-700' :
                      'bg-orange-300 text-orange-800'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold">{player.username}</p>
                      {player.email === currentUser?.email && (
                        <Badge variant="secondary" className="text-xs">Tú</Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{player.score || 0}</p>
                      <p className="text-xs text-gray-500">puntos</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link to={createPageUrl('TournamentLobby')}>
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  Volver al lobby
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Juego en progreso
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header con scores */}
        <div className="flex justify-between items-center mb-4">
          {sortedPlayers.map((player, idx) => (
            <div 
              key={player.email}
              className={`flex-1 text-center p-2 rounded-lg mx-1 ${
                player.email === currentUser?.email ? 'bg-purple-600' : 'bg-purple-800/50'
              }`}
            >
              <p className="text-white text-xs truncate">{player.username}</p>
              <p className="text-white text-xl font-bold">{player.score || 0}</p>
              {showingResults && player.current_answer !== -1 && (
                <div className="mt-1">
                  {player.current_answer === currentQuestion?.answerOptions?.findIndex(o => o.isCorrect) 
                    ? <CheckCircle2 className="w-4 h-4 text-green-400 mx-auto" />
                    : <XCircle className="w-4 h-4 text-red-400 mx-auto" />
                  }
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Timer y progreso */}
        <div className="mb-4">
          <div className="flex justify-between text-white text-sm mb-1">
            <span>Pregunta {tournament.current_question + 1}/{tournament.questions.length}</span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" /> {timeLeft}s
            </span>
          </div>
          <Progress 
            value={(timeLeft / tournament.time_per_question) * 100} 
            className="h-2 bg-purple-800"
          />
        </div>

        {/* Pregunta */}
        <Card className="mb-4">
          <CardContent className="p-6">
            <p className="text-lg font-medium text-center">
              <MathText text={currentQuestion?.question} />
            </p>
          </CardContent>
        </Card>

        {/* Opciones */}
        <div className="grid grid-cols-1 gap-3">
          {currentQuestion?.answerOptions?.map((option, idx) => {
            const isCorrect = option.isCorrect;
            const isSelected = selectedAnswer === idx;
            const showResult = showingResults;

            return (
              <motion.button
                key={idx}
                whileTap={{ scale: hasAnswered ? 1 : 0.98 }}
                onClick={() => handleAnswer(idx)}
                disabled={hasAnswered || timeLeft === 0}
                className={`p-4 rounded-xl text-left transition-all ${
                  showResult && isCorrect
                    ? 'bg-green-500 text-white'
                    : showResult && isSelected && !isCorrect
                    ? 'bg-red-500 text-white'
                    : isSelected
                    ? 'bg-purple-500 text-white'
                    : 'bg-white hover:bg-purple-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    showResult && isCorrect ? 'bg-green-600' :
                    showResult && isSelected && !isCorrect ? 'bg-red-600' :
                    isSelected ? 'bg-purple-600' : 'bg-gray-200'
                  } ${isSelected || (showResult && isCorrect) ? 'text-white' : 'text-gray-600'}`}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className="flex-1">
                    <MathText text={option.text} />
                  </span>
                  {showResult && isCorrect && <CheckCircle2 className="w-6 h-6" />}
                  {showResult && isSelected && !isCorrect && <XCircle className="w-6 h-6" />}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Estado de respuestas */}
        <div className="mt-4 flex justify-center gap-4">
          {tournament.players?.map(player => (
            <div key={player.email} className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded-full ${
                player.current_answer !== -1 ? 'bg-green-500' : 'bg-gray-400'
              }`} />
              <span className="text-white text-xs">{player.username}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}