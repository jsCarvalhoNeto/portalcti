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
import { PortalProjectItem } from '@/types/portal';
import { FolderGit2 } from 'lucide-react';

interface PortalProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: PortalProjectItem) => Promise<void>;
  item: PortalProjectItem | null;
}

export default function PortalProjectModal({
  isOpen,
  onClose,
  onSave,
  item,
}: PortalProjectModalProps) {
  const [formData, setFormData] = useState<Partial<PortalProjectItem>>({
    title: '',
    description: '',
    category: 'Web',
    technologies: [],
    author_name: 'Turma do Curso Técnico',
    repo_url: '',
    demo_url: '',
    image_url: '',
    is_featured: true,
    is_active: true,
    display_order: 1,
  });
  const [techString, setTechString] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData(item);
      setTechString(Array.isArray(item.technologies) ? item.technologies.join(', ') : '');
    } else {
      setFormData({
        title: '',
        description: '',
        category: 'Web',
        technologies: [],
        author_name: 'Turma do Curso Técnico',
        repo_url: '',
        demo_url: '',
        image_url: '',
        is_featured: true,
        is_active: true,
        display_order: 1,
      });
      setTechString('React, TypeScript, Tailwind');
    }
  }, [item, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim() || !formData.description?.trim()) return;

    setSaving(true);
    try {
      const parsedTechs = techString
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      await onSave({
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category || 'Web',
        technologies: parsedTechs.length > 0 ? parsedTechs : ['Tecnologia'],
        author_name: formData.author_name?.trim() || 'Curso Técnico',
        repo_url: formData.repo_url?.trim() || null,
        demo_url: formData.demo_url?.trim() || null,
        image_url: formData.image_url?.trim() || null,
        is_featured: !!formData.is_featured,
        is_active: formData.is_active !== false,
        display_order: Number(formData.display_order) || 1,
      } as PortalProjectItem);
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
            <FolderGit2 className="w-5 h-5" />
            {item ? 'Editar Projeto do Portal' : 'Novo Projeto para Vitrine'}
          </DialogTitle>
          <DialogDescription>
            Cadastre projetos de destaque desenvolvidos por estudantes ou turmas do curso técnico.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="project-title" className="text-xs font-semibold">
              Título do Projeto *
            </Label>
            <Input
              id="project-title"
              required
              placeholder="Ex: Sistema de Gestão Escolar Inteligente"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="project-desc" className="text-xs font-semibold">
              Descrição do Projeto *
            </Label>
            <Textarea
              id="project-desc"
              required
              rows={3}
              placeholder="Descreva a finalidade, impactos e recursos do projeto..."
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="project-category" className="text-xs font-semibold">
                Área / Categoria
              </Label>
              <Select
                value={formData.category || 'Web'}
                onValueChange={(val) => setFormData({ ...formData, category: val })}
              >
                <SelectTrigger id="project-category">
                  <SelectValue placeholder="Selecione a área" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Web">Web & Frontend</SelectItem>
                  <SelectItem value="Mobile">Mobile</SelectItem>
                  <SelectItem value="Games">Jogos Digitais</SelectItem>
                  <SelectItem value="Robótica / IoT">Robótica / IoT</SelectItem>
                  <SelectItem value="Redes">Redes & Infraestrutura</SelectItem>
                  <SelectItem value="Dados / IA">Dados & IA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="author_name" className="text-xs font-semibold">
                Autor / Turma Responsável
              </Label>
              <Input
                id="author_name"
                placeholder="Ex: Turma do 3º Ano Informática"
                value={formData.author_name || ''}
                onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="technologies" className="text-xs font-semibold">
              Tecnologias Utilizadas (separadas por vírgula)
            </Label>
            <Input
              id="technologies"
              placeholder="Ex: React, TypeScript, Node.js, PostgreSQL"
              value={techString}
              onChange={(e) => setTechString(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="repo_url" className="text-xs font-semibold">
                Link do Repositório (GitHub)
              </Label>
              <Input
                id="repo_url"
                placeholder="https://github.com/..."
                value={formData.repo_url || ''}
                onChange={(e) => setFormData({ ...formData, repo_url: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="demo_url" className="text-xs font-semibold">
                Link de Demonstração / Site
              </Label>
              <Input
                id="demo_url"
                placeholder="https://meu-projeto.tech"
                value={formData.demo_url || ''}
                onChange={(e) => setFormData({ ...formData, demo_url: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="project-image" className="text-xs font-semibold">
              URL da Imagem / Captura (Opcional)
            </Label>
            <Input
              id="project-image"
              placeholder="https://exemplo.com/preview.png"
              value={formData.image_url || ''}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/40">
            <div>
              <p className="text-sm font-medium">Projeto Ativo e Visível</p>
              <p className="text-xs text-muted-foreground">Exibir este projeto na vitrine pública do portal</p>
            </div>
            <Switch
              checked={formData.is_active !== false}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/40">
            <div>
              <p className="text-sm font-medium">Destaque Principal</p>
              <p className="text-xs text-muted-foreground">Exibir no topo com badge de projeto em destaque</p>
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
              {saving ? 'Salvando...' : item ? 'Atualizar Projeto' : 'Salvar Projeto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
