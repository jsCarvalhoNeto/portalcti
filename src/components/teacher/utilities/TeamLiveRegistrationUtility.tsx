import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Users, 
  Crown, 
  Sparkles, 
  CheckCircle2, 
  RotateCcw, 
  Trash2, 
  QrCode, 
  Copy, 
  Check, 
  ExternalLink, 
  RefreshCw, 
  Tv, 
  Radio, 
  GraduationCap, 
  Plus, 
  Shuffle, 
  Share2, 
  ShieldCheck,
  Search,
  Filter
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

type GradeType = '1º Ano' | '2º Ano' | '3º Ano';

interface TeamItem {
  id: string;
  teamName: string;
  grade: GradeType;
  leaderName: string;
  members: string[];
  createdAt: number;
  voterId?: string;
}

const INITIAL_MOCK_TEAMS: TeamItem[] = [
  {
    id: '1',
    teamName: 'DevSquad Informática',
    grade: '2º Ano',
    leaderName: 'Matheus Ramos',
    members: ['Ana Beatriz', 'Carlos Eduardo', 'Juliana Lima'],
    createdAt: Date.now() - 1000 * 60 * 10
  },
  {
    id: '2',
    teamName: 'CyberKnights',
    grade: '1º Ano',
    leaderName: 'Gabriel Santos',
    members: ['Felipe Rocha', 'Lucas Mendes'],
    createdAt: Date.now() - 1000 * 60 * 5
  }
];

