import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  MousePointer,
  Hand,
  Pencil,
  Square,
  Circle,
  Diamond,
  ArrowRight,
  Minus,
  Type,
  StickyNote,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Copy,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Sun,
  Moon,
  HelpCircle,
  Check,
  X
} from 'lucide-react';

// Tipos de Ferramentas
export type ToolType = 
  | 'select' 
  | 'hand' 
  | 'pencil' 
  | 'rectangle' 
  | 'ellipse' 
  | 'diamond' 
  | 'arrow' 
  | 'line' 
  | 'text' 
  | 'sticky' 
  | 'eraser';

export type FillStyle = 'none' | 'semi' | 'solid';
export type StrokeStyle = 'solid' | 'dashed' | 'dotted';
export type ResizeHandle = 'tl' | 'tr' | 'br' | 'bl';

export interface Point {
  x: number;
  y: number;
}

export interface WhiteboardElement {
  id: string;
  type: ToolType;
  x: number;
  y: number;
  width: number;
  height: number;
  points?: Point[]; // Para traço livre (pencil)
  strokeColor: string;
  fillColor?: string;
  fillStyle: FillStyle;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  text?: string;
  stickyColor?: string;
  fontSize?: number;
}

interface ResizeState {
  handle: ResizeHandle;
  initialX: number;
  initialY: number;
  initialWidth: number;
  initialHeight: number;
  initialFontSize: number;
  startMouseX: number;
  startMouseY: number;
}

const PALETTE_COLORS = [
  { label: 'Padrão', value: '#1e293b', darkValue: '#f8fafc' },
  { label: 'Grafite', value: '#64748b', darkValue: '#94a3b8' },
  { label: 'Vermelho', value: '#e11d48', darkValue: '#fb7185' },
  { label: 'Laranja', value: '#ea580c', darkValue: '#fb923c' },
  { label: 'Âmbar', value: '#d97706', darkValue: '#fbbf24' },
  { label: 'Verde', value: '#16a34a', darkValue: '#4ade80' },
  { label: 'Azul', value: '#2563eb', darkValue: '#60a5fa' },
  { label: 'Roxo', value: '#9333ea', darkValue: '#c084fc' },
  { label: 'Rosa', value: '#db2777', darkValue: '#f472b6' }
];

const STICKY_COLORS = [
  { name: 'Amarelo', bg: '#fef08a', text: '#713f12', border: '#fde047' },
  { name: 'Verde', bg: '#bbf7d0', text: '#14532d', border: '#86efac' },
  { name: 'Azul', bg: '#bae6fd', text: '#0c4a6e', border: '#7dd3fc' },
  { name: 'Rosa', bg: '#fbcfe8', text: '#831843', border: '#f472b6' },
  { name: 'Roxo', bg: '#e9d5ff', text: '#581c87', border: '#d8b4fe' },
  { name: 'Laranja', bg: '#fed7aa', text: '#7c2d12', border: '#fdba74' }
];

const TEMPLATES = [
  {
    id: 'blank',
    title: 'Lousa em Branco',
    desc: 'Comece com uma área limpa de trabalho'
  },
  {
    id: 'flowchart',
    title: 'Fluxograma de Algoritmo',
    desc: 'Estrutura padrão de Início, Processamento, Decisão (If/Else) e Fim'
  },
  {
    id: 'kanban',
    title: 'Quadro 3 Colunas (Kanban)',
    desc: 'A Fazer, Em Andamento e Concluído com Post-its ilustrativos'
  },
  {
    id: 'architecture',
    title: 'Arquitetura Web (Camadas)',
    desc: 'Frontend (React), API Backend e Banco de Dados com conexões'
  },
  {
    id: 'mindmap',
    title: 'Mapa Mental de Conceitos',
    desc: 'Tópico Central com ramificações conceituais para aula teórica'
  }
];

const STORAGE_KEY = 'cursotecnico_whiteboard_elements_v1';

