import { supabase } from '../lib/supabaseClient';

/**
 * Serviços para o Painel do Professor
 * Integração direta com o Supabase
 */

export interface Subject {
  id: number;
  name: string;
  description?: string;
  teacher_id?: string | number | null;
  schedule?: string;
  max_students: number;
  current_students?: number;
  grade?: string;
  color?: string; // Cor hexadecimal para o card da disciplina (ex: #3B82F6)
  semester?: string;
  period?: string;
  periods?: string[];
  year?: number;
}

export interface Student {
  id: string;
  full_name: string;
  email: string;
  student_registration?: string;
  phone?: string;
  grade?: string;
  enrolled_subjects?: number;
}

export interface Activity {
  id: string;
  name: string;
  subject_id: number;
  subject_name: string;
  grade: string;
  type: 'individual' | 'team';
  teacher_id: string;
  created_at: string;
  updated_at?: string;
  description?: string;
  file_path?: string;
  file_name?: string;
  deadline?: string;
  period?: string;
  evaluation_type?: string;
}

export interface ActivityGrade {
  id: number;
  activity_id: number;
  enrollment_id: number;
  grade: number;
  graded_at: string;
  graded_by?: string;
  student_name: string;
  student_email: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  type: 'class' | 'exam' | 'deadline' | 'meeting';
  subject_id?: number;
  subject_name?: string;
  description?: string;
  image_path?: string;
}

export interface UserProfile {
  full_name?: string;
  email: string;
  phone?: string;
  department?: string;
  hire_date?: string;
}

/**
 * Busca todas as disciplinas do professor
 */
export async function getTeacherSubjects(teacherId: string): Promise<Subject[]> {
  try {
    if (!teacherId) return [];

    // 1. Buscar IDs de teacher_subjects
    const { data: assigned } = await supabase
      .from('teacher_subjects')
      .select('subject_id')
      .eq('teacher_id', teacherId);

    const assignedIds = (assigned || []).map((a: any) => Number(a.subject_id));

    // 2. Buscar IDs de subjects onde teacher_id direto é o professor
    const { data: directSubjects } = await supabase
      .from('subjects')
      .select('id')
      .eq('teacher_id', teacherId);

    const directIds = (directSubjects || []).map((s: any) => Number(s.id));

    const allSubjectIds = Array.from(new Set([...assignedIds, ...directIds]));
    if (allSubjectIds.length === 0) return [];

    // 3. Buscar os dados completos das disciplinas
    const { data: subjectsData, error: subjectsError } = await supabase
      .from('subjects')
      .select('*')
      .in('id', allSubjectIds)
      .order('name', { ascending: true });

    if (subjectsError) {
      console.error('Erro ao buscar disciplinas no Supabase:', subjectsError);
      throw subjectsError;
    }

    if (!subjectsData || subjectsData.length === 0) return [];

    // 4. Buscar contagem de alunos matriculados por disciplina
    const { data: enrollmentsData } = await supabase
      .from('enrollments')
      .select('subject_id')
      .in('subject_id', allSubjectIds);

    const enrollmentCounts: Record<number, number> = {};
    (enrollmentsData || []).forEach((item: any) => {
      const sId = Number(item.subject_id);
      enrollmentCounts[sId] = (enrollmentCounts[sId] || 0) + 1;
    });

    return subjectsData.map(s => ({
      ...s,
      id: Number(s.id),
      max_students: s.max_students || 50,
      current_students: enrollmentCounts[Number(s.id)] || 0,
      color: s.color || '#4F46E5'
    }));
  } catch (error) {
    console.error('Erro ao buscar disciplinas do professor:', error);
    return [];
  }
}

/**
 * Busca atividades criadas pelo professor
 */
export async function getTeacherActivities(teacherId: string): Promise<Activity[]> {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select(`
        id,
        name,
        subject_id,
        grade,
        type,
        teacher_id,
        created_at,
        updated_at,
        subjects(name)
      `)
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar atividades no Supabase:', error);
      throw error;
    }

    return (data || []).map((activity: any) => ({
      id: activity.id.toString(),
      name: activity.name,
      subject_id: Number(activity.subject_id),
      subject_name: activity.subjects?.name || 'Disciplina',
      grade: activity.grade || '',
      type: activity.type || 'individual',
      teacher_id: activity.teacher_id,
      created_at: activity.created_at,
      updated_at: activity.updated_at
    }));
  } catch (error) {
    console.error('Erro ao buscar atividades do professor:', error);
    return [];
  }
}

