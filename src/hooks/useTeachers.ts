import { useState, useEffect } from 'react';
import { getAllTeachers } from '@/services/teacherService';

interface Teacher {
  id: string;
  full_name: string;
  email: string;
}

export function useTeachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoading(true);
        const data = await getAllTeachers();
        setTeachers(data as Teacher[]);
        setError(null);
      } catch (err) {
        console.error('Erro ao buscar professores no Supabase:', err);
        setError(err instanceof Error ? err.message : 'Erro ao buscar professores');
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  return { teachers, loading, error };
}
