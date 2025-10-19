import { API_URL } from '@/services/api';

/**
 * Hook customizado para gerenciar criação de estudantes
 */

import { useState, useCallback } from 'react';
import { 
  StudentFormData, 
  StudentCredentials, 
  UseStudentCreationReturn,
  ERROR_MESSAGES 
} from '@/types/student';
import { validateField, sanitizeStudentData } from '@/services/validationService';
import { createStudent, canCreateStudent } from '@/services/studentService';
import { useToast } from '@/hooks/use-toast';

const initialFormData: StudentFormData = {
  fullName: '',
  email: '',
  studentRegistration: '',
  grade: undefined,
};

export function useStudentCreation(): UseStudentCreationReturn {
  const [formData, setFormData] = useState<StudentFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState<Record<string, boolean>>({});
  const [generatedCredentials, setGeneratedCredentials] = useState<StudentCredentials | null>(null);
  const [showCredentials, setShowCredentials] = useState(false);
  const { toast } = useToast();

  const setEditingStudent = useCallback((student: any) => {
    setFormData({
      fullName: student.full_name || student.fullName || '',
      email: student.email || '',
      studentRegistration: student.student_registration || student.studentRegistration || '',
      grade: student.grade || undefined,
    });
  }, []);

  const updateField = useCallback((field: keyof StudentFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const validateFieldAsync = useCallback(async (field: keyof StudentFormData) => {
    const value = formData[field];
    
    // Não validar campos vazios em tempo real
    if (!value.trim()) {
      return;
    }

    setIsValidating(prev => ({ ...prev, [field]: true }));
    
    try {
      const error = await validateField(field, value, formData);
      
      setErrors(prev => {
        const newErrors = { ...prev };
        if (error) {
          newErrors[field] = error;
        } else {
          delete newErrors[field];
        }
        return newErrors;
      });
    } catch (error) {
      console.error(`Erro ao validar campo ${field}:`, error);
      setErrors(prev => ({
        ...prev,
        [field]: ERROR_MESSAGES.networkError,
      }));
    } finally {
      setIsValidating(prev => ({ ...prev, [field]: false }));
    }
  }, [formData]);

  const createStudentAsync = useCallback(async () => {
    setIsLoading(true);
    setErrors({});

    try {
      // Verificar permissões
      const hasPermission = await canCreateStudent();
      if (!hasPermission) {
        toast({
          title: "Erro de Permissão",
          description: ERROR_MESSAGES.permissionDenied,
          variant: "destructive",
        });
        return;
      }

      // Validar todos os campos antes de enviar
      const sanitizedData = sanitizeStudentData(formData);
      
      // Validação básica de campos obrigatórios (matrícula não é mais obrigatória)
      const newErrors: Record<string, string> = {};
      
      if (!sanitizedData.fullName) {
        newErrors.fullName = ERROR_MESSAGES.required;
      }
      
      if (!sanitizedData.email) {
        newErrors.email = ERROR_MESSAGES.required;
      }

      if (!sanitizedData.grade) {
        newErrors.grade = 'Série é obrigatória';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      // Criar estudante
      const result = await createStudent(sanitizedData);
      
      if (result.success && result.user) {
        setGeneratedCredentials({
          email: result.user.email,
          temporaryPassword: result.user.temporaryPassword,
          userId: result.user.id,
        });
        setShowCredentials(true);
        
        toast({
          title: "Estudante Criado com Sucesso!",
          description: `${sanitizedData.fullName} foi adicionado ao sistema.`,
        });
        
        // Resetar formulário
        setFormData(initialFormData);
        setErrors({});
      } else {
        toast({
          title: "Erro ao Criar Estudante",
          description: result.error || ERROR_MESSAGES.unknownError,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao criar estudante:', error);
      toast({
        title: "Erro Inesperado",
        description: ERROR_MESSAGES.unknownError,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [formData, toast]);

  const updateStudentAsync = useCallback(async (studentId: string) => {
    setIsLoading(true);
    setErrors({});

    try {
      // Validar todos os campos antes de enviar
      const sanitizedData = sanitizeStudentData(formData);
      
      // Validação básica de campos obrigatórios (matrícula não é mais obrigatória para atualização)
      const newErrors: Record<string, string> = {};
      
      if (!sanitizedData.fullName) {
        newErrors.fullName = ERROR_MESSAGES.required;
      }
      
      if (!sanitizedData.email) {
        newErrors.email = ERROR_MESSAGES.required;
      }

      if (!sanitizedData.grade) {
        newErrors.grade = 'Série é obrigatória';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      // Atualizar estudante no banco de dados real (API)
      // Obter conexão e atualizar no banco de dados real
      const response = await fetch(`${API_URL}/students/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: sanitizedData.fullName,
          email: sanitizedData.email,
          studentRegistration: sanitizedData.studentRegistration, // Mantendo a matrícula existente
          grade: sanitizedData.grade
          // Não atualizar senha a menos que seja especificamente fornecida
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar estudante');
      }

      const result = await response.json();
      console.log('Estudante atualizado com sucesso:', result);

      toast({
        title: "Estudante Atualizado com Sucesso!",
        description: `${sanitizedData.fullName} foi atualizado no sistema.`,
      });

      // Resetar formulário
      setFormData(initialFormData);
      setErrors({});
      setShowCredentials(false);
    } catch (error) {
      console.error('Erro ao atualizar estudante:', error);
      toast({
        title: "Erro ao Atualizar Estudante",
        description: (error as Error).message || ERROR_MESSAGES.unknownError,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [formData, toast]);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setErrors({});
    setIsLoading(false);
    setIsValidating({});
    setGeneratedCredentials(null);
    setShowCredentials(false);
  }, []);

 const closeCredentials = useCallback(() => {
    setShowCredentials(false);
    setGeneratedCredentials(null);
  }, []);

  const handleSubmit = useCallback(async (studentId?: string) => {
    if (studentId) {
      await updateStudentAsync(studentId);
    } else {
      await createStudentAsync();
    }
  }, [updateStudentAsync, createStudentAsync]);

  return {
    formData,
    errors,
    isLoading,
    isValidating,
    generatedCredentials,
    showCredentials,
    updateField,
    validateField: validateFieldAsync,
    createStudent: createStudentAsync,
    updateStudent: updateStudentAsync,
    submit: handleSubmit,
    resetForm,
    closeCredentials,
    setEditingStudent,
  };
}
