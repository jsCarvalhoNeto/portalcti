import { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  FileText,
  Upload,
  Users,
  Clock,
  Activity
} from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import { subjectService } from '@/services/subjectService';
import { Subject } from '@/types/subject';
import FileUpload from '@/components/FileUpload';
import FileList from '@/components/FileList';

export default function ActivityFiles() {
  const { id, activityId } = useParams<{ id: string; activityId: string }>();
  const { user, isStudent, isTeacher, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshFiles, setRefreshFiles] = useState(0);

  // Mock da atividade - em produção viria do backend
  const mockActivity = {
    id: parseInt(activityId || '1'),
    name: 'Desenvolvimento de Sistema Web',
    description: 'Desenvolva um sistema web completo utilizando as tecnologias estudadas em aula.',
    type: 'project',
    year: '2', // Segundo ano
    period: '03', // Terceiro período
    subject_name: 'Desenvolvimento Web'
  };

  useEffect(() => {
    if (id) {
      fetchSubject();
    }
  }, [id]);

  const fetchSubject = async () => {
    try {
      setLoading(true);
      const subjectData = await subjectService.getById(id!);
      setSubject(subjectData);
    } catch (error) {
      console.error('Error fetching subject:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUploadComplete = () => {
    // Atualizar lista de arquivos
    setRefreshFiles(prev => prev + 1);
  };

  const handleFileDeleted = () => {
    // Atualizar lista de arquivos
    setRefreshFiles(prev => prev + 1);
  };

  if (authLoading || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!subject) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Disciplina não encontrada</h1>
            <p className="text-muted-foreground">A disciplina que você está procurando não existe.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div>
        {/* Header */}
        <header className="bg-card border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate(`/subject/${id}`)}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </Button>
                <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{mockActivity.name}</h1>
                  <p className="text-muted-foreground">{subject.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {mockActivity.year}º Ano - {mockActivity.period}º Período
                </Badge>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Informações da atividade */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Descrição da Atividade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{mockActivity.description}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>Individual ou em grupo</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>Prazo: 2 semanas</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs para diferentes tipos de usuário */}
          <Tabs defaultValue={isStudent ? "submit" : "manage"} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="submit" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                {isStudent ? 'Enviar Resposta' : 'Anexar Arquivos'}
              </TabsTrigger>
              <TabsTrigger value="view" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Ver Arquivos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="submit" className="space-y-6">
              {isStudent && (
                <FileUpload
                  activityId={mockActivity.id}
                  enrollmentId={1} // Em produção, viria do contexto do usuário
                  type="student-response"
                  activityData={{
                    year: mockActivity.year,
                    subject: mockActivity.subject_name,
                    period: mockActivity.period
                  }}
                  multiple={true}
                  maxFiles={10}
                  onUploadComplete={handleFileUploadComplete}
                  onError={(error) => console.error('Erro no upload:', error)}
                />
              )}

              {isTeacher && (
                <FileUpload
                  activityId={mockActivity.id}
                  type="activity"
                  activityData={{
                    year: mockActivity.year,
                    subject: mockActivity.subject_name,
                    period: mockActivity.period
                  }}
                  multiple={true}
                  maxFiles={10}
                  onUploadComplete={handleFileUploadComplete}
                  onError={(error) => console.error('Erro no upload:', error)}
                />
              )}
            </TabsContent>

            <TabsContent value="view" className="space-y-6">
              {/* Arquivos da atividade (do professor) */}
              <FileList
                key={`activity-${refreshFiles}`}
                activityId={mockActivity.id}
                type="activity"
                canDelete={isTeacher}
                onFileDeleted={handleFileDeleted}
              />

              {/* Arquivos dos alunos (apenas para professores) */}
              {isTeacher && (
                <FileList
                  key={`student-${refreshFiles}`}
                  activityId={mockActivity.id}
                  type="student-responses"
                  canDelete={true}
                  onFileDeleted={handleFileDeleted}
                />
              )}
            </TabsContent>
          </Tabs>

          {/* Instruções */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Instruções Importantes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground space-y-2">
                <p>• <strong>Tipos de arquivo aceitos:</strong> PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, ZIP, RAR, TXT, HTML, CSS, JS, imagens, áudio e vídeo</p>
                <p>• <strong>Tamanho máximo:</strong> 50MB por arquivo</p>
                <p>• <strong>Organização:</strong> Os arquivos são automaticamente organizados no Google Drive por Ano → Disciplina → Período</p>
                <p>• <strong>Compartilhamento:</strong> Todos os arquivos são automaticamente compartilhados entre professor e alunos</p>
                {isStudent && (
                  <p>• <strong>Para alunos:</strong> Você pode enviar múltiplos arquivos como resposta à atividade</p>
                )}
                {isTeacher && (
                  <p>• <strong>Para professores:</strong> Você pode anexar arquivos de apoio e gerenciar as respostas dos alunos</p>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </MainLayout>
  );
}