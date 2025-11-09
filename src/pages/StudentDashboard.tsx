import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Home, BarChart3, Settings, Calendar, Gamepad, Users, Edit3, Lock, BookOpen, FileText, Menu, Palette } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { updateStudentProfile, changeStudentPassword } from '@/services/studentProfileService';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import StudentActivitiesTab from '@/components/student/StudentActivitiesTab';
import StudentGradesPerformanceTab from '@/components/student/StudentGradesPerformanceTab';
import StudentCalendarTab from '@/components/student/StudentCalendarTab';
import { PersonalColorModal } from '@/components/ui/PersonalColorModal';
import { useUserColors } from '@/hooks/useUserColors';
import * as gamificationService from '@/services/gamificationService';
import { subjectService } from '@/services/subjectService';
import { getStudentActivities } from '@/services/activityService';
import { SwipeableSheet, SwipeableSheetContent, SwipeableSheetTrigger } from '@/components/ui/swipeable-sheet';
import BadgeGrid from '@/components/badges/BadgeGrid';
import TopStudentsCard from '@/components/student/TopStudentsCard';

export default function StudentDashboard() {
  const { user, profile, isStudent, signOut, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [subjectNamesMap, setSubjectNamesMap] = useState<Record<string, string>>({});
  const [notifications, setNotifications] = useState<any[]>([]);
  const [pendingActivities, setPendingActivities] = useState(0);
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [unlockedBadges, setUnlockedBadges] = useState<any[]>([]);
  const [unlockedBySubject, setUnlockedBySubject] = useState<any[]>([]);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    student_registration: '',
    phone: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { loadUserColors: loadUserColorsHook } = useUserColors();
  
  // Estados para modal de cor pessoal
  const [showPersonalColorModal, setShowPersonalColorModal] = useState(false);
  const [selectedSubjectForPersonalColor, setSelectedSubjectForPersonalColor] = useState<any>(null);
  const [userColors, setUserColors] = useState<Record<number, string>>({});

  const getTabLabel = (tabValue: string) => {
    const labels: Record<string, string> = {
      overview: 'Visão Geral',
      subjects: 'Minhas Disciplinas',
      activities: 'Atividades',
      grades: 'Notas & Desempenho',
      calendar: 'Calendário',
      settings: 'Configurações'
    };
    return labels[tabValue] || tabValue;
  };

  // Small helper component to display subject name reliably and fetch missing names on demand.
  function SubjectName({ subjectId, subjectNameFromApi }: { subjectId: any; subjectNameFromApi?: string }) {
    const [localName, setLocalName] = useState<string | null>(null);
    const [loadingName, setLoadingName] = useState(false);

    useEffect(() => {
      let mounted = true;
      const initial = resolveSubjectName(subjectId, subjectNameFromApi);
      // If the resolved name is the default placeholder, try to fetch a better name
      if (initial && !String(initial).startsWith('Disciplina')) {
        setLocalName(initial);
        return;
      }

      // try fast lookup first
      const mapped = subjectNamesMap && subjectNamesMap[String(subjectId)];
      if (mapped) {
        setLocalName(mapped);
        return;
      }

      // otherwise fetch by id
      (async () => {
        setLoadingName(true);
        try {
          const subj = await subjectService.getById(String(subjectId));
          if (!mounted) return;
          if (subj && subj.name) {
            setLocalName(subj.name);
            setSubjectNamesMap(prev => ({ ...prev, [String(subjectId)]: subj.name }));
            return;
          }
        } catch (e) {
          // ignore
        } finally {
          if (mounted) setLoadingName(false);
        }
      })();

      return () => { mounted = false; };
    }, [subjectId, subjectNameFromApi]);

    if (loadingName) return <div className="animate-pulse text-sm text-muted-foreground">Carregando...</div>;
    return <div className="font-medium">{localName || resolveSubjectName(subjectId, subjectNameFromApi)}</div>;
  }

  // Funções para cores personalizadas
  const handlePersonalizeColor = (subject: any) => {
    setSelectedSubjectForPersonalColor(subject);
    setShowPersonalColorModal(true);
  };

  const handlePersonalColorChanged = (subjectId: number, newColor: string) => {
    setUserColors(prev => ({
      ...prev,
      [subjectId]: newColor
    }));
  };

  // Função para obter cor de uma disciplina (personalizada ou padrão)
  const getSubjectColor = (subject: any) => {
    // Se o usuário tem cor personalizada, usa ela
    if (userColors[subject.id]) {
      return userColors[subject.id];
    }
    // Senão, usa a cor da disciplina ou padrão
    return subject.color || '#3B82F6';
  };

  useEffect(() => {
    if (user && isStudent) {
      fetchSubjects();
      fetchNotifications();
      loadProfileData();
      fetchGamification();
      loadUserColors();
    }
  }, [user, isStudent]);

  // Carregar cores personalizadas do usuário
  const loadUserColors = async () => {
    try {
      const colorsMap = loadUserColorsHook();
      setUserColors(colorsMap);
    } catch (error) {
      console.error('Erro ao carregar cores personalizadas:', error);
    }
  };

  // If unlockedBySubject arrives before subjects list is loaded, re-fetch subjects
  useEffect(() => {
    if (unlockedBySubject && unlockedBySubject.length > 0 && subjects.length === 0) {
      fetchSubjects();
    }
  }, [unlockedBySubject]);

  // If we have unlocked badges grouped by subject, ensure we have human-friendly names for each subject.
  // This fetches any missing subject names individually and updates the subjectNamesMap.
  useEffect(() => {
    if (!unlockedBySubject || unlockedBySubject.length === 0) return;
    const missing = (unlockedBySubject || [])
      .map((s: any) => String(s.subject_id))
      .filter((id: string) => !subjectNamesMap[id]);
    if (missing.length === 0) return;

    (async () => {
      const updates: Record<string, string> = {};
      await Promise.all(missing.map(async (id: string) => {
        try {
          const subj = await subjectService.getById(id);
          if (subj && subj.name) updates[String(id)] = subj.name;
        } catch (e) {
          // ignore individual failures, we'll keep placeholder
          console.warn('Erro ao buscar disciplina por id', id, e);
        }
      }));
      if (Object.keys(updates).length > 0) {
        setSubjectNamesMap(prev => ({ ...prev, ...updates }));
      }
    })();
  }, [unlockedBySubject, subjectNamesMap]);

  const resolveSubjectName = (subjectId: any, subjectNameFromApi?: string) => {
    // Prefer explicit name provided by the gamification API
    if (subjectNameFromApi && String(subjectNameFromApi).trim().length > 0) return subjectNameFromApi;
    // Then check the local fast lookup map
    const mapped = subjectNamesMap && subjectNamesMap[String(subjectId)];
    if (mapped && String(mapped).trim().length > 0) return mapped;
    // Fallback to the subjects array (if already loaded)
    const found = subjects.find((s: any) => String(s.id) === String(subjectId));
    if (found && found.name) return found.name;
    // Last resort: generic placeholder with id
    return subjectId ? `Disciplina ${subjectId}` : 'Disciplina';
  };

  // Escuta evento global de atualização de gamificação para recarregar os dados
  useEffect(() => {
    const handler = () => {
      try { fetchGamification(); } catch (e) { console.error('Erro ao atualizar gamification via evento:', e); }
    };
    (window as any).addEventListener && (window as any).addEventListener('gamification:update', handler);
    return () => { (window as any).removeEventListener && (window as any).removeEventListener('gamification:update', handler); };
  }, [user]);

  const fetchGamification = async () => {
    if (!user) return;
    try {
      const data = await gamificationService.getStudentGamification(user.id);
      const total = Number(data?.total?.total_points || 0);
      setTotalPoints(total);
  const badges = data?.badges || [];
  const nextBadge = badges && badges.length > 0 ? badges.slice().sort((a:any,b:any)=> (a.threshold_points||0)-(b.threshold_points||0)).find((b:any)=> (b.threshold_points||0) > total) : null;
      const nextThreshold = nextBadge?.threshold_points || Math.ceil((total + 100)/100)*100;
      const progress = nextThreshold ? Math.min(100, Math.round((total / nextThreshold) * 100)) : 0;
      setProgressPercent(progress);
      setUnlockedBadges(data?.unlocked_badges || []);
      setUnlockedBySubject(data?.unlocked_by_subject || []);
    } catch (e) {
      console.error('Erro ao buscar gamification:', e);
    }
  };

  const loadProfileData = async () => {
    if (user && profile) {
      setProfileData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        student_registration: profile.student_registration || '',
        phone: profile.phone || ''
      });
    }
  };

  const fetchSubjects = async () => {
    setLoadingSubjects(true);
    try {
      // Buscar todas as disciplinas cadastradas no sistema usando o service
      const subjectsData = await subjectService.getAll();
      setSubjects(subjectsData);
      // Preencher mapa de nomes para lookup rápido (evita mostrar "Disciplina <id>")
      try {
        const map = Object.fromEntries((subjectsData || []).map((s: any) => [String(s.id), s.name || '']));
        setSubjectNamesMap(map);
      } catch (e) {
        console.warn('Erro ao popular subjectNamesMap', e);
      }
      
      // Buscar atividades para atualizar o contador de pendentes
      if (user) {
        await fetchPendingActivities();
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar disciplinas",
        variant: "destructive",
      });
    } finally {
      setLoadingSubjects(false);
    }
  };

  const fetchPendingActivities = async () => {
    if (!user) return;
    
    try {
      // Usar o service para buscar atividades do aluno
      const activities = await getStudentActivities();
      setPendingActivities(activities.length);
    } catch (error) {
      console.error('Error fetching pending activities:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      // Simulando busca de notificações - em produção, buscaria da API
      const mockNotifications: any[] = [];
      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      await updateStudentProfile(user.id, profileData);
      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso!",
      });
      setEditingProfile(false);
      // Atualizar o perfil no contexto de autenticação
      // Em produção, você pode querer chamar uma função para atualizar o perfil no contexto
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar perfil. Tente novamente.",
        variant: "destructive",
      });
    }
 };

  const handleChangePassword = async () => {
    if (!user || !passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem ou estão vazias.",
        variant: "destructive",
      });
      return;
    }

    try {
      await changeStudentPassword(user.id, passwordData.newPassword);
      toast({
        title: "Sucesso",
        description: "Senha alterada com sucesso!",
      });
      // Limpar os campos de senha
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar senha. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isStudent) {
    return <Navigate to="/auth" replace />;
  }

  // Stats data for student dashboard
  const stats = [
    { title: 'Minhas Disciplinas', value: subjects.length.toString(), icon: BookOpen, color: 'text-primary', bgColor: 'bg-primary/10' },
    { title: 'Atividades Pendentes', value: pendingActivities.toString(), icon: BarChart3, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
    { title: 'Notificações', value: notifications.length.toString(), icon: Users, color: 'text-accent', bgColor: 'bg-accent/10' },
  { title: 'Progresso Geral', value: '0%', icon: Gamepad, color: 'text-green-500', bgColor: 'bg-green-500/10' }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Painel do Aluno</h1>
                <p className="text-sm text-muted-foreground">
                  Bem-vindo, {profile?.full_name || user.email}
                </p>
              </div>
            </div>

            {/* Nota: o resumo de gamificação foi integrado ao card 'Progresso Geral' acima */}
            <div className="flex items-center gap-3">
              <Badge variant="default" className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                Aluno
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.reload()}
                title="Atualizar página"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/gamification">
                  <Gamepad className="w-4 h-4 mr-2" />
                  Gamificação
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/">
                  <Home className="w-4 h-4 mr-2" />
                  Portal
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          {/* Menu responsivo - Tabs normais para desktop, hamburger para mobile */}
          <div className="max-w-4xl mx-auto mb-8">
            <TabsList className="hidden md:grid w-full grid-cols-6 gap-3">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="subjects">Minhas Disciplinas</TabsTrigger>
              <TabsTrigger value="activities">Atividades</TabsTrigger>
              <TabsTrigger value="grades">Notas & Desempenho</TabsTrigger>
              <TabsTrigger value="calendar">Calendário</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
            </TabsList>
            
            {/* Menu mobile - Sheet (hamburger) */}
            <div className="md:hidden">
              <div className="w-full">
                <SwipeableSheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SwipeableSheetTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <span className="flex items-center gap-2">
                        {getTabLabel(activeTab)}
                      </span>
                      <Menu className="w-4 h-4 ml-2" />
                    </Button>
                  </SwipeableSheetTrigger>
                  <SwipeableSheetContent side="bottom" className="p-0" onSwipeUp={() => setIsMobileMenuOpen(false)}>
                    <div className="p-4">
                      <h3 className="font-semibold mb-4">Navegação</h3>
                      <div className="space-y-2">
                        <Button
                          variant={activeTab === 'overview' ? "secondary" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => {
                            setActiveTab('overview');
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          <Home className="w-4 h-4 mr-2" />
                          Visão Geral
                        </Button>
                        <Button
                          variant={activeTab === 'subjects' ? "secondary" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => {
                            setActiveTab('subjects');
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          Minhas Disciplinas
                        </Button>
                        <Button
                          variant={activeTab === 'activities' ? "secondary" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => {
                            setActiveTab('activities');
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Atividades
                        </Button>
                        <Button
                          variant={"ghost"}
                          className="w-full justify-start"
                          onClick={() => {
                            // navigate to gamification page
                            window.location.href = '/gamification';
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          <Gamepad className="w-4 h-4 mr-2" />
                          Gamificação
                        </Button>
                        <Button
                          variant={activeTab === 'grades' ? "secondary" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => {
                            setActiveTab('grades');
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Notas & Desempenho
                        </Button>
                        <Button
                          variant={activeTab === 'calendar' ? "secondary" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => {
                            setActiveTab('calendar');
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Calendário
                        </Button>
                        <Button
                          variant={activeTab === 'settings' ? "secondary" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => {
                            setActiveTab('settings');
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Configurações
                        </Button>
                      </div>
                    </div>
                  </SwipeableSheetContent>
                </SwipeableSheet>
              </div>
            </div>
          </div>

          <TabsContent value="overview" className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => {
                if (stat.title === 'Progresso Geral') {
                  return (
                    <Tooltip key={index}>
                      <TooltipTrigger asChild>
                        <Link to="/gamification" className="block rounded-lg focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer">
                          <Card className="hover:shadow-glow transition-all duration-300 hover:scale-[1.01]">
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-2xl font-bold">{totalPoints}</p>
                                  <p className="text-sm text-muted-foreground">Pontos acumulados</p>
                                </div>
                                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                                  <Gamepad className={`w-6 h-6 ${stat.color}`} />
                                </div>
                              </div>

                              <div className="mt-3">
                                <div className="text-xs text-muted-foreground">Progresso para próximo troféu</div>
                                <div className="w-full bg-muted rounded-full h-2 mt-1 overflow-hidden">
                                  <div className="bg-primary h-2" style={{ width: `${progressPercent}%` }} />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent>
                        Ver histórico de pontos
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return (
                  <Card key={index} className="hover:shadow-glow transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold">{stat.value}</p>
                          <p className="text-sm text-muted-foreground">{stat.title}</p>
                        </div>
                        <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                          <stat.icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-glow transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    Minhas Disciplinas
                  </CardTitle>
                  <CardDescription>
                    Acesse materiais, tarefas e informações das disciplinas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" onClick={() => setActiveTab('subjects')}>
                    Acessar Disciplinas
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-glow transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-accent" />
                    Calendário Acadêmico
                  </CardTitle>
                  <CardDescription>
                    Veja datas importantes e prazos acadêmicos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" onClick={() => setActiveTab('calendar')}>
                    Ver Calendário
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-glow transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-secondary-foreground" />
                    Configurações
                  </CardTitle>
                  <CardDescription>
                    Configure seu perfil e preferências
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" onClick={() => setActiveTab('settings')}>
                    Configurações
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Medals quick view (overview) */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Medalhas</CardTitle>
                  <CardDescription>Conquistas recentes</CardDescription>
                </CardHeader>
                <CardContent>
                  {unlockedBadges && unlockedBadges.length > 0 ? (
                    <BadgeGrid badges={unlockedBadges.slice(0,6)} cols={3} compact />
                  ) : (
                    <div className="text-sm text-muted-foreground">Nenhuma medalha ainda.</div>
                  )}
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Medalhas por Disciplina</CardTitle>
                  <CardDescription>Progresso por disciplina</CardDescription>
                </CardHeader>
                <CardContent>
                  {unlockedBySubject && unlockedBySubject.length > 0 ? (
                    <div className="space-y-3">
                      {unlockedBySubject.map((s:any) => (
                        <div key={s.subject_id} className="p-2 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <SubjectName subjectId={s.subject_id} subjectNameFromApi={s.subject_name} />
                            <div className="text-xs text-muted-foreground">{s.total_points} pts</div>
                          </div>
                          <BadgeGrid badges={s.unlocked_badges || []} cols={6} compact subjectName={subjectNamesMap[String(s.subject_id)] || s.subject_name} subjectId={s.subject_id} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">Nenhuma conquista por disciplina.</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Top Students Leaderboard */}
            <TopStudentsCard limit={10} />

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Atividades Recentes</CardTitle>
                <CardDescription>
                  Últimas atualizações e notificações importantes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notifications.length > 0 ? (
                    notifications.map((activity, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="w-8 h-8 bg-background rounded-full flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="space-y-4">
                      {[
                        { action: 'Nova atividade lançada na disciplina Desenvolvimento Web', time: 'Hoje às 14:30', icon: BookOpen, color: 'text-green-600' },
                        { action: 'Notas atualizadas para a disciplina Banco de Dados', time: 'Ontem às 16:45', icon: Gamepad, color: 'text-blue-60' },
                        { action: 'Novo material de aula disponível para Programação', time: '2 dias atrás', icon: BookOpen, color: 'text-orange-600' }
                      ].map((activity, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <div className="w-8 h-8 bg-background rounded-full flex items-center justify-center">
                            <activity.icon className={`w-4 h-4 ${activity.color}`} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{activity.action}</p>
                            <p className="text-xs text-muted-foreground">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subjects" className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Minhas Disciplinas</h2>
                <p className="text-muted-foreground">Todas as disciplinas cadastradas no sistema</p>
              </div>
            </div>

            {loadingSubjects ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subjects.map((subject) => {
                  // Cor do card - usa cor personalizada do usuário ou cor da disciplina ou padrão
                  const cardColor = getSubjectColor(subject);
                  
                  // Determina se a cor é clara ou escura para ajustar o texto
                  const isLightColor = (hex: string) => {
                    const rgb = parseInt(hex.slice(1), 16);
                    const r = (rgb >> 16) & 255;
                    const g = (rgb >> 8) & 255;
                    const b = rgb & 255;
                    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                    return brightness > 128;
                  };

                  const textColor = isLightColor(cardColor) ? '#1f2937' : '#ffffff';
                  
                  return (
                    <Card 
                      key={subject.id} 
                      className="hover:shadow-glow transition-all duration-300 cursor-pointer border-0 relative overflow-hidden" 
                      onClick={() => navigate(`/disciplinas/${subject.id}`)}
                      style={{
                        background: `linear-gradient(135deg, ${cardColor}CC 0%, ${cardColor}AA 100%)`,
                        color: textColor
                      }}
                    >
                      {/* Barra de cor no topo do card */}
                      <div 
                        className="absolute top-0 left-0 right-0 h-1"
                        style={{ backgroundColor: cardColor }}
                      />
                      
                      <CardHeader className="relative">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle 
                              className="text-lg" 
                              style={{ color: textColor }}
                            >
                              {subject.name}
                            </CardTitle>
                            <CardDescription 
                              style={{ color: `${textColor}B3` }}
                            >
                              Professor: {subject.teacher_name}
                            </CardDescription>
                            {subject.schedule && (
                              <p 
                                className="text-sm mt-1" 
                                style={{ color: `${textColor}CC` }}
                              >
                                {subject.schedule}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="relative">
                        <div className="space-y-3">
                          {subject.description && (
                            <p 
                              className="text-sm" 
                              style={{ color: `${textColor}CC` }}
                            >
                              {subject.description}
                            </p>
                          )}
                          <div className="space-y-3">
                            <div 
                              className="text-sm"
                              style={{ color: `${textColor}B3` }}
                            >
                              Semestre: {subject.semester || 'Não informado'}
                            </div>
                            
                            {/* Botões organizados em grid responsivo para estudantes */}
                            <div className="grid grid-cols-2 gap-1 md:grid-cols-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex items-center gap-1 bg-white/20 border-white/30 text-white hover:bg-white/30 min-w-0"
                              >
                                <BookOpen className="w-3 h-3" />
                                <span className="text-xs">Conteúdo</span>
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex items-center gap-1 bg-white/20 border-white/30 text-white hover:bg-white/30 min-w-0"
                              >
                                <Gamepad className="w-3 h-3" />
                                <span className="text-xs">Notas</span>
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex items-center gap-1 bg-white/20 border-white/30 text-white hover:bg-white/30 min-w-0" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveTab('activities');
                                }}
                              >
                                <FileText className="w-3 h-3" />
                                <span className="text-xs">Atividades</span>
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex items-center gap-1 bg-white/20 border-white/30 text-white hover:bg-white/30 min-w-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePersonalizeColor(subject);
                                }}
                                title="Personalizar cor (apenas para você)"
                              >
                                <Palette className="w-3 h-3" />
                                <span className="text-xs">Cor</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {subjects.length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <p className="text-muted-foreground">Nenhuma disciplina encontrada</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="grades" className="space-y-8">
            <StudentGradesPerformanceTab />
          </TabsContent>

          <TabsContent value="calendar" className="space-y-8">
            <StudentCalendarTab />
          </TabsContent>

          <TabsContent value="activities" className="space-y-8">
            <StudentActivitiesTab />
          </TabsContent>

          <TabsContent value="settings" className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold">Configurações</h2>
              <p className="text-muted-foreground">Configure seu perfil e preferências</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Configurações</CardTitle>
                <CardDescription>Configure seu perfil e preferências</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="w-4 h-4 mr-2" />
                  Configurações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Modal de Cor Pessoal */}
      <PersonalColorModal
        isOpen={showPersonalColorModal}
        onClose={() => setShowPersonalColorModal(false)}
        subject={selectedSubjectForPersonalColor}
        onColorChanged={handlePersonalColorChanged}
      />
    </div>
  );
}
