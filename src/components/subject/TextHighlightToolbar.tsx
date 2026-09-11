import React from 'react';
import { 
  HIGHLIGHT_COLORS, 
  HighlightColor 
} from '@/utils/lessonHighlightUtils';
import { 
  Copy, 
  Trash2, 
  Check, 
  X,
  Highlighter
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TextHighlightToolbarProps {
  position: { top: number; left: number } | null;
  isBelow?: boolean;
  selectedText?: string;
  isExistingMark?: boolean;
  activeColorId?: string;
  onApplyColor: (colorId: string) => void;
  onRemoveHighlight?: () => void;
  onCopyText?: () => void;
  onClose: () => void;
}

export default function TextHighlightToolbar({
  position,
  isBelow = false,
  selectedText,
  isExistingMark = false,
  activeColorId,
  onApplyColor,
  onRemoveHighlight,
  onCopyText,
  onClose
}: TextHighlightToolbarProps) {
  const [copied, setCopied] = React.useState(false);

  if (!position) return null;

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onCopyText) {
      onCopyText();
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      className={`fixed -translate-x-1/2 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/95 dark:bg-card/95 backdrop-blur-md border border-border/80 shadow-2xl transition-all duration-150 animate-in fade-in zoom-in-95 select-none ${
        isBelow ? 'mt-2' : '-translate-y-full mb-2'
      }`}
      onMouseDown={(e) => {
        // Evita que a seleção de texto seja cancelada ao clicar na toolbar
        e.preventDefault();
      }}
    >
      <div className="flex items-center gap-1 pr-1 border-r border-border/60">
        <Highlighter className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider hidden sm:inline">
          {isExistingMark ? 'Cor' : 'Destacar'}
        </span>
      </div>

      {/* Bolinhas de Cores */}
      <div className="flex items-center gap-1.5 px-0.5">
        {HIGHLIGHT_COLORS.map((color: HighlightColor) => {
          const isSelected = activeColorId === color.id;
          return (
            <button
              key={color.id}
              type="button"
              title={`Marcar com ${color.name}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onApplyColor(color.id);
              }}
              style={{ backgroundColor: color.lightBg }}
              className={`w-5 h-5 rounded-full border transition-all duration-150 transform hover:scale-125 focus:outline-none flex items-center justify-center ${
                isSelected 
                  ? 'ring-2 ring-primary ring-offset-1 ring-offset-background scale-110 border-primary' 
                  : 'border-black/10 dark:border-white/20 hover:ring-1 hover:ring-foreground/30'
              }`}
            >
              {isSelected && (
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: color.borderColor }} 
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="w-[1px] h-4 bg-border/60 mx-0.5" />

      {/* Botão Copiar */}
      {onCopyText && (
        <button
          type="button"
          onClick={handleCopy}
          title="Copiar texto selecionado"
          className="h-6 px-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs font-medium transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-green-500" />
              <span className="text-[10px] text-green-600 font-bold">Copiado</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span className="text-[10px] hidden md:inline">Copiar</span>
            </>
          )}
        </button>
      )}

      {/* Botão Remover Destaque */}
      {isExistingMark && onRemoveHighlight && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemoveHighlight();
          }}
          title="Remover este destaque"
          className="h-6 px-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 text-xs font-medium transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          <span className="text-[10px] hidden md:inline">Remover</span>
        </button>
      )}

      {/* Botão Fechar */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }}
        title="Fechar"
        className="h-5 w-5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors ml-0.5"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
