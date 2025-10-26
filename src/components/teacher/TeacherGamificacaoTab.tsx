import { useMemo, useState, useEffect } from 'react';
import { useTeacherDashboard } from '@/contexts/TeacherDashboardContext';
import * as gamificationService from '@/services/gamificationService';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GraduationCap, Filter, RefreshCw } from 'lucide-react';

export default function TeacherGamificacaoTab() {
  const { students, grades, subjects } = useTeacherDashboard();
  const { toast } = useToast();
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [scores, setScores] = useState<Record<string, number>>({});

  // Fetch teacher report from backend to get real totals per student
  const [reportRows, setReportRows] = useState<Array<any>>([]);
  const [isLoadingReport, setIsLoadingReport] = useState<boolean>(false);

  const [unauthorized, setUnauthorized] = useState<boolean>(false);

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
        // console.log('TeacherGamificacaoTab - Raw report rows:', rows);
        // console.log('TeacherGamificacaoTab - Looking for welline user in rows:', rows.find((r: any) => r.full_name && r.full_name.toLowerCase().includes('welline')));
        setReportRows(rows);
        const map: Record<string, number> = {};
        rows.forEach((r: any) => {
          const key = String(r.user_id ?? r.id ?? '');
          const points = Number(r.total_points || 0);
          // console.log('Processing user:', r.full_name, 'user_id:', key, 'points:', points);
          map[key] = points;
        });
        // console.log('TeacherGamificacaoTab - Scores map:', map);
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
    // Quando reportRows está disponível, usamos os dados do relatório
    // Caso contrário, usamos os dados dos estudantes com pontuações do mapa
    if (reportRows && reportRows.length > 0) {
      const studentsMap = Array.isArray(students)
        ? Object.fromEntries(students.map(s => [String((s as any).id), s]))
        : {};
      
      let list = reportRows.map((r: any) => {
        const userId = String(r.user_id ?? r.id ?? '');
        return {
          id: userId,
          full_name: r.full_name || (studentsMap[userId]?.full_name) || '—',
          email: studentsMap[userId]?.email || '',
          grade: studentsMap[userId]?.grade || '',
          total_points: Number(r.total_points || 0)
        };
      });

      if (selectedGrade !== 'all') {
        list = list.filter((s: any) => s.grade === selectedGrade);
      }
      return list;
    } else {
      // Fallback para quando não há dados do relatório
      if (Array.isArray(students)) {
        return students.map(s => ({
          id: String((s as any).id),
          full_name: s.full_name,
          email: s.email,
          grade: s.grade,
          total_points: scores[String((s as any).id)] || 0
        }));
      }
      return [];
    }
  }, [reportRows, students, selectedGrade, scores]);

  return (
    <div className="space-y-8">
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

      <Card>
        <CardHeader>
          <CardTitle>Pontuação dos Alunos</CardTitle>
          <CardDescription>Resultados filtrados</CardDescription>
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
                  <tr className="text-left text-sm text-muted-foreground">
                    <th className="p-2">Aluno</th>
                    <th className="p-2">Email</th>
                    <th className="p-2">Série</th>
                    <th className="p-2">Pontos</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length > 0 ? (
                    filtered.map((s) => (
                      <tr key={s.id} className="border-t">
                        <td className="p-2">{s.full_name}</td>
                        <td className="p-2 text-sm text-muted-foreground">{s.email}</td>
                        <td className="p-2 text-sm">{s.grade || '-'}</td>
                        <td className="p-2 font-medium">{Number(s.total_points ?? 0)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-muted-foreground">
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
    </div>
  );
}
