import { supabase } from '../lib/supabaseClient';

export interface DailyChallengeSubmissionInfo {
  id: number;
  student_id: string;
  student_name: string;
  student_email?: string;
  student_grade?: string;
  submitted_at: string;
  points_awarded: number;
  is_within_deadline?: boolean;
  student_answer?: string;
}

export interface DailyChallenge {
  id?: number;
  title: string;
  description?: string;
  content?: string; // Mantido para compatibilidade
  html_content: string; // Campo real do banco de dados
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  subject_id?: number;
  active_date?: string;
  start_date?: string;
  end_date?: string;
  type: 'question' | 'exercise' | 'quiz' | 'reflection';
  created_at?: string;
  updated_at?: string;
  subject_name?: string;
  is_active?: boolean; // Novo campo para status ativo/inativo
  requires_validation?: boolean; // Se exige chave ou resposta
  correct_answer?: string; // Chave secreta ou resposta correta esperada
  is_completed?: boolean; // Se o aluno logado já completou
  completed_at?: string; // Data da conclusão pelo aluno
  stats?: {
    total_attempts: number;
    completed: number;
    success_rate: number;
  };
  submissions?: DailyChallengeSubmissionInfo[];
}

export interface DailyChallengeStats {
  total: number;
  active: number;
  completed: number;
  points_distributed: number;
}

export type CreateChallengeData = Omit<DailyChallenge, 'id' | 'created_at' | 'updated_at'>;
export type UpdateChallengeData = Partial<DailyChallenge>;

class DailyChallengeService {
  private tableName = 'daily_challenges';

  private mapFromBackend(item: any): DailyChallenge {
    if (!item) return item;
    const activeDate = item.start_date || item.active_date || item.created_at || new Date().toISOString();
    return {
      ...item,
      active_date: activeDate,
      start_date: item.start_date || activeDate,
      content: item.html_content || item.content || ''
    };
  }

  private async getSubjectMap(): Promise<Map<string | number, string>> {
    const map = new Map<string | number, string>();
    try {
      const { data } = await supabase.from('subjects').select('id, name');
      if (data) {
        data.forEach((s: any) => {
          map.set(s.id, s.name);
          map.set(String(s.id), s.name);
          if (!isNaN(Number(s.id))) {
            map.set(Number(s.id), s.name);
          }
        });
      }
    } catch (err) {
      console.warn('Erro ao carregar mapa de disciplinas:', err);
    }
    return map;
  }

  async getAllChallenges(): Promise<DailyChallenge[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao obter desafios no Supabase:', error);
      return [];
    }

    if (!data || data.length === 0) return [];

    const challengeIds = data.map(item => item.id).filter(Boolean);

    // Buscar mapa de disciplinas
    const subjectMapPromise = this.getSubjectMap();

    // Buscar todas as submissões dos desafios
    let submissionsMap = new Map<number, DailyChallengeSubmissionInfo[]>();
    try {
      const { data: submissions, error: subError } = await supabase
        .from('daily_challenge_submissions')
        .select('*')
        .in('challenge_id', challengeIds)
        .order('submitted_at', { ascending: false });

      if (!subError && submissions && submissions.length > 0) {
        const studentIds = Array.from(new Set(submissions.map(s => s.student_id).filter(Boolean)));
        let profileMap = new Map<string, { full_name?: string; email?: string; grade?: string }>();
        
        if (studentIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, email, grade')
            .in('id', studentIds);

          (profiles || []).forEach(p => profileMap.set(p.id, p));
        }

        submissions.forEach(sub => {
          const prof = profileMap.get(sub.student_id);
          const subInfo: DailyChallengeSubmissionInfo = {
            id: sub.id,
            student_id: sub.student_id,
            student_name: prof?.full_name || 'Aluno',
            student_email: prof?.email,
            student_grade: prof?.grade,
            submitted_at: sub.submitted_at || sub.created_at,
            points_awarded: sub.points_awarded || 0,
            is_within_deadline: sub.is_within_deadline,
            student_answer: sub.student_answer
          };

          const list = submissionsMap.get(sub.challenge_id) || [];
          list.push(subInfo);
          submissionsMap.set(sub.challenge_id, list);
        });
      }
    } catch (e) {
      console.error('Erro ao carregar estatísticas de submissões:', e);
    }

