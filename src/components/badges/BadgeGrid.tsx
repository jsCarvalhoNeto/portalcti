import { useState } from 'react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Share2 } from 'lucide-react';

interface Badge {
  id?: number;
  key?: string;
  name?: string;
  description?: string;
  icon?: string;
  icon_url?: string;
  threshold_points?: number;
  awarded_id?: number;
}

interface Props {
  badges?: Badge[];
  cols?: number;
  compact?: boolean; // smaller items
  subjectName?: string | null;
  subjectId?: string | number | null;
}

export default function BadgeGrid({ badges = [], cols = 3, compact = false, subjectName = null, subjectId = null }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Badge | null>(null);

  const handleOpen = (b: Badge) => {
    setSelected(b);
    setOpen(true);
  };

  const handleShare = async () => {
    if (!selected) return;
  const subjectPart = subjectName ? ` na disciplina ${subjectName}` : '';
  const baseUrl = window.location.origin;
  const subjectUrl = subjectId ? `${baseUrl}/disciplinas/${subjectId}` : baseUrl;
  const text = `Conquistei '${selected.name}'${subjectPart} — ${selected.threshold_points || 0} pts. Veja: ${subjectUrl}`;
  const url = subjectUrl;
    try {
      if ((navigator as any).share) {
        await (navigator as any).share({ title: selected.name || 'Conquista', text, url });
        toast({ title: 'Compartilhado', description: 'Conquista compartilhada com sucesso.' });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${text} ${url}`);
        toast({ title: 'Link copiado', description: 'Texto copiado para a área de transferência.' });
      } else {
        toast({ title: 'Ação indisponível', description: 'Não foi possível compartilhar neste dispositivo.' });
      }
    } catch (err) {
      console.error('share error', err);
      toast({ title: 'Erro', description: 'Não foi possível compartilhar.' });
    }
  };

  const getColsClass = (c: number) => {
    switch (c) {
      case 2:
        return 'grid-cols-2 sm:grid-cols-2 md:grid-cols-2';
      case 3:
        return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-3';
      case 4:
        return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4';
      case 5:
        return 'grid-cols-2 sm:grid-cols-4 md:grid-cols-5';
      case 6:
        return 'grid-cols-2 sm:grid-cols-4 md:grid-cols-6';
      default:
        return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-3';
    }
  };
  const gridColsClass = getColsClass(cols);

  return (
    <div>
      <div className={`grid ${gridColsClass} gap-3`}> 
        {badges.map((b) => (
          <div key={b.awarded_id || b.id || b.key} className="flex items-center justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleOpen(b)}
                  className={`w-full h-full p-2 rounded-lg border hover:shadow-md transition-transform transform hover:-translate-y-1 flex items-center justify-center bg-card`}
                  aria-label={b.name}
                >
                  {b.icon_url || b.icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.icon_url ? b.icon_url : `${import.meta.env.VITE_API_URL.replace('/api','')}/uploads/${b.icon}`} alt={b.name} className={compact ? 'w-8 h-8 object-contain' : 'w-12 h-12 object-contain'} />
                  ) : (
                    <span className={compact ? 'text-lg' : 'text-2xl'}>🏅</span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="max-w-xs">
                  <div className="font-medium">{b.name}</div>
                  {b.description && <div className="text-xs text-muted-foreground">{b.description}</div>}
                  {b.threshold_points != null && <div className="text-xs mt-1">{b.threshold_points} pts</div>}
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
            <DialogDescription>{selected?.description}</DialogDescription>
            {subjectName && <div className="text-xs text-muted-foreground mt-1">Disciplina: {subjectName}</div>}
          </DialogHeader>

          <div className="flex items-center gap-4 mt-4">
            <div className="w-24 h-24 flex items-center justify-center rounded-md bg-muted/50 transition-transform duration-300">
              {selected?.icon_url || selected?.icon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selected?.icon_url ? selected?.icon_url : `${import.meta.env.VITE_API_URL.replace('/api','')}/uploads/${selected?.icon}`} alt={selected?.name} className="w-16 h-16 object-contain transition-transform duration-300 hover:scale-110" />
              ) : (
                <span className="text-4xl">🏅</span>
              )}
            </div>
            <div>
              {selected?.threshold_points != null && <div className="font-medium">Necessário: {selected.threshold_points} pts</div>}
              <div className="text-sm text-muted-foreground mt-1">{selected?.description}</div>
            </div>
          </div>

          <DialogFooter className="mt-6 flex items-center justify-between">
            <div>
              <button onClick={handleShare} className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-secondary text-secondary-foreground hover:opacity-90 transition">
                <Share2 className="w-4 h-4" />
                Compartilhar
              </button>
            </div>
            <DialogClose className="px-4 py-2 rounded bg-primary text-white">Fechar</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
