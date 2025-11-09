import apiService from './api';

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
  private baseUrl = '/daily-challenges';

  async getAllChallenges(): Promise<DailyChallenge[]> {
    const response = await apiService.get(this.baseUrl);
    return response.data || [];
  }

  async getChallengeById(id: number): Promise<DailyChallenge> {
    const response = await apiService.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async createChallenge(challenge: Omit<DailyChallenge, 'id' | 'created_at' | 'updated_at'>): Promise<DailyChallenge> {
    // Mapear campos do frontend para o formato esperado pelo backend
    const backendData = this.mapToBackendFormat(challenge);
    const response = await apiService.post(this.baseUrl, backendData);
    return response.data;
  }

  async updateChallenge(id: number, challenge: Partial<DailyChallenge>): Promise<DailyChallenge> {
    // Mapear campos do frontend para o formato esperado pelo backend
    const backendData = this.mapToBackendFormat(challenge);
    const response = await apiService.put(`${this.baseUrl}/${id}`, backendData);
    return response.data;
  }

  // Função auxiliar para mapear campos do frontend para o backend
  private mapToBackendFormat(frontendData: any): any {
    const backendData: any = {};
    
    // Mapear campos diretos
    if (frontendData.title !== undefined) backendData.title = frontendData.title;
    if (frontendData.description !== undefined) backendData.description = frontendData.description;
    if (frontendData.points !== undefined) backendData.points = frontendData.points;
    if (frontendData.subject_id !== undefined) backendData.subject_id = frontendData.subject_id;
    
    // Mapear content para html_content
    if (frontendData.content !== undefined) backendData.html_content = frontendData.content;
    
    // Mapear active_date para start_date e end_date
    if (frontendData.active_date !== undefined) {
      const activeDate = frontendData.active_date;
      backendData.start_date = activeDate;
      
      // Definir data de fim como 30 dias depois da data de início
      const endDate = new Date(activeDate);
      endDate.setDate(endDate.getDate() + 30);
      backendData.end_date = endDate.toISOString().split('T')[0];
    }
    
    return backendData;
  }

  async deleteChallenge(id: number): Promise<void> {
    await apiService.delete(`${this.baseUrl}/${id}`);
  }

  async getStats(): Promise<DailyChallengeStats> {
    try {
      const response = await apiService.get(`${this.baseUrl}/stats`);
      return response.data || {
        total: 0,
        active: 0,
        completed: 0,
        points_distributed: 0
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return {
        total: 0,
        active: 0,
        completed: 0,
        points_distributed: 0
      };
    }
  }

  async getChallengesBySubject(subjectId: number): Promise<DailyChallenge[]> {
    const response = await apiService.get(`${this.baseUrl}/subject/${subjectId}`);
    return response.data || [];
  }

  async getActiveChallenges(): Promise<DailyChallenge[]> {
    const response = await apiService.get(`${this.baseUrl}/active`);
    return response.data || [];
  }

  async duplicateChallenge(id: number): Promise<DailyChallenge> {
    const response = await apiService.post(`${this.baseUrl}/${id}/duplicate`);
    return response.data;
  }

  async toggleChallengeStatus(id: number): Promise<DailyChallenge> {
    const response = await apiService.patch(`${this.baseUrl}/${id}/toggle-status`);
    return response.data;
  }

  /**
   * Alterna o status ativo de um desafio (nova implementação)
   * @param id ID do desafio
   * @param isActive Novo status ativo (true para ativar, false para desativar)
   * @returns Desafio atualizado
   */
  async toggleChallengeActive(id: number, isActive: boolean): Promise<DailyChallenge> {
    console.log('🔄 Toggle Challenge Active:', { id, isActive });
    
    try {
      const response = await apiService.put(`${this.baseUrl}/${id}/toggle-active`, { isActive });
      console.log('✅ Toggle Response:', response);
      return response.data;
    } catch (error: any) {
      console.error('❌ Toggle Error:', error);
      
      // Melhorar a mensagem de erro
      if (error.response?.status === 403) {
        throw new Error('Você não tem permissão para alterar este desafio. Verifique se você é o professor responsável.');
      } else if (error.response?.status === 401) {
        throw new Error('Sessão expirada. Faça login novamente.');
      } else if (error.response?.status === 404) {
        throw new Error('Desafio não encontrado.');
      } else {
        throw new Error(error.response?.data?.error || 'Erro ao alterar status do desafio');
      }
    }
  }

  // Métodos para alunos
  async getStudentChallenges(): Promise<DailyChallenge[]> {
    console.log('🔍 DailyChallengeService: Chamando getStudentChallenges...');
    console.log('📞 DailyChallengeService: URL:', `${this.baseUrl}/student/available`);
    
    try {
      const response = await apiService.get(`${this.baseUrl}/student/available`);
      console.log('📊 DailyChallengeService: Response raw:', response);
      console.log('📊 DailyChallengeService: Response data:', response.data);
      
      const challenges = response.data || [];
      console.log(`✅ DailyChallengeService: ${challenges.length} desafios retornados`);
      
      return challenges;
    } catch (error) {
      console.error('❌ DailyChallengeService: Erro em getStudentChallenges:', error);
      throw error;
    }
  }

  async getTodayChallenge(): Promise<DailyChallenge | null> {
    console.log('🎯 DailyChallengeService: Chamando getTodayChallenge...');
    
    try {
      const challenges = await this.getStudentChallenges();
      console.log(`📊 DailyChallengeService: getStudentChallenges retornou ${challenges.length} desafios`);
      
      // Retorna o primeiro desafio disponível (mais recente)
      const todayChallenge = challenges.length > 0 ? challenges[0] : null;
      console.log('🎯 DailyChallengeService: Desafio do dia selecionado:', todayChallenge);
      
      return todayChallenge;
    } catch (error) {
      console.error('❌ DailyChallengeService: Erro ao buscar desafio do dia:', error);
      return null;
    }
  }

  async completeChallenge(challengeId: number): Promise<{ success: boolean; points: number }> {
    const response = await apiService.post(`${this.baseUrl}/${challengeId}/submit`);
    return {
      success: true,
      points: response.data?.points || 0
    };
  }
}

const dailyChallengeService = new DailyChallengeService();
export default dailyChallengeService;
