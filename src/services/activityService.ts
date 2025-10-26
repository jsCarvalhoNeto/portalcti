import api from './api';

export interface ActivityData {
  name: string;
  subject_id: number;
  grade?: string; // Opcional - o controller pega a série da disciplina
  type: 'individual' | 'team';
  description?: string;
  file_path?: string;
  file_name?: string;
  deadline?: string;
  period?: string;
  evaluation_type?: string;
}

export interface ActivityGradeData {
  activity_id: number;
  enrollment_id: number;
  grade: number;
  graded_by: string;
}

export interface ActivityGrade {
  grade_id?: number; // Adicionado para identificação única da nota
  id: number | null; // Pode ser nulo para alunos que ainda não submeteram
  activity_id: number | null; // Pode ser nulo para alunos que ainda não submeteram
  enrollment_id: number;
  student_id: number;
  grade: number | null;
  graded_at: string | null;
  graded_by: string | null;
  student_name: string | null; // Nome do aluno na submissão
  team_members: string | null;
  file_path: string | null;
  file_name: string | null;
  submitted_at: string | null; // Pode ser nulo para alunos que ainda não submeteram (usando graded_at como timestamp de submissão)
  status: 'graded' | 'submitted' | 'pending';
  student_name_display: string;
  student_email: string;
  subject_name: string;
  activity_name: string;
  teacher_name?: string; // Adicionado para mostrar o nome do professor
}

export interface StudentActivity {
  id: number;
  name: string;
  subject_id?: number;
  subject_name: string;
  teacher_name: string;
  type: 'individual' | 'team';
  description: string | null;
  file_path: string | null;
  file_name: string | null;
  created_at: string;
  status: 'pending' | 'submitted' | 'completed';
}

export async function createActivity(activityData: ActivityData) {
  try {
    const response = await api.post('/activities', activityData, { withCredentials: true });
    return response.data;
  } catch (error) {
    console.error('Error creating activity:', error);
    throw new Error('Não foi possível criar a atividade.');
  }
}

export async function assignActivityGrade(gradeData: ActivityGradeData) {
  try {
    const response = await api.post('/activities/activity-grades', gradeData, { withCredentials: true });
    return response.data;
  } catch (error) {
    console.error('Error assigning activity grade:', error);
    throw new Error('Não foi possível atribuir a nota à atividade.');
  }
}

export async function getActivityGrades(activityId: number): Promise<ActivityGrade[]> {
  try {
    const response = await api.get(`/activities/${activityId}/grades`, { withCredentials: true });
    return response.data;
  } catch (error) {
    console.error('Error fetching activity grades:', error);
    throw new Error('Não foi possível buscar as notas da atividade.');
  }
}

export async function updateActivity(activityId: number, activityData: ActivityData) {
  try {
    const response = await api.put(`/activities/${activityId}`, activityData, { withCredentials: true });
    return response.data;
  } catch (error) {
    console.error('Error updating activity:', error);
    throw new Error('Não foi possível atualizar a atividade.');
  }
}

export async function updateActivityGrade(gradeId: number, grade: number) {
  try {
    console.log('Tentando atualizar nota da atividade:', { gradeId, grade });
    const response = await api.put(`/activities/activity-grades/${gradeId}`, { grade }, { withCredentials: true });
    console.log('Nota atualizada com sucesso:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating activity grade:', error);
    throw new Error('Não foi possível atualizar a nota da atividade.');
  }
}

export async function deleteActivityGrade(gradeId: number) {
  try {
    const response = await api.delete(`/activities/activity-grades/${gradeId}`, { withCredentials: true });
    return response.data;
  } catch (error) {
    console.error('Error deleting activity grade:', error);
    throw new Error('Não foi possível excluir a nota da atividade.');
  }
}

export async function deleteActivity(activityId: number) {
  try {
    const response = await api.delete(`/activities/${activityId}`, { withCredentials: true });
    return response.data;
  } catch (error) {
    console.error('Error deleting activity:', error);
    throw new Error('Não foi possível excluir atividade.');
  }
}

export async function getStudentActivities(): Promise<StudentActivity[]> {
  try {
    const response = await api.get('/activities/student', { withCredentials: true });
    return response.data;
  } catch (error) {
    console.error('Error fetching student activities:', error);
    throw new Error('Não foi possível buscar as atividades.');
  }
}

export async function submitStudentActivity(activityData: FormData): Promise<any> {
  try {
    const response = await api.post('/activities/student-activities', activityData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error submitting student activity:', error);
    throw new Error('Não foi possível enviar a atividade.');
  }
}

export async function getStudentActivityGrades(): Promise<ActivityGrade[]> {
  try {
    const response = await api.get('/activities/student/grades', { withCredentials: true });
    return response.data;
  } catch (error) {
    console.error('Error fetching student activity grades:', error);
    throw new Error('Não foi possível buscar as notas das atividades.');
  }
}
