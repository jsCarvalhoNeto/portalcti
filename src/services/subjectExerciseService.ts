import { supabase } from '../lib/supabaseClient';
import fileUploadService from './fileUploadService';

export interface SubjectExercise {
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

export type CreateExerciseData = {
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

export type UpdateExerciseData = Partial<CreateExerciseData>;

const STORAGE_KEY_PREFIX = 'subject_exercises_';

/**
 * Utilitários para empacotar e desempacotar metadados adicionais (como cover_url e marcação de categoria)
 * garantindo compatibilidade total com a tabela activities do Supabase.
 */
function packDescription(desc: string = '', coverUrl?: string): string {
  const cleanDesc = desc.replace(/^<!--meta:(.*?)-->\s*\n?/, '').trim();
  const meta: Record<string, any> = { category: 'exercicio' };
  if (coverUrl && coverUrl.trim()) meta.cover_url = coverUrl.trim();

  return `<!--meta:${JSON.stringify(meta)}-->\n${cleanDesc}`;
}

function unpackExercise(item: any): SubjectExercise {
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

  // Normalizar tipo de avaliação (Parcial vs Global)
  let evalType = item.evaluation_type || 'Avaliação Parcial';
  if (evalType.toLowerCase() === 'parcial') evalType = 'Avaliação Parcial';
  else if (evalType.toLowerCase() === 'global') evalType = 'Avaliação Global';

  return {
    ...item,
    id: String(item.id),
    subject_id: Number(item.subject_id),
    name: item.name || 'Lista de Exercícios',
    grade: item.grade || '1º Ano',
    period: periodNormalized,
    evaluation_type: evalType,
    type: item.type || 'exercicio',
    description: description,
    deadline: item.deadline || null,
    file_path: item.file_path || null,
    file_name: item.file_name || null,
    cover_url: cover_url || undefined,
    created_at: item.created_at,
    updated_at: item.updated_at
  };
}

export const subjectExerciseService = {
  /**
   * Buscar todos os exercícios de uma disciplina
   */
  getBySubject: async (subjectId: number | string): Promise<SubjectExercise[]> => {
    const numSubjectId = Number(subjectId);
    if (isNaN(numSubjectId)) return [];

    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('subject_id', numSubjectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Erro ao buscar exercícios no Supabase, utilizando cache local:', error.message);
        return subjectExerciseService.getLocalExercises(numSubjectId);
      }

      if (data) {
        // Filtrar itens correspondentes a exercícios (type === 'exercicio' ou meta category === 'exercicio')
        const exercises = data
          .filter((item: any) => {
            if (item.type === 'exercicio') return true;
            if (item.description && item.description.includes('"category":"exercicio"')) return true;
            // Se o nome tiver Exercício / Atividade Prática e não for marcado explicitamente como avaliacao
            const nameLower = (item.name || '').toLowerCase();
            const isExerciseName = nameLower.includes('exercício') || nameLower.includes('exercicio') || nameLower.includes('lista');
            if (isExerciseName && item.type !== 'avaliacao') return true;
            return false;
          })
          .map(unpackExercise);

        subjectExerciseService.saveAllToLocalStorage(numSubjectId, exercises);
        return exercises;
      }

      return subjectExerciseService.getLocalExercises(numSubjectId);
    } catch (err) {
      console.warn('Falha na requisição ao Supabase para exercícios:', err);
      return subjectExerciseService.getLocalExercises(numSubjectId);
    }
  },

  /**
   * Criar um novo exercício
   */
  create: async (data: CreateExerciseData): Promise<SubjectExercise> => {
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
      type: 'exercicio',
      description: packedDesc,
      deadline: data.deadline && data.deadline.trim() !== '' ? data.deadline : null,
      file_path: data.file_path && data.file_path.trim() !== '' ? data.file_path.trim() : null,
      file_name: data.file_name && data.file_name.trim() !== '' ? data.file_name.trim() : (data.file_path ? 'exercicio.pdf' : null),
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
        console.error('Erro ao inserir exercício no Supabase:', error);
        throw new Error(error.message || 'Erro ao cadastrar exercício');
      }

      const created = unpackExercise(inserted);
      if (data.cover_url) created.cover_url = data.cover_url;
      subjectExerciseService.saveToLocalStorage(numSubjectId, created);
      return created;
    } catch (err: any) {
      console.error('Exceção ao criar exercício:', err);
      // Fallback local
      const localFallback: SubjectExercise = {
        id: `local_ex_${Date.now()}`,
        subject_id: numSubjectId,
        name: data.name.trim(),
        grade: data.grade || '1º Ano',
        period: data.period || '1º Bimestre',
        evaluation_type: data.evaluation_type || 'Avaliação Parcial',
        type: 'exercicio',
        description: data.description || '',
        deadline: data.deadline,
        file_path: data.file_path,
        file_name: data.file_name,
        cover_url: data.cover_url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      subjectExerciseService.saveToLocalStorage(numSubjectId, localFallback);
      return localFallback;
    }
  },

