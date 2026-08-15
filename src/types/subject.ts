export interface SubjectTeacher {
  id: string;
  full_name: string;
  email?: string;
}

export interface Subject {
  id: number | string;
  name: string;
  description?: string;
  teacher_id?: string | number | null;
  teacher_name?: string;
  teacher_ids?: string[];
  teachers?: SubjectTeacher[];
  schedule?: string;
  max_students?: number;
  current_students?: number;
  grade?: '1º Ano' | '2º Ano' | '3º Ano';
  workload_hours?: number;
  semester?: string;
  period?: string;
  periods?: string[];
  year?: number; // Ano letivo da disciplina
  color?: string; // Cor hexadecimal para o card da disciplina (ex: #3B82F6)
  created_at?: string;
  updated_at?: string;
}

