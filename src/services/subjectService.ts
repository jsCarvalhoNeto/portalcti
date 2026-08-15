import { supabase } from '../lib/supabaseClient';
import { Subject, SubjectTeacher } from '@/types/subject';

export interface CreateSubjectData {
  name: string;
  description?: string;
  teacher_id?: string | null;
  teacher_ids?: string[];
  schedule?: string;
  max_students?: number;
  grade?: '1º Ano' | '2º Ano' | '3º Ano';
  workload_hours?: number;
  semester?: string;
  period?: string;
  periods?: string[];
  year?: number; // Ano letivo da disciplina
  color?: string; // Cor hexadecimal para o card da disciplina (ex: #3B82F6)
}

export interface UpdateSubjectData {
  name?: string;
  description?: string;
  teacher_id?: string | null;
  teacher_ids?: string[];
  schedule?: string;
  max_students?: number;
  grade?: '1º Ano' | '2º Ano' | '3º Ano';
  workload_hours?: number;
  semester?: string;
  period?: string;
  periods?: string[];
  year?: number; // Ano letivo da disciplina
  color?: string; // Cor hexadecimal para o card da disciplina (ex: #3B82F6)
}

/**
 * Função auxiliar para buscar os professores associados a uma lista de IDs de disciplinas
 */
async function fetchTeachersForSubjects(subjectIds: number[]): Promise<Map<number, SubjectTeacher[]>> {
  const teachersBySubject = new Map<number, SubjectTeacher[]>();
  if (subjectIds.length === 0) return teachersBySubject;

  try {
    const { data: assignments, error } = await supabase
      .from('teacher_subjects')
      .select(`
        subject_id,
        teacher_id,
        profiles!inner(
          id,
          full_name,
          email
        )
      `)
      .in('subject_id', subjectIds);

    if (!error && assignments) {
      for (const item of assignments as any[]) {
        const sId = Number(item.subject_id);
        const profile = item.profiles;
        if (profile) {
          const list = teachersBySubject.get(sId) || [];
          // Evitar duplicados
          if (!list.some(t => t.id === profile.id)) {
            list.push({
              id: profile.id,
              full_name: profile.full_name,
              email: profile.email,
            });
          }
          teachersBySubject.set(sId, list);
        }
      }
    }
  } catch (err) {
    console.warn('Erro ao carregar professores de teacher_subjects:', err);
  }

  return teachersBySubject;
}

