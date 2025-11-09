import React, { useState, useEffect } from 'react';
import { 
  Users, Trophy, Clock, Calendar, Eye, X,
  CheckCircle, AlertCircle, TrendingUp, Download
} from 'lucide-react';
import { 
  DailyChallenge, 
  DailyChallengeSubmission, 
  DailyChallengeStats,
  dailyChallengeService 
} from '../../services/dailyChallengeService';

interface DailyChallengeViewerProps {
  challenge: DailyChallenge;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

const DailyChallengeViewer: React.FC<DailyChallengeViewerProps> = ({
  challenge,
  isOpen,
  onClose,
  onEdit
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'stats'>('preview');
  const [stats, setStats] = useState<DailyChallengeStats | null>(null);
  const [submissions, setSubmissions] = useState<DailyChallengeSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Carregar estatísticas do desafio
  useEffect(() => {
    if (isOpen && activeTab === 'stats') {
      loadStats();
    }
  }, [isOpen, activeTab, challenge.id]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const statsData = await dailyChallengeService.getChallengeSubmissions(challenge.id);
      setStats(statsData);
      setSubmissions(statsData.submissions || []);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular estatísticas derivadas
  const getStatsCalculations = () => {
    if (!stats || !submissions.length) {
      return {
        completionRate: 0,
        averageTimeToComplete: 'N/A',
        onTimeCompletions: 0,
        lateCompletions: 0,
        totalPoints: 0
      };
    }

    const onTimeCompletions = submissions.filter(s => s.is_within_deadline).length;
    const lateCompletions = submissions.length - onTimeCompletions;
    const totalPoints = submissions.reduce((sum, s) => sum + s.points_awarded, 0);
    
    // Usar stats.stats se disponível, senão calcular baseado nas submissões
    const totalSubmissions = stats.stats?.total_submissions || submissions.length;
    const completionRate = totalSubmissions > 0 ? (submissions.length / totalSubmissions) * 100 : 0;

    return {
      completionRate: Math.round(completionRate),
      averageTimeToComplete: 'N/A', // Seria necessário campo de tempo no banco
      onTimeCompletions,
      lateCompletions,
      totalPoints
    };
  };

  // Formatação de datas
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Status do desafio
  const getStatusInfo = () => {
    const now = new Date();
    const startDate = new Date(challenge.start_date);
    const endDate = new Date(challenge.end_date);

    if (now < startDate) {
      return {
        status: 'upcoming',
        label: 'Agendado',
        color: 'bg-yellow-100 text-yellow-800',
        icon: Clock
      };
    } else if (now >= startDate && now <= endDate) {
      return {
        status: 'active',
        label: 'Ativo',
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle
      };
    } else {
      return {
        status: 'expired',
        label: 'Expirado',
        color: 'bg-gray-100 text-gray-800',
        icon: AlertCircle
      };
    }
  };

  // Exportar dados para CSV
  const exportSubmissions = () => {
    if (!submissions.length) return;

    const csvData = [
      ['Nome do Aluno', 'Turma', 'Data de Submissão', 'Pontos', 'Dentro do Prazo'],
      ...submissions.map(sub => [
        sub.student_name || 'N/A',
        sub.student_grade || 'N/A',
        formatDate(sub.submitted_at),
        sub.points_awarded.toString(),
        sub.is_within_deadline ? 'Sim' : 'Não'
      ])
    ];

    const csvContent = csvData.map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `submissoes_${challenge.title.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
    link.click();
  };

  const statusInfo = getStatusInfo();
  const calculations = getStatsCalculations();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-start gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-semibold text-gray-900">{challenge.title}</h2>
                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}>
                  <statusInfo.icon size={12} />
                  {statusInfo.label}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{challenge.description}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  Início: {formatDate(challenge.start_date)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  Fim: {formatDate(challenge.end_date)}
                </span>
                <span className="flex items-center gap-1">
                  <Trophy size={12} className="text-yellow-500" />
                  {challenge.points} pontos
                </span>
                {challenge.subject_name && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                    {challenge.subject_name}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
              >
                Editar
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="px-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('preview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'preview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Eye size={16} />
                  Preview do Desafio
                </div>
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'stats'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} />
                  Estatísticas e Submissões
                  {challenge.total_submissions ? (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full">
                      {challenge.total_submissions}
                    </span>
                  ) : null}
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="h-[calc(95vh-200px)] overflow-hidden">
          {activeTab === 'preview' ? (
            /* Preview Tab */
            <div className="h-full flex flex-col">
              {/* Preview Controls */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Preview do Desafio</h3>
                    <p className="text-xs text-gray-600">Visualize como os alunos veem o desafio</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {(['desktop', 'tablet', 'mobile'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setPreviewMode(mode)}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${
                          previewMode === mode
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-600 hover:text-gray-800 border border-gray-300'
                        }`}
                      >
                        {mode === 'desktop' && '🖥️ Desktop'}
                        {mode === 'tablet' && '📱 Tablet'} 
                        {mode === 'mobile' && '📱 Mobile'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Preview Frame */}
              <div className="flex-1 p-4 bg-gray-100">
                <div 
                  className={`mx-auto bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm transition-all ${
                    previewMode === 'desktop' ? 'w-full' : 
                    previewMode === 'tablet' ? 'w-3/4 max-w-3xl' : 
                    'w-1/2 max-w-sm'
                  }`}
                  style={{ height: 'calc(100% - 2rem)' }}
                >
                  <iframe
                    srcDoc={challenge.html_content}
                    className="w-full h-full border-none"
                    title={`Preview - ${challenge.title}`}
                    sandbox="allow-scripts"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Statistics Tab */
            <div className="h-full overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando estatísticas...</p>
                  </div>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {/* Cards de Estatísticas Gerais */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-600">Total de Submissões</p>
                          <p className="text-2xl font-bold text-blue-900">{submissions.length}</p>
                        </div>
                        <Users className="w-8 h-8 text-blue-500" />
                      </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-600">Taxa de Conclusão</p>
                          <p className="text-2xl font-bold text-green-900">{calculations.completionRate}%</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-500" />
                      </div>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-yellow-600">No Prazo</p>
                          <p className="text-2xl font-bold text-yellow-900">{calculations.onTimeCompletions}</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-yellow-500" />
                      </div>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-purple-600">Total de Pontos</p>
                          <p className="text-2xl font-bold text-purple-900">{calculations.totalPoints}</p>
                        </div>
                        <Trophy className="w-8 h-8 text-purple-500" />
                      </div>
                    </div>
                  </div>

                  {/* Tabela de Submissões */}
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                      <h3 className="text-lg font-medium text-gray-900">Submissões dos Alunos</h3>
                      {submissions.length > 0 && (
                        <button
                          onClick={exportSubmissions}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                        >
                          <Download size={14} />
                          Exportar CSV
                        </button>
                      )}
                    </div>

                    {submissions.length === 0 ? (
                      <div className="p-8 text-center">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-gray-900 mb-2">Nenhuma Submissão</h4>
                        <p className="text-gray-600">
                          Este desafio ainda não recebeu submissões dos alunos.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Aluno
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Turma
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Data de Submissão
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Pontos
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {submissions.map((submission) => (
                              <tr key={submission.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {submission.student_name || 'Nome não disponível'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {submission.student_grade || 'N/A'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {formatDate(submission.submitted_at)}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                    <Trophy size={10} />
                                    {submission.points_awarded}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <span 
                                    className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                                      submission.is_within_deadline 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {submission.is_within_deadline ? (
                                      <>
                                        <CheckCircle size={10} />
                                        No Prazo
                                      </>
                                    ) : (
                                      <>
                                        <AlertCircle size={10} />
                                        Atrasado
                                      </>
                                    )}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Insights */}
                  {submissions.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-md font-medium text-blue-900 mb-3 flex items-center gap-2">
                        <TrendingUp size={18} />
                        Insights
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <p className="text-blue-800">
                            <strong>Taxa de Pontualidade:</strong>{' '}
                            {submissions.length > 0 ? 
                              Math.round((calculations.onTimeCompletions / submissions.length) * 100) : 0
                            }% dos alunos entregaram no prazo
                          </p>
                          <p className="text-blue-800">
                            <strong>Pontuação Média:</strong>{' '}
                            {submissions.length > 0 ? 
                              Math.round(calculations.totalPoints / submissions.length) : 0
                            } pontos por aluno
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-blue-800">
                            <strong>Primeiro a entregar:</strong>{' '}
                            {submissions.sort((a, b) => 
                              new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
                            )[0]?.student_name || 'N/A'}
                          </p>
                          <p className="text-blue-800">
                            <strong>Último a entregar:</strong>{' '}
                            {submissions.sort((a, b) => 
                              new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
                            )[0]?.student_name || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyChallengeViewer;