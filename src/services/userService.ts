import api from './api';

/**
 * Serviço para gerenciamento de usuários (usando API real)
 */

export interface User {
  id: string;
  email: string;
  full_name: string;
  student_registration?: string | null;
  created_at: string;
  roles: Array<{ role: string }>;
  grade?: '1º Ano' | '2º Ano' | '3º Ano' | null;
}

export interface UpdateGradeRequest {
  grade: '1º Ano' | '2º Ano' | '3º Ano' | null;
}

export interface UpdateRoleRequest {
  role: 'admin' | 'teacher' | 'student';
}

/**
 * Busca todos os usuários do sistema (usando API real)
 */
export async function getAllUsers(): Promise<User[]> {
  console.log("Buscando todos os usuários (API real)...");
  
  try {
    const response = await api.get('/users');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    throw error;
  }
}

/**
 * Atualiza o papel de um usuário
 */
export async function updateUserRole(userId: string, role: string): Promise<void> {
  try {
    await api.put(`/users/${userId}/role`, { role });
  } catch (error) {
    console.error('Erro ao atualizar papel do usuário:', error);
    throw new Error('Erro ao atualizar papel do usuário');
  }
}

/**
 * Atualiza a série de um aluno
 */
export async function updateUserGrade(userId: string, grade: '1º Ano' | '2º Ano' | '3º Ano' | null): Promise<void> {
  try {
    await api.put(`/users/${userId}/grade`, { grade });
  } catch (error) {
    console.error('Erro ao atualizar série do usuário:', error);
    throw new Error('Erro ao atualizar série do usuário');
  }
}
