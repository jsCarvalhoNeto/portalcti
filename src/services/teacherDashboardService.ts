import api from './api';

/**
 * Serviços para o Painel do Professor
 * Integração com a API real
 */

export interface Subject {
  id: number;
  name: string;
  description?: string;
  teacher_id: number;
  schedule?: string;
  max_students: number;
  current_students?: number;
  color?: string; // Cor hexadecimal para o card da disciplina (ex: #3B82F6)
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
  updated_at: string;
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
  graded_by: string;
  student_name: string;
  student_email: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
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
    const response = await api.get(`/teachers/${teacherId}/subjects`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar disciplinas do professor:', error);
    throw error;
  }
}

/**
 * Busca atividades criadas pelo professor
 */
export async function getTeacherActivities(teacherId: string): Promise<Activity[]> {
  try {
    const response = await api.get(`/activities/teacher/${teacherId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar atividades do professor:', error);
    throw error;
  }
}

/**
 * Busca todas as notas de atividades de um professor
 */
export async function getTeacherActivityGrades(teacherId: string): Promise<ActivityGrade[]> {
  try {
    const response = await api.get(`/teachers/${teacherId}/activity-grades`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar notas de atividades do professor:', error);
    throw error;
  }
}

/**
 * Busca alunos por disciplina para atribuição de notas
 */
export async function getStudentsBySubject(subjectId: number): Promise<any[]> {
  try {
    const response = await api.get(`/subjects/${subjectId}/students`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar alunos por disciplina:', error);
    throw error;
  }
}

/**
 * Busca todos os alunos de um professor (por disciplina)
 */
export async function getTeacherStudents(teacherId: string): Promise<Student[]> {
  try {
    const response = await api.get(`/teachers/${teacherId}/students`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar alunos do professor:', error);
    throw error;
  }
}

/**
 * Busca alunos por série
 */
export async function getStudentsByGrade(grade: '1º Ano' | '2º Ano' | '3º Ano'): Promise<Student[]> {
  try {
    const response = await api.get(`/students/grade/${grade}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar alunos por série:', error);
    throw error;
  }
}

/**
 * Busca atividades pendentes para correção
 */
export async function getPendingActivities(teacherId: string): Promise<Activity[]> {
  try {
    const response = await api.get(`/teachers/${teacherId}/activities/pending`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar atividades pendentes:', error);
    throw error;
  }
}

/**
 * Busca eventos do calendário do professor
 */
export async function getTeacherCalendarEvents(teacherId: string): Promise<CalendarEvent[]> {
  try {
    const response = await api.get(`/calendar-events/user/me`);
    return response.data.data;
  } catch (error) {
    console.error('Erro ao buscar eventos do calendário:', error);
    throw error;
  }
}

/**
 * Busca todos os eventos do calendário (públicos)
 */
export async function getAllCalendarEvents(): Promise<CalendarEvent[]> {
  try {
    const response = await api.get(`/calendar-events`);
    return response.data.data;
  } catch (error) {
    console.error('Erro ao buscar todos os eventos do calendário:', error);
    throw error;
  }
}

/**
 * Busca eventos do calendário por intervalo de datas
 */
export async function getCalendarEventsByDateRange(startDate: string, endDate: string): Promise<CalendarEvent[]> {
  try {
    const response = await api.get(`/calendar-events/date-range`, {
      params: { startDate, endDate }
    });
    return response.data.data;
  } catch (error) {
    console.error('Erro ao buscar eventos por data:', error);
    throw error;
  }
}

/**
 * Cria um novo evento de calendário
 */
export async function createCalendarEvent(eventData: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
  try {
    const formData = new FormData();
    Object.keys(eventData).forEach(key => {
      const value = (eventData as any)[key];
      if (value !== null && value !== undefined) {
        if (key === 'image' && value instanceof File) {
          formData.append('image', value);
        } else if (key !== 'image') {
          formData.append(key, value.toString());
        }
      }
    });

    const response = await api.post(`/calendar-events`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    return response.data.data;
  } catch (error) {
    console.error('Erro ao criar evento de calendário:', error);
    throw error;
  }
}

/**
 * Atualiza um evento de calendário existente
 */
export async function updateCalendarEvent(eventId: string, eventData: Partial<CalendarEvent>): Promise<CalendarEvent> {
  try {
    const formData = new FormData();
    Object.keys(eventData).forEach(key => {
      const value = (eventData as any)[key];
      if (value !== null && value !== undefined) {
        if (key === 'image' && value instanceof File) {
          formData.append('image', value);
        } else if (key !== 'image') {
          formData.append(key, value.toString());
        }
      }
    });

    const response = await api.put(`/calendar-events/${eventId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    return response.data.data;
  } catch (error) {
    console.error('Erro ao atualizar evento de calendário:', error);
    throw error;
  }
}

/**
 * Deleta um evento de calendário
 */
export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  try {
    await api.delete(`/calendar-events/${eventId}`);
    return true;
  } catch (error) {
    console.error('Erro ao deletar evento de calendário:', error);
    throw error;
  }
}

/**
 * Atualiza o perfil do professor
 */
export async function updateTeacherProfile(teacherId: string, data: Partial<UserProfile>): Promise<boolean> {
  try {
    await api.put(`/teachers/${teacherId}`, data);
    return true;
  } catch (error) {
    console.error('Erro ao atualizar perfil do professor:', error);
    throw error;
  }
}

/**
 * Altera a senha do professor
 */
export async function changeTeacherPassword(teacherId: string, newPassword: string): Promise<boolean> {
  try {
    await api.put(`/teachers/${teacherId}/password`, { newPassword });
    return true;
  } catch (error) {
    console.error('Erro ao alterar senha do professor:', error);
    throw error;
  }
}

/**
 * Cria uma nova disciplina
 */
export async function createSubject(teacherId: string, data: Partial<Subject>): Promise<Subject> {
  try {
    const response = await api.post('/subjects', { ...data, teacher_id: teacherId });
    return response.data;
  } catch (error) {
    console.error('Erro ao criar disciplina:', error);
    throw error;
  }
}

/**
 * Atualiza uma disciplina existente
 */
export async function updateSubject(teacherId: string, subjectId: number, data: Partial<Subject>): Promise<Subject> {
  try {
    const response = await api.put(`/subjects/${subjectId}`, data);
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar disciplina:', error);
    throw error;
  }
}

/**
 * Remove uma disciplina
 */
export async function deleteSubject(teacherId: string, subjectId: number): Promise<boolean> {
  try {
    await api.delete(`/subjects/${subjectId}`);
    return true;
  } catch (error) {
    console.error('Erro ao remover disciplina:', error);
    throw error;
  }
}
