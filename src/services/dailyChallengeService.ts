import api from './api';

export interface DailyChallenge {
  id: number;
  title: string;
  description?: string;
  html_content: string;
  points: number;
  start_date: string;
  end_date: string;
  teacher_id: number;
  subject_id?: number;
  subject_name?: string;
  teacher_name?: string;
  status: 'upcoming' | 'active' | 'expired';
  total_submissions?: number;
  created_at: string;
  updated_at: string;
}

export interface DailyChallengeSubmission {
  id: number;
  challenge_id: number;
  student_id: number;
  submitted_at: string;
  points_awarded: number;
  is_within_deadline: boolean;
  student_name?: string;
  student_grade?: string;
}

export interface DailyChallengeStats {
  challenge: {
    id: number;
    title: string;
    points: number;
  };
  submissions: DailyChallengeSubmission[];
  stats: {
    total_submissions: number;
    on_time_submissions: number;
    late_submissions: number;
    avg_points_awarded: number;
  };
}

export interface CreateChallengeData {
  title: string;
  description?: string;
  html_content: string;
  points: number;
  start_date: string;
  end_date: string;
  subject_id?: number;
}

export interface UpdateChallengeData {
  title?: string;
  description?: string;
  html_content?: string;
  points?: number;
  start_date?: string;
  end_date?: string;
  subject_id?: number;
}

class DailyChallengeService {
  /**
   * Busca todos os desafios
   */
  async getAllChallenges(): Promise<DailyChallenge[]> {
    try {
      const response = await api.get('/daily-challenges');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar desafios:', error);
      throw error;
    }
  }

  /**
   * Busca um desafio por ID
   */
  async getChallengeById(id: number): Promise<DailyChallenge> {
    try {
      const response = await api.get(`/daily-challenges/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar desafio:', error);
      throw error;
    }
  }

  /**
   * Busca desafios de um professor específico
   */
  async getChallengesByTeacher(teacherId: number): Promise<DailyChallenge[]> {
    try {
      const response = await api.get(`/daily-challenges/teacher/${teacherId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar desafios do professor:', error);
      throw error;
    }
  }

  /**
   * Busca desafios de uma disciplina específica
   */
  async getChallengesBySubject(subjectId: number): Promise<DailyChallenge[]> {
    try {
      const response = await api.get(`/daily-challenges/subject/${subjectId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar desafios da disciplina:', error);
      throw error;
    }
  }

  /**
   * Busca desafios disponíveis para o aluno autenticado
   */
  async getAvailableChallengesForStudent(): Promise<DailyChallenge[]> {
    try {
      const response = await api.get('/daily-challenges/student/available');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar desafios disponíveis:', error);
      throw error;
    }
  }

  /**
   * Cria um novo desafio
   */
  async createChallenge(data: CreateChallengeData): Promise<{ message: string; challenge: DailyChallenge }> {
    try {
      const response = await api.post('/daily-challenges', data);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar desafio:', error);
      throw error;
    }
  }

  /**
   * Atualiza um desafio existente
   */
  async updateChallenge(id: number, data: UpdateChallengeData): Promise<{ message: string; challenge: DailyChallenge }> {
    try {
      const response = await api.put(`/daily-challenges/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar desafio:', error);
      throw error;
    }
  }

  /**
   * Remove um desafio (soft delete)
   */
  async deleteChallenge(id: number): Promise<{ message: string }> {
    try {
      const response = await api.delete(`/daily-challenges/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao remover desafio:', error);
      throw error;
    }
  }

  /**
   * Aluno submete um desafio
   */
  async submitChallenge(challengeId: number): Promise<{ message: string; submission: DailyChallengeSubmission }> {
    try {
      const response = await api.post(`/daily-challenges/${challengeId}/submit`);
      return response.data;
    } catch (error) {
      console.error('Erro ao submeter desafio:', error);
      throw error;
    }
  }

  /**
   * Busca submissões de um desafio (professor)
   */
  async getChallengeSubmissions(challengeId: number): Promise<DailyChallengeStats> {
    try {
      const response = await api.get(`/daily-challenges/${challengeId}/submissions`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar submissões do desafio:', error);
      throw error;
    }
  }

  /**
   * Busca submissões do aluno autenticado
   */
  async getStudentSubmissions(): Promise<DailyChallengeSubmission[]> {
    try {
      const response = await api.get('/daily-challenges/student/submissions');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar submissões do aluno:', error);
      throw error;
    }
  }

  /**
   * Busca ranking de alunos por pontos
   */
  async getStudentRanking(limit: number = 10): Promise<Array<{
    student_id: number;
    student_name: string;
    student_grade?: string;
    total_points: number;
    challenges_completed: number;
    challenges_on_time: number;
  }>> {
    try {
      const response = await api.get(`/daily-challenges/ranking?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar ranking de alunos:', error);
      throw error;
    }
  }
}

export const dailyChallengeService = new DailyChallengeService();