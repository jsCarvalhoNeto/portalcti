import api from './api';
import { supabase } from '../lib/supabaseClient';
import { Student } from './studentService';

export interface StudentProfile {
  id: string;
  full_name?: string;
  email?: string;
  student_registration?: string;
  phone?: string;
  grade?: string;
  updated_at?: string;
}

export interface ChangeStudentPasswordParams {
  studentId: string;
  email?: string;
  currentPassword?: string;
  newPassword: string;
}

export const updateStudentProfile = async (studentId: string, profileData: Partial<StudentProfile>): Promise<Student> => {
  try {
    // Tenta atualizar no Supabase profiles
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString()
    };
    if (profileData.phone !== undefined) updatePayload.phone = profileData.phone;
    if (profileData.full_name !== undefined) updatePayload.full_name = profileData.full_name;

    const { error: supabaseError } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', studentId);

    if (supabaseError) {
      console.warn('Supabase profile update warning:', supabaseError);
    }
  } catch (err) {
    console.warn('Erro ao atualizar perfil no Supabase:', err);
  }

  try {
    const response = await api.put(`/students/${studentId}`, profileData);
    return response.data;
  } catch (error) {
    console.warn('API REST não disponível ou erro, dados salvos localmente:', error);
    return { id: studentId, ...profileData } as any;
  }
};

export const changeStudentPassword = async ({
  studentId,
  email,
  currentPassword,
  newPassword
}: ChangeStudentPasswordParams): Promise<{ success: boolean; error?: string }> => {
  try {
    // 1. Se informou a senha atual e email, validar via reautenticação no Supabase
    if (currentPassword && email) {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword
      });

      if (authError) {
        return {
          success: false,
          error: 'A senha atual informada está incorreta.'
        };
      }
    }

    // 2. Atualizar a senha no Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      console.error('Erro ao atualizar senha no Supabase:', updateError);
      return {
        success: false,
        error: updateError.message || 'Erro ao alterar a senha no serviço de autenticação.'
      };
    }

    // 3. Sincronizar com o backend se a rota existir
    try {
      await api.put(`/students/${studentId}/password`, { newPassword });
    } catch (apiError) {
      console.warn('Aviso: Não foi possível sincronizar nova senha com backend REST:', apiError);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error changing student password:', error);
    return {
      success: false,
      error: error?.message || 'Erro inesperado ao alterar a senha.'
    };
  }
};

export const getStudentProfile = async (studentId: string): Promise<Student> => {
  try {
    const response = await api.get(`/students/${studentId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching student profile from API, falling back to Supabase:', error);
    const { data, error: sbError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', studentId)
      .single();

    if (sbError || !data) throw error;
    return data as Student;
  }
};

