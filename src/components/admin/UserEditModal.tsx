import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Shield, User, Mail, Loader2, GraduationCap, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile, updateUserRole, updateUserGrade } from '@/services/userService';

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentUserId?: string;
  totalAdmins?: number;
  user?: {
    id: string;
    full_name?: string;
    email?: string;
    roles?: Array<{ role: string }>;
    grade?: '1º Ano' | '2º Ano' | '3º Ano' | null;
  } | null;
}

export default function UserEditModal({ isOpen, onClose, onSuccess, currentUserId, totalAdmins = 1, user }: UserEditModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'teacher' | 'student'>('admin');
  const [grade, setGrade] = useState<string>('none');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user && isOpen) {
      setFullName(user.full_name || '');
      setEmail(user.email || '');
      
      const currentRole = user.roles?.[0]?.role || 'admin';
      if (['admin', 'teacher', 'student'].includes(currentRole)) {
        setRole(currentRole as 'admin' | 'teacher' | 'student');
      } else {
        setRole('admin');
      }

      setGrade(user.grade || 'none');
    } else {
      setFullName('');
      setEmail('');
      setRole('admin');
      setGrade('none');
    }
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!fullName.trim()) {
      toast({
        title: "Campo Obrigatório",
        description: "O nome completo não pode ficar em branco.",
        variant: "destructive",
      });
      return;
    }

    const previousRole = user.roles?.[0]?.role;

    // Regra: O sistema obrigatoriamente precisa ter pelo menos um administrador
    if (previousRole === 'admin' && role !== 'admin' && totalAdmins <= 1) {
      toast({
        title: "Operação não permitida",
        description: "O sistema obrigatoriamente precisa ter pelo menos um administrador ativo.",
        variant: "destructive",
      });
      return;
    }

    // Se o usuário logado for ele mesmo e tentar tirar seu próprio admin
    if (currentUserId && user.id === currentUserId && role !== 'admin') {
      toast({
        title: "Operação não permitida",
        description: "Você não pode remover seus próprios privilégios de administrador.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // 1. Atualiza dados de perfil
      await updateUserProfile(user.id, {
        full_name: fullName.trim(),
        email: email.trim(),
      });

      // 2. Atualiza papel caso tenha mudado
      const previousRole = user.roles?.[0]?.role;
      if (role !== previousRole) {
        await updateUserRole(user.id, role);
      }

      // 3. Atualiza série se for estudante
      if (role === 'student') {
        const gradeValue = grade === 'none' ? null : (grade as '1º Ano' | '2º Ano' | '3º Ano');
        if (gradeValue !== user.grade) {
          await updateUserGrade(user.id, gradeValue);
        }
      }

      toast({
        title: "Usuário Atualizado!",
        description: "Os dados e privilégios do usuário foram salvos com sucesso.",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      toast({
        title: "Erro ao Atualizar",
        description: error.message || "Não foi possível atualizar os dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <DialogTitle>Editar Usuário / Permissões</DialogTitle>
          </div>
          <DialogDescription>
            Atualize o nome, email e o papel (permissões) do usuário no sistema.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="userFullName">Nome Completo *</Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <User className="w-4 h-4" />
              </div>
              <Input
                id="userFullName"
                type="text"
                placeholder="Nome completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="userEmail">Email</Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Mail className="w-4 h-4" />
              </div>
              <Input
                id="userEmail"
                type="email"
                placeholder="email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="userRole">Papel no Sistema (Função)</Label>
            <Select
              value={role}
              onValueChange={(val: 'admin' | 'teacher' | 'student') => setRole(val)}
            >
              <SelectTrigger id="userRole" className="w-full">
                <SelectValue placeholder="Selecione o papel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-destructive" />
                    <span>Administrador</span>
                  </div>
                </SelectItem>
                <SelectItem value="teacher">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-purple-600" />
                    <span>Professor</span>
                  </div>
                </SelectItem>
                <SelectItem value="student">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                    <span>Estudante</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {role === 'admin' && 'Acesso total ao painel administrativo e configurações.'}
              {role === 'teacher' && 'Acesso ao painel do professor, turmas e gerenciamento de notas.'}
              {role === 'student' && 'Acesso ao portal do estudante e materiais das disciplinas.'}
            </p>
          </div>

          {role === 'student' && (
            <div className="space-y-2">
              <Label htmlFor="userGrade">Série / Ano (Estudante)</Label>
              <Select
                value={grade}
                onValueChange={(val) => setGrade(val)}
              >
                <SelectTrigger id="userGrade" className="w-full">
                  <SelectValue placeholder="Selecione a série" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma série definida</SelectItem>
                  <SelectItem value="1º Ano">1º Ano</SelectItem>
                  <SelectItem value="2º Ano">2º Ano</SelectItem>
                  <SelectItem value="3º Ano">3º Ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
