import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Calculator, 
  BarChart3, 
  Users, 
  Sparkles, 
  Gauge, 
  Clock, 
  UserCheck, 
  ArrowRightLeft, 
  Search, 
  ChevronLeft,
  Tv,
  Radio,
  Hand,
  CalendarDays,
  Code2,
  Database,
  Braces,
  Zap,
  Cloud,
  Smile,
  PenTool,
  Gamepad2,
  Star,
  History
} from 'lucide-react';
import { useState, useMemo, type ComponentType } from 'react';

// Utilitários existentes
import PollUtility from '@/components/teacher/PollUtility';
import SorteadorEquipes from '@/components/teacher/SorteadorEquipes';
import SpinWheel from '@/components/teacher/SpinWheel';
import QuickVoteUtility from '@/components/teacher/QuickVoteUtility';

// Utilitários de Gestão de Tempo & Sala
import ClassTimerUtility from '@/components/teacher/utilities/ClassTimerUtility';
import HelpQueueUtility from '@/components/teacher/utilities/HelpQueueUtility';
import ClassTimelineUtility from '@/components/teacher/utilities/ClassTimelineUtility';
import WhiteboardUtility from '@/components/teacher/utilities/WhiteboardUtility';
import TeamLiveRegistrationUtility from '@/components/teacher/utilities/TeamLiveRegistrationUtility';

// Utilitários de Prática Técnica & Programação
import ClassCodeBoardUtility from '@/components/teacher/utilities/ClassCodeBoardUtility';
import MockDataGeneratorUtility from '@/components/teacher/utilities/MockDataGeneratorUtility';
import CodeFormatterValidatorUtility from '@/components/teacher/utilities/CodeFormatterValidatorUtility';

// Utilitários de Engajamento, Feedback & Gamificação
import UnderstandingThermometerUtility from '@/components/teacher/utilities/UnderstandingThermometerUtility';
import FlashChallengeUtility from '@/components/teacher/utilities/FlashChallengeUtility';
import WordCloudBrainstormUtility from '@/components/teacher/utilities/WordCloudBrainstormUtility';
import EducationalGamesUtility from '@/components/teacher/utilities/EducationalGamesUtility';

// Utilitários de Notas & Sorteios
import GradeCalculatorUtility from '@/components/teacher/utilities/GradeCalculatorUtility';
import GradeConverterUtility from '@/components/teacher/utilities/GradeConverterUtility';
import StudentPickerUtility from '@/components/teacher/utilities/StudentPickerUtility';

type CategoryType = 'all' | 'code' | 'dynamics' | 'gamification' | 'feedback' | 'grades';

const FAVORITES_STORAGE_KEY = 'teacher-utilities-favorites';
const RECENT_STORAGE_KEY = 'teacher-utilities-recent';
const MAX_RECENT_UTILITIES = 5;

interface UtilityItem {
  id: string;
  component: ComponentType;
  name: string;
  description: string;
  category: CategoryType;
  icon: any;
  colorClass: string;
  borderClass: string;
  bgLightClass: string;
  badge: {
    label: string;
    icon?: any;
    variant?: 'default' | 'secondary' | 'outline' | 'destructive';
    className?: string;
  };
  highlight?: boolean;
}

