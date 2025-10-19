import { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
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
import api from '@/services/api';

interface Content {
  id: string;
  subject_id: string;
  section_type: string;
  title: string;
  content: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function SubjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isStudent, loading } = useAuth();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [content, setContent] = useState<Record<string, Content[]>>({});
  const [loadingSubject, setLoadingSubject] = useState(true);
  const [loadingContent, setLoadingContent] = useState(false);
  const [activeTab, setActiveTab] = useState('inicio');

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
      const response = await api.get(`/content/${id}/content`);
      const contentData = response.data;
      
      // Agrupar conteúdo por tipo de seção
      const groupedContent: Record<string, Content[]> = {};
      contentData.forEach((item: Content) => {
        if (!groupedContent[item.section_type]) {
          groupedContent[item.section_type] = [];
        }
        groupedContent[item.section_type].push(item);
      });
      
      setContent(groupedContent);
    } catch (error: any) {
      console.error('Error fetching content:', error);
      throw new Error(error.response?.data?.error || 'Falha ao buscar conteúdo');
    } finally {
      setLoadingContent(false);
    }
  };

  const fetchContentBySection = async (section: string) => {
    if (!id || content[section]) return;
    
    try {
      const response = await api.get(`/content/${id}/content/${section}`);
      const sectionContent = response.data;
      
      setContent(prev => ({
        ...prev,
        [section]: sectionContent
      }));
    } catch (error: any) {
      console.error('Error fetching section content:', error);
      throw new Error(error.response?.data?.error || `Falha ao buscar conteúdo da seção ${section}`);
    }
  };

  useEffect(() => {
    const sections = ['content', 'material', 'activities', 'exercises', 'projects', 'evaluations', 'resources'];
    if (activeTab !== 'inicio' && sections.includes(activeTab)) {
      fetchContentBySection(activeTab);
    }
  }, [activeTab]);

  if (loading || loadingSubject) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
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
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Disciplina não encontrada</h1>
            <p className="text-muted-foreground">A disciplina que você está procurando não existe.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const quickAccessItems = [
    {
      icon: Gamepad2,
      title: 'Atividades Interativas',
      description: 'Jogos e simuladores educativos',
      color: 'text-purple-40',
      bgColor: 'bg-gray-800'
    },
    {
      icon: BookOpen,
      title: 'Material Didático',
      description: 'Slides, apostilas e PDFs',
      color: 'text-blue-400',
      bgColor: 'bg-gray-800'
    },
    {
      icon: PenTool,
      title: 'Exercícios',
      description: 'Listas de exercícios práticos',
      color: 'text-orange-400',
      bgColor: 'bg-gray-800'
    },
    {
      icon: Wrench,
      title: 'Projetos',
      description: 'Projetos práticos para desenvolver',
      color: 'text-gray-400',
      bgColor: 'bg-gray-800'
    }
  ];

  const getSectionLabel = (section: string) => {
    const labels: Record<string, string> = {
      'content': 'Conteúdo',
      'material': 'Material',
      'activities': 'Atividades',
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
    
    if (loadingContent && !sectionContent.length) {
      return (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!sectionContent.length) {
      return (
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold mb-4 text-foreground">Nenhum conteúdo disponível</h2>
          <p className="text-muted-foreground">O professor ainda não adicionou conteúdo nesta seção.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {sectionContent.map((item) => (
          <Card key={item.id} className="bg-card border">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4 text-foreground">{item.title}</h3>
              <div className="prose prose-gray max-w-none text-foreground" dangerouslySetInnerHTML={{ __html: item.content || 'Nenhum conteúdo detalhado disponível.' }} />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <MainLayout>
      <div>
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
        <div className="bg-primary">
          <div className="container mx-auto px-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="border-b-0">
              <TabsList className="w-full justify-start h-auto p-0 bg-transparent">
                {navItems.map(item => (
                  <TabsTrigger 
                    key={item.value}
                    value={item.value} 
                    className="text-primary-foreground/80 hover:bg-primary-glow data-[state=active]:bg-white/20 data-[state=active]:text-primary-foreground flex-1 md:flex-none flex items-center gap-2 px-4 py-3 rounded-none"
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        <main className="container mx-auto px-4 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="inicio" className="space-y-10">
              {/* Welcome Section */}
              <Card className="bg-card border">
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold mb-2 text-foreground">
                        Bem-vindos à {subject.name}! 🚀
                      </h2>
                      <p className="text-lg text-muted-foreground">
                        {subject.description}
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
                  {quickAccessItems.map((item, index) => (
                    <Card key={index} className="bg-card border hover:bg-accent transition-all duration-300 cursor-pointer">
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
                          As aulas de Lógica de Programação começam na próxima semana. Preparem-se!
                        </p>
                        <Badge variant="destructive">31/08/2025</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Conteúdo tab - specifically for syllabus */}
            <TabsContent value="content">
              {renderContentSection('content')}
            </TabsContent>

            {/* Material tab */}
            <TabsContent value="material">
              {renderContentSection('material')}
            </TabsContent>

            {/* Atividades tab */}
            <TabsContent value="activities">
              {renderContentSection('activities')}
            </TabsContent>

            {/* Exercícios tab */}
            <TabsContent value="exercises">
              {renderContentSection('exercises')}
            </TabsContent>

            {/* Projetos tab */}
            <TabsContent value="projects">
              {renderContentSection('projects')}
            </TabsContent>

            {/* Avaliações tab */}
            <TabsContent value="evaluations">
              {renderContentSection('evaluations')}
            </TabsContent>

            {/* Recursos tab */}
            <TabsContent value="resources">
              {renderContentSection('resources')}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </MainLayout>
  );
}
