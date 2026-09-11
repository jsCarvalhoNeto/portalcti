/**
 * Utilitário para gerenciar marcação e destaque de texto (Marca-Texto)
 * nas aulas do cronograma escolar.
 */

export interface HighlightColor {
  id: string;
  name: string;
  dotClass: string;
  lightBg: string;
  lightText: string;
  darkBg: string;
  darkText: string;
  borderColor: string;
}

export const HIGHLIGHT_COLORS: HighlightColor[] = [
  {
    id: 'yellow',
    name: 'Amarelo',
    dotClass: 'bg-yellow-400 border-yellow-500',
    lightBg: '#fef08a',
    lightText: '#713f12',
    darkBg: 'rgba(234, 179, 8, 0.45)',
    darkText: '#fef9c3',
    borderColor: '#eab308'
  },
  {
    id: 'green',
    name: 'Verde',
    dotClass: 'bg-emerald-400 border-emerald-500',
    lightBg: '#bbf7d0',
    lightText: '#14532d',
    darkBg: 'rgba(34, 197, 94, 0.45)',
    darkText: '#dcfce7',
    borderColor: '#22c55e'
  },
  {
    id: 'blue',
    name: 'Azul',
    dotClass: 'bg-sky-400 border-sky-500',
    lightBg: '#bae6fd',
    lightText: '#0c4a6e',
    darkBg: 'rgba(14, 165, 233, 0.45)',
    darkText: '#e0f2fe',
    borderColor: '#0ea5e9'
  },
  {
    id: 'pink',
    name: 'Rosa',
    dotClass: 'bg-pink-400 border-pink-500',
    lightBg: '#fbcfe8',
    lightText: '#831843',
    darkBg: 'rgba(236, 72, 153, 0.45)',
    darkText: '#fce7f3',
    borderColor: '#ec4899'
  },
  {
    id: 'orange',
    name: 'Laranja',
    dotClass: 'bg-orange-400 border-orange-500',
    lightBg: '#fed7aa',
    lightText: '#7c2d12',
    darkBg: 'rgba(249, 115, 22, 0.45)',
    darkText: '#ffedd5',
    borderColor: '#f97316'
  }
];

export function getColorById(id: string): HighlightColor {
  return HIGHLIGHT_COLORS.find(c => c.id === id) || HIGHLIGHT_COLORS[0];
}

/**
 * Envolve os nós de texto contidos dentro do Range do usuário em tags <mark>
 */
export function applyHighlight(range: Range, colorId: string, container: HTMLElement): string | null {
  if (range.collapsed) return null;

  const color = getColorById(colorId);
  const highlightId = 'hl_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

  // Coleta todos os nós de texto contidos ou intersectados pelo range dentro do container
  const walker = document.createTreeWalker(
    range.commonAncestorContainer,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        if (!node.textContent || node.textContent.length === 0) {
          return NodeFilter.FILTER_REJECT;
        }
        // Verifica se o nó pertence ao container
        if (!container.contains(node)) {
          return NodeFilter.FILTER_REJECT;
        }
        const nodeRange = document.createRange();
        nodeRange.selectNodeContents(node);
        const intersects = 
          range.compareBoundaryPoints(Range.END_TO_START, nodeRange) < 0 &&
          range.compareBoundaryPoints(Range.START_TO_END, nodeRange) > 0;
        return intersects ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    }
  );

  const textNodes: Text[] = [];
  if (range.commonAncestorContainer.nodeType === Node.TEXT_NODE) {
    if (container.contains(range.commonAncestorContainer)) {
      textNodes.push(range.commonAncestorContainer as Text);
    }
  } else {
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode as Text);
    }
  }

  if (textNodes.length === 0) return null;

  let appliedCount = 0;

  textNodes.forEach((textNode) => {
    const isStart = textNode === range.startContainer;
    const isEnd = textNode === range.endContainer;

    const startOffset = isStart ? range.startOffset : 0;
    const endOffset = isEnd ? range.endOffset : (textNode.textContent?.length || 0);

    if (startOffset >= endOffset) return;

    const fullText = textNode.textContent || '';
    const beforeText = fullText.substring(0, startOffset);
    const highlightText = fullText.substring(startOffset, endOffset);
    const afterText = fullText.substring(endOffset);

    // Se highlightText for apenas espaços vazios, não marca
    if (!highlightText.trim()) return;

    const mark = document.createElement('mark');
    mark.className = `lesson-highlight highlight-${color.id}`;
    mark.setAttribute('data-highlight-id', highlightId);
    mark.setAttribute('data-color', color.id);
    mark.setAttribute('title', 'Clique para gerenciar este destaque');
    mark.textContent = highlightText;

    const parent = textNode.parentNode;
    if (!parent) return;

    if (afterText) {
      parent.insertBefore(document.createTextNode(afterText), textNode.nextSibling);
    }
    parent.insertBefore(mark, textNode.nextSibling);
    if (beforeText) {
      textNode.textContent = beforeText;
    } else {
      parent.removeChild(textNode);
    }

    appliedCount++;
  });

  if (appliedCount === 0) return null;

  return highlightId;
}