const UTILITIES: UtilityItem[] = [
  // Categoria: Prática Técnica & Programação
  {
    id: 'quadro-branco',
    component: WhiteboardUtility,
    name: 'Quadro Branco (Estilo Excalidraw)',
    description: 'Lousa minimalista para diagramas, fluxogramas de lógica, anotações de aula, post-its e desenhos ao vivo para Datashow.',
    category: 'code',
    icon: PenTool,
    colorClass: 'text-violet-600 dark:text-violet-400',
    borderClass: 'hover:border-violet-500/50',
    bgLightClass: 'bg-violet-50 dark:bg-violet-950/30',
    badge: { label: 'Lousa & Diagramas', icon: Tv, className: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20' },
    highlight: true
  },
  {
    id: 'quadro-codigo',
    component: ClassCodeBoardUtility,
    name: 'Quadro de Códigos & Comandos',
    description: 'Compartilhe comandos Git, trechos de código e links para a turma com controle de tamanho para Datashow.',
    category: 'code',
    icon: Code2,
    colorClass: 'text-indigo-600 dark:text-indigo-400',
    borderClass: 'hover:border-indigo-500/50',
    bgLightClass: 'bg-indigo-50 dark:bg-indigo-950/30',
    badge: { label: 'Programação', className: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
    highlight: true
  },
  {
    id: 'gerador-dados',
    component: MockDataGeneratorUtility,
    name: 'Gerador de Dados Fictícios (Mock)',
    description: 'Gere listas brasileiras de teste (Nomes, CPFs, E-mails, Cidades) prontas em JSON, SQL (INSERT INTO) e CSV.',
    category: 'code',
    icon: Database,
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    borderClass: 'hover:border-emerald-500/50',
    bgLightClass: 'bg-emerald-50 dark:bg-emerald-950/30',
    badge: { label: 'SQL & APIs', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' }
  },
  {
    id: 'formatador-codigo',
    component: CodeFormatterValidatorUtility,
    name: 'Formatador & Validador (JSON/SQL)',
    description: 'Valide JSONs de APIs, identifique erros de sintaxe e formate queries SQL instantaneamente.',
    category: 'code',
    icon: Braces,
    colorClass: 'text-cyan-600 dark:text-cyan-400',
    borderClass: 'hover:border-cyan-500/50',
    bgLightClass: 'bg-cyan-50 dark:bg-cyan-950/30',
    badge: { label: 'Sintaxe', className: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20' }
  },

  // Categoria: Engajamento & Gamificação
  {
    id: 'jogos-educativos',
    component: EducationalGamesUtility,
    name: 'Jogos Educativos',
    description: 'Crie jogos interativos com HTML, CSS e JavaScript para projetar em sala ou compartilhar por QR Code e link.',
    category: 'gamification',
    icon: Gamepad2,
    colorClass: 'text-violet-600 dark:text-violet-400',
    borderClass: 'hover:border-violet-500/50',
    bgLightClass: 'bg-violet-50 dark:bg-violet-950/30',
    badge: { label: 'QR & Online', icon: Radio, className: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20' },
    highlight: true
  },
  {
    id: 'termometro',
    component: UnderstandingThermometerUtility,
    name: 'Termômetro de Compreensão',
    description: 'Avaliação formativa instantânea com diagnóstico pedagógico do nível de entendimento da turma.',
    category: 'gamification',
    icon: Smile,
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    borderClass: 'hover:border-emerald-500/50',
    bgLightClass: 'bg-emerald-50 dark:bg-emerald-950/30',
    badge: { label: 'Tempo Real', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
    highlight: true
  },
  {
    id: 'desafio-relampago',
    component: FlashChallengeUtility,
    name: 'Desafio Relâmpago (Quiz)',
    description: 'Quiz com timer e pontuação gamificada para warm-up e revisão de matérias no Datashow.',
    category: 'gamification',
    icon: Zap,
    colorClass: 'text-amber-600 dark:text-amber-400',
    borderClass: 'hover:border-amber-500/50',
    bgLightClass: 'bg-amber-50 dark:bg-amber-950/30',
    badge: { label: 'Gamificação', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' }
  },
  {
    id: 'nuvem-palavras',
    component: WordCloudBrainstormUtility,
    name: 'Nuvem de Palavras Coletiva',
    description: 'Brainstorming ao vivo com geração dinâmica de nuvem de ideias com tamanhos proporcionais.',
    category: 'gamification',
    icon: Cloud,
    colorClass: 'text-purple-600 dark:text-purple-400',
    borderClass: 'hover:border-purple-500/50',
    bgLightClass: 'bg-purple-50 dark:bg-purple-950/30',
    badge: { label: 'Brainstorm', className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' }
  },

  // Categoria: Dinâmica & Sala de Aula
  {
    id: 'timer',
    component: ClassTimerUtility,
    name: 'Timer & Pomodoro de Aula',
    description: 'Cronômetro visual com modo Pomodoro e Tela Cheia ideal para projetar no Datashow durante atividades.',
    category: 'dynamics',
    icon: Clock,
    colorClass: 'text-rose-600 dark:text-rose-400',
    borderClass: 'hover:border-rose-500/50',
    bgLightClass: 'bg-rose-50 dark:bg-rose-950/30',
    badge: { label: 'Datashow', icon: Tv, className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' }
  },
  {
    id: 'fila-duvidas',
    component: HelpQueueUtility,
    name: 'Fila de Dúvidas no Lab',
    description: 'Organize os chamados de atendimento e dúvidas dos alunos por ordem de chegada com aviso sonoro e tela para Datashow.',
    category: 'dynamics',
    icon: Hand,
    colorClass: 'text-amber-600 dark:text-amber-400',
    borderClass: 'hover:border-amber-500/50',
    bgLightClass: 'bg-amber-50 dark:bg-amber-950/30',
    badge: { label: 'Laboratório', icon: Tv, className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' }
  },
  {
    id: 'roteiro-aula',
    component: ClassTimelineUtility,
    name: 'Roteiro & Cronograma da Aula',
    description: 'Planeje os blocos de tempo da aula (Teoria, Prática, Intervalo) e acompanhe o progresso em tempo real.',
    category: 'dynamics',
    icon: CalendarDays,
    colorClass: 'text-sky-600 dark:text-sky-400',
    borderClass: 'hover:border-sky-500/50',
    bgLightClass: 'bg-sky-50 dark:bg-sky-950/30',
    badge: { label: 'Planejamento', className: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' }
  },
  {
    id: 'roleta',
    component: SpinWheel,
    name: 'Roleta de Temas',
    description: 'Sorteie temas, tópicos de estudo ou grupos de forma interativa com uma roleta giratória colorida.',
    category: 'dynamics',
    icon: Sparkles,
    colorClass: 'text-amber-600 dark:text-amber-400',
    borderClass: 'hover:border-amber-500/50',
    bgLightClass: 'bg-amber-50 dark:bg-amber-950/30',
    badge: { label: 'Interativo', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' }
  },
  {
    id: 'sorteador-equipes',
    component: SorteadorEquipes,
    name: 'Sorteador de Equipes',
    description: 'Divida alunos automaticamente em grupos balanceados, defina líderes e exporte as equipes.',
    category: 'dynamics',
    icon: Users,
    colorClass: 'text-pink-600 dark:text-pink-400',
    borderClass: 'hover:border-pink-500/50',
    bgLightClass: 'bg-pink-50 dark:bg-pink-950/30',
    badge: { label: 'Em Grupo', className: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20' }
  },
  {
    id: 'equipes-tempo-real',
    component: TeamLiveRegistrationUtility,
    name: 'Cadastro de Equipes (Tempo Real)',
    description: 'Os alunos entram pelo celular via QR Code, escolhem a série (1º, 2º ou 3º Ano), definem o time, líder e membros ao vivo.',
    category: 'dynamics',
    icon: Users,
    colorClass: 'text-pink-600 dark:text-pink-400',
    borderClass: 'hover:border-pink-500/50',
    bgLightClass: 'bg-pink-50 dark:bg-pink-950/30',
    badge: { label: 'Tempo Real & QR', icon: Radio, className: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20' },
    highlight: true
  },
  {
    id: 'sorteador-aluno',
    component: StudentPickerUtility,
    name: 'Sorteador de Alunos',
    description: 'Escolha entre o modo local, com lista manual, e o modo em tempo real, com séries, QR Code e PIN.',
    category: 'dynamics',
    icon: UserCheck,
    colorClass: 'text-indigo-600 dark:text-indigo-400',
    borderClass: 'hover:border-indigo-500/50',
    bgLightClass: 'bg-indigo-50 dark:bg-indigo-950/30',
    badge: { label: 'Local & Tempo Real', icon: Radio, className: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
    highlight: true
  },

  // Categoria: Votação & Pesquisa
  {
    id: 'pesquisa-online',
    component: PollUtility,
    name: 'Pesquisa Online (Enquetes)',
    description: 'Crie enquetes e pesquisas instantâneas para os alunos responderem pelo celular em tempo real.',
    category: 'feedback',
    icon: BarChart3,
    colorClass: 'text-blue-600 dark:text-blue-400',
    borderClass: 'hover:border-blue-500/50',
    bgLightClass: 'bg-blue-50 dark:bg-blue-950/30',
    badge: { label: 'Tempo Real', icon: Radio, className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' }
  },
  {
    id: 'votacao-rapida',
    component: QuickVoteUtility,
    name: 'Votação Rápida',
    description: 'Gere um link por turma para os alunos avaliarem de 0 a 10 com painel sincronizado ao vivo.',
    category: 'feedback',
    icon: Gauge,
    colorClass: 'text-cyan-600 dark:text-cyan-400',
    borderClass: 'hover:border-cyan-500/50',
    bgLightClass: 'bg-cyan-50 dark:bg-cyan-950/30',
    badge: { label: 'Tempo Real', icon: Radio, className: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20' }
  },

  // Categoria: Notas & Cálculos
  {
    id: 'calculadora-media',
    component: GradeCalculatorUtility,
    name: 'Calculadora de Média',
    description: 'Calcule médias simples ou ponderadas com pesos e simulação do status de aprovação.',
    category: 'grades',
    icon: Calculator,
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    borderClass: 'hover:border-emerald-500/50',
    bgLightClass: 'bg-emerald-50 dark:bg-emerald-950/30',
    badge: { label: 'Cálculo Rápido', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' }
  },
  {
    id: 'conversor-notas',
    component: GradeConverterUtility,
    name: 'Conversor de Notas',
    description: 'Converta notas instantaneamente entre escalas 0 a 10, 0 a 100 pontos e conceitos acadêmicos (A, B, C, D).',
    category: 'grades',
    icon: ArrowRightLeft,
    colorClass: 'text-teal-600 dark:text-teal-400',
    borderClass: 'hover:border-teal-500/50',
    bgLightClass: 'bg-teal-50 dark:bg-teal-950/30',
    badge: { label: 'Conversão', className: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20' }
  }
];

export default function TeacherUtilities() {
  const [activeUtilityId, setActiveUtilityId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('all');
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [recentIds, setRecentIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const filteredUtilities = useMemo(() => {
    return UTILITIES.filter(item => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch = 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const favoriteUtilities = useMemo(
    () => favoriteIds.map(id => UTILITIES.find(utility => utility.id === id)).filter(Boolean) as UtilityItem[],
    [favoriteIds]
  );

  const recentUtilities = useMemo(
    () => recentIds.map(id => UTILITIES.find(utility => utility.id === id)).filter(Boolean) as UtilityItem[],
    [recentIds]
  );

  const toggleFavorite = (utilityId: string) => {
    setFavoriteIds(current => {
      const next = current.includes(utilityId)
        ? current.filter(id => id !== utilityId)
        : [...current, utilityId];
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const openUtility = (utilityId: string) => {
    setActiveUtilityId(utilityId);
    setRecentIds(current => {
      const next = [utilityId, ...current.filter(id => id !== utilityId)].slice(0, MAX_RECENT_UTILITIES);
      localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const activeUtility = UTILITIES.find(u => u.id === activeUtilityId);
  const ActiveUtilityComponent = activeUtility?.component;

  return (
    <div className="space-y-6">
      {/* Visualização de Utilitário Ativo */}
      {activeUtility ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Barra de Navegação / Topo */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border/80 shadow-sm">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 hover:bg-muted font-medium"
                onClick={() => setActiveUtilityId(null)}
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar aos Utilitários
              </Button>
              <div className="h-5 w-[1px] bg-border hidden sm:block" />
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${activeUtility.bgLightClass}`}>
                  <activeUtility.icon className={`w-5 h-5 ${activeUtility.colorClass}`} />
                </div>
                <div>
                  <h2 className="text-lg font-bold leading-tight">{activeUtility.name}</h2>
                  <p className="text-xs text-muted-foreground hidden sm:block">{activeUtility.description}</p>
                </div>
              </div>
            </div>
            <Badge variant="outline" className={activeUtility.badge.className}>
              {activeUtility.badge.label}
            </Badge>
          </div>

          {/* Componente Específico Renderizado */}
          <div className="pt-2">
            {ActiveUtilityComponent && <ActiveUtilityComponent />}
          </div>
        </div>
      ) : (
        /* Visualização da Grade de Utilitários */
        <div className="space-y-6">
          {/* Cabeçalho da Seção */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Central de Utilitários</h2>
              <p className="text-sm text-muted-foreground">
                Ferramentas dinâmicas para prática técnica, engajamento, dinâmicas de sala, enquetes e notas
              </p>
            </div>

            {/* Busca Rápida */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar ferramenta..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-card"
              />
            </div>
          </div>

          {(favoriteUtilities.length > 0 || recentUtilities.length > 0) && !searchQuery && selectedCategory === 'all' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {favoriteUtilities.length > 0 && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    <h3 className="font-semibold text-sm">Favoritos</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {favoriteUtilities.map(utility => (
                      <Button key={utility.id} size="sm" variant="outline" className="text-xs gap-1.5" onClick={() => openUtility(utility.id)}>
                        <utility.icon className={`w-3.5 h-3.5 ${utility.colorClass}`} />
                        {utility.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              {recentUtilities.length > 0 && (
                <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <History className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <h3 className="font-semibold text-sm">Utilizados recentemente</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentUtilities.map(utility => (
                      <Button key={utility.id} size="sm" variant="outline" className="text-xs gap-1.5" onClick={() => openUtility(utility.id)}>
                        <utility.icon className={`w-3.5 h-3.5 ${utility.colorClass}`} />
                        {utility.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Filtros por Categoria */}
          <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-3">
            <Button
              size="sm"
              variant={selectedCategory === 'all' ? 'default' : 'ghost'}
              onClick={() => setSelectedCategory('all')}
              className="text-xs rounded-full h-8 px-3.5"
            >
              Todos ({UTILITIES.length})
            </Button>
            <Button
              size="sm"
              variant={selectedCategory === 'code' ? 'default' : 'ghost'}
              onClick={() => setSelectedCategory('code')}
              className="text-xs rounded-full h-8 px-3.5 gap-1.5"
            >
              <span>💻</span> Prática & Código ({UTILITIES.filter(u => u.category === 'code').length})
            </Button>
            <Button
              size="sm"
              variant={selectedCategory === 'gamification' ? 'default' : 'ghost'}
              onClick={() => setSelectedCategory('gamification')}
              className="text-xs rounded-full h-8 px-3.5 gap-1.5"
            >
              <span>🎮</span> Engajamento & Quiz ({UTILITIES.filter(u => u.category === 'gamification').length})
            </Button>
            <Button
              size="sm"
              variant={selectedCategory === 'dynamics' ? 'default' : 'ghost'}
              onClick={() => setSelectedCategory('dynamics')}
              className="text-xs rounded-full h-8 px-3.5 gap-1.5"
            >
              <span>🎯</span> Dinâmicas & Sala ({UTILITIES.filter(u => u.category === 'dynamics').length})
            </Button>
            <Button
              size="sm"
              variant={selectedCategory === 'feedback' ? 'default' : 'ghost'}
              onClick={() => setSelectedCategory('feedback')}
              className="text-xs rounded-full h-8 px-3.5 gap-1.5"
            >
              <span>📊</span> Votação & Pesquisa ({UTILITIES.filter(u => u.category === 'feedback').length})
            </Button>
            <Button
              size="sm"
              variant={selectedCategory === 'grades' ? 'default' : 'ghost'}
              onClick={() => setSelectedCategory('grades')}
              className="text-xs rounded-full h-8 px-3.5 gap-1.5"
            >
              <span>🧮</span> Notas & Cálculos ({UTILITIES.filter(u => u.category === 'grades').length})
            </Button>
          </div>

          {/* Grid de Cards de Utilitários */}
          {filteredUtilities.length === 0 ? (
            <div className="p-12 text-center bg-card rounded-2xl border border-dashed border-border text-muted-foreground space-y-3">
              <Search className="w-8 h-8 mx-auto opacity-40" />
              <p className="font-medium">Nenhum utilitário encontrado com esses termos.</p>
              <Button size="sm" variant="outline" onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}>
                Limpar Filtros
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredUtilities.map((utility) => {
                const Icon = utility.icon;
                const BadgeIcon = utility.badge.icon;

                return (
                  <Card
                    key={utility.id}
                    onClick={() => openUtility(utility.id)}
                    className={`group relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-pointer border border-border/70 ${utility.borderClass} flex flex-col justify-between`}
                  >
                    {/* Top Accent Line */}
                    <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent group-hover:via-primary transition-all" />

                    <CardHeader className="pb-3 pt-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className={`p-2.5 rounded-xl ${utility.bgLightClass} transition-transform group-hover:scale-110 duration-200`}>
                          <Icon className={`w-5 h-5 ${utility.colorClass}`} />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            aria-label={favoriteIds.includes(utility.id) ? `Remover ${utility.name} dos favoritos` : `Adicionar ${utility.name} aos favoritos`}
                            title={favoriteIds.includes(utility.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-amber-500/10 hover:text-amber-500"
                            onClick={(event) => { event.stopPropagation(); toggleFavorite(utility.id); }}
                          >
                            <Star className={`w-4 h-4 ${favoriteIds.includes(utility.id) ? 'fill-amber-500 text-amber-500' : ''}`} />
                          </button>
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] font-medium py-0.5 px-2 flex items-center gap-1 ${utility.badge.className || ''}`}
                          >
                            {BadgeIcon && <BadgeIcon className="w-3 h-3" />}
                            {utility.badge.label}
                          </Badge>
                        </div>
                      </div>

                      <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
                        {utility.name}
                      </CardTitle>
                      <CardDescription className="text-xs line-clamp-3 leading-relaxed mt-1">
                        {utility.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-0 pb-4">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full text-xs font-medium group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200 gap-1.5"
                      >
                        <Icon className="w-3.5 h-3.5" />
                        Abrir Ferramenta
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
