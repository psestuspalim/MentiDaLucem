import React, { useState } from 'react';
import { Upload, FileJson, AlertCircle, CheckCircle2, Loader2, ClipboardPaste } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { base44 } from '@/api/base44Client';

export default function BulkSectionUploader({ subjects, onSuccess }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const [jsonText, setJsonText] = useState('');

  const processJsonData = async (data) => {
    setIsProcessing(true);
    setError(null);
    setResults([]);

    try {
      
      // Esperamos un formato con secciones:
      // {
      //   "sections": [
      //     {
      //       "sectionId": "1.1", // o "1.1 Características de la Célula"
      //       "title": "Características de la Célula",
      //       "questions": [...]
      //     }
      //   ]
      // }
      
      if (!data.sections || !Array.isArray(data.sections)) {
        throw new Error('El archivo debe contener un array "sections" con las secciones del parcial');
      }

      const processResults = [];

      for (const section of data.sections) {
        const sectionId = section.sectionId || section.id || '';
        const sectionTitle = section.title || section.name || '';
        
        // Buscar la materia que coincida con el sectionId o título
        let matchedSubject = null;
        
        // Primero buscar por número de sección (ej: "1.1", "2.3")
        if (sectionId) {
          matchedSubject = subjects.find(s => s.name.startsWith(sectionId));
        }
        
        // Si no encuentra, buscar por título parcial
        if (!matchedSubject && sectionTitle) {
          matchedSubject = subjects.find(s => 
            s.name.toLowerCase().includes(sectionTitle.toLowerCase()) ||
            sectionTitle.toLowerCase().includes(s.name.split(' ').slice(-2).join(' ').toLowerCase())
          );
        }

        if (!matchedSubject) {
          processResults.push({
            section: sectionId || sectionTitle,
            status: 'error',
            message: 'No se encontró materia correspondiente'
          });
          continue;
        }

        if (!section.questions || section.questions.length === 0) {
          processResults.push({
            section: sectionId || sectionTitle,
            status: 'warning',
            message: 'Sin preguntas'
          });
          continue;
        }

        // Procesar preguntas
        const questions = section.questions.map((q, idx) => {
          const totalQ = section.questions.length;
          const easyCount = Math.ceil(totalQ * 0.2);
          const hardCount = Math.ceil(totalQ * 0.2);
          
          let difficulty = 'moderado';
          if (idx < easyCount) difficulty = 'fácil';
          else if (idx >= totalQ - hardCount) difficulty = 'difícil';

          // Soportar ambos formatos
          if (q.questionText) {
            return {
              type: q.type || 'text',
              question: q.questionText,
              hint: q.cinephileTip || q.hint || '',
              feedback: q.analysis || q.feedback || '',
              difficulty: q.difficulty || difficulty,
              answerOptions: (q.options || []).map(opt => ({
                text: opt.text,
                isCorrect: opt.isCorrect,
                rationale: opt.feedback || opt.rationale || ''
              }))
            };
          } else {
            return {
              ...q,
              type: q.type || 'text',
              difficulty: q.difficulty || difficulty
            };
          }
        });

        try {
          await base44.entities.Quiz.create({
            title: sectionTitle || matchedSubject.name,
            description: `${questions.length} preguntas`,
            subject_id: matchedSubject.id,
            questions,
            total_questions: questions.length,
            is_hidden: false
          });

          processResults.push({
            section: matchedSubject.name,
            status: 'success',
            message: `${questions.length} preguntas agregadas`
          });
        } catch (err) {
          processResults.push({
            section: matchedSubject.name,
            status: 'error',
            message: err.message
          });
        }
      }

      setResults(processResults);
      
      if (processResults.some(r => r.status === 'success')) {
        onSuccess?.();
      }

    } catch (err) {
      setError(err.message || 'Error al procesar los datos');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFile = async (file) => {
    if (!file) return;
    
    if (file.type !== 'application/json') {
      setError('Por favor, selecciona un archivo JSON válido');
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await processJsonData(data);
    } catch (err) {
      setError(err.message || 'Error al leer el archivo');
    }
  };

  const handlePasteSubmit = async () => {
    if (!jsonText.trim()) {
      setError('Por favor, pega el JSON');
      return;
    }

    try {
      const data = JSON.parse(jsonText);
      await processJsonData(data);
    } catch (err) {
      setError('JSON inválido: ' + err.message);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Tabs defaultValue="paste" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="paste">
            <ClipboardPaste className="w-4 h-4 mr-2" />
            Pegar JSON
          </TabsTrigger>
          <TabsTrigger value="file">
            <FileJson className="w-4 h-4 mr-2" />
            Subir archivo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="paste">
          <Card className="p-4">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Pega el JSON completo
              </h3>
              <p className="text-sm text-gray-500">
                El sistema distribuirá automáticamente cada sección al subtema correspondiente
              </p>
            </div>

            <Textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder='{"sections": [{"sectionId": "1.1", "title": "...", "questions": [...]}]}'
              className="min-h-[300px] font-mono text-xs mb-4"
            />

            <Button
              onClick={handlePasteSubmit}
              disabled={isProcessing || !jsonText.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Procesar y distribuir
                </>
              )}
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="file">
          <Card
            className={`border-2 border-dashed transition-all duration-200 ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
          >
            <div className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
                  <FileJson className="w-8 h-8 text-indigo-600" />
                </div>
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Arrastra un archivo JSON
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                o haz clic para seleccionar
              </p>

              <Button
                type="button"
                disabled={isProcessing}
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={() => document.getElementById('bulk-file-upload').click()}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Seleccionar archivo
                  </>
                )}
              </Button>
              
              <input
                id="bulk-file-upload"
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => handleFile(e.target.files[0])}
              />
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {results.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="font-medium text-gray-900">Resultados:</h4>
          {results.map((result, idx) => (
            <div 
              key={idx} 
              className={`flex items-center justify-between p-3 rounded-lg border ${
                result.status === 'success' ? 'bg-green-50 border-green-200' :
                result.status === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {result.status === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                <span className="text-sm font-medium">{result.section}</span>
              </div>
              <Badge 
                variant="outline"
                className={
                  result.status === 'success' ? 'text-green-700 border-green-300' :
                  result.status === 'warning' ? 'text-yellow-700 border-yellow-300' :
                  'text-red-700 border-red-300'
                }
              >
                {result.message}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}