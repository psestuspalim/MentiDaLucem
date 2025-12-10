import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, ArrowLeft, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import MathText from './MathText';

export default function SwipeQuizMode({ 
  questions, 
  onComplete,
  onExit 
}) {
  // Convertir preguntas a formato verdadero/falso
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState([]);
  const [showFeedback, setShowFeedback] = useState(null);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Convertir cada opción en una tarjeta V/F
    const allCards = [];
    questions.forEach((q, qIdx) => {
      q.answerOptions?.forEach((opt, optIdx) => {
        allCards.push({
          id: `${qIdx}-${optIdx}`,
          questionContext: q.question,
          statement: opt.text,
          isTrue: opt.isCorrect,
          rationale: opt.rationale || q.hint || q.feedback,
          originalQuestion: q
        });
      });
    });
    // Mezclar tarjetas
    setCards(allCards.sort(() => Math.random() - 0.5));
  }, [questions]);

  const handleSwipe = (direction) => {
    if (currentIndex >= cards.length || showFeedback) return;

    const card = cards[currentIndex];
    const userAnswer = direction === 'right'; // Derecha = Verdadero
    const isCorrect = userAnswer === card.isTrue;

    setShowFeedback({ isCorrect, card, userAnswer });

    setTimeout(() => {
      if (isCorrect) {
        setScore(s => s + 1);
      } else {
        setWrongAnswers(prev => [...prev, {
          statement: card.statement,
          questionContext: card.questionContext,
          userAnswer: userAnswer ? 'Verdadero' : 'Falso',
          correctAnswer: card.isTrue ? 'Verdadero' : 'Falso',
          rationale: card.rationale
        }]);
      }

      if (currentIndex >= cards.length - 1) {
        setIsComplete(true);
      } else {
        setCurrentIndex(i => i + 1);
      }
      setShowFeedback(null);
    }, card.rationale && !isCorrect ? 3000 : 1200);
  };

  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Cargando tarjetas...</p>
      </div>
    );
  }

  if (isComplete) {
    const percentage = Math.round((score / cards.length) * 100);
    return (
      <div className="max-w-md mx-auto px-4">
        <Card className="p-6 text-center">
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
            percentage >= 70 ? 'bg-green-100' : percentage >= 50 ? 'bg-yellow-100' : 'bg-red-100'
          }`}>
            <span className="text-3xl font-bold">
              {percentage}%
            </span>
          </div>
          <h2 className="text-xl font-bold mb-2">¡Completado!</h2>
          <p className="text-gray-600 mb-4">
            {score} de {cards.length} correctas
          </p>
          
          <div className="flex gap-2 mb-6">
            <div className="flex-1 bg-green-50 rounded-lg p-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-green-700">{score}</p>
              <p className="text-xs text-green-600">Correctas</p>
            </div>
            <div className="flex-1 bg-red-50 rounded-lg p-3">
              <XCircle className="w-5 h-5 text-red-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-red-700">{wrongAnswers.length}</p>
              <p className="text-xs text-red-600">Incorrectas</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onExit} className="flex-1">
              Salir
            </Button>
            <Button 
              onClick={() => onComplete(score, cards.length, wrongAnswers)}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              Guardar resultado
            </Button>
          </div>
        </Card>

        {wrongAnswers.length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="font-semibold text-gray-700">Respuestas incorrectas:</h3>
            {wrongAnswers.map((w, idx) => (
              <Card key={idx} className="p-3 bg-red-50 border-red-200">
                <p className="text-sm font-medium text-gray-900 mb-1">
                  <MathText text={w.statement} />
                </p>
                <p className="text-xs text-gray-600 mb-2">
                  Dijiste: <span className="text-red-600 font-medium">{w.userAnswer}</span> | 
                  Correcto: <span className="text-green-600 font-medium">{w.correctAnswer}</span>
                </p>
                {w.rationale && (
                  <p className="text-xs text-gray-500 border-t pt-2 mt-2">
                    <MathText text={w.rationale} />
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <div className="max-w-md mx-auto px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={onExit}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Salir
        </Button>
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-700">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {score}
          </Badge>
          <Badge className="bg-red-100 text-red-700">
            <XCircle className="w-3 h-3 mr-1" />
            {wrongAnswers.length}
          </Badge>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Tarjeta {currentIndex + 1} de {cards.length}</span>
          <span>{Math.round(((currentIndex) / cards.length) * 100)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-indigo-600"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex) / cards.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Instructions */}
      <div className="flex justify-center gap-8 mb-4 text-sm">
        <div className="flex items-center gap-1 text-red-600">
          <ChevronLeft className="w-5 h-5" />
          <span>Falso</span>
        </div>
        <div className="flex items-center gap-1 text-green-600">
          <span>Verdadero</span>
          <ChevronRight className="w-5 h-5" />
        </div>
      </div>

      {/* Swipe Card */}
      <div className="relative h-[400px]">
        <AnimatePresence>
          <SwipeCard
            key={currentCard.id}
            card={currentCard}
            onSwipe={handleSwipe}
            feedback={showFeedback}
          />
        </AnimatePresence>
      </div>

      {/* Swipe buttons for accessibility */}
      <div className="flex justify-center gap-6 mt-6">
        <Button
          size="lg"
          variant="outline"
          onClick={() => handleSwipe('left')}
          disabled={showFeedback}
          className="w-16 h-16 rounded-full border-2 border-red-300 hover:bg-red-50 hover:border-red-500"
        >
          <XCircle className="w-8 h-8 text-red-500" />
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => handleSwipe('right')}
          disabled={showFeedback}
          className="w-16 h-16 rounded-full border-2 border-green-300 hover:bg-green-50 hover:border-green-500"
        >
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </Button>
      </div>
    </div>
  );
}

function SwipeCard({ card, onSwipe, feedback }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);
  
  const rightIndicatorOpacity = useTransform(x, [0, 100], [0, 1]);
  const leftIndicatorOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (event, info) => {
    if (feedback) return;
    
    if (info.offset.x > 100) {
      onSwipe('right');
    } else if (info.offset.x < -100) {
      onSwipe('left');
    }
  };

  return (
    <motion.div
      className="absolute inset-0"
      style={{ x, rotate, opacity }}
      drag={feedback ? false : "x"}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ 
        x: feedback?.userAnswer ? 300 : -300,
        opacity: 0,
        transition: { duration: 0.3 }
      }}
    >
      <Card className={`h-full p-6 flex flex-col cursor-grab active:cursor-grabbing shadow-xl ${
        feedback ? (feedback.isCorrect ? 'ring-4 ring-green-500' : 'ring-4 ring-red-500') : ''
      }`}>
        {/* Swipe indicators */}
        <motion.div 
          className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full font-bold"
          style={{ opacity: rightIndicatorOpacity }}
        >
          VERDADERO
        </motion.div>
        <motion.div 
          className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full font-bold"
          style={{ opacity: leftIndicatorOpacity }}
        >
          FALSO
        </motion.div>

        {/* Context */}
        <div className="text-xs text-gray-500 mb-3 p-2 bg-gray-50 rounded-lg max-h-[120px] overflow-y-auto">
          <span className="font-medium">Contexto:</span>{' '}
          <MathText text={card.questionContext} />
        </div>

        {/* Statement */}
        <div className="flex-1 flex items-center justify-center overflow-y-auto py-2">
          <p className="text-base sm:text-lg font-medium text-center text-gray-900 leading-relaxed">
            <MathText text={card.statement} />
          </p>
        </div>

        {/* Feedback overlay */}
        {feedback && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`absolute inset-0 flex flex-col items-center justify-center rounded-xl p-4 overflow-y-auto ${
              feedback.isCorrect ? 'bg-green-500/95' : 'bg-red-500/95'
            }`}
          >
            <div className="text-center text-white max-w-full">
              {feedback.isCorrect ? (
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2" />
              ) : (
                <XCircle className="w-12 h-12 mx-auto mb-2" />
              )}
              <p className="text-lg font-bold">
                {feedback.isCorrect ? '¡Correcto!' : 'Incorrecto'}
              </p>
              <p className="text-sm opacity-90 mt-1">
                La respuesta es: {feedback.card.isTrue ? 'Verdadero' : 'Falso'}
              </p>
              {!feedback.isCorrect && feedback.card.rationale && (
                <div className="mt-3 p-2 bg-white/20 rounded-lg text-xs text-left max-h-[150px] overflow-y-auto">
                  <p className="font-semibold mb-1">💡 Explicación:</p>
                  <MathText text={feedback.card.rationale} />
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Bottom indicator */}
        <div className="text-center text-xs text-gray-400 mt-4">
          Desliza o usa los botones
        </div>
      </Card>
    </motion.div>
  );
}