import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Home, BarChart3, Settings, Calendar, GraduationCap, Users, Edit3, Lock, BookOpen, FileText, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { updateStudentProfile, changeStudentPassword } from '@/services/studentProfileService';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import StudentActivitiesTab from '@/components/student/StudentActivitiesTab';
import StudentGradesPerformanceTab from '@/components/student/StudentGradesPerformanceTab';
import StudentCalendarTab from '@/components/student/StudentCalendarTab';
import { subjectService } from '@/services/subjectService';
import { getStudentActivities } from '@/services/activityService';
import { SwipeableSheet, SwipeableSheetContent, SwipeableSheetTrigger } from '@/components/ui/swipeable-sheet';

export default function StudentDashboard() {
  const { user, profile, isStudent, signOut, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [pendingActivities, setPendingActivities] = useState(0);
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

  useEffect(() => {
    if (user && isStudent) {
      fetchSubjects();
      fetchNotifications();
      loadProfileData();
    }
  }, [user, isStudent]);

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
    { title: 'Progresso Geral', value: '0%', icon: GraduationCap, color: 'text-green-500', bgColor: 'bg-green-500/10' }
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
              {stats.map((stat, index) => (
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
              ))}
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
                        { action: 'Notas atualizadas para a disciplina Banco de Dados', time: 'Ontem às 16:45', icon: GraduationCap, color: 'text-blue-600' },
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
                {subjects.map((subject) => (
                  <Card key={subject.id} className="hover:shadow-glow transition-all duration-300 cursor-pointer" onClick={() => navigate(`/disciplinas/${subject.id}`)}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{subject.name}</CardTitle>
                          <CardDescription>Professor: {subject.teacher_name}</CardDescription>
                          {subject.schedule && (
                            <p className="text-sm text-muted-foreground mt-1">{subject.schedule}</p>
                          )}
                        </div>
                        <Badge variant="outline">{subject.current_students}/{subject.max_students}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {subject.description && (
                          <p className="text-sm text-muted-foreground">{subject.description}</p>
                        )}
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-muted-foreground">
                            Semestre: {subject.semester || 'Não informado'}
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex items-center gap-1">
                              <BookOpen className="w-4 h-4" />
                              Conteúdo
                            </Button>
                            <Button size="sm" variant="outline" className="flex items-center gap-1">
                              <GraduationCap className="w-4 h-4" />
                              Notas
                            </Button>
                            <Button size="sm" variant="outline" className="flex items-center gap-1" onClick={(e) => {
                              e.stopPropagation();
                              setActiveTab('activities');
                            }}>
                              <FileText className="w-4 h-4" />
                              Atividades
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
              <h2 className="text-2xl font-bold">Configurações do Perfil</h2>
              <p className="text-muted-foreground">Configure suas informações pessoais e preferências</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Pessoais</CardTitle>
                  <CardDescription>Edite suas informações básicas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingProfile ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Nome Completo</Label>
                        <Input
                          id="fullName"
                          value={profileData.full_name}
                          onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                          placeholder="Digite seu nome completo"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input
                          id="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                          placeholder="Digite seu e-mail"
                          type="email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input
                          id="phone"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                          placeholder="Digite seu telefone"
                          type="tel"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="registration">Matrícula</Label>
                        <Input
                          id="registration"
                          value={profileData.student_registration}
                          onChange={(e) => setProfileData({...profileData, student_registration: e.target.value})}
                          placeholder="Número de matrícula"
                          disabled
                        />
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={handleUpdateProfile}
                          className="flex items-center gap-2"
                        >
                          <Edit3 className="w-4 h-4" />
                          Salvar
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingProfile(false);
                            loadProfileData();
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nome Completo</label>
                        <p className="text-sm">{profile?.full_name || user.email}</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">E-mail</label>
                        <p className="text-sm">{user.email}</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Telefone</label>
                        <p className="text-sm">{profile?.phone || 'Não informado'}</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Matrícula</label>
                        <p className="text-sm">{profile?.student_registration || 'Não informado'}</p>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setEditingProfile(true)}
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Editar Informações
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Segurança</CardTitle>
                  <CardDescription>Gerencie sua senha e segurança da conta</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Senha Atual</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        placeholder="Digite sua senha atual"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Nova Senha</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        placeholder="Digite sua nova senha"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        placeholder="Confirme sua nova senha"
                      />
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleChangePassword}
                      disabled={!passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword}
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Alterar Senha
                    </Button>
                  </div>
                  <Button variant="outline" className="w-full" disabled>
                    Configurações de Notificação
                  </Button>
                  <Button variant="outline" className="w-full" disabled>
                    Preferências de Privacidade
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
