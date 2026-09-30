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
    { pattern: /\n\s*\n/, name: 'Múltiplos parágrafos' },
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
 * Protege e escapa tags HTML soltas no texto que não estão em blocos de código,
 * garantindo que explicações de tags (ex: <header>, <nav>, <img>, <a>) apareçam como texto/código destacado e não como HTML executado ou invisível.
 */
export function escapeHtmlTagsInMarkdown(markdown: string): string {
  if (!markdown) return '';

  const placeholders: Array<{ key: string; value: string }> = [];
  let counter = 0;

  // 1. Proteger blocos de código com cercas (``` ... ``` ou ~~~ ... ~~~)
  let text = markdown.replace(/(```[\s\S]*?```|~~~[\s\S]*?~~~)/g, (match) => {
    const key = `___CODE_BLOCK_${counter++}___`;
    placeholders.push({ key, value: match });
    return key;
  });

  // 2. Proteger código inline (` ... `)
  text = text.replace(/(`[^`\n]+`)/g, (match) => {
    const key = `___INLINE_CODE_${counter++}___`;
    placeholders.push({ key, value: match });
    return key;
  });

  // 3. Proteger comentários HTML do sistema (ex: <!--config:auto_grade:...-->)
  text = text.replace(/(<!--[\s\S]*?-->)/g, (match) => {
    const key = `___HTML_COMMENT_${counter++}___`;
    placeholders.push({ key, value: match });
    return key;
  });

  // 4. Proteger sintaxe colapsável personalizada (??? "...")
  text = text.replace(/^(\?\?\?\s*"[^"]+"\s*)/gm, (match) => {
    const key = `___COLLAPSIBLE_${counter++}___`;
    placeholders.push({ key, value: match });
    return key;
  });

  // 5. Proteger tags estruturais de details e summary do sistema
  text = text.replace(/(<\/?(?:details|summary)[^>]*>)/gi, (match) => {
    const key = `___DETAILS_TAG_${counter++}___`;
    placeholders.push({ key, value: match });
    return key;
  });

  // 6. Escapar tags HTML soltas no texto para que sejam exibidas como tags de código destacadas
  text = text.replace(/<(\/?)([a-zA-Z][a-zA-Z0-9-]*)([^>]*)>/g, (_, slash, tagName, rest) => {
    return `<code>&lt;${slash}${tagName}${rest}&gt;</code>`;
  });

  // 7. Restaurar os blocos protegidos
  placeholders.forEach(({ key, value }) => {
    text = text.replace(key, value);
  });

  return text;
}

/**
 * Converte markdown para HTML com syntax highlighting e quebras preservadas
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return '';
  try {
    // 1. Processar elementos colapsáveis antes do marked
    const collapsibleProcessed = processCollapsibleElements(markdown);

    // 2. Proteger e escapar tags HTML soltas para não sumirem no DOM
    const safeMarkdown = escapeHtmlTagsInMarkdown(collapsibleProcessed);
    
    // 3. Parser do Markdown
    let html = marked.parse(safeMarkdown, { 
      gfm: true,
      breaks: true,
      async: false
    }) as string;
    
    // 4. Garantir que links externos abram em nova aba com segurança
    html = html.replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"([^>]*)>/gi, (match, href, rest) => {
      if (rest.includes('target=')) return match;
      return `<a href="${href}" target="_blank" rel="noopener noreferrer"${rest}>`;
    });

    // 5. Aplicar syntax highlighting aos blocos de código
    return processCodeBlocks(html);
  } catch (error) {
    console.error('Erro ao converter markdown:', error);
    return markdown; // Retorna o texto original em caso de erro
  }
}

/**
 * Analisa um texto puro ou semi-formatado e estrutura automaticamente em Markdown elegante:
 * - Detecta seções e títulos comuns (Objetivo, Passo a passo, etc.) e converte em cabeçalhos (## )
 * - Transforma listas e etapas em itens organizados (- ou 1.)
 * - Ajusta espaçamentos entre parágrafos
 */
export function autoFormatToMarkdown(rawText: string): string {
  if (!rawText || !rawText.trim()) return '';

  let text = rawText.replace(/\r\n/g, '\n').trim();

  // Padrões de seções comumente usadas em instruções escolares/atividades
  const sectionKeywords = [
    'Objetivo',
    'Objetivos',
    'Situação proposta',
    'Contexto',
    'Passo a passo',
    'Etapas',
    'Instruções',
    'Orientações',
    'Critérios de Avaliação',
    'Critérios',
    'Exemplo de Modelo de Conteúdo de Postagem',
    'Exemplo de Modelo',
    'Exemplo',
    'Observação Final',
    'Observações',
    'Observação',
    'Atenção',
    'Importante',
    'Prazo de Entrega',
    'Requisitos'
  ];

  // Separar tópicos conhecidos mesmo se vierem grudados no texto
  for (const keyword of sectionKeywords) {
    const re = new RegExp(`(^|[.!?]\\s+|\\n)(${keyword}[:.]?)(\\s+|$)`, 'gi');
    text = text.replace(re, (_, prefix, title) => {
      const cleanPrefix = prefix.trim();
      const cleanTitle = title.replace(/[:.]$/, '').trim();
      return `${cleanPrefix ? cleanPrefix + '\n\n' : '\n\n'}## ${cleanTitle}\n\n`;
    });
  }

  // Separar instruções de ação em itens de lista
  const actionVerbs = 'Acesse|Clique|No menu|Digite|Escreva|Adicione|Use|No painel|Defina|Revise|Publique|Confirme|Envie|Abra|Crie|Selecione|Faça';
  const actionRe = new RegExp(`([.!?])\\s+(${actionVerbs})\\b`, 'gi');
  text = text.replace(actionRe, '$1\n- $2');

  // Separar rótulos conhecidos como "Título sugerido:", "Parágrafo 1:" etc.
  text = text.replace(/([.!?]|\n|^)\s*(Título sugerido|Parágrafo \d+|Lista sugerida)[:.]\s*/gi, (_, __, label) => {
    return `\n- **${label}:** `;
  });

  // Converter tags HTML soltas citadas no texto (ex: <header>, <nav>, etc.) em código inline Markdown com crases
  const looseTagsRegex = /(?<!`)(<(?:\/)?(?:header|nav|main|article|section|aside|footer|figure|figcaption|div|span|p|a|img|ul|ol|li|table|tr|td|th|form|input|button|select|option|textarea|label|details|summary|canvas|svg|audio|video|meta|link|style|head|body|html)[^>]*>)(?!`)/gi;
  text = text.replace(looseTagsRegex, '`$1`');

  return text.replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Converte HTML para markdown de forma limpa e segura,
 * preservando blocos de código e mantendo tags HTML soltas como código inline Markdown (`<tag>`),
 * evitando que menções a tags sumam ou virem vírgulas.
 */
