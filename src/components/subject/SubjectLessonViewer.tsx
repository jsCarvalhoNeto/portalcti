import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Award, 
  Maximize2, 
  Minimize2, 
  Copy, 
  Check, 
  Edit, 
  Trash2, 
  Printer,
  Sparkles,
  Layers,
  FileText
} from 'lucide-react';
import { SubjectLesson } from '@/services/subjectLessonService';
import { markdownToHtml, sanitizeHtml } from '@/utils/markdownUtils';
import { useToast } from '@/hooks/use-toast';

interface SubjectLessonViewerProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: SubjectLesson | null;
  subjectName?: string;
  isTeacher?: boolean;
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
  onEdit,
  onDelete,
  onToggleCompleted
}: SubjectLessonViewerProps) {
  const { toast } = useToast();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const renderedHtml = useMemo(() => {
    if (!lesson || !lesson.content || !lesson.content.trim()) {
      return '<div class="text-center py-12 text-muted-foreground"><p class="text-base font-medium">Nenhum conteúdo textual registrado para esta aula ainda.</p><p class="text-xs mt-1">O professor disponibilizará as anotações e roteiro em breve.</p></div>';
    }
    return sanitizeHtml(markdownToHtml(lesson.content));
  }, [lesson]);

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
    if (!lesson?.content) return;
    navigator.clipboard.writeText(lesson.content);
    setCopied(true);
    toast({
      title: 'Copiado!',
      description: 'Conteúdo da aula copiado para a área de transferência.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
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
            <div className="flex items-center gap-1.5 flex-shrink-0">
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
        </DialogHeader>

        {/* Conteúdo Renderizado da Aula */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-card/40">
          <div 
            className="markdown-rendered prose prose-slate dark:prose-invert max-w-none text-foreground leading-relaxed break-words"
            dangerouslySetWarningContent={{ __html: renderedHtml }}
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
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
              Bons estudos! Revise este conteúdo com frequência.
            </div>
          )}

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onClose}
            className="min-w-[90px]"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
