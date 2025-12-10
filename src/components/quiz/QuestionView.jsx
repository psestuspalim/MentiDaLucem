import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Lightbulb, ChevronRight, ChevronLeft, Bookmark, RefreshCw, BookOpen, Loader2, Workflow, ChevronDown, MessageSquare, Settings } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import MathText from './MathText';
import ImageQuestionView from './ImageQuestionView';



export default function QuestionView({
  question,
  questionNumber,
  totalQuestions,
  correctAnswers = 0,
  wrongAnswers = 0,
  onAnswer,
  onBack,
  onMarkForReview,
  previousAttempts = [],
  quizId,
  userEmail,
  settings = {}
}) {
  // Configuraciones con valores por defecto (Initial state from props)
  const [localSettings, setLocalSettings] = useState({
    showFeedback: settings.show_feedback !== false,
    showReflection: settings.show_reflection !== false,
    showErrorAnalysis: settings.show_error_analysis !== false,
    showSchema: settings.show_schema !== false,
    showNotes: settings.show_notes !== false,
    showHint: settings.show_hint !== false,
  });

  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isMarked, setIsMarked] = useState(false);
  const [userNote, setUserNote] = useState('');
  const [reflectionText, setReflectionText] = useState('');
  const [rephrasing, setRephrasing] = useState(false);
  const [rephrasedQuestion, setRephrasedQuestion] = useState(null);
  const [loadingEtymology, setLoadingEtymology] = useState(false);
  const [etymology, setEtymology] = useState(null);
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [schema, setSchema] = useState(null);
  const [showNotesField, setShowNotesField] = useState(false);
  const [answerStartTime, setAnswerStartTime] = useState(Date.now());

  // ... (handlers)

  const toggleSetting = (key) => {
    setLocalSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ... (rest of imports)


  const handleRephrase = async () => {
    setRephrasing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Reformula esta pregunta de forma más simple y clara para un estudiante que no la entiende. NO des la respuesta, solo explica qué se está preguntando de forma más accesible:

Pregunta: "${question.question}"

Responde en español con una explicación breve y clara.`,
        response_json_schema: {
          type: "object",
          properties: {
            rephrased: { type: "string", description: "La pregunta reformulada de forma más simple" }
          }
        }
      });
      setRephrasedQuestion(result.rephrased);
    } catch (error) {
      console.error('Error rephrasing:', error);
    } finally {
      setRephrasing(false);
    }
  };

  const handleEtymology = async () => {
    setLoadingEtymology(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Extrae los términos médicos de esta pregunta y DESCOMPÓNLOS en prefijos, raíces y sufijos griegos/latinos.

REGLAS ESTRICTAS:
1. SOLO muestra la descomposición morfológica (prefijo + raíz + sufijo)
2. NO des definiciones médicas ni explicaciones clínicas
3. Cada parte debe mostrar: la partícula + su origen (griego/latín) + significado LITERAL

FORMATO EXACTO:
"hipoglucemia" → hipo- (gr. bajo) + gluc- (gr. dulce) + -emia (gr. sangre)
"taquicardia" → taqui- (gr. rápido) + -cardia (gr. corazón)
"hepatomegalia" → hepato- (gr. hígado) + -megalia (gr. agrandamiento)

Pregunta: "${question.question}"

Descompón SOLO la estructura morfológica. Nada de explicaciones médicas.`,
        response_json_schema: {
          type: "object",
          properties: {
            terms: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  term: { type: "string", description: "El término médico completo" },
                  breakdown: { type: "string", description: "Descomposición en formato: parte1- (origen: significado) + parte2- (origen: significado)" }
                }
              }
            }
          }
        }
      });
      setEtymology(result.terms);
    } catch (error) {
      console.error('Error getting etymology:', error);
    } finally {
      setLoadingEtymology(false);
    }
  };

  const handleGenerateSchema = async () => {
    setLoadingSchema(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Genera una representación gráfica esquemática usando emojis y texto del proceso o concepto al que se refiere esta pregunta. Usa flechas (→, ↓), viñetas, y emojis relevantes para crear un diagrama visual de texto que ayude al estudiante a entender el proceso.

Pregunta: "${question.question}"
Respuesta correcta: "${question.answerOptions?.find(opt => opt.isCorrect)?.text || ''}"

Crea un esquema visual claro y educativo en español. Usa saltos de línea para organizar la información.`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Título breve del proceso/concepto" },
            schema: { type: "string", description: "El esquema visual con emojis y flechas" },
            summary: { type: "string", description: "Resumen de una línea del concepto clave" }
          }
        }
      });
      setSchema(result);
    } catch (error) {
      console.error('Error generating schema:', error);
    } finally {
      setLoadingSchema(false);
    }
  };

  // Si es pregunta de imagen (sin answerOptions), usar el componente especializado
  if (question.type === 'image' && !question.answerOptions) {
    return (
      <ImageQuestionView
        question={question}
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
        onAnswer={(isCorrect, details) => onAnswer(isCorrect, details, question)}
      />
    );
  }

  const handleSelectAnswer = (index) => {
    if (showFeedback) return;
    setSelectedAnswer(index);
    setShowFeedback(true);
  };

  const responseTime = showFeedback ? Math.round((Date.now() - answerStartTime) / 1000) : null;

  const selectedOption = selectedAnswer !== null ? question.answerOptions[selectedAnswer] : null;

  const handleNext = () => {
    const isCorrect = selectedOption.isCorrect;
    onAnswer(isCorrect, selectedOption, question);
    setUserNote('');
    setReflectionText('');
  };

  const canProceed = selectedOption?.isCorrect || !localSettings.showReflection || reflectionText.trim().length >= 10;
  const answeredQuestions = correctAnswers + wrongAnswers;
  const progressPercent = (questionNumber / totalQuestions) * 100;

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 pb-12">
      {/* Header compacto con progreso y score */}
      <div className="glass sticky top-2 z-20 rounded-2xl mb-6 p-4 relative overflow-hidden transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5" />

        <div className="flex items-center justify-between gap-4 relative z-10">
          {/* Score badges */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {correctAnswers}
            </div>
            <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
              <XCircle className="w-3.5 h-3.5" />
              {wrongAnswers}
            </div>
          </div>

          {/* Progress */}
          <div className="flex-1 max-w-[240px]">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2.5 bg-gray-200/50 dark:bg-white/10 rounded-full overflow-hidden backdrop-blur-sm shadow-inner">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap tabular-nums">
                {questionNumber} / {totalQuestions}
              </span>
            </div>
          </div>

          {/* Mark / Settings */}
          <div className="flex items-center gap-1">
            {onMarkForReview && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsMarked(!isMarked);
                  onMarkForReview(question, !isMarked);
                }}
                className={`h-9 w-9 p-0 rounded-xl transition-all ${isMarked ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400' : 'hover:bg-white/20 dark:hover:bg-white/10 text-gray-400'}`}
              >
                <Bookmark className={`w-4 h-4 ${isMarked ? 'fill-current' : ''}`} />
              </Button>
            )}
            <div className="relative">
              <Button variant="ghost" size="sm" onClick={() => setShowSettingsMenu(!showSettingsMenu)} className="h-9 w-9 p-0 rounded-xl hover:bg-white/20 dark:hover:bg-white/10 text-gray-400 dark:text-gray-300">
                <Settings className="w-4 h-4" />
              </Button>
              {/* Settings Dropdown styled as glass */}
              {showSettingsMenu && (
                <div className="absolute right-0 top-full mt-2 w-60 glass rounded-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200 shadow-2xl border border-white/20">
                  <p className="text-[10px] uppercase font-bold text-gray-400 px-3 py-2 tracking-wider border-b border-gray-100 dark:border-white/5">Configuración de Visualización</p>
                  <div className="p-1 space-y-0.5">
                    {[
                      { k: 'showReflection', l: 'Reflexión de error' },
                      { k: 'showHint', l: 'Tips Cinéfilos' },
                      { k: 'showSchema', l: 'Esquemas IA' },
                      { k: 'showNotes', l: 'Bloc de Notas' },
                    ].map(opt => (
                      <div key={opt.k} className="flex items-center justify-between px-3 py-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg cursor-pointer transition-colors" onClick={() => toggleSetting(opt.k)}>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-200">{opt.l}</span>
                        <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${localSettings[opt.k] ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                          <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${localSettings[opt.k] ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] min-h-[600px]">
        {/* COLUMN 1: QUESTION (4/12) - Left */}
        <div className="lg:col-span-4 flex flex-col h-full overflow-y-auto custom-scrollbar pr-2">
          <Card className="glass-card border-0 overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex items-start gap-4 mb-4">
                <Badge className="bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 text-sm py-1 px-3 shrink-0 rounded-lg mt-1">
                  #{questionNumber}
                </Badge>
                {/* Botones de ayuda - Inline (Top Right of Question Card) - Only show if not waiting for feedback or if feedback is shown */}
                {/* Botones de ayuda eliminados por solicitud del usuario */}
                <div className="flex-1 flex justify-end gap-2">
                  {/* Espacio reservado para futuras heramientas */}
                </div>
              </div>

              <div className="prose dark:prose-invert max-w-none mb-6">
                <p className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white/95 leading-relaxed tracking-tight">
                  <MathText text={question.question} />
                </p>
              </div>

              {/* Imagen si existe */}
              {question.imageUrl && (
                <div className="mt-6 rounded-xl overflow-hidden border border-white/20 bg-black/5 dark:bg-white/5 shadow-inner">
                  <img
                    src={question.imageUrl}
                    alt="Pregunta"
                    className="w-full h-auto object-contain max-h-[400px]"
                  />
                </div>
              )}
            </div>
          </Card>

          {/* Helper Content (Expandable) */}
          <AnimatePresence>
            {(rephrasedQuestion || etymology) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-4"
              >
                {rephrasedQuestion && (
                  <div className="glass p-5 rounded-xl border-l-4 border-l-blue-500 shadow-lg relative">
                    <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-6 w-6 opacity-50 hover:opacity-100" onClick={() => setRephrasedQuestion(null)}><XCircle className="w-4 h-4" /></Button>
                    <p className="text-xs text-blue-600 dark:text-blue-300 font-bold mb-2 flex items-center gap-2">
                      <RefreshCw className="w-3 h-3" /> SIMPLIFICACIÓN
                    </p>
                    <p className="text-gray-700 dark:text-gray-200 leading-relaxed text-sm">{rephrasedQuestion}</p>
                  </div>
                )}
                {etymology && (
                  <div className="glass p-5 rounded-xl border-l-4 border-l-purple-500 shadow-lg relative">
                    <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-6 w-6 opacity-50 hover:opacity-100" onClick={() => setEtymology(null)}><XCircle className="w-4 h-4" /></Button>
                    <p className="text-xs text-purple-600 dark:text-purple-300 font-bold mb-2 flex items-center gap-2">
                      <BookOpen className="w-3 h-3" /> RAÍCES
                    </p>
                    <div className="grid gap-2">
                      {etymology.map((t, i) => (
                        <div key={i} className="text-gray-700 dark:text-gray-200 bg-purple-50/50 dark:bg-purple-900/20 p-2 rounded-lg text-sm">
                          <span className="font-bold text-purple-700 dark:text-purple-300">{t.term}</span>
                          <span className="mx-2 text-purple-400">→</span>
                          <span>{t.breakdown}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* COLUMN 2: OPTIONS (4/12) - Center */}
        <div className="lg:col-span-4 flex flex-col gap-4 h-full overflow-y-auto custom-scrollbar px-2">
          <div className="flex-1 space-y-3 flex flex-col justify-center">
            {question.answerOptions.map((option, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleSelectAnswer(index)}
                className={`
                    group relative w-full p-4 text-left rounded-2xl border-2 transition-all duration-300
                    ${selectedAnswer === index
                    ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_30px_-5px_rgba(99,102,241,0.3)]'
                    : 'border-transparent bg-white/5 hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98]'
                  }
                    ${showFeedback && option.isCorrect ? 'border-green-500 bg-green-500/10 ring-2 ring-green-500/20' : ''}
                    ${showFeedback && selectedAnswer === index && !option.isCorrect ? 'border-red-500 bg-red-500/10' : ''}
                    ${showFeedback && !option.isCorrect && selectedAnswer !== index ? 'opacity-50 grayscale' : ''}
                  `}
                disabled={showFeedback}
              >
                <div className="flex items-start gap-4">
                  <div className={`
                         flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                         ${selectedAnswer === index ? 'bg-indigo-600 text-white' : 'bg-white/10 text-muted-foreground group-hover:bg-white/20'}
                         ${showFeedback && option.isCorrect ? '!bg-green-600 !text-white' : ''}
                         ${showFeedback && !option.isCorrect && selectedAnswer === index ? '!bg-red-600 !text-white' : ''}
                      `}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <div className="flex-1 pt-1 text-sm sm:text-base font-medium leading-normal text-foreground/90">
                    <MathText text={option.text} />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* NEXT BUTTON - Located below options in Center Column */}
          <div className="mt-auto pt-4 sticky bottom-0 bg-transparent">
            <Button
              onClick={handleNext}
              disabled={!showFeedback || !canProceed}
              className={`w-full h-14 text-lg font-bold shadow-xl transition-all rounded-2xl
                 ${showFeedback && canProceed
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white hover:scale-[1.02] active:scale-[0.98] shadow-indigo-500/25'
                  : 'bg-gray-200 dark:bg-white/5 text-gray-400 cursor-not-allowed'
                }`}
            >
              <span>{questionNumber === totalQuestions ? 'Finalizar Quiz' : 'Siguiente Pregunta'}</span>
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* COLUMN 3: FEEDBACK & HELPERS (4/12) - Right */}
        <div className="lg:col-span-4 h-full relative overflow-y-auto custom-scrollbar pl-2">
          <AnimatePresence mode="wait">
            {showFeedback && selectedOption ? (
              <motion.div
                key="feedback-panel"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* FEEDBACK MAIN CARD */}
                <div className={`p-6 rounded-3xl border ${selectedOption.isCorrect ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                  <div className="flex items-center gap-3 mb-4">
                    {selectedOption.isCorrect ? <CheckCircle2 className="w-8 h-8 text-green-500" /> : <XCircle className="w-8 h-8 text-red-500" />}
                    <h3 className={`text-xl font-bold ${selectedOption.isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {selectedOption.isCorrect ? '¡Correcto!' : 'Incorrecto'}
                    </h3>
                  </div>
                  <p className="text-foreground/90 leading-relaxed text-sm">
                    <MathText text={question.explanation || "No hay explicación disponible para esta pregunta."} />
                  </p>
                </div>

                {/* REFLECTION INPUT (Only if incorrect) */}
                {!selectedOption.isCorrect && localSettings.showReflection && (
                  <div className="glass-card p-5 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-amber-500 font-bold text-sm">
                      <RefreshCw className="w-4 h-4" /> Reflexiona sobre tu error
                    </div>
                    <textarea
                      value={reflectionText}
                      onChange={(e) => setReflectionText(e.target.value)}
                      placeholder="¿Por qué elegiste la opción incorrecta? Analiza tu pensamiento..."
                      className="w-full h-24 bg-black/5 dark:bg-white/5 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500/50 outline-none resize-none"
                    />
                  </div>
                )}



                {/* DYNAMIC CONTENT AREAS (Schema, Notes, Tip) */}
                {schema && localSettings.showSchema && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass-card p-4 rounded-xl border border-purple-500/20">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-sm text-purple-400">{schema.title}</h4>
                      <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setSchema(null)}><XCircle className="w-4 h-4 opacity-50" /></Button>
                    </div>
                    <div className="whitespace-pre-line text-xs font-mono text-muted-foreground bg-black/20 p-3 rounded-lg">
                      {schema.schema}
                    </div>
                    <p className="text-xs mt-2 italic opacity-70">{schema.summary}</p>
                  </motion.div>
                )}

                {showHint && localSettings.showHint && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass-card p-4 rounded-xl border border-yellow-500/20">
                    <div className="flex items-start gap-2">
                      <span className="text-xl">🍿</span>
                      <div>
                        <h4 className="font-bold text-yellow-600 text-xs uppercase mb-1">Tip Cinéfilo</h4>
                        <p className="text-xs text-muted-foreground"><MathText text={question.hint} /></p>
                      </div>
                    </div>
                  </motion.div>
                )}

                <AnimatePresence>
                  {showNotesField && localSettings.showNotes && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <textarea
                        value={userNote}
                        onChange={(e) => setUserNote(e.target.value)}
                        placeholder="Escribe tus notas aquí..."
                        className="w-full p-3 text-sm border border-blue-200/20 rounded-lg bg-blue-500/5 focus:ring-1 focus:ring-blue-400 resize-none h-24"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

              </motion.div>
            ) : (
              /* EMPTY STATE / PLACEHOLDER */
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-30 min-h-[400px]">
                <div className="bg-white/10 p-6 rounded-full mb-4">
                  <MessageSquare className="w-12 h-12" />
                </div>
                <p className="text-sm font-medium">Selecciona una respuesta para ver el análisis.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div >
  );
}