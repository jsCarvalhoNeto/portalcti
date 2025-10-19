/**
 * Tipos TypeScript para funcionalidades de estudantes
 */

export interface StudentFormData {
  fullName: string;
  email: string;
  studentRegistration?: string;
  grade?: '1º Ano' | '2º Ano' | '3º Ano';
}

export interface StudentModalState {
  formData: StudentFormData;
  isLoading: boolean;
  errors: Record<string, string>;
  generatedPassword: string | null;
  showCredentials: boolean;
  isValidating: Record<string, boolean>;
}

export interface CreateStudentResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    temporaryPassword: string;
  };
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface StudentCredentials {
  email: string;
  temporaryPassword: string;
  userId: string;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  student_registration: string | null;
  created_at: string;
  updated_at: string;
  roles: Array<{
    role: 'admin' | 'student';
  }>;
}

export interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export interface CredentialsDisplayProps {
  credentials: StudentCredentials;
  onClose: () => void;
}

export interface StudentFormProps {
  formData: StudentFormData;
  errors: Record<string, string>;
  isLoading: boolean;
  isValidating: Record<string, boolean>;
  onChange: (field: keyof StudentFormData, value: string) => void;
  onSubmit: () => void;
  onValidateField: (field: keyof StudentFormData) => Promise<void>;
  isEditing?: boolean;
}

// Tipos para hooks customizados
export interface UseStudentCreationReturn {
  formData: StudentFormData;
  errors: Record<string, string>;
  isLoading: boolean;
  isValidating: Record<string, boolean>;
  generatedCredentials: StudentCredentials | null;
  showCredentials: boolean;
  updateField: (field: keyof StudentFormData, value: string) => void;
  validateField: (field: keyof StudentFormData) => Promise<void>;
  createStudent: () => Promise<void>;
  updateStudent: (studentId: string) => Promise<void>;
  submit: (studentId?: string) => Promise<void>;
  resetForm: () => void;
  closeCredentials: () => void;
  setEditingStudent: (student: any) => void;
}

// Constantes para validação
export const VALIDATION_RULES = {
  fullName: {
    minLength: 2,
    maxLength: 100,
    required: true,
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  studentRegistration: {
    minLength: 6,
    maxLength: 20,
    required: true,
    pattern: /^[A-Za-z0-9]{6,20}$/,
  },
} as const;

// Mensagens de erro padrão
export const ERROR_MESSAGES = {
  required: 'Este campo é obrigatório',
  invalidEmail: 'Formato de email inválido',
  emailExists: 'Este email já está cadastrado no sistema',
  invalidRegistration: 'Matrícula deve ter entre 6 e 20 caracteres (apenas letras e números)',
  registrationExists: 'Esta matrícula já está cadastrada no sistema',
  invalidName: 'Nome deve ter entre 2 e 100 caracteres',
  networkError: 'Erro de conexão. Verifique sua internet e tente novamente.',
  unknownError: 'Erro inesperado. Tente novamente.',
  permissionDenied: 'Você não tem permissão para realizar esta ação',
} as const;