/**
 * Busca todas as notas de atividades de um professor
 */
export async function getTeacherActivityGrades(teacherId: string): Promise<ActivityGrade[]> {
  try {
    const { data, error } = await supabase
      .from('activity_grades')
      .select(`
        id,
        activity_id,
        enrollment_id,
        grade,
        submitted_at,
        activities!inner(
          teacher_id
        ),
        enrollments!inner(
          student_id,
          profiles!inner(
            full_name,
            email
          )
        )
      `)
      .eq('activities.teacher_id', teacherId);

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: Number(item.id),
      activity_id: Number(item.activity_id),
      enrollment_id: Number(item.enrollment_id),
      grade: Number(item.grade),
      graded_at: item.submitted_at || '',
      student_name: item.enrollments?.profiles?.full_name || '',
      student_email: item.enrollments?.profiles?.email || ''
    }));
  } catch (error) {
    console.error('Erro ao buscar notas de atividades do professor:', error);
    return [];
  }
}

/**
 * Busca alunos por disciplina para atribuição de notas
 */
export async function getStudentsBySubject(subjectId: number): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        id,
        student_id,
        profiles!inner(
          id,
          full_name,
          email,
          student_registration,
          grade
        )
      `)
      .eq('subject_id', subjectId);

    if (error) throw error;

    return (data || []).map((item: any) => ({
      enrollment_id: Number(item.id),
      id: item.profiles.id,
      full_name: item.profiles.full_name,
      email: item.profiles.email,
      student_registration: item.profiles.student_registration,
      grade: item.profiles.grade
    }));
  } catch (error) {
    console.error('Erro ao buscar alunos por disciplina:', error);
    return [];
  }
}

/**
 * Busca todos os alunos matriculados em pelo menos uma disciplina do professor
 */
export async function getTeacherStudents(teacherId: string): Promise<Student[]> {
  try {
    if (!teacherId) return [];

    // 1. Buscar IDs das disciplinas do professor (de teacher_subjects e de subjects)
    const { data: assigned } = await supabase
      .from('teacher_subjects')
      .select('subject_id')
      .eq('teacher_id', teacherId);

    const assignedIds = (assigned || []).map((a: any) => Number(a.subject_id));

    const { data: directSubjects } = await supabase
      .from('subjects')
      .select('id')
      .eq('teacher_id', teacherId);

    const directIds = (directSubjects || []).map((s: any) => Number(s.id));

    const subjectIds = Array.from(new Set([...assignedIds, ...directIds]));

    // Se o professor não tem disciplinas vinculadas, ele não possui alunos
    if (subjectIds.length === 0) return [];

    // 2. Buscar matrículas em enrollments relacionadas a essas disciplinas
    const { data: enrollments, error } = await supabase
      .from('enrollments')
      .select(`
        subject_id,
        student_id,
        profiles!inner(
          id,
          full_name,
          email,
          student_registration,
          grade
        )
      `)
      .in('subject_id', subjectIds);

    if (error) {
      console.error('Erro ao buscar matrículas do professor:', error);
      throw error;
    }

    if (!enrollments || enrollments.length === 0) return [];

    const studentMap = new Map<string, Student>();
    enrollments.forEach((e: any) => {
      const profile = e.profiles;
      if (!profile) return;
      if (!studentMap.has(profile.id)) {
        studentMap.set(profile.id, {
          id: profile.id,
          full_name: profile.full_name,
          email: profile.email || '',
          student_registration: profile.student_registration || '',
          grade: profile.grade || '',
          enrolled_subjects: 1
        });
      } else {
        const existing = studentMap.get(profile.id)!;
        existing.enrolled_subjects = (existing.enrolled_subjects || 1) + 1;
      }
    });

    return Array.from(studentMap.values()).sort((a, b) =>
      (a.full_name || '').localeCompare(b.full_name || '')
    );
  } catch (error) {
    console.error('Erro ao buscar alunos do professor no Supabase:', error);
    return [];
  }
}

/**
 * Busca alunos por série ou todos (apenas com role student)
 */
export async function getStudentsByGrade(grade?: '1º Ano' | '2º Ano' | '3º Ano' | 'all' | string): Promise<Student[]> {
  try {
    // 1. Obter apenas IDs de estudantes
    const { data: studentRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'student');

    const studentIds = (studentRoles || []).map(r => r.user_id);
    if (studentIds.length === 0) return [];

    let query = supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        student_registration,
        grade
      `)
      .in('id', studentIds);

    if (grade && grade !== 'all') {
      query = query.eq('grade', grade);
    }

    const { data, error } = await query.order('full_name', { ascending: true });

    if (error) throw error;

    return (data || []).map((p: any) => ({
      id: p.id,
      full_name: p.full_name,
      email: p.email || '',
      student_registration: p.student_registration || '',
      grade: p.grade || '',
      enrolled_subjects: 0
    }));
  } catch (error) {
    console.error('Erro ao buscar alunos por série no Supabase:', error);
    return [];
  }
}

