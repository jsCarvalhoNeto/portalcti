import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, LogOut, Home, Users, BarChart3, Settings, Calendar, GraduationCap, Gamepad, Menu, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import TeacherReportsTab from '@/components/teacher/TeacherReportsTab';
import { SwipeableSheet, SwipeableSheetContent, SwipeableSheetTrigger } from '@/components/ui/swipeable-sheet';
import TeacherNotificationsModal from '@/components/teacher/TeacherNotificationsModal';
import { useTeacherDashboard } from '@/contexts/TeacherDashboardContext';
import { getTeacherNotifications } from '@/services/notificationService';

interface TeacherDashboardLayoutProps {
  children: React.ReactNode;
  stats: Array<{
    title: string;
    value: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
  }>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function TeacherDashboardLayout({
  children,
  stats,
  activeTab,
  setActiveTab
}: TeacherDashboardLayoutProps) {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [teacherNotifsCount, setTeacherNotifsCount] = useState(0);

  const { subjects: contextSubjects } = useTeacherDashboard();

  const loadNotifsCount = async () => {
    try {
      const notifs = await getTeacherNotifications(user?.id);
      const activeCount = notifs.filter(n => n.is_active && new Date(n.expires_at).getTime() > Date.now()).length;
      setTeacherNotifsCount(activeCount);
    } catch {
      // Ignorar erros secundários
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadNotifsCount();
    }
  }, [user?.id]);

  const getTabLabel = (tabValue: string) => {
    const labels: Record<string, string> = {
      overview: 'Visão Geral',
      subjects: 'Minhas Disciplinas',
      students: 'Meus Alunos',
      grades: 'Atividades & Notas',
      gamificacao: 'Gamificação',
      utilitarios: 'Utilitários',
      calendar: 'Calendário',
      settings: 'Configurações'
    };
    return labels[tabValue] || tabValue;
  };

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
                <h1 className="text-sm sm:text-xl font-bold truncate">Painel do Professor</h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate hidden sm:block">
                  Bem-vindo, {profile?.full_name || user?.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* Botão de Notificações com Sino e Contador no Header */}
              <Button
                variant="outline"
                size="sm"
                className="relative flex items-center gap-1.5 border-primary/40 text-primary hover:bg-primary/10 transition-all font-semibold"
                onClick={() => setIsNotificationsModalOpen(true)}
                title="Gerenciar e Disparar Notificações para Alunos"
              >
                <Bell className="w-4 h-4 text-primary" />
                <span className="hidden sm:inline">Notificações</span>
                {teacherNotifsCount > 0 && (
                  <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0 h-4 min-w-[16px] flex items-center justify-center rounded-full">
                    {teacherNotifsCount}
                  </Badge>
                )}
              </Button>

