import { API_URL } from '@/services/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye, FileText as FileTextIcon, FileCode, Trash2, MessageSquare, Download, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { getActivityGrades, assignActivityGrade, updateActivityGrade, deleteActivityGrade, ActivityGrade, setActivityTeacherObservation, assignManualGradeToTeamMember } from '@/services/activityService';
import ManualGradeModal from './ManualGradeModal';
import { detectMarkdown, markdownToHtml, sanitizeHtml } from '@/utils/markdownUtils';

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
  
  // Estados para atribuição manual de notas
  const [studentsWithoutGrades, setStudentsWithoutGrades] = useState<any[]>([]);
  const [manualGradeModalOpen, setManualGradeModalOpen] = useState(false);
  const [selectedStudentForManualGrade, setSelectedStudentForManualGrade] = useState<any>(null);
  const [activityType, setActivityType] = useState<string>('');
  
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

      // Identificar o tipo de atividade a partir das submissões ou buscar da API
      if (existingSubmissions.length > 0) {
        const hasTeamActivity = existingSubmissions.some(s => s.team_members || s.auto_applied);
        setActivityType(hasTeamActivity ? 'team' : 'individual');
      }

      // Buscar alunos que ainda não têm nota (apenas para atividades em equipe)
      await fetchStudentsWithoutGrades();
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

  const fetchStudentsWithoutGrades = async () => {
    try {
      const allStudents = await getAvailableStudentsForActivity(activityId);
      const studentsWithoutNotes = allStudents.filter((student: any) => !student.already_has_grade);
      setStudentsWithoutGrades(studentsWithoutNotes);
    } catch (error) {
      console.error('Error fetching students without grades:', error);
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
        // Recarregar lista de alunos sem nota
        await fetchStudentsWithoutGrades();
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

  const handleManualGradeClick = (student: any) => {
    setSelectedStudentForManualGrade(student);
    setManualGradeModalOpen(true);
  };

  const handleManualGradeAssigned = async () => {
    // Recarregar as submissões e alunos sem nota
    await fetchActivityGrades();
    setSelectedStudentForManualGrade(null);
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
              {/* Aviso sobre sistema de equipes */}
              {submissions.some(s => s.auto_applied || s.manual_grade || (s.team_members && !s.auto_applied)) && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs">👥</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Sistema de Equipes Ativo</h4>
                      <div className="text-sm text-gray-700 space-y-1">
                        <p>• <strong className="text-yellow-700">👑 Líder da Equipe:</strong> Aluno que fez a submissão original (fundo amarelo)</p>
                        <p>• <strong className="text-blue-700">🤖 Membros da Equipe:</strong> Recebem automaticamente a mesma nota do líder (fundo azul)</p>
                        <p>• <strong className="text-purple-700">✋ Notas Manuais:</strong> Atribuídas manualmente pelo professor (fundo roxo)</p>
                        <p className="text-xs text-gray-600 mt-2">
                          ℹ️ Notas automáticas e manuais não podem ser editadas diretamente nesta tela
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-12 gap-4 font-semibold text-sm text-muted-foreground border-b pb-2">
                  <div className="col-span-2">Aluno</div>
                    <div className="col-span-2">Email / Equipe</div>
                    <div className="col-span-2">Data de Envio</div>
                    <div className="col-span-1">Status</div>
                    <div className="col-span-2">Arquivo</div>
                    <div className="col-span-1">Nota (0-10)</div>
                    <div className="col-span-2">Ações</div>
              </div>

              {submissions.map((submission) => {
                // Identificar o tipo de nota
                const isAutoApplied = submission.auto_applied === true;
                const isManualGrade = submission.manual_grade === true;
                const hasTeamMembers = submission.team_members && submission.team_members.trim();
                const isTeamLeader = hasTeamMembers && !isAutoApplied && !isManualGrade;
                
                // Definir cores e estilos baseados no tipo de nota
                let containerClass = 'grid grid-cols-12 gap-4 items-center p-3 border rounded hover:bg-muted/50 transition-colors';
                if (isAutoApplied) {
                  containerClass += ' bg-blue-50 border-blue-200';
                } else if (isManualGrade) {
                  containerClass += ' bg-purple-50 border-purple-200';
                } else if (isTeamLeader) {
                  containerClass += ' bg-yellow-50 border-yellow-200';
                }
                
                return (
                <div key={submission.id || submission.student_id} className={containerClass}>
                  <div className="col-span-2 font-medium truncate">
                    {submission.student_name_display}
                    {isAutoApplied && (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-xs text-blue-600">Membro da Equipe</span>
                      </div>
                    )}
                    {isManualGrade && (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-xs text-purple-600">Nota Manual</span>
                      </div>
                    )}
                    {isTeamLeader && (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-xs text-yellow-700">Líder da Equipe</span>
                      </div>
                    )}
                  </div>
                  <div className="col-span-2 text-sm text-muted-foreground">
                    <div className="truncate">{submission.student_email}</div>
                    {isTeamLeader && (
                      <div className="text-xs text-yellow-700 mt-1 truncate" title={submission.team_members || ''}>
                        � Líder da Equipe
                      </div>
                    )}
                    {isAutoApplied && (
                      <div className="text-xs text-blue-600 mt-1">
                        🤖 Nota aplicada automaticamente
                      </div>
                    )}
                    {isManualGrade && (
                      <div className="text-xs text-purple-600 mt-1">
                        ✋ Nota atribuída manualmente
                      </div>
                    )}
                  </div>
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
                    {submission.files && submission.files.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {submission.files.map((file, index) => (
                          <Button
                            key={index}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadFile(file.file_url)}
                            className="text-xs h-8 px-2 truncate flex items-center gap-1"
                            title={`Baixar: ${file.file_name}`}
                          >
                            <Download className="w-3 h-3" />
                            {file.file_name.length > 15 ? file.file_name.substring(0, 15) + '...' : file.file_name}
                          </Button>
                        ))}
                      </div>
                    ) : submission.file_name ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadFile(submission.file_path!)}
                        className="text-xs h-8 px-2 flex items-center gap-1"
                        title={`Baixar: ${submission.file_name}`}
                      >
                        <Download className="w-3 h-3" />
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
                      className={`w-20 text-sm ${
                        isAutoApplied ? 'bg-blue-100 border-blue-300' : 
                        isManualGrade ? 'bg-purple-100 border-purple-300' : 
                        isTeamLeader ? 'bg-yellow-100 border-yellow-300' : ''
                      }`}
                      disabled={submission.status === 'pending' || isAutoApplied || isManualGrade}
                      title={
                        isAutoApplied ? 'Nota aplicada automaticamente - edite a nota do líder da equipe' : 
                        isManualGrade ? 'Nota atribuída manualmente - não pode ser editada aqui' : ''
                      }
                    />
                    {isAutoApplied && (
                      <div className="text-xs text-blue-600 mt-1">Auto</div>
                    )}
                    {isManualGrade && (
                      <div className="text-xs text-purple-600 mt-1">Manual</div>
                    )}
                    {isTeamLeader && (
                      <div className="text-xs text-yellow-700 mt-1">Líder</div>
                    )}
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
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                const text = submission.text_submission || '';
                                const formatted = detectMarkdown(text) ? sanitizeHtml(markdownToHtml(text)) : sanitizeHtml(text);
                                setPreviewHtml(formatted);
                                setPreviewOpen(true);
                              }}
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
                );
              })}
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

        {/* 🎯 SEÇÃO DE ALUNOS SEM NOTAS PARA ATRIBUIÇÃO MANUAL */}
        {activityType === 'team' && studentsWithoutGrades.length > 0 && (
          <div className="mt-8 pt-6 border-t">
            <div className="mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Alunos Sem Nota - Atribuição Manual
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Estes alunos da disciplina não possuem nota para esta atividade. 
                Como é uma atividade em equipe, você pode atribuir notas manuais se necessário.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {studentsWithoutGrades.map((student) => (
                <div 
                  key={student.id} 
                  className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium">{student.full_name}</div>
                      <div className="text-sm text-gray-600">{student.email}</div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleManualGradeClick(student)}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Atribuir Nota
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div className="text-sm">
                  <p className="font-medium text-amber-900">Atribuição Manual de Notas</p>
                  <p className="text-amber-700 mt-1">
                    Estas notas serão marcadas como "manuais" e não estão vinculadas ao sistema automático de equipes.
                    Use esta funcionalidade apenas quando necessário.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={saveGrades}>
            Salvar Notas
          </Button>
        </div>

        {/* Modal para Atribuição Manual de Notas */}
        {selectedStudentForManualGrade && (
          <ManualGradeModal
            isOpen={manualGradeModalOpen}
            onOpenChange={setManualGradeModalOpen}
            activityId={activityId}
            activityName={activityName}
            studentName={selectedStudentForManualGrade.full_name}
            enrollmentId={selectedStudentForManualGrade.enrollment_id}
            onGradeAssigned={handleManualGradeAssigned}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
