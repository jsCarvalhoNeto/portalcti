// ===================================================================
// MODAL DE RELATÓRIOS - SABERES EM CONEXÃO
// ===================================================================
// Painel administrativo para visualizar estatísticas das inscrições
// ===================================================================

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  UserCheck, 
  BarChart3, 
  Download, 
  RefreshCw,
  Calendar,
  Target,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';

interface EventReportsModalProps {
  open: boolean;
  onClose: () => void;
}

interface ReportsData {
  summary: {
    total_teams: number;
    total_students: number;
    active_axes: number;
    axes_with_registrations: number;
    avg_team_size: number;
  };
  axis_statistics: Array<{
    id: string;
    title: string;
    max_teams: number;
    total_registrations: number;
    remaining_slots: number;
    occupancy_percentage: number;
    status: string;
  }>;
  recent_registrations: Array<{
    student_name: string;
    student_email: string;
    axis_title: string;
    team_name: string;
    project_title: string;
    team_size: number;
    registered_at: string;
  }>;
  daily_statistics: Array<{
    registration_date: string;
    registrations_count: number;
    unique_axes: number;
  }>;
}

export default function EventReportsModal({ open, onClose }: EventReportsModalProps) {
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await api.get('/events/admin/reports');
      const data = response.data;
      
      if (data.success) {
        setReportsData(data.data);
      } else {
        throw new Error(data.message || 'Erro ao buscar relatórios');
      }
    } catch (error) {
      console.error('Erro ao buscar relatórios:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar os relatórios',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = async () => {
    try {
      const response = await api.get('/events/admin/export', { responseType: 'text' });
      const csvData = response.data;
      
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `inscricoes_saberes_conexao_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      
      toast({
        title: 'Sucesso',
        description: 'Relatório CSV baixado com sucesso!'
      });
    } catch (error) {
      console.error('Erro ao baixar CSV:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao baixar o relatório',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    if (open) {
      fetchReports();
    }
  }, [open]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <BarChart3 className="w-6 h-6" />
            Relatórios - Saberes em Conexão
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : reportsData ? (
          <div className="space-y-6">
            {/* Botões de Ação */}
            <div className="flex justify-between items-center">
              <Button onClick={fetchReports} variant="outline" className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Atualizar
              </Button>
              <Button onClick={downloadCSV} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Baixar CSV
              </Button>
            </div>

            {/* Cards de Estatísticas Gerais */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    Total de Equipes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {reportsData.summary.total_teams}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Equipes cadastradas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-green-500" />
                    Total de Estudantes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {reportsData.summary.total_students}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Participantes inscritos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-500" />
                    Eixos Ativos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {reportsData.summary.axes_with_registrations}/{reportsData.summary.active_axes}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Com inscrições
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-orange-500" />
                    Média por Equipe
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {reportsData.summary.avg_team_size.toFixed(1)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Membros por equipe
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Estatísticas por Eixo Temático */}
              <Card>
                <CardHeader>
                  <CardTitle>Inscrições por Eixo Temático</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {reportsData.axis_statistics.map((axis) => (
                      <div key={axis.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-sm">{axis.title}</h4>
                          <Badge 
                            variant={
                              axis.status === 'LOTADO' ? 'destructive' : 
                              axis.status === 'QUASE LOTADO' ? 'outline' : 'secondary'
                            }
                          >
                            {axis.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div className="flex justify-between">
                            <span>Inscrições:</span>
                            <span className="font-medium">
                              {axis.total_registrations}/{axis.max_teams}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Ocupação:</span>
                            <span className="font-medium">
                              {axis.occupancy_percentage}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Vagas restantes:</span>
                            <span className="font-medium">
                              {axis.remaining_slots}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              axis.status === 'LOTADO' ? 'bg-red-500' :
                              axis.status === 'QUASE LOTADO' ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${axis.occupancy_percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Inscrições Recentes */}
              <Card>
                <CardHeader>
                  <CardTitle>Inscrições Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {reportsData.recent_registrations.map((reg, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-sm">{reg.student_name}</h4>
                          <Badge variant="secondary">{reg.team_size} membros</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div><strong>Email:</strong> {reg.student_email}</div>
                          <div><strong>Eixo:</strong> {reg.axis_title}</div>
                          <div><strong>Equipe:</strong> {reg.team_name}</div>
                          <div><strong>Projeto:</strong> {reg.project_title}</div>
                          <div><strong>Data:</strong> {new Date(reg.registered_at).toLocaleString('pt-BR')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Estatísticas Diárias */}
            {reportsData.daily_statistics.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Inscrições dos Últimos 7 Dias
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {reportsData.daily_statistics.map((stat, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                        <span className="text-sm">
                          {new Date(stat.registration_date).toLocaleDateString('pt-BR')}
                        </span>
                        <div className="flex gap-4 text-sm">
                          <span><strong>{stat.registrations_count}</strong> inscrições</span>
                          <span><strong>{stat.unique_axes}</strong> eixos únicos</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Nenhum dado disponível
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}