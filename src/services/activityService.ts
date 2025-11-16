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

export interface StudentActivityFile {
  enrollment_id: number;
  file_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_uploaded_at: string;
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
  files?: StudentActivityFile[]; // Novo: array de arquivos enviados pelo aluno
  text_submission?: string | null;
  submitted_at: string | null; // Pode ser nulo para alunos que ainda não submeteram (usando graded_at como timestamp de submissão)
  status: 'graded' | 'submitted' | 'pending';
  student_name_display: string;
  student_email: string;
  subject_name: string;
  activity_name: string;
  teacher_name?: string; // Adicionado para mostrar o nome do professor
  teacher_observation?: string | null; // Observação em rich text HTML enviada pelo professor
  has_teacher_observation?: boolean;
  
  // 🎯 Campos para sistema de equipes
  auto_applied?: boolean; // Indica se a nota foi aplicada automaticamente para membro de equipe
  team_leader_grade_id?: number | null; // ID da nota original do líder da equipe
  manual_grade?: boolean; // Indica se a nota foi atribuída manualmente pelo professor
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
    // Verificar primeiro se estamos em modo privado antes de fazer a requisição
    const { default: PrivacyModeUtils } = await import('../utils/privacyMode');
    const privacyCheck = await PrivacyModeUtils.handlePrivacyMode();
    
    if (privacyCheck.isPrivate || !privacyCheck.cookiesWork) {
      console.log('🔒 Modo privado detectado - pulando criação de atividade');
      throw new Error('Não é possível criar atividades no modo anônimo. Por favor, desative o modo de navegação privada.');
    }

    const response = await api.post('/activities', activityData, { withCredentials: true });
    return response.data;
  } catch (error) {
    console.error('Error creating activity:', error);
    // Verificar se o erro está relacionado ao modo privado/anônimo
    if ((error as any)?.response?.status === 401) {
      const { default: PrivacyModeUtils } = await import('../utils/privacyMode');
      const privacyCheck = await PrivacyModeUtils.handlePrivacyMode();
      if (privacyCheck.isPrivate || !privacyCheck.cookiesWork) {
        console.warn('⚠️ Erro 401 relacionado a modo privado detectado');
        throw new Error('Não é possível criar atividades no modo anônimo. Por favor, desative o modo de navegação privada.');
      }
    }
    throw new Error('Não foi possível criar a atividade.');
  }
}

export async function assignActivityGrade(gradeData: ActivityGradeData) {
  try {
    // Verificar se estamos em modo privado antes de fazer a requisição
    const { default: PrivacyModeUtils } = await import('../utils/privacyMode');
    const privacyCheck = await PrivacyModeUtils.handlePrivacyMode();
    
    if (privacyCheck.isPrivate || !privacyCheck.cookiesWork) {
      console.log('🔒 Modo privado detectado - pulando atribuição de nota de atividade');
      throw new Error('Não é possível atribuir notas no modo anônimo. Por favor, desative o modo de navegação privada.');
    }

    const response = await api.post('/activities/activity-grades', gradeData, { withCredentials: true });
    return response.data;
  } catch (error) {
    console.error('Error assigning activity grade:', error);
    throw new Error('Não foi possível atribuir a nota à atividade.');
  }
}

export async function getActivityGrades(activityId: number): Promise<ActivityGrade[]> {
  try {
    // Verificar se estamos em modo privado antes de fazer a requisição
    const { default: PrivacyModeUtils } = await import('../utils/privacyMode');
    const privacyCheck = await PrivacyModeUtils.handlePrivacyMode();
    
    if (privacyCheck.isPrivate || !privacyCheck.cookiesWork) {
      console.log('🔒 Modo privado detectado - pulando requisição de notas de atividade');
      return []; // Retornar array vazio em modo privado
    }

    const response = await api.get(`/activities/${activityId}/grades`, { withCredentials: true });
    return response.data;
  } catch (error) {
    console.error('Error fetching activity grades:', error);
    throw new Error('Não foi possível buscar as notas da atividade.');
  }
}

