import { API_URL } from '@/services/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye, FileText as FileTextIcon, FileCode, Trash2, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { getActivityGrades, assignActivityGrade, updateActivityGrade, deleteActivityGrade, ActivityGrade, setActivityTeacherObservation } from '@/services/activityService';

interface ActivityGradesModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  activityId: number;
  activityName: string;
  subjectId: number;
}
  

export default function ActivityGradesModal({ isOpen, onOpenChange, activityId, activityName }: ActivityGradesModalProps) {
  const [submissions, setSubmissions] = useState<ActivityGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [obsOpen, setObsOpen] = useState(false);
  const [obsHtml, setObsHtml] = useState('');
  const [obsTargetId, setObsTargetId] = useState<number | null>(null);
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

  const handleDownloadFile = (filePath: string) => {
    const baseUrl = API_URL.replace('/api', '');
    const fullUrl = `${baseUrl}${filePath}`;
    window.open(fullUrl, '_blank');
  };

  const handleDownloadText = (textHtml: string | undefined, studentName: string) => {
    if (!textHtml) return;
    try {
      // Convert HTML to plain text by using a DOM element
      const tmp = document.createElement('div');
      tmp.innerHTML = textHtml;
      const plain = tmp.textContent || tmp.innerText || '';

      const blob = new Blob([plain], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const safeName = studentName ? studentName.replace(/[^a-z0-9\-_ ]/gi, '_') : 'submission';
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeName}_submission.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error downloading text submission:', e);
      toast({ title: 'Erro', description: 'Não foi possível baixar o texto.', variant: 'destructive' });
    }
  };

  const handleDownloadHtml = (html: string | undefined, studentName: string) => {
    if (!html) return;
    try {
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const safeName = studentName ? studentName.replace(/[^a-z0-9\-_ ]/gi, '_') : 'submission';
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeName}_submission.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error downloading html submission:', e);
      toast({ title: 'Erro', description: 'Não foi possível baixar o HTML.', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
  <DialogContent className="sm:max-w-7xl max-w-[90vw] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Atribuir Notas - {activityName}</DialogTitle>
          <DialogDescription>
            Visualize e atribua notas para as submissões recebidas
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {/* Legend for action icons (buttons are icon-only) */}
          <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-8 w-8 p-0" aria-hidden>
                <Eye className="w-4 h-4" />
              </Button>
              <span>Visualizar submissão</span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" aria-hidden>
                <FileTextIcon className="w-4 h-4" />
              </Button>
              <span>Baixar como .txt</span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" aria-hidden>
                <FileCode className="w-4 h-4" />
              </Button>
              <span>Baixar HTML original</span>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-4 font-semibold text-sm text-muted-foreground border-b pb-2">
                  <div className="col-span-2">Aluno</div>
                    <div className="col-span-2">Email</div>
                    <div className="col-span-2">Data de Envio</div>
                    <div className="col-span-1">Status</div>
                    <div className="col-span-2">Arquivo</div>
                    <div className="col-span-1">Nota (0-10)</div>
                    <div className="col-span-2">Ações</div>
              </div>

              {submissions.map((submission) => (
                <div key={submission.id || submission.student_id} className="grid grid-cols-12 gap-4 items-center p-3 border rounded hover:bg-muted/50 transition-colors">
                  <div className="col-span-2 font-medium truncate">{submission.student_name_display}</div>
                  <div className="col-span-2 text-sm text-muted-foreground truncate">{submission.student_email}</div>
                  <div className="col-span-2 text-sm text-muted-foreground truncate">
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
                  <div className="col-span-2">
                    {submission.file_name ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadFile(submission.file_path!)}
                        className="text-xs h-8 px-2"
                      >
                        Baixar
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Nenhum</span>
                    )}
                  </div>
                  <div className="col-span-1">
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={submission.grade ?? ''}
                      onChange={(e) => handleGradeChange(submission.id, e.target.value)}
                      placeholder={submission.status === 'pending' ? 'N/A' : 'Nota'}
                      className="w-16 text-sm"
                      disabled={submission.status === 'pending'}
                    />
                  </div>
                  <div className="col-span-2 flex justify-center">
                    {submission.id ? (
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          type="button"
                          variant={submission.teacher_observation ? 'outline' : 'ghost'}
                          size="sm"
                          onClick={() => { setObsTargetId(submission.id || null); setObsHtml(submission.teacher_observation || ''); setObsOpen(true); }}
                          className="h-8 w-8 p-0"
                          title="Observação"
                          aria-label="Observação"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                        {submission.text_submission ? (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => { setPreviewHtml(submission.text_submission || ''); setPreviewOpen(true); }}
                              className="h-8 w-8 p-0"
                              title="Visualizar texto da submissão"
                              aria-label="Visualizar submissão"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadText(submission.text_submission || undefined, submission.student_name_display || '')}
                              className="h-8 w-8 p-0"
                              title="Baixar como .txt"
                              aria-label="Baixar como txt"
                            >
                              <FileTextIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadHtml(submission.text_submission || undefined, submission.student_name_display || '')}
                              className="h-8 w-8 p-0"
                              title="Baixar HTML original"
                              aria-label="Baixar HTML"
                            >
                              <FileCode className="w-4 h-4" />
                            </Button>
                          </>
                        ) : null}
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => submission.id && handleDeleteGrade(submission.id, submission.student_name_display)}
                          className="h-8 w-8 p-0"
                          title="Excluir nota e submissão"
                          aria-label="Excluir submissão"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Preview dialog for text submissions */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Visualizar Submissão do Aluno</DialogTitle>
              <DialogDescription>Conteúdo digitado pelo aluno (HTML sanitizado)</DialogDescription>
            </DialogHeader>
            <div className="prose max-w-full p-4" dangerouslySetInnerHTML={{ __html: previewHtml }} />
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => setPreviewOpen(false)}>Fechar</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Observação modal (professor) */}
        <Dialog open={obsOpen} onOpenChange={setObsOpen}>
          <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Observação para o aluno</DialogTitle>
              <DialogDescription>Digite uma observação que será enviada ao aluno (HTML permitido)</DialogDescription>
            </DialogHeader>
            <div className="p-4">
              <label className="text-sm font-medium">Observação (HTML)</label>
              <textarea
                value={obsHtml}
                onChange={(e) => setObsHtml(e.target.value)}
                className="w-full h-40 p-2 mt-2 border rounded resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setObsOpen(false)}>Cancelar</Button>
              <Button onClick={async () => {
                if (!obsTargetId) return;
                try {
                  await setActivityTeacherObservation(obsTargetId, obsHtml || null);
                  toast({ title: 'Sucesso', description: 'Observação salva.' });
                  // atualizar lista localmente
                  setSubmissions(prev => prev.map(s => s.id === obsTargetId ? { ...s, teacher_observation: obsHtml } : s));
                  setObsOpen(false);
                } catch (e) {
                  console.error(e);
                  toast({ title: 'Erro', description: 'Não foi possível salvar a observação.', variant: 'destructive' });
                }
              }}>Enviar Observação</Button>
            </div>
          </DialogContent>
        </Dialog>
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
