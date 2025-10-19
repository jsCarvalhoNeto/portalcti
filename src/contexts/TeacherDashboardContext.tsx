import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTeacherData } from '@/hooks/useTeacherData';
import { getTeacherStudents, getPendingActivities, getTeacherCalendarEvents, getTeacherActivities, Subject as TeacherSubject } from '@/services/teacherDashboardService';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  full_name?: string;
  email: string;
  phone?: string;
}

export interface Subject extends TeacherSubject {}

export interface Student {
  id: string;
  full_name: string;
  email: string;
  student_registration?: string;
  phone?: string;
  grade?: string;
}

export interface Activity {
  id: string;
  name: string;
  subject_id: number;
  subject_name: string;
  grade: string;
  type: 'individual' | 'team';
  teacher_id: string;
  created_at: string;
  updated_at: string;
  description?: string;
  file_path?: string;
  file_name?: string;
  deadline?: string;
  period?: string;
  evaluation_type?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'class' | 'exam' | 'deadline' | 'meeting';
  subject_id?: number;
  subject_name?: string;
  description?: string;
}

interface TeacherDashboardContextType {
  subjects: Subject[];
  students: Student[];
  activities: Activity[];
  calendarEvents: CalendarEvent[];
  grades: string[];
  profile: UserProfile | null;
  loading: {
    subjects: boolean;
    students: boolean;
    activities: boolean;
    calendar: boolean;
    teachers: boolean;
  };
  error: {
    subjects: string | null;
    students: string | null;
    activities: string | null;
    calendar: string | null;
  };
  refetch: {
    subjects: () => void;
    students: () => void;
    activities: () => void;
    calendar: () => void;
  };
  editingProfile: boolean;
  setEditingProfile: (editing: boolean) => void;
  setActiveTab: (tab: string) => void;
  activeTab: string;
}

const TeacherDashboardContext = createContext<TeacherDashboardContextType | undefined>(undefined);

interface TeacherDashboardProviderProps {
  children: ReactNode;
}

export function TeacherDashboardProvider({ children }: TeacherDashboardProviderProps) {
  const { user, isTeacher } = useAuth();
  const { subjects, loading: subjectsLoading, error: subjectsError, refetch: refetchSubjects } = useTeacherData();

  const [students, setStudents] = useState<Student[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState({
    subjects: false,
    students: false,
    activities: false,
    calendar: false,
    teachers: false
  });
  const [error, setError] = useState({
    subjects: null,
    students: null,
    activities: null,
    calendar: null
 });
  const [editingProfile, setEditingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  // Mock de dados para as séries
  const grades = ["1º Ano - Técnico em Informática", "2º Ano - Técnico em Informática", "3º Ano - Técnico em Informática"];

  const fetchStudents = useCallback(async () => {
    if (!user) return;
    
    setLoading(prev => ({ ...prev, students: true }));
    setError(prev => ({ ...prev, students: null }));
    
    try {
      const data = await getTeacherStudents(user.id);
      setStudents(data);
    } catch (err) {
      setError(prev => ({ ...prev, students: 'Erro ao carregar alunos' }));
      toast({
        title: "Erro",
        description: "Falha ao carregar alunos",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, students: false }));
    }
  }, [user?.id, toast]);

  const fetchActivities = useCallback(async () => {
    if (!user) return;
    
    setLoading(prev => ({ ...prev, activities: true }));
    setError(prev => ({ ...prev, activities: null }));
    
    try {
      const data = await getTeacherActivities(user.id);
      setActivities(data);
    } catch (err) {
      setError(prev => ({ ...prev, activities: 'Erro ao carregar atividades' }));
      toast({
        title: "Erro",
        description: "Falha ao carregar atividades",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, activities: false }));
    }
  }, [user?.id, toast]);

  const fetchCalendarEvents = useCallback(async () => {
    if (!user) return;
    
    setLoading(prev => ({ ...prev, calendar: true }));
    setError(prev => ({ ...prev, calendar: null }));
    
    try {
      const data = await getTeacherCalendarEvents(user.id);
      setCalendarEvents(data);
    } catch (err) {
      setError(prev => ({ ...prev, calendar: 'Erro ao carregar eventos' }));
      toast({
        title: "Erro",
        description: "Falha ao carregar eventos do calendário",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, calendar: false }));
    }
  }, [user?.id, toast]);

  useEffect(() => {
    if (isTeacher) {
      fetchStudents();
      fetchActivities();
      fetchCalendarEvents();
    }
  }, [isTeacher, fetchStudents, fetchActivities, fetchCalendarEvents]);

  const value: TeacherDashboardContextType = {
    subjects,
    students,
    activities,
    calendarEvents,
    grades,
    profile: user ? { full_name: user.email, email: user.email, phone: undefined } : null,
    loading: {
      subjects: subjectsLoading,
      students: loading.students,
      activities: loading.activities,
      calendar: loading.calendar,
      teachers: loading.teachers
    },
    error: {
      subjects: subjectsError,
      students: error.students,
      activities: error.activities,
      calendar: error.calendar
    },
    refetch: {
      subjects: refetchSubjects,
      students: fetchStudents,
      activities: fetchActivities,
      calendar: fetchCalendarEvents
    },
    editingProfile,
    setEditingProfile,
    setActiveTab,
    activeTab
  };

  return (
    <TeacherDashboardContext.Provider value={value}>
      {children}
    </TeacherDashboardContext.Provider>
  );
}

export function useTeacherDashboard() {
  const context = useContext(TeacherDashboardContext);
  if (context === undefined) {
    throw new Error('useTeacherDashboard must be used within a TeacherDashboardProvider');
  }
  return context;
}
