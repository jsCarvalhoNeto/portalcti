import React, { useEffect, useRef } from 'react';

interface LaserPointerOverlayProps {
  isActive: boolean;
  color?: string; // Cor principal do laser (default: '#ef4444')
}

interface TrailPoint {
  x: number;
  y: number;
  time: number;
}

interface LaserPulse {
  x: number;
  y: number;
  startTime: number;
}

export default function LaserPointerOverlay({
  isActive,
  color = '#ef4444'
}: LaserPointerOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointsRef = useRef<TrailPoint[]>([]);
  const pulsesRef = useRef<LaserPulse[]>([]);
  const currentPosRef = useRef<{ x: number; y: number; isInside: boolean }>({
    x: -100,
    y: -100,
    isInside: false
  });
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      pointsRef.current = [];
      pulsesRef.current = [];
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Ajusta o tamanho do canvas para a resolução da viewport
    const handleResize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      currentPosRef.current = { x: e.clientX, y: e.clientY, isInside: true };
      pointsRef.current.push({ x: e.clientX, y: e.clientY, time: now });
    };

    const handleMouseDown = (e: MouseEvent) => {
      // Ao clicar com o mouse, cria um pulso / anel luminoso no ponto apontado
      pulsesRef.current.push({
        x: e.clientX,
        y: e.clientY,
        startTime: performance.now()
      });
    };

    const handleMouseLeave = () => {
      currentPosRef.current.isInside = false;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);

    // Loop de renderização com rastro luminoso
    const TRAIL_DURATION = 420; // Duração do rastro em milissegundos
    const PULSE_DURATION = 500; // Duração do pulso de clique em ms

    const render = () => {
      const now = performance.now();

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Remove pontos antigos do rastro
      pointsRef.current = pointsRef.current.filter((p) => now - p.time <= TRAIL_DURATION);
      // Remove pulsos concluídos
      pulsesRef.current = pulsesRef.current.filter((p) => now - p.startTime <= PULSE_DURATION);

      const points = pointsRef.current;

      // 1. Desenha o rastro do laser com gradiente e fade out
      if (points.length > 1) {
        for (let i = 0; i < points.length - 1; i++) {
          const p1 = points[i];
          const p2 = points[i + 1];
          const age = now - p2.time;
          const life = Math.max(0, 1 - age / TRAIL_DURATION); // 1 = novo, 0 = expirado

          // Espessura decrescente em direção ao passado
          const lineWidth = Math.max(1.5, life * 5.5);

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);

          ctx.strokeStyle = `rgba(255, 30, 60, ${life * 0.85})`;
          ctx.lineWidth = lineWidth;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          ctx.shadowColor = 'rgba(255, 20, 60, 0.9)';
          ctx.shadowBlur = 12 * life;
          ctx.stroke();

          // Linha central mais fina e branca para efeito incandescente
          if (life > 0.3) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(255, 220, 230, ${life * 0.7})`;
            ctx.lineWidth = Math.max(1, lineWidth * 0.4);
            ctx.stroke();
          }
        }
      }

      // 2. Desenha os pulsos ao clicar (ondas concêntricas de destaque)
      pulsesRef.current.forEach((pulse) => {
        const elapsed = now - pulse.startTime;
        const progress = elapsed / PULSE_DURATION; // 0 a 1
        const radius = 6 + progress * 32;
        const alpha = (1 - progress) * 0.9;

        ctx.save();
        ctx.beginPath();
        ctx.arc(pulse.x, pulse.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 30, 60, ${alpha})`;
        ctx.lineWidth = 2.5 * (1 - progress);
        ctx.shadowColor = 'rgba(255, 0, 50, 0.9)';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.restore();
      });

      // 3. Desenha o ponto do laser atual na ponta do mouse
      const { x, y, isInside } = currentPosRef.current;
      if (isInside && x > 0 && y > 0) {
        ctx.save();

        // Halo difuso externo (brilho difuso da lente laser)
        const outerGrad = ctx.createRadialGradient(x, y, 1, x, y, 22);
        outerGrad.addColorStop(0, 'rgba(255, 30, 60, 0.75)');
        outerGrad.addColorStop(0.3, 'rgba(255, 20, 60, 0.4)');
        outerGrad.addColorStop(0.7, 'rgba(255, 0, 40, 0.15)');
        outerGrad.addColorStop(1, 'rgba(255, 0, 40, 0)');

        ctx.beginPath();
        ctx.arc(x, y, 22, 0, Math.PI * 2);
        ctx.fillStyle = outerGrad;
        ctx.fill();

        // Ponto laser intermediário vibrante
        ctx.beginPath();
        ctx.arc(x, y, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ff003c';
        ctx.shadowColor = 'rgba(255, 0, 50, 1)';
        ctx.shadowBlur = 16;
        ctx.fill();

        // Miolo branco incandescente de alta energia
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 4;
        ctx.fill();

        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseleave', handleMouseLeave);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isActive, color]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[130] w-screen h-screen"
      style={{ touchAction: 'none' }}
    />
  );
}
