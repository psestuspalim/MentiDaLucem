import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Play, Pause, RotateCcw, RotateCw, 
  Pencil, Trash2, Check, X, Music
} from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function AudioPlayer({ audio, onUpdate, onDelete, isAdmin }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(audio.title);

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    const handleTimeUpdate = () => setCurrentTime(audioEl.currentTime);
    const handleLoadedMetadata = () => setDuration(audioEl.duration);
    const handleEnded = () => setIsPlaying(false);

    audioEl.addEventListener('timeupdate', handleTimeUpdate);
    audioEl.addEventListener('loadedmetadata', handleLoadedMetadata);
    audioEl.addEventListener('ended', handleEnded);

    return () => {
      audioEl.removeEventListener('timeupdate', handleTimeUpdate);
      audioEl.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audioEl.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const skip = (seconds) => {
    audioRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
  };

  const handleSpeedChange = () => {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
    const currentIndex = speeds.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const newSpeed = speeds[nextIndex];
    setPlaybackRate(newSpeed);
    audioRef.current.playbackRate = newSpeed;
  };

  const handleSeek = (value) => {
    audioRef.current.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSaveTitle = () => {
    if (editTitle.trim()) {
      onUpdate(audio.id, { title: editTitle.trim() });
      setIsEditing(false);
    }
  };

  return (
    <Card className="p-3 sm:p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
      <audio ref={audioRef} src={audio.file_url} preload="metadata" />
      
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
          <Music className="w-5 h-5 text-indigo-600" />
        </div>
        
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="h-8 text-sm"
                autoFocus
              />
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSaveTitle}>
                <Check className="w-4 h-4 text-green-600" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setIsEditing(false); setEditTitle(audio.title); }}>
                <X className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          ) : (
            <h4 className="font-medium text-gray-900 truncate">{audio.title}</h4>
          )}
        </div>

        {isAdmin && !isEditing && (
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setIsEditing(true)}>
              <Pencil className="w-4 h-4 text-gray-500" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onDelete(audio.id)}>
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSeek}
          className="cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleSpeedChange}
          className="w-14 text-xs font-medium"
        >
          {playbackRate}x
        </Button>
        
        <Button size="icon" variant="outline" onClick={() => skip(-10)} className="h-9 w-9">
          <RotateCcw className="w-4 h-4" />
        </Button>
        
        <Button 
          size="icon" 
          onClick={togglePlay}
          className="h-11 w-11 rounded-full bg-indigo-600 hover:bg-indigo-700"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </Button>
        
        <Button size="icon" variant="outline" onClick={() => skip(10)} className="h-9 w-9">
          <RotateCw className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}