  /**
   * Atualizar um exercício existente
   */
  update: async (id: string | number, data: UpdateExerciseData, subjectId?: number | string): Promise<SubjectExercise> => {
    const numSubjectId = Number(subjectId);
    const updatePayload: any = {
      updated_at: new Date().toISOString(),
      type: 'exercicio'
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
      updatePayload.file_name = data.file_name || (data.file_path ? 'exercicio.pdf' : null);
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
        console.error('Erro ao atualizar exercício no Supabase:', error);
        throw new Error(error.message || 'Erro ao persistir alterações no exercício');
      }

      const updatedItem = unpackExercise(updated);
      if (data.cover_url !== undefined) updatedItem.cover_url = data.cover_url;

      const targetSubId = numSubjectId || updatedItem.subject_id;
      if (targetSubId) {
        subjectExerciseService.updateInLocalStorage(targetSubId, updatedItem);
      }
      return updatedItem;
    } catch (err: any) {
      console.error('Exceção ao atualizar exercício:', err);
      if (numSubjectId) {
        const localList = subjectExerciseService.getLocalExercises(numSubjectId);
        const existing = localList.find(e => String(e.id) === String(id));
        if (existing) {
          const merged: SubjectExercise = {
            ...existing,
            ...data,
            id: String(id),
            subject_id: numSubjectId,
            updated_at: new Date().toISOString()
          };
          subjectExerciseService.updateInLocalStorage(numSubjectId, merged);
          return merged;
        }
      }
      throw err;
    }
  },

  /**
   * Deletar um exercício
   */
  delete: async (id: string | number, subjectId: number | string): Promise<boolean> => {
    const numSubjectId = Number(subjectId);
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', Number(id));

      if (error) {
        console.error('Erro ao excluir exercício no Supabase:', error);
        throw new Error(error.message || 'Erro ao excluir exercício');
      }
    } catch (err) {
      console.error('Exceção ao deletar exercício:', err);
    }

    const localList = subjectExerciseService.getLocalExercises(numSubjectId);
    const filtered = localList.filter(item => String(item.id) !== String(id));
    subjectExerciseService.saveAllToLocalStorage(numSubjectId, filtered);
    return true;
  },

  /**
   * Upload de arquivo PDF do exercício com fallback resiliente
   */
  uploadPdfFile: async (file: File): Promise<{ fileUrl: string; fileName: string }> => {
    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const path = `exercises/${Date.now()}_${sanitizedName}`;

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
  getLocalExercises: (subjectId: number): SubjectExercise[] => {
    try {
      const data = localStorage.getItem(`${STORAGE_KEY_PREFIX}${subjectId}`);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Erro ao ler exercícios do localStorage:', e);
      return [];
    }
  },

  saveAllToLocalStorage: (subjectId: number, exercises: SubjectExercise[]): void => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${subjectId}`, JSON.stringify(exercises));
    } catch (e) {
      console.warn('Erro ao salvar exercícios no localStorage:', e);
    }
  },

  saveToLocalStorage: (subjectId: number, exercise: SubjectExercise): void => {
    try {
      const current = subjectExerciseService.getLocalExercises(subjectId);
      const filtered = current.filter(item => String(item.id) !== String(exercise.id));
      filtered.unshift(exercise);
      subjectExerciseService.saveAllToLocalStorage(subjectId, filtered);
    } catch (e) {
      console.warn('Erro ao adicionar exercício no localStorage:', e);
    }
  },

  updateInLocalStorage: (subjectId: number, exercise: SubjectExercise): void => {
    try {
      const current = subjectExerciseService.getLocalExercises(subjectId);
      const updated = current.map(item => String(item.id) === String(exercise.id) ? exercise : item);
      subjectExerciseService.saveAllToLocalStorage(subjectId, updated);
    } catch (e) {
      console.warn('Erro ao atualizar exercício no localStorage:', e);
    }
  }
};

export default subjectExerciseService;
