import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import * as gamificationService from '@/services/gamificationService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Gamification() {
  const { user, isStudent } = useAuth();
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState<number>(0);
  const [history, setHistory] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const data = await gamificationService.getStudentGamification(user.id);
        setTotal(Number(data?.total?.total_points || 0));
        setHistory(data?.history || []);
        setBadges(data?.badges || []);
      } catch (e) {
        console.error('Erro ao buscar dados de gamificação:', e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  // Atualizar quando houver evento global de gamificação
  useEffect(() => {
    const handler = async () => {
      if (!user) return;
      try {
        const data = await gamificationService.getStudentGamification(user.id);
        setTotal(Number(data?.total?.total_points || 0));
        setHistory(data?.history || []);
        setBadges(data?.badges || []);
      } catch (e) {
        console.error('Erro ao atualizar gamification via evento:', e);
      }
    };
    (window as any).addEventListener && (window as any).addEventListener('gamification:update', handler);
    return () => { (window as any).removeEventListener && (window as any).removeEventListener('gamification:update', handler); };
  }, [user]);

  if (!user || !isStudent) return <div className="p-6">Acesse como estudante para ver seu painel de gamificação.</div>;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Gamificação</CardTitle>
            <CardDescription>Resumo dos seus pontos e conquistas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold">{loading ? '...' : total}</p>
                <p className="text-sm text-muted-foreground">Pontos totais</p>
              </div>
              <div>
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
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de pontos</CardTitle>
            <CardDescription>Últimos lançamentos de pontos</CardDescription>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="text-sm text-muted-foreground">Nenhum registro encontrado.</div>
            ) : (
              <div className="space-y-2">
                {history.map((h:any) => (
                  <div key={h.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium">{h.source}</div>
                      <div className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString()}</div>
                    </div>
                    <div className="font-semibold">+{h.points}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Medalhas</CardTitle>
            <CardDescription>Conquistas adquiridas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap">
              {badges.length === 0 ? (
                <div className="text-sm text-muted-foreground">Nenhuma medalha ainda.</div>
              ) : (
                badges.map((b:any) => (
                  <div key={b.awarded_id || b.id} className="flex items-center gap-2 px-3 py-2 border rounded">
                    <div className="text-sm font-medium">{b.name}</div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
