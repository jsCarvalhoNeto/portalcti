import api from './api';
import { CalendarEvent } from './teacherDashboardService';

/**
 * Serviços para Calendário do Aluno
 * Integração com a API real para eventos de calendário
 */

/**
 * Busca todos os eventos do calendário (públicos)
 */
export async function getStudentCalendarEvents(): Promise<CalendarEvent[]> {
  try {
    const response = await api.get(`/calendar-events`);
    // Mapear os eventos para garantir que o campo image_path esteja incluído
    const events = response.data.data;
    return events.map((event: any) => ({
      ...event,
      image_path: event.image_path || undefined
    }));
  } catch (error) {
    console.error('Erro ao buscar eventos do calendário para aluno:', error);
    throw error;
  }
}

/**
 * Busca eventos do calendário por intervalo de datas
 */
export async function getStudentCalendarEventsByDateRange(startDate: string, endDate: string): Promise<CalendarEvent[]> {
  try {
    const response = await api.get(`/calendar-events/date-range`, {
      params: { startDate, endDate }
    });
    return response.data.data;
  } catch (error) {
    console.error('Erro ao buscar eventos por data para aluno:', error);
    throw error;
  }
}

/**
 * Busca eventos do calendário relacionados às disciplinas do aluno
 */
export async function getStudentSubjectCalendarEvents(studentId: string): Promise<CalendarEvent[]> {
  try {
    // Primeiro buscar as disciplinas do aluno
    const response = await api.get(`/students/${studentId}/subjects`);
    const subjects = response.data;
    
    // Depois buscar eventos relacionados a essas disciplinas
    if (subjects.length > 0) {
      const subjectIds = subjects.map((subject: any) => subject.id).join(',');
      const eventResponse = await api.get(`/calendar-events`, {
        params: { subject_ids: subjectIds }
      });
      return eventResponse.data.data;
    }
    return [];
  } catch (error) {
    console.error('Erro ao buscar eventos de disciplinas para aluno:', error);
    throw error;
  }
}
