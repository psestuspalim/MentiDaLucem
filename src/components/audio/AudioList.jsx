import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Music, Plus } from 'lucide-react';
import AudioPlayer from './AudioPlayer';
import AudioUploader from './AudioUploader';

export default function AudioList({ subjectId, isAdmin }) {
  const [showUploader, setShowUploader] = useState(false);
  const queryClient = useQueryClient();

  const { data: audios = [] } = useQuery({
    queryKey: ['audios', subjectId],
    queryFn: () => base44.entities.Audio.filter({ subject_id: subjectId }, '-created_date'),
    enabled: !!subjectId
  });

  const updateAudioMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Audio.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['audios', subjectId])
  });

  const deleteAudioMutation = useMutation({
    mutationFn: (id) => base44.entities.Audio.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['audios', subjectId])
  });

  if (audios.length === 0 && !isAdmin) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Music className="w-4 h-4" />
          Audios ({audios.length})
        </h3>
        {isAdmin && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowUploader(true)}
            className="h-8 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Agregar audio
          </Button>
        )}
      </div>

      {audios.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          No hay audios en esta materia
        </p>
      ) : (
        <div className="space-y-3">
          {audios.map((audio) => (
            <AudioPlayer
              key={audio.id}
              audio={audio}
              isAdmin={isAdmin}
              onUpdate={(id, data) => updateAudioMutation.mutate({ id, data })}
              onDelete={(id) => deleteAudioMutation.mutate(id)}
            />
          ))}
        </div>
      )}

      <AudioUploader
        subjectId={subjectId}
        open={showUploader}
        onOpenChange={setShowUploader}
        onSuccess={() => queryClient.invalidateQueries(['audios', subjectId])}
      />
    </div>
  );
}