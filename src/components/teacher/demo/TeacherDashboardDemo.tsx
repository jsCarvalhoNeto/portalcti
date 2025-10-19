/**
 * Demonstração do Painel do Professor
 * Componente de exemplo mostrando todos os recursos integrados
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Users, 
  BarChart3, 
  GraduationCap, 
  Calendar, 
  Settings,
  Home,
  Bell,
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  Edit,
  Trash2,
  Eye,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Star,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

// Componentes principais
import TeacherDashboardLayout from '@/layouts/TeacherDashboardLayout';
import TeacherSubjectsTab from '@/components/teacher/TeacherSubjectsTab';
import TeacherStudentsTab from '@/components/teacher/TeacherStudentsTab';
import TeacherGradesActivitiesTab from '@/components/teacher/TeacherGradesActivitiesTab';
import TeacherCalendarTab from '@/components/teacher/TeacherCalendarTab';
import TeacherSettingsTab from '@/components/teacher/TeacherSettingsTab';
import TeacherOverviewTab from '@/components/teacher/TeacherOverviewTab';

// Widgets personalizados
import { 
  QuickStatsWidget, 
  PendingActivitiesWidget, 
  ClassPerformanceWidget, 
  UpcomingEventsWidget, 
  StudentFeedbackWidget 
} from '@/components/teacher/widgets/TeacherWidgets';

// Dados de demonstração
const demoSubjects = [
  { id: 1, name: 'Desenvolvimento Web', description: 'HTML, CSS, JavaScript e frameworks modernos', teacher_id: 'teacher1', semester: '2025.2', schedule: 'Segundas e Quartas, 08:00-10:00', max_students: 30, current_students: 25 },
  { id: 2, name: 'Banco de Dados', description: 'SQL, modelagem e administração de bancos de dados', teacher_id: 'teacher1', semester: '2025.2', schedule: 'Terças e Quintas, 10:00-12:00', max_students: 25, current_students: 22 },
  { id: 3, name: 'Algoritmos e Estruturas de Dados', description: 'Fundamentos de programação e estruturas de dados', teacher_id: 'teacher1', semester: '2025.2', schedule: 'Sextas, 14:00-16:00', max_students: 20, current_students: 18 }
];

const demoStats = [
  { title: 'Minhas Disciplinas', value: '3', icon: BookOpen, color: 'text-primary', bgColor: 'bg-primary/10', trend: '+1 este mês', trendDirection: 'up' as const },
  { title: 'Meus Alunos', value: '65', icon: Users, color: 'text-orange-500', bgColor: 'bg-orange-500/10', trend: '+5 este mês', trendDirection: 'up' as const },
  { title: 'Atividades Pendentes', value: '12', icon: FileText, color: 'text-accent', bgColor: 'bg-accent/10', trend: '-3 desde ontem', trendDirection: 'down' as const },
  { title: 'Notificações', value: '8', icon: Bell, color: 'text-green-500', bgColor: 'bg-green-500/10' }
];

const demoActivities = [
  { id: '1', title: 'Trabalho Final - Desenvolvimento Web', subject: 'Desenvolvimento Web', dueDate: '2025-10-15', priority: 'high' as const, studentsCount: 25, gradedCount: 18 },
  { id: '2', title: 'Prova de SQL', subject: 'Banco de Dados', dueDate: '2025-10-20', priority: 'medium' as const, studentsCount: 22, gradedCount: 0 },
  { id: '3', title: 'Apresentação de Projetos', subject: 'Algoritmos', dueDate: '2025-10-25', priority: 'low' as const, studentsCount: 18, gradedCount: 5 }
];

const demoEvents = [
  { id: '1', title: 'Prova de Desenvolvimento Web', date: '2025-10-15', time: '10:00', type: 'exam' as const, subject: 'Desenvolvimento Web' },
  { id: '2', title: 'Reunião Pedagógica', date: '2025-10-18', time: '14:00', type: 'meeting' as const },
  { id: '3', title: 'Entrega de Trabalho Final', date: '2025-10-20', time: '23:59', type: 'deadline' as const, subject: 'Banco de Dados' }
];

const demoFeedback = {
  averageRating: 4.7,
  totalReviews: 24,
  recentFeedback: [
    { id: '1', studentName: 'Ana Silva', rating: 5, comment: 'Excelente professor, muito didático!', date: '2 dias atrás' },
    { id: '2', studentName: 'Carlos Oliveira', rating: 4, comment: 'Bom conteúdo, mas poderia ter mais exemplos práticos.', date: '1 semana atrás' },
    { id: '3', studentName: 'Maria Santos', rating: 5, comment: 'Professor atencioso e sempre disponível para dúvidas.', date: '2 semanas atrás' }
  ]
};

export default function TeacherDashboardDemo() {
  const [activeTab, setActiveTab] = useState('overview');
  const [editingProfile, setEditingProfile] = useState(false);

  const handleActivityClick = (activityId: string) => {
    console.log('Abrir atividade:', activityId);
  };

  const handleViewCalendar = () => {
    console.log('Ver calendário completo');
  };

  const handleViewAllFeedback = () => {
    console.log('Ver todos os feedbacks');
  };

  return (
    <div className="min-h-screen bg-background">
      <TeacherDashboardLayout 
        stats={demoStats}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      >
        <TabsContent value="overview" className="space-y-8">
          <div className="space-y-8">
            {/* Widgets de Destaque */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {demoStats.map((stat, index) => (
                <QuickStatsWidget key={index} {...stat} />
              ))}
            </div>

            {/* Painel Principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Coluna Esquerda - Atividades e Desempenho */}
              <div className="lg:col-span-2 space-y-6">
                <PendingActivitiesWidget 
                  activities={demoActivities}
                  onActivityClick={handleActivityClick}
                />

                <ClassPerformanceWidget
                  subject="Desenvolvimento Web"
                  averageGrade={85.5}
                  participationRate={92}
                  assignmentCompletion={88}
                  onDetailsClick={() => console.log('Ver detalhes do desempenho')}
                />
              </div>

              {/* Coluna Direita - Eventos e Feedback */}
              <div className="space-y-6">
                <UpcomingEventsWidget
                  events={demoEvents}
                  onViewCalendar={handleViewCalendar}
                />

                <StudentFeedbackWidget
                  averageRating={demoFeedback.averageRating}
                  totalReviews={demoFeedback.totalReviews}
                  recentFeedback={demoFeedback.recentFeedback}
                  onViewAll={handleViewAllFeedback}
                />
              </div>
            </div>

            {/* Ações Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="hover:shadow-glow transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    Minhas Disciplinas
                  </CardTitle>
                  <CardDescription>
                    Gerencie suas disciplinas e materiais
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" onClick={() => setActiveTab('subjects')}>
                    Acessar Disciplinas
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-glow transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-accent" />
                    Meus Alunos
                  </CardTitle>
                  <CardDescription>
                    Veja e interaja com seus alunos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" onClick={() => setActiveTab('students')}>
                    Gerenciar Alunos
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-glow transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-secondary-foreground" />
                    Atividades & Notas
                  </CardTitle>
                  <CardDescription>
                    Gerencie atividades e notas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" onClick={() => setActiveTab('grades')}>
                    Gerenciar Notas
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-glow transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-green-500" />
                    Configurações
                  </CardTitle>
                  <CardDescription>
                    Configure seu perfil e preferências
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" onClick={() => setActiveTab('settings')}>
                    Configurações
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="subjects" className="space-y-8">
          <TeacherSubjectsTab 
            openSubjectModal={(subject) => console.log('Abrir modal de disciplina:', subject)}
          />
        </TabsContent>

        <TabsContent value="students" className="space-y-8">
          <TeacherStudentsTab />
        </TabsContent>

        <TabsContent value="grades" className="space-y-8">
          <TeacherGradesActivitiesTab />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-8">
          <TeacherCalendarTab />
        </TabsContent>

        <TabsContent value="settings" className="space-y-8">
          <TeacherSettingsTab />
        </TabsContent>
      </TeacherDashboardLayout>
    </div>
  );
}
