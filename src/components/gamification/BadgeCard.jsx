import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Target, Zap, Award, BookOpen, CheckCircle2, Flame, Crown, Medal } from 'lucide-react';
import { format } from 'date-fns';

const iconMap = {
  trophy: Trophy,
  star: Star,
  target: Target,
  zap: Zap,
  award: Award,
  book: BookOpen,
  check: CheckCircle2,
  flame: Flame,
  crown: Crown,
  medal: Medal
};

export default function BadgeCard({ badge, earned = false, size = 'md' }) {
  const Icon = iconMap[badge.icon] || Award;
  
  const sizes = {
    sm: { container: 'w-16 h-16', icon: 'w-6 h-6', text: 'text-xs' },
    md: { container: 'w-20 h-20', icon: 'w-8 h-8', text: 'text-sm' },
    lg: { container: 'w-24 h-24', icon: 'w-10 h-10', text: 'text-base' }
  };

  const s = sizes[size];

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`flex flex-col items-center ${earned ? '' : 'opacity-40 grayscale'}`}
    >
      <div className={`${s.container} rounded-full flex items-center justify-center ${
        earned 
          ? 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg' 
          : 'bg-gray-200'
      }`}>
        <Icon className={`${s.icon} ${earned ? 'text-white' : 'text-gray-400'}`} />
      </div>
      <p className={`${s.text} font-medium text-center mt-2 ${earned ? 'text-gray-900' : 'text-gray-400'}`}>
        {badge.name}
      </p>
      {earned && badge.earned_at && (
        <p className="text-xs text-gray-500">
          {format(new Date(badge.earned_at), 'dd/MM/yyyy')}
        </p>
      )}
    </motion.div>
  );
}