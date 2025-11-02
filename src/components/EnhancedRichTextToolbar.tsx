import { Button } from '@/components/ui/button';
import AdvancedColorPicker from '@/components/ui/advanced-color-picker';
import { 
  Bold, 
  Italic, 
  Underline, 
  List,
  ListOrdered, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Quote,
  Code,
  Link,
  Image,
  FileText,
  Minus,
  Plus,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Eraser,
  Table,
  Strikethrough,
  Indent,
  Outdent
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface EnhancedRichTextToolbarProps {
  onFormat: (command: string, value?: string) => void;
  className?: string;
}

export default function EnhancedRichTextToolbar({ onFormat, className }: EnhancedRichTextToolbarProps) {
  const [activeStyles, setActiveStyles] = useState<Record<string, boolean>>({});
  const [isInTable, setIsInTable] = useState(false);
  const [currentTextColor, setCurrentTextColor] = useState('#000000');
  const [currentBgColor, setCurrentBgColor] = useState('transparent');
  const [recentColors, setRecentColors] = useState<string[]>([]);

  const handleFormat = (command: string, value?: string) => {
    onFormat(command, value);
    setTimeout(() => updateActiveStyles(), 0);
  };

  const updateActiveStyles = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const element = range.commonAncestorContainer.parentElement || range.commonAncestorContainer as HTMLElement;
    
    const isInUnorderedList = element?.closest('ul') !== null;
    const isInOrderedList = element?.closest('ol') !== null;
    const isInsideTable = element?.closest('table') !== null;
    
    setIsInTable(isInsideTable);
    
    // Detectar cores atuais
    const computedStyle = window.getComputedStyle(element);
    const textColor = computedStyle.color;
    const bgColor = computedStyle.backgroundColor;
    
    // Converter RGB para HEX se necessário
    if (textColor && textColor.startsWith('rgb')) {
      setCurrentTextColor(rgbToHex(textColor));
    }
    if (bgColor && bgColor.startsWith('rgb')) {
      setCurrentBgColor(rgbToHex(bgColor));
    }
    
    const newActiveStyles: Record<string, boolean> = {
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikeThrough: document.queryCommandState('strikeThrough'),
      h1: element?.nodeName === 'H1',
      h2: element?.nodeName === 'H2',
      h3: element?.nodeName === 'H3',
      blockquote: element?.nodeName === 'BLOCKQUOTE',
      code: element?.nodeName === 'CODE' || element?.nodeName === 'PRE',
      insertUnorderedList: isInUnorderedList,
      insertOrderedList: isInOrderedList,
    };
    
    setActiveStyles(newActiveStyles);
  };

  // Função para converter RGB para HEX
  const rgbToHex = (rgb: string): string => {
    const result = rgb.match(/\d+/g);
    if (!result || result.length < 3) return '#000000';
    
    const r = parseInt(result[0]);
    const g = parseInt(result[1]);
    const b = parseInt(result[2]);
    
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  // Handlers para cores melhorados
  const handleTextColorChange = (color: string) => {
    setCurrentTextColor(color);
    if (color === 'transparent') {
      handleFormat('removeFormat');
    } else {
      handleFormat('styleWithCSS', 'true');
      handleFormat('foreColor', color);
    }
    addToRecentColors(color);
  };

  const handleBackgroundColorChange = (color: string) => {
    setCurrentBgColor(color);
    if (color === 'transparent') {
      handleFormat('styleWithCSS', 'true');
      handleFormat('backColor', 'transparent');
    } else {
      handleFormat('styleWithCSS', 'true');
      handleFormat('backColor', color);
    }
    addToRecentColors(color);
  };

  const handleCellBackgroundColor = (color: string) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const element = range.commonAncestorContainer.parentElement || range.commonAncestorContainer as HTMLElement;
      const cell = element?.closest('td, th') as HTMLElement;
      
      if (cell) {
        if (color === 'transparent') {
          cell.style.backgroundColor = '';
        } else {
          cell.style.backgroundColor = color;
        }
        addToRecentColors(color);
      }
    }
  };

  const addToRecentColors = (color: string) => {
    if (color === 'transparent') return;
    
    setRecentColors(prev => {
      const filtered = prev.filter(c => c !== color);
      return [color, ...filtered].slice(0, 8); // Manter apenas 8 cores recentes
    });
  };

  // Outros handlers (mantidos do código original)
  const handleLink = () => handleFormat('createLink');
  const handleImage = () => handleFormat('insertImage');
  const handleTable = () => handleFormat('insertTable');
  
  const handleBlockquote = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const element = range.commonAncestorContainer.parentElement;
      
      if (element?.closest('blockquote')) {
        handleFormat('outdent');
      } else {
        handleFormat('formatBlock', 'blockquote');
      }
    }
  };

  const handleCode = () => {
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      const codeHTML = `<code style="background-color: #f1f5f9; padding: 2px 4px; border-radius: 3px; font-family: monospace;">${selection.toString()}</code>`;
      handleFormat('insertHTML', codeHTML);
    }
  };

  const handleHeading = (level: string) => {
    handleFormat('formatBlock', `h${level}`);
  };

  const handleFontSize = (action: 'increase' | 'decrease') => {
    if (action === 'increase') {
      handleFormat('fontSize', '4');
    } else {
      handleFormat('fontSize', '2');
    }
  };

  useEffect(() => {
    const handleSelectionChange = () => {
      updateActiveStyles();
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  const toolbarItems = [
    { command: 'undo', icon: Undo, tooltip: 'Desfazer (Ctrl+Z)', customHandler: () => handleFormat('undo') },
    { command: 'redo', icon: Redo, tooltip: 'Refazer (Ctrl+Y)', customHandler: () => handleFormat('redo') },
    { command: 'removeFormat', icon: Eraser, tooltip: 'Remover formatação', customHandler: () => handleFormat('removeFormat') },
    { separator: true },
    { command: 'bold', icon: Bold, tooltip: 'Negrito (Ctrl+B)', isActive: activeStyles.bold },
    { command: 'italic', icon: Italic, tooltip: 'Itálico (Ctrl+I)', isActive: activeStyles.italic },
    { command: 'underline', icon: Underline, tooltip: 'Sublinhado (Ctrl+U)', isActive: activeStyles.underline },
    { command: 'strikeThrough', icon: Strikethrough, tooltip: 'Tachado', isActive: activeStyles.strikeThrough },
    { separator: true },
    { command: 'fontSizeIncrease', value: 'larger', icon: Plus, tooltip: 'Aumentar fonte', customHandler: () => handleFontSize('increase') },
    { command: 'fontSizeDecrease', value: 'smaller', icon: Minus, tooltip: 'Diminuir fonte', customHandler: () => handleFontSize('decrease') },
    { separator: true },
    { command: 'heading1', icon: Heading1, tooltip: 'Título 1', customHandler: () => handleHeading('1'), isActive: activeStyles.h1 },
    { command: 'heading2', icon: Heading2, tooltip: 'Título 2', customHandler: () => handleHeading('2'), isActive: activeStyles.h2 },
    { command: 'heading3', icon: Heading3, tooltip: 'Título 3', customHandler: () => handleHeading('3'), isActive: activeStyles.h3 },
    { separator: true },
    { command: 'justifyLeft', icon: AlignLeft, tooltip: 'Alinhar à esquerda' },
    { command: 'justifyCenter', icon: AlignCenter, tooltip: 'Centralizar' },
    { command: 'justifyRight', icon: AlignRight, tooltip: 'Alinhar à direita' },
    { separator: true },
    { command: 'insertUnorderedList', icon: List, tooltip: 'Lista com marcadores', isActive: activeStyles.insertUnorderedList },
    { command: 'insertOrderedList', icon: ListOrdered, tooltip: 'Lista numerada', isActive: activeStyles.insertOrderedList },
    { command: 'indent', icon: Indent, tooltip: 'Aumentar nível' },
    { command: 'outdent', icon: Outdent, tooltip: 'Diminuir nível' },
    { separator: true },
    { command: 'blockquote', icon: Quote, tooltip: 'Citação', customHandler: handleBlockquote, isActive: activeStyles.blockquote },
    { command: 'code', icon: Code, tooltip: 'Código', customHandler: handleCode, isActive: activeStyles.code },
    { separator: true },
    { command: 'insertTable', icon: Table, tooltip: 'Inserir tabela', customHandler: handleTable },
    { separator: true },
    { command: 'createLink', icon: Link, tooltip: 'Inserir link' },
    { command: 'insertImage', icon: Image, tooltip: 'Inserir imagem' },
    { command: 'insertHorizontalRule', icon: FileText, tooltip: 'Linha horizontal' },
  ];

  return (
    <div className={`flex flex-wrap items-center gap-1 p-2 bg-muted border rounded-t-lg ${className}`}>
      {/* Ferramentas regulares */}
      {toolbarItems.map((item, index) => {
        if ('separator' in item) {
          return (
            <div key={index} className="w-px h-6 bg-border mx-1" />
          );
        }
        
        const { command, icon: Icon, tooltip, value, customHandler, isActive } = item as any;
        const isActiveState = isActive || false;
        
        return (
          <Button
            key={command}
            variant={isActiveState ? "default" : "outline"}
            size="sm"
            className={`h-8 w-8 p-1 ${isActiveState ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
            onClick={() => {
              if (customHandler) {
                customHandler();
              } else if (command === 'createLink') {
                handleLink();
              } else if (command === 'insertImage') {
                handleImage();
              } else {
                handleFormat(command, value);
              }
            }}
            title={tooltip}
          >
            <Icon className="w-4 h-4" />
          </Button>
        );
      })}

      {/* Separador para cores */}
      <div className="w-px h-6 bg-border mx-1" />

      {/* Seletores de cor melhorados */}
      <div className="flex items-center gap-1">
        <AdvancedColorPicker
          color={currentTextColor}
          onChange={handleTextColorChange}
          title="Cor do texto"
          type="text"
          recentColors={recentColors}
          onRecentColorAdd={addToRecentColors}
          className="relative"
        />
        
        <AdvancedColorPicker
          color={currentBgColor}
          onChange={handleBackgroundColorChange}
          title="Cor de fundo do texto"
          type="background"
          recentColors={recentColors}
          onRecentColorAdd={addToRecentColors}
          className="relative"
        />

        {/* Cor de fundo da célula (apenas quando em tabela) */}
        {isInTable && (
          <AdvancedColorPicker
            color="transparent"
            onChange={handleCellBackgroundColor}
            title="Cor de fundo da célula"
            type="cell"
            recentColors={recentColors}
            onRecentColorAdd={addToRecentColors}
            className="relative"
          />
        )}
      </div>
    </div>
  );
}