import { useState, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getAvailableStudentsForActivity, getEnrollmentForActivityStudent, assignActivityGrade } from '@/services/activityService';
import { Users, Crown, Star, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface CreateTeamModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  activityId: number;
  activityName: string;
  onTeamCreated?: () => void;
}

interface Student {
  id: string | number;
  full_name: string;
  email: string;
  student_registration: string;
  already_has_grade?: boolean;
}

interface TeamMemberInput {
  name: string;
  isLeader: boolean;
}

export default function CreateTeamModal({ 
  isOpen, 
  onOpenChange, 
  activityId, 
  activityName, 
  onTeamCreated 
}: CreateTeamModalProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedLeader, setSelectedLeader] = useState<string>('');
  const [teamMembers, setTeamMembers] = useState<TeamMemberInput[]>([]);
  const [teamMembersText, setTeamMembersText] = useState('');
  const [grade, setGrade] = useState<string>('');
  const [observation, setObservation] = useState('');
  const [loading, setLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const { toast } = useToast();

  // Buscar alunos disponíveis quando o modal abrir
  useEffect(() => {
    if (isOpen && activityId) {
      fetchAvailableStudents();
    }
  }, [isOpen, activityId]);

  // Processar texto de membros da equipe
  useEffect(() => {
    if (teamMembersText.trim()) {
      const names = teamMembersText
        .split('\n')
        .map(name => name.trim())
        .filter(name => name.length > 0)
        .map(name => ({ name, isLeader: false }));
      
      setTeamMembers(names);
    } else {
      setTeamMembers([]);
    }
  }, [teamMembersText]);

  const fetchAvailableStudents = async () => {
    setStudentsLoading(true);
    try {
      const data = await getAvailableStudentsForActivity(activityId);
      setStudents(data);
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de alunos.",
        variant: "destructive",
      });
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!selectedLeader) {
      toast({
        title: "Erro de Validação",
        description: "Selecione o líder da equipe.",
        variant: "destructive",
      });
      return;
    }

    if (!grade || isNaN(parseFloat(grade)) || parseFloat(grade) < 0 || parseFloat(grade) > 10) {
      toast({
        title: "Erro de Validação", 
        description: "Digite uma nota válida entre 0 e 10.",
        variant: "destructive",
      });
      return;
    }

    if (teamMembers.length === 0) {
      toast({
        title: "Erro de Validação",
        description: "Digite pelo menos um membro da equipe.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Buscar enrollment_id do líder selecionado
      const selectedStudent = students.find(s => s.id.toString() === selectedLeader);
      if (!selectedStudent) {
        throw new Error('Estudante selecionado não encontrado');
      }

      // Buscar enrollment_id
      const enrollmentData = await getEnrollmentForActivityStudent(activityId, selectedLeader);
      if (!enrollmentData.enrollment_id) {
        throw new Error('Aluno não está matriculado nesta disciplina');
      }

      // Criar a nota da equipe
      await assignActivityGrade({
        activity_id: activityId,
        enrollment_id: enrollmentData.enrollment_id,
        grade: parseFloat(grade),
        graded_by: ''
      });
      
      toast({
        title: "✅ Equipe Criada com Sucesso!",
        description: `Equipe liderada por ${selectedStudent.full_name} foi criada e as notas foram aplicadas automaticamente.`,
      });

      // Limpar formulário
      setSelectedLeader('');
      setTeamMembersText('');
      setGrade('');
      setObservation('');
      setTeamMembers([]);

      // Callback de sucesso
      if (onTeamCreated) {
        onTeamCreated();
      }

      // Fechar modal
      onOpenChange(false);

    } catch (error) {
      console.error('Erro ao criar equipe:', error);
      toast({
        title: "Erro ao Criar Equipe",
        description: error instanceof Error ? error.message : "Erro inesperado ao criar a equipe.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedLeader('');
    setTeamMembersText('');
    setGrade('');
    setObservation('');
    setTeamMembers([]);
  };

  const handleModalClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Criar Nova Equipe
          </DialogTitle>
          <DialogDescription>
            Crie uma equipe para a atividade <strong>{activityName}</strong>. 
            A nota será aplicada automaticamente para todos os membros.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Seleção do Líder da Equipe */}
          <div className="space-y-2">
            <Label htmlFor="leader" className="text-sm font-medium flex items-center gap-2">
              <Crown className="w-4 h-4 text-yellow-600" />
              Líder da Equipe *
            </Label>
            {studentsLoading ? (
              <div className="flex items-center gap-2 p-3 border rounded-md">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Carregando alunos...</span>
              </div>
            ) : (
              <Select value={selectedLeader} onValueChange={setSelectedLeader}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o líder da equipe" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem 
                      key={student.id} 
                      value={student.id.toString()}
                      disabled={student.already_has_grade}
                    >
                      <div className="flex items-center gap-2">
                        <span>{student.full_name}</span>
                        {student.already_has_grade && (
                          <span className="text-xs text-amber-600">(já avaliado)</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <p className="text-xs text-muted-foreground">
              O líder será o aluno que receberá a nota inicialmente, que será automaticamente aplicada aos membros.
            </p>
          </div>

          {/* Membros da Equipe */}
          <div className="space-y-2">
            <Label htmlFor="team-members" className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Membros da Equipe *
            </Label>
            <Textarea
              id="team-members"
              value={teamMembersText}
              onChange={(e) => setTeamMembersText(e.target.value)}
              placeholder="Digite o nome de cada membro da equipe (um por linha)&#10;Exemplo:&#10;João Silva&#10;Maria Santos&#10;Pedro Costa"
              className="min-h-[120px] resize-none"
            />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Digite um nome por linha</p>
              <p>• Os nomes serão procurados automaticamente no sistema</p>
              <p>• Alunos não encontrados ainda receberão as notas se matriculados</p>
            </div>

            {/* Preview dos membros */}
            {teamMembers.length > 0 && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  Preview da Equipe ({teamMembers.length} membros)
                </h4>
                <div className="space-y-1">
                  {teamMembers.map((member, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Users className="w-3 h-3 text-blue-600" />
                      <span>{member.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Nota da Equipe */}
          <div className="space-y-2">
            <Label htmlFor="grade" className="text-sm font-medium flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-600" />
              Nota da Equipe *
            </Label>
            <Input
              id="grade"
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="Digite a nota (0 a 10)"
              className="w-32"
            />
            <p className="text-xs text-muted-foreground">
              Esta nota será aplicada automaticamente para todos os membros da equipe.
            </p>
          </div>

          {/* Observação do Professor */}
          <div className="space-y-2">
            <Label htmlFor="observation" className="text-sm font-medium">
              Observação do Professor (opcional)
            </Label>
            <Textarea
              id="observation"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Digite uma observação que será enviada para todos os membros da equipe..."
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Informações Importantes */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-amber-900">
                  Como Funciona o Sistema de Equipes:
                </h4>
                <ul className="text-xs text-amber-800 space-y-1">
                  <li>• O líder selecionado receberá a nota inicial</li>
                  <li>• O sistema procurará automaticamente pelos nomes dos membros</li>
                  <li>• A mesma nota será aplicada para todos os membros encontrados</li>
                  <li>• Membros não encontrados pelo nome também receberão a nota se estiverem matriculados</li>
                  <li>• Você poderá visualizar todas as equipes no botão "Ver Equipes"</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => handleModalClose(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            type="button" 
            onClick={handleCreateTeam}
            disabled={loading || !selectedLeader || !grade || teamMembers.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Criando Equipe...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Criar Equipe
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}