              <Badge variant="secondary" className="hidden md:flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                Professor
              </Badge>
              {/* Botões visíveis em tablets e desktop */}
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex"
                onClick={() => {
                  try { setActiveTab && setActiveTab('gamificacao'); } catch (e) { /* noop */ }
                  navigate('/teacher');
                }}
              >
                <Gamepad className="w-4 h-4 lg:mr-2" />
                <span className="hidden lg:inline">Gamificação</span>
              </Button>
              <Button variant="outline" size="sm" className="hidden md:flex" asChild>
                <Link to="/">
                  <Home className="w-4 h-4 lg:mr-2" />
                  <span className="hidden lg:inline">Portal</span>
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex"
                onClick={() => {
                  try { setActiveTab && setActiveTab('utilitarios'); } catch (e) { /* noop */ }
                  navigate('/teacher');
                }}
              >
                <Menu className="w-4 h-4 lg:mr-2" />
                <span className="hidden lg:inline">Utilitários</span>
              </Button>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="w-4 h-4 lg:mr-2" />
                <span className="hidden lg:inline">Sair</span>
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
            <TabsList className="hidden md:grid w-full grid-cols-7 gap-2">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="subjects">Minhas Disciplinas</TabsTrigger>
              <TabsTrigger value="students">Meus Alunos</TabsTrigger>
              <TabsTrigger value="grades">Atividades & Notas</TabsTrigger>
              <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
              <TabsTrigger value="calendar">Calendário</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
            </TabsList>
            <TabsContent value="relatorios" className="space-y-8">
              <TeacherReportsTab />
            </TabsContent>

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
                          variant={activeTab === 'students' ? "secondary" : "ghost"}
                          className="w-full justify-start min-h-12"
                          onClick={() => {
                            setActiveTab('students');
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Meus Alunos
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
                          Atividades & Notas
                        </Button>
                        {/* Gamificação removida do menu principal - acessível via botão no topo */}
                        <Button
                          variant={activeTab === 'utilitarios' ? "secondary" : "ghost"}
                          className="w-full justify-start min-h-12"
                          onClick={() => {
                            setActiveTab('utilitarios');
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          <Menu className="w-4 h-4 mr-2" />
                          Utilitários
                        </Button>
                        <Button
                          variant={activeTab === 'relatorios' ? "secondary" : "ghost"}
                          className="w-full justify-start min-h-12"
                          onClick={() => {
                            setActiveTab('relatorios');
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Relatórios
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
                        <Button
                          variant="ghost"
                          className="w-full justify-start min-h-12 text-primary font-medium"
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            setIsNotificationsModalOpen(true);
                          }}
                        >
                          <Bell className="w-4 h-4 mr-2" />
                          Notificações para Alunos
                          {teacherNotifsCount > 0 && (
                            <Badge className="ml-auto text-[10px] px-1.5 py-0 h-4">
                              {teacherNotifsCount}
                            </Badge>
                          )}
                        </Button>
                      </div>
                    </div>
                  </SwipeableSheetContent>
                </SwipeableSheet>
              </div>
            </div>
          </div>

          <TabsContent value="overview" className="space-y-8">
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => {
                  const isNotifCard = stat.title === 'Notificações';
                  const displayValue = isNotifCard && stat.value === '0' && teacherNotifsCount > 0 
                    ? teacherNotifsCount.toString() 
                    : stat.value;

                  return (
                    <Card 
                      key={index} 
                      className={`hover:shadow-glow transition-all duration-300 ${
                        isNotifCard ? 'cursor-pointer hover:border-primary/60 hover:scale-[1.01]' : ''
                      }`}
                      onClick={isNotifCard ? () => setIsNotificationsModalOpen(true) : undefined}
                      title={isNotifCard ? "Clique para gerenciar notificações para alunos" : undefined}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold">{displayValue}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                              {stat.title}
                              {isNotifCard && (
                                <span className="text-[10px] text-primary font-semibold bg-primary/10 px-1.5 py-0.2 rounded">
                                  Gerenciar
                                </span>
                              )}
                            </p>
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
                      Gerencie suas disciplinas e materiais de aula
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
                      <Users className="w-5 h-5 text-accent" />
                      Meus Alunos
                    </CardTitle>
                    <CardDescription>
                      Veja e interaja com seus alunos matriculados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full" onClick={() => setActiveTab('students')}>
                      Gerenciar Alunos
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-glow transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-secondary-foreground" />
                      Atividades & Notas
                    </CardTitle>
                    <CardDescription>
                      Gerencie atividades e notas dos alunos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full" onClick={() => setActiveTab('grades')}>
                      Gerenciar Notas
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Atividades Recentes</CardTitle>
                  <CardDescription>
                    Últimas atualizações e interações importantes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { action: 'Nova atividade lançada na disciplina Desenvolvimento Web', time: 'Hoje às 14:30', icon: BookOpen, color: 'text-green-600' },
                      { action: 'Notas atualizadas para a disciplina Banco de Dados', time: 'Ontem às 16:45', icon: GraduationCap, color: 'text-blue-600' },
                      { action: 'Novo aluno matriculado na disciplina Programação', time: '2 dias atrás', icon: Users, color: 'text-orange-600' }
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
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="subjects" className="space-y-8">
            {children && Array.isArray(children) ? children[0] : null}
          </TabsContent>
          <TabsContent value="students" className="space-y-8">
            {children && Array.isArray(children) ? children[1] : null}
          </TabsContent>
          <TabsContent value="grades" className="space-y-8">
            {children && Array.isArray(children) ? children[2] : null}
          </TabsContent>
          <TabsContent value="gamificacao" className="space-y-8">
            {children && Array.isArray(children) ? children[3] : null}
          </TabsContent>
          <TabsContent value="utilitarios" className="space-y-8">
            {children && Array.isArray(children) ? children[4] : null}
          </TabsContent>
          <TabsContent value="calendar" className="space-y-8">
            {children && Array.isArray(children) ? children[5] : null}
          </TabsContent>
          <TabsContent value="settings" className="space-y-8">
            {children && Array.isArray(children) ? children[6] : null}
          </TabsContent>
        </Tabs>
      </main>

      <TeacherNotificationsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        teacherId={user?.id}
        teacherName={profile?.full_name || user?.email || 'Professor'}
        subjects={(contextSubjects || []).map((s: any) => ({ id: s.id, name: s.name }))}
        onNotificationsChanged={loadNotifsCount}
      />
    </div>
  );
}