/**
 * Busca atividades pendentes para correção
 */
export async function getPendingActivities(teacherId: string): Promise<Activity[]> {
  try {
    const activities = await getTeacherActivities(teacherId);
    return activities;
  } catch (error) {
    console.error('Erro ao buscar atividades pendentes:', error);
    return [];
  }
}

/**
 * Busca eventos do calendário do professor
 */
export async function getTeacherCalendarEvents(teacherId: string): Promise<CalendarEvent[]> {
  try {
    const { data, error } = await supabase
      .from('calendar_events')
      .select(`
        id,
        title,
        date,
        time,
        type,
        subject_id,
        description,
        created_by,
        subjects(name)
      `)
      .order('date', { ascending: true });

    if (error) {
      console.error('Erro ao buscar eventos do calendário no Supabase:', error);
      throw error;
    }

    return (data || []).map((event: any) => ({
      id: event.id.toString(),
      title: event.title,
      date: event.date,
      time: event.time || '',
      type: event.type || 'class',
      subject_id: event.subject_id ? Number(event.subject_id) : undefined,
      subject_name: event.subjects?.name || undefined,
      description: event.description || ''
    }));
  } catch (error) {
    console.error('Erro ao buscar eventos do calendário:', error);
    return [];
  }
}

/**
 * Busca todos os eventos do calendário (públicos)
 */
export async function getAllCalendarEvents(): Promise<CalendarEvent[]> {
  try {
    const { data, error } = await supabase
      .from('calendar_events')
      .select(`
        id,
        title,
        date,
        time,
        type,
        subject_id,
        description,
        subjects(name)
      `)
      .order('date', { ascending: true });

    if (error) throw error;

    return (data || []).map((event: any) => ({
      id: event.id.toString(),
      title: event.title,
      date: event.date,
      time: event.time || '',
      type: event.type || 'class',
      subject_id: event.subject_id ? Number(event.subject_id) : undefined,
      subject_name: event.subjects?.name || undefined,
      description: event.description || ''
    }));
  } catch (error) {
    console.error('Erro ao buscar todos os eventos do calendário:', error);
    return [];
  }
}

/**
 * Busca eventos do calendário por intervalo de datas
 */
export async function getCalendarEventsByDateRange(startDate: string, endDate: string): Promise<CalendarEvent[]> {
  try {
    const { data, error } = await supabase
      .from('calendar_events')
      .select(`
        id,
        title,
        date,
        time,
        type,
        subject_id,
        description,
        subjects(name)
      `)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) throw error;

    return (data || []).map((event: any) => ({
      id: event.id.toString(),
      title: event.title,
      date: event.date,
      time: event.time || '',
      type: event.type || 'class',
      subject_id: event.subject_id ? Number(event.subject_id) : undefined,
      subject_name: event.subjects?.name || undefined,
      description: event.description || ''
    }));
  } catch (error) {
    console.error('Erro ao buscar eventos por data:', error);
    return [];
  }
}

/**
 * Cria um novo evento de calendário
 */
export async function createCalendarEvent(eventData: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        title: eventData.title,
        date: eventData.date,
        time: eventData.time || null,
        type: eventData.type || 'class',
        subject_id: eventData.subject_id || null,
        description: eventData.description || null,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id.toString(),
      title: data.title,
      date: data.date,
      time: data.time || '',
      type: data.type || 'class',
      subject_id: data.subject_id ? Number(data.subject_id) : undefined,
      description: data.description || ''
    };
  } catch (error: any) {
    console.error('Erro ao criar evento de calendário no Supabase:', error);
    throw new Error(error.message || 'Erro ao criar evento de calendário');
  }
}

