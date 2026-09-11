import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverTrigger,
  PopoverContent
} from '@/components/ui/popover';
import { 
  BookOpen, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Printer, 
  Copy, 
  Check, 
  Maximize2, 
  Minimize2, 
  Edit, 
  Trash2, 
  Award,
  Sparkles,
  Presentation,
  Video,
  FileText,
  ExternalLink,
  Link2,
  ClipboardList,
  Lock,
  Plus,
  Highlighter
} from 'lucide-react';
import { SubjectLesson } from '@/services/subjectLessonService';
import { markdownToHtml, sanitizeHtml } from '@/utils/markdownUtils';
import { useToast } from '@/hooks/use-toast';
import { exportLessonToPdf } from '@/utils/lessonPdfExport';
import TextHighlightToolbar from './TextHighlightToolbar';
import {
  HIGHLIGHT_COLORS,
  getColorById,
  applyHighlight,
  removeHighlightById,
  updateHighlightColor,
  clearAllHighlights,
  countUniqueHighlights,
  saveLessonHighlights,
  loadSavedHighlightsHtml,
  removeSavedHighlights
} from '@/utils/lessonHighlightUtils';

interface SubjectLessonViewerProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: SubjectLesson | null;
  subjectName?: string;
  isTeacher?: boolean;
  initialTab?: 'content' | 'plan';
  onEdit?: (lesson: SubjectLesson) => void;
  onDelete?: (lessonId: string) => void;
  onToggleCompleted?: (lessonId: string, currentStatus: boolean) => void;
}

