import { supabase } from '../lib/supabaseClient';

export interface SubjectResource {
  id: string | number;
  subject_id: number;
  title: string;
  resource_type: 'livro' | 'video' | 'artigo' | 'site' | 'outro' | string;
  description: string;
  cover_url?: string;
  download_url?: string;
  url?: string;
  file_path?: string;
  order_index?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type CreateResourceData = {
  subject_id: number;
  title: string;
  resource_type: string;
  description?: string;
  cover_url?: string;
  download_url?: string;
  url?: string;
  file_path?: string;
  order_index?: number;
  is_active?: boolean;
};

export type UpdateResourceData = Partial<CreateResourceData>;

const STORAGE_KEY_PREFIX = 'subject_resources_';

/**
 * Utilitários para empacotar e desempacotar metadados adicionais (como cover_url e download_url)
 * garantindo compatibilidade total com o schema do banco de dados e PostgREST.
 */
function packDescription(desc: string = '', coverUrl?: string, downloadUrl?: string): string {
  const cleanDesc = desc.replace(/^<!--meta:(.*?)-->\s*\n?/, '').trim();
  const meta: Record<string, string> = {};
  if (coverUrl && coverUrl.trim()) meta.cover_url = coverUrl.trim();
  if (downloadUrl && downloadUrl.trim()) meta.download_url = downloadUrl.trim();

  if (Object.keys(meta).length > 0) {
    return `<!--meta:${JSON.stringify(meta)}-->\n${cleanDesc}`;
  }
  return cleanDesc;
}

function unpackResource(item: any): SubjectResource {
  let description = item.description || '';
  let cover_url = item.cover_url || '';
  let download_url = item.download_url || item.file_path || '';

  const metaMatch = description.match(/^<!--meta:(.*?)-->\s*\n?/);
  if (metaMatch) {
    try {
      const meta = JSON.parse(metaMatch[1]);
      if (!cover_url && meta.cover_url) cover_url = meta.cover_url;
      if (!download_url && meta.download_url) download_url = meta.download_url;
      description = description.replace(metaMatch[0], '').trim();
    } catch {
      // Ignora erro de parse e mantém descrição original
    }
  }

  return {
    ...item,
    id: String(item.id),
    subject_id: Number(item.subject_id),
    title: item.title || '',
    resource_type: item.resource_type || 'outro',
    description: description,
    cover_url: cover_url || undefined,
    download_url: download_url || undefined,
    url: item.url || undefined,
    file_path: item.file_path || download_url || undefined,
    order_index: item.order_index ?? 0,
    is_active: item.is_active ?? true,
    created_at: item.created_at,
    updated_at: item.updated_at
  };
}

export const subjectResourceService = {
  /**
   * Buscar todos os recursos de uma disciplina
   */
  getBySubject: async (subjectId: number | string): Promise<SubjectResource[]> => {
    const numSubjectId = Number(subjectId);
    if (isNaN(numSubjectId)) return [];

    try {
      const { data, error } = await supabase
        .from('subject_resources')
        .select('*')
        .eq('subject_id', numSubjectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Erro ao buscar recursos no Supabase, utilizando cache local:', error.message);
        return subjectResourceService.getLocalResources(numSubjectId);
      }

      if (data) {
        const parsed = data.map(unpackResource);
        subjectResourceService.saveAllToLocalStorage(numSubjectId, parsed);
        return parsed;
      }

      return subjectResourceService.getLocalResources(numSubjectId);
    } catch (err) {
      console.warn('Falha na requisição ao Supabase para recursos:', err);
      return subjectResourceService.getLocalResources(numSubjectId);
    }
  },

  /**
   * Buscar recurso por ID
   */
  getById: async (id: string | number, subjectId?: number | string): Promise<SubjectResource | null> => {
    try {
      const { data, error } = await supabase
        .from('subject_resources')
        .select('*')
        .eq('id', Number(id))
        .single();

      if (!error && data) {
        return unpackResource(data);
      }
    } catch (err) {
      console.warn('Erro ao buscar recurso por ID no Supabase:', err);
    }

    if (subjectId) {
      const local = subjectResourceService.getLocalResources(Number(subjectId));
      return local.find(item => String(item.id) === String(id)) || null;
    }
    return null;
  },

  /**
   * Criar um novo recurso
   */
  create: async (data: CreateResourceData): Promise<SubjectResource> => {
    const numSubjectId = Number(data.subject_id);
    const packedDescription = packDescription(data.description, data.cover_url, data.download_url);

    // Payload compatível com colunas padrão do banco
    const payload: any = {
      subject_id: numSubjectId,
      title: data.title.trim(),
      resource_type: data.resource_type || 'livro',
      description: packedDescription,
      url: data.url && data.url.trim() !== '' ? data.url.trim() : null,
      file_path: data.download_url && data.download_url.trim() !== '' ? data.download_url.trim() : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const { data: inserted, error } = await supabase
        .from('subject_resources')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error('Erro ao inserir recurso no Supabase:', error);
        throw new Error(error.message || 'Erro ao criar recurso no banco de dados');
      }

      const created = unpackResource(inserted);
      // Garantir cover_url e download_url
      if (data.cover_url) created.cover_url = data.cover_url;
      if (data.download_url) created.download_url = data.download_url;

      subjectResourceService.saveToLocalStorage(numSubjectId, created);
      return created;
    } catch (err: any) {
      console.error('Exceção ao criar recurso:', err);
      // Fallback em caso de erro de rede
      const localFallback: SubjectResource = {
        id: `local_${Date.now()}`,
        subject_id: numSubjectId,
        title: data.title.trim(),
        resource_type: data.resource_type || 'livro',
        description: data.description || '',
        cover_url: data.cover_url,
        download_url: data.download_url,
        url: data.url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      subjectResourceService.saveToLocalStorage(numSubjectId, localFallback);
      return localFallback;
    }
  },

  /**
   * Atualizar um recurso existente
   */
  update: async (id: string | number, data: UpdateResourceData, subjectId?: number | string): Promise<SubjectResource> => {
    const numSubjectId = Number(subjectId);
    const updatePayload: any = {
      updated_at: new Date().toISOString()
    };

    if (data.title !== undefined) updatePayload.title = data.title.trim();
    if (data.resource_type !== undefined) updatePayload.resource_type = data.resource_type;
    if (data.url !== undefined) updatePayload.url = data.url && data.url.trim() !== '' ? data.url.trim() : null;
    if (data.download_url !== undefined) {
      updatePayload.file_path = data.download_url && data.download_url.trim() !== '' ? data.download_url.trim() : null;
    }

    if (data.description !== undefined || data.cover_url !== undefined || data.download_url !== undefined) {
      updatePayload.description = packDescription(
        data.description !== undefined ? data.description : '',
        data.cover_url,
        data.download_url
      );
    }

    try {
      const { data: updated, error } = await supabase
        .from('subject_resources')
        .update(updatePayload)
        .eq('id', Number(id))
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar recurso no Supabase:', error);
        throw new Error(error.message || 'Erro ao persistir alterações no recurso');
      }

      const updatedItem = unpackResource(updated);
      if (data.cover_url !== undefined) updatedItem.cover_url = data.cover_url;
      if (data.download_url !== undefined) updatedItem.download_url = data.download_url;

      const targetSubId = numSubjectId || updatedItem.subject_id;
      if (targetSubId) {
        subjectResourceService.updateInLocalStorage(targetSubId, updatedItem);
      }
      return updatedItem;
    } catch (err: any) {
      console.error('Exceção ao atualizar recurso:', err);
      // Fallback local
      if (numSubjectId) {
        const localList = subjectResourceService.getLocalResources(numSubjectId);
        const existing = localList.find(r => String(r.id) === String(id));
        if (existing) {
          const merged: SubjectResource = {
            ...existing,
            ...data,
            id: String(id),
            subject_id: numSubjectId,
            updated_at: new Date().toISOString()
          };
          subjectResourceService.updateInLocalStorage(numSubjectId, merged);
          return merged;
        }
      }
      throw err;
    }
  },

