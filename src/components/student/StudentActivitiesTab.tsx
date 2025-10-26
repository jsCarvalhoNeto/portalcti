import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Download, FileText, Search } from 'lucide-react';
import { StudentActivity, getStudentActivities, submitStudentActivity } from '@/services/activityService';
import * as gamificationService from '@/services/gamificationService';

interface SubmissionData {
  activity_id: number;
  student_name: string;
  team_members: string;
  file: File | null;
}

export default function StudentActivitiesTab() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [activities, setActivities] = useState<StudentActivity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<StudentActivity[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [teachers, setTeachers] = useState<string[]>([]);
  const statuses = ['pending', 'submitted', 'completed', 'graded'];
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<StudentActivity | null>(null);
  const [submissionData, setSubmissionData] = useState<SubmissionData>({
    activity_id: 0,
    student_name: profile?.full_name || '',
    team_members: '',
    file: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Estados de notas removidos - todas as funcionalidades de notas estão no painel Notas & Desempenho

  useEffect(() => {
    if (user) {
      fetchActivities();
    }
  }, [user]);

  useEffect(() => {
    // Extrair professores únicos das atividades
    const uniqueTeachers = [...new Set(activities.map(activity => activity.teacher_name))].filter(Boolean) as string[];
    setTeachers(uniqueTeachers.sort());
  }, [activities]);

  useEffect(() => {
    // Aplicar todos os filtros combinados
    let filtered = [...activities];

    if (selectedSubject) {
      filtered = filtered.filter(activity => activity.subject_name === selectedSubject);
    }

    if (selectedTeacher) {
      filtered = filtered.filter(activity => activity.teacher_name === selectedTeacher);
    }

    if (selectedStatus) {
      filtered = filtered.filter(activity => activity.status === selectedStatus);
    }

    if (searchTerm) {
      filtered = filtered.filter(activity => 
        activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.teacher_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredActivities(filtered);
  }, [activities, selectedSubject, selectedTeacher, selectedStatus, searchTerm]);

  const fetchActivities = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Usar o service para buscar atividades do aluno
      const activitiesData = await getStudentActivities();
      setActivities(activitiesData);
      
      // Extrair disciplinas únicas das atividades
      const uniqueSubjects = [...new Set(activitiesData.map((activity: StudentActivity) => activity.subject_name))].filter(Boolean) as string[];
      setSubjects(uniqueSubjects.sort());
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar atividades",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Função fetchActivityGrades removida - todas as funcionalidades de notas estão no painel Notas & Desempenho

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // Validação de tipo de arquivo
      const allowedTypes = ['application/pdf', 'text/plain', 'application/vnd.ms-powerpoint', 
                           'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                           'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                           'application/zip', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      
      if (!allowedTypes.includes(selectedFile.type)) {
        toast({
          title: "Tipo de arquivo não suportado",
          description: "Formatos permitidos: PDF, TXT, PPT, PPTX, DOC, DOCX, ZIP, JPG, PNG, GIF, WEBP",
          variant: "destructive",
        });
        return;
      }

      setSubmissionData({
        ...submissionData,
        file: selectedFile
      });
    }
  };

  const handleSubmitActivity = async () => {
    if (!selectedActivity) return;

    if (selectedActivity.type === 'individual' && !submissionData.student_name.trim()) {
      toast({
        title: "Erro de Validação",
        description: "Por favor, informe seu nome para atividade individual.",
        variant: "destructive",
      });
      return;
    }

    if (selectedActivity.type === 'team' && !submissionData.team_members.trim()) {
      toast({
        title: "Erro de Validação",
        description: "Por favor, informe os nomes dos membros da equipe.",
        variant: "destructive",
      });
      return;
    }

    if (!submissionData.file) {
      toast({
        title: "Erro de Validação",
        description: "Por favor, selecione um arquivo para enviar.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('activity_id', selectedActivity.id.toString());
      formData.append('student_name', submissionData.student_name);
      formData.append('team_members', submissionData.team_members);
      formData.append('file', submissionData.file);

      // Usar o service para enviar a atividade
      await submitStudentActivity(formData);

      toast({
        title: "Sucesso!",
        description: "Atividade enviada com sucesso.",
      });

      // Registrar pontos de gamificação para submissão de atividade (+100)
      try {
        if (user && selectedActivity) {
          // Tentar enviar subject/discipline identificador quando disponível.
          // A API de atividades retorna `subject_name`; se você tiver subject_id disponível no payload do backend, prefira passá-lo.
          const subjectIdForGamify = (selectedActivity as any).subject_id || selectedActivity.subject_name || undefined;
          const res = await gamificationService.awardSubmission(user.id, selectedActivity.id.toString(), subjectIdForGamify);
          if (res && (res as any).awarded) {
            toast({ title: 'Pontos recebidos', description: `+${(res as any).awarded} pontos por envio de atividade` });
          }
        }
      } catch (e) {
        console.error('Erro ao disparar gamification awardSubmission:', e);
      }

      // Atualizar o status da atividade selecionada para 'submitted'
      setActivities(prevActivities => 
        prevActivities.map(activity => 
          activity.id === selectedActivity.id 
            ? { ...activity, status: 'submitted' }
            : activity
        )
      );

      // Limpar seleção e dados
      setSelectedActivity(null);
      setSubmissionData({
        activity_id: 0,
        student_name: profile?.full_name || '',
        team_members: '',
        file: null
      });
    } catch (error) {
      console.error('Error submitting activity:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a atividade. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

   const handleDownloadFile = (filePath: string, fileName: string) => {
    // Construir a URL completa para download usando a URL base da API
    const fullUrl = `${import.meta.env.VITE_API_URL.replace('/api', '')}${filePath}`;
    const link = document.createElement('a');
    link.href = fullUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Função para obter badge de status com cores diferentes
  const getStatusBadge = (status: StudentActivity['status']) => {
    const statusConfig = {
      pending: { text: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
      submitted: { text: 'Enviado', color: 'bg-blue-100 text-blue-800' },
      completed: { text: 'Concluído', color: 'bg-green-100 text-green-800' }
    };
    const config = statusConfig[status];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Atividades</h2>
            <p className="text-muted-foreground">Atividades criadas pelos professores para suas disciplinas</p>
          </div>
          {/* Botão de ver notas removido - todas as notas estão no painel Notas & Desempenho */}
        </div>

        {/* Filtros */}
        <div className="flex flex-col lg:flex-row gap-4 p-4 bg-muted/20 rounded-lg">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <Input
              placeholder="Buscar atividades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
          
          {subjects.length > 0 && (
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-background min-w-[180px]"
            >
              <option value="">Todas as disciplinas</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          )}

          {teachers.length > 0 && (
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-background min-w-[180px]"
            >
              <option value="">Todos os professores</option>
              {teachers.map((teacher) => (
                <option key={teacher} value={teacher}>
                  {teacher}
                </option>
              ))}
            </select>
          )}

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-background min-w-[140px]"
          >
            <option value="">Todos os status</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status === 'pending' ? 'Pendente' : 
                 status === 'submitted' ? 'Enviado' : 
                 status === 'completed' ? 'Concluído' : 'Avaliado'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bloco de notas removido - todas as funcionalidades de notas estão no painel Notas & Desempenho */}

      {/* Bloco condicional removido - simplificando para mostrar apenas as atividades */}
      {selectedActivity ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {selectedActivity.name}
            </CardTitle>
            <CardDescription>
              Disciplina: {selectedActivity.subject_name} | Professor: {selectedActivity.teacher_name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Tipo de Atividade</Label>
                <div className="mt-1">
                  <Badge variant={selectedActivity.type === 'individual' ? 'default' : 'secondary'}>
                    {selectedActivity.type === 'individual' ? 'Individual' : 'Em Equipe'}
                  </Badge>
                </div>
              </div>

              <div>
                <Label>Status</Label>
                <div className="mt-1">
                  {getStatusBadge(selectedActivity.status)}
                </div>
              </div>

              {selectedActivity.description && (
                <div>
                  <Label>Descrição</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedActivity.description}</p>
                </div>
              )}

              {selectedActivity.file_path && selectedActivity.file_name && (
                <div>
                  <Label>Arquivo do Professor</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-muted-foreground">{selectedActivity.file_name}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadFile(selectedActivity.file_path!, selectedActivity.file_name!)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Baixar
                    </Button>
                  </div>
                </div>
              )}

              {selectedActivity.type === 'individual' ? (
                <div>
                  <Label htmlFor="student_name">Seu Nome</Label>
                  <Input
                    id="student_name"
                    value={submissionData.student_name}
                    onChange={(e) => setSubmissionData({
                      ...submissionData,
                      student_name: e.target.value
                    })}
                    placeholder="Digite seu nome completo"
                  />
                </div>
              ) : (
                <div>
                  <Label htmlFor="team_members">Membros da Equipe</Label>
                  <Textarea
                    id="team_members"
                    value={submissionData.team_members}
                    onChange={(e) => setSubmissionData({
                      ...submissionData,
                      team_members: e.target.value
                    })}
                    placeholder="Digite os nomes dos membros da equipe, um por linha"
                    rows={3}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="submission_file">Arquivo de Submissão</Label>
                <div className="space-y-2">
                  <Input
                    id="submission_file"
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.txt,.ppt,.pptx,.doc,.docx,.zip,.jpg,.jpeg,.png,.gif,.webp"
                  />
                  {submissionData.file && (
                    <p className="text-sm text-muted-foreground">Arquivo selecionado: {submissionData.file.name}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setSelectedActivity(null);
                    setSubmissionData({
                      activity_id: 0,
                      student_name: profile?.full_name || '',
                      team_members: '',
                      file: null
                    });
                  }}
                >
                  Voltar
                </Button>
                <Button
                  onClick={handleSubmitActivity}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar Atividade'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActivities.length > 0 ? (
            filteredActivities.map((activity) => (
              <Card key={activity.id} className="hover:shadow-glow transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-lg">{activity.name}</CardTitle>
                  <CardDescription>
                    {activity.subject_name} | {activity.teacher_name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          activity.type === 'individual' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {activity.type === 'individual' ? 'Individual' : 'Em Equipe'}
                        </span>
                        {getStatusBadge(activity.status)}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(activity.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    
                    {activity.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {activity.description}
                      </p>
                    )}

                    {activity.file_path && activity.file_name && (
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-800" />
                        <span className="text-xs text-muted-foreground truncate">
                          {activity.file_name}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadFile(activity.file_path!, activity.file_name!)}
                          title="Baixar arquivo do professor"
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    )}

                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setSelectedActivity(activity);
                        setSubmissionData({
                          ...submissionData,
                          activity_id: activity.id
                        });
                      }}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Fazer Atividade
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">Nenhuma atividade encontrada</h3>
              <p className="text-muted-foreground">Não há atividades disponíveis para as disciplinas selecionadas.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
