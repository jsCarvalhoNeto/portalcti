import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Users, BarChart3, GraduationCap } from 'lucide-react';
import SubjectModal from '@/components/SubjectModal';
import { TeacherDashboardProvider, useTeacherDashboard } from '@/contexts/TeacherDashboardContext';
import { Subject } from '@/services/teacherDashboardService';
import TeacherSubjectsTab from '@/components/teacher/TeacherSubjectsTab';
import TeacherStudentsTab from '@/components/teacher/TeacherStudentsTab';
import TeacherGradesActivitiesTab from '@/components/teacher/TeacherGradesActivitiesTab';
import TeacherCalendarTab from '@/components/teacher/TeacherCalendarTab';
import TeacherSettingsTab from '@/components/teacher/TeacherSettingsTab';
import TeacherDashboardLayout from '@/layouts/TeacherDashboardLayout';

function TeacherDashboardContent() {
  const { user, profile, isTeacher, signOut, loading: authLoading } = useAuth();
  const { subjects, students, loading: subjectsLoading, error, refetch, editingProfile, setEditingProfile, setActiveTab, activeTab } = useTeacherDashboard();
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const { toast } = useToast();

  const openSubjectModal = (subject?: Subject) => {
    setEditingSubject(subject || null);
    setShowSubjectModal(true);
  };

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
        <TeacherSubjectsTab 
          key="subjects"
          openSubjectModal={openSubjectModal}
        />,
        <TeacherStudentsTab key="students" />,
        <TeacherGradesActivitiesTab key="grades" />,
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
