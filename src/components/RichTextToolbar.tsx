import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  Underline, 
  List,
  ListOrdered, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Type,
  Quote,
  Code,
  Link,
  Image,
  FileText,
  Palette,
  Square,
  Minus,
  Plus,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Eraser,
  Table,
  Rows,
  Columns,
  Strikethrough
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface RichTextToolbarProps {
  onFormat: (command: string, value?: string) => void;
  className?: string;
}

export default function RichTextToolbar({ onFormat, className }: RichTextToolbarProps) {
  const [activeStyles, setActiveStyles] = useState<Record<string, boolean>>({});

  const handleFormat = (command: string, value?: string) => {
    onFormat(command, value);
    // Atualizar estado de estilos ativos após execução do comando
    setTimeout(() => updateActiveStyles(), 0);
  };

  const updateActiveStyles = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const element = range.commonAncestorContainer.parentElement || range.commonAncestorContainer as HTMLElement;
    
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
    };
    
    setActiveStyles(newActiveStyles);
  };

  const handleLink = () => {
    const url = prompt('Digite o URL do link:');
    if (url) {
      handleFormat('createLink', url);
    }
  };

  const handleImage = () => {
    const url = prompt('Digite o URL da imagem:');
    if (url) {
      handleFormat('insertImage', url);
    }
  };

  const handleColor = (type: 'color' | 'background') => {
    // Abrir paleta de cores em vez de prompt
    const colorPicker = document.createElement('input');
    colorPicker.type = 'color';
    colorPicker.style.position = 'absolute';
    colorPicker.style.left = '-9999px';
    document.body.appendChild(colorPicker);
    
    colorPicker.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.value) {
        handleFormat('styleWithCSS', 'true');
        handleFormat(type === 'color' ? 'foreColor' : 'backColor', target.value);
      }
    });
    
    colorPicker.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.value) {
        handleFormat('styleWithCSS', 'true');
        handleFormat(type === 'color' ? 'foreColor' : 'backColor', target.value);
      }
      document.body.removeChild(colorPicker);
    });
    
    colorPicker.click();
  };

  const handleSelectRow = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const element = range.commonAncestorContainer.parentElement || range.commonAncestorContainer as HTMLElement;
      const td = element?.closest('td, th') as HTMLElement;
      
      if (td) {
        const row = td.closest('tr') as HTMLElement;
        if (row) {
          const cells = row.querySelectorAll('td, th') as NodeListOf<HTMLElement>;
          // Para selecionar visualmente a linha inteira, vamos aplicar uma cor de fundo temporária
          // que será removida quando o usuário selecionar outra coisa
          cells.forEach(cell => {
            cell.style.backgroundColor = '#e5e7eb'; // Cor de fundo temporária para indicar seleção
          });
          
          // Armazenar a referência das células selecionadas para futura manipulação
          (window as any).selectedRowCells = Array.from(cells);
        }
      }
    }
  };

  const handleSelectColumn = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const element = range.commonAncestorContainer.parentElement || range.commonAncestorContainer as HTMLElement;
      const td = element?.closest('td, th') as HTMLElement;
      
      if (td && td.parentElement) {
        const table = td.closest('table') as HTMLElement;
        if (table) {
          const columnIndex = Array.from(td.parentElement.children).indexOf(td);
          const rows = table.querySelectorAll('tr') as NodeListOf<HTMLElement>;
          const columnCells: HTMLElement[] = [];
          
          rows.forEach(row => {
            const cells = row.querySelectorAll('td, th') as NodeListOf<HTMLElement>;
            if (cells[columnIndex]) {
              columnCells.push(cells[columnIndex] as HTMLElement);
            }
          });
          
          // Aplicar cor de fundo temporária para indicar seleção da coluna
          columnCells.forEach(cell => {
            cell.style.backgroundColor = '#e5e7eb'; // Cor de fundo temporária para indicar seleção
          });
          
          // Armazenar a referência das células selecionadas para futura manipulação
          (window as any).selectedColumnCells = columnCells;
        }
      }
    }
  };

  const handleCellBackgroundColor = () => {
    const colorPicker = document.createElement('input');
    colorPicker.type = 'color';
    colorPicker.style.position = 'absolute';
    colorPicker.style.left = '-9999px';
    document.body.appendChild(colorPicker);
    
    colorPicker.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.value) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const startElement = range.startContainer.parentElement || range.startContainer as HTMLElement;
          const endElement = range.endContainer.parentElement || range.endContainer as HTMLElement;
          
          // Verificar se o intervalo seleciona múltiplas células
          const table = startElement?.closest('table') as HTMLElement;
          if (table) {
            // Verificar se há células de linha ou coluna selecionadas previamente
            const previouslySelectedCells = (window as any).selectedRowCells || (window as any).selectedColumnCells || [];
            if (previouslySelectedCells.length > 0) {
              // Aplicar cor de fundo às células previamente selecionadas
              previouslySelectedCells.forEach((cell: HTMLElement) => {
                cell.style.backgroundColor = target.value;
              });
              // Limpar seleção previamente armazenada
              (window as any).selectedRowCells = [];
              (window as any).selectedColumnCells = [];
            } else {
              // Lógica original para seleção de células individuais ou arrasto
              const allCells = table.querySelectorAll('td, th') as NodeListOf<HTMLElement>;
              const selectedCells: HTMLElement[] = [];
              
              // Para selecionar múltiplas células, o usuário pode usar Ctrl+clique ou arrastar
              // Vamos verificar se há múltiplas células no intervalo de seleção
              if (startElement && endElement && startElement !== endElement) {
                // Verificar se ambas as células estão na mesma tabela
                if (startElement.closest('table') === endElement.closest('table')) {
                  // Encontrar todas as células entre a célula inicial e final
                  let foundStart = false;
                  let foundEnd = false;
                  for (const cell of allCells) {
                    if (cell === startElement || cell === endElement) {
                      selectedCells.push(cell);
                      if (cell === startElement) foundStart = true;
                      if (cell === endElement) foundEnd = true;
                    } else if (foundStart && !foundEnd) {
                      selectedCells.push(cell);
                    } else if (foundEnd && !foundStart) {
                      selectedCells.push(cell);
                    }
                  }
                }
              } else if (startElement?.closest('td, th')) {
                // Se apenas uma célula está selecionada
                const singleCell = startElement.closest('td, th') as HTMLElement;
                selectedCells.push(singleCell);
              }
              
              if (selectedCells.length > 0) {
                // Aplicar cor de fundo a todas as células selecionadas
                selectedCells.forEach(cell => {
                  cell.style.backgroundColor = target.value;
                });
              } else {
                // Se nenhuma célula específica está selecionada, tentar aplicar à célula atual
                const currentCell = startElement?.closest('td, th') as HTMLElement;
                if (currentCell) {
                  currentCell.style.backgroundColor = target.value;
                } else {
                  // Se não estiver em uma célula, aplicar normalmente
                  handleFormat('styleWithCSS', 'true');
                  handleFormat('backColor', target.value);
                }
              }
            }
          } else {
            // Se não estiver em uma tabela, aplicar normalmente
            const currentCell = startElement?.closest('td, th') as HTMLElement;
            if (currentCell) {
              currentCell.style.backgroundColor = target.value;
            } else {
              handleFormat('styleWithCSS', 'true');
              handleFormat('backColor', target.value);
            }
          }
        }
      }
      document.body.removeChild(colorPicker);
    });
    
    colorPicker.click();
  };

  const handleFontSize = (type: 'increase' | 'decrease' | 'specific', size?: string) => {
    if (type === 'increase') {
      // Aumentar o tamanho da fonte em 2px
      handleFormat('styleWithCSS', 'true');
      handleFormat('fontSize', 'larger');
    } else if (type === 'decrease') {
      // Diminuir o tamanho da fonte em 2px
      handleFormat('styleWithCSS', 'true');
      handleFormat('fontSize', 'smaller');
    } else if (type === 'specific' && size) {
      // Aplicar tamanho específico de fonte
      handleFormat('styleWithCSS', 'true');
      handleFormat('fontSize', size);
    }
  };

  const handleHeading = (level: string) => {
    // Verificar se o bloco atual já é o heading desejado e remover se for
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const element = range.commonAncestorContainer.parentElement || range.commonAncestorContainer as HTMLElement;
      const tagName = element?.nodeName;
      
      if (tagName === `H${level}`) {
        // Remover o heading e voltar para parágrafo
        handleFormat('formatBlock', '<p>');
      } else {
        // Aplicar o heading
        handleFormat('formatBlock', `<h${level}>`);
      }
    } else {
      // Se não houver seleção, aplicar o heading
      handleFormat('formatBlock', `<h${level}>`);
    }
  };

  const handleBlockquote = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const element = range.commonAncestorContainer.parentElement || range.commonAncestorContainer as HTMLElement;
      const tagName = element?.nodeName;
      
      if (tagName === 'BLOCKQUOTE') {
        // Remover o blockquote e voltar para parágrafo
        handleFormat('formatBlock', '<p>');
      } else {
        // Aplicar o blockquote
        handleFormat('formatBlock', '<blockquote>');
      }
    } else {
      // Se não houver seleção, aplicar o blockquote
      handleFormat('formatBlock', '<blockquote>');
    }
  };

  const handleCode = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const element = range.commonAncestorContainer.parentElement || range.commonAncestorContainer as HTMLElement;
      const tagName = element?.nodeName;
      
      if (tagName === 'PRE') {
        // Remover o code e voltar para parágrafo
        handleFormat('formatBlock', '<p>');
      } else {
        // Aplicar o code
        handleFormat('formatBlock', '<pre>');
      }
    } else {
      // Se não houver seleção, aplicar o code
      handleFormat('formatBlock', '<pre>');
    }
  };

  const handleTable = () => {
    const rows = parseInt(prompt('Número de linhas:', '3') || '3');
    const cols = parseInt(prompt('Número de colunas:', '3') || '3');
    
    if (rows > 0 && cols > 0) {
      let tableHTML = '<table style="border-collapse: collapse; width: 100%; margin: 10px 0; table-layout: fixed;">';
      for (let i = 0; i < rows; i++) {
        tableHTML += '<tr>';
        for (let j = 0; j < cols; j++) {
          tableHTML += '<td style="border: 1px solid #ccc; padding: 8px; text-align: left; resize: horizontal; overflow: auto; min-width: 100px;">';
          tableHTML += `Célula ${i + 1}-${j + 1}`;
          tableHTML += '</td>';
        }
        tableHTML += '</tr>';
      }
      tableHTML += '</table>';
      
      // Inserir a tabela no editor
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const fragment = document.createElement('div');
        fragment.innerHTML = tableHTML;
        const tableElement = fragment.firstChild as HTMLElement;
        range.insertNode(tableElement);
        range.collapse(false);
      } else {
        // Se não houver seleção, inserir no final do editor
        handleFormat('insertHTML', tableHTML);
      }
    }
  };

  useEffect(() => {
    // Adicionar listener para atualizar estilos ativos quando o editor mudar
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
    { command: 'fontSize', value: 'larger', icon: Plus, tooltip: 'Aumentar fonte', customHandler: () => handleFontSize('increase') },
    { command: 'fontSize', value: 'smaller', icon: Minus, tooltip: 'Diminuir fonte', customHandler: () => handleFontSize('decrease') },
    { separator: true },
    { command: 'heading1', icon: Heading1, tooltip: 'Título 1', customHandler: () => handleHeading('1'), isActive: activeStyles.h1 },
    { command: 'heading2', icon: Heading2, tooltip: 'Título 2', customHandler: () => handleHeading('2'), isActive: activeStyles.h2 },
    { command: 'heading3', icon: Heading3, tooltip: 'Título 3', customHandler: () => handleHeading('3'), isActive: activeStyles.h3 },
    { separator: true },
    { command: 'justifyLeft', icon: AlignLeft, tooltip: 'Alinhar à esquerda' },
    { command: 'justifyCenter', icon: AlignCenter, tooltip: 'Centralizar' },
    { command: 'justifyRight', icon: AlignRight, tooltip: 'Alinhar à direita' },
    { separator: true },
    { command: 'insertUnorderedList', icon: List, tooltip: 'Lista com marcadores' },
    { command: 'insertOrderedList', icon: ListOrdered, tooltip: 'Lista numerada' },
    { separator: true },
    { command: 'blockquote', icon: Quote, tooltip: 'Citação', customHandler: handleBlockquote, isActive: activeStyles.blockquote },
    { command: 'code', icon: Code, tooltip: 'Código', customHandler: handleCode, isActive: activeStyles.code },
    { separator: true },
    { command: 'insertTable', icon: Table, tooltip: 'Inserir tabela', customHandler: handleTable },
    { separator: true },
    { command: 'selectRow', 
      icon: Rows, 
      tooltip: 'Selecionar linha inteira', 
      customHandler: handleSelectRow 
    },
    { command: 'selectColumn', 
      icon: Columns, 
      tooltip: 'Selecionar coluna inteira', 
      customHandler: handleSelectColumn 
    },
    { separator: true },
    { command: 'foreColor', 
      icon: Palette, 
      tooltip: 'Cor do texto', 
      customHandler: () => handleColor('color') 
    },
    { 
      command: 'backColor', 
      icon: Type, 
      tooltip: 'Cor de fundo do texto', 
      customHandler: () => handleColor('background') 
    },
    { 
      command: 'cellBackgroundColor', 
      icon: Square, 
      tooltip: 'Cor de fundo da célula', 
      customHandler: handleCellBackgroundColor 
    },
    { separator: true },
    { command: 'createLink', icon: Link, tooltip: 'Inserir link' },
    { command: 'insertImage', icon: Image, tooltip: 'Inserir imagem' },
    { command: 'insertHorizontalRule', icon: FileText, tooltip: 'Linha horizontal' },
  ];

  return (
    <div className={`flex flex-wrap items-center gap-1 p-2 bg-muted border rounded-t-lg ${className}`}>
      {toolbarItems.map((item, index) => {
        if ('separator' in item) {
          return (
            <div key={index} className="w-px h-6 bg-border mx-1" />
          );
        }
        
        const { command, icon: Icon, tooltip, value, customHandler, isActive } = item;
        const isActiveState = isActive || false;
        const isHeadingCommand = command.startsWith('heading');
        const isBlockCommand = ['blockquote', 'code'].includes(command);
        const isActiveFinal = isActiveState || (isHeadingCommand && activeStyles[command]) || (isBlockCommand && activeStyles[command?.replace('heading', '').toLowerCase()]);
        
        return (
          <Button
            key={command}
            variant={isActiveFinal ? "default" : "outline"}
            size="sm"
            className={`h-8 w-8 p-1 ${isActiveFinal ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
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
    </div>
  );
}
