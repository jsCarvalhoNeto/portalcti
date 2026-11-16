import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LogOut, 
  Home, 
  BarChart3, 
  Settings, 
  Calendar, 
  Gamepad, 
  Users, 
  Edit3, 
  Lock, 
  BookOpen, 
  FileText, 
  Menu, 
  Palette, 
  GraduationCap, 
  Briefcase,
  Code2,
  Cpu,
  Database,
  Network,
  Terminal,
  Laptop,
  Layers,
  Clock,
  UserCheck,
  Search,
  Shirt,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import StudentOverviewTab from '@/components/student/StudentOverviewTab';
import StudentSubjectsTab from '@/components/student/StudentSubjectsTab';
import StudentActivitiesTab from '@/components/student/StudentActivitiesTab';
import StudentGradesPerformanceTab from '@/components/student/StudentGradesPerformanceTab';
import StudentCalendarTab from '@/components/student/StudentCalendarTab';
import StudentSettingsTab from '@/components/student/StudentSettingsTab';
import { PersonalColorModal } from '@/components/ui/PersonalColorModal';
import { useUserColors } from '@/hooks/useUserColors';
import * as gamificationService from '@/services/gamificationService';
import { subjectService } from '@/services/subjectService';
import { enrollmentService } from '@/services/enrollmentService';
import { getStudentActivities } from '@/services/activityService';
import { getActiveNotificationsForStudent, NotificationItem } from '@/services/notificationService';
import { SwipeableSheet, SwipeableSheetContent, SwipeableSheetTrigger } from '@/components/ui/swipeable-sheet';

