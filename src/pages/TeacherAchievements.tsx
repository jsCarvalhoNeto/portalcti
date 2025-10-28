import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { BookOpen, Users, BarChart3, GraduationCap } from 'lucide-react';
import { TeacherDashboardProvider, useTeacherDashboard } from '@/contexts/TeacherDashboardContext';
import TeacherSubjectsTab from '@/components/teacher/TeacherSubjectsTab';
import TeacherStudentsTab from '@/components/teacher/TeacherStudentsTab';
import TeacherGradesActivitiesTab from '@/components/teacher/TeacherGradesActivitiesTab';
import TeacherCalendarTab from '@/components/teacher/TeacherCalendarTab';
import TeacherSettingsTab from '@/components/teacher/TeacherSettingsTab';
import TeacherDashboardLayout from '@/layouts/TeacherDashboardLayout';
import AchievementList from '../components/achievements/AchievementList';

function TeacherAchievementsContent() {
  const { user, isTeacher, loading: authLoading } = useAuth();
  const { subjects, students, setActiveTab, activeTab } = useTeacherDashboard();

  // Stats data for teacher dashboard
  const stats = [
    { title: 'Minhas Disciplinas', value: subjects.length.toString(), icon: BookOpen, color: 'text-primary', bgColor: 'bg-primary/10' },
    { title: 'Meus Alunos', value: students.length.toString(), icon: Users, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
    { title: 'Atividades Pendentes', value: '0', icon: BarChart3, color: 'text-accent', bgColor: 'bg-accent/10' },
    { title: 'Notificações', value: '0', icon: GraduationCap, color: 'text-green-500', bgColor: 'bg-green-500/10' }
  ];

  // Set the active tab to 'gamificacao' when this component mounts
  useEffect(() => {
    setActiveTab('gamificacao');
  }, [setActiveTab]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isTeacher) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <TeacherDashboardLayout 
      stats={stats}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
      {[
        <TeacherSubjectsTab key="subjects" />,
        <TeacherStudentsTab key="students" />,
        <TeacherGradesActivitiesTab key="grades" />,
        <div key="gamificacao" className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold">Gerenciar Conquistas</h2>
            <p className="text-muted-foreground">Crie, edite e gerencie as conquistas para seus alunos</p>
          </div>
          <AchievementList />
        </div>,
        <TeacherCalendarTab key="calendar" />,
        <TeacherSettingsTab key="settings" />
      ]}
    </TeacherDashboardLayout>
  );
}

export default function TeacherAchievements() {
  return (
    <TeacherDashboardProvider>
      <TeacherAchievementsContent />
    </TeacherDashboardProvider>
  );
}
