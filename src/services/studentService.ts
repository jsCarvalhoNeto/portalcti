import { supabase, createEphemeralClient } from '../lib/supabaseClient';
import { generateSecurePassword } from './passwordService';
import { sanitizeStudentData, type StudentFormData } from './validationService';

export interface CreateStudentResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    temporaryPassword: string;
  };
  error?: string;
}

export interface Student {
  id: string;
  email: string;
  full_name: string;
  student_registration: string;
  phone?: string;
  grade?: '1º Ano' | '2º Ano' | '3º Ano';
  created_at: string;
}

/**
 * Busca todos os estudantes de uma série específica (usando Supabase)
 */
export async function getStudentsByGrade(grade: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        student_registration,
        grade,
        created_at,
        user_roles!inner(role)
      `)
      .eq('grade', grade)
      .eq('user_roles.role', 'student')
      .order('full_name', { ascending: true });

    if (error) throw error;

    return data.map(profile => ({
      id: profile.id,
      full_name: profile.full_name,
      student_registration: profile.student_registration,
      grade: profile.grade,
      email: profile.email || '',
      created_at: profile.created_at
    }));
  } catch (error) {
    console.error('Erro ao buscar estudantes por série no Supabase:', error);
    throw error;
  }
}

/**
 * Cria um novo estudante no sistema de forma administrativa.
 * Usa um cliente Supabase efêmero para não sobrescrever a sessão do administrador/professor logado.
 */
export async function createStudent(data: StudentFormData): Promise<CreateStudentResponse> {
  try {
    const sanitizedData = sanitizeStudentData(data);
    const temporaryPassword = generateSecurePassword({ length: 12 });
    const authClient = createEphemeralClient();

    const { data: authData, error } = await authClient.auth.signUp({
      email: sanitizedData.email,
      password: temporaryPassword,
      options: {
        data: {
          full_name: sanitizedData.fullName,
          student_registration: sanitizedData.studentRegistration || null,
          grade: sanitizedData.grade || null,
          role: 'student',
        },
      },
    });

    if (error) throw error;

    if (!authData.user) {
      throw new Error('Não foi possível criar o estudante');
    }

    return {
      success: true,
      user: {
        id: authData.user.id,
        email: sanitizedData.email,
        temporaryPassword,
      },
    };
  } catch (error: any) {
    console.error('Erro ao criar estudante no Supabase:', error);
    let errorMessage = 'Erro ao criar estudante no Supabase.';
    if (error.message?.includes('email rate limit exceeded') || error.message?.includes('rate limit')) {
      errorMessage = 'Limite de envio de e-mails do Supabase atingido por hora. Desative a opção "Confirm email" no painel do Supabase para criar contas instantaneamente sem limite.';
    } else if (error.message?.includes('User already registered') || error.message?.includes('already registered')) {
      errorMessage = 'Já existe um usuário cadastrado com este e-mail.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Atualiza os dados de um estudante no Supabase
 */
export async function updateStudent(studentId: string, data: StudentFormData): Promise<boolean> {
  try {
    const sanitizedData = sanitizeStudentData(data);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: sanitizedData.fullName,
        email: sanitizedData.email || null,
        student_registration: sanitizedData.studentRegistration || null,
        grade: sanitizedData.grade || null,
      })
      .eq('id', studentId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao atualizar estudante no Supabase:', error);
    throw error;
  }
}

/**
 * Atualiza a senha do próprio estudante conectado
 */
export async function updateStudentPassword(userId: string, newPassword: string): Promise<boolean> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao atualizar senha do estudante no Supabase:', error);
    return false;
  }
}

/**
 * Verifica se um estudante tem senha temporária
 */
export async function hasTemporaryPassword(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('student_registration')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return false;
  } catch (error) {
    console.error('Erro ao verificar senha temporária:', error);
    return false;
  }
}

/**
 * Busca informações de um estudante pelo ID
 */
export async function getStudentById(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        student_registration,
        grade,
        created_at
      `)
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao buscar estudante no Supabase:', error);
    throw error;
  }
}

/**
 * Lista todos os estudantes do sistema
 */
export async function getAllStudents(): Promise<Student[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        student_registration,
        grade,
        created_at,
        user_roles!inner(role)
      `)
      .eq('user_roles.role', 'student')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((profile: any) => ({
      id: profile.id,
      full_name: profile.full_name,
      student_registration: profile.student_registration,
      grade: profile.grade,
      email: profile.email || '',
      created_at: profile.created_at
    }));
  } catch (error) {
    console.error('Erro ao buscar estudantes no Supabase:', error);
    throw error;
  }
}

/**
 * Verifica se o usuário atual tem permissão para criar um novo estudante.
 */
export async function canCreateStudent(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  return userRole?.role === 'teacher' || userRole?.role === 'admin';
}

/**
 * Deleta um estudante do sistema
 */
export async function deleteStudent(studentId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', studentId);

    if (error) throw error;
  } catch (error) {
    console.error('Erro ao deletar estudante no Supabase:', error);
    throw error;
  }
}
