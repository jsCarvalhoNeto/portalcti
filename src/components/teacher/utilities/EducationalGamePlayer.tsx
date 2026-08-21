import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Maximize2, RotateCcw } from 'lucide-react';
import { createEducationalGameDocument, EducationalGameMessage, isEducationalGameMessage } from './educationalGameRuntime';

interface EducationalGamePlayerProps {
  title: string;
  code: string;
  showControls?: boolean;
  role?: 'teacher' | 'player';
  roomId?: string;
  gameId?: string;
  onGameEvent?: (event: EducationalGameMessage) => void;
}

export default function EducationalGamePlayer({ title, code, showControls = true, role = 'player', roomId, gameId, onGameEvent }: EducationalGamePlayerProps) {
  const [reloadKey, setReloadKey] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);

  const openFullscreen = () => {
    const frame = frameRef.current;
    if (frame instanceof HTMLElement) {
      frame.requestFullscreen().catch(() => undefined);
    }
  };

  const runtimeConfig = {
    gameId,
    role,
    roomId,
    locale: document.documentElement.lang || navigator.language || 'pt-BR',
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    // Compatibilidade temporária com o template multiplayer legado. Templates
    // novos devem preferir a API window.EducationalGame fornecida pelo portal.
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  };
  const gameDocument = useMemo(() => createEducationalGameDocument(code, runtimeConfig), [code, gameId, role, roomId, reloadKey]);

  useEffect(() => {
    setIsReady(false);
    const receiveMessage = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow || !isEducationalGameMessage(event.data)) return;
      if (event.data.type === 'ready') setIsReady(true);
      onGameEvent?.(event.data);
    };
    window.addEventListener('message', receiveMessage);
    return () => window.removeEventListener('message', receiveMessage);
  }, [reloadKey, code, onGameEvent]);

  return (
    <div className="h-full min-h-[440px] bg-slate-950 flex flex-col" aria-label={`Player do jogo ${title}`}>
      {showControls && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-900 border-b border-slate-700">
          <p className="text-sm font-semibold text-white truncate">{title}</p>
          <div className="flex gap-2 shrink-0">
            <span className="sr-only" role="status" aria-live="polite">{isReady ? 'Jogo pronto' : 'Carregando jogo'}</span>
            <Button variant="outline" size="sm" onClick={() => setReloadKey(key => key + 1)} aria-label={`Reiniciar ${title}`} className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reiniciar
            </Button>
            <Button size="sm" onClick={openFullscreen} aria-label={`Abrir ${title} em tela cheia`}>
              <Maximize2 className="w-3.5 h-3.5 mr-1" /> Tela cheia
            </Button>
          </div>
        </div>
      )}
      <iframe
        ref={frameRef}
        key={reloadKey}
        srcDoc={gameDocument}
        title={title}
        className="w-full flex-1 border-0 bg-white"
        sandbox="allow-scripts allow-forms allow-modals allow-popups"
        allow="autoplay; fullscreen"
      />
    </div>
  );
}
