import { useEffect, useState } from 'react';
import { Achievement } from '../../models/achievement';
import * as service from '../../services/achievementsService';
import AchievementItem from './AchievementItem';
import AchievementForm from './AchievementForm';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

type Props = {
  /** When false, hide add/edit/delete actions and render list read-only */
  showActions?: boolean;
}

export default function AchievementList({ showActions = true }: Props) {
  const [items, setItems] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await service.getAchievements();
      if (!Array.isArray(res)) return;
      setItems(res);
    } finally { setLoading(false); }
  }

  useEffect(() => { 
    load();
    const h = () => load();
    try { (window as any).addEventListener('gamification:update', h); } catch (e) {}
    return () => { try { (window as any).removeEventListener('gamification:update', h); } catch (e) {} };
  }, []);

  async function handleCreate(payload: any) {
    setSaving(true);
    try {
      const res = await service.createAchievement(payload);
      if (res && !(res as any).error) {
        toast({ title: 'Sucesso', description: 'Conquista criada com sucesso!' });
        await load();
        setCreating(false);
      } else {
        toast({ title: 'Erro', description: 'Não foi possível salvar a conquista.', variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message || 'Erro ao criar conquista', variant: 'destructive' });
    } finally { setSaving(false); }
  }

  async function handleUpdate(id: string | number, payload: any) {
    setSaving(true);
    try { 
      const res = await service.updateAchievement(id, payload);
      if (res && !(res as any).error) {
        toast({ title: 'Sucesso', description: 'Conquista atualizada com sucesso!' });
        await load();
      } else {
        toast({ title: 'Erro', description: 'Não foi possível atualizar a conquista.', variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message || 'Erro ao atualizar conquista', variant: 'destructive' });
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string | number) {
    try { 
      const res = await service.deleteAchievement(id);
      if (res && !(res as any).error) {
        toast({ title: 'Sucesso', description: 'Conquista removida.' });
        await load();
      } else {
        toast({ title: 'Erro', description: 'Não foi possível excluir a conquista.', variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message || 'Erro ao deletar conquista', variant: 'destructive' });
    }
  }


  return (
    <div className="space-y-4">
      <Card className="bg-card border">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Conquistas do Jogo</CardTitle>
          {showActions && (
            <div>
              <Button variant="outline" onClick={() => setCreating((c) => !c)}>{creating ? 'Fechar' : 'Adicionar Conquista'}</Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {showActions && creating && (
            <div className="mb-4">
              <AchievementForm onSave={handleCreate} onCancel={() => setCreating(false)} saving={saving} />
            </div>
          )}

          {loading ? <div>Carregando...</div> : (
            <div className="grid grid-cols-1 gap-3">
              {items.length === 0 ? <div className="text-muted-foreground">Nenhuma conquista encontrada.</div> : items.map((a) => (
                <AchievementItem
                  key={String(a.id ?? a.key ?? a.title)}
                  achievement={a}
                  onUpdate={showActions ? handleUpdate : undefined}
                  onDelete={showActions ? handleDelete : undefined}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
