import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Medal, Award } from 'lucide-react';
import { motion } from 'framer-motion';

// Generador de pseudónimos aleatorios pero consistentes
const adjectives = ['Veloz', 'Sabio', 'Astuto', 'Audaz', 'Noble', 'Ágil', 'Brillante', 'Curioso', 'Tenaz', 'Valiente', 'Sereno', 'Intrépido'];
const animals = ['León', 'Águila', 'Búho', 'Delfín', 'Zorro', 'Lobo', 'Halcón', 'Tigre', 'Oso', 'Ciervo', 'Fénix', 'Dragón'];

const generatePseudonym = (email) => {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = ((hash << 5) - hash) + email.charCodeAt(i);
    hash = hash & hash;
  }
  const adjIndex = Math.abs(hash) % adjectives.length;
  const animalIndex = Math.abs(hash >> 4) % animals.length;
  const number = Math.abs(hash) % 100;
  return `${adjectives[adjIndex]} ${animals[animalIndex]} ${number}`;
};

export default function Leaderboard({ users, currentUserEmail, title = "Tabla de Clasificación" }) {
  const pseudonyms = useMemo(() => {
    const map = new Map();
    users.forEach(user => {
      map.set(user.user_email, generatePseudonym(user.user_email));
    });
    return map;
  }, [users]);

  const getMedalIcon = (position) => {
    if (position === 0) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (position === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (position === 2) return <Award className="w-5 h-5 text-amber-600" />;
    return null;
  };

  const getPositionStyle = (position) => {
    if (position === 0) return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300';
    if (position === 1) return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300';
    if (position === 2) return 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-300';
    return 'bg-white border-gray-200';
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-yellow-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {users.map((user, idx) => (
            <motion.div
              key={user.user_email}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`flex items-center justify-between p-3 rounded-lg border ${getPositionStyle(idx)} ${
                user.user_email === currentUserEmail ? 'ring-2 ring-indigo-500' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600">
                  {getMedalIcon(idx) || (idx + 1)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {user.user_email === currentUserEmail 
                      ? (user.username || 'Usuario') 
                      : pseudonyms.get(user.user_email)}
                    {user.user_email === currentUserEmail && (
                      <span className="ml-2 text-xs text-indigo-600">(Tú)</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">Nivel {user.level}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-indigo-600">{user.total_points} pts</p>
                <p className="text-xs text-gray-500">
                  {Math.min(100, Math.round((user.total_correct / Math.max(user.total_questions, 1)) * 100))}% precisión
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}