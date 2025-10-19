import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, LogOut, Home, Edit, Users, BarChart3, Settings, Calendar, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

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
                <h1 className="text-xl font-bold">Painel do Professor</h1>
                <p className="text-sm text-muted-foreground">
                  Bem-vindo, {profile?.full_name || user?.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                Professor
              </Badge>
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
          <TabsList className="grid w-full grid-cols-6 max-w-4xl mx-auto mb-8 gap-3">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="subjects">Minhas Disciplinas</TabsTrigger>
            <TabsTrigger value="students">Meus Alunos</TabsTrigger>
            <TabsTrigger value="grades">Atividades & Notas</TabsTrigger>
            <TabsTrigger value="calendar">Calendário</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <div className="space-y-8">
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
          <TabsContent value="calendar" className="space-y-8">
            {children && Array.isArray(children) ? children[3] : null}
          </TabsContent>
          <TabsContent value="settings" className="space-y-8">
            {children && Array.isArray(children) ? children[4] : null}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
