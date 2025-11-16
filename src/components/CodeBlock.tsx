import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { supportedLanguages } from '@/utils/syntaxHighlight';

interface CodeBlockProps {
  code: string;
  language?: string;
  children?: React.ReactNode;
}

/**
 * Componente para exibir blocos de código com syntax highlighting
 * Inclui botão de cópia e indicador de linguagem
 */
export default function CodeBlock({ code, language, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar código:', error);
      // Fallback para navegadores mais antigos
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      if (document.body.contains(textArea)) {
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getLanguageName = (lang?: string): string => {
    if (!lang) return 'Código';
    const langInfo = supportedLanguages.find(l => l.code === lang);
    return langInfo ? langInfo.name : lang.toUpperCase();
  };

  return (
    <div className="code-block-container">
      {/* Barra superior com informações da linguagem e botão de cópia */}
      <div className="language-toolbar">
        <span className="language-label">
          {getLanguageName(language)}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="copy-button"
          onClick={handleCopy}
          title={copied ? 'Copiado!' : 'Copiar código'}
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 mr-1" />
              Copiado!
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 mr-1" />
              Copiar
            </>
          )}
        </Button>
      </div>
      
      {/* Conteúdo do código */}
      {children ? (
        children
      ) : (
        <pre className={`language-${language || 'text'}`}>
          <code className={`language-${language || 'text'}`}>
            {code}
          </code>
        </pre>
      )}
    </div>
  );
}

/**
 * Hook para processar elementos de código no DOM e adicionar funcionalidades
 */
export function useCodeBlockEnhancement(containerRef: React.RefObject<HTMLElement>) {
  React.useEffect(() => {
    if (!containerRef.current) return;

    const codeBlocks = containerRef.current.querySelectorAll('pre > code[class*="language-"]');
    
    codeBlocks.forEach((codeElement) => {
      const preElement = codeElement.parentElement as HTMLPreElement;
      if (!preElement || preElement.hasAttribute('data-enhanced')) return;

      // Marcar como processado para evitar duplicação
      preElement.setAttribute('data-enhanced', 'true');

      const language = Array.from(codeElement.classList)
        .find(cls => cls.startsWith('language-'))
        ?.replace('language-', '') || 'text';

      const code = codeElement.textContent || '';
      
      // Criar container wrapper
      const wrapper = document.createElement('div');
      wrapper.className = 'code-block-container';
      
      // Criar barra de ferramentas
      const toolbar = document.createElement('div');
      toolbar.className = 'language-toolbar';
      
      const languageLabel = document.createElement('span');
      languageLabel.className = 'language-label';
      const langInfo = supportedLanguages.find(l => l.code === language);
      languageLabel.textContent = langInfo ? langInfo.name : language.toUpperCase();
      
      const copyButton = document.createElement('button');
      copyButton.className = 'copy-button';
      copyButton.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
          <path d="m4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
        </svg>
        <span style="margin-left: 4px;">Copiar</span>
      `;
      
      copyButton.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(code);
          copyButton.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
            <span style="margin-left: 4px;">Copiado!</span>
          `;
          setTimeout(() => {
            copyButton.innerHTML = `
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                <path d="m4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
              </svg>
              <span style="margin-left: 4px;">Copiar</span>
            `;
          }, 2000);
        } catch (error) {
          console.error('Erro ao copiar código:', error);
        }
      });
      
      toolbar.appendChild(languageLabel);
      toolbar.appendChild(copyButton);
      
      // Inserir wrapper antes do elemento pre
      preElement.parentNode?.insertBefore(wrapper, preElement);
      
      // Mover elementos para o wrapper
      wrapper.appendChild(toolbar);
      wrapper.appendChild(preElement);
      
      // Remover border-radius superior do pre (já que agora tem toolbar)
      preElement.style.borderTopLeftRadius = '0';
      preElement.style.borderTopRightRadius = '0';
    });
  }, [containerRef]);
}