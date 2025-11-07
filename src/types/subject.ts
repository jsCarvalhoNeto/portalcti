export interface Subject {
  id: number;
  name: string;
  description?: string;
  teacher_id: number;
  teacher_name?: string;
  schedule?: string;
  max_students?: number;
  current_students?: number;
  grade?: '1º Ano' | '2º Ano' | '3º Ano';
  semester?: string;
  year: number; // Ano letivo da disciplina
  color?: string; // Cor hexadecimal para o card da disciplina (ex: #3B82F6)
  created_at: string;
  updated_at: string;
}
