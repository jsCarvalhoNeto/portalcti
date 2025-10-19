import { API_URL } from '@/services/api';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface TeacherFormProps {
  onSuccess: () => void;
  teacher?: any;
}

export default function TeacherForm({ onSuccess, teacher }: TeacherFormProps) {
  const [fullName, setFullName] = useState(teacher?.full_name || '');
  const [email, setEmail] = useState(teacher?.email || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
      <Button type="submit" disabled={loading}>
        {loading ? 'Salvando...' : (teacher ? 'Atualizar' : 'Salvar')}
      </Button>
    </form>
  );
}
