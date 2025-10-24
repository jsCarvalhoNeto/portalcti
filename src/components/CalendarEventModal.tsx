import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar, Clock, BookOpen, Users, Image as ImageIcon } from 'lucide-react';
import { CalendarEvent } from '@/services/teacherDashboardService';

interface CalendarEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: CalendarEvent | null;
  onSave: (event: Omit<CalendarEvent, 'id'>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  subjects: Array<{ id: number; name: string }>;
 loading: boolean;
}

export default function CalendarEventModal({ 
  open, 
  onOpenChange, 
  event, 
  onSave, 
  onDelete, 
  subjects, 
  loading 
}: CalendarEventModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    type: 'class' as 'class' | 'exam' | 'deadline' | 'meeting',
    subject_id: '',
    description: '',
    image: null as File | null
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        date: event.date || '',
        time: event.time || '',
        type: event.type || 'class',
        subject_id: event.subject_id?.toString() || '',
        description: event.description || '',
        image: null
      });
      setImagePreview(null);
    } else {
      setFormData({
        title: '',
        date: '',
        time: '',
        type: 'class',
        subject_id: '',
        description: '',
        image: null
      });
      setImagePreview(null);
      setErrors({});
    }
  }, [event, open]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Título é obrigatório';
    if (!formData.date) newErrors.date = 'Data é obrigatória';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB
        setErrors({ image: 'Imagem muito grande. Máximo 5MB.' });
        return;
      }
      if (!file.type.startsWith('image/')) {
        setErrors({ image: 'Apenas imagens são permitidas.' });
        return;
      }
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file));
      if (errors.image) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.image;
          return newErrors;
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const eventToSave = {
        ...formData,
        subject_id: formData.subject_id ? parseInt(formData.subject_id) : undefined
      } as Omit<CalendarEvent, 'id'>;

      // Se for edição e não tem nova imagem, manter o campo image_path como undefined para não sobrescrever
      if (!formData.image && event) {
        delete (eventToSave as any).image;
      }

      await onSave(eventToSave);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
    }
  };

  const handleDelete = async () => {
    if (event && onDelete) {
      try {
        await onDelete(event.id);
        onOpenChange(false);
      } catch (error) {
        console.error('Erro ao deletar evento:', error);
      }
    }
  };

  const isEditMode = !!event;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Editar Evento' : 'Novo Evento'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <div className="relative">
              <BookOpen className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="pl-10"
                placeholder="Digite o título do evento"
              />
            </div>
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4 space-y-0">
            <div className="space-y-2">
              <Label htmlFor="date">Data *</Label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="pl-10"
                />
              </div>
              {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Horário</Label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select value={formData.type} onValueChange={(value: 'class' | 'exam' | 'deadline' | 'meeting') => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="class">Aula</SelectItem>
                <SelectItem value="exam">Prova</SelectItem>
                <SelectItem value="deadline">Prazo</SelectItem>
                <SelectItem value="meeting">Reunião</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject_id">Disciplina</Label>
            <Select value={formData.subject_id} onValueChange={(value) => setFormData({ ...formData, subject_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma disciplina" />
                <Users className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id.toString()}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição do evento (opcional)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Imagem de Divulgação</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('image')?.click()}
                  className="flex items-center gap-2"
                >
                  <ImageIcon className="w-4 h-4" />
                  {formData.image ? 'Alterar Imagem' : 'Selecionar Imagem'}
                </Button>
                {formData.image && (
                  <span className="text-sm text-muted-foreground">
                    {formData.image.name}
                  </span>
                )}
              </div>
              {errors.image && <p className="text-sm text-destructive">{errors.image}</p>}
              {imagePreview && (
                <div className="mt-2 flex justify-center">
                  <img
                    src={imagePreview}
                    alt="Prévia da imagem"
                    className="max-w-full max-h-32 object-contain rounded border"
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            {isEditMode && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                Excluir
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? 'Salvando...' : (isEditMode ? 'Atualizar' : 'Criar')}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
