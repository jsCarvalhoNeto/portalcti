import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useTeacherDashboard } from '@/contexts/TeacherDashboardContext';
import {
  createQuickVote,
  getQuickVoteLivePanel,
  getTeacherQuickVotes,
  updateQuickVoteStatus,
  type QuickVoteDistributionItem,
  type QuickVoteLivePanel,
  type QuickVoteSession
} from '@/services/quickVoteService';

const POLLING_INTERVAL_MS = 2000;

function DistributionChart({
  distribution,
  totalVotes
}: {
  distribution: QuickVoteDistributionItem[];
  totalVotes: number;
}) {
  return (
    <div className="space-y-2">
      {distribution.map((item) => {
        const percentage = totalVotes > 0 ? (item.votes / totalVotes) * 100 : 0;
        return (
          <div key={item.score} className="grid grid-cols-[48px_1fr_60px] items-center gap-2">
            <span className="text-sm font-medium">Nota {item.score}</span>
            <div className="h-2 rounded bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-xs text-slate-600 text-right">{item.votes} voto(s)</span>
          </div>
        );
      })}
    </div>
  );
}

export default function QuickVoteUtility() {
  const { subjects } = useTeacherDashboard();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [quickVotes, setQuickVotes] = useState<QuickVoteSession[]>([]);
  const [activeQuickVote, setActiveQuickVote] = useState<QuickVoteSession | null>(null);
  const [livePanel, setLivePanel] = useState<QuickVoteLivePanel | null>(null);

  const hasSubjects = subjects.length > 0;

  const activeStatusLabel = useMemo(() => {
    if (!activeQuickVote) {
      return '';
    }
    return activeQuickVote.status === 'active' ? 'Ativa' : 'Encerrada';
  }, [activeQuickVote]);

  const loadQuickVotes = async () => {
    try {
      const data = await getTeacherQuickVotes();
      setQuickVotes(data);
    } catch (error) {
      console.error('Erro ao listar votacoes rapidas:', error);
    }
  };

  const loadLivePanel = async (quickVoteId: number, silent = false) => {
    try {
      if (!silent) {
        setIsRefreshing(true);
      }
      const panel = await getQuickVoteLivePanel(quickVoteId);
      setLivePanel(panel);
      setActiveQuickVote(panel.quickVote);
    } catch (error: any) {
      if (!silent) {
        toast({
          title: 'Falha ao atualizar painel',
          description: error?.message || 'Nao foi possivel carregar os dados em tempo real.',
          variant: 'destructive'
        });
      }
    } finally {
      if (!silent) {
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    loadQuickVotes();
  }, []);

  useEffect(() => {
    if (!activeQuickVote || activeQuickVote.status !== 'active') {
      return;
    }

    const intervalId = window.setInterval(() => {
      loadLivePanel(activeQuickVote.id, true);
    }, POLLING_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeQuickVote?.id, activeQuickVote?.status]);

  const handleCreateQuickVote = async () => {
    if (!title.trim()) {
      toast({
        title: 'Titulo obrigatorio',
        description: 'Informe o titulo/tema antes de gerar a votacao.',
        variant: 'destructive'
      });
      return;
    }

    if (!subjectId) {
      toast({
        title: 'Turma obrigatoria',
        description: 'Selecione a turma para gerar a votacao.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsCreating(true);
      const created = await createQuickVote({
        title: title.trim(),
        subjectId: Number(subjectId),
        validationMode: 'public_name'
      });

      setTitle('');
      setSubjectId('');
      setActiveQuickVote(created);

      await loadQuickVotes();
      await loadLivePanel(created.id);

      toast({
        title: 'Votacao criada',
        description: 'Link gerado com sucesso e painel em tempo real iniciado.'
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao criar votacao',
        description: error?.message || 'Nao foi possivel criar a votacao agora.',
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = async () => {
    if (!activeQuickVote?.shareUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(activeQuickVote.shareUrl);
      toast({
        title: 'Link copiado',
        description: 'O link da votacao foi copiado para a area de transferencia.'
      });
    } catch (error) {
      toast({
        title: 'Falha ao copiar link',
        description: 'Copie manualmente o link exibido no painel.',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateStatus = async (nextStatus: 'active' | 'closed') => {
    if (!activeQuickVote) {
      return;
    }

    try {
      await updateQuickVoteStatus(activeQuickVote.id, nextStatus);
      await loadQuickVotes();
      await loadLivePanel(activeQuickVote.id);

      toast({
        title: nextStatus === 'closed' ? 'Votacao encerrada' : 'Votacao reaberta',
        description: 'Status atualizado com sucesso.'
      });
    } catch (error: any) {
      toast({
        title: 'Falha ao atualizar status',
        description: error?.message || 'Tente novamente em instantes.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nova Votacao Rapida</CardTitle>
          <CardDescription>
            Defina o tema, selecione a turma e gere um link publico para os alunos votarem de 0 a 10.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quick-vote-title">Titulo/Tema</Label>
            <Input
              id="quick-vote-title"
              placeholder="Ex: Nivel de dificuldade da aula de hoje"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Turma</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a turma" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={String(subject.id)}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleCreateQuickVote} disabled={isCreating || !hasSubjects} className="w-full">
            {isCreating ? 'Gerando votacao...' : 'Gerar Votacao'}
          </Button>

          {!hasSubjects && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
              Nenhuma turma encontrada para este professor. Associe uma disciplina antes de criar votacoes.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Votacoes Criadas</CardTitle>
          <CardDescription>Selecione uma votacao para acompanhar em tempo real.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {quickVotes.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma votacao rapida criada ate o momento.</p>
          )}

          {quickVotes.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`w-full border rounded-md p-3 text-left transition-colors ${
                activeQuickVote?.id === item.id ? 'border-blue-500 bg-blue-50' : 'hover:border-slate-400'
              }`}
              onClick={() => loadLivePanel(item.id)}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.subjectName}</p>
                </div>
                <div className="text-right">
                  <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                    {item.status === 'active' ? 'Ativa' : 'Encerrada'}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">{item.totalVotes || 0} voto(s)</p>
                </div>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      {activeQuickVote && livePanel && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>{activeQuickVote.title}</CardTitle>
                <CardDescription>{livePanel.quickVote.subjectName}</CardDescription>
              </div>
              <Badge variant={activeQuickVote.status === 'active' ? 'default' : 'secondary'}>{activeStatusLabel}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="border rounded-md p-3">
                <p className="text-xs text-muted-foreground">Total de votos</p>
                <p className="text-2xl font-bold">{livePanel.totalVotes}</p>
              </div>
              <div className="border rounded-md p-3">
                <p className="text-xs text-muted-foreground">Media aritmetica</p>
                <p className="text-2xl font-bold">{livePanel.averageScore.toFixed(2)}</p>
              </div>
              <div className="border rounded-md p-3">
                <p className="text-xs text-muted-foreground">Atualizacao</p>
                <p className="text-sm font-medium">{isRefreshing ? 'Sincronizando...' : 'A cada 2 segundos'}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Link compartilhavel</Label>
              <div className="flex flex-col gap-2 md:flex-row">
                <Input value={activeQuickVote.shareUrl} readOnly />
                <Button onClick={handleCopyLink} variant="outline">Copiar Link</Button>
                {activeQuickVote.status === 'active' ? (
                  <Button onClick={() => handleUpdateStatus('closed')} variant="destructive">Encerrar Votacao</Button>
                ) : (
                  <Button onClick={() => handleUpdateStatus('active')} variant="outline">Reabrir Votacao</Button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Distribuicao das notas (0 a 10)</h3>
              <DistributionChart distribution={livePanel.distribution} totalVotes={livePanel.totalVotes} />
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Alunos que ja votaram</h3>
              {livePanel.votes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ainda nao ha votos registrados nesta votacao.</p>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="text-left px-3 py-2">Nome</th>
                        <th className="text-left px-3 py-2">Nota</th>
                        <th className="text-left px-3 py-2">Horario</th>
                      </tr>
                    </thead>
                    <tbody>
                      {livePanel.votes.map((vote) => (
                        <tr key={vote.id} className="border-t">
                          <td className="px-3 py-2">{vote.studentName}</td>
                          <td className="px-3 py-2 font-medium">{vote.score}</td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {new Date(vote.votedAt).toLocaleTimeString('pt-BR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
