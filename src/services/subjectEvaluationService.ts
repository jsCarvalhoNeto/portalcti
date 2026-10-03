import { supabase } from '../lib/supabaseClient';
import fileUploadService from './fileUploadService';

export interface SubjectEvaluation {
  id: string | number;
  subject_id: number;
  name: string;
  grade: string;
  period: string;
  evaluation_type: 'Avaliação Parcial' | 'Avaliação Global' | string;
  type: string;
  description: string;
  deadline?: string | null;
  file_path?: string | null;
  file_name?: string | null;
  cover_url?: string;
  teacher_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type CreateEvaluationData = {
  subject_id: number;
  name: string;
  grade: string;
  period: string;
  evaluation_type: string;
  description?: string;
  deadline?: string | null;
  file_path?: string | null;
  file_name?: string | null;
  cover_url?: string;
};

export type UpdateEvaluationData = Partial<CreateEvaluationData>;

const STORAGE_KEY_PREFIX = 'subject_evaluations_';

/**
 * Utilitários para empacotar e desempacotar metadados adicionais (como cover_url)
 * garantindo compatibilidade total com a tabela activities do Supabase.
 */
function packDescription(desc: string = '', coverUrl?: string): string {
  const cleanDesc = desc.replace(/^<!--meta:(.*?)-->\s*\n?/, '').trim();
  const meta: Record<string, string> = {};
  if (coverUrl && coverUrl.trim()) meta.cover_url = coverUrl.trim();

  if (Object.keys(meta).length > 0) {
    return `<!--meta:${JSON.stringify(meta)}-->\n${cleanDesc}`;
  }
  return cleanDesc;
}

function unpackEvaluation(item: any): SubjectEvaluation {
  let description = item.description || '';
  let cover_url = item.cover_url || '';

  const metaMatch = description.match(/^<!--meta:(.*?)-->\s*\n?/);
  if (metaMatch) {
    try {
      const meta = JSON.parse(metaMatch[1]);
      if (!cover_url && meta.cover_url) cover_url = meta.cover_url;
      description = description.replace(metaMatch[0], '').trim();
    } catch {
      // Ignora erro de parse
    }
  }

  // Normalizar período para exibição padronizada
  let periodNormalized = item.period || '1º Bimestre';
  if (periodNormalized === '1' || periodNormalized === '1º Período') periodNormalized = '1º Bimestre';
  else if (periodNormalized === '2' || periodNormalized === '2º Período') periodNormalized = '2º Bimestre';
  else if (periodNormalized === '3' || periodNormalized === '3º Período') periodNormalized = '3º Bimestre';
  else if (periodNormalized === '4' || periodNormalized === '4º Período') periodNormalized = '4º Bimestre';

  // Normalizar tipo de avaliação
  let evalType = item.evaluation_type || 'Avaliação Parcial';
  if (evalType.toLowerCase() === 'parcial') evalType = 'Avaliação Parcial';
  else if (evalType.toLowerCase() === 'global') evalType = 'Avaliação Global';

  return {
    ...item,
    id: String(item.id),
    subject_id: Number(item.subject_id),
    name: item.name || 'Avaliação',
    grade: item.grade || '1º Ano',
    period: periodNormalized,
    evaluation_type: evalType,
    type: item.type || 'avaliacao',
    description: description,
    deadline: item.deadline || null,
    file_path: item.file_path || null,
    file_name: item.file_name || null,
    cover_url: cover_url || undefined,
    created_at: item.created_at,
    updated_at: item.updated_at
  };
}

export const subjectEvaluationService = {
  /**
   * Buscar todas as avaliações de uma disciplina
   */
  getBySubject: async (subjectId: number | string): Promise<SubjectEvaluation[]> => {
    const numSubjectId = Number(subjectId);
    if (isNaN(numSubjectId)) return [];

    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('subject_id', numSubjectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Erro ao buscar avaliações no Supabase, utilizando cache local:', error.message);
        return subjectEvaluationService.getLocalEvaluations(numSubjectId);
      }

      if (data) {
        // Filtrar apenas itens que são avaliações (com evaluation_type preenchido ou type 'avaliacao')
        const evals = data
          .filter((item: any) => {
            const hasEvalType = item.evaluation_type && item.evaluation_type.trim() !== '';
            const isAvaliacaoType = item.type === 'avaliacao';
            return hasEvalType || isAvaliacaoType;
          })
          .map(unpackEvaluation);

        subjectEvaluationService.saveAllToLocalStorage(numSubjectId, evals);
        return evals;
      }

      return subjectEvaluationService.getLocalEvaluations(numSubjectId);
    } catch (err) {
      console.warn('Falha na requisição ao Supabase para avaliações:', err);
      return subjectEvaluationService.getLocalEvaluations(numSubjectId);
    }
  },

