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
import { PortalNewsItem } from '@/types/portal';
import { Newspaper } from 'lucide-react';

interface PortalNewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: PortalNewsItem) => Promise<void>;
  item: PortalNewsItem | null;
}

export default function PortalNewsModal({
  isOpen,
  onClose,
  onSave,
  item,
}: PortalNewsModalProps) {
  const [formData, setFormData] = useState<Partial<PortalNewsItem>>({
    title: '',
    excerpt: '',
    category: 'Tecnologia',
    read_time: '4 min',
    image_url: '',
    author_name: 'Curso Técnico',
    published_at: new Date().toISOString().split('T')[0],
    is_featured: false,
    is_active: true,
    display_order: 1,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        ...item,
        published_at: item.published_at || new Date().toISOString().split('T')[0],
      });
    } else {
      setFormData({
        title: '',
        excerpt: '',
        category: 'Tecnologia',
        read_time: '4 min',
        image_url: '',
        author_name: 'Curso Técnico',
        published_at: new Date().toISOString().split('T')[0],
        is_featured: false,
        is_active: true,
        display_order: 1,
      });
    }
  }, [item, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim() || !formData.excerpt?.trim()) return;

    setSaving(true);
    try {
      await onSave({
        ...formData,
        title: formData.title.trim(),
        excerpt: formData.excerpt.trim(),
        category: formData.category || 'Tecnologia',
        read_time: formData.read_time || '4 min',
        published_at: formData.published_at || new Date().toISOString().split('T')[0],
        is_featured: !!formData.is_featured,
        is_active: formData.is_active !== false,
        display_order: Number(formData.display_order) || 1,
      } as PortalNewsItem);
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
            <Newspaper className="w-5 h-5" />
            {item ? 'Editar Notícia do Portal' : 'Nova Notícia para o Portal'}
          </DialogTitle>
          <DialogDescription>
            Configure as informações que serão exibidas na seção de notícias do portal público.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-semibold">
              Título da Notícia *
            </Label>
            <Input
              id="title"
              required
              placeholder="Ex: Novos laboratórios de informática inaugurados"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="excerpt" className="text-xs font-semibold">
              Resumo / Chamada *
            </Label>
            <Textarea
              id="excerpt"
              required
              rows={3}
              placeholder="Breve resumo da notícia que aparece nos cards da página inicial..."
              value={formData.excerpt || ''}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-xs font-semibold">
                Categoria
              </Label>
              <Select
                value={formData.category || 'Tecnologia'}
                onValueChange={(val) => setFormData({ ...formData, category: val })}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                  <SelectItem value="Desenvolvimento">Desenvolvimento</SelectItem>
                  <SelectItem value="Segurança">Segurança</SelectItem>
                  <SelectItem value="Institucional">Institucional</SelectItem>
                  <SelectItem value="Eventos">Eventos</SelectItem>
                  <SelectItem value="Inovação">Inovação</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="read_time" className="text-xs font-semibold">
                Tempo de Leitura
              </Label>
              <Input
                id="read_time"
                placeholder="Ex: 4 min"
                value={formData.read_time || ''}
                onChange={(e) => setFormData({ ...formData, read_time: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="published_at" className="text-xs font-semibold">
                Data de Publicação
              </Label>
              <Input
                id="published_at"
                type="date"
                value={formData.published_at || ''}
                onChange={(e) => setFormData({ ...formData, published_at: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="author_name" className="text-xs font-semibold">
                Autor / Origem
              </Label>
              <Input
                id="author_name"
                placeholder="Ex: Curso Técnico em Informática"
                value={formData.author_name || ''}
                onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="image_url" className="text-xs font-semibold">
              URL da Imagem de Capa (Opcional)
            </Label>
            <Input
              id="image_url"
              placeholder="https://exemplo.com/imagem.jpg"
              value={formData.image_url || ''}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/40">
            <div>
              <p className="text-sm font-medium">Publicada e Visível</p>
              <p className="text-xs text-muted-foreground">Exibir esta notícia para os visitantes do portal</p>
            </div>
            <Switch
              checked={formData.is_active !== false}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/40">
            <div>
              <p className="text-sm font-medium">Destacar no Topo</p>
              <p className="text-xs text-muted-foreground">Dar maior visibilidade a esta notícia</p>
            </div>
            <Switch
              checked={!!formData.is_featured}
              onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : item ? 'Atualizar Notícia' : 'Publicar Notícia'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
