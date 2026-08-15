import { supabase } from '../lib/supabaseClient';

/**
 * Serviço para gerenciamento de usuários (usando Supabase diretamente)
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
 * Busca todos os usuários do sistema (usando Supabase)
 */
export async function getAllUsers(): Promise<User[]> {
  try {
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        student_registration,
        grade,
        created_at,
        user_roles(role)
      `)
      .order('created_at', { ascending: false });

    if (profileError) throw profileError;

    return (profiles || []).map((p: any) => ({
      id: p.id,
      email: p.email || '',
      full_name: p.full_name || '',
      student_registration: p.student_registration,
      created_at: p.created_at || new Date().toISOString(),
      roles: (p.user_roles || []).map((r: any) => ({ role: r.role })),
      grade: p.grade || null,
    }));
  } catch (error) {
    console.error('Erro ao buscar usuários no Supabase:', error);
    throw error;
  }
}

/**
 * Atualiza o perfil básico de um usuário (Nome, Email)
 */
export async function updateUserProfile(userId: string, data: { full_name?: string; email?: string }): Promise<void> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: data.full_name,
        email: data.email || null,
      })
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Erro ao atualizar perfil do usuário no Supabase:', error);
    throw new Error('Erro ao atualizar perfil do usuário');
  }
}

/**
 * Atualiza o papel de um usuário
 */
export async function updateUserRole(userId: string, role: string): Promise<void> {
  try {
    // Remover papéis anteriores para garantir role única
    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (deleteError) throw deleteError;

    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role });

    if (insertError) throw insertError;
  } catch (error) {
    console.error('Erro ao atualizar papel do usuário no Supabase:', error);
    throw new Error('Erro ao atualizar papel do usuário');
  }
}

/**
 * Atualiza a série de um aluno
 */
export async function updateUserGrade(userId: string, grade: '1º Ano' | '2º Ano' | '3º Ano' | null): Promise<void> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ grade })
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Erro ao atualizar série do usuário no Supabase:', error);
    throw new Error('Erro ao atualizar série do usuário');
  }
}

/**
 * Reseta a senha de um usuário (professor, estudante ou usuário) para a senha padrão (balbina123)
 */
export async function resetUserPassword(userId: string, newPassword: string = 'balbina123'): Promise<void> {
  try {
    const { data, error } = await supabase.rpc('admin_reset_user_password', {
      target_user_id: userId,
      new_password: newPassword,
    });

    if (error) throw error;
  } catch (error: any) {
    console.error('Erro ao resetar senha do usuário no Supabase:', error);
    throw new Error(error.message || 'Erro ao resetar senha do usuário.');
  }
}

