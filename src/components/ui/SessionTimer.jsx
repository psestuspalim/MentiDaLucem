import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function SessionTimer() {
  const [sessionTime, setSessionTime] = useState(0);

  useEffect(() => {
    // Cargar tiempo acumulado de la sesión actual
    const savedStart = sessionStorage.getItem('session_start');
    if (!savedStart) {
      sessionStorage.setItem('session_start', Date.now().toString());
    }

    const interval = setInterval(() => {
      const start = parseInt(sessionStorage.getItem('session_start') || Date.now());
      setSessionTime(Math.floor((Date.now() - start) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-white/90 backdrop-blur shadow-lg rounded-full px-3 py-2 border text-sm font-mono text-gray-700">
      <Clock className="w-4 h-4 text-indigo-500" />
      <span>{formatTime(sessionTime)}</span>
    </div>
  );
}