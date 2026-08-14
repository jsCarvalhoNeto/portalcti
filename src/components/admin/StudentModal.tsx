/**
 * Modal para criação e edição de estudantes
 */

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GraduationCap, Edit, Plus } from 'lucide-react';
import { StudentModalProps } from '@/types/student';
import { useStudentCreation } from '@/hooks/useStudentCreation';
import StudentForm from './StudentForm';
import CredentialsDisplay from './CredentialsDisplay';
import StudentSubjectsManager from './StudentSubjectsManager';

interface ExtendedStudentModalProps extends StudentModalProps {
  student?: any;
}

export default function StudentModal({ isOpen, onClose, onSuccess, student }: ExtendedStudentModalProps) {
  const [showSubjectsManager, setShowSubjectsManager] = useState(false);
  const {
    formData,
    errors,
    isLoading,
    isValidating,
    generatedCredentials,
    showCredentials,
    updateField,
    validateField,
    createStudent,
    submit,
    resetForm,
    closeCredentials,
    setEditingStudent,
  } = useStudentCreation();

  // Resetar formulário quando modal abrir
  useEffect(() => {
    if (isOpen) {
      if (student) {
        // Modo de edição
        setEditingStudent(student);
      } else {
        // Modo de criação
        resetForm();
      }
    }
  }, [isOpen, student, setEditingStudent, resetForm]);

  // Fechar modal e chamar callback de sucesso quando credenciais forem fechadas
  useEffect(() => {
    if (!showCredentials && generatedCredentials) {
      onClose();
      onSuccess();
    }
  }, [showCredentials, generatedCredentials, onClose, onSuccess]);

  const handleClose = () => {
    if (showCredentials) {
      closeCredentials();
    } else if (showSubjectsManager) {
      setShowSubjectsManager(false);
    } else {
      resetForm();
      onClose();
    }
  };

  const handleSubmit = async () => {
    const studentId = student?.id || student?.user_id;
    if (studentId) {
      await submit(studentId);
      onSuccess(); // Chamar onSuccess para atualizar a lista
      onClose(); // Fechar o modal
    } else {
      await createStudent();
    }
  };

  if (showSubjectsManager && student) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <StudentSubjectsManager 
            studentId={student.id || student.user_id} 
            studentName={student.full_name || student.name || formData.fullName}
            studentGrade={student.grade || formData.grade}
            onClose={() => setShowSubjectsManager(false)} 
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        {showCredentials && generatedCredentials ? (
          <CredentialsDisplay 
            credentials={generatedCredentials} 
            onClose={closeCredentials}
          />
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    {student ? (
                      <Edit className="w-4 h-4 text-primary" />
                    ) : (
                      <Plus className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  {student ? 'Editar Estudante' : 'Novo Estudante'}
                </DialogTitle>
                {student && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSubjectsManager(true)}
                    className="flex items-center gap-2"
                  >
                    <GraduationCap className="w-4 h-4" />
                    Disciplinas
                  </Button>
                )}
              </div>
              <DialogDescription>
                {student 
                  ? 'Edite os dados do estudante abaixo.'
                  : 'Preencha os dados abaixo para criar uma nova conta de estudante. Uma senha temporária será gerada automaticamente.'
                }
              </DialogDescription>
            </DialogHeader>

            <StudentForm
              formData={formData}
              errors={errors}
              isLoading={isLoading}
              isValidating={isValidating}
              onChange={updateField}
              onSubmit={handleSubmit}
              onValidateField={validateField}
              isEditing={!!student}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
