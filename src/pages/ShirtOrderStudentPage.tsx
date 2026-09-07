import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Shirt, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  Edit3, 
  GraduationCap, 
  Info, 
  ShieldCheck,
  Send,
  HelpCircle,
  Clock,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  saveShirtOrder, 
  type ShirtSize, 
  type ShirtModel, 
  type ShirtOrder 
} from '@/services/shirtOrderService';

const SIZES: { size: ShirtSize; desc: string }[] = [
  { size: 'P', desc: 'Pequeno • Tórax 96cm' },
  { size: 'M', desc: 'Médio • Tórax 104cm' },
  { size: 'G', desc: 'Grande • Tórax 112cm' },
  { size: 'GG', desc: 'Extra Grande • Tórax 120cm' },
  { size: 'XGG', desc: 'Plus Size • Tórax 128cm' }
];

const GRADES = ['1º Ano', '2º Ano', '3º Ano'];

export default function ShirtOrderStudentPage() {
  const { code } = useParams<{ code?: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const sessionCode = (code || 'CAMISA2026').toUpperCase().trim();

  // Dados do formulário
  const [studentName, setStudentName] = useState('');
  const [studentRegistration, setStudentRegistration] = useState('');
  const [grade, setGrade] = useState('1º Ano');
  const [model, setModel] = useState<ShirtModel>('masculino');
  const [size, setSize] = useState<ShirtSize>('M');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showMeasureGuide, setShowMeasureGuide] = useState(false);

  // Pedido já confirmado no dispositivo
  const storageKey = `cti_shirt_confirmed_${sessionCode}`;
  const [confirmedOrder, setConfirmedOrder] = useState<ShirtOrder | null>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Preencher dados caso o usuário esteja logado
  useEffect(() => {
    if (profile?.full_name && !confirmedOrder) {
      setStudentName(profile.full_name);
    }
    if (profile?.student_registration && !confirmedOrder) {
      setStudentRegistration(profile.student_registration);
    }
  }, [profile, confirmedOrder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentName.trim()) {
      toast.error('Por favor, informe seu nome completo.');
      return;
    }

    setSubmitting(true);
    try {
      const order = await saveShirtOrder({
        student_name: studentName.trim(),
        student_id: user?.id || null,
        student_registration: studentRegistration.trim(),
        grade,
        model,
        size,
        notes: notes.trim(),
        session_code: sessionCode
      });

      setConfirmedOrder(order);
      try {
        localStorage.setItem(storageKey, JSON.stringify(order));
      } catch (err) {
        console.warn('Erro ao gravar no localStorage:', err);
      }

      toast.success('🎉 Pedido de camisa registrado com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao enviar pedido. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditAgain = () => {
    if (confirmedOrder) {
      setStudentName(confirmedOrder.student_name);
      setGrade(confirmedOrder.grade);
      setModel(confirmedOrder.model);
      setSize(confirmedOrder.size);
      setNotes(confirmedOrder.notes || '');
      setConfirmedOrder(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-emerald-50/20 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-6 px-4 sm:px-6 lg:px-8 flex flex-col justify-between">
      <div className="max-w-xl mx-auto w-full">
        {/* Cabeçalho */}
        <div className="text-center mb-6 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Informática BVA • Censo de Camisas
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center justify-center gap-2">
            <Shirt className="w-7 h-7 text-emerald-600" />
            Camisa Oficial do Curso
          </h1>

          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Informe seu tamanho e o modelo desejado para garantirmos a produção correta da sua camisa.
          </p>
        </div>

        {/* Tela de Confirmação do Pedido */}
        {confirmedOrder ? (
          <Card className="border-emerald-500/30 shadow-xl overflow-hidden bg-card">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white text-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-black">Tamanho Registrado!</h2>
              <p className="text-emerald-100 text-xs mt-1">
                Suas informações foram salvas e enviadas para o painel do professor.
              </p>
            </div>

            <CardContent className="p-6 space-y-4">
              <div className="rounded-xl bg-muted/40 p-4 border border-border/60 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-border/50 text-xs">
                  <span className="text-muted-foreground">Aluno(a):</span>
                  <span className="font-bold text-foreground text-sm">{confirmedOrder.student_name}</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-border/50 text-xs">
                  <span className="text-muted-foreground">Turma / Série:</span>
                  <Badge variant="outline" className="font-bold border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
                    {confirmedOrder.grade}
                  </Badge>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-border/50 text-xs">
                  <span className="text-muted-foreground">Modelo Selecionado:</span>
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    {confirmedOrder.model === 'masculino' ? '👔 Masculino' : '👚 Feminina (Baby Look)'}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-border/50 text-xs">
                  <span className="text-muted-foreground">Tamanho Escolhido:</span>
                  <span className="inline-block px-3 py-1 bg-emerald-600 text-white font-black text-base rounded-lg shadow-sm">
                    {confirmedOrder.size}
                  </span>
                </div>

                {confirmedOrder.notes && (
                  <div className="flex justify-between items-start text-xs pt-1">
                    <span className="text-muted-foreground">Observação:</span>
                    <span className="font-medium text-foreground text-right max-w-[200px]">{confirmedOrder.notes}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 rounded-xl text-xs text-emerald-800 dark:text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Caso queira mudar o tamanho ou modelo antes da confecção, você pode editar abaixo.</span>
              </div>
            </CardContent>

            <CardFooter className="p-6 pt-0 flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={handleEditAgain}
                variant="outline" 
                className="w-full text-xs font-semibold gap-2 border-border/80"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Corrigir / Alterar Informações
              </Button>
            </CardFooter>
          </Card>
        ) : (
          /* Formulário de Preenchimento */
          <form onSubmit={handleSubmit}>
            <Card className="border-border/80 shadow-xl overflow-hidden bg-card">
              <CardHeader className="p-5 pb-4 border-b border-border/40 bg-muted/20">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-emerald-600" />
                  Preencha seus dados
                </CardTitle>
                <CardDescription className="text-xs">
                  Leva menos de 1 minuto para preencher.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5 space-y-5">
                {/* Nome Completo */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center justify-between">
                    <span>Nome Completo *</span>
                    <span className="text-[11px] font-normal text-muted-foreground">Como na chamada</span>
                  </label>
                  <Input 
                    placeholder="Digite seu nome completo" 
                    value={studentName}
                    onChange={e => setStudentName(e.target.value)}
                    required
                    className="h-11 text-sm"
                  />
                </div>

                {/* Turma / Série */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Sua Turma / Série *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {GRADES.map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGrade(g)}
                        className={`py-2.5 px-2 text-xs font-bold rounded-xl border transition-all ${
                          grade === g 
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                            : 'bg-muted/40 hover:bg-muted border-border/80 text-foreground'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Modelo da Camisa (Masculino ou Feminino) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Modelo da Camisa *</label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Modelo Masculino */}
                    <div 
                      onClick={() => setModel('masculino')}
                      className={`cursor-pointer p-3.5 rounded-xl border transition-all flex items-center gap-3 ${
                        model === 'masculino'
                          ? 'border-blue-500 bg-blue-500/10 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/30 shadow-sm'
                          : 'border-border/80 bg-card hover:bg-muted/40 text-foreground'
                      }`}
                    >
                      <div className="text-2xl p-2 rounded-lg bg-blue-500/10">👔</div>
                      <div>
                        <div className="font-extrabold text-sm">Masculino</div>
                        <div className="text-[11px] text-muted-foreground">Corte Tradicional</div>
                      </div>
                    </div>

                    {/* Modelo Feminino */}
                    <div 
                      onClick={() => setModel('feminino')}
                      className={`cursor-pointer p-3.5 rounded-xl border transition-all flex items-center gap-3 ${
                        model === 'feminino'
                          ? 'border-pink-500 bg-pink-500/10 text-pink-900 dark:text-pink-200 ring-2 ring-pink-500/30 shadow-sm'
                          : 'border-border/80 bg-card hover:bg-muted/40 text-foreground'
                      }`}
                    >
                      <div className="text-2xl p-2 rounded-lg bg-pink-500/10">👚</div>
                      <div>
                        <div className="font-extrabold text-sm">Feminina</div>
                        <div className="text-[11px] text-muted-foreground">Baby Look / Acinturada</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tamanho da Camisa (P, M, G, GG, XGG) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground">Tamanho da Camisa *</label>
                    <button
                      type="button"
                      onClick={() => setShowMeasureGuide(!showMeasureGuide)}
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 hover:underline"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      {showMeasureGuide ? 'Ocultar tabela de medidas' : 'Ver tabela de medidas'}
                    </button>
                  </div>

                  {/* Guia de Medidas Retrátil */}
                  {showMeasureGuide && (
                    <div className="p-3 bg-muted/40 rounded-xl border border-border/60 text-xs space-y-2 animate-in fade-in duration-200">
                      <div className="font-bold text-foreground">Guia de referência de tamanhos:</div>
                      <div className="grid grid-cols-5 gap-1.5 text-center text-[11px]">
                        <div className="p-1 rounded bg-background border"><strong>P:</strong> 68 x 48 cm</div>
                        <div className="p-1 rounded bg-background border"><strong>M:</strong> 71 x 52 cm</div>
                        <div className="p-1 rounded bg-background border"><strong>G:</strong> 73 x 56 cm</div>
                        <div className="p-1 rounded bg-background border"><strong>GG:</strong> 76 x 60 cm</div>
                        <div className="p-1 rounded bg-background border"><strong>XGG:</strong> 79 x 64 cm</div>
                      </div>
                      <p className="text-[10px] text-muted-foreground italic">* Altura x Largura aproximadas.</p>
                    </div>
                  )}

                  {/* Seleção dos 5 Tamanhos */}
                  <div className="grid grid-cols-5 gap-2">
                    {SIZES.map(item => {
                      const isSelected = size === item.size;
                      return (
                        <button
                          key={item.size}
                          type="button"
                          onClick={() => setSize(item.size)}
                          className={`p-3 rounded-xl border text-center transition-all ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md transform -translate-y-0.5'
                              : 'bg-card hover:bg-muted/40 border-border/80 text-foreground'
                          }`}
                        >
                          <div className="text-xl font-black">{item.size}</div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-center text-xs text-muted-foreground">
                    Selecionado: <strong className="text-foreground">{size}</strong> ({SIZES.find(s => s.size === size)?.desc})
                  </div>
                </div>

                {/* Observação Opcional */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Observação (Opcional)</label>
                  <Input 
                    placeholder="Ex: Nome/apelido se houver estampa personalizada"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="h-10 text-xs"
                  />
                </div>
              </CardContent>

              <CardFooter className="p-5 pt-0">
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 text-sm shadow-md gap-2"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Registrando pedido...' : 'Confirmar e Enviar Pedido'}
                </Button>
              </CardFooter>
            </Card>
          </form>
        )}

        {/* Rodapé informativo */}
        <div className="text-center mt-6 text-xs text-muted-foreground space-y-1">
          <p>Curso Técnico de Informática • BVA</p>
          <p className="text-[11px] opacity-75">As informações serão consolidadas pelo professor para envio à confecção.</p>
        </div>
      </div>
    </div>
  );
}
