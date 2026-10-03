import { supabase } from '../lib/supabaseClient';
import fileUploadService from './fileUploadService';

export interface ProjectAttachedFile {
  name: string;
  url: string;
  size?: string;
}

export interface SubjectProject {
  id: string | number;
  subject_id: number;
  name: string;
  description: string;
  start_date?: string | null;
  deadline?: string | null;
  grade: string;
  period: string;
  type: string;
  file_path?: string | null;
  file_name?: string | null;
  files?: ProjectAttachedFile[] | null;
  cover_url?: string;
  teacher_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type CreateProjectData = {
  subject_id: number;
  name: string;
  description?: string;
  start_date?: string | null;
  deadline?: string | null;
  grade?: string;
  period?: string;
  file_path?: string | null;
  file_name?: string | null;
  files?: ProjectAttachedFile[] | null;
  cover_url?: string;
};

export type UpdateProjectData = Partial<CreateProjectData>;

const STORAGE_KEY_PREFIX = 'subject_projects_';

/**
 * Utilitários para empacotar e desempacotar metadados adicionais (como start_date, cover_url e files)
 * garantindo compatibilidade total com a tabela activities do Supabase.
 */
function packDescription(desc: string = '', startDate?: string | null, coverUrl?: string, filesList?: ProjectAttachedFile[] | null): string {
  const cleanDesc = desc.replace(/^<!--meta:(.*?)-->\s*\n?/, '').trim();
  const meta: Record<string, any> = { category: 'projeto' };
  if (startDate && startDate.trim()) meta.start_date = startDate.trim();
  if (coverUrl && coverUrl.trim()) meta.cover_url = coverUrl.trim();
  if (filesList && filesList.length > 0) meta.files_attached = filesList;

  return `<!--meta:${JSON.stringify(meta)}-->\n${cleanDesc}`;
}

function unpackProject(item: any): SubjectProject {
  let description = item.description || '';
  let cover_url = item.cover_url || '';
  let start_date = item.start_date || null;
  let files: ProjectAttachedFile[] = Array.isArray(item.files) ? item.files : [];

  const metaMatch = description.match(/^<!--meta:(.*?)-->\s*\n?/);
  if (metaMatch) {
    try {
      const meta = JSON.parse(metaMatch[1]);
      if (!cover_url && meta.cover_url) cover_url = meta.cover_url;
      if (!start_date && meta.start_date) start_date = meta.start_date;
      if (files.length === 0 && Array.isArray(meta.files_attached)) files = meta.files_attached;
      description = description.replace(metaMatch[0], '').trim();
    } catch {
      // Ignora erro
    }
  }

  // Se houver file_path principal mas não estiver na lista de files, adiciona
  if (item.file_path && files.length === 0) {
    files.push({
      name: item.file_name || 'arquivo_projeto.pdf',
      url: item.file_path
    });
  }

  // Normalizar período
  let periodNormalized = item.period || '1º Bimestre';
  if (periodNormalized === '1' || periodNormalized === '1º Período') periodNormalized = '1º Bimestre';
  else if (periodNormalized === '2' || periodNormalized === '2º Período') periodNormalized = '2º Bimestre';
  else if (periodNormalized === '3' || periodNormalized === '3º Período') periodNormalized = '3º Bimestre';
  else if (periodNormalized === '4' || periodNormalized === '4º Período') periodNormalized = '4º Bimestre';

  return {
    ...item,
    id: String(item.id),
    subject_id: Number(item.subject_id),
    name: item.name || 'Projeto',
    description: description,
    start_date: start_date,
    deadline: item.deadline || null,
    grade: item.grade || '1º Ano',
    period: periodNormalized,
    type: item.type || 'projeto',
    file_path: item.file_path || (files[0]?.url ?? null),
    file_name: item.file_name || (files[0]?.name ?? null),
    files: files,
    cover_url: cover_url || undefined,
    created_at: item.created_at,
    updated_at: item.updated_at
  };
}

export const subjectProjectService = {
  /**
   * Buscar todos os projetos de uma disciplina
   */
  getBySubject: async (subjectId: number | string): Promise<SubjectProject[]> => {
    const numSubjectId = Number(subjectId);
    if (isNaN(numSubjectId)) return [];

    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('subject_id', numSubjectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Erro ao buscar projetos no Supabase, utilizando cache local:', error.message);
        return subjectProjectService.getLocalProjects(numSubjectId);
      }

      if (data) {
        // Filtrar itens correspondentes a projetos
        const projects = data
          .filter((item: any) => {
            if (item.type === 'projeto') return true;
            if (item.description && item.description.includes('"category":"projeto"')) return true;
            const nameLower = (item.name || '').toLowerCase();
            return nameLower.includes('projeto') || nameLower.includes('project');
          })
          .map(unpackProject);

        subjectProjectService.saveAllToLocalStorage(numSubjectId, projects);
        return projects;
      }

      return subjectProjectService.getLocalProjects(numSubjectId);
    } catch (err) {
      console.warn('Falha na requisição ao Supabase para projetos:', err);
      return subjectProjectService.getLocalProjects(numSubjectId);
    }
  },

