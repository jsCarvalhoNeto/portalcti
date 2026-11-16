import { supabase } from '@/lib/supabaseClient';
import {
  AiAttachment,
  fileToAiAttachment,
  generateWithTeacherAi,
} from '@/services/aiService';
import { SubjectLesson } from '@/services/subjectLessonService';

export interface ScheduleMapItem {
  order_index: number;
  title: string;
  period?: string;
  objectives?: string;
  topics: string[];
  suggested_date?: string | null;
}

export interface SourceFileMeta {
  name: string;
  kind: 'ementa' | 'cronograma' | 'escopo' | 'geral';
  updatedAt: string;
}

export interface SubjectAiContext {
  id?: string;
  subject_id: number;
  teacher_id?: string | null;
  total_lessons: number;
  syllabus_text: string;
  schedule_map: ScheduleMapItem[];
  content_template: string;
  lesson_plan_template: string;
  source_files: SourceFileMeta[];
  created_at?: string;
  updated_at?: string;
}

export interface SaveSubjectAiContextInput {
  subject_id: number;
  teacher_id?: string | null;
  total_lessons: number;
  syllabus_text: string;
  schedule_map: ScheduleMapItem[];
  content_template: string;
  lesson_plan_template?: string;
  source_files?: SourceFileMeta[];
}

export interface AnalyzeDocumentsResult {
  syllabusSummary: string;
  detectedTotalLessons: number;
  scheduleMap: ScheduleMapItem[];
  model: string;
}

export interface GenerateSingleLessonInput {
  teacherId: string;
  subjectName: string;
  context: SubjectAiContext;
  orderIndex: number;
  title: string;
  period?: string;
  lessonDate?: string | null;
  mappedItem?: ScheduleMapItem | null;
  existingLesson?: SubjectLesson | null;
  previousLessonTitle?: string;
  nextLessonTitle?: string;
  extraInstructions?: string;
  generateTarget: 'content' | 'plan' | 'both';
  configId?: string;
}

export interface GenerateSingleLessonResult {
  title: string;
  content?: string;
  lessonPlan?: string;
  model: string;
}

const STORAGE_KEY_PREFIX = 'subject_ai_context_';

function getLocalKey(subjectId: number): string {
  return `${STORAGE_KEY_PREFIX}${subjectId}`;
}

function loadLocalContext(subjectId: number): SubjectAiContext | null {
  try {
    const raw = localStorage.getItem(getLocalKey(subjectId));
    if (!raw) return null;
    return JSON.parse(raw) as SubjectAiContext;
  } catch {
    return null;
  }
}

function saveLocalContext(ctx: SubjectAiContext): void {
  try {
    localStorage.setItem(getLocalKey(ctx.subject_id), JSON.stringify(ctx));
  } catch (err) {
    console.warn('Não foi possível salvar contexto de IA da disciplina no cache local:', err);
  }
}

export function createEmptySubjectAiContext(subjectId: number): SubjectAiContext {
  return {
    subject_id: subjectId,
    total_lessons: 20,
    syllabus_text: '',
    schedule_map: [],
    content_template: '',
    lesson_plan_template: '',
    source_files: [],
  };
}

/**
 * Busca o contexto de IA configurado para uma disciplina.
 */
