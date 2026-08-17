import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  X, 
  Gamepad2, 
  Code, 
  Clock, 
  Layers, 
  CheckCircle2 
} from 'lucide-react';
import { InteractiveActivity } from '@/services/interactiveActivityService';

interface InteractiveActivityPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  activity: InteractiveActivity | null;
  subjectName?: string;
}

export default function InteractiveActivityPlayer({
  isOpen,
  onClose,
  activity,
  subjectName
}: InteractiveActivityPlayerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  if (!activity) return null;

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Erro ao alternar tela cheia:', err);
    }
  };

  const handleRestart = () => {
    setReloadKey(prev => prev + 1);
  };

  const handleClose = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    onClose();
  };

  const getDifficultyBadge = (diff?: string) => {
    switch (diff) {
      case 'beginner': return <Badge variant="outline" className="border-emerald-500 text-emerald-600 bg-emerald-50/50">Iniciante</Badge>;
      case 'intermediate': return <Badge variant="outline" className="border-amber-500 text-amber-600 bg-amber-50/50">Intermediário</Badge>;
      case 'advanced': return <Badge variant="outline" className="border-rose-500 text-rose-600 bg-rose-50/50">Avançado</Badge>;
      default: return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent 
        className="max-w-[96vw] w-[1400px] h-[94vh] p-0 overflow-hidden flex flex-col bg-background border shadow-2xl"
      >
        <div 
          ref={containerRef} 
          className={`flex flex-col h-full w-full bg-slate-950 text-slate-100 ${
            isFullscreen ? 'fixed inset-0 z-50' : 'relative'
          }`}
        >
          {/* Barra Superior do Player */}
          <div className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30">
                <Gamepad2 className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-slate-100 truncate">
                    {activity.title}
                  </h2>
                  {getDifficultyBadge(activity.difficulty)}
                  {activity.duration && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {activity.duration}
                    </span>
                  )}
                </div>
                {subjectName && (
                  <p className="text-xs text-slate-400 truncate">
                    {subjectName} {activity.description ? `• ${activity.description}` : ''}
                  </p>
                )}
              </div>
            </div>

            {/* Controles de Ação */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCode(!showCode)}
                className="text-slate-300 hover:text-white hover:bg-slate-800 text-xs hidden sm:flex items-center gap-1"
                title="Inspecionar código HTML do artefato"
              >
                <Code className="w-4 h-4" />
                {showCode ? 'Ocultar Código' : 'Ver Código'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRestart}
                className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white text-xs flex items-center gap-1"
                title="Reiniciar Atividade"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reiniciar
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={toggleFullscreen}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs flex items-center gap-1 shadow-md shadow-indigo-500/20"
                title={isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia (Fullscreen)'}
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Restaurar</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Tela Cheia</span>
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="text-slate-400 hover:text-white hover:bg-rose-950/50 h-8 w-8 ml-1"
                title="Fechar Player"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Área Principal de Execução do Artefato */}
          <div className="flex-1 relative flex overflow-hidden">
            {/* Iframe que executa o código HTML/CSS/JS da atividade */}
            <div className="flex-1 h-full bg-slate-900 flex items-center justify-center relative">
              <iframe
                key={reloadKey}
                srcDoc={activity.code_content}
                title={activity.title}
                className="w-full h-full border-0 bg-white"
                sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin allow-downloads"
                allow="autoplay; fullscreen; camera; microphone"
              />
            </div>

            {/* Painel lateral de visualização do código (opcional) */}
            {showCode && (
              <div className="w-96 border-l border-slate-800 bg-slate-950 p-4 overflow-y-auto flex flex-col shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-primary" />
                    Código Fonte do Artefato
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCode(false)}
                    className="text-slate-400 h-6 px-2 text-xs"
                  >
                    Fechar
                  </Button>
                </div>
                <pre className="text-xs font-mono text-emerald-400 bg-slate-900 p-3 rounded-lg border border-slate-800 overflow-x-auto whitespace-pre-wrap flex-1">
                  {activity.code_content}
                </pre>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