  /**
   * Criar um novo projeto
   */
  create: async (data: CreateProjectData): Promise<SubjectProject> => {
    const numSubjectId = Number(data.subject_id);
    const packedDesc = packDescription(data.description, data.start_date, data.cover_url, data.files);

    let currentUserId: string | null = null;
    try {
      const { data: userData } = await supabase.auth.getUser();
      currentUserId = userData?.user?.id || null;
    } catch {
      // Ignora erro
    }

    if (!currentUserId && numSubjectId) {
      try {
        const { data: sub } = await supabase
          .from('subjects')
          .select('teacher_id')
          .eq('id', numSubjectId)
          .maybeSingle();
        currentUserId = sub?.teacher_id || null;
      } catch (e) {
        console.warn('Não foi possível obter teacher_id da disciplina:', e);
      }
    }

    const mainFilePath = data.file_path || (data.files && data.files[0]?.url) || null;
    const mainFileName = data.file_name || (data.files && data.files[0]?.name) || null;

    const payload: any = {
      subject_id: numSubjectId,
      name: data.name.trim(),
      grade: data.grade || '1º Ano',
      period: data.period || '1º Bimestre',
      type: 'projeto',
      description: packedDesc,
      deadline: data.deadline && data.deadline.trim() !== '' ? data.deadline : null,
      file_path: mainFilePath,
      file_name: mainFileName,
      files: data.files && data.files.length > 0 ? data.files : null,
      teacher_id: currentUserId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const { data: inserted, error } = await supabase
        .from('activities')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error('Erro ao inserir projeto no Supabase:', error);
        throw new Error(error.message || 'Erro ao cadastrar projeto');
      }

      const created = unpackProject(inserted);
      if (data.start_date) created.start_date = data.start_date;
      if (data.cover_url) created.cover_url = data.cover_url;
      if (data.files) created.files = data.files;

      subjectProjectService.saveToLocalStorage(numSubjectId, created);
      return created;
    } catch (err: any) {
      console.error('Exceção ao criar projeto:', err);
      // Fallback local
      const localFallback: SubjectProject = {
        id: `local_proj_${Date.now()}`,
        subject_id: numSubjectId,
        name: data.name.trim(),
        description: data.description || '',
        start_date: data.start_date,
        deadline: data.deadline,
        grade: data.grade || '1º Ano',
        period: data.period || '1º Bimestre',
        type: 'projeto',
        file_path: mainFilePath,
        file_name: mainFileName,
        files: data.files || [],
        cover_url: data.cover_url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      subjectProjectService.saveToLocalStorage(numSubjectId, localFallback);
      return localFallback;
    }
  },

