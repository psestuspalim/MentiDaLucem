import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Loader2, Music } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function AudioUploader({ subjectId, open, onOpenChange, onSuccess }) {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      await base44.entities.Audio.create({
        title: title.trim(),
        file_url,
        subject_id: subjectId
      });

      setTitle('');
      setFile(null);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error uploading audio:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5 text-indigo-600" />
            Subir audio
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div>
            <Label>Título</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nombre del audio"
            />
          </div>

          <div>
            <Label>Archivo de audio (.m4a, .mp3)</Label>
            <div className="mt-2">
              <label className="flex items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="text-center">
                  {file ? (
                    <p className="text-sm text-gray-700">{file.name}</p>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                      <p className="text-sm text-gray-500">Seleccionar archivo</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept=".m4a,.mp3,audio/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>

          <Button
            onClick={handleUpload}
            disabled={!file || !title.trim() || isUploading}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Subir audio
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}