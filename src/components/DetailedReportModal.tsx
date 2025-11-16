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
  Printer,
  Download
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
    if (!reportData) return;

    // Criar HTML completo para impressão em nova janela
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: 'Erro',
        description: 'Não foi possível abrir janela de impressão. Verifique se pop-ups estão permitidos.',
        variant: 'destructive'
      });
      return;
    }

    const htmlContent = generatePrintHTML(reportData);
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Aguardar carregamento e imprimir
    printWindow.onload = () => {
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  };

  const exportReport = () => {
    if (!reportData) return;

    const htmlContent = generatePrintHTML(reportData);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-equipes-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Exportado com sucesso',
      description: 'O relatório foi salvo como arquivo HTML',
    });
  };

  const generatePrintHTML = (data: ReportData): string => {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório de Equipes - Saberes em Conexão 2025</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    @page {
      size: A4 portrait;
      margin: 15mm;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      font-size: 10pt;
      line-height: 1.4;
      color: #000;
      background: white;
    }
    
    .header {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2px solid #333;
    }
    
    .header h1 {
      font-size: 18pt;
      margin-bottom: 8px;
      color: #1a1a1a;
    }
    
    .header h2 {
      font-size: 14pt;
      margin-bottom: 6px;
      color: #333;
    }
    
    .header p {
      font-size: 9pt;
      color: #666;
    }
    
    .summary {
      display: flex;
      justify-content: space-around;
      margin-bottom: 20px;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 6px;
      page-break-inside: avoid;
    }
    
    .summary-item {
      text-align: center;
    }
    
    .summary-label {
      font-size: 8pt;
      color: #666;
      margin-bottom: 4px;
    }
    
    .summary-value {
      font-size: 16pt;
      font-weight: bold;
      color: #2563eb;
    }
    
    .axis-section {
      margin-top: 25px;
      page-break-inside: avoid;
    }
    
    .axis-header {
      margin-bottom: 10px;
      padding-bottom: 6px;
      border-bottom: 2px solid currentColor;
    }
    
    .axis-title {
      font-size: 13pt;
      font-weight: bold;
      margin-bottom: 4px;
    }
    
    .axis-stats {
      font-size: 9pt;
      color: #666;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
      page-break-inside: auto;
    }
    
    thead {
      display: table-header-group;
    }
    
    tbody {
      display: table-row-group;
    }
    
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    
    th {
      background-color: #f0f0f0;
      font-weight: 600;
      text-align: left;
      padding: 8px 6px;
      border: 1px solid #ddd;
      font-size: 9pt;
    }
    
    td {
      padding: 6px;
      border: 1px solid #ddd;
      vertical-align: top;
      font-size: 8.5pt;
    }
    
    .team-name {
      font-weight: 600;
      margin-bottom: 2px;
    }
    
    .project-title {
      font-size: 8pt;
      color: #666;
      font-style: italic;
    }
    
    .participant {
      margin-bottom: 3px;
      line-height: 1.3;
    }
    
    .participant-name {
      font-weight: 500;
    }
    
    .participant-email {
      color: #666;
      font-size: 7.5pt;
    }
    
    .no-teams {
      text-align: center;
      padding: 20px;
      color: #999;
      font-style: italic;
    }
    
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .axis-section {
        page-break-before: auto;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Evento: Saberes em Conexão 2025</h1>
    <h2>Relatório de Equipes por Eixo Temático</h2>
    <p>Gerado em: ${new Date(data.summary.generated_at).toLocaleString('pt-BR')}</p>
  </div>
  
  <div class="summary">
    <div class="summary-item">
      <div class="summary-label">Total de Eixos</div>
      <div class="summary-value">${data.summary.total_axes}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Total de Equipes</div>
      <div class="summary-value">${data.summary.total_teams}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Total de Estudantes</div>
      <div class="summary-value">${data.summary.total_students}</div>
    </div>
  </div>
  
  ${data.axes.map(axis => `
    <div class="axis-section">
      <div class="axis-header" style="color: ${axis.axis_color}; border-color: ${axis.axis_color};">
        <div class="axis-title">${axis.axis_title}</div>
        <div class="axis-stats">${axis.total_teams} equipes • ${axis.total_students} estudantes</div>
      </div>
      
      ${axis.teams.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th style="width: 5%;">#</th>
              <th style="width: 25%;">Equipe / Projeto</th>
              <th style="width: 55%;">Participantes</th>
              <th style="width: 15%;">Data</th>
            </tr>
          </thead>
          <tbody>
            ${axis.teams.map((team, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>
                  <div class="team-name">${team.team_name}</div>
                  <div class="project-title">${team.project_title}</div>
                </td>
                <td>
                  ${team.participants.map(p => `
                    <div class="participant">
                      <span class="participant-name">
                        ${p.role === 'Líder' ? '🔹' : '•'} ${p.name}
                      </span>
                      <span class="participant-email">(${p.email})</span>
                    </div>
                  `).join('')}
                </td>
                <td>${new Date(team.registered_at).toLocaleDateString('pt-BR')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : `
        <p class="no-teams">Nenhuma equipe inscrita neste eixo</p>
      `}
    </div>
  `).join('')}
</body>
</html>`;
  };

  useEffect(() => {
    if (open) {
      fetchDetailedReport();
    }
  }, [open]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto print:max-h-none print:overflow-visible print:max-w-none">
        <DialogHeader className="print:hidden">
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
              <div className="flex gap-2">
                <Button onClick={exportReport} variant="outline" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Exportar HTML
                </Button>
                <Button onClick={printReport} className="flex items-center gap-2">
                  <Printer className="w-4 h-4" />
                  Imprimir Relatório
                </Button>
              </div>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:block print:mb-6">
              <Card className="print:inline-block print:w-auto print:mr-4">
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

              <Card className="print:inline-block print:w-auto print:mr-4">
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

              <Card className="print:inline-block print:w-auto">
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
