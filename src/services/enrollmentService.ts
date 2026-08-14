import { supabase } from '../lib/supabaseClient';
import { subjectService } from './subjectService';

export interface EnrolledSubject {
  id: number;
  enrollment_id: number;
  name: string;
  description?: string;
  teacher_id?: string;
  teacher_name?: string;
  grade?: string;
  semester?: string;
  period?: string;
  color?: string;
  enrollment_date?: string;
}

export interface AvailableSubject {
  id: number;
  name: string;
  description?: string;
  teacher_id?: string;
  teacher_name?: string;
  grade?: string;
  semester?: string;
  period?: string;
  color?: string;
}

export const enrollmentService = {
  /**
   * Busca as disciplinas em que o estudante está matriculado
   */
  getStudentEnrolledSubjects: async (studentId: string): Promise<EnrolledSubject[]> => {
    try {
      // 1. Buscar registros de matrícula do aluno
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select('id, subject_id, enrollment_date')
        .eq('student_id', studentId);

      if (enrollError) throw enrollError;
      if (!enrollments || enrollments.length === 0) return [];

      // 2. Buscar dados de todas as disciplinas
      const allSubjects = await subjectService.getAll();
      const subjectsMap = new Map(allSubjects.map((s) => [Number(s.id), s]));

      // 3. Cruzar informações
      const result: EnrolledSubject[] = [];
      for (const enroll of enrollments) {
        const subject = subjectsMap.get(Number(enroll.subject_id));
        if (subject) {
          result.push({
            id: Number(subject.id),
            enrollment_id: Number(enroll.id),
            name: subject.name,
            description: subject.description,
            teacher_id: subject.teacher_id || undefined,
            teacher_name: subject.teacher_name,
            grade: subject.grade,
            semester: subject.semester,
            period: subject.period,
            color: subject.color,
            enrollment_date: enroll.enrollment_date,
          });
        }
      }

      return result.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error: any) {
      console.error('Erro ao buscar disciplinas matriculadas do estudante:', error);
      throw new Error(error.message || 'Falha ao buscar disciplinas matriculadas');
    }
  },

  /**
   * Busca as disciplinas disponíveis (que o estudante ainda não está matriculado)
   */
  getAvailableSubjects: async (studentId: string): Promise<AvailableSubject[]> => {
    try {
      // 1. Buscar matrículas atuais
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select('subject_id')
        .eq('student_id', studentId);

      if (enrollError) throw enrollError;

      const enrolledIds = new Set((enrollments || []).map((e: any) => Number(e.subject_id)));

      // 2. Buscar todas as disciplinas cadastradas
      const allSubjects = await subjectService.getAll();

      // 3. Filtrar somente as que o aluno ainda não possui matrícula
      const available = allSubjects
        .filter((s) => !enrolledIds.has(Number(s.id)))
        .map((s) => ({
          id: Number(s.id),
          name: s.name,
          description: s.description,
          teacher_id: s.teacher_id || undefined,
          teacher_name: s.teacher_name,
          grade: s.grade,
          semester: s.semester,
          period: s.period,
          color: s.color,
        }));

      return available.sort((a, b) => {
        // Ordenar por série e depois por nome
        if (a.grade && b.grade && a.grade !== b.grade) {
          return a.grade.localeCompare(b.grade);
        }
        return a.name.localeCompare(b.name);
      });
    } catch (error: any) {
      console.error('Erro ao buscar disciplinas disponíveis para o estudante:', error);
      throw new Error(error.message || 'Falha ao buscar disciplinas disponíveis');
    }
  },

  /**
   * Matricula o estudante em uma disciplina específica
   */
  enrollStudent: async (studentId: string, subjectId: number): Promise<void> => {
    try {
      const { error } = await supabase
        .from('enrollments')
        .insert({
          student_id: studentId,
          subject_id: subjectId,
          enrollment_date: new Date().toISOString(),
        });

      if (error) throw error;
    } catch (error: any) {
      console.error('Erro ao matricular estudante no Supabase:', error);
      throw new Error(error.message || 'Falha ao matricular estudante na disciplina');
    }
  },

  /**
   * Remove a matrícula do estudante em uma disciplina
   */
  unenrollStudent: async (studentId: string, subjectId: number): Promise<void> => {
    try {
      const { error } = await supabase
        .from('enrollments')
        .delete()
        .eq('student_id', studentId)
        .eq('subject_id', subjectId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Erro ao remover matrícula no Supabase:', error);
      throw new Error(error.message || 'Falha ao desmatricular estudante');
    }
  },

  /**
   * Matricula o estudante em lote em todas as disciplinas de uma série específica
   */
  enrollGradeSubjects: async (studentId: string, grade: string): Promise<number> => {
    try {
      // 1. Obter todas as disciplinas da série
      const allSubjects = await subjectService.getAll();
      const gradeSubjects = allSubjects.filter((s) => s.grade === grade);

      if (gradeSubjects.length === 0) return 0;

      // 2. Obter matrículas já existentes
      const { data: existingEnrolls, error: enrollError } = await supabase
        .from('enrollments')
        .select('subject_id')
        .eq('student_id', studentId);

      if (enrollError) throw enrollError;

      const enrolledIds = new Set((existingEnrolls || []).map((e: any) => Number(e.subject_id)));

      // 3. Montar novos inserts
      const toEnroll = gradeSubjects.filter((s) => !enrolledIds.has(Number(s.id)));
      if (toEnroll.length === 0) return 0;

      const inserts = toEnroll.map((s) => ({
        student_id: studentId,
        subject_id: Number(s.id),
        enrollment_date: new Date().toISOString(),
      }));

      const { error: insertError } = await supabase
        .from('enrollments')
        .insert(inserts);

      if (insertError) throw insertError;

      return inserts.length;
    } catch (error: any) {
      console.error('Erro ao matricular estudante nas disciplinas da série:', error);
      throw new Error(error.message || 'Falha ao matricular nas disciplinas da série');
    }
  },
};
