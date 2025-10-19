import { API_URL } from '@/services/api';
import { useState, useEffect } from 'react';

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
        const response = await fetch(`${API_URL}/teachers`);
        if (!response.ok) {
          throw new Error('Erro ao buscar professores');
        }
        const data = await response.json();
        setTeachers(data);
        setError(null);
      } catch (err) {
        console.error('Erro ao buscar professores:', err);
        setError(err instanceof Error ? err.message : 'Erro ao buscar professores');
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  return { teachers, loading, error };
}