export async function updateActivity(activityId: number, activityData: ActivityData) {
  try {
    // Verificar se estamos em modo privado antes de fazer a requisição
    const { default: PrivacyModeUtils } = await import('../utils/privacyMode');
    const privacyCheck = await PrivacyModeUtils.handlePrivacyMode();
    
    if (privacyCheck.isPrivate || !privacyCheck.cookiesWork) {
      console.log('🔒 Modo privado detectado - pulando atualização de atividade');
      throw new Error('Não é possível atualizar atividades no modo anônimo. Por favor, desative o modo de navegação privada.');
    }

    const response = await api.put(`/activities/${activityId}`, activityData, { withCredentials: true });
    return response.data;
  } catch (error) {
    console.error('Error updating activity:', error);
    throw new Error('Não foi possível atualizar a atividade.');
  }
}

export async function updateActivityGrade(gradeId: number, grade: number) {
  try {
    // Verificar se estamos em modo privado antes de fazer a requisição
    const { default: PrivacyModeUtils } = await import('../utils/privacyMode');
    const privacyCheck = await PrivacyModeUtils.handlePrivacyMode();
    
    if (privacyCheck.isPrivate || !privacyCheck.cookiesWork) {
      console.log('🔒 Modo privado detectado - pulando atualização de nota de atividade');
      throw new Error('Não é possível atualizar notas no modo anônimo. Por favor, desative o modo de navegação privada.');
    }

    console.log('Tentando atualizar nota da atividade:', { gradeId, grade });
    const response = await api.put(`/activities/activity-grades/${gradeId}`, { grade }, { withCredentials: true });
    console.log('Nota atualizada com sucesso:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating activity grade:', error);
    throw new Error('Não foi possível atualizar a nota da atividade.');
  }
}

export async function setActivityTeacherObservation(gradeId: number, teacher_observation: string | null) {
  try {
    // Verificar se estamos em modo privado antes de fazer a requisição
    const { default: PrivacyModeUtils } = await import('../utils/privacyMode');
    const privacyCheck = await PrivacyModeUtils.handlePrivacyMode();
    
    if (privacyCheck.isPrivate || !privacyCheck.cookiesWork) {
      console.log('🔒 Modo privado detectado - pulando definição de observação de atividade');
      throw new Error('Não é possível definir observações no modo anônimo. Por favor, desative o modo de navegação privada.');
    }

    const response = await api.put(`/activities/activity-grades/${gradeId}/observation`, { teacher_observation }, { withCredentials: true });
    return response.data;
  } catch (error) {
    console.error('Error setting teacher observation:', error);
    throw new Error('Não foi possível salvar a observação.');
  }
}

export async function deleteActivityGrade(gradeId: number) {
  try {
    // Verificar se estamos em modo privado antes de fazer a requisição
    const { default: PrivacyModeUtils } = await import('../utils/privacyMode');
    const privacyCheck = await PrivacyModeUtils.handlePrivacyMode();
    
    if (privacyCheck.isPrivate || !privacyCheck.cookiesWork) {
      console.log('🔒 Modo privado detectado - pulando exclusão de nota de atividade');
      throw new Error('Não é possível excluir notas no modo anônimo. Por favor, desative o modo de navegação privada.');
    }

    const response = await api.delete(`/activities/activity-grades/${gradeId}`, { withCredentials: true });
    return response.data;
  } catch (error) {
    console.error('Error deleting activity grade:', error);
    throw new Error('Não foi possível excluir a nota da atividade.');
  }
}

/**
 * 🎯 ATRIBUIÇÃO MANUAL DE NOTAS PARA MEMBROS DE EQUIPE
 * 
 * Permite que o professor atribua notas manualmente para membros 
 * específicos de uma equipe que não enviaram a atividade
 */
export interface ManualTeamGradeData {
  activity_id: number;
  enrollment_id: number;
  grade: number;
  teacher_observation?: string;
  student_name?: string;
}

