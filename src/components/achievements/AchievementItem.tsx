import { useState } from 'react';
import { Achievement } from '../../models/achievement';
import AchievementForm from './AchievementForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';

type Props = {
  achievement: Achievement;
  onUpdate?: (id: string | number, payload: Partial<Achievement>) => Promise<void> | void;
  onDelete?: (id: string | number) => Promise<void> | void;
};

export default function AchievementItem({ achievement, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  async function handleSave(payload: any) {
    if (!onUpdate) return;
    await onUpdate(achievement.id as string | number, payload);
    setEditing(false);
  }

  async function handleDelete() {
    if (!onDelete) return;
    // handled by confirm dialog
    setLoadingDelete(true);
    try { await onDelete(achievement.id as string | number); } finally { setLoadingDelete(false); setShowDelete(false); }
  }

  const [showDelete, setShowDelete] = useState(false);

  if (editing) {
    return <AchievementForm initial={achievement} onSave={handleSave} onCancel={() => setEditing(false)} saving={false} />;
  }

  return (
    <>
    <Card className="flex items-center gap-4 p-4">
  <CardHeader className="flex flex-row items-center gap-4 p-0">
        <Avatar className="w-14 h-14">
          {achievement.imageUrl ? (
            <AvatarImage src={achievement.imageUrl} alt={achievement.title} />
          ) : (
            <AvatarFallback>{(achievement.title || '?').slice(0,2).toUpperCase()}</AvatarFallback>
          )}
        </Avatar>
        <div>
          <CardTitle className="text-base">{achievement.title}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">{achievement.description}</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="ml-auto flex items-center gap-4 p-0">
        <div className="text-sm text-muted-foreground">Pontos: <span className="font-medium text-foreground">{achievement.points}</span></div>
        {(achievement.minPoints !== undefined || achievement.maxPoints !== undefined) && (
          <div className="text-sm text-muted-foreground">Limites: {achievement.minPoints ?? '-'} — {achievement.maxPoints ?? '-'}</div>
        )}
        <div className="flex items-center gap-2 ml-4">
          {onUpdate && <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>Editar</Button>}
          {onDelete && <Button size="sm" variant="destructive" onClick={() => setShowDelete(true)} disabled={loadingDelete}>{loadingDelete ? 'Apagando...' : 'Apagar'}</Button>}
        </div>
      </CardContent>
  </Card>

  <Dialog open={showDelete} onOpenChange={setShowDelete}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar exclusão</DialogTitle>
          <DialogDescription>Tem certeza que deseja apagar a conquista "{achievement.title}"? Esta ação não pode ser desfeita.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <div className="flex items-center gap-2 justify-end">
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete} disabled={loadingDelete}>{loadingDelete ? 'Apagando...' : 'Confirmar exclusão'}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
