/**
 * Componente para exibir credenciais geradas do estudante
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle2, 
  Copy, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  AlertTriangle,
  User
} from 'lucide-react';
import { CredentialsDisplayProps } from '@/types/student';
import { useToast } from '@/hooks/use-toast';

export default function CredentialsDisplay({ credentials, onClose }: CredentialsDisplayProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast({
        title: "Copiado!",
        description: `${fieldName} copiado para a área de transferência`,
      });
      
      // Limpar indicador de copiado após 2 segundos
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar para a área de transferência",
        variant: "destructive",
      });
    }
  };

  const copyAllCredentials = async () => {
    const credentialsText = `
Credenciais de Acesso - Novo Estudante

Email: ${credentials.email}
Senha Temporária: ${credentials.temporaryPassword}

IMPORTANTE:
- O estudante deve alterar a senha no primeiro login
- Mantenha essas informações seguras
- Compartilhe apenas com o estudante
    `.trim();

    await copyToClipboard(credentialsText, "Todas as credenciais");
  };

  return (
    <div className="space-y-6">
      {/* Header de Sucesso */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-green-900">
            Estudante Criado com Sucesso!
          </h3>
          <p className="text-sm text-muted-foreground">
            As credenciais de acesso foram geradas. Compartilhe com o estudante.
          </p>
        </div>
      </div>

      {/* Credenciais */}
      <div className="space-y-4">
        {/* Email */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email de Acesso
          </Label>
          <div className="flex gap-2">
            <Input
              value={credentials.email}
              readOnly
              className="flex-1 bg-muted/50"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(credentials.email, "Email")}
              className="px-3"
            >
              {copiedField === "Email" ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Senha Temporária */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Senha Temporária
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type={showPassword ? "text" : "password"}
                value={credentials.temporaryPassword}
                readOnly
                className="pr-10 bg-muted/50 font-mono"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(credentials.temporaryPassword, "Senha")}
              className="px-3"
            >
              {copiedField === "Senha" ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* ID do Usuário (para referência) */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <User className="w-4 h-4" />
            ID do Usuário
          </Label>
          <div className="flex gap-2">
            <Input
              value={credentials.userId}
              readOnly
              className="flex-1 bg-muted/50 font-mono text-xs"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(credentials.userId, "ID do Usuário")}
              className="px-3"
            >
              {copiedField === "ID do Usuário" ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Aviso Importante */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-amber-900">
              Instruções Importantes
            </h4>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>• O estudante deve alterar a senha no primeiro login</li>
              <li>• Compartilhe essas credenciais apenas com o estudante</li>
              <li>• A senha temporária expira em 30 dias se não utilizada</li>
              <li>• Mantenha essas informações seguras</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex gap-3 pt-4">
        <Button
          variant="outline"
          onClick={copyAllCredentials}
          className="flex-1"
        >
          <Copy className="w-4 h-4 mr-2" />
          Copiar Tudo
        </Button>
        <Button
          onClick={onClose}
          className="flex-1"
        >
          Concluir
        </Button>
      </div>

      {/* Nota sobre próximos passos */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          O estudante já pode fazer login no sistema com essas credenciais
        </p>
      </div>
    </div>
  );
}