import { supabase } from '../lib/supabaseClient';

export interface DailyChallenge {
  id?: number;
  title: string;
  description?: string;
  content?: string; // Mantido para compatibilidade
  html_content: string; // Campo real do banco de dados
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  subject_id?: number;
  active_date: string;
  type: 'question' | 'exercise' | 'quiz' | 'reflection';
  created_at?: string;
  updated_at?: string;
  subject_name?: string;
  is_active?: boolean; // Novo campo para status ativo/inativo
  stats?: {
    total_attempts: number;
    completed: number;
    success_rate: number;
  };
}

export interface DailyChallengeStats {
  total: number;
  active: number;
  completed: number;
  points_distributed: number;
}

class DailyChallengeService {
  private tableName = 'daily_challenges';

  async getAllChallenges(): Promise<DailyChallenge[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao obter desafios no Supabase:', error);
      return [];
    }
    return data || [];
  }

  async getChallengeById(id: number): Promise<DailyChallenge> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async createChallenge(challenge: Omit<DailyChallenge, 'id' | 'created_at' | 'updated_at'>): Promise<DailyChallenge> {
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
    return data;
  }

  async updateChallenge(id: number, challenge: Partial<DailyChallenge>): Promise<DailyChallenge> {
    const backendData = this.mapToBackendFormat(challenge);
    const { data, error } = await supabase
      .from(this.tableName)
      .update(backendData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
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
    return data || [];
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
    return data || [];
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
      return data;
    } catch (error: any) {
      console.error('Erro ao alternar status ativo no Supabase:', error);
      throw new Error(error.message || 'Erro ao alterar status do desafio');
    }
  }

  // Métodos para alunos
  async getStudentChallenges(): Promise<DailyChallenge[]> {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
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

  async completeChallenge(challengeId: number): Promise<{ success: boolean; points: number }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const challenge = await this.getChallengeById(challengeId);

      // 1. Inserir a submissão
      const { error: subError } = await supabase
        .from('daily_challenge_submissions')
        .insert({
          challenge_id: challengeId,
          student_id: user.id,
          points_awarded: challenge.points,
          is_within_deadline: true
        });

      if (subError) throw subError;

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
      throw new Error(error.message || 'Erro ao enviar o desafio.');
    }
  }
}

const dailyChallengeService = new DailyChallengeService();
export default dailyChallengeService;
