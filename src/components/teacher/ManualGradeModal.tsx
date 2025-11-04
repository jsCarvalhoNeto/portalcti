import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Star, MessageSquare, Users, AlertTriangle } from 'lucide-react';
import { assignManualGradeToTeamMember, type ManualTeamGradeData } from '@/services/activityService';

/**
 * 🎯 MODAL PARA ATRIBUIÇÃO MANUAL DE NOTAS A MEMBROS DE EQUIPE
 * 
 * Permite que o professor atribua notas manualmente para membros específicos
 * de uma equipe que não enviaram a atividade originalmente
 */

interface ManualGradeModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  activityId: number;
  activityName: string;
  studentName: string;
  enrollmentId: number;
  onGradeAssigned: () => void;
}

export default function ManualGradeModal({
  isOpen,
  onOpenChange,
  activityId,
  activityName,
  studentName,
  enrollmentId,
  onGradeAssigned
}: ManualGradeModalProps) {
  const [grade, setGrade] = useState<string>('');
  const [observation, setObservation] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleClose = () => {
    setGrade('');
    setObservation('');
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!grade || parseFloat(grade) < 0 || parseFloat(grade) > 10) {
      toast({
        title: "Erro de Validação",
        description: "Por favor, insira uma nota válida entre 0 e 10.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const gradeData: ManualTeamGradeData = {
        activity_id: activityId,
        enrollment_id: enrollmentId,
        grade: parseFloat(grade),
        teacher_observation: observation.trim() || undefined,
        student_name: studentName
      };

      await assignManualGradeToTeamMember(gradeData);
      
      toast({
        title: "Sucesso!",
        description: `Nota ${grade} atribuída com sucesso para ${studentName}.`,
      });

      onGradeAssigned();
      handleClose();
    } catch (error) {
      console.error('Error assigning manual grade:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível atribuir a nota manual.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            Atribuir Nota Manual
          </DialogTitle>
          <DialogDescription className="space-y-1">
            <div>Atribuir nota manual para <strong>{studentName}</strong></div>
            <div className="text-xs text-muted-foreground">Atividade: {activityName}</div>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Alerta Informativo */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-amber-900">
                  Atribuição Manual de Nota
                </h4>
                <ul className="text-xs text-amber-800 space-y-1">
                  <li>• Esta nota será aplicada apenas para este aluno específico</li>
                  <li>• Diferente das notas automáticas de equipe</li>
                  <li>• O aluno não enviou a atividade originalmente</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Informações do Aluno e Atividade */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">Aluno:</span>
              <Badge variant="outline">{studentName}</Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              ID da Matrícula: {enrollmentId}
            </div>
          </div>

          {/* Campo da Nota */}
          <div className="space-y-2">
            <Label htmlFor="grade" className="text-sm font-medium flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-600" />
              Nota (0 a 10) *
            </Label>
            <Input
              id="grade"
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="Digite a nota (ex: 8.5)"
              className="w-32"
              required
            />
            <div className="text-xs text-muted-foreground">
              Insira uma nota entre 0 e 10
            </div>
          </div>

          {/* Campo de Observação */}
          <div className="space-y-2">
            <Label htmlFor="observation" className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-gray-600" />
              Observação (Opcional)
            </Label>
            <Textarea
              id="observation"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Adicione uma observação sobre esta nota manual..."
              className="min-h-[80px] resize-none"
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground">
              Máximo 500 caracteres • Será prefixada com "NOTA MANUAL DE EQUIPE:"
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !grade}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Atribuindo...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Atribuir Nota
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}