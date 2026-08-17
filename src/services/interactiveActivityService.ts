import { supabase } from '../lib/supabaseClient';

export interface InteractiveActivity {
  id: string | number;
  subject_id: number;
  teacher_id?: string;
  title: string;
  description?: string;
  code_content: string;
  type: 'game' | 'simulation' | 'quiz' | 'exercise';
  duration?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type CreateInteractiveActivityData = {
  subject_id: number;
  title: string;
  description?: string;
  code_content: string;
  type?: 'game' | 'simulation' | 'quiz' | 'exercise';
  duration?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  is_active?: boolean;
};

export type UpdateInteractiveActivityData = Partial<CreateInteractiveActivityData>;

const STORAGE_KEY_PREFIX = 'interactive_activities_subject_';

export const interactiveActivityService = {
  /**
   * Buscar todas as atividades interativas de uma disciplina
   */
  getBySubject: async (subjectId: number | string): Promise<InteractiveActivity[]> => {
    const numSubjectId = Number(subjectId);
    if (isNaN(numSubjectId)) return [];

    try {
      const { data, error } = await supabase
        .from('subject_interactive_activities')
        .select('*')
        .eq('subject_id', numSubjectId)
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Erro ao buscar atividades no Supabase, tentando fallback local:', error.message);
        return interactiveActivityService.getLocalActivities(numSubjectId);
      }

      if (data && data.length > 0) {
        // Atualiza cache local
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${numSubjectId}`, JSON.stringify(data));
        return data;
      }

      // Se não há dados no Supabase, tenta carregar do localStorage
      return interactiveActivityService.getLocalActivities(numSubjectId);
    } catch (err) {
      console.error('Erro na requisição ao Supabase:', err);
      return interactiveActivityService.getLocalActivities(numSubjectId);
    }
  },

  /**
   * Buscar uma atividade por ID
   */
  getById: async (id: number | string): Promise<InteractiveActivity | null> => {
    try {
      const { data, error } = await supabase
        .from('subject_interactive_activities')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) return data;
    } catch (err) {
      console.warn('Erro ao buscar atividade por ID no Supabase:', err);
    }
    return null;
  },

  /**
   * Criar uma nova atividade interativa
   */
  create: async (data: CreateInteractiveActivityData): Promise<InteractiveActivity> => {
    const { data: { user } } = await supabase.auth.getUser();

    const newActivity = {
      subject_id: data.subject_id,
      teacher_id: user?.id || null,
      title: data.title.trim(),
      description: data.description?.trim() || '',
      code_content: data.code_content,
      type: data.type || 'game',
      duration: data.duration?.trim() || '20 min',
      difficulty: data.difficulty || 'beginner',
      is_active: data.is_active !== undefined ? data.is_active : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const { data: inserted, error } = await supabase
        .from('subject_interactive_activities')
        .insert(newActivity)
        .select()
        .single();

      if (error) throw error;
      
      // Atualizar cache local
      interactiveActivityService.saveToLocalStorage(data.subject_id, inserted);
      return inserted;
    } catch (err: any) {
      console.warn('Falha ao salvar no Supabase, salvando localmente:', err);
      const localItem: InteractiveActivity = {
        ...newActivity,
        id: Date.now()
      };
      interactiveActivityService.saveToLocalStorage(data.subject_id, localItem);
      return localItem;
    }
  },

  /**
   * Atualizar uma atividade existente
   */
  update: async (id: number | string, data: UpdateInteractiveActivityData): Promise<InteractiveActivity> => {
    const updateData = {
      ...data,
      updated_at: new Date().toISOString()
    };

    try {
      const { data: updated, error } = await supabase
        .from('subject_interactive_activities')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (updated && updated.subject_id) {
        interactiveActivityService.updateInLocalStorage(updated.subject_id, updated);
      }
      return updated;
    } catch (err: any) {
      console.warn('Falha ao atualizar no Supabase, atualizando localmente:', err);
      if (data.subject_id) {
        const localUpdated: InteractiveActivity = {
          id,
          ...data,
          title: data.title || '',
          code_content: data.code_content || '',
          type: data.type || 'game',
          subject_id: data.subject_id
        };
        interactiveActivityService.updateInLocalStorage(data.subject_id, localUpdated);
        return localUpdated;
      }
      throw err;
    }
  },

  /**
   * Excluir uma atividade
   */
  delete: async (id: number | string, subjectId: number | string): Promise<void> => {
    const numSubjectId = Number(subjectId);
    try {
      const { error } = await supabase
        .from('subject_interactive_activities')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('Erro ao excluir no Supabase:', error.message);
      }
    } catch (err) {
      console.error('Erro na exclusão no Supabase:', err);
    }

    if (!isNaN(numSubjectId)) {
      interactiveActivityService.deleteFromLocalStorage(numSubjectId, id);
    }
  },

  /**
   * Métodos auxiliares de LocalStorage
   */
  getLocalActivities: (subjectId: number): InteractiveActivity[] => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${subjectId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Erro ao ler localStorage:', e);
    }
    return [];
  },

  saveToLocalStorage: (subjectId: number, activity: InteractiveActivity) => {
    try {
      const current = interactiveActivityService.getLocalActivities(subjectId);
      const updated = [activity, ...current.filter(a => String(a.id) !== String(activity.id))];
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${subjectId}`, JSON.stringify(updated));
    } catch (e) {
      console.error('Erro ao gravar no localStorage:', e);
    }
  },

  updateInLocalStorage: (subjectId: number, activity: InteractiveActivity) => {
    try {
      const current = interactiveActivityService.getLocalActivities(subjectId);
      const updated = current.map(a => String(a.id) === String(activity.id) ? { ...a, ...activity } : a);
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${subjectId}`, JSON.stringify(updated));
    } catch (e) {
      console.error('Erro ao atualizar no localStorage:', e);
    }
  },

  deleteFromLocalStorage: (subjectId: number, activityId: string | number) => {
    try {
      const current = interactiveActivityService.getLocalActivities(subjectId);
      const updated = current.filter(a => String(a.id) !== String(activityId));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${subjectId}`, JSON.stringify(updated));
    } catch (e) {
      console.error('Erro ao remover do localStorage:', e);
    }
  }
};

export default interactiveActivityService;
