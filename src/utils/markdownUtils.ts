import { marked } from 'marked';
import { processCodeBlocks } from './syntaxHighlight';

/**
 * Utilitários para conversão e manipulação de Markdown
 */

// Configurar marked para máxima compatibilidade com quebras de linha e Markdown GitHub Flavored
marked.use({
  breaks: true, // Quebras de linha simples se tornam <br>
  gfm: true, // GitHub Flavored Markdown
});

/**
 * Detecta se o texto contém sintaxe markdown
 */
export function detectMarkdown(text: string): boolean {
  if (!text || text.trim().length === 0) {
    return false;
  }

  // Padrões comuns de markdown
  const markdownPatterns = [
    { pattern: /^#{1,6}\s+/m, name: 'Cabeçalhos' },
    { pattern: /\*\*.*?\*\*/g, name: 'Negrito' },
    { pattern: /(?<!\*)\*(?!\*).*?\*(?!\*)/g, name: 'Itálico' }, // Itálico sem conflitar com negrito
    { pattern: /^\s*[-*+]\s+/m, name: 'Listas não ordenadas' },
    { pattern: /^\s*\d+\.\s+/m, name: 'Listas ordenadas' },
    { pattern: /^\s*>\s+/m, name: 'Citações' },
    { pattern: /```[\s\S]*?```/g, name: 'Blocos de código' },
    { pattern: /`[^`\n]+`/g, name: 'Código inline' },
    { pattern: /\[.*?\]\(.*?\)/g, name: 'Links' },
    { pattern: /!\[.*?\]\(.*?\)/g, name: 'Imagens' },
    { pattern: /^\s*\|.*\|.*$/m, name: 'Tabelas' },
    { pattern: /^[-=]{3,}$/m, name: 'Separadores horizontais' },
    { pattern: /~~.*?~~/g, name: 'Tachado' },
    { pattern: /^\?\?\?\s*"[^"]+"\s*$/m, name: 'Elementos colapsáveis' },
  ];

  const matches = markdownPatterns.filter(({ pattern }) => pattern.test(text));
  
  if (matches.length > 0) {
    return true;
  }
  
  return false;
}

/**
 * Converte sintaxe colapsável personalizada para HTML
 */
function processCollapsibleElements(markdown: string): string {
  const collapsibleRegex = /^\?\?\?\s*"([^"]+)"\s*\n((?:    .*(?:\n|$))*)/gm;
  
  return markdown.replace(collapsibleRegex, (_, title, content) => {
    // Remover indentação das linhas de conteúdo
    const cleanContent = content.replace(/^    /gm, '').trim();
    
    return `<details class="collapsible-section" data-markdown-type="collapsible">
<summary>${title}</summary>
<div class="collapsible-content">
${cleanContent || 'Digite o conteúdo aqui...'}
</div>
</details>

`;
  });
}

/**
 * Converte markdown para HTML com syntax highlighting e quebras preservadas
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return '';
  try {
    // Processar elementos colapsáveis antes do marked
    const processedMarkdown = processCollapsibleElements(markdown);
    
    const html = marked.parse(processedMarkdown, { 
      gfm: true,
      breaks: true,
      async: false
    }) as string;
    
    // Aplicar syntax highlighting aos blocos de código
    return processCodeBlocks(html);
  } catch (error) {
    console.error('Erro ao converter markdown:', error);
    return markdown; // Retorna o texto original em caso de erro
  }
}

/**
 * Converte HTML básico para markdown (conversão simples)
 */
export function htmlToMarkdown(html: string): string {
  // Remove tags HTML vazias e espacos desnecessários
  let markdown = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\/p>/gi, '\n\n');

  // Cabeçalhos
  markdown = markdown
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
    .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
    .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n');

  // Elementos colapsáveis (processar antes das outras formatações)
  markdown = markdown.replace(/<details[^>]*class="collapsible-section"[^>]*>(.*?)<\/details>/gis, (_, content) => {
    // Extrair título do summary
    const summaryMatch = content.match(/<summary[^>]*>(.*?)<\/summary>/i);
    const title = summaryMatch ? summaryMatch[1].trim() : 'Clique para expandir';
    
    // Extrair conteúdo do div
    const contentMatch = content.match(/<div[^>]*class="collapsible-content"[^>]*>(.*?)<\/div>/is);
    let bodyContent = contentMatch ? contentMatch[1].trim() : '';
    
    // Remover tags p se existirem
    bodyContent = bodyContent.replace(/<\/?p[^>]*>/gi, '');
    
    // Indentar o conteúdo com 4 espaços
    const indentedContent = bodyContent
      .split('\n')
      .map((line: string) => line.trim() ? `    ${line}` : '')
      .join('\n');
    
    return `??? "${title}"\n${indentedContent}\n\n`;
  });

  // Formatação de texto
  markdown = markdown
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    .replace(/<u[^>]*>(.*?)<\/u>/gi, '_$1_');

  // Links
  markdown = markdown.replace(/<a[^>]*href=['"](.*?)['"][^>]*>(.*?)<\/a>/gi, '[$2]($1)');

  // Imagens
  markdown = markdown.replace(/<img[^>]*src=['"](.*?)['"][^>]*alt=['"](.*?)['"][^>]*\/?>/gi, '![$2]($1)');
  markdown = markdown.replace(/<img[^>]*alt=['"](.*?)['"][^>]*src=['"](.*?)['"][^>]*\/?>/gi, '![$1]($2)');
  markdown = markdown.replace(/<img[^>]*src=['"](.*?)['"][^>]*\/?>/gi, '![]($1)');

  // Listas não ordenadas
  markdown = markdown.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (_, content) => {
    const items = content.replace(/<li[^>]*>(.*?)<\/li>/gis, '- $1\n');
    return items + '\n';
  });

  // Listas ordenadas
  markdown = markdown.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (_, content) => {
    let counter = 1;
    const items = content.replace(/<li[^>]*>(.*?)<\/li>/gis, () => `${counter++}. $1\n`);
    return items + '\n';
  });

  // Citações
  markdown = markdown.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, '> $1\n\n');

  // Código inline
  markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');

  // Blocos de código
  markdown = markdown.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis, '```\n$1\n```\n\n');
  markdown = markdown.replace(/<pre[^>]*>(.*?)<\/pre>/gis, '```\n$1\n```\n\n');

  // Tabelas (conversão básica)
  markdown = markdown.replace(/<table[^>]*>(.*?)<\/table>/gis, (_, content) => {
    let result = '';
    const rows = content.match(/<tr[^>]*>(.*?)<\/tr>/gis);
    if (rows) {
      rows.forEach((row: string, index: number) => {
        const cells = row.match(/<t[hd][^>]*>(.*?)<\/t[hd]>/gis);
        if (cells) {
          const cellContents = cells.map((cell: string) => 
            cell.replace(/<t[hd][^>]*>(.*?)<\/t[hd]>/gis, '$1').trim()
          );
          result += '| ' + cellContents.join(' | ') + ' |\n';
          
          // Adicionar linha separadora após o cabeçalho
          if (index === 0) {
            result += '| ' + cellContents.map(() => '---').join(' | ') + ' |\n';
          }
        }
      });
    }
    return result + '\n';
  });

  // Linha horizontal
  markdown = markdown.replace(/<hr[^>]*\/?>/gi, '---\n\n');

  // Remover tags HTML restantes
  markdown = markdown.replace(/<[^>]*>/g, '');

  // Limpar espaços em branco excessivos
  markdown = markdown
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/g, '')
    .trim();

  return markdown;
}

/**
 * Detecta e converte automaticamente markdown colado
 */
export function handlePastedContent(pastedText: string): { isMarkdown: boolean; html: string } {
  console.log('📋 Processando texto colado:', pastedText.substring(0, 500) + (pastedText.length > 500 ? '...' : ''));
  
  const isMarkdown = detectMarkdown(pastedText);
  
  if (isMarkdown) {
    console.log('✅ É markdown! Convertendo...');
    const html = markdownToHtml(pastedText);
    console.log('🔄 HTML gerado:', html.substring(0, 500) + (html.length > 500 ? '...' : ''));
    return { isMarkdown: true, html };
  }
  
  console.log('❌ Não é markdown, mantendo texto original');
  return { isMarkdown: false, html: pastedText };
}

/**
 * Sanitiza o HTML gerado para evitar XSS (básico)
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  console.log('🧹 Sanitizando HTML:', html.substring(0, 200) + (html.length > 200 ? '...' : ''));
  
  // Remove scripts e atributos potencialmente perigosos, mas preserva conteúdo
  let sanitized = html
    .replace(/<script[\s\S]*?<\/script>/gi, '') // Remove scripts completos
    .replace(/<\/script>/gi, '') // Remove tags de script órfãs
    .replace(/<script[^>]*>/gi, '') // Remove tags de abertura de script
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/vbscript:/gi, '') // Remove vbscript: URLs
    .replace(/data:text\/html/gi, '') // Remove data URLs HTML
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '') // Remove iframes
    .replace(/<object[\s\S]*?<\/object>/gi, '') // Remove objects
    .replace(/<embed[\s\S]*?>/gi, '') // Remove embeds
    .replace(/<form[\s\S]*?<\/form>/gi, '') // Remove forms
    .replace(/<input[\s\S]*?>/gi, '') // Remove inputs
    .replace(/<textarea[\s\S]*?<\/textarea>/gi, ''); // Remove textareas

  console.log('✅ HTML sanitizado:', sanitized.substring(0, 200) + (sanitized.length > 200 ? '...' : ''));
  
  return sanitized.trim();
}