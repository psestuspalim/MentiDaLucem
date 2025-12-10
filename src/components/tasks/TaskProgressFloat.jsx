import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TaskProgressFloat() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (e) {}
    };
    loadUser();
  }, []);

  const { data: tasks = [] } = useQuery({
    queryKey: ['my-tasks', currentUser?.email],
    queryFn: async () => {
      const allTasks = await base44.entities.AssignedTask.filter({ 
        user_email: currentUser?.email 
      });
      return allTasks.filter(t => t.status !== 'completed');
    },
    enabled: !!currentUser?.email,
    refetchInterval: 30000
  });

  if (!currentUser || tasks.length === 0) return null;

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const overdueTasks = tasks.filter(t => {
    if (!t.due_date) return false;
    return new Date(t.due_date) < new Date() && t.status !== 'completed';
  });

  return (
    <motion.div
      className="fixed bottom-20 left-4 z-40"
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <div 
        className={`bg-white rounded-xl shadow-lg border transition-all duration-300 cursor-pointer ${
          isExpanded ? 'w-72' : 'w-auto'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="p-3 flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-lg font-bold text-indigo-600">{pendingTasks.length}</span>
            </div>
            {overdueTasks.length > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <AlertCircle className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          
          {!isExpanded && (
            <div className="pr-2">
              <div className="text-xs text-gray-500">Tareas</div>
              <div className="text-sm font-medium">pendientes</div>
            </div>
          )}
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 space-y-2">
                <div className="text-xs text-gray-500 font-medium">Tareas pendientes</div>
                
                {pendingTasks.slice(0, 3).map((task) => (
                  <div 
                    key={task.id}
                    className={`text-xs p-2 rounded-lg ${
                      new Date(task.due_date) < new Date() 
                        ? 'bg-red-50 border border-red-200' 
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="font-medium truncate">{task.quiz_title}</div>
                    <div className="flex items-center justify-between mt-1 text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Sin fecha'}
                      </span>
                      <span>{task.target_score}%</span>
                    </div>
                    {task.best_score > 0 && (
                      <Progress value={(task.best_score / task.target_score) * 100} className="h-1 mt-1" />
                    )}
                  </div>
                ))}

                {pendingTasks.length > 3 && (
                  <div className="text-xs text-center text-gray-500">
                    +{pendingTasks.length - 3} más
                  </div>
                )}

                <Link 
                  to={createPageUrl('MyTasks')}
                  className="block text-center text-xs text-indigo-600 hover:text-indigo-700 font-medium pt-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  Ver todas las tareas →
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}