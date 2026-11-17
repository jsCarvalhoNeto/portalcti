import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  UserCheck,
  QrCode,
  Trophy,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  LogIn,
  Sparkles,
  CalendarCheck,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import attendanceService, {
  AttendanceSession,
  CheckInResult,
} from '@/services/attendanceService';
import { toast } from 'sonner';

export default function AttendanceCheckInPage() {
  const { code: routeCode } = useParams<{ code?: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [codeInput, setCodeInput] = useState((routeCode || '').trim());
  const [sessionPreview, setSessionPreview] = useState<AttendanceSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);

  const [history, setHistory] = useState<
    Array<{
      id: string;
      checked_in_at: string;
      points_awarded: number;
      session_title: string;
      subject_name?: string;
      code: string;
    }>
  >([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!user?.id) return;
    setLoadingHistory(true);
    try {
      const list = await attendanceService.getStudentAttendanceHistory(user.id);
      setHistory(list);
    } finally {
      setLoadingHistory(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadHistory();
    }
  }, [user?.id, loadHistory]);

  // Se veio com código na URL, buscar detalhes da sessão
  useEffect(() => {
    const clean = (routeCode || '').trim();
    if (!clean) {
      setSessionPreview(null);
      return;
    }
    setCodeInput(clean);

    if (!user?.id) return;

    setLoadingSession(true);
    setResult(null);
    attendanceService
      .getSessionByCode(clean)
      .then((sess) => {
        setSessionPreview(sess);
      })
      .catch(() => {
        setSessionPreview(null);
      })
      .finally(() => {
        setLoadingSession(false);
      });
  }, [routeCode, user?.id]);

  const handleLookupOrCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = codeInput.trim();
    if (!clean) {
      toast.error('Digite o código de 6 dígitos exibido pelo professor.');
      return;
    }
    if (!user?.id) return;

    setSubmitting(true);
    setResult(null);
    try {
      const res = await attendanceService.checkInByCode(clean, user.id);
      setResult(res);
      if (res.session) {
        setSessionPreview(res.session);
      }
      if (res.success) {
        if (res.alreadyCheckedIn) {
          toast.info(res.message);
        } else {
          toast.success(res.message);
          loadHistory();
        }
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao registrar presença.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  const totalAttendancePoints = history.reduce((acc, item) => acc + item.points_awarded, 0);

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/student')}>
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Voltar ao Painel
          </Button>
          <Link to="/gamification">
            <Badge variant="outline" className="cursor-pointer hover:bg-muted px-3 py-1">
              <Trophy className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
              Gamificação
            </Badge>
          </Link>
        </div>

        {/* Card Principal de Check-in */}
        <Card className="border-emerald-500/30 shadow-sm">
          <CardHeader className="text-center pb-4">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <QrCode className="w-7 h-7" />
            </div>
            <CardTitle className="text-2xl">Chamada Inteligente</CardTitle>
            <CardDescription>
              Confirme sua presença na aula de hoje e ganhe{' '}
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                +20 pontos
              </span>{' '}
              na gamificação.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {!user ? (
              <div className="p-5 rounded-xl bg-muted/50 border text-center space-y-4">
                <AlertCircle className="w-10 h-10 mx-auto text-amber-500" />
                <div className="space-y-1">
                  <p className="font-semibold">Faça login para registrar sua presença</p>
                  <p className="text-sm text-muted-foreground">
                    Precisamos identificar sua conta de aluno para contabilizar a frequência e creditar os +20 pontos.
                  </p>
                </div>
                <Button
                  className="w-full"
                  onClick={() => navigate('/auth')}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Entrar na minha conta
                </Button>
              </div>
            ) : (
              <>
                {/* Preview da sessão quando veio via QR Code */}
                {loadingSession && (
                  <div className="p-4 rounded-lg border text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Buscando dados da chamada...
                  </div>
                )}

                {sessionPreview && !result?.success && (
                  <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        Chamada Localizada
                      </span>
                      <Badge className="bg-emerald-600 text-white">
                        +{sessionPreview.points_reward} pts
                      </Badge>
                    </div>
                    <p className="font-semibold text-base">{sessionPreview.title}</p>
                    {sessionPreview.subject_name && (
                      <p className="text-sm text-muted-foreground">{sessionPreview.subject_name}</p>
                    )}
                    <p className="text-xs text-muted-foreground flex items-center gap-1 pt-1">
                      <Clock className="w-3.5 h-3.5" />
                      {sessionPreview.is_active &&
                      new Date(sessionPreview.expires_at).getTime() > Date.now()
                        ? `Aberta até ${new Date(sessionPreview.expires_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}`
                        : 'Chamada encerrada ou expirada'}
                    </p>
                  </div>
                )}

                {/* Feedback do check-in */}
                {result && (
                  <div
                    className={`p-4 rounded-xl border flex items-start gap-3 ${
                      result.success
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-100'
                        : 'bg-destructive/10 border-destructive/30 text-destructive'
                    }`}
                  >
                    {result.success ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <p className="font-semibold text-sm">{result.message}</p>
                      {result.success && result.pointsAwarded > 0 && (
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-600 text-white">
                          <Sparkles className="w-3.5 h-3.5" />
                          +{result.pointsAwarded} pontos adicionados!
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Formulário de Código */}
                <form onSubmit={handleLookupOrCheckIn} className="space-y-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="attendance-code-input"
                      className="text-sm font-medium block text-center text-muted-foreground"
                    >
                      Código de 6 dígitos da aula
                    </label>
                    <Input
                      id="attendance-code-input"
                      value={codeInput}
                      onChange={(e) => setCodeInput(e.target.value.replace(/\s+/g, ''))}
                      placeholder="000000"
                      maxLength={10}
                      className="text-center font-mono text-3xl tracking-[0.3em] h-14 font-bold"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting || !codeInput.trim()}
                    className="w-full h-12 text-base bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {submitting ? (
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <UserCheck className="w-5 h-5 mr-2" />
                    )}
                    Confirmar Presença (+20 pts)
                  </Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>

        {/* Histórico de Presenças do Aluno */}
        {user && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarCheck className="w-4 h-4 text-emerald-500" />
                    Minhas Presenças Registradas ({history.length})
                  </CardTitle>
                  <CardDescription>
                    Total acumulado por frequência: <strong>{totalAttendancePoints} pts</strong>
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={loadHistory} disabled={loadingHistory}>
                  <RefreshCw className={`w-4 h-4 ${loadingHistory ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Você ainda não registrou presença via chamada inteligente.
                </p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{item.session_title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.subject_name ? `${item.subject_name} • ` : ''}
                          {new Date(item.checked_in_at).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shrink-0">
                        +{item.points_awarded} pts
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
