import { supabase } from '../lib/supabaseClient';

export interface SubjectLesson {
  id: string;
  subject_id: number;
  teacher_id?: string | null;
  title: string;
  lesson_date?: string | null;
  content: string;
  is_completed: boolean;
  period: '1' | '2' | '3' | '4' | 'none' | string;
  evaluation_type: 'none' | 'parcial' | 'global' | string;
  order_index: number;
  created_at?: string;
  updated_at?: string;
}

export type CreateLessonData = {
  subject_id: number;
  title: string;
  lesson_date?: string | null;
  content: string;
  is_completed?: boolean;
  period?: string;
  evaluation_type?: string;
  order_index?: number;
};

export type UpdateLessonData = Partial<CreateLessonData>;

const STORAGE_KEY_PREFIX = 'subject_lessons_';

export const subjectLessonService = {
  /**
   * Buscar todas as aulas de uma disciplina
   */
  getBySubject: async (subjectId: number | string): Promise<SubjectLesson[]> => {
    const numSubjectId = Number(subjectId);
    if (isNaN(numSubjectId)) return [];

    try {
      const { data, error } = await supabase
        .from('subject_lessons')
        .select('*')
        .eq('subject_id', numSubjectId)
        .order('order_index', { ascending: true })
        .order('lesson_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Erro ao buscar aulas no Supabase, utilizando cache local:', error.message);
        return subjectLessonService.getLocalLessons(numSubjectId);
      }

      if (data && data.length > 0) {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${numSubjectId}`, JSON.stringify(data));
        return data as SubjectLesson[];
      }

      return subjectLessonService.getLocalLessons(numSubjectId);
    } catch (err) {
      console.warn('Falha na requisição ao Supabase para aulas:', err);
      return subjectLessonService.getLocalLessons(numSubjectId);
    }
  },

  /**
   * Buscar uma aula específica por ID
   */
  getById: async (id: string, subjectId?: number | string): Promise<SubjectLesson | null> => {
    try {
      const { data, error } = await supabase
        .from('subject_lessons')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        return data as SubjectLesson;
      }
    } catch (err) {
      console.warn('Erro ao buscar aula por ID no Supabase:', err);
    }

    if (subjectId) {
      const localList = subjectLessonService.getLocalLessons(Number(subjectId));
      return localList.find(item => String(item.id) === String(id)) || null;
    }

    return null;
  },

  /**
   * Criar uma nova aula
   */
  create: async (data: CreateLessonData): Promise<SubjectLesson> => {
    let currentUserId: string | null = null;
    try {
      const { data: userData } = await supabase.auth.getUser();
      currentUserId = userData?.user?.id || null;
    } catch (e) {
      console.warn('Não foi possível obter o usuário logado para a criação da aula:', e);
    }

    const payload = {
      subject_id: data.subject_id,
      teacher_id: currentUserId,
      title: data.title.trim(),
      lesson_date: data.lesson_date || null,
      content: data.content || '',
      is_completed: data.is_completed ?? false,
      period: data.period || '1',
      evaluation_type: data.evaluation_type || 'none',
      order_index: data.order_index ?? 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const { data: inserted, error } = await supabase
        .from('subject_lessons')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.warn('Erro ao inserir aula no Supabase, salvando localmente:', error.message);
        const fallbackItem: SubjectLesson = {
          id: 'local_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          ...payload
        };
        subjectLessonService.saveToLocalStorage(data.subject_id, fallbackItem);
        return fallbackItem;
      }

      const createdItem = inserted as SubjectLesson;
      subjectLessonService.saveToLocalStorage(data.subject_id, createdItem);
      return createdItem;
    } catch (err) {
      console.warn('Exceção ao criar aula no Supabase, salvando localmente:', err);
      const fallbackItem: SubjectLesson = {
        id: 'local_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        ...payload
      };
      subjectLessonService.saveToLocalStorage(data.subject_id, fallbackItem);
      return fallbackItem;
    }
  },

  /**
   * Atualizar uma aula existente
   */
  update: async (id: string, data: UpdateLessonData, subjectId?: number | string): Promise<SubjectLesson> => {
    const updatePayload: any = {
      ...data,
      updated_at: new Date().toISOString()
    };

    if (data.title) updatePayload.title = data.title.trim();

    try {
      const { data: updated, error } = await supabase
        .from('subject_lessons')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.warn('Erro ao atualizar no Supabase, atualizando localmente:', error.message);
        if (subjectId) {
          const localList = subjectLessonService.getLocalLessons(Number(subjectId));
          const index = localList.findIndex(item => String(item.id) === String(id));
          if (index !== -1) {
            const merged = { ...localList[index], ...updatePayload };
            subjectLessonService.updateInLocalStorage(Number(subjectId), merged);
            return merged;
          }
        }
        throw error;
      }

      const updatedItem = updated as SubjectLesson;
      if (subjectId || updatedItem.subject_id) {
        subjectLessonService.updateInLocalStorage(Number(subjectId || updatedItem.subject_id), updatedItem);
      }
      return updatedItem;
    } catch (err) {
      console.warn('Exceção ao atualizar aula no Supabase:', err);
      if (subjectId) {
        const localList = subjectLessonService.getLocalLessons(Number(subjectId));
        const index = localList.findIndex(item => String(item.id) === String(id));
        if (index !== -1) {
          const merged = { ...localList[index], ...updatePayload };
          subjectLessonService.updateInLocalStorage(Number(subjectId), merged);
          return merged;
        }
      }
      throw err;
    }
  },

  /**
   * Alternar status de realização da aula
   */
  toggleCompleted: async (id: string, is_completed: boolean, subjectId?: number | string): Promise<SubjectLesson> => {
    return subjectLessonService.update(id, { is_completed }, subjectId);
  },

  /**
   * Deletar uma aula
   */
  delete: async (id: string, subjectId: number | string): Promise<boolean> => {
    const numSubjectId = Number(subjectId);
    try {
      const { error } = await supabase
        .from('subject_lessons')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('Erro ao deletar no Supabase, removendo do local:', error.message);
      }
    } catch (err) {
      console.warn('Exceção ao deletar no Supabase:', err);
    }

    // Sempre remove do cache local
    const localList = subjectLessonService.getLocalLessons(numSubjectId);
    const filtered = localList.filter(item => String(item.id) !== String(id));
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${numSubjectId}`, JSON.stringify(filtered));
    return true;
  },

  /**
   * Helpers do LocalStorage
   */
  getLocalLessons: (subjectId: number): SubjectLesson[] => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${subjectId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Erro ao ler localStorage de aulas:', e);
    }
    return [];
  },

  saveToLocalStorage: (subjectId: number, lesson: SubjectLesson) => {
    try {
      const list = subjectLessonService.getLocalLessons(subjectId);
      const filtered = list.filter(item => String(item.id) !== String(lesson.id));
      filtered.push(lesson);
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${subjectId}`, JSON.stringify(filtered));
    } catch (e) {
      console.error('Erro ao salvar aula no localStorage:', e);
    }
  },

  updateInLocalStorage: (subjectId: number, lesson: SubjectLesson) => {
    try {
      const list = subjectLessonService.getLocalLessons(subjectId);
      const index = list.findIndex(item => String(item.id) === String(lesson.id));
      if (index !== -1) {
        list[index] = lesson;
      } else {
        list.push(lesson);
      }
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${subjectId}`, JSON.stringify(list));
    } catch (e) {
      console.error('Erro ao atualizar aula no localStorage:', e);
    }
  }
};

export default subjectLessonService;
