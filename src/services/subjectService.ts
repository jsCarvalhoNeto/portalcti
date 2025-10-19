import api from './api';
import { Subject } from '@/types/subject';

export interface CreateSubjectData {
  name: string;
  description?: string;
  teacher_id?: string;
  schedule?: string;
  max_students?: number;
  grade?: '1º Ano' | '2º Ano' | '3º Ano';
  semester?: string;
  period?: string;
}

export interface UpdateSubjectData {
  name?: string;
  description?: string;
  teacher_id?: string;
  schedule?: string;
  max_students?: number;
  grade?: '1º Ano' | '2º Ano' | '3º Ano';
  semester?: string;
  period?: string;
}

export const subjectService = {
  // Criar nova disciplina
  create: async (subjectData: CreateSubjectData): Promise<Subject> => {
    try {
      const response = await api.post('/subjects', subjectData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Erro ao criar disciplina');
    }
  },

  // Buscar todas as disciplinas
  getAll: async (): Promise<Subject[]> => {
    try {
      const response = await api.get('/subjects');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Erro ao buscar disciplinas');
    }
  },

  // Buscar disciplina por ID
  getById: async (id: string): Promise<Subject> => {
    try {
      const response = await api.get(`/subjects/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Erro ao buscar disciplina');
    }
  },

  // Atualizar disciplina
  update: async (id: string, subjectData: UpdateSubjectData): Promise<Subject> => {
    try {
      const response = await api.put(`/subjects/${id}`, subjectData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Erro ao atualizar disciplina');
    }
  },

  // Deletar disciplina
  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/subjects/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Erro ao deletar disciplina');
    }
  },

  // Buscar disciplinas por professor
  getByTeacher: async (teacherId: string): Promise<Subject[]> => {
    try {
      const response = await api.get(`/subjects?teacher_id=${teacherId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Erro ao buscar disciplinas do professor');
    }
  },

  // Buscar alunos por série
  getStudentsByGrade: async (grade: '1º Ano' | '2º Ano' | '3º Ano'): Promise<any[]> => {
    try {
      const response = await api.get(`/students/grade/${grade}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Erro ao buscar alunos por série');
    }
  }
};
