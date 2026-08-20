import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import EducationalGamePlayer from '@/components/teacher/utilities/EducationalGamePlayer';
import educationalGameService, { EducationalGame } from '@/services/educationalGameService';
import { Gamepad2, Loader2 } from 'lucide-react';

export default function PublicEducationalGamePage() {
  const { shareCode } = useParams<{ shareCode: string }>();
  const [game, setGame] = useState<EducationalGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const loadGame = async () => {
      if (!shareCode) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const result = await educationalGameService.getPublishedByShareCode(shareCode);
        setGame(result);
        setNotFound(!result);
      } catch (error) {
        console.error('Erro ao carregar jogo público:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    void loadGame();
  }, [shareCode]);

  if (loading) {
    return <main className="min-h-screen grid place-items-center bg-slate-950 text-white"><div className="text-center"><Loader2 className="w-8 h-8 mx-auto animate-spin mb-3" />Carregando jogo...</div></main>;
  }

  if (notFound || !game) {
    return <main className="min-h-screen grid place-items-center bg-slate-950 px-4 text-center text-white"><div><Gamepad2 className="w-12 h-12 mx-auto text-violet-400 mb-4" /><h1 className="text-2xl font-bold">Jogo indisponível</h1><p className="text-slate-400 mt-2">Este link não existe, foi despublicado ou não está mais disponível.</p></div></main>;
  }

  return (
    <main className="min-h-screen bg-slate-950">
      <header className="px-4 py-3 bg-slate-900 border-b border-slate-800 text-white">
        <div className="max-w-6xl mx-auto flex gap-3 items-center"><Gamepad2 className="text-violet-400" /><div><h1 className="font-bold">{game.title}</h1>{game.description && <p className="text-xs text-slate-400">{game.description}</p>}</div></div>
      </header>
      <section className="max-w-6xl mx-auto min-h-[calc(100vh-69px)]"><EducationalGamePlayer title={game.title} code={game.code_content} role="player" roomId={game.share_code} /></section>
    </main>
  );
}
