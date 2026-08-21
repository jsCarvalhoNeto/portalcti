import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home,
  FileText, 
  BookOpen, 
  Activity, 
  PenTool, 
  FolderOpen, 
  ClipboardList, 
  Settings, 
  ArrowLeft, 
  Save, 
  Edit3,
  Gamepad2,
  Wrench,
  Megaphone
} from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import { subjectService, Subject } from '@/services/subjectService';
import { 
  subjectContentService, 
  SubjectContent, 
  SubjectResource, 
  REVERSE_SECTION_TYPE_MAP 
} from '@/services/subjectContentService';
import MarkdownRichTextEditor from '@/components/MarkdownRichTextEditor';
import SubjectSchedulePanel from '@/components/subject/SubjectSchedulePanel';

interface QuickAccessItem {
  icon: any;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  onClick?: () => void;
}

export default function TeacherSubjectEditor() {
  const { id } = useParams<{ id: string }>();
  const { user, isTeacher, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('inicio');
  const [contentData, setContentData] = useState<Record<string, SubjectContent[]>>({
    conteudo: [],
    material: [],
    atividades: [],
    exercicios: [],
    projetos: [],
    avaliacoes: [],
    recursos: []
  });
  const [resourcesData, setResourcesData] = useState<Record<string, SubjectResource[]>>({
    conteudo: [],
    material: [],
    atividades: [],
    exercicios: [],
    projetos: [],
    avaliacoes: [],
    recursos: []
  });

  const quickAccessItems: QuickAccessItem[] = [
    {
      icon: Gamepad2,
      title: 'Atividades Interativas',
      description: 'Jogos e simuladores educativos',
      color: 'text-purple-400',
      bgColor: 'bg-gray-800',
      onClick: () => navigate(`/disciplinas/${id}/interactive-activities`)
    },
    {
      icon: BookOpen,
      title: 'Cronograma e Material',
      description: 'Cronograma de aulas e material didático',
      color: 'text-blue-400',
      bgColor: 'bg-gray-800',
      onClick: () => setActiveTab('material')
    },
    {
      icon: PenTool,
      title: 'Exercícios',
      description: 'Listas de exercícios práticos',
      color: 'text-orange-400',
      bgColor: 'bg-gray-800',
      onClick: () => setActiveTab('exercicios')
    },
    {
      icon: Wrench,
      title: 'Projetos',
      description: 'Projetos práticos para desenvolver',
      color: 'text-emerald-400',
      bgColor: 'bg-gray-800',
      onClick: () => setActiveTab('projetos')
    }
  ];

  const fetchSubjectData = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      
      // Buscar detalhes da disciplina no Supabase
      const subjectResponse = await subjectService.getById(id);
      setSubject(subjectResponse);

      // Buscar todos os conteúdos da disciplina no Supabase
      const allContents = await subjectContentService.getAllBySubject(id);

      // Buscar recursos da disciplina no Supabase
      const allResources = await subjectContentService.getResourcesBySubject(id);

      const newContentData: Record<string, SubjectContent[]> = {
        conteudo: [],
        material: [],
        atividades: [],
        exercicios: [],
        projetos: [],
        avaliacoes: [],
        recursos: []
      };

      const newResourcesData: Record<string, SubjectResource[]> = {
        conteudo: [],
        material: [],
        atividades: [],
        exercicios: [],
        projetos: [],
        avaliacoes: [],
        recursos: []
      };

      // Organizar conteúdos pelas abas em português
      allContents.forEach(item => {
        const tabKey = REVERSE_SECTION_TYPE_MAP[item.section_type] || item.section_type;
        if (newContentData[tabKey]) {
          newContentData[tabKey].push(item);
        } else {
          newContentData[tabKey] = [item];
        }
      });

      // Organizar recursos
      allResources.forEach(res => {
        newResourcesData['recursos'].push(res);
      });

      setContentData(newContentData);
      setResourcesData(newResourcesData);
    } catch (error) {
      console.error('Error fetching subject data:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar dados da disciplina',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    if (id && user?.id && isTeacher) {
      fetchSubjectData();
    }
  }, [id, user?.id, isTeacher, fetchSubjectData]);

  const handleSaveContent = async (section: string, content: string, showToast = true) => {
    if (!id) return;
    console.log('🔍 handleSaveContent - Salvando no Supabase:', { section, length: content?.length });
    
    try {
      // Limpar tags HTML vazias e espaços em branco
      const cleanContent = (content || '')
        .replace(/<p><br><\/p>/g, '')
        .replace(/<p>\s*<\/p>/g, '')
        .replace(/<br\s*\/?>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim();

      // Se o conteúdo está vazio após limpeza, limpar a seção
      if (!cleanContent || cleanContent === '<p></p>' || cleanContent === '') {
        return await handleClearContent(section, showToast);
      }
      
      const sectionLabels: Record<string, string> = {
        'conteudo': 'Ementa',
        'material': 'Cronograma',
        'atividades': 'Escopo',
        'exercicios': 'Exercícios',
        'projetos': 'Projetos',
        'avaliacoes': 'Avaliações',
        'recursos': 'Recursos'
      };

      const title = sectionLabels[section] || section;

      await subjectContentService.saveContent(id, section, title, cleanContent);

      if (showToast) {
        toast({
          title: 'Sucesso',
          description: `Conteúdo de ${title} salvo com sucesso!`,
        });
        fetchSubjectData();
      }
    } catch (error) {
      console.error('❌ handleSaveContent - Erro ao salvar conteúdo:', error);
      if (showToast) {
        toast({
          title: 'Erro',
          description: `Falha ao salvar conteúdo de ${section}`,
          variant: 'destructive',
        });
      }
      throw error;
    }
  };

  const handleClearContent = async (section: string, showToast = true) => {
    if (!id) return;
    
    if (showToast) {
      const confirmed = window.confirm(`Tem certeza que deseja limpar todo o conteúdo desta seção? Esta ação não pode ser desfeita.`);
      if (!confirmed) return;
    }

    try {
      await subjectContentService.clearSectionContent(id, section);

      setContentData(prev => ({
        ...prev,
        [section]: []
      }));

      if (showToast) {
        toast({
          title: 'Sucesso',
          description: `Conteúdo da seção foi limpo com sucesso!`,
        });
        fetchSubjectData();
      }
    } catch (error) {
      console.error('❌ handleClearContent - Erro ao limpar conteúdo:', error);
      if (showToast) {
        toast({
          title: 'Erro',
          description: `Falha ao limpar conteúdo da seção`,
          variant: 'destructive',
        });
      }
      throw error;
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const sections = ['conteudo', 'material', 'atividades', 'exercicios', 'projetos', 'avaliacoes', 'recursos'];
      for (const section of sections) {
        const currentContent = contentData[section]?.[0]?.content;
        if (currentContent !== undefined && currentContent !== null) {
          await handleSaveContent(section, currentContent, false);
        }
      }
      await fetchSubjectData();
      toast({
        title: 'Sucesso',
        description: 'Todo o conteúdo foi salvo com sucesso!',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao salvar alguns conteúdos',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!user || !isTeacher) {
    return <Navigate to="/auth" replace />;
  }

  if (!subject) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Disciplina não encontrada</h1>
            <p className="text-muted-foreground mb-4">A disciplina que você está procurando não existe ou você não tem acesso.</p>
            <Button onClick={() => navigate('/teacher')}>Voltar ao Painel</Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const navItems = [
    { value: 'inicio', label: 'Início', icon: Home },
    { value: 'conteudo', label: 'Ementa', icon: FileText },
    { value: 'material', label: 'Cronograma', icon: BookOpen },
    { value: 'atividades', label: 'Escopo', icon: Activity },
    { value: 'exercicios', label: 'Exercícios', icon: PenTool },
    { value: 'projetos', label: 'Projetos', icon: FolderOpen },
    { value: 'avaliacoes', label: 'Avaliações', icon: ClipboardList },
    { value: 'recursos', label: 'Recursos', icon: Settings },
  ];

  const editorTabs = navItems.filter(item => item.value !== 'inicio');

  return (
    <MainLayout>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="min-h-screen pb-12">
        {/* Header */}
        <header className="bg-card border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/teacher')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </Button>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Edit3 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{subject.name}</h1>
                  <p className="text-sm text-muted-foreground">Painel de Edição de Conteúdo - Professor</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  Professor
                </Badge>
                <Button 
                  variant="default" 
                  className="flex items-center gap-2"
                  onClick={handleSaveAll}
                  disabled={saving}
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Salvando...' : 'Salvar Tudo'}
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="bg-primary/95 shadow-sm">
          <div className="container mx-auto px-4">
            <TabsList className="w-full justify-start h-auto p-0 bg-transparent flex-wrap">
              {navItems.map(item => (
                <TabsTrigger 
                  key={item.value}
                  value={item.value} 
                  className="text-primary-foreground/80 hover:bg-white/10 data-[state=active]:bg-white/20 data-[state=active]:text-primary-foreground flex items-center gap-2 px-4 py-3 rounded-none text-sm font-medium transition-colors"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>
        
        <main className="container mx-auto px-4 py-8">
          {/* Início tab */}
          <TabsContent value="inicio" className="space-y-10 mt-0">
            {/* Welcome Section */}
            <Card className="bg-card border">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold mb-2 text-foreground">
                      Bem-vindos à {subject.name}! 🚀
                    </h2>
                    <p className="text-lg text-muted-foreground">
                      {subject.description || 'Bem-vindo ao ambiente de aprendizado desta disciplina.'}
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center bg-background rounded-lg p-4 w-28 border">
                      <p className="font-bold text-xl text-foreground">
                        {subject.workload_hours ? `${subject.workload_hours}h` : '100h'}
                      </p>
                      <p className="text-sm text-muted-foreground">Carga Horária</p>
                    </div>
                    <div className="text-center bg-background rounded-lg p-4 w-28 border">
                      <p className="font-bold text-xl text-foreground">{subject.grade || '1º Ano'}</p>
                      <p className="text-sm text-muted-foreground">Série</p>
                    </div>
                    <div className="text-center bg-background rounded-lg p-4 w-28 border">
                      <p className="font-bold text-xl text-foreground">Técnico</p>
                      <p className="text-sm text-muted-foreground">Nível</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Access */}
            <div>
              <h3 className="text-2xl font-semibold mb-6 text-foreground">Acesso Rápido</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {quickAccessItems.map((item: QuickAccessItem, index: number) => (
                  <Card 
                    key={index} 
                    className="bg-card border hover:bg-accent transition-all duration-300 cursor-pointer"
                    onClick={item.onClick}
                  >
                    <CardContent className="p-6">
                      <item.icon className={`w-7 h-7 mb-4 ${item.color}`} />
                      <h4 className="font-semibold text-lg mb-1 text-card-foreground">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Important Announcements */}
            <div>
              <h3 className="text-2xl font-semibold mb-6 text-foreground">Anúncios Importantes</h3>
              <Card className="bg-card border">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-destructive/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Megaphone className="w-4 h-4 text-destructive" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-card-foreground mb-1">Início das Aulas</h4>
                      <p className="text-muted-foreground mb-3">
                        As aulas de {subject.name} começam na próxima semana. Preparem-se!
                      </p>
                      <Badge variant="destructive">Semestre 2026.2</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Editores de Conteúdo */}
          {editorTabs.map(item => (
            <TabsContent key={item.value} value={item.value} className="space-y-6 mt-0">
              {item.value === 'material' ? (
                <SubjectSchedulePanel
                  subjectId={id || ''}
                  subjectName={subject.name}
                  canManage={true}
                />
              ) : (
                <>
                  <Card className="bg-card border shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <item.icon className="w-5 h-5 text-primary" />
                        {item.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <MarkdownRichTextEditor
                          key={`${id}-${item.value}`}
                          content={contentData[item.value] 
                            ? contentData[item.value].map(content => content.content).join('\n\n') 
                            : ''
                          }
                          className="min-h-[250px] max-h-[60vh] overflow-y-auto"
                          onChange={(newContent: string) => {
                            setContentData(prev => ({
                              ...prev,
                              [item.value]: [{
                                id: prev[item.value]?.[0]?.id || 'new',
                                subject_id: Number(id),
                                section_type: item.value,
                                title: item.label,
                                content: newContent,
                                order_index: 0,
                                is_active: true
                              }]
                            }));
                          }}
                          placeholder={`Digite o conteúdo de ${item.label}...`}
                        />
                        
                        <div className="flex justify-end gap-2 pt-2">
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleClearContent(item.value)}
                          >
                            Limpar {item.label}
                          </Button>
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => {
                              const content = contentData[item.value]?.[0]?.content || '';
                              handleSaveContent(item.value, content);
                            }}
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Salvar {item.label}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Resources Section */}
                  <Card className="bg-card border shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base">Recursos de {item.label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {resourcesData[item.value]?.length > 0 ? (
                          resourcesData[item.value].map((resource, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                  <BookOpen className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-sm">{resource.title}</h4>
                                  {resource.description && (
                                    <p className="text-xs text-muted-foreground">{resource.description}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground/60 italic">Nenhum recurso anexado ainda...</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          ))}
        </main>
      </Tabs>
    </MainLayout>
  );
}