export default function TeamLiveRegistrationUtility() {
  const [teams, setTeams] = useState<TeamItem[]>(INITIAL_MOCK_TEAMS);
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<'all' | GradeType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Manual Add Form State
  const [manualGrade, setManualGrade] = useState<GradeType>('1º Ano');
  const [manualTeamName, setManualTeamName] = useState('');
  const [manualLeader, setManualLeader] = useState('');
  const [manualMembersText, setManualMembersText] = useState('');

  // PIN da Sessão (6 dígitos)
  const [sessionPin, setSessionPin] = useState(() => {
    const saved = sessionStorage.getItem('team_live_session_pin');
    if (saved) return saved;
    const newPin = Math.floor(100000 + Math.random() * 900000).toString();
    sessionStorage.setItem('team_live_session_pin', newPin);
    return newPin;
  });

  const channelRef = useRef<any>(null);
  const queueUrl = `${window.location.origin}/equipes/${sessionPin}`;

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.1);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.1 + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + i * 0.1);
        osc.stop(audioCtx.currentTime + i * 0.1 + 0.3);
      });
    } catch (e) {
      console.warn(e);
    }
  };

  // Inscrição no canal Realtime do Supabase
  useEffect(() => {
    if (!sessionPin) return;

    const channelName = `teams_${sessionPin}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: true }
      }
    });

    channel
      .on('broadcast', { event: 'register_team' }, (event) => {
        const payload = event?.payload;
        if (payload && payload.teamName && payload.leaderName) {
          const newTeam: TeamItem = {
            id: payload.id || 'team_' + Date.now(),
            teamName: payload.teamName,
            grade: payload.grade || '1º Ano',
            leaderName: payload.leaderName,
            members: payload.members || [],
            createdAt: payload.createdAt || Date.now(),
            voterId: payload.voterId
          };

          setTeams(prev => {
            // Se já existe equipe do mesmo voterId ou id, atualiza
            const existingIdx = prev.findIndex(t => (payload.voterId && t.voterId === payload.voterId) || t.id === payload.id);
            if (existingIdx !== -1) {
              const next = [...prev];
              next[existingIdx] = newTeam;
              return next;
            }
            return [...prev, newTeam];
          });

          playChime();
          const totalCount = 1 + newTeam.members.length;
          toast.success(`🎉 Nova equipe registrada: "${newTeam.teamName}" (${newTeam.grade}) com ${totalCount} integrantes!`, {
            duration: 4000
          });
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [sessionPin]);

  const handleManualAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTeamName.trim() || !manualLeader.trim()) return;

    const membersList = manualMembersText
      .split(/[\n,;]+/)
      .map(m => m.trim())
      .filter(m => m.length > 0 && m.toLowerCase() !== manualLeader.trim().toLowerCase());

    const newTeam: TeamItem = {
      id: 'manual_' + Date.now(),
      teamName: manualTeamName.trim(),
      grade: manualGrade,
      leaderName: manualLeader.trim(),
      members: membersList,
      createdAt: Date.now()
    };

    setTeams(prev => [...prev, newTeam]);
    setIsManualModalOpen(false);
    setManualTeamName('');
    setManualLeader('');
    setManualMembersText('');
    playChime();
    toast.success(`Equipe "${newTeam.teamName}" adicionada manualmente!`);
  };

  const handleRemoveTeam = (id: string) => {
    setTeams(prev => prev.filter(t => t.id !== id));
    toast.info('Equipe removida.');
  };

  const handleResetAll = () => {
    if (confirm('Deseja zerar todas as equipes cadastradas?')) {
      setTeams([]);
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'session_reset',
          payload: {}
        }).catch(() => {});
      }
      toast.success('Lista de equipes zerada para uma nova dinâmica!');
    }
  };

  const handleShuffleTeams = () => {
    if (teams.length < 2) {
      toast.error('É necessário ter pelo menos 2 equipes para sortear a ordem!');
      return;
    }
    const shuffled = [...teams].sort(() => Math.random() - 0.5);
    setTeams(shuffled);
    playChime();
    toast.success('Ordem de apresentação das equipes sorteada com sucesso!');
  };

  const handleGenerateNewPin = () => {
    const newPin = Math.floor(100000 + Math.random() * 900000).toString();
    sessionStorage.setItem('team_live_session_pin', newPin);
    setSessionPin(newPin);
    setTeams([]);
    toast.success(`Nova sala de formação de equipes criada: PIN ${newPin}`);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(queueUrl);
      setCopied(true);
      toast.success('Link de formação de equipes copiado!');
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      toast.error('Não foi possível copiar o link.');
    }
  };

  const handleCopySummary = () => {
    if (teams.length === 0) {
      toast.error('Nenhuma equipe cadastrada ainda para exportar.');
      return;
    }

    const text = `📋 FORMAÇÃO DE EQUIPES DA TURMA\n` +
      `Total: ${teams.length} equipes formadas\n\n` +
      teams.map((t, idx) => {
        const num = (idx + 1).toString().padStart(2, '0');
        const membersStr = t.members.length > 0 ? `\n   Membros: ${t.members.join(', ')}` : '';
        return `[Equipe #${num}] ${t.teamName} (${t.grade})\n   👑 Líder: ${t.leaderName} (Total: ${1 + t.members.length} integrantes)${membersStr}`;
      }).join('\n\n');

    navigator.clipboard.writeText(text);
    toast.success('Lista completa de equipes copiada para a área de transferência!');
  };

  // Filtragem
  const filteredTeams = teams.filter(t => {
    const matchesGrade = selectedGradeFilter === 'all' || t.grade === selectedGradeFilter;
    const matchesSearch = 
      t.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.leaderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.members.some(m => m.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesGrade && matchesSearch;
  });

  const totalStudents = teams.reduce((acc, t) => acc + 1 + t.members.length, 0);
  const avgMembers = teams.length > 0 ? (totalStudents / teams.length).toFixed(1) : '0';

  const getGradeBadgeStyle = (grade: GradeType) => {
    switch (grade) {
      case '1º Ano':
        return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30';
      case '2º Ano':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case '3º Ano':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Controls */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-pink-900 via-purple-900 to-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-pink-500 text-white gap-1 font-semibold">
              <Users className="w-3.5 h-3.5" />
              Cadastro de Equipes em Tempo Real
            </Badge>

            {isConnected ? (
              <Badge variant="outline" className="border-emerald-400/40 bg-emerald-500/20 text-emerald-300 text-xs gap-1.5 py-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Sala Online (PIN: {sessionPin})
              </Badge>
            ) : (
              <Badge variant="outline" className="border-amber-400/40 bg-amber-500/20 text-amber-300 text-xs gap-1.5 py-0.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                Conectando Supabase...
              </Badge>
            )}

            <Badge variant="outline" className="border-white/20 text-pink-200 bg-white/5 text-xs gap-1">
              <Sparkles className="w-3 h-3 text-pink-300" />
              {teams.length} equipes formadas ({totalStudents} alunos)
            </Badge>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Formação e Registro Coletivo de Equipes
            </h2>
            <p className="text-xs text-pink-200">
              Os alunos entram pelo celular, definem a série (1º, 2º ou 3º Ano), nome do time, líder e membros ao vivo.
            </p>
          </div>
        </div>

        {/* Botões de Ação do Topo */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
          <Button
            size="sm"
            onClick={() => setIsQrModalOpen(true)}
            className="bg-pink-600 hover:bg-pink-500 text-white shadow-lg shadow-pink-600/30 text-xs gap-1.5 font-semibold"
          >
            <QrCode className="w-4 h-4" />
            Projetar QR Code
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="border-white/20 bg-white/10 text-white hover:bg-white/20 text-xs gap-1.5"
            onClick={() => setIsManualModalOpen(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar Manual
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="border-white/20 bg-white/10 text-white hover:bg-white/20 text-xs gap-1.5"
            onClick={handleShuffleTeams}
            title="Sorteia a ordem de apresentação das equipes"
          >
            <Shuffle className="w-3.5 h-3.5" />
            Sortear Ordem
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="border-white/20 bg-white/10 text-white hover:bg-white/20 text-xs gap-1.5"
            onClick={handleCopySummary}
          >
            <Copy className="w-3.5 h-3.5" />
            Exportar
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="border-white/20 bg-white/10 text-white hover:bg-white/20 text-xs gap-1.5"
            onClick={handleResetAll}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpar
          </Button>
        </div>
      </div>

      {/* Banner de Acesso Rápido para Sala de Aula */}
      <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              Os alunos cadastram suas equipes escaneando o QR Code ou digitando o PIN:
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-sm font-bold text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">
                PIN: {sessionPin}
              </span>
              <span className="text-xs text-slate-400 truncate max-w-xs sm:max-w-md font-mono">
                {queueUrl}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="text-xs gap-1 text-slate-300 hover:text-white"
            onClick={() => window.open(queueUrl, '_blank')}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Testar Cadastro
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="text-xs gap-1 text-slate-400 hover:text-slate-200"
            onClick={handleGenerateNewPin}
            title="Trocar código PIN da sala"
          >
            <RefreshCw className="w-3 h-3" />
            Novo PIN
          </Button>
        </div>
      </div>

      {/* Métricas Resumidas em Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Equipes Formadas</p>
              <p className="text-3xl font-extrabold font-mono text-pink-600 dark:text-pink-400 mt-1">
                {teams.length}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-pink-500/10 text-pink-500">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Alunos em Equipes</p>
              <p className="text-3xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400 mt-1">
                {totalStudents}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500">
              <GraduationCap className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Média por Equipe</p>
              <p className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                {avgMembers} <span className="text-xs font-normal text-muted-foreground">membros</span>
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
              <Sparkles className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Filtros por Série & Busca */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-card border border-border/80">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <Button
            size="sm"
            variant={selectedGradeFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedGradeFilter('all')}
            className="text-xs rounded-lg h-8"
          >
            Todas as Séries ({teams.length})
          </Button>
          <Button
            size="sm"
            variant={selectedGradeFilter === '1º Ano' ? 'default' : 'outline'}
            onClick={() => setSelectedGradeFilter('1º Ano')}
            className="text-xs rounded-lg h-8"
          >
            1º Ano ({teams.filter(t => t.grade === '1º Ano').length})
          </Button>
          <Button
            size="sm"
            variant={selectedGradeFilter === '2º Ano' ? 'default' : 'outline'}
            onClick={() => setSelectedGradeFilter('2º Ano')}
            className="text-xs rounded-lg h-8"
          >
            2º Ano ({teams.filter(t => t.grade === '2º Ano').length})
          </Button>
          <Button
            size="sm"
            variant={selectedGradeFilter === '3º Ano' ? 'default' : 'outline'}
            onClick={() => setSelectedGradeFilter('3º Ano')}
            className="text-xs rounded-lg h-8"
          >
            3º Ano ({teams.filter(t => t.grade === '3º Ano').length})
          </Button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar equipe, líder ou aluno..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-xs bg-muted/30"
          />
        </div>
      </div>

      {/* Grid Principal de Equipes */}
      {filteredTeams.length === 0 ? (
        <Card className="border-dashed border-2 p-12 text-center text-muted-foreground space-y-3">
          <Users className="w-12 h-12 mx-auto opacity-40 text-pink-500" />
          <p className="font-semibold text-foreground text-base">Nenhuma equipe cadastrada ainda</p>
          <p className="text-xs">
            Projete o QR Code no telão para os alunos enviarem os times ou adicione manualmente.
          </p>
          <Button 
            size="sm" 
            onClick={() => setIsQrModalOpen(true)}
            className="bg-pink-600 hover:bg-pink-500 text-white gap-1.5 text-xs"
          >
            <QrCode className="w-4 h-4" />
            Projetar QR Code
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTeams.map((team, index) => {
            const teamNumberFormatted = (index + 1).toString().padStart(2, '0');
            const totalMembers = 1 + team.members.length;

            return (
              <Card 
                key={team.id} 
                className="border-2 border-border/80 hover:border-pink-500/50 transition-all shadow-sm hover:shadow-md flex flex-col justify-between overflow-hidden animate-in zoom-in-95"
              >
                <div>
                  {/* Card Header com Número da Equipe e Série */}
                  <div className="p-4 bg-muted/40 border-b flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-pink-600 text-white shadow-sm">
                        EQUIPE #{teamNumberFormatted}
                      </span>
                      <Badge variant="outline" className={`text-xs font-semibold ${getGradeBadgeStyle(team.grade)}`}>
                        {team.grade}
                      </Badge>
                    </div>

                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-rose-500"
                      onClick={() => handleRemoveTeam(team.id)}
                      title="Excluir equipe"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <CardContent className="p-4 space-y-4">
                    {/* Nome da Equipe */}
                    <div>
                      <h3 className="font-bold text-lg text-foreground tracking-tight line-clamp-1">
                        {team.teamName}
                      </h3>
                      <span className="text-[11px] text-muted-foreground">
                        {totalMembers} {totalMembers === 1 ? 'integrante' : 'integrantes'}
                      </span>
                    </div>

                    {/* Destaque do Líder */}
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="text-xs text-amber-700 dark:text-amber-300 font-semibold uppercase tracking-wider">
                          Líder:
                        </span>
                      </div>
                      <span className="font-bold text-sm text-foreground truncate max-w-[140px]">
                        {team.leaderName}
                      </span>
                    </div>

                    {/* Lista dos Membros */}
                    <div className="space-y-1.5">
                      <span className="text-xs font-medium text-muted-foreground block">
                        Membros da Equipe:
                      </span>
                      {team.members.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">Nenhum outro membro informado.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                          {team.members.map((member, mIdx) => (
                            <Badge 
                              key={mIdx} 
                              variant="secondary" 
                              className="text-xs bg-muted/60 hover:bg-muted font-normal text-foreground py-0.5 px-2"
                            >
                              {member}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </div>

                {/* Footer do Card com Timestamp */}
                <div className="px-4 py-2.5 bg-muted/20 border-t flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    Registrada
                  </span>
                  <span>{new Date(team.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Projeção / QR Code para Data-Show */}
      <Dialog open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
        <DialogContent className="max-w-xl p-6 sm:p-8 bg-slate-950 text-slate-100 border-slate-800 shadow-2xl">
          <DialogHeader className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-pink-500/20 text-pink-400 mx-auto border border-pink-500/30">
              <Tv className="w-7 h-7" />
            </div>
            <DialogTitle className="text-2xl font-bold text-white">
              Formação de Equipes ao Vivo
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-sm">
              Aponte a câmera do seu celular para o QR Code abaixo para cadastrar sua equipe e definir líder e integrantes.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center space-y-5 my-2">
            {/* QR Code com borda e fundo branco */}
            <div className="p-4 bg-white rounded-2xl shadow-2xl border-4 border-pink-500/30 animate-in zoom-in-90">
              <QRCodeSVG 
                value={queueUrl}
                size={220}
                level="H"
                includeMargin={false}
              />
            </div>

            {/* PIN e Link */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs text-slate-400 uppercase tracking-wider">Código PIN da Sala:</span>
                <span className="font-mono text-2xl font-extrabold text-pink-400 bg-pink-500/10 px-3 py-1 rounded-lg border border-pink-500/20">
                  {sessionPin}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono select-all">
                {queueUrl}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
            <Button
              className="w-full bg-pink-600 hover:bg-pink-500 text-white gap-1.5 font-semibold"
              onClick={handleCopyLink}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Link Copiado!' : 'Copiar Link da Sala'}
            </Button>
            <Button
              variant="outline"
              className="w-full border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800"
              onClick={() => setIsQrModalOpen(false)}
            >
              Fechar Projeção
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para Adicionar Equipe Manualmente */}
      <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
        <DialogContent className="max-w-md p-6 bg-card border-border shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Plus className="w-5 h-5 text-pink-500" />
              Adicionar Equipe Manualmente
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Cadastre a equipe diretamente pelo painel do professor
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleManualAddSubmit} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Série / Ano:</label>
              <div className="grid grid-cols-3 gap-2">
                {(['1º Ano', '2º Ano', '3º Ano'] as GradeType[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setManualGrade(g)}
                    className={`py-2 text-xs font-bold rounded-lg border transition-colors ${
                      manualGrade === g
                        ? 'bg-pink-600 text-white border-pink-500 shadow-sm'
                        : 'bg-muted/40 hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Nome da Equipe:</label>
              <Input
                value={manualTeamName}
                onChange={(e) => setManualTeamName(e.target.value)}
                placeholder="Ex: DevSquad"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Nome do Líder:</label>
              <Input
                value={manualLeader}
                onChange={(e) => setManualLeader(e.target.value)}
                placeholder="Ex: Matheus Ramos"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Membros (separados por vírgula ou linha):
              </label>
              <textarea
                value={manualMembersText}
                onChange={(e) => setManualMembersText(e.target.value)}
                placeholder="Ana Beatriz, Carlos Eduardo, Juliana..."
                className="w-full p-2.5 rounded-lg border bg-muted/20 text-xs text-foreground focus:ring-2 focus:ring-pink-500 focus:outline-none min-h-[80px]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsManualModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-pink-600 hover:bg-pink-500 text-white">
                Salvar Equipe
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
