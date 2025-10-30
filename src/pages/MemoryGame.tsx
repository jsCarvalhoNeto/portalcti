import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Trophy, Clock } from 'lucide-react';
import { useParams } from 'react-router-dom';

export default function MemoryGame() {
  const { level } = useParams();
  const [cards, setCards] = useState<any[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [time, setTime] = useState(0);
  const [timer, setTimer] = useState<number | null>(null);

 // Níveis de dificuldade
  const levels = {
    '1': { pairs: 6, name: 'Fácil' },
    '2': { pairs: 8, name: 'Médio' },
    '3': { pairs: 12, name: 'Difícil' }
  };

  const currentLevel = levels[level as keyof typeof levels] || levels['1'];

  useEffect(() => {
    initializeGame();
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [level]);

  const initializeGame = () => {
    // Resetar estado do jogo
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setGameStarted(false);
    setGameCompleted(false);
    setTime(0);
    
    if (timer) {
      clearInterval(timer);
      setTimer(null);
    }

    // Criar cartas
    const emojis = ['🍎', '🍌', '🍒', '🍇', '🍊', '🍓', '🍑', '🥝', '🥥', '🥭', '🍍', '🍉'];
    const selectedEmojis = emojis.slice(0, currentLevel.pairs);
    const gameCards = [...selectedEmojis, ...selectedEmojis]
      .map((emoji, index) => ({
        id: index,
        emoji,
        flipped: false,
        matched: false
      }))
      .sort(() => Math.random() - 0.5);

    setCards(gameCards);
  };

  const startGame = () => {
    setGameStarted(true);
    const newTimer = setInterval(() => {
      setTime(prev => prev + 1);
    }, 100);
    setTimer(newTimer);
  };

  const handleCardClick = (id: number) => {
    if (!gameStarted) {
      startGame();
    }

    if (flipped.length === 2) return;
    if (flipped.includes(id)) return;
    if (matched.includes(id)) return;

    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(moves + 1);
      const [firstId, secondId] = newFlipped;
      const firstCard = cards.find(card => card.id === firstId);
      const secondCard = cards.find(card => card.id === secondId);

      if (firstCard && secondCard && firstCard.emoji === secondCard.emoji) {
        setMatched([...matched, firstId, secondId]);
        setFlipped([]);
      } else {
        setTimeout(() => {
          setFlipped([]);
        }, 1000);
      }
    }
  };

  useEffect(() => {
    if (matched.length === currentLevel.pairs * 2) {
      setGameCompleted(true);
      if (timer) {
        clearInterval(timer);
        setTimer(null);
      }
    }
  }, [matched, currentLevel.pairs, timer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Jogo da Memória</h1>
          <p className="text-gray-600">Nível: {currentLevel.name} ({currentLevel.pairs} pares)</p>
        </div>

        <div className="flex justify-center items-center gap-6 mb-8">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow">
            <Clock className="h-5 w-5 text-blue-600" />
            <span className="font-mono">{formatTime(time)}</span>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow">
            <Trophy className="h-5 w-5 text-yellow-600" />
            <span>Movimentos: {moves}</span>
          </div>
          <Button onClick={initializeGame} variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reiniciar
          </Button>
        </div>

        {gameCompleted && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6 text-center">
            <h3 className="font-bold text-lg">Parabéns! 🎉</h3>
            <p>Você completou o jogo em {moves} movimentos e {formatTime(time)}!</p>
          </div>
        )}

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-w-2xl mx-auto">
          {cards.map((card) => (
            <div
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={`
                aspect-square cursor-pointer rounded-lg shadow-md transition-all duration-300 transform
                ${flipped.includes(card.id) || matched.includes(card.id) 
                  ? 'bg-white scale-95' 
                  : 'bg-blue-500 hover:bg-blue-600 scale-100'
                }
                ${matched.includes(card.id) ? 'opacity-50' : 'opacity-100'}
              `}
            >
              <div className="w-full h-full flex items-center justify-center text-2xl">
                {flipped.includes(card.id) || matched.includes(card.id) ? card.emoji : '?'}
              </div>
            </div>
          ))}
        </div>

        {!gameStarted && cards.length > 0 && (
          <div className="text-center mt-8">
            <p className="text-gray-600 mb-4">Clique em uma carta para começar o jogo!</p>
          </div>
        )}

        <div className="mt-8 text-center">
          <div className="bg-white rounded-lg p-4 inline-block shadow">
            <h3 className="font-semibold mb-2">Como Jogar:</h3>
            <p className="text-sm text-gray-600 max-w-md">
              Clique nas cartas para virá-las e encontre os pares iguais. 
              Combine todos os pares para vencer o jogo!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
