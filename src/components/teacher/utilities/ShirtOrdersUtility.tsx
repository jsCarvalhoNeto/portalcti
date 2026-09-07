import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Shirt, 
  Users, 
  QrCode, 
  Copy, 
  Check, 
  ExternalLink, 
  RefreshCw, 
  Plus, 
  Download, 
  Trash2, 
  Edit3, 
  Search, 
  Filter, 
  CheckCircle2, 
  Tv, 
  Radio, 
  Sparkles,
  Share2,
  Calendar,
  Layers,
  BarChart3,
  RotateCcw
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { 
  getShirtOrders, 
  saveShirtOrder, 
  deleteShirtOrder, 
  updateShirtOrder, 
  clearAllShirtOrders,
  type ShirtOrder, 
  type ShirtSize, 
  type ShirtModel 
} from '@/services/shirtOrderService';

const SIZES: ShirtSize[] = ['P', 'M', 'G', 'GG', 'XGG'];
const GRADES = ['1º Ano', '2º Ano', '3º Ano'];

export default function ShirtOrdersUtility() {
  const [orders, setOrders] = useState<ShirtOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [selectedSize, setSelectedSize] = useState<string>('all');

  // Modais
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ShirtOrder | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Form Manual
  const [manualName, setManualName] = useState('');
  const [manualGrade, setManualGrade] = useState('1º Ano');
  const [manualModel, setManualModel] = useState<ShirtModel>('masculino');
  const [manualSize, setManualSize] = useState<ShirtSize>('M');
  const [manualNotes, setManualNotes] = useState('');

  // Código da sessão/campanha
  const [sessionCode] = useState(() => {
    const saved = sessionStorage.getItem('shirt_utility_session_code');
    if (saved) return saved;
    const code = 'CAMISA2026';
    sessionStorage.setItem('shirt_utility_session_code', code);
    return code;
  });

  const studentPageUrl = `${window.location.origin}/camisas/${sessionCode}`;

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [440, 554.37, 659.25]; // A4, C#5, E5
      notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.1);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.1 + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + i * 0.1);
        osc.stop(audioCtx.currentTime + i * 0.1 + 0.3);
      });
    } catch (e) {
      console.warn(e);
    }
  };

  // Carregar pedidos
  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await getShirtOrders();
      setOrders(data);
    } catch (err) {
      console.error('Erro ao buscar pedidos de camisa:', err);
      toast.error('Não foi possível carregar os pedidos.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      await clearAllShirtOrders(sessionCode);
      setOrders([]);
      setIsResetModalOpen(false);
      toast.success('Censo de camisas zerado com sucesso! Todos os registros foram limpos.');
    } catch (err) {
      toast.error('Erro ao zerar o censo.');
    } finally {
      setIsResetting(false);
    }
  };

  useEffect(() => {
    loadOrders();

    // Escuta em tempo real no canal do Supabase
    const channel = supabase.channel(`shirt_channel_${sessionCode}`, {
      config: { broadcast: { ack: false } }
    });

    channel
      .on('broadcast', { event: 'new_shirt_order' }, (event) => {
        const newOrder = event.payload as ShirtOrder;
        if (newOrder) {
          setOrders(prev => {
            const idx = prev.findIndex(o => o.id === newOrder.id || (o.student_name.toLowerCase().trim() === newOrder.student_name.toLowerCase().trim() && o.grade === newOrder.grade));
            if (idx !== -1) {
              const updated = [...prev];
              updated[idx] = newOrder;
              return updated;
            }
            return [newOrder, ...prev];
          });
          playChime();
          toast.success(`👕 Novo pedido registrado: ${newOrder.student_name} (${newOrder.grade} - ${newOrder.size} ${newOrder.model})!`);
        }
      })
      .on('broadcast', { event: 'shirt_reset' }, () => {
        setOrders([]);
        toast.info('O censo de camisas foi zerado pelo professor.');
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionCode]);

  // Lista filtrada
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchSearch = !searchQuery.trim() || 
        o.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.student_registration && o.student_registration.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchGrade = selectedGrade === 'all' || o.grade === selectedGrade;
      const matchModel = selectedModel === 'all' || o.model === selectedModel;
      const matchSize = selectedSize === 'all' || o.size === selectedSize;

      return matchSearch && matchGrade && matchModel && matchSize;
    });
  }, [orders, searchQuery, selectedGrade, selectedModel, selectedSize]);

  // Métricas calculadas sobre a lista atual (ou filtrada)
  const metrics = useMemo(() => {
    const listToCount = selectedGrade === 'all' ? orders : orders.filter(o => o.grade === selectedGrade);
    const total = listToCount.length;
    const masculinoCount = listToCount.filter(o => o.model === 'masculino').length;
    const femininoCount = listToCount.filter(o => o.model === 'feminino').length;

    const sizeCounts: Record<ShirtSize, number> = {
      P: 0,
      M: 0,
      G: 0,
      GG: 0,
      XGG: 0
    };

    listToCount.forEach(o => {
      if (sizeCounts[o.size] !== undefined) {
        sizeCounts[o.size]++;
      }
    });

    const gradeCounts: Record<string, number> = {};
    GRADES.forEach(g => { gradeCounts[g] = 0; });
    orders.forEach(o => {
      gradeCounts[o.grade] = (gradeCounts[o.grade] || 0) + 1;
    });

    return {
      total,
      masculinoCount,
      femininoCount,
      sizeCounts,
      gradeCounts
    };
  }, [orders, selectedGrade]);

  // Ação de Salvar Manual
  const handleSaveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) {
      toast.error('Informe o nome do aluno.');
      return;
    }

    try {
      if (editingOrder) {
        await updateShirtOrder(editingOrder.id, {
          student_name: manualName.trim(),
          grade: manualGrade,
          model: manualModel,
          size: manualSize,
          notes: manualNotes.trim()
        });
        toast.success('Pedido atualizado com sucesso!');
      } else {
        await saveShirtOrder({
          student_name: manualName.trim(),
          grade: manualGrade,
          model: manualModel,
          size: manualSize,
          notes: manualNotes.trim(),
          session_code: sessionCode
        });
        toast.success('Pedido cadastrado com sucesso!');
      }

      await loadOrders();
      setIsManualModalOpen(false);
      setEditingOrder(null);
      setManualName('');
      setManualNotes('');
    } catch (err) {
      toast.error('Erro ao salvar o pedido.');
    }
  };

  const handleOpenEdit = (order: ShirtOrder) => {
    setEditingOrder(order);
    setManualName(order.student_name);
    setManualGrade(order.grade);
    setManualModel(order.model);
    setManualSize(order.size);
    setManualNotes(order.notes || '');
    setIsManualModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Deseja remover o pedido de ${name}?`)) return;
    try {
      await deleteShirtOrder(id);
      setOrders(prev => prev.filter(o => o.id !== id));
      toast.success(`Pedido de ${name} removido.`);
    } catch {
      toast.error('Erro ao remover pedido.');
    }
  };

  // Copiar link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(studentPageUrl);
    setCopiedLink(true);
    toast.success('Link do pedido copiado para a área de transferência!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Copiar Resumo para WhatsApp/Confecção
  const handleCopySummary = () => {
    const gradeLabel = selectedGrade === 'all' ? 'Geral (Todas as Turmas)' : selectedGrade;
    const text = 
`👕 *RESUMO DO PEDIDO DE CAMISAS - CURSO TÉCNICO*
📌 *Turma/Escopo:* ${gradeLabel}
👥 *Total de Pedidos:* ${metrics.total}

*POR MODELO:*
👔 Masculino: ${metrics.masculinoCount}
👚 Feminina: ${metrics.femininoCount}

*POR TAMANHO:*
• P: ${metrics.sizeCounts.P}
• M: ${metrics.sizeCounts.M}
• G: ${metrics.sizeCounts.G}
• GG: ${metrics.sizeCounts.GG}
• XGG: ${metrics.sizeCounts.XGG}

_Gerado pelo Módulo de Utilitários em ${new Date().toLocaleDateString('pt-BR')}_`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    toast.success('Resumo copiado! Pronto para colar no WhatsApp ou enviar à confecção.');
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  // Exportar para CSV
  const handleExportCsv = () => {
    if (filteredOrders.length === 0) {
      toast.error('Nenhum pedido para exportar no filtro atual.');
      return;
    }

    const headers = ['Nome do Aluno', 'Turma', 'Modelo', 'Tamanho', 'Observações', 'Data de Envio'];
    const rows = filteredOrders.map(o => [
      `"${o.student_name.replace(/"/g, '""')}"`,
      `"${o.grade}"`,
      `"${o.model === 'masculino' ? 'Masculino' : 'Feminina'}"`,
      `"${o.size}"`,
      `"${(o.notes || '').replace(/"/g, '""')}"`,
      `"${new Date(o.created_at).toLocaleString('pt-BR')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `pedidos_camisas_${selectedGrade.replace(/\s+/g, '_')}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Planilha CSV exportada com sucesso!');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner do Utilitário */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 dark:from-emerald-950 dark:via-teal-900 dark:to-cyan-950 p-6 rounded-2xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Shirt className="w-64 h-64" />
        </div>

        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <Badge className="bg-white/20 hover:bg-white/30 text-white border-none px-3 py-1 font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Censo Oficial do Curso
            </Badge>
            <span className="flex items-center gap-1.5 text-xs text-emerald-100 bg-emerald-800/60 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Sincronização em Tempo Real
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Censo de Camisas do Curso
          </h2>
          <p className="text-emerald-100/90 text-sm max-w-2xl leading-relaxed">
            Acompanhe os pedidos de camisa dos alunos com tamanhos (P, M, G, GG, XGG), modelos (Masculino/Feminina) e filtre os resultados por turma em tempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          <Button 
            onClick={() => setIsQrModalOpen(true)}
            className="bg-white text-emerald-800 hover:bg-emerald-50 font-semibold shadow-md gap-2"
          >
            <QrCode className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Projetar</span> QR Code Alunos
          </Button>

          <Button 
            onClick={() => {
              setEditingOrder(null);
              setManualName('');
              setManualNotes('');
              setIsManualModalOpen(true);
            }}
            variant="secondary"
            className="bg-emerald-800/80 hover:bg-emerald-800 text-white border border-emerald-400/30 gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Pedido Manual
          </Button>

          <Button 
            onClick={handleCopySummary}
            variant="secondary"
            className="bg-emerald-800/80 hover:bg-emerald-800 text-white border border-emerald-400/30 gap-1.5"
            title="Copiar resumo formatado para o WhatsApp"
          >
            {copiedSummary ? <Check className="w-4 h-4 text-green-300" /> : <Copy className="w-4 h-4" />}
            <span className="hidden md:inline">Resumo WhatsApp</span>
          </Button>

          <Button 
            onClick={handleExportCsv}
            variant="secondary"
            className="bg-emerald-800/80 hover:bg-emerald-800 text-white border border-emerald-400/30 gap-1.5"
            title="Exportar dados para planilha CSV"
          >
            <Download className="w-4 h-4" />
            CSV
          </Button>

          <Button 
            onClick={() => setIsResetModalOpen(true)}
            variant="secondary"
            className="bg-red-500/25 hover:bg-red-500/40 text-red-100 hover:text-white border border-red-400/30 gap-1.5"
            title="Zerar todos os registros do censo de camisas"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden xl:inline">Zerar Censo</span>
          </Button>

          <Button 
            onClick={loadOrders}
            variant="secondary"
            size="icon"
            className="bg-emerald-800/80 hover:bg-emerald-800 text-white border border-emerald-400/30"
            title="Recarregar dados"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Cards de Métricas e Consolidados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Pedidos */}
        <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-card shadow-sm hover:shadow transition-shadow">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total de Camisas {selectedGrade !== 'all' ? `(${selectedGrade})` : ''}
            </CardTitle>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Shirt className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-3xl font-black text-foreground">
              {metrics.total}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              {selectedGrade === 'all' ? (
                <span>Distribuídas entre 1º, 2º e 3º Anos</span>
              ) : (
                <span>Filtrado apenas para {selectedGrade}</span>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Modelo Masculino */}
        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-950/20 dark:to-card shadow-sm hover:shadow transition-shadow">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Modelo Masculino
            </CardTitle>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <span className="text-base font-bold">👔</span>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-black text-foreground">
                {metrics.masculinoCount}
              </div>
              <Badge variant="outline" className="border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 font-bold">
                {metrics.total > 0 ? Math.round((metrics.masculinoCount / metrics.total) * 100) : 0}%
              </Badge>
            </div>
            <div className="w-full bg-blue-100 dark:bg-blue-950/60 h-1.5 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${metrics.total > 0 ? (metrics.masculinoCount / metrics.total) * 100 : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Modelo Feminino */}
        <Card className="border-pink-500/20 bg-gradient-to-br from-pink-50/50 to-white dark:from-pink-950/20 dark:to-card shadow-sm hover:shadow transition-shadow">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Modelo Feminina (Baby Look)
            </CardTitle>
            <div className="p-2 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400">
              <span className="text-base font-bold">👚</span>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-black text-foreground">
                {metrics.femininoCount}
              </div>
              <Badge variant="outline" className="border-pink-500/30 text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/40 font-bold">
                {metrics.total > 0 ? Math.round((metrics.femininoCount / metrics.total) * 100) : 0}%
              </Badge>
            </div>
            <div className="w-full bg-pink-100 dark:bg-pink-950/60 h-1.5 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-pink-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${metrics.total > 0 ? (metrics.femininoCount / metrics.total) * 100 : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Distribuição por Turmas */}
        <Card className="border-amber-500/20 bg-gradient-to-br from-amber-50/50 to-white dark:from-amber-950/20 dark:to-card shadow-sm hover:shadow transition-shadow">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Distribuição por Turmas
            </CardTitle>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Users className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="grid grid-cols-3 gap-2 mt-1">
              {GRADES.map(g => (
                <div 
                  key={g} 
                  onClick={() => setSelectedGrade(selectedGrade === g ? 'all' : g)}
                  className={`cursor-pointer text-center p-1.5 rounded-lg border transition-all ${
                    selectedGrade === g 
                      ? 'bg-amber-500 text-white border-amber-600 shadow-sm' 
                      : 'bg-muted/40 hover:bg-muted border-border/60'
                  }`}
                >
                  <div className="text-[10px] font-medium leading-none opacity-80">{g}</div>
                  <div className="text-base font-black mt-0.5">{metrics.gradeCounts[g] || 0}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Box de Contagem Consolidada por Tamanhos (P, M, G, GG, XGG) */}
      <Card className="border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="p-4 pb-3 bg-muted/20 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                Grade de Tamanhos para Confecção {selectedGrade !== 'all' ? `• ${selectedGrade}` : '• Todas as Turmas'}
              </CardTitle>
              <CardDescription className="text-xs">
                Quantidades exatas para encaminhar à fábrica ou estamparia
              </CardDescription>
            </div>
            <div className="text-xs text-muted-foreground font-medium">
              Total computado: <strong className="text-foreground">{metrics.total} unidades</strong>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-5 gap-2 sm:gap-4">
            {SIZES.map(sz => {
              const count = metrics.sizeCounts[sz] || 0;
              const percent = metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0;
              const isSelected = selectedSize === sz;

              return (
                <div 
                  key={sz}
                  onClick={() => setSelectedSize(isSelected ? 'all' : sz)}
                  className={`cursor-pointer p-3 sm:p-4 rounded-xl border text-center transition-all ${
                    isSelected 
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md transform -translate-y-0.5' 
                      : 'bg-card hover:bg-muted/40 border-border/80 hover:border-emerald-500/40'
                  }`}
                >
                  <div className={`text-xl sm:text-2xl font-black ${isSelected ? 'text-white' : 'text-foreground'}`}>
                    {sz}
                  </div>
                  <div className={`text-2xl sm:text-3xl font-extrabold my-1 ${isSelected ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {count}
                  </div>
                  <div className={`text-[11px] font-medium ${isSelected ? 'text-emerald-100' : 'text-muted-foreground'}`}>
                    {percent}% da grade
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Barra de Filtros e Busca */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Campo de Busca */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nome do aluno ou matrícula..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-10"
              />
            </div>

            {/* Filtros em Abas / Seletores */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Filtro de Turma (Requisito Principal) */}
              <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-lg border border-border/60">
                <span className="text-xs font-semibold text-muted-foreground px-2 flex items-center gap-1">
                  <Filter className="w-3 h-3 text-emerald-600" />
                  Turma:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedGrade('all')}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                    selectedGrade === 'all' 
                      ? 'bg-white dark:bg-card text-emerald-700 dark:text-emerald-400 shadow-sm font-bold' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Todas
                </button>
                {GRADES.map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setSelectedGrade(g)}
                    className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                      selectedGrade === g 
                        ? 'bg-white dark:bg-card text-emerald-700 dark:text-emerald-400 shadow-sm font-bold' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>

              {/* Filtro de Modelo */}
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-[140px] h-10 text-xs">
                  <SelectValue placeholder="Modelo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Modelos</SelectItem>
                  <SelectItem value="masculino">👔 Masculino</SelectItem>
                  <SelectItem value="feminino">👚 Feminina</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtro de Tamanho */}
              <Select value={selectedSize} onValueChange={setSelectedSize}>
                <SelectTrigger className="w-[125px] h-10 text-xs">
                  <SelectValue placeholder="Tamanho" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Tamanhos</SelectItem>
                  {SIZES.map(s => (
                    <SelectItem key={s} value={s}>Tamanho {s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(selectedGrade !== 'all' || selectedModel !== 'all' || selectedSize !== 'all' || searchQuery) && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setSelectedGrade('all');
                    setSelectedModel('all');
                    setSelectedSize('all');
                    setSearchQuery('');
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground h-10 px-2"
                >
                  Limpar Filtros
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Pedidos */}
      <Card className="border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="p-4 border-b border-border/40 bg-muted/10 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              Lista de Alunos ({filteredOrders.length} {filteredOrders.length === 1 ? 'pedido' : 'pedidos'})
            </CardTitle>
            <CardDescription className="text-xs">
              Alunos que já responderam o censo de camisas
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
              <span>Carregando pedidos de camisa...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-14 text-center px-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                <Shirt className="w-7 h-7" />
              </div>
              <h3 className="font-semibold text-base text-foreground">Nenhum pedido encontrado</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {orders.length === 0 
                  ? 'Nenhum aluno registrou o tamanho de camisa ainda. Compartilhe o link ou QR Code com a turma!'
                  : 'Nenhum pedido corresponde aos filtros ou busca selecionados.'}
              </p>
              {orders.length === 0 && (
                <Button 
                  onClick={() => setIsQrModalOpen(true)}
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-2"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  Abrir QR Code para Alunos
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-border/40">
                  <tr>
                    <th scope="col" className="px-4 py-3">Aluno</th>
                    <th scope="col" className="px-4 py-3">Turma / Série</th>
                    <th scope="col" className="px-4 py-3">Modelo</th>
                    <th scope="col" className="px-4 py-3 text-center">Tamanho</th>
                    <th scope="col" className="px-4 py-3">Observação</th>
                    <th scope="col" className="px-4 py-3">Data / Hora</th>
                    <th scope="col" className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredOrders.map((order) => {
                    const initials = order.student_name
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map(p => p[0])
                      .join('')
                      .toUpperCase();

                    return (
                      <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-medium">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-300/40">
                              {initials}
                            </div>
                            <div>
                              <div className="font-semibold text-foreground">{order.student_name}</div>
                              {order.student_registration && (
                                <div className="text-[11px] text-muted-foreground">Matrícula: {order.student_registration}</div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <Badge 
                            variant="outline" 
                            className={`font-semibold text-xs ${
                              order.grade === '1º Ano' 
                                ? 'border-sky-500/40 text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/30' 
                                : order.grade === '2º Ano'
                                ? 'border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30'
                                : 'border-purple-500/40 text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30'
                            }`}
                          >
                            {order.grade}
                          </Badge>
                        </td>

                        <td className="px-4 py-3">
                          {order.model === 'masculino' ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-2 py-1 rounded-md border border-blue-200 dark:border-blue-900/50">
                              👔 Masculino
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-pink-700 dark:text-pink-300 bg-pink-50 dark:bg-pink-950/40 px-2 py-1 rounded-md border border-pink-200 dark:border-pink-900/50">
                              👚 Feminina
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span className="inline-block px-3 py-1 bg-emerald-600 text-white font-extrabold text-sm rounded-lg shadow-sm min-w-[36px]">
                            {order.size}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-xs text-muted-foreground max-w-[180px] truncate">
                          {order.notes || <span className="text-muted-foreground/50 italic">—</span>}
                        </td>

                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(order.created_at).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>

                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => handleOpenEdit(order)}
                              title="Editar pedido"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                              onClick={() => handleDelete(order.id, order.student_name)}
                              title="Remover pedido"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Projeção Datashow e QR Code */}
      <Dialog open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
        <DialogContent className="max-w-md sm:max-w-lg text-center p-6 bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center justify-center gap-2">
              <Shirt className="w-6 h-6 text-emerald-600" />
              Pedido da Camisa do Curso
            </DialogTitle>
            <DialogDescription className="text-sm">
              Alunos: aponte a câmera do celular para o QR Code abaixo para escolher o tamanho e modelo da sua camisa.
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 flex flex-col items-center justify-center bg-white dark:bg-white p-6 rounded-2xl border-4 border-emerald-500/20 shadow-inner">
            <QRCodeSVG 
              value={studentPageUrl}
              size={220}
              level="H"
              includeMargin={true}
            />
          </div>

          <div className="space-y-3">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Link de Acesso Rápido
            </div>
            <div className="flex items-center gap-2 bg-muted/60 p-2 rounded-lg border">
              <input 
                type="text" 
                readOnly 
                value={studentPageUrl}
                className="bg-transparent text-xs font-mono flex-1 outline-none text-foreground select-all px-1"
              />
              <Button 
                size="sm" 
                variant="secondary"
                onClick={handleCopyLink}
                className="h-8 text-xs gap-1 shrink-0"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedLink ? 'Copiado' : 'Copiar'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(studentPageUrl, '_blank')}
                className="h-8 text-xs px-2 shrink-0"
                title="Abrir página em nova aba"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 text-left space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Instruções para a Turma:
              </div>
              <p>1. Informar nome completo e selecionar sua turma.</p>
              <p>2. Escolher o modelo (Masculino ou Feminina).</p>
              <p>3. Selecionar o tamanho (P, M, G, GG ou XGG).</p>
              <p>4. Os resultados atualizam instantaneamente nesta tela!</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Cadastro / Edição Manual */}
      <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Shirt className="w-5 h-5 text-emerald-600" />
              {editingOrder ? 'Editar Pedido de Camisa' : 'Novo Pedido Manual'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {editingOrder 
                ? 'Altere os dados da camisa do aluno' 
                : 'Cadastre o tamanho e modelo diretamente pelo painel'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveManual} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Nome do Aluno *</label>
              <Input 
                placeholder="Ex: Gabriel Santos Silva" 
                value={manualName} 
                onChange={e => setManualName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Turma / Série *</label>
                <Select value={manualGrade} onValueChange={setManualGrade}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADES.map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Modelo *</label>
                <Select value={manualModel} onValueChange={(val: any) => setManualModel(val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">👔 Masculino</SelectItem>
                    <SelectItem value="feminino">👚 Feminina</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Tamanho da Camisa *</label>
              <div className="grid grid-cols-5 gap-2">
                {SIZES.map(sz => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setManualSize(sz)}
                    className={`py-2 text-sm font-black rounded-lg border transition-all ${
                      manualSize === sz
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-muted/40 hover:bg-muted border-border/80 text-foreground'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Observação (Opcional)</label>
              <Input 
                placeholder="Ex: Nome na estampa ou ajuste de barra" 
                value={manualNotes} 
                onChange={e => setManualNotes(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsManualModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                {editingOrder ? 'Salvar Alterações' : 'Cadastrar Pedido'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação para Zerar Censo */}
      <Dialog open={isResetModalOpen} onOpenChange={setIsResetModalOpen}>
        <DialogContent className="max-w-md p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-2">
            <Trash2 className="w-6 h-6" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">
              Zerar Todos os Pedidos?
            </DialogTitle>
            <DialogDescription className="text-xs text-center text-muted-foreground">
              Esta ação removerá todos os pedidos de camisa cadastrados atualmente e iniciará uma contagem totalmente limpa (do zero). Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-center gap-3 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsResetModalOpen(false)}
              disabled={isResetting}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmReset}
              disabled={isResetting}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold gap-1.5"
            >
              <RotateCcw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
              {isResetting ? 'Zerando...' : 'Sim, Zerar Tudo'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
