import React, { useState } from 'react';
import { Upload, FileJson, AlertCircle, Image, Microscope, ClipboardPaste, Wrench, Loader2, FileText } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import ImageQuizCreator from './ImageQuizCreator';
import TextQuizCreator from './TextQuizCreator';
import { toCompactFormat, fromCompactFormat } from '../utils/quizFormats';

export default function FileUploader({ onUploadSuccess }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('json');
  const [jsonText, setJsonText] = useState('');
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [jsonErrors, setJsonErrors] = useState([]);

  const processJsonData = async (data, fileName = 'Quiz') => {
    let questions = [];
    let title = fileName.replace('.json', '');
    let description = '';

    const difficultyMap = {
      'easy': 'fácil', 'medium': 'moderado', 'hard': 'difícil',
      'moderate': 'moderado', 1: 'fácil', 2: 'moderado', 3: 'difícil'
    };

    const bloomMap = {
      1: 'Recordar', 2: 'Comprender', 3: 'Aplicar', 4: 'Analizar', 5: 'Evaluar'
    };

    if (data.t && data.q && Array.isArray(data.q) && !data.m) {
      console.log('📦 Formato detectado: {t, q} compacto');
      const expandedQuiz = fromCompactFormat(data);
      const quizData = {
        title: data.t, description: '', total_questions: data.q.length,
        questions: expandedQuiz.questions, t: data.t, q: data.q.map(q => JSON.stringify(q)),
        file_name: fileName, is_hidden: false
      };
      await onUploadSuccess(quizData);
      return;
    }

    if (Array.isArray(data) && data.length > 0 && data[0].i && data[0].x && data[0].o) {
      const compactData = { m: { t: title, s: description, v: 'cQ-v2', c: data.length }, q: data };
      const expandedQuiz = fromCompactFormat(compactData);
      await onUploadSuccess({ ...toCompactFormat(expandedQuiz), file_name: fileName, is_hidden: false });
      return;
    }

    if (data.m && data.q && Array.isArray(data.q) && data.m.v && data.m.v.startsWith('cQ-v')) {
      const expanded = fromCompactFormat(data);
      await onUploadSuccess({
        title: data.m.t || fileName, description: data.m.s || data.m.f || '',
        total_questions: data.m.c || data.q.length, questions: expanded.questions,
        m: data.m, q: data.q, file_name: fileName, is_hidden: false
      });
      return;
    }

    if (data.m && data.q && Array.isArray(data.q)) {
      title = data.m.title || title;
      description = data.m.fmt || '';
      questions = data.q.map((q) => {
        if (!q.p || !Array.isArray(q.p)) return null;
        const [id, bloomCode, diffNum, questionText, ...optionsArrays] = q.p;
        return {
          type: 'text', question: questionText, feedback: q.ana || '',
          difficulty: difficultyMap[diffNum] || 'moderado', bloomLevel: bloomMap[bloomCode] || bloomCode || '',
          answerOptions: optionsArrays.map(opt => ({ text: opt[1], isCorrect: opt[2] === 1, rationale: opt[3] ? `Tipo de error: ${opt[3]}` : '' }))
        };
      }).filter(q => q !== null);
    }
    else if (data.meta && data.q && Array.isArray(data.q)) {
      title = data.meta.title || title;
      description = data.meta.src || '';
      questions = data.q.map((q) => ({
        type: 'text', question: q.txt, hint: q.ana || '', difficulty: difficultyMap[q.dif] || 'moderado',
        answerOptions: (q.ops || []).map(opt => ({ text: opt.val, isCorrect: opt.ok === true, rationale: opt.err ? `Error común: ${opt.err}` : '' }))
      }));
    }
    else if (data.qm && data.q && Array.isArray(data.q)) {
      title = data.qm.ttl || title;
      description = data.qm.foc || '';
      questions = data.q.map((q) => ({
        type: 'text', question: q.t, hint: q.ct || '', difficulty: difficultyMap[q.d] || 'moderado', bloomLevel: bloomMap[q.b] || '',
        answerOptions: (q.o || []).map(opt => ({ text: opt.t, isCorrect: opt.c === true || opt.c === 1, rationale: opt.r || '' }))
      }));
    }
    else if (data.questions && Array.isArray(data.questions)) {
      title = data.quizMetadata?.title || data.title || title;
      description = data.quizMetadata?.focus || data.quizMetadata?.source || data.description || '';
      questions = data.questions.map((q, idx) => {
        let normalizedOptions = [];
        if (q.answerOptions && Array.isArray(q.answerOptions) && q.answerOptions.length > 0) {
          normalizedOptions = q.answerOptions.filter(opt => opt && typeof opt === 'object' && opt.text && opt.text.trim().length > 0)
            .map(opt => ({ text: opt.text.trim(), isCorrect: opt.isCorrect === true || opt.isCorrect === 1 || opt.isCorrect === '1', rationale: (opt.rationale || opt.feedback || opt.explanation || '').trim() }));
        }
        if (normalizedOptions.length === 0 && q.options && Array.isArray(q.options) && q.options.length > 0) {
          normalizedOptions = q.options.filter(opt => opt && (opt.text || typeof opt === 'string'))
            .map(opt => ({ text: (opt.label ? `${opt.label}. ${opt.text}` : (opt.text || opt)).trim(), isCorrect: opt.isCorrect === true || opt.isCorrect === 1 || opt.isCorrect === '1', rationale: (opt.feedback || opt.rationale || opt.analysis || '').trim() }));
        }
        const questionText = (q.questionText || q.question || q.text || '').trim();
        if (!questionText || normalizedOptions.length === 0) return null;
        return {
          type: q.type || 'text', question: questionText, hint: (q.hint || q.cinephileTip || q.analysis || '').trim(),
          feedback: (q.analysis || q.feedback || '').trim(), difficulty: difficultyMap[q.difficulty] || q.difficulty || 'moderado',
          bloomLevel: q.bloomLevel || '', imageUrl: q.imageUrl || null, answerOptions: normalizedOptions
        };
      }).filter(q => q !== null);
    }
    else if (data.quiz && Array.isArray(data.quiz)) {
      title = data.title || title;
      description = data.description || '';
      questions = data.quiz.map((q) => {
        const options = q.answerOptions || q.options || [];
        return {
          type: q.type || 'text', question: q.questionText || q.question || q.text, hint: q.hint || q.cinephileTip || '',
          difficulty: difficultyMap[q.difficulty] || q.difficulty || 'moderado',
          answerOptions: options.map(opt => ({ text: opt.text || opt, isCorrect: opt.isCorrect === true || opt.isCorrect === 1, rationale: opt.feedback || opt.rationale || '' }))
        };
      });
    }
    else {
      throw new Error('Formato de archivo inválido.');
    }

    const compactQuiz = toCompactFormat({
      title, description: description || `Cuestionario con ${questions.length} preguntas`,
      questions, total_questions: questions.length
    });

    await onUploadSuccess({ ...compactQuiz, file_name: fileName, is_hidden: false });
  };

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    setError(null);
    try {
      let successCount = 0; let errorCount = 0;
      for (const file of files) {
        if (file.type !== 'application/json') { errorCount++; continue; }
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          await processJsonData(data, file.name);
          successCount++;
        } catch (err) { console.error(`Error en ${file.name}:`, err); errorCount++; }
      }
      if (successCount > 0) setError(null);
      if (errorCount > 0) setError(`${successCount} archivos cargados correctamente, ${errorCount} con errores`);
    } catch (err) { setError(err.message || 'Error al procesar los archivos'); } finally { setIsProcessing(false); }
  };

  const validateJsonSchema = (data) => {
    const errors = []; const warnings = []; const info = [];
    if (typeof data !== 'object' || data === null) { errors.push('❌ El JSON debe ser un objeto'); return { errors, warnings, info }; }
    if (data.t && data.q && !data.m) {
      if (!Array.isArray(data.q)) { errors.push('❌ "q" debe ser un array de preguntas'); return { errors, warnings, info }; }
      if (data.q.length === 0) { errors.push('❌ El array "q" está vacío'); return { errors, warnings, info }; }
      info.push(`✅ Formato válido: ${data.q.length} preguntas detectadas`);
      data.q.forEach((q, idx) => {
        const qNum = idx + 1;
        if (!q.x || q.x.trim() === '') errors.push(`❌ Pregunta ${qNum}: falta "x"`);
        if (!q.dif) warnings.push(`⚠️ Pregunta ${qNum}: falta "dif"`);
        if (!q.o || !Array.isArray(q.o) || q.o.length === 0) errors.push(`❌ Pregunta ${qNum}: falta "o"`);
        else if (!q.o.some(opt => opt.c === true)) errors.push(`❌ Pregunta ${qNum}: ninguna opción correcta`);
      });
      return { errors, warnings, info };
    }
    errors.push('❌ Formato incorrecto');
    return { errors, warnings, info };
  };

  const handlePasteSubmit = async () => {
    if (!jsonText.trim()) { setError('Por favor, pega el contenido JSON'); return; }
    setIsProcessing(true); setError(null); setJsonErrors([]);
    try {
      const data = JSON.parse(jsonText);
      if (data.t && data.q) {
        const validation = validateJsonSchema(data);
        if (validation.errors.length > 0) {
          setJsonErrors([...validation.errors, ...validation.warnings, ...validation.info]);
          setError(`Se encontraron ${validation.errors.length} errores`); setIsProcessing(false); return;
        }
      }
      const fileName = data.t || 'Quiz cargado';
      await processJsonData(data, fileName);
      setJsonText(''); setJsonErrors([]); setError(null);
    } catch (err) {
      if (err instanceof SyntaxError) { setError(`Error de sintaxis JSON`); setJsonErrors(['Verifica comillas y llaves.']); }
      else { setError(`Error al procesar: ${err.message}`); }
    } finally { setIsProcessing(false); }
  };

  const handleImageQuizSave = async (questionData) => {
    if (questionData.multipleQuestions) {
      const questions = questionData.multipleQuestions.map(q => ({ ...q, type: 'image' }));
      await onUploadSuccess({ title: `Cuestionario con ${questions.length} imágenes`, description: 'Cuestionario con imágenes', questions, total_questions: questions.length });
    } else {
      await onUploadSuccess({ title: questionData.question, description: questionData.description || 'Cuestionario con imagen', questions: [{ ...questionData, type: 'image' }], total_questions: 1 });
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="json"><FileJson className="w-4 h-4 mr-2" />JSON</TabsTrigger>
          <TabsTrigger value="text"><FileText className="w-4 h-4 mr-2" />Texto</TabsTrigger>
          <TabsTrigger value="image"><Image className="w-4 h-4 mr-2" />Imagen</TabsTrigger>
        </TabsList>

        <TabsContent value="text">
          <TextQuizCreator onSave={onUploadSuccess} onCancel={() => setActiveTab('json')} />
        </TabsContent>

        <TabsContent value="json">
          <Card className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Pegar JSON del quiz</h3>
              <p className="text-sm text-gray-600 mb-4">Pegue aquí su contenido JSON.</p>
            </div>
            <Textarea
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                setJsonErrors([]); setError(null);
              }}
              placeholder='{"t": "Título", "q": []}'
              className="min-h-[300px] font-mono text-xs mb-4"
              rows={15}
            />
            {jsonErrors.length > 0 && (
              <div className="mb-4 p-3 rounded-lg max-h-60 overflow-y-auto border bg-blue-50 border-blue-200">
                <ul className="text-xs space-y-1">{jsonErrors.map((err, i) => <li key={i} className="text-blue-700">{err}</li>)}</ul>
              </div>
            )}
            {error && <Alert variant="destructive" className="mb-4"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
            <Button onClick={handlePasteSubmit} disabled={isProcessing || !jsonText.trim()} className="bg-indigo-600 hover:bg-indigo-700">
              {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {isProcessing ? 'Procesando...' : 'Cargar cuestionario'}
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="image">
          <ImageQuizCreator onSave={handleImageQuizSave} onCancel={() => setActiveTab('text')} />
        </TabsContent>
      </Tabs>
    </div>
  );
}