import { useTeacherDashboard } from '@/contexts/TeacherDashboardContext';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit, Lock, Bell, Shield } from 'lucide-react';
import { updateTeacherProfile, changeTeacherPassword } from '@/services/teacherDashboardService';
import { useToast } from '@/hooks/use-toast';

export default function TeacherSettingsTab() {
  const { profile, editingProfile, setEditingProfile } = useTeacherDashboard();
  const { user } = useAuth();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState({
    full_name: profile?.full_name || profile?.email || '',
    email: profile?.email || '',
    phone: profile?.phone || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
 });

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    try {
      const success = await updateTeacherProfile(user.id, profileData);
      if (success) {
        toast({
          title: "Sucesso",
          description: "Perfil atualizado com sucesso!",
        });
        setEditingProfile(false);
      } else {
        throw new Error('Falha ao atualizar perfil');
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar perfil",
        variant: "destructive",
      });
    }
 };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }
    
    if (!user || !passwordData.newPassword) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    try {
      const success = await changeTeacherPassword(user.id, passwordData.newPassword);
      if (success) {
        toast({
          title: "Sucesso",
          description: "Senha alterada com sucesso!",
        });
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        throw new Error('Falha ao alterar senha');
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      toast({
        title: "Erro",
        description: "Falha ao alterar senha",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Configurações do Perfil</h2>
        <p className="text-muted-foreground">Configure suas informações pessoais e preferências</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>Edite suas informações básicas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {editingProfile ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input
                    id="fullName"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                    placeholder="Digite seu nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    placeholder="Digite seu e-mail"
                    type="email"
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    placeholder="Digite seu telefone"
                    type="tel"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleUpdateProfile}
                    className="flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Salvar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingProfile(false);
                      setProfileData({
                        full_name: profile?.full_name || '',
                        email: profile?.email || '',
                        phone: profile?.phone || ''
                      });
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome Completo</label>
                  <p className="text-sm">{profile?.full_name || profile?.email}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">E-mail</label>
                  <p className="text-sm">{profile?.email}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Telefone</label>
                  <p className="text-sm">{profile?.phone || 'Não informado'}</p>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setEditingProfile(true)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Informações
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Segurança</CardTitle>
            <CardDescription>Gerencie sua senha e segurança da conta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Senha Atual</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  placeholder="Digite sua senha atual"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  placeholder="Digite sua nova senha"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  placeholder="Confirme sua nova senha"
                />
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleChangePassword}
                disabled={!passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword}
              >
                <Lock className="w-4 h-4 mr-2" />
                Alterar Senha
              </Button>
            </div>
            <Button variant="outline" className="w-full">
              <Bell className="w-4 h-4 mr-2" />
              Configurações de Notificação
            </Button>
            <Button variant="outline" className="w-full">
              <Shield className="w-4 h-4 mr-2" />
              Preferências de Privacidade
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
