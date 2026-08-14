import { supabase } from '../lib/supabaseClient';

interface Subject {
  id: number;
  name: string;
}

interface Grade {
  id: number;
  studentName: string;
  value: number;
}

interface Absence {
  id: number;
  studentName: string;
  date: string;
  present: boolean;
}

export const getSubjectsByTeacher = async (teacherId: string): Promise<Subject[]> => {
  try {
    if (!teacherId) return [];

    // 1. Buscar de teacher_subjects
    const { data: assigned } = await supabase
      .from('teacher_subjects')
      .select('subject_id')
      .eq('teacher_id', teacherId);

    const assignedIds = (assigned || []).map((a: any) => Number(a.subject_id));

    // 2. Buscar de subjects
    const { data: directSubjects } = await supabase
      .from('subjects')
      .select('id')
      .eq('teacher_id', teacherId);

    const directIds = (directSubjects || []).map((s: any) => Number(s.id));

    const allSubjectIds = Array.from(new Set([...assignedIds, ...directIds]));
    if (allSubjectIds.length === 0) return [];

    const { data, error } = await supabase
      .from('subjects')
      .select('id, name')
      .in('id', allSubjectIds)
      .order('name', { ascending: true });

    if (error) throw error;
    
    return (data || []).map((subject: any) => ({
      id: Number(subject.id),
      name: subject.name
    }));
  } catch (error) {
    console.error('Erro ao buscar disciplinas por professor no Supabase:', error);
    return [];
  }
};

export const getGradesBySubject = async (subjectId: number): Promise<Grade[]> => {
  try {
    const { data, error } = await supabase
      .from('grades')
      .select(`
        id,
        grade,
        enrollments!inner(
          subject_id,
          profiles!inner(full_name)
        )
      `)
      .eq('enrollments.subject_id', subjectId);

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: Number(item.id),
      studentName: item.enrollments.profiles.full_name,
      value: Number(item.grade)
    }));
  } catch (error) {
    console.error('Erro ao buscar notas por matéria no Supabase:', error);
    return [];
  }
};

export const getAbsencesBySubject = async (subjectId: number): Promise<Absence[]> => {
  try {
    const { data, error } = await supabase
      .from('attendances')
      .select(`
        id,
        class_date,
        present,
        enrollments!inner(
          subject_id,
          profiles!inner(full_name)
        )
      `)
      .eq('enrollments.subject_id', subjectId)
      .eq('present', false); // absences = presenças falsas

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: Number(item.id),
      studentName: item.enrollments.profiles.full_name,
      date: item.class_date,
      present: item.present
    }));
  } catch (error) {
    console.error('Erro ao buscar faltas por matéria no Supabase:', error);
    return [];
  }
};

export const getAllTeachers = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        user_roles!inner(role)
      `)
      .eq('user_roles.role', 'teacher')
      .order('full_name', { ascending: true });

    if (error) throw error;
    return (data || []).map((t: any) => ({
      id: t.id,
      full_name: t.full_name || 'Professor',
      email: '',
    }));
  } catch (error) {
    console.error('Erro ao buscar professores no Supabase:', error);
    throw error;
  }
};

export const deleteTeacher = async (teacherId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', teacherId);

    if (error) throw error;
  } catch (error) {
    console.error('Erro ao deletar professor no Supabase:', error);
    throw error;
  }
};
