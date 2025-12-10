import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Swords, Clock, Zap, Trophy, Target, User, Loader2, Crown, Medal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QuestionView from '../components/quiz/QuestionView';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import confetti from 'canvas-confetti';

export default function ChallengePlayPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [challenge, setChallenge] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState([]);
  const [correctAnswers, setCorrectAnswers] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [finalResult, setFinalResult] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [opponentProgress, setOpponentProgress] = useState({ answered: 0, score: 0 });
  const [showCountdown, setShowCountdown] = useState(true);
  const [countdown, setCountdown] = useState(3);
  const timerRef = useRef(null);
  const pollingRef = useRef(null);
  
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadData = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      const urlParams = new URLSearchParams(window.location.search);
      const challengeId = urlParams.get('id');
      
      if (challengeId) {
        const challenges = await base44.entities.Challenge.filter({ id: challengeId });
        if (challenges.length > 0) {
          setChallenge(challenges[0]);
        }
      }
    };
    loadData();
  }, []);

  // Countdown inicial
  useEffect(() => {
    if (!challenge || !showCountdown) return;
    
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setShowCountdown(false);
      // Iniciar timer
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
  }, [countdown, challenge, showCountdown]);

  // Polling para progreso del oponente en tiempo real
  useEffect(() => {
    if (!challenge || !currentUser || isCompleted || waitingForOpponent) return;

    pollingRef.current = setInterval(async () => {
      const updated = await base44.entities.Challenge.filter({ id: challenge.id });
      if (updated.length > 0) {
        const c = updated[0];
        const isChallenger = c.challenger_email === currentUser.email;
        setOpponentProgress({
          answered: isChallenger ? (c.opponent_answered || 0) : (c.challenger_answered || 0),
          score: isChallenger ? (c.opponent_score || 0) : (c.challenger_score || 0),
          finished: isChallenger ? c.opponent_finished : c.challenger_finished
        });
      }
    }, 2000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [challenge, currentUser, isCompleted, waitingForOpponent]);

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const updateChallengeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Challenge.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['active-challenges']);
      queryClient.invalidateQueries(['completed-challenges']);
    }
  });

  const handleAnswer = async (isCorrect, selectedOption, question) => {
    const newScore = isCorrect ? score + 1 : score;
    const newAnswered = currentQuestionIndex + 1;
    
    if (isCorrect) {
      setScore(newScore);
      setCorrectAnswers([...correctAnswers, {
        question: question.question,
        selected_answer: selectedOption.text
      }]);
    } else {
      setWrongAnswers([...wrongAnswers, {
        question: question.question,
        selected_answer: selectedOption.text,
        correct_answer: question.answerOptions.find(opt => opt.isCorrect)?.text
      }]);
    }

    // Actualizar progreso en tiempo real
    const isChallenger = challenge.challenger_email === currentUser.email;
    const progressUpdate = isChallenger 
      ? { challenger_answered: newAnswered, challenger_score: newScore }
      : { opponent_answered: newAnswered, opponent_score: newScore };
    
    await updateChallengeMutation.mutateAsync({
      id: challenge.id,
      data: progressUpdate
    });

    const isLastQuestion = currentQuestionIndex >= challenge.questions.length - 1;
    
    if (!isLastQuestion) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Finalizar reto
      if (timerRef.current) clearInterval(timerRef.current);
      await finishChallenge(newScore);
    }
  };

  const finishChallenge = async (finalScore) => {
    const isChallenger = challenge.challenger_email === currentUser.email;
    
    const updateData = isChallenger 
      ? { challenger_score: finalScore, challenger_finished: true, challenger_time: elapsedTime }
      : { opponent_score: finalScore, opponent_finished: true, opponent_time: elapsedTime };

    // Refrescar challenge para obtener estado actual
    const refreshed = await base44.entities.Challenge.filter({ id: challenge.id });
    const currentChallenge = refreshed[0] || challenge;
    
    const otherFinished = isChallenger ? currentChallenge.opponent_finished : currentChallenge.challenger_finished;
    const otherScore = isChallenger ? currentChallenge.opponent_score : currentChallenge.challenger_score;

    if (otherFinished) {
      let winner = null;
      if (finalScore > otherScore) {
        winner = currentUser.email;
      } else if (otherScore > finalScore) {
        winner = isChallenger ? challenge.opponent_email : challenge.challenger_email;
      }

      updateData.status = 'completed';
      updateData.winner_email = winner;

      await updateChallengeMutation.mutateAsync({
        id: challenge.id,
        data: updateData
      });

      const result = {
        myScore: finalScore,
        opponentScore: otherScore,
        isWinner: finalScore > otherScore,
        isTie: finalScore === otherScore,
        myTime: elapsedTime,
        opponentTime: isChallenger ? currentChallenge.opponent_time : currentChallenge.challenger_time
      };
      
      setFinalResult(result);
      setIsCompleted(true);
      
      // Confetti si ganó
      if (result.isWinner) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    } else {
      await updateChallengeMutation.mutateAsync({
        id: challenge.id,
        data: updateData
      });
      setWaitingForOpponent(true);

      const checkOpponent = setInterval(async () => {
        const updated = await base44.entities.Challenge.filter({ id: challenge.id });
        if (updated.length > 0 && updated[0].status === 'completed') {
          clearInterval(checkOpponent);
          const c = updated[0];
          const myFinalScore = isChallenger ? c.challenger_score : c.opponent_score;
          const oppScore = isChallenger ? c.opponent_score : c.challenger_score;
          const oppTime = isChallenger ? c.opponent_time : c.challenger_time;
          
          const result = {
            myScore: myFinalScore,
            opponentScore: oppScore,
            isWinner: myFinalScore > oppScore,
            isTie: myFinalScore === oppScore,
            myTime: elapsedTime,
            opponentTime: oppTime
          };
          
          setFinalResult(result);
          setWaitingForOpponent(false);
          setIsCompleted(true);
          
          if (result.isWinner) {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          }
        }
      }, 2000);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBack = () => {
    window.location.href = '/Quizzes';
  };

  const getOpponentName = () => {
    return challenge?.challenger_email === currentUser?.email 
      ? challenge?.opponent_username 
      : challenge?.challenger_username;
  };

  if (!challenge || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-900">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  // Countdown inicial
  if (showCountdown) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center">
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
            <div className="text-6xl font-bold text-white">¡A jugar!</div>
          )}
          <p className="text-white/60 mt-4">vs {getOpponentName()}</p>
        </motion.div>
      </div>
    );
  }

  // Pantalla de espera
  if (waitingForOpponent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <Card className="max-w-md w-full border-0 shadow-2xl">
            <CardContent className="p-8 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="mb-6"
              >
                <Swords className="w-16 h-16 mx-auto text-indigo-600" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-2">¡Terminaste!</h2>
              
              <div className="bg-indigo-50 rounded-xl p-4 mb-4">
                <div className="text-4xl font-bold text-indigo-600">{score}/{challenge.questions.length}</div>
                <div className="text-sm text-gray-500">Tu puntaje</div>
                <div className="flex items-center justify-center gap-2 mt-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(elapsedTime)}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Esperando a {getOpponentName()}...</span>
              </div>

              {opponentProgress.answered > 0 && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Progreso de {getOpponentName()}</div>
                  <Progress value={(opponentProgress.answered / challenge.questions.length) * 100} className="h-2" />
                  <div className="text-xs text-gray-500 mt-1">{opponentProgress.answered}/{challenge.questions.length}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Pantalla de resultado
  if (isCompleted && finalResult) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${
        finalResult.isWinner 
          ? 'bg-gradient-to-br from-green-600 to-emerald-700' 
          : finalResult.isTie 
          ? 'bg-gradient-to-br from-gray-600 to-gray-700'
          : 'bg-gradient-to-br from-red-600 to-rose-700'
      }`}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0.4 }}
          className="max-w-md w-full"
        >
          <Card className="border-0 shadow-2xl overflow-hidden">
            <div className={`py-6 text-center ${
              finalResult.isWinner 
                ? 'bg-gradient-to-r from-yellow-400 to-orange-400' 
                : finalResult.isTie 
                ? 'bg-gradient-to-r from-gray-400 to-gray-500'
                : 'bg-gradient-to-r from-gray-700 to-gray-800'
            }`}>
              <motion.div
                initial={{ rotate: -10 }}
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {finalResult.isWinner ? (
                  <Crown className="w-16 h-16 mx-auto text-white drop-shadow-lg" />
                ) : finalResult.isTie ? (
                  <Medal className="w-16 h-16 mx-auto text-white drop-shadow-lg" />
                ) : (
                  <Swords className="w-16 h-16 mx-auto text-white/80" />
                )}
              </motion.div>
              <h2 className="text-3xl font-bold text-white mt-2 drop-shadow">
                {finalResult.isWinner ? '¡VICTORIA!' : finalResult.isTie ? 'EMPATE' : 'Derrota'}
              </h2>
            </div>
            
            <CardContent className="p-6">
              <p className="text-center text-gray-500 mb-4 flex items-center justify-center gap-2">
                <Swords className="w-4 h-4" />
                vs {getOpponentName()}
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className={`text-center p-4 rounded-xl ${finalResult.isWinner ? 'bg-green-50 ring-2 ring-green-400' : 'bg-gray-50'}`}>
                  <User className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                  <div className="text-3xl font-bold text-gray-900">{finalResult.myScore}</div>
                  <div className="text-xs text-gray-500">Tú</div>
                  {finalResult.myTime && (
                    <div className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(finalResult.myTime)}
                    </div>
                  )}
                </div>
                <div className={`text-center p-4 rounded-xl ${!finalResult.isWinner && !finalResult.isTie ? 'bg-red-50 ring-2 ring-red-400' : 'bg-gray-50'}`}>
                  <User className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                  <div className="text-3xl font-bold text-gray-900">{finalResult.opponentScore}</div>
                  <div className="text-xs text-gray-500 truncate">{getOpponentName()}</div>
                  {finalResult.opponentTime && (
                    <div className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(finalResult.opponentTime)}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-4 text-center">
                <div className="text-xs text-gray-500">Quiz</div>
                <div className="font-medium text-gray-900">{challenge.quiz_title}</div>
                <div className="text-xs text-gray-400">{challenge.questions.length} preguntas</div>
              </div>

              <Button onClick={handleBack} className="w-full bg-indigo-600 hover:bg-indigo-700">
                Volver a cuestionarios
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Juego en progreso
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header fijo con info del duelo */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <Button onClick={handleBack} variant="ghost" size="sm" className="h-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            
            {/* Marcador central */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-indigo-600">{score}</div>
                <div className="text-[10px] text-gray-500">Tú</div>
              </div>
              
              <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full">
                <Swords className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-medium text-indigo-600">VS</span>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold text-gray-600">{opponentProgress.score}</div>
                <div className="text-[10px] text-gray-500 truncate max-w-[60px]">{getOpponentName()}</div>
              </div>
            </div>
            
            {/* Timer */}
            <div className="flex items-center gap-1 text-sm font-mono bg-gray-100 px-2 py-1 rounded">
              <Clock className="w-3 h-3 text-gray-500" />
              <span>{formatTime(elapsedTime)}</span>
            </div>
          </div>

          {/* Barras de progreso */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <Progress value={((currentQuestionIndex + 1) / challenge.questions.length) * 100} className="h-1.5" />
              <div className="text-[10px] text-gray-400 mt-0.5">{currentQuestionIndex + 1}/{challenge.questions.length}</div>
            </div>
            <div>
              <Progress value={(opponentProgress.answered / challenge.questions.length) * 100} className="h-1.5 [&>div]:bg-gray-400" />
              <div className="text-[10px] text-gray-400 mt-0.5 text-right">
                {opponentProgress.finished ? '✓ Terminó' : `${opponentProgress.answered}/${challenge.questions.length}`}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 pt-4">
        <QuestionView
          key={currentQuestionIndex}
          question={challenge.questions[currentQuestionIndex]}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={challenge.questions.length}
          correctAnswers={score}
          wrongAnswers={wrongAnswers.length}
          onAnswer={handleAnswer}
        />
      </div>
    </div>
  );
}