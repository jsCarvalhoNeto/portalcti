import { API_URL } from '@/services/api';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { subjectService } from '@/services/subjectService';

interface Subject {
  id: string;
  name: string;
  description?: string;
  teacher_id?: string;
  teacher_name?: string;
  max_students?: number;
  current_students?: number;
  grade?: '1º Ano' | '2º Ano' | '3º Ano';
  semester?: string;
  period?: string;
  schedule?: string;
}

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

export default function SubjectModal({ isOpen, onClose, subject, onSuccess }: SubjectModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    teacher_id: '',
    max_students: 50,
    semester: '',
    period: '',
    schedule: '',
    grade: ''
  });
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teachersLoaded, setTeachersLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchTeachers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && teachersLoaded) {
      if (subject) {
        const teacherExists = teachers.some(t => t.id === subject.teacher_id);
        setFormData({
          name: subject.name || '',
          description: subject.description || '',
          teacher_id: teacherExists ? subject.teacher_id || '' : '',
          max_students: subject.max_students || 50,
          semester: subject.semester || '',
          period: subject.period || '',
          schedule: subject.schedule || '',
          grade: subject.grade || ''
        });
      } else {
        // Limpa o formulário para o caso de criação
        setFormData({
          name: '',
          description: '',
          teacher_id: '',
          max_students: 50,
          semester: '',
          period: '',
          schedule: '',
          grade: ''
        });
      }
    }
  }, [isOpen, subject, teachersLoaded, teachers]);

  const fetchTeachers = async () => {
    if (teachersLoaded) return; // Evita buscas repetidas
    try {
      const response = await fetch(`${API_URL}/teachers`);
      if (!response.ok) {
        throw new Error('Falha ao buscar professores');
      }
      const teacherData = await response.json();
      setTeachers(teacherData);
      setTeachersLoaded(true);
    } catch (error) {
      console.error('Erro ao buscar professores:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar lista de professores",
        variant: "destructive",
      });
      setTeachersLoaded(true);
    }
  };

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (subject) {
        // Atualizar disciplina existente
        await subjectService.update(subject.id, {
          name: formData.name,
          description: formData.description || undefined,
          teacher_id: formData.teacher_id || undefined,
          schedule: formData.schedule || undefined,
          max_students: formData.max_students,
          grade: formData.grade as '1º Ano' | '2º Ano' | '3º Ano' || undefined,
          semester: formData.semester || undefined,
          period: formData.period || undefined
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
          teacher_id: formData.teacher_id || undefined,
          schedule: formData.schedule || undefined,
          max_students: formData.max_students,
          grade: formData.grade as '1º Ano' | '2º Ano' | '3º Ano' || undefined,
          semester: formData.semester || undefined,
          period: formData.period || undefined
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
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {subject ? 'Editar Disciplina' : 'Nova Disciplina'}
          </DialogTitle>
          <DialogDescription>
            {subject ? 'Edite as informações da disciplina' : 'Preencha os dados da nova disciplina'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Disciplina</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacher_id">Professor</Label>
              <Select
                key={formData.teacher_id}
                value={formData.teacher_id}
                onValueChange={(value) => setFormData({ ...formData, teacher_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um professor" className="text-foreground" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_students">Máximo de Alunos</Label>
              <Input
                id="max_students"
                type="number"
                value={formData.max_students}
                onChange={(e) => setFormData({ ...formData, max_students: parseInt(e.target.value) })}
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="semester">Semestre</Label>
              <Input
                id="semester"
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                placeholder="Ex: 2024.1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="period">Período</Label>
              <Select
                value={formData.period}
                onValueChange={(value) => setFormData({ ...formData, period: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1º Período">1º Período</SelectItem>
                  <SelectItem value="2º Período">2º Período</SelectItem>
                  <SelectItem value="3º Período">3º Período</SelectItem>
                  <SelectItem value="4º Período">4º Período</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
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
};
