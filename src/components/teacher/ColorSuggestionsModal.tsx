import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';
import { Subject } from '@/contexts/TeacherDashboardContext';
import { CheckCircle, XCircle, Clock, User, Calendar, Palette } from 'lucide-react';

interface ColorSuggestion {
  id: number;
  subject_id: number;
  student_id: number;
  suggested_color: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at?: string;
  student_name: string;
  subject_name: string;
}

interface ColorSuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: Subject | null;
  onSuccess: () => void;
}

/**
 * Modal para professores visualizarem e gerenciarem sugestões de cores
 */
export default function ColorSuggestionsModal({ 
  isOpen, 
  onClose, 
  subject, 
  onSuccess 
}: ColorSuggestionsModalProps) {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<ColorSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * Buscar sugestões da disciplina
   */
  const fetchSuggestions = async () => {
    if (!subject) return;

    setLoading(true);
    try {
      const response = await api.get(`/api/color-suggestions/subject/${subject.id}`);
      setSuggestions(response.data);
    } catch (error) {
      console.error('Erro ao buscar sugestões:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar as sugestões.",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Aprovar ou rejeitar sugestão
   */
  const handleSuggestionAction = async (
    suggestionId: number, 
    status: 'approved' | 'rejected',
    applyColor = false
  ) => {
    try {
      await api.patch(`/api/color-suggestions/${suggestionId}/status`, {
        status,
        apply_color: applyColor
      });

      toast({
        title: status === 'approved' ? 'Sugestão aprovada!' : 'Sugestão rejeitada!',
        description: applyColor 
          ? 'A cor foi aplicada à disciplina.' 
          : 'O estudante será notificado sobre sua decisão.',
      });

      // Recarregar sugestões
      await fetchSuggestions();
      
      // Se a cor foi aplicada, notificar o componente pai
      if (applyColor) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Erro ao processar sugestão:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.response?.data?.error || "Erro ao processar sugestão.",
      });
    }
  };

  /**
   * Visualizar como ficaria a cor sugerida
   */
  const getColorPreview = (color: string) => {
    const isLightColor = (hex: string) => {
      const rgb = parseInt(hex.slice(1), 16);
      const r = (rgb >> 16) & 255;
      const g = (rgb >> 8) & 255;
      const b = rgb & 255;
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 128;
    };

    const textColor = isLightColor(color) ? '#1f2937' : '#ffffff';

    return (
      <div 
        className="rounded-lg p-3 border-0 relative overflow-hidden min-h-[80px]"
        style={{
          background: `linear-gradient(135deg, ${color}CC 0%, ${color}AA 100%)`,
          color: textColor
        }}
      >
        <div 
          className="absolute top-0 left-0 right-0 h-1"
          style={{ backgroundColor: color }}
        />
        <h4 className="font-medium text-sm" style={{ color: textColor }}>
          {subject?.name}
        </h4>
        <p className="text-xs opacity-80" style={{ color: `${textColor}CC` }}>
          Visualização da cor {color}
        </p>
      </div>
    );
  };

  /**
   * Obter ícone do status
   */
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  /**
   * Obter badge do status
   */
  const getStatusBadge = (status: string) => {
    const variants = {
      'pending': 'default',
      'approved': 'secondary',
      'rejected': 'destructive'
    } as const;

    const labels = {
      'pending': 'Pendente',
      'approved': 'Aprovada',
      'rejected': 'Rejeitada'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  /**
   * Carregar sugestões quando o modal abrir
   */
  useEffect(() => {
    if (isOpen && subject) {
      fetchSuggestions();
    }
  }, [isOpen, subject]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Sugestões de Cores - {subject?.name}
          </DialogTitle>
          <DialogDescription>
            Gerencie as sugestões de cores enviadas pelos estudantes para esta disciplina.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Palette className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma sugestão de cor encontrada para esta disciplina.</p>
            </div>
          ) : (
            suggestions.map((suggestion) => (
              <Card key={suggestion.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {suggestion.student_name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(suggestion.status)}
                      {getStatusBadge(suggestion.status)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {new Date(suggestion.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Mensagem do estudante */}
                  {suggestion.message && (
                    <div className="bg-muted/30 rounded p-3">
                      <p className="text-sm">{suggestion.message}</p>
                    </div>
                  )}

                  {/* Visualização da cor */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Cor sugerida: {suggestion.suggested_color}
                    </label>
                    {getColorPreview(suggestion.suggested_color)}
                  </div>

                  {/* Ações */}
                  {suggestion.status === 'pending' && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleSuggestionAction(suggestion.id, 'rejected')}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Rejeitar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSuggestionAction(suggestion.id, 'approved')}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSuggestionAction(suggestion.id, 'approved', true)}
                      >
                        <Palette className="w-4 h-4 mr-1" />
                        Aprovar e Aplicar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}