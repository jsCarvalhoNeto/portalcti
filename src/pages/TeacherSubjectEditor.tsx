import { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  BookOpen, 
  Activity, 
  PenTool, 
  FolderOpen, 
  ClipboardList, 
  Settings,
  ArrowLeft,
  Save,
  Edit3
} from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import { Subject } from '@/services/teacherDashboardService';
import api from '@/services/api';
import MarkdownRichTextEditor from '@/components/MarkdownRichTextEditor';

interface SubjectContent {
  id: string;
  section_type: string;
  title: string;
  content: string;
  order_index: number;
  is_active: boolean;
}

interface SubjectResource {
  id: string;
  resource_type: string;
  title: string;
  file_path?: string;
  file_url?: string;
  description: string;
 order_index: number;
  is_active: boolean;
}

export default function TeacherSubjectEditor() {
  const { id } = useParams<{ id: string }>();
  const { user, isTeacher, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('conteudo');
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

 useEffect(() => {
    if (id && user && isTeacher) {
      fetchSubjectData();
    }
  }, [id, user, isTeacher]);

  const fetchSubjectData = async () => {
    try {
      setLoading(true);
      
      // Fetch subject details
      const subjectResponse = await api.get(`/subjects/${id}`);
      setSubject(subjectResponse.data);

      // Mapeamento de seções em português (frontend) para inglês (backend)
      const sectionMapping: Record<string, string> = {
        'conteudo': 'content',
        'material': 'material',
        'atividades': 'activities',
        'exercicios': 'exercises',
        'projetos': 'projects',
        'avaliacoes': 'evaluations',
        'recursos': 'resources'
      };

      // Fetch content data for all sections
      const sections = ['conteudo', 'material', 'atividades', 'exercicios', 'projetos', 'avaliacoes', 'recursos'];
      const contentPromises = sections.map(async (section) => {
        try {
          const backendSection = sectionMapping[section] || section;
          const response = await api.get(`/content/${id}/content/${backendSection}`);
          return { section, data: response.data };
        } catch (error) {
          return { section, data: [] };
        }
      });

      const resourcesPromises = sections.map(async (section) => {
        try {
          const backendSection = sectionMapping[section] || section;
          // Para recursos, assumindo que também use a rota correta
          const response = await api.get(`/content/${id}/resources/${backendSection}`);
          return { section, data: response.data };
        } catch (error) {
          return { section, data: [] };
        }
      });

      const contentResults = await Promise.all(contentPromises);
      const resourcesResults = await Promise.all(resourcesPromises);

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

      contentResults.forEach(({ section, data }) => {
        newContentData[section as keyof typeof newContentData] = data;
      });

      resourcesResults.forEach(({ section, data }) => {
        newResourcesData[section as keyof typeof newResourcesData] = data;
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
  };

  const handleSaveContent = async (section: string, content: string) => {
    console.log('🔍 handleSaveContent - Iniciando salvamento', { section, content: content?.substring(0, 100) + '...' });
    try {
      // Mapeamento de seções em português (frontend) para inglês (backend)
      const sectionMapping: Record<string, string> = {
        'conteudo': 'content',
        'material': 'material',
        'atividades': 'activities',
        'exercicios': 'exercises',
        'projetos': 'projects',
        'avaliacoes': 'evaluations',
        'recursos': 'resources'
      };

      const backendSection = sectionMapping[section] || section;
      console.log('🔍 handleSaveContent - Seção mapeada:', { section, backendSection });
      
      // Limpar tags HTML vazias e espaços em branco
      const cleanContent = content
        .replace(/<p><br><\/p>/g, '')
        .replace(/<p>\s*<\/p>/g, '')
        .replace(/<br\s*\/?>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim();

      // Se o conteúdo está vazio após limpeza, limpar a seção
      if (!cleanContent || cleanContent === '<p></p>' || cleanContent === '') {
        console.log('🗑️ Conteúdo vazio detectado, limpando seção...');
        return await handleClearContent(section);
      }
      
      const sectionLabels: Record<string, string> = {
        'content': 'Conteúdo',
        'material': 'Cronograma',
        'activities': 'Atividades',
        'exercises': 'Exercícios',
        'projects': 'Projetos',
        'evaluations': 'Avaliações',
        'resources': 'Recursos'
      };

      const response = await api.post(`/content/${id}/content`, {
        section_type: backendSection,
        title: sectionLabels[backendSection] || section,
        content: cleanContent,
        order_index: 0
      });

      console.log('🔍 handleSaveContent - Resposta do servidor:', response.status);
      if (response.status === 200 || response.status === 201) {
        toast({
          title: 'Sucesso',
          description: `Conteúdo de ${section} salvo com sucesso!`,
        });
        // Refresh data
        fetchSubjectData();
      } else {
        throw new Error('Falha ao salvar conteúdo');
      }
    } catch (error) {
      console.error('❌ handleSaveContent - Erro ao salvar conteúdo:', error);
      toast({
        title: 'Erro',
        description: `Falha ao salvar conteúdo de ${section}`,
        variant: 'destructive',
      });
    }
 };

  const handleClearContent = async (section: string) => {
    console.log('🗑️ handleClearContent - Limpando conteúdo da seção:', section);
    
    // Confirmar com o usuário
    const confirmed = window.confirm(`Tem certeza que deseja limpar todo o conteúdo de ${section}? Esta ação não pode ser desfeita.`);
    if (!confirmed) return;

    try {
      // Mapeamento de seções
      const sectionMapping: Record<string, string> = {
        'conteudo': 'content',
        'material': 'material',
        'atividades': 'activities',
        'exercicios': 'exercises',
        'projetos': 'projects',
        'avaliacoes': 'evaluations',
        'recursos': 'resources'
      };

      const backendSection = sectionMapping[section] || section;
      console.log('🔍 handleClearContent - Seção mapeada:', { section, backendSection });

      // Enviar conteúdo vazio para o backend
      const response = await api.delete(`/content/${id}/content/section/${backendSection}`);

      console.log('🔍 handleClearContent - Resposta do servidor:', response.status);

      if (response.status === 200 || response.status === 204) {
        // Limpar o estado local
        setContentData(prev => ({
          ...prev,
          [section]: []
        }));

        toast({
          title: 'Sucesso',
          description: `Conteúdo de ${section} foi limpo com sucesso!`,
        });

        // Recarregar os dados para garantir sincronia
        fetchSubjectData();
      } else {
        throw new Error('Falha ao limpar conteúdo');
      }
    } catch (error) {
      console.error('❌ handleClearContent - Erro ao limpar conteúdo:', error);
      toast({
        title: 'Erro',
        description: `Falha ao limpar conteúdo de ${section}`,
        variant: 'destructive',
      });
    }
  };

  const handleSave = () => {
    // Save all content
    const sections = ['conteudo', 'material', 'atividades', 'exercicios', 'projetos', 'avaliacoes', 'recursos'];
    sections.forEach(section => {
      const content = document.querySelector(`#editor-${section}`)?.innerHTML || '';
      if (content) {
        handleSaveContent(section, content);
      }
    });
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

 if (!user || !isTeacher) {
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

 const navItems = [
    { value: 'conteudo', label: 'Conteúdo', icon: FileText },
    { value: 'material', label: 'Cronograma', icon: BookOpen },
    { value: 'atividades', label: 'Atividades', icon: Activity },
    { value: 'exercicios', label: 'Exercícios', icon: PenTool },
    { value: 'projetos', label: 'Projetos', icon: FolderOpen },
    { value: 'avaliacoes', label: 'Avaliações', icon: ClipboardList },
    { value: 'recursos', label: 'Recursos', icon: Settings },
  ];

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
                  onClick={() => navigate('/teacher')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </Button>
                <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Edit3 className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{subject.name}</h1>
                  <p className="text-muted-foreground">Painel de Edição - Professor</p>
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
                  onClick={handleSave}
                >
                  <Save className="w-4 h-4" />
                  Salvar Tudo
                </Button>
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
            {navItems.map(item => (
              <TabsContent key={item.value} value={item.value} className="space-y-6">
                <Card className="bg-card border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <MarkdownRichTextEditor
                        content={contentData[item.value] 
                          ? contentData[item.value].map(content => content.content).join('<br><br>') 
                          : ''
                        }
                        className="max-h-[60vh] overflow-y-auto"
                        onChange={(newContent: string) => {
                          // Atualizar o contentData localmente para feedback imediato
                          setContentData(prev => ({
                            ...prev,
                            [item.value]: [{
                              id: '1',
                              section_type: item.value,
                              title: item.label,
                              content: newContent,
                              order_index: 1,
                              is_active: true
                            }]
                          }));
                        }}
                        placeholder={`Digite o conteúdo de ${item.label}...`}
                      />
                      
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="destructive" 
                          onClick={() => handleClearContent(item.value)}
                        >
                          Limpar Conteúdo
                        </Button>
                        <Button 
                          variant="outline" 
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
                <Card className="bg-card border">
                  <CardHeader>
                    <CardTitle>Recursos de {item.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {resourcesData[item.value]?.length > 0 ? 
                        resourcesData[item.value].map((resource, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                {resource.resource_type === 'file' && <BookOpen className="w-4 h-4 text-primary" />}
                                {resource.resource_type === 'link' && <BookOpen className="w-4 h-4 text-primary" />}
                                {resource.resource_type === 'video' && <BookOpen className="w-4 h-4 text-primary" />}
                                {resource.resource_type === 'pdf' && <BookOpen className="w-4 h-4 text-primary" />}
                              </div>
                              <div>
                                <h4 className="font-medium">{resource.title}</h4>
                                {resource.description && (
                                  <p className="text-sm text-muted-foreground">{resource.description}</p>
                                )}
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              Editar
                            </Button>
                          </div>
                        ))
                      : <p className="text-muted-foreground/50">Nenhum recurso adicionado ainda...</p>}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </main>
      </div>
    </MainLayout>
  );
}