    const subjectMap = await subjectMapPromise;

    return (data || []).map(item => {
      const mapped = this.mapFromBackend(item);
      const challengeSubs = submissionsMap.get(item.id) || [];
      const totalAttempts = challengeSubs.length;

      if (item.subject_id) {
        mapped.subject_name = subjectMap.get(item.subject_id) || item.subject_name;
      }

      mapped.stats = {
        total_attempts: totalAttempts,
        completed: totalAttempts,
        success_rate: totalAttempts > 0 ? 100 : 0
      };
      mapped.submissions = challengeSubs;

      return mapped;
    });
  }

  async getChallengeById(id: number): Promise<DailyChallenge> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    const mapped = this.mapFromBackend(data);

    if (data.subject_id) {
      try {
        const { data: sub } = await supabase
          .from('subjects')
          .select('name')
          .eq('id', data.subject_id)
          .maybeSingle();
        if (sub) {
          mapped.subject_name = sub.name;
        }
      } catch (err) {
        console.warn('Erro ao buscar disciplina do desafio por id:', err);
      }
    }

    try {
      const { data: submissions } = await supabase
        .from('daily_challenge_submissions')
        .select('*')
        .eq('challenge_id', id)
        .order('submitted_at', { ascending: false });

      if (submissions && submissions.length > 0) {
        const studentIds = Array.from(new Set(submissions.map(s => s.student_id).filter(Boolean)));
        let profileMap = new Map<string, { full_name?: string; email?: string; grade?: string }>();

        if (studentIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, email, grade')
            .in('id', studentIds);

          (profiles || []).forEach(p => profileMap.set(p.id, p));
        }

        const subsList: DailyChallengeSubmissionInfo[] = submissions.map(sub => {
          const prof = profileMap.get(sub.student_id);
          return {
            id: sub.id,
            student_id: sub.student_id,
            student_name: prof?.full_name || 'Aluno',
            student_email: prof?.email,
            student_grade: prof?.grade,
            submitted_at: sub.submitted_at || sub.created_at,
            points_awarded: sub.points_awarded || 0,
            is_within_deadline: sub.is_within_deadline,
            student_answer: sub.student_answer
          };
        });

        mapped.stats = {
          total_attempts: subsList.length,
          completed: subsList.length,
          success_rate: subsList.length > 0 ? 100 : 0
        };
        mapped.submissions = subsList;
      } else {
        mapped.stats = {
          total_attempts: 0,
          completed: 0,
          success_rate: 0
        };
        mapped.submissions = [];
      }
    } catch (e) {
      console.error('Erro ao buscar submissões do desafio por id:', e);
    }

    return mapped;
  }

  async createChallenge(challenge: CreateChallengeData): Promise<DailyChallenge> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const backendData = this.mapToBackendFormat(challenge);
    const { data, error } = await supabase
      .from(this.tableName)
      .insert({
        ...backendData,
        teacher_id: user.id,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;
    
    let subjectName = challenge.subject_name;
    if (data.subject_id && !subjectName) {
      const { data: sub } = await supabase.from('subjects').select('name').eq('id', data.subject_id).maybeSingle();
      if (sub) subjectName = sub.name;
    }

    return {
      ...this.mapFromBackend(data),
      subject_name: subjectName
    };
  }

  async updateChallenge(id: number, challenge: UpdateChallengeData): Promise<DailyChallenge> {
    const backendData = this.mapToBackendFormat(challenge);
    const { data, error } = await supabase
      .from(this.tableName)
      .update(backendData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    let subjectName = challenge.subject_name;
    if (data.subject_id && !subjectName) {
      const { data: sub } = await supabase.from('subjects').select('name').eq('id', data.subject_id).maybeSingle();
      if (sub) subjectName = sub.name;
    }

    return {
      ...this.mapFromBackend(data),
      subject_name: subjectName
    };
  }

  // Função auxiliar para mapear campos do frontend para o backend
  private mapToBackendFormat(frontendData: any): any {
    const backendData: any = {};
    
    if (frontendData.title !== undefined) backendData.title = frontendData.title;
    if (frontendData.description !== undefined) backendData.description = frontendData.description;
    if (frontendData.points !== undefined) backendData.points = frontendData.points;
    if (frontendData.subject_id !== undefined) backendData.subject_id = frontendData.subject_id;
    if (frontendData.content !== undefined) backendData.html_content = frontendData.content;
    if (frontendData.html_content !== undefined) backendData.html_content = frontendData.html_content;
    if (frontendData.type !== undefined) backendData.type = frontendData.type;
    if (frontendData.difficulty !== undefined) backendData.difficulty = frontendData.difficulty;
    if (frontendData.is_active !== undefined) backendData.is_active = frontendData.is_active;
    if (frontendData.requires_validation !== undefined) backendData.requires_validation = frontendData.requires_validation;
    if (frontendData.correct_answer !== undefined) backendData.correct_answer = frontendData.correct_answer;
    
    if (frontendData.active_date !== undefined) {
      const activeDate = frontendData.active_date;
      backendData.start_date = activeDate;
      
      const endDate = new Date(activeDate);
      endDate.setDate(endDate.getDate() + 30);
      backendData.end_date = endDate.toISOString().split('T')[0];
    }
    
    return backendData;
  }

  async deleteChallenge(id: number): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getStats(): Promise<DailyChallengeStats> {
    try {
      const { count: total } = await supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });

      const { count: active } = await supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const { data: submissions, error } = await supabase
        .from('daily_challenge_submissions')
        .select('points_awarded');

      if (error) throw error;

      const points_distributed = (submissions || []).reduce((sum, s) => sum + s.points_awarded, 0);

      return {
        total: total || 0,
        active: active || 0,
        completed: submissions?.length || 0,
        points_distributed
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas no Supabase:', error);
      return {
        total: 0,
        active: 0,
        completed: 0,
        points_distributed: 0
      };
    }
  }

  async getChallengesBySubject(subjectId: number): Promise<DailyChallenge[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('subject_id', subjectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar desafios por matéria:', error);
      return [];
    }

    const subjectMap = await this.getSubjectMap();
    return (data || []).map(item => {
      const mapped = this.mapFromBackend(item);
      if (item.subject_id) {
        mapped.subject_name = subjectMap.get(item.subject_id) || item.subject_name;
      }
      return mapped;
    });
  }

  async getActiveChallenges(): Promise<DailyChallenge[]> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('is_active', true)
      .lte('start_date', now)
      .gte('end_date', now)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar desafios ativos:', error);
      return [];
    }

    const subjectMap = await this.getSubjectMap();
    return (data || []).map(item => {
      const mapped = this.mapFromBackend(item);
      if (item.subject_id) {
        mapped.subject_name = subjectMap.get(item.subject_id) || item.subject_name;
      }
      return mapped;
    });
  }

  async duplicateChallenge(id: number): Promise<DailyChallenge> {
    const challenge = await this.getChallengeById(id);
    const { id: _, created_at: __, updated_at: ___, ...challengeData } = challenge as any;
    
    return await this.createChallenge({
      ...challengeData,
      title: `${challengeData.title} (Cópia)`
    });
  }

  async toggleChallengeStatus(id: number): Promise<DailyChallenge> {
    const challenge = await this.getChallengeById(id);
    const newStatus = !challenge.is_active;
    
    return await this.updateChallenge(id, { is_active: newStatus });
  }

  async toggleChallengeActive(id: number, isActive: boolean): Promise<DailyChallenge> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      let subjectName = data.subject_name;
      if (data.subject_id && !subjectName) {
        const { data: sub } = await supabase.from('subjects').select('name').eq('id', data.subject_id).maybeSingle();
        if (sub) subjectName = sub.name;
      }

      return {
        ...this.mapFromBackend(data),
        subject_name: subjectName
      };
    } catch (error: any) {
      console.error('Erro ao alternar status ativo no Supabase:', error);
      throw new Error(error.message || 'Erro ao alterar status do desafio');
    }
  }

  // Métodos para alunos
  async getStudentChallenges(): Promise<DailyChallenge[]> {
    try {
      const now = new Date().toISOString();
      const [challengesResult, subjectMap] = await Promise.all([
        supabase
          .from(this.tableName)
          .select('*')
          .eq('is_active', true)
          .lte('start_date', now)
          .gte('end_date', now)
          .order('created_at', { ascending: false }),
        this.getSubjectMap()
      ]);

      const { data: challenges, error } = challengesResult;

      if (error) throw error;
      if (!challenges || challenges.length === 0) return [];

      // Verificar submissões do usuário logado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return challenges.map(c => {
          const mapped = this.mapFromBackend(c);
          if (c.subject_id) {
            mapped.subject_name = subjectMap.get(c.subject_id) || c.subject_name;
          }
          return mapped;
        });
      }

      const challengeIds = challenges.map(c => c.id);
      const { data: submissions } = await supabase
        .from('daily_challenge_submissions')
        .select('challenge_id, created_at, submitted_at')
        .eq('student_id', user.id)
        .in('challenge_id', challengeIds);

      const completedMap = new Map<number, any>();
      (submissions || []).forEach(s => {
        completedMap.set(s.challenge_id, s);
      });

      return challenges.map(c => {
        const sub = completedMap.get(c.id);
        const mapped = this.mapFromBackend(c);
        if (c.subject_id) {
          mapped.subject_name = subjectMap.get(c.subject_id) || c.subject_name;
        }
        return {
          ...mapped,
          is_completed: Boolean(sub),
          completed_at: sub?.submitted_at || sub?.created_at
        };
      });
    } catch (error) {
      console.error('Erro ao buscar desafios do estudante no Supabase:', error);
      throw error;
    }
  }

  async getTodayChallenge(): Promise<DailyChallenge | null> {
    try {
      const challenges = await this.getStudentChallenges();
      return challenges.length > 0 ? challenges[0] : null;
    } catch (error) {
      console.error('Erro ao buscar desafio do dia no Supabase:', error);
      return null;
    }
  }

  async completeChallenge(challengeId: number, answer?: string): Promise<{ success: boolean; points: number }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      // 0. Verificar se o aluno já concluiu este desafio anteriormente
      const { data: existingSubmission } = await supabase
        .from('daily_challenge_submissions')
        .select('id')
        .eq('challenge_id', challengeId)
        .eq('student_id', user.id)
        .maybeSingle();

      if (existingSubmission) {
        throw new Error('Você já concluiu este desafio e garantiu seus pontos!');
      }

      const challenge = await this.getChallengeById(challengeId);

      // Validação de chave secreta ou resposta, caso o desafio exija
      const expectedAnswer = challenge.correct_answer?.trim();
      const requiresValidation = challenge.requires_validation || (expectedAnswer && expectedAnswer.length > 0);

      if (requiresValidation) {
        const studentAnswer = (answer || '').trim();
        if (!studentAnswer) {
          throw new Error('Por favor, digite a resposta ou a palavra-chave para validar sua pontuação.');
        }

        // Comparação insensível a maiúsculas/minúsculas e espaços extras
        const isMatch = studentAnswer.toLowerCase() === (expectedAnswer || '').toLowerCase();
        if (!isMatch) {
          throw new Error('A resposta ou palavra-chave informada não confere com o resultado esperado. Revise a atividade e tente novamente!');
        }
      }

      // 1. Inserir a submissão
      const { error: subError } = await supabase
        .from('daily_challenge_submissions')
        .insert({
          challenge_id: challengeId,
          student_id: user.id,
          points_awarded: challenge.points,
          is_within_deadline: true,
          student_answer: answer || null
        });

      if (subError) {
        if (subError.code === '23505' || subError.message?.includes('unique_student_challenge')) {
          throw new Error('Você já concluiu este desafio e garantiu seus pontos!');
        }
        throw subError;
      }

      // 2. Inserir pontos em gamification_points para alimentar a trigger de totalizadores
      const { error: pointsError } = await supabase
        .from('gamification_points')
        .insert({
          user_id: user.id,
          source: 'daily_challenge',
          source_id: challengeId.toString(),
          points: challenge.points
        });

      if (pointsError) throw pointsError;

      return {
        success: true,
        points: challenge.points
      };
    } catch (error: any) {
      console.error('Erro ao completar desafio no Supabase:', error);
      if (error.message?.includes('unique_student_challenge') || error.code === '23505') {
        throw new Error('Você já concluiu este desafio e garantiu seus pontos!');
      }
      throw new Error(error.message || 'Erro ao enviar o desafio.');
    }
  }
}

const dailyChallengeService = new DailyChallengeService();
export default dailyChallengeService;