  /**
   * Excluir um recurso
   */
  delete: async (id: string | number, subjectId: number | string): Promise<boolean> => {
    const numSubjectId = Number(subjectId);
    try {
      const { error } = await supabase
        .from('subject_resources')
        .delete()
        .eq('id', Number(id));

      if (error) {
        console.error('Erro ao excluir no Supabase:', error);
        throw new Error(error.message || 'Erro ao excluir recurso no banco');
      }
    } catch (err) {
      console.error('Exceção ao deletar recurso no Supabase:', err);
    }

    const localList = subjectResourceService.getLocalResources(numSubjectId);
    const filtered = localList.filter(item => String(item.id) !== String(id));
    subjectResourceService.saveAllToLocalStorage(numSubjectId, filtered);
    return true;
  },

  /**
   * Métodos auxiliares de LocalStorage
   */
  getLocalResources: (subjectId: number): SubjectResource[] => {
    try {
      const data = localStorage.getItem(`${STORAGE_KEY_PREFIX}${subjectId}`);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Erro ao ler recursos do localStorage:', e);
      return [];
    }
  },

  saveAllToLocalStorage: (subjectId: number, resources: SubjectResource[]): void => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${subjectId}`, JSON.stringify(resources));
    } catch (e) {
      console.warn('Erro ao salvar recursos no localStorage:', e);
    }
  },

  saveToLocalStorage: (subjectId: number, resource: SubjectResource): void => {
    try {
      const current = subjectResourceService.getLocalResources(subjectId);
      const filtered = current.filter(item => String(item.id) !== String(resource.id));
      filtered.unshift(resource);
      subjectResourceService.saveAllToLocalStorage(subjectId, filtered);
    } catch (e) {
      console.warn('Erro ao adicionar recurso no localStorage:', e);
    }
  },

  updateInLocalStorage: (subjectId: number, resource: SubjectResource): void => {
    try {
      const current = subjectResourceService.getLocalResources(subjectId);
      const updated = current.map(item => String(item.id) === String(resource.id) ? resource : item);
      subjectResourceService.saveAllToLocalStorage(subjectId, updated);
    } catch (e) {
      console.warn('Erro ao atualizar recurso no localStorage:', e);
    }
  }
};

export default subjectResourceService;
