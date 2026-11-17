import { supabase } from '@/lib/supabaseClient';
import { awardForumSolution, FORUM_SOLUTION_POINTS } from './gamificationService';

export interface SubjectQuestion {
  id: string;
  subject_id: number;
  lesson_id: string | null;
  lesson_title: string | null;
  author_id: string;
  author_name?: string;
  author_role?: string;
  title: string;
  content: string;
  is_resolved: boolean;
  accepted_answer_id: string | null;
  answers_count?: number;
  created_at: string;
  updated_at: string;
}

export interface SubjectQuestionAnswer {
  id: string;
  question_id: string;
  author_id: string;
  author_name?: string;
  author_role?: string;
  content: string;
  is_solution: boolean;
  is_teacher_answer: boolean;
  points_awarded: number;
  created_at: string;
  updated_at: string;
}

async function fetchProfilesMap(userIds: string[]): Promise<Record<string, { full_name?: string; role?: string }>> {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  if (uniqueIds.length === 0) return {};

  const [{ data: profilesData }, { data: rolesData }] = await Promise.all([
    supabase.from('profiles').select('id, full_name').in('id', uniqueIds),
    supabase.from('user_roles').select('user_id, role').in('user_id', uniqueIds),
  ]);

  const roleMap: Record<string, string> = {};
  (rolesData || []).forEach((r: any) => {
    if (r.user_id && r.role) {
      roleMap[r.user_id] = r.role;
    }
  });

  const result: Record<string, { full_name?: string; role?: string }> = {};
  (profilesData || []).forEach((p: any) => {
    result[p.id] = {
      full_name: p.full_name,
      role: roleMap[p.id] || 'student',
    };
  });

  return result;
}

export const subjectQaService = {
  async getQuestionsBySubject(
    subjectId: number | string,
    lessonId?: string
  ): Promise<SubjectQuestion[]> {
    const numId = Number(subjectId);
    if (Number.isNaN(numId)) return [];

    let query = supabase
      .from('subject_questions')
      .select(`
        *,
        subject_question_answers ( id )
      `)
      .eq('subject_id', numId)
      .order('is_resolved', { ascending: true })
      .order('created_at', { ascending: false });

    if (lessonId && lessonId !== 'all') {
      query = query.eq('lesson_id', lessonId);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(error.message || 'Erro ao carregar dúvidas da disciplina.');
    }

    const rows = data || [];
    const profilesMap = await fetchProfilesMap(rows.map((r: any) => r.author_id));

    return rows.map((r: any) => ({
      id: r.id,
      subject_id: Number(r.subject_id),
      lesson_id: r.lesson_id,
      lesson_title: r.lesson_title,
      author_id: r.author_id,
      author_name: profilesMap[r.author_id]?.full_name || 'Usuário',
      author_role: profilesMap[r.author_id]?.role || 'student',
      title: r.title,
      content: r.content,
      is_resolved: Boolean(r.is_resolved),
      accepted_answer_id: r.accepted_answer_id,
      answers_count: Array.isArray(r.subject_question_answers)
        ? r.subject_question_answers.length
        : 0,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
  },

  async getAnswersByQuestion(questionId: string): Promise<SubjectQuestionAnswer[]> {
    const { data, error } = await supabase
      .from('subject_question_answers')
      .select('*')
      .eq('question_id', questionId)
      .order('is_solution', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(error.message || 'Erro ao carregar respostas.');
    }

    const rows = data || [];
    const profilesMap = await fetchProfilesMap(rows.map((r: any) => r.author_id));

    return rows.map((r: any) => ({
      id: r.id,
      question_id: r.question_id,
      author_id: r.author_id,
      author_name: profilesMap[r.author_id]?.full_name || 'Usuário',
      author_role: profilesMap[r.author_id]?.role || 'student',
      content: r.content,
      is_solution: Boolean(r.is_solution),
      is_teacher_answer: Boolean(r.is_teacher_answer),
      points_awarded: Number(r.points_awarded || 0),
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
  },

  async createQuestion(input: {
    subjectId: number | string;
    authorId: string;
    title: string;
    content: string;
    lessonId?: string | null;
    lessonTitle?: string | null;
  }): Promise<SubjectQuestion> {
    const { data, error } = await supabase
      .from('subject_questions')
      .insert({
        subject_id: Number(input.subjectId),
        author_id: input.authorId,
        title: input.title.trim(),
        content: input.content.trim(),
        lesson_id: input.lessonId || null,
        lesson_title: input.lessonTitle || null,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Erro ao publicar dúvida.');
    }

    return data as SubjectQuestion;
  },

  async createAnswer(input: {
    questionId: string;
    authorId: string;
    content: string;
    isTeacherAnswer?: boolean;
  }): Promise<SubjectQuestionAnswer> {
    const { data, error } = await supabase
      .from('subject_question_answers')
      .insert({
        question_id: input.questionId,
        author_id: input.authorId,
        content: input.content.trim(),
        is_teacher_answer: Boolean(input.isTeacherAnswer),
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Erro ao enviar resposta.');
    }

    return data as SubjectQuestionAnswer;
  },

  /**
   * Marca uma resposta como Solução oficial da dúvida.
   * Se a resposta for de um colega (aluno diferente do autor da dúvida), concede +15 pontos na gamificação.
   */
  async markAnswerAsSolution(
    question: SubjectQuestion,
    answer: SubjectQuestionAnswer
  ): Promise<{ pointsAwarded: number }> {
    // 1. Desmarcar qualquer outra solução anterior nessa pergunta
    await supabase
      .from('subject_question_answers')
      .update({ is_solution: false, updated_at: new Date().toISOString() })
      .eq('question_id', question.id);

    const shouldAwardStudent =
      !answer.is_teacher_answer &&
      answer.author_role !== 'teacher' &&
      answer.author_role !== 'admin' &&
      answer.author_id !== question.author_id;

    let pointsAwarded = 0;

    if (shouldAwardStudent) {
      const awardRes = await awardForumSolution(
        answer.author_id,
        answer.id,
        FORUM_SOLUTION_POINTS,
        question.subject_id
      );
      pointsAwarded = awardRes?.awarded ?? 0;
    }

    // 2. Marcar esta resposta como solução
    const { error: ansError } = await supabase
      .from('subject_question_answers')
      .update({
        is_solution: true,
        points_awarded: pointsAwarded > 0 ? pointsAwarded : answer.points_awarded,
        updated_at: new Date().toISOString(),
      })
      .eq('id', answer.id);

    if (ansError) {
      throw new Error(ansError.message || 'Erro ao marcar resposta como solução.');
    }

    // 3. Atualizar pergunta como resolvida
    const { error: qError } = await supabase
      .from('subject_questions')
      .update({
        is_resolved: true,
        accepted_answer_id: answer.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', question.id);

    if (qError) {
      throw new Error(qError.message || 'Erro ao atualizar status da dúvida.');
    }

    return { pointsAwarded };
  },

  async deleteQuestion(questionId: string): Promise<void> {
    const { error } = await supabase
      .from('subject_questions')
      .delete()
      .eq('id', questionId);

    if (error) {
      throw new Error(error.message || 'Erro ao excluir dúvida.');
    }
  },

  async deleteAnswer(answerId: string): Promise<void> {
    const { error } = await supabase
      .from('subject_question_answers')
      .delete()
      .eq('id', answerId);

    if (error) {
      throw new Error(error.message || 'Erro ao excluir resposta.');
    }
  },
};

export default subjectQaService;
