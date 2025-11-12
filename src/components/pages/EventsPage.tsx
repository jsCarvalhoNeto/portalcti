// ===================================================================
// COMPONENTE EVENTOS - INTEGRAÇÃO COM PORTAL PRINCIPAL
// ===================================================================
// Componente que integra o sistema de eventos "Saberes em Conexão"
// ao portal principal do curso técnico em informática
// ===================================================================

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Users, 
  MapPin, 
  Clock, 
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import api from '@/services/api';

// ===================================================================
// INTERFACES E TIPOS
// ===================================================================

interface EventInfo {
  title: string;
  subtitle: string;
  description: string;
  date: {
    start: string;
    end: string;
  };
  location: string;
  status: 'upcoming' | 'registration-open' | 'registration-closed' | 'finished';
  registrationUrl?: string;
  maxParticipants?: number;
  currentParticipants?: number;
}

interface ThematicAxis {
  id: string;
  title: string;
  description: string;
  color: string;
  totalRegistrations: number;
  availabilityStatus: 'unlimited' | 'available' | 'full';
}

// ===================================================================
// DADOS DO EVENTO (CONFIGURÁVEIS)
// ===================================================================

const EVENT_INFO: EventInfo = {
  title: 'Saberes em Conexão',
  subtitle: 'Escola, Ciência e Sociedade 2025',
  description: 'Um evento que conecta conhecimento acadêmico, pesquisa científica e aplicação prática na sociedade, promovendo a integração entre escola, universidade e comunidade.',
  date: {
    start: '2025-12-08',
    end: '2025-12-12'
  },
  location: 'EEEP Balbina Viana Arraes',
  status: 'registration-open',
  registrationUrl: '/events/saberes',
  maxParticipants: 200
};

// ===================================================================
// COMPONENTE PRINCIPAL
// ===================================================================

const EventsPage: React.FC = () => {
  const [eventStats, setEventStats] = useState<{
    totalRegistrations: number;
    thematicAxes: ThematicAxis[];
  }>({
    totalRegistrations: 0,
    thematicAxes: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ===================================================================
  // EFEITOS E FUNÇÕES
  // ===================================================================

  useEffect(() => {
    loadEventStats();
  }, []);

  const loadEventStats = async () => {
    try {
      setLoading(true);
      
      // Buscar estatísticas dos eixos temáticos
      const axesResponse = await api.get('/events/thematic-axes');
      const axesData = axesResponse.data;
      
      // Buscar estatísticas gerais
      const statsResponse = await api.get('/events/registration-stats');
      const statsData = statsResponse.data;
      
      setEventStats({
        totalRegistrations: statsData.data?.total_registrations || 0,
        thematicAxes: axesData.data || []
      });
      
    } catch (err) {
      console.error('Erro ao carregar dados do evento:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: EventInfo['status']) => {
    const statusConfig = {
      'upcoming': { 
        label: 'Em breve', 
        variant: 'outline' as const, 
        icon: Clock 
      },
      'registration-open': { 
        label: 'Inscrições abertas', 
        variant: 'default' as const, 
        icon: CheckCircle 
      },
      'registration-closed': { 
        label: 'Inscrições encerradas', 
        variant: 'secondary' as const, 
        icon: AlertCircle 
      },
      'finished': { 
        label: 'Finalizado', 
        variant: 'outline' as const, 
        icon: CheckCircle 
      }
    };

    const config = statusConfig[status];
    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-600';
      case 'full': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  const openRegistrationPage = () => {
    window.location.href = '/eventos/inscricao';
  };

  // ===================================================================
  // RENDERIZAÇÃO
  // ===================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando informações do evento...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro ao carregar eventos</AlertTitle>
            <AlertDescription>
              {error}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadEventStats}
                className="mt-2 ml-2"
              >
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 space-y-8" style={{ marginTop: '80px' }}>
        {/* Cabeçalho da página */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-primary">Eventos</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Participe dos eventos educacionais da nossa instituição e amplie seus conhecimentos
          </p>
        </div>

      {/* Informações do evento principal */}
      <Card className="overflow-hidden">
        <div 
          className="h-48 bg-gradient-to-r from-primary to-primary-foreground relative"
          style={{
            backgroundImage: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)'
          }}
        >
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative h-full flex items-center justify-center text-white">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-2">{EVENT_INFO.title}</h2>
              <p className="text-xl opacity-90">{EVENT_INFO.subtitle}</p>
            </div>
          </div>
        </div>

        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">Informações do Evento</CardTitle>
              <CardDescription className="text-base">
                {EVENT_INFO.description}
              </CardDescription>
            </div>
            {getStatusBadge(EVENT_INFO.status)}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Detalhes do evento */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">Data</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(EVENT_INFO.date.start)} a {formatDate(EVENT_INFO.date.end)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">Local</p>
                <p className="text-sm text-muted-foreground">{EVENT_INFO.location}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">Participantes</p>
                <p className="text-sm text-muted-foreground">
                  {eventStats.totalRegistrations}
                  {EVENT_INFO.maxParticipants && ` / ${EVENT_INFO.maxParticipants}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">Eixos</p>
                <p className="text-sm text-muted-foreground">
                  {eventStats.thematicAxes.length} disponíveis
                </p>
              </div>
            </div>
          </div>

          {/* Ação principal */}
          {EVENT_INFO.status === 'registration-open' && EVENT_INFO.registrationUrl && (
            <div className="text-center py-4">
              <Button 
                size="lg" 
                onClick={openRegistrationPage}
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Fazer Inscrição
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                A página de inscrição será aberta em uma nova aba
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Eixos temáticos */}
      {eventStats.thematicAxes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Eixos Temáticos</CardTitle>
            <CardDescription>
              Conheça as áreas de conhecimento disponíveis para o evento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {eventStats.thematicAxes.map((axis) => (
                <Card key={axis.id} className="relative overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 w-1 h-full"
                    style={{ backgroundColor: axis.color }}
                  ></div>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg leading-tight">
                        {axis.title}
                      </CardTitle>
                      <Badge 
                        variant="outline" 
                        className={getAvailabilityColor(axis.availabilityStatus)}
                      >
                        {axis.availabilityStatus === 'unlimited' && 'Ilimitado'}
                        {axis.availabilityStatus === 'available' && 'Disponível'}
                        {axis.availabilityStatus === 'full' && 'Lotado'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                      {axis.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4" />
                      <span>{axis.totalRegistrations} inscrições</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações adicionais */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Informações importantes</AlertTitle>
        <AlertDescription>
          <ul className="mt-2 space-y-1 text-sm">
            <li>• As inscrições são gratuitas e limitadas por eixo temático</li>
            <li>• Cada equipe pode ter de 3 a 5 integrantes</li>
            <li>• O evento acontece de forma presencial na nossa instituição</li>
            <li>• Certificados serão emitidos para todos os participantes</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
      <Footer />
    </div>
  );
};

export default EventsPage;