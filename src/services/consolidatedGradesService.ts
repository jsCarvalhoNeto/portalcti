import { supabase } from '../lib/supabaseClient';

export interface ConsolidatedSubject {
  id: number;
  name: string;
  grade?: string;
  semester?: string;
  period?: string;
  teacher_id?: string | number | null;
}

export interface StudentConsolidatedRow {
  enrollment_id: number;
  student_id: string;
  student_name: string;
  student_email: string;
  student_registration?: string;
  student_grade?: string; // Turma/Série do aluno
  parcial_grade: number | null;
  parcial_activities_count: number;
  global_grade: number | null;
  global_activities_count: number;
  other_activities_grade: number | null;
  other_activities_count: number;
  extra_points: number;
  extra_points_notes: string;
  final_grade: number | null;
  status: 'approved' | 'recovery' | 'in_progress' | 'no_data';
  activities_details: Array<{
    activity_id: number;
    activity_name: string;
    evaluation_type: string | null;
    grade: number | null;
  }>;
}

export interface ConsolidatedPeriodReport {
  subject: ConsolidatedSubject;
  period: string;
  grade_filter: string;
  total_students: number;
  average_class_grade: number;
  approved_count: number;
  recovery_count: number;
  students: StudentConsolidatedRow[];
  activities: Array<{
    id: number;
    name: string;
    evaluation_type: string | null;
    type: string;
    deadline?: string;
  }>;
}

const LOCAL_STORAGE_EXTRA_POINTS_KEY = 'portalcti_extra_points_cache';

function getLocalExtraPoints(enrollmentId: number, period: string): { points: number; notes: string } {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_EXTRA_POINTS_KEY);
    if (!raw) return { points: 0, notes: '' };
    const parsed = JSON.parse(raw);
    const key = `${enrollmentId}_${period}`;
    return parsed[key] || { points: 0, notes: '' };
  } catch {
    return { points: 0, notes: '' };
  }
}

function setLocalExtraPoints(enrollmentId: number, period: string, points: number, notes: string): void {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_EXTRA_POINTS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const key = `${enrollmentId}_${period}`;
    parsed[key] = { points, notes };
    localStorage.setItem(LOCAL_STORAGE_EXTRA_POINTS_KEY, JSON.stringify(parsed));
  } catch (e) {
    console.warn('Erro ao salvar pontos extras no localStorage:', e);
  }
}

/**
 * Busca disciplinas vinculadas ao professor
 */
export async function getConsolidatedTeacherSubjects(teacherId: string): Promise<ConsolidatedSubject[]> {
  try {
    if (!teacherId) return [];

    // 1. Disciplinas de teacher_subjects
    const { data: assigned } = await supabase
      .from('teacher_subjects')
      .select('subject_id')
      .eq('teacher_id', teacherId);

    const assignedIds = (assigned || []).map((a: any) => Number(a.subject_id));

    // 2. Disciplinas diretas
    const { data: directSubjects } = await supabase
      .from('subjects')
      .select('id, name, grade, semester, period, teacher_id')
      .eq('teacher_id', teacherId);

    const directIds = (directSubjects || []).map((s: any) => Number(s.id));
    const allIds = Array.from(new Set([...assignedIds, ...directIds]));

    if (allIds.length === 0) return [];

    const { data: allSubjects, error } = await supabase
      .from('subjects')
      .select('id, name, grade, semester, period, teacher_id')
      .in('id', allIds)
      .order('name');

    if (error) throw error;

    return (allSubjects || []).map((s: any) => ({
      id: Number(s.id),
      name: s.name,
      grade: s.grade || '',
      semester: s.semester || '',
      period: s.period || '',
      teacher_id: s.teacher_id
    }));
  } catch (err) {
    console.error('Erro ao buscar disciplinas consolidadas do professor:', err);
    return [];
  }
}

/**
 * Busca notas consolidadas da turma por disciplina e período
 */
