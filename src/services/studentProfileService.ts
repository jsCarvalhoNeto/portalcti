import api from './api';
import { Student } from './studentService';

export interface StudentProfile {
  id: string;
  full_name?: string;
  email?: string;
 student_registration?: string;
  phone?: string;
  updated_at?: string;
}

export const updateStudentProfile = async (studentId: string, profileData: Partial<StudentProfile>): Promise<Student> => {
  try {
    const response = await api.put(`/students/${studentId}`, profileData);
    return response.data;
  } catch (error) {
    console.error('Error updating student profile:', error);
    throw error;
  }
};

export const changeStudentPassword = async (studentId: string, newPassword: string): Promise<void> => {
  try {
    await api.put(`/students/${studentId}/password`, { newPassword });
  } catch (error) {
    console.error('Error changing student password:', error);
    throw error;
  }
};

export const getStudentProfile = async (studentId: string): Promise<Student> => {
  try {
    const response = await api.get(`/students/${studentId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching student profile:', error);
    throw error;
  }
};
