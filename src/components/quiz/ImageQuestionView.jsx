import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, ArrowRight, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ImageQuestionView({ 
  question, 
  questionNumber, 
  totalQuestions,
  onAnswer,
  onNext
}) {
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [revealedMarkers, setRevealedMarkers] = useState([]);
  const imageRef = useRef(null);

  const correctOptions = question.options.filter(o => o.isCorrect);
  const allCorrectSelected = correctOptions.every(co => 
    selectedOptions.includes(co.id)
  );

  const handleOptionClick = (option) => {
    if (showResults) return;

    const isSelected = selectedOptions.includes(option.id);
    let newSelected;

    if (isSelected) {
      newSelected = selectedOptions.filter(id => id !== option.id);
      setRevealedMarkers(revealedMarkers.filter(m => m.optionId !== option.id));
    } else {
      newSelected = [...selectedOptions, option.id];
      // Revelar marcadores de esta opción
      if (option.isCorrect && option.markers) {
        setRevealedMarkers([...revealedMarkers, ...option.markers]);
      }
    }

    setSelectedOptions(newSelected);
  };

  const handleSubmit = () => {
    setShowResults(true);
    // Revelar todos los marcadores correctos
    const allMarkers = correctOptions.flatMap(o => o.markers || []);
    setRevealedMarkers(allMarkers);
  };

  const handleNext = () => {
    const correctCount = selectedOptions.filter(id => 
      correctOptions.find(o => o.id === id)
    ).length;
    const wrongCount = selectedOptions.filter(id => 
      !correctOptions.find(o => o.id === id)
    ).length;
    
    const score = Math.max(0, correctCount - wrongCount);
    const isFullyCorrect = correctCount === correctOptions.length && wrongCount === 0;
    
    onAnswer(isFullyCorrect, { score, total: correctOptions.length });
  };

  const getOptionStatus = (option) => {
    if (!showResults) {
      return selectedOptions.includes(option.id) ? 'selected' : 'default';
    }
    
    const isSelected = selectedOptions.includes(option.id);
    if (option.isCorrect) {
      return isSelected ? 'correct' : 'missed';
    } else {
      return isSelected ? 'wrong' : 'default';
    }
  };

  const getOptionStyle = (status) => {
    switch (status) {
      case 'selected':
        return 'bg-indigo-100 border-indigo-500 text-indigo-800';
      case 'correct':
        return 'bg-green-100 border-green-500 text-green-800';
      case 'wrong':
        return 'bg-red-100 border-red-500 text-red-800';
      case 'missed':
        return 'bg-yellow-50 border-yellow-400 text-yellow-800';
      default:
        return 'bg-white border-gray-300 hover:border-indigo-400';
    }
  };

  const getMarkerColor = (optionId) => {
    const colors = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'];
    const index = question.options.findIndex(o => o.id === optionId);
    return colors[index % colors.length];
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">
            Pregunta {questionNumber} de {totalQuestions}
          </span>
          <Badge variant="outline">Selección múltiple</Badge>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-indigo-600"
            initial={{ width: 0 }}
            animate={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl">{question.question}</CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Selecciona todos los elementos correctos en la imagen
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Imagen con marcadores */}
          <div className="relative rounded-lg overflow-hidden border">
            <img
              ref={imageRef}
              src={question.imageUrl}
              alt={question.question}
              className="w-full h-auto block"
            />
            
            {/* Marcadores animados */}
            <AnimatePresence>
              {revealedMarkers.map((marker, idx) => {
                const color = getMarkerColor(marker.optionId);
                return (
                  <motion.div
                    key={marker.id || idx}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="absolute pointer-events-none"
                    style={{ 
                      left: `${marker.x}%`, 
                      top: `${marker.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    {marker.type === 'circle' ? (
                      <motion.div 
                        className="w-10 h-10 rounded-full border-4"
                        style={{ 
                          borderColor: color,
                          backgroundColor: `${color}30`,
                          boxShadow: `0 0 8px ${color}`
                        }}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.5, repeat: 2 }}
                      />
                    ) : (
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 0.5, repeat: 2 }}
                      >
                        <ArrowRight 
                          className="w-8 h-8"
                          style={{ 
                            color: color,
                            filter: `drop-shadow(0 0 4px ${color})`
                          }}
                        />
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Descripción */}
          {question.description && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 leading-relaxed">{question.description}</p>
            </div>
          )}

          {/* Opciones como botones */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {question.options.map((option) => {
              const status = getOptionStatus(option);
              return (
                <motion.button
                  key={option.id}
                  whileHover={{ scale: showResults ? 1 : 1.02 }}
                  whileTap={{ scale: showResults ? 1 : 0.98 }}
                  onClick={() => handleOptionClick(option)}
                  disabled={showResults}
                  className={`p-4 rounded-lg border-2 text-center font-medium transition-all ${getOptionStyle(status)}`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {showResults && status === 'correct' && (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    )}
                    {showResults && status === 'wrong' && (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    {showResults && status === 'missed' && (
                      <span className="text-yellow-600 text-xs">(Faltó)</span>
                    )}
                    <span>{option.text}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Feedback */}
          {showResults && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-lg p-4 ${
                allCorrectSelected && selectedOptions.length === correctOptions.length
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-orange-50 border border-orange-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {allCorrectSelected && selectedOptions.length === correctOptions.length ? (
                  <>
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-green-900">¡Excelente!</h4>
                      <p className="text-sm text-green-800">
                        Identificaste correctamente todos los elementos.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6 text-orange-600 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-orange-900">Casi lo logras</h4>
                      <p className="text-sm text-orange-800">
                        Acertaste {selectedOptions.filter(id => correctOptions.find(o => o.id === id)).length} de {correctOptions.length} elementos.
                        Revisa los marcadores en la imagen.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end gap-3">
            {!showResults ? (
              <Button
                onClick={handleSubmit}
                disabled={selectedOptions.length === 0}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Verificar respuestas
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Siguiente
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}