export const subjectService = {
  // Criar nova disciplina (0 ou N professores)
  create: async (subjectData: CreateSubjectData): Promise<Subject> => {
    try {
      const periodsArray = subjectData.periods && subjectData.periods.length > 0
        ? subjectData.periods
        : (subjectData.period ? [subjectData.period] : []);
      const periodString = subjectData.period || (periodsArray.length > 0 ? periodsArray.join(', ') : null);

      // Determinar professor principal (compatibilidade com coluna teacher_id)
      const primaryTeacherId = subjectData.teacher_ids && subjectData.teacher_ids.length > 0
        ? subjectData.teacher_ids[0]
        : (subjectData.teacher_id || null);

      const { data: newSubject, error } = await supabase
        .from('subjects')
        .insert({
          name: subjectData.name,
          description: subjectData.description || null,
          teacher_id: primaryTeacherId,
          schedule: subjectData.schedule || null,
          max_students: subjectData.max_students || 50,
          grade: subjectData.grade || null,
          workload_hours: subjectData.workload_hours !== undefined ? subjectData.workload_hours : 100,
          semester: subjectData.semester || null,
          period: periodString,
          periods: periodsArray,
          year: subjectData.year || new Date().getFullYear(),
          color: subjectData.color || '#4F46E5'
        })
        .select()
        .single();

      if (error) throw error;

      const subjectId = Number(newSubject.id);

      // Salvar múltiplos professores na tabela teacher_subjects
      const teacherIdsToInsert = Array.from(new Set(
        (subjectData.teacher_ids || (subjectData.teacher_id ? [subjectData.teacher_id] : [])).filter(Boolean)
      ));

      if (teacherIdsToInsert.length > 0) {
        const assignments = teacherIdsToInsert.map(tId => ({
          subject_id: subjectId,
          teacher_id: tId,
          assigned_at: new Date().toISOString()
        }));

        await supabase
          .from('teacher_subjects')
          .insert(assignments);
      }

      return await subjectService.getById(String(subjectId));
    } catch (error: any) {
      console.error('Erro ao criar disciplina no Supabase:', error);
      throw new Error(error.message || 'Erro ao criar disciplina');
    }
  },

  // Buscar todas as disciplinas com seus professores
  getAll: async (): Promise<Subject[]> => {
    try {
      const { data: subjectsData, error } = await supabase
        .from('subjects')
        .select('*, teacher:teacher_id(id, full_name, email)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!subjectsData || subjectsData.length === 0) return [];

      const subjectIds = subjectsData.map((s: any) => Number(s.id));
      const teachersMap = await fetchTeachersForSubjects(subjectIds);

      return subjectsData.map((item: any) => {
        const sId = Number(item.id);
        const assignedTeachers = teachersMap.get(sId) || [];

        // Incluir o professor do teacher_id se não estiver na lista de teacher_subjects
        if (item.teacher && !assignedTeachers.some(t => t.id === item.teacher.id)) {
          assignedTeachers.unshift({
            id: item.teacher.id,
            full_name: item.teacher.full_name,
            email: item.teacher.email
          });
        }

        const teacherNames = assignedTeachers.map(t => t.full_name).filter(Boolean);
        const teacherNameStr = teacherNames.length > 0 ? teacherNames.join(', ') : undefined;

        return {
          ...item,
          id: sId,
          teachers: assignedTeachers,
          teacher_ids: assignedTeachers.map(t => t.id),
          teacher_name: teacherNameStr,
        } as Subject;
      });
    } catch (error: any) {
      console.error('Erro ao buscar disciplinas no Supabase:', error);
      throw new Error(error.message || 'Erro ao buscar disciplinas');
    }
  },

  // Buscar disciplina por ID
  getById: async (id: string): Promise<Subject> => {
    try {
      const { data: subjectData, error } = await supabase
        .from('subjects')
        .select('*, teacher:teacher_id(id, full_name, email)')
        .eq('id', id)
        .single();

      if (error) throw error;

      const sId = Number(subjectData.id);
      const teachersMap = await fetchTeachersForSubjects([sId]);
      const assignedTeachers = teachersMap.get(sId) || [];

      if (subjectData.teacher && !assignedTeachers.some(t => t.id === subjectData.teacher.id)) {
        assignedTeachers.unshift({
          id: subjectData.teacher.id,
          full_name: subjectData.teacher.full_name,
          email: subjectData.teacher.email
        });
      }

      const teacherNames = assignedTeachers.map(t => t.full_name).filter(Boolean);

      return {
        ...subjectData,
        id: sId,
        teachers: assignedTeachers,
        teacher_ids: assignedTeachers.map(t => t.id),
        teacher_name: teacherNames.length > 0 ? teacherNames.join(', ') : undefined,
      } as Subject;
    } catch (error: any) {
      console.error('Erro ao buscar disciplina no Supabase:', error);
      throw new Error(error.message || 'Erro ao buscar disciplina');
    }
  },

  // Atualizar disciplina (atualiza 0 ou N professores)
  update: async (id: string, subjectData: UpdateSubjectData): Promise<Subject> => {
    try {
      const updatePayload: Record<string, any> = {};

      if (subjectData.name !== undefined) updatePayload.name = subjectData.name;
      if (subjectData.description !== undefined) updatePayload.description = subjectData.description;
      if (subjectData.schedule !== undefined) updatePayload.schedule = subjectData.schedule;
      if (subjectData.max_students !== undefined) updatePayload.max_students = subjectData.max_students;
      if (subjectData.grade !== undefined) updatePayload.grade = subjectData.grade;
      if (subjectData.workload_hours !== undefined) updatePayload.workload_hours = subjectData.workload_hours;
      if (subjectData.semester !== undefined) updatePayload.semester = subjectData.semester;
      if (subjectData.year !== undefined) updatePayload.year = subjectData.year;
      if (subjectData.color !== undefined) updatePayload.color = subjectData.color;

      if (subjectData.periods !== undefined) {
        updatePayload.periods = subjectData.periods;
        updatePayload.period = subjectData.periods.length > 0 ? subjectData.periods.join(', ') : null;
      } else if (subjectData.period !== undefined) {
        updatePayload.period = subjectData.period;
        updatePayload.periods = subjectData.period ? [subjectData.period] : [];
      }

      // Sincronizar teacher_id principal
      if (subjectData.teacher_ids !== undefined) {
        updatePayload.teacher_id = subjectData.teacher_ids.length > 0 ? subjectData.teacher_ids[0] : null;
      } else if (subjectData.teacher_id !== undefined) {
        updatePayload.teacher_id = subjectData.teacher_id || null;
      }

      const { error: updateError } = await supabase
        .from('subjects')
        .update(updatePayload)
        .eq('id', id);

      if (updateError) throw updateError;

      const numId = Number(id);

      // Sincronizar múltiplos professores em teacher_subjects se teacher_ids foi fornecido
      if (subjectData.teacher_ids !== undefined) {
        // Remover anteriores
        await supabase
          .from('teacher_subjects')
          .delete()
          .eq('subject_id', numId);

        const uniqueTeachers = Array.from(new Set(subjectData.teacher_ids.filter(Boolean)));
        if (uniqueTeachers.length > 0) {
          const assignments = uniqueTeachers.map(tId => ({
            subject_id: numId,
            teacher_id: tId,
            assigned_at: new Date().toISOString()
          }));

          await supabase
            .from('teacher_subjects')
            .insert(assignments);
        }
      }

      return await subjectService.getById(id);
    } catch (error: any) {
      console.error('Erro ao atualizar disciplina no Supabase:', error);
      throw new Error(error.message || 'Erro ao atualizar disciplina');
    }
  },

  // Deletar disciplina
  delete: async (id: string): Promise<void> => {
    try {
      const numId = Number(id);
      // Remover registros em teacher_subjects
      await supabase.from('teacher_subjects').delete().eq('subject_id', numId);
      // Remover registros em enrollments
      await supabase.from('enrollments').delete().eq('subject_id', numId);

      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error: any) {
      console.error('Erro ao deletar disciplina no Supabase:', error);
      throw new Error(error.message || 'Erro ao deletar disciplina');
    }
  },

  // Buscar disciplinas por professor (busca por teacher_id em subjects E por teacher_subjects)
  getByTeacher: async (teacherId: string): Promise<Subject[]> => {
    try {
      // 1. IDs da tabela teacher_subjects
      const { data: assigned } = await supabase
        .from('teacher_subjects')
        .select('subject_id')
        .eq('teacher_id', teacherId);

      const assignedSubjectIds = (assigned || []).map((a: any) => Number(a.subject_id));

      // 2. IDs da tabela subjects (teacher_id direto)
      const { data: directSubjects } = await supabase
        .from('subjects')
        .select('id')
        .eq('teacher_id', teacherId);

      const directSubjectIds = (directSubjects || []).map((s: any) => Number(s.id));

      const allIds = Array.from(new Set([...assignedSubjectIds, ...directSubjectIds]));
      if (allIds.length === 0) return [];

      const { data: subjectsData, error } = await supabase
        .from('subjects')
        .select('*, teacher:teacher_id(id, full_name, email)')
        .in('id', allIds)
        .order('name', { ascending: true });

      if (error) throw error;

      const teachersMap = await fetchTeachersForSubjects(allIds);

      return (subjectsData || []).map((item: any) => {
        const sId = Number(item.id);
        const assignedTeachers = teachersMap.get(sId) || [];

        if (item.teacher && !assignedTeachers.some(t => t.id === item.teacher.id)) {
          assignedTeachers.unshift({
            id: item.teacher.id,
            full_name: item.teacher.full_name,
            email: item.teacher.email
          });
        }

        const teacherNames = assignedTeachers.map(t => t.full_name).filter(Boolean);

        return {
          ...item,
          id: sId,
          teachers: assignedTeachers,
          teacher_ids: assignedTeachers.map(t => t.id),
          teacher_name: teacherNames.length > 0 ? teacherNames.join(', ') : undefined,
        } as Subject;
      });
    } catch (error: any) {
      console.error('Erro ao buscar disciplinas do professor no Supabase:', error);
      throw new Error(error.message || 'Erro ao buscar disciplinas do professor');
    }
  },

  // Buscar alunos por série (usando profiles de alunos)
  getStudentsByGrade: async (grade: '1º Ano' | '2º Ano' | '3º Ano'): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          student_registration,
          grade,
          user_roles!inner(role)
        `)
        .eq('grade', grade)
        .eq('user_roles.role', 'student');

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Erro ao buscar alunos por série no Supabase:', error);
      throw new Error(error.message || 'Erro ao buscar alunos por série');
    }
  }
};
