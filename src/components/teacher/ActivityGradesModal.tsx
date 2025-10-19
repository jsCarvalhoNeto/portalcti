import { API_URL } from '@/services/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { getActivityGrades, assignActivityGrade, updateActivityGrade, deleteActivityGrade, ActivityGrade } from '@/services/activityService';

interface ActivityGradesModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  activityId: number;
  activityName: string;
  subjectId: number;
}

export default function ActivityGradesModal({ isOpen, onOpenChange, activityId, activityName, subjectId }: ActivityGradesModalProps) {
  const [submissions, setSubmissions] = useState<ActivityGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && activityId) {
      fetchActivityGrades();
    }
  }, [isOpen, activityId]);

  const fetchActivityGrades = async () => {
    setLoading(true);
    try {
      // Buscar apenas as submissões para esta atividade (alunos que realmente enviaram)
      const existingSubmissions = await getActivityGrades(activityId);
      setSubmissions(existingSubmissions);
    } catch (error) {
      console.error('Error fetching activity grades:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as submissões da atividade.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (submissionId: number | null, newGrade: string) => {
    const gradeValue = newGrade === '' ? null : parseFloat(newGrade);
    setSubmissions(prev => prev.map(submission => 
      submission.id === submissionId ? { ...submission, grade: gradeValue } : submission
    ));
  };

  const saveGrades = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado.",
        variant: "destructive",
      });
      return;
    }

    try {
      for (const submission of submissions) {
        if (submission.grade !== null) {
          if (submission.grade !== undefined) {
            // Verificar se já existe nota para esta submissão
            if (submission.id) {
              // Atualizar nota existente
              await updateActivityGrade(submission.id, submission.grade);
            } else {
              // Criar nova nota (isso não deve acontecer normalmente, pois as submissões já existem)
              await assignActivityGrade({
                activity_id: activityId,
                enrollment_id: submission.enrollment_id,
                grade: submission.grade,
                graded_by: user.id
              });
            }
          }
        }
      }

      toast({
        title: "Sucesso!",
        description: "Notas salvas com sucesso.",
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving grades:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as notas. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteGrade = async (submissionId: number, studentName: string) => {
    const confirmed = window.confirm(
      `ATENÇÃO: Você está prestes a excluir permanentemente a nota e a submissão de ${studentName}.\n\n` +
      `Esta ação irá remover:\n` +
      `- A nota atribuída\n` +
      `- A submissão do aluno\n` +
      `- O arquivo enviado (se existir)\n\n` +
      `Esta ação não pode ser desfeita. Deseja continuar?`
    );

    if (confirmed) {
      try {
        await deleteActivityGrade(submissionId);
        setSubmissions(prev => prev.filter(submission => submission.id !== submissionId));
        toast({
          title: "Sucesso!",
          description: "Nota excluída com sucesso.",
        });
      } catch (error) {
        console.error('Error deleting grade:', error);
        toast({
          title: "Erro",
          description: "Não foi possível excluir a nota. Tente novamente.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDownloadFile = (filePath: string, fileName: string) => {
    const baseUrl = API_URL.replace('/api', '');
    const fullUrl = `${baseUrl}${filePath}`;
    window.open(fullUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Atribuir Notas - {activityName}</DialogTitle>
          <DialogDescription>
            Visualize e atribua notas para as submissões recebidas
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-4 font-semibold text-sm text-muted-foreground border-b pb-2">
                <div className="col-span-3">Aluno</div>
                <div className="col-span-2">Email</div>
                <div className="col-span-2">Data de Envio</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-1">Arquivo</div>
                <div className="col-span-2">Nota (0-10)</div>
                <div className="col-span-1">Ações</div>
              </div>
              {submissions.map((submission) => (
                <div key={submission.id || submission.student_id} className="grid grid-cols-12 gap-4 items-center p-3 border rounded hover:bg-muted/50 transition-colors">
                  <div className="col-span-3 font-medium">{submission.student_name_display}</div>
                  <div className="col-span-2 text-sm text-muted-foreground">{submission.student_email}</div>
                  <div className="col-span-2 text-sm text-muted-foreground">
                    {submission.submitted_at ? new Date(submission.submitted_at).toLocaleString('pt-BR') : 'N/A'}
                  </div>
                  <div className="col-span-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      submission.status === 'graded' ? 'bg-green-100 text-green-800' : 
                      submission.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {submission.status === 'graded' ? 'Avaliado' : 
                       submission.status === 'submitted' ? 'Enviado' : 'Pendente'}
                    </span>
                  </div>
                  <div className="col-span-1">
                    {submission.file_name ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadFile(submission.file_path!, submission.file_name!)}
                        className="text-xs"
                      >
                        Baixar
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Nenhum</span>
                    )}
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={submission.grade ?? ''}
                      onChange={(e) => handleGradeChange(submission.id, e.target.value)}
                      placeholder={submission.status === 'pending' ? 'N/A' : 'Nota'}
                      className="w-full text-sm"
                      disabled={submission.status === 'pending'}
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {submission.id ? (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteGrade(submission.id, submission.student_name_display)}
                        className="text-xs h-8 w-8 p-0"
                        title="Excluir nota e submissão"
                      >
                        🗑️
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={saveGrades}>
            Salvar Notas
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
