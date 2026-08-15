import { supabase } from '../lib/supabaseClient';

export interface SubjectContent {
  id: string | number;
  subject_id: number;
  section_type: string;
  title: string;
  content: string;
  order_index: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SubjectResource {
  id: string | number;
  subject_id: number;
  resource_type: string;
  title: string;
  file_path?: string;
  file_url?: string;
  url?: string;
  description: string;
  order_index?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const SECTION_TYPE_MAP: Record<string, string> = {
  conteudo: 'content',
  material: 'material',
  atividades: 'activities',
  exercicios: 'exercises',
  projetos: 'projects',
  avaliacoes: 'evaluations',
  recursos: 'resources',
};

export const REVERSE_SECTION_TYPE_MAP: Record<string, string> = {
  content: 'conteudo',
  material: 'material',
  activities: 'atividades',
  exercises: 'exercicios',
  projects: 'projetos',
  evaluations: 'avaliacoes',
  resources: 'recursos',
};

export const normalizeSectionType = (section: string): string => {
  return SECTION_TYPE_MAP[section] || section;
};

export const subjectContentService = {
  /**
   * Buscar todos os conteúdos de uma disciplina
   */
  getAllBySubject: async (subjectId: number | string): Promise<SubjectContent[]> => {
    try {
      const numSubjectId = Number(subjectId);
      if (isNaN(numSubjectId)) return [];

      const { data, error } = await supabase
        .from('subject_content')
        .select('*')
        .eq('subject_id', numSubjectId)
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        id: String(item.id)
      }));
    } catch (error: any) {
      console.error('Erro ao buscar conteúdos da disciplina no Supabase:', error);
      throw new Error(error.message || 'Erro ao buscar conteúdos');
    }
  },

  /**
   * Buscar conteúdos de uma seção específica
   */
  getBySection: async (subjectId: number | string, sectionType: string): Promise<SubjectContent[]> => {
    try {
      const numSubjectId = Number(subjectId);
      if (isNaN(numSubjectId)) return [];
      const backendSection = normalizeSectionType(sectionType);
      const sectionTypes = Array.from(new Set([backendSection, sectionType]));

      const { data, error } = await supabase
        .from('subject_content')
        .select('*')
        .eq('subject_id', numSubjectId)
        .in('section_type', sectionTypes)
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        id: String(item.id)
      }));
    } catch (error: any) {
      console.error(`Erro ao buscar conteúdo da seção ${sectionType} no Supabase:`, error);
      throw new Error(error.message || 'Erro ao buscar conteúdo');
    }
  },

  /**
   * Salvar ou atualizar conteúdo de uma seção
   */
  saveContent: async (
    subjectId: number | string,
    sectionType: string,
    title: string,
    content: string,
    orderIndex: number = 0
  ): Promise<SubjectContent> => {
    try {
      const numSubjectId = Number(subjectId);
      if (isNaN(numSubjectId)) throw new Error('ID de disciplina inválido');
      const backendSection = normalizeSectionType(sectionType);
      const sectionTypes = Array.from(new Set([backendSection, sectionType]));

      // Verificar se já existe um registro para esta disciplina e seção específica
      const { data: existing, error: findError } = await supabase
        .from('subject_content')
        .select('id')
        .eq('subject_id', numSubjectId)
        .in('section_type', sectionTypes)
        .limit(1);

      if (findError) throw findError;

      const now = new Date().toISOString();

      if (existing && existing.length > 0) {
        // Atualizar registro existente da disciplina
        const targetId = existing[0].id;
        const { data, error } = await supabase
          .from('subject_content')
          .update({
            section_type: backendSection,
            title,
            content,
            order_index: orderIndex,
            is_active: true,
            updated_at: now
          })
          .eq('id', targetId)
          .eq('subject_id', numSubjectId)
          .select()
          .single();

        if (error) throw error;
        return {
          ...data,
          id: String(data.id)
        };
      } else {
        // Inserir novo registro exclusivo para a disciplina
        const { data, error } = await supabase
          .from('subject_content')
          .insert({
            subject_id: numSubjectId,
            section_type: backendSection,
            title,
            content,
            order_index: orderIndex,
            is_active: true,
            created_at: now,
            updated_at: now
          })
          .select()
          .single();

        if (error) throw error;
        return {
          ...data,
          id: String(data.id)
        };
      }
    } catch (error: any) {
      console.error('Erro ao salvar conteúdo no Supabase:', error);
      throw new Error(error.message || 'Erro ao salvar conteúdo');
    }
  },

  /**
   * Limpar/excluir conteúdo de uma seção
   */
  clearSectionContent: async (subjectId: number | string, sectionType: string): Promise<void> => {
    try {
      const numSubjectId = Number(subjectId);
      if (isNaN(numSubjectId)) return;
      const backendSection = normalizeSectionType(sectionType);
      const sectionTypes = Array.from(new Set([backendSection, sectionType]));

      const { error } = await supabase
        .from('subject_content')
        .delete()
        .eq('subject_id', numSubjectId)
        .in('section_type', sectionTypes);

      if (error) throw error;
    } catch (error: any) {
      console.error('Erro ao limpar conteúdo no Supabase:', error);
      throw new Error(error.message || 'Erro ao limpar conteúdo');
    }
  },

  /**
   * Buscar recursos de uma disciplina
   */
  getResourcesBySubject: async (subjectId: number | string): Promise<SubjectResource[]> => {
    try {
      const numSubjectId = Number(subjectId);
      const { data, error } = await supabase
        .from('subject_resources')
        .select('*')
        .eq('subject_id', numSubjectId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        id: String(item.id),
        file_url: item.url || item.file_path
      }));
    } catch (error: any) {
      console.error('Erro ao buscar recursos no Supabase:', error);
      return [];
    }
  }
};
