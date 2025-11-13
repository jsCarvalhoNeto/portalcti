import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, LogOut, Home, Users, BarChart3, Settings, Calendar, GraduationCap, Gamepad, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { SwipeableSheet, SwipeableSheetContent, SwipeableSheetTrigger } from '@/components/ui/swipeable-sheet';

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
              <Badge variant="secondary" className="hidden sm:flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                Professor
              </Badge>
              {/* Botões visíveis apenas em telas médias e maiores */}
              <Button
                variant="outline"
                size="sm"
                className="hidden lg:flex"
                onClick={() => {
                  try { setActiveTab && setActiveTab('gamificacao'); } catch (e) { /* noop */ }
                  navigate('/teacher');
                }}
              >
                <Gamepad className="w-4 h-4 mr-2" />
                Gamificação
              </Button>
              <Button variant="outline" size="sm" className="hidden md:flex" asChild>
                <Link to="/">
                  <Home className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Portal</span>
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="hidden lg:flex"
                onClick={() => {
                  try { setActiveTab && setActiveTab('utilitarios'); } catch (e) { /* noop */ }
                  navigate('/teacher');
                }}
              >
                <Menu className="w-4 h-4 mr-2" />
                Utilitários
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
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-full overflow-x-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-8 w-full">
          {/* Menu responsivo - Tabs normais para desktop, hamburger para mobile */}
          <div className="w-full max-w-4xl mx-auto mb-4 sm:mb-8">
            <TabsList className="hidden md:grid w-full grid-cols-7 gap-3">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="subjects">Minhas Disciplinas</TabsTrigger>
              <TabsTrigger value="students">Meus Alunos</TabsTrigger>
              <TabsTrigger value="grades">Atividades & Notas</TabsTrigger>
              <TabsTrigger value="utilitarios">Utilitários</TabsTrigger>
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

          <TabsContent value="overview" className="space-y-6 sm:space-y-8 w-full">
            <div className="space-y-6 sm:space-y-8 w-full">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full">
                {stats.map((stat, index) => (
                  <Card key={index} className="hover:shadow-glow transition-all duration-300 w-full">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xl sm:text-2xl font-bold">{stat.value}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">{stat.title}</p>
                        </div>
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 ${stat.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full">
                <Card className="hover:shadow-glow transition-all duration-300 w-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                      Minhas Disciplinas
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Gerencie suas disciplinas e materiais de aula
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-3">
                    <Button className="w-full" onClick={() => setActiveTab('subjects')}>
                      Acessar Disciplinas
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-glow transition-all duration-300 w-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-accent flex-shrink-0" />
                      Meus Alunos
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Veja e interaja com seus alunos matriculados
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-3">
                    <Button variant="outline" className="w-full" onClick={() => setActiveTab('students')}>
                      Gerenciar Alunos
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-glow transition-all duration-300 w-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-secondary-foreground flex-shrink-0" />
                      Atividades & Notas
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Gerencie atividades e notas dos alunos
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-3">
                    <Button variant="outline" className="w-full" onClick={() => setActiveTab('grades')}>
                      Gerenciar Notas
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card className="w-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg">Atividades Recentes</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
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

          <TabsContent value="subjects" className="space-y-6 sm:space-y-8 w-full">
            {children && Array.isArray(children) ? children[0] : null}
          </TabsContent>
          <TabsContent value="students" className="space-y-6 sm:space-y-8 w-full">
            {children && Array.isArray(children) ? children[1] : null}
          </TabsContent>
          <TabsContent value="grades" className="space-y-6 sm:space-y-8 w-full">
            {children && Array.isArray(children) ? children[2] : null}
          </TabsContent>
          <TabsContent value="gamificacao" className="space-y-6 sm:space-y-8 w-full">
            {children && Array.isArray(children) ? children[3] : null}
          </TabsContent>
          <TabsContent value="utilitarios" className="space-y-6 sm:space-y-8 w-full">
            {children && Array.isArray(children) ? children[4] : null}
          </TabsContent>
          <TabsContent value="calendar" className="space-y-6 sm:space-y-8 w-full">
            {children && Array.isArray(children) ? children[5] : null}
          </TabsContent>
          <TabsContent value="settings" className="space-y-6 sm:space-y-8 w-full">
            {children && Array.isArray(children) ? children[6] : null}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