export default function SubjectLessonViewer({
  isOpen,
  onClose,
  lesson,
  subjectName,
  isTeacher = false,
  initialTab = 'content',
  onEdit,
  onDelete,
  onToggleCompleted
}: SubjectLessonViewerProps) {
  const { toast } = useToast();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'plan'>(initialTab);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);

  // Estados da Ferramenta de Marca-Texto
  const [highlightsCount, setHighlightsCount] = useState<number>(0);
  const [activeColorId, setActiveColorId] = useState<string>('yellow');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [highlightToolbar, setHighlightToolbar] = useState<{
    position: { top: number; left: number };
    isBelow?: boolean;
    selectedText?: string;
    isExistingMark?: boolean;
    markId?: string;
    markColorId?: string;
    range?: Range;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Assinatura do conteúdo para detecção de alterações
  const contentSignature = useMemo(() => {
    if (!lesson) return '';
    return activeTab === 'plan' ? (lesson.lesson_plan || '') : (lesson.content || '');
  }, [lesson, activeTab]);

  const defaultContentHtml = useMemo(() => {
    if (!lesson || !lesson.content || !lesson.content.trim()) {
      return '<div class="text-center py-12 text-muted-foreground"><p class="text-base font-medium">Nenhum conteúdo textual registrado para esta aula ainda.</p><p class="text-xs mt-1">O professor disponibilizará as anotações e roteiro em breve.</p></div>';
    }
    return sanitizeHtml(markdownToHtml(lesson.content));
  }, [lesson]);

  const defaultPlanHtml = useMemo(() => {
    if (!lesson || !lesson.lesson_plan || !lesson.lesson_plan.trim()) {
      return '';
    }
    return sanitizeHtml(markdownToHtml(lesson.lesson_plan));
  }, [lesson]);

  const activeDefaultHtml = activeTab === 'plan' ? defaultPlanHtml : defaultContentHtml;
  const [currentHtml, setCurrentHtml] = useState<string>('');

  // Carrega marcações salvas ao abrir a aula ou mudar de aba
  useEffect(() => {
    if (!lesson || !isOpen) {
      setHighlightToolbar(null);
      return;
    }
    const saved = loadSavedHighlightsHtml(lesson.id, activeTab, contentSignature);
    if (saved) {
      setCurrentHtml(saved);
    } else {
      setCurrentHtml(activeDefaultHtml);
    }
    setHighlightToolbar(null);
  }, [lesson?.id, activeTab, contentSignature, activeDefaultHtml, isOpen]);

  // Recalcula contagem de destaques
  useEffect(() => {
    if (!contentContainerRef.current) return;
    const targetEl = (contentContainerRef.current.querySelector('.markdown-rendered') as HTMLElement) || contentContainerRef.current;
    const count = countUniqueHighlights(targetEl);
    setHighlightsCount(count);
  }, [currentHtml, activeTab]);

  if (!lesson) return null;

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen error:', err);
    }
  };

  const handleCopy = () => {
    const textToCopy = activeTab === 'plan' ? lesson.lesson_plan : lesson.content;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast({
      title: 'Copiado!',
      description: activeTab === 'plan' ? 'Plano de aula copiado com sucesso.' : 'Conteúdo da aula copiado para a área de transferência.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    if (!lesson) return;
    try {
      toast({
        title: 'Gerando Documento...',
        description: 'Preparando o conteúdo da aula para impressão/PDF.',
      });
      const markdownEl = contentContainerRef.current?.querySelector('.markdown-rendered') as HTMLElement | null;
      const htmlToExport = markdownEl?.innerHTML || currentHtml;
      exportLessonToPdf(lesson, subjectName, htmlToExport);
    } catch (error) {
      console.error('Erro ao imprimir/exportar PDF:', error);
      toast({
        title: 'Erro ao gerar PDF',
        description: 'Não foi possível preparar o documento para impressão/PDF.',
        variant: 'destructive'
      });
    }
  };

  // Persiste destaques no localStorage
  const persistCurrentHighlights = () => {
    if (!contentContainerRef.current || !lesson) return;
    const markdownEl = contentContainerRef.current.querySelector('.markdown-rendered') as HTMLElement | null;
    if (markdownEl) {
      const newHtml = markdownEl.innerHTML;
      setCurrentHtml(newHtml);
      saveLessonHighlights(lesson.id, activeTab, contentSignature, markdownEl);
      const count = countUniqueHighlights(markdownEl);
      setHighlightsCount(count);
    } else {
      const newHtml = contentContainerRef.current.innerHTML;
      setCurrentHtml(newHtml);
      saveLessonHighlights(lesson.id, activeTab, contentSignature, contentContainerRef.current);
      const count = countUniqueHighlights(contentContainerRef.current);
      setHighlightsCount(count);
    }
  };

  // Aplica marca-texto ao trecho selecionado ou altera cor de destaque existente
  const handleApplyColor = (colorId: string) => {
    if (!contentContainerRef.current || !lesson) return;
    const targetEl = (contentContainerRef.current.querySelector('.markdown-rendered') as HTMLElement) || contentContainerRef.current;

    if (highlightToolbar?.isExistingMark && highlightToolbar.markId) {
      updateHighlightColor(highlightToolbar.markId, colorId, targetEl);
      setActiveColorId(colorId);
      setHighlightToolbar(null);
      persistCurrentHighlights();
      toast({
        title: 'Cor alterada!',
        description: `Destaque atualizado para ${getColorById(colorId).name.toLowerCase()}.`
      });
      return;
    }

    let range = highlightToolbar?.range;
    if (!range) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        range = selection.getRangeAt(0);
      }
    }

    if (range) {
      const id = applyHighlight(range, colorId, targetEl);
      if (id) {
        setActiveColorId(colorId);
        persistCurrentHighlights();
        window.getSelection()?.removeAllRanges();
        setHighlightToolbar(null);
        toast({
          title: 'Texto destacado!',
          description: 'Sua marcação foi salva automaticamente nesta aula.'
        });
      }
    }
  };

  // Remove um destaque individual
  const handleRemoveHighlight = () => {
    if (!contentContainerRef.current || !highlightToolbar?.markId) return;
    const targetEl = (contentContainerRef.current.querySelector('.markdown-rendered') as HTMLElement) || contentContainerRef.current;
    removeHighlightById(highlightToolbar.markId, targetEl);
    setHighlightToolbar(null);
    persistCurrentHighlights();
    toast({
      title: 'Destaque removido!'
    });
  };

  // Limpa todas as marcações da aula na aba atual
  const handleClearAllHighlights = () => {
    if (!contentContainerRef.current || !lesson) return;
    const targetEl = (contentContainerRef.current.querySelector('.markdown-rendered') as HTMLElement) || contentContainerRef.current;
    clearAllHighlights(targetEl);
    removeSavedHighlights(lesson.id, activeTab);
    setCurrentHtml(activeDefaultHtml);
    setHighlightsCount(0);
    setHighlightToolbar(null);
    setIsPopoverOpen(false);
    toast({
      title: 'Marcações removidas',
      description: 'Todas as marcações de texto desta aula foram limpas.'
    });
  };

  // Copia o texto selecionado
  const handleCopySelectedText = () => {
    if (!highlightToolbar?.selectedText) return;
    navigator.clipboard.writeText(highlightToolbar.selectedText);
    toast({
      title: 'Copiado!',
      description: 'Trecho copiado para a área de transferência.'
    });
  };

  // Manipulador para capturar seleção de texto e exibir a toolbar flutuante
  const handleMouseUp = () => {
    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        return;
      }

      const text = selection.toString().trim();
      if (!text || text.length === 0) {
        return;
      }

      const range = selection.getRangeAt(0);
      const container = contentContainerRef.current;
      const targetEl = (container?.querySelector('.markdown-rendered') as HTMLElement) || container;
      if (!targetEl || !targetEl.contains(range.commonAncestorContainer)) {
        return;
      }

      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;

      const isNearTop = rect.top < 70;
      setHighlightToolbar({
        position: {
          top: isNearTop ? rect.bottom + 8 : Math.max(rect.top - 8, 20),
          left: Math.min(Math.max(rect.left + rect.width / 2, 90), window.innerWidth - 90)
        },
        isBelow: isNearTop,
        selectedText: text,
        isExistingMark: false,
        range: range.cloneRange()
      });
    }, 20);
  };

  // Clique no container para interceptar marcações existentes e botões de código
  const handleContainerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // Se clicar em um botão de copiar código
    const copyBtn = target.closest('button') as HTMLButtonElement | null;
    if (copyBtn && copyBtn.innerText.includes('Copiar')) {
      const codeContainer = copyBtn.closest('.code-block-container');
      const codeEl = codeContainer?.querySelector('code');
      if (codeEl) {
        navigator.clipboard.writeText(codeEl.innerText || '');
        copyBtn.innerText = '✓ Copiado!';
        setTimeout(() => {
          copyBtn.innerText = 'Copiar';
        }, 2000);
      }
      return;
    }

    // Se clicar em uma marcação existente (<mark.lesson-highlight>)
    const markEl = target.closest('mark.lesson-highlight') as HTMLElement | null;
    if (markEl) {
      e.stopPropagation();
      const markId = markEl.getAttribute('data-highlight-id') || '';
      const colorId = markEl.getAttribute('data-color') || 'yellow';
      const rect = markEl.getBoundingClientRect();
      const isNearTop = rect.top < 70;
      setHighlightToolbar({
        position: {
          top: isNearTop ? rect.bottom + 8 : Math.max(rect.top - 8, 20),
          left: Math.min(Math.max(rect.left + rect.width / 2, 90), window.innerWidth - 90)
        },
        isBelow: isNearTop,
        selectedText: markEl.textContent || '',
        isExistingMark: true,
        markId,
        markColorId: colorId
      });
      return;
    }

    // Se clicou fora de seleção, remove a toolbar
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setHighlightToolbar(null);
    }
  };

  // Formatação amigável da data
  const formattedDate = lesson.lesson_date ? (() => {
    try {
      const [year, month, day] = lesson.lesson_date.split('T')[0].split('-');
      if (year && month && day) {
        const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return dateObj.toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });
      }
    } catch (e) {
      // fallback
    }
    return lesson.lesson_date;
  })() : 'Data não informada';

  // Rótulo do período
  const getPeriodBadge = (period: string) => {
    switch (period) {
      case '1':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30">1º Bimestre / Período</Badge>;
      case '2':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">2º Bimestre / Período</Badge>;
      case '3':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">3º Bimestre / Período</Badge>;
      case '4':
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30">4º Bimestre / Período</Badge>;
      default:
        return null;
    }
  };

  // Rótulo do tipo de avaliação
  const getEvaluationBadge = (evalType: string) => {
    switch (evalType) {
      case 'parcial':
        return (
          <Badge className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1">
            <Award className="w-3 h-3" />
            Avaliação Parcial (AV1)
          </Badge>
        );
      case 'global':
        return (
          <Badge className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1">
            <Award className="w-3 h-3" />
            Avaliação Global (AV2)
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        ref={containerRef}
        className={`max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-background border shadow-2xl ${
          isFullscreen ? 'w-screen h-screen max-w-none max-h-none rounded-none' : ''
        }`}
      >
        {/* Barra Flutuante de Marca-Texto */}
        <TextHighlightToolbar
          position={highlightToolbar?.position || null}
          isBelow={highlightToolbar?.isBelow}
          selectedText={highlightToolbar?.selectedText}
          isExistingMark={highlightToolbar?.isExistingMark}
          activeColorId={highlightToolbar?.markColorId || activeColorId}
          onApplyColor={handleApplyColor}
          onRemoveHighlight={handleRemoveHighlight}
          onCopyText={handleCopySelectedText}
          onClose={() => setHighlightToolbar(null)}
        />

        {/* Cabeçalho */}
        <DialogHeader className="p-6 pb-4 border-b bg-gradient-to-r from-card via-muted/30 to-card flex-shrink-0">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center flex-wrap gap-2">
                <Badge variant="secondary" className="font-bold text-xs bg-primary/10 text-primary border-primary/20">
                  Aula #{lesson.order_index || 1}
                </Badge>
                {getPeriodBadge(lesson.period)}
                {getEvaluationBadge(lesson.evaluation_type)}
                {lesson.is_completed ? (
                  <Badge className="bg-green-600 text-white hover:bg-green-700 flex items-center gap-1 text-xs">
                    <CheckCircle2 className="w-3 h-3" />
                    Realizada
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground border-dashed flex items-center gap-1 text-xs">
                    <Clock className="w-3 h-3" />
                    Agendada / Pendente
                  </Badge>
                )}
                {isTeacher && lesson.lesson_plan && (
                  <Badge variant="outline" className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 flex items-center gap-1 text-xs">
                    <ClipboardList className="w-3 h-3" />
                    Plano Docente Cadastrado
                  </Badge>
                )}
              </div>

              <DialogTitle className="text-2xl font-extrabold tracking-tight text-foreground pt-1">
                {lesson.title}
              </DialogTitle>

              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-0.5">
                {subjectName && (
                  <span className="font-semibold text-foreground/80 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-primary" />
                    {subjectName}
                  </span>
                )}
                <span className="capitalize flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  {formattedDate}
                </span>
              </div>
            </div>

            {/* Ações de topo */}
            <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap">
              {/* Ferramenta Marca-Texto */}
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    title="Ferramenta Marca-Texto (destacar trechos importantes)"
                    className={`h-8 text-xs gap-1.5 transition-all ${
                      highlightsCount > 0 
                        ? 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-500/40 font-semibold' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Highlighter className="w-3.5 h-3.5 text-yellow-500" />
                    <span className="hidden sm:inline">Marca-Texto</span>
                    {highlightsCount > 0 && (
                      <Badge className="h-4 px-1.5 text-[10px] bg-yellow-500 text-yellow-950 font-black hover:bg-yellow-500">
                        {highlightsCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-3 text-xs space-y-3" align="end">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-1.5 font-bold text-foreground">
                      <Highlighter className="w-4 h-4 text-yellow-500" />
                      <span>Marca-Texto de Estudo</span>
                    </div>
                    {highlightsCount > 0 && (
                      <Badge variant="secondary" className="text-[10px]">
                        {highlightsCount} {highlightsCount === 1 ? 'destaque' : 'destaques'}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Selecione qualquer trecho de texto no conteúdo para destacar com suas cores favoritas.
                    </p>
                    
                    {/* Seletor de cor padrão */}
                    <div className="pt-1">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                        Cor Padrão
                      </span>
                      <div className="flex items-center gap-2">
                        {HIGHLIGHT_COLORS.map((color) => (
                          <button
                            key={color.id}
                            type="button"
                            onClick={() => {
                              setActiveColorId(color.id);
                              toast({ title: `Cor padrão alterada para ${color.name}` });
                            }}
                            style={{ backgroundColor: color.lightBg }}
                            className={`w-6 h-6 rounded-full border transition-all duration-150 flex items-center justify-center ${
                              activeColorId === color.id
                                ? 'ring-2 ring-primary ring-offset-1 border-primary scale-110 shadow-xs'
                                : 'border-black/10 dark:border-white/20 hover:scale-105'
                            }`}
                            title={`Definir ${color.name} como padrão`}
                          >
                            {activeColorId === color.id && (
                              <div 
                                className="w-2.5 h-2.5 rounded-full" 
                                style={{ backgroundColor: color.borderColor }} 
                              />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {highlightsCount > 0 ? (
                    <div className="pt-2 border-t flex items-center justify-between gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClearAllHighlights}
                        className="w-full text-xs text-destructive hover:bg-destructive/10 h-7 gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Limpar todos os destaques
                      </Button>
                    </div>
                  ) : (
                    <div className="pt-1 border-t text-[10px] text-muted-foreground italic flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-primary" />
                      Dica: Os destaques ficam salvos no seu navegador.
                    </div>
                  )}
                </PopoverContent>
              </Popover>

              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                title="Exportar Aula em PDF / Imprimir"
                className="h-8 text-xs gap-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/30"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Exportar PDF</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                title="Copiar texto da aula"
                className="h-8 text-xs gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar'}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                title={isFullscreen ? "Sair da tela cheia" : "Modo Tela Cheia"}
                className="h-8 w-8 p-0"
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>

          {/* Abas de Navegação quando for Professor */}
          {isTeacher && (
            <div className="mt-4 pt-3 border-t flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('content')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'content'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Conteúdo da Aula
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('plan')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'plan'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50'
                  }`}
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span>Plano de Aula (Docente)</span>
                  <Lock className="w-2.5 h-2.5 opacity-70" />
                </button>
              </div>

              {activeTab === 'plan' && (
                <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Exclusivo para o Professor</span>
                </div>
              )}
            </div>
          )}

          {/* Barra de Recursos Extras & Materiais da Aula (Apenas na aba de Conteúdo) */}
          {activeTab === 'content' && (lesson.pdf_url || lesson.presentation_url || lesson.video_url) && (
            <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between flex-wrap gap-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Link2 className="w-3.5 h-3.5 text-primary" />
                <span>Materiais Complementares:</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {lesson.pdf_url && (
                  <a
                    href={lesson.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 hover:bg-red-500/20 hover:scale-[1.02] transition-all shadow-xs"
                  >
                    <FileText className="w-4 h-4 text-red-500" />
                    Abrir Material (PDF)
                    <ExternalLink className="w-3 h-3 opacity-70 ml-0.5" />
                  </a>
                )}

                {lesson.presentation_url && (
                  <a
                    href={lesson.presentation_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 hover:scale-[1.02] transition-all shadow-xs"
                  >
                    <Presentation className="w-4 h-4 text-amber-500" />
                    Abrir Slides / Apresentação
                    <ExternalLink className="w-3 h-3 opacity-70 ml-0.5" />
                  </a>
                )}

                {lesson.video_url && (
                  <a
                    href={lesson.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30 hover:bg-purple-500/20 hover:scale-[1.02] transition-all shadow-xs"
                  >
                    <Video className="w-4 h-4 text-purple-500" />
                    Assistir Videoaula
                    <ExternalLink className="w-3 h-3 opacity-70 ml-0.5" />
                  </a>
                )}
              </div>
            </div>
          )}
        </DialogHeader>

        {/* Conteúdo Renderizado da Aula ou do Plano */}
        <div 
          ref={contentContainerRef}
          className="flex-1 overflow-y-auto p-6 md:p-8 bg-card/40 relative selection:bg-primary/20"
          onMouseUp={handleMouseUp}
          onTouchEnd={handleMouseUp}
          onClick={handleContainerClick}
        >
          {activeTab === 'plan' ? (
            defaultPlanHtml ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                      Plano de Aula & Roteiro Pedagógico do Professor
                      <Badge className="bg-indigo-600 text-white text-[10px] h-4">Docente</Badge>
                    </h4>
                    <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80 mt-0.5">
                      Estrutura de objetivos didáticos, metodologia de aplicação em sala de aula, recursos necessários e critérios de avaliação.
                    </p>
                  </div>
                </div>

                <div 
                  className="markdown-rendered prose prose-slate dark:prose-invert max-w-none text-foreground leading-relaxed break-words pt-2"
                  dangerouslySetInnerHTML={{ __html: currentHtml || defaultPlanHtml }}
                />
              </div>
            ) : (
              /* Empty State do Plano de Aula */
              <div className="text-center py-16 px-4 space-y-4 max-w-md mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                  <ClipboardList className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-foreground">Nenhum Plano de Aula cadastrado</h3>
                  <p className="text-xs text-muted-foreground">
                    Você pode cadastrar os objetivos pedagógicos, recursos e anotações didáticas que ficam salvos exclusivamente para a gestão docente.
                  </p>
                </div>
                {onEdit && (
                  <Button
                    onClick={() => {
                      onClose();
                      onEdit(lesson);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs gap-1.5 shadow"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Cadastrar Plano de Aula
                  </Button>
                )}
              </div>
            )
          ) : (
            <div 
              className="markdown-rendered prose prose-slate dark:prose-invert max-w-none text-foreground leading-relaxed break-words"
              dangerouslySetInnerHTML={{ __html: currentHtml || defaultContentHtml }}
            />
          )}
        </div>

        {/* Rodapé */}
        <DialogFooter className="p-4 px-6 border-t bg-muted/20 flex-shrink-0 flex items-center justify-between flex-wrap gap-2">
          {/* Ações do Professor */}
          {isTeacher ? (
            <div className="flex items-center gap-2">
              {onToggleCompleted && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onToggleCompleted(String(lesson.id), !lesson.is_completed)}
                  className={`text-xs gap-1.5 ${lesson.is_completed ? 'text-amber-600 hover:bg-amber-500/10' : 'text-green-600 hover:bg-green-500/10'}`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {lesson.is_completed ? 'Marcar como Pendente' : 'Marcar como Realizada'}
                </Button>
              )}
              {onEdit && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onEdit(lesson);
                  }}
                  className="text-xs gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5 text-blue-500" />
                  Editar Aula
                </Button>
              )}
              {onDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (window.confirm('Tem certeza que deseja excluir esta aula?')) {
                      onClose();
                      onDelete(String(lesson.id));
                    }
                  }}
                  className="text-xs gap-1.5 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Excluir
                </Button>
              )}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Bons estudos! Use o marca-texto para destacar pontos-chave do conteúdo.
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-xs gap-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/30"
            >
              <Printer className="w-3.5 h-3.5" />
              Exportar PDF
            </Button>

            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={onClose}
              className="min-w-[90px]"
            >
              Fechar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
