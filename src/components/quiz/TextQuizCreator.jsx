import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Sparkles, CheckCircle2, AlertCircle, Eye, Pencil } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import MathText from './MathText';

export default function TextQuizCreator({ onSave, onCancel }) {
  const [plainText, setPlainText] = useState('');
  const [quizTitle, setQuizTitle] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [previewQuestions, setPreviewQuestions] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);

  const exampleText = `1. ¿Cuál es la capital de Francia?
a) Londres
b) París *
c) Madrid
d) Roma

2. El agua hierve a:
a) 50°C
b) 75°C
c) 100°C *
d) 150°C

3. ¿Qué órgano bombea la sangre?
a) Pulmones
b) Hígado
c) Corazón *
d) Riñón`;

  const handleProcess = async () => {
    if (!plainText.trim()) {
      setError('Por favor, ingresa el texto con las preguntas');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Convierte este texto en preguntas de opción múltiple estructuradas.

REGLAS:
1. Identifica cada pregunta y sus opciones de respuesta
2. La respuesta correcta puede estar marcada con *, (correcta), ✓, o simplemente identifícala por contexto
3. Si no hay marca clara, usa tu conocimiento para determinar la correcta
4. Genera una explicación breve (rationale) para cada respuesta correcta
5. Si el texto tiene formato libre, estructura las preguntas apropiadamente

TEXTO A PROCESAR:
${plainText}

Devuelve un array de preguntas bien estructuradas.`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Título sugerido para el quiz basado en el contenido" },
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  hint: { type: "string", description: "Pista o tip para recordar" },
                  answerOptions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        text: { type: "string" },
                        isCorrect: { type: "boolean" },
                        rationale: { type: "string" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (result.questions && result.questions.length > 0) {
        setPreviewQuestions(result.questions);
        if (result.title && !quizTitle) {
          setQuizTitle(result.title);
        }
      } else {
        setError('No se pudieron extraer preguntas del texto. Verifica el formato.');
      }
    } catch (err) {
      setError('Error al procesar el texto: ' + (err.message || 'Intenta de nuevo'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!previewQuestions || previewQuestions.length === 0) {
      setError('No hay preguntas para guardar');
      return;
    }

    const questions = previewQuestions.map(q => ({
      ...q,
      type: 'text'
    }));

    await onSave({
      title: quizTitle || 'Cuestionario importado',
      description: `${questions.length} preguntas importadas desde texto`,
      questions,
      total_questions: questions.length
    });
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...previewQuestions];
    updated[index] = { ...updated[index], [field]: value };
    setPreviewQuestions(updated);
  };

  const updateOption = (qIndex, optIndex, field, value) => {
    const updated = [...previewQuestions];
    updated[qIndex].answerOptions[optIndex] = {
      ...updated[qIndex].answerOptions[optIndex],
      [field]: value
    };
    setPreviewQuestions(updated);
  };

  const setCorrectOption = (qIndex, optIndex) => {
    const updated = [...previewQuestions];
    updated[qIndex].answerOptions = updated[qIndex].answerOptions.map((opt, i) => ({
      ...opt,
      isCorrect: i === optIndex
    }));
    setPreviewQuestions(updated);
  };

  const removeQuestion = (index) => {
    setPreviewQuestions(previewQuestions.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {!previewQuestions ? (
        <>
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <Label>Título del cuestionario (opcional)</Label>
                <Input
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="Ej: Anatomía - Parcial 1"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Pega tus preguntas en texto plano</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPlainText(exampleText)}
                    className="text-xs text-indigo-600"
                  >
                    Ver ejemplo
                  </Button>
                </div>
                <Textarea
                  value={plainText}
                  onChange={(e) => setPlainText(e.target.value)}
                  placeholder={`Pega tus preguntas aquí. Formatos aceptados:

1. ¿Pregunta?
a) Opción 1
b) Opción 2 *  ← marca la correcta con *
c) Opción 3

O simplemente texto con preguntas y opciones...`}
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>

              <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-medium mb-1">💡 Tips:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Marca la respuesta correcta con * o (correcta)</li>
                  <li>Si no marcas ninguna, la IA intentará identificarla</li>
                  <li>Puedes pegar desde Word, PDF o cualquier fuente</li>
                  <li>La IA generará explicaciones automáticamente</li>
                </ul>
              </div>
            </div>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button
              onClick={handleProcess}
              disabled={isProcessing || !plainText.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Procesando con IA...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Convertir a cuestionario
                </>
              )}
            </Button>
          </div>
        </>
      ) : (
        <>
          {/* Preview and Edit */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Vista previa</h3>
                <p className="text-sm text-gray-500">{previewQuestions.length} preguntas detectadas</p>
              </div>
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Listo para guardar
              </Badge>
            </div>

            <div className="mb-4">
              <Label>Título del cuestionario</Label>
              <Input
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                placeholder="Nombre del cuestionario"
              />
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {previewQuestions.map((q, qIdx) => (
                <div key={qIdx} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1">
                      {editingIndex === qIdx ? (
                        <Textarea
                          value={q.question}
                          onChange={(e) => updateQuestion(qIdx, 'question', e.target.value)}
                          className="text-sm"
                          rows={2}
                        />
                      ) : (
                        <p className="font-medium text-gray-900">
                          <span className="text-indigo-600 mr-2">#{qIdx + 1}</span>
                          <MathText text={q.question} />
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingIndex(editingIndex === qIdx ? null : qIdx)}
                        className="h-8 w-8 p-0"
                      >
                        {editingIndex === qIdx ? <Eye className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(qIdx)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                      >
                        ×
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {q.answerOptions?.map((opt, optIdx) => (
                      <div
                        key={optIdx}
                        className={`flex items-center gap-2 p-2 rounded text-sm ${
                          opt.isCorrect ? 'bg-green-100 border border-green-300' : 'bg-white border'
                        }`}
                      >
                        <button
                          onClick={() => setCorrectOption(qIdx, optIdx)}
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            opt.isCorrect ? 'border-green-500 bg-green-500' : 'border-gray-300'
                          }`}
                        >
                          {opt.isCorrect && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </button>
                        {editingIndex === qIdx ? (
                          <Input
                            value={opt.text}
                            onChange={(e) => updateOption(qIdx, optIdx, 'text', e.target.value)}
                            className="flex-1 h-8 text-sm"
                          />
                        ) : (
                          <span className={opt.isCorrect ? 'text-green-800 font-medium' : 'text-gray-700'}>
                            <MathText text={opt.text} />
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {q.hint && (
                    <div className="mt-2 text-xs text-amber-700 bg-amber-50 rounded p-2">
                      💡 {q.hint}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setPreviewQuestions(null)}>
              ← Volver a editar texto
            </Button>
            <Button
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700 flex-1"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Guardar cuestionario ({previewQuestions.length} preguntas)
            </Button>
          </div>
        </>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}