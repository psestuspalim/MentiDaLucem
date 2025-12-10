import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Check, X, ChevronLeft, ChevronRight, Save, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const TISSUE_TYPES = [
  'Tejido adiposo blanco',
  'Tejido adiposo pardo',
  'Cartílago elástico',
  'Cartílago hialino',
  'Fibrocartílago',
  'Hueso maduro',
  'Hueso inmaduro',
  'Hueso compacto',
  'Hueso trabecular'
];

const STORAGE_KEY = 'tissueQuizCreator_draft';

export default function TissueQuizCreator({ onSave, onCancel }) {
  const [images, setImages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.images || [];
      }
    } catch (e) {}
    return [];
  });
  const [currentIndex, setCurrentIndex] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.currentIndex || 0;
      }
    } catch (e) {}
    return 0;
  });
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ images, currentIndex }));
    } catch (e) {}
  }, [images, currentIndex]);

  const clearDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  const currentImage = images[currentIndex];

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    const uploaded = [];

    for (const file of files) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploaded.push({
          url: file_url,
          originalName: file.name,
          tissueType: null,
          feedback: ''
        });
      } catch (error) {
        console.error('Error uploading:', file.name, error);
      }
    }

    if (uploaded.length > 0) {
      setImages(prev => [...prev, ...uploaded]);
      if (images.length === 0) setCurrentIndex(0);
    }
    setIsUploading(false);
  };

  const setTissueType = (type) => {
    if (!currentImage) return;
    const updated = [...images];
    updated[currentIndex] = { ...updated[currentIndex], tissueType: type };
    setImages(updated);
  };

  const setFeedback = (feedback) => {
    if (!currentImage) return;
    const updated = [...images];
    updated[currentIndex] = { ...updated[currentIndex], feedback };
    setImages(updated);
  };

  const removeImage = (idx) => {
    const updated = images.filter((_, i) => i !== idx);
    setImages(updated);
    if (currentIndex >= updated.length && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSave = () => {
    const validImages = images.filter(img => img.tissueType);
    if (validImages.length === 0) return;

    const questions = validImages.map(img => ({
      type: 'text',
      question: '¿Qué tipo de tejido se muestra en la imagen?',
      imageUrl: img.url,
      correctAnswer: img.tissueType,
      answerOptions: TISSUE_TYPES.map(t => ({
        text: t,
        isCorrect: t === img.tissueType,
        rationale: t === img.tissueType 
          ? `Correcto, es ${img.tissueType}` 
          : img.feedback 
            ? `${img.feedback}` 
            : `Incorrecto, la respuesta correcta es ${img.tissueType}`
      }))
    }));

    onSave({ multipleQuestions: questions });
    clearDraft();
  };

  const completedCount = images.filter(img => img.tissueType).length;

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span>Quiz de Identificación de Tejidos</span>
          {images.length > 0 && (
            <Badge variant="outline">{completedCount}/{images.length} clasificadas</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload */}
        <label className="flex items-center justify-center gap-2 w-full h-14 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors bg-gray-50">
          {isUploading ? (
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          ) : (
            <Upload className="w-5 h-5 text-gray-400" />
          )}
          <span className="text-sm text-gray-500">
            {isUploading ? 'Subiendo...' : 'Subir imágenes de tejidos'}
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="hidden"
            disabled={isUploading}
          />
        </label>

        {/* Miniaturas */}
        {images.length > 0 && (
          <div className="flex gap-2 overflow-x-auto py-2">
            {images.map((img, idx) => (
              <div
                key={idx}
                className={`relative flex-shrink-0 cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                  idx === currentIndex ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-gray-400'
                }`}
                onClick={() => setCurrentIndex(idx)}
              >
                <img src={img.url} alt="" className="w-14 h-14 object-cover" />
                {img.tissueType && (
                  <div className="absolute top-0.5 right-0.5 bg-green-500 rounded-full p-0.5">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
                <button
                  className="absolute top-0.5 left-0.5 bg-red-500/80 rounded-full p-0.5 opacity-0 hover:opacity-100 transition-opacity"
                  onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                >
                  <X className="w-2.5 h-2.5 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Imagen actual y selector de tejido */}
        {currentImage && (
          <>
            <div className="relative border rounded-lg overflow-hidden bg-gray-100">
              <img
                src={currentImage.url}
                alt="Tejido"
                className="w-full h-auto max-h-[350px] object-contain mx-auto"
              />
            </div>

            {/* Selector de tipo de tejido */}
            <div>
              <p className="text-sm text-gray-600 mb-2">Selecciona el tipo de tejido:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TISSUE_TYPES.map((type) => (
                  <Button
                    key={type}
                    variant={currentImage.tissueType === type ? 'default' : 'outline'}
                    className={`text-xs h-auto py-2 px-3 ${
                      currentImage.tissueType === type ? 'bg-indigo-600 hover:bg-indigo-700' : ''
                    }`}
                    onClick={() => setTissueType(type)}
                  >
                    {currentImage.tissueType === type && <Check className="w-3 h-3 mr-1" />}
                    {type}
                  </Button>
                ))}
              </div>
            </div>

            {/* Campo de retroalimentación */}
            <div>
              <p className="text-sm text-gray-600 mb-2">Retroalimentación (se muestra si responden mal):</p>
              <textarea
                value={currentImage.feedback || ''}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Ej: Observa las células con múltiples vacuolas lipídicas pequeñas, característico del tejido adiposo pardo..."
                className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 resize-none"
                rows={3}
              />
            </div>

            {/* Navegación */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>
              <span className="text-sm text-gray-500">
                {currentIndex + 1} / {images.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentIndex(Math.min(images.length - 1, currentIndex + 1))}
                disabled={currentIndex >= images.length - 1}
              >
                Siguiente
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </>
        )}

        {/* Botones finales */}
        <div className="flex gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => { clearDraft(); onCancel(); }}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 bg-green-600 hover:bg-green-700"
            disabled={completedCount === 0}
          >
            <Save className="w-4 h-4 mr-2" />
            Guardar ({completedCount} preguntas)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}