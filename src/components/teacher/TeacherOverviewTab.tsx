import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, BarChart3, GraduationCap, Calendar, FileText, CheckCircle } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  trend?: string;
}

interface RecentActivityProps {
  action: string;
  time: string;
  icon: React.ElementType;
  color: string;
}

const StatCard = ({ title, value, icon: Icon, color, bgColor, trend }: StatCardProps) => (
  <Card className="hover:shadow-glow transition-all duration-300">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
          {trend && (
            <p className="text-xs text-muted-foreground mt-1">{trend}</p>
          )}
        </div>
        <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

const QuickActionCard = ({ 
  title, 
  description, 
  icon: Icon, 
  color, 
  onClick, 
  buttonText 
}: { 
  title: string; 
  description: string; 
  icon: React.ElementType; 
  color: string; 
  onClick: () => void; 
  buttonText: string; 
}) => (
  <Card className="hover:shadow-glow transition-all duration-300">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Icon className={`w-5 h-5 ${color}`} />
        {title}
      </CardTitle>
      <CardDescription>
        {description}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <Button className="w-full" onClick={onClick}>
        {buttonText}
      </Button>
    </CardContent>
  </Card>
);

const RecentActivityItem = ({ action, time, icon: Icon, color }: RecentActivityProps) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
    <div className="w-8 h-8 bg-background rounded-full flex items-center justify-center">
      <Icon className={`w-4 h-4 ${color}`} />
    </div>
    <div className="flex-1">
      <p className="text-sm font-medium">{action}</p>
      <p className="text-xs text-muted-foreground">{time}</p>
    </div>
  </div>
);

export default function TeacherOverviewTab({ 
  stats, 
  setActiveTab 
}: { 
  stats: StatCardProps[]; 
  setActiveTab: (tab: string) => void; 
}) {
  const quickActions = [
    {
      title: 'Minhas Disciplinas',
      description: 'Gerencie suas disciplinas e materiais de aula',
      icon: BookOpen,
      color: 'text-primary',
      onClick: () => setActiveTab('subjects'),
      buttonText: 'Acessar Disciplinas'
    },
    {
      title: 'Meus Alunos',
      description: 'Veja e interaja com seus alunos matriculados',
      icon: Users,
      color: 'text-accent',
      onClick: () => setActiveTab('students'),
      buttonText: 'Gerenciar Alunos'
    },
    {
      title: 'Atividades & Notas',
      description: 'Gerencie atividades e notas dos alunos',
      icon: BarChart3,
      color: 'text-secondary-foreground',
      onClick: () => setActiveTab('grades'),
      buttonText: 'Gerenciar Notas'
    }
  ];

  const recentActivities = [
    { action: 'Nova atividade lançada na disciplina Desenvolvimento Web', time: 'Hoje às 14:30', icon: BookOpen, color: 'text-green-600' },
    { action: 'Notas atualizadas para a disciplina Banco de Dados', time: 'Ontem às 16:45', icon: GraduationCap, color: 'text-blue-600' },
    { action: 'Novo aluno matriculado na disciplina Programação', time: '2 dias atrás', icon: Users, color: 'text-orange-600' },
    { action: 'Evento de calendário adicionado: Prova de Algoritmos', time: '3 dias atrás', icon: Calendar, color: 'text-purple-600' }
  ];

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quickActions.map((action, index) => (
          <QuickActionCard key={index} {...action} />
        ))}
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
            {recentActivities.map((activity, index) => (
              <RecentActivityItem key={index} {...activity} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Desempenho Geral
            </CardTitle>
            <CardDescription>
              Métricas de engajamento e participação dos alunos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Taxa de Participação</p>
                  <p className="text-xs text-muted-foreground">Média das últimas 4 semanas</p>
                </div>
                <Badge variant="default">85%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Entrega de Atividades</p>
                  <p className="text-xs text-muted-foreground">No prazo</p>
                </div>
                <Badge variant="secondary">92%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Feedback Recebido</p>
                  <p className="text-xs text-muted-foreground">Dos alunos</p>
                </div>
                <Badge variant="outline">4.8/5</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent" />
              Próximos Eventos
            </CardTitle>
            <CardDescription>
              Compromissos e prazos importantes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Prova de Desenvolvimento Web</p>
                    <p className="text-xs text-muted-foreground">Segunda-feira, 10:00</p>
                  </div>
                </div>
                <Badge variant="destructive">Importante</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">Entrega de Trabalho Final</p>
                    <p className="text-xs text-muted-foreground">Sexta-feira, 23:59</p>
                  </div>
                </div>
                <Badge variant="secondary">Prazo</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Reunião Pedagógica</p>
                    <p className="text-xs text-muted-foreground">Quarta-feira, 14:00</p>
                  </div>
                </div>
                <Badge variant="outline">Reunião</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