/**
 * Atualiza um evento de calendário existente
 */
export async function updateCalendarEvent(eventId: string, eventData: Partial<CalendarEvent>): Promise<CalendarEvent> {
  try {
    const updatePayload: Record<string, any> = {};
    if (eventData.title !== undefined) updatePayload.title = eventData.title;
    if (eventData.date !== undefined) updatePayload.date = eventData.date;
    if (eventData.time !== undefined) updatePayload.time = eventData.time || null;
    if (eventData.type !== undefined) updatePayload.type = eventData.type;
    if (eventData.subject_id !== undefined) updatePayload.subject_id = eventData.subject_id || null;
    if (eventData.description !== undefined) updatePayload.description = eventData.description || null;

    const { data, error } = await supabase
      .from('calendar_events')
      .update(updatePayload)
      .eq('id', Number(eventId))
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id.toString(),
      title: data.title,
      date: data.date,
      time: data.time || '',
      type: data.type || 'class',
      subject_id: data.subject_id ? Number(data.subject_id) : undefined,
      description: data.description || ''
    };
  } catch (error: any) {
    console.error('Erro ao atualizar evento de calendário no Supabase:', error);
    throw new Error(error.message || 'Erro ao atualizar evento de calendário');
  }
}

/**
 * Deleta um evento de calendário
 */
export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', Number(eventId));

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao deletar evento de calendário no Supabase:', error);
    throw error;
  }
}

/**
 * Atualiza o perfil do professor
 */
export async function updateTeacherProfile(teacherId: string, data: Partial<UserProfile>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: data.full_name,
        email: data.email,
        updated_at: new Date().toISOString()
      })
      .eq('id', teacherId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao atualizar perfil do professor no Supabase:', error);
    throw error;
  }
}

/**
 * Altera a senha do professor
 */
export async function changeTeacherPassword(teacherId: string, newPassword: string): Promise<boolean> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao alterar senha do professor no Supabase:', error);
    throw error;
  }
}

/**
 * Cria uma nova disciplina
 */
export async function createSubject(teacherId: string, data: Partial<Subject>): Promise<Subject> {
  try {
    const { data: result, error } = await supabase
      .from('subjects')
      .insert({
        name: data.name,
        description: data.description || null,
        teacher_id: teacherId,
        schedule: data.schedule || null,
        max_students: data.max_students || 50,
        grade: data.grade || null,
        color: data.color || '#4F46E5',
        semester: data.semester || null,
        period: data.period || null,
        periods: data.periods || [],
        year: data.year || new Date().getFullYear()
      })
      .select()
      .single();

    if (error) throw error;
    return result as Subject;
  } catch (error) {
    console.error('Erro ao criar disciplina no Supabase:', error);
    throw error;
  }
}

/**
 * Atualiza uma disciplina existente
 */
export async function updateSubject(teacherId: string, subjectId: number, data: Partial<Subject>): Promise<Subject> {
  try {
    const updatePayload: Record<string, any> = {};
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.schedule !== undefined) updatePayload.schedule = data.schedule;
    if (data.max_students !== undefined) updatePayload.max_students = data.max_students;
    if (data.grade !== undefined) updatePayload.grade = data.grade;
    if (data.color !== undefined) updatePayload.color = data.color;
    if (data.semester !== undefined) updatePayload.semester = data.semester;
    if (data.period !== undefined) updatePayload.period = data.period;
    if (data.periods !== undefined) updatePayload.periods = data.periods;
    if (data.year !== undefined) updatePayload.year = data.year;

    const { data: result, error } = await supabase
      .from('subjects')
      .update(updatePayload)
      .eq('id', subjectId)
      .select()
      .single();

    if (error) throw error;
    return result as Subject;
  } catch (error) {
    console.error('Erro ao atualizar disciplina no Supabase:', error);
    throw error;
  }
}

/**
 * Remove uma disciplina
 */
export async function deleteSubject(teacherId: string, subjectId: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', subjectId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao remover disciplina no Supabase:', error);
    throw error;
  }
}
