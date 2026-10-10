import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PortalEventItem, PortalEventStatus } from '@/types/portal';
import { Calendar } from 'lucide-react';

interface PortalEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: PortalEventItem) => Promise<void>;
  item: PortalEventItem | null;
}

export default function PortalEventModal({
  isOpen,
  onClose,
  onSave,
  item,
}: PortalEventModalProps) {
  const [formData, setFormData] = useState<Partial<PortalEventItem>>({
    title: '',
    subtitle: '',
    description: '',
    start_date: '',
    end_date: '',
    location: 'EEEP Balbina Viana Arraes',
    attendees_count: 0,
    event_type: 'Evento',
    status: 'registration-open',
    registration_url: '/eventos/inscricao',
    is_main_event: false,
    is_active: true,
    display_order: 1,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData(item);
    } else {
      setFormData({
        title: '',
        subtitle: '',
        description: '',
        start_date: '',
        end_date: '',
        location: 'EEEP Balbina Viana Arraes',
        attendees_count: 0,
        event_type: 'Evento',
        status: 'registration-open',
        registration_url: '/eventos/inscricao',
        is_main_event: false,
        is_active: true,
        display_order: 1,
      });
    }
  }, [item, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim() || !formData.description?.trim()) return;

    setSaving(true);
    try {
      await onSave({
        ...formData,
        title: formData.title.trim(),
        subtitle: formData.subtitle?.trim() || null,
        description: formData.description.trim(),
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        location: formData.location?.trim() || 'EEEP Balbina Viana Arraes',
        event_type: formData.event_type || 'Evento',
        status: (formData.status || 'registration-open') as PortalEventStatus,
        registration_url: formData.registration_url?.trim() || '/eventos/inscricao',
        is_main_event: !!formData.is_main_event,
        is_active: formData.is_active !== false,
        display_order: Number(formData.display_order) || 1,
      } as PortalEventItem);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Calendar className="w-5 h-5" />
            {item ? 'Editar Evento do Portal' : 'Novo Evento / Atividade'}
          </DialogTitle>
          <DialogDescription>
            Configure eventos acadêmicos, workshops e competições em destaque na página inicial.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="event-title" className="text-xs font-semibold">
              Nome do Evento *
            </Label>
            <Input
              id="event-title"
              required
              placeholder="Ex: Saberes em Conexão"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="event-subtitle" className="text-xs font-semibold">
              Subtítulo / Tema
            </Label>
            <Input
              id="event-subtitle"
              placeholder="Ex: Escola, Ciência e Sociedade 2025"
              value={formData.subtitle || ''}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="event-desc" className="text-xs font-semibold">
              Descrição do Evento *
            </Label>
            <Textarea
              id="event-desc"
              required
              rows={3}
              placeholder="Descreva as atrações, palestras e objetivos do evento..."
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="event-type" className="text-xs font-semibold">
                Tipo do Evento
              </Label>
              <Select
                value={formData.event_type || 'Evento'}
                onValueChange={(val) => setFormData({ ...formData, event_type: val })}
              >
                <SelectTrigger id="event-type">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Evento">Evento Geral</SelectItem>
                  <SelectItem value="Workshop">Workshop Prático</SelectItem>
                  <SelectItem value="Palestra">Palestra</SelectItem>
                  <SelectItem value="Competição">Competição / Maratona</SelectItem>
                  <SelectItem value="Feira de Ciências">Feira de Ciências</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="event-status" className="text-xs font-semibold">
                Status das Inscrições
              </Label>
              <Select
                value={formData.status || 'registration-open'}
                onValueChange={(val) => setFormData({ ...formData, status: val as PortalEventStatus })}
              >
                <SelectTrigger id="event-status">
                  <SelectValue placeholder="Status da inscrição" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="registration-open">Inscrições Abertas</SelectItem>
                  <SelectItem value="registration-closed">Inscrições Encerradas</SelectItem>
                  <SelectItem value="upcoming">Em Breve</SelectItem>
                  <SelectItem value="finished">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="start_date" className="text-xs font-semibold">
                Data Inicial
              </Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date || ''}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="end_date" className="text-xs font-semibold">
                Data Final
              </Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date || ''}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="location" className="text-xs font-semibold">
                Local de Realização
              </Label>
              <Input
                id="location"
                placeholder="Ex: EEEP Balbina Viana Arraes"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="registration_url" className="text-xs font-semibold">
                Link de Inscrição / Detalhes
              </Label>
              <Input
                id="registration_url"
                placeholder="/eventos/inscricao ou https://..."
                value={formData.registration_url || ''}
                onChange={(e) => setFormData({ ...formData, registration_url: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border bg-amber-500/10 border-amber-500/30">
            <div>
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                Evento Principal em Destaque na Home
              </p>
              <p className="text-xs text-muted-foreground">
                Exibir este evento no painel central com contagem regressiva e botão de inscrição direta
              </p>
            </div>
            <Switch
              checked={!!formData.is_main_event}
              onCheckedChange={(checked) => setFormData({ ...formData, is_main_event: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/40">
            <div>
              <p className="text-sm font-medium">Evento Ativo e Visível</p>
              <p className="text-xs text-muted-foreground">Exibir na programação pública do portal</p>
            </div>
            <Switch
              checked={formData.is_active !== false}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : item ? 'Atualizar Evento' : 'Salvar Evento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
