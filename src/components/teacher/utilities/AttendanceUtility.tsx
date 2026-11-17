import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  UserCheck,
  QrCode,
  Copy,
  Check,
  Clock,
  RefreshCw,
  Trophy,
  Users,
  Plus,
  Trash2,
  Download,
  History,
  Maximize2,
  XCircle,
  Search,
  Sparkles,
  Play,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { subjectService } from '@/services/subjectService';
import { enrollmentService } from '@/services/enrollmentService';
import { ATTENDANCE_POINTS_DEFAULT } from '@/services/gamificationService';
import attendanceService, {
  AttendanceRecord,
  AttendanceSession,
} from '@/services/attendanceService';
import { toast } from 'sonner';

interface AttendanceUtilityProps {
  defaultSubjectId?: number | string | null;
  defaultLessonId?: string | null;
  defaultTitle?: string;
}

export default function AttendanceUtility({
  defaultSubjectId = null,
  defaultLessonId = null,
  defaultTitle = '',
}: AttendanceUtilityProps) {
  const { user } = useAuth();

  // Formulário de criação
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    defaultSubjectId ? String(defaultSubjectId) : 'none'
  );
  const [title, setTitle] = useState<string>(
    defaultTitle || `Chamada - ${new Date().toLocaleDateString('pt-BR')}`
  );
  const [durationMinutes, setDurationMinutes] = useState<string>('15');
  const [pointsReward, setPointsReward] = useState<number>(ATTENDANCE_POINTS_DEFAULT);
  const [creating, setCreating] = useState(false);

  // Sessão ativa e registros
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [historySessions, setHistorySessions] = useState<AttendanceSession[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // UI auxiliares
  const [copied, setCopied] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [showHistory, setShowHistory] = useState(false);

  // Marcação manual
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [manualSearch, setManualSearch] = useState('');
  const [markingStudentId, setMarkingStudentId] = useState<string | null>(null);

  useEffect(() => {
    if (defaultSubjectId) {
      setSelectedSubjectId(String(defaultSubjectId));
    }
  }, [defaultSubjectId]);

  useEffect(() => {
    if (defaultTitle) {
      setTitle(defaultTitle);
    }
  }, [defaultTitle]);

  // Timer de 1s para contagem regressiva
  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Carregar disciplinas do professor
  useEffect(() => {
    if (!user?.id) return;
    subjectService
      .getAll()
      .then((list) => {
        const all = Array.isArray(list) ? list : [];
        const mine = all.filter(
          (s: any) =>
            String(s.teacher_id) === String(user.id) ||
            (Array.isArray(s.teacher_ids) && s.teacher_ids.includes(user.id))
        );
        setSubjects(mine.length > 0 ? mine : all);
      })
      .catch(() => setSubjects([]));
  }, [user?.id]);

  const loadHistory = useCallback(async () => {
    if (!user?.id) return;
    setLoadingHistory(true);
    try {
      const list = await attendanceService.getTeacherSessions(
        user.id,
        defaultSubjectId || undefined
      );
      setHistorySessions(list);
      // Se ainda não há sessão ativa selecionada, seleciona automaticamente uma que esteja aberta e não expirada
      if (!activeSession) {
        const open = list.find(
          (s) => s.is_active && new Date(s.expires_at).getTime() > Date.now()
        );
        if (open) {
          setActiveSession(open);
        }
      }
    } catch (err: any) {
      console.warn('Erro ao carregar histórico de chamadas:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, [user?.id, defaultSubjectId, activeSession]);

  useEffect(() => {
    loadHistory();
  }, [user?.id]);

  const loadSessionRecords = useCallback(async (sessionId: string) => {
    setLoadingRecords(true);
    try {
      const list = await attendanceService.getSessionRecords(sessionId);
      setRecords(list);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao carregar presenças.');
    } finally {
      setLoadingRecords(false);
    }
  }, []);

  // Carregar registros e assinar Realtime quando uma sessão estiver selecionada
  useEffect(() => {
    if (!activeSession?.id) {
      setRecords([]);
      return;
    }

    loadSessionRecords(activeSession.id);

    const channel = supabase
      .channel(`attendance_records_${activeSession.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_records',
          filter: `session_id=eq.${activeSession.id}`,
        },
        () => {
          loadSessionRecords(activeSession.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeSession?.id, loadSessionRecords]);

  // Carregar alunos elegíveis para marcação manual
  useEffect(() => {
    const subId = activeSession?.subject_id;
    if (!subId) {
      setEnrolledStudents([]);
      return;
    }
    enrollmentService
      .getSubjectStudents(Number(subId))
      .then((list) => setEnrolledStudents(Array.isArray(list) ? list : []))
      .catch(() => setEnrolledStudents([]));
  }, [activeSession?.subject_id]);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast.error('Faça login como professor para abrir uma chamada.');
      return;
    }
    if (!title.trim()) {
      toast.error('Informe um título para a chamada.');
      return;
    }

    setCreating(true);
    try {
      const created = await attendanceService.createSession({
        teacherId: user.id,
        title: title.trim(),
        subjectId: selectedSubjectId === 'none' ? null : Number(selectedSubjectId),
        lessonId: defaultLessonId || null,
        durationMinutes: Number(durationMinutes) || 15,
        pointsReward,
      });

      const subj = subjects.find((s) => String(s.id) === String(created.subject_id));
      const enriched: AttendanceSession = {
        ...created,
        subject_name: subj?.name,
        records_count: 0,
      };
      setActiveSession(enriched);
      setHistorySessions((prev) => [enriched, ...prev]);
      toast.success(`Chamada aberta! Código: ${created.code} (+${created.points_reward} pts)`);
    } catch (err: any) {
      toast.error(err.message || 'Não foi possível abrir a chamada.');
    } finally {
      setCreating(false);
    }
  };

  const handleCloseSession = async () => {
    if (!activeSession) return;
    try {
      await attendanceService.closeSession(activeSession.id);
      setActiveSession({ ...activeSession, is_active: false, closed_at: new Date().toISOString() });
      setHistorySessions((prev) =>
        prev.map((s) => (s.id === activeSession.id ? { ...s, is_active: false } : s))
      );
      toast.success('Chamada encerrada.');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao encerrar chamada.');
    }
  };

  const handleExtendSession = async (minutes: number = 10) => {
    if (!activeSession) return;
    try {
      const updated = await attendanceService.extendSession(activeSession.id, minutes);
      setActiveSession({ ...activeSession, ...updated });
      setHistorySessions((prev) =>
        prev.map((s) => (s.id === activeSession.id ? { ...s, ...updated } : s))
      );
      toast.success(`Chamada prorrogada por +${minutes} minutos.`);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao prorrogar chamada.');
    }
  };

  const handleManualCheckIn = async (studentId: string) => {
    if (!activeSession || !user?.id) return;
    setMarkingStudentId(studentId);
    try {
      const res = await attendanceService.markStudentManually(activeSession, studentId, user.id);
      if (res.alreadyPresent) {
        toast.info('Este aluno já está na lista de presença.');
      } else {
        toast.success(`Presença registrada! (+${res.pointsAwarded} pts na gamificação)`);
        await loadSessionRecords(activeSession.id);
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao registrar presença manual.');
    } finally {
      setMarkingStudentId(null);
    }
  };

  const handleRemoveRecord = async (recordId: string) => {
    if (!activeSession) return;
    try {
      await attendanceService.removeRecord(recordId);
      setRecords((prev) => prev.filter((r) => r.id !== recordId));
      toast.success('Registro de presença removido.');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao remover registro.');
    }
  };

  const handleExportCsv = () => {
    if (!activeSession || records.length === 0) return;
    const headers = ['Nome', 'Email', 'Turma', 'Status', 'Pontos', 'Horario'];
    const rows = records.map((r) => [
      `"${(r.student_name || '').replace(/"/g, '""')}"`,
      `"${(r.student_email || '').replace(/"/g, '""')}"`,
      `"${(r.student_grade || '').replace(/"/g, '""')}"`,
      r.status,
      String(r.points_awarded),
      new Date(r.checked_in_at).toLocaleString('pt-BR'),
    ]);
    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chamada-${activeSession.code}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const checkInUrl = activeSession
    ? `${window.location.origin}/chamada/${activeSession.code}`
    : '';

  const handleCopyLink = () => {
    if (!checkInUrl) return;
    navigator.clipboard.writeText(checkInUrl);
    setCopied(true);
    toast.success('Link da chamada copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const remainingSeconds = useMemo(() => {
    if (!activeSession || !activeSession.is_active) return 0;
    const diff = Math.floor((new Date(activeSession.expires_at).getTime() - nowMs) / 1000);
    return Math.max(0, diff);
  }, [activeSession, nowMs]);

  const isSessionOpen = Boolean(activeSession && activeSession.is_active && remainingSeconds > 0);

  const formatRemaining = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const presentStudentIds = useMemo(
    () => new Set(records.map((r) => r.student_id)),
    [records]
  );

  const filteredManualCandidates = useMemo(() => {
    const pending = enrolledStudents.filter((s) => !presentStudentIds.has(s.id || s.student_id));
    if (!manualSearch.trim()) return pending.slice(0, 8);
    const q = manualSearch.toLowerCase();
    return pending
      .filter(
        (s) =>
          (s.full_name || s.name || '').toLowerCase().includes(q) ||
          (s.email || '').toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [enrolledStudents, presentStudentIds, manualSearch]);

  return (
    <div className="space-y-6">
      {/* Cabeçalho / Nova Chamada */}
      <Card className="border-emerald-500/20">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  Chamada Inteligente (QR Code / Código)
                  <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                    <Trophy className="w-3 h-3 mr-1" />
                    +{pointsReward} pts
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Gere um código rápido ou QR Code para os alunos confirmarem presença e ganharem {pointsReward} pontos na gamificação.
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory((v) => !v)}
              >
                <History className="w-4 h-4 mr-1.5" />
                {showHistory ? 'Ocultar Histórico' : `Histórico (${historySessions.length})`}
              </Button>
              {activeSession && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveSession(null)}
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Nova Chamada
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {!activeSession && (
          <CardContent>
            <form onSubmit={handleCreateSession} className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-5 space-y-1.5">
                <Label htmlFor="attendance-title">Título da Aula / Chamada</Label>
                <Input
                  id="attendance-title"
                  placeholder="Ex: Aula 04 - Flexbox e Grid"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="md:col-span-3 space-y-1.5">
                <Label>Disciplina</Label>
                <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Chamada Geral (Sem disciplina)</SelectItem>
                    {subjects.map((subj) => (
                      <SelectItem key={subj.id} value={String(subj.id)}>
                        {subj.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label>Validade</Label>
                <Select value={durationMinutes} onValueChange={setDurationMinutes}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutos</SelectItem>
                    <SelectItem value="10">10 minutos</SelectItem>
                    <SelectItem value="15">15 minutos</SelectItem>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="60">60 minutos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="attendance-points">Pontos</Label>
                <Input
                  id="attendance-points"
                  type="number"
                  min={0}
                  max={100}
                  value={pointsReward}
                  onChange={(e) => setPointsReward(Number(e.target.value) || 0)}
                />
              </div>

              <div className="md:col-span-12 flex justify-end">
                <Button type="submit" disabled={creating} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  {creating ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  Abrir Chamada Agora
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {/* Histórico de Chamadas */}
      {showHistory && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Chamadas Recentes</CardTitle>
              <Button variant="ghost" size="sm" onClick={loadHistory} disabled={loadingHistory}>
                <RefreshCw className={`w-4 h-4 ${loadingHistory ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {historySessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma chamada registrada ainda.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {historySessions.map((sess) => {
                  const open =
                    sess.is_active && new Date(sess.expires_at).getTime() > nowMs;
                  const isSelected = activeSession?.id === sess.id;
                  return (
                    <button
                      key={sess.id}
                      type="button"
                      onClick={() => setActiveSession(sess)}
                      className={`text-left p-3 rounded-lg border transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'hover:border-primary/40 hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-mono font-bold text-sm">{sess.code}</span>
                        <Badge variant={open ? 'default' : 'secondary'} className={open ? 'bg-emerald-600' : ''}>
                          {open ? 'Aberta' : 'Encerrada'}
                        </Badge>
                      </div>
                      <div className="font-medium text-sm truncate">{sess.title}</div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
                        <span>{sess.subject_name || 'Geral'}</span>
                        <span>{sess.records_count ?? 0} presentes</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Painel da Sessão Ativa / Selecionada */}
      {activeSession && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coluna Esquerda: Código e QR Code para Datashow */}
          <Card className="lg:col-span-5 border-2 border-emerald-500/30 bg-gradient-to-b from-emerald-500/5 to-transparent">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <Badge
                  variant={isSessionOpen ? 'default' : 'secondary'}
                  className={isSessionOpen ? 'bg-emerald-600 text-white' : ''}
                >
                  {isSessionOpen ? 'Chamada Aberta' : 'Chamada Encerrada / Expirada'}
                </Badge>
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {isSessionOpen ? `Expira em ${formatRemaining(remainingSeconds)}` : 'Tempo esgotado'}
                </span>
              </div>
              <CardTitle className="text-base mt-2">{activeSession.title}</CardTitle>
              {activeSession.subject_name && (
                <CardDescription>{activeSession.subject_name}</CardDescription>
              )}
            </CardHeader>

            <CardContent className="flex flex-col items-center text-center space-y-4 pt-2">
              {/* QR Code */}
              <div className="p-4 bg-white rounded-2xl shadow-sm border">
                <QRCodeSVG value={checkInUrl} size={190} level="M" />
              </div>

              {/* Código Gigante */}
              <div className="w-full p-3 rounded-xl bg-muted/60 border">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Código da Chamada (+{activeSession.points_reward} pts)
                </p>
                <div className="font-mono text-4xl font-extrabold tracking-[0.25em] text-emerald-600 dark:text-emerald-400 select-all">
                  {activeSession.code}
                </div>
                <p className="text-xs text-muted-foreground mt-1 break-all">
                  {checkInUrl}
                </p>
              </div>

              {/* Ações do Código */}
              <div className="flex flex-wrap items-center justify-center gap-2 w-full">
                <Button variant="outline" size="sm" onClick={handleCopyLink}>
                  {copied ? <Check className="w-4 h-4 mr-1.5 text-emerald-500" /> : <Copy className="w-4 h-4 mr-1.5" />}
                  Copiar Link
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsQrModalOpen(true)}>
                  <Maximize2 className="w-4 h-4 mr-1.5" />
                  Modo Datashow
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExtendSession(10)}>
                  <Clock className="w-4 h-4 mr-1.5" />
                  +10 min
                </Button>
                {isSessionOpen && (
                  <Button variant="destructive" size="sm" onClick={handleCloseSession}>
                    <XCircle className="w-4 h-4 mr-1.5" />
                    Encerrar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Coluna Direita: Lista de Presentes em Tempo Real + Marcação Manual */}
          <Card className="lg:col-span-7">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-500" />
                    Alunos Presentes ({records.length})
                  </CardTitle>
                  <CardDescription>
                    Atualização automática em tempo real conforme os alunos registram presença.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadSessionRecords(activeSession.id)}
                    disabled={loadingRecords}
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingRecords ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportCsv}
                    disabled={records.length === 0}
                  >
                    <Download className="w-4 h-4 mr-1.5" />
                    CSV
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {records.length === 0 ? (
                <div className="py-10 text-center border rounded-lg border-dashed text-muted-foreground">
                  <QrCode className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-medium">Aguardando alunos confirmarem presença...</p>
                  <p className="text-xs mt-1">
                    Peça para escanearem o QR Code ou acessarem <span className="font-mono">/chamada</span> com o código <strong>{activeSession.code}</strong>.
                  </p>
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {records.map((rec, idx) => (
                    <div
                      key={rec.id}
                      className="flex items-center justify-between p-2.5 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0">
                          {records.length - idx}
                        </span>
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">{rec.student_name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {new Date(rec.checked_in_at).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                            {rec.student_grade ? ` • ${rec.student_grade}` : ''}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <Sparkles className="w-3 h-3 mr-1" />+{rec.points_awarded} pts
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveRecord(rec.id)}
                          title="Remover presença"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Marcação Manual para alunos sem celular */}
              {activeSession.subject_id && enrolledStudents.length > 0 && (
                <div className="pt-3 border-t space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Marcação Manual (Aluno sem celular)
                    </Label>
                    <div className="relative w-48">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                      <Input
                        placeholder="Buscar aluno..."
                        value={manualSearch}
                        onChange={(e) => setManualSearch(e.target.value)}
                        className="h-8 pl-8 text-xs"
                      />
                    </div>
                  </div>

                  {filteredManualCandidates.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Todos os alunos matriculados já estão presentes ou nenhum corresponde à busca.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {filteredManualCandidates.map((st) => {
                        const stId = st.id || st.student_id;
                        return (
                          <div
                            key={stId}
                            className="flex items-center justify-between gap-2 p-2 rounded-md border text-xs"
                          >
                            <span className="truncate font-medium">
                              {st.full_name || st.name || st.email}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs shrink-0"
                              disabled={markingStudentId === stId}
                              onClick={() => handleManualCheckIn(stId)}
                            >
                              {markingStudentId === stId ? '...' : `+ Presença (${activeSession.points_reward} pts)`}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Modo Datashow (Tela Grande) */}
      <Dialog open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
        <DialogContent className="max-w-2xl text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">{activeSession?.title}</DialogTitle>
            <DialogDescription className="text-center">
              Escaneie o QR Code ou acesse <span className="font-mono font-semibold">{window.location.origin}/chamada</span> para ganhar{' '}
              <strong>+{activeSession?.points_reward} pontos</strong> na gamificação!
            </DialogDescription>
          </DialogHeader>
          {activeSession && (
            <div className="flex flex-col items-center gap-6 py-4">
              <div className="p-6 bg-white rounded-3xl shadow-md border">
                <QRCodeSVG value={checkInUrl} size={280} level="M" />
              </div>
              <div className="font-mono text-6xl font-black tracking-[0.25em] text-emerald-600 dark:text-emerald-400">
                {activeSession.code}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-500" />
                  <strong>{records.length}</strong> presentes
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {isSessionOpen ? `Expira em ${formatRemaining(remainingSeconds)}` : 'Encerrada'}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
