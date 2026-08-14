import { supabase } from '../lib/supabaseClient';

/**
 * Serviço para autenticação de usuários usando o Supabase
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
  grade?: '1º Ano' | '2º Ano' | '3º Ano';
  role?: 'student' | 'teacher' | 'admin';
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
 * Faz login de usuário usando o Supabase Auth
 */
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) throw error;

    if (!data.user) {
      throw new Error('Nenhum usuário retornado');
    }

    // Buscar perfil e role do banco de dados público
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', data.user.id)
      .single();

    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', data.user.id)
      .single();

    return {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email || '',
        role: userRole?.role || 'student',
        full_name: profile?.full_name || '',
      },
    };
  } catch (error: any) {
    console.error('Erro de autenticação no Supabase:', error);
    return {
      success: false,
      error: error.message || 'Erro de autenticação. Verifique suas credenciais.',
    };
  }
}

/**
 * Faz cadastro de novo usuário usando o Supabase Auth.
 * Os metadados passados em options.data acionarão a trigger handle_new_user
 * para criar o registro correspondente em public.profiles e public.user_roles.
 */
export async function signUp(credentials: SignUpCredentials): Promise<SignUpResponse> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          full_name: credentials.fullName,
          student_registration: credentials.studentRegistration || null,
          grade: credentials.grade || null,
          role: credentials.role || 'student',
        },
      },
    });

    if (error) throw error;

    if (!data.user) {
      throw new Error('Não foi possível criar a conta');
    }

    return {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email || '',
        role: credentials.role || 'student',
        full_name: credentials.fullName,
      },
    };
  } catch (error: any) {
    console.error('Erro de cadastro no Supabase:', error);
    return {
      success: false,
      error: error.message || 'Erro ao criar conta.',
    };
  }
}

/**
 * Faz logout de usuário
 */
export async function logout(): Promise<boolean> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao fazer logout no Supabase:', error);
    return false;
  }
}

/**
 * Obtém o perfil do usuário atual
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Buscar perfil e role do banco de dados público
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email || '',
      role: userRole?.role || 'student',
      full_name: profile?.full_name || '',
    };
  } catch (error) {
    console.error('Erro ao obter usuário atual do Supabase:', error);
    return null;
  }
}