  /**
   * Atualizar um projeto existente
   */
  update: async (id: string | number, data: UpdateProjectData, subjectId?: number | string): Promise<SubjectProject> => {
    const numSubjectId = Number(subjectId);
    const updatePayload: any = {
      updated_at: new Date().toISOString(),
      type: 'projeto'
    };

    if (data.name !== undefined) updatePayload.name = data.name.trim();
    if (data.grade !== undefined) updatePayload.grade = data.grade;
    if (data.period !== undefined) updatePayload.period = data.period;
    if (data.deadline !== undefined) {
      updatePayload.deadline = data.deadline && data.deadline.trim() !== '' ? data.deadline : null;
    }
    if (data.file_path !== undefined) {
      updatePayload.file_path = data.file_path && data.file_path.trim() !== '' ? data.file_path.trim() : null;
      updatePayload.file_name = data.file_name || (data.file_path ? 'arquivo_projeto.pdf' : null);
    }
    if (data.files !== undefined) {
      updatePayload.files = data.files && data.files.length > 0 ? data.files : null;
      if (!updatePayload.file_path && data.files && data.files[0]) {
        updatePayload.file_path = data.files[0].url;
        updatePayload.file_name = data.files[0].name;
      }
    }

    if (data.description !== undefined || data.start_date !== undefined || data.cover_url !== undefined || data.files !== undefined) {
      updatePayload.description = packDescription(
        data.description !== undefined ? data.description : '',
        data.start_date,
        data.cover_url,
        data.files
      );
    }

    try {
      const { data: updated, error } = await supabase
        .from('activities')
        .update(updatePayload)
        .eq('id', Number(id))
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar projeto no Supabase:', error);
        throw new Error(error.message || 'Erro ao persistir alterações no projeto');
      }

      const updatedItem = unpackProject(updated);
      if (data.start_date !== undefined) updatedItem.start_date = data.start_date;
      if (data.cover_url !== undefined) updatedItem.cover_url = data.cover_url;
      if (data.files !== undefined) updatedItem.files = data.files;

      const targetSubId = numSubjectId || updatedItem.subject_id;
      if (targetSubId) {
        subjectProjectService.updateInLocalStorage(targetSubId, updatedItem);
      }
      return updatedItem;
    } catch (err: any) {
      console.error('Exceção ao atualizar projeto:', err);
      if (numSubjectId) {
        const localList = subjectProjectService.getLocalProjects(numSubjectId);
        const existing = localList.find(p => String(p.id) === String(id));
        if (existing) {
          const merged: SubjectProject = {
            ...existing,
            ...data,
            id: String(id),
            subject_id: numSubjectId,
            updated_at: new Date().toISOString()
          };
          subjectProjectService.updateInLocalStorage(numSubjectId, merged);
          return merged;
        }
      }
      throw err;
    }
  },

  /**
   * Deletar um projeto
   */
  delete: async (id: string | number, subjectId: number | string): Promise<boolean> => {
    const numSubjectId = Number(subjectId);
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', Number(id));

      if (error) {
        console.error('Erro ao excluir projeto no Supabase:', error);
        throw new Error(error.message || 'Erro ao excluir projeto');
      }
    } catch (err) {
      console.error('Exceção ao deletar projeto:', err);
    }

    const localList = subjectProjectService.getLocalProjects(numSubjectId);
    const filtered = localList.filter(item => String(item.id) !== String(id));
    subjectProjectService.saveAllToLocalStorage(numSubjectId, filtered);
    return true;
  },

  /**
   * Upload de arquivo do projeto (PDF, ZIP, DOCX, imagem) com fallback
   */
  uploadProjectFile: async (file: File): Promise<{ fileUrl: string; fileName: string; fileSize?: string }> => {
    const formatBytes = (bytes: number) => {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / 1048576).toFixed(1) + ' MB';
    };

    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const path = `projects/${Date.now()}_${sanitizedName}`;

      const { error: uploadError } = await supabase.storage
        .from('activities')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('activities')
          .getPublicUrl(path);

        return {
          fileUrl: publicUrl,
          fileName: file.name,
          fileSize: formatBytes(file.size)
        };
      }
    } catch (storageErr) {
      console.warn('Erro ao enviar arquivo para o Supabase Storage:', storageErr);
    }

    try {
      const res = await fileUploadService.uploadFile(file);
      if (res?.file_path || res?.url) {
        return {
          fileUrl: res.url || res.file_path,
          fileName: file.name,
          fileSize: formatBytes(file.size)
        };
      }
    } catch (localErr) {
      console.warn('Upload via serviço local falhou, convertendo arquivo para Base64:', localErr);
    }

    const base64Url = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    return {
      fileUrl: base64Url,
      fileName: file.name,
      fileSize: formatBytes(file.size)
    };
  },

  /**
   * Métodos auxiliares de LocalStorage
   */
  getLocalProjects: (subjectId: number): SubjectProject[] => {
    try {
      const data = localStorage.getItem(`${STORAGE_KEY_PREFIX}${subjectId}`);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Erro ao ler projetos do localStorage:', e);
      return [];
    }
  },

  saveAllToLocalStorage: (subjectId: number, projects: SubjectProject[]): void => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${subjectId}`, JSON.stringify(projects));
    } catch (e) {
      console.warn('Erro ao salvar projetos no localStorage:', e);
    }
  },

  saveToLocalStorage: (subjectId: number, project: SubjectProject): void => {
    try {
      const current = subjectProjectService.getLocalProjects(subjectId);
      const filtered = current.filter(item => String(item.id) !== String(project.id));
      filtered.unshift(project);
      subjectProjectService.saveAllToLocalStorage(subjectId, filtered);
    } catch (e) {
      console.warn('Erro ao adicionar projeto no localStorage:', e);
    }
  },

  updateInLocalStorage: (subjectId: number, project: SubjectProject): void => {
    try {
      const current = subjectProjectService.getLocalProjects(subjectId);
      const updated = current.map(item => String(item.id) === String(project.id) ? project : item);
      subjectProjectService.saveAllToLocalStorage(subjectId, updated);
    } catch (e) {
      console.warn('Erro ao atualizar projeto no localStorage:', e);
    }
  }
};

export default subjectProjectService;
