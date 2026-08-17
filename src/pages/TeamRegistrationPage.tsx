import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Crown, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  GraduationCap, 
  Plus, 
  Trash2, 
  Shield, 
  Hash, 
  RotateCcw,
  Check,
  Send,
  UserPlus
} from 'lucide-react';
import { toast } from 'sonner';

type GradeType = '1º Ano' | '2º Ano' | '3º Ano';

interface RegisteredTeamPayload {
  id: string;
  teamNumber?: number;
  teamName: string;
  grade: GradeType;
  leaderName: string;
  members: string[];
  createdAt: number;
  voterId: string;
}

export default function TeamRegistrationPage() {
  const { code } = useParams<{ code?: string }>();
  const navigate = useNavigate();

  const [inputPin, setInputPin] = useState('');
  const [grade, setGrade] = useState<GradeType>('1º Ano');
  const [teamName, setTeamName] = useState('');
  const [leaderName, setLeaderName] = useState('');
  const [currentMemberInput, setCurrentMemberInput] = useState('');
  const [members, setMembers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [registeredTeam, setRegisteredTeam] = useState<RegisteredTeamPayload | null>(() => {
    const saved = localStorage.getItem(`team_reg_${(code || '').toUpperCase()}`);
    return saved ? JSON.parse(saved) : null;
  });

  const [voterId] = useState(() => {
    const saved = localStorage.getItem('team_reg_voter_id');
    if (saved) return saved;
    const newId = 'team_voter_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    localStorage.setItem('team_reg_voter_id', newId);
    return newId;
  });

  const activePin = (code || '').toUpperCase().trim();
  const channelRef = useRef<any>(null);

  // Conectar no canal Realtime da Sessão de Equipes
  useEffect(() => {
    if (!activePin) return;

    const channelName = `teams_${activePin}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: true }
      }
    });

    channel
      .on('broadcast', { event: 'session_reset' }, () => {
        setRegisteredTeam(null);
        localStorage.removeItem(`team_reg_${activePin}`);
        toast.info('O professor iniciou uma nova rodada de formação de equipes!');
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
  }, [activePin]);

  const handleJoinByPin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputPin.toUpperCase().trim().replace(/[^A-Z0-9]/g, '');
    if (!clean) {
      toast.error('Digite o PIN da sala de equipes!');
      return;
    }
    navigate(`/equipes/${clean}`);
  };

  const handleAddMember = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = currentMemberInput.trim();
    if (!clean) return;

    if (members.some(m => m.toLowerCase() === clean.toLowerCase())) {
      toast.error('Este membro já foi adicionado na lista.');
      return;
    }

    if (clean.toLowerCase() === leaderName.trim().toLowerCase()) {
      toast.error('O líder já faz parte da equipe automaticamente!');
      return;
    }

    setMembers([...members, clean]);
    setCurrentMemberInput('');
  };

  const handleRemoveMember = (indexToRemove: number) => {
    setMembers(members.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmitTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePin) return;

    if (!teamName.trim()) {
      toast.error('Por favor, defina um nome para a equipe!');
      return;
    }

    if (!leaderName.trim()) {
      toast.error('Por favor, informe quem é o líder da equipe!');
      return;
    }

    // Se sobrou texto no input de membro, adiciona antes de enviar
    const finalMembers = [...members];
    if (currentMemberInput.trim() && !finalMembers.includes(currentMemberInput.trim())) {
      finalMembers.push(currentMemberInput.trim());
    }

    setIsSubmitting(true);

    const teamPayload: RegisteredTeamPayload = {
      id: 'team_' + Date.now().toString() + '_' + Math.random().toString(36).substring(2, 6),
      teamName: teamName.trim(),
      grade,
      leaderName: leaderName.trim(),
      members: finalMembers,
      createdAt: Date.now(),
      voterId
    };

    try {
      if (channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'register_team',
          payload: teamPayload
        });
      }

      setRegisteredTeam(teamPayload);
      localStorage.setItem(`team_reg_${activePin}`, JSON.stringify(teamPayload));
      toast.success('Equipe cadastrada com sucesso no painel do professor!');
    } catch (err) {
      console.error('Erro ao registrar equipe:', err);
      toast.error('Não foi possível enviar a equipe. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTeam = () => {
    if (registeredTeam) {
      setTeamName(registeredTeam.teamName);
      setGrade(registeredTeam.grade);
      setLeaderName(registeredTeam.leaderName);
      setMembers(registeredTeam.members);
      setRegisteredTeam(null);
      localStorage.removeItem(`team_reg_${activePin}`);
    }
  };

  // Se não foi informado código na URL: tela para digitar o PIN
  if (!activePin) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-pink-500/20 text-pink-400 mb-2 border border-pink-500/30">
              <Users className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Cadastro de Equipes</h1>
            <p className="text-sm text-slate-400">
              Digite o código ou PIN projetado na sala para cadastrar sua equipe ao vivo.
            </p>
          </div>

          <Card className="bg-slate-900/90 border-slate-800 shadow-2xl backdrop-blur-xl">
            <CardContent className="pt-6">
              <form onSubmit={handleJoinByPin} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 block">
                    PIN da Sala de Equipes:
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <Input
                      type="text"
                      placeholder="Ex: 482019"
                      value={inputPin}
                      onChange={(e) => setInputPin(e.target.value.toUpperCase())}
                      className="pl-11 text-center font-mono text-xl tracking-widest font-bold uppercase bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-pink-500 h-12"
                      maxLength={10}
                      autoFocus
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-pink-600 hover:bg-pink-500 text-white font-semibold text-base gap-2 shadow-lg shadow-pink-600/30"
                >
                  Entrar na Formação de Equipes
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // TELA DE COMPROVANTE: SE A EQUIPE JÁ FOI ENVIADA
  if (registeredTeam) {
    const totalMembersCount = 1 + registeredTeam.members.length; // Líder + Membros

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 select-none">
        <header className="w-full max-w-md mx-auto flex items-center justify-between pt-2 pb-4">
          <Badge className="bg-slate-800 text-slate-300 border border-slate-700 font-mono text-xs px-2.5 py-1">
            SALA: <span className="text-pink-400 font-bold ml-1">{activePin}</span>
          </Badge>
          <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-xs gap-1.5 py-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Equipe Registrada
          </Badge>
        </header>

        <main className="w-full max-w-md mx-auto my-auto space-y-4 animate-in zoom-in-95">
          <Card className="bg-gradient-to-br from-slate-900 via-slate-900 to-pink-950/40 border-2 border-pink-500/50 shadow-2xl p-6 space-y-5">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-pink-500/20 text-pink-400 mx-auto flex items-center justify-center border-2 border-pink-400">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <Badge className="bg-pink-600 text-white text-xs px-3 py-1 font-semibold">
                {registeredTeam.grade}
              </Badge>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                {registeredTeam.teamName}
              </h2>
              <p className="text-xs text-emerald-400 font-medium flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Equipe transmitida para o telão do professor!
              </p>
            </div>

            {/* Informações da Equipe */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              {/* Líder */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-amber-300 font-semibold uppercase tracking-wider">Líder:</span>
                </div>
                <span className="font-bold text-sm text-white">{registeredTeam.leaderName}</span>
              </div>

              {/* Membros */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold uppercase tracking-wider">Membros da Equipe:</span>
                  <span className="font-mono text-pink-400 font-bold">{totalMembersCount} integrantes</span>
                </div>
                {registeredTeam.members.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">Nenhum membro adicional cadastrado além do líder.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {registeredTeam.members.map((member, idx) => (
                      <Badge 
                        key={idx} 
                        variant="secondary"
                        className="bg-slate-800 text-slate-200 border border-slate-700 text-xs py-1 px-2.5"
                      >
                        {member}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleEditTeam}
              className="w-full border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Editar Dados da Equipe
            </Button>
          </Card>
        </main>

        <footer className="w-full max-w-md mx-auto pt-4 pb-2 text-center text-[11px] text-slate-500">
          Informática BVA • Formador de Equipes em Tempo Real
        </footer>
      </div>
    );
  }

  // TELA PRINCIPAL: FORMULÁRIO DE CADASTRO DA EQUIPE NO CELULAR
  const totalCountPreview = 1 + members.length + (currentMemberInput.trim() ? 1 : 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 select-none">
      {/* Top Header */}
      <header className="w-full max-w-md mx-auto flex items-center justify-between pt-2 pb-4">
        <div className="flex items-center gap-2">
          <Badge className="bg-slate-800 text-slate-300 border border-slate-700 font-mono text-xs px-2.5 py-1">
            SALA: <span className="text-pink-400 font-bold ml-1">{activePin}</span>
          </Badge>
          {isConnected ? (
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-[11px] gap-1.5 px-2 py-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Ao Vivo
            </Badge>
          ) : (
            <Badge variant="outline" className="border-amber-500/40 text-amber-400 bg-amber-500/10 text-[11px] gap-1.5 px-2 py-0.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              Conectando...
            </Badge>
          )}
        </div>

        <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
          <Shield className="w-3.5 h-3.5 text-pink-400" />
          Formação de Equipe
        </span>
      </header>

      {/* Main Content Form */}
      <main className="w-full max-w-md mx-auto my-auto space-y-4">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-white">Cadastrar Minha Equipe</h2>
          <p className="text-xs text-slate-400">
            Escolha a série, dê um nome para o time, indique o líder e os integrantes.
          </p>
        </div>

        <Card className="bg-slate-900/90 border-slate-800 shadow-2xl">
          <CardContent className="pt-5 pb-5 space-y-4">
            <form onSubmit={handleSubmitTeam} className="space-y-4">
              {/* 1. Escolha da Série */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-pink-400" />
                  Série / Ano da Turma:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['1º Ano', '2º Ano', '3º Ano'] as GradeType[]).map((g) => {
                    const isSelected = grade === g;
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGrade(g)}
                        className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all border text-center ${
                          isSelected
                            ? 'bg-pink-600 text-white border-pink-400 ring-2 ring-pink-500/40 shadow-md shadow-pink-900'
                            : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-pink-500/40 hover:bg-slate-800'
                        }`}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Nome da Equipe */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Nome da Equipe:
                </label>
                <Input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Ex: Os Compiladores, DevSquad..."
                  className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-pink-500 h-11 text-sm font-semibold"
                  maxLength={40}
                  required
                />
              </div>

              {/* 3. Líder da Equipe */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  Nome do Líder da Equipe:
                </label>
                <Input
                  type="text"
                  value={leaderName}
                  onChange={(e) => setLeaderName(e.target.value)}
                  placeholder="Ex: Mariana Costa"
                  className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-amber-500 h-11 text-sm font-semibold"
                  maxLength={40}
                  required
                />
              </div>

              {/* 4. Membros da Equipe */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-pink-400" />
                    Membros da Equipe:
                  </label>
                  <Badge variant="secondary" className="font-mono text-xs bg-pink-500/20 text-pink-300 border-pink-500/30">
                    Total: {totalCountPreview} pessoas
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={currentMemberInput}
                    onChange={(e) => setCurrentMemberInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddMember();
                      }
                    }}
                    placeholder="Nome do integrante..."
                    className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-pink-500 h-10 text-xs"
                    maxLength={40}
                  />
                  <Button
                    type="button"
                    onClick={() => handleAddMember()}
                    disabled={!currentMemberInput.trim()}
                    className="bg-slate-800 hover:bg-slate-700 text-pink-400 border border-slate-700 shrink-0 h-10 px-3 text-xs gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar
                  </Button>
                </div>

                {/* Lista Visual dos Membros Cadastrados */}
                {members.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800 max-h-32 overflow-y-auto">
                    {members.map((member, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-slate-800 text-slate-200 border border-slate-700 text-xs py-1 px-2 gap-1.5 flex items-center"
                      >
                        <span>{member}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(index)}
                          className="text-slate-400 hover:text-rose-400 rounded p-0.5"
                          title="Remover membro"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Botão de Envio Final */}
              <Button
                type="submit"
                disabled={isSubmitting || !teamName.trim() || !leaderName.trim()}
                className="w-full h-12 bg-pink-600 hover:bg-pink-500 text-white font-bold text-base gap-2 shadow-lg shadow-pink-600/30 transition-all active:scale-[0.98] mt-2"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Registrando...' : 'Registrar Equipe no Telão'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-md mx-auto pt-4 pb-2 text-center text-[11px] text-slate-500">
        Informática BVA • Formador de Equipes em Tempo Real
      </footer>
    </div>
  );
}
