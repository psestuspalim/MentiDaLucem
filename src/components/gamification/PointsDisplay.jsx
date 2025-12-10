import React from 'react';
import { motion } from 'framer-motion';
import { Star, Zap } from 'lucide-react';

export default function PointsDisplay({ points, level, showAnimation = false }) {
  const levelThresholds = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5000];
  const currentThreshold = levelThresholds[level - 1] || 0;
  const nextThreshold = levelThresholds[level] || levelThresholds[levelThresholds.length - 1];
  const progress = ((points - currentThreshold) / (nextThreshold - currentThreshold)) * 100;

  return (
    <div className="flex items-center gap-3">
      <motion.div
        initial={showAnimation ? { scale: 0 } : { scale: 1 }}
        animate={{ scale: 1 }}
        className="relative"
      >
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-lg">{level}</span>
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
          <Star className="w-3 h-3 text-white" />
        </div>
      </motion.div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">Nivel {level}</span>
          <div className="flex items-center gap-1 text-yellow-600">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-bold">{points} pts</span>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {nextThreshold - points} pts para nivel {level + 1}
        </p>
      </div>
    </div>
  );
}