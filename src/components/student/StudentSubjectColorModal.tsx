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
import api from '@/services/api';
import { Subject } from '@/types/subject';
import { Palette, Info } from 'lucide-react';

interface StudentSubjectColorModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: Subject | null;
  onSuccess: () => void;
}

/**
 * Modal para estudantes sugerirem mudança de cor das disciplinas
 * Permite visualizar como ficaria a cor mas apenas sugere ao professor
 */
export default function StudentSubjectColorModal({ 
  isOpen, 
  onClose, 
  subject, 
  onSuccess 
}: StudentSubjectColorModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#3B82F6');

  // Atualizar cor quando a disciplina mudar
  useEffect(() => {
    if (subject) {
      setSelectedColor(subject.color || '#3B82F6');
    }
  }, [subject]);

  /**
   * Função para visualizar como ficará o card com a cor escolhida
   */
  const getCardPreview = () => {
    const cardColor = selectedColor;
    
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
        className="rounded-lg p-4 border-0 relative overflow-hidden min-h-[120px]"
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
          {subject?.name || 'Nome da Disciplina'}
        </h3>
        <p className="text-sm opacity-80 mb-2" style={{ color: `${textColor}CC` }}>
          Professor: {subject?.teacher_name || 'Nome do Professor'}
        </p>
        <p className="text-sm opacity-70" style={{ color: `${textColor}B3` }}>
          {subject?.description || 'Descrição da disciplina...'}
        </p>
        
        <div className="mt-3 flex gap-2">
          <div className="px-2 py-1 rounded text-xs bg-white/20 border border-white/30">
            Visualização
          </div>
        </div>
      </div>
    );
  };

  /**
   * Enviar sugestão de cor ao professor
   */
  const handleSuggestColor = async () => {
    if (!subject) return;

    setIsLoading(true);

    try {
      // Enviar sugestão para a API
      await api.post('/api/color-suggestions', {
        subject_id: subject.id,
        suggested_color: selectedColor,
        message: `Sugestão de cor para a disciplina ${subject.name}`
      });

      toast({
        title: "Sugestão enviada!",
        description: `Sua sugestão de cor ${selectedColor} foi enviada ao professor da disciplina.`,
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao enviar sugestão:', error);
      
      const errorMessage = error.response?.data?.error || "Não foi possível enviar sua sugestão. Tente novamente.";
      
      toast({
        variant: "destructive",
        title: "Erro ao enviar sugestão",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Sugerir Cor para Disciplina
          </DialogTitle>
          <DialogDescription>
            Sugira uma nova cor para o card desta disciplina. A sugestão será enviada ao professor para aprovação.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações da Disciplina */}
          <div className="bg-muted/30 rounded-lg p-4">
            <h4 className="font-medium mb-2">{subject?.name}</h4>
            <p className="text-sm text-muted-foreground">
              Professor: {subject?.teacher_name}
            </p>
            {subject?.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {subject.description}
              </p>
            )}
          </div>

          {/* Aviso sobre permissões */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 mb-1">
                Como funciona a sugestão de cores:
              </p>
              <ul className="text-blue-700 space-y-1 list-disc list-inside">
                <li>Você pode escolher uma cor e ver como ficaria</li>
                <li>Sua sugestão será enviada ao professor da disciplina</li>
                <li>Apenas o professor pode aplicar mudanças definitivas</li>
                <li>Você receberá feedback sobre sua sugestão</li>
              </ul>
            </div>
          </div>

          {/* Seletor de Cor */}
          <div className="space-y-4">
            <ColorPicker
              value={selectedColor}
              onChange={setSelectedColor}
              disabled={isLoading}
            />

            {/* Visualização do Card */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Como ficaria:</label>
              {getCardPreview()}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSuggestColor}
            disabled={isLoading || selectedColor === (subject?.color || '#3B82F6')}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Enviando...
              </>
            ) : (
              <>
                <Palette className="w-4 h-4" />
                Enviar Sugestão
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}