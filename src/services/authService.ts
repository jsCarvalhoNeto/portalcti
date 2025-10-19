import api from './api';

/**
 * Serviço para autenticação de usuários (usando API real)
 */

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  fullName: string;
  studentRegistration?: string;
}

export interface LoginResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    role: string;
    full_name: string;
  };
  error?: string;
}

export interface SignUpResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    role: string;
    full_name: string;
  };
  error?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role: string;
  full_name: string;
}

/**
 * Faz login de usuário usando a API real
 */
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  try {
    const response = await api.post('/auth/login', credentials);
    return {
      success: true,
      user: response.data.user,
    };
  } catch (error: any) {
    console.error('Erro de conexão com o servidor de autenticação:', error);
    return {
      success: false,
      error:
        error.response?.data?.error ||
        'Erro de autenticação. Por favor, verifique suas credenciais e tente novamente.',
    };
  }
}

/**
 * Faz cadastro de novo usuário usando a API real
 */
export async function signUp(credentials: SignUpCredentials): Promise<SignUpResponse> {
  try {
    const response = await api.post('/auth/register', credentials);
    return {
      success: true,
      user: response.data.user,
    };
  } catch (error: any) {
    console.error('Erro de conexão com o servidor de autenticação:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Erro ao criar conta',
    };
  }
}

/**
 * Faz logout de usuário
 */
export async function logout(): Promise<boolean> {
  try {
    await api.post('/auth/logout');
    return true;
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    return false;
  }
}

/**
 * Obtém o perfil do usuário atual
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    console.error('Erro ao obter usuário atual:', error);
    return null;
  }
}
