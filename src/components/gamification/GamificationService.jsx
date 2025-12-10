// Definición de todas las insignias disponibles
export const ALL_BADGES = [
  { id: 'first_quiz', name: 'Primer Paso', description: 'Completa tu primer cuestionario', icon: 'star' },
  { id: 'perfect_score', name: 'Perfección', description: 'Obtén un puntaje perfecto', icon: 'trophy' },
  { id: 'ten_perfect', name: 'Maestro', description: 'Obtén 10 puntajes perfectos', icon: 'crown' },
  { id: 'hundred_correct', name: 'Centenario', description: 'Responde 100 preguntas correctamente', icon: 'check' },
  { id: 'five_hundred_correct', name: 'Erudito', description: 'Responde 500 preguntas correctamente', icon: 'award' },
  { id: 'thousand_correct', name: 'Sabio', description: 'Responde 1000 preguntas correctamente', icon: 'medal' },
  { id: 'streak_3', name: 'Constante', description: 'Estudia 3 días seguidos', icon: 'flame' },
  { id: 'streak_7', name: 'Dedicado', description: 'Estudia 7 días seguidos', icon: 'flame' },
  { id: 'streak_30', name: 'Imparable', description: 'Estudia 30 días seguidos', icon: 'flame' },
  { id: 'level_5', name: 'Aprendiz', description: 'Alcanza el nivel 5', icon: 'zap' },
  { id: 'level_10', name: 'Experto', description: 'Alcanza el nivel 10', icon: 'zap' },
  { id: 'accuracy_90', name: 'Precisión', description: 'Mantén 90% de precisión con más de 50 preguntas', icon: 'target' },
  { id: 'all_subjects', name: 'Explorador', description: 'Intenta cuestionarios de todas las materias', icon: 'book' }
];

// Puntos por acción
export const POINTS = {
  CORRECT_ANSWER: 10,
  PERFECT_SCORE_BONUS: 50,
  STREAK_BONUS: 5, // por día de racha
  FIRST_QUIZ_BONUS: 25
};

// Umbrales de nivel
export const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5000, 6500, 8000, 10000];

export function calculateLevel(points) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

export function calculatePoints(correct, total, isPerfect, isFirstQuiz, streakDays) {
  let points = correct * POINTS.CORRECT_ANSWER;
  
  if (isPerfect && total > 0) {
    points += POINTS.PERFECT_SCORE_BONUS;
  }
  
  if (isFirstQuiz) {
    points += POINTS.FIRST_QUIZ_BONUS;
  }
  
  points += streakDays * POINTS.STREAK_BONUS;
  
  return points;
}

export function checkNewBadges(stats, subjectsAttempted = [], totalSubjects = 0) {
  const newBadges = [];
  const currentBadgeIds = (stats.badges || []).map(b => b.id);
  
  // Primer cuestionario
  if (!currentBadgeIds.includes('first_quiz') && stats.total_questions > 0) {
    newBadges.push(ALL_BADGES.find(b => b.id === 'first_quiz'));
  }
  
  // Puntaje perfecto
  if (!currentBadgeIds.includes('perfect_score') && stats.perfect_scores >= 1) {
    newBadges.push(ALL_BADGES.find(b => b.id === 'perfect_score'));
  }
  
  // 10 puntajes perfectos
  if (!currentBadgeIds.includes('ten_perfect') && stats.perfect_scores >= 10) {
    newBadges.push(ALL_BADGES.find(b => b.id === 'ten_perfect'));
  }
  
  // Preguntas correctas
  if (!currentBadgeIds.includes('hundred_correct') && stats.total_correct >= 100) {
    newBadges.push(ALL_BADGES.find(b => b.id === 'hundred_correct'));
  }
  
  if (!currentBadgeIds.includes('five_hundred_correct') && stats.total_correct >= 500) {
    newBadges.push(ALL_BADGES.find(b => b.id === 'five_hundred_correct'));
  }
  
  if (!currentBadgeIds.includes('thousand_correct') && stats.total_correct >= 1000) {
    newBadges.push(ALL_BADGES.find(b => b.id === 'thousand_correct'));
  }
  
  // Rachas
  if (!currentBadgeIds.includes('streak_3') && stats.streak_days >= 3) {
    newBadges.push(ALL_BADGES.find(b => b.id === 'streak_3'));
  }
  
  if (!currentBadgeIds.includes('streak_7') && stats.streak_days >= 7) {
    newBadges.push(ALL_BADGES.find(b => b.id === 'streak_7'));
  }
  
  if (!currentBadgeIds.includes('streak_30') && stats.streak_days >= 30) {
    newBadges.push(ALL_BADGES.find(b => b.id === 'streak_30'));
  }
  
  // Niveles
  if (!currentBadgeIds.includes('level_5') && stats.level >= 5) {
    newBadges.push(ALL_BADGES.find(b => b.id === 'level_5'));
  }
  
  if (!currentBadgeIds.includes('level_10') && stats.level >= 10) {
    newBadges.push(ALL_BADGES.find(b => b.id === 'level_10'));
  }
  
  // Precisión
  if (!currentBadgeIds.includes('accuracy_90') && stats.total_questions >= 50) {
    const accuracy = (stats.total_correct / stats.total_questions) * 100;
    if (accuracy >= 90) {
      newBadges.push(ALL_BADGES.find(b => b.id === 'accuracy_90'));
    }
  }
  
  // Todas las materias
  if (!currentBadgeIds.includes('all_subjects') && totalSubjects > 0 && subjectsAttempted.length >= totalSubjects) {
    newBadges.push(ALL_BADGES.find(b => b.id === 'all_subjects'));
  }
  
  return newBadges.filter(Boolean);
}