export default function WhiteboardUtility() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Estados de Configuração e Ferramentas
  const [currentTool, setCurrentTool] = useState<ToolType>('pencil');
  const [strokeColor, setStrokeColor] = useState<string>('#2563eb');
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [fillStyle, setFillStyle] = useState<FillStyle>('semi');
  const [strokeStyle, setStrokeStyle] = useState<StrokeStyle>('solid');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [selectedStickyColor, setSelectedStickyColor] = useState<string>(STICKY_COLORS[0].bg);
  const [fontSize, setFontSize] = useState<number>(22);

  // Elementos e Histórico
  const [elements, setElements] = useState<WhiteboardElement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Erro ao restaurar lousa:', e);
    }
    return [];
  });

  const [history, setHistory] = useState<WhiteboardElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Estados de Interação
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentElement, setCurrentElement] = useState<WhiteboardElement | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [draggingElementId, setDraggingElementId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });

  // Redimensionamento
  const [resizingState, setResizingState] = useState<ResizeState | null>(null);
  const [hoveredHandle, setHoveredHandle] = useState<ResizeHandle | null>(null);

  // Pan & Zoom
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });

  // Edição de Texto no Canvas
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [textInputPosition, setTextInputPosition] = useState<{ x: number; y: number; width: number; height: number; isSticky?: boolean } | null>(null);
  const [textContent, setTextContent] = useState<string>('');
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  // UI State
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState<boolean>(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);

  const selectedElement = elements.find(el => el.id === selectedElementId);

  // Salvar no LocalStorage automaticamente
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(elements));
    } catch (e) {
      console.error('Erro ao salvar no localStorage:', e);
    }
  }, [elements]);

  // Inicializar Histórico na primeira montagem
  useEffect(() => {
    if (history.length === 0 && elements.length > 0) {
      setHistory([elements]);
      setHistoryIndex(0);
    }
  }, []);

  // Registrar ação no histórico
  const pushToHistory = useCallback((newElements: WhiteboardElement[]) => {
    setHistory(prev => {
      const next = prev.slice(0, historyIndex + 1);
      return [...next, newElements];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  // Desfazer
  const handleUndo = useCallback(() => {
    if (editingTextId) finishTextEditing();
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setElements(history[prevIndex] || []);
      setSelectedElementId(null);
    } else if (historyIndex === 0) {
      setHistoryIndex(-1);
      setElements([]);
      setSelectedElementId(null);
    }
  }, [historyIndex, history, editingTextId]);

  // Refazer
  const handleRedo = useCallback(() => {
    if (editingTextId) finishTextEditing();
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setElements(history[nextIndex]);
      setSelectedElementId(null);
    }
  }, [historyIndex, history, editingTextId]);

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') {
          finishTextEditing();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId) {
          e.preventDefault();
          const next = elements.filter(el => el.id !== selectedElementId);
          setElements(next);
          pushToHistory(next);
          setSelectedElementId(null);
          toast.info('Elemento excluído');
        }
      } else if (e.key === 'Escape') {
        setSelectedElementId(null);
      } else if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'v':
          case '1':
            setCurrentTool('select');
            break;
          case 'h':
            setCurrentTool('hand');
            break;
          case 'p':
          case '2':
            setCurrentTool('pencil');
            break;
          case 'r':
          case '3':
            setCurrentTool('rectangle');
            break;
          case 'o':
          case 'c':
          case '4':
            setCurrentTool('ellipse');
            break;
          case 'd':
          case '5':
            setCurrentTool('diamond');
            break;
          case 'a':
          case '6':
            setCurrentTool('arrow');
            break;
          case 'l':
          case '7':
            setCurrentTool('line');
            break;
          case 't':
          case '8':
            setCurrentTool('text');
            break;
          case 's':
          case '9':
            setCurrentTool('sticky');
            break;
          case 'e':
          case '0':
            setCurrentTool('eraser');
            break;
          case 'f':
            toggleFullscreen();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, elements, historyIndex, history, editingTextId, handleUndo, handleRedo]);

  // Converter coordenadas da tela para o canvas lógico
  const screenToCanvas = (screenX: number, screenY: number): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = (screenX - rect.left - pan.x) / zoom;
    const y = (screenY - rect.top - pan.y) / zoom;
    return { x, y };
  };

  // Calcular a Bounding Box de um elemento
  const getBoundingBox = (el: WhiteboardElement) => {
    const pad = 6;
    let boxX = el.x - pad;
    let boxY = el.y - pad;
    let boxW = el.width + pad * 2;
    let boxH = el.height + pad * 2;

    if (el.type === 'text') {
      const currentFontSize = el.fontSize || 22;
      const lines = el.text ? el.text.split('\n') : ['Texto'];
      const maxLen = Math.max(...lines.map(l => l.length), 4);
      boxW = maxLen * (currentFontSize * 0.6) + pad * 2;
      boxH = lines.length * (currentFontSize * 1.35) + pad * 2;
    } else if (el.type === 'sticky') {
      boxW = Math.max(el.width, 180) + pad * 2;
      boxH = Math.max(el.height, 140) + pad * 2;
    } else if (el.type === 'pencil' && el.points && el.points.length > 0) {
      const xs = el.points.map(p => p.x);
      const ys = el.points.map(p => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      boxX = minX - pad;
      boxY = minY - pad;
      boxW = (maxX - minX) + pad * 2;
      boxH = (maxY - minY) + pad * 2;
    }

    return { boxX, boxY, boxW, boxH };
  };

  // Obter as 4 alças de redimensionamento nos cantos
  const getResizeHandles = (el: WhiteboardElement) => {
    const { boxX, boxY, boxW, boxH } = getBoundingBox(el);
    return {
      tl: { x: boxX, y: boxY },
      tr: { x: boxX + boxW, y: boxY },
      br: { x: boxX + boxW, y: boxY + boxH },
      bl: { x: boxX, y: boxY + boxH }
    };
  };

  // Detectar se o mouse está sobre uma alça
  const getHandleUnderMouse = (canvasX: number, canvasY: number, el: WhiteboardElement): ResizeHandle | null => {
    const handles = getResizeHandles(el);
    const hitRadius = 10 / zoom; // raio de clique proporcional

    if (Math.hypot(canvasX - handles.tl.x, canvasY - handles.tl.y) <= hitRadius) return 'tl';
    if (Math.hypot(canvasX - handles.tr.x, canvasY - handles.tr.y) <= hitRadius) return 'tr';
    if (Math.hypot(canvasX - handles.br.x, canvasY - handles.br.y) <= hitRadius) return 'br';
    if (Math.hypot(canvasX - handles.bl.x, canvasY - handles.bl.y) <= hitRadius) return 'bl';

    return null;
  };

  // Redimensionar Canvas mantendo proporção e High DPI
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      render();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [elements, currentElement, selectedElementId, isDarkMode, pan, zoom]);

  // Linhas manuais orgânicas
  const drawRoughLine = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    const midX = (x1 + x2) / 2 + (Math.random() - 0.5) * 1.2;
    const midY = (y1 + y2) / 2 + (Math.random() - 0.5) * 1.2;
    ctx.quadraticCurveTo(midX, midY, x2, y2);
    ctx.stroke();
  };

  // Renderizador Principal do Canvas
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.scale(dpr, dpr);

    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    // Fundo da Lousa
    const bgColor = isDarkMode ? '#131823' : '#f8fafc';
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Grid Pontilhado estilo Excalidraw
    const dotColor = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.09)';
    const gridSize = 24 * zoom;
    const offsetX = (pan.x % gridSize);
    const offsetY = (pan.y % gridSize);

    ctx.fillStyle = dotColor;
    for (let x = offsetX; x < width; x += gridSize) {
      for (let y = offsetY; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.arc(x, y, 1.2 * Math.min(zoom, 1.5), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Aplicar Pan e Zoom
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    const allElements = [...elements];
    if (currentElement) {
      allElements.push(currentElement);
    }

    allElements.forEach(el => {
      // Se estiver sendo editado no input HTML, não renderizar o texto duplicado no canvas
      if (el.id === editingTextId && el.type === 'text') {
        return;
      }

      ctx.save();
      const isSelected = el.id === selectedElementId;

      const color = isDarkMode && el.strokeColor === '#1e293b' ? '#f8fafc' : el.strokeColor;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = el.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (el.strokeStyle === 'dashed') {
        ctx.setLineDash([8, 6]);
      } else if (el.strokeStyle === 'dotted') {
        ctx.setLineDash([3, 5]);
      } else {
        ctx.setLineDash([]);
      }

      const applyFill = (customColor?: string) => {
        if (el.fillStyle === 'none') return false;
        const fillCol = customColor || color;
        if (el.fillStyle === 'semi') {
          ctx.fillStyle = fillCol.startsWith('#') ? `${fillCol}25` : 'rgba(37, 99, 235, 0.15)';
        } else {
          ctx.fillStyle = fillCol;
        }
        return true;
      };

      switch (el.type) {
        case 'pencil': {
          if (el.points && el.points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(el.points[0].x, el.points[0].y);
            for (let i = 1; i < el.points.length; i++) {
              const p1 = el.points[i - 1];
              const p2 = el.points[i];
              const midX = (p1.x + p2.x) / 2;
              const midY = (p1.y + p2.y) / 2;
              ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
            }
            ctx.stroke();
          }
          break;
        }

        case 'rectangle': {
          const radius = 8;
          ctx.beginPath();
          ctx.roundRect(el.x, el.y, el.width, el.height, radius);
          if (applyFill()) {
            ctx.fill();
          }
          ctx.stroke();
          break;
        }

        case 'ellipse': {
          const cx = el.x + el.width / 2;
          const cy = el.y + el.height / 2;
          const rx = Math.abs(el.width / 2);
          const ry = Math.abs(el.height / 2);

          ctx.beginPath();
          ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
          if (applyFill()) {
            ctx.fill();
          }
          ctx.stroke();
          break;
        }

        case 'diamond': {
          const cx = el.x + el.width / 2;
          const cy = el.y + el.height / 2;

          ctx.beginPath();
          ctx.moveTo(cx, el.y);
          ctx.lineTo(el.x + el.width, cy);
          ctx.lineTo(cx, el.y + el.height);
          ctx.lineTo(el.x, cy);
          ctx.closePath();
          if (applyFill()) {
            ctx.fill();
          }
          ctx.stroke();
          break;
        }

        case 'line': {
          drawRoughLine(ctx, el.x, el.y, el.x + el.width, el.y + el.height);
          break;
        }

        case 'arrow': {
          const fromX = el.x;
          const fromY = el.y;
          const toX = el.x + el.width;
          const toY = el.y + el.height;

          drawRoughLine(ctx, fromX, fromY, toX, toY);

          const angle = Math.atan2(toY - fromY, toX - fromX);
          const headLen = Math.max(14, el.strokeWidth * 3);

          ctx.beginPath();
          ctx.moveTo(toX, toY);
          ctx.lineTo(
            toX - headLen * Math.cos(angle - Math.PI / 6),
            toY - headLen * Math.sin(angle - Math.PI / 6)
          );
          ctx.moveTo(toX, toY);
          ctx.lineTo(
            toX - headLen * Math.cos(angle + Math.PI / 6),
            toY - headLen * Math.sin(angle + Math.PI / 6)
          );
          ctx.stroke();
          break;
        }

        case 'text': {
          if (el.text) {
            const currentFontSize = el.fontSize || 22;
            ctx.font = `600 ${currentFontSize}px "Segoe UI", Inter, -apple-system, sans-serif`;
            ctx.fillStyle = isDarkMode && (el.strokeColor === '#1e293b' || !el.strokeColor) ? '#f8fafc' : el.strokeColor;
            
            const lines = el.text.split('\n');
            const lineHeight = currentFontSize * 1.35;
            lines.forEach((line, index) => {
              ctx.fillText(line, el.x, el.y + (index + 1) * lineHeight - 4);
            });
          }
          break;
        }

        case 'sticky': {
          const stickyBg = el.stickyColor || '#fef08a';
          const stickyBorder = isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)';
          const w = Math.max(el.width, 180);
          const h = Math.max(el.height, 140);

          ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
          ctx.shadowBlur = 10;
          ctx.shadowOffsetY = 5;

          ctx.fillStyle = stickyBg;
          ctx.beginPath();
          ctx.roundRect(el.x, el.y, w, h, 8);
          ctx.fill();

          ctx.shadowColor = 'transparent';

          ctx.strokeStyle = stickyBorder;
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
          ctx.fillRect(el.x, el.y, w, 24);

          if (el.id !== editingTextId) {
            if (el.text) {
              ctx.fillStyle = '#1e293b';
              ctx.font = `500 15px "Segoe UI", Inter, sans-serif`;
              const lines = el.text.split('\n');
              const lineHeight = 22;
              lines.forEach((line, index) => {
                ctx.fillText(line, el.x + 14, el.y + 46 + index * lineHeight);
              });
            } else {
              ctx.fillStyle = 'rgba(30, 41, 59, 0.4)';
              ctx.font = `italic 13px "Segoe UI", sans-serif`;
              ctx.fillText('2 cliques para editar...', el.x + 14, el.y + 48);
            }
          }
          break;
        }
      }

      // Caixa de Seleção e Alças de Redimensionamento
      if (isSelected) {
        const { boxX, boxY, boxW, boxH } = getBoundingBox(el);

        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        // Renderizar as 4 alças nos cantos
        ctx.setLineDash([]);
        const handles = getResizeHandles(el);
        const handleSize = 8;

        Object.entries(handles).forEach(([key, pt]) => {
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 1.5;
          ctx.fillRect(pt.x - handleSize / 2, pt.y - handleSize / 2, handleSize, handleSize);
          ctx.strokeRect(pt.x - handleSize / 2, pt.y - handleSize / 2, handleSize, handleSize);
        });
      }

      ctx.restore();
    });

    ctx.restore();
    ctx.restore();
  }, [elements, currentElement, selectedElementId, isDarkMode, pan, zoom, editingTextId]);

  useEffect(() => {
    render();
  }, [render]);

  // Colisão de Elementos
  const getElementAtPosition = (x: number, y: number): WhiteboardElement | null => {
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      const { boxX, boxY, boxW, boxH } = getBoundingBox(el);

      if (el.type === 'pencil' && el.points) {
        for (const p of el.points) {
          const dist = Math.hypot(p.x - x, p.y - y);
          if (dist <= Math.max(el.strokeWidth, 8)) {
            return el;
          }
        }
      } else if (x >= boxX && x <= boxX + boxW && y >= boxY && y <= boxY + boxH) {
        return el;
      }
    }
    return null;
  };

  // Iniciar criação/edição de texto
  const startTextEditing = (x: number, y: number, existingElement?: WhiteboardElement) => {
    let targetId: string;
    let initialText = '';
    let isSticky = false;
    let targetWidth = 240;
    let targetHeight = 90;

    if (existingElement) {
      targetId = existingElement.id;
      initialText = existingElement.text || '';
      isSticky = existingElement.type === 'sticky';
      if (isSticky) {
        targetWidth = Math.max(existingElement.width, 180);
        targetHeight = Math.max(existingElement.height, 140);
      }
    } else {
      targetId = `el_${Date.now()}`;
      const newEl: WhiteboardElement = {
        id: targetId,
        type: 'text',
        x,
        y,
        width: 180,
        height: 40,
        strokeColor,
        strokeWidth: 2,
        fillStyle: 'none',
        strokeStyle: 'solid',
        text: '',
        fontSize: fontSize
      };

      setElements(prev => [...prev, newEl]);
      initialText = '';
    }

    setSelectedElementId(targetId);
    setEditingTextId(targetId);
    setTextContent(initialText);

    const elementX = existingElement ? existingElement.x : x;
    const elementY = existingElement ? existingElement.y : y;

    setTextInputPosition({
      x: pan.x + elementX * zoom,
      y: pan.y + elementY * zoom,
      width: Math.max(targetWidth * zoom, 200),
      height: Math.max(targetHeight * zoom, 80),
      isSticky
    });

    setTimeout(() => {
      textInputRef.current?.focus();
      textInputRef.current?.select();
    }, 40);
  };

  // Finalizar edição de texto
  const finishTextEditing = () => {
    if (editingTextId) {
      const trimmed = textContent.trim();
      let next: WhiteboardElement[];

      const el = elements.find(e => e.id === editingTextId);
      if (!trimmed && el && el.type === 'text') {
        next = elements.filter(e => e.id !== editingTextId);
      } else {
        next = elements.map(e => {
          if (e.id === editingTextId) {
            return { ...e, text: textContent };
          }
          return el;
        });
      }

      setElements(next);
      pushToHistory(next);
      setEditingTextId(null);
      setTextInputPosition(null);
      setCurrentTool('select');
    }
  };

  // Cancelar edição de texto
  const cancelTextEditing = () => {
    if (editingTextId) {
      const el = elements.find(e => e.id === editingTextId);
      if (el && el.type === 'text' && !el.text) {
        setElements(prev => prev.filter(e => e.id !== editingTextId));
      }
      setEditingTextId(null);
      setTextInputPosition(null);
      setCurrentTool('select');
    }
  };

  // Mudar cor do elemento selecionado ou da ferramenta
  const handleColorChange = (newColor: string) => {
    setStrokeColor(newColor);
    if (selectedElementId) {
      const next = elements.map(el => {
        if (el.id === selectedElementId) {
          return { ...el, strokeColor: newColor };
        }
        return el;
      });
      setElements(next);
      pushToHistory(next);
    }
  };

  // Mudar tamanho da fonte do texto selecionado ou padrão
  const handleFontSizeChange = (newSize: number) => {
    setFontSize(newSize);
    if (selectedElementId) {
      const next = elements.map(el => {
        if (el.id === selectedElementId && el.type === 'text') {
          return { ...el, fontSize: newSize };
        }
        return el;
      });
      setElements(next);
      pushToHistory(next);
    }
  };

  // MOUSE DOWN
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (editingTextId) {
      finishTextEditing();
    }

    const { x, y } = screenToCanvas(e.clientX, e.clientY);

    // Pan (Hand ou Botão do Meio)
    if (currentTool === 'hand' || e.button === 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    // Se estiver sobre uma alça de redimensionamento do elemento selecionado
    if (selectedElement && hoveredHandle && currentTool === 'select') {
      const { boxW, boxH } = getBoundingBox(selectedElement);
      setResizingState({
        handle: hoveredHandle,
        initialX: selectedElement.x,
        initialY: selectedElement.y,
        initialWidth: selectedElement.width || boxW,
        initialHeight: selectedElement.height || boxH,
        initialFontSize: selectedElement.fontSize || 22,
        startMouseX: x,
        startMouseY: y
      });
      return;
    }

    // Borracha (Eraser)
    if (currentTool === 'eraser') {
      const hit = getElementAtPosition(x, y);
      if (hit) {
        const next = elements.filter(el => el.id !== hit.id);
        setElements(next);
        pushToHistory(next);
        toast.info('Elemento apagado');
      }
      setIsDrawing(true);
      return;
    }

    // Ferramenta Texto
    if (currentTool === 'text') {
      const hit = getElementAtPosition(x, y);
      if (hit && (hit.type === 'text' || hit.type === 'sticky')) {
        startTextEditing(x, y, hit);
      } else {
        startTextEditing(x, y);
      }
      return;
    }

    // Ferramenta Post-it
    if (currentTool === 'sticky') {
      const newSticky: WhiteboardElement = {
        id: `el_${Date.now()}`,
        type: 'sticky',
        x,
        y,
        width: 190,
        height: 150,
        strokeColor: '#334155',
        stickyColor: selectedStickyColor,
        fillStyle: 'solid',
        strokeWidth: 1,
        strokeStyle: 'solid',
        text: 'Nova Anotação'
      };

      const next = [...elements, newSticky];
      setElements(next);
      pushToHistory(next);
      setSelectedElementId(newSticky.id);
      setCurrentTool('select');
      return;
    }

    // Ferramenta Seleção / Mover
    if (currentTool === 'select') {
      const hit = getElementAtPosition(x, y);
      if (hit) {
        setSelectedElementId(hit.id);
        setDraggingElementId(hit.id);
        setDragOffset({ x: x - hit.x, y: y - hit.y });
      } else {
        setSelectedElementId(null);
      }
      return;
    }

    // Formas de desenho
    setIsDrawing(true);
    const newElement: WhiteboardElement = {
      id: `el_${Date.now()}`,
      type: currentTool,
      x,
      y,
      width: 0,
      height: 0,
      points: currentTool === 'pencil' ? [{ x, y }] : undefined,
      strokeColor,
      strokeWidth,
      fillStyle,
      strokeStyle
    };

    setCurrentElement(newElement);
  };

  // MOUSE MOVE
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }

    const { x, y } = screenToCanvas(e.clientX, e.clientY);

    // Detectar alça sob o cursor quando selecionado
    if (selectedElement && !isDrawing && !draggingElementId && !resizingState) {
      const handle = getHandleUnderMouse(x, y, selectedElement);
      setHoveredHandle(handle);
    } else if (!resizingState) {
      setHoveredHandle(null);
    }

    // Redimensionamento ativo (Resize)
    if (resizingState && selectedElement) {
      const dx = x - resizingState.startMouseX;
      const dy = y - resizingState.startMouseY;
      const handle = resizingState.handle;

      if (selectedElement.type === 'text') {
        // Redimensionar tamanho da fonte do texto proporcionalmente
        let scaleFactor = 1;
        const refDim = Math.max(resizingState.initialWidth, 100);

        if (handle === 'br') {
          scaleFactor = 1 + (dx + dy) / (refDim * 1.5);
        } else if (handle === 'tl') {
          scaleFactor = 1 - (dx + dy) / (refDim * 1.5);
        } else if (handle === 'tr') {
          scaleFactor = 1 + (dx - dy) / (refDim * 1.5);
        } else if (handle === 'bl') {
          scaleFactor = 1 + (-dx + dy) / (refDim * 1.5);
        }

        const newSize = Math.max(10, Math.min(150, Math.round(resizingState.initialFontSize * Math.max(0.2, scaleFactor))));

        setElements(prev =>
          prev.map(el => {
            if (el.id === selectedElement.id) {
              return { ...el, fontSize: newSize };
            }
            return el;
          })
        );
      } else {
        // Redimensionar formas geométricas e post-its
        let newX = resizingState.initialX;
        let newY = resizingState.initialY;
        let newW = resizingState.initialWidth;
        let newH = resizingState.initialHeight;

        if (handle === 'br') {
          newW = Math.max(20, resizingState.initialWidth + dx);
          newH = Math.max(20, resizingState.initialHeight + dy);
        } else if (handle === 'tr') {
          newW = Math.max(20, resizingState.initialWidth + dx);
          newY = resizingState.initialY + dy;
          newH = Math.max(20, resizingState.initialHeight - dy);
        } else if (handle === 'bl') {
          newX = resizingState.initialX + dx;
          newW = Math.max(20, resizingState.initialWidth - dx);
          newH = Math.max(20, resizingState.initialHeight + dy);
        } else if (handle === 'tl') {
          newX = resizingState.initialX + dx;
          newW = Math.max(20, resizingState.initialWidth - dx);
          newY = resizingState.initialY + dy;
          newH = Math.max(20, resizingState.initialHeight - dy);
        }

        setElements(prev =>
          prev.map(el => {
            if (el.id === selectedElement.id) {
              return { ...el, x: newX, y: newY, width: newW, height: newH };
            }
            return el;
          })
        );
      }
      return;
    }

    // Arrastar elemento selecionado
    if (draggingElementId) {
      setElements(prev =>
        prev.map(el => {
          if (el.id === draggingElementId) {
            const dx = x - dragOffset.x - el.x;
            const dy = y - dragOffset.y - el.y;

            if (el.type === 'pencil' && el.points) {
              return {
                ...el,
                x: x - dragOffset.x,
                y: y - dragOffset.y,
                points: el.points.map(p => ({ x: p.x + dx, y: p.y + dy }))
              };
            }
            return {
              ...el,
              x: x - dragOffset.x,
              y: y - dragOffset.y
            };
          }
          return el;
        })
      );
      return;
    }

    // Borracha ao passar por cima
    if (isDrawing && currentTool === 'eraser') {
      const hit = getElementAtPosition(x, y);
      if (hit) {
        setElements(prev => prev.filter(el => el.id !== hit.id));
      }
      return;
    }

    // Desenhar forma ativa
    if (isDrawing && currentElement) {
      if (currentElement.type === 'pencil') {
        const points = currentElement.points || [];
        setCurrentElement({
          ...currentElement,
          points: [...points, { x, y }]
        });
      } else {
        setCurrentElement({
          ...currentElement,
          width: x - currentElement.x,
          height: y - currentElement.y
        });
      }
    }
  };

  // MOUSE UP
  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
    }

    if (resizingState) {
      setResizingState(null);
      pushToHistory(elements);
      return;
    }

    if (draggingElementId) {
      setDraggingElementId(null);
      pushToHistory(elements);
    }

    if (isDrawing && currentElement) {
      setIsDrawing(false);

      const isTiny = 
        currentElement.type !== 'pencil' && 
        Math.abs(currentElement.width) < 6 && 
        Math.abs(currentElement.height) < 6;

      if (!isTiny) {
        const next = [...elements, currentElement];
        setElements(next);
        pushToHistory(next);
      }
      setCurrentElement(null);
    }
  };

  // DOUBLE CLICK
  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = screenToCanvas(e.clientX, e.clientY);
    const hit = getElementAtPosition(x, y);

    if (hit && (hit.type === 'text' || hit.type === 'sticky')) {
      startTextEditing(x, y, hit);
    } else {
      startTextEditing(x, y);
    }
  };

  // ZOOM MOUSE WHEEL
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = 1.08;
    const delta = e.deltaY < 0 ? zoomFactor : 1 / zoomFactor;
    const newZoom = Math.min(Math.max(zoom * delta, 0.25), 4);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
    const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  // Resetar Zoom
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    toast.success('Visualização em 100%');
  };

  // Limpar Quadro
  const handleClearCanvas = () => {
    if (elements.length === 0) return;
    if (window.confirm('Deseja limpar todo o quadro branco?')) {
      setElements([]);
      pushToHistory([]);
      setSelectedElementId(null);
      setEditingTextId(null);
      setTextInputPosition(null);
      toast.success('Quadro branco limpo!');
    }
  };

  // Exportar Imagem PNG
  const handleExportPNG = (transparent: boolean = false) => {
    if (editingTextId) finishTextEditing();
    const canvas = canvasRef.current;
    if (!canvas || elements.length === 0) {
      toast.error('O quadro está vazio para exportação!');
      return;
    }

    try {
      const minX = Math.min(...elements.map(e => Math.min(e.x, e.x + (e.width || 0))));
      const maxX = Math.max(...elements.map(e => Math.max(e.x, e.x + (e.width || 180))));
      const minY = Math.min(...elements.map(e => Math.min(e.y, e.y + (e.height || 0))));
      const maxY = Math.max(...elements.map(e => Math.max(e.y, e.y + (e.height || 140))));

      const padding = 40;
      const exportWidth = Math.max(maxX - minX + padding * 2, 400);
      const exportHeight = Math.max(maxY - minY + padding * 2, 300);

      const expCanvas = document.createElement('canvas');
      expCanvas.width = exportWidth * 2;
      expCanvas.height = exportHeight * 2;
      const expCtx = expCanvas.getContext('2d');

      if (!expCtx) return;

      expCtx.scale(2, 2);

      if (!transparent) {
        expCtx.fillStyle = isDarkMode ? '#131823' : '#ffffff';
        expCtx.fillRect(0, 0, exportWidth, exportHeight);
      }

      expCtx.translate(-minX + padding, -minY + padding);

      elements.forEach(el => {
        expCtx.save();
        const color = isDarkMode && el.strokeColor === '#1e293b' ? '#f8fafc' : el.strokeColor;
        expCtx.strokeStyle = color;
        expCtx.fillStyle = color;
        expCtx.lineWidth = el.strokeWidth;
        expCtx.lineCap = 'round';
        expCtx.lineJoin = 'round';

        if (el.type === 'pencil' && el.points) {
          expCtx.beginPath();
          expCtx.moveTo(el.points[0].x, el.points[0].y);
          for (let i = 1; i < el.points.length; i++) {
            const p1 = el.points[i - 1];
            const p2 = el.points[i];
            expCtx.quadraticCurveTo(p1.x, p1.y, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
          }
          expCtx.stroke();
        } else if (el.type === 'rectangle') {
          expCtx.beginPath();
          expCtx.roundRect(el.x, el.y, el.width, el.height, 8);
          if (el.fillStyle !== 'none') {
            expCtx.fillStyle = el.fillStyle === 'semi' ? `${color}25` : color;
            expCtx.fill();
          }
          expCtx.stroke();
        } else if (el.type === 'ellipse') {
          expCtx.beginPath();
          expCtx.ellipse(el.x + el.width / 2, el.y + el.height / 2, Math.abs(el.width / 2), Math.abs(el.height / 2), 0, 0, Math.PI * 2);
          if (el.fillStyle !== 'none') {
            expCtx.fillStyle = el.fillStyle === 'semi' ? `${color}25` : color;
            expCtx.fill();
          }
          expCtx.stroke();
        } else if (el.type === 'diamond') {
          expCtx.beginPath();
          expCtx.moveTo(el.x + el.width / 2, el.y);
          expCtx.lineTo(el.x + el.width, el.y + el.height / 2);
          expCtx.lineTo(el.x + el.width / 2, el.y + el.height);
          expCtx.lineTo(el.x, el.y + el.height / 2);
          expCtx.closePath();
          if (el.fillStyle !== 'none') {
            expCtx.fillStyle = el.fillStyle === 'semi' ? `${color}25` : color;
            expCtx.fill();
          }
          expCtx.stroke();
        } else if (el.type === 'arrow' || el.type === 'line') {
          expCtx.beginPath();
          expCtx.moveTo(el.x, el.y);
          expCtx.lineTo(el.x + el.width, el.y + el.height);
          expCtx.stroke();

          if (el.type === 'arrow') {
            const angle = Math.atan2(el.height, el.width);
            const headLen = 14;
            const toX = el.x + el.width;
            const toY = el.y + el.height;
            expCtx.beginPath();
            expCtx.moveTo(toX, toY);
            expCtx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
            expCtx.moveTo(toX, toY);
            expCtx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
            expCtx.stroke();
          }
        } else if (el.type === 'text' && el.text) {
          const currentFontSize = el.fontSize || 22;
          expCtx.font = `600 ${currentFontSize}px "Segoe UI", Inter, sans-serif`;
          const lines = el.text.split('\n');
          lines.forEach((l, idx) => {
            expCtx.fillText(l, el.x, el.y + (idx + 1) * (currentFontSize * 1.35) - 4);
          });
        } else if (el.type === 'sticky') {
          expCtx.fillStyle = el.stickyColor || '#fef08a';
          expCtx.beginPath();
          expCtx.roundRect(el.x, el.y, Math.max(el.width, 180), Math.max(el.height, 140), 8);
          expCtx.fill();
          expCtx.strokeStyle = 'rgba(0,0,0,0.15)';
          expCtx.lineWidth = 1;
          expCtx.stroke();

          if (el.text) {
            expCtx.fillStyle = '#1e293b';
            expCtx.font = '500 15px "Segoe UI", Inter, sans-serif';
            el.text.split('\n').forEach((l, idx) => {
              expCtx.fillText(l, el.x + 14, el.y + 46 + idx * 22);
            });
          }
        }

        expCtx.restore();
      });

      const link = document.createElement('a');
      link.download = `quadro-aula-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = expCanvas.toDataURL('image/png');
      link.click();
      toast.success('Imagem baixada com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar imagem para download.');
    }
  };

  // Copiar para o Clipboard
  const handleCopyClipboard = async () => {
    if (editingTextId) finishTextEditing();
    const canvas = canvasRef.current;
    if (!canvas || elements.length === 0) {
      toast.error('O quadro está vazio!');
      return;
    }

    try {
      canvas.toBlob(async blob => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        toast.success('Imagem copiada para a área de transferência!');
      });
    } catch (err) {
      console.error(err);
      toast.error('Seu navegador não suporta copiar imagem diretamente.');
    }
  };

  // Alternar tela cheia
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Carregar templates
  const applyTemplate = (templateId: string) => {
    let newElements: WhiteboardElement[] = [];

    switch (templateId) {
      case 'blank':
        newElements = [];
        break;

      case 'flowchart':
        newElements = [
          {
            id: 'fc_1',
            type: 'ellipse',
            x: 250,
            y: 80,
            width: 140,
            height: 60,
            strokeColor: '#16a34a',
            fillStyle: 'semi',
            strokeWidth: 3,
            strokeStyle: 'solid'
          },
          {
            id: 'fc_1_txt',
            type: 'text',
            x: 285,
            y: 98,
            width: 80,
            height: 30,
            strokeColor: '#16a34a',
            fillStyle: 'none',
            strokeWidth: 2,
            strokeStyle: 'solid',
            text: 'INÍCIO',
            fontSize: 20
          },
          {
            id: 'fc_arr_1',
            type: 'arrow',
            x: 320,
            y: 145,
            width: 0,
            height: 65,
            strokeColor: '#64748b',
            fillStyle: 'none',
            strokeWidth: 2,
            strokeStyle: 'solid'
          },
          {
            id: 'fc_2',
            type: 'rectangle',
            x: 220,
            y: 220,
            width: 200,
            height: 70,
            strokeColor: '#2563eb',
            fillStyle: 'semi',
            strokeWidth: 3,
            strokeStyle: 'solid'
          },
          {
            id: 'fc_2_txt',
            type: 'text',
            x: 235,
            y: 242,
            width: 170,
            height: 30,
            strokeColor: '#2563eb',
            fillStyle: 'none',
            strokeWidth: 2,
            strokeStyle: 'solid',
            text: 'Ler Dados de Entrada',
            fontSize: 18
          },
          {
            id: 'fc_arr_2',
            type: 'arrow',
            x: 320,
            y: 295,
            width: 0,
            height: 65,
            strokeColor: '#64748b',
            fillStyle: 'none',
            strokeWidth: 2,
            strokeStyle: 'solid'
          },
          {
            id: 'fc_3',
            type: 'diamond',
            x: 230,
            y: 370,
            width: 180,
            height: 100,
            strokeColor: '#ea580c',
            fillStyle: 'semi',
            strokeWidth: 3,
            strokeStyle: 'solid'
          },
          {
            id: 'fc_3_txt',
            type: 'text',
            x: 265,
            y: 405,
            width: 120,
            height: 30,
            strokeColor: '#ea580c',
            fillStyle: 'none',
            strokeWidth: 2,
            strokeStyle: 'solid',
            text: 'Valor > 0 ?',
            fontSize: 18
          },
          {
            id: 'fc_arr_3',
            type: 'arrow',
            x: 320,
            y: 475,
            width: 0,
            height: 65,
            strokeColor: '#64748b',
            fillStyle: 'none',
            strokeWidth: 2,
            strokeStyle: 'solid'
          },
          {
            id: 'fc_4',
            type: 'ellipse',
            x: 250,
            y: 550,
            width: 140,
            height: 60,
            strokeColor: '#e11d48',
            fillStyle: 'semi',
            strokeWidth: 3,
            strokeStyle: 'solid'
          },
          {
            id: 'fc_4_txt',
            type: 'text',
            x: 298,
            y: 568,
            width: 80,
            height: 30,
            strokeColor: '#e11d48',
            fillStyle: 'none',
            strokeWidth: 2,
            strokeStyle: 'solid',
            text: 'FIM',
            fontSize: 20
          }
        ];
        break;

      case 'kanban':
        newElements = [
          {
            id: 'kb_c1',
            type: 'rectangle',
            x: 50,
            y: 60,
            width: 260,
            height: 480,
            strokeColor: '#94a3b8',
            fillStyle: 'semi',
            strokeWidth: 2,
            strokeStyle: 'solid'
          },
          {
            id: 'kb_t1',
            type: 'text',
            x: 70,
            y: 80,
            width: 200,
            height: 30,
            strokeColor: '#e11d48',
            fillStyle: 'none',
            strokeWidth: 2,
            strokeStyle: 'solid',
            text: '📌 A FAZER',
            fontSize: 20
          },
          {
            id: 'kb_s1',
            type: 'sticky',
            x: 70,
            y: 140,
            width: 220,
            height: 120,
            strokeColor: '#334155',
            stickyColor: '#fef08a',
            fillStyle: 'solid',
            strokeWidth: 1,
            strokeStyle: 'solid',
            text: '1. Modelar Banco de Dados\n2. Criar Tabelas SQL'
          },
          {
            id: 'kb_c2',
            type: 'rectangle',
            x: 340,
            y: 60,
            width: 260,
            height: 480,
            strokeColor: '#94a3b8',
            fillStyle: 'semi',
            strokeWidth: 2,
            strokeStyle: 'solid'
          },
          {
            id: 'kb_t2',
            type: 'text',
            x: 360,
            y: 80,
            width: 200,
            height: 30,
            strokeColor: '#ea580c',
            fillStyle: 'none',
            strokeWidth: 2,
            strokeStyle: 'solid',
            text: '⚡ EM ANDAMENTO',
            fontSize: 20
          },
          {
            id: 'kb_s2',
            type: 'sticky',
            x: 360,
            y: 140,
            width: 220,
            height: 120,
            strokeColor: '#334155',
            stickyColor: '#bae6fd',
            fillStyle: 'solid',
            strokeWidth: 1,
            strokeStyle: 'solid',
            text: 'Desenvolver Rotas de API\n(GET / POST / PUT)'
          },
          {
            id: 'kb_c3',
            type: 'rectangle',
            x: 630,
            y: 60,
            width: 260,
            height: 480,
            strokeColor: '#94a3b8',
            fillStyle: 'semi',
            strokeWidth: 2,
            strokeStyle: 'solid'
          },
          {
            id: 'kb_t3',
            type: 'text',
            x: 650,
            y: 80,
            width: 200,
            height: 30,
            strokeColor: '#16a34a',
            fillStyle: 'none',
            strokeWidth: 2,
            strokeStyle: 'solid',
            text: '✅ CONCLUÍDO',
            fontSize: 20
          },
          {
            id: 'kb_s3',
            type: 'sticky',
            x: 650,
            y: 140,
            width: 220,
            height: 120,
            strokeColor: '#334155',
            stickyColor: '#bbf7d0',
            fillStyle: 'solid',
            strokeWidth: 1,
            strokeStyle: 'solid',
            text: 'Configuração do Ambiente\ne Repositório Git'
          }
        ];
        break;

      case 'architecture':
        newElements = [
          {
            id: 'arch_fe',
            type: 'rectangle',
            x: 80,
            y: 180,
            width: 180,
            height: 120,
            strokeColor: '#2563eb',
            fillStyle: 'semi',
            strokeWidth: 3,
            strokeStyle: 'solid'
          },
          {
            id: 'arch_fe_t',
            type: 'text',
            x: 100,
            y: 215,
            width: 140,
            height: 40,
            strokeColor: '#2563eb',
            fillStyle: 'none',
            strokeWidth: 2,
            strokeStyle: 'solid',
            text: '💻 FRONTEND\n(React + Vite)',
            fontSize: 18
          },
          {
            id: 'arch_arr1',
            type: 'arrow',
            x: 265,
            y: 240,
            width: 110,
            height: 0,
            strokeColor: '#64748b',
            fillStyle: 'none',
            strokeWidth: 3,
            strokeStyle: 'solid'
          },
          {
            id: 'arch_arr1_t',
            type: 'text',
            x: 275,
            y: 205,
            width: 100,
            height: 30,
            strokeColor: '#64748b',
            fillStyle: 'none',
            strokeWidth: 2,
            strokeStyle: 'solid',
            text: 'HTTP / JSON',
            fontSize: 16
          },
          {
            id: 'arch_be',
            type: 'rectangle',
            x: 385,
            y: 180,
            width: 180,
            height: 120,
            strokeColor: '#9333ea',
            fillStyle: 'semi',
            strokeWidth: 3,
            strokeStyle: 'solid'
          },
          {
            id: 'arch_be_t',
            type: 'text',
            x: 405,
            y: 215,
            width: 140,
            height: 40,
            strokeColor: '#9333ea',
            fillStyle: 'none',
            strokeWidth: 2,
            strokeStyle: 'solid',
            text: '⚙️ BACKEND API\n(Node.js / Express)',
            fontSize: 18
          },
          {
            id: 'arch_arr2',
            type: 'arrow',
            x: 570,
            y: 240,
            width: 110,
            height: 0,
            strokeColor: '#64748b',
            fillStyle: 'none',
            strokeWidth: 3,
            strokeStyle: 'solid'
          },
          {
            id: 'arch_arr2_t',
            type: 'text',
            x: 590,
            y: 205,
            width: 80,
            height: 30,
            strokeColor: '#64748b',
            fillStyle: 'none',
            strokeWidth: 2,
            strokeStyle: 'solid',
            text: 'SQL Query',
            fontSize: 16
          },
          {
            id: 'arch_db',
            type: 'rectangle',
            x: 690,
            y: 180,
            width: 180,
            height: 120,
            strokeColor: '#16a34a',
            fillStyle: 'semi',
            strokeWidth: 3,
            strokeStyle: 'solid'
          },
          {
            id: 'arch_db_t',
            type: 'text',
            x: 710,
            y: 215,
            width: 140,
            height: 40,
            strokeColor: '#16a34a',
            fillStyle: 'none',
            strokeWidth: 2,
            strokeStyle: 'solid',
            text: '🗄️ BANCO DE DADOS\n(PostgreSQL / MySQL)',
            fontSize: 18
          }
        ];
        break;

      case 'mindmap':
        newElements = [
          {
            id: 'mm_center',
            type: 'ellipse',
            x: 350,
            y: 220,
            width: 220,
            height: 90,
            strokeColor: '#2563eb',
            fillStyle: 'semi',
            strokeWidth: 3,
            strokeStyle: 'solid'
          },
          {
            id: 'mm_center_t',
            type: 'text',
            x: 380,
            y: 250,
            width: 160,
            height: 30,
            strokeColor: '#2563eb',
            fillStyle: 'none',
            strokeWidth: 2,
            strokeStyle: 'solid',
            text: '🧠 CONCEITO CENTRAL',
            fontSize: 18
          },
          {
            id: 'mm_l1',
            type: 'line',
            x: 350,
            y: 240,
            width: -140,
            height: -100,
            strokeColor: '#ea580c',
            fillStyle: 'none',
            strokeWidth: 2,
            strokeStyle: 'solid'
          },
          {
            id: 'mm_r1',
            type: 'rectangle',
            x: 80,
            y: 100,
            width: 150,
            height: 60,
            strokeColor: '#ea580c',
            fillStyle: 'semi',
            strokeWidth: 2,
            strokeStyle: 'solid'
          },
          {
            id: 'mm_r1_t',
            type: 'text',
            x: 105,
            y: 125,
            width: 120,
            height: 30,
            strokeColor: '#ea580c',
            fillStyle: 'none',
            strokeWidth: 2,
            strokeStyle: 'solid',
            text: 'Tópico 1',
            fontSize: 18
          },
          {
            id: 'mm_l2',
            type: 'line',
            x: 570,
            y: 240,
            width: 140,
            height: -100,
            strokeColor: '#16a34a',
            fillStyle: 'none',
            strokeWidth: 2,
            strokeStyle: 'solid'
          },
          {
            id: 'mm_r2',
            type: 'rectangle',
            x: 690,
            y: 100,
            width: 150,
            height: 60,
            strokeColor: '#16a34a',
            fillStyle: 'semi',
            strokeWidth: 2,
            strokeStyle: 'solid'
          },
          {
            id: 'mm_r2_t',
            type: 'text',
            x: 715,
            y: 125,
            width: 120,
            height: 30,
            strokeColor: '#16a34a',
            fillStyle: 'none',
            strokeWidth: 2,
            strokeStyle: 'solid',
            text: 'Tópico 2',
            fontSize: 18
          },
          {
            id: 'mm_l3',
            type: 'line',
            x: 460,
            y: 310,
            width: 0,
            height: 120,
            strokeColor: '#9333ea',
            fillStyle: 'none',
            strokeWidth: 2,
            strokeStyle: 'solid'
          },
          {
            id: 'mm_r3',
            type: 'rectangle',
            x: 385,
            y: 430,
            width: 150,
            height: 60,
            strokeColor: '#9333ea',
            fillStyle: 'semi',
            strokeWidth: 2,
            strokeStyle: 'solid'
          },
          {
            id: 'mm_r3_t',
            type: 'text',
            x: 410,
            y: 455,
            width: 120,
            height: 30,
            strokeColor: '#9333ea',
            fillStyle: 'none',
            strokeWidth: 2,
            strokeStyle: 'solid',
            text: 'Tópico 3',
            fontSize: 18
          }
        ];
        break;
    }

    setElements(newElements);
    pushToHistory(newElements);
    setShowTemplatesModal(false);
    setSelectedElementId(null);
    setEditingTextId(null);
    setTextInputPosition(null);
    setPan({ x: 0, y: 0 });
    setZoom(1);
    toast.success('Modelo carregado no quadro!');
  };

  // Determinar cursor do canvas
  const getCanvasCursor = () => {
    if (resizingState || hoveredHandle) {
      const handle = resizingState ? resizingState.handle : hoveredHandle;
      if (handle === 'tl' || handle === 'br') return 'cursor-nwse-resize';
      if (handle === 'tr' || handle === 'bl') return 'cursor-nesw-resize';
    }
    if (currentTool === 'hand' || isPanning) return 'cursor-grab active:cursor-grabbing';
    if (currentTool === 'pencil') return 'cursor-crosshair';
    if (currentTool === 'eraser') return 'cursor-cell';
    if (currentTool === 'text') return 'cursor-text';
    return 'cursor-default';
  };

  const activeStrokeColor = selectedElement ? selectedElement.strokeColor : strokeColor;
  const activeFontSize = selectedElement && selectedElement.type === 'text' ? (selectedElement.fontSize || 22) : fontSize;

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full h-[82vh] rounded-2xl overflow-hidden border border-border/80 shadow-lg flex flex-col select-none transition-colors duration-200 ${
        isDarkMode ? 'bg-[#131823] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
      } ${isFullscreen ? 'fixed inset-0 z-50 h-screen rounded-none border-none' : ''}`}
    >
      {/* BARRA SUPERIOR FLUTUANTE (TOOLBAR ESTILO EXCALIDRAW) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 p-1.5 rounded-2xl bg-card/90 backdrop-blur-md border border-border/80 shadow-md">
        <Button
          size="icon"
          variant={currentTool === 'select' ? 'default' : 'ghost'}
          onClick={() => {
            if (editingTextId) finishTextEditing();
            setCurrentTool('select');
          }}
          className="w-9 h-9 rounded-xl transition-all"
          title="Seleção / Mover (V ou 1)"
        >
          <MousePointer className="w-4 h-4" />
        </Button>

        <Button
          size="icon"
          variant={currentTool === 'hand' ? 'default' : 'ghost'}
          onClick={() => {
            if (editingTextId) finishTextEditing();
            setCurrentTool('hand');
          }}
          className="w-9 h-9 rounded-xl transition-all"
          title="Mão / Mover Lousa (H ou Espaço)"
        >
          <Hand className="w-4 h-4" />
        </Button>

        <div className="h-5 w-[1px] bg-border mx-0.5" />

        <Button
          size="icon"
          variant={currentTool === 'pencil' ? 'default' : 'ghost'}
          onClick={() => {
            if (editingTextId) finishTextEditing();
            setCurrentTool('pencil');
          }}
          className="w-9 h-9 rounded-xl transition-all"
          title="Desenho Livre / Lápis (P ou 2)"
        >
          <Pencil className="w-4 h-4" />
        </Button>

        <Button
          size="icon"
          variant={currentTool === 'rectangle' ? 'default' : 'ghost'}
          onClick={() => {
            if (editingTextId) finishTextEditing();
            setCurrentTool('rectangle');
          }}
          className="w-9 h-9 rounded-xl transition-all"
          title="Retângulo (R ou 3)"
        >
          <Square className="w-4 h-4" />
        </Button>

        <Button
          size="icon"
          variant={currentTool === 'ellipse' ? 'default' : 'ghost'}
          onClick={() => {
            if (editingTextId) finishTextEditing();
            setCurrentTool('ellipse');
          }}
          className="w-9 h-9 rounded-xl transition-all"
          title="Círculo / Elipse (O ou 4)"
        >
          <Circle className="w-4 h-4" />
        </Button>

        <Button
          size="icon"
          variant={currentTool === 'diamond' ? 'default' : 'ghost'}
          onClick={() => {
            if (editingTextId) finishTextEditing();
            setCurrentTool('diamond');
          }}
          className="w-9 h-9 rounded-xl transition-all"
          title="Losango / Decisão (D ou 5)"
        >
          <Diamond className="w-4 h-4" />
        </Button>

        <Button
          size="icon"
          variant={currentTool === 'arrow' ? 'default' : 'ghost'}
          onClick={() => {
            if (editingTextId) finishTextEditing();
            setCurrentTool('arrow');
          }}
          className="w-9 h-9 rounded-xl transition-all"
          title="Seta Conectora (A ou 6)"
        >
          <ArrowRight className="w-4 h-4" />
        </Button>

        <Button
          size="icon"
          variant={currentTool === 'line' ? 'default' : 'ghost'}
          onClick={() => {
            if (editingTextId) finishTextEditing();
            setCurrentTool('line');
          }}
          className="w-9 h-9 rounded-xl transition-all"
          title="Linha Reta (L ou 7)"
        >
          <Minus className="w-4 h-4" />
        </Button>

        <div className="h-5 w-[1px] bg-border mx-0.5" />

        <Button
          size="icon"
          variant={currentTool === 'text' ? 'default' : 'ghost'}
          onClick={() => setCurrentTool('text')}
          className="w-9 h-9 rounded-xl transition-all"
          title="Texto (T ou 8) - Clique na lousa para escrever"
        >
          <Type className="w-4 h-4" />
        </Button>

        <Button
          size="icon"
          variant={currentTool === 'sticky' ? 'default' : 'ghost'}
          onClick={() => {
            if (editingTextId) finishTextEditing();
            setCurrentTool('sticky');
          }}
          className="w-9 h-9 rounded-xl transition-all"
          title="Nota Adesiva / Post-it (S ou 9)"
        >
          <StickyNote className="w-4 h-4" />
        </Button>

        <Button
          size="icon"
          variant={currentTool === 'eraser' ? 'default' : 'ghost'}
          onClick={() => {
            if (editingTextId) finishTextEditing();
            setCurrentTool('eraser');
          }}
          className="w-9 h-9 rounded-xl transition-all text-rose-500 hover:text-rose-600"
          title="Borracha (E ou 0)"
        >
          <Eraser className="w-4 h-4" />
        </Button>
      </div>

      {/* PAINEL LATERAL ESQUERDO: CORES E ESTILO */}
      <div className="absolute top-20 left-4 z-20 flex flex-col gap-3 p-3 rounded-2xl bg-card/90 backdrop-blur-md border border-border/80 shadow-md max-w-[200px]">
        <div>
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Cor {selectedElement ? '(Selecionado)' : ''}
          </span>
          <div className="grid grid-cols-5 gap-1.5">
            {PALETTE_COLORS.map(c => {
              const activeColor = isDarkMode ? c.darkValue : c.value;
              const isSelected = activeStrokeColor === activeColor;
              return (
                <button
                  key={c.label}
                  onClick={() => handleColorChange(activeColor)}
                  style={{ backgroundColor: activeColor }}
                  className={`w-6 h-6 rounded-full border border-black/10 transition-transform ${
                    isSelected ? 'ring-2 ring-primary ring-offset-2 scale-110' : 'hover:scale-105'
                  }`}
                  title={c.label}
                />
              );
            })}
          </div>
        </div>

        {/* Tamanho da Fonte (para texto selecionado ou ferramenta de texto) */}
        {(currentTool === 'text' || (selectedElement && selectedElement.type === 'text')) && (
          <div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Tamanho do Texto ({activeFontSize}px)
            </span>
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
              <button
                onClick={() => handleFontSizeChange(16)}
                className={`flex-1 py-1 text-[11px] rounded-lg font-medium transition-all ${
                  activeFontSize <= 18 ? 'bg-background shadow-sm text-foreground font-bold' : 'text-muted-foreground'
                }`}
              >
                P
              </button>
              <button
                onClick={() => handleFontSizeChange(24)}
                className={`flex-1 py-1 text-[11px] rounded-lg font-medium transition-all ${
                  activeFontSize > 18 && activeFontSize <= 30 ? 'bg-background shadow-sm text-foreground font-bold' : 'text-muted-foreground'
                }`}
              >
                M
              </button>
              <button
                onClick={() => handleFontSizeChange(36)}
                className={`flex-1 py-1 text-[11px] rounded-lg font-medium transition-all ${
                  activeFontSize > 30 && activeFontSize <= 44 ? 'bg-background shadow-sm text-foreground font-bold' : 'text-muted-foreground'
                }`}
              >
                G
              </button>
              <button
                onClick={() => handleFontSizeChange(54)}
                className={`flex-1 py-1 text-[11px] rounded-lg font-medium transition-all ${
                  activeFontSize > 44 ? 'bg-background shadow-sm text-foreground font-bold' : 'text-muted-foreground'
                }`}
              >
                GG
              </button>
            </div>
            <p className="text-[9px] text-muted-foreground mt-1 text-center">
              Dica: arraste os cantos do texto para redimensionar livremente!
            </p>
          </div>
        )}

        {/* Espessura do Traço */}
        {currentTool !== 'text' && (!selectedElement || selectedElement.type !== 'text') && currentTool !== 'sticky' && (
          <div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Espessura
            </span>
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
              <button
                onClick={() => setStrokeWidth(2)}
                className={`flex-1 py-1 text-xs rounded-lg font-medium transition-all ${
                  strokeWidth === 2 ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
                }`}
              >
                Fino
              </button>
              <button
                onClick={() => setStrokeWidth(4)}
                className={`flex-1 py-1 text-xs rounded-lg font-medium transition-all ${
                  strokeWidth === 4 ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
                }`}
              >
                Médio
              </button>
              <button
                onClick={() => setStrokeWidth(8)}
                className={`flex-1 py-1 text-xs rounded-lg font-medium transition-all ${
                  strokeWidth === 8 ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
                }`}
              >
                Grosso
              </button>
            </div>
          </div>
        )}

        {/* Preenchimento de Formas */}
        {currentTool !== 'pencil' && currentTool !== 'line' && currentTool !== 'arrow' && currentTool !== 'text' && (!selectedElement || selectedElement.type !== 'text') && currentTool !== 'sticky' && (
          <div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Preenchimento
            </span>
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
              <button
                onClick={() => setFillStyle('none')}
                className={`flex-1 py-1 text-[11px] rounded-lg font-medium transition-all ${
                  fillStyle === 'none' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
                }`}
              >
                Vazio
              </button>
              <button
                onClick={() => setFillStyle('semi')}
                className={`flex-1 py-1 text-[11px] rounded-lg font-medium transition-all ${
                  fillStyle === 'semi' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
                }`}
              >
                Suave
              </button>
              <button
                onClick={() => setFillStyle('solid')}
                className={`flex-1 py-1 text-[11px] rounded-lg font-medium transition-all ${
                  fillStyle === 'solid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
                }`}
              >
                Sólido
              </button>
            </div>
          </div>
        )}

        {/* Cor do Post-it */}
        {currentTool === 'sticky' && (
          <div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Cor do Post-it
            </span>
            <div className="grid grid-cols-6 gap-1">
              {STICKY_COLORS.map(s => (
                <button
                  key={s.name}
                  onClick={() => setSelectedStickyColor(s.bg)}
                  style={{ backgroundColor: s.bg }}
                  className={`w-5 h-5 rounded-md border border-black/20 ${
                    selectedStickyColor === s.bg ? 'ring-2 ring-primary ring-offset-1' : ''
                  }`}
                  title={s.name}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AÇÕES DE TOPO DIREITO */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <div className="flex items-center bg-card/90 backdrop-blur-md border border-border/80 rounded-xl p-1 shadow-md">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="w-8 h-8 rounded-lg"
            title="Desfazer (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="w-8 h-8 rounded-lg"
            title="Refazer (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowTemplatesModal(true)}
          className="gap-1.5 bg-card/90 backdrop-blur-md shadow-md rounded-xl text-xs font-medium"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Modelos
        </Button>

        <Button
          size="icon"
          variant="outline"
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="w-9 h-9 bg-card/90 backdrop-blur-md shadow-md rounded-xl"
          title={isDarkMode ? 'Mudar para Lousa Clara' : 'Mudar para Lousa Escura'}
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
        </Button>

        <Button
          size="icon"
          variant="outline"
          onClick={toggleFullscreen}
          className="w-9 h-9 bg-card/90 backdrop-blur-md shadow-md rounded-xl"
          title="Modo Tela Cheia / Datashow (F)"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Button>
      </div>

      {/* PAINEL INFERIOR ESQUERDO: ZOOM */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 p-1.5 rounded-xl bg-card/90 backdrop-blur-md border border-border/80 shadow-md">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setZoom(prev => Math.max(prev - 0.15, 0.25))}
          className="w-7 h-7 rounded-lg"
          title="Diminuir Zoom (-)"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </Button>

        <button
          onClick={handleResetZoom}
          className="text-xs font-semibold px-2 py-1 rounded-md hover:bg-muted transition-colors"
          title="Resetar Zoom para 100%"
        >
          {Math.round(zoom * 100)}%
        </button>

        <Button
          size="icon"
          variant="ghost"
          onClick={() => setZoom(prev => Math.min(prev + 0.15, 4))}
          className="w-7 h-7 rounded-lg"
          title="Aumentar Zoom (+)"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </Button>

        <div className="h-4 w-[1px] bg-border mx-0.5" />

        <Button
          size="icon"
          variant="ghost"
          onClick={() => setShowShortcutsModal(true)}
          className="w-7 h-7 rounded-lg"
          title="Atalhos de Teclado"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* PAINEL INFERIOR DIREITO: EXPORTAR */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearCanvas}
          className="gap-1.5 bg-card/90 backdrop-blur-md border-border/80 rounded-xl text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
          title="Limpar toda a lousa"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Limpar
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyClipboard}
          className="gap-1.5 bg-card/90 backdrop-blur-md border-border/80 rounded-xl text-xs"
          title="Copiar imagem para o Clipboard"
        >
          <Copy className="w-3.5 h-3.5" />
          Copiar
        </Button>

        <Button
          variant="default"
          size="sm"
          onClick={() => handleExportPNG(false)}
          className="gap-1.5 rounded-xl text-xs font-medium shadow-md"
          title="Salvar imagem PNG em alta resolução"
        >
          <Download className="w-3.5 h-3.5" />
          Baixar Imagem
        </Button>
      </div>

      {/* ÁREA PRINCIPAL DO CANVAS */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
        className={`w-full h-full block ${getCanvasCursor()}`}
      />

      {/* CAIXA DE EDIÇÃO DE TEXTO FLUTUANTE */}
      {editingTextId && textInputPosition && (
        <div
          style={{
            position: 'absolute',
            left: `${textInputPosition.x}px`,
            top: `${textInputPosition.y}px`,
            zIndex: 40
          }}
          className="animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-1.5"
        >
          <div className="relative">
            <textarea
              ref={textInputRef}
              value={textContent}
              onChange={e => setTextContent(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  finishTextEditing();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  cancelTextEditing();
                }
              }}
              placeholder={textInputPosition.isSticky ? "Digite na nota adesiva..." : "Digite seu texto... (Ctrl+Enter para confirmar)"}
              style={{
                fontSize: `${Math.max((fontSize || 22) * zoom, 14)}px`,
                color: strokeColor,
                minWidth: `${Math.max(textInputPosition.width, 220)}px`,
                minHeight: `${Math.max(textInputPosition.height, 80)}px`
              }}
              className="p-2.5 rounded-xl bg-card border-2 border-primary shadow-2xl font-semibold leading-snug text-foreground focus:outline-none resize focus:ring-2 focus:ring-primary/40"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-1.5 bg-card/95 backdrop-blur-sm border border-border/80 p-1 rounded-xl shadow-lg self-start">
            <Button
              size="sm"
              variant="default"
              onClick={finishTextEditing}
              className="h-7 px-2.5 text-xs gap-1 rounded-lg"
            >
              <Check className="w-3.5 h-3.5" />
              Concluir (Ctrl+Enter)
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={cancelTextEditing}
              className="h-7 px-2 text-xs rounded-lg text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* MODAL DE TEMPLATES PEDAGÓGICOS */}
      {showTemplatesModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-xl p-6 space-y-4 bg-card border-border shadow-2xl rounded-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-bold">Modelos Didáticos Prontos</h3>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setShowTemplatesModal(false)}>
                Fechar
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Selecione uma estrutura para iniciar sua explicação visual com 1 clique.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {TEMPLATES.map(tmpl => (
                <div
                  key={tmpl.id}
                  onClick={() => applyTemplate(tmpl.id)}
                  className="p-4 rounded-xl border border-border/70 hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all duration-200 space-y-1.5 flex flex-col justify-between group"
                >
                  <h4 className="text-sm font-semibold group-hover:text-primary transition-colors">
                    {tmpl.title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {tmpl.desc}
                  </p>
                  <div className="pt-2">
                    <span className="text-[11px] font-medium text-primary flex items-center gap-1">
                      Carregar Modelo &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* MODAL DE ATALHOS */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 space-y-4 bg-card border-border shadow-2xl rounded-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold">Atalhos de Teclado</h3>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setShowShortcutsModal(false)}>
                Fechar
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-muted/50 flex items-center justify-between">
                <span>Seleção</span>
                <kbd className="px-2 py-0.5 bg-background rounded border font-mono">V ou 1</kbd>
              </div>
              <div className="p-2 rounded-lg bg-muted/50 flex items-center justify-between">
                <span>Redimensionar Texto</span>
                <kbd className="px-2 py-0.5 bg-background rounded border font-mono">Arrastar cantos</kbd>
              </div>
              <div className="p-2 rounded-lg bg-muted/50 flex items-center justify-between">
                <span>Lápis / Desenho</span>
                <kbd className="px-2 py-0.5 bg-background rounded border font-mono">P ou 2</kbd>
              </div>
              <div className="p-2 rounded-lg bg-muted/50 flex items-center justify-between">
                <span>Retângulo</span>
                <kbd className="px-2 py-0.5 bg-background rounded border font-mono">R ou 3</kbd>
              </div>
              <div className="p-2 rounded-lg bg-muted/50 flex items-center justify-between">
                <span>Círculo</span>
                <kbd className="px-2 py-0.5 bg-background rounded border font-mono">O ou 4</kbd>
              </div>
              <div className="p-2 rounded-lg bg-muted/50 flex items-center justify-between">
                <span>Losango</span>
                <kbd className="px-2 py-0.5 bg-background rounded border font-mono">D ou 5</kbd>
              </div>
              <div className="p-2 rounded-lg bg-muted/50 flex items-center justify-between">
                <span>Seta</span>
                <kbd className="px-2 py-0.5 bg-background rounded border font-mono">A ou 6</kbd>
              </div>
              <div className="p-2 rounded-lg bg-muted/50 flex items-center justify-between">
                <span>Linha</span>
                <kbd className="px-2 py-0.5 bg-background rounded border font-mono">L ou 7</kbd>
              </div>
              <div className="p-2 rounded-lg bg-muted/50 flex items-center justify-between">
                <span>Texto</span>
                <kbd className="px-2 py-0.5 bg-background rounded border font-mono">T ou 8</kbd>
              </div>
              <div className="p-2 rounded-lg bg-muted/50 flex items-center justify-between">
                <span>Post-it</span>
                <kbd className="px-2 py-0.5 bg-background rounded border font-mono">S ou 9</kbd>
              </div>
              <div className="p-2 rounded-lg bg-muted/50 flex items-center justify-between">
                <span>Borracha</span>
                <kbd className="px-2 py-0.5 bg-background rounded border font-mono">E ou 0</kbd>
              </div>
              <div className="p-2 rounded-lg bg-muted/50 flex items-center justify-between">
                <span>Desfazer</span>
                <kbd className="px-2 py-0.5 bg-background rounded border font-mono">Ctrl + Z</kbd>
              </div>
              <div className="p-2 rounded-lg bg-muted/50 flex items-center justify-between">
                <span>Refazer</span>
                <kbd className="px-2 py-0.5 bg-background rounded border font-mono">Ctrl + Y</kbd>
              </div>
              <div className="p-2 rounded-lg bg-muted/50 flex items-center justify-between">
                <span>Excluir Selecionado</span>
                <kbd className="px-2 py-0.5 bg-background rounded border font-mono">Delete / Backspace</kbd>
              </div>
              <div className="p-2 rounded-lg bg-muted/50 flex items-center justify-between">
                <span>Tela Cheia</span>
                <kbd className="px-2 py-0.5 bg-background rounded border font-mono">F</kbd>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
