import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Sparkles,
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Star,
  CheckCircle2,
  Loader2,
  KeyRound,
  Cpu,
} from 'lucide-react';
import {
  TeacherAiConfig,
  getTeacherAiConfigs,
  saveTeacherAiConfig,
  deleteTeacherAiConfig,
  setDefaultTeacherAiConfig,
  toggleTeacherAiConfigActive,
  testGoogleAiConnection,
} from '@/services/aiService';

const SUGGESTED_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
];

interface FormState {
  id?: string;
  label: string;
  model_name: string;
  api_key: string;
  is_default: boolean;
}

const EMPTY_FORM: FormState = {
  label: '',
  model_name: '',
  api_key: '',
  is_default: false,
};

function maskApiKey(key: string): string {
  const trimmed = key.trim();
  if (trimmed.length <= 8) return '••••••••';
  return `${trimmed.slice(0, 6)}••••••••${trimmed.slice(-4)}`;
}

export default function TeacherAiSettingsCard() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [configs, setConfigs] = useState<TeacherAiConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showFormKey, setShowFormKey] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [testingId, setTestingId] = useState<string | null>(null);

  const loadConfigs = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await getTeacherAiConfigs(user.id);
      setConfigs(data);
    } catch (error) {
      console.error('Erro ao carregar configurações de IA:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, [user?.id]);

  const handleOpenNew = () => {
    setForm({
      ...EMPTY_FORM,
      is_default: configs.length === 0,
    });
    setShowFormKey(false);
    setShowForm(true);
  };

  const handleEdit = (config: TeacherAiConfig) => {
    setForm({
      id: config.id,
      label: config.label || '',
      model_name: config.model_name,
      api_key: config.api_key,
      is_default: config.is_default,
    });
    setShowFormKey(false);
    setShowForm(true);
  };

  const handleCancel = () => {
    setForm(EMPTY_FORM);
    setShowForm(false);
    setShowFormKey(false);
  };

  const handleSave = async () => {
    if (!user?.id) return;

    if (!form.model_name.trim() || !form.api_key.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Informe o nome do modelo e a chave da API do Google.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      await saveTeacherAiConfig(user.id, {
        id: form.id,
        label: form.label,
        provider: 'google',
        model_name: form.model_name,
        api_key: form.api_key,
        is_active: true,
        is_default: form.is_default,
      });

      toast({
        title: 'Configuração salva',
        description: form.id
          ? 'Configuração de IA atualizada com sucesso.'
          : 'Nova chave e modelo do Google adicionados com sucesso.',
      });

      await loadConfigs();
      handleCancel();
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: error instanceof Error ? error.message : 'Não foi possível salvar a configuração.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (config: TeacherAiConfig) => {
    if (!user?.id) return;

    try {
      await deleteTeacherAiConfig(user.id, config.id);
      toast({
        title: 'Configuração removida',
        description: `Modelo ${config.model_name} removido.`,
      });
      await loadConfigs();
    } catch {
      toast({
        title: 'Erro ao remover',
        description: 'Não foi possível remover a configuração.',
        variant: 'destructive',
      });
    }
  };

  const handleSetDefault = async (config: TeacherAiConfig) => {
    if (!user?.id) return;

    try {
      await setDefaultTeacherAiConfig(user.id, config.id);
      toast({
        title: 'Modelo padrão atualizado',
        description: `${config.label || config.model_name} definido como padrão.`,
      });
      await loadConfigs();
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível definir como padrão.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (config: TeacherAiConfig, checked: boolean) => {
    if (!user?.id) return;

    try {
      await toggleTeacherAiConfigActive(user.id, config.id, checked);
      await loadConfigs();
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status.',
        variant: 'destructive',
      });
    }
  };

  const handleTestConnection = async (modelName: string, apiKey: string, testKey: string) => {
    if (!modelName.trim() || !apiKey.trim()) {
      toast({
        title: 'Dados incompletos',
        description: 'Informe o nome do modelo e a chave da API antes de testar.',
        variant: 'destructive',
      });
      return;
    }

    setTestingId(testKey);
    try {
      const result = await testGoogleAiConnection(modelName, apiKey);
      toast({
        title: result.success ? 'Conexão bem-sucedida' : 'Falha na conexão',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      });
    } finally {
      setTestingId(null);
    }
  };

  return (
    <Card className="md:col-span-2">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Inteligência Artificial (API do Google)
          </CardTitle>
          <CardDescription>
            Cadastre um ou mais modelos e chaves da API do Google (Gemini) para utilizar recursos de IA no aplicativo.
          </CardDescription>
        </div>
        {!showForm && (
          <Button onClick={handleOpenNew} className="shrink-0">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Modelo / Chave
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {showForm && (
          <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                {form.id ? 'Editar Configuração de IA' : 'Nova Configuração de IA (Google)'}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="ai-label">Identificação (opcional)</Label>
                <Input
                  id="ai-label"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="Ex: Chave Principal, Planejamento de Aulas, Reserva..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai-model">Nome do Modelo *</Label>
                <Input
                  id="ai-model"
                  value={form.model_name}
                  onChange={(e) => setForm({ ...form, model_name: e.target.value })}
                  placeholder="Ex: gemini-2.5-flash"
                />
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-xs text-muted-foreground">Sugestões:</span>
                  {SUGGESTED_MODELS.map((model) => (
                    <button
                      key={model}
                      type="button"
                      onClick={() => setForm({ ...form, model_name: model })}
                      className="text-xs px-2 py-0.5 rounded-md border bg-background hover:bg-accent transition-colors"
                    >
                      {model}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai-api-key">Chave da API do Google *</Label>
                <div className="relative">
                  <Input
                    id="ai-api-key"
                    type={showFormKey ? 'text' : 'password'}
                    value={form.api_key}
                    onChange={(e) => setForm({ ...form, api_key: e.target.value })}
                    placeholder="AIza..."
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowFormKey((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showFormKey ? 'Ocultar chave' : 'Mostrar chave'}
                  >
                    {showFormKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Obtenha sua chave no Google AI Studio.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <Switch
                  id="ai-is-default"
                  checked={form.is_default}
                  onCheckedChange={(checked) => setForm({ ...form, is_default: checked })}
                />
                <Label htmlFor="ai-is-default" className="cursor-pointer text-sm">
                  Definir como modelo padrão do projeto
                </Label>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleTestConnection(form.model_name, form.api_key, 'form')}
                disabled={testingId === 'form' || saving}
              >
                {testingId === 'form' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                Testar Conexão
              </Button>
              <Button type="button" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {form.id ? 'Atualizar Configuração' : 'Salvar Configuração'}
              </Button>
              <Button type="button" variant="ghost" onClick={handleCancel} disabled={saving}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Carregando configurações de IA...
          </div>
        ) : configs.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center space-y-2">
            <Sparkles className="w-8 h-8 mx-auto text-muted-foreground/70" />
            <p className="text-sm font-medium">Nenhuma chave da API do Google configurada</p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Adicione pelo menos um modelo e chave da API do Google para habilitar recursos inteligentes no módulo do professor. Você pode cadastrar quantas chaves/modelos desejar.
            </p>
            {!showForm && (
              <Button variant="outline" size="sm" onClick={handleOpenNew} className="mt-2">
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar primeira chave
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {configs.map((config) => {
              const isKeyVisible = Boolean(visibleKeys[config.id]);
              const isTesting = testingId === config.id;

              return (
                <div
                  key={config.id}
                  className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-lg border p-4 bg-card"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-sm truncate">
                        {config.label || config.model_name}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        Google API
                      </Badge>
                      {config.is_default && (
                        <Badge className="text-xs">
                          Padrão
                        </Badge>
                      )}
                      <Badge variant={config.is_active ? 'secondary' : 'outline'} className="text-xs">
                        {config.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Cpu className="w-3.5 h-3.5" />
                        Modelo: <code className="text-foreground font-mono">{config.model_name}</code>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <KeyRound className="w-3.5 h-3.5" />
                        Chave:{' '}
                        <code className="text-foreground font-mono">
                          {isKeyVisible ? config.api_key : maskApiKey(config.api_key)}
                        </code>
                        <button
                          type="button"
                          onClick={() =>
                            setVisibleKeys((prev) => ({ ...prev, [config.id]: !prev[config.id] }))
                          }
                          className="ml-1 text-muted-foreground hover:text-foreground"
                          aria-label={isKeyVisible ? 'Ocultar chave' : 'Mostrar chave'}
                        >
                          {isKeyVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 mr-1">
                      <Switch
                        checked={config.is_active}
                        onCheckedChange={(checked) => handleToggleActive(config, checked)}
                        aria-label={`Ativar ou desativar ${config.model_name}`}
                      />
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestConnection(config.model_name, config.api_key, config.id)}
                      disabled={isTesting}
                      title="Testar conexão com a API do Google"
                    >
                      {isTesting ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      Testar
                    </Button>

                    {!config.is_default && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(config)}
                        title="Definir como padrão"
                      >
                        <Star className="w-3.5 h-3.5 mr-1.5" />
                        Padrão
                      </Button>
                    )}

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(config)}
                      title="Editar configuração"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(config)}
                      className="text-destructive hover:text-destructive"
                      title="Remover configuração"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