export function htmlToMarkdown(html: string): string {
  if (!html) return '';

  const placeholders: Array<{ key: string; value: string }> = [];
  let counter = 0;

  let markdown = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\/p>/gi, '\n\n');

  // 1. Proteger blocos de código
  markdown = markdown.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_, code) => {
    const key = `___PRE_CODE_${counter++}___`;
    placeholders.push({ key, value: `\`\`\`\n${code.trim()}\n\`\`\`\n\n` });
    return key;
  });
  markdown = markdown.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_, code) => {
    const key = `___PRE_BLOCK_${counter++}___`;
    placeholders.push({ key, value: `\`\`\`\n${code.trim()}\n\`\`\`\n\n` });
    return key;
  });

  // 2. Proteger código inline
  markdown = markdown.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_, code) => {
    const key = `___INLINE_CODE_${counter++}___`;
    const cleanCode = code
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
    placeholders.push({ key, value: `\`${cleanCode}\`` });
    return key;
  });

  // 3. Cabeçalhos
  markdown = markdown
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
    .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
    .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n');

  // 4. Elementos colapsáveis
  markdown = markdown.replace(/<details[^>]*class="collapsible-section"[^>]*>(.*?)<\/details>/gis, (_, content) => {
    const summaryMatch = content.match(/<summary[^>]*>(.*?)<\/summary>/i);
    const title = summaryMatch ? summaryMatch[1].trim() : 'Clique para expandir';
    const contentMatch = content.match(/<div[^>]*class="collapsible-content"[^>]*>(.*?)<\/div>/is);
    let bodyContent = contentMatch ? contentMatch[1].trim() : '';
    bodyContent = bodyContent.replace(/<\/?p[^>]*>/gi, '');
    const indentedContent = bodyContent
      .split('\n')
      .map((line: string) => line.trim() ? `    ${line}` : '')
      .join('\n');
    return `??? "${title}"\n${indentedContent}\n\n`;
  });

  // 5. Formatação de texto
  markdown = markdown
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    .replace(/<u[^>]*>(.*?)<\/u>/gi, '_$1_')
    .replace(/<s[^>]*>(.*?)<\/s>/gi, '~~$1~~')
    .replace(/<del[^>]*>(.*?)<\/del>/gi, '~~$1~~');

  // 6. Links e imagens
  markdown = markdown.replace(/<a[^>]*href=['"](.*?)['"][^>]*>(.*?)<\/a>/gi, '[$2]($1)');
  markdown = markdown.replace(/<img[^>]*src=['"](.*?)['"][^>]*alt=['"](.*?)['"][^>]*\/?>/gi, '![$2]($1)');
  markdown = markdown.replace(/<img[^>]*alt=['"](.*?)['"][^>]*src=['"](.*?)['"][^>]*\/?>/gi, '![$1]($2)');
  markdown = markdown.replace(/<img[^>]*src=['"](.*?)['"][^>]*\/?>/gi, '![]($1)');

  // 7. Listas não ordenadas e ordenadas
  markdown = markdown.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (_, content) => {
    const items = content.replace(/<li[^>]*>(.*?)<\/li>/gis, '- $1\n');
    return items + '\n';
  });
  markdown = markdown.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (_, content) => {
    let counter = 1;
    const items = content.replace(/<li[^>]*>(.*?)<\/li>/gis, () => `${counter++}. $1\n`);
    return items + '\n';
  });

  // 8. Citações
  markdown = markdown.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, '> $1\n\n');

  // 9. Tabelas
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
          if (index === 0) {
            result += '| ' + cellContents.map(() => '---').join(' | ') + ' |\n';
          }
        }
      });
    }
    return result + '\n';
  });

  // 10. Linha horizontal
  markdown = markdown.replace(/<hr[^>]*\/?>/gi, '---\n\n');

  // 11. Descascar tags de layout estrutural (div, span) mantendo seu conteúdo intacto
  markdown = markdown.replace(/<\/?(?:div|span)[^>]*>/gi, '');

  // 12. Decodificar entidades HTML comuns
  markdown = markdown
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

  // 13. Preservar tags HTML soltas no texto transformando em código inline (`<tag>`)
  // NUNCA apagar com regex vazio!
  markdown = markdown.replace(/<(\/?)([a-zA-Z][a-zA-Z0-9-]*)([^>]*)>/g, (_, slash, tag, rest) => {
    return `\`<${slash}${tag}${rest}>\``;
  });

  // 14. Restaurar os blocos de código protegidos
  placeholders.forEach(({ key, value }) => {
    markdown = markdown.replace(key, value);
  });

  // Limpar espaços em branco excessivos
  return markdown
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/g, '')
    .trim();
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