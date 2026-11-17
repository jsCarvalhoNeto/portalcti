import { supabase } from '@/lib/supabaseClient';
import { subjectService } from './subjectService';
import { getSubjectAiContext, saveSubjectAiContext } from './subjectAiContextService';
import { Subject } from '@/types/subject';

export interface CloneSubjectOptions {
  sourceSubject: Subject;
  teacherId: string;
  newName: string;
  newYear?: number;
  newSemester?: string;
  newGrade?: '1º Ano' | '2º Ano' | '3º Ano' | '';
  newSchedule?: string;
  dateShiftDays?: number;
  include: {
    lessons: boolean;
    resources: boolean;
    activities: boolean;
    contents: boolean;
    aiContext: boolean;
  };
}

export interface CloneSubjectResult {
  newSubject: Subject;
  counts: {
    lessons: number;
    resources: number;
    activities: number;
    contents: number;
    aiContext: boolean;
  };
}

function shiftDateString(dateStr: string | null | undefined, shiftDays: number): string | null {
  if (!dateStr) return null;
  if (!shiftDays) return dateStr;

  const trimmed = dateStr.trim();
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(trimmed);
  const parsed = new Date(isDateOnly ? `${trimmed}T12:00:00Z` : trimmed);
  if (Number.isNaN(parsed.getTime())) return dateStr;

  parsed.setUTCDate(parsed.getUTCDate() + shiftDays);
  if (isDateOnly) {
    return parsed.toISOString().slice(0, 10);
  }
  return parsed.toISOString();
}

