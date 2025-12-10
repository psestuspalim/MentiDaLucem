import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Loader2, ArrowLeft, FileJson, Brain } from 'lucide-react';

export default function AIQuizGenerator({ folderId, onQuizGenerated, onCancel, folders = [], subjects = [], showFolderSelector = true }) {
  const [mode, setMode] = useState('topic'); // 'topic' or 'json'
  const [topic, setTopic] = useState('');
  const [jsonContent, setJsonContent] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState('medium');
  const [additionalContext, setAdditionalContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState(folderId || '');

  // Si ya tenemos un folderId, no mostrar el selector
  const shouldShowSelector = showFolderSelector && !folderId;

  const handleGenerateFromTopic = async () => {
    if (!topic.trim()) {
      alert('Por favor ingresa un tema');
      return;
    }

    if (shouldShowSelector && !selectedFolderId) {
      alert('Por favor selecciona una carpeta destino');
      return;
    }

    setIsGenerating(true);

    try {
      const prompt = `Genera un cuestionario de opción múltiple sobre "${topic}".
Requisitos:
- Genera exactamente ${questionCount} preguntas
- Nivel de dificultad: ${difficulty === 'easy' ? 'fácil (conceptos básicos)' : difficulty === 'medium' ? 'intermedio' : 'difícil (casos clínicos complejos)'}
- Cada pregunta debe tener 4-5 opciones de respuesta
- Solo UNA opción debe ser correcta
- Incluye una explicación (rationale) para cada opción
- Las preguntas deben ser claras y sin ambigüedades
${additionalContext ? `- Contexto adicional: ${additionalContext}` : ''}

El formato debe seguir esta estructura exacta para cada pregunta.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Título del cuestionario"
            },
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
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
                  },
                  hint: { type: "string" }
                }
              }
            }
          }
        }
      });

      const targetFolderId = shouldShowSelector ? selectedFolderId : folderId;

      const quizData = {
        title: result.title || `${topic} - Generado por IA`,
        description: `Cuestionario generado automáticamente sobre ${topic}`,
        folder_id: targetFolderId,
        questions: result.questions,
        total_questions: result.questions.length
      };

      onQuizGenerated(quizData);

    } catch (error) {
      console.error('Error generando quiz:', error);
      alert('Error al generar el cuestionario - ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateFromJson = async () => {
    if (!jsonContent.trim()) {
      alert('Por favor pega el contenido JSON');
      return;
    }

    if (shouldShowSelector && !selectedFolderId) {
      alert('Por favor selecciona una carpeta');
      return;
    }

    setIsGenerating(true);

    try {
      const prompt = `Convierte el siguiente contenido en un cuestionario de opción múltiple estructurado.

CONTENIDO:
${jsonContent}

INSTRUCCIONES:
- Analiza el contenido y genera preguntas basadas en él
- Cada pregunta debe tener 4-5 opciones de respuesta
- Solo UNA opción debe ser correcta
- Incluye una explicación (rationale) para cada opción explicando por qué es correcta o incorrecta
- Si el contenido ya tiene formato de preguntas, conviértelo al formato requerido
- Si es texto plano o información, genera preguntas relevantes sobre ese contenido
- Las preguntas deben ser claras y sin ambigüedades`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Título del cuestionario basado en el contenido"
            },
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
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
                  },
                  hint: { type: "string" }
                }
              }
            }
          }
        }
      });

      const targetFolderId = shouldShowSelector ? selectedFolderId : folderId;

      const quizData = {
        title: result.title || 'Quiz generado desde JSON',
        description: 'Cuestionario generado desde contenido JSON',
        folder_id: targetFolderId,
        questions: result.questions,
        total_questions: result.questions.length
      };

      onQuizGenerated(quizData);

    } catch (error) {
      console.error('Error procesando JSON:', error);
      alert('Error al procesar el contenido. Verifica el formato e intenta de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = () => {
    if (mode === 'topic') {
      handleGenerateFromTopic();
    } else {
      handleGenerateFromJson();
    }
  };

  return (
    <Card className="max-w-2xl mx-auto border-0 shadow-none">
      <CardHeader className="px-0">
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Generar Quiz con IA
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-0">
        <Tabs value={mode} onValueChange={setMode}>
          <TabsList className="w-full">
            <TabsTrigger value="topic" className="flex-1">
              <Brain className="w-4 h-4 mr-2" />
              Por tema
            </TabsTrigger>
            <TabsTrigger value="json" className="flex-1">
              <FileJson className="w-4 h-4 mr-2" />
              Desde JSON/Texto
            </TabsTrigger>
          </TabsList>

          <TabsContent value="topic" className="space-y-4 mt-4">
            {shouldShowSelector && (
              <div>
                <Label>Carpeta destino *</Label>
                <Select value={selectedFolderId} onValueChange={setSelectedFolderId} disabled={isGenerating}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una carpeta" />
                  </SelectTrigger>
                  <SelectContent>
                    {folders.map(f => {
                      const parentSubject = subjects.find(s => s.id === f.subject_id);
                      return (
                        <SelectItem key={f.id} value={f.id}>
                          {parentSubject ? `${parentSubject.name} / ` : ''}{f.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Tema del cuestionario *</Label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ej: Sistema cardiovascular..."
                disabled={isGenerating}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Preguntas</Label>
                <Select value={String(questionCount)} onValueChange={(v) => setQuestionCount(Number(v))} disabled={isGenerating}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="15">15</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Dificultad</Label>
                <Select value={difficulty} onValueChange={setDifficulty} disabled={isGenerating}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Fácil</SelectItem>
                    <SelectItem value="medium">Intermedio</SelectItem>
                    <SelectItem value="hard">Difícil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Contexto (Opcional)</Label>
              <Textarea value={additionalContext} onChange={e => setAdditionalContext(e.target.value)} disabled={isGenerating} />
            </div>
          </TabsContent>

          <TabsContent value="json" className="space-y-4 mt-4">
            {shouldShowSelector && (
              <div>
                <Label>Carpeta destino *</Label>
                <Select value={selectedFolderId} onValueChange={setSelectedFolderId} disabled={isGenerating}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una carpeta" />
                  </SelectTrigger>
                  <SelectContent>
                    {folders.map(f => {
                      const parentSubject = subjects.find(s => s.id === f.subject_id);
                      return (
                        <SelectItem key={f.id} value={f.id}>
                          {parentSubject ? `${parentSubject.name} / ` : ''}{f.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>JSON o Texto</Label>
              <Textarea value={jsonContent} onChange={e => setJsonContent(e.target.value)} rows={8} disabled={isGenerating} />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 pt-4">
          {onCancel && <Button variant="outline" onClick={onCancel} disabled={isGenerating} className="flex-1">Cancelar</Button>}
          <Button onClick={handleGenerate} disabled={isGenerating || (mode === 'topic' ? !topic.trim() : !jsonContent.trim()) || (shouldShowSelector && !selectedFolderId)} className="flex-1 bg-purple-600 hover:bg-purple-700">
            {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generando...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generar</>}
          </Button>
        </div>

        {isGenerating && (
          <p className="text-sm text-center text-gray-500">
            Esto puede tomar unos segundos...
          </p>
        )}
      </CardContent>
    </Card>
  );
}