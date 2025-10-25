import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Clock, 
  Trophy,
  RotateCcw,
  Lightbulb,
  Volume2,
  Pause,
  Play
} from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';

interface CardType {
  id: string;
  pairId: string;
  content: string;
  type: 'question' | 'answer';
  isFlipped: boolean;
  isMatched: boolean;
}

interface LevelConfig {
  name: string;
  pairs: number;
  gridSize: string;
  description: string;
  timeLimit?: number;
  hintsAvailable: number;
}

const MemoryGame = () => {
  const { level } = useParams<{ level?: string }>();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentLevel, setCurrentLevel] = useState(level || 'iniciante');
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'victory'>('menu');
  const [cards, setCards] = useState<CardType[]>([]);
  const [flippedCards, setFlippedCards] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [hints, setHints] = useState(0);
  const [time, setTime] = useState(0);
  const [score, setScore] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [combo, setCombo] = useState(0);
  const [showHint, setShowHint] = useState<string | null>(null);

  // Configuração dos níveis
  const levels: Record<string, LevelConfig> = {
    iniciante: {
      name: 'Iniciante',
      pairs: 6,
      gridSize: 'grid-cols-4',
      description: '12 cartas - Sem timer - Dicas ilimitadas',
      hintsAvailable: 999
    },
    intermediario: {
      name: 'Intermediário',
      pairs: 10,
      gridSize: 'grid-cols-5',
      description: '20 cartas - Timer opcional - 3 dicas',
      timeLimit: 300, // 5 minutos
      hintsAvailable: 3
    },
    avancado: {
      name: 'Avançado',
      pairs: 15,
      gridSize: 'grid-cols-6',
      description: '30 cartas - Timer obrigatório - 1 dica',
      timeLimit: 600, // 10 minutos
      hintsAvailable: 1
    }
  };

  // Monitorar mudanças no nível
  useEffect(() => {
    console.log('*** DEBUG - MUDANÇA DE NÍVEL DETECTADA ***');
    console.log('Nível atual state:', currentLevel);
    console.log('Configuração do nível atual:', levels[currentLevel]);
    console.log('Pares esperados para este nível:', levels[currentLevel].pairs);
    console.log('*** FIM DEBUG MUDANÇA DE NÍVEL ***');
  }, [currentLevel]);

  // Monitorar mudanças específicas no estado do jogo
  useEffect(() => {
    console.log('*** DEBUG - MUDANÇA NO ESTADO DO JOGO ***');
    console.log('Estado do jogo:', gameState);
    console.log('Nível atual no estado:', currentLevel);
    console.log('Configuração atual:', levels[currentLevel]);
    if (gameState === 'playing') {
      console.log('Iniciando jogo com nível:', currentLevel);
      console.log('Pares esperados:', levels[currentLevel].pairs);
    }
    console.log('*** FIM DEBUG ESTADO DO JOGO ***');
  }, [gameState, currentLevel]);

  // Monitorar mudanças nas cartas
  useEffect(() => {
    console.log('*** DEBUG - MUDANÇA NAS CARTAS ***');
    console.log('Total de cartas atualizadas:', cards.length);
    console.log('Nível atual:', currentLevel);
    console.log('Configuração do nível:', levels[currentLevel]);
    console.log('Pares configurados:', levels[currentLevel].pairs);
    console.log('Cartas esperadas:', levels[currentLevel].pairs * 2);
    console.log('*** FIM DEBUG CARTAS ***');
  }, [cards, currentLevel]);

   // Conteúdo das cartas baseado na Aula 02 - Noções de Lógica e Raciocínio Lógico
  const cardContent = [
    // Categoria 1: Conceitos Fundamentais (6 pares) - Nível Iniciante
    { question: 'O que é lógica em programação?', answer: 'Conjunto de métodos e princípios para distinguir o raciocínio correto do incorreto' },
    { question: 'O que é raciocínio lógico?', answer: 'Aplicação prática da lógica para resolver problemas' },
    { question: 'O que é uma proposição?', answer: 'Afirmação que pode ser classificada como verdadeira ou falsa, sem ambiguidade' },
    { question: 'O que é um algoritmo?', answer: 'Conjunto finito e ordenado de passos claros e precisos para resolver um problema' },
    { question: 'Qual a importância da lógica na programação?', answer: 'Permite ao computador tomar decisões de forma exata e estruturada' },
    { question: 'O que significa "lógica é como o esqueleto do pensamento"?', answer: 'A lógica é a base estrutural que organiza ideias de forma compreensível para o computador' },

    // Categoria 2: Conectivos Lógicos (6 pares) - Nível Intermediário
    { question: 'O que faz o conectivo E (AND)?', answer: 'Só retorna verdadeiro se todas as proposições forem verdadeiras' },
    { question: 'O que faz o conectivo OU (OR)?', answer: 'Retorna verdadeiro se pelo menos uma proposição for verdadeira' },
    { question: 'O que faz o conectivo NÃO (NOT)?', answer: 'Inverte o valor lógico de uma proposição' },
    { question: 'O que é a implicação (SE...ENTÃO)?', answer: 'Indica que a verdade da primeira proposição leva à verdade da segunda' },
    { question: 'Qual o símbolo do conectivo E (AND)?', answer: '∧ ou &&' },
    { question: 'Qual o símbolo do conectivo OU (OR)?', answer: '∨ ou ||' },

    // Categoria 3: Propriedades de Algoritmos (6 pares) - Nível Intermediário
    { question: 'O que é a propriedade de finitude?', answer: 'Algoritmo deve ter começo e fim bem definidos, terminando em tempo finito' },
    { question: 'O que são entradas em um algoritmo?', answer: 'Dados iniciais necessários para a resolução do problema' },
    { question: 'O que são saídas em um algoritmo?', answer: 'Resultados produzidos como solução do problema' },
    { question: 'O que significa passos elementares?', answer: 'Cada instrução deve ser clara, precisa e não ambígua' },
    { question: 'O que é a propriedade de corretude?', answer: 'Algoritmo deve sempre produzir resultados corretos e consistentes' },
    { question: 'Por que a finitude é importante?', answer: 'Para que o programa não "trave" e sempre chegue a uma solução' },

    // Categoria 4: Exemplos Práticos (6 pares) - Nível Avançado
    { question: '"Está chovendo E estou com guarda-chuva"', answer: 'Verdadeiro apenas se ambas as condições forem verdadeiras' },
    { question: '"Vou à praia OU vou estudar"', answer: 'Verdadeiro se pelo menos uma opção acontecer' },
    { question: 'Sistema de login: "Usuário E senha corretos"', answer: 'Usa operador AND - precisa das duas condições' },
    { question: '"SE média ≥ 6.0, ENTÃO aprovado"', answer: 'Exemplo de estrutura condicional SE...ENTÃO' },
    { question: 'Problema do caramujo: por que leva 3 dias?', answer: 'No 3º dia o caramujo sobe e alcança a borda antes de escorregar' },
    { question: 'O que é "Se entrar lixo, sai lixo"?', answer: 'Significa que algoritmos produzem resultados baseados nas entradas' },

    // Categoria 5: Classificação de Proposições (6 pares) - Nível Avançado
    { question: '"Dez é menor que seis"', answer: 'Proposição FALSA' },
    { question: '"A Terra é redonda"', answer: 'Proposição VERDADEIRA' },
    { question: '"Como vai você?"', answer: 'NÃO é proposição (é pergunta)' },
    { question: '"Feche a porta!"', answer: 'NÃO é proposição (é comando)' },
    { question: '5 + 3 = 8', answer: 'Proposição VERDADEIRA' },
    { question: '"Fulano é muito competente"', answer: 'NÃO é proposição (é subjetivo)' },

    // Categoria 6: Formas de Representação (4 pares) - Nível Intermediário
    { question: 'O que é fluxograma?', answer: 'Representação gráfica usando símbolos padronizados' },
    { question: 'O que é pseudocódigo?', answer: 'Linguagem estruturada próxima à programação, mas em português' },
    { question: 'O que é linguagem natural?', answer: 'Forma mais informal, usando nossa língua cotidiana' },
    { question: 'Quais são os símbolos básicos do fluxograma?', answer: 'Terminador, Processamento, Entrada/Saída, Decisão e Conector' },

    // Categoria 7: Tabela Verdade (6 pares) - Nível Avançado
    { question: 'Quando A E B é verdadeiro?', answer: 'Somente quando A é verdadeiro E B é verdadeiro' },
    { question: 'Quando A OU B é verdadeiro?', answer: 'Quando A é verdadeiro, ou B é verdadeiro, ou ambos' },
    { question: 'Quando NÃO A é verdadeiro?', answer: 'Quando A é falso (inverte o valor lógico)' },
    { question: 'Quando A → B é falso?', answer: 'Quando A é verdadeiro e B é falso' },
    { question: 'O que é tautologia?', answer: 'Proposição que é sempre verdadeira, independentemente dos valores' },
    { question: 'O que é contradição?', answer: 'Proposição que é sempre falsa, independentemente dos valores' },

    // Categoria 8: Aplicações Práticas (6 pares) - Nível Avançado
    { question: 'Como a lógica é usada em jogos?', answer: 'As regras são algoritmos que governam movimentos e interações' },
    { question: 'Como a lógica é usada em cálculo de médias?', answer: 'SE média ≥ 6.0 ENTÃO aprovado SENÃO reprovado' },
    { question: 'O que é programação estruturada?', answer: 'Uso das estruturas sequência, decisão e repetição com lógica' },
    { question: 'Por que a precisão é crucial em programação?', answer: 'Erros lógicos podem fazer programas funcionarem mas darem resultados errados' },
    { question: 'O que é uma estrutura de decisão?', answer: 'Permite que o programa tome decisões baseadas em condições' },
    { question: 'O que são estruturas de repetição?', answer: 'Permitem que o programa repita ações enquanto uma condição for verdadeira' },

    // Categoria 9: Quiz Rápido da Aula (6 pares) - Nível Intermediário
    { question: 'Classifique: "O sol é azul"', answer: 'PROPOSIÇÃO FALSA' },
    { question: 'Classifique: "Qual é seu nome?"', answer: 'NÃO É PROPOSIÇÃO' },
    { question: 'Classifique: "5 + 3 = 8"', answer: 'PROPOSIÇÃO VERDADEIRA' },
    { question: 'Classifique: "Abra a porta"', answer: 'NÃO É PROPOSIÇÃO' },
    { question: 'Classifique: "Se chover, então levarei guarda-chuva"', answer: 'PROPOSIÇÃO VERDADEIRA ou FALSA (depende das condições)' },
    { question: 'Classifique: "Estou com fome"', answer: 'PROPOSIÇÃO VERDADEIRA ou FALSA (depende do estado)' },

    // Categoria 10: Exercícios Práticos (6 pares) - Nível Avançado
    { question: 'Se P=V e Q=F, então P E Q?', answer: 'FALSO (porque Q é falso)' },
    { question: 'Se P=V e Q=F, então P OU Q?', answer: 'VERDADEIRO (porque P é verdadeiro)' },
    { question: 'Se P=V, então NÃO P?', answer: 'FALSO (inverte o valor de verdadeiro para falso)' },
    { question: 'Se P=F e Q=F, então P OU Q?', answer: 'FALSO (nenhuma proposição é verdadeira)' },
    { question: 'Descreva os passos para "Preparar um sanduíche"', answer: 'Exemplo de algoritmo em linguagem natural com passos claros e finitos' },
    { question: 'O que são as estruturas básicas da programação estruturada?', answer: 'Sequência, decisão e repetição' }
  ];

  // Inicializar o jogo (aceita levelOverride para evitar depender do setState assíncrono)
  const initializeGame = (levelOverride?: string) => {
    const lvl = levelOverride || currentLevel;
    const config = levels[lvl];
    console.log('*** DEBUG - INICIALIZANDO JOGO ***');
    console.log('Nível atual recebido:', lvl);
    console.log('Configuração do nível:', config);
    console.log('Pares configurados para este nível:', config.pairs);
    console.log('Grid size configurado:', config.gridSize);
    
    // Dividir o conteúdo em categorias baseadas nos comentários
    const categorias = {
      iniciante: cardContent.slice(0, 6), // Primeiros 6 pares
      intermediario: [
        ...cardContent.slice(6, 12), // Conectivos Lógicos (6 pares)
        ...cardContent.slice(12, 18), // Propriedades de Algoritmos (6 pares)
        ...cardContent.slice(28, 32), // Formas de Representação (4 pares) - CORRIGIDO
        ...cardContent.slice(36, 42)  // Quiz Rápido da Aula (6 pares)
      ],
      avancado: [
        ...cardContent.slice(18, 24), // Exemplos Práticos (6 pares)
        ...cardContent.slice(24, 30), // Classificação de Proposições (6 pares)
        ...cardContent.slice(32, 38), // Tabela Verdade (6 pares) - CORRIGIDO
        ...cardContent.slice(42, 48), // Aplicações Práticas (6 pares) - CORRIGIDO
        ...cardContent.slice(48, 54)  // Exercícios Práticos (6 pares) - CORRIGIDO
      ]
    };

    // Selecionar conteúdo baseado no nível
  let levelContent = categorias[lvl as keyof typeof categorias] || cardContent.slice(0, 6);
    
    // Se o nível tiver menos conteúdo do que o necessário, usar o conteúdo total
    if (levelContent.length < config.pairs) {
      // Embaralhar todo o conteúdo disponível e pegar o número necessário de pares
      const shuffledContent = [...cardContent].sort(() => Math.random() - 0.5);
      levelContent = shuffledContent.slice(0, config.pairs);
    } else {
      // Embaralhar o conteúdo específico do nível e pegar o número necessário de pares
      const shuffledContent = [...levelContent].sort(() => Math.random() - 0.5);
      levelContent = shuffledContent.slice(0, config.pairs);
    }
    
  console.log('Conteúdo selecionado:', levelContent.length, 'pares');
    console.log('Total de cartas que serão criadas:', levelContent.length * 2);
  console.log('Cartas esperadas - Iniciante: 12, Intermediário: 20, Avançado: 30');
  console.log('Nível atual (verificação):', lvl);
    console.log('Configuração do nível:', config);
    console.log('Pares configurados:', config.pairs);
    console.log('Conteúdo total do nível:', levelContent);
    
    // Criar pares de cartas
    let gameCards: CardType[] = [];
    levelContent.forEach((item, index) => {
      gameCards.push({
        id: `q${index}`,
        pairId: `pair${index}`,
        content: item.question,
        type: 'question',
        isFlipped: false,
        isMatched: false
      });
      gameCards.push({
        id: `a${index}`,
        pairId: `pair${index}`,
        content: item.answer,
        type: 'answer',
        isFlipped: false,
        isMatched: false
      });
    });

    console.log('Total de cartas criadas:', gameCards.length);
    console.log('Número de pares criados:', gameCards.length / 2);
    console.log('*** FIM DEBUG ***');

    // Embaralhar cartas
    gameCards = gameCards.sort(() => Math.random() - 0.5);
    
    setCards(gameCards);
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setHints(config.hintsAvailable);
    setTime(0);
    setScore(0);
    setCombo(0);
    setTimerActive(true);
    setGameState('playing');
  };

  // Timer
  useEffect(() => {
    let interval: number | null = null;
    if (timerActive && gameState === 'playing') {
      interval = window.setInterval(() => {
        setTime(prev => prev + 1);
      }, 100);
    }
    return () => {
      if (interval !== null) {
        window.clearInterval(interval);
      }
    };
  }, [timerActive, gameState]);

  // Verificar pares
  useEffect(() => {
    if (flippedCards.length === 2) {
      const [firstId, secondId] = flippedCards;
      const firstCard = cards.find(c => c.id === firstId);
      const secondCard = cards.find(c => c.id === secondId);

      if (firstCard && secondCard && firstCard.pairId === secondCard.pairId) {
        // Par encontrado
        setCards(prevCards => 
          prevCards.map(card => 
            card.id === firstId || card.id === secondId 
              ? { ...card, isMatched: true, isFlipped: true }
              : card
          )
        );
        setMatches(prev => prev + 1);
        
        // Sistema de combo
        const newCombo = combo + 1;
        setCombo(newCombo);
        setScore(prev => prev + 10 + (newCombo * 2)); // Pontos base + bônus combo
        
        setFlippedCards([]);
      } else {
        // Par incorreto - virar cartas de volta após 1.5 segundos
        setTimeout(() => {
          setCards(prevCards => 
            prevCards.map(card => 
              card.id === firstId || card.id === secondId 
                ? { ...card, isFlipped: false }
                : card
            )
          );
          setFlippedCards([]);
          setCombo(0); // Reset combo
        }, 1500);
      }
      setMoves(prev => prev + 1);
    }
  }, [flippedCards, cards, combo]);

  // Verificar vitória
  useEffect(() => {
    const config = levels[currentLevel];
    if (matches === config.pairs) {
      setTimerActive(false);
      setGameState('victory');
      // Calcular pontuação final
      const timeBonus = Math.max(0, 300 - time); // Bônus por tempo
      const moveBonus = Math.max(0, 100 - moves); // Bônus por tentativas
      const finalScore = score + timeBonus + moveBonus + (combo * 10);
      setScore(finalScore);
    }
  }, [matches, currentLevel, time, moves, score, combo]);

  // Virar carta
  const flipCard = (cardId: string) => {
    if (gameState !== 'playing') return;
    
    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched || flippedCards.length === 2) {
      return;
    }

    setCards(prevCards => 
      prevCards.map(c => 
        c.id === cardId ? { ...c, isFlipped: true } : c
      )
    );

    setFlippedCards(prev => [...prev, cardId]);
  };

  // Usar dica
  const useHint = () => {
    if (hints <= 0) return;
    
    const unmatchedCards = cards.filter(c => !c.isMatched && !c.isFlipped);
    if (unmatchedCards.length >= 2) {
      const randomCard = unmatchedCards[0];
      setShowHint(randomCard.pairId);
      setHints(prev => prev - 1);
      
      setTimeout(() => setShowHint(null), 2000);
    }
  };

  // Formatar tempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Tela inicial
  if (gameState === 'menu') {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <header className="bg-card border-b">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate(`/disciplinas/${id}/interactive-activities`)}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </Button>
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-foreground">Jogo da Memória - Lógica de Programação</h1>
                  <p className="text-muted-foreground">Aula 02: Noções de Lógica e Raciocínio Lógico</p>
                </div>
                <div className="w-10"></div> {/* Spacer for alignment */}
              </div>
            </div>
          </header>

          <main className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">Escolha o Nível</h2>
                <p className="text-lg text-muted-foreground">
                  Teste seus conhecimentos sobre lógica de programação
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {Object.entries(levels).map(([key, level]) => (
                  <Card key={key} className="p-6 hover:shadow-lg transition-all duration-30 cursor-pointer border-2 hover:border-primary"
                        onClick={() => {
                          console.log('*** DEBUG - CLICOU NO NÍVEL ***');
                          console.log('Nível selecionado:', key);
                          console.log('Configuração deste nível:', level);
                          console.log('Pares deste nível:', level.pairs);
                          setCurrentLevel(key);
                          // Atualizar a URL para refletir o nível selecionado
                          navigate(`/disciplinas/${id}/interactive-activities/memory-game/${key}`);
                          setGameState('playing');
                          // Passar o nível selecionado diretamente para inicializar imediatamente
                          initializeGame(key);
                        }}>
                    <div className="text-center">
                      <h3 className="text-xl font-bold mb-2">{level.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{level.description}</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2 text-sm">
                          <Trophy className="w-4 h-4 text-yellow-500" />
                          <span>{level.pairs} pares</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-blue-500" />
                          <span>{level.timeLimit ? `${level.timeLimit / 60} min` : 'Sem timer'}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="bg-card p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Como Jogar</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Clique em duas cartas para encontrar os pares corretos</li>
                  <li>• Cartas azuis contêm perguntas/conceitos</li>
                  <li>• Cartas verdes contêm respostas</li>
                  <li>• Complete todos os pares para vencer o jogo</li>
                  <li>• Use dicas quando precisar de ajuda</li>
                </ul>
              </div>
            </div>
          </main>
        </div>
      </MainLayout>
    );
  }

  // Tela de jogo
  if (gameState === 'playing' || gameState === 'paused') {
    const config = levels[currentLevel];
    
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <header className="bg-card border-b sticky top-0 z-10">
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate(`/disciplinas/${id}/interactive-activities`)}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </Button>
                
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Nível</div>
                    <div className="font-semibold">{config.name}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Tentativas</div>
                    <div className="font-semibold">{moves}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Pares</div>
                    <div className="font-semibold">{matches}/{config.pairs}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Tempo</div>
                    <div className="font-semibold">{formatTime(time)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Pontos</div>
                    <div className="font-semibold">{score}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setGameState(gameState === 'playing' ? 'paused' : 'playing')}
                  >
                    {gameState === 'playing' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={useHint}
                    disabled={hints <= 0}
                  >
                    <Lightbulb className="w-4 h-4" />
                    <span className="ml-1">{hints}</span>
                  </Button>
                </div>
              </div>
            </div>
          </header>

          <main className="container mx-auto px-4 py-6">
            {gameState === 'paused' && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-card p-8 rounded-lg text-center">
                  <h2 className="text-2xl font-bold mb-4">Jogo Pausado</h2>
                  <Button onClick={() => setGameState('playing')}>
                    Continuar Jogo
                  </Button>
                </div>
              </div>
            )}

            <div className={`grid ${config.gridSize} gap-4 max-w-4xl mx-auto`}>
              {cards.map((card) => (
                <div
                  key={card.id}
                  className={`aspect-square cursor-pointer transition-all duration-300 transform ${
                    card.isFlipped || card.isMatched ? '' : 'hover:scale-105'
                  } ${showHint === card.pairId ? 'ring-4 ring-yellow-400' : ''}`}
                  onClick={() => flipCard(card.id)}
                >
                  <div className={`w-full h-full rounded-lg flex items-center justify-center text-center p-3 transition-all duration-300 ${
                    card.isMatched 
                      ? card.type === 'question' 
                        ? 'bg-green-200 border-2 border-green-500' 
                        : 'bg-green-300 border-2 border-green-600'
                      : card.isFlipped || card.isMatched
                      ? card.type === 'question'
                        ? 'bg-blue-200 border-2 border-blue-500'
                        : 'bg-green-200 border-2 border-green-500'
                      : 'bg-gray-300 border-2 border-gray-400 hover:bg-gray-400'
                  }`}>
                    {(card.isFlipped || card.isMatched) ? (
                      <p className="text-sm font-medium text-gray-800 px-2">
                        {card.content}
                      </p>
                    ) : (
                      <div className="text-gray-600">
                        {card.type === 'question' ? '?' : '✓'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Combo atual: {combo} | Dicas restantes: {hints}
              </p>
            </div>
          </main>
        </div>
      </MainLayout>
    );
  }

  // Tela de vitória
  if (gameState === 'victory') {
    const stars = score > 500 ? 3 : score > 300 ? 2 : 1;
    
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-10 flex items-center justify-center">
          <div className="max-w-2xl mx-auto text-center p-8">
            <div className="mb-6">
              <div className="text-6xl mb-4">🎉</div>
              <h1 className="text-4xl font-bold text-foreground mb-4">Parabéns!</h1>
              <p className="text-xl text-muted-foreground mb-6">
                Você completou o nível {levels[currentLevel].name}!
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg mb-6">
              <h2 className="text-2xl font-bold mb-4">Estatísticas da Partida</h2>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-primary">{formatTime(time)}</div>
                  <div className="text-sm text-muted-foreground">Tempo Total</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">{moves}</div>
                  <div className="text-sm text-muted-foreground">Tentativas</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">{(matches / moves * 100).toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">Taxa de Acerto</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">{score}</div>
                  <div className="text-sm text-muted-foreground">Pontuação</div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="text-4xl mb-2">
                {'★'.repeat(stars) + '☆'.repeat(3 - stars)}
              </div>
              <p className="text-lg text-muted-foreground">
                Classificação: {stars} de 3 estrelas
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <Button 
                onClick={() => {
                  setGameState('playing');
                  initializeGame();
                }}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Jogar Novamente
              </Button>
              <Button 
                onClick={() => navigate(`/disciplinas/${id}/interactive-activities`)}
                variant="outline"
              >
                Voltar às Atividades
              </Button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return null;
};

export default MemoryGame;