  /**
   * Criar uma nova avaliação
   */
  create: async (data: CreateEvaluationData): Promise<SubjectEvaluation> => {
    const numSubjectId = Number(data.subject_id);
    const packedDesc = packDescription(data.description, data.cover_url);

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

    const payload: any = {
      subject_id: numSubjectId,
      name: data.name.trim(),
      grade: data.grade || '1º Ano',
      period: data.period || '1º Bimestre',
      evaluation_type: data.evaluation_type || 'Avaliação Parcial',
      type: 'avaliacao',
      description: packedDesc,
      deadline: data.deadline && data.deadline.trim() !== '' ? data.deadline : null,
      file_path: data.file_path && data.file_path.trim() !== '' ? data.file_path.trim() : null,
      file_name: data.file_name && data.file_name.trim() !== '' ? data.file_name.trim() : (data.file_path ? 'avaliacao.pdf' : null),
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
        console.error('Erro ao inserir avaliação no Supabase:', error);
        throw new Error(error.message || 'Erro ao cadastrar avaliação');
      }

      const created = unpackEvaluation(inserted);
      if (data.cover_url) created.cover_url = data.cover_url;
      subjectEvaluationService.saveToLocalStorage(numSubjectId, created);
      return created;
    } catch (err: any) {
      console.error('Exceção ao criar avaliação:', err);
      // Fallback local
      const localFallback: SubjectEvaluation = {
        id: `local_eval_${Date.now()}`,
        subject_id: numSubjectId,
        name: data.name.trim(),
        grade: data.grade || '1º Ano',
        period: data.period || '1º Bimestre',
        evaluation_type: data.evaluation_type || 'Avaliação Parcial',
        type: 'avaliacao',
        description: data.description || '',
        deadline: data.deadline,
        file_path: data.file_path,
        file_name: data.file_name,
        cover_url: data.cover_url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      subjectEvaluationService.saveToLocalStorage(numSubjectId, localFallback);
      return localFallback;
    }
  },

  /**
   * Atualizar uma avaliação existente
   */
  update: async (id: string | number, data: UpdateEvaluationData, subjectId?: number | string): Promise<SubjectEvaluation> => {
    const numSubjectId = Number(subjectId);
    const updatePayload: any = {
      updated_at: new Date().toISOString()
    };

    if (data.name !== undefined) updatePayload.name = data.name.trim();
    if (data.grade !== undefined) updatePayload.grade = data.grade;
    if (data.period !== undefined) updatePayload.period = data.period;
    if (data.evaluation_type !== undefined) updatePayload.evaluation_type = data.evaluation_type;
    if (data.deadline !== undefined) {
      updatePayload.deadline = data.deadline && data.deadline.trim() !== '' ? data.deadline : null;
    }
    if (data.file_path !== undefined) {
      updatePayload.file_path = data.file_path && data.file_path.trim() !== '' ? data.file_path.trim() : null;
      updatePayload.file_name = data.file_name || (data.file_path ? 'avaliacao.pdf' : null);
    }

    if (data.description !== undefined || data.cover_url !== undefined) {
      updatePayload.description = packDescription(
        data.description !== undefined ? data.description : '',
        data.cover_url
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
        console.error('Erro ao atualizar avaliação no Supabase:', error);
        throw new Error(error.message || 'Erro ao persistir alterações na avaliação');
      }

      const updatedItem = unpackEvaluation(updated);
      if (data.cover_url !== undefined) updatedItem.cover_url = data.cover_url;

      const targetSubId = numSubjectId || updatedItem.subject_id;
      if (targetSubId) {
        subjectEvaluationService.updateInLocalStorage(targetSubId, updatedItem);
      }
      return updatedItem;
    } catch (err: any) {
      console.error('Exceção ao atualizar avaliação:', err);
      if (numSubjectId) {
        const localList = subjectEvaluationService.getLocalEvaluations(numSubjectId);
        const existing = localList.find(e => String(e.id) === String(id));
        if (existing) {
          const merged: SubjectEvaluation = {
            ...existing,
            ...data,
            id: String(id),
            subject_id: numSubjectId,
            updated_at: new Date().toISOString()
          };
          subjectEvaluationService.updateInLocalStorage(numSubjectId, merged);
          return merged;
        }
      }
      throw err;
    }
  },

