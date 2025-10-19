import { API_URL } from '@/services/api';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

interface Subject {
  id: string;
  name: string;
  description?: string;
}

interface Teacher {
  id: string;
  full_name: string;
  email: string;
}

interface TeacherFormProps {
  onSuccess: () => void;
  teacher?: Teacher;
}

export default function TeacherFormWithSubjects({ onSuccess, teacher }: TeacherFormProps) {
  const [fullName, setFullName] = useState(teacher?.full_name || '');
  const [email, setEmail] = useState(teacher?.email || '');
  const [password, setPassword] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const { toast } = useToast();

  // Carregar lista de disciplinas disponíveis
  useEffect(() => {
    const fetchSubjects = async () => {
      setSubjectsLoading(true);
      try {
        const response = await fetch(`${API_URL}/subjects`);
        if (!response.ok) {
          throw new Error('Falha ao buscar disciplinas');
        }
        const subjectsData = await response.json();
        setSubjects(subjectsData);
        
        // Se estiver editando um professor, carregar as disciplinas já associadas
        if (teacher) {
          const teacherSubjectsResponse = await fetch(`${API_URL}/teachers/${teacher.id}/subjects`);
          if (teacherSubjectsResponse.ok) {
            const teacherSubjects = await teacherSubjectsResponse.json();
            const subjectIds = teacherSubjects.map((subject: { id: string }) => subject.id.toString());
            setSelectedSubjects(subjectIds);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar disciplinas:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar lista de disciplinas",
          variant: "destructive",
        });
      } finally {
        setSubjectsLoading(false);
      }
    };

    fetchSubjects();
  }, [teacher]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (teacher) {
        // Atualização de professor existente
        const API_URL_ENDPOINT = `${API_URL}/teachers/${teacher.id}`;
        const response = await fetch(API_URL_ENDPOINT, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            full_name: fullName,
            email: email,
            password: password || undefined // Envia senha apenas se foi fornecida
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Falha ao atualizar professor');
        }

        // Atualizar associação com disciplinas
        await updateTeacherSubjects(teacher.id, selectedSubjects);

        toast({
          title: "Professor atualizado com sucesso!",
          description: `O professor ${fullName} foi atualizado no sistema.`,
        });
      } else {
        // Criação de novo professor
        const API_URL_ENDPOINT = `${API_URL}/teachers`;
        const response = await fetch(API_URL_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            full_name: fullName,
            email: email,
            password: password // Em produção, a senha deve ser criptografada antes de ser enviada!
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Falha ao criar professor');
        }

        // Associar disciplinas ao novo professor
        if (selectedSubjects.length > 0 && result.id) {
          await updateTeacherSubjects(result.id, selectedSubjects);
        }

        toast({
          title: "Professor criado com sucesso!",
          description: `O professor ${fullName} foi adicionado ao sistema.`,
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving teacher:', error);
      toast({
        title: "Erro",
        description: (error as Error).message || "Erro ao salvar professor",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para obter as disciplinas atuais do professor
  const getCurrentTeacherSubjects = async (teacherId: string): Promise<string[]> => {
    const currentSubjectsResponse = await fetch(`${API_URL}/teachers/${teacherId}/subjects`);
    if (currentSubjectsResponse.ok) {
      const currentSubjects = await currentSubjectsResponse.json();
      return currentSubjects.map((subject: { id: string }) => subject.id.toString());
    }
    return [];
  };

  // Função para associar disciplina ao professor
  const associateSubjectToTeacher = async (subjectId: string, teacherId: string) => {
    await fetch(`${API_URL}/subjects/${subjectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        teacher_id: teacherId
      })
    });
  };

  // Função para remover associação de disciplina com professor
  const removeSubjectAssociation = async (subjectId: string) => {
    await fetch(`${API_URL}/subjects/${subjectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        teacher_id: null
      })
    });
  };

  // Função para atualizar as disciplinas associadas ao professor
  const updateTeacherSubjects = async (teacherId: string, subjectIds: string[]) => {
    try {
      const currentSubjectIds = await getCurrentTeacherSubjects(teacherId);
      
      // Associar disciplinas selecionadas que não estão atualmente associadas
      const subjectsToAssociate = subjectIds.filter(subjectId => !currentSubjectIds.includes(subjectId));
      for (const subjectId of subjectsToAssociate) {
        await associateSubjectToTeacher(subjectId, teacherId);
      }

      // Remover associação das disciplinas que não estão mais selecionadas
      const subjectsToRemove = currentSubjectIds.filter(subjectId => !subjectIds.includes(subjectId));
      for (const subjectId of subjectsToRemove) {
        await removeSubjectAssociation(subjectId);
      }
    } catch (error) {
      console.error('Erro ao atualizar disciplinas do professor:', error);
      throw new Error('Falha ao atualizar associação de disciplinas');
    }
  };

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subjectId) 
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="fullName" className="text-right">
          Nome Completo
        </Label>
        <Input
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="col-span-3"
          required
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="email" className="text-right">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="col-span-3"
          required
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="password" className="text-right">
          Senha
        </Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="col-span-3"
          placeholder={teacher ? 'Deixe em branco para não alterar' : ''}
          required={!teacher}
        />
      </div>

      {/* Seção de seleção de disciplinas */}
      <div className="grid grid-cols-4 items-start gap-4">
        <Label className="text-right pt-2">
          Disciplinas
        </Label>
        <div className="col-span-3 space-y-2">
          {subjectsLoading ? (
            <p>Carregando disciplinas...</p>
          ) : subjects.length === 0 ? (
            <p>Nenhuma disciplina disponível</p>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
              {subjects.map((subject) => (
                <div key={subject.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`subject-${subject.id}`}
                    checked={selectedSubjects.includes(subject.id.toString())}
                    onCheckedChange={() => handleSubjectToggle(subject.id.toString())}
                  />
                  <Label htmlFor={`subject-${subject.id}`} className="text-sm font-normal">
                    {subject.name}
                  </Label>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Selecione as disciplinas que este professor irá lecionar
          </p>
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? 'Salvando...' : (teacher ? 'Atualizar' : 'Salvar')}
      </Button>
    </form>
  );
}
