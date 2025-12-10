import React from 'react';
import { motion } from 'framer-motion';
import { Play, Clock, HelpCircle, Trophy, ArrowLeft, BookOpen, Calculator, BrainCircuit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function QuizIntroView({ quiz, onStart, onBack }) {
    if (!quiz) return null;

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />
            <div className="absolute top-20 left-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-4xl glass-card rounded-3xl overflow-hidden shadow-2xl relative z-10 border border-white/20"
            >
                {/* Header Image / Gradient */}
                <div className="h-48 sm:h-64 relative bg-black/5">
                    {quiz.image ? (
                        <img src={quiz.image} alt={quiz.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
                            <BrainCircuit className="w-24 h-24 text-white/20" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onBack}
                        className="absolute top-4 left-4 text-white/80 hover:text-white hover:bg-white/10"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" /> Volver
                    </Button>
                </div>

                <div className="p-8 sm:p-12 -mt-12 relative">
                    <div className="flex flex-col items-center text-center space-y-6">
                        {/* Title & Badge */}
                        <div className="space-y-4">
                            <Badge className="px-3 py-1 text-sm bg-indigo-500/20 text-indigo-300 border-indigo-500/30 backdrop-blur-md shadow-lg">
                                {quiz.subject || "Medicina"}
                            </Badge>
                            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
                                {quiz.title}
                            </h1>
                            <p className="text-lg text-muted-foreground max-w-2xl font-medium leading-relaxed">
                                {quiz.description || "Pon a prueba tus conocimientos y domina este tema con este simulacro oficial."}
                            </p>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mt-8">
                            <Card className="glass p-4 border-white/10 bg-white/5 flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-colors group">
                                <HelpCircle className="w-8 h-8 text-blue-400 group-hover:scale-110 transition-transform" />
                                <div className="text-center">
                                    <span className="block text-2xl font-bold text-foreground">{quiz.questions?.length || 0}</span>
                                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Preguntas</span>
                                </div>
                            </Card>
                            <Card className="glass p-4 border-white/10 bg-white/5 flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-colors group">
                                <Clock className="w-8 h-8 text-amber-400 group-hover:scale-110 transition-transform" />
                                <div className="text-center">
                                    <span className="block text-2xl font-bold text-foreground">~{Math.ceil((quiz.questions?.length || 0) * 1.5)}</span>
                                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Minutos</span>
                                </div>
                            </Card>
                            <Card className="glass p-4 border-white/10 bg-white/5 flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-colors group">
                                <Trophy className="w-8 h-8 text-purple-400 group-hover:scale-110 transition-transform" />
                                <div className="text-center">
                                    <span className="block text-2xl font-bold text-foreground">Top 10%</span>
                                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Dificultad</span>
                                </div>
                            </Card>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mt-8">
                            <Button
                                size="lg"
                                onClick={onStart}
                                className="flex-1 h-14 text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-500/25 shadow-xl transition-all hover:scale-105"
                            >
                                <Play className="w-6 h-6 mr-2 fill-current" /> Iniciar Quiz
                            </Button>
                        </div>

                        <p className="text-xs text-muted-foreground mt-4 opacity-50">
                            Presiona iniciar para comenzar el temporizador. ¡Buena suerte!
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
