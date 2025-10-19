import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { 
  getTeacherSubjects, 
  getTeacherStudents, 
  getPendingActivities, 
  getTeacherCalendarEvents,
  Subject,
  Student,
  Activity,
  CalendarEvent
} from '@/services/teacherDashboardService';

interface TeacherDashboardData {
  subjects: Subject[];
  students: Student[];
  activities: Activity[];
  calendarEvents: CalendarEvent[];
  loading: {
    subjects: boolean;
    students: boolean;
    activities: boolean;
    calendar: boolean;
  };
  error: {
    subjects: string | null;
    students: string | null;
    activities: string | null;
    calendar: string | null;
  };
}

export const useTeacherDashboard = () => {
  const { user, isTeacher } = useAuth();
  const [data, setData] = useState<TeacherDashboardData>({
    subjects: [],
    students: [],
    activities: [],
    calendarEvents: [],
    loading: {
      subjects: false,
      students: false,
      activities: false,
      calendar: false
    },
    error: {
      subjects: null,
      students: null,
      activities: null,
      calendar: null
    }
  });

  const setLoading = useCallback((section: keyof TeacherDashboardData['loading'], isLoading: boolean) => {
    setData(prev => ({
      ...prev,
      loading: {
        ...prev.loading,
        [section]: isLoading
      }
    }));
  }, []);

  const setError = useCallback((section: keyof TeacherDashboardData['error'], errorMessage: string | null) => {
    setData(prev => ({
      ...prev,
      error: {
        ...prev.error,
        [section]: errorMessage
      }
    }));
  }, []);

  const fetchSubjects = useCallback(async () => {
    if (!user || !isTeacher) return;
    
    setLoading('subjects', true);
    setError('subjects', null);
    
    try {
      const subjects = await getTeacherSubjects(user.id);
      setData(prev => ({
        ...prev,
        subjects
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError('subjects', errorMessage);
      console.error('Erro ao buscar disciplinas:', error);
    } finally {
      setLoading('subjects', false);
    }
  }, [user, isTeacher, setLoading, setError]);

  const fetchStudents = useCallback(async () => {
    if (!user || !isTeacher) return;
    
    setLoading('students', true);
    setError('students', null);
    
    try {
      const students = await getTeacherStudents(user.id);
      setData(prev => ({
        ...prev,
        students
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError('students', errorMessage);
      console.error('Erro ao buscar alunos:', error);
    } finally {
      setLoading('students', false);
    }
  }, [user, isTeacher, setLoading, setError]);

  const fetchActivities = useCallback(async () => {
    if (!user || !isTeacher) return;
    
    setLoading('activities', true);
    setError('activities', null);
    
    try {
      const activities = await getPendingActivities(user.id);
      setData(prev => ({
        ...prev,
        activities
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError('activities', errorMessage);
      console.error('Erro ao buscar atividades:', error);
    } finally {
      setLoading('activities', false);
    }
  }, [user, isTeacher, setLoading, setError]);

  const fetchCalendarEvents = useCallback(async () => {
    if (!user || !isTeacher) return;
    
    setLoading('calendar', true);
    setError('calendar', null);
    
    try {
      const calendarEvents = await getTeacherCalendarEvents(user.id);
      setData(prev => ({
        ...prev,
        calendarEvents
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError('calendar', errorMessage);
      console.error('Erro ao buscar eventos do calendário:', error);
    } finally {
      setLoading('calendar', false);
    }
  }, [user, isTeacher, setLoading, setError]);

  const refetch = {
    subjects: fetchSubjects,
    students: fetchStudents,
    activities: fetchActivities,
    calendar: fetchCalendarEvents
  };

  useEffect(() => {
    if (user && isTeacher) {
      fetchSubjects();
      fetchStudents();
      fetchActivities();
      fetchCalendarEvents();
    }
  }, [user, isTeacher, fetchSubjects, fetchStudents, fetchActivities, fetchCalendarEvents]);

  return {
    ...data,
    refetch
  };
};