export async function getSubjectAiContext(subjectId: number | string): Promise<SubjectAiContext | null> {
  const numId = Number(subjectId);
  if (isNaN(numId) || numId <= 0) return null;

  const local = loadLocalContext(numId);

  try {
    const { data, error } = await supabase
      .from('subject_ai_contexts')
      .select('*')
      .eq('subject_id', numId)
      .maybeSingle();

    if (!error && data) {
      const normalized: SubjectAiContext = {
        id: data.id,
        subject_id: Number(data.subject_id),
        teacher_id: data.teacher_id,
        total_lessons: Number(data.total_lessons) || 20,
        syllabus_text: data.syllabus_text || '',
        schedule_map: Array.isArray(data.schedule_map) ? data.schedule_map : [],
        content_template: data.content_template || '',
        lesson_plan_template: data.lesson_plan_template || '',
        source_files: Array.isArray(data.source_files) ? data.source_files : [],
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
      saveLocalContext(normalized);
      return normalized;
    }
  } catch (err) {
    console.warn('Erro ao buscar subject_ai_contexts no Supabase, usando cache local:', err);
  }

  return local;
}

/**
 * Salva ou atualiza o contexto de IA de uma disciplina (Supabase + localStorage).
 */
export async function saveSubjectAiContext(input: SaveSubjectAiContextInput): Promise<SubjectAiContext> {
  const now = new Date().toISOString();
  const payload = {
    subject_id: Number(input.subject_id),
    teacher_id: input.teacher_id || null,
    total_lessons: Math.max(1, Number(input.total_lessons) || 20),
    syllabus_text: input.syllabus_text || '',
    schedule_map: Array.isArray(input.schedule_map) ? input.schedule_map : [],
    content_template: input.content_template || '',
    lesson_plan_template: input.lesson_plan_template || '',
    source_files: Array.isArray(input.source_files) ? input.source_files : [],
    updated_at: now,
  };

  try {
    const { data, error } = await supabase
      .from('subject_ai_contexts')
      .upsert(payload, { onConflict: 'subject_id' })
      .select()
      .single();

    if (!error && data) {
      const saved: SubjectAiContext = {
        id: data.id,
        subject_id: Number(data.subject_id),
        teacher_id: data.teacher_id,
        total_lessons: Number(data.total_lessons) || 20,
        syllabus_text: data.syllabus_text || '',
        schedule_map: Array.isArray(data.schedule_map) ? data.schedule_map : [],
        content_template: data.content_template || '',
        lesson_plan_template: data.lesson_plan_template || '',
        source_files: Array.isArray(data.source_files) ? data.source_files : [],
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
      saveLocalContext(saved);
      return saved;
    }
  } catch (err) {
    console.warn('Erro ao salvar subject_ai_contexts no Supabase, salvando localmente:', err);
  }

  const localSaved: SubjectAiContext = {
    ...payload,
    created_at: now,
  };
  saveLocalContext(localSaved);
  return localSaved;
}

function stripMarkdownJsonFence(raw: string): string {
  const trimmed = raw.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenceMatch ? fenceMatch[1].trim() : trimmed;
}

/**
 * Remove cercas externas ```markdown ... ``` ou preâmbulos curtos antes de um bloco markdown completo,
 * evitando que a prévia dos cards exiba "[Código]" no início da aula.
 */
export function stripOuterMarkdownFence(raw: string): string {
  let text = raw.trim();
  // Remove preâmbulo curto antes de um bloco ```markdown ... ``` que envolve o documento todo
  const preambleFenceMatch = text.match(
    /^(?:[^\n]{0,180}\n+){0,2}```(?:markdown|md)?\s*\n([\s\S]*?)\n```\s*$/i
  );
  if (preambleFenceMatch) {
    return preambleFenceMatch[1].trim();
  }
  const directFenceMatch = text.match(/^```(?:markdown|md)?\s*\n?([\s\S]*?)\n?```$/i);
  if (directFenceMatch) {
    return directFenceMatch[1].trim();
  }
  return text;
}

/**
 * Monta o título padrão do card de aula preservando o título do cronograma quando disponível.
 */
export function formatLessonTitleFromSchedule(
  orderIndex: number,
  scheduleTitle?: string | null
): string {
  const padded = String(Math.max(1, orderIndex)).padStart(2, '0');
  const clean = (scheduleTitle || '').trim();
  if (!clean) return `Aula ${padded}`;
  if (/^aula\s*\d+/i.test(clean)) return clean;
  return `Aula ${padded} – ${clean}`;
}

/**
 * Lê os PDFs da disciplina (ementa, cronograma, escopo) com o Gemini e extrai:
 * 1) Um resumo estruturado da ementa e escopo
 * 2) O mapeamento das aulas (respeitando a quantidade informada ou detectada)
 */
export async function analyzeSubjectDocumentsWithAi(params: {
  teacherId: string;
  subjectName: string;
  files: Array<{ file: File; kind: SourceFileMeta['kind'] }>;
  targetLessonsCount?: number;
  configId?: string;
}): Promise<AnalyzeDocumentsResult> {
  if (params.files.length === 0) {
    throw new Error('Envie pelo menos um PDF (ementa, cronograma ou escopo) para analisar.');
  }

  const attachments: AiAttachment[] = await Promise.all(
    params.files.map((item) => fileToAiAttachment(item.file))
  );

  const filesDescription = params.files
    .map((f, idx) => `Documento ${idx + 1}: "${f.file.name}" (Tipo: ${f.kind})`)
    .join('\n');

  const countInstruction =
    params.targetLessonsCount && params.targetLessonsCount > 0
      ? `A disciplina possui exatamente ${params.targetLessonsCount} aulas. Gere o mapeamento para ${params.targetLessonsCount} aulas (order_index de 1 até ${params.targetLessonsCount}).`
      : 'Identifique nos documentos a quantidade total de aulas previstas no cronograma e gere o mapeamento completo em ordem sequencial.';

  const prompt = [
    `Disciplina: ${params.subjectName}`,
    '',
    'Documentos PDF anexados:',
    filesDescription,
    '',
    countInstruction,
    '',
    'Retorne EXCLUSIVAMENTE um JSON válido com a seguinte estrutura:',
    '{',
    '  "detectedTotalLessons": number,',
    '  "syllabusSummary": "Resumo completo em texto estruturado contendo: objetivos da disciplina, ementa, escopo, competências e diretrizes pedagógicas extraídas dos PDFs",',
    '  "scheduleMap": [',
    '    {',
    '      "order_index": 1,',
    '      "title": "Título objetivo da aula",',
    '      "period": "1",',
    '      "objectives": "Objetivo específico desta aula",',
    '      "topics": ["Tópico 1", "Tópico 2"],',
    '      "suggested_date": "YYYY-MM-DD ou null"',
    '    }',
    '  ]',
    '}',
  ].join('\n');

  const systemInstruction = [
    'Você é um especialista em planejamento pedagógico de cursos técnicos em informática.',
    'Analise com precisão os PDFs anexados (ementa, cronograma e escopo).',
    'Extraia os dados fiéis aos documentos sem inventar conteúdos fora do escopo.',
    'Responda estritamente com JSON válido em português do Brasil.',
  ].join(' ');

  const result = await generateWithTeacherAi(params.teacherId, {
    prompt,
    systemInstruction,
    attachments,
    responseMimeType: 'application/json',
    temperature: 0.2,
    configId: params.configId,
    fallbackOnError: true,
  });

  const parsed = JSON.parse(stripMarkdownJsonFence(result.text)) as {
    detectedTotalLessons?: number;
    syllabusSummary?: string;
    scheduleMap?: ScheduleMapItem[];
  };

  const scheduleMap: ScheduleMapItem[] = Array.isArray(parsed.scheduleMap)
    ? parsed.scheduleMap.map((item, idx) => ({
        order_index: Number(item.order_index) || idx + 1,
        title: String(item.title || `Aula ${String(idx + 1).padStart(2, '0')}`).trim(),
        period: item.period ? String(item.period) : '1',
        objectives: item.objectives ? String(item.objectives) : '',
        topics: Array.isArray(item.topics) ? item.topics.map(String) : [],
        suggested_date: item.suggested_date || null,
      }))
    : [];

  return {
    syllabusSummary: String(parsed.syllabusSummary || '').trim(),
    detectedTotalLessons:
      Number(parsed.detectedTotalLessons) || scheduleMap.length || params.targetLessonsCount || 20,
    scheduleMap,
    model: result.model,
  };
}

/**
 * Gera uma única aula (conteúdo e/ou plano de aula) seguindo rigorosamente o modelo da disciplina.
 */
export async function generateSingleLessonWithAi(
  input: GenerateSingleLessonInput
): Promise<GenerateSingleLessonResult> {
  const {
    teacherId,
    subjectName,
    context,
    orderIndex,
    title,
    period,
    lessonDate,
    mappedItem,
    existingLesson,
    previousLessonTitle,
    nextLessonTitle,
    extraInstructions,
    generateTarget,
    configId,
  } = input;

  const hasContentTemplate = Boolean(context.content_template?.trim());
  const hasPlanTemplate = Boolean(context.lesson_plan_template?.trim());

  const isGenericTitle = !title.trim() || /^aula\s*\d+\s*$/i.test(title.trim());
  const effectiveTitle =
    isGenericTitle && mappedItem?.title
      ? formatLessonTitleFromSchedule(orderIndex, mappedItem.title)
      : title.trim() || formatLessonTitleFromSchedule(orderIndex, mappedItem?.title);

  const contextBlocks: string[] = [
    `Disciplina: ${subjectName}`,
    `Aula alvo: #${orderIndex} de ${context.total_lessons || '?'}`,
    `Título oficial da aula (para o card no cronograma): ${effectiveTitle}`,
    period ? `Período/Bimestre: ${period}` : '',
    lessonDate ? `Data prevista no cronograma: ${lessonDate}` : '',
    previousLessonTitle ? `Aula anterior no cronograma: ${previousLessonTitle}` : '',
    nextLessonTitle ? `Próxima aula no cronograma: ${nextLessonTitle}` : '',
  ].filter(Boolean);

  if (context.syllabus_text?.trim()) {
    contextBlocks.push('', '--- EMENTA, ESCOPO E DIRETRIZES DA DISCIPLINA ---', context.syllabus_text.trim());
  }

  if (mappedItem) {
    contextBlocks.push(
      '',
      '--- ITEM DO CRONOGRAMA EXTRAÍDO DOS PDFs ---',
      `Título sugerido: ${mappedItem.title}`,
      mappedItem.objectives ? `Objetivos: ${mappedItem.objectives}` : '',
      mappedItem.topics?.length ? `Tópicos previstos: ${mappedItem.topics.join('; ')}` : ''
    );
  }

  if (existingLesson?.content?.trim()) {
    contextBlocks.push(
      '',
      '--- OBSERVAÇÃO SOBRE AULA EXISTENTE ---',
      'Esta aula já existe no cronograma e seu conteúdo atual será SUBSTITUÍDO pelo novo material gerado.'
    );
  }

  if (extraInstructions?.trim()) {
    contextBlocks.push('', '--- INSTRUÇÕES ADICIONAIS DO PROFESSOR ---', extraInstructions.trim());
  }

  if (generateTarget === 'both') {
    if (hasContentTemplate) {
      contextBlocks.push(
        '',
        '--- MODELO OBRIGATÓRIO PARA O CONTEÚDO DA AULA ---',
        context.content_template.trim()
      );
    }
    if (hasPlanTemplate) {
      contextBlocks.push(
        '',
        '--- MODELO OBRIGATÓRIO PARA O PLANO DE AULA (DOCENTE) ---',
        context.lesson_plan_template.trim()
      );
    }

    contextBlocks.push(
      '',
      'Retorne EXCLUSIVAMENTE um JSON válido com a estrutura:',
      '{',
      `  "title": "Título final da aula preservando o título do cronograma (${effectiveTitle})",`,
      '  "content": "Conteúdo completo da aula em Markdown seguindo rigorosamente o modelo de conteúdo (sem envolver em bloco ```markdown)",',
      '  "lessonPlan": "Plano de aula do professor em Markdown seguindo o modelo de plano de aula (sem envolver em bloco ```markdown)"',
      '}'
    );

    const res = await generateWithTeacherAi(teacherId, {
      prompt: contextBlocks.join('\n'),
      systemInstruction:
        'Você é um professor especialista em Educação Profissional e Tecnológica. Gere material didático completo em português do Brasil, seguindo RIGOROSAMENTE a estrutura e formatação dos modelos fornecidos. Responda apenas com JSON válido.',
      responseMimeType: 'application/json',
      temperature: 0.5,
      configId,
      fallbackOnError: true,
    });

    const parsed = JSON.parse(stripMarkdownJsonFence(res.text)) as {
      title?: string;
      content?: string;
      lessonPlan?: string;
    };

    const parsedTitle = (parsed.title || '').trim();
    const finalTitle =
      parsedTitle && !/^aula\s*\d+\s*$/i.test(parsedTitle) ? parsedTitle : effectiveTitle;

    return {
      title: finalTitle,
      content: stripOuterMarkdownFence(parsed.content || ''),
      lessonPlan: stripOuterMarkdownFence(parsed.lessonPlan || ''),
      model: res.model,
    };
  }

  const isPlanOnly = generateTarget === 'plan';
  const activeTemplate = isPlanOnly
    ? context.lesson_plan_template?.trim() || context.content_template?.trim()
    : context.content_template?.trim();

  if (activeTemplate) {
    contextBlocks.push(
      '',
      `--- MODELO OBRIGATÓRIO PARA ${isPlanOnly ? 'O PLANO DE AULA' : 'O CONTEÚDO DA AULA'} ---`,
      activeTemplate,
      '',
      'INSTRUÇÃO CRÍTICA: Siga RIGOROSAMENTE todas as seções, títulos, formatação Markdown e estilo do modelo acima. Substitua os placeholders/exemplos do modelo pelo conteúdo real desta aula.'
    );
  }

  contextBlocks.push(
    '',
    `Entregue apenas o Markdown final ${isPlanOnly ? 'do Plano de Aula' : 'do Conteúdo da Aula'}, sem textos introdutórios e sem envolver tudo em blocos \`\`\`markdown.`
  );

  const res = await generateWithTeacherAi(teacherId, {
    prompt: contextBlocks.join('\n'),
    systemInstruction:
      'Você é um professor especialista em Educação Profissional e Tecnológica (Curso Técnico em Informática). Gere material didático claro, prático e bem estruturado em Markdown (português do Brasil), respeitando fielmente o modelo da disciplina.',
    temperature: 0.5,
    configId,
    fallbackOnError: true,
  });

  const cleanedText = stripOuterMarkdownFence(res.text);

  return {
    title: effectiveTitle,
    content: isPlanOnly ? undefined : cleanedText,
    lessonPlan: isPlanOnly ? cleanedText : undefined,
    model: res.model,
  };
}
