import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Trophy, Star, Target, Zap, Award, BookOpen, CheckCircle2, Flame, Crown, Medal, Sparkles } from 'lucide-react';

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

export default function BadgeUnlockModal({ badge, open, onClose }) {
  if (!badge) return null;
  
  const Icon = iconMap[badge.icon] || Award;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-center">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="flex justify-center mb-4"
        >
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-2xl">
              <Icon className="w-16 h-16 text-white" />
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0"
            >
              <Sparkles className="absolute -top-2 left-1/2 w-6 h-6 text-yellow-400" />
              <Sparkles className="absolute top-1/2 -right-2 w-6 h-6 text-yellow-400" />
              <Sparkles className="absolute -bottom-2 left-1/2 w-6 h-6 text-yellow-400" />
              <Sparkles className="absolute top-1/2 -left-2 w-6 h-6 text-yellow-400" />
            </motion.div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Nueva Insignia!
          </h2>
          <h3 className="text-xl font-semibold text-indigo-600 mb-2">
            {badge.name}
          </h3>
          <p className="text-gray-600 mb-6">
            {badge.description}
          </p>
          <Button onClick={onClose} className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600">
            ¡Genial!
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}