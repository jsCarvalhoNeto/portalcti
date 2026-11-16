import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { BookOpen, Users, BarChart3, GraduationCap, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getTeacherNotifications } from '@/services/notificationService';
// SubjectModal is not required here; subject details are handled in the subjects tab
import { TeacherDashboardProvider, useTeacherDashboard } from '@/contexts/TeacherDashboardContext';
import TeacherSubjectsTab from '@/components/teacher/TeacherSubjectsTab';
import TeacherStudentsTab from '@/components/teacher/TeacherStudentsTab';
import TeacherGradesActivitiesTab from '@/components/teacher/TeacherGradesActivitiesTab';
import TeacherCalendarTab from '@/components/teacher/TeacherCalendarTab';
import TeacherGamificacaoTab from '@/components/teacher/TeacherGamificacaoTab';
import TeacherSettingsTab from '@/components/teacher/TeacherSettingsTab';
import TeacherUtilitiesTab from '@/components/teacher/TeacherUtilitiesTab';
import TeacherDashboardLayout from '@/layouts/TeacherDashboardLayout';

function TeacherDashboardContent() {
  const { user, isTeacher, loading: authLoading } = useAuth();
  const { subjects, students, activities, setActiveTab, activeTab } = useTeacherDashboard();
  const [activeNotifsCount, setActiveNotifsCount] = useState(0);

  // Verificar se estamos em modo privado/anônimo antes de montar as estatísticas
  const isAnonymousMode = !user || !isTeacher;

  useEffect(() => {
    if (isAnonymousMode || !user?.id) {
      setActiveNotifsCount(0);
      return;
    }

    let cancelled = false;
    getTeacherNotifications(user.id)
      .then((notifs) => {
        if (cancelled) return;
        const count = notifs.filter(
          (n) => n.is_active && new Date(n.expires_at).getTime() > Date.now()
        ).length;
        setActiveNotifsCount(count);
      })
      .catch(() => {
        if (!cancelled) setActiveNotifsCount(0);
      });

    return () => {
      cancelled = true;
    };
  }, [isAnonymousMode, user?.id]);

  const pendingActivitiesCount = useMemo(() => {
    if (isAnonymousMode) return 0;
    const now = Date.now();
    return activities.filter(
      (a) => !a.deadline || new Date(a.deadline).getTime() >= now
    ).length;
  }, [activities, isAnonymousMode]);

  // Stats data for teacher dashboard
  const stats = [
    { title: 'Minhas Disciplinas', value: isAnonymousMode ? '0' : subjects.length.toString(), icon: BookOpen, color: 'text-primary', bgColor: 'bg-primary/10' },
    { title: 'Meus Alunos', value: isAnonymousMode ? '0' : students.length.toString(), icon: Users, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
    { title: 'Atividades Pendentes', value: pendingActivitiesCount.toString(), icon: BarChart3, color: 'text-accent', bgColor: 'bg-accent/10' },
    { title: 'Notificações', value: activeNotifsCount.toString(), icon: GraduationCap, color: 'text-green-500', bgColor: 'bg-green-500/10' }
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isTeacher) {
    // Em modo anônimo, podemos mostrar um dashboard vazio ou redirecionar
    // Vamos mostrar uma mensagem informativa sobre o modo anônimo
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="mb-4 p-3 bg-yellow-100 rounded-full inline-block">
            <ShieldAlert className="h-8 w-8 text-yellow-600 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Modo Anônimo Ativo</h2>
          <p className="text-muted-foreground mb-4">
            Você está navegando no modo anônimo. Recursos de professor não estão disponíveis neste modo.
          </p>
          <Button onClick={() => window.location.href = '/auth'}>
            Fazer Login
          </Button>
        </div>
      </div>
    );
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
        <TeacherUtilitiesTab key="utilitarios" />,
        <TeacherCalendarTab key="calendar" />,
        <TeacherSettingsTab key="settings" />
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
