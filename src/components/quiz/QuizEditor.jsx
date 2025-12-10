import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Save, X, ChevronDown, ChevronUp, GripVertical, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import QuizSettingsPanel from '../admin/QuizSettingsPanel';

export default function QuizEditor({ quiz, subjects = [], onSave, onCancel }) {
  const [editedQuiz, setEditedQuiz] = useState({
    ...quiz,
    is_hidden: quiz.is_hidden || false
  });
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...editedQuiz.questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setEditedQuiz({ ...editedQuiz, questions: newQuestions });
  };

  const updateAnswerOption = (qIndex, aIndex, field, value) => {
    const newQuestions = [...editedQuiz.questions];
    const newOptions = [...newQuestions[qIndex].answerOptions];
    newOptions[aIndex] = { ...newOptions[aIndex], [field]: value };
    newQuestions[qIndex] = { ...newQuestions[qIndex], answerOptions: newOptions };
    setEditedQuiz({ ...editedQuiz, questions: newQuestions });
  };

  const addAnswerOption = (qIndex) => {
    const newQuestions = [...editedQuiz.questions];
    newQuestions[qIndex].answerOptions.push({ text: '', isCorrect: false, rationale: '' });
    setEditedQuiz({ ...editedQuiz, questions: newQuestions });
  };

  const removeAnswerOption = (qIndex, aIndex) => {
    const newQuestions = [...editedQuiz.questions];
    newQuestions[qIndex].answerOptions.splice(aIndex, 1);
    setEditedQuiz({ ...editedQuiz, questions: newQuestions });
  };

  const addQuestion = () => {
    const newQuestion = {
      type: 'text',
      question: '',
      answerOptions: [
        { text: '', isCorrect: true, rationale: '' },
        { text: '', isCorrect: false, rationale: '' }
      ],
      hint: ''
    };
    setEditedQuiz({
      ...editedQuiz,
      questions: [...editedQuiz.questions, newQuestion]
    });
    setExpandedQuestion(editedQuiz.questions.length);
  };

  const removeQuestion = (index) => {
    const newQuestions = editedQuiz.questions.filter((_, i) => i !== index);
    setEditedQuiz({ ...editedQuiz, questions: newQuestions });
    setExpandedQuestion(null);
  };

  const handleSave = () => {
    onSave({
      ...editedQuiz,
      total_questions: editedQuiz.questions.length
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="general">General y Preguntas</TabsTrigger>
          <TabsTrigger value="quiz-settings" disabled={!quiz?.id}>
            <Settings className="w-4 h-4 mr-2" />
            Vista Quiz
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Editar Cuestionario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Título</Label>
            <Input
              value={editedQuiz.title}
              onChange={(e) => setEditedQuiz({ ...editedQuiz, title: e.target.value })}
            />
          </div>
          <div>
            <Label>Descripción</Label>
            <Textarea
              value={editedQuiz.description || ''}
              onChange={(e) => setEditedQuiz({ ...editedQuiz, description: e.target.value })}
            />
          </div>
          <div>
            <Label>Materia</Label>
            <Select
              value={editedQuiz.subject_id || ''}
              onValueChange={(value) => setEditedQuiz({ ...editedQuiz, subject_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una materia" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map(subject => {
                  const isCurrentSubject = subject.id === quiz.subject_id;
                  return (
                    <SelectItem key={subject.id} value={subject.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: subject.color || '#6366f1' }}
                        />
                        <span>{subject.name}</span>
                        {isCurrentSubject && (
                          <span className="text-xs text-gray-400">(actual)</span>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {editedQuiz.subject_id !== quiz.subject_id && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ El quiz se moverá a otra materia al guardar
              </p>
            )}
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <Label>Ocultar cuestionario</Label>
              <p className="text-sm text-gray-500">No será visible para los estudiantes</p>
            </div>
            <Switch
              checked={editedQuiz.is_hidden}
              onCheckedChange={(checked) => setEditedQuiz({ ...editedQuiz, is_hidden: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Preguntas ({editedQuiz.questions.length})</CardTitle>
          <Button onClick={addQuestion} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Agregar pregunta
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {editedQuiz.questions.map((question, qIndex) => (
            <div
              key={qIndex}
              className="border rounded-lg overflow-hidden"
            >
              <div
                className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100"
                onClick={() => setExpandedQuestion(expandedQuestion === qIndex ? null : qIndex)}
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">
                    {qIndex + 1}. {question.question?.substring(0, 50) || 'Sin título'}
                    {question.question?.length > 50 ? '...' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeQuestion(qIndex);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                  {expandedQuestion === qIndex ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </div>

              <AnimatePresence>
                {expandedQuestion === qIndex && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 space-y-4 border-t">
                      {/* Mostrar imagen si existe */}
                      {question.imageUrl && (
                        <div className="rounded-lg overflow-hidden border bg-gray-100">
                          <img 
                            src={question.imageUrl} 
                            alt="Imagen de la pregunta" 
                            className="w-full h-auto max-h-[300px] object-contain"
                          />
                        </div>
                      )}

                      <div>
                        <Label>Pregunta</Label>
                        <Textarea
                          value={question.question}
                          onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                        />
                      </div>

                      <div>
                        <Label>Pista (opcional)</Label>
                        <Input
                          value={question.hint || ''}
                          onChange={(e) => updateQuestion(qIndex, 'hint', e.target.value)}
                        />
                      </div>

                      <div>
                        <Label>Retroalimentación (se muestra en respuestas incorrectas)</Label>
                        <Textarea
                          value={question.feedback || ''}
                          onChange={(e) => updateQuestion(qIndex, 'feedback', e.target.value)}
                          placeholder="Explicación que se mostrará cuando respondan incorrectamente..."
                          rows={3}
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label>Opciones de respuesta</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addAnswerOption(qIndex)}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Opción
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {question.answerOptions?.map((option, aIndex) => (
                            <div key={aIndex} className="flex gap-2 items-start p-3 bg-gray-50 rounded-lg">
                              <div className="flex-1 space-y-2">
                                <Input
                                  value={option.text}
                                  onChange={(e) => updateAnswerOption(qIndex, aIndex, 'text', e.target.value)}
                                  placeholder="Texto de la opción"
                                />
                                <Input
                                  value={option.rationale || ''}
                                  onChange={(e) => updateAnswerOption(qIndex, aIndex, 'rationale', e.target.value)}
                                  placeholder="Explicación (rationale)"
                                  className="text-sm"
                                />
                              </div>
                              <div className="flex flex-col items-center gap-1">
                                <Switch
                                  checked={option.isCorrect}
                                  onCheckedChange={(checked) => updateAnswerOption(qIndex, aIndex, 'isCorrect', checked)}
                                />
                                <span className="text-xs text-gray-500">
                                  {option.isCorrect ? 'Correcta' : 'Incorrecta'}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeAnswerOption(qIndex, aIndex)}
                                disabled={question.answerOptions.length <= 2}
                              >
                                <X className="w-4 h-4 text-gray-400" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button onClick={handleSave} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
          <Save className="w-4 h-4 mr-2" />
          Guardar cambios
        </Button>
      </div>
        </TabsContent>
        
        <TabsContent value="quiz-settings">
          {quiz?.id && (
            <QuizSettingsPanel
              entityType="quiz"
              entityId={quiz.id}
              entityName={quiz.title}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}