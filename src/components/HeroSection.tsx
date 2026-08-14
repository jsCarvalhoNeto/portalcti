import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  ArrowRight, 
  Play, 
  BookOpen, 
  Sparkles, 
  Terminal, 
  Code2, 
  Layers, 
  FolderGit2, 
  Users2, 
  TrendingUp, 
  Award,
  CheckCircle2,
  Copy,
  Check
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import heroImage from "@/assets/hero-education.png";

const HeroSection = () => {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"code" | "skills" | "terminal">("code");
  const [copied, setCopied] = useState(false);

  const codeSnippets = {
    code: `// Bem-vindo ao Curso Técnico em Informática
interface EstudanteTech {
  nome: string;
  foco: "Web" | "Fullstack" | "Redes" | "Dados";
  projetos: number;
  status: "Pronto para o Mercado";
}

export const futuroDesenvolvedor: EstudanteTech = {
  nome: "Você",
  foco: "Fullstack",
  projetos: 15,
  status: "Pronto para o Mercado"
};

// Executando aprendizado prático...
console.log("🚀 Construindo projetos reais na EEEP Balbina Viana Arraes!");`,

    skills: `// Matriz de Competências Práticas
{
  "frontend": ["HTML5", "CSS3 / Tailwind", "JavaScript", "React"],
  "backend": ["Node.js", "Python", "SQL / PostgreSQL", "REST APIs"],
  "infraestrutura": ["Redes de Computadores", "Linux", "Git & GitHub"],
  "metodologia": ["Projetos Reais", "Desafios Gamificados", "Trabalho em Equipe"]
}`,

    terminal: `$ npm run build:future
> cursinfobva@2026 init
✔ Carregando módulos de lógica e programação...
✔ Conectando laboratório de desenvolvimento web...
✔ Habilitando desafios práticos e gamificação...
✔ Certificações validadas com sucesso!

✨ Compilação concluída! Você está pronto para decolar.`
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="home" className="relative min-h-[92vh] lg:min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-16 bg-slate-950 text-white">
      {/* Background Image com Overlay Tecnológico e Grid */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Estudantes de informática aprendendo tecnologia"
          className="w-full h-full object-cover opacity-20 filter contrast-125"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/80 to-slate-950"></div>
        {/* Subtle Cyber Grid */}
        <div 
          className="absolute inset-0 opacity-[0.07]" 
          style={{ 
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)`,
            backgroundSize: '32px 32px' 
          }}
        />
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Coluna Esquerda: Texto, CTAs e Métricas */}
          <div className="lg:col-span-7 text-left">
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-medium text-blue-200 mb-6 shadow-inner animate-fade-in hover:bg-white/15 transition-colors">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>EEEP Balbina Viana Arraes • Curso Técnico em Informática</span>
            </div>

            {/* Headline Principal */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
              Transforme sua paixão por tecnologia em uma{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent underline decoration-cyan-500/30 decoration-wavy decoration-2">
                carreira real.
              </span>
            </h1>

            {/* Subtítulo */}
            <p className="text-base sm:text-lg lg:text-xl text-slate-300 mb-8 max-w-2xl leading-relaxed">
              Desenvolva softwares, domine bancos de dados, redes e computação em nuvem com projetos práticos, laboratórios modernos e desafios gamificados.
            </p>

            {/* Botões de Ação */}
            <div className="flex flex-wrap items-center gap-4 mb-12">
              <Button 
                variant="gradient" 
                size="lg" 
                className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 border-0 rounded-xl px-6 py-6 font-semibold"
                asChild
              >
                <Link to="/disciplinas">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Explorar Disciplinas
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1.5 transition-transform" />
                </Link>
              </Button>

              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => setIsVideoOpen(true)}
                className="group bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md rounded-xl px-6 py-6 font-medium transition-all"
              >
                <Play className="w-5 h-5 mr-2 text-cyan-400 group-hover:scale-110 transition-transform" />
                Assistir Apresentação
              </Button>
            </div>

            {/* Cards de Métricas com Glassmorphism */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-2xl">
              <div className="p-3.5 sm:p-4 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-blue-500/40 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center gap-2 mb-1">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span className="text-2xl sm:text-3xl font-bold text-white">12+</span>
                </div>
                <div className="text-xs text-slate-300 font-medium">Disciplinas Técnicas</div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-indigo-500/40 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center gap-2 mb-1">
                  <FolderGit2 className="w-4 h-4 text-indigo-400" />
                  <span className="text-2xl sm:text-3xl font-bold text-white">50+</span>
                </div>
                <div className="text-xs text-slate-300 font-medium">Projetos Práticos</div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-emerald-500/40 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center gap-2 mb-1">
                  <Users2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-2xl sm:text-3xl font-bold text-white">80+</span>
                </div>
                <div className="text-xs text-slate-300 font-medium">Alunos Ativos</div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-yellow-500/40 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-yellow-400" />
                  <span className="text-2xl sm:text-3xl font-bold text-white">98%</span>
                </div>
                <div className="text-xs text-slate-300 font-medium">Aprovação & Êxito</div>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Mockup de Código & Badges Flutuantes */}
          <div className="lg:col-span-5 relative mt-6 lg:mt-0">
            {/* Glow decorativo de fundo */}
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-2xl blur-xl opacity-30 group-hover:opacity-100 transition duration-1000"></div>

            {/* Janela Editor de Código */}
            <div className="relative rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-white/15 shadow-2xl overflow-hidden">
              {/* Header da Janela (Estilo macOS / VS Code) */}
              <div className="flex items-center justify-between px-4 py-3 bg-slate-950/70 border-b border-white/10">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/90"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/90"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500/90"></div>
                </div>

                {/* Abas Alternáveis */}
                <div className="flex space-x-1">
                  <button 
                    onClick={() => setActiveTab("code")}
                    className={`px-2.5 py-1 text-xs font-mono rounded-md flex items-center gap-1.5 transition-colors ${
                      activeTab === "code" ? "bg-slate-800 text-cyan-300 border border-white/10" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Carreira.ts</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab("skills")}
                    className={`px-2.5 py-1 text-xs font-mono rounded-md flex items-center gap-1.5 transition-colors ${
                      activeTab === "skills" ? "bg-slate-800 text-cyan-300 border border-white/10" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Skills.json</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab("terminal")}
                    className={`px-2.5 py-1 text-xs font-mono rounded-md flex items-center gap-1.5 transition-colors ${
                      activeTab === "terminal" ? "bg-slate-800 text-emerald-400 border border-white/10" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>bash</span>
                  </button>
                </div>

                {/* Botão Copiar Snippet */}
                <button
                  onClick={handleCopyCode}
                  title="Copiar código"
                  className="text-slate-400 hover:text-white p-1 rounded transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Corpo do Código */}
              <div className="p-4 sm:p-5 font-mono text-xs sm:text-[13px] leading-relaxed overflow-x-auto min-h-[280px] max-h-[340px] text-slate-300 selection:bg-cyan-500/30">
                <pre className="text-left whitespace-pre">
                  <code>{codeSnippets[activeTab]}</code>
                </pre>
              </div>

              {/* Barra de Status do Editor */}
              <div className="px-4 py-1.5 bg-slate-950 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" /> TypeScript 5.0
                  </span>
                  <span>UTF-8</span>
                </div>
                <span>EEEP BVA • Tech Hub</span>
              </div>
            </div>

            {/* Badges Flutuantes Decorativas (Glassmorphism) */}
            <div className="hidden sm:flex absolute -bottom-5 -left-4 items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-white/20 shadow-xl animate-bounce" style={{ animationDuration: '4s' }}>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                <Award className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white">Gamificação & Desafios</div>
                <div className="text-[11px] text-slate-300">Aprenda na prática com XP</div>
              </div>
            </div>

            <div className="hidden sm:flex absolute -top-5 -right-4 items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-white/20 shadow-xl">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
                <Terminal className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white">Laboratório Web</div>
                <div className="text-[11px] text-slate-300">Editor e testes online</div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Modal / Dialog de Apresentação em Vídeo */}
      <Dialog open={isVideoOpen} onOpenChange={setIsVideoOpen}>
        <DialogContent className="sm:max-w-3xl bg-slate-950 text-white border-white/15 p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
              <Play className="w-5 h-5 text-cyan-400" />
              Apresentação do Curso Técnico em Informática
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Conheça a estrutura, matriz curricular e oportunidades do curso na EEEP Balbina Viana Arraes.
            </DialogDescription>
          </DialogHeader>
          <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-900 border border-white/10 mt-4 flex items-center justify-center relative">
            <iframe 
              className="w-full h-full"
              src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=0" 
              title="Apresentação do Curso"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default HeroSection;
