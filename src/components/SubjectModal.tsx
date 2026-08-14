import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { subjectService } from '@/services/subjectService';
import { getAllTeachers } from '@/services/teacherService';
import { Check, X, Users, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Subject } from '@/types/subject';

interface Teacher {
  id: string;
  full_name: string;
  email: string;
}

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject?: Subject | null;
  onSuccess: () => void;
}

const AVAILABLE_PERIODS = ['1º Período', '2º Período', '3º Período', '4º Período'];

export default function SubjectModal({ isOpen, onClose, subject, onSuccess }: SubjectModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    max_students: 50,
    semester: '',
    schedule: '',
    grade: '',
    year: new Date().getFullYear()
  });

  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teachersLoaded, setTeachersLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const parsePeriods = (sub?: Subject | null): string[] => {
    if (!sub) return [];
    if (Array.isArray(sub.periods) && sub.periods.length > 0) {
      return sub.periods;
    }
    if (sub.period) {
      return sub.period.split(',').map(p => p.trim()).filter(Boolean);
    }
    return [];
  };

  const parseTeacherIds = (sub?: Subject | null): string[] => {
    if (!sub) return [];
    if (Array.isArray(sub.teacher_ids) && sub.teacher_ids.length > 0) {
      return sub.teacher_ids.map(String);
    }
    if (Array.isArray(sub.teachers) && sub.teachers.length > 0) {
      return sub.teachers.map(t => String(t.id));
    }
    if (sub.teacher_id) {
      return [String(sub.teacher_id)];
    }
    return [];
  };

  useEffect(() => {
    if (isOpen) {
      fetchTeachers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (subject) {
        setFormData({
          name: subject.name || '',
          description: subject.description || '',
          max_students: subject.max_students ?? 50,
          semester: subject.semester || '',
          schedule: subject.schedule || '',
          grade: subject.grade || '',
          year: subject.year || new Date().getFullYear()
        });
        setSelectedPeriods(parsePeriods(subject));
        setSelectedTeacherIds(parseTeacherIds(subject));
      } else {
        setFormData({
          name: '',
          description: '',
          max_students: 50,
          semester: '',
          schedule: '',
          grade: '',
          year: new Date().getFullYear()
        });
        setSelectedPeriods([]);
        setSelectedTeacherIds([]);
      }
    }
  }, [isOpen, subject]);

  const fetchTeachers = async () => {
    if (teachersLoaded) return;
    try {
      const teacherData = await getAllTeachers();
      setTeachers(teacherData as Teacher[]);
      setTeachersLoaded(true);
    } catch (error) {
      console.error('Erro ao buscar professores no Supabase:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar lista de professores",
        variant: "destructive",
      });
      setTeachersLoaded(true);
    }
  };

  const toggleTeacher = (teacherId: string) => {
    setSelectedTeacherIds(prev =>
      prev.includes(teacherId) ? prev.filter(id => id !== teacherId) : [...prev, teacherId]
    );
  };

  const removeTeacher = (teacherId: string) => {
    setSelectedTeacherIds(prev => prev.filter(id => id !== teacherId));
  };

  const togglePeriod = (period: string) => {
    setSelectedPeriods(prev =>
      prev.includes(period) ? prev.filter(p => p !== period) : [...prev, period]
    );
  };

  const selectAllPeriods = () => {
    if (selectedPeriods.length === AVAILABLE_PERIODS.length) {
      setSelectedPeriods([]);
    } else {
      setSelectedPeriods([...AVAILABLE_PERIODS]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const periodString = selectedPeriods.length > 0 ? selectedPeriods.join(', ') : undefined;
      const primaryTeacherId = selectedTeacherIds.length > 0 ? selectedTeacherIds[0] : null;

      if (subject) {
        // Atualizar disciplina existente
        await subjectService.update(String(subject.id), {
          name: formData.name,
          description: formData.description || undefined,
          teacher_id: primaryTeacherId,
          teacher_ids: selectedTeacherIds,
          schedule: formData.schedule || undefined,
          max_students: formData.max_students,
          grade: formData.grade as '1º Ano' | '2º Ano' | '3º Ano' || undefined,
          semester: formData.semester || undefined,
          period: periodString,
          periods: selectedPeriods,
          year: formData.year
        });
        toast({
          title: "Sucesso",
          description: "Disciplina atualizada com sucesso!",
        });
      } else {
        // Criar nova disciplina
        await subjectService.create({
          name: formData.name,
          description: formData.description || undefined,
          teacher_id: primaryTeacherId,
          teacher_ids: selectedTeacherIds,
          schedule: formData.schedule || undefined,
          max_students: formData.max_students,
          grade: formData.grade as '1º Ano' | '2º Ano' | '3º Ano' || undefined,
          semester: formData.semester || undefined,
          period: periodString,
          periods: selectedPeriods,
          year: formData.year
        });
        toast({
          title: "Sucesso",
          description: "Disciplina criada com sucesso no banco de dados!",
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving subject:', error);
      toast({
        title: "Erro",
        description: (error as Error).message || "Erro ao salvar disciplina",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {subject ? 'Editar Disciplina' : 'Nova Disciplina'}
          </DialogTitle>
          <DialogDescription>
            {subject ? 'Edite as informações da disciplina e seus professores' : 'Preencha os dados da nova disciplina'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Nome da disciplina */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Disciplina *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: HTML e CSS"
              required
            />
          </div>

          {/* Seleção de Professores (0 ou N professores) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5 text-sm font-medium">
                <Users className="w-4 h-4 text-primary" />
                Professores Responsáveis
                <span className="text-xs font-normal text-muted-foreground">
                  (0 ou múltiplos professores)
                </span>
              </Label>
              {selectedTeacherIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedTeacherIds([])}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  Limpar todos
                </button>
              )}
            </div>

            {/* Badges de professores selecionados */}
            {selectedTeacherIds.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 p-2 bg-muted/40 rounded-lg border">
                {selectedTeacherIds.map((tId) => {
                  const teacherObj = teachers.find(t => t.id === tId);
                  const teacherName = teacherObj?.full_name || 'Professor';
                  return (
                    <Badge
                      key={tId}
                      variant="secondary"
                      className="flex items-center gap-1 px-2.5 py-1 text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{teacherName}</span>
                      <button
                        type="button"
                        onClick={() => removeTeacher(tId)}
                        className="ml-1 hover:bg-primary/30 rounded-full p-0.5"
                        title="Remover professor"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            ) : (
              <div className="p-2.5 bg-muted/20 rounded-lg border border-dashed text-xs text-muted-foreground text-center">
                Nenhum professor vinculado. Esta disciplina pode ficar sem professor ou você pode adicionar abaixo.
              </div>
            )}

            {/* Seletor rápido de professores */}
            {teachers.length > 0 && (
              <div className="space-y-1">
                <Select
                  value=""
                  onValueChange={(val) => {
                    if (val && !selectedTeacherIds.includes(val)) {
                      setSelectedTeacherIds(prev => [...prev, val]);
                    }
                  }}
                >
                  <SelectTrigger className="w-full text-xs">
                    <SelectValue placeholder="+ Adicionar professor à disciplina..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {teachers.map((teacher) => {
                      const isSelected = selectedTeacherIds.includes(teacher.id);
                      return (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          <div className="flex items-center justify-between w-full gap-2">
                            <span>{teacher.full_name}</span>
                            {isSelected && <span className="text-[10px] text-primary font-medium">(Já selecionado)</span>}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Breve resumo sobre a disciplina..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_students">Máximo de Alunos</Label>
              <Input
                id="max_students"
                type="number"
                value={formData.max_students}
                onChange={(e) => setFormData({ ...formData, max_students: parseInt(e.target.value) || 0 })}
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="semester">Semestre</Label>
              <Input
                id="semester"
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                placeholder="Ex: 2024.1 ou 2026.2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="schedule">Horário</Label>
              <Input
                id="schedule"
                value={formData.schedule}
                onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                placeholder="Ex: Segunda e Quarta 14:00-16:00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grade">Série</Label>
              <Select
                value={formData.grade}
                onValueChange={(value) => setFormData({ ...formData, grade: value as '1º Ano' | '2º Ano' | '3º Ano' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a série" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1º Ano">1º Ano</SelectItem>
                  <SelectItem value="2º Ano">2º Ano</SelectItem>
                  <SelectItem value="3º Ano">3º Ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Seleção Múltipla de Períodos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Períodos da Disciplina</Label>
              <button
                type="button"
                onClick={selectAllPeriods}
                className="text-xs text-primary hover:underline font-medium transition-colors"
              >
                {selectedPeriods.length === AVAILABLE_PERIODS.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-muted/30 rounded-lg border border-border/60">
              {AVAILABLE_PERIODS.map((period) => {
                const isSelected = selectedPeriods.includes(period);
                return (
                  <button
                    key={period}
                    type="button"
                    onClick={() => togglePeriod(period)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-md border text-sm font-medium transition-all duration-200 select-none",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-sm font-semibold"
                        : "bg-background hover:bg-muted text-foreground border-input"
                    )}
                  >
                    <span>{period}</span>
                    {isSelected && <Check className="w-4 h-4 ml-1 shrink-0" />}
                  </button>
                );
              })}
            </div>
            {selectedPeriods.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                Período(s) selecionado(s): <span className="font-medium text-foreground">{selectedPeriods.join(', ')}</span>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Clique nos períodos acima para associar esta disciplina a um ou mais períodos.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Ano Letivo</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                min="2020"
                max="2030"
                required
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : (subject ? 'Atualizar' : 'Criar')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
