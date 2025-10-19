import api from './api';

interface Subject {
  id: number;
  name: string;
}

interface Grade {
  id: number;
  studentName: string;
  value: number;
}

interface Absence {
  id: number;
  studentName: string;
  date: string;
  present: boolean;
}

export const getSubjectsByTeacher = async (teacherId: number): Promise<Subject[]> => {
  try {
    const response = await api.get(`/subjects?teacher_id=${teacherId}`);
    const subjects = response.data;
    return subjects.map((subject: { id: number; name: string }) => ({
      id: subject.id,
      name: subject.name
    }));
  } catch (error) {
    console.error('Erro ao buscar disciplinas por professor:', error);
    return [];
  }
};

export const getGradesBySubject = async (subjectId: number): Promise<Grade[]> => {
  // Implementação futura para buscar notas por matéria
  console.log(`Buscando notas para a matéria ID: ${subjectId}`);
 return [];
};

export const getAbsencesBySubject = async (subjectId: number): Promise<Absence[]> => {
  // Implementação futura para buscar faltas por matéria
  console.log(`Buscando faltas para a matéria ID: ${subjectId}`);
 return [];
};

export const getAllTeachers = async () => {
  try {
    const response = await api.get('/teachers');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar professores:', error);
    throw error;
  }
};