export default function StudentDashboard() {
  const { user, profile, isStudent, signOut, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [subjectNamesMap, setSubjectNamesMap] = useState<Record<string, string>>({});
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [pendingActivities, setPendingActivities] = useState(0);
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [unlockedBadges, setUnlockedBadges] = useState<any[]>([]);
  const [unlockedBySubject, setUnlockedBySubject] = useState<any[]>([]);
  const [subjectSearchQuery, setSubjectSearchQuery] = useState('');
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

  // Ícone temático contextual baseado no nome da disciplina (estilo utilitários)
  const getSubjectIcon = (name: string) => {
    const lower = (name || '').toLowerCase();
    if (lower.includes('html') || lower.includes('css') || lower.includes('web') || lower.includes('front')) {
      return Code2;
    }
    if (lower.includes('arquitetura') || lower.includes('hardware') || lower.includes('manuten') || lower.includes('computador')) {
      return Cpu;
    }
    if (lower.includes('banco') || lower.includes('dados') || lower.includes('sql')) {
      return Database;
    }
    if (lower.includes('rede') || lower.includes('seguran') || lower.includes('infra')) {
      return Network;
    }
    if (lower.includes('program') || lower.includes('lógica') || lower.includes('algoritmo') || lower.includes('javascript') || lower.includes('python')) {
      return Terminal;
    }
    if (lower.includes('sistema') || lower.includes('software')) {
      return Laptop;
    }
    if (lower.includes('projeto') || lower.includes('design')) {
      return Layers;
    }
    return BookOpen;
  };

  // Filtragem de disciplinas por busca
  const filteredSubjects = useMemo(() => {
    if (!subjectSearchQuery.trim()) return subjects;
    const q = subjectSearchQuery.toLowerCase();
    return subjects.filter(s => 
      (s.name && s.name.toLowerCase().includes(q)) || 
      (s.teacher_name && s.teacher_name.toLowerCase().includes(q)) ||
      (s.description && s.description.toLowerCase().includes(q)) ||
      (s.semester && String(s.semester).toLowerCase().includes(q)) ||
      String(s.id).includes(q)
    );
  }, [subjects, subjectSearchQuery]);

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
      fetchPendingActivities();
      fetchNotifications();
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

  // Escuta evento global de atualização de notificações para recarregar o banner e contador
  useEffect(() => {
    const handler = () => {
      try { fetchNotifications(); } catch (e) { console.error('Erro ao atualizar notificações via evento:', e); }
    };
    window.addEventListener('notifications:update', handler);
    return () => { window.removeEventListener('notifications:update', handler); };
  }, [user, subjects]);

  // Escuta evento global de atualização de atividades para recarregar o contador de pendentes
  useEffect(() => {
    const handler = () => {
      try { fetchPendingActivities(); } catch (e) { console.error('Erro ao atualizar atividades via evento:', e); }
    };
    window.addEventListener('activities:update', handler);
    return () => { window.removeEventListener('activities:update', handler); };
  }, [user]);

  // Atualiza as atividades pendentes sempre que o aluno retornar para a aba de Visão Geral
  useEffect(() => {
    if (activeTab === 'overview' && user) {
      fetchPendingActivities();
    }
  }, [activeTab, user]);

  const fetchGamification = async () => {
    if (!user) return;
    try {
      const data = await gamificationService.getStudentGamification(user.id);
      const total = Number(data?.total?.total_points || 0);
      setTotalPoints(total);
      const badges = data?.badges || [];
      const nextBadge = badges && badges.length > 0 ? badges.slice().sort((a: any, b: any) => (a.threshold_points || 0) - (b.threshold_points || 0)).find((b: any) => (b.threshold_points || 0) > total) : null;
      const nextThreshold = nextBadge?.threshold_points || Math.ceil((total + 100) / 100) * 100;
      const progress = nextThreshold ? Math.min(100, Math.round((total / nextThreshold) * 100)) : 0;
      setProgressPercent(progress);
      setUnlockedBadges(data?.unlocked_badges || []);
      setUnlockedBySubject(data?.unlocked_by_subject || []);
    } catch (e) {
      console.error('Erro ao buscar gamification:', e);
    }
  };

  const fetchSubjects = async () => {
    if (!user) return;
    setLoadingSubjects(true);
    try {
      // Buscar apenas as disciplinas em que o aluno está matriculado
      const enrolledSubjects = await enrollmentService.getStudentEnrolledSubjects(user.id);
      setSubjects(enrolledSubjects);
      // Preencher mapa de nomes para lookup rápido
      try {
        const map = Object.fromEntries((enrolledSubjects || []).map((s: any) => [String(s.id), s.name || '']));
        setSubjectNamesMap(prev => ({ ...prev, ...map }));
      } catch (e) {
        console.warn('Erro ao popular subjectNamesMap', e);
      }

      // Buscar atividades para atualizar o contador de pendentes
      await fetchPendingActivities();

      // Buscar notificações ativas considerando disciplinas matriculadas
      await fetchNotifications(enrolledSubjects);
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
      const pendingCount = (activities || []).filter((a: any) => a.status === 'pending').length;
      setPendingActivities(pendingCount);
    } catch (error) {
      console.error('Error fetching pending activities:', error);
    }
  };

  const fetchNotifications = async (enrolledList?: any[]) => {
    try {
      const currentSubjects = enrolledList || subjects;
      const enrolledIds = currentSubjects.map((s: any) => String(s.id));
      const activeNotifs = await getActiveNotificationsForStudent({
        studentId: user?.id,
        grade: profile?.grade || undefined,
        enrolledSubjectIds: enrolledIds
      });
      setNotifications(activeNotifs);
    } catch (error) {
      console.error('Error fetching notifications:', error);
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
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-xl font-bold truncate">Painel do Aluno</h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate hidden sm:block">
                  Bem-vindo, {profile?.full_name || user.email}
                </p>
              </div>
            </div>

            {/* Nota: o resumo de gamificação foi integrado ao card 'Progresso Geral' acima */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <Badge variant="default" className="hidden sm:flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                Aluno
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="hidden lg:flex"
                onClick={() => window.location.reload()}
                title="Atualizar página"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
              <Button variant="outline" size="sm" className="hidden lg:flex" asChild>
                <Link to="/student/career">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Carreira
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="hidden lg:flex" asChild>
                <Link to="/gamification">
                  <Gamepad className="w-4 h-4 mr-2" />
                  Gamificação
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="hidden md:flex" asChild>
                <Link to="/">
                  <Home className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Portal</span>
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Sair</span>
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
                  <SwipeableSheetContent side="bottom" className="p-0 max-h-[85vh]" onSwipeUp={() => setIsMobileMenuOpen(false)}>
                    <div className="p-4 pb-6" data-scrollable>
                      <h3 className="font-semibold mb-4 text-lg">Navegação</h3>
                      <div className="space-y-2 pb-2">
                        <Button
                          variant={activeTab === 'overview' ? "secondary" : "ghost"}
                          className="w-full justify-start min-h-12"
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
                          className="w-full justify-start min-h-12"
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
                          className="w-full justify-start min-h-12"
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
                          className="w-full justify-start min-h-12"
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
                          className="w-full justify-start min-h-12"
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
                          className="w-full justify-start min-h-12"
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
                          className="w-full justify-start min-h-12"
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
            <StudentOverviewTab
              userId={user?.id}
              notifications={notifications}
              onNotificationDismissed={(dismissedId) => {
                setNotifications(prev => prev.filter(n => n.id !== dismissedId));
              }}
              stats={stats}
              totalPoints={totalPoints}
              progressPercent={progressPercent}
              setActiveTab={setActiveTab}
              unlockedBadges={unlockedBadges}
              unlockedBySubject={unlockedBySubject}
              subjectNamesMap={subjectNamesMap}
              renderSubjectName={(subjectId, subjectNameFromApi) => (
                <SubjectName subjectId={subjectId} subjectNameFromApi={subjectNameFromApi} />
              )}
            />
          </TabsContent>

          <TabsContent value="subjects" className="space-y-6">
            <StudentSubjectsTab
              filteredSubjects={filteredSubjects}
              loadingSubjects={loadingSubjects}
              subjectSearchQuery={subjectSearchQuery}
              setSubjectSearchQuery={setSubjectSearchQuery}
              getSubjectColor={getSubjectColor}
              getSubjectIcon={getSubjectIcon}
              onPersonalizeColor={handlePersonalizeColor}
              onNavigateToSubject={(subjectId) => navigate(`/disciplinas/${subjectId}`)}
              setActiveTab={setActiveTab}
            />
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
            <StudentSettingsTab />
          </TabsContent>
        </Tabs>
      </main >

      {/* Modal de Cor Pessoal */}
      < PersonalColorModal
        isOpen={showPersonalColorModal}
        onClose={() => setShowPersonalColorModal(false)
        }
        subject={selectedSubjectForPersonalColor}
        onColorChanged={handlePersonalColorChanged}
      />
    </div >
  );
}
