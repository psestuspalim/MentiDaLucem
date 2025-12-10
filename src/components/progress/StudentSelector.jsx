import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Search, ChevronDown, ChevronUp, Users, GraduationCap, User, UserCircle } from 'lucide-react';

export default function StudentSelector({ 
  users, 
  courses, 
  attempts, 
  selectedStudent, 
  onSelectStudent,
  currentUser,
  collapsed = false
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCourses, setExpandedCourses] = useState({});
  const [isOpen, setIsOpen] = useState(!collapsed);

  // Calcular estadísticas por estudiante
  const getStudentStats = (email) => {
    const studentAttempts = attempts.filter(a => a.user_email === email);
    const totalCorrect = studentAttempts.reduce((sum, a) => sum + (a.score || 0), 0);
    const totalQuestions = studentAttempts.reduce((sum, a) => sum + (a.total_questions || 0), 0);
    return {
      attempts: studentAttempts.length,
      avgScore: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0
    };
  };

  // Agrupar usuarios por curso (basado en allowed_users de cursos)
  const groupedByCourse = courses.map(course => {
    const courseUsers = course.visibility === 'specific' && course.allowed_users?.length > 0
      ? users.filter(u => course.allowed_users.includes(u.email))
      : users;
    
    return {
      ...course,
      students: courseUsers.filter(u => 
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.username || u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    };
  }).filter(c => c.students.length > 0);

  // Usuarios sin curso específico
  const unassignedUsers = users.filter(u => {
    const isInAnyCourse = courses.some(c => 
      c.visibility === 'specific' && c.allowed_users?.includes(u.email)
    );
    return !isInAnyCourse && (
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.username || u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const toggleCourse = (courseId) => {
    setExpandedCourses(prev => ({
      ...prev,
      [courseId]: !prev[courseId]
    }));
  };

  const StudentItem = ({ user }) => {
    const stats = getStudentStats(user.email);
    const isSelected = selectedStudent?.email === user.email;
    const isCurrentUser = user.email === currentUser?.email;
    
    return (
      <button
        onClick={() => { onSelectStudent(user); setIsOpen(false); }}
        className={`w-full text-left p-2 rounded-lg border transition-all ${
          isSelected
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="min-w-0">
              <div className="font-medium text-gray-900 text-sm truncate">
                {user.username || user.full_name || 'Sin nombre'}
                {isCurrentUser && <span className="text-indigo-600 ml-1">(Tú)</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-gray-400">{stats.attempts}</span>
            <Badge className={`text-xs h-5 ${
              stats.avgScore >= 70 ? 'bg-green-100 text-green-800' :
              stats.avgScore >= 50 ? 'bg-yellow-100 text-yellow-800' :
              stats.avgScore > 0 ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-600'
            }`}>
              {stats.avgScore}%
            </Badge>
          </div>
        </div>
      </button>
    );
  };

  const selectedName = selectedStudent 
    ? (selectedStudent.username || selectedStudent.full_name || selectedStudent.email)
    : 'Mi Progreso';

  return (
    <div className="mb-6">
      {/* Botón compacto que muestra el estudiante seleccionado */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-white border rounded-xl shadow-sm hover:shadow-md transition-all"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            selectedStudent ? 'bg-indigo-100' : 'bg-green-100'
          }`}>
            <UserCircle className={`w-6 h-6 ${selectedStudent ? 'text-indigo-600' : 'text-green-600'}`} />
          </div>
          <div className="text-left">
            <p className="text-xs text-gray-500">Viendo progreso de:</p>
            <p className="font-semibold text-gray-900">{selectedName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <Users className="w-3 h-3 mr-1" />
            Cambiar
          </Badge>
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Panel expandible */}
      {isOpen && (
        <Card className="mt-2 border-2 border-indigo-100">
          <CardContent className="p-4">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar estudiante..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {/* Mi progreso */}
              <button
                onClick={() => { onSelectStudent(null); setIsOpen(false); }}
                className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                  !selectedStudent
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-600" />
                  <span className="font-medium text-indigo-600 text-sm">Mi Progreso</span>
                </div>
              </button>

              {/* Cursos con estudiantes */}
              {groupedByCourse.map(course => (
                <Collapsible 
                  key={course.id} 
                  open={expandedCourses[course.id]}
                  onOpenChange={() => toggleCourse(course.id)}
                >
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-gray-800 text-sm">{course.icon} {course.name}</span>
                        <Badge variant="outline" className="text-xs h-5">
                          {course.students.length}
                        </Badge>
                      </div>
                      {expandedCourses[course.id] ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-1.5 space-y-1.5 pl-2">
                    {course.students.map(user => (
                      <StudentItem key={user.email} user={user} />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}

              {/* Estudiantes sin curso */}
              {unassignedUsers.length > 0 && (
                <Collapsible 
                  open={expandedCourses['unassigned']}
                  onOpenChange={() => toggleCourse('unassigned')}
                >
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-gray-800 text-sm">Todos los estudiantes</span>
                        <Badge variant="outline" className="text-xs h-5">
                          {unassignedUsers.length}
                        </Badge>
                      </div>
                      {expandedCourses['unassigned'] ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-1.5 space-y-1.5 pl-2">
                    {unassignedUsers.map(user => (
                      <StudentItem key={user.email} user={user} />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}