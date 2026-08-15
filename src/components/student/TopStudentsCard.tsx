import { useEffect, useState } from 'react';
import * as gamificationService from '@/services/gamificationService';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';

export default function TopStudentsCard({ limit = 10 }: { limit?: number }) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await gamificationService.getTopStudents(limit);
        if (!mounted) return;
        if (!data) {
          setRows(null);
          setError('Dados de leaderboard não disponíveis. Verifique se o endpoint /gamification/top existe no backend.');
          return;
        }
        // expect an array in data.rows or data
        const list = Array.isArray(data) ? data : (data.rows || data.items || []);
        setRows(list.slice(0, limit));
        setError(null);
      } catch (e) {
        if (!mounted) return;
        setError('Erro ao carregar leaderboard');
        setRows(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetch();
    return () => { mounted = false; };
  }, [limit]);

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Top {limit} Alunos</CardTitle>
        <CardDescription>Alunos com maior pontuação e sua conquista atual</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">Carregando...</div>
        ) : error ? (
          <div className="text-sm text-muted-foreground">{error}</div>
        ) : (!rows || rows.length === 0) ? (
          <div className="text-sm text-muted-foreground">Nenhum dado de leaderboard disponível.</div>
        ) : (
          <div className="space-y-3">
            {rows.map((r: any, idx: number) => (
              <div key={r.user_id || r.id || idx} className="flex items-center justify-between p-2 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-medium">{idx+1}</div>
                  <div className="flex items-center gap-3">
                    {r.current_badge && (r.current_badge.icon_url || r.current_badge.icon) ? (
                      <img src={r.current_badge.icon_url || r.current_badge.icon} alt={r.current_badge.name || 'insignia'} className="w-8 h-8 rounded-sm object-contain" />
                    ) : (
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm">🏅</div>
                    )}
                    <div>
                      <div className="font-medium">{r.full_name || r.name || r.display_name || r.email || `Aluno ${r.user_id || r.id || idx+1}`}</div>
                      <div className="text-xs text-muted-foreground">{r.current_badge?.name || r.current_achievement || ''}</div>
                    </div>
                  </div>
                </div>
                <div className="text-sm font-semibold">{r.total_points ?? r.points ?? r.score ?? '-' } pts</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