export async function assignManualGradeToTeamMember(gradeData: ManualTeamGradeData) {
  try {
    // Verificar se estamos em modo privado antes de fazer a requisição
    const { default: PrivacyModeUtils } = await import('../utils/privacyMode');
    const privacyCheck = await PrivacyModeUtils.handlePrivacyMode();
    
    if (privacyCheck.isPrivate || !privacyCheck.cookiesWork) {
      console.log('🔒 Modo privado detectado - pulando atribuição de nota manual para membro da equipe');
      throw new Error('Não é possível atribuir notas no modo anônimo. Por favor, desative o modo de navegação privada.');
    }

    const response = await api.post('/activities/team-grades/manual', gradeData, { withCredentials: true });
    return response.data;
  } catch (error: any) {
    console.error('Error assigning manual grade to team member:', error);
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error('Não foi possível atribuir a nota manual ao membro da equipe.');
  }
}

export async function deleteActivity(activityId: number) {
  try {
    // Verificar se estamos em modo privado antes de fazer a requisição
    const { default: PrivacyModeUtils } = await import('../utils/privacyMode');
    const privacyCheck = await PrivacyModeUtils.handlePrivacyMode();
    
    if (privacyCheck.isPrivate || !privacyCheck.cookiesWork) {
      console.log('🔒 Modo privado detectado - pulando exclusão de atividade');
      throw new Error('Não é possível excluir atividades no modo anônimo. Por favor, desative o modo de navegação privada.');
    }

    const response = await api.delete(`/activities/${activityId}`, { withCredentials: true });
    return response.data;
  } catch (error) {
    console.error('Error deleting activity:', error);
    throw new Error('Não foi possível excluir atividade.');
  }
}

export async function getStudentActivities(): Promise<StudentActivity[]> {
  try {
    // Verificar se estamos em modo privado antes de fazer a requisição
    const { default: PrivacyModeUtils } = await import('../utils/privacyMode');
    const privacyCheck = await PrivacyModeUtils.handlePrivacyMode();
    
    if (privacyCheck.isPrivate || !privacyCheck.cookiesWork) {
      console.log('🔒 Modo privado detectado - pulando requisição de atividades do aluno');
      return []; // Retornar array vazio em modo privado
    }

    const response = await api.get('/activities/student', { withCredentials: true });
    return response.data;
  } catch (error) {
    console.error('Error fetching student activities:', error);
    throw new Error('Não foi possível buscar as atividades.');
  }
}

export async function submitStudentActivity(activityData: FormData): Promise<any> {
  try {
    // Verificar se estamos em modo privado antes de fazer a requisição
    const { default: PrivacyModeUtils } = await import('../utils/privacyMode');
    const privacyCheck = await PrivacyModeUtils.handlePrivacyMode();
    
    if (privacyCheck.isPrivate || !privacyCheck.cookiesWork) {
      console.log('🔒 Modo privado detectado - pulando envio de atividade do aluno');
      throw new Error('Não é possível enviar atividades no modo anônimo. Por favor, desative o modo de navegação privada.');
    }

    const response = await api.post('/activities/student-activities', activityData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    return response.data;
  } catch (error: any) {
    console.error('Error submitting student activity:', error);
    // Verificar se há uma mensagem específica do backend
    if (error.response && error.response.data && error.response.data.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error('Não foi possível enviar a atividade.');
  }
}

export async function getStudentActivityGrades(): Promise<ActivityGrade[]> {
  try {
    // Verificar se estamos em modo privado antes de fazer a requisição
    const { default: PrivacyModeUtils } = await import('../utils/privacyMode');
    const privacyCheck = await PrivacyModeUtils.handlePrivacyMode();
    
    if (privacyCheck.isPrivate || !privacyCheck.cookiesWork) {
      console.log('🔒 Modo privado detectado - pulando requisição de notas de atividades do aluno');
      return []; // Retornar array vazio em modo privado
    }

    const response = await api.get('/activities/student/grades', { withCredentials: true });
    return response.data;
  } catch (error) {
    console.error('Error fetching student activity grades:', error);
    throw new Error('Não foi possível buscar as notas das atividades.');
  }
}
