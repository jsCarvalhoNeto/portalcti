import { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Home, 
  FileText, 
  BookOpen, 
  Activity, 
  PenTool, 
  FolderOpen, 
  ClipboardList, 
  Settings,
  Gamepad2,
  Wrench,
  Megaphone
} from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import { subjectService } from '@/services/subjectService';
import { Subject } from '@/types/subject';
import { 
  subjectContentService, 
  SubjectContent, 
  normalizeSectionType 
} from '@/services/subjectContentService';
import { detectMarkdown, markdownToHtml, sanitizeHtml } from '@/utils/markdownUtils';

interface QuickAccessItem {
  icon: any;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  onClick?: () => void;
}

export default function SubjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isStudent, loading } = useAuth();
  const navigate = useNavigate();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [content, setContent] = useState<Record<string, SubjectContent[]>>({});
  const [resources, setResources] = useState<SubjectResource[]>([]);
  const [loadingSubject, setLoadingSubject] = useState(true);
  const [loadingContent, setLoadingContent] = useState(false);
  const [activeTab, setActiveTab] = useState('inicio');

  // Definir quickAccessItems vinculados às abas
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
      onClick: () => setActiveTab('exercises')
    },
    {
      icon: Wrench,
      title: 'Projetos',
      description: 'Projetos práticos para desenvolver',
      color: 'text-emerald-400',
      bgColor: 'bg-gray-800',
      onClick: () => setActiveTab('projects')
    }
  ];

  useEffect(() => {
    if (id) {
      fetchSubject();
      fetchAllContent();
    }
  }, [id]);

  const fetchSubject = async () => {
    try {
      const data = await subjectService.getById(id!);
      setSubject(data);
    } catch (error) {
      console.error('Error fetching subject:', error);
    } finally {
      setLoadingSubject(false);
    }
  };

  const fetchAllContent = async () => {
    if (!id) return;
    
    setLoadingContent(true);
    try {
      const [contentData, resourcesData] = await Promise.all([
        subjectContentService.getAllBySubject(id),
        subjectContentService.getResourcesBySubject(id)
      ]);
      
      const groupedContent: Record<string, SubjectContent[]> = {
        content: [],
        material: [],
        activities: [],
        exercises: [],
        projects: [],
        evaluations: [],
        resources: []
      };

      contentData.forEach((item: SubjectContent) => {
        const normKey = normalizeSectionType(item.section_type);
        if (!groupedContent[normKey]) {
          groupedContent[normKey] = [];
        }
        groupedContent[normKey].push(item);
      });
      
      setContent(groupedContent);
      setResources(resourcesData || []);
    } catch (error: any) {
      console.error('Error fetching content from Supabase:', error);
    } finally {
      setLoadingContent(false);
    }
  };

  const fetchContentBySection = async (section: string) => {
    if (!id) return;
    
    try {
      const sectionContent = await subjectContentService.getBySection(id, section);
      
      setContent(prev => ({
        ...prev,
        [section]: sectionContent
      }));
    } catch (error: any) {
      console.error(`Error fetching section ${section} from Supabase:`, error);
    }
  };

  useEffect(() => {
    const sections = ['content', 'material', 'activities', 'exercises', 'projects', 'evaluations', 'resources'];
    if (activeTab !== 'inicio' && sections.includes(activeTab)) {
      fetchContentBySection(activeTab);
    }
  }, [activeTab]);

  const formatContentHtml = (rawContent: string): string => {
    if (!rawContent) return '<p class="text-muted-foreground">Nenhum conteúdo detalhado disponível.</p>';
    if (detectMarkdown(rawContent)) {
      return sanitizeHtml(markdownToHtml(rawContent));
    }
    return sanitizeHtml(rawContent);
  };

  if (loading || loadingSubject) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!user || !isStudent) {
    return <Navigate to="/auth" replace />;
  }

  if (!subject) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Disciplina não encontrada</h1>
            <p className="text-muted-foreground">A disciplina que você está procurando não existe.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const getSectionLabel = (section: string) => {
    const labels: Record<string, string> = {
      'content': 'Ementa',
      'material': 'Cronograma',
      'activities': 'Escopo',
      'exercises': 'Exercícios',
      'projects': 'Projetos',
      'evaluations': 'Avaliações',
      'resources': 'Recursos'
    };
    return labels[section] || section;
  };

  const navItems = [
    { value: 'inicio', label: 'Início', icon: Home },
    { value: 'content', label: getSectionLabel('content'), icon: FileText },
    { value: 'material', label: getSectionLabel('material'), icon: BookOpen },
    { value: 'activities', label: getSectionLabel('activities'), icon: Activity },
    { value: 'exercises', label: getSectionLabel('exercises'), icon: PenTool },
    { value: 'projects', label: getSectionLabel('projects'), icon: FolderOpen },
    { value: 'evaluations', label: getSectionLabel('evaluations'), icon: ClipboardList },
    { value: 'resources', label: getSectionLabel('resources'), icon: Settings },
  ];

  const renderContentSection = (sectionType: string) => {
    const sectionContent = content[sectionType] || [];
    const sectionLabel = getSectionLabel(sectionType);
    const hasContent = sectionContent.length > 0;
    const isResourcesTab = sectionType === 'resources';
    const hasResources = resources.length > 0;

    if (loadingContent && !hasContent && !(isResourcesTab && hasResources)) {
      return (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!hasContent && (!isResourcesTab || !hasResources)) {
      return (
        <Card className="bg-card border shadow-sm">
          <CardContent className="text-center py-16 space-y-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
              <FileText className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Nenhum conteúdo disponível</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              O professor ainda não adicionou conteúdo na seção de <strong>{sectionLabel}</strong>.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {hasContent && sectionContent.map((item) => (
          <Card key={item.id} className="bg-card border shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4 text-foreground border-b pb-2 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                {item.title || sectionLabel}
              </h3>
              <div 
                className="markdown-rendered-content prose-subject-content text-foreground w-full" 
                dangerouslySetInnerHTML={{ __html: formatContentHtml(item.content) }} 
              />
            </CardContent>
          </Card>
        ))}

        {/* Exibir Recursos anexados caso existam */}
        {(isResourcesTab || hasResources) && resources.length > 0 && (
          <Card className="bg-card border shadow-sm">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Materiais e Recursos Anexados
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {resources.map((resource, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-foreground">{resource.title}</h4>
                        {resource.description && (
                          <p className="text-xs text-muted-foreground">{resource.description}</p>
                        )}
                      </div>
                    </div>
                    {resource.file_url && (
                      <a 
                        href={resource.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline font-medium ml-2 shrink-0"
                      >
                        Acessar
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <MainLayout>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="min-h-screen">
        {/* Header */}
        <header className="bg-card border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{subject.name}</h1>
                  <p className="text-muted-foreground">EEEP - Balbina Viana Arrais</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="bg-primary shadow-sm">
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
                      <p className="font-bold text-xl text-foreground">100h</p>
                      <p className="text-sm text-muted-foreground">Carga Horária</p>
                    </div>
                    <div className="text-center bg-background rounded-lg p-4 w-28 border">
                      <p className="font-bold text-xl text-foreground">1º Ano</p>
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

          {/* Ementa tab */}
          <TabsContent value="content" className="mt-0">
            {renderContentSection('content')}
          </TabsContent>

          {/* Cronograma tab */}
          <TabsContent value="material" className="mt-0">
            {renderContentSection('material')}
          </TabsContent>

          {/* Atividades tab */}
          <TabsContent value="activities" className="mt-0">
            {renderContentSection('activities')}
          </TabsContent>

          {/* Exercícios tab */}
          <TabsContent value="exercises" className="mt-0">
            {renderContentSection('exercises')}
          </TabsContent>

          {/* Projetos tab */}
          <TabsContent value="projects" className="mt-0">
            {renderContentSection('projects')}
          </TabsContent>

          {/* Avaliações tab */}
          <TabsContent value="evaluations" className="mt-0">
            {renderContentSection('evaluations')}
          </TabsContent>

          {/* Recursos tab */}
          <TabsContent value="resources" className="mt-0">
            {renderContentSection('resources')}
          </TabsContent>
        </main>
      </Tabs>
    </MainLayout>
  );
}
