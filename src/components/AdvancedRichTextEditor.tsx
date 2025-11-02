import { useState, useRef, useCallback } from 'react';
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

interface AdvancedRichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  onImageUpload?: (file: File) => Promise<string>;
}

export default function AdvancedRichTextEditor({
  content,
  onChange,
  placeholder = "Digite seu conteúdo aqui...",
  className = "",
  onImageUpload
}: AdvancedRichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isTableDialogOpen, setIsTableDialogOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [tableConfig, setTableConfig] = useState({ rows: 3, cols: 3, hasHeader: true });
  const [linkConfig, setLinkConfig] = useState({ text: '', url: '', newTab: true });
  const [imageConfig, setImageConfig] = useState({ url: '', alt: '', width: '' });
  const [selectionPreserved, setSelectionPreserved] = useState(false);
  const lastSavedSelectionRef = useRef<{ range: Range, text: string, isValid: boolean } | null>(null);

  // Funções melhoradas para preservar seleção de texto
  const saveSelection = (): { range: Range, text: string, isValid: boolean } | null => {
    try {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        const text = range.toString();
        
        // Validar que o range está dentro do editor
        const isValid = editorRef.current?.contains(range.commonAncestorContainer) || 
                       editorRef.current?.contains(range.startContainer) ||
                       editorRef.current?.contains(range.endContainer);
        
        return {
          range: range.cloneRange(),
          text: text,
          isValid: Boolean(isValid)
        };
      }
    } catch (error) {
      console.debug('Erro ao salvar seleção:', error);
    }
    return null;
  };

  const restoreSelection = (savedSelection: { range: Range, text: string, isValid: boolean } | null) => {
    if (!savedSelection || !savedSelection.isValid || !editorRef.current) {
      return false;
    }

    try {
      const { range, text } = savedSelection;
      
      // Validação dupla do range
      if (!editorRef.current.contains(range.commonAncestorContainer)) {
        // Tentar encontrar o texto na posição atual
        return restoreSelectionByText(text);
      }

      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Garantir foco e visibilidade
        editorRef.current.focus();
        
        // Pequeno delay para garantir que a seleção seja visível
        setTimeout(() => {
          if (editorRef.current && selection.rangeCount > 0) {
            // Forçar re-render visual da seleção
            const tempRange = selection.getRangeAt(0);
            selection.removeAllRanges();
            selection.addRange(tempRange);
          }
        }, 5);
        
        return true;
      }
    } catch (error) {
      console.debug('Erro ao restaurar seleção por range:', error);
      // Fallback: tentar restaurar por texto
      return restoreSelectionByText(savedSelection.text);
    }
    return false;
  };

  const restoreSelectionByText = (text: string): boolean => {
    if (!text || !editorRef.current) return false;

    try {
      // Buscar o texto no conteúdo do editor
      const walker = document.createTreeWalker(
        editorRef.current,
        NodeFilter.SHOW_TEXT,
        null
      );

      let node;
      while (node = walker.nextNode()) {
        const nodeText = node.textContent || '';
        const index = nodeText.indexOf(text);
        
        if (index !== -1) {
          const range = document.createRange();
          range.setStart(node, index);
          range.setEnd(node, index + text.length);
          
          const selection = window.getSelection();
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
            editorRef.current.focus();
            return true;
          }
        }
      }
    } catch (error) {
      console.debug('Erro ao restaurar seleção por texto:', error);
    }
    return false;
  };

  const handleFormat = useCallback((command: string, value?: string) => {
    if (!editorRef.current) return;

    // Salvar seleção atual antes de aplicar formatação
    const savedSelection = saveSelection();
    lastSavedSelectionRef.current = savedSelection;
    
    // Debug log para acompanhar o funcionamento
    if (savedSelection) {
      console.debug(`Formatação: ${command}, Texto selecionado: "${savedSelection.text}"`);
    }
    
    editorRef.current.focus();
    
    // Comandos especiais que precisam de tratamento customizado
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
      case 'insertHTML':
        document.execCommand('insertHTML', false, value);
        break;
      default:
        document.execCommand(command, false, value);
    }

    // Determinar se deve preservar seleção baseado no tipo de comando
    const shouldPreserveSelection = () => {
      // Comandos de formatação que devem preservar seleção
      const formattingCommands = [
        'bold', 'italic', 'underline', 'strikeThrough',
        'foreColor', 'backColor', 'styleWithCSS',
        'fontSize', 'fontName', 'removeFormat',
        'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull',
        'subscript', 'superscript'
      ];
      
      // Comandos que inserem/modificam estrutura e NÃO devem preservar seleção
      const structuralCommands = [
        'insertHTML', 'insertImage', 'createLink', 'insertTable',
        'insertUnorderedList', 'insertOrderedList', 'insertHorizontalRule',
        'formatBlock', 'indent', 'outdent', 'undo', 'redo'
      ];
      
      // Se é comando de formatação explícito, preservar
      if (formattingCommands.includes(command)) {
        return true;
      }
      
      // Se é comando estrutural, não preservar
      if (structuralCommands.includes(command)) {
        return false;
      }
      
      // Para outros comandos, preservar apenas se havia seleção de texto
      return savedSelection && savedSelection.isValid;
    };

    // Usar delay mais longo para garantir que o comando seja executado
    const preserveSelection = shouldPreserveSelection();
    
    setTimeout(() => {
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
        
        if (preserveSelection && savedSelection) {
          const restored = restoreSelection(savedSelection);
          console.debug(`Seleção restaurada: ${restored}`);
          
          // Indicar visualmente que a seleção foi preservada
          if (restored) {
            setSelectionPreserved(true);
            setTimeout(() => setSelectionPreserved(false), 1000);
          } else {
            // Se a primeira tentativa falhou, tentar novamente após mais tempo
            setTimeout(() => {
              const secondAttempt = restoreSelection(savedSelection);
              console.debug(`Segunda tentativa de restauração: ${secondAttempt}`);
              if (secondAttempt) {
                setSelectionPreserved(true);
                setTimeout(() => setSelectionPreserved(false), 1000);
              }
            }, 50);
          }
        }
      }
    }, 25);
  }, [onChange]);

  const insertAdvancedTable = () => {
    if (!editorRef.current) return;

    const { rows, cols, hasHeader } = tableConfig;
    let tableHTML = `
      <table style="
        border-collapse: collapse; 
        width: 100%; 
        margin: 16px 0;
        border: 1px solid #e2e8f0;
      ">
    `;

    for (let i = 0; i < rows; i++) {
      tableHTML += '<tr>';
      for (let j = 0; j < cols; j++) {
        const isHeaderRow = hasHeader && i === 0;
        const tag = isHeaderRow ? 'th' : 'td';
        const bgColor = isHeaderRow ? '#f8fafc' : 'transparent';
        const fontWeight = isHeaderRow ? 'bold' : 'normal';
        
        tableHTML += `
          <${tag} style="
            border: 1px solid #e2e8f0; 
            padding: 12px; 
            text-align: left;
            background-color: ${bgColor};
            font-weight: ${fontWeight};
            min-width: 100px;
          " contenteditable="true">
            ${isHeaderRow ? `Cabeçalho ${j + 1}` : `Célula ${i + 1}-${j + 1}`}
          </${tag}>
        `;
      }
      tableHTML += '</tr>';
    }
    tableHTML += '</table><p><br></p>'; // Adicionar parágrafo após a tabela

    handleFormat('insertHTML', tableHTML);
    setIsTableDialogOpen(false);
    setTableConfig({ rows: 3, cols: 3, hasHeader: true });
  };

  const insertAdvancedLink = () => {
    const { text, url, newTab } = linkConfig;
    if (!url) return;

    const linkText = text || url;
    const target = newTab ? ' target="_blank" rel="noopener noreferrer"' : '';
    const linkHTML = `<a href="${url}"${target} style="color: #3b82f6; text-decoration: underline;">${linkText}</a>`;
    
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
          ${widthStyle}
        "
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

  return (
    <div className={`relative border rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <RichTextToolbar 
        onFormat={handleFormat}
        className="border-b"
      />

      {/* Editor */}
      <div
        ref={editorRef}
        className={`min-h-96 p-4 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-left transition-all duration-300 ${
          selectionPreserved ? 'ring-2 ring-green-400 shadow-green-100 shadow-lg' : ''
        }`}
        contentEditable
        suppressContentEditableWarning={true}
        dangerouslySetInnerHTML={{ __html: content }}
        onInput={(e) => {
          const target = e.target as HTMLDivElement;
          onChange(target.innerHTML);
          
          // Limpar flag de seleção preservada quando usuário digita
          setSelectionPreserved(false);
          
          // Garantir direção LTR sempre
          target.dir = 'ltr';
          target.style.direction = 'ltr';
          target.style.unicodeBidi = 'embed';
          target.style.textAlign = 'left';
          
          // Garantir que o cursor fique no final após digitação
          setTimeout(() => {
            const selection = window.getSelection();
            if (selection && target.lastChild) {
              const range = document.createRange();
              range.setStartAfter(target.lastChild);
              range.collapse(true);
              selection.removeAllRanges();
              selection.addRange(range);
            }
          }, 0);
        }}
        onKeyDown={(e) => {
          // Garantir que a direção seja LTR ao digitar
          const target = e.currentTarget as HTMLDivElement;
          target.dir = 'ltr';
          target.style.direction = 'ltr';
          target.style.unicodeBidi = 'embed';
          target.style.textAlign = 'left';
          
          // Atalho para restaurar última seleção (Ctrl+Shift+R)
          if (e.ctrlKey && e.shiftKey && e.key === 'R') {
            e.preventDefault();
            if (lastSavedSelectionRef.current) {
              const restored = restoreSelection(lastSavedSelectionRef.current);
              if (restored) {
                setSelectionPreserved(true);
                setTimeout(() => setSelectionPreserved(false), 1000);
              }
            }
          }
          
          // Limpar flag ao digitar normalmente
          if (!e.ctrlKey && !e.shiftKey && !e.altKey) {
            setSelectionPreserved(false);
          }
        }}
        onFocus={(e) => {
          // Garantir direção LTR ao focar
          const target = e.currentTarget as HTMLDivElement;
          target.dir = 'ltr';
          target.style.direction = 'ltr';
          target.style.unicodeBidi = 'embed';
          target.style.textAlign = 'left';
          
          // Garantir que o cursor fique no final ao focar
          setTimeout(() => {
            const selection = window.getSelection();
            if (selection && target.lastChild) {
              const range = document.createRange();
              range.setStartAfter(target.lastChild);
              range.collapse(true);
              selection.removeAllRanges();
              selection.addRange(range);
            }
          }, 0);
        }}
        onMouseDown={(e) => {
          // Prevenir problemas com mouse down que possam afetar a direção
          const target = e.currentTarget as HTMLDivElement;
          setTimeout(() => {
            target.dir = 'ltr';
            target.style.direction = 'ltr';
            target.style.unicodeBidi = 'embed';
            target.style.textAlign = 'left';
          }, 0);
        }}
        onClick={(e) => {
          // Garantir direção LTR em cliques
          const target = e.currentTarget as HTMLDivElement;
          target.dir = 'ltr';
          target.style.direction = 'ltr';
          target.style.unicodeBidi = 'embed';
          target.style.textAlign = 'left';
        }}
        onPaste={(e) => {
          // Melhorar tratamento de cola
          e.preventDefault();
          const text = e.clipboardData.getData('text/plain');
          document.execCommand('insertText', false, text);
        }}
        style={{
          fontSize: '14px',
          lineHeight: '1.6',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          textAlign: 'left',
          direction: 'ltr',
          unicodeBidi: 'normal'
        }}
      />
      
      {content === '' && (
        <div className="absolute top-20 left-4 text-muted-foreground pointer-events-none">
          {placeholder}
        </div>
      )}

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
    </div>
  );
}
