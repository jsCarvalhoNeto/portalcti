import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BookOpen, Shield, AlertTriangle } from 'lucide-react';
import PrivacyModeUtils from '@/utils/privacyMode';

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [privacyWarning, setPrivacyWarning] = useState<{ isPrivate: boolean; cookiesWork: boolean } | null>(null);
  const { user, signIn, signUp } = useAuth();
  const { toast } = useToast();

  // Verificar navegação privada ao carregar o componente
  useEffect(() => {
    const checkPrivacyMode = async () => {
      const result = await PrivacyModeUtils.handlePrivacyMode();
      if (result.isPrivate || !result.cookiesWork) {
        setPrivacyWarning({ isPrivate: result.isPrivate, cookiesWork: result.cookiesWork });
      }
    };

    checkPrivacyMode();
  }, []);

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro no login",
        description: error.includes('Senha incorreta')
          ? error // Usar a mensagem específica do servidor
          : error.includes('Credenciais inválidas')
          ? "Email ou senha incorretos. Por favor, verifique suas credenciais e tente novamente."
          : "Ocorreu um erro ao tentar fazer login. Por favor, tente novamente mais tarde."
      });
    } else {
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao Portal de Informática"
      });
    }

    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;
    const studentRegistration = formData.get('studentRegistration') as string;

    const { error } = await signUp(email, password, fullName, studentRegistration);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro no cadastro",
        description: error === 'User already registered' 
          ? "Este email já está cadastrado" 
          : "Ocorreu um erro ao tentar fazer o cadastro"
      });
    } else {
      toast({
        title: "Cadastro realizado!",
        description: "Verifique seu email para confirmar a conta"
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card/95 backdrop-blur-sm border border-border/50">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
            <BookOpen className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Portal de Informática</CardTitle>
          <CardDescription>
            Entre na sua conta ou crie uma nova para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Aviso sobre navegação privada */}
          {privacyWarning && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 mb-1">
                  Navegação Privada Detectada
                </p>
                <p className="text-amber-700">
                  {privacyWarning.isPrivate 
                    ? "Você está usando modo de navegação privada. "
                    : "Cookies podem estar bloqueados. "
                  }
                  Alguns recursos podem não funcionar corretamente. Para melhor experiência, 
                  use o navegador normal ou permita cookies.
                </p>
              </div>
            </div>
          )}

          <Tabs defaultValue="login" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Login
              </TabsTrigger>
              <TabsTrigger value="register" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Cadastro
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Entrar
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Nome Completo</Label>
                  <Input
                    id="register-name"
                    name="fullName"
                    type="text"
                    placeholder="Seu nome completo"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-registration">Matrícula (opcional)</Label>
                  <Input
                    id="register-registration"
                    name="studentRegistration"
                    type="text"
                    placeholder="Ex: 2024001234"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Senha</Label>
                  <Input
                    id="register-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Conta
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
