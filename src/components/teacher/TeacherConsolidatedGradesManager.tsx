import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  GraduationCap,
  Search,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  BookOpen,
  Filter,
  Users,
  Award,
  Layers,
  Info,
  Save,
  Calculator,
  TableProperties,
  Check
} from 'lucide-react';
import {
  ConsolidatedSubject,
  ConsolidatedPeriodReport,
  StudentConsolidatedRow,
  GradeCalculationMode,
  getConsolidatedTeacherSubjects,
  getConsolidatedPeriodGrades,
  saveStudentExtraPoints
} from '@/services/consolidatedGradesService';

const PERIOD_OPTIONS = [
  { value: '1º Período', label: '1º Período' },
  { value: '2º Período', label: '2º Período' },
  { value: '3º Período', label: '3º Período' },
  { value: '4º Período', label: '4º Período' }
];

const GRADE_SERIES_OPTIONS = [
  { value: 'all', label: 'Todas as Séries' },
  { value: '1º Ano', label: '1º Ano' },
  { value: '2º Ano', label: '2º Ano' },
  { value: '3º Ano', label: '3º Ano' }
];

export default function TeacherConsolidatedGradesManager() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [subjects, setSubjects] = useState<ConsolidatedSubject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('3º Período');
  const [selectedGradeSeries, setSelectedGradeSeries] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modo de cálculo das notas (Somatória de Pontos ou Média Aritmética)
  const [calculationMode, setCalculationMode] = useState<GradeCalculationMode>(() => {
    const saved = localStorage.getItem('portalcti_grade_calc_mode');
    return (saved === 'average' || saved === 'sum') ? saved : 'sum';
  });

  // Modo de visualização da tabela (Consolidada ou Detalhada por Atividade)
  const [viewMode, setViewMode] = useState<'consolidated' | 'detailed'>('detailed');

  const [reportData, setReportData] = useState<ConsolidatedPeriodReport | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingSubjects, setLoadingSubjects] = useState<boolean>(true);

  // Estados locais para edição rápida de pontos extras por aluno
  const [extraPointsInputs, setExtraPointsInputs] = useState<Record<number, string>>({});
  const [savingExtraFor, setSavingExtraFor] = useState<number | null>(null);

  // Modal de detalhes das atividades de um aluno
  const [detailsStudent, setDetailsStudent] = useState<StudentConsolidatedRow | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState<boolean>(false);

  // 1. Carregar disciplinas do professor
  useEffect(() => {
    async function loadSubjects() {
      if (!user?.id) return;
      setLoadingSubjects(true);
      try {
        const subs = await getConsolidatedTeacherSubjects(user.id);
        setSubjects(subs);
        if (subs.length > 0) {
          setSelectedSubjectId(subs[0].id);
        }
      } catch (err) {
        console.error('Erro ao carregar disciplinas do professor:', err);
      } finally {
        setLoadingSubjects(false);
      }
    }
    loadSubjects();
  }, [user?.id]);

  // 2. Carregar notas consolidadas quando disciplina, período, série ou modo de cálculo mudarem
  const loadGradesData = async () => {
    if (!selectedSubjectId || !selectedPeriod) return;
    setLoading(true);
    try {
      const data = await getConsolidatedPeriodGrades(
        selectedSubjectId,
        selectedPeriod,
        selectedGradeSeries,
        calculationMode
      );
      setReportData(data);

      // Preencher os inputs de pontos extras
      if (data) {
        const inputs: Record<number, string> = {};
        data.students.forEach(s => {
          inputs[s.enrollment_id] = s.extra_points > 0 ? String(s.extra_points) : '';
        });
        setExtraPointsInputs(inputs);
      }
    } catch (err) {
      console.error('Erro ao carregar notas consolidadas:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as notas da turma.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGradesData();
  }, [selectedSubjectId, selectedPeriod, selectedGradeSeries, calculationMode]);

  const handleCalculationModeChange = (mode: GradeCalculationMode) => {
    setCalculationMode(mode);
    localStorage.setItem('portalcti_grade_calc_mode', mode);
  };

  // 3. Salvar pontos extras de um aluno
  const handleSaveExtraPoints = async (student: StudentConsolidatedRow) => {
    if (!selectedSubjectId || !selectedPeriod) return;
    setSavingExtraFor(student.enrollment_id);

    const inputValue = extraPointsInputs[student.enrollment_id] || '';
    const pointsNum = inputValue === '' ? 0 : parseFloat(inputValue.replace(',', '.'));
    const safePoints = isNaN(pointsNum) ? 0 : Math.max(0, Math.min(10, pointsNum));

    try {
      const success = await saveStudentExtraPoints(
        student.enrollment_id,
        selectedSubjectId,
        selectedPeriod,
        safePoints,
        student.extra_points_notes,
        user?.id
      );

      if (success) {
        toast({
          title: 'Pontos extras atualizados!',
          description: `Pontos de ${student.student_name} salvos com sucesso.`
        });
      } else {
        toast({
          title: 'Salvo localmente',
          description: `Pontos salvos no navegador para ${student.student_name}.`
        });
      }

      // Recarregar dados para recalcular médias/totais
      await loadGradesData();
    } catch (err) {
      console.error('Erro ao salvar pontos extras:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar os pontos extras.',
        variant: 'destructive'
      });
    } finally {
      setSavingExtraFor(null);
    }
  };

  // Filtragem de alunos por busca
  const filteredStudents = useMemo(() => {
    if (!reportData) return [];
    if (!searchTerm.trim()) return reportData.students;
    const term = searchTerm.toLowerCase();
    return reportData.students.filter(s =>
      s.student_name.toLowerCase().includes(term) ||
      (s.student_registration && s.student_registration.toLowerCase().includes(term)) ||
      s.student_email.toLowerCase().includes(term)
    );
  }, [reportData, searchTerm]);

  // Função para imprimir/gerar PDF
  const handlePrint = () => {
    window.print();
  };

  // Exportar para CSV
  const handleExportCSV = () => {
    if (!reportData || filteredStudents.length === 0) return;

    let headers = [
      'Matrícula',
      'Nome do Aluno',
      'Série/Turma'
    ];

    // Se no modo detalhado, adiciona as colunas de cada atividade
    if (viewMode === 'detailed' && reportData.activities.length > 0) {
      reportData.activities.forEach(act => {
        headers.push(`Ativ: ${act.name} (${act.evaluation_type || 'Geral'})`);
      });
    }

    headers.push(
      calculationMode === 'sum' ? 'Soma Parcial (AV1)' : 'Média Parcial (AV1)',
      calculationMode === 'sum' ? 'Soma Global (AV2)' : 'Média Global (AV2)',
      'Pontos Extras',
      'Nota Final',
      'Situação'
    );

    const rows = filteredStudents.map(s => {
      const row = [
        `"${s.student_registration || '-'}"`,
        `"${s.student_name}"`,
        `"${s.student_grade || '-'}"`
      ];

      if (viewMode === 'detailed' && reportData.activities.length > 0) {
        reportData.activities.forEach(act => {
          const detail = s.activities_details.find(a => a.activity_id === act.id);
          row.push(detail && detail.grade !== null ? detail.grade.toFixed(1) : '-');
        });
      }

      row.push(
        s.parcial_grade !== null ? s.parcial_grade.toFixed(1) : '-',
        s.global_grade !== null ? s.global_grade.toFixed(1) : '-',
        s.extra_points > 0 ? s.extra_points.toFixed(1) : '0',
        s.final_grade !== null ? s.final_grade.toFixed(1) : '-',
        s.status === 'approved' ? 'Aprovado' : s.status === 'recovery' ? 'Recuperação' : 'Em Andamento'
      );

      return row;
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [
      headers.join(';'),
      ...rows.map(r => r.join(';'))
    ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Notas_${reportData.subject.name}_${selectedPeriod}_${calculationMode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

  return (
    <div className="space-y-6">
      {/* Cabeçalho de Impressão (visível apenas na impressão) */}
      <div className="hidden print:block p-4 border-b">
        <h1 className="text-xl font-bold text-center">Boletim e Quadro de Notas Consolidado</h1>
        <div className="flex justify-between text-sm mt-2">
          <span><strong>Disciplina:</strong> {selectedSubject?.name}</span>
          <span><strong>Período:</strong> {selectedPeriod}</span>
          <span><strong>Data de Emissão:</strong> {new Date().toLocaleDateString('pt-BR')}</span>
        </div>
      </div>

      {/* Barra de Filtros e Controles */}
      <Card className="print:hidden border-border/60 shadow-sm bg-gradient-to-r from-card to-card/50">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                Gestão Consolidada de Notas & Boletim
              </CardTitle>
              <CardDescription>
                Acompanhe e lance notas por série, disciplina, período e atribua pontos extras
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                disabled={loading || !reportData || filteredStudents.length === 0}
                className="flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4 text-muted-foreground" />
                Imprimir / PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={loading || !reportData || filteredStudents.length === 0}
                className="flex items-center gap-1.5"
              >
                <Download className="w-4 h-4 text-muted-foreground" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Seletor de Disciplina */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" /> Disciplina
              </label>
              <Select
                value={selectedSubjectId ? String(selectedSubjectId) : ''}
                onValueChange={(val) => setSelectedSubjectId(Number(val))}
                disabled={loadingSubjects || subjects.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={loadingSubjects ? 'Carregando...' : 'Selecione a disciplina'} />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name} {s.grade ? `(${s.grade})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Seletor de Série / Turma */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" /> Série / Turma
              </label>
              <Select
                value={selectedGradeSeries}
                onValueChange={setSelectedGradeSeries}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todas as Séries" />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_SERIES_OPTIONS.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Seletor de Período */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Período
              </label>
              <Select
                value={selectedPeriod}
                onValueChange={setSelectedPeriod}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Busca rápida */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block flex items-center gap-1">
                <Search className="w-3.5 h-3.5" /> Buscar Aluno
              </label>
              <div className="relative">
                <Input
                  placeholder="Nome ou matrícula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8"
                />
              </div>
            </div>
          </div>

          {/* Barra de Opções Avançadas: Modo de Cálculo e Modo de Visualização */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 mt-4 border-t border-border/50 text-xs">
            {/* Modo de Cálculo */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-primary" />
                Cálculo das Atividades:
              </span>
              <div className="inline-flex rounded-lg border bg-muted/40 p-0.5">
                <button
                  type="button"
                  onClick={() => handleCalculationModeChange('sum')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    calculationMode === 'sum'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Soma a pontuação de todas as atividades realizadas"
                >
                  Somatória de Pontos
                </button>
                <button
                  type="button"
                  onClick={() => handleCalculationModeChange('average')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    calculationMode === 'average'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Calcula a média aritmética simples das notas das atividades"
                >
                  Média das Atividades
                </button>
              </div>
            </div>

            {/* Modo de Visualização da Planilha */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                <TableProperties className="w-3.5 h-3.5 text-primary" />
                Formato da Tabela:
              </span>
              <div className="inline-flex rounded-lg border bg-muted/40 p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('detailed')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    viewMode === 'detailed'
                      ? 'bg-background text-foreground shadow-sm border border-border/60'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Exibe uma coluna para cada atividade do período"
                >
                  Colunas por Atividade
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('consolidated')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    viewMode === 'consolidated'
                      ? 'bg-background text-foreground shadow-sm border border-border/60'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Exibe apenas os totais consolidados"
                >
                  Visão Resumida
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Métricas da Turma */}
      {reportData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
          <Card className="bg-gradient-to-br from-blue-500/10 via-background to-background border-blue-500/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total de Alunos</p>
                <p className="text-2xl font-bold">{reportData.total_students}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 via-background to-background border-purple-500/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  {calculationMode === 'sum' ? 'Média Geral (Pontos)' : 'Média da Turma'}
                </p>
                <p className="text-2xl font-bold">{reportData.average_class_grade.toFixed(1)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/10 via-background to-background border-emerald-500/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Aprovados (≥ 6.0)</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {reportData.approved_count}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 via-background to-background border-amber-500/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Em Recuperação</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {reportData.recovery_count}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Informação sobre atividades do período */}
      {reportData && reportData.activities.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs bg-muted/40 p-3 rounded-lg border">
          <Info className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="font-semibold text-foreground">Atividades computadas neste período:</span>
          {reportData.activities.map(a => (
            <Badge
              key={a.id}
              variant="outline"
              className={
                (a.evaluation_type || '').includes('Parcial')
                  ? 'border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                  : (a.evaluation_type || '').includes('Global')
                  ? 'border-purple-300 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                  : 'border-muted'
              }
            >
              {a.name} ({a.evaluation_type || 'Outra'})
            </Badge>
          ))}
        </div>
      )}

      {/* Tabela Consolidada de Notas */}
      <Card className="border-border/60 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Carregando notas consolidadas da turma...</p>
            </div>
          ) : !reportData || filteredStudents.length === 0 ? (
            <div className="text-center py-16 px-4">
              <GraduationCap className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-base font-semibold text-foreground">Nenhum aluno ou nota encontrada</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                Verifique se os filtros de disciplina, série e período estão corretos ou se há alunos matriculados nesta turma.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/60 border-b border-border text-muted-foreground font-semibold">
                    <th className="text-center py-3.5 px-3 w-12">#</th>
                    <th className="text-left py-3.5 px-4 min-w-[180px]">Aluno</th>
                    <th className="text-left py-3.5 px-3 min-w-[90px]">Série / Turma</th>

                    {/* Colunas individuais de cada atividade quando no modo detalhado */}
                    {viewMode === 'detailed' && reportData.activities.map((act) => (
                      <th key={act.id} className="text-center py-3 px-2 min-w-[100px] max-w-[140px] bg-muted/20" title={act.name}>
                        <div className="flex flex-col items-center">
                          <span className="truncate max-w-[130px] text-xs font-semibold text-foreground">{act.name}</span>
                          <span className={`text-[10px] font-normal ${
                            (act.evaluation_type || '').includes('Parcial')
                              ? 'text-blue-600 dark:text-blue-400'
                              : (act.evaluation_type || '').includes('Global')
                              ? 'text-purple-600 dark:text-purple-400'
                              : 'text-muted-foreground'
                          }`}>
                            {act.evaluation_type || 'Geral'}
                          </span>
                        </div>
                      </th>
                    ))}

                    <th className="text-center py-3.5 px-3 min-w-[110px]">
                      <div className="flex flex-col items-center">
                        <span>Avaliação Parcial</span>
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-normal">
                          (AV1) • {calculationMode === 'sum' ? 'Soma' : 'Média'}
                        </span>
                      </div>
                    </th>
                    <th className="text-center py-3.5 px-3 min-w-[110px]">
                      <div className="flex flex-col items-center">
                        <span>Avaliação Global</span>
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-normal">
                          (AV2) • {calculationMode === 'sum' ? 'Soma' : 'Média'}
                        </span>
                      </div>
                    </th>
                    <th className="text-center py-3.5 px-3 print:hidden">
                      <div className="flex flex-col items-center">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-500" /> Pontos Extras
                        </span>
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">(+bônus)</span>
                      </div>
                    </th>
                    <th className="text-center py-3.5 px-3 hidden print:table-cell">
                      Pontos Extras
                    </th>
                    <th className="text-center py-3.5 px-4 font-bold min-w-[90px]">
                      <div className="flex flex-col items-center">
                        <span>Nota Final</span>
                        <span className="text-[10px] text-muted-foreground font-normal">Período</span>
                      </div>
                    </th>
                    <th className="text-center py-3.5 px-3">Situação</th>
                    <th className="text-center py-3.5 px-3 print:hidden">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredStudents.map((student, idx) => {
                    const isSaving = savingExtraFor === student.enrollment_id;
                    const finalColor =
                      student.final_grade === null
                        ? 'text-muted-foreground'
                        : student.final_grade >= 6.0
                        ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                        : student.final_grade >= 5.0
                        ? 'text-amber-600 dark:text-amber-400 font-bold'
                        : 'text-rose-600 dark:text-rose-400 font-bold';

                    return (
                      <tr
                        key={student.enrollment_id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="text-center py-3 px-3 text-muted-foreground text-xs font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-foreground">{student.student_name}</div>
                          {student.student_registration && (
                            <div className="text-[11px] text-muted-foreground font-mono">
                              Matrícula: {student.student_registration}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-muted-foreground text-xs">
                          {student.student_grade || '-'}
                        </td>

                        {/* Notas por Atividade individual quando no modo detalhado */}
                        {viewMode === 'detailed' && reportData.activities.map((act) => {
                          const detail = student.activities_details.find(a => a.activity_id === act.id);
                          const score = detail?.grade;
                          return (
                            <td key={act.id} className="py-3 px-2 text-center bg-muted/5 font-mono text-xs">
                              {score !== null && score !== undefined ? (
                                <span className="inline-block px-1.5 py-0.5 rounded font-semibold text-foreground bg-muted/60">
                                  {Number(score).toFixed(1)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/40 text-xs">-</span>
                              )}
                            </td>
                          );
                        })}

                        {/* Avaliação Parcial (AV1) */}
                        <td className="py-3 px-3 text-center">
                          {student.parcial_grade !== null ? (
                            <div className="inline-flex flex-col items-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-xs bg-blue-500/15 text-blue-700 dark:text-blue-300">
                                {student.parcial_grade.toFixed(1)}
                              </span>
                              {calculationMode === 'sum' && student.parcial_activities_count > 1 && (
                                <span className="text-[10px] text-muted-foreground/70 mt-0.5">
                                  ({student.parcial_activities_count} ativ.)
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground/60 text-xs">-</span>
                          )}
                        </td>

                        {/* Avaliação Global (AV2) */}
                        <td className="py-3 px-3 text-center">
                          {student.global_grade !== null ? (
                            <div className="inline-flex flex-col items-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-xs bg-purple-500/15 text-purple-700 dark:text-purple-300">
                                {student.global_grade.toFixed(1)}
                              </span>
                              {calculationMode === 'sum' && student.global_activities_count > 1 && (
                                <span className="text-[10px] text-muted-foreground/70 mt-0.5">
                                  ({student.global_activities_count} ativ.)
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground/60 text-xs">-</span>
                          )}
                        </td>

                        {/* Coluna interativa de Pontos Extras (na tela) */}
                        <td className="py-2.5 px-3 text-center print:hidden">
                          <div className="flex items-center justify-center gap-1.5">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="10"
                              placeholder="0.0"
                              value={extraPointsInputs[student.enrollment_id] ?? ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setExtraPointsInputs(prev => ({ ...prev, [student.enrollment_id]: val }));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveExtraPoints(student);
                                }
                              }}
                              className="w-16 h-8 text-center text-xs font-mono font-semibold"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={isSaving}
                              onClick={() => handleSaveExtraPoints(student)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                              title="Salvar pontos extras deste aluno"
                            >
                              {isSaving ? (
                                <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Save className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </td>

                        {/* Coluna de Pontos Extras (na impressão) */}
                        <td className="py-3 px-3 text-center hidden print:table-cell font-mono">
                          {student.extra_points > 0 ? `+${student.extra_points.toFixed(1)}` : '0.0'}
                        </td>

                        {/* Nota Final */}
                        <td className="py-3 px-4 text-center">
                          <span className={`text-base font-mono ${finalColor}`}>
                            {student.final_grade !== null ? student.final_grade.toFixed(1) : '-'}
                          </span>
                        </td>

                        {/* Situação */}
                        <td className="py-3 px-3 text-center">
                          {student.status === 'approved' ? (
                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25 border-emerald-500/30">
                              Aprovado
                            </Badge>
                          ) : student.status === 'recovery' ? (
                            <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 hover:bg-rose-500/25 border-rose-500/30">
                              Recuperação
                            </Badge>
                          ) : student.status === 'in_progress' ? (
                            <Badge variant="secondary" className="text-muted-foreground">
                              Em Curso
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground/60">
                              Sem Notas
                            </Badge>
                          )}
                        </td>

                        {/* Ações / Detalhes */}
                        <td className="py-3 px-3 text-center print:hidden">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setDetailsStudent(student);
                              setDetailsModalOpen(true);
                            }}
                            className="text-xs h-7 px-2"
                          >
                            Ver Detalhes
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes das Atividades do Aluno */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              {detailsStudent?.student_name}
            </DialogTitle>
            <DialogDescription>
              Composição das notas no {selectedPeriod} - {selectedSubject?.name}
            </DialogDescription>
          </DialogHeader>

          {detailsStudent && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-3 gap-2 p-3 bg-muted/30 rounded-lg text-center">
                <div>
                  <span className="text-[11px] text-muted-foreground block font-medium">Parcial (AV1)</span>
                  <span className="text-base font-bold font-mono text-blue-600 dark:text-blue-400">
                    {detailsStudent.parcial_grade !== null ? detailsStudent.parcial_grade.toFixed(1) : '-'}
                  </span>
                  <span className="text-[10px] text-muted-foreground block mt-0.5">
                    Soma: {detailsStudent.parcial_sum.toFixed(1)} pts
                    {detailsStudent.parcial_activities_count > 0 && ` • Média: ${detailsStudent.parcial_avg.toFixed(1)}`}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block font-medium">Global (AV2)</span>
                  <span className="text-base font-bold font-mono text-purple-600 dark:text-purple-400">
                    {detailsStudent.global_grade !== null ? detailsStudent.global_grade.toFixed(1) : '-'}
                  </span>
                  <span className="text-[10px] text-muted-foreground block mt-0.5">
                    Soma: {detailsStudent.global_sum.toFixed(1)} pts
                    {detailsStudent.global_activities_count > 0 && ` • Média: ${detailsStudent.global_avg.toFixed(1)}`}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block font-medium">Pontos Extras</span>
                  <span className="text-base font-bold font-mono text-amber-600 dark:text-amber-400">
                    +{detailsStudent.extra_points.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-muted-foreground block mt-0.5">Bônus atribuído</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Atividades deste Período
                </h4>
                {detailsStudent.activities_details.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhuma atividade vinculada a este período.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {detailsStudent.activities_details.map((act) => (
                      <div
                        key={act.activity_id}
                        className="flex items-center justify-between p-2.5 rounded-md border bg-card text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-medium truncate">{act.activity_name}</p>
                          <span className="text-[10px] text-muted-foreground">
                            Tipo: {act.evaluation_type || 'Geral'}
                          </span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {act.grade !== null ? (
                            <span className="font-mono font-bold text-foreground">
                              {Number(act.grade).toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Pendente</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm">Nota Final Consolidada:</span>
                  <span className="text-xl font-bold font-mono text-primary">
                    {detailsStudent.final_grade !== null ? detailsStudent.final_grade.toFixed(1) : '-'}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {calculationMode === 'sum' ? (
                    <span>
                      Modo Somatória: Parcial ({detailsStudent.parcial_grade?.toFixed(1) || '0.0'}) + Global ({detailsStudent.global_grade?.toFixed(1) || '0.0'}) + Extras ({detailsStudent.extra_points.toFixed(1)}) = {detailsStudent.final_grade?.toFixed(1) || '-'}
                    </span>
                  ) : (
                    <span>
                      Modo Média: Média das avaliações ({detailsStudent.parcial_avg.toFixed(1)} Parcial) + Extras ({detailsStudent.extra_points.toFixed(1)}) = {detailsStudent.final_grade?.toFixed(1) || '-'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
