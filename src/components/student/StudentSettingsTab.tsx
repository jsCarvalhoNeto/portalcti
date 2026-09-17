import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  Mail, 
  Phone, 
  GraduationCap, 
  IdCard, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  ShieldCheck, 
  KeyRound,
  Sparkles
} from 'lucide-react';
import { updateStudentProfile, changeStudentPassword } from '@/services/studentProfileService';

export default function StudentSettingsTab() {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  // Estados de dados do perfil
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    student_registration: '',
    phone: '',
    grade: ''
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Estados de alteração de senha
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Carregar dados do perfil
  useEffect(() => {
    if (profile || user) {
      setProfileData({
        full_name: profile?.full_name || '',
        email: profile?.email || user?.email || '',
        student_registration: profile?.student_registration || '',
        phone: profile?.phone || '',
        grade: (profile as any)?.grade || ''
      });
    }
  }, [profile, user]);

  // Atualizar dados de perfil (como telefone ou nome)
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSavingProfile(true);
      await updateStudentProfile(user.id, {
        full_name: profileData.full_name,
        phone: profileData.phone
      });

      toast({
        title: 'Perfil atualizado!',
        description: 'Suas informações foram salvas com sucesso.',
      });
      setIsEditingProfile(false);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível salvar os dados. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  // Alterar senha
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validações
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: 'Campos incompletos',
        description: 'Por favor, preencha a nova senha e a confirmação.',
        variant: 'destructive',
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: 'Senha muito curta',
        description: 'A nova senha deve ter no mínimo 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Senhas não conferem',
        description: 'A nova senha e a confirmação devem ser idênticas.',
        variant: 'destructive',
      });
      return;
    }

    if (passwordData.currentPassword && passwordData.currentPassword === passwordData.newPassword) {
      toast({
        title: 'Senha idêntica',
        description: 'A nova senha deve ser diferente da senha atual.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setChangingPassword(true);

      const result = await changeStudentPassword({
        studentId: user.id,
        email: user.email,
        currentPassword: passwordData.currentPassword.trim() || undefined,
        newPassword: passwordData.newPassword
      });

      if (!result.success) {
        toast({
          title: 'Não foi possível alterar a senha',
          description: result.error || 'Verifique seus dados e tente novamente.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Senha alterada com sucesso!',
        description: 'Sua senha foi atualizada. Utilize-a no seu próximo login.',
      });

      // Limpar formulário
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      toast({
        title: 'Erro ao alterar senha',
        description: error?.message || 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const passwordsMatch = 
    passwordData.newPassword && 
    passwordData.confirmPassword && 
    passwordData.newPassword === passwordData.confirmPassword;

  const isPasswordValid = passwordData.newPassword.length >= 6;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configurações</h2>
        <p className="text-muted-foreground">Gerencie seus dados de perfil e segurança da conta</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Card: Informações do Aluno */}
        <Card className="lg:col-span-5 shadow-sm border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Dados do Aluno</CardTitle>
                  <CardDescription>Informações cadastrais e acadêmicas</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Ativo
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-sm font-medium flex items-center gap-1.5">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Nome Completo
                </Label>
                <Input
                  id="fullName"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                  disabled={!isEditingProfile}
                  placeholder="Nome do aluno"
                  className={!isEditingProfile ? "bg-muted/40 cursor-default" : ""}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  E-mail
                </Label>
                <Input
                  id="email"
                  value={profileData.email}
                  disabled
                  placeholder="email@escola.com"
                  className="bg-muted/40 cursor-not-allowed"
                />
                <p className="text-[11px] text-muted-foreground">O e-mail é utilizado para identificação no login.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="registration" className="text-sm font-medium flex items-center gap-1.5">
                    <IdCard className="w-4 h-4 text-muted-foreground" />
                    Matrícula
                  </Label>
                  <Input
                    id="registration"
                    value={profileData.student_registration || 'Não informada'}
                    disabled
                    className="bg-muted/40 cursor-not-allowed font-mono text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="grade" className="text-sm font-medium flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-muted-foreground" />
                    Turma / Série
                  </Label>
                  <Input
                    id="grade"
                    value={profileData.grade || 'Não informada'}
                    disabled
                    className="bg-muted/40 cursor-not-allowed text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  Telefone / WhatsApp
                </Label>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  disabled={!isEditingProfile}
                  placeholder="(00) 00000-0000"
                  className={!isEditingProfile ? "bg-muted/40 cursor-default" : ""}
                />
              </div>

              {isEditingProfile && (
                <div className="flex gap-2 pt-2">
                  <Button 
                    type="submit" 
                    size="sm" 
                    disabled={savingProfile}
                    className="flex-1 flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    {savingProfile ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setIsEditingProfile(false);
                      setProfileData({
                        full_name: profile?.full_name || '',
                        email: profile?.email || user?.email || '',
                        student_registration: profile?.student_registration || '',
                        phone: profile?.phone || '',
                        grade: (profile as any)?.grade || ''
                      });
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
          {!isEditingProfile && (
            <CardFooter className="pt-0 border-t border-border/50 py-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsEditingProfile(true)}
                className="w-full text-xs text-muted-foreground hover:text-foreground"
              >
                Editar dados de contato
              </Button>
            </CardFooter>
          )}
        </Card>

        {/* Card: Segurança & Alterar Senha */}
        <Card className="lg:col-span-7 shadow-sm border-border">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Segurança & Senha</CardTitle>
                <CardDescription>
                  Atualize sua senha periodicamente para manter sua conta protegida
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* Senha Atual */}
              <div className="space-y-1.5">
                <Label htmlFor="currentPassword" className="text-sm font-medium">
                  Senha Atual
                </Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Digite sua senha atual"
                    className="pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showCurrentPassword ? "Ocultar senha" : "Exibir senha"}
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Necessário para validar sua identidade antes da alteração.
                </p>
              </div>

              {/* Nova Senha */}
              <div className="space-y-1.5">
                <Label htmlFor="newPassword" className="text-sm font-medium">
                  Nova Senha
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Digite sua nova senha"
                    className="pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showNewPassword ? "Ocultar senha" : "Exibir senha"}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                
                {/* Validador de requisitos */}
                <div className="flex items-center gap-2 pt-1 text-xs">
                  {passwordData.newPassword.length > 0 ? (
                    isPasswordValid ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Pelo menos 6 caracteres
                      </span>
                    ) : (
                      <span className="text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Mínimo de 6 caracteres ({passwordData.newPassword.length}/6)
                      </span>
                    )
                  ) : (
                    <span className="text-muted-foreground">Mínimo de 6 caracteres</span>
                  )}
                </div>
              </div>

              {/* Confirmar Nova Senha */}
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirmar Nova Senha
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirme a nova senha"
                    className="pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showConfirmPassword ? "Ocultar senha" : "Exibir senha"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Validador de correspondência */}
                {passwordData.confirmPassword.length > 0 && (
                  <div className="pt-1 text-xs">
                    {passwordsMatch ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> As senhas conferem
                      </span>
                    ) : (
                      <span className="text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> As senhas não coincidem
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Dica de segurança */}
              <div className="p-3 bg-muted/40 rounded-lg border border-border/50 text-xs text-muted-foreground flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>
                  Recomendamos criar uma senha segura contendo letras maiúsculas, minúsculas e números. Nunca compartilhe sua senha com ninguém.
                </span>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={
                    changingPassword || 
                    !passwordData.newPassword || 
                    !passwordData.confirmPassword || 
                    !isPasswordValid || 
                    !passwordsMatch
                  }
                  className="w-full sm:w-auto flex items-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  {changingPassword ? 'Alterando senha...' : 'Salvar Nova Senha'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
