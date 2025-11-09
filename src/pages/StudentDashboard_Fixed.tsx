import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Home, BarChart3, Settings, Calendar, Gamepad, Users, Edit3, Lock, BookOpen, FileText, Menu, Palette, Star } from 'lucide-react';
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
import { useSubjectFavorites } from '@/hooks/useSubjectFavorites';
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
  const [editingPassword, setEditingPassword] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Use the custom colors hook
  const { userColors } = useUserColors();

  // Use the subject favorites hook
  const {
    favorites,
    sortedSubjects,
    loadingFavorites,
    toggleFavorite
  } = useSubjectFavorites(subjects);

  // Force logout if not authenticated
  useEffect(() => {
    if (!loading && (!user || !profile || profile.profile_type !== 'student')) {
      signOut();
    }
  }, [user, profile, loading, signOut]);

  useEffect(() => {
    if (!loading && profile) {
      setProfileData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        student_registration: profile.student_registration || '',
        phone: profile.phone || ''
      });
    }
  }, [profile, loading]);

  useEffect(() => {
    if (profile?.id) {
      fetchStudentData();
    }
  }, [profile]);

  // Fetch all student data
  const fetchStudentData = async () => {
    if (!profile?.id) return;

    setLoadingSubjects(true);
    try {
      const [subjectsRes, activitiesRes, gamificationRes] = await Promise.all([
        subjectService.getStudentSubjects(profile.id),
        getStudentActivities(),
        gamificationService.getStudentProgress(profile.id)
      ]);

      setSubjects(subjectsRes || []);

      // Create subjects name map
      const namesMap: Record<string, string> = {};
      if (subjectsRes && Array.isArray(subjectsRes)) {
        subjectsRes.forEach(subject => {
          if (subject && subject.id && subject.name) {
            namesMap[subject.id] = subject.name;
          }
        });
      }
      setSubjectNamesMap(namesMap);

      // Process activities
      if (activitiesRes && activitiesRes.activities) {
        const pending = activitiesRes.activities.filter(
          activity => !activity.submission_date
        ).length;
        setPendingActivities(pending);
      }

      // Process gamification data
      if (gamificationRes) {
        setTotalPoints(gamificationRes.totalPoints || 0);
        setProgressPercent(gamificationRes.progressPercent || 0);
        setUnlockedBadges(gamificationRes.badges || []);
        setUnlockedBySubject(gamificationRes.badgesBySubject || []);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do estudante:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do dashboard",
        variant: "destructive",
      });
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await updateStudentProfile(profileData);
      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso",
      });
      setEditingProfile(false);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar perfil",
        variant: "destructive",
      });
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não conferem",
        variant: "destructive",
      });
      return;
    }

    try {
      await changeStudentPassword(passwordData.currentPassword, passwordData.newPassword);
      toast({
        title: "Sucesso",
        description: "Senha alterada com sucesso",
      });
      setEditingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar senha",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    signOut();
    navigate('/');
  };

  const getGradientForSubject = (subjectId: string) => {
    const colors = userColors[subjectId];
    if (!colors) return 'from-blue-500 to-indigo-600';
    
    return `from-[${colors.primary}] to-[${colors.secondary}]`;
  };

  // Handle favorite toggle
  const handleToggleFavorite = async (subjectId: string) => {
    try {
      await toggleFavorite(subjectId);
      toast({
        title: "Sucesso",
        description: favorites.includes(subjectId) ? "Disciplina removida dos favoritos" : "Disciplina adicionada aos favoritos",
      });
    } catch (error) {
      console.error('Erro ao alterar favorito:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar favorito",
        variant: "destructive",
      });
    }
  };

  // Show loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  // Redirect if not student
  if (!user || !profile || profile.profile_type !== 'student') {
    return <Navigate to="/auth/signin" replace />;
  }

  // Sort subjects (favorites first)
  const displaySubjects = sortedSubjects;

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Menu */}
      <SwipeableSheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SwipeableSheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 left-4 z-50 md:hidden bg-white shadow-md"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SwipeableSheetTrigger>
        <SwipeableSheetContent side="left" className="w-80">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <h3 className="font-semibold">{profile?.full_name}</h3>
                <p className="text-sm text-muted-foreground">{profile?.student_registration}</p>
              </div>
            </div>
            
            <nav className="space-y-2">
              <Button
                variant={activeTab === 'overview' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => {
                  setActiveTab('overview');
                  setIsMobileMenuOpen(false);
                }}
              >
                <Home className="h-4 w-4 mr-2" />
                Painel
              </Button>
              <Button
                variant={activeTab === 'activities' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => {
                  setActiveTab('activities');
                  setIsMobileMenuOpen(false);
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Atividades
              </Button>
              <Button
                variant={activeTab === 'grades' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => {
                  setActiveTab('grades');
                  setIsMobileMenuOpen(false);
                }}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Desempenho
              </Button>
              <Button
                variant={activeTab === 'calendar' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => {
                  setActiveTab('calendar');
                  setIsMobileMenuOpen(false);
                }}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Calendário
              </Button>
              <Button
                variant={activeTab === 'gamification' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => {
                  setActiveTab('gamification');
                  setIsMobileMenuOpen(false);
                }}
              >
                <Gamepad className="h-4 w-4 mr-2" />
                Gamificação
              </Button>
              <Button
                variant={activeTab === 'colors' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => {
                  setActiveTab('colors');
                  setIsMobileMenuOpen(false);
                }}
              >
                <Palette className="h-4 w-4 mr-2" />
                Cores Pessoais
              </Button>
              <Button
                variant={activeTab === 'settings' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => {
                  setActiveTab('settings');
                  setIsMobileMenuOpen(false);
                }}
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </Button>
              
              <div className="pt-4 mt-4 border-t">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-700"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            </nav>
          </div>
        </SwipeableSheetContent>
      </SwipeableSheet>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Desktop Navigation */}
          <div className="hidden md:block mb-8">
            <TabsList className="grid w-full grid-cols-7 gap-1 p-1">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                <span className="hidden lg:inline">Painel</span>
              </TabsTrigger>
              <TabsTrigger value="activities" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden lg:inline">Atividades</span>
              </TabsTrigger>
              <TabsTrigger value="grades" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden lg:inline">Desempenho</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden lg:inline">Calendário</span>
              </TabsTrigger>
              <TabsTrigger value="gamification" className="flex items-center gap-2">
                <Gamepad className="h-4 w-4" />
                <span className="hidden lg:inline">Gamificação</span>
              </TabsTrigger>
              <TabsTrigger value="colors" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                <span className="hidden lg:inline">Cores</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden lg:inline">Config</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Welcome Header */}
          <div className="mb-8 pt-12 md:pt-0">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Olá, {profile?.full_name}! 👋</h1>
                <p className="text-muted-foreground mt-1">
                  Bem-vindo ao seu painel de estudos
                </p>
              </div>
              <div className="hidden md:block">
                <Button variant="outline" onClick={handleLogout} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  Sair
                </Button>
              </div>
            </div>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total de Disciplinas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{subjects.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Disciplinas matriculadas
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Atividades Pendentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pendingActivities}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Aguardando entrega
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Pontos Totais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalPoints}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pontos conquistados
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Subjects Grid */}
            {loadingSubjects ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-20 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displaySubjects.map((subject) => {
                  const isFavorite = favorites.includes(subject.id);
                  
                  return (
                    <Card 
                      key={subject.id} 
                      className={`hover:shadow-glow transition-all duration-300 cursor-pointer border-0 relative overflow-hidden ${
                        isFavorite 
                          ? 'ring-2 ring-yellow-400 shadow-lg transform scale-[1.02]' 
                          : ''
                      }`}
                    >
                      <div 
                        className={`absolute inset-0 bg-gradient-to-br ${
                          isFavorite 
                            ? 'from-yellow-400 via-amber-500 to-orange-500' 
                            : getGradientForSubject(subject.id)
                        } opacity-90`}
                      />
                      
                      {/* Favorite Star Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(subject.id);
                        }}
                        className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-200"
                        disabled={loadingFavorites}
                      >
                        <Star 
                          className={`h-4 w-4 ${
                            isFavorite 
                              ? 'text-yellow-300 fill-yellow-300' 
                              : 'text-white'
                          }`} 
                        />
                      </button>

                      <div className="relative z-10">
                        <CardHeader className="text-white">
                          <CardTitle className="text-lg font-semibold">{subject.name}</CardTitle>
                          <CardDescription className="text-white/90">
                            {subject.description || 'Disciplina do curso'}
                          </CardDescription>
                        </CardHeader>
                        
                        <CardContent className="text-white">
                          <div className="flex items-center justify-between mb-4">
                            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                              {subject.workload || 0}h
                            </Badge>
                            <div className="text-right">
                              <p className="text-xs opacity-90">Professor</p>
                              <p className="text-sm font-medium">
                                {subject.professor_name || 'Não definido'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link 
                                  to={`/student/activities?subjectId=${subject.id}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveTab('activities');
                                  }}
                                >
                                  <Button 
                                    variant="secondary" 
                                    size="sm" 
                                    className="bg-white/20 hover:bg-white/30 text-white border-white/30 flex-1"
                                  >
                                    <FileText className="h-3 w-3 mr-1" />
                                    Atividades
                                  </Button>
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Ver atividades desta disciplina</p>
                              </TooltipContent>
                            </Tooltip>
                            
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link 
                                  to={`/student/grades?subjectId=${subject.id}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveTab('grades');
                                  }}
                                >
                                  <Button 
                                    variant="secondary" 
                                    size="sm" 
                                    className="bg-white/20 hover:bg-white/30 text-white border-white/30 flex-1"
                                  >
                                    <BarChart3 className="h-3 w-3 mr-1" />
                                    Notas
                                  </Button>
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Ver notas desta disciplina</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Activities Tab */}
          <TabsContent value="activities" className="mt-6">
            <StudentActivitiesTab subjectNamesMap={subjectNamesMap} />
          </TabsContent>

          {/* Grades Tab */}
          <TabsContent value="grades" className="mt-6">
            <StudentGradesPerformanceTab />
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="mt-6">
            <StudentCalendarTab />
          </TabsContent>

          {/* Gamification Tab */}
          <TabsContent value="gamification" className="mt-6">
            <div className="space-y-6">
              {/* Progress Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gamepad className="h-5 w-5" />
                      Progresso Geral
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center space-y-4">
                      <div className="text-3xl font-bold text-blue-600">{totalPoints}</div>
                      <p className="text-muted-foreground">Pontos Totais</p>
                      
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-muted-foreground">{progressPercent}% Completo</p>
                    </div>
                  </CardContent>
                </Card>
                
                <TopStudentsCard />
              </div>

              {/* Badges Grid */}
              <Card>
                <CardHeader>
                  <CardTitle>Conquistas Desbloqueadas</CardTitle>
                  <CardDescription>
                    Badges conquistadas em suas atividades
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BadgeGrid 
                    badges={unlockedBadges} 
                    subjectNamesMap={subjectNamesMap}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Colors Tab */}
          <TabsContent value="colors" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Cores Pessoais das Disciplinas
                </CardTitle>
                <CardDescription>
                  Personalize as cores de cada disciplina conforme sua preferência
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PersonalColorModal subjects={subjects} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-6">
            <div className="space-y-6">
              {/* Profile Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit3 className="h-5 w-5" />
                    Informações do Perfil
                  </CardTitle>
                  <CardDescription>
                    Atualize suas informações pessoais
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Nome Completo</Label>
                        <Input
                          id="full_name"
                          value={profileData.full_name}
                          onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                          disabled={!editingProfile}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                          disabled={!editingProfile}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="student_registration">Matrícula</Label>
                        <Input
                          id="student_registration"
                          value={profileData.student_registration}
                          onChange={(e) => setProfileData(prev => ({ ...prev, student_registration: e.target.value }))}
                          disabled={!editingProfile}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input
                          id="phone"
                          value={profileData.phone}
                          onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                          disabled={!editingProfile}
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {editingProfile ? (
                        <>
                          <Button onClick={handleUpdateProfile}>
                            Salvar Alterações
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setEditingProfile(false)}
                          >
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <Button onClick={() => setEditingProfile(true)}>
                          <Edit3 className="h-4 w-4 mr-2" />
                          Editar Perfil
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Password Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Alterar Senha
                  </CardTitle>
                  <CardDescription>
                    Mantenha sua conta segura alterando sua senha regularmente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {editingPassword ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword">Senha Atual</Label>
                          <Input
                            id="currentPassword"
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="newPassword">Nova Senha</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          />
                        </div>
                        
                        <div className="flex gap-2">
                          <Button onClick={handleChangePassword}>
                            Alterar Senha
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setEditingPassword(false);
                              setPasswordData({
                                currentPassword: '',
                                newPassword: '',
                                confirmPassword: ''
                              });
                            }}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </>
                    ) : (
                      <Button onClick={() => setEditingPassword(true)}>
                        <Lock className="h-4 w-4 mr-2" />
                        Alterar Senha
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}