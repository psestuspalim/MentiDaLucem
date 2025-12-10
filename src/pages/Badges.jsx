import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Award, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import BadgeCard from '../components/gamification/BadgeCard';
import PointsDisplay from '../components/gamification/PointsDisplay';
import { ALL_BADGES } from '../components/gamification/GamificationService';

export default function BadgesPage() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    loadUser();
  }, []);

  const { data: userStats } = useQuery({
    queryKey: ['user-stats', currentUser?.email],
    queryFn: async () => {
      const stats = await base44.entities.UserStats.filter({ user_email: currentUser?.email });
      return stats[0] || null;
    },
    enabled: !!currentUser?.email,
  });

  const earnedBadgeIds = (userStats?.badges || []).map(b => b.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <Link to={createPageUrl('Quizzes')}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Award className="w-10 h-10 text-yellow-500" />
            Mis Insignias
          </h1>
          <p className="text-gray-600">
            Desbloquea insignias completando logros y desafíos
          </p>
        </div>

        {userStats && (
          <Card className="border-0 shadow-lg mb-8">
            <CardContent className="p-6">
              <PointsDisplay 
                points={userStats.total_points || 0} 
                level={userStats.level || 1} 
              />
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                Insignias Obtenidas ({earnedBadgeIds.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {earnedBadgeIds.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Aún no has obtenido ninguna insignia
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {userStats.badges.map(badge => (
                    <BadgeCard key={badge.id} badge={badge} earned={true} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-gray-400" />
                Por Desbloquear ({ALL_BADGES.length - earnedBadgeIds.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {ALL_BADGES.filter(b => !earnedBadgeIds.includes(b.id)).map(badge => (
                  <BadgeCard key={badge.id} badge={badge} earned={false} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}