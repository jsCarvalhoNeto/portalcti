// ===================================================================
// RELATÓRIO DETALHADO POR EQUIPE - SABERES EM CONEXÃO
// ===================================================================
// Relatório completo com todas as equipes e participantes por eixo
// ===================================================================

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  FileText, 
  RefreshCw,
  UserCircle,
  Printer
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';

interface DetailedReportModalProps {
  open: boolean;
  onClose: () => void;
}

interface Participant {
  name: string;
  email: string;
  role: 'Líder' | 'Membro';
}

interface Team {
  team_id: string;
  team_name: string;
  project_title: string;
  project_description: string;
  leader: string;
  leader_email: string;
  total_members: number;
  participants: Participant[];
  registered_at: string;
}

interface AxisReport {
  axis_id: string;
  axis_title: string;
  axis_color: string;
  total_teams: number;
  total_students: number;
  teams: Team[];
}

interface ReportData {
  summary: {
    total_axes: number;
    total_teams: number;
    total_students: number;
    generated_at: string;
  };
  axes: AxisReport[];
}

export default function DetailedReportModal({ open, onClose }: DetailedReportModalProps) {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchDetailedReport = async () => {
    setLoading(true);
    try {
      const response = await api.get('/events/admin/detailed-report');
      const data = response.data;
      
      if (data.success) {
        setReportData(data.data);
      } else {
        throw new Error(data.message || 'Erro ao buscar relatório');
      }
    } catch (error) {
      console.error('Erro ao buscar relatório detalhado:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar o relatório detalhado',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const printReport = () => {
    window.print();
  };

  useEffect(() => {
    if (open) {
      fetchDetailedReport();
    }
  }, [open]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <FileText className="w-6 h-6" />
            Relatório Detalhado por Equipe
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : reportData ? (
          <div className="space-y-6">
            {/* Botões de Ação */}
            <div className="flex justify-between items-center print:hidden">
              <Button onClick={fetchDetailedReport} variant="outline" className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Atualizar
              </Button>
              <Button onClick={printReport} className="flex items-center gap-2">
                <Printer className="w-4 h-4" />
                Imprimir Relatório
              </Button>
            </div>

            {/* Cabeçalho do Relatório - Visível na impressão */}
            <div className="hidden print:block text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">Evento: Saberes em Conexão 2025</h1>
              <h2 className="text-xl mb-2">Relatório de Equipes por Eixo Temático</h2>
              <p className="text-sm text-muted-foreground">
                Gerado em: {new Date(reportData.summary.generated_at).toLocaleString('pt-BR')}
              </p>
            </div>

            {/* Resumo Geral */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total de Eixos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{reportData.summary.total_axes}</div>
                  <p className="text-xs text-muted-foreground mt-1">Com inscrições</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Total de Equipes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{reportData.summary.total_teams}</div>
                  <p className="text-xs text-muted-foreground mt-1">Equipes cadastradas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <UserCircle className="w-4 h-4" />
                    Total de Estudantes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{reportData.summary.total_students}</div>
                  <p className="text-xs text-muted-foreground mt-1">Participantes inscritos</p>
                </CardContent>
              </Card>
            </div>

            {/* Relatório por Eixo */}
            <div className="space-y-6">
              {reportData.axes.map((axis) => (
                <div key={axis.axis_id} className="page-break-before">
                  {/* Cabeçalho do Eixo */}
                  <div className="mb-4">
                    <h3 className="text-lg font-bold mb-1" style={{ color: axis.axis_color }}>
                      {axis.axis_title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {axis.total_teams} equipes • {axis.total_students} estudantes
                    </p>
                  </div>

                  {/* Tabela de Equipes */}
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-2 font-semibold border-b">#</th>
                          <th className="text-left p-2 font-semibold border-b">Equipe / Projeto</th>
                          <th className="text-left p-2 font-semibold border-b">Participantes</th>
                          <th className="text-left p-2 font-semibold border-b">Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {axis.teams.map((team, index) => (
                          <tr key={team.team_id} className="border-b last:border-b-0 page-break-inside-avoid">
                            <td className="p-2 align-top">{index + 1}</td>
                            <td className="p-2 align-top">
                              <div>
                                <p className="font-medium">{team.team_name}</p>
                                <p className="text-xs text-muted-foreground italic">{team.project_title}</p>
                              </div>
                            </td>
                            <td className="p-2 align-top">
                              <div className="space-y-1">
                                {team.participants.map((participant, pIndex) => (
                                  <div key={pIndex} className="text-xs">
                                    <span className="font-medium">
                                      {participant.role === 'Líder' ? '🔹 ' : '• '}
                                      {participant.name}
                                    </span>
                                    <span className="text-muted-foreground"> ({participant.email})</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="p-2 align-top text-xs whitespace-nowrap">
                              {new Date(team.registered_at).toLocaleDateString('pt-BR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {axis.teams.length === 0 && (
                    <p className="text-center text-muted-foreground py-4 text-sm">
                      Nenhuma equipe inscrita neste eixo
                    </p>
                  )}
                </div>
              ))}
            </div>

            {reportData.axes.length === 0 && (
              <div className="text-center text-muted-foreground py-12">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Nenhuma inscrição encontrada</p>
                <p className="text-sm">Aguardando primeiras inscrições no evento</p>
              </div>
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
