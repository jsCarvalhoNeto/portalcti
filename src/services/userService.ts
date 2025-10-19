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
  grade?: string;
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
