import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase, createEphemeralClient } from '@/lib/supabaseClient';
import { subjectService } from '@/services/subjectService';
import { resetUserPassword } from '@/services/userService';
import { KeyRound } from 'lucide-react';

interface Subject {
  id: string | number;
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

  useEffect(() => {
    if (teacher) {
      setFullName(teacher.full_name || '');
      setEmail(teacher.email || '');
      setPassword('');
    } else {
      setFullName('');
      setEmail('');
      setPassword('');
      setSelectedSubjects([]);
    }
  }, [teacher]);

  // Carregar lista de disciplinas disponíveis via Supabase
  useEffect(() => {
    const fetchSubjects = async () => {
      setSubjectsLoading(true);
      try {
        const subjectsData = await subjectService.getAll();
        setSubjects(subjectsData);
        
        // Se estiver editando um professor, carregar as disciplinas já associadas
        if (teacher) {
          const { data: assigned } = await supabase
            .from('teacher_subjects')
            .select('subject_id')
            .eq('teacher_id', teacher.id);

          const { data: directSubjects } = await supabase
            .from('subjects')
            .select('id')
            .eq('teacher_id', teacher.id);

          const assignedIds = (assigned || []).map((s: any) => s.subject_id.toString());
          const directIds = (directSubjects || []).map((s: any) => s.id.toString());
          const combined = Array.from(new Set([...assignedIds, ...directIds]));

          setSelectedSubjects(combined);
        }
      } catch (error) {
        console.error('Erro ao buscar disciplinas no Supabase:', error);
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
  }, [teacher, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (teacher) {
        // Atualização do perfil do professor no Supabase
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            email: email || null,
          })
          .eq('id', teacher.id);

        if (profileError) throw profileError;

        // Atualizar associações de disciplinas
        await updateTeacherSubjects(teacher.id, selectedSubjects);

        // Se uma nova senha foi preenchida na edição, atualizar
        if (password.trim()) {
          await resetUserPassword(teacher.id, password.trim());
        }

        toast({
          title: "Professor atualizado com sucesso!",
          description: `O professor ${fullName} foi atualizado no sistema.${password.trim() ? ` A senha foi definida para "${password.trim()}".` : ''}`,
        });
      } else {
        // Criação de novo professor: criar via Supabase usando cliente efêmero para não deslogar o admin
        const initialPassword = password.trim() || 'balbina123';
        const authClient = createEphemeralClient();
        const { data: authData, error: authError } = await authClient.auth.signUp({
          email: email,
          password: initialPassword,
          options: {
            data: {
              full_name: fullName,
              role: 'teacher'
            }
          }
        });

        if (authError) throw authError;

        const newTeacherId = authData.user?.id;
        if (newTeacherId && selectedSubjects.length > 0) {
          await updateTeacherSubjects(newTeacherId, selectedSubjects);
        }

        toast({
          title: "Professor criado com sucesso!",
          description: `O professor ${fullName} foi adicionado com a senha inicial "${initialPassword}".`,
        });
      }

      onSuccess();
    } catch (error: any) {
      console.error('Erro ao salvar professor:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar professor",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Atualizar as disciplinas associadas ao professor no Supabase (em teacher_subjects e subjects)
  const updateTeacherSubjects = async (teacherId: string, subjectIds: string[]) => {
    try {
      // 1. Limpar registros antigos em teacher_subjects
      await supabase
        .from('teacher_subjects')
        .delete()
        .eq('teacher_id', teacherId);

      // 2. Inserir novos registros em teacher_subjects
      if (subjectIds.length > 0) {
        const assignments = subjectIds.map(sId => ({
          subject_id: Number(sId),
          teacher_id: teacherId,
          assigned_at: new Date().toISOString()
        }));

        await supabase
          .from('teacher_subjects')
          .insert(assignments);
      }

      // 3. Atualizar subjects.teacher_id para compatibilidade
      const { error: unassignError } = await supabase
        .from('subjects')
        .update({ teacher_id: null })
        .eq('teacher_id', teacherId);

      if (unassignError) throw unassignError;

      if (subjectIds.length > 0) {
        for (const sid of subjectIds) {
          await supabase
            .from('subjects')
            .update({ teacher_id: teacherId })
            .eq('id', sid);
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar disciplinas do professor no Supabase:', error);
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
      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor="password" className="text-right pt-2">
          Senha
        </Label>
        <div className="col-span-3 space-y-1">
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={teacher ? 'Deixe em branco para não alterar' : 'Digite uma senha ou use o padrão'}
            required={!teacher && !password}
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              {teacher ? 'Preencha apenas se quiser redefinir a senha' : 'Senha inicial padrão: balbina123'}
            </span>
            <button
              type="button"
              onClick={() => setPassword('balbina123')}
              className="text-[11px] text-primary hover:underline font-medium flex items-center gap-1"
            >
              <KeyRound className="w-3 h-3" />
              Preencher balbina123
            </button>
          </div>
        </div>
      </div>

      {/* Seção de seleção de disciplinas */}
      <div className="grid grid-cols-4 items-start gap-4">
        <Label className="text-right pt-2">
          Disciplinas
        </Label>
        <div className="col-span-3 space-y-2">
          {subjectsLoading ? (
            <p className="text-sm text-muted-foreground">Carregando disciplinas...</p>
          ) : subjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma disciplina disponível</p>
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