export async function getConsolidatedPeriodGrades(
  subjectId: number,
  period: string,
  gradeFilter?: string
): Promise<ConsolidatedPeriodReport | null> {
  try {
    if (!subjectId) return null;

    // 1. Buscar dados da disciplina
    const { data: subjectData } = await supabase
      .from('subjects')
      .select('id, name, grade, semester, period, teacher_id')
      .eq('id', subjectId)
      .single();

    if (!subjectData) return null;

    const subject: ConsolidatedSubject = {
      id: Number(subjectData.id),
      name: subjectData.name,
      grade: subjectData.grade || '',
      semester: subjectData.semester || '',
      period: subjectData.period || '',
      teacher_id: subjectData.teacher_id
    };

    // 2. Buscar alunos matriculados na disciplina
    const { data: enrollmentsData, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select(`
        id,
        student_id,
        profiles!inner (
          id,
          full_name,
          email,
          student_registration,
          grade
        )
      `)
      .eq('subject_id', subjectId);

    if (enrollmentsError) throw enrollmentsError;

    let enrollments = (enrollmentsData || []).map((e: any) => ({
      enrollment_id: Number(e.id),
      student_id: e.student_id,
      full_name: e.profiles?.full_name || 'Aluno sem nome',
      email: e.profiles?.email || '',
      student_registration: e.profiles?.student_registration || '',
      grade: e.profiles?.grade || subject.grade || ''
    }));

    // Se houver filtro de série/turma e não for "all"
    if (gradeFilter && gradeFilter !== 'all') {
      enrollments = enrollments.filter(e => {
        const studentGrade = (e.grade || '').toLowerCase();
        const filter = gradeFilter.toLowerCase();
        return studentGrade.includes(filter) || filter.includes(studentGrade);
      });
    }

    // Ordenar alunos por nome alfabético
    enrollments.sort((a, b) => a.full_name.localeCompare(b.full_name));

    // 3. Buscar atividades da disciplina para este período
    // Se o período for especificado (ex: '3º Período'), busca atividades daquele período ou sem período definido
    let activitiesQuery = supabase
      .from('activities')
      .select('id, name, period, evaluation_type, type, deadline, grade')
      .eq('subject_id', subjectId);

    if (period && period !== 'all') {
      activitiesQuery = activitiesQuery.eq('period', period);
    }

    const { data: activitiesData, error: activitiesError } = await activitiesQuery;
    if (activitiesError) throw activitiesError;

    const activities = (activitiesData || []).map((a: any) => ({
      id: Number(a.id),
      name: a.name,
      evaluation_type: a.evaluation_type || null,
      type: a.type || 'individual',
      deadline: a.deadline || undefined,
      grade: a.grade || ''
    }));

    const activityIds = activities.map(a => a.id);
    const enrollmentIds = enrollments.map(e => e.enrollment_id);

    // 4. Buscar notas de activity_grades para essas atividades e matrículas
    let gradesMap: Record<string, number> = {}; // key: `${enrollment_id}_${activity_id}`
    if (activityIds.length > 0 && enrollmentIds.length > 0) {
      const { data: gradesData, error: gradesError } = await supabase
        .from('activity_grades')
        .select('activity_id, enrollment_id, grade')
        .in('activity_id', activityIds)
        .in('enrollment_id', enrollmentIds);

      if (!gradesError && gradesData) {
        gradesData.forEach((g: any) => {
          if (g.grade !== null && g.grade !== undefined) {
            const key = `${g.enrollment_id}_${g.activity_id}`;
            gradesMap[key] = Number(g.grade);
          }
        });
      }
    }

    // 5. Buscar pontos extras do período
    let extraPointsMap: Record<number, { points: number; notes: string }> = {};
    if (enrollmentIds.length > 0) {
      try {
        const { data: extraData, error: extraError } = await supabase
          .from('student_period_extra_points')
          .select('enrollment_id, extra_points, notes')
          .eq('period', period)
          .in('enrollment_id', enrollmentIds);

        if (!extraError && extraData) {
          extraData.forEach((item: any) => {
            extraPointsMap[Number(item.enrollment_id)] = {
              points: Number(item.extra_points || 0),
              notes: item.notes || ''
            };
          });
        }
      } catch (e) {
        console.warn('Tabela student_period_extra_points indisponível, usando fallback:', e);
      }
    }

    // 6. Montar as linhas consolidadas por aluno
    const studentsRows: StudentConsolidatedRow[] = enrollments.map(enrollment => {
      // Obter pontos extras (do banco ou local fallback)
      const extraFromDb = extraPointsMap[enrollment.enrollment_id];
      const extraLocal = getLocalExtraPoints(enrollment.enrollment_id, period);
      const extraPoints = extraFromDb ? extraFromDb.points : extraLocal.points;
      const extraNotes = extraFromDb ? extraFromDb.notes : extraLocal.notes;

      // Classificar notas por tipo de avaliação
      let parcialScores: number[] = [];
      let globalScores: number[] = [];
      let otherScores: number[] = [];
      const activitiesDetails: StudentConsolidatedRow['activities_details'] = [];

      activities.forEach(activity => {
        const key = `${enrollment.enrollment_id}_${activity.id}`;
        const score = gradesMap[key] !== undefined ? gradesMap[key] : null;

        activitiesDetails.push({
          activity_id: activity.id,
          activity_name: activity.name,
          evaluation_type: activity.evaluation_type,
          grade: score
        });

        if (score !== null) {
          const evalType = (activity.evaluation_type || '').toLowerCase();
          if (evalType.includes('parcial')) {
            parcialScores.push(score);
          } else if (evalType.includes('global')) {
            globalScores.push(score);
          } else {
            otherScores.push(score);
          }
        }
      });

      // Cálculo de Parcial (AV1)
      const parcialGrade = parcialScores.length > 0
        ? Number((parcialScores.reduce((acc, v) => acc + v, 0) / parcialScores.length).toFixed(1))
        : null;

      // Cálculo de Global (AV2)
      const globalGrade = globalScores.length > 0
        ? Number((globalScores.reduce((acc, v) => acc + v, 0) / globalScores.length).toFixed(1))
        : null;

      // Cálculo de Outras Atividades
      const otherGrade = otherScores.length > 0
        ? Number((otherScores.reduce((acc, v) => acc + v, 0) / otherScores.length).toFixed(1))
        : null;

      // Cálculo da Nota Final do Período
      // Regra comum: Se tiver AV1 e AV2 -> média ou soma.
      // Caso as notas estejam na escala 0 a 10:
      let finalGrade: number | null = null;

      if (parcialGrade !== null || globalGrade !== null || otherGrade !== null) {
        // Coleta as notas avaliadas
        const validGrades: number[] = [];
        if (parcialGrade !== null) validGrades.push(parcialGrade);
        if (globalGrade !== null) validGrades.push(globalGrade);
        if (otherGrade !== null && parcialGrade === null && globalGrade === null) {
          validGrades.push(otherGrade);
        }

        if (validGrades.length > 0) {
          const baseAverage = validGrades.reduce((a, b) => a + b, 0) / validGrades.length;
          // Soma com os pontos extras, respeitando limite de 10.0
          const computed = Math.min(10, Number((baseAverage + extraPoints).toFixed(1)));
          finalGrade = computed;
        }
      } else if (extraPoints > 0) {
        finalGrade = Math.min(10, extraPoints);
      }

      // Status
      let status: StudentConsolidatedRow['status'] = 'no_data';
      if (finalGrade !== null) {
        if (finalGrade >= 6.0) {
          status = 'approved';
        } else if (parcialScores.length > 0 && globalScores.length === 0) {
          status = 'in_progress';
        } else {
          status = 'recovery';
        }
      }

      return {
        enrollment_id: enrollment.enrollment_id,
        student_id: enrollment.student_id,
        student_name: enrollment.full_name,
        student_email: enrollment.email,
        student_registration: enrollment.student_registration,
        student_grade: enrollment.grade,
        parcial_grade: parcialGrade,
        parcial_activities_count: parcialScores.length,
        global_grade: globalGrade,
        global_activities_count: globalScores.length,
        other_activities_grade: otherGrade,
        other_activities_count: otherScores.length,
        extra_points: extraPoints,
        extra_points_notes: extraNotes,
        final_grade: finalGrade,
        status,
        activities_details: activitiesDetails
      };
    });

    // 7. Estatísticas gerais da turma
    const studentsWithGrade = studentsRows.filter(s => s.final_grade !== null);
    const averageClassGrade = studentsWithGrade.length > 0
      ? Number((studentsWithGrade.reduce((sum, s) => sum + (s.final_grade || 0), 0) / studentsWithGrade.length).toFixed(1))
      : 0;
    const approvedCount = studentsRows.filter(s => s.status === 'approved').length;
    const recoveryCount = studentsRows.filter(s => s.status === 'recovery').length;

    return {
      subject,
      period,
      grade_filter: gradeFilter || 'all',
      total_students: studentsRows.length,
      average_class_grade: averageClassGrade,
      approved_count: approvedCount,
      recovery_count: recoveryCount,
      students: studentsRows,
      activities
    };
  } catch (err) {
    console.error('Erro ao buscar relatório consolidado de notas:', err);
    return null;
  }
}

/**
 * Salva ou atualiza os pontos extras de um aluno
 */
export async function saveStudentExtraPoints(
  enrollmentId: number,
  subjectId: number,
  period: string,
  extraPoints: number,
  notes: string = '',
  teacherId?: string
): Promise<boolean> {
  // Salva no localStorage como garantia imediata
  setLocalExtraPoints(enrollmentId, period, extraPoints, notes);

  try {
    const { error } = await supabase
      .from('student_period_extra_points')
      .upsert(
        {
          enrollment_id: enrollmentId,
          subject_id: subjectId,
          period: period,
          extra_points: extraPoints,
          notes: notes,
          teacher_id: teacherId || null,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'enrollment_id,period' }
      );

    if (error) {
      console.warn('Erro ao salvar no Supabase (mantido no cache local):', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Exceção ao salvar pontos extras:', err);
    return false;
  }
}
