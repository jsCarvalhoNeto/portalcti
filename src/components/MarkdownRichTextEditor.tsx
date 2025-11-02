import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Code2, 
  Clipboard
} from 'lucide-react';
import RichTextToolbar from './RichTextToolbar';
import MarkdownHelpButton from './MarkdownHelpButton';
import { useCodeBlockEnhancement } from './CodeBlock';
import { 
  detectMarkdown, 
  markdownToHtml, 
  htmlToMarkdown, 
  handlePastedContent,
  sanitizeHtml 
} from '@/utils/markdownUtils';

interface MarkdownRichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  enableMarkdown?: boolean;
}

export default function MarkdownRichTextEditor({
  content,
  onChange,
  placeholder = "Digite seu conteúdo aqui...",
  className = "",
  enableMarkdown = true
}: MarkdownRichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const markdownRef = useRef<HTMLTextAreaElement>(null);
  const [editorMode, setEditorMode] = useState<'visual' | 'markdown'>('visual');
  const [markdownContent, setMarkdownContent] = useState('');
  const [isTableDialogOpen, setIsTableDialogOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [tableConfig, setTableConfig] = useState({ rows: 3, cols: 3, hasHeader: true });
  const [linkConfig, setLinkConfig] = useState({ text: '', url: '', newTab: true });
  const [imageConfig, setImageConfig] = useState({ url: '', alt: '', width: '' });
  const [showMarkdownDetected, setShowMarkdownDetected] = useState(false);

  // Inicializar markdown content se o conteúdo atual contiver HTML
  useEffect(() => {
    if (content && editorMode === 'markdown' && !markdownContent) {
      const markdown = htmlToMarkdown(content);
      setMarkdownContent(markdown);
    }
  }, [content, editorMode, markdownContent]);

  // Garantir direção LTR sempre (versão otimizada)
  const ensureLTR = useCallback(() => {
    if (editorRef.current) {
      // Propriedades do editor principal apenas
      editorRef.current.dir = 'ltr';
      editorRef.current.style.direction = 'ltr';
      editorRef.current.style.unicodeBidi = 'embed';
      editorRef.current.style.textAlign = 'left';
    }
  }, []);

  // Handler para mudança de modo
  const handleModeChange = useCallback((newMode: 'visual' | 'markdown') => {
    if (newMode === 'markdown') {
      // Convertendo de visual para markdown
      if (editorRef.current) {
        const htmlContent = editorRef.current.innerHTML;
        const markdown = htmlToMarkdown(htmlContent);
        setMarkdownContent(markdown);
      }
    } else {
      // Convertendo de markdown para visual
      if (markdownContent) {
        const html = sanitizeHtml(markdownToHtml(markdownContent));
        if (editorRef.current) {
          editorRef.current.innerHTML = html;
          onChange(html);
        }
      }
    }
    setEditorMode(newMode);
  }, [markdownContent, onChange]);

  // Handler para mudanças no markdown
  const handleMarkdownChange = useCallback((newMarkdown: string) => {
    setMarkdownContent(newMarkdown);
    
    // Converter para HTML e notificar mudança
    const html = sanitizeHtml(markdownToHtml(newMarkdown));
    onChange(html);
  }, [onChange]);

  // Handler para mudanças no tamanho da fonte
  const handleFontSizeChange = useCallback((action: string) => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    
    // Se não há texto selecionado, não fazer nada
    if (range.collapsed) return;

    // Extrair o texto selecionado
    const selectedText = range.toString();
    if (!selectedText.trim()) return;

    // Função para determinar o tamanho da fonte de um elemento
    const getFontSize = (element: Element): number => {
      const computedStyle = window.getComputedStyle(element);
      const fontSize = computedStyle.fontSize;
      return fontSize ? parseFloat(fontSize) : 16;
    };

    // Calcular incremento/decremento
    const calculateNewSize = (currentSize: number): number => {
      if (action === 'increase') {
        return currentSize + 2;
      } else if (action === 'decrease') {
        return Math.max(8, currentSize - 2); // Mínimo de 8px
      } else {
        // Se for um valor específico, usar ele
        return parseFloat(action) || currentSize;
      }
    };

    try {
      // Verificar se a seleção está dentro de um único elemento com font-size
      const startContainer = range.startContainer;
      const endContainer = range.endContainer;
      
      // Se ambos os containers são o mesmo ou têm o mesmo elemento pai
      if (startContainer === endContainer || startContainer.parentElement === endContainer.parentElement) {
        const parentElement = (startContainer.nodeType === Node.TEXT_NODE 
          ? startContainer.parentElement 
          : startContainer) as HTMLElement;
        
        if (parentElement) {
          const currentSize = getFontSize(parentElement);
          const newSize = calculateNewSize(currentSize);
          
          // Se o elemento pai já tem font-size inline, atualizar
          if (parentElement.style.fontSize) {
            parentElement.style.fontSize = `${newSize}px`;
            parentElement.style.direction = 'ltr';
            parentElement.style.unicodeBidi = 'embed';
          } else {
            // Criar um span wrapper para o texto selecionado
            const span = document.createElement('span');
            span.style.fontSize = `${newSize}px`;
            span.style.direction = 'ltr';
            span.style.unicodeBidi = 'embed';
            
            // Extrair conteúdo e substituir
            const contents = range.extractContents();
            span.appendChild(contents);
            range.insertNode(span);
            
            // Selecionar o span inserido
            range.selectNode(span);
          }
        }
      } else {
        // Seleção abrange múltiplos elementos - usar abordagem mais robusta
        const span = document.createElement('span');
        const parentElement = range.commonAncestorContainer.parentElement;
        const currentSize = parentElement ? getFontSize(parentElement) : 16;
        const newSize = calculateNewSize(currentSize);
        
        span.style.fontSize = `${newSize}px`;
        span.style.direction = 'ltr';
        span.style.unicodeBidi = 'embed';
        
        // Extrair conteúdo e substituir
        const contents = range.extractContents();
        span.appendChild(contents);
        range.insertNode(span);
        
        // Selecionar o novo span
        range.selectNode(span);
      }
      
      // Atualizar seleção
      selection.removeAllRanges();
      selection.addRange(range);
      
      // Garantir direção LTR
      ensureLTR();
      
      // Notificar mudança
      onChange(editorRef.current.innerHTML);
      
    } catch (error) {
      console.error('Erro ao aplicar tamanho da fonte:', error);
      
      // Fallback: método mais simples
      const span = document.createElement('span');
      span.style.fontSize = action === 'increase' ? '18px' : '14px';
      span.style.direction = 'ltr';
      span.style.unicodeBidi = 'embed';
      span.textContent = selectedText;
      
      range.deleteContents();
      range.insertNode(span);
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange, ensureLTR]);

  // UseEffect para inicialização do editor
  useEffect(() => {
    if (editorRef.current && editorMode === 'visual') {
      // Inicializar conteúdo se necessário
      if (editorRef.current.innerHTML !== content) {
        editorRef.current.innerHTML = content;
      }
      ensureLTR();
    }
  }, [ensureLTR, content, editorMode]);

  // Hook para melhorar blocos de código com syntax highlighting
  useCodeBlockEnhancement(editorRef);

  // Handler para paste no editor visual
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    if (!enableMarkdown || editorMode !== 'visual') return;

    const pastedText = e.clipboardData.getData('text/plain');
    
    if (detectMarkdown(pastedText)) {
      e.preventDefault();
      setShowMarkdownDetected(true);
      
      // Converter markdown para HTML imediatamente
      const { html } = handlePastedContent(pastedText);
      const sanitizedHtml = sanitizeHtml(html);
      
      // Inserir o HTML convertido usando execCommand para melhor compatibilidade
      if (editorRef.current) {
        editorRef.current.focus();
        
        // Usar execCommand que funciona melhor com contentEditable
        const success = document.execCommand('insertHTML', false, sanitizedHtml);
        
        if (!success) {
          // Fallback: inserção manual mais robusta
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            
            // Criar um fragment do DOM ao invés de manipular nós individualmente
            try {
              const fragment = range.createContextualFragment(sanitizedHtml);
              range.insertNode(fragment);
              
              // Mover cursor para o final do conteúdo inserido
              range.collapse(false);
              selection.removeAllRanges();
              selection.addRange(range);
            } catch (error) {
              console.error('❌ Erro ao inserir fragment:', error);
              // Último recurso: inserção direta via innerHTML
              const currentHTML = editorRef.current.innerHTML;
              editorRef.current.innerHTML = currentHTML + sanitizedHtml;
            }
          } else {
            // Se não há seleção, inserir no final
            editorRef.current.insertAdjacentHTML('beforeend', sanitizedHtml);
          }
        }
        
        // Notificar mudança imediatamente
        const finalContent = editorRef.current.innerHTML;
        onChange(finalContent);
      }
      
      // Remover indicador após um tempo
      setTimeout(() => {
        setShowMarkdownDetected(false);
      }, 1500);
    }
  }, [enableMarkdown, onChange, editorMode]);

  const handleFormat = useCallback((command: string, value?: string) => {
    if (!editorRef.current || editorMode === 'markdown') return;

    editorRef.current.focus();
    
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
        handleFontSizeChange(value || '');
        return;
      default:
        document.execCommand(command, false, value);
    }

    setTimeout(() => {
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    }, 10);
  }, [onChange, editorMode]);

  const insertAdvancedTable = () => {
    if (!editorRef.current || editorMode === 'markdown') return;

    const { rows, cols, hasHeader } = tableConfig;
    
    let tableHTML = '<table style="border-collapse: collapse; width: 100%; margin: 16px 0; border: 1px solid #e2e8f0; direction: ltr; table-layout: fixed;">';
    
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
    
    editorRef.current.innerHTML += tableHTML;
    
    setTimeout(() => {
      ensureLTR();
      onChange(editorRef.current!.innerHTML);
    }, 100);
    
    setIsTableDialogOpen(false);
    setTableConfig({ rows: 3, cols: 3, hasHeader: true });
  };

  const insertAdvancedLink = () => {
    const { text, url, newTab } = linkConfig;
    if (!url || editorMode === 'markdown') return;

    const linkHTML = `<a href="${url}" ${newTab ? 'target="_blank"' : ''}>${text || url}</a>`;
    
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createRange().createContextualFragment(linkHTML));
      } else {
        editorRef.current.insertAdjacentHTML('beforeend', linkHTML);
      }
      
      setTimeout(() => {
        ensureLTR();
        onChange(editorRef.current!.innerHTML);
      }, 10);
    }
    
    setIsLinkDialogOpen(false);
    setLinkConfig({ text: '', url: '', newTab: true });
  };

  const insertAdvancedImage = async () => {
    const { url, alt, width } = imageConfig;
    if (!url || editorMode === 'markdown') return;

    const widthAttr = width ? `width="${width}"` : '';
    const imageHTML = `<img src="${url}" alt="${alt}" ${widthAttr} style="max-width: 100%; height: auto;" />`;
    
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createRange().createContextualFragment(imageHTML));
      } else {
        editorRef.current.insertAdjacentHTML('beforeend', imageHTML);
      }
      
      setTimeout(() => {
        ensureLTR();
        onChange(editorRef.current!.innerHTML);
      }, 10);
    }
    
    setIsImageDialogOpen(false);
    setImageConfig({ url: '', alt: '', width: '' });
  };

  // Atualizar conteúdo quando content prop mudar
  useEffect(() => {
    if (editorRef.current && editorMode === 'visual') {
      const currentContent = editorRef.current.innerHTML;
      if (currentContent !== content) {
        // Salvar posição do cursor antes da atualização
        const selection = window.getSelection();
        let cursorPosition = 0;
        
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          if (editorRef.current.contains(range.startContainer)) {
            // Calcular posição do cursor em relação ao texto
            const preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(editorRef.current);
            preCaretRange.setEnd(range.startContainer, range.startOffset);
            cursorPosition = preCaretRange.toString().length;
          }
        }
        
        // Atualizar conteúdo
        editorRef.current.innerHTML = content;
        ensureLTR();
        
        // Restaurar posição do cursor se possível
        if (cursorPosition > 0) {
          setTimeout(() => {
            try {
              const walker = document.createTreeWalker(
                editorRef.current!,
                NodeFilter.SHOW_TEXT,
                null
              );
              
              let currentPos = 0;
              let textNode = walker.nextNode();
              
              while (textNode) {
                const nodeLength = textNode.textContent?.length || 0;
                if (currentPos + nodeLength >= cursorPosition) {
                  const range = document.createRange();
                  const offset = cursorPosition - currentPos;
                  range.setStart(textNode, Math.min(offset, nodeLength));
                  range.collapse(true);
                  
                  const newSelection = window.getSelection();
                  if (newSelection) {
                    newSelection.removeAllRanges();
                    newSelection.addRange(range);
                  }
                  break;
                }
                currentPos += nodeLength;
                textNode = walker.nextNode();
              }
            } catch (error) {
              console.warn('Não foi possível restaurar a posição do cursor:', error);
            }
          }, 0);
        }
      }
    }
  }, [content, editorMode, ensureLTR]);

  return (
    <div className={`markdown-editor border rounded-lg overflow-hidden bg-background ${className}`}>
      {/* Header com controles de modo */}
      {enableMarkdown && (
        <div className="flex items-center justify-between p-2 border-b bg-muted/50">
          <div className="flex items-center gap-2">
            <Tabs value={editorMode} onValueChange={(value) => handleModeChange(value as 'visual' | 'markdown')} className="w-auto">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="visual" className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  Visual
                </TabsTrigger>
                <TabsTrigger value="markdown" className="flex items-center gap-1">
                  <Code2 className="w-3 h-3" />
                  Markdown
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            {showMarkdownDetected && (
              <Badge variant="secondary" className="animate-pulse">
                <Clipboard className="w-3 h-3 mr-1" />
                Markdown detectado!
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <MarkdownHelpButton variant="ghost" size="sm" />
            <div className="text-xs text-muted-foreground">
              {editorMode === 'visual' ? 'Editor Visual' : 'Editor Markdown'}
            </div>
          </div>
        </div>
      )}

      {/* Toolbar - apenas no modo visual */}
      {editorMode === 'visual' && (
          <div className="border-b bg-background/50">
          <RichTextToolbar 
            onFormat={handleFormat}
            className="p-2"
          />
        </div>
      )}

      {/* Área do editor */}
      <div className="relative">
        {editorMode === 'visual' ? (
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            className="min-h-[200px] p-4 focus:outline-none prose max-w-none markdown-rich-text-editor"
            dir="ltr"
              style={{ 
                maxHeight: '70vh',
                overflowY: 'auto',
                direction: 'ltr',
                unicodeBidi: 'embed',
                textAlign: 'left',
                writingMode: 'horizontal-tb'
              }}
            data-placeholder={placeholder}
            onInput={(e) => {
              const target = e.target as HTMLDivElement;
              
              // Garantir direção LTR após cada entrada
              target.dir = 'ltr';
              target.style.direction = 'ltr';
              target.style.textAlign = 'left';
              target.style.unicodeBidi = 'embed';
              
              // Forçar alinhamento à esquerda e direção LTR com maior especificidade
              target.style.setProperty('text-align', 'left', 'important');
              target.style.setProperty('direction', 'ltr', 'important');
              target.style.setProperty('unicode-bidi', 'embed', 'important');
              target.style.setProperty('writing-mode', 'horizontal-tb', 'important');
              
              // Notificar mudança
              onChange(target.innerHTML);
            }}
            onPaste={handlePaste}
            onKeyDown={(e) => {
              // Garantir direção LTR em eventos de teclado
              const target = e.currentTarget as HTMLDivElement;
              target.dir = 'ltr';
              target.style.direction = 'ltr';
              target.style.textAlign = 'left';
              target.style.unicodeBidi = 'embed';
            }}
            onFocus={(e) => {
              const target = e.currentTarget as HTMLDivElement;
              target.dir = 'ltr';
              target.style.direction = 'ltr';
              target.style.textAlign = 'left';
              target.style.unicodeBidi = 'embed';
              
              // REMOVIDO: Este código estava forçando o cursor para o final
              // e causando o problema reportado
            }}
            onMouseDown={(e) => {
              // Garantir direção LTR sem setTimeout para evitar interferência no cursor
              const target = e.currentTarget as HTMLDivElement;
              target.dir = 'ltr';
              target.style.direction = 'ltr';
              target.style.textAlign = 'left';
              target.style.unicodeBidi = 'embed';
            }}
            onClick={(e) => {
              // Garantir direção LTR em cliques
              const target = e.currentTarget as HTMLDivElement;
              target.dir = 'ltr';
              target.style.direction = 'ltr';
              target.style.textAlign = 'left';
              target.style.unicodeBidi = 'embed';
            }}
            // dangerouslySetInnerHTML removido para permitir controle manual do conteúdo
          />
        ) : (
          <div className="flex flex-col">
            <div className="p-2 border-b">
              <Label className="text-xs font-semibold">Editor Markdown</Label>
            </div>
            <Textarea
              ref={markdownRef}
              value={markdownContent}
              onChange={(e) => handleMarkdownChange(e.target.value)}
              placeholder="Digite seu markdown aqui...&#10;&#10;Exemplos:&#10;# Título&#10;**negrito** e *itálico*&#10;- Lista&#10;[link](url)&#10;![imagem](url)"
              className="min-h-[200px] border-0 resize-none font-mono text-sm focus-visible:ring-0"
              style={{ maxHeight: '70vh' }}
            />
          </div>
        )}
      </div>

      {/* Preview do markdown no modo markdown */}
      {editorMode === 'markdown' && markdownContent && (
        <div className="border-t bg-muted/20">
          <div className="p-2 border-b">
            <Label className="text-xs font-semibold flex items-center gap-1">
              <Eye className="w-3 h-3" />
              Preview
            </Label>
          </div>
          <div 
            className="p-4 prose max-w-none"
            dangerouslySetInnerHTML={{ 
              __html: sanitizeHtml(markdownToHtml(markdownContent)) 
            }}
          />
        </div>
      )}

      {/* Dialogs para inserção de conteúdo */}
      <Dialog open={isTableDialogOpen} onOpenChange={setIsTableDialogOpen}>
        <DialogContent>
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
                  onChange={(e) => setTableConfig(prev => ({ ...prev, rows: parseInt(e.target.value) || 1 }))}
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
                  onChange={(e) => setTableConfig(prev => ({ ...prev, cols: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="hasHeader"
                checked={tableConfig.hasHeader}
                onChange={(e) => setTableConfig(prev => ({ ...prev, hasHeader: e.target.checked }))}
              />
              <Label htmlFor="hasHeader">Incluir cabeçalho</Label>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsTableDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={insertAdvancedTable}>
                Inserir Tabela
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inserir Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="linkText">Texto do Link</Label>
              <Input
                id="linkText"
                value={linkConfig.text}
                onChange={(e) => setLinkConfig(prev => ({ ...prev, text: e.target.value }))}
                placeholder="Digite o texto do link"
              />
            </div>
            
            <div>
              <Label htmlFor="linkUrl">URL</Label>
              <Input
                id="linkUrl"
                type="url"
                value={linkConfig.url}
                onChange={(e) => setLinkConfig(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://exemplo.com"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="newTab"
                checked={linkConfig.newTab}
                onChange={(e) => setLinkConfig(prev => ({ ...prev, newTab: e.target.checked }))}
              />
              <Label htmlFor="newTab">Abrir em nova aba</Label>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={insertAdvancedLink}>
                Inserir Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inserir Imagem</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="imageUrl">URL da Imagem</Label>
              <Input
                id="imageUrl"
                type="url"
                value={imageConfig.url}
                onChange={(e) => setImageConfig(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://exemplo.com/imagem.jpg"
              />
            </div>
            
            <div>
              <Label htmlFor="imageAlt">Texto Alternativo</Label>
              <Input
                id="imageAlt"
                value={imageConfig.alt}
                onChange={(e) => setImageConfig(prev => ({ ...prev, alt: e.target.value }))}
                placeholder="Descrição da imagem"
              />
            </div>
            
            <div>
              <Label htmlFor="imageWidth">Largura (opcional)</Label>
              <Input
                id="imageWidth"
                value={imageConfig.width}
                onChange={(e) => setImageConfig(prev => ({ ...prev, width: e.target.value }))}
                placeholder="300px ou 100%"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsImageDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={insertAdvancedImage}>
                Inserir Imagem
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
