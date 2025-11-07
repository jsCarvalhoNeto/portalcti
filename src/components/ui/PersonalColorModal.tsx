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
import ColorPicker from '@/components/ui/ColorPicker';
import { useToast } from '@/hooks/use-toast';
import { useUserColors } from '@/hooks/useUserColors';
import { Palette, RotateCcw } from 'lucide-react';

interface PersonalColorModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: {
    id: number;
    name: string;
  } | null;
  onColorChanged?: (subjectId: number, newColor: string) => void;
}

export const PersonalColorModal: React.FC<PersonalColorModalProps> = ({
  isOpen,
  onClose,
  subject,
  onColorChanged
}) => {
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  const [hasCustomColor, setHasCustomColor] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { getUserColor, saveUserColor, removeUserColor } = useUserColors();

  // Buscar cor atual quando abrir o modal
  useEffect(() => {
    if (isOpen && subject) {
      loadCurrentColor();
    }
  }, [isOpen, subject]);

  const loadCurrentColor = async () => {
    if (!subject) return;
    
    try {
      const userColor = getUserColor(subject.id);
      if (userColor) {
        setSelectedColor(userColor);
        setHasCustomColor(true);
      } else {
        setSelectedColor('#3B82F6');
        setHasCustomColor(false);
      }
    } catch (error) {
      console.error('Erro ao carregar cor atual:', error);
    }
  };

  const handleSaveColor = async () => {
    if (!subject || loading) return;

    setLoading(true);
    try {
      saveUserColor(subject.id, selectedColor);
      setHasCustomColor(true);
      
      toast({
        title: 'Cor personalizada salva!',
        description: `A cor da disciplina "${subject.name}" foi personalizada com sucesso.`,
        variant: 'default',
      });

      // Notificar o componente pai sobre a mudança
      if (onColorChanged) {
        onColorChanged(subject.id, selectedColor);
      }

      onClose();
    } catch (error) {
      console.error('Erro ao salvar cor:', error);
      toast({
        title: 'Erro ao salvar cor',
        description: 'Não foi possível salvar a cor personalizada. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetColor = async () => {
    if (!subject || loading) return;

    setLoading(true);
    try {
      removeUserColor(subject.id);
      setSelectedColor('#3B82F6'); // Cor padrão
      setHasCustomColor(false);
      
      toast({
        title: 'Cor resetada!',
        description: `A disciplina "${subject.name}" voltou para a cor padrão.`,
        variant: 'default',
      });

      // Notificar o componente pai sobre a mudança
      if (onColorChanged) {
        onColorChanged(subject.id, '#3B82F6');
      }

      onClose();
    } catch (error) {
      console.error('Erro ao resetar cor:', error);
      toast({
        title: 'Erro ao resetar cor',
        description: 'Não foi possível resetar a cor. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!subject) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Personalizar Cor da Disciplina
          </DialogTitle>
          <DialogDescription>
            Escolha uma cor personalizada para a disciplina <strong>{subject.name}</strong>. 
            Esta cor será aplicada apenas para você e não afetará outros usuários.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Preview do Card */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Preview:</label>
            <div 
              className="p-4 rounded-lg shadow-md text-white min-h-[100px] flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${selectedColor} 0%, ${selectedColor}CC 100%)`
              }}
            >
              <div className="text-center">
                <h3 className="font-semibold text-lg">{subject.name}</h3>
                <p className="text-sm opacity-90">Sua cor personalizada</p>
              </div>
            </div>
          </div>

          {/* Seletor de Cores */}
          <div className="space-y-3">
            <label className="text-sm font-medium">
              Escolha uma cor:
              {hasCustomColor && (
                <span className="text-xs text-muted-foreground ml-2">
                  (Personalizada)
                </span>
              )}
            </label>
            <ColorPicker
              value={selectedColor}
              onChange={setSelectedColor}
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          {hasCustomColor && (
            <Button
              variant="outline"
              onClick={handleResetColor}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Resetar
            </Button>
          )}
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveColor}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Palette className="w-4 h-4" />
            {loading ? 'Salvando...' : 'Salvar Cor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};