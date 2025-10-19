import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { getTeacherSubjects, Subject } from '@/services/teacherDashboardService';

export const useTeacherData = () => {
  const { user, isTeacher } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user || !isTeacher) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Buscando disciplinas para o professor:', user.id);
      const teacherSubjects = await getTeacherSubjects(user.id);
      console.log('Disciplinas retornadas pela API:', teacherSubjects);
      setSubjects(teacherSubjects);
      setLoading(false);
    } catch (err) {
      setError('Falha ao buscar os dados do professor.');
      console.error('Erro ao buscar disciplinas:', err);
      setLoading(false);
    }
  }, [user?.id, isTeacher]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { subjects, loading, error, refetch: fetchData };
};
