import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, BookOpen } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { getStudentCalendarEvents } from '@/services/studentCalendarService';

export default function StudentCalendarTab() {
  const { user, profile, isStudent } = useAuth();
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user && isStudent) {
      fetchCalendarEvents();
    }
  }, [user, isStudent]);

  const fetchCalendarEvents = async () => {
    try {
      setLoading(true);
      const events = await getStudentCalendarEvents();
      setCalendarEvents(events);
    } catch (error) {
      console.error('Erro ao buscar eventos do calendário:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar eventos do calendário",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
      <div>
        <h2 className="text-2xl font-bold">Calendário Acadêmico</h2>
        <p className="text-muted-foreground">Datas importantes e prazos acadêmicos</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Eventos Próximos</CardTitle>
          <CardDescription>Próximos eventos e prazos importantes</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {calendarEvents.length > 0 ? (
                calendarEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      {getEventTypeIcon(event.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-medium truncate">{event.title}</h3>
                        <div className="flex-shrink-0 ml-2">
                          {getEventTypeBadge(event.type)}
                        </div>
                      </div>
                      {event.image_path && (
                        <div className="mb-2">
                          <img
                            src={`${import.meta.env.VITE_API_URL || 'http://localhost:4002'}${event.image_path}`}
                            alt={event.title}
                            className="max-w-full max-h-20 object-cover rounded border"
                          />
                        </div>
                      )}
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
                          {event.time || 'Sem horário'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum evento agendado</p>
                  <p className="text-sm text-muted-foreground mt-2">Aguarde os próximos eventos do calendário acadêmico</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Eventos Futuros</CardTitle>
          <CardDescription>Eventos programados para as próximas semanas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {calendarEvents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-4">Data</th>
                      <th className="text-left py-2 px-4">Evento</th>
                      <th className="text-left py-2 px-4">Tipo</th>
                      <th className="text-left py-2 px-4">Disciplina</th>
                      <th className="text-left py-2 px-4">Horário</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calendarEvents
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map((event) => (
                        <tr key={event.id} className="border-b border-border last:border-b-0 hover:bg-muted/20">
                          <td className="py-3 px-4">{event.date}</td>
                          <td className="py-3 px-4 font-medium">{event.title}</td>
                          <td className="py-3 px-4">{getEventTypeBadge(event.type)}</td>
                          <td className="py-3 px-4">{event.subject_name || 'Geral'}</td>
                          <td className="py-3 px-4">{event.time || 'Sem horário'}</td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum evento futuro encontrado</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
