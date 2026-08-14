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
import { Shield, User, Mail, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile } from '@/services/userService';

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: {
    id: string;
    full_name?: string;
    email?: string;
    roles?: Array<{ role: string }>;
  } | null;
}

export default function UserEditModal({ isOpen, onClose, onSuccess, user }: UserEditModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user && isOpen) {
      setFullName(user.full_name || '');
      setEmail(user.email || '');
    } else {
      setFullName('');
      setEmail('');
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

    setLoading(true);
    try {
      await updateUserProfile(user.id, {
        full_name: fullName.trim(),
        email: email.trim(),
      });

      toast({
        title: "Usuário Atualizado!",
        description: "Os dados do administrador foram salvos com sucesso.",
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
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-destructive/10 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-destructive" />
            </div>
            <DialogTitle>Editar Administrador</DialogTitle>
          </div>
          <DialogDescription>
            Atualize o nome e as informações do perfil do administrador.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="adminFullName">Nome Completo *</Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <User className="w-4 h-4" />
              </div>
              <Input
                id="adminFullName"
                type="text"
                placeholder="Nome do administrador"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminEmail">Email</Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Mail className="w-4 h-4" />
              </div>
              <Input
                id="adminEmail"
                type="email"
                placeholder="email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

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
