import { } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { BookOpen, Users, BarChart3, GraduationCap } from 'lucide-react';
// SubjectModal is not required here; subject details are handled in the subjects tab
import { TeacherDashboardProvider, useTeacherDashboard } from '@/contexts/TeacherDashboardContext';
import TeacherSubjectsTab from '@/components/teacher/TeacherSubjectsTab';
import TeacherStudentsTab from '@/components/teacher/TeacherStudentsTab';
import TeacherGradesActivitiesTab from '@/components/teacher/TeacherGradesActivitiesTab';
import TeacherCalendarTab from '@/components/teacher/TeacherCalendarTab';
import TeacherGamificacaoTab from '@/components/teacher/TeacherGamificacaoTab';
import TeacherSettingsTab from '@/components/teacher/TeacherSettingsTab';
import TeacherDashboardLayout from '@/layouts/TeacherDashboardLayout';

function TeacherDashboardContent() {
  const { user, isTeacher, loading: authLoading } = useAuth();
  const { subjects, students, setActiveTab, activeTab } = useTeacherDashboard();

  // Stats data for teacher dashboard
  const stats = [
    { title: 'Minhas Disciplinas', value: subjects.length.toString(), icon: BookOpen, color: 'text-primary', bgColor: 'bg-primary/10' },
    { title: 'Meus Alunos', value: students.length.toString(), icon: Users, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
    { title: 'Atividades Pendentes', value: '0', icon: BarChart3, color: 'text-accent', bgColor: 'bg-accent/10' },
    { title: 'Notificações', value: '0', icon: GraduationCap, color: 'text-green-500', bgColor: 'bg-green-500/10' }
  ];

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
        <TeacherGamificacaoTab key="gamificacao" />,
        <TeacherCalendarTab key="calendar" />,
        <TeacherSettingsTab 
          key="settings"
        />
      ]}
    </TeacherDashboardLayout>
  );
}

export default function TeacherDashboard() {
  return (
    <TeacherDashboardProvider>
      <TeacherDashboardContent />
    </TeacherDashboardProvider>
  );
}