export async function cloneSubjectStructure(
  options: CloneSubjectOptions
): Promise<CloneSubjectResult> {
  const {
    sourceSubject,
    teacherId,
    newName,
    newYear,
    newSemester,
    newGrade,
    newSchedule,
    dateShiftDays = 0,
    include,
  } = options;

  const sourceId = Number(sourceSubject.id);
  if (!sourceId || Number.isNaN(sourceId)) {
    throw new Error('Disciplina de origem inválida.');
  }

  // 1. Criar nova disciplina preservando metadados principais
  const existingTeacherIds = Array.isArray(sourceSubject.teacher_ids)
    ? sourceSubject.teacher_ids.filter(Boolean)
    : [];
  const mergedTeacherIds = Array.from(
    new Set([teacherId, ...existingTeacherIds].filter(Boolean))
  );

  const newSubject = await subjectService.create({
    name: newName.trim(),
    description: sourceSubject.description || undefined,
    teacher_id: teacherId,
    teacher_ids: mergedTeacherIds,
    schedule: newSchedule !== undefined ? newSchedule : sourceSubject.schedule,
    max_students: sourceSubject.max_students || 50,
    grade: (newGrade || sourceSubject.grade) as any,
    workload_hours: sourceSubject.workload_hours,
    semester: newSemester !== undefined ? newSemester : sourceSubject.semester,
    period: sourceSubject.period,
    periods: sourceSubject.periods,
    year: newYear || new Date().getFullYear(),
    color: sourceSubject.color || '#4F46E5',
  });

  const targetId = Number(newSubject.id);
  const now = new Date().toISOString();

  const counts = {
    lessons: 0,
    resources: 0,
    activities: 0,
    contents: 0,
    aiContext: false,
  };

  // 2. Clonar seções de conteúdo (subject_content)
  if (include.contents) {
    const { data: contents } = await supabase
      .from('subject_content')
      .select('section_type, title, content, order_index, is_active')
      .eq('subject_id', sourceId);

    if (contents && contents.length > 0) {
      const rows = contents.map((c: any) => ({
        subject_id: targetId,
        section_type: c.section_type,
        title: c.title,
        content: c.content,
        order_index: c.order_index ?? 0,
        is_active: c.is_active ?? true,
        created_at: now,
        updated_at: now,
      }));
      const { error } = await supabase.from('subject_content').insert(rows);
      if (!error) counts.contents = rows.length;
    }
  }

  // 3. Clonar cronograma de aulas (subject_lessons) com ajuste de datas e reset de conclusão
  if (include.lessons) {
    const { data: lessons } = await supabase
      .from('subject_lessons')
      .select(
        'title, lesson_date, content, lesson_plan, period, evaluation_type, pdf_url, presentation_url, video_url, order_index'
      )
      .eq('subject_id', sourceId)
      .order('order_index', { ascending: true });

    if (lessons && lessons.length > 0) {
      const rows = lessons.map((l: any, idx: number) => ({
        subject_id: targetId,
        teacher_id: teacherId,
        title: l.title,
        lesson_date: shiftDateString(l.lesson_date, dateShiftDays),
        content: l.content ?? '',
        lesson_plan: l.lesson_plan ?? null,
        is_completed: false,
        period: l.period || 'none',
        evaluation_type: l.evaluation_type || 'none',
        pdf_url: l.pdf_url ?? null,
        presentation_url: l.presentation_url ?? null,
        video_url: l.video_url ?? null,
        order_index: l.order_index ?? idx,
        created_at: now,
        updated_at: now,
      }));
      const { error } = await supabase.from('subject_lessons').insert(rows);
      if (!error) counts.lessons = rows.length;
    }
  }

  // 4. Clonar materiais e recursos (subject_resources)
  if (include.resources) {
    const { data: resources } = await supabase
      .from('subject_resources')
      .select('title, resource_type, description, url, file_path')
      .eq('subject_id', sourceId);

    if (resources && resources.length > 0) {
      const rows = resources.map((r: any) => ({
        subject_id: targetId,
        title: r.title,
        resource_type: r.resource_type || 'livro',
        description: r.description ?? '',
        url: r.url ?? null,
        file_path: r.file_path ?? null,
        created_at: now,
        updated_at: now,
      }));
      const { error } = await supabase.from('subject_resources').insert(rows);
      if (!error) counts.resources = rows.length;
    }
  }

  // 5. Clonar exercícios, projetos e avaliações (activities)
  if (include.activities) {
    const { data: activities } = await supabase
      .from('activities')
      .select(
        'name, grade, period, evaluation_type, type, description, deadline, file_path, file_name, max_score, weight, auto_grade'
      )
      .eq('subject_id', sourceId);

    if (activities && activities.length > 0) {
      const rows = activities.map((a: any) => ({
        subject_id: targetId,
        teacher_id: teacherId,
        name: a.name,
        grade: newGrade || a.grade || sourceSubject.grade || '1º Ano',
        period: a.period || '1º Bimestre',
        evaluation_type: a.evaluation_type || 'Avaliação Parcial',
        type: a.type || 'exercicio',
        description: a.description ?? '',
        deadline: shiftDateString(a.deadline, dateShiftDays),
        file_path: a.file_path ?? null,
        file_name: a.file_name ?? null,
        max_score: a.max_score ?? 10,
        weight: a.weight ?? 1,
        auto_grade: a.auto_grade ?? false,
        created_at: now,
        updated_at: now,
      }));
      const { error } = await supabase.from('activities').insert(rows);
      if (!error) counts.activities = rows.length;
    }
  }

  // 6. Clonar contexto de IA da disciplina (subject_ai_contexts)
  if (include.aiContext) {
    try {
      const sourceAi = await getSubjectAiContext(sourceId);
      const hasAiData =
        Boolean(sourceAi.syllabus_text?.trim()) ||
        Boolean(sourceAi.content_template?.trim()) ||
        Boolean(sourceAi.lesson_plan_template?.trim()) ||
        (Array.isArray(sourceAi.schedule_map) && sourceAi.schedule_map.length > 0);

      if (hasAiData) {
        const shiftedMap = (sourceAi.schedule_map || []).map((item) => ({
          ...item,
          suggested_date: shiftDateString(item.suggested_date, dateShiftDays),
        }));

        await saveSubjectAiContext({
          subject_id: targetId,
          teacher_id: teacherId,
          total_lessons: sourceAi.total_lessons,
          syllabus_text: sourceAi.syllabus_text || '',
          schedule_map: shiftedMap,
          content_template: sourceAi.content_template || '',
          lesson_plan_template: sourceAi.lesson_plan_template || '',
          source_files: sourceAi.source_files || [],
        });
        counts.aiContext = true;
      }
    } catch (err) {
      console.warn('Não foi possível clonar o contexto de IA da disciplina:', err);
    }
  }

  return {
    newSubject,
    counts,
  };
}
