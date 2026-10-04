import React from 'react';
import { 
  Target, 
  Users, 
  BookOpen, 
  Lightbulb, 
  Gamepad2, 
  CheckCircle, 
  HelpCircle, 
  Sparkles,
  Info,
  Clock,
  Trophy,
  Layers
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface FormattedSection {
  type: 'objective' | 'audience' | 'instructions' | 'gameplay' | 'rules' | 'tips' | 'general';
  title: string;
  icon: any;
  content: string[];
  accentColor: string;
  badgeBg: string;
  borderClass: string;
  bgClass: string;
}

// Chaves conhecidas de seções que professores e IAs costumam usar
const KNOWN_SECTION_KEYWORDS: { pattern: RegExp; type: FormattedSection['type']; defaultTitle: string }[] = [
  { 
    pattern: /(?:^|[.\n])\s*(?:🎯\s*)?(?:Objetivo(?:s)?(?:\s+Pedag[oó]gico(?:s)?)?|Objetivo(?:s)?\s+de\s+Aprendizagem|Finalidade)\s*[:\-–]/i, 
    type: 'objective', 
    defaultTitle: 'Objetivo Pedagógico' 
  },
  { 
    pattern: /(?:^|[.\n])\s*(?:👥\s*)?(?:P[úu]blico(?:-|\s+)Alvo|Destinat[aá]rios|Para\s+quem\s+[eé])\s*[:\-–]/i, 
    type: 'audience', 
    defaultTitle: 'Público-Alvo' 
  },
  { 
    pattern: /(?:^|[.\n])\s*(?:📋\s*)?(?:Orienta[cç][õo]es(?:\s+para\s+o\s+Aluno)?|Instru[cç][õo]es(?:\s+Gerais)?|Diretrizes)\s*[:\-–]/i, 
    type: 'instructions', 
    defaultTitle: 'Orientações para o Aluno' 
  },
  { 
    pattern: /(?:^|[.\n])\s*(?:🕹️\s*|🎮\s*)?(?:Como\s+Jogar|Como\s+Realizar|Como\s+Funciona|Passo\s+a\s+Passo|Mec[aâ]nica\s+do\s+Jogo)\s*[:\-–]/i, 
    type: 'gameplay', 
    defaultTitle: 'Como Realizar / Jogar' 
  },
  { 
    pattern: /(?:^|[.\n])\s*(?:⚖️\s*|📌\s*)?(?:Regras(?:\s+da\s+Atividade)?|Crit[eé]rios(?:\s+de\s+Avalia[cç][ãa]o)?|Pontua[cç][ãa]o|Requisitos)\s*[:\-–]/i, 
    type: 'rules', 
    defaultTitle: 'Regras e Critérios' 
  },
  { 
    pattern: /(?:^|[.\n])\s*(?:💡\s*)?(?:Dica(?:s)?|Observa[cç][ãa]o(?:s)?|Importante|Aten[cç][ãa]o|Nota)\s*[:\-–]/i, 
    type: 'tips', 
    defaultTitle: 'Dicas e Recomendações' 
  },
];

/**
 * Função utilitária para organizar e formatar textos que foram colados em linha única
 * adicionando quebras de linha e estrutura limpa de tópicos.
 */
export function autoFormatActivityText(text: string): string {
  if (!text || typeof text !== 'string') return '';

  let formatted = text.trim();

  // Substituir sequências de seções coladas por quebras de linha duplas
  const sectionsToBreak = [
    { regex: /([.!?])\s*(Objetivo(?:\s+Pedagógico)?\s*:)/gi, replacement: '$1\n\n🎯 **$2**\n' },
    { regex: /([.!?])\s*(Público(?:-|\s+)Alvo\s*:)/gi, replacement: '$1\n\n👥 **$2**\n' },
    { regex: /([.!?])\s*(Orientações(?:\s+para\s+o\s+Aluno)?\s*:)/gi, replacement: '$1\n\n📋 **$2**\n' },
    { regex: /([.!?])\s*(Como\s+(?:Jogar|Realizar|Funciona)\s*:)/gi, replacement: '$1\n\n🕹️ **$2**\n' },
    { regex: /([.!?])\s*(Regras(?:\s+do\s+Jogo)?\s*:)/gi, replacement: '$1\n\n📌 **$2**\n' },
    { regex: /([.!?])\s*(Dica(?:s)?|Observação\s*:)/gi, replacement: '$1\n\n💡 **$2**\n' },
    { regex: /([.!?])\s*(Passo\s+a\s+Passo\s*:)/gi, replacement: '$1\n\n🔢 **$2**\n' },
  ];

  // Caso o texto comece diretamente com a seção
  if (/^Objetivo(?:\s+Pedagógico)?\s*:/i.test(formatted) && !formatted.startsWith('🎯')) {
    formatted = formatted.replace(/^Objetivo(?:\s+Pedagógico)?\s*:/i, '🎯 **Objetivo Pedagógico:**\n');
  }

  for (const { regex, replacement } of sectionsToBreak) {
    formatted = formatted.replace(regex, replacement);
  }

  // Quebrar itens enumerados que estejam grudados (ex: "... 1. Primeiro passo. 2. Segundo passo")
  formatted = formatted.replace(/([.!?])\s*(\d+\.\s+)/g, '$1\n$2');

  // Quebrar marcadores com bullets ou hífens que estejam grudados
  formatted = formatted.replace(/([.!?])\s*([•\-*]\s+)/g, '$1\n$2');

  // Limpar quebras excessivas (mais de 2 seguidas)
  formatted = formatted.replace(/\n{3,}/g, '\n\n').trim();

  return formatted;
}

/**
 * Faz o parser do texto em seções ricas estruturadas para exibição visual
 */
export function parseDescriptionSections(rawText: string): FormattedSection[] {
  if (!rawText || !rawText.trim()) return [];

  const text = rawText.trim();
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Mapa de configurações visuais por tipo de seção
  const sectionConfig: Record<FormattedSection['type'], {
    icon: any;
    accentColor: string;
    badgeBg: string;
    borderClass: string;
    bgClass: string;
  }> = {
    objective: {
      icon: Target,
      accentColor: 'text-indigo-600 dark:text-indigo-400',
      badgeBg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      borderClass: 'border-indigo-200/80 dark:border-indigo-900/60',
      bgClass: 'bg-indigo-50/40 dark:bg-indigo-950/20'
    },
    audience: {
      icon: Users,
      accentColor: 'text-emerald-600 dark:text-emerald-400',
      badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      borderClass: 'border-emerald-200/80 dark:border-emerald-900/60',
      bgClass: 'bg-emerald-50/40 dark:bg-emerald-950/20'
    },
    instructions: {
      icon: BookOpen,
      accentColor: 'text-blue-600 dark:text-blue-400',
      badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      borderClass: 'border-blue-200/80 dark:border-blue-900/60',
      bgClass: 'bg-blue-50/40 dark:bg-blue-950/20'
    },
    gameplay: {
      icon: Gamepad2,
      accentColor: 'text-purple-600 dark:text-purple-400',
      badgeBg: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      borderClass: 'border-purple-200/80 dark:border-purple-900/60',
      bgClass: 'bg-purple-50/40 dark:bg-purple-950/20'
    },
    rules: {
      icon: CheckCircle,
      accentColor: 'text-sky-600 dark:text-sky-400',
      badgeBg: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800',
      borderClass: 'border-sky-200/80 dark:border-sky-900/60',
      bgClass: 'bg-sky-50/40 dark:bg-sky-950/20'
    },
    tips: {
      icon: Lightbulb,
      accentColor: 'text-amber-600 dark:text-amber-400',
      badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      borderClass: 'border-amber-200/80 dark:border-amber-900/60',
      bgClass: 'bg-amber-50/40 dark:bg-amber-950/20'
    },
    general: {
      icon: Info,
      accentColor: 'text-slate-600 dark:text-slate-400',
      badgeBg: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      borderClass: 'border-border/70',
      bgClass: 'bg-card'
    }
  };

  // Se o texto estiver compactado em parágrafo único com delimitadores como "Objetivo: ... Público Alvo: ...",
  // vamos primeiro passar pelo formatador para criar as quebras limpas
  const normalizedText = autoFormatActivityText(rawText);
  const normalizedLines = normalizedText.split('\n').map(l => l.trim()).filter(Boolean);

  const sections: FormattedSection[] = [];
  let currentSection: FormattedSection = {
    type: 'general',
    title: 'Visão Geral',
    ...sectionConfig.general,
    content: []
  };

  const isHeaderLine = (line: string): { type: FormattedSection['type']; title: string; remainderText?: string } | null => {
    // Remover emojis e asteriscos para teste de correspondência
    const cleanLine = line.replace(/^[🎯👥📋🕹️🎮⚖️📌💡🔢✨\s*#]+/, '').trim();

    for (const kw of KNOWN_SECTION_KEYWORDS) {
      if (kw.pattern.test(line) || kw.pattern.test(cleanLine)) {
        // Extrair o título e o restante da linha caso haja conteúdo na mesma linha
        const splitIndex = line.indexOf(':');
        let headerTitle = kw.defaultTitle;
        let remainder = '';

        if (splitIndex !== -1) {
          const rawHeader = line.substring(0, splitIndex).replace(/[#*🎯👥📋🕹️🎮⚖️📌💡🔢✨]/g, '').trim();
          if (rawHeader.length > 2 && rawHeader.length < 50) {
            headerTitle = rawHeader;
          }
          remainder = line.substring(splitIndex + 1).trim();
        }

        return { type: kw.type, title: headerTitle, remainderText: remainder };
      }
    }
    return null;
  };

  for (const line of normalizedLines) {
    const headerMatch = isHeaderLine(line);

    if (headerMatch) {
      // Se a seção anterior tiver conteúdo, salvamos
      if (currentSection.content.length > 0) {
        sections.push(currentSection);
      }

      currentSection = {
        type: headerMatch.type,
        title: headerMatch.title,
        ...sectionConfig[headerMatch.type],
        content: headerMatch.remainderText ? [headerMatch.remainderText] : []
      };
    } else {
      currentSection.content.push(line);
    }
  }

  if (currentSection.content.length > 0) {
    sections.push(currentSection);
  }

  // Se não foi encontrada nenhuma seção específica identificável, retornar seção geral
  if (sections.length === 0 && text) {
    return [{
      type: 'general',
      title: 'Orientações da Atividade',
      ...sectionConfig.instructions,
      content: normalizedLines
    }];
  }

  return sections;
}

/**
 * Componente principal para exibição de texto formatado com alto contraste e legibilidade
 */
export default function InteractiveActivityDescription({
  content,
  className = '',
  variant = 'full',
  onOpenDetails
}: {
  content?: string | null;
  className?: string;
  variant?: 'full' | 'compact' | 'card';
  onOpenDetails?: () => void;
}) {
  if (!content || !content.trim()) {
    return (
      <p className="text-xs text-muted-foreground italic">
        Nenhuma orientação ou descrição cadastrada para esta atividade.
      </p>
    );
  }

  const sections = parseDescriptionSections(content);

  // Variante Compacta para Cards de Atividades
  if (variant === 'compact' || variant === 'card') {
    // Pegar o objetivo ou a primeira linha significativa
    const firstSection = sections[0];
    const previewText = firstSection?.content[0] || content;

    return (
      <div className={`space-y-2 ${className}`}>
        {/* Chips de tópicos detectados para rápida identificação pelo estudante */}
        {sections.length > 1 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {sections.slice(0, 3).map((sec, idx) => {
              const Icon = sec.icon;
              return (
                <span
                  key={idx}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${sec.badgeBg}`}
                >
                  <Icon className="w-3 h-3 shrink-0" />
                  <span className="truncate max-w-[130px]">{sec.title}</span>
                </span>
              );
            })}
            {sections.length > 3 && (
              <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 font-medium">
                +{sections.length - 3} tópicos
              </span>
            )}
          </div>
        )}

        {/* Texto resumido com suporte a quebras limpas */}
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
          {previewText}
        </p>

        {/* Botão de expansão / detalhes */}
        {onOpenDetails && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails();
            }}
            className="text-xs font-semibold text-primary hover:text-primary/80 inline-flex items-center gap-1 hover:underline transition-all pt-0.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Ver orientações completas</span>
          </button>
        )}
      </div>
    );
  }

  // Renderização Completa (Full) com cartões estruturados
  return (
    <div className={`space-y-3.5 ${className}`}>
      {sections.map((section, sIndex) => {
        const Icon = section.icon;

        return (
          <div 
            key={sIndex}
            className={`rounded-xl border p-3.5 sm:p-4 transition-all shadow-xs ${section.borderClass} ${section.bgClass}`}
          >
            {/* Cabeçalho da Seção */}
            <div className="flex items-center gap-2 mb-2.5">
              <div className={`p-1.5 rounded-lg border shadow-2xs ${section.badgeBg}`}>
                <Icon className="w-4 h-4 shrink-0" />
              </div>
              <h4 className={`text-sm font-bold tracking-tight ${section.accentColor}`}>
                {section.title}
              </h4>
            </div>

            {/* Conteúdo formatado da Seção */}
            <div className="space-y-2 pl-0.5 text-xs sm:text-sm text-foreground/90 leading-relaxed">
              {section.content.map((paragraph, pIndex) => {
                // Se a linha for um marcador de lista (•, -, *, ou números)
                const isBullet = /^[•\-*]\s+/.test(paragraph);
                const isNumbered = /^\d+\.\s+/.test(paragraph);

                if (isBullet || isNumbered) {
                  const cleanedText = paragraph.replace(/^[•\-*]\s+|\d+\.\s+/, '');
                  return (
                    <div key={pIndex} className="flex items-start gap-2.5 py-0.5">
                      <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-primary/70" />
                      <span className="font-normal">{cleanedText}</span>
                    </div>
                  );
                }

                return (
                  <p key={pIndex} className="font-normal text-muted-foreground/95 dark:text-slate-300">
                    {paragraph}
                  </p>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Modal Completo de Orientações e Instruções Pedagógicas para o Aluno
 */
export function InteractiveActivityGuideModal({
  isOpen,
  onClose,
  title,
  description,
  duration,
  points,
  difficulty,
  type
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  duration?: string;
  points?: number;
  difficulty?: string;
  type?: string;
}) {
  const getDifficultyLabel = (diff?: string) => {
    switch (diff) {
      case 'beginner': return { text: 'Iniciante', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' };
      case 'intermediate': return { text: 'Intermediário', color: 'bg-amber-500/10 text-amber-600 border-amber-500/30' };
      case 'advanced': return { text: 'Avançado', color: 'bg-rose-500/10 text-rose-600 border-rose-500/30' };
      default: return null;
    }
  };

  const diffInfo = getDifficultyLabel(difficulty);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[88vh] flex flex-col p-0 overflow-hidden shadow-2xl border bg-background">
        <DialogHeader className="p-5 pb-3 border-b bg-muted/40 shrink-0">
          <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Guia e Orientações da Atividade</span>
          </div>
          <DialogTitle className="text-xl font-bold text-foreground mt-1">
            {title}
          </DialogTitle>
          
          <div className="flex items-center gap-2 pt-2 flex-wrap">
            {diffInfo && (
              <Badge variant="outline" className={`text-xs ${diffInfo.color}`}>
                {diffInfo.text}
              </Badge>
            )}
            {duration && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-primary" />
                {duration}
              </span>
            )}
            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 flex items-center gap-1">
              <Trophy className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              +{points !== undefined ? points : 10} pontos de recompensa
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-5 overflow-y-auto max-h-[60vh]">
          <InteractiveActivityDescription 
            content={description} 
            variant="full" 
          />
        </ScrollArea>

        <DialogFooter className="p-4 border-t bg-muted/20 shrink-0 flex items-center justify-between sm:justify-end gap-2">
          <Button onClick={onClose} className="w-full sm:w-auto">
            Entendido, vamos lá! 🚀
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
