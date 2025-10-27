import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import AchievementList from '@/components/achievements/AchievementList';

export default function Achievements() {
  const { user } = useAuth();

  useEffect(() => {
    // no-op for now
  }, []);

  if (!user) return <div className="p-6">Faça login para ver as conquistas.</div>;

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Conquistas</h2>
            <p className="text-muted-foreground">Visualize todas as conquistas disponíveis no jogo.</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Conquistas</CardTitle>
              <CardDescription>Você pode visualizar as conquistas, mas não editar.</CardDescription>
            </CardHeader>
            <CardContent>
              <AchievementList showActions={false} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
