import api from './api';

/**
 * Serviço para gerenciar disciplinas favoritas dos estudantes
 * Integração com API /api/subject-favorites
 */

export interface SubjectFavorite {
  id: number;
  subject_id: number;
  favorited_at: string;
  subject_name: string;
  subject_description?: string;
  teacher_name?: string;
  subject_color?: string;
}

export interface FavoriteResponse {
  success: boolean;
  message?: string;
  is_favorite: boolean;
  subject_id: number;
  subject_name?: string;
  action?: 'added' | 'removed';
}

export const subjectFavoritesService = {
  /**
   * Obter todas as disciplinas favoritas do usuário
   */
  getUserFavorites: async (): Promise<SubjectFavorite[]> => {
    try {
      const response = await api.get('/subject-favorites');
      return response.data.favorites || [];
    } catch (error: any) {
      console.error('Erro ao buscar favoritos:', error);
      throw new Error(error.response?.data?.error || 'Erro ao carregar disciplinas favoritas');
    }
  },

  /**
   * Obter apenas os IDs das disciplinas favoritas (para consultas rápidas)
   */
  getFavoriteIds: async (): Promise<number[]> => {
    try {
      const response = await api.get('/subject-favorites/ids');
      return response.data.favorite_ids || [];
    } catch (error: any) {
      console.error('Erro ao buscar IDs dos favoritos:', error);
      return []; // Retorna array vazio em caso de erro (não bloqueia o app)
    }
  },

  /**
   * Verificar se uma disciplina específica é favorita
   */
  checkIsFavorite: async (subjectId: number): Promise<boolean> => {
    try {
      const response = await api.get(`/subject-favorites/${subjectId}`);
      return response.data.is_favorite || false;
    } catch (error: any) {
      console.error('Erro ao verificar se é favorito:', error);
      return false; // Assume que não é favorito em caso de erro
    }
  },

  /**
   * Adicionar disciplina aos favoritos
   */
  addToFavorites: async (subjectId: number): Promise<FavoriteResponse> => {
    try {
      const response = await api.post(`/subject-favorites/${subjectId}`);
      return {
        success: true,
        is_favorite: true,
        subject_id: subjectId,
        message: response.data.message,
        subject_name: response.data.subject_name,
        action: 'added'
      };
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Erro ao adicionar aos favoritos';
      
      // Se já for favorito, não é um erro crítico
      if (error.response?.status === 409) {
        return {
          success: false,
          is_favorite: true,
          subject_id: subjectId,
          message: errorMsg
        };
      }

      throw new Error(errorMsg);
    }
  },

  /**
   * Remover disciplina dos favoritos
   */
  removeFromFavorites: async (subjectId: number): Promise<FavoriteResponse> => {
    try {
      const response = await api.delete(`/subject-favorites/${subjectId}`);
      return {
        success: true,
        is_favorite: false,
        subject_id: subjectId,
        message: response.data.message,
        action: 'removed'
      };
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Erro ao remover dos favoritos';
      
      // Se não for favorito, não é um erro crítico
      if (error.response?.status === 404) {
        return {
          success: false,
          is_favorite: false,
          subject_id: subjectId,
          message: errorMsg
        };
      }

      throw new Error(errorMsg);
    }
  },

  /**
   * Alternar status de favorito (método mais prático)
   * Adiciona se não for favorito, remove se for favorito
   */
  toggleFavorite: async (subjectId: number): Promise<FavoriteResponse> => {
    try {
      const response = await api.put(`/subject-favorites/${subjectId}/toggle`);
      return {
        success: true,
        is_favorite: response.data.is_favorite,
        subject_id: subjectId,
        message: response.data.message,
        subject_name: response.data.subject_name,
        action: response.data.action
      };
    } catch (error: any) {
      console.error('Erro ao alternar favorito:', error);
      throw new Error(error.response?.data?.error || 'Erro ao atualizar favorito');
    }
  }
};