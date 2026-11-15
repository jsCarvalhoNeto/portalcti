import { supabase } from '@/lib/supabaseClient';

export type AiProvider = 'google';

export interface TeacherAiConfig {
  id: string;
  teacher_id: string;
  label?: string | null;
  provider: AiProvider;
  model_name: string;
  api_key: string;
  is_active: boolean;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SaveTeacherAiConfigInput {
  id?: string;
  label?: string | null;
  provider?: AiProvider;
  model_name: string;
  api_key: string;
  is_active?: boolean;
  is_default?: boolean;
}

export interface AiGenerationOptions {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  configId?: string;
  fallbackOnError?: boolean;
}

export interface AiGenerationResult {
  text: string;
  model: string;
  configId: string;
}

export interface AiConnectionTestResult {
  success: boolean;
  message: string;
  latencyMs?: number;
}

const CACHE_KEY_PREFIX = 'teacher_ai_configs_';
const GOOGLE_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

function getCacheKey(teacherId: string): string {
  return `${CACHE_KEY_PREFIX}${teacherId}`;
}

function loadLocalConfigs(teacherId: string): TeacherAiConfig[] {
  try {
    const raw = localStorage.getItem(getCacheKey(teacherId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalConfigs(teacherId: string, configs: TeacherAiConfig[]): void {
  try {
    localStorage.setItem(getCacheKey(teacherId), JSON.stringify(configs));
  } catch (err) {
    console.warn('Não foi possível salvar configurações de IA no cache local:', err);
  }
}

function normalizeModelName(modelName: string): string {
  return modelName.trim().replace(/^models\//i, '');
}

function generateLocalId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Busca todas as configurações de IA cadastradas pelo professor.
 * Usa Supabase com fallback resiliente para localStorage.
 */
export async function getTeacherAiConfigs(teacherId: string): Promise<TeacherAiConfig[]> {
  if (!teacherId) return [];

  const cached = loadLocalConfigs(teacherId);

  try {
    const { data, error } = await supabase
      .from('teacher_ai_configs')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true });

    if (!error && data) {
      saveLocalConfigs(teacherId, data as TeacherAiConfig[]);
      return data as TeacherAiConfig[];
    }
  } catch (err) {
    console.warn('Erro ao consultar teacher_ai_configs, usando cache local:', err);
  }

  return cached;
}

/**
 * Cria ou atualiza uma configuração de IA do professor.
 */
export async function saveTeacherAiConfig(
  teacherId: string,
  input: SaveTeacherAiConfigInput
): Promise<TeacherAiConfig> {
  if (!teacherId) {
    throw new Error('Usuário não autenticado.');
  }

  const cleanModel = normalizeModelName(input.model_name);
  const cleanKey = input.api_key.trim();
  const cleanLabel = input.label?.trim() || null;

  if (!cleanModel) {
    throw new Error('Informe o nome do modelo.');
  }
  if (!cleanKey) {
    throw new Error('Informe a chave da API.');
  }

  const currentList = await getTeacherAiConfigs(teacherId);
  const shouldBeDefault = Boolean(input.is_default) || currentList.length === 0;
  const now = new Date().toISOString();

  let saved: TeacherAiConfig | null = null;

  try {
    if (shouldBeDefault) {
      await supabase
        .from('teacher_ai_configs')
        .update({ is_default: false, updated_at: now })
        .eq('teacher_id', teacherId);
    }

    if (input.id && !input.id.startsWith('local-')) {
      const { data, error } = await supabase
        .from('teacher_ai_configs')
        .update({
          label: cleanLabel,
          provider: input.provider || 'google',
          model_name: cleanModel,
          api_key: cleanKey,
          is_active: input.is_active ?? true,
          is_default: shouldBeDefault,
          updated_at: now,
        })
        .eq('id', input.id)
        .eq('teacher_id', teacherId)
        .select()
        .single();

      if (!error && data) {
        saved = data as TeacherAiConfig;
      }
    } else {
      const { data, error } = await supabase
        .from('teacher_ai_configs')
        .insert([
          {
            teacher_id: teacherId,
            label: cleanLabel,
            provider: input.provider || 'google',
            model_name: cleanModel,
            api_key: cleanKey,
            is_active: input.is_active ?? true,
            is_default: shouldBeDefault,
          },
        ])
        .select()
        .single();

      if (!error && data) {
        saved = data as TeacherAiConfig;
      }
    }
  } catch (err) {
    console.warn('Erro ao salvar teacher_ai_configs no Supabase, persistindo localmente:', err);
  }

  if (!saved) {
    saved = {
      id: input.id || generateLocalId(),
      teacher_id: teacherId,
      label: cleanLabel,
      provider: input.provider || 'google',
      model_name: cleanModel,
      api_key: cleanKey,
      is_active: input.is_active ?? true,
      is_default: shouldBeDefault,
      created_at: now,
      updated_at: now,
    };
  }

  const updatedCache = currentList
    .filter((item) => item.id !== saved!.id)
    .map((item) => (shouldBeDefault ? { ...item, is_default: false } : item));
  updatedCache.push(saved);
  saveLocalConfigs(teacherId, updatedCache);

  return saved;
}

/**
 * Remove uma configuração de IA do professor.
 */
export async function deleteTeacherAiConfig(teacherId: string, configId: string): Promise<void> {
  if (!teacherId || !configId) return;

  try {
    if (!configId.startsWith('local-')) {
      await supabase
        .from('teacher_ai_configs')
        .delete()
        .eq('id', configId)
        .eq('teacher_id', teacherId);
    }
  } catch (err) {
    console.warn('Erro ao remover configuração de IA no Supabase:', err);
  }

  const remaining = loadLocalConfigs(teacherId).filter((item) => item.id !== configId);

  if (remaining.length > 0 && !remaining.some((item) => item.is_default)) {
    remaining[0].is_default = true;
    await setDefaultTeacherAiConfig(teacherId, remaining[0].id);
    return;
  }

  saveLocalConfigs(teacherId, remaining);
}

/**
 * Define uma configuração de IA como padrão para o professor.
 */
export async function setDefaultTeacherAiConfig(teacherId: string, configId: string): Promise<void> {
  if (!teacherId || !configId) return;
  const now = new Date().toISOString();

  try {
    await supabase
      .from('teacher_ai_configs')
      .update({ is_default: false, updated_at: now })
      .eq('teacher_id', teacherId);

    if (!configId.startsWith('local-')) {
      await supabase
        .from('teacher_ai_configs')
        .update({ is_default: true, is_active: true, updated_at: now })
        .eq('id', configId)
        .eq('teacher_id', teacherId);
    }
  } catch (err) {
    console.warn('Erro ao definir configuração padrão no Supabase:', err);
  }

  const updated = loadLocalConfigs(teacherId).map((item) => ({
    ...item,
    is_default: item.id === configId,
    is_active: item.id === configId ? true : item.is_active,
    updated_at: item.id === configId ? now : item.updated_at,
  }));
  saveLocalConfigs(teacherId, updated);
}

/**
 * Ativa ou desativa uma configuração de IA.
 */
export async function toggleTeacherAiConfigActive(
  teacherId: string,
  configId: string,
  isActive: boolean
): Promise<void> {
  if (!teacherId || !configId) return;
  const now = new Date().toISOString();

  try {
    if (!configId.startsWith('local-')) {
      await supabase
        .from('teacher_ai_configs')
        .update({ is_active: isActive, updated_at: now })
        .eq('id', configId)
        .eq('teacher_id', teacherId);
    }
  } catch (err) {
    console.warn('Erro ao atualizar status da configuração de IA no Supabase:', err);
  }

  const updated = loadLocalConfigs(teacherId).map((item) =>
    item.id === configId ? { ...item, is_active: isActive, updated_at: now } : item
  );
  saveLocalConfigs(teacherId, updated);
}

/**
 * Executa uma chamada de geração de conteúdo na API do Google Gemini.
 */
export async function generateWithGoogleAi(
  config: Pick<TeacherAiConfig, 'id' | 'model_name' | 'api_key'>,
  options: AiGenerationOptions
): Promise<AiGenerationResult> {
  const model = normalizeModelName(config.model_name);
  const apiKey = config.api_key.trim();

  if (!model || !apiKey) {
    throw new Error('Modelo ou chave da API do Google inválidos.');
  }

  const endpoint = `${GOOGLE_API_BASE}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const body: Record<string, unknown> = {
    contents: [
      {
        role: 'user',
        parts: [{ text: options.prompt }],
      },
    ],
  };

  if (options.systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: options.systemInstruction }],
    };
  }

  const generationConfig: Record<string, unknown> = {};
  if (typeof options.temperature === 'number') {
    generationConfig.temperature = options.temperature;
  }
  if (typeof options.maxOutputTokens === 'number') {
    generationConfig.maxOutputTokens = options.maxOutputTokens;
  }
  if (Object.keys(generationConfig).length > 0) {
    body.generationConfig = generationConfig;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const apiMessage = payload?.error?.message || `Erro HTTP ${response.status}`;
    throw new Error(`Falha na API do Google (${model}): ${apiMessage}`);
  }

  const candidate = payload?.candidates?.[0];
  const parts = candidate?.content?.parts;
  const text = Array.isArray(parts)
    ? parts
        .filter((p: { thought?: boolean }) => !p.thought)
        .map((p: { text?: string }) => p.text || '')
        .join('')
        .trim()
    : '';

  if (!text) {
    const finishReason = candidate?.finishReason;
    const blockReason = payload?.promptFeedback?.blockReason;
    const detail = blockReason
      ? `Bloqueio: ${blockReason}`
      : finishReason
        ? `Motivo: ${finishReason}`
        : 'Sem conteúdo retornado';
    throw new Error(`A API do Google retornou uma resposta vazia (${detail}).`);
  }

  return {
    text,
    model,
    configId: config.id,
  };
}

/**
 * Testa se um modelo e uma chave da API do Google estão funcionando.
 */
export async function testGoogleAiConnection(
  modelName: string,
  apiKey: string
): Promise<AiConnectionTestResult> {
  const startedAt = performance.now();

  try {
    await generateWithGoogleAi(
      { id: 'test', model_name: modelName, api_key: apiKey },
      {
        prompt: 'Responda apenas com: OK',
        temperature: 0,
        maxOutputTokens: 512,
      }
    );

    const latencyMs = Math.round(performance.now() - startedAt);
    return {
      success: true,
      message: `Conexão com ${normalizeModelName(modelName)} validada com sucesso (${latencyMs} ms).`,
      latencyMs,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Não foi possível conectar à API do Google.',
    };
  }
}

/**
 * Gera conteúdo usando as configurações de IA ativas do professor.
 * Seleciona a configuração solicitada ou a padrão, com fallback opcional para outras ativas.
 */
export async function generateWithTeacherAi(
  teacherId: string,
  options: AiGenerationOptions
): Promise<AiGenerationResult> {
  const configs = await getTeacherAiConfigs(teacherId);
  const activeConfigs = configs.filter((c) => c.is_active);

  if (activeConfigs.length === 0) {
    throw new Error(
      'Nenhuma configuração de IA ativa encontrada. Adicione uma chave da API do Google nas Configurações do Professor.'
    );
  }

  const orderedConfigs = [...activeConfigs].sort((a, b) => {
    if (options.configId) {
      if (a.id === options.configId) return -1;
      if (b.id === options.configId) return 1;
    }
    if (a.is_default !== b.is_default) return a.is_default ? -1 : 1;
    return 0;
  });

  if (!options.fallbackOnError) {
    return generateWithGoogleAi(orderedConfigs[0], options);
  }

  let lastError: unknown;
  for (const config of orderedConfigs) {
    try {
      return await generateWithGoogleAi(config, options);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Todas as configurações de IA falharam.');
}
