import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import ColorPicker from '@/components/ui/ColorPicker';
import { useToast } from '@/hooks/use-toast';
import { subjectService } from '@/services/subjectService';
import { Subject } from '@/contexts/TeacherDashboardContext';

interface SubjectColorEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: Subject | null;
  onSuccess: () => void;
}

/**
 * Modal para edição de cores e informações básicas das disciplinas
 * Permite aos professores personalizar a aparência dos cards
 */
export default function SubjectColorEditModal({ 
  isOpen, 
  onClose, 
  subject, 
  onSuccess 
}: SubjectColorEditModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
  });

  // Atualizar dados do formulário quando a disciplina mudar
  useEffect(() => {
    if (subject) {
      setFormData({
        name: subject.name || '',
        description: subject.description || '',
        color: subject.color || '#3B82F6',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        color: '#3B82F6',
      });
    }
  }, [subject]);

  /**
   * Manipula mudanças nos campos do formulário
   */
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Manipula o submit do formulário
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject) return;

    setIsLoading(true);

    try {
      // Atualizar disciplina via Supabase
      await subjectService.update(subject.id, {
        name: formData.name,
        description: formData.description,
        color: formData.color,
      });

      toast({
        title: "Disciplina atualizada!",
        description: "As informações da disciplina foram atualizadas com sucesso.",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao atualizar disciplina:', error);
      
      toast({
        variant: "destructive",
        title: "Erro ao atualizar disciplina",
        description: error.message || "Ocorreu um erro inesperado. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Função para visualizar como ficará o card com a cor escolhida
   */
  const getCardPreview = () => {
    const cardColor = formData.color;
    
    // Determina se a cor é clara ou escura para ajustar o texto
    const isLightColor = (hex: string) => {
      const rgb = parseInt(hex.slice(1), 16);
      const r = (rgb >> 16) & 255;
      const g = (rgb >> 8) & 255;
      const b = rgb & 255;
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 128;
    };

    const textColor = isLightColor(cardColor) ? '#1f2937' : '#ffffff';

    return (
      <div 
        className="rounded-lg p-4 border-0 relative overflow-hidden min-h-[100px]"
        style={{
          background: `linear-gradient(135deg, ${cardColor}CC 0%, ${cardColor}AA 100%)`,
          color: textColor
        }}
      >
        {/* Barra de cor no topo */}
        <div 
          className="absolute top-0 left-0 right-0 h-1"
          style={{ backgroundColor: cardColor }}
        />
        
        <h3 className="font-semibold text-lg mb-1" style={{ color: textColor }}>
          {formData.name || 'Nome da Disciplina'}
        </h3>
        <p className="text-sm opacity-80" style={{ color: `${textColor}CC` }}>
          {formData.description || 'Descrição da disciplina...'}
        </p>
        
        <div className="mt-3 flex gap-2">
          <div className="px-2 py-1 rounded text-xs bg-white/20 border border-white/30">
            Visualização
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editar Disciplina</DialogTitle>
          <DialogDescription>
            Personalize o nome, descrição e cor do card da disciplina.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome da Disciplina */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Disciplina</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Digite o nome da disciplina"
              required
              disabled={isLoading}
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Digite uma descrição para a disciplina (opcional)"
              disabled={isLoading}
              rows={3}
            />
          </div>

          {/* Seletor de Cor */}
          <div className="space-y-2">
            <ColorPicker
              value={formData.color}
              onChange={(color) => handleInputChange('color', color)}
              disabled={isLoading}
            />
          </div>

          {/* Visualização do Card */}
          <div className="space-y-2">
            <Label>Visualização do Card</Label>
            {getCardPreview()}
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading || !formData.name.trim()}
          >
            {isLoading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}