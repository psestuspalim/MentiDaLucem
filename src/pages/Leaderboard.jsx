import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Crown, Trophy, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import Leaderboard from '../components/gamification/Leaderboard';

export default function LeaderboardPage() {
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

  const { data: allStats = [] } = useQuery({
    queryKey: ['all-user-stats'],
    queryFn: () => base44.entities.UserStats.list('-total_points', 100),
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => base44.entities.Subject.list(),
  });

  const { data: quizzes = [] } = useQuery({
    queryKey: ['quizzes'],
    queryFn: () => base44.entities.Quiz.list(),
  });

  const { data: attempts = [] } = useQuery({
    queryKey: ['all-attempts'],
    queryFn: () => base44.entities.QuizAttempt.list('-created_date', 1000),
  });

  // Calcular ranking por materia
  const getSubjectLeaderboard = (subjectId) => {
    const subjectQuizIds = quizzes.filter(q => q.subject_id === subjectId).map(q => q.id);
    const userScores = new Map();

    attempts.forEach(attempt => {
      if (!subjectQuizIds.includes(attempt.quiz_id)) return;
      
      const key = attempt.user_email;
      if (!userScores.has(key)) {
        userScores.set(key, {
          user_email: attempt.user_email,
          username: attempt.username,
          total_correct: 0,
          total_questions: 0,
          total_points: 0,
          level: 1
        });
      }
      
      const user = userScores.get(key);
      user.total_correct += attempt.score;
      user.total_questions += attempt.total_questions;
      user.total_points += attempt.score * 10;
    });

    return Array.from(userScores.values())
      .sort((a, b) => b.total_points - a.total_points)
      .slice(0, 20);
  };

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
            <Crown className="w-10 h-10 text-yellow-500" />
            Tabla de Clasificación
          </h1>
          <p className="text-gray-600">
            Compite con otros estudiantes y sube en el ranking
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">
              <Trophy className="w-4 h-4 mr-2" />
              General
            </TabsTrigger>
            {subjects.map(subject => (
              <TabsTrigger key={subject.id} value={subject.id}>
                {subject.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="general">
            <Leaderboard 
              users={allStats} 
              currentUserEmail={currentUser?.email}
              title="Ranking General"
            />
          </TabsContent>

          {subjects.map(subject => (
            <TabsContent key={subject.id} value={subject.id}>
              <Leaderboard 
                users={getSubjectLeaderboard(subject.id)} 
                currentUserEmail={currentUser?.email}
                title={`Ranking - ${subject.name}`}
              />
            </TabsContent>
          ))}
        </Tabs>

        {allStats.length === 0 && (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Aún no hay participantes
              </h3>
              <p className="text-gray-500">
                ¡Sé el primero en completar cuestionarios y aparecer aquí!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}