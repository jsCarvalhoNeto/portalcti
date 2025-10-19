/**
 * Widgets personalizados para o Painel do Professor
 * Componentes reutilizáveis para dashboard personalizável
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Users, 
  BarChart3, 
  GraduationCap, 
  Calendar, 
  FileText, 
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Clock,
  Star
} from 'lucide-react';

// Widget de Estatísticas Rápidas
export interface QuickStatsWidgetProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
}

export const QuickStatsWidget = ({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  bgColor, 
  trend, 
  trendDirection = 'neutral' 
}: QuickStatsWidgetProps) => {
  const getTrendIcon = () => {
    switch (trendDirection) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
      default: return null;
    }
  };

  return (
    <Card className="hover:shadow-glow transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{title}</p>
            {trend && (
              <div className="flex items-center gap-1 mt-1">
                {getTrendIcon()}
                <span className="text-xs text-muted-foreground">{trend}</span>
              </div>
            )}
          </div>
          <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Widget de Atividades Pendentes
export interface PendingActivitiesWidgetProps {
  activities: Array<{
    id: string;
    title: string;
    subject: string;
    dueDate: string;
    priority: 'high' | 'medium' | 'low';
    studentsCount: number;
  }>;
  onActivityClick?: (activityId: string) => void;
}

export const PendingActivitiesWidget = ({ 
  activities, 
  onActivityClick 
}: PendingActivitiesWidgetProps) => {
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <Badge variant="destructive">Alta</Badge>;
      case 'medium': return <Badge variant="secondary">Média</Badge>;
      case 'low': return <Badge variant="outline">Baixa</Badge>;
      default: return <Badge variant="outline">Normal</Badge>;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'medium': return <Clock className="w-4 h-4 text-orange-500" />;
      case 'low': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Atividades Pendentes
        </CardTitle>
        <CardDescription>
          Atividades que precisam de correção
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length > 0 ? (
            activities.map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => onActivityClick?.(activity.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-background rounded-full flex items-center justify-center">
                    {getPriorityIcon(activity.priority)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.subject}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{activity.dueDate}</p>
                    <p className="text-xs text-muted-foreground">{activity.studentsCount} alunos</p>
                  </div>
                  {getPriorityBadge(activity.priority)}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-4">
              Nenhuma atividade pendente
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Widget de Desempenho da Turma
export interface ClassPerformanceWidgetProps {
  subject: string;
  averageGrade: number;
  participationRate: number;
  assignmentCompletion: number;
  onDetailsClick?: () => void;
}

export const ClassPerformanceWidget = ({ 
  subject, 
  averageGrade, 
  participationRate, 
  assignmentCompletion,
  onDetailsClick
}: ClassPerformanceWidgetProps) => {
  const getPerformanceColor = (value: number) => {
    if (value >= 80) return 'text-green-500';
    if (value >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getPerformanceBg = (value: number) => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Desempenho da Turma
          </div>
          <Button variant="ghost" size="sm" onClick={onDetailsClick}>
            Detalhes
          </Button>
        </CardTitle>
        <CardDescription>
          {subject}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Média de Notas</span>
              <span className={`text-sm font-medium ${getPerformanceColor(averageGrade)}`}>
                {averageGrade.toFixed(1)}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${getPerformanceBg(averageGrade)}`} 
                style={{ width: `${Math.min(averageGrade, 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Participação</span>
              <span className={`text-sm font-medium ${getPerformanceColor(participationRate)}`}>
                {participationRate}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${getPerformanceBg(participationRate)}`} 
                style={{ width: `${participationRate}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Entrega de Atividades</span>
              <span className={`text-sm font-medium ${getPerformanceColor(assignmentCompletion)}`}>
                {assignmentCompletion}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${getPerformanceBg(assignmentCompletion)}`} 
                style={{ width: `${assignmentCompletion}%` }}
              ></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Widget de Próximos Eventos
export interface UpcomingEventsWidgetProps {
  events: Array<{
    id: string;
    title: string;
    date: string;
    time: string;
    type: 'class' | 'exam' | 'deadline' | 'meeting';
    subject?: string;
  }>;
  onViewCalendar?: () => void;
}

export const UpcomingEventsWidget = ({ 
  events, 
  onViewCalendar 
}: UpcomingEventsWidgetProps) => {
  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'class': return <BookOpen className="w-4 h-4 text-primary" />;
      case 'exam': return <GraduationCap className="w-4 h-4 text-destructive" />;
      case 'deadline': return <Clock className="w-4 h-4 text-orange-500" />;
      case 'meeting': return <Users className="w-4 h-4 text-secondary-foreground" />;
      default: return <Calendar className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'class': return 'bg-primary/10 text-primary';
      case 'exam': return 'bg-destructive/10 text-destructive';
      case 'deadline': return 'bg-orange-500/10 text-orange-500';
      case 'meeting': return 'bg-secondary/10 text-secondary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-accent" />
            Próximos Eventos
          </div>
          <Button variant="ghost" size="sm" onClick={onViewCalendar}>
            Ver Calendário
          </Button>
        </CardTitle>
        <CardDescription>
          Compromissos e prazos importantes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {events.length > 0 ? (
            events.map((event) => (
              <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getEventTypeColor(event.type)}`}>
                  {getEventTypeIcon(event.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{event.title}</p>
                  {event.subject && (
                    <p className="text-xs text-muted-foreground">{event.subject}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{event.date}</span>
                    <span>•</span>
                    <span>{event.time}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-4">
              Nenhum evento programado
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Widget de Feedback dos Alunos
export interface StudentFeedbackWidgetProps {
  averageRating: number;
  totalReviews: number;
  recentFeedback: Array<{
    id: string;
    studentName: string;
    rating: number;
    comment: string;
    date: string;
  }>;
  onViewAll?: () => void;
}

export const StudentFeedbackWidget = ({ 
  averageRating, 
  totalReviews, 
  recentFeedback,
  onViewAll
}: StudentFeedbackWidgetProps) => {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} 
      />
    ));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400 fill-current" />
            Feedback dos Alunos
          </div>
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            Ver Todos
          </Button>
        </CardTitle>
        <CardDescription>
          Avaliação média baseada em {totalReviews} avaliações
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-4">
          <div className="flex justify-center gap-1 mb-2">
            {renderStars(Math.round(averageRating))}
          </div>
          <p className="text-2xl font-bold">{averageRating.toFixed(1)}</p>
          <p className="text-sm text-muted-foreground">de 5.0</p>
        </div>

        <div className="space-y-3">
          {recentFeedback.slice(0, 3).map((feedback) => (
            <div key={feedback.id} className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">{feedback.studentName}</p>
                <div className="flex gap-1">
                  {renderStars(feedback.rating)}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1">{feedback.comment}</p>
              <p className="text-xs text-muted-foreground">{feedback.date}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
