import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import * as gamificationService from '@/services/gamificationService';
import { Button } from '@/components/ui/button';

interface BadgeItem {
  id?: number;
  key?: string;
  name?: string;
  description?: string;
  threshold_points?: number;
  icon?: string;
}

export default function GamificationWidget() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const data = await gamificationService.getStudentGamification(user.id);
        if (data) {
          setTotalPoints(Number(data.total?.total_points || 0));
          setHistory(data.history || []);
          setBadges(data.badges || []);
        }
      } catch (e) {
        console.error('Erro ao buscar dados de gamification:', e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  // Recarregar quando houver atualização global de gamificação
  useEffect(() => {
    const handler = async () => {
      try {
        if (!user) return;
        const data = await gamificationService.getStudentGamification(user.id);
        setHistory(data?.history || []);
        setTotalPoints(Number(data?.total?.total_points || 0));
        setBadges(data?.badges || []);
      } catch (e) {
        console.error('Erro ao atualizar gamification via evento:', e);
      }
    };

    (window as any).addEventListener && (window as any).addEventListener('gamification:update', handler);
    return () => { (window as any).removeEventListener && (window as any).removeEventListener('gamification:update', handler); };
  }, [user]);

  // Calcular próximo badge simples (pegar menor threshold > totalPoints)
  const nextBadge = badges && badges.length > 0 ? badges.slice().sort((a,b)=> (a.threshold_points||0)-(b.threshold_points||0)).find(b=> (b.threshold_points||0) > totalPoints) : null;
  const nextThreshold = nextBadge?.threshold_points || Math.ceil((totalPoints + 100)/100)*100;
  const progress = nextThreshold ? Math.min(100, Math.round((totalPoints / nextThreshold) * 100)) : 0;

  return (
    <Card className="hover:shadow-glow transition-all duration-300">
      <CardHeader>
        <CardTitle>Gamificação</CardTitle>
        <CardDescription>Seus pontos, conquistas e evolução</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold">{loading ? '...' : totalPoints}</p>
            <p className="text-sm text-muted-foreground">Pontos acumulados</p>
          </div>
          <div className="w-48">
            <div className="text-xs text-muted-foreground mb-1">Progresso para: {nextBadge ? nextBadge.name : `${nextThreshold} pts`}</div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div className="bg-primary h-2" style={{ width: `${progress}%` }} />
            </div>
            <div className="text-xs text-muted-foreground mt-1">{progress}%</div>
          </div>
        </div>

        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Troféus / Medalhas</h4>
          <div className="flex gap-2 flex-wrap">
            {badges && badges.length > 0 ? badges.map((b) => (
              <div key={b.id || b.key} className="flex items-center gap-2 px-2 py-1 border rounded-md">
                <img src={b.icon ? `${import.meta.env.VITE_API_URL.replace('/api','')}/uploads/${b.icon}` : ''} alt="icon" className="w-6 h-6 object-contain" />
                <div className="text-sm">{b.name}</div>
              </div>
            )) : (
              <div className="text-sm text-muted-foreground">Nenhuma medalha conquistada ainda</div>
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="ghost" size="sm" onClick={async () => {
            try {
              if (!user) return;
              const data = await gamificationService.getStudentGamification(user.id);
              setHistory(data?.history || []);
              setTotalPoints(Number(data?.total?.total_points || 0));
              setBadges(data?.badges || []);
            } catch (e) {
              console.error(e);
            }
          }}>Ver histórico</Button>
        </div>
      </CardContent>
    </Card>
  );
}