  /**
   * Deletar uma avaliação
   */
  delete: async (id: string | number, subjectId: number | string): Promise<boolean> => {
    const numSubjectId = Number(subjectId);
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', Number(id));

      if (error) {
        console.error('Erro ao excluir avaliação no Supabase:', error);
        throw new Error(error.message || 'Erro ao excluir avaliação no banco');
      }
    } catch (err) {
      console.error('Exceção ao deletar avaliação:', err);
    }

    const localList = subjectEvaluationService.getLocalEvaluations(numSubjectId);
    const filtered = localList.filter(item => String(item.id) !== String(id));
    subjectEvaluationService.saveAllToLocalStorage(numSubjectId, filtered);
    return true;
  },

  /**
   * Upload de arquivo PDF com fallback
   */
  uploadPdfFile: async (file: File): Promise<{ fileUrl: string; fileName: string }> => {
    try {
      // 1. Tentar upload para o Supabase Storage no bucket 'activities'
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const path = `evaluations/${Date.now()}_${sanitizedName}`;

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

        return { fileUrl: publicUrl, fileName: file.name };
      }
    } catch (storageErr) {
      console.warn('Erro ao enviar PDF para o storage do Supabase, tentando serviço local:', storageErr);
    }

    try {
      // 2. Tentar upload via API local
      const res = await fileUploadService.uploadFile(file);
      if (res?.file_path || res?.url) {
        return {
          fileUrl: res.url || res.file_path,
          fileName: file.name
        };
      }
    } catch (localErr) {
      console.warn('Upload via serviço local falhou, convertendo PDF para Base64:', localErr);
    }

    // 3. Fallback para DataURL / Base64
    const base64Url = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    return {
      fileUrl: base64Url,
      fileName: file.name
    };
  },

  /**
   * Métodos auxiliares de LocalStorage
   */
  getLocalEvaluations: (subjectId: number): SubjectEvaluation[] => {
    try {
      const data = localStorage.getItem(`${STORAGE_KEY_PREFIX}${subjectId}`);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Erro ao ler avaliações do localStorage:', e);
      return [];
    }
  },

  saveAllToLocalStorage: (subjectId: number, evals: SubjectEvaluation[]): void => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${subjectId}`, JSON.stringify(evals));
    } catch (e) {
      console.warn('Erro ao salvar avaliações no localStorage:', e);
    }
  },

  saveToLocalStorage: (subjectId: number, evaluation: SubjectEvaluation): void => {
    try {
      const current = subjectEvaluationService.getLocalEvaluations(subjectId);
      const filtered = current.filter(item => String(item.id) !== String(evaluation.id));
      filtered.unshift(evaluation);
      subjectEvaluationService.saveAllToLocalStorage(subjectId, filtered);
    } catch (e) {
      console.warn('Erro ao adicionar avaliação no localStorage:', e);
    }
  },

  updateInLocalStorage: (subjectId: number, evaluation: SubjectEvaluation): void => {
    try {
      const current = subjectEvaluationService.getLocalEvaluations(subjectId);
      const updated = current.map(item => String(item.id) === String(evaluation.id) ? evaluation : item);
      subjectEvaluationService.saveAllToLocalStorage(subjectId, updated);
    } catch (e) {
      console.warn('Erro ao atualizar avaliação no localStorage:', e);
    }
  }
};

export default subjectEvaluationService;
