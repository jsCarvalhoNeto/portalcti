import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import SimpleColorPicker from '@/components/ui/simple-color-picker';
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
  Rows,
  Columns,
  Strikethrough,
  Indent,
  Outdent,
  Trash2,
  Move,
  ArrowUpDown,
  ArrowLeftRight,
  X
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { supportedLanguages, detectLanguage, highlightCode } from '@/utils/syntaxHighlight';

interface RichTextToolbarProps {
  onFormat: (command: string, value?: string) => void;
  className?: string;
}

export default function RichTextToolbar({ onFormat, className }: RichTextToolbarProps) {
  const [activeStyles, setActiveStyles] = useState<Record<string, boolean>>({});
  const [isInTable, setIsInTable] = useState(false);
  const [currentTextColor, setCurrentTextColor] = useState('#000000');
  const [currentBgColor, setCurrentBgColor] = useState('transparent');
  const [isCodeDialogOpen, setIsCodeDialogOpen] = useState(false);
  const [codeConfig, setCodeConfig] = useState({ 
    code: '', 
    language: 'javascript',
    selectedText: ''
  });

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
    
    // Verificar se estamos dentro de uma lista
    const isInUnorderedList = element?.closest('ul') !== null;
    const isInOrderedList = element?.closest('ol') !== null;
    
    // Verificar se estamos dentro de uma tabela
    const isInsideTable = element?.closest('table') !== null;
    setIsInTable(isInsideTable);
    
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

  const handleLink = () => {
    // Usar dialog em vez de prompt
    handleFormat('createLink');
  };

  const handleImage = () => {
    // Usar dialog em vez de prompt
    handleFormat('insertImage');
  };

  // Handlers melhorados para cores
  const handleTextColorChange = (color: string) => {
    setCurrentTextColor(color);
    if (color === 'transparent') {
      handleFormat('removeFormat');
    } else {
      handleFormat('styleWithCSS', 'true');
      handleFormat('foreColor', color);
    }
  };

  const handleBackgroundColorChange = (color: string) => {
    setCurrentBgColor(color);
    handleFormat('styleWithCSS', 'true');
    handleFormat('backColor', color === 'transparent' ? '' : color);
  };

  // Função pública para limpar todas as seleções
  const handleClearSelection = () => {
    clearPreviousSelection();
    
    // Limpar também a seleção do navegador
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }
    
    console.log('Todas as seleções foram limpas');
  };

  // Função auxiliar para limpar seleções anteriores
  const clearPreviousSelection = () => {
    // Limpar seleções de linha anteriores
    if ((window as any).selectedRowCells) {
      (window as any).selectedRowCells.forEach((cell: HTMLElement) => {
        cell.classList.remove('row-selected');
        cell.style.backgroundColor = '';
        cell.style.color = '';
      });
      (window as any).selectedRowCells = null;
    }
    
    // Limpar seleções de coluna anteriores
    if ((window as any).selectedColumnCells) {
      (window as any).selectedColumnCells.forEach((cell: HTMLElement) => {
        cell.classList.remove('column-selected');
        cell.style.backgroundColor = '';
        cell.style.color = '';
      });
      (window as any).selectedColumnCells = null;
    }
    
    // Limpar qualquer seleção individual de célula
    const table = document.querySelector('table');
    if (table) {
      const allCells = table.querySelectorAll('td, th') as NodeListOf<HTMLElement>;
      allCells.forEach((cell) => {
        cell.classList.remove('selected', 'row-selected', 'column-selected');
      });
    }
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
          // Limpar seleções anteriores
          clearPreviousSelection();
          
          const cells = row.querySelectorAll('td, th') as NodeListOf<HTMLElement>;
          
          // Criar uma seleção que abrange toda a linha
          const newRange = document.createRange();
          const firstCell = cells[0];
          const lastCell = cells[cells.length - 1];
          
          if (firstCell && lastCell) {
            // Marcar como seleção programática
            (window as any).programmingSelection = true;
            
            // Definir o range do primeiro ao último caractere da linha
            newRange.setStartBefore(firstCell);
            newRange.setEndAfter(lastCell);
            
            // Aplicar a nova seleção
            selection.removeAllRanges();
            selection.addRange(newRange);
            
            // Aplicar estilo visual para indicar seleção da linha
            cells.forEach(cell => {
              cell.classList.add('row-selected');
              cell.style.backgroundColor = '#3b82f6 !important'; // Azul para indicar seleção ativa
              cell.style.color = 'white !important';
            });
            
            // Armazenar referência para limpeza posterior
            (window as any).selectedRowCells = Array.from(cells);
            
            // Resetar flag após um tempo
            setTimeout(() => {
              (window as any).programmingSelection = false;
            }, 200);
            
            console.log('Linha selecionada:', cells.length, 'células');
          }
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
          // Limpar seleções anteriores
          clearPreviousSelection();
          
          const columnIndex = Array.from(td.parentElement.children).indexOf(td);
          const rows = table.querySelectorAll('tr') as NodeListOf<HTMLElement>;
          const columnCells: HTMLElement[] = [];
          
          rows.forEach(row => {
            const cells = row.querySelectorAll('td, th') as NodeListOf<HTMLElement>;
            if (cells[columnIndex]) {
              columnCells.push(cells[columnIndex] as HTMLElement);
            }
          });
          
          if (columnCells.length > 0) {
            // Marcar como seleção programática
            (window as any).programmingSelection = true;
            
            // Criar seleção múltipla para todas as células da coluna
            const newRange = document.createRange();
            const firstCell = columnCells[0];
            const lastCell = columnCells[columnCells.length - 1];
            
            // Definir range da primeira à última célula da coluna
            newRange.setStartBefore(firstCell);
            newRange.setEndAfter(lastCell);
            
            // Aplicar a nova seleção
            selection.removeAllRanges();
            selection.addRange(newRange);
            
            // Aplicar estilo visual para indicar seleção da coluna
            columnCells.forEach(cell => {
              cell.classList.add('column-selected');
              cell.style.backgroundColor = '#10b981 !important'; // Verde para indicar seleção de coluna
              cell.style.color = 'white !important';
            });
            
            // Armazenar referência para limpeza posterior
            (window as any).selectedColumnCells = columnCells;
            
            // Resetar flag após um tempo
            setTimeout(() => {
              (window as any).programmingSelection = false;
            }, 200);
            
            console.log('Coluna selecionada:', columnCells.length, 'células');
          }
        }
      }
    }
  };



  // Funções avançadas de manipulação de tabelas
  const handleInsertRowAbove = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const element = range.commonAncestorContainer.parentElement || range.commonAncestorContainer as HTMLElement;
      const cell = element?.closest('td, th') as HTMLElement;
      
      if (cell) {
        const row = cell.closest('tr') as HTMLElement;
        const table = row?.closest('table') as HTMLElement;
        
        if (row && table) {
          const cellCount = row.children.length;
          const newRow = document.createElement('tr');
          
          for (let i = 0; i < cellCount; i++) {
            const newCell = document.createElement('td');
            newCell.contentEditable = 'true';
            newCell.setAttribute('dir', 'ltr');
            newCell.style.cssText = 'border: 1px solid #e2e8f0; padding: 12px; text-align: left; direction: ltr; min-width: 100px;';
            newCell.textContent = `Nova célula`;
            newRow.appendChild(newCell);
          }
          
          row.parentNode?.insertBefore(newRow, row);
          handleFormat('onChange', ''); // Notificar mudança
        }
      }
    }
  };

  const handleInsertRowBelow = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const element = range.commonAncestorContainer.parentElement || range.commonAncestorContainer as HTMLElement;
      const cell = element?.closest('td, th') as HTMLElement;
      
      if (cell) {
        const row = cell.closest('tr') as HTMLElement;
        const table = row?.closest('table') as HTMLElement;
        
        if (row && table) {
          const cellCount = row.children.length;
          const newRow = document.createElement('tr');
          
          for (let i = 0; i < cellCount; i++) {
            const newCell = document.createElement('td');
            newCell.contentEditable = 'true';
            newCell.setAttribute('dir', 'ltr');
            newCell.style.cssText = 'border: 1px solid #e2e8f0; padding: 12px; text-align: left; direction: ltr; min-width: 100px;';
            newCell.textContent = `Nova célula`;
            newRow.appendChild(newCell);
          }
          
          row.parentNode?.insertBefore(newRow, row.nextSibling);
          handleFormat('onChange', ''); // Notificar mudança
        }
      }
    }
  };

  const handleInsertColumnLeft = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const element = range.commonAncestorContainer.parentElement || range.commonAncestorContainer as HTMLElement;
      const cell = element?.closest('td, th') as HTMLElement;
      
      if (cell) {
        const table = cell.closest('table') as HTMLElement;
        const columnIndex = Array.from(cell.parentElement!.children).indexOf(cell);
        
        if (table) {
          const rows = table.querySelectorAll('tr');
          rows.forEach((row, rowIndex) => {
            const newCell = document.createElement(rowIndex === 0 && row.querySelector('th') ? 'th' : 'td');
            newCell.contentEditable = 'true';
            newCell.setAttribute('dir', 'ltr');
            newCell.style.cssText = 'border: 1px solid #e2e8f0; padding: 12px; text-align: left; direction: ltr; min-width: 100px;';
            newCell.textContent = rowIndex === 0 && row.querySelector('th') ? `Novo cabeçalho` : `Nova célula`;
            
            const targetCell = row.children[columnIndex];
            row.insertBefore(newCell, targetCell);
          });
          
          handleFormat('onChange', ''); // Notificar mudança
        }
      }
    }
  };

  const handleInsertColumnRight = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const element = range.commonAncestorContainer.parentElement || range.commonAncestorContainer as HTMLElement;
      const cell = element?.closest('td, th') as HTMLElement;
      
      if (cell) {
        const table = cell.closest('table') as HTMLElement;
        const columnIndex = Array.from(cell.parentElement!.children).indexOf(cell);
        
        if (table) {
          const rows = table.querySelectorAll('tr');
          rows.forEach((row, rowIndex) => {
            const newCell = document.createElement(rowIndex === 0 && row.querySelector('th') ? 'th' : 'td');
            newCell.contentEditable = 'true';
            newCell.setAttribute('dir', 'ltr');
            newCell.style.cssText = 'border: 1px solid #e2e8f0; padding: 12px; text-align: left; direction: ltr; min-width: 100px;';
            newCell.textContent = rowIndex === 0 && row.querySelector('th') ? `Novo cabeçalho` : `Nova célula`;
            
            const targetCell = row.children[columnIndex + 1];
            if (targetCell) {
              row.insertBefore(newCell, targetCell);
            } else {
              row.appendChild(newCell);
            }
          });
          
          handleFormat('onChange', ''); // Notificar mudança
        }
      }
    }
  };

  const handleDeleteRow = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const element = range.commonAncestorContainer.parentElement || range.commonAncestorContainer as HTMLElement;
      const cell = element?.closest('td, th') as HTMLElement;
      
      if (cell) {
        const row = cell.closest('tr') as HTMLElement;
        const table = row?.closest('table') as HTMLElement;
        
        if (row && table && table.querySelectorAll('tr').length > 1) {
          row.remove();
          handleFormat('onChange', ''); // Notificar mudança
        }
      }
    }
  };

  const handleDeleteColumn = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const element = range.commonAncestorContainer.parentElement || range.commonAncestorContainer as HTMLElement;
      const cell = element?.closest('td, th') as HTMLElement;
      
      if (cell) {
        const table = cell.closest('table') as HTMLElement;
        const columnIndex = Array.from(cell.parentElement!.children).indexOf(cell);
        
        if (table) {
          const rows = table.querySelectorAll('tr');
          const firstRow = rows[0];
          
          // Verificar se há mais de uma coluna
          if (firstRow && firstRow.children.length > 1) {
            rows.forEach(row => {
              if (row.children[columnIndex]) {
                row.children[columnIndex].remove();
              }
            });
            
            handleFormat('onChange', ''); // Notificar mudança
          }
        }
      }
    }
  };

  const handleResizeColumn = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const element = range.commonAncestorContainer.parentElement || range.commonAncestorContainer as HTMLElement;
      const cell = element?.closest('td, th') as HTMLElement;
      
      if (cell) {
        const table = cell.closest('table') as HTMLElement;
        const columnIndex = Array.from(cell.parentElement!.children).indexOf(cell);
        
        if (table) {
          // Aplicar redimensionamento a todas as células da coluna
          const rows = table.querySelectorAll('tr');
          rows.forEach(row => {
            const targetCell = row.children[columnIndex] as HTMLElement;
            if (targetCell) {
              targetCell.style.minWidth = '100px';
              targetCell.style.maxWidth = '400px';
              targetCell.style.resize = 'horizontal';
              targetCell.style.overflow = 'auto';
              
              // Adicionar evento de redimensionamento
              targetCell.addEventListener('mousedown', (e) => {
                if (e.offsetX > targetCell.offsetWidth - 10) {
                  let startX = e.pageX;
                  let startWidth = parseInt(document.defaultView!.getComputedStyle(targetCell).width, 10);
                  
                  const doResize = (e: MouseEvent) => {
                    const width = startWidth + e.pageX - startX;
                    if (width >= 50 && width <= 500) {
                      targetCell.style.width = width + 'px';
                    }
                  };
                  
                  const stopResize = () => {
                    document.removeEventListener('mousemove', doResize);
                    document.removeEventListener('mouseup', stopResize);
                  };
                  
                  document.addEventListener('mousemove', doResize);
                  document.addEventListener('mouseup', stopResize);
                }
              });
              
              // Adicionar cursor quando hover na borda
              targetCell.addEventListener('mousemove', (e) => {
                if (e.offsetX > targetCell.offsetWidth - 10) {
                  targetCell.style.cursor = 'col-resize';
                } else {
                  targetCell.style.cursor = 'text';
                }
              });
            }
          });
          
          handleFormat('onChange', '');
        }
      }
    }
  };

  const handleFontSize = (type: 'increase' | 'decrease' | 'specific', size?: string) => {
    if (type === 'increase') {
      // Passar o comando para o editor avançado
      handleFormat('fontSize', 'increase');
    } else if (type === 'decrease') {
      // Passar o comando para o editor avançado
      handleFormat('fontSize', 'decrease');
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
    let selectedText = '';
    
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const element = range.commonAncestorContainer.parentElement || range.commonAncestorContainer as HTMLElement;
      const tagName = element?.nodeName;
      
      selectedText = selection.toString();
      
      if (tagName === 'PRE') {
        // Remover o code e voltar para parágrafo
        handleFormat('formatBlock', '<p>');
        return;
      }
    }

    // Detectar linguagem do texto selecionado (se houver)
    const detectedLang = selectedText ? detectLanguage(selectedText) : 'javascript';
    
    // Configurar o dialog com o texto selecionado
    setCodeConfig({
      code: selectedText,
      language: detectedLang,
      selectedText: selectedText
    });
    
    setIsCodeDialogOpen(true);
  };

  const handleTable = () => {
    // Usar dialog em vez de prompt
    handleFormat('insertTable');
  };

  const insertCodeBlock = () => {
    const { code, language } = codeConfig;
    if (!code.trim()) return;

    // Aplicar syntax highlighting ao código
    const highlightedCode = highlightCode(code, language);
    
    // Criar HTML do bloco de código com syntax highlighting
    const codeHTML = `
      <div class="code-block-container">
        <div class="language-toolbar">
          <span class="language-label">${supportedLanguages.find(l => l.code === language)?.name || language.toUpperCase()}</span>
        </div>
        <pre class="language-${language}"><code class="language-${language}" data-lang="${language}">${highlightedCode}</code></pre>
      </div>
      <p><br></p>
    `;

    // Inserir o código
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createRange().createContextualFragment(codeHTML));
    } else {
      // Se não há seleção, inserir no final
      document.execCommand('insertHTML', false, codeHTML);
    }

    // Notificar mudança
    setTimeout(() => {
      handleFormat('onChange', '');
    }, 10);

    // Fechar dialog e resetar configuração
    setIsCodeDialogOpen(false);
    setCodeConfig({ code: '', language: 'javascript', selectedText: '' });
  };

  useEffect(() => {
    // Adicionar listener para atualizar estilos ativos quando o editor mudar
    const handleSelectionChange = () => {
      updateActiveStyles();
      
      // Limpar seleções de linha/coluna se o usuário fez uma nova seleção normal
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const isNormalSelection = !range.collapsed;
        
        // Se há uma seleção normal e não é uma seleção de linha/coluna programática
        if (isNormalSelection && !(window as any).programmingSelection) {
          // Aguardar um pouco para não interferir com seleções programáticas
          setTimeout(() => {
            if (!(window as any).programmingSelection) {
              // Limpar apenas os estilos visuais, mantendo a seleção atual
              const rowCells = (window as any).selectedRowCells;
              const columnCells = (window as any).selectedColumnCells;
              
              if (rowCells) {
                rowCells.forEach((cell: HTMLElement) => {
                  cell.style.backgroundColor = '';
                  cell.style.color = '';
                  cell.classList.remove('row-selected');
                });
                (window as any).selectedRowCells = null;
              }
              
              if (columnCells) {
                columnCells.forEach((cell: HTMLElement) => {
                  cell.style.backgroundColor = '';
                  cell.style.color = '';
                  cell.classList.remove('column-selected');
                });
                (window as any).selectedColumnCells = null;
              }
            }
          }, 100);
        }
      }
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
    { command: 'clearSelection', 
      icon: X, 
      tooltip: 'Limpar seleção', 
      customHandler: handleClearSelection 
    },
    { separator: true },
    { command: 'createLink', icon: Link, tooltip: 'Inserir link' },
    { command: 'insertImage', icon: Image, tooltip: 'Inserir imagem' },
    { command: 'insertHorizontalRule', icon: FileText, tooltip: 'Linha horizontal' },
  ];

  // Botões específicos para manipulação de tabelas
  const tableToolbarItems = [
    { separator: true },
    { 
      command: 'insertRowAbove', 
      icon: ArrowUpDown, 
      tooltip: 'Inserir linha acima', 
      customHandler: handleInsertRowAbove 
    },
    { 
      command: 'insertRowBelow', 
      icon: ArrowUpDown, 
      tooltip: 'Inserir linha abaixo', 
      customHandler: handleInsertRowBelow 
    },
    { 
      command: 'insertColumnLeft', 
      icon: ArrowLeftRight, 
      tooltip: 'Inserir coluna à esquerda', 
      customHandler: handleInsertColumnLeft 
    },
    { 
      command: 'insertColumnRight', 
      icon: ArrowLeftRight, 
      tooltip: 'Inserir coluna à direita', 
      customHandler: handleInsertColumnRight 
    },
    { 
      command: 'deleteRow', 
      icon: Trash2, 
      tooltip: 'Excluir linha', 
      customHandler: handleDeleteRow 
    },
    { 
      command: 'deleteColumn', 
      icon: Trash2, 
      tooltip: 'Excluir coluna', 
      customHandler: handleDeleteColumn 
    },
    { 
      command: 'resizeColumn', 
      icon: Move, 
      tooltip: 'Redimensionar coluna', 
      customHandler: handleResizeColumn 
    },
  ];

  // Combinar itens da toolbar baseado no contexto
  const allToolbarItems = [...toolbarItems, ...(isInTable ? tableToolbarItems : [])];

  return (
    <div className={`flex flex-wrap items-center gap-1 p-2 bg-muted border rounded-t-lg ${className}`}>
      {allToolbarItems.map((item, index) => {
        if ('separator' in item) {
          return (
            <div key={index} className="w-px h-6 bg-border mx-1" />
          );
        }
        
        const { command, icon: Icon, tooltip, value, customHandler, isActive } = item as any;
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

      {/* Separador para cores */}
      <div className="w-px h-6 bg-border mx-1" />

      {/* Seletores de cor melhorados */}
      <SimpleColorPicker
        color={currentTextColor}
        onChange={handleTextColorChange}
        title="Cor do texto"
        size="sm"
      />
      
      <SimpleColorPicker
        color={currentBgColor}
        onChange={handleBackgroundColorChange}
        title="Cor de fundo do texto"
        size="sm"
      />

      {/* Cor de fundo da célula (apenas quando em tabela) */}
      {isInTable && (
        <SimpleColorPicker
          color="transparent"
          onChange={(color) => {
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
              }
            }
          }}
          title="Cor de fundo da célula"
          size="sm"
        />
      )}

      {/* Dialog para inserção de código */}
      <Dialog open={isCodeDialogOpen} onOpenChange={setIsCodeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Inserir Bloco de Código</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="codeLanguage">Linguagem de Programação</Label>
              <Select
                value={codeConfig.language}
                onValueChange={(value) => setCodeConfig(prev => ({ ...prev, language: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma linguagem" />
                </SelectTrigger>
                <SelectContent>
                  {supportedLanguages.map(lang => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="codeContent">Código</Label>
              <Textarea
                id="codeContent"
                value={codeConfig.code}
                onChange={(e) => setCodeConfig(prev => ({ ...prev, code: e.target.value }))}
                placeholder="Digite ou cole seu código aqui..."
                className="min-h-[200px] font-mono text-sm"
                style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, consolas, monospace' }}
              />
            </div>

            {/* Preview do syntax highlighting */}
            {codeConfig.code && (
              <div>
                <Label>Preview com Syntax Highlighting</Label>
                <div className="border rounded-md overflow-hidden">
                  <div className="language-toolbar">
                    <span className="language-label">
                      {supportedLanguages.find(l => l.code === codeConfig.language)?.name || codeConfig.language.toUpperCase()}
                    </span>
                  </div>
                  <pre className={`language-${codeConfig.language} max-h-48 overflow-auto`}>
                    <code 
                      className={`language-${codeConfig.language}`}
                      dangerouslySetInnerHTML={{ 
                        __html: highlightCode(codeConfig.code, codeConfig.language) 
                      }}
                    />
                  </pre>
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCodeDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={insertCodeBlock} disabled={!codeConfig.code.trim()}>
                Inserir Código
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
