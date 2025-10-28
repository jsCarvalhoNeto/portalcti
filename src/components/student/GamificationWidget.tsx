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
  icon_url?: string;
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
        <div className="flex items-center gap-4">
          {/* Left: total and progress */}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl md:text-4xl font-extrabold">{loading ? '...' : totalPoints}</p>
                <p className="text-sm text-muted-foreground">Pontos acumulados</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground mb-1">Progresso: {progress}%</div>
                <div className="w-36 bg-muted rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-600 to-blue-500 h-2" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <Button size="sm" onClick={async () => {
                if (!user) return;
                setLoading(true);
                try {
                  const data = await gamificationService.getStudentGamification(user.id);
                  setHistory(data?.history || []);
                  setTotalPoints(Number(data?.total?.total_points || 0));
                  setBadges(data?.badges || []);
                } catch (e) {
                  console.error(e);
                } finally { setLoading(false); }
              }}>Atualizar</Button>
              <Button variant="ghost" size="sm" onClick={() => window.location.href = '/gamification'}>Abrir painel</Button>
            </div>
          </div>

          {/* Right: compact history + medals */}
          <div className="w-48">
            <div className="text-xs font-medium mb-2">Últimos lançamentos</div>
            <div className="flex flex-col gap-2">
              {history && history.length > 0 ? history.slice(0,3).map(h => {
                // Função para formatar a descrição de forma compacta
                const getCompactDescription = (source: string, reason: string) => {
                  if (reason) {
                    // Extrair apenas a parte principal da reason
                    if (reason.includes('Jogo da Memória')) return 'Jogo da Memória';
                    if (reason.includes('HTML/CSS')) return 'Atividade HTML/CSS';
                    if (reason.includes('Submissão de atividade')) return 'Submissão';
                    if (reason.includes('Acesso')) return 'Acesso';
                    return reason.split(' (')[0]; // Remove a parte dos pontos
                  }
                  
                  const sourceMap: Record<string, string> = {
                    'game': 'Jogo',
                    'submission': 'Submissão', 
                    'access': 'Acesso',
                    'adjustment': 'Ajuste'
                  };
                  
                  return sourceMap[source] || source;
                };

                return (
                  <div key={h.id || `${h.created_at}-${h.points}`} className="flex items-center justify-between text-sm">
                    <div className="text-muted-foreground truncate flex-1 mr-2" title={h.reason || `${h.source}${h.subject_name ? ` - ${h.subject_name}` : ''}`}>
                      {getCompactDescription(h.source, h.reason)}
                    </div>
                    <div className={`font-semibold ${h.points >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                      {h.points >= 0 ? `+${h.points}` : h.points}
                    </div>
                  </div>
                );
              }) : (
                <div className="text-xs text-muted-foreground">Sem lançamentos</div>
              )}
            </div>

            <div className="mt-3">
              <div className="text-xs font-medium mb-2">Medalhas</div>
              <div className="flex gap-2 flex-wrap">
                {badges && badges.length > 0 ? badges.slice(0,3).map(b => (
                  <div key={b.id || b.key} className="w-9 h-9 rounded-md bg-yellow-50 flex items-center justify-center text-lg">{b.icon_url || b.icon ? <img src={b.icon_url ? b.icon_url : `${import.meta.env.VITE_API_URL.replace('/api','')}/uploads/${b.icon}`} alt={b.name} className="w-6 h-6" /> : '🏅'}</div>
                )) : (
                  <div className="text-xs text-muted-foreground">—</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
