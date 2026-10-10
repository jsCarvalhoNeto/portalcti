import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Globe,
  Newspaper,
  FolderGit2,
  BookOpen,
  Calendar,
  Phone,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Save,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Eye,
  Star,
  MapPin,
  Mail,
  Clock,
  Sparkles
} from 'lucide-react';
import {
  PortalSettings,
  PortalMenuItem,
  PortalContactInfo,
  PortalSocialLinks,
  PortalNewsItem,
  PortalProjectItem,
  PortalEventItem
} from '@/types/portal';
import {
  getPortalSettings,
  savePortalSettings,
  getPortalNews,
  savePortalNewsItem,
  deletePortalNewsItem,
  getPortalProjects,
  savePortalProjectItem,
  deletePortalProjectItem,
  getPortalEvents,
  savePortalEventItem,
  deletePortalEventItem
} from '@/services/portalSettingsService';
import PortalNewsModal from './PortalNewsModal';
import PortalProjectModal from './PortalProjectModal';
import PortalEventModal from './PortalEventModal';

interface PortalSettingsTabProps {
  subjects: Array<{ id: string; name: string; grade?: string; period?: string }>;
}

export default function PortalSettingsTab({ subjects }: PortalSettingsTabProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('menu');

  // Dados das configurações gerais
  const [settings, setSettings] = useState<PortalSettings | null>(null);
  const [menuItems, setMenuItems] = useState<PortalMenuItem[]>([]);
  const [contactInfo, setContactInfo] = useState<PortalContactInfo>({
    school_name: '',
    course_name: '',
    address: '',
    email: '',
    secondary_email: '',
    phone: '',
    whatsapp: '',
    business_hours: '',
  });
  const [socialLinks, setSocialLinks] = useState<PortalSocialLinks>({
    instagram: '',
    github: '',
    youtube: '',
    linkedin: '',
  });
  const [featuredSubjects, setFeaturedSubjects] = useState<string[]>([]);

  // Notícias, Projetos e Eventos
  const [news, setNews] = useState<PortalNewsItem[]>([]);
  const [projects, setProjects] = useState<PortalProjectItem[]>([]);
  const [events, setEvents] = useState<PortalEventItem[]>([]);

  // Estados dos Modais
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<PortalNewsItem | null>(null);

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<PortalProjectItem | null>(null);

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<PortalEventItem | null>(null);

  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    loadAllPortalData();
  }, []);

  const loadAllPortalData = async () => {
    setLoading(true);
    try {
      const [fetchedSettings, fetchedNews, fetchedProjects, fetchedEvents] = await Promise.all([
        getPortalSettings(),
        getPortalNews(false),
        getPortalProjects(false),
        getPortalEvents(false),
      ]);

      setSettings(fetchedSettings);
      setMenuItems([...fetchedSettings.menu_items].sort((a, b) => a.order - b.order));
      setContactInfo(fetchedSettings.contact_info);
      setSocialLinks(fetchedSettings.social_links);
      setFeaturedSubjects(fetchedSettings.featured_subjects || []);
      setNews(fetchedNews);
      setProjects(fetchedProjects);
      setEvents(fetchedEvents);
    } catch (error) {
      console.error('Erro ao carregar dados do portal:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar as configurações do portal.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================================
   * GERENCIAMENTO DO MENU DE NAVEGAÇÃO
   * ===================================================================== */
  const handleToggleMenuItem = (id: string, active: boolean) => {
    setMenuItems(prev =>
      prev.map(item => item.id === id ? { ...item, is_active: active } : item)
    );
  };

  const handleUpdateMenuItemText = (id: string, name: string) => {
    setMenuItems(prev =>
      prev.map(item => item.id === id ? { ...item, name } : item)
    );
  };

  const handleUpdateMenuItemHref = (id: string, href: string) => {
    setMenuItems(prev =>
      prev.map(item => item.id === id ? { ...item, href } : item)
    );
  };

  const handleMoveMenuItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= menuItems.length) return;

    const reordered = [...menuItems];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    const updated = reordered.map((item, idx) => ({ ...item, order: idx + 1 }));
    setMenuItems(updated);
  };

  const handleSaveMenu = async () => {
    setSavingSettings(true);
    try {
      await savePortalSettings({ menu_items: menuItems });
      toast({
        title: 'Menu atualizado!',
        description: 'As alterações no menu de navegação foram salvas com sucesso.',
      });
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar menu',
        description: err.message || 'Falha ao salvar itens de menu.',
        variant: 'destructive',
      });
    } finally {
      setSavingSettings(false);
    }
  };

  /* =====================================================================
   * GERENCIAMENTO DE NOTÍCIAS
   * ===================================================================== */
  const handleSaveNews = async (item: PortalNewsItem) => {
    try {
      const saved = await savePortalNewsItem(item);
      setNews(prev => {
        const idx = prev.findIndex(n => n.id === saved.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = saved;
          return updated;
        }
        return [saved, ...prev];
      });
      toast({
        title: 'Notícia salva!',
        description: 'A notícia foi salva e atualizada no portal.',
      });
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar notícia',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteNews = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta notícia?')) return;
    try {
      await deletePortalNewsItem(id);
      setNews(prev => prev.filter(n => n.id !== id));
      toast({
        title: 'Notícia excluída',
        description: 'A notícia foi removida do portal.',
      });
    } catch (err: any) {
      toast({
        title: 'Erro ao excluir notícia',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  /* =====================================================================
   * GERENCIAMENTO DE PROJETOS
   * ===================================================================== */
  const handleSaveProject = async (item: PortalProjectItem) => {
    try {
      const saved = await savePortalProjectItem(item);
      setProjects(prev => {
        const idx = prev.findIndex(p => p.id === saved.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = saved;
          return updated;
        }
        return [saved, ...prev];
      });
      toast({
        title: 'Projeto salvo!',
        description: 'O projeto foi salvo na vitrine pública do portal.',
      });
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar projeto',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este projeto?')) return;
    try {
      await deletePortalProjectItem(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      toast({
        title: 'Projeto excluído',
        description: 'O projeto foi removido da vitrine.',
      });
    } catch (err: any) {
      toast({
        title: 'Erro ao excluir projeto',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  /* =====================================================================
   * GERENCIAMENTO DE EVENTOS
   * ===================================================================== */
  const handleSaveEvent = async (item: PortalEventItem) => {
    try {
      const saved = await savePortalEventItem(item);
      setEvents(prev => {
        const updated = item.is_main_event
          ? prev.map(e => e.id !== saved.id ? { ...e, is_main_event: false } : e)
          : [...prev];

        const idx = updated.findIndex(e => e.id === saved.id);
        if (idx >= 0) {
          updated[idx] = saved;
          return updated;
        }
        return [saved, ...updated];
      });
      toast({
        title: 'Evento salvo!',
        description: 'O evento foi cadastrado/atualizado com sucesso.',
      });
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar evento',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este evento?')) return;
    try {
      await deletePortalEventItem(id);
      setEvents(prev => prev.filter(e => e.id !== id));
      toast({
        title: 'Evento excluído',
        description: 'O evento foi removido do portal.',
      });
    } catch (err: any) {
      toast({
        title: 'Erro ao excluir evento',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  /* =====================================================================
   * DISCIPLINAS EM DESTAQUE NO PORTAL
   * ===================================================================== */
  const handleToggleFeaturedSubject = (subjectId: string) => {
    setFeaturedSubjects(prev => {
      if (prev.includes(subjectId)) {
        return prev.filter(id => id !== subjectId);
      }
      return [...prev, subjectId];
    });
  };

  const handleSaveFeaturedSubjects = async () => {
    setSavingSettings(true);
    try {
      await savePortalSettings({ featured_subjects: featuredSubjects });
      toast({
        title: 'Disciplinas em destaque salvas!',
        description: 'As disciplinas selecionadas serão destacadas na página inicial.',
      });
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar destaques',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setSavingSettings(false);
    }
  };

  /* =====================================================================
   * CONTATO E REDES SOCIAIS
   * ===================================================================== */
  const handleSaveContactAndSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await savePortalSettings({
        contact_info: contactInfo,
        social_links: socialLinks,
      });
      toast({
        title: 'Informações atualizadas!',
        description: 'Dados de contato e links sociais foram salvos com sucesso.',
      });
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar contatos',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground">Carregando configurações do portal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho de Destaque */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-background border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Globe className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">Configurações do Portal Público</h2>
          </div>
          <p className="text-muted-foreground text-sm">
            Gerencie o menu de navegação, notícias, vitrine de projetos, eventos e informações de contato do portal institucional.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <a href="/" target="_blank" rel="noopener noreferrer">
              <Eye className="w-4 h-4 mr-2" />
              Ver Portal ao Vivo
              <ExternalLink className="w-3.5 h-3.5 ml-1.5 opacity-70" />
            </a>
          </Button>
        </div>
      </div>

      {/* Sub-abas de Navegação Interna */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-6 w-full h-auto p-1 bg-muted/60">
          <TabsTrigger value="menu" className="flex items-center gap-2 py-2.5">
            <Globe className="w-4 h-4 text-blue-500" />
            <span>Menu & Links</span>
          </TabsTrigger>
          <TabsTrigger value="news" className="flex items-center gap-2 py-2.5">
            <Newspaper className="w-4 h-4 text-emerald-500" />
            <span>Notícias</span>
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-2 py-2.5">
            <FolderGit2 className="w-4 h-4 text-purple-500" />
            <span>Projetos</span>
          </TabsTrigger>
          <TabsTrigger value="subjects" className="flex items-center gap-2 py-2.5">
            <BookOpen className="w-4 h-4 text-amber-500" />
            <span>Disciplinas</span>
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2 py-2.5">
            <Calendar className="w-4 h-4 text-rose-500" />
            <span>Eventos</span>
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-2 py-2.5">
            <Phone className="w-4 h-4 text-teal-500" />
            <span>Contato & Redes</span>
          </TabsTrigger>
        </TabsList>

        {/* 1. ABA MENU DE NAVEGAÇÃO */}
        <TabsContent value="menu" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">Itens do Menu de Navegação</CardTitle>
                <CardDescription>
                  Configure a ordem, rótulos e visibilidade dos links no cabeçalho do portal público.
                </CardDescription>
              </div>
              <Button onClick={handleSaveMenu} disabled={savingSettings} className="gap-2">
                <Save className="w-4 h-4" />
                {savingSettings ? 'Salvando...' : 'Salvar Alterações do Menu'}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {menuItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          disabled={index === 0}
                          onClick={() => handleMoveMenuItem(index, 'up')}
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          disabled={index === menuItems.length - 1}
                          onClick={() => handleMoveMenuItem(index, 'down')}
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      <Badge variant="outline" className="font-mono text-xs">
                        #{index + 1}
                      </Badge>

                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 min-w-[280px]">
                        <div>
                          <Label className="text-[11px] text-muted-foreground">Nome no Menu</Label>
                          <Input
                            value={item.name}
                            onChange={(e) => handleUpdateMenuItemText(item.id, e.target.value)}
                            className="h-9"
                          />
                        </div>
                        <div>
                          <Label className="text-[11px] text-muted-foreground">Destino (Link / Âncora)</Label>
                          <Input
                            value={item.href}
                            onChange={(e) => handleUpdateMenuItemHref(item.id, e.target.value)}
                            className="h-9 font-mono text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2 sm:pt-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {item.is_active ? 'Ativo' : 'Oculto'}
                        </span>
                        <Switch
                          checked={item.is_active}
                          onCheckedChange={(checked) => handleToggleMenuItem(item.id, checked)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. ABA NOTÍCIAS */}
        <TabsContent value="news" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">Gerenciador de Notícias</CardTitle>
                <CardDescription>
                  Publique novidades, avisos de vestibulares, conquistas e comunicados acadêmicos.
                </CardDescription>
              </div>
              <Button
                onClick={() => {
                  setEditingNews(null);
                  setIsNewsModalOpen(true);
                }}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Nova Notícia
              </Button>
            </CardHeader>
            <CardContent>
              {news.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma notícia cadastrada. Clique em "Nova Notícia" para adicionar a primeira.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {news.map((item) => (
                    <Card key={item.id} className="relative overflow-hidden flex flex-col justify-between">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs font-semibold">
                            {item.category}
                          </Badge>
                          <div className="flex items-center gap-1.5">
                            {item.is_featured && (
                              <Badge className="bg-amber-500 hover:bg-amber-600 text-white gap-1 text-[10px]">
                                <Star className="w-3 h-3 fill-white" /> Destaque
                              </Badge>
                            )}
                            <Badge variant={item.is_active ? 'outline' : 'secondary'} className={item.is_active ? 'text-emerald-600 border-emerald-300' : 'text-muted-foreground'}>
                              {item.is_active ? 'Ativa' : 'Oculta'}
                            </Badge>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-bold text-base line-clamp-2 text-foreground">{item.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-3 leading-relaxed">
                            {item.excerpt}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{item.read_time}</span>
                          </div>
                          <span>{item.published_at}</span>
                        </div>
                      </CardContent>

                      <div className="p-3 bg-muted/40 border-t flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1"
                          onClick={() => {
                            setEditingNews(item);
                            setIsNewsModalOpen(true);
                          }}
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => item.id && handleDeleteNews(item.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. ABA PROJETOS */}
        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">Vitrine de Projetos</CardTitle>
                <CardDescription>
                  Destaque projetos de software, jogos, automação e redes desenvolvidos na escola.
                </CardDescription>
              </div>
              <Button
                onClick={() => {
                  setEditingProject(null);
                  setIsProjectModalOpen(true);
                }}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Novo Projeto
              </Button>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum projeto cadastrado. Adicione projetos para apresentar na vitrine do curso.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.map((proj) => (
                    <Card key={proj.id} className="relative overflow-hidden flex flex-col justify-between">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {proj.category}
                          </Badge>
                          <div className="flex items-center gap-1.5">
                            {proj.is_featured && (
                              <Badge className="bg-purple-600 hover:bg-purple-700 text-white gap-1 text-[10px]">
                                <Sparkles className="w-3 h-3" /> Vitrine
                              </Badge>
                            )}
                            <Badge variant={proj.is_active ? 'outline' : 'secondary'} className={proj.is_active ? 'text-emerald-600 border-emerald-300' : 'text-muted-foreground'}>
                              {proj.is_active ? 'Ativo' : 'Oculto'}
                            </Badge>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-bold text-base text-foreground line-clamp-1">{proj.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-3 leading-relaxed">
                            {proj.description}
                          </p>
                        </div>

                        {/* Tecnologias */}
                        <div className="flex flex-wrap gap-1 pt-1">
                          {proj.technologies?.slice(0, 4).map((tech, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px] py-0 px-1.5 font-normal">
                              {tech}
                            </Badge>
                          ))}
                          {(proj.technologies?.length || 0) > 4 && (
                            <span className="text-[10px] text-muted-foreground">
                              +{proj.technologies.length - 4}
                            </span>
                          )}
                        </div>

                        {proj.author_name && (
                          <p className="text-[11px] text-muted-foreground pt-1 border-t">
                            Por: <span className="font-medium text-foreground">{proj.author_name}</span>
                          </p>
                        )}
                      </CardContent>

                      <div className="p-3 bg-muted/40 border-t flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1"
                          onClick={() => {
                            setEditingProject(proj);
                            setIsProjectModalOpen(true);
                          }}
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => proj.id && handleDeleteProject(proj.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. ABA DISCIPLINAS EM DESTAQUE */}
        <TabsContent value="subjects" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">Disciplinas em Destaque no Portal</CardTitle>
                <CardDescription>
                  Selecione quais disciplinas cadastradas no catálogo acadêmico devem receber selo de destaque no portal.
                </CardDescription>
              </div>
              <Button onClick={handleSaveFeaturedSubjects} disabled={savingSettings} className="gap-2">
                <Save className="w-4 h-4" />
                {savingSettings ? 'Salvando...' : 'Salvar Destaques'}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {subjects.map((subj) => {
                  const isFeatured = featuredSubjects.includes(subj.id);
                  return (
                    <div
                      key={subj.id}
                      onClick={() => handleToggleFeaturedSubject(subj.id)}
                      className={`cursor-pointer p-4 rounded-lg border transition-all ${
                        isFeatured
                          ? 'bg-amber-500/10 border-amber-500/50 shadow-sm'
                          : 'bg-card hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={isFeatured ? 'default' : 'secondary'} className={isFeatured ? 'bg-amber-600' : ''}>
                          {subj.grade || 'Geral'}
                        </Badge>
                        <Star className={`w-4 h-4 ${isFeatured ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground'}`} />
                      </div>
                      <h4 className="font-semibold text-sm line-clamp-1">{subj.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {subj.period || 'Sem período especificado'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. ABA EVENTOS */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">Eventos & Saberes em Conexão</CardTitle>
                <CardDescription>
                  Configure o evento principal da página inicial e a programação de workshops e palestras.
                </CardDescription>
              </div>
              <Button
                onClick={() => {
                  setEditingEvent(null);
                  setIsEventModalOpen(true);
                }}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Novo Evento
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Evento Principal */}
              {events.filter(e => e.is_main_event).map((mainEv) => (
                <div
                  key={mainEv.id}
                  className="p-5 rounded-xl border-2 border-primary/40 bg-gradient-to-r from-primary/10 via-primary/5 to-background space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <Badge className="bg-primary text-primary-foreground gap-1.5 px-3 py-1">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      Evento Principal da Home
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5"
                      onClick={() => {
                        setEditingEvent(mainEv);
                        setIsEventModalOpen(true);
                      }}
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Editar Destaque
                    </Button>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold">{mainEv.title}</h3>
                    {mainEv.subtitle && (
                      <p className="text-sm font-medium text-primary mt-0.5">{mainEv.subtitle}</p>
                    )}
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                      {mainEv.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span className="flex items-center gap-1 font-semibold text-foreground">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      {mainEv.start_date} {mainEv.end_date ? `até ${mainEv.end_date}` : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {mainEv.location}
                    </span>
                    <Badge variant="outline" className="font-medium">
                      Status: {mainEv.status === 'registration-open' ? 'Inscrições Abertas' : 'Encerradas/Em Breve'}
                    </Badge>
                  </div>
                </div>
              ))}

              {/* Lista de Outros Eventos */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Outros Eventos & Programação
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {events.filter(e => !e.is_main_event).map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {ev.event_type}
                          </Badge>
                          <Badge variant={ev.is_active ? 'outline' : 'secondary'} className="text-[10px]">
                            {ev.is_active ? 'Ativo' : 'Oculto'}
                          </Badge>
                        </div>
                        <h4 className="font-semibold text-sm">{ev.title}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">{ev.description}</p>
                        <p className="text-[11px] text-muted-foreground pt-1">
                          📅 {ev.start_date || 'Data a definir'} • 📍 {ev.location}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 ml-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingEvent(ev);
                            setIsEventModalOpen(true);
                          }}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => ev.id && handleDeleteEvent(ev.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 6. ABA CONTATO E REDES SOCIAIS */}
        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações de Contato e Redes Sociais</CardTitle>
              <CardDescription>
                Atualize o endereço, canais de atendimento, telefones e links sociais exibidos no rodapé e na seção de contato.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveContactAndSocial} className="space-y-6">
                {/* Contatos Institucionais */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold flex items-center gap-2 text-primary">
                    <Phone className="w-4 h-4" /> Canais Institucionais
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="school_name" className="text-xs font-semibold">Nome da Instituição</Label>
                      <Input
                        id="school_name"
                        value={contactInfo.school_name}
                        onChange={(e) => setContactInfo({ ...contactInfo, school_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="course_name" className="text-xs font-semibold">Nome do Curso</Label>
                      <Input
                        id="course_name"
                        value={contactInfo.course_name}
                        onChange={(e) => setContactInfo({ ...contactInfo, course_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-semibold">E-mail Principal</Label>
                      <Input
                        id="email"
                        type="email"
                        value={contactInfo.email}
                        onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="secondary_email" className="text-xs font-semibold">E-mail da Coordenação</Label>
                      <Input
                        id="secondary_email"
                        type="email"
                        value={contactInfo.secondary_email || ''}
                        onChange={(e) => setContactInfo({ ...contactInfo, secondary_email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-xs font-semibold">Telefone Fixo</Label>
                      <Input
                        id="phone"
                        value={contactInfo.phone}
                        onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="whatsapp" className="text-xs font-semibold">WhatsApp de Atendimento</Label>
                      <Input
                        id="whatsapp"
                        value={contactInfo.whatsapp || ''}
                        onChange={(e) => setContactInfo({ ...contactInfo, whatsapp: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="address" className="text-xs font-semibold">Endereço Completo</Label>
                      <Input
                        id="address"
                        value={contactInfo.address}
                        onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="business_hours" className="text-xs font-semibold">Horário de Funcionamento</Label>
                      <Input
                        id="business_hours"
                        value={contactInfo.business_hours}
                        onChange={(e) => setContactInfo({ ...contactInfo, business_hours: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Redes Sociais */}
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="text-sm font-semibold flex items-center gap-2 text-primary">
                    <Globe className="w-4 h-4" /> Links das Redes Sociais
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="instagram" className="text-xs font-semibold">Instagram (URL)</Label>
                      <Input
                        id="instagram"
                        placeholder="https://instagram.com/..."
                        value={socialLinks.instagram}
                        onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="github" className="text-xs font-semibold">GitHub da Escola / Curso</Label>
                      <Input
                        id="github"
                        placeholder="https://github.com/..."
                        value={socialLinks.github}
                        onChange={(e) => setSocialLinks({ ...socialLinks, github: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="youtube" className="text-xs font-semibold">YouTube (Canal)</Label>
                      <Input
                        id="youtube"
                        placeholder="https://youtube.com/..."
                        value={socialLinks.youtube}
                        onChange={(e) => setSocialLinks({ ...socialLinks, youtube: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="linkedin" className="text-xs font-semibold">LinkedIn Institucional</Label>
                      <Input
                        id="linkedin"
                        placeholder="https://linkedin.com/..."
                        value={socialLinks.linkedin}
                        onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={savingSettings} className="gap-2">
                    <Save className="w-4 h-4" />
                    {savingSettings ? 'Salvando...' : 'Salvar Informações de Contato'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modais de Edição */}
      <PortalNewsModal
        isOpen={isNewsModalOpen}
        onClose={() => setIsNewsModalOpen(false)}
        onSave={handleSaveNews}
        item={editingNews}
      />

      <PortalProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSave={handleSaveProject}
        item={editingProject}
      />

      <PortalEventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onSave={handleSaveEvent}
        item={editingEvent}
      />
    </div>
  );
}
