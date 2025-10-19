import { useTeacherDashboard, CalendarEvent } from '@/contexts/TeacherDashboardContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, BookOpen, Plus } from 'lucide-react';

export default function TeacherCalendarTab() {
  const { calendarEvents, loading } = useTeacherDashboard();
  const calendarLoading = loading.calendar;

  const getEventTypeBadge = (type: string) => {
    switch (type) {
      case 'class':
        return <Badge variant="default">Aula</Badge>;
      case 'exam':
        return <Badge variant="destructive">Prova</Badge>;
      case 'deadline':
        return <Badge variant="secondary">Prazo</Badge>;
      case 'meeting':
        return <Badge variant="outline">Reunião</Badge>;
      default:
        return <Badge variant="secondary">Evento</Badge>;
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'class':
        return <BookOpen className="w-4 h-4 text-primary" />;
      case 'exam':
        return <Users className="w-4 h-4 text-destructive" />;
      case 'deadline':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'meeting':
        return <Calendar className="w-4 h-4 text-secondary-foreground" />;
      default:
        return <Calendar className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Calendário Acadêmico</h2>
          <p className="text-muted-foreground">Datas importantes e horários de aula</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Evento
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Eventos Próximos</CardTitle>
          <CardDescription>Próximos eventos e prazos importantes</CardDescription>
        </CardHeader>
        <CardContent>
          {calendarLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {calendarEvents.length > 0 ? (
                calendarEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      {getEventTypeIcon(event.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{event.title}</h3>
                        {getEventTypeBadge(event.type)}
                      </div>
                      {event.subject_name && (
                        <p className="text-sm text-muted-foreground mb-1">Disciplina: {event.subject_name}</p>
                      )}
                      {event.description && (
                        <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {event.date}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {event.time}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum evento agendado</p>
                  <p className="text-sm text-muted-foreground mt-2">Adicione eventos ao seu calendário</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Horário de Aulas</CardTitle>
          <CardDescription>Seu cronograma semanal de aulas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day, index) => (
              <div key={day} className="text-center p-2 bg-muted/20 rounded">
                <p className="font-medium text-sm">{day}</p>
                <div className="mt-2 space-y-1">
                  {index % 2 === 0 && (
                    <div className="text-xs p-1 bg-primary/10 rounded">
                      <p className="font-medium">Desenvolvimento Web</p>
                      <p className="text-muted-foreground">08:00-10:00</p>
                    </div>
                  )}
                  {index % 3 === 0 && (
                    <div className="text-xs p-1 bg-secondary/10 rounded">
                      <p className="font-medium">Banco de Dados</p>
                      <p className="text-muted-foreground">14:00-16:00</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
