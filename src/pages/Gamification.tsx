import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import * as gamificationService from '@/services/gamificationService';
import { subjectService } from '@/services/subjectService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { BookOpen, BarChart3, Home, LogOut, Menu } from 'lucide-react';
import BadgeGrid from '@/components/badges/BadgeGrid';
import { SwipeableSheet, SwipeableSheetContent, SwipeableSheetTrigger } from '@/components/ui/swipeable-sheet';
import TopStudentsCard from '@/components/student/TopStudentsCard';
import DailyChallengeCard from '@/components/student/DailyChallengeCard';

export default function Gamification() {
  const { user, isStudent } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState<number>(0);
  const [history, setHistory] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [unlockedBadges, setUnlockedBadges] = useState<any[]>([]);
  const [unlockedBySubject, setUnlockedBySubject] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [subjectNamesMap, setSubjectNamesMap] = useState<Record<string,string>>({});
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');

  // carregar lista de subjects (reutilizável)
  const fetchSubjects = async () => {
    try {
      const subs = await subjectService.getAll();
      const list = Array.isArray(subs) ? subs : [];
      setSubjects(list);
      try {
        const map = Object.fromEntries((list || []).map((s: any) => [String(s.id), s.name || '']));
        setSubjectNamesMap(map);
      } catch (e) {
        console.warn('Erro ao popular subjectNamesMap em Gamification', e);
      }
    } catch (e) {
      console.error('Erro ao buscar disciplinas:', e);
    }
  };

  // Quando houver unlockedBySubject, busque nomes faltantes por id
  useEffect(() => {
    if (!unlockedBySubject || unlockedBySubject.length === 0) return;
    const missing = (unlockedBySubject || []).map((s:any) => String(s.subject_id)).filter((id:string) => !subjectNamesMap[id]);
    if (missing.length === 0) return;

    (async () => {
      const updates: Record<string,string> = {};
      await Promise.all(missing.map(async (id:string) => {
        try {
          const subj = await subjectService.getById(id);
          if (subj && subj.name) updates[id] = subj.name;
        } catch (err) {
          console.warn('Erro ao buscar disciplina por id (gamification):', id, err);
        }
      }));
      if (Object.keys(updates).length > 0) setSubjectNamesMap(prev => ({ ...prev, ...updates }));
    })();
  }, [unlockedBySubject, subjectNamesMap]);

  // Fetch initial data and subjects list
  useEffect(() => {
    const fetch = async () => {
      if (!user) return;
      setLoading(true);
      await fetchSubjects();
      try {
        // initial fetch without filters
        const data = await gamificationService.getStudentGamification(user.id);
        setTotal(Number(data?.total?.total_points || 0));
        setHistory(data?.history || []);
        setBadges(data?.badges || []);
        setUnlockedBadges(data?.unlocked_badges || []);
        setUnlockedBySubject(data?.unlocked_by_subject || []);
      } catch (e) {
        console.error('Erro ao buscar dados de gamificação:', e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  // Caso os badges por disciplina cheguem antes da lista de subjects,
  // re-consulta subjects para garantir que possamos resolver o nome real.
  useEffect(() => {
    if (unlockedBySubject && unlockedBySubject.length > 0 && subjects.length === 0) {
      fetchSubjects();
    }
  }, [unlockedBySubject]);

  const resolveSubjectName = (subjectId: any, subjectNameFromApi?: string) => {
    if (subjectNameFromApi && String(subjectNameFromApi).trim().length > 0) return subjectNameFromApi;
    const found = subjects.find((s: any) => String(s.id) === String(subjectId));
    if (found && found.name) return found.name;
    return subjectId ? `Disciplina ${subjectId}` : 'Disciplina';
  };

  // Atualizar quando houver evento global de gamificação
  useEffect(() => {
    const handler = async () => {
      if (!user) return;
      try {
        const params: any = {};
        if (selectedSubject && selectedSubject !== 'all') params.subject = selectedSubject;
        if (selectedGrade && selectedGrade !== 'all') params.grade = selectedGrade;
        if (selectedSemester && selectedSemester !== 'all') params.semester = selectedSemester;
        if (selectedPeriod && selectedPeriod !== 'all') params.period = selectedPeriod;
        const data = await gamificationService.getStudentGamification(user.id, Object.keys(params).length ? params : undefined);
        setTotal(Number(data?.total?.total_points || 0));
        setHistory(data?.history || []);
  setBadges(data?.badges || []);
  setUnlockedBadges(data?.unlocked_badges || []);
  setUnlockedBySubject(data?.unlocked_by_subject || []);
      } catch (e) {
        console.error('Erro ao atualizar gamification via evento:', e);
      }
    };
    (window as any).addEventListener && (window as any).addEventListener('gamification:update', handler);
    return () => { (window as any).removeEventListener && (window as any).removeEventListener('gamification:update', handler); };
  }, [user]);

  if (!user || !isStudent) return <div className="p-6">Acesse como estudante para ver seu painel de gamificação.</div>;

  return (
    <div className="min-h-screen bg-background">
      {/* Header (same pattern as StudentDashboard) */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Painel do Aluno</h1>
                <p className="text-sm text-muted-foreground">
                  Bem-vindo, {user?.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="default" className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                Aluno
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.reload()}
                title="Atualizar página"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/">
                  <Home className="w-4 h-4 mr-2" />
                  Portal
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.location.href = '/auth'}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto mb-6">
          <div className="hidden md:flex w-full gap-3">
            <Button asChild variant="ghost" className="w-full justify-start">
              <Link to="/student">Visão Geral</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start">
              <Link to="/disciplinas">Minhas Disciplinas</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start">
              <Link to="/disciplinas">Atividades</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start">
              <Link to="/">Notas & Desempenho</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start">
              <Link to="/">Calendário</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start">
              <Link to="/">Configurações</Link>
            </Button>
          </div>
          {/* Mobile menu (hamburger) */}
          <div className="md:hidden">
            <div className="w-full">
              <SwipeableSheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SwipeableSheetTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      Navegação
                    </span>
                    <Menu className="w-4 h-4 ml-2" />
                  </Button>
                </SwipeableSheetTrigger>
                <SwipeableSheetContent side="bottom" className="p-0" onSwipeUp={() => setIsMobileMenuOpen(false)}>
                  <div className="p-4">
                    <h3 className="font-semibold mb-4">Navegação</h3>
                    <div className="space-y-2">
                      <Button variant="ghost" className="w-full justify-start" asChild>
                        <Link to="/student">Visão Geral</Link>
                      </Button>
                      <Button variant="ghost" className="w-full justify-start" asChild>
                        <Link to="/disciplinas">Minhas Disciplinas</Link>
                      </Button>
                      <Button variant="ghost" className="w-full justify-start" asChild>
                        <Link to="/disciplinas">Atividades</Link>
                      </Button>
                      <Button variant="ghost" className="w-full justify-start" asChild>
                        <Link to="/">Notas & Desempenho</Link>
                      </Button>
                      <Button variant="ghost" className="w-full justify-start" asChild>
                        <Link to="/">Calendário</Link>
                      </Button>
                      <Button variant="ghost" className="w-full justify-start" asChild>
                        <Link to="/">Configurações</Link>
                      </Button>
                    </div>
                  </div>
                </SwipeableSheetContent>
              </SwipeableSheet>
            </div>
          </div>
        </div>

        {/* Filters card (student) - moved below header */}
        <div className="max-w-6xl mx-auto mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
              <CardDescription>Filtre por disciplina, série, semestre ou período</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium">Disciplina</label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as disciplinas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as disciplinas</SelectItem>
                      {subjects.map((sub: any) => (
                        <SelectItem key={String(sub.id)} value={String(sub.id)}>{sub.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Série</label>
                  <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as séries" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as séries</SelectItem>
                      {Array.from(new Set(subjects.map(s=>s.grade).filter(Boolean))).map((g:any)=> (
                        <SelectItem key={String(g)} value={String(g)}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Semestre</label>
                  <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os semestres" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os semestres</SelectItem>
                      {Array.from(new Set(subjects.map(s=>s.semester).filter(Boolean))).map((s:any)=> (
                        <SelectItem key={String(s)} value={String(s)}>{String(s)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Período</label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os períodos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os períodos</SelectItem>
                      {Array.from(new Set(subjects.map(s=>s.period).filter(Boolean))).map((p:any)=> (
                        <SelectItem key={String(p)} value={String(p)}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 flex justify-end items-center gap-2">
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (!user) return;
                    setLoading(true);
                    try {
                      const params: any = {};
                      if (selectedSubject && selectedSubject !== 'all') params.subject = selectedSubject;
                      if (selectedGrade && selectedGrade !== 'all') params.grade = selectedGrade;
                      if (selectedSemester && selectedSemester !== 'all') params.semester = selectedSemester;
                      if (selectedPeriod && selectedPeriod !== 'all') params.period = selectedPeriod;
                      const data = await gamificationService.getStudentGamification(user.id, Object.keys(params).length ? params : undefined);
                      setTotal(Number(data?.total?.total_points || 0));
                      setHistory(data?.history || []);
                      setBadges(data?.badges || []);
                    } catch (e) {
                      console.error(e);
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  Recarregar
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    // same as recarregar/apply for now
                    if (!user) return;
                    setLoading(true);
                    try {
                      const params: any = {};
                      if (selectedSubject && selectedSubject !== 'all') params.subject = selectedSubject;
                      if (selectedGrade && selectedGrade !== 'all') params.grade = selectedGrade;
                      if (selectedSemester && selectedSemester !== 'all') params.semester = selectedSemester;
                      if (selectedPeriod && selectedPeriod !== 'all') params.period = selectedPeriod;
                      const data = await gamificationService.getStudentGamification(user.id, Object.keys(params).length ? params : undefined);
                      setTotal(Number(data?.total?.total_points || 0));
                      setHistory(data?.history || []);
                      setBadges(data?.badges || []);
                    } catch (e) {
                      console.error(e);
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  Aplicar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Desafio do Dia */}
        <div className="max-w-6xl mx-auto mb-6">
          <DailyChallengeCard />
        </div>

        <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Summary / left */}
          <div className="md:col-span-4">
            <Card>
              <CardHeader>
                <CardTitle>Gamificação</CardTitle>
                <CardDescription>Resumo dos seus pontos e conquistas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-5xl font-extrabold">{loading ? '...' : total}</p>
                    <p className="text-sm text-muted-foreground">Pontos totais</p>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <Button onClick={async () => {
                      if (!user) return;
                      setLoading(true);
                      try {
                        const data = await gamificationService.getStudentGamification(user.id);
                        setTotal(Number(data?.total?.total_points || 0));
                        setHistory(data?.history || []);
                        setBadges(data?.badges || []);
                      } catch (e) {
                        console.error(e);
                      } finally {
                        setLoading(false);
                      }
                    }}>Atualizar</Button>
                    <div className="w-44">
                      <div className="text-xs text-muted-foreground mb-1">Progresso para próximo troféu</div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        {/* estimate 1000 as cap */}
                        <div className="bg-gradient-to-r from-purple-600 to-blue-500 h-2" style={{ width: `${Math.min((total/1000)*100, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* History / center */}
          <div className="md:col-span-5">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de pontos</CardTitle>
                <CardDescription>Últimos lançamentos de pontos</CardDescription>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Nenhum registro encontrado.</div>
                ) : (
                  <div className="space-y-3">
                    {history.map((h:any) => {
                      // Função para formatar a descrição de forma mais legível
                      const formatDescription = (source: string, reason: string, subjectName: string) => {
                        if (reason) {
                          return reason;
                        }
                        
                        // Fallback para registros antigos sem reason
                        const sourceMap: Record<string, string> = {
                          'game': 'Atividade de Jogo',
                          'submission': 'Submissão de Atividade', 
                          'access': 'Acesso ao Sistema',
                          'adjustment': 'Ajuste Manual'
                        };
                        
                        let description = sourceMap[source] || source;
                        if (subjectName) {
                          description += ` - ${subjectName}`;
                        }
                        
                        return description;
                      };

                      const description = formatDescription(h.source, h.reason, h.subject_name);
                      
                      return (
                        <div key={h.id || `${h.created_at}-${h.points}`} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm leading-tight">{description}</div>
                            {h.subject_name && !h.reason && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Disciplina: {h.subject_name}
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground mt-1">
                              {new Date(h.created_at).toLocaleString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                          <div className={`font-semibold ml-3 ${h.points >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                            {h.points >= 0 ? `+${h.points}` : h.points}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Medals / right */}
          <div className="md:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Medalhas</CardTitle>
                <CardDescription>Conquistas adquiridas</CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <BadgeGrid badges={(unlockedBadges && unlockedBadges.length) ? unlockedBadges : badges || []} cols={3} />
                  <div className="mt-4">
                    <Button asChild variant="outline" size="sm">
                      <Link to="/achievements">Ver todas as conquistas</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Badges per subject */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Medalhas por Disciplina</CardTitle>
                <CardDescription>Conquistas por disciplina</CardDescription>
              </CardHeader>
              <CardContent>
                {unlockedBySubject && unlockedBySubject.length > 0 ? (
                  <div className="space-y-4">
                    {unlockedBySubject.map((s:any) => (
                      <div key={s.subject_id} className="p-2 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">{resolveSubjectName(s.subject_id, s.subject_name) || subjectNamesMap[String(s.subject_id)] || `Disciplina ${s.subject_id}`}</div>
                          <div className="text-sm text-muted-foreground">{s.total_points} pts</div>
                        </div>
                        <div className="mt-2">
                          {s.unlocked_badges && s.unlocked_badges.length > 0 ? (
                            <BadgeGrid badges={s.unlocked_badges} cols={6} compact subjectName={resolveSubjectName(s.subject_id, s.subject_name)} subjectId={s.subject_id} />
                          ) : (
                            <div className="text-sm text-muted-foreground">Nenhuma conquista nesta disciplina</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Nenhuma conquista por disciplina encontrada.</div>
                )}
              </CardContent>
            </Card>
            {/* Top 10 leaderboard */}
            <TopStudentsCard limit={10} />
          </div>
        </div>
      </div>
      </main>
    </div>
  );
}
