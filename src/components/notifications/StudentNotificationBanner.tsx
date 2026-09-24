import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Clock, X, ChevronLeft, ChevronRight, ExternalLink, Bell, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NotificationItem, dismissNotification } from '@/services/notificationService';

interface StudentNotificationBannerProps {
  notifications: NotificationItem[];
  studentId?: string;
  onNotificationDismissed?: (id: string) => void;
}

const GRADIENT_MAP: Record<string, { bg: string; textSub: string; btnText: string; btnHover: string }> = {
  emerald: {
    bg: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 dark:from-emerald-950 dark:via-teal-900 dark:to-cyan-950 border-emerald-500/20',
    textSub: 'text-emerald-100',
    btnText: 'text-emerald-800',
    btnHover: 'hover:bg-emerald-50'
  },
  teal: {
    bg: 'bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-700 dark:from-teal-950 dark:via-cyan-900 dark:to-blue-950 border-teal-500/20',
    textSub: 'text-teal-100',
    btnText: 'text-teal-800',
    btnHover: 'hover:bg-teal-50'
  },
  blue: {
    bg: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 dark:from-blue-950 dark:via-indigo-900 dark:to-violet-950 border-blue-500/20',
    textSub: 'text-blue-100',
    btnText: 'text-blue-800',
    btnHover: 'hover:bg-blue-50'
  },
  purple: {
    bg: 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-700 dark:from-purple-950 dark:via-fuchsia-900 dark:to-pink-950 border-purple-500/20',
    textSub: 'text-purple-100',
    btnText: 'text-purple-800',
    btnHover: 'hover:bg-purple-50'
  },
  amber: {
    bg: 'bg-gradient-to-r from-amber-600 via-orange-600 to-red-700 dark:from-amber-950 dark:via-orange-900 dark:to-red-950 border-amber-500/20',
    textSub: 'text-amber-100',
    btnText: 'text-amber-800',
    btnHover: 'hover:bg-amber-50'
  },
  rose: {
    bg: 'bg-gradient-to-r from-rose-600 via-pink-600 to-red-700 dark:from-rose-950 dark:via-pink-900 dark:to-red-950 border-rose-500/20',
    textSub: 'text-rose-100',
    btnText: 'text-rose-800',
    btnHover: 'hover:bg-rose-50'
  }
};

export default function StudentNotificationBanner({
  notifications,
  studentId,
  onNotificationDismissed
}: StudentNotificationBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!notifications || notifications.length === 0) {
    return null;
  }

  // Garantir índice dentro do tamanho da lista
  const activeIndex = currentIndex >= notifications.length ? 0 : currentIndex;
  const currentNotif = notifications[activeIndex];

  const styleConfig = GRADIENT_MAP[currentNotif.banner_style] || GRADIENT_MAP.emerald;

  // Formatação de data limite
  const formatExpiration = (dateStr: string) => {
    try {
      const expDate = new Date(dateStr);
      const now = new Date();
      const diffHours = Math.round((expDate.getTime() - now.getTime()) / (1000 * 60 * 60));
      
      const formatted = expDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });

      if (diffHours > 0 && diffHours <= 24) {
        return `Restam aprox. ${diffHours}h (até ${formatted})`;
      }
      return `Até ${formatted}`;
    } catch {
      return dateStr;
    }
  };

  const handleDismiss = async () => {
    await dismissNotification(currentNotif.id, studentId);
    if (onNotificationDismissed) {
      onNotificationDismissed(currentNotif.id);
    }
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % notifications.length);
  };

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + notifications.length) % notifications.length);
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl p-4 sm:p-6 text-white shadow-lg border transition-all duration-300 ${styleConfig.bg}`}>
      {/* Botão de Fechar / Dispensar no canto superior */}
      <button
        onClick={handleDismiss}
        title="Dispensar este aviso"
        className="absolute top-3 right-3 z-20 p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-colors focus:outline-none"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10 pr-6 sm:pr-0">
        <div className="space-y-1.5 flex-1">
          {/* Header de Metadados: Badge, Emissor/Disciplina e Tempo Limite */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-white/20 hover:bg-white/30 text-white border-none text-[11px] font-semibold py-0.5">
              <Sparkles className="w-3 h-3 text-amber-300 mr-1" />
              {currentNotif.badge_text || 'Aviso Oficial'}
            </Badge>

            {currentNotif.subject_name && (
              <span className={`text-xs ${styleConfig.textSub} font-medium`}>
                {currentNotif.subject_name}
              </span>
            )}

            {currentNotif.sender_name && !currentNotif.subject_name && (
              <span className={`text-xs ${styleConfig.textSub} font-medium`}>
                {currentNotif.sender_name}
              </span>
            )}

            {currentNotif.expires_at && (
              <span className="text-[11px] bg-black/25 px-2 py-0.5 rounded-full text-white/95 flex items-center gap-1 font-semibold">
                <Clock className="w-3 h-3 text-amber-300 shrink-0" />
                {formatExpiration(currentNotif.expires_at)}
              </span>
            )}
          </div>

          {/* Título */}
          <h2 className="text-lg sm:text-xl font-black tracking-tight leading-snug">
            {currentNotif.title}
          </h2>

          {/* Mensagem descritiva */}
          <p className={`text-xs ${styleConfig.textSub}/95 max-w-2xl leading-relaxed whitespace-pre-line`}>
            {currentNotif.message}
          </p>
        </div>

        {/* Botão de Ação à Direita */}
        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-end mt-2 sm:mt-0">
          {/* Navegação entre múltiplos avisos */}
          {notifications.length > 1 && (
            <div className="flex items-center gap-1.5 bg-black/20 rounded-lg p-1">
              <button
                onClick={handlePrev}
                className="p-1 rounded hover:bg-white/20 text-white/90 hover:text-white transition-colors"
                title="Aviso anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-semibold px-1">
                {activeIndex + 1}/{notifications.length}
              </span>
              <button
                onClick={handleNext}
                className="p-1 rounded hover:bg-white/20 text-white/90 hover:text-white transition-colors"
                title="Próximo aviso"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {currentNotif.action_url && currentNotif.action_label && (
            <Button
              asChild
              className={`bg-white ${styleConfig.btnHover} ${styleConfig.btnText} font-bold shrink-0 shadow-md gap-2`}
            >
              <Link to={currentNotif.action_url}>
                <ExternalLink className="w-4 h-4" />
                {currentNotif.action_label}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
