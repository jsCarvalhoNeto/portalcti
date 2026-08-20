import { useMemo, useState, useEffect } from 'react';
import { useTeacherDashboard } from '@/contexts/TeacherDashboardContext';
import * as gamificationService from '@/services/gamificationService';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { GraduationCap, Filter, RefreshCw, Trophy, ArrowUpDown, ArrowUp, ArrowDown, ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react';
import { Link } from 'react-router-dom';
import StudentAchievementHistory from './StudentAchievementHistory';

export type SortOption = 'points_desc' | 'points_asc' | 'name_asc' | 'name_desc';

export default function TeacherGamificacaoTab() {
  const { students, grades, subjects } = useTeacherDashboard();
  
  const { toast } = useToast();
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name_asc');
  const [scores, setScores] = useState<Record<string, number>>({});

  // Fetch teacher report from backend to get real totals per student
  const [reportRows, setReportRows] = useState<Array<any>>([]);
  const [isLoadingReport, setIsLoadingReport] = useState<boolean>(false);

  const [unauthorized, setUnauthorized] = useState<boolean>(false);

  // Estados para o modal de histórico de conquistas
  const [achievementHistoryOpen, setAchievementHistoryOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<{
    id: string;
    name?: string;
    email?: string;
  } | null>(null);

  // Adjustment dialog state
  const [adjustDialogOpen, setAdjustDialogOpen] = useState<boolean>(false);
  const [adjustTarget, setAdjustTarget] = useState<{ id: string; name?: string } | null>(null);
  const [adjustPoints, setAdjustPoints] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [adjustSubject, setAdjustSubject] = useState<string>('');

  const fetchReport = async (opts?: { subject?: string }) => {
    setIsLoadingReport(true);
    try {
      const res = await gamificationService.teacherReport(opts);
      console.debug('teacherReport response:', res);
      if (res && (res as any).error) {
        // handle auth error
        if ((res as any).status === 401) {
          setUnauthorized(true);
          toast({ title: 'Atenção', description: 'Faça login como professor', variant: 'destructive' });
        } else {
          console.warn('Relatório retornou erro', res);
        }
        setReportRows([]);
        setScores({});
        return;
      }

      // backend returns { data: rows }
      if (res && Array.isArray((res as any).data)) {
        const rows = (res as any).data;
        setReportRows(rows);
        const map: Record<string, number> = {};
        rows.forEach((r: any) => {
          const key = String(r.userId ?? r.user_id ?? r.id ?? '');
          const points = Number(r.totalPoints ?? r.total_points ?? 0);
          if (key) {
            map[key] = points;
          }
        });
        setScores(map);
        setUnauthorized(false);
      } else {
        setReportRows([]);
        setScores({});
      }
    } catch (err) {
      console.error('Erro ao buscar relatório de gamificação:', err);
      setReportRows([]);
      setScores({});
    } finally {
      setIsLoadingReport(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  // Build distinct options for grade/semester/period from subjects data
  const subjectGrades = Array.isArray(subjects) ? Array.from(new Set(subjects.map((s: any) => s.grade).filter(Boolean))) : [];
  const subjectSemesters = Array.isArray(subjects) ? Array.from(new Set(subjects.map((s: any) => s.semester).filter(Boolean))) : [];
  const subjectPeriods = Array.isArray(subjects) ? Array.from(new Set(subjects.map((s: any) => s.period).filter(Boolean))) : [];

  // Raw response inspector
  const [showRaw, setShowRaw] = useState(false);

  const filtered = useMemo(() => {
    let list: Array<{
      id: string;
      full_name: string;
      email: string;
      grade: string;
      total_points: number;
    }> = [];

    // Se temos a lista de estudantes do professor vinda do contexto
    if (Array.isArray(students) && students.length > 0) {
      list = students.map((s: any) => {
        const studentId = String(s.id);
        return {
          id: studentId,
          full_name: s.full_name || '—',
          email: s.email || '',
          grade: s.grade || '',
          total_points: Number(scores[studentId] ?? 0)
        };
      });

      if (selectedGrade !== 'all') {
        list = list.filter((s: any) => s.grade === selectedGrade);
      }
    } else if (reportRows && reportRows.length > 0) {
      // Fallback: se students estiver vazio, usamos os dados do relatório de gamificação
      list = reportRows.map((r: any) => {
        const userId = String(r.userId ?? r.user_id ?? r.id ?? '');
        return {
          id: userId,
          full_name: r.studentName || r.full_name || '—',
          email: r.email || '',
          grade: r.grade || '',
          total_points: Number(r.totalPoints ?? r.total_points ?? scores[userId] ?? 0)
        };
      });

      if (selectedGrade !== 'all') {
        list = list.filter((s: any) => s.grade === selectedGrade);
      }
    }

    // Ordenação
    list.sort((a, b) => {
      if (sortBy === 'points_desc') {
        if (b.total_points !== a.total_points) {
          return b.total_points - a.total_points;
        }
        return a.full_name.localeCompare(b.full_name, 'pt-BR');
      }
      if (sortBy === 'points_asc') {
        if (a.total_points !== b.total_points) {
          return a.total_points - b.total_points;
        }
        return a.full_name.localeCompare(b.full_name, 'pt-BR');
      }
      if (sortBy === 'name_desc') {
        return b.full_name.localeCompare(a.full_name, 'pt-BR');
      }
      // 'name_asc' padrão
      return a.full_name.localeCompare(b.full_name, 'pt-BR');
    });

    return list;
  }, [reportRows, students, selectedGrade, scores, sortBy]);

  const openAdjustFor = (id: string, name?: string) => {
    setAdjustTarget({ id, name });
    setAdjustPoints('');
    setAdjustReason('');
    setAdjustSubject(selectedSubject !== 'all' ? selectedSubject : '');
    setAdjustDialogOpen(true);
  };

  const submitAdjust = async () => {
    if (!adjustTarget) return;
    const pts = parseInt(adjustPoints, 10);
    if (Number.isNaN(pts) || pts === 0) {
      toast({ title: 'Erro', description: 'Informe um valor de pontos válido (não zero).', variant: 'destructive' });
      return;
    }
    if (!adjustReason || String(adjustReason).trim().length === 0) {
      toast({ title: 'Erro', description: 'Motivo é obrigatório.', variant: 'destructive' });
      return;
    }
    try {
      setIsLoadingReport(true);
      const payload: any = { user_id: adjustTarget.id, points: pts, reason: adjustReason };
      if (adjustSubject && adjustSubject !== 'all') payload.subject_id = adjustSubject;
      const resp = await gamificationService.teacherAdjust(payload);
      if ((resp as any)?.error) {
        toast({ title: 'Erro', description: 'Falha ao aplicar ajuste.', variant: 'destructive' });
      } else {
        toast({ title: 'Sucesso', description: 'Ajuste realizado.', variant: 'default' });
        setAdjustDialogOpen(false);
        // refresh report
        fetchReport(selectedSubject !== 'all' ? { subject: selectedSubject } : undefined);
      }
    } catch (e) {
      console.error('submitAdjust error', e);
      toast({ title: 'Erro', description: 'Falha ao aplicar ajuste.', variant: 'destructive' });
    } finally {
      setIsLoadingReport(false);
    }
  };

  // Função para abrir o histórico de conquistas do aluno
  const openStudentHistory = (studentId: string, studentName?: string, studentEmail?: string) => {
    setSelectedStudent({
      id: studentId,
      name: studentName,
      email: studentEmail
    });
    setAchievementHistoryOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-end gap-3">
        <Button variant="outline" className="flex items-center gap-2" asChild>
          <Link to="/teacher/achievements">Gerenciar Conquistas</Link>
        </Button>
        <Button variant="outline" className="flex items-center gap-2" asChild>
          <Link to="/teacher/daily-challenges">
            <Trophy className="w-4 h-4" />
            Gerenciar Desafios
          </Link>
        </Button>
      </div>
      <div>
        <h2 className="text-2xl font-bold">Gamificação</h2>
        <p className="text-muted-foreground">Visualize e gerencie a pontuação dos alunos</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-secondary-foreground" />
            Filtros
          </CardTitle>
            <CardDescription>Filtre por disciplina, série, semestre ou período</CardDescription>
        </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium">Disciplina</label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as disciplinas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as disciplinas</SelectItem>
                    {Array.isArray(subjects) && subjects.map((sub: any) => (
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
                  {(
                    subjectGrades.length > 0 ? subjectGrades : grades
                  ).map((g: any) => (
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
                  {(subjectSemesters.length > 0 ? subjectSemesters : ['1', '2']).map((s: any) => (
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
                  {(subjectPeriods.length > 0 ? subjectPeriods : ['1º Período','2º Período','3º Período','4º Período']).map((p: any) => (
                    <SelectItem key={String(p)} value={String(p)}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Ordenar por</label>
              <Select value={sortBy} onValueChange={(val: SortOption) => setSortBy(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="points_desc">🏆 Maior Pontuação</SelectItem>
                  <SelectItem value="points_asc">📉 Menor Pontuação</SelectItem>
                  <SelectItem value="name_asc">🔤 Aluno (A - Z)</SelectItem>
                  <SelectItem value="name_desc">🔤 Aluno (Z - A)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex justify-end items-center gap-2">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => fetchReport(selectedSubject !== 'all' ? { subject: selectedSubject } : undefined)}
              disabled={isLoadingReport}
            >
              <RefreshCw className="w-4 h-4" />
              {isLoadingReport ? 'Recarregando...' : 'Recarregar'}
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setShowRaw(true)}
            >
              Inspecionar
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => fetchReport(selectedSubject !== 'all' ? { subject: selectedSubject } : undefined)}
            >
              <Filter className="w-4 h-4" />
              Aplicar
            </Button>
          </div>
        </CardContent>
      </Card>

      {unauthorized && (
        <div className="bg-destructive/10 border border-destructive text-destructive rounded-lg p-3">
          <p className="font-medium">Faça login como professor</p>
          <p className="text-sm">Você precisa estar autenticado como professor para ver os dados de gamificação.</p>
        </div>
      )}

      {showRaw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-lg max-w-3xl w-full p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">Resposta bruta do relatório</h3>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => {
                  navigator.clipboard?.writeText(JSON.stringify(reportRows, null, 2));
                }}>
                  Copiar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowRaw(false)}>Fechar</Button>
              </div>
            </div>
            <pre className="max-h-96 overflow-auto text-sm bg-muted p-3 rounded">{JSON.stringify(reportRows, null, 2)}</pre>
          </div>
        </div>
      )}

      {/* Adjustment dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar Pontuação</DialogTitle>
            <DialogDescription>
              Aplicar pontos/penalidade para o aluno selecionado. Motivo obrigatório.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <Label>Aluno</Label>
              <div className="text-sm font-medium">{adjustTarget?.name || adjustTarget?.id}</div>
            </div>
            <div>
              <Label>Pontos (use negativo para penalidade)</Label>
              <Input value={adjustPoints} onChange={(e:any)=>setAdjustPoints(e.target.value)} type="number" />
            </div>
            <div>
              <Label>Disciplina (opcional)</Label>
              <Select value={adjustSubject || 'all'} onValueChange={setAdjustSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Associar a uma disciplina (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Nenhuma</SelectItem>
                  {Array.isArray(subjects) && subjects.map((sub:any)=> (
                    <SelectItem key={String(sub.id)} value={String(sub.id)}>{sub.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Motivo</Label>
              <Textarea value={adjustReason} onChange={(e:any)=>setAdjustReason(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <div className="flex items-center gap-2">
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button onClick={submitAdjust}>Aplicar Ajuste</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Pontuação dos Alunos</CardTitle>
            <CardDescription>
              {filtered.length} aluno{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''} • Ordenado por:{' '}
              <span className="font-medium text-foreground">
                {sortBy === 'points_desc' && 'Maior Pontuação (Ranking)'}
                {sortBy === 'points_asc' && 'Menor Pontuação'}
                {sortBy === 'name_asc' && 'Nome (A - Z)'}
                {sortBy === 'name_desc' && 'Nome (Z - A)'}
              </span>
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingReport ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground border-b">
                    {sortBy === 'points_desc' && <th className="p-2 w-16 text-center">Posição</th>}
                    <th className="p-2">
                      <button
                        onClick={() => setSortBy(prev => prev === 'name_asc' ? 'name_desc' : 'name_asc')}
                        className="inline-flex items-center gap-1.5 font-medium hover:text-foreground transition-colors group"
                        title="Clique para alternar ordenação por Nome"
                      >
                        Aluno
                        {sortBy === 'name_asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-primary" />
                        ) : sortBy === 'name_desc' ? (
                          <ArrowDown className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>
                    </th>
                    <th className="p-2">Email</th>
                    <th className="p-2">Série</th>
                    <th className="p-2 text-right">
                      <button
                        onClick={() => setSortBy(prev => prev === 'points_desc' ? 'points_asc' : 'points_desc')}
                        className="inline-flex items-center gap-1.5 font-medium hover:text-foreground transition-colors group ml-auto"
                        title="Clique para alternar ordenação por Pontos"
                      >
                        Pontos
                        {sortBy === 'points_desc' ? (
                          <ArrowDown className="w-3.5 h-3.5 text-primary" />
                        ) : sortBy === 'points_asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length > 0 ? (
                    filtered.map((s, index) => (
                      <tr key={s.id} className="border-t hover:bg-muted/40 transition-colors">
                        {sortBy === 'points_desc' && (
                          <td className="p-2 text-center font-medium">
                            {index === 0 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold" title="1º Lugar">
                                🥇
                              </span>
                            ) : index === 1 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-500/20 text-slate-600 dark:text-slate-300 text-xs font-bold" title="2º Lugar">
                                🥈
                              </span>
                            ) : index === 2 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700/20 text-amber-800 dark:text-amber-600 text-xs font-bold" title="3º Lugar">
                                🥉
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">{index + 1}º</span>
                            )}
                          </td>
                        )}
                        <td className="p-2">
                          <button
                            onClick={() => openStudentHistory(s.id, s.full_name, s.email)}
                            className="text-left font-medium hover:text-primary hover:underline focus:outline-none focus:text-primary transition-colors"
                            title="Clique para ver o histórico de conquistas"
                          >
                            {s.full_name}
                          </button>
                        </td>
                        <td className="p-2 text-sm text-muted-foreground">{s.email}</td>
                        <td className="p-2 text-sm">{s.grade || '-'}</td>
                        <td className="p-2 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <span className="font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary text-sm">
                              {Number(s.total_points ?? 0)} pts
                            </span>
                            <Button size="sm" variant="ghost" onClick={() => openAdjustFor(s.id, s.full_name)}>Ajustar</Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={sortBy === 'points_desc' ? 5 : 4} className="p-4 text-center text-muted-foreground">
                        Nenhum aluno encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de histórico de conquistas */}
      <StudentAchievementHistory
        open={achievementHistoryOpen}
        onOpenChange={setAchievementHistoryOpen}
        studentId={selectedStudent?.id || null}
        studentName={selectedStudent?.name}
        studentEmail={selectedStudent?.email}
      />
    </div>
  );
}