/**
 * Remove um destaque pelo ID e restaura os nós de texto
 */
export function removeHighlightById(highlightId: string, container: HTMLElement): void {
  const marks = container.querySelectorAll(`mark[data-highlight-id="${highlightId}"]`);
  marks.forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) return;
    while (mark.firstChild) {
      parent.insertBefore(mark.firstChild, mark);
    }
    parent.removeChild(mark);
  });
  container.normalize();
}

/**
 * Altera a cor de um destaque existente
 */
export function updateHighlightColor(highlightId: string, newColorId: string, container: HTMLElement): void {
  const marks = container.querySelectorAll(`mark[data-highlight-id="${highlightId}"]`);
  const newColor = getColorById(newColorId);

  marks.forEach((mark) => {
    HIGHLIGHT_COLORS.forEach(c => mark.classList.remove(`highlight-${c.id}`));
    mark.classList.add(`highlight-${newColor.id}`);
    mark.setAttribute('data-color', newColor.id);
  });
}

/**
 * Remove todas as marcações do container
 */
export function clearAllHighlights(container: HTMLElement): void {
  const marks = container.querySelectorAll('mark.lesson-highlight');
  marks.forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) return;
    while (mark.firstChild) {
      parent.insertBefore(mark.firstChild, mark);
    }
    parent.removeChild(mark);
  });
  container.normalize();
}

/**
 * Conta quantos destaques únicos existem no container
 */
export function countUniqueHighlights(container: HTMLElement): number {
  const marks = container.querySelectorAll('mark.lesson-highlight[data-highlight-id]');
  const uniqueIds = new Set<string>();
  marks.forEach((m) => {
    const id = m.getAttribute('data-highlight-id');
    if (id) uniqueIds.add(id);
  });
  return uniqueIds.size;
}

/**
 * Salva os destaques no localStorage
 */
export function saveLessonHighlights(
  lessonId: string | number,
  tab: string,
  contentSignature: string,
  container: HTMLElement
): void {
  try {
    const key = `lesson_highlights_${lessonId}_${tab}`;
    const count = countUniqueHighlights(container);
    if (count === 0) {
      localStorage.removeItem(key);
      return;
    }
    const payload = {
      lessonId,
      tab,
      contentSignature,
      html: container.innerHTML,
      count,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch (err) {
    console.warn('Erro ao salvar destaques no localStorage:', err);
  }
}

/**
 * Carrega o HTML com destaques salvos do localStorage
 */
export function loadSavedHighlightsHtml(
  lessonId: string | number,
  tab: string,
  contentSignature: string
): string | null {
  try {
    const key = `lesson_highlights_${lessonId}_${tab}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && data.contentSignature === contentSignature && typeof data.html === 'string') {
      return data.html;
    }
  } catch (err) {
    console.warn('Erro ao recuperar destaques salvos:', err);
  }
  return null;
}

/**
 * Remove as marcações salvas no localStorage
 */
export function removeSavedHighlights(lessonId: string | number, tab: string): void {
  try {
    const key = `lesson_highlights_${lessonId}_${tab}`;
    localStorage.removeItem(key);
  } catch (err) {
    console.warn('Erro ao remover destaques do storage:', err);
  }
}
