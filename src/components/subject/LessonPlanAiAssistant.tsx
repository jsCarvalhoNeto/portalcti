import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sparkles,
  Send,
  Loader2,
  Wand2,
  SearchCheck,
  Lightbulb,
  FilePlus2,
  Copy,
  Check,
  Save,
  X,
  AlertCircle,
  Edit3,
} from 'lucide-react';
import { SubjectLesson } from '@/services/subjectLessonService';
import {
  TeacherAiConfig,
  getTeacherAiConfigs,
  generateWithTeacherAi,
} from '@/services/aiService';
import { markdownToHtml, sanitizeHtml } from '@/utils/markdownUtils';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
}

interface LessonPlanAiAssistantProps {
  lesson: SubjectLesson;
  subjectName?: string;
  onApplyLessonPlan: (newPlan: string) => Promise<void>;
  onClose: () => void;
}

export default function LessonPlanAiAssistant({
  lesson,
  subjectName,
  onApplyLessonPlan,
  onClose,
}: LessonPlanAiAssistantProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [configs, setConfigs] = useState<TeacherAiConfig[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<string>('');
  const [loadingConfigs, setLoadingConfigs] = useState(true);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [promptInput, setPromptInput] = useState('');
  const [generating, setGenerating] = useState(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [draftPlan, setDraftPlan] = useState<string | null>(null);
  const [savingPlan, setSavingPlan] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!user?.id) {
        setLoadingConfigs(false);
        return;
      }
      setLoadingConfigs(true);
      try {
        const list = await getTeacherAiConfigs(user.id);
        const activeList = list.filter((c) => c.is_active);
        if (!active) return;
        setConfigs(activeList);
        const defaultCfg = activeList.find((c) => c.is_default) || activeList[0];
        if (defaultCfg) {
          setSelectedConfigId(defaultCfg.id);
        }
      } finally {
        if (active) setLoadingConfigs(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [user?.id]);

  // Reset conversa ao trocar de aula
  useEffect(() => {
    setMessages([]);
    setDraftPlan(null);
    setPromptInput('');
  }, [lesson.id]);

  const buildSystemInstruction = () => {
    return [
      'Você é um assistente pedagógico especialista em Educação Profissional e Tecnológica (Curso Técnico em Informática).',
      'Ajude o professor a analisar, planejar, editar e melhorar o Plano de Aula em português do Brasil.',
      'Quando o professor pedir um plano de aula completo ou reescrito, entregue em Markdown bem estruturado (Objetivos, Roteiro/Etapas com tempo estimado, Metodologia, Recursos, Atividade Prática/Dinâmica e Avaliação), sem blocos de código ```markdown envolvendo tudo.',
      'Seja objetivo, prático e alinhado ao conteúdo da aula informado.',
    ].join(' ');
  };

  const buildLessonContext = () => {
    const contentText = (lesson.content || '').trim() || 'Não informado.';
    const planText = (lesson.lesson_plan || '').trim() || 'Nenhum plano de aula cadastrado ainda.';

    return [
      `Disciplina: ${subjectName || 'Não informada'}`,
      `Aula: ${lesson.title}`,
      '',
      '--- CONTEÚDO DA AULA (visível aos alunos) ---',
      contentText,
      '',
      '--- PLANO DE AULA ATUAL (exclusivo do professor) ---',
      planText,
    ].join('\n');
  };

  const runAiPrompt = async (userLabel: string, instruction: string) => {
    if (!user?.id) return;
    if (configs.length === 0) {
      toast({
        title: 'IA não configurada',
        description: 'Cadastre uma chave da API do Google nas Configurações do Painel do Professor.',
        variant: 'destructive',
      });
      return;
    }

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: userLabel,
    };

    const historyText = messages
      .slice(-6)
      .map((m) => `${m.role === 'user' ? 'Professor' : 'Assistente'}: ${m.content}`)
      .join('\n\n');

    const fullPrompt = [
      buildLessonContext(),
      historyText ? `\n--- HISTÓRICO RECENTE ---\n${historyText}` : '',
      `\n--- SOLICITAÇÃO DO PROFESSOR ---\n${instruction}`,
    ]
      .filter(Boolean)
      .join('\n');

    setMessages((prev) => [...prev, userMsg]);
    setGenerating(true);

    try {
      const result = await generateWithTeacherAi(user.id, {
        prompt: fullPrompt,
        systemInstruction: buildSystemInstruction(),
        configId: selectedConfigId || undefined,
        fallbackOnError: true,
        temperature: 0.7,
      });

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: result.text,
        model: result.model,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      toast({
        title: 'Erro ao consultar IA',
        description: error instanceof Error ? error.message : 'Não foi possível gerar resposta.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSendCustom = () => {
    const trimmed = promptInput.trim();
    if (!trimmed || generating) return;
    setPromptInput('');
    runAiPrompt(trimmed, trimmed);
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar o texto.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveDraft = async () => {
    if (draftPlan === null) return;
    setSavingPlan(true);
    try {
      await onApplyLessonPlan(draftPlan);
      setDraftPlan(null);
    } finally {
      setSavingPlan(false);
    }
  };

  const handleApplyDirect = async (content: string) => {
    setSavingPlan(true);
    try {
      await onApplyLessonPlan(content);
    } finally {
      setSavingPlan(false);
    }
  };

  const hasExistingPlan = Boolean(lesson.lesson_plan && lesson.lesson_plan.trim());

  return (
    <div className="rounded-xl border border-indigo-500/30 bg-indigo-50/40 dark:bg-indigo-950/20 p-4 space-y-4">
      {/* Cabeçalho do Assistente */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-500/20 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              Assistente de IA do Plano de Aula
              <Badge variant="secondary" className="text-[10px]">
                Google Gemini
              </Badge>
            </h4>
            <p className="text-xs text-muted-foreground">
              Analise, peça sugestões, converse sobre a aula e aplique melhorias no plano docente.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {configs.length > 0 && (
            <Select value={selectedConfigId} onValueChange={setSelectedConfigId}>
              <SelectTrigger className="h-8 text-xs w-[190px] bg-background">
                <SelectValue placeholder="Selecione o modelo" />
              </SelectTrigger>
              <SelectContent>
                {configs.map((cfg) => (
                  <SelectItem key={cfg.id} value={cfg.id} className="text-xs">
                    {cfg.label ? `${cfg.label} (${cfg.model_name})` : cfg.model_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
            title="Fechar Assistente de IA"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Estado sem configuração */}
      {!loadingConfigs && configs.length === 0 ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3 text-xs">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-foreground">
              Nenhuma chave da API do Google ativa encontrada
            </p>
            <p className="text-muted-foreground">
              Acesse <strong>Painel do Professor → Configurações → Inteligência Artificial (API do Google)</strong> para cadastrar um modelo e sua chave de API.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Ações Rápidas */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={generating || loadingConfigs}
              onClick={() =>
                runAiPrompt(
                  'Analisar plano de aula atual',
                  'Analise criticamente o plano de aula atual em relação ao conteúdo da aula. Destaque pontos fortes, possíveis lacunas, adequação do tempo e clareza dos objetivos.'
                )
              }
              className="h-8 text-xs gap-1.5 bg-background"
            >
              <SearchCheck className="w-3.5 h-3.5 text-blue-600" />
              Analisar Plano
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={generating || loadingConfigs}
              onClick={() =>
                runAiPrompt(
                  'Sugerir melhorias e dinâmicas',
                  'Dê sugestões práticas de melhoria para esta aula: metodologias ativas, dinâmicas rápidas, exemplos do mercado de trabalho e perguntas para engajar os alunos.'
                )
              }
              className="h-8 text-xs gap-1.5 bg-background"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              Sugerir Melhorias
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={generating || loadingConfigs}
              onClick={() =>
                runAiPrompt(
                  hasExistingPlan ? 'Reescrever e aprimorar plano de aula' : 'Gerar plano de aula completo',
                  hasExistingPlan
                    ? 'Reescreva e aprimore o Plano de Aula atual mantendo o que já está bom, corrigindo lacunas e deixando-o pronto para uso em sala de aula em Markdown.'
                    : 'Crie um Plano de Aula completo em Markdown baseado no título e no conteúdo da aula, incluindo objetivos, roteiro com tempos, metodologia, dinâmica prática e avaliação.'
                )
              }
              className="h-8 text-xs gap-1.5 bg-background"
            >
              {hasExistingPlan ? (
                <>
                  <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
                  Aprimorar Plano
                </>
              ) : (
                <>
                  <FilePlus2 className="w-3.5 h-3.5 text-indigo-600" />
                  Gerar Plano do Zero
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDraftPlan(lesson.lesson_plan || '')}
              className="h-8 text-xs gap-1.5 bg-background ml-auto"
            >
              <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
              Editar Plano Aqui
            </Button>
          </div>

          {/* Editor Rápido do Plano (quando aberto) */}
          {draftPlan !== null && (
            <div className="rounded-lg border bg-background p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">
                  Edição Rápida do Plano de Aula (Markdown)
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setDraftPlan(null)}
                  disabled={savingPlan}
                >
                  Cancelar
                </Button>
              </div>
              <Textarea
                value={draftPlan}
                onChange={(e) => setDraftPlan(e.target.value)}
                rows={10}
                className="font-mono text-xs"
                placeholder="Edite o plano de aula em Markdown..."
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveDraft}
                  disabled={savingPlan}
                  className="h-8 text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {savingPlan ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Salvar Plano de Aula
                </Button>
              </div>
            </div>
          )}

          {/* Histórico da Conversa */}
          {messages.length > 0 && (
            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-lg p-3 text-xs ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground ml-8'
                      : 'bg-background border mr-4 space-y-2'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap font-medium">{msg.content}</p>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-2 border-b pb-1.5">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          Sugestão da IA {msg.model ? `(${msg.model})` : ''}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[11px] gap-1"
                            onClick={() => handleCopy(msg.id, msg.content)}
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            {copiedId === msg.id ? 'Copiado' : 'Copiar'}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-[11px] gap-1"
                            onClick={() => setDraftPlan(msg.content)}
                          >
                            <Edit3 className="w-3 h-3" />
                            Editar e Aplicar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            disabled={savingPlan}
                            className="h-6 px-2 text-[11px] gap-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                            onClick={() => handleApplyDirect(msg.content)}
                          >
                            <Save className="w-3 h-3" />
                            Aplicar no Plano
                          </Button>
                        </div>
                      </div>
                      <div
                        className="markdown-rendered prose prose-sm prose-slate dark:prose-invert max-w-none leading-relaxed break-words"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeHtml(markdownToHtml(msg.content)),
                        }}
                      />
                    </>
                  )}
                </div>
              ))}

              {generating && (
                <div className="rounded-lg p-3 bg-background border mr-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  Analisando a aula e gerando resposta...
                </div>
              )}
            </div>
          )}

          {messages.length === 0 && generating && (
            <div className="rounded-lg p-3 bg-background border flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              Analisando a aula e gerando resposta...
            </div>
          )}

          {/* Campo de Instrução Livre */}
          <div className="flex gap-2 items-end">
            <Textarea
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleSendCustom();
                }
              }}
              rows={2}
              placeholder="Peça algo específico sobre esta aula (ex: 'Crie uma dinâmica prática de 15 min', 'Adapte para revisão de prova')... Ctrl+Enter para enviar"
              className="text-xs bg-background resize-none"
              disabled={generating || loadingConfigs}
            />
            <Button
              type="button"
              onClick={handleSendCustom}
              disabled={!promptInput.trim() || generating || loadingConfigs}
              className="h-[58px] px-4 bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
