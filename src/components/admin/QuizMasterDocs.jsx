import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Users, Trophy, Sparkles, Brain, Smartphone, FileJson, FolderTree, Shield, CheckCircle, FileDown } from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function QuizMasterDocs() {
  const generatePDF = () => {
    const doc = new jsPDF();
    let y = 20;
    const lineHeight = 7;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;

    const addText = (text, fontSize = 10, isBold = false) => {
      if (y > pageHeight - margin) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      const lines = doc.splitTextToSize(text, 170);
      doc.text(lines, 20, y);
      y += lineHeight * lines.length;
    };

    // Title
    addText('QuizMaster - Complete Documentation', 18, true);
    y += 5;
    addText('Full guide to all features and functionalities', 12);
    y += 10;

    // Core Features
    addText('CORE FEATURES', 14, true);
    y += 3;
    
    addText('Quiz Organization System', 12, true);
    addText('• 4-level hierarchy: Course → Folder → Subject → Quiz');
    addText('• Drag & Drop organization with visual feedback');
    addText('• Explorer Mode: Advanced file management with cut/copy/paste');
    addText('• Visibility Controls: all users, specific users, or inherit');
    addText('• Color & Icon Customization');
    y += 3;

    addText('Quiz Taking Experience', 12, true);
    addText('• Multiple Question Types: text, image, tissue identification');
    addText('• Configurable Settings: feedback, hints, error analysis per level');
    addText('• Smart Answer Shuffling to prevent memorization');
    addText('• Real-time progress tracking and score display');
    addText('• Review marked questions');
    y += 3;

    addText('Question Features', 12, true);
    addText('• Instant feedback with detailed rationales');
    addText('• AI-powered question rephrase');
    addText('• Etymology breakdown of medical terms');
    addText('• Visual schema generation');
    addText('• Personal notes per question');
    addText('• Mandatory reflection on incorrect answers');
    addText('• Movie tips (mnemonics)');
    y += 3;

    addText('Study Modes', 12, true);
    addText('• Swipe Mode: True/False mobile interface');
    addText('• Wrong questions review');
    addText('• Custom quiz length (5-30 questions)');
    addText('• Subject-wide review');
    y += 5;

    // Learning Features
    addText('LEARNING FEATURES', 14, true);
    y += 3;

    addText('Error Analysis', 12, true);
    addText('• AI-powered error pattern analysis');
    addText('• Pattern recognition across attempts');
    addText('• Context-aware explanations');
    y += 3;

    addText('Progress Analytics', 12, true);
    addText('• Overall statistics: attempts, accuracy, streaks');
    addText('• Subject and quiz performance breakdown');
    addText('• Weak points analysis');
    addText('• Temporal trends with weekly graphs');
    addText('• Speed analysis');
    addText('• Performance radar charts');
    y += 3;

    addText('Additional Learning Tools', 12, true);
    addText('• Question difficulty rating (1-5)');
    addText('• Spaced Repetition System (SRS)');
    addText('• Audio learning support');
    y += 5;

    // Social Features
    addText('SOCIAL FEATURES', 14, true);
    y += 3;

    addText('Leaderboards', 12, true);
    addText('• Global and subject-specific rankings');
    addText('• Medal system for top 3');
    y += 3;

    addText('1v1 Challenges', 12, true);
    addText('• Challenge online users');
    addText('• Custom settings per challenge');
    addText('• Real-time progress tracking');
    addText('• Automatic winner determination');
    y += 3;

    addText('Multiplayer', 12, true);
    addText('• Game Rooms: public & private');
    addText('• Live Tournaments: Kahoot-style with timers');
    addText('• Speed bonus points');
    addText('• Real-time rankings');
    y += 3;

    addText('Gamification', 12, true);
    addText('• Points and level system');
    addText('• Badge collection');
    addText('• Streak counter');
    y += 5;

    // Admin Features
    addText('ADMIN FEATURES', 14, true);
    y += 3;

    addText('Content Management', 12, true);
    addText('• Bulk operations');
    addText('• Visibility toggle');
    addText('• Content search');
    y += 3;

    addText('Student Monitoring', 12, true);
    addText('• Individual analytics');
    addText('• Subject and quiz performance breakdown');
    addText('• Attempt history');
    addText('• Error report PDF generation');
    y += 3;

    addText('Quiz Management', 12, true);
    addText('• Multiple upload formats');
    addText('• Specialized creators: text, image, tissue');
    addText('• JSON repair tool');
    addText('• Quiz editor and exporter');
    addText('• Move/copy quizzes');
    y += 3;

    addText('Task Assignment', 12, true);
    addText('• Assign quizzes to students');
    addText('• Target scores and due dates');
    addText('• Progress tracking');
    y += 5;

    // AI Features
    addText('AI FEATURES', 14, true);
    y += 3;

    addText('Quiz Generation', 12, true);
    addText('• Topic-based generation');
    addText('• JSON/text conversion');
    addText('• Smart question creation');
    addText('• Automatic rationale generation');
    y += 3;

    addText('Learning Enhancement', 12, true);
    addText('• Question rephrase');
    addText('• Etymology analysis');
    addText('• Schema visualization');
    addText('• Error pattern analysis');
    addText('• Personalized recommendations');
    y += 5;

    addText('Generated on: ' + new Date().toLocaleDateString(), 8);

    doc.save('QuizMaster_Documentation.pdf');
  };
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                QuizMaster - Full Documentation
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Complete guide to all features and functionalities implemented in QuizMaster
              </p>
            </div>
            <Button onClick={generatePDF} className="bg-indigo-600 hover:bg-indigo-700">
              <FileDown className="w-4 h-4 mr-2" />
              Descargar PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="core">
            <TabsList className="grid grid-cols-2 lg:grid-cols-5 mb-6">
              <TabsTrigger value="core">Core</TabsTrigger>
              <TabsTrigger value="learning">Learning</TabsTrigger>
              <TabsTrigger value="social">Social</TabsTrigger>
              <TabsTrigger value="admin">Admin</TabsTrigger>
              <TabsTrigger value="ai">AI Features</TabsTrigger>
            </TabsList>

            {/* CORE FEATURES */}
            <TabsContent value="core" className="space-y-6">
              <Section title="Quiz Organization System">
                <Feature 
                  icon={<FolderTree className="w-4 h-4" />}
                  title="Hierarchical Structure"
                  description="4-level organization: Course → Folder → Subject → Quiz"
                />
                <Feature 
                  title="Drag & Drop Organization"
                  description="Reorder and move items between containers with visual feedback"
                />
                <Feature 
                  title="Explorer Mode"
                  description="Advanced file management system with cut/copy/paste operations, bulk operations, and type conversion"
                />
                <Feature 
                  title="Visibility Controls"
                  description="Three visibility modes: all users, specific users (email-based), or inherit from parent container"
                />
                <Feature 
                  title="Color & Icon Customization"
                  description="Personalize courses, folders, and subjects with custom colors and emoji icons"
                />
              </Section>

              <Section title="Quiz Taking Experience">
                <Feature 
                  title="Multiple Question Types"
                  description="Text-based questions, image-based questions with clickable markers, and tissue identification quizzes"
                />
                <Feature 
                  title="Configurable Settings Per Level"
                  description="Control visibility of: feedback, hints, error analysis, schema generation, notes, reflection fields - at course, folder, subject, or quiz level"
                />
                <Feature 
                  title="Smart Answer Shuffling"
                  description="Questions and answers randomized on each attempt to prevent memorization"
                />
                <Feature 
                  title="Progress Tracking"
                  description="Real-time score display, progress bar, and question counter during quiz"
                />
                <Feature 
                  title="Review Marked Questions"
                  description="Bookmark questions during quiz for later review"
                />
              </Section>

              <Section title="Question Features">
                <Feature 
                  title="Instant Feedback"
                  description="Immediate correct/incorrect indication with detailed rationales for each answer option"
                />
                <Feature 
                  title="Question Rephrase"
                  description="AI-powered simplification of complex medical terminology"
                />
                <Feature 
                  title="Etymology Breakdown"
                  description="Decompose medical terms into Greek/Latin roots, prefixes, and suffixes"
                />
                <Feature 
                  title="Visual Schema Generation"
                  description="Generate emoji-based process diagrams for complex concepts"
                />
                <Feature 
                  title="Personal Notes"
                  description="Add private notes to any question for future reference"
                />
                <Feature 
                  title="Mandatory Reflection"
                  description="Required written reflection on incorrect answers before proceeding"
                />
                <Feature 
                  title="Movie Tips (Hints)"
                  description="Cinematic mnemonics to help remember key concepts"
                />
              </Section>

              <Section title="Study Modes">
                <Feature 
                  icon={<Smartphone className="w-4 h-4" />}
                  title="Swipe Mode (True/False)"
                  description="Mobile-friendly swipe interface converting all answer options into true/false statements"
                />
                <Feature 
                  title="Wrong Questions Review"
                  description="Create custom quiz from all previously failed questions"
                />
                <Feature 
                  title="Custom Quiz Length"
                  description="Select number of questions (5-30) from any quiz"
                />
                <Feature 
                  title="Subject-Wide Review"
                  description="Practice all incorrect questions across all quizzes in a subject"
                />
              </Section>
            </TabsContent>

            {/* LEARNING FEATURES */}
            <TabsContent value="learning" className="space-y-6">
              <Section title="Error Analysis">
                <Feature 
                  icon={<Brain className="w-4 h-4" />}
                  title="AI-Powered Error Analysis"
                  description="After each wrong answer, AI analyzes your mistake patterns and suggests why you got it wrong"
                />
                <Feature 
                  title="Pattern Recognition"
                  description="System tracks repeated mistakes across multiple attempts to identify weak patterns"
                />
                <Feature 
                  title="Personalized Explanations"
                  description="Context-aware explanations based on your previous attempts and learning history"
                />
              </Section>

              <Section title="Progress Analytics">
                <Feature 
                  title="Overall Statistics"
                  description="Total attempts, accuracy rate, streak days, and total questions answered"
                />
                <Feature 
                  title="Subject Performance"
                  description="Detailed breakdown by subject with unique correct/wrong questions tracked"
                />
                <Feature 
                  title="Quiz Performance"
                  description="Best score, average score, and attempt history per quiz"
                />
                <Feature 
                  title="Weak Points Analysis"
                  description="Identify most frequently missed questions with recommendations"
                />
                <Feature 
                  title="Temporal Trends"
                  description="Weekly activity graph showing study patterns over time"
                />
                <Feature 
                  title="Speed Analysis"
                  description="Average response time per question to optimize study pace"
                />
                <Feature 
                  title="Performance Radar Chart"
                  description="Visual representation of skills across different subjects"
                />
              </Section>

              <Section title="Difficulty Tracking">
                <Feature 
                  title="Question Difficulty Rating"
                  description="Rate questions 1-5 based on perceived difficulty"
                />
                <Feature 
                  title="Spaced Repetition System (SRS)"
                  description="Automatic scheduling of difficult questions for optimal review timing"
                />
                <Feature 
                  title="Personal Difficulty Database"
                  description="System tracks which questions you find hard/easy for personalized practice"
                />
              </Section>

              <Section title="Audio Learning">
                <Feature 
                  title="Audio Attachment"
                  description="Attach audio files to any subject for auditory learning"
                />
                <Feature 
                  title="Audio Player"
                  description="Built-in player with speed control and progress tracking"
                />
              </Section>
            </TabsContent>

            {/* SOCIAL FEATURES */}
            <TabsContent value="social" className="space-y-6">
              <Section title="Leaderboards">
                <Feature 
                  icon={<Trophy className="w-4 h-4" />}
                  title="Global Ranking"
                  description="Overall leaderboard based on total points and performance"
                />
                <Feature 
                  title="Subject-Specific Rankings"
                  description="Compete in individual subjects to see who's the expert"
                />
                <Feature 
                  title="Medal System"
                  description="Gold, silver, and bronze medals for top 3 performers"
                />
              </Section>

              <Section title="1v1 Challenges">
                <Feature 
                  title="Challenge Any User"
                  description="Send quiz challenges to online users"
                />
                <Feature 
                  title="Custom Challenge Settings"
                  description="Choose quiz and number of questions for each challenge"
                />
                <Feature 
                  title="Real-time Progress"
                  description="See when opponent starts and completes their challenge"
                />
                <Feature 
                  title="Winner Determination"
                  description="Automatic winner calculation based on score and time"
                />
                <Feature 
                  title="Challenge Notifications"
                  description="Receive and manage incoming challenge requests"
                />
              </Section>

              <Section title="Multiplayer Game Rooms">
                <Feature 
                  title="Public & Private Rooms"
                  description="Create game rooms that are publicly visible or join-code protected"
                />
                <Feature 
                  title="Room Lobby System"
                  description="Wait for players to join before starting the game"
                />
                <Feature 
                  title="Simultaneous Play"
                  description="All players answer the same randomized questions"
                />
                <Feature 
                  title="Final Rankings"
                  description="Leaderboard showing all players' scores and completion times"
                />
              </Section>

              <Section title="Live Tournaments">
                <Feature 
                  title="Kahoot-Style Experience"
                  description="Host controls question progression, all players see the same question"
                />
                <Feature 
                  title="Question Timer"
                  description="Configurable time limit per question (default 30 seconds)"
                />
                <Feature 
                  title="Speed Bonus Points"
                  description="Faster correct answers earn more points"
                />
                <Feature 
                  title="Live Results"
                  description="See intermediate rankings after each question"
                />
                <Feature 
                  title="Tournament Code"
                  description="Share 6-digit code for players to join"
                />
              </Section>

              <Section title="Online Presence">
                <Feature 
                  title="Real-time User List"
                  description="See who's online and available for challenges"
                />
                <Feature 
                  title="Activity Tracking"
                  description="Show last seen timestamp and current page"
                />
                <Feature 
                  title="Automatic Updates"
                  description="Online status updates every 30 seconds"
                />
              </Section>

              <Section title="Gamification">
                <Feature 
                  title="Points System"
                  description="Earn points for correct answers, perfect scores, and streaks"
                />
                <Feature 
                  title="Level Progression"
                  description="Automatic level-up based on accumulated points"
                />
                <Feature 
                  title="Badge Collection"
                  description="Unlock badges for achievements: First Quiz, Perfect Score, Marathon Runner, etc."
                />
                <Feature 
                  title="Streak Counter"
                  description="Track consecutive days of study activity"
                />
              </Section>
            </TabsContent>

            {/* ADMIN FEATURES */}
            <TabsContent value="admin" className="space-y-6">
              <Section title="Content Management">
                <Feature 
                  icon={<Shield className="w-4 h-4" />}
                  title="Bulk Operations"
                  description="Select and delete multiple courses, folders, or subjects at once"
                />
                <Feature 
                  title="Visibility Toggle"
                  description="Hide/show content for students with one click"
                />
                <Feature 
                  title="Content Search"
                  description="Search across all courses, folders, and subjects"
                />
                <Feature 
                  title="Deletion Prevention"
                  description="Warning system for deleting containers with content"
                />
              </Section>

              <Section title="Student Progress Monitoring">
                <Feature 
                  title="Student List"
                  description="View all registered students with basic stats"
                />
                <Feature 
                  title="Individual Analytics"
                  description="Deep dive into each student's performance data"
                />
                <Feature 
                  title="Subject Performance Breakdown"
                  description="See how each student performs across different subjects"
                />
                <Feature 
                  title="Quiz-by-Quiz Tracking"
                  description="Monitor attempts, best scores, and averages per quiz"
                />
                <Feature 
                  title="Attempt History"
                  description="Full chronological list of all quiz attempts with details"
                />
                <Feature 
                  title="Wrong Questions Review"
                  description="View all incorrect answers for any attempt"
                />
                <Feature 
                  title="Error Report PDF"
                  description="Generate comprehensive PDF of all student's mistakes with explanations"
                />
              </Section>

              <Section title="Quiz Management">
                <Feature 
                  icon={<FileJson className="w-4 h-4" />}
                  title="Multiple Upload Formats"
                  description="JSON file upload, paste JSON, or use specialized creators"
                />
                <Feature 
                  title="Text Quiz Creator"
                  description="Built-in editor for standard multiple-choice questions"
                />
                <Feature 
                  title="Image Quiz Creator"
                  description="Upload image and add clickable answer markers"
                />
                <Feature 
                  title="Tissue Quiz Creator"
                  description="Specialized editor for histology/anatomy identification"
                />
                <Feature 
                  title="JSON Repair Tool"
                  description="AI-powered automatic fixing of malformed JSON files"
                />
                <Feature 
                  title="Bulk Section Upload"
                  description="Upload multiple quizzes at once with automatic organization"
                />
                <Feature 
                  title="Quiz Editor"
                  description="Edit questions, answers, hints, and settings after upload"
                />
                <Feature 
                  title="Quiz Exporter"
                  description="Download all quizzes as individual JSON files for backup"
                />
                <Feature 
                  title="Move/Copy Quizzes"
                  description="Transfer quizzes between subjects, create duplicates"
                />
              </Section>

              <Section title="Settings Management">
                <Feature 
                  title="Hierarchical Settings"
                  description="Configure quiz behavior at course, folder, subject, or individual quiz level"
                />
                <Feature 
                  title="Settings Inheritance"
                  description="Child items inherit settings from parent unless overridden"
                />
                <Feature 
                  title="Granular Controls"
                  description="Toggle feedback, hints, error analysis, schemas, notes, and reflections"
                />
              </Section>

              <Section title="Task Assignment">
                <Feature 
                  title="Assign Quizzes"
                  description="Assign specific quizzes to specific students"
                />
                <Feature 
                  title="Target Scores"
                  description="Set minimum required percentage for completion"
                />
                <Feature 
                  title="Due Dates"
                  description="Set deadlines for assigned tasks"
                />
                <Feature 
                  title="Progress Tracking"
                  description="Monitor completion status and best scores"
                />
                <Feature 
                  title="Student View"
                  description="Students see their assigned tasks with status badges"
                />
              </Section>

              <Section title="Data Management">
                <Feature 
                  title="Failed Attempts Purge"
                  description="Bulk delete incomplete/abandoned quiz attempts (0 score, 0 answered)"
                />
                <Feature 
                  title="Individual Attempt Deletion"
                  description="Remove specific attempts from student history"
                />
                <Feature 
                  title="Attempt Count Display"
                  description="See total valid vs failed attempts"
                />
              </Section>
            </TabsContent>

            {/* AI FEATURES */}
            <TabsContent value="ai" className="space-y-6">
              <Section title="Quiz Generation">
                <Feature 
                  icon={<Sparkles className="w-4 h-4" />}
                  title="Topic-Based Generation"
                  description="Generate quizzes by specifying topic, number of questions, and difficulty level"
                />
                <Feature 
                  title="JSON/Text Conversion"
                  description="Paste any content (JSON, notes, study material) and AI converts to structured quiz"
                />
                <Feature 
                  title="Smart Question Creation"
                  description="AI generates medically accurate multiple-choice questions with 4-5 options each"
                />
                <Feature 
                  title="Rationale Generation"
                  description="Automatic explanation for why each answer is correct or incorrect"
                />
                <Feature 
                  title="Context Preservation"
                  description="Maintains medical accuracy and appropriate difficulty level"
                />
              </Section>

              <Section title="Learning Enhancement">
                <Feature 
                  title="Question Rephrase"
                  description="Simplify complex medical terminology without revealing the answer"
                />
                <Feature 
                  title="Etymology Analysis"
                  description="Break down medical terms into morphological components (prefix + root + suffix)"
                />
                <Feature 
                  title="Schema Visualization"
                  description="Generate process diagrams using emojis and text for better understanding"
                />
                <Feature 
                  title="Error Pattern Analysis"
                  description="AI identifies why you made a mistake based on your answer history"
                />
                <Feature 
                  title="Personalized Recommendations"
                  description="Suggest specific topics or questions to review based on performance"
                />
              </Section>

              <Section title="Smart Features">
                <Feature 
                  title="Context-Aware Help"
                  description="AI assistance adapts based on question difficulty and user history"
                />
                <Feature 
                  title="Intelligent Formatting"
                  description="Automatic detection and proper rendering of mathematical formulas and special characters"
                />
                <Feature 
                  title="Quality Assurance"
                  description="AI validates generated content for medical accuracy and quiz format compliance"
                />
              </Section>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">50+</div>
              <div className="text-sm text-gray-600 mt-1">Core Features</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">10+</div>
              <div className="text-sm text-gray-600 mt-1">AI Tools</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">4</div>
              <div className="text-sm text-gray-600 mt-1">Game Modes</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600">15+</div>
              <div className="text-sm text-gray-600 mt-1">Admin Tools</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold text-gray-900 mb-4 text-lg flex items-center gap-2">
        <CheckCircle className="w-5 h-5 text-green-600" />
        {title}
      </h3>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}

function Feature({ icon, title, description }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      {icon && <div className="shrink-0 mt-0.5 text-indigo-600">{icon}</div>}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 text-sm">{title}</div>
        <div className="text-xs text-gray-600 mt-1">{description}</div>
      </div>
    </div>
  );
}