import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import RichTextToolbar from './RichTextToolbar';

interface SimpleRichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  onImageUpload?: (file: File) => Promise<string>;
}

export default function SimpleRichTextEditor({
  content,
  onChange,
  placeholder = "Digite seu conteúdo aqui...",
  className = "",
  onImageUpload
}: SimpleRichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isTableDialogOpen, setIsTableDialogOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [tableConfig, setTableConfig] = useState({ rows: 3, cols: 3, hasHeader: true });
  const [linkConfig, setLinkConfig] = useState({ text: '', url: '', newTab: true });
  const [imageConfig, setImageConfig] = useState({ url: '', alt: '', width: '' });

  // Garantir direção LTR sempre
  const ensureLTR = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.dir = 'ltr';
      editorRef.current.setAttribute('dir', 'ltr');
      editorRef.current.style.direction = 'ltr';
      editorRef.current.style.unicodeBidi = 'plaintext';
      editorRef.current.style.textAlign = 'left';
      
      // Aplicar LTR a todos os headers no editor
      const headers = editorRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6');
      headers.forEach(header => {
        const headerElement = header as HTMLElement;
        headerElement.setAttribute('dir', 'ltr');
        headerElement.style.direction = 'ltr';
        headerElement.style.textAlign = 'left';
      });
      
      // Aplicar LTR a todas as listas
      const lists = editorRef.current.querySelectorAll('ul, ol');
      lists.forEach(list => {
        const listElement = list as HTMLElement;
        listElement.setAttribute('dir', 'ltr');
        listElement.style.direction = 'ltr';
        listElement.style.textAlign = 'left';
      });
      
      // Aplicar LTR aos itens de lista
      const listItems = editorRef.current.querySelectorAll('li');
      listItems.forEach(item => {
        const itemElement = item as HTMLElement;
        itemElement.setAttribute('dir', 'ltr');
        itemElement.style.direction = 'ltr';
        itemElement.style.textAlign = 'left';
      });
      
      // Aplicar LTR aos blockquotes
      const blockquotes = editorRef.current.querySelectorAll('blockquote');
      blockquotes.forEach(blockquote => {
        const blockquoteElement = blockquote as HTMLElement;
        blockquoteElement.setAttribute('dir', 'ltr');
        blockquoteElement.style.direction = 'ltr';
        blockquoteElement.style.textAlign = 'left';
      });
      
      // Aplicar LTR às tabelas
      const tables = editorRef.current.querySelectorAll('table');
      tables.forEach(table => {
        const tableElement = table as HTMLElement;
        tableElement.setAttribute('dir', 'ltr');
        tableElement.style.direction = 'ltr';
        
        // Aplicar LTR às células da tabela
        const cells = tableElement.querySelectorAll('td, th');
        cells.forEach(cell => {
          const cellElement = cell as HTMLElement;
          cellElement.setAttribute('dir', 'ltr');
          cellElement.style.direction = 'ltr';
          cellElement.style.textAlign = 'left';
        });
      });
    }
  }, []);

  // Função para aumentar/diminuir fonte
  const handleFontSize = useCallback((action: 'increase' | 'decrease') => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (range.collapsed) return; // Nada selecionado

    const selectedText = range.toString();
    if (!selectedText) return;

    // Verificar se a seleção está dentro de um span com fontSize
    let currentSize = 14; // tamanho padrão
    
    // Verificar se o range contém elementos com fontSize
    const fragment = range.cloneContents();
    const spans = fragment.querySelectorAll('span[style*="font-size"]');
    
    if (spans.length > 0) {
      // Usar o tamanho do primeiro span encontrado
      const firstSpan = spans[0] as HTMLElement;
      const fontSize = firstSpan.style.fontSize;
      if (fontSize && fontSize.endsWith('px')) {
        currentSize = parseInt(fontSize.replace('px', ''));
      }
    } else {
      // Verificar elemento pai
      const parentElement = range.commonAncestorContainer.nodeType === Node.TEXT_NODE 
        ? range.commonAncestorContainer.parentElement 
        : range.commonAncestorContainer as HTMLElement;
      currentSize = getCurrentFontSize(parentElement);
    }
    const newSize = action === 'increase' ? currentSize + 2 : currentSize - 2;
    
    // Limites de tamanho
    const minSize = 8;
    const maxSize = 72;
    const finalSize = Math.max(minSize, Math.min(maxSize, newSize));
    
    // Deletar conteúdo selecionado e inserir novo span
    range.deleteContents();
    
    const newSpan = document.createElement('span');
    newSpan.textContent = selectedText;
    newSpan.style.fontSize = `${finalSize}px`;
    newSpan.style.direction = 'ltr';
    newSpan.setAttribute('dir', 'ltr');
    
    range.insertNode(newSpan);
    
    // Manter o span selecionado para permitir ajustes consecutivos
    const newRange = document.createRange();
    newRange.selectNodeContents(newSpan);
    selection.removeAllRanges();
    selection.addRange(newRange);
    
    ensureLTR();
    setTimeout(() => {
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    }, 10);
  }, [ensureLTR, onChange]);

  // Função para obter tamanho de fonte atual
  const getCurrentFontSize = (element: HTMLElement | null): number => {
    if (!element) return 14; // Tamanho padrão
    
    // Percorrer a hierarquia para encontrar font-size definido
    let currentElement: HTMLElement | null = element;
    while (currentElement) {
      const style = currentElement.style.fontSize;
      if (style && style.endsWith('px')) {
        return parseInt(style.replace('px', ''));
      }
      
      const computedStyle = window.getComputedStyle(currentElement);
      const fontSize = computedStyle.fontSize;
      
      if (fontSize && fontSize.endsWith('px')) {
        const size = parseInt(fontSize.replace('px', ''));
        return size > 0 ? size : 14;
      }
      
      currentElement = currentElement.parentElement;
    }
    
    return 14; // Fallback
  };

  // Função para criar lista com marcadores melhorada
  const handleBulletList = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || !editorRef.current) return;

    // Verificar se já estamos em uma lista
    const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    if (range) {
      let element = range.commonAncestorContainer;
      if (element.nodeType === Node.TEXT_NODE) {
        element = element.parentElement as HTMLElement;
      }
      
      const listElement = (element as HTMLElement)?.closest('ul, ol');
      if (listElement) {
        // Já estamos em uma lista, remover
        document.execCommand('insertUnorderedList', false);
      } else {
        // Não estamos em lista, criar nova
        document.execCommand('insertUnorderedList', false);
        
        // Aplicar LTR à nova lista
        setTimeout(() => {
          ensureLTR();
          const newList = editorRef.current?.querySelector('ul:last-of-type');
          if (newList) {
            (newList as HTMLElement).style.direction = 'ltr';
            (newList as HTMLElement).setAttribute('dir', 'ltr');
          }
        }, 10);
      }
    }
  }, [ensureLTR]);

  // Função para indentação
  const handleIndent = useCallback(() => {
    document.execCommand('indent', false);
    setTimeout(() => ensureLTR(), 10);
  }, [ensureLTR]);

  // Função para diminuir indentação
  const handleOutdent = useCallback(() => {
    document.execCommand('outdent', false);
    setTimeout(() => ensureLTR(), 10);
  }, [ensureLTR]);



  // Função para citação (blockquote)
  const handleBlockquote = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || !editorRef.current) return;

    // Verificar se já estamos em um blockquote
    const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    if (range) {
      let element = range.commonAncestorContainer;
      if (element.nodeType === Node.TEXT_NODE) {
        element = element.parentElement as HTMLElement;
      }
      
      const blockquoteElement = (element as HTMLElement)?.closest('blockquote');
      if (blockquoteElement) {
        // Já estamos em blockquote, converter para parágrafo
        document.execCommand('formatBlock', false, '<p>');
      } else {
        // Não estamos em blockquote, criar novo
        document.execCommand('formatBlock', false, '<blockquote>');
        
        // Aplicar LTR ao novo blockquote
        setTimeout(() => {
          ensureLTR();
          const newBlockquote = editorRef.current?.querySelector('blockquote:last-of-type');
          if (newBlockquote) {
            (newBlockquote as HTMLElement).style.direction = 'ltr';
            (newBlockquote as HTMLElement).setAttribute('dir', 'ltr');
          }
        }, 10);
      }
    }
  }, [ensureLTR]);

  const handleFormat = useCallback((command: string, value?: string) => {
    if (!editorRef.current) return;

    editorRef.current.focus();
    ensureLTR();
    
    // Comandos especiais
    switch (command) {
      case 'insertTable':
        setIsTableDialogOpen(true);
        return;
      case 'createLink':
        setIsLinkDialogOpen(true);
        return;
      case 'insertImage':
        setIsImageDialogOpen(true);
        return;
      case 'fontSize':
        if (value === 'increase') {
          handleFontSize('increase');
        } else if (value === 'decrease') {
          handleFontSize('decrease');
        }
        return;
      case 'formatBlock':
        // Comando para headers (H1, H2, H3) e outros blocos
        document.execCommand('formatBlock', false, value);
        break;
      case 'blockquote':
        handleBlockquote();
        break;
      case 'insertUnorderedList':
        handleBulletList();
        break;
      case 'indent':
        handleIndent();
        break;
      case 'outdent':
        handleOutdent();
        break;
      case 'insertHTML':
        // Tentar usar execCommand primeiro
        const success = document.execCommand('insertHTML', false, value);
        console.log('insertHTML execCommand success:', success, 'value:', value);
        
        // Se execCommand falhar, usar método alternativo
        if (!success && value) {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = value;
            
            while (tempDiv.firstChild) {
              range.insertNode(tempDiv.firstChild);
            }
          } else if (editorRef.current) {
            // Se não há seleção, inserir no final
            editorRef.current.insertAdjacentHTML('beforeend', value);
          }
        }
        break;
      default:
        document.execCommand(command, false, value);
    }

    // Garantir LTR após comando
    setTimeout(() => {
      ensureLTR();
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    }, 10);
  }, [onChange, ensureLTR, handleFontSize, handleBulletList, handleIndent, handleOutdent, handleBlockquote]);

  const insertAdvancedTable = () => {
    if (!editorRef.current) return;

    const { rows, cols, hasHeader } = tableConfig;
    
    console.log('Inserindo tabela:', { rows, cols, hasHeader });
    
    // Criar HTML da tabela (método que funcionou no teste)
    let tableHTML = '<table class="resizable-table" style="border-collapse: collapse; width: 100%; margin: 16px 0; border: 1px solid #e2e8f0; direction: ltr; table-layout: fixed;">';
    
    for (let i = 0; i < rows; i++) {
      tableHTML += '<tr>';
      for (let j = 0; j < cols; j++) {
        const isHeaderRow = hasHeader && i === 0;
        const tag = isHeaderRow ? 'th' : 'td';
        const bgColor = isHeaderRow ? '#f8fafc' : 'white';
        const fontWeight = isHeaderRow ? 'bold' : 'normal';
        
        const cellContent = isHeaderRow ? `Cabeçalho ${j + 1}` : `Célula ${i + 1}-${j + 1}`;
        
        tableHTML += `<${tag} contenteditable="true" dir="ltr" style="border: 1px solid #e2e8f0; padding: 12px; text-align: left; direction: ltr; background-color: ${bgColor}; font-weight: ${fontWeight}; min-width: 100px; vertical-align: top;">${cellContent}</${tag}>`;
      }
      tableHTML += '</tr>';
    }
    
    tableHTML += '</table><p dir="ltr"><br></p>';
    
    // Usar o método que funcionou: inserção direta via innerHTML
    editorRef.current.innerHTML += tableHTML;
    console.log('Tabela inserida via innerHTML (método que funciona)');
    
    // Notificar mudança e aplicar LTR
    setTimeout(() => {
      ensureLTR();
      onChange(editorRef.current!.innerHTML);
      
      // Verificar se apareceu
      const tabelas = editorRef.current!.querySelectorAll('table');
      console.log('Tabelas no editor:', tabelas.length);
    }, 100);
    
    setIsTableDialogOpen(false);
    setTableConfig({ rows: 3, cols: 3, hasHeader: true });
  };

  const insertAdvancedLink = () => {
    const { text, url, newTab } = linkConfig;
    if (!url) return;

    const linkText = text || url;
    const target = newTab ? ' target="_blank" rel="noopener noreferrer"' : '';
    const linkHTML = `<a href="${url}"${target} style="color: #3b82f6; text-decoration: underline; direction: ltr;" dir="ltr">${linkText}</a>`;
    
    handleFormat('insertHTML', linkHTML);
    setIsLinkDialogOpen(false);
    setLinkConfig({ text: '', url: '', newTab: true });
  };

  const insertAdvancedImage = async () => {
    const { url, alt, width } = imageConfig;
    if (!url) return;

    const widthStyle = width ? `width: ${width}px;` : '';
    const imageHTML = `
      <img 
        src="${url}" 
        alt="${alt}" 
        style="
          max-width: 100%; 
          height: auto; 
          margin: 8px 0;
          border-radius: 4px;
          direction: ltr;
          ${widthStyle}
        "
        dir="ltr"
      />
    `;
    
    handleFormat('insertHTML', imageHTML);
    setIsImageDialogOpen(false);
    setImageConfig({ url: '', alt: '', width: '' });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onImageUpload) return;

    try {
      const imageUrl = await onImageUpload(file);
      setImageConfig(prev => ({ ...prev, url: imageUrl }));
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      alert('Erro ao fazer upload da imagem. Tente novamente.');
    }
  };

  // Controlar conteúdo inicial e garantir LTR
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content || '';
      ensureLTR();
    }
  }, [content, ensureLTR]);

  // Garantir LTR ao montar componente
  useEffect(() => {
    ensureLTR();
  }, [ensureLTR]);

  return (
    <>
      <style>
        {`
          .rich-text-editor span {
            line-height: 1 !important;
            vertical-align: baseline !important;
            display: inline !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .rich-text-editor * {
            line-height: 1.5;
          }
          
          .rich-text-editor p {
            line-height: 1.5 !important;
            margin: 0.5em 0 !important;
          }
          
          .rich-text-editor h1 {
            font-size: 2em !important;
            font-weight: bold !important;
            margin: 0.67em 0 !important;
            line-height: 1.2 !important;
            direction: ltr !important;
            text-align: left !important;
          }
          
          .rich-text-editor h2 {
            font-size: 1.5em !important;
            font-weight: bold !important;
            margin: 0.75em 0 !important;
            line-height: 1.3 !important;
            direction: ltr !important;
            text-align: left !important;
          }
          
          .rich-text-editor h3 {
            font-size: 1.17em !important;
            font-weight: bold !important;
            margin: 0.83em 0 !important;
            line-height: 1.4 !important;
            direction: ltr !important;
            text-align: left !important;
          }
          
          .rich-text-editor ul,
          .rich-text-editor ol {
            margin: 0.5em 0 !important;
            padding-left: 2em !important;
            direction: ltr !important;
            text-align: left !important;
          }
          
          .rich-text-editor ul {
            list-style-type: disc !important;
          }
          
          .rich-text-editor ol {
            list-style-type: decimal !important;
          }
          
          .rich-text-editor li {
            margin: 0.2em 0 !important;
            padding: 0 !important;
            direction: ltr !important;
            text-align: left !important;
            line-height: 1.5 !important;
          }
          
          .rich-text-editor ul ul,
          .rich-text-editor ul ol,
          .rich-text-editor ol ul,
          .rich-text-editor ol ol {
            margin: 0.2em 0 !important;
            padding-left: 1.5em !important;
          }
          
          .rich-text-editor ul ul {
            list-style-type: circle !important;
          }
          
          .rich-text-editor ul ul ul {
            list-style-type: square !important;
          }
          
          /* Estilos para citação (blockquote) */
          .rich-text-editor blockquote {
            border-left: 4px solid #3b82f6 !important;
            padding: 1em 1.5em !important;
            margin: 1em 0 !important;
            background-color: #f8fafc !important;
            font-style: italic !important;
            color: #64748b !important;
            direction: ltr !important;
            text-align: left !important;
            line-height: 1.6 !important;
            border-radius: 0 4px 4px 0 !important;
          }
          
          .rich-text-editor blockquote p {
            margin: 0.5em 0 !important;
            color: inherit !important;
          }
          
          .rich-text-editor blockquote:first-child {
            margin-top: 0 !important;
          }
          
          .rich-text-editor blockquote:last-child {
            margin-bottom: 0 !important;
          }
          
          /* Blockquote aninhado */
          .rich-text-editor blockquote blockquote {
            border-left-color: #64748b !important;
            background-color: #f1f5f9 !important;
            margin: 0.5em 0 !important;
            padding: 0.5em 1em !important;
          }
          
          /* Efeito hover para blockquotes */
          .rich-text-editor blockquote:hover {
            border-left-color: #2563eb !important;
            background-color: #f0f9ff !important;
          }
          
          /* Estilos para tabelas */
          .rich-text-editor table {
            border-collapse: collapse !important;
            width: 100% !important;
            margin: 16px 0 !important;
            border: 1px solid #e2e8f0 !important;
            direction: ltr !important;
            table-layout: auto !important;
            background-color: white !important;
            display: table !important;
            visibility: visible !important;
            opacity: 1 !important;
            font-size: 14px !important;
          }
          
          .rich-text-editor table th,
          .rich-text-editor table td {
            border: 1px solid #e2e8f0 !important;
            padding: 12px !important;
            text-align: left !important;
            direction: ltr !important;
            unicode-bidi: plaintext !important;
            min-width: 100px !important;
            vertical-align: top !important;
            line-height: 1.5 !important;
            display: table-cell !important;
          }
          
          .rich-text-editor table th {
            background-color: #f8fafc !important;
            font-weight: bold !important;
            color: #374151 !important;
          }
          
          .rich-text-editor table td {
            background-color: transparent !important;
            font-weight: normal !important;
          }
          
          .rich-text-editor table tr:nth-child(even) td {
            background-color: #f9fafb !important;
          }
          
          .rich-text-editor table tr:hover td {
            background-color: #f3f4f6 !important;
          }
          
          /* Tornar células editáveis visíveis */
          .rich-text-editor table td[contenteditable="true"]:focus,
          .rich-text-editor table th[contenteditable="true"]:focus {
            outline: 2px solid #3b82f6 !important;
            outline-offset: -2px !important;
            background-color: #eff6ff !important;
          }
          
          /* Garantir que tabelas sejam sempre visíveis - FORÇA MÁXIMA */
          .rich-text-editor table {
            display: table !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: relative !important;
            z-index: 1 !important;
            border: 2px solid #3b82f6 !important;
            background: white !important;
            min-height: 100px !important;
            height: auto !important;
            width: 100% !important;
          }
          
          /* Forçar exibição das células */
          .rich-text-editor table * {
            display: revert !important;
            visibility: visible !important;
          }
          
          .rich-text-editor table tr {
            display: table-row !important;
          }
          
          .rich-text-editor table td,
          .rich-text-editor table th {
            display: table-cell !important;
          }
          
          /* Toolbar fixo */
          .sticky-toolbar {
            position: sticky;
            top: 0;
            z-index: 50;
            background: white;
            border-bottom: 1px solid #e5e7eb;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            backdrop-filter: blur(8px);
            background-color: rgba(255, 255, 255, 0.95);
          }
          
          /* Transição suave para o toolbar */
          .sticky-toolbar {
            transition: all 0.2s ease-in-out;
          }
          
          /* Container do editor com scroll independente */
          .editor-container {
            max-height: 70vh;
            overflow-y: auto;
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
          }
          
          .editor-container-fixed {
            position: relative;
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            overflow: hidden;
          }
          
          /* Área de edição ajustada */
          .editor-content {
            min-height: 400px;
            padding: 1rem;
            flex: 1;
            overflow-y: auto;
          }
          
          /* Melhorar scroll em dispositivos móveis */
          .editor-container {
            -webkit-overflow-scrolling: touch;
          }
          
          /* Ajuste para que o editor ocupe o espaço disponível */
          .editor-content:focus-within {
            outline: none;
          }
        `}
      </style>
      <div className={`editor-container-fixed ${className}`}>
        {/* Toolbar */}
        <div className="border-b">
          <RichTextToolbar 
            onFormat={handleFormat}
            className=""
          />
        </div>

        {/* Editor */}
        <div
          ref={editorRef}
          className={`rich-text-editor min-h-96 p-4 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50`}
          contentEditable
          suppressContentEditableWarning={true}
          dir="ltr"
          lang="pt-BR"
          onInput={(e) => {
            const target = e.target as HTMLDivElement;
            ensureLTR();
            onChange(target.innerHTML);
          }}
          onKeyDown={() => {
            ensureLTR();
          }}
          onKeyPress={() => {
            ensureLTR();
          }}
          onFocus={() => {
            ensureLTR();
          }}
          onPaste={(e) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
            ensureLTR();
          }}
          style={{
            fontSize: '14px',
            lineHeight: '1.6',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            textAlign: 'left',
            direction: 'ltr',
            unicodeBidi: 'plaintext',
            writingMode: 'horizontal-tb'
          }}
        />
        
        {(!content || content === '') && (
          <div className="absolute top-20 left-4 text-muted-foreground pointer-events-none">
            {placeholder}
          </div>
        )}
        

      </div>

      {/* Dialog para Tabela */}
      <Dialog open={isTableDialogOpen} onOpenChange={setIsTableDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Inserir Tabela</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rows">Linhas</Label>
                <Input
                  id="rows"
                  type="number"
                  min="1"
                  max="20"
                  value={tableConfig.rows}
                  onChange={(e) => setTableConfig(prev => ({ 
                    ...prev, 
                    rows: parseInt(e.target.value) || 3 
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="cols">Colunas</Label>
                <Input
                  id="cols"
                  type="number"
                  min="1"
                  max="10"
                  value={tableConfig.cols}
                  onChange={(e) => setTableConfig(prev => ({ 
                    ...prev, 
                    cols: parseInt(e.target.value) || 3 
                  }))}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="hasHeader"
                checked={tableConfig.hasHeader}
                onChange={(e) => setTableConfig(prev => ({ 
                  ...prev, 
                  hasHeader: e.target.checked 
                }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="hasHeader">Incluir cabeçalho</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsTableDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={insertAdvancedTable}>
                Inserir Tabela
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para Link */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Inserir Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="linkText">Texto do Link</Label>
              <Input
                id="linkText"
                placeholder="Ex: Clique aqui"
                value={linkConfig.text}
                onChange={(e) => setLinkConfig(prev => ({ 
                  ...prev, 
                  text: e.target.value 
                }))}
              />
            </div>
            
            <div>
              <Label htmlFor="linkUrl">URL</Label>
              <Input
                id="linkUrl"
                placeholder="https://exemplo.com"
                value={linkConfig.url}
                onChange={(e) => setLinkConfig(prev => ({ 
                  ...prev, 
                  url: e.target.value 
                }))}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="newTab"
                checked={linkConfig.newTab}
                onChange={(e) => setLinkConfig(prev => ({ 
                  ...prev, 
                  newTab: e.target.checked 
                }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="newTab">Abrir em nova aba</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsLinkDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={insertAdvancedLink}>
                Inserir Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para Imagem */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Inserir Imagem</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="imageUrl">URL da Imagem</Label>
              <Input
                id="imageUrl"
                placeholder="https://exemplo.com/imagem.jpg"
                value={imageConfig.url}
                onChange={(e) => setImageConfig(prev => ({ 
                  ...prev, 
                  url: e.target.value 
                }))}
              />
            </div>

            {onImageUpload && (
              <div>
                <Label>Ou fazer upload</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground"
                  />
                </div>
              </div>
            )}
            
            <div>
              <Label htmlFor="imageAlt">Texto alternativo</Label>
              <Input
                id="imageAlt"
                placeholder="Descrição da imagem"
                value={imageConfig.alt}
                onChange={(e) => setImageConfig(prev => ({ 
                  ...prev, 
                  alt: e.target.value 
                }))}
              />
            </div>
            
            <div>
              <Label htmlFor="imageWidth">Largura (opcional)</Label>
              <Input
                id="imageWidth"
                type="number"
                placeholder="Ex: 400"
                value={imageConfig.width}
                onChange={(e) => setImageConfig(prev => ({ 
                  ...prev, 
                  width: e.target.value 
                }))}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsImageDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={insertAdvancedImage}
                disabled={!imageConfig.url}
              >
                Inserir Imagem
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
