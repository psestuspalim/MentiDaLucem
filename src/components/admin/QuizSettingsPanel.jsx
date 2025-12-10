import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Save, RotateCcw, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const DEFAULT_SETTINGS = {
  show_options: true,
  show_feedback: true,
  show_reflection: true,
  show_error_analysis: true,
  show_schema: true,
  show_notes: true,
  show_hint: true
};

const SETTING_LABELS = {
  show_options: { label: 'Opciones de respuesta', description: 'Mostrar las opciones A, B, C, D' },
  show_feedback: { label: 'Feedback', description: 'Mostrar explicación después de responder' },
  show_reflection: { label: 'Reflexión de error', description: 'Campo "¿Por qué crees que te equivocaste?"' },
  show_error_analysis: { label: 'Análisis de error IA', description: 'Detector de patrones de error con IA' },
  show_schema: { label: 'Esquema visual', description: 'Botón para generar esquema del concepto' },
  show_notes: { label: 'Agregar notas', description: 'Campo para notas personales' },
  show_hint: { label: 'Tip cinéfilo', description: 'Mostrar pistas y tips' }
};

export default function QuizSettingsPanel({ entityType, entityId, entityName, onClose }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [existingId, setExistingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [entityType, entityId]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const existing = await base44.entities.QuizSettings.filter({
        entity_type: entityType,
        entity_id: entityId
      });
      
      if (existing.length > 0) {
        setExistingId(existing[0].id);
        setSettings({
          show_options: existing[0].show_options ?? true,
          show_feedback: existing[0].show_feedback ?? true,
          show_reflection: existing[0].show_reflection ?? true,
          show_error_analysis: existing[0].show_error_analysis ?? true,
          show_schema: existing[0].show_schema ?? true,
          show_notes: existing[0].show_notes ?? true,
          show_hint: existing[0].show_hint ?? true
        });
      } else {
        setSettings(DEFAULT_SETTINGS);
        setExistingId(null);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (existingId) {
        await base44.entities.QuizSettings.update(existingId, settings);
      } else {
        const created = await base44.entities.QuizSettings.create({
          entity_type: entityType,
          entity_id: entityId,
          ...settings
        });
        setExistingId(created.id);
      }
      toast.success('Configuración guardada');
    } catch (error) {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const entityTypeLabels = {
    course: 'Curso',
    folder: 'Carpeta',
    subject: 'Materia',
    quiz: 'Cuestionario'
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            <CardTitle className="text-lg">Configuración de Vista</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {entityTypeLabels[entityType]}: {entityName}
          </Badge>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Controla qué elementos se muestran durante los cuestionarios
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(SETTING_LABELS).map(([key, { label, description }]) => (
          <div key={key} className="flex items-center justify-between py-2 border-b last:border-0">
            <div className="flex-1">
              <Label htmlFor={key} className="font-medium cursor-pointer">{label}</Label>
              <p className="text-xs text-gray-500">{description}</p>
            </div>
            <Switch
              id={key}
              checked={settings[key]}
              onCheckedChange={() => toggleSetting(key)}
            />
          </div>
        ))}

        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex-1"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Restablecer
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}