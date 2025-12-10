import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Swords, Check, X, Trophy, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function ChallengeNotifications({ currentUser, onStartChallenge }) {
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [completedChallenge, setCompletedChallenge] = useState(null);
  
  const queryClient = useQueryClient();

  // Obtener retos pendientes para este usuario
  const { data: pendingChallenges = [] } = useQuery({
    queryKey: ['pending-challenges', currentUser?.email],
    queryFn: async () => {
      const challenges = await base44.entities.Challenge.filter({
        opponent_email: currentUser?.email,
        status: 'pending'
      });
      return challenges;
    },
    refetchInterval: 5000,
    enabled: !!currentUser?.email
  });

  // Obtener retos activos (donde participamos)
  const { data: activeChallenges = [] } = useQuery({
    queryKey: ['active-challenges', currentUser?.email],
    queryFn: async () => {
      const asChallenger = await base44.entities.Challenge.filter({
        challenger_email: currentUser?.email,
        status: 'accepted'
      });
      const asOpponent = await base44.entities.Challenge.filter({
        opponent_email: currentUser?.email,
        status: 'accepted'
      });
      return [...asChallenger, ...asOpponent];
    },
    refetchInterval: 5000,
    enabled: !!currentUser?.email
  });

  // Obtener retos completados recientes
  const { data: recentCompleted = [] } = useQuery({
    queryKey: ['completed-challenges', currentUser?.email],
    queryFn: async () => {
      const asChallenger = await base44.entities.Challenge.filter({
        challenger_email: currentUser?.email,
        status: 'completed'
      }, '-updated_date', 5);
      const asOpponent = await base44.entities.Challenge.filter({
        opponent_email: currentUser?.email,
        status: 'completed'
      }, '-updated_date', 5);
      return [...asChallenger, ...asOpponent]
        .sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date))
        .slice(0, 3);
    },
    refetchInterval: 10000,
    enabled: !!currentUser?.email
  });

  const updateChallengeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Challenge.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['pending-challenges']);
      queryClient.invalidateQueries(['active-challenges']);
    }
  });

  const handleAccept = async (challenge) => {
    await updateChallengeMutation.mutateAsync({
      id: challenge.id,
      data: { status: 'accepted' }
    });
  };

  const handleDecline = async (challenge) => {
    await updateChallengeMutation.mutateAsync({
      id: challenge.id,
      data: { status: 'declined' }
    });
  };

  const handlePlayChallenge = (challenge) => {
    onStartChallenge(challenge);
  };

  const showResult = (challenge) => {
    setCompletedChallenge(challenge);
    setShowResultDialog(true);
  };

  const isWinner = (challenge) => {
    return challenge.winner_email === currentUser?.email;
  };

  const isTie = (challenge) => {
    return challenge.challenger_score === challenge.opponent_score;
  };

  const getMyScore = (challenge) => {
    return challenge.challenger_email === currentUser?.email 
      ? challenge.challenger_score 
      : challenge.opponent_score;
  };

  const getOpponentScore = (challenge) => {
    return challenge.challenger_email === currentUser?.email 
      ? challenge.opponent_score 
      : challenge.challenger_score;
  };

  const getOpponentName = (challenge) => {
    return challenge.challenger_email === currentUser?.email 
      ? challenge.opponent_username 
      : challenge.challenger_username;
  };

  const hasFinished = (challenge) => {
    return challenge.challenger_email === currentUser?.email 
      ? challenge.challenger_finished 
      : challenge.opponent_finished;
  };

  if (pendingChallenges.length === 0 && activeChallenges.length === 0 && recentCompleted.length === 0) {
    return null;
  }

  return (
    <>
      <div className="space-y-3 mb-4">
        {/* Retos pendientes de aceptar */}
        <AnimatePresence>
          {pendingChallenges.map((challenge) => (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card className="border-orange-300 bg-orange-50">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Swords className="w-5 h-5 text-orange-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {challenge.challenger_username} te reta
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          {challenge.quiz_title} • {challenge.question_count} preg.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDecline(challenge)}
                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-100"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAccept(challenge)}
                        className="h-8 px-3 bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Retos activos */}
        {activeChallenges.map((challenge) => (
          <Card key={challenge.id} className="border-indigo-300 bg-indigo-50">
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Swords className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      vs {getOpponentName(challenge)}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {challenge.quiz_title}
                    </p>
                  </div>
                </div>
                {hasFinished(challenge) ? (
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Esperando...
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handlePlayChallenge(challenge)}
                    className="h-8 bg-indigo-600 hover:bg-indigo-700"
                  >
                    Jugar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Resultados recientes */}
        {recentCompleted.slice(0, 1).map((challenge) => (
          <Card 
            key={challenge.id} 
            className={`cursor-pointer ${isWinner(challenge) ? 'border-green-300 bg-green-50' : isTie(challenge) ? 'border-gray-300 bg-gray-50' : 'border-red-300 bg-red-50'}`}
            onClick={() => showResult(challenge)}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Trophy className={`w-5 h-5 ${isWinner(challenge) ? 'text-green-600' : isTie(challenge) ? 'text-gray-600' : 'text-red-600'}`} />
                  <div>
                    <p className="text-sm font-medium">
                      {isWinner(challenge) ? '¡Ganaste!' : isTie(challenge) ? 'Empate' : 'Perdiste'}
                    </p>
                    <p className="text-xs text-gray-600">
                      vs {getOpponentName(challenge)}
                    </p>
                  </div>
                </div>
                <Badge className={isWinner(challenge) ? 'bg-green-100 text-green-800' : isTie(challenge) ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'}>
                  {getMyScore(challenge)} - {getOpponentScore(challenge)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog de resultado */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Resultado del reto</DialogTitle>
          </DialogHeader>
          {completedChallenge && (
            <div className="text-center py-4">
              <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                isWinner(completedChallenge) ? 'bg-green-100' : isTie(completedChallenge) ? 'bg-gray-100' : 'bg-red-100'
              }`}>
                <Trophy className={`w-8 h-8 ${
                  isWinner(completedChallenge) ? 'text-green-600' : isTie(completedChallenge) ? 'text-gray-600' : 'text-red-600'
                }`} />
              </div>
              <h3 className="text-2xl font-bold mb-2">
                {isWinner(completedChallenge) ? '¡Victoria!' : isTie(completedChallenge) ? 'Empate' : 'Derrota'}
              </h3>
              <p className="text-gray-600 mb-4">
                vs {getOpponentName(completedChallenge)}
              </p>
              <div className="flex justify-center gap-8 text-2xl font-bold">
                <div className="text-center">
                  <div className="text-green-600">{getMyScore(completedChallenge)}</div>
                  <div className="text-xs text-gray-500">Tú</div>
                </div>
                <div className="text-gray-400">-</div>
                <div className="text-center">
                  <div className="text-red-600">{getOpponentScore(completedChallenge)}</div>
                  <div className="text-xs text-gray-500">{getOpponentName(completedChallenge)}</div>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                {completedChallenge.quiz_title}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}