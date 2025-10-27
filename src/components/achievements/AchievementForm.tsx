import { useState, FormEvent } from 'react';
import { Achievement, AchievementCreatePayload } from '../../models/achievement';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

type Props = {
  initial?: Achievement;
  saving?: boolean;
  onCancel?: () => void;
  onSave: (payload: AchievementCreatePayload) => Promise<void> | void;
};

export default function AchievementForm({ initial, saving, onCancel, onSave }: Props) {
  const [title, setTitle] = useState(initial?.title || '');
  const [key, setKey] = useState(initial?.key || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [points, setPoints] = useState<string>(String(initial?.points ?? 0));
  const [minPoints, setMinPoints] = useState<string>(String(initial?.minPoints ?? ''));
  const [maxPoints, setMaxPoints] = useState<string>(String(initial?.maxPoints ?? ''));
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl || '');
  const [imageBroken, setImageBroken] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validateAndSave(e?: FormEvent) {
    e?.preventDefault();
    setError(null);
    const pts = Number(points);
    if (!title.trim()) return setError('Título é obrigatório');
    if (Number.isNaN(pts)) return setError('Pontos inválidos');
    const payload: AchievementCreatePayload = {
      key: key || undefined,
      title: title.trim(),
      description: description.trim() || undefined,
      points: pts,
      minPoints: minPoints ? Number(minPoints) : undefined,
      maxPoints: maxPoints ? Number(maxPoints) : undefined,
      imageUrl: imageUrl ? imageUrl.trim() : undefined,
    };
    if (payload.minPoints !== undefined && payload.maxPoints !== undefined && payload.minPoints > payload.maxPoints) {
      return setError('minPoints não pode ser maior que maxPoints');
    }
    onSave(payload);
  }

  return (
    <form onSubmit={validateAndSave} className="space-y-4 p-4 border rounded bg-card">
      {error && <div className="text-sm text-destructive">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Título</Label>
          <Input value={title} onChange={(e:any)=>setTitle(e.target.value)} />
        </div>
        <div>
          <Label>Key (opcional)</Label>
          <Input value={key} onChange={(e:any)=>setKey(e.target.value)} />
        </div>
      </div>

      <div>
        <Label>Descrição</Label>
        <Textarea value={description} onChange={(e:any)=>setDescription(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Pontos</Label>
          <Input value={points} onChange={(e:any)=>setPoints(e.target.value)} type="number" />
        </div>
        <div>
          <Label>minPoints</Label>
          <Input value={minPoints} onChange={(e:any)=>setMinPoints(e.target.value)} type="number" />
        </div>
        <div>
          <Label>maxPoints</Label>
          <Input value={maxPoints} onChange={(e:any)=>setMaxPoints(e.target.value)} type="number" />
        </div>
      </div>

      <div>
        <Label>Imagem (URL)</Label>
        <Input value={imageUrl} onChange={(e:any)=>{ setImageUrl(e.target.value); setImageBroken(false); }} />

        {imageUrl ? (
          <div className="mt-2">
            <img
              src={imageUrl}
              alt="preview"
              className="w-24 h-24 object-contain rounded border bg-muted"
              onError={() => setImageBroken(true)}
              onLoad={() => setImageBroken(false)}
            />
            {imageBroken && <div className="text-xs text-destructive mt-1">Pré-visualização indisponível (URL inválida ou não acessível)</div>}
          </div>
        ) : (
          <div className="mt-2 text-sm text-muted-foreground">Cole a URL de uma imagem para pré-visualizar.</div>
        )}
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </form>
  );
}
