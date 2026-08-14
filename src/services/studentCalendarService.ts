import { supabase } from '../lib/supabaseClient';
import { CalendarEvent } from './teacherDashboardService';

/**
 * Serviços para Calendário do Aluno usando o Supabase
 */

/**
 * Busca todos os eventos do calendário (públicos)
 */
export async function getStudentCalendarEvents(): Promise<CalendarEvent[]> {
  try {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;

    return (data || []).map((event: any) => ({
      ...event,
      id: Number(event.id),
      image_path: event.image_path || undefined
    }));
  } catch (error) {
    console.error('Erro ao buscar eventos do calendário para aluno no Supabase:', error);
    throw error;
  }
}

/**
 * Busca eventos do calendário por intervalo de datas
 */
export async function getStudentCalendarEventsByDateRange(startDate: string, endDate: string): Promise<CalendarEvent[]> {
  try {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) throw error;

    return (data || []).map((event: any) => ({
      ...event,
      id: Number(event.id)
    }));
  } catch (error) {
    console.error('Erro ao buscar eventos por data para aluno no Supabase:', error);
    throw error;
  }
}

/**
 * Busca eventos do calendário relacionados às disciplinas do aluno
 */
export async function getStudentSubjectCalendarEvents(studentId: string): Promise<CalendarEvent[]> {
  try {
    // 1. Buscar disciplinas do aluno via matrículas
    const { data: enrolls, error: enrollError } = await supabase
      .from('enrollments')
      .select('subject_id')
      .eq('student_id', studentId);

    if (enrollError) throw enrollError;

    const subjectIds = (enrolls || []).map((enroll: any) => enroll.subject_id);
    
    if (subjectIds.length > 0) {
      // 2. Buscar eventos relacionados a essas disciplinas
      const { data: events, error: eventError } = await supabase
        .from('calendar_events')
        .select('*')
        .in('subject_id', subjectIds)
        .order('date', { ascending: true });

      if (eventError) throw eventError;

      return (events || []).map((event: any) => ({
        ...event,
        id: Number(event.id)
      }));
    }
    return [];
  } catch (error) {
    console.error('Erro ao buscar eventos de disciplinas para aluno no Supabase:', error);
    throw error;
  }
}

