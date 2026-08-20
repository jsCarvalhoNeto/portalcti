import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Maximize2, RotateCcw } from 'lucide-react';

interface EducationalGamePlayerProps {
  title: string;
  code: string;
  showControls?: boolean;
  role?: 'teacher' | 'player';
  roomId?: string;
}

export default function EducationalGamePlayer({ title, code, showControls = true, role = 'player', roomId }: EducationalGamePlayerProps) {
  const [reloadKey, setReloadKey] = useState(0);

  const openFullscreen = () => {
    const frame = document.getElementById('educational-game-frame');
    if (frame instanceof HTMLElement) {
      frame.requestFullscreen().catch(() => undefined);
    }
  };

  const runtimeConfig = JSON.stringify({
    role,
    roomId,
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  }).replace(/</g, '\\u003c');
  const gameDocument = `<script>window.__EDUCATIONAL_GAME_CONFIG__=${runtimeConfig};</script>${code}`;

  return (
    <div className="h-full min-h-[440px] bg-slate-950 flex flex-col">
      {showControls && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-900 border-b border-slate-700">
          <p className="text-sm font-semibold text-white truncate">{title}</p>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => setReloadKey(key => key + 1)} className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reiniciar
            </Button>
            <Button size="sm" onClick={openFullscreen}>
              <Maximize2 className="w-3.5 h-3.5 mr-1" /> Tela cheia
            </Button>
          </div>
        </div>
      )}
      <iframe
        id="educational-game-frame"
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
