import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { BookOpen, Calendar, Gamepad, Settings, QrCode } from 'lucide-react';
import StudentNotificationBanner from '@/components/notifications/StudentNotificationBanner';
import BadgeGrid from '@/components/badges/BadgeGrid';
import TopStudentsCard from '@/components/student/TopStudentsCard';
import { NotificationItem } from '@/services/notificationService';

interface StatCardItem {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

interface StudentOverviewTabProps {
  userId?: string;
  notifications: NotificationItem[];
  onNotificationDismissed: (dismissedId: string) => void;
  stats: StatCardItem[];
  totalPoints: number;
  progressPercent: number;
  setActiveTab: (tab: string) => void;
  unlockedBadges: any[];
  unlockedBySubject: any[];
  subjectNamesMap: Record<string, string>;
  renderSubjectName: (subjectId: any, subjectNameFromApi?: string) => React.ReactNode;
}

export default function StudentOverviewTab({
  userId,
  notifications,
  onNotificationDismissed,
  stats,
  totalPoints,
  progressPercent,
  setActiveTab,
  unlockedBadges,
  unlockedBySubject,
  subjectNamesMap,
  renderSubjectName,
}: StudentOverviewTabProps) {
  return (
    <div className="space-y-8">
      {/* Banner Dinâmico de Notificações / Avisos / Censo */}
      {notifications.length > 0 && (
        <StudentNotificationBanner
          notifications={notifications}
          studentId={userId}
          onNotificationDismissed={onNotificationDismissed}
        />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          if (stat.title === 'Progresso Geral') {
            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <Link
                    to="/gamification"
                    className="block rounded-lg focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                  >
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
                <TooltipContent>Ver histórico de pontos</TooltipContent>
              </Tooltip>
            );
          }

          const isClickable = stat.title === 'Minhas Disciplinas' || stat.title === 'Atividades Pendentes';
          const handleClick = () => {
            if (stat.title === 'Minhas Disciplinas') setActiveTab('subjects');
            if (stat.title === 'Atividades Pendentes') setActiveTab('activities');
          };

          return (
            <Card
              key={index}
              className={`hover:shadow-glow transition-all duration-300 ${isClickable ? 'cursor-pointer hover:scale-[1.01]' : ''}`}
              onClick={handleClick}
            >
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-glow transition-all duration-300 border-emerald-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-emerald-500" />
              Registrar Presença
            </CardTitle>
            <CardDescription>
              Informe o código da aula e ganhe +20 pts na gamificação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/chamada">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                Fazer Check-in (+20 pts)
              </Button>
            </Link>
          </CardContent>
        </Card>
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
              <BadgeGrid badges={unlockedBadges.slice(0, 6)} cols={3} compact />
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
                {unlockedBySubject.map((s: any) => (
                  <div key={s.subject_id} className="p-2 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      {renderSubjectName(s.subject_id, s.subject_name)}
                      <div className="text-xs text-muted-foreground">{s.total_points} pts</div>
                    </div>
                    <BadgeGrid
                      badges={s.unlocked_badges || []}
                      cols={6}
                      compact
                      subjectName={subjectNamesMap[String(s.subject_id)] || s.subject_name}
                      subjectId={s.subject_id}
                    />
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
              notifications.map((notif, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors"
                >
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-primary">{notif.badge_text || 'Aviso'}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(notif.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-sm font-medium truncate">{notif.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{notif.message}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="space-y-4">
                {[
                  {
                    action: 'Nova atividade lançada na disciplina Desenvolvimento Web',
                    time: 'Hoje às 14:30',
                    icon: BookOpen,
                    color: 'text-green-600',
                  },
                  {
                    action: 'Notas atualizadas para a disciplina Banco de Dados',
                    time: 'Ontem às 16:45',
                    icon: Gamepad,
                    color: 'text-blue-600',
                  },
                  {
                    action: 'Novo material de aula disponível para Programação',
                    time: '2 dias atrás',
                    icon: BookOpen,
                    color: 'text-orange-600',
                  },
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
    </div>
  );
}
