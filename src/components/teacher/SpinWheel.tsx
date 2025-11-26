import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Plus, Trash2, RotateCw, MousePointer2 } from 'lucide-react';

interface Theme {
    id: string;
    name: string;
    color: string;
}

const DEFAULT_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
    '#E63946', '#A8DADC', '#457B9D', '#F1FAEE', '#E76F51'
];

export default function SpinWheel() {
    const [themes, setThemes] = useState<Theme[]>([]);
    const [newTheme, setNewTheme] = useState('');
    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [lastAngle, setLastAngle] = useState(0);
    const [velocityHistory, setVelocityHistory] = useState<number[]>([]);

    const wheelRef = useRef<SVGSVGElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const animationRef = useRef<number>();
    const lastTimeRef = useRef<number>(0);

    const addTheme = () => {
        if (newTheme.trim() && themes.length < 15) {
            const theme: Theme = {
                id: Date.now().toString(),
                name: newTheme.trim(),
                color: DEFAULT_COLORS[themes.length % DEFAULT_COLORS.length]
            };
            setThemes([...themes, theme]);
            setNewTheme('');
        }
    };

    const removeTheme = (id: string) => {
        setThemes(themes.filter(t => t.id !== id));
    };

    const calculateAngle = (e: MouseEvent | React.MouseEvent) => {
        if (!wheelRef.current) return 0;
        const rect = wheelRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        return angle * (180 / Math.PI);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (isSpinning || themes.length < 2) return;
        setIsDragging(true);
        setLastAngle(calculateAngle(e));
        setVelocityHistory([]);
        lastTimeRef.current = Date.now();
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;

        const currentAngle = calculateAngle(e);
        const currentTime = Date.now();
        const deltaTime = currentTime - lastTimeRef.current;

        let delta = currentAngle - lastAngle;

        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;

        const angularVelocity = deltaTime > 0 ? delta / deltaTime : 0;

        setRotation(prev => prev + delta);

        setVelocityHistory(prev => {
            const newHistory = [...prev, angularVelocity];
            return newHistory.slice(-5);
        });

        setLastAngle(currentAngle);
        lastTimeRef.current = currentTime;
    };

    const handleMouseUp = () => {
        if (!isDragging) return;
        setIsDragging(false);

        if (velocityHistory.length > 0) {
            const avgVelocity = velocityHistory.reduce((a, b) => a + b, 0) / velocityHistory.length;
            const velocityPerFrame = avgVelocity * 16.67;

            if (Math.abs(velocityPerFrame) > 0.5) {
                startSpinWithVelocity(velocityPerFrame);
            }
        }

        setVelocityHistory([]);
    };

    const playSpinSound = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(error => {
                console.log('Erro ao tocar áudio:', error);
            });
        }
    };

    const stopSpinSound = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    };

    const startSpinWithVelocity = (initialVelocity: number) => {
        setIsSpinning(true);
        playSpinSound();

        let currentVelocity = initialVelocity * 15;
        let currentRotation = rotation;

        const animate = () => {
            currentRotation += currentVelocity;
            currentVelocity *= 0.97;

            setRotation(currentRotation);

            if (Math.abs(currentVelocity) > 0.3) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                stopSpinSound();
                finishSpin(currentRotation);
            }
        };

        animate();
    };

    const spinWheel = () => {
        if (isSpinning || themes.length < 2) return;

        setIsSpinning(true);
        setShowResult(false);
        setSelectedTheme(null);
        playSpinSound();

        const extraSpins = 12 + Math.random() * 8;
        const randomAngle = Math.random() * 360;
        const totalRotation = rotation + (extraSpins * 360) + randomAngle;

        const duration = 10000;
        const startTime = Date.now();
        const startRotation = rotation;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const easeOut = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            const currentRotation = startRotation + (totalRotation - startRotation) * easeOut;

            setRotation(currentRotation);

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                stopSpinSound();
                finishSpin(totalRotation);
            }
        };

        animate();
    };

    const finishSpin = (finalRotation: number) => {
        setIsSpinning(false);

        // Normalizar a rotação para [0, 360)
        let normalizedRotation = finalRotation % 360;
        if (normalizedRotation < 0) normalizedRotation += 360;

        // Calcular o ângulo de cada segmento
        const segmentAngle = 360 / themes.length;

        // O ponteiro está fixo no topo (12 horas / -90 graus).
        // Os segmentos começam a ser desenhados do -90 graus (índice 0).
        // Quando a roleta gira X graus no sentido horário, o "início" da roleta se move X graus.
        // Para encontrar qual segmento está sob o ponteiro (que ficou parado), 
        // precisamos calcular a posição relativa inversa.
        // Se a roleta girou 10 graus, o índice 0 moveu-se para a direita.
        // O ponteiro agora está sobre o final da roleta (350 graus relativos).
        const effectiveAngle = (360 - normalizedRotation) % 360;

        // Calcular o índice
        const segmentIndex = Math.floor(effectiveAngle / segmentAngle);

        // Garantir limites seguros
        const safeIndex = Math.min(Math.max(segmentIndex, 0), themes.length - 1);
        const winner = themes[safeIndex];

        console.log('Debug Sorteio:', {
            finalRotation,
            normalizedRotation,
            effectiveAngle,
            segmentAngle,
            segmentIndex,
            safeIndex,
            winner: winner?.name,
            totalThemes: themes.length
        });

        setSelectedTheme(winner);
        setShowResult(true);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, lastAngle, velocityHistory]);

    useEffect(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    return (
        <div className="space-y-6">
            <audio ref={audioRef} src="/spin.mp3" preload="auto" />

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-yellow-500" />
                        Temas da Roleta
                    </CardTitle>
                    <CardDescription>
                        Adicione os temas que estarão disponíveis na roleta (mínimo 2, máximo 15)
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Digite um tema..."
                            value={newTheme}
                            onChange={(e) => setNewTheme(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addTheme()}
                            disabled={themes.length >= 15}
                        />
                        <Button
                            onClick={addTheme}
                            disabled={!newTheme.trim() || themes.length >= 15}
                            className="gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Adicionar
                        </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {themes.map((theme) => (
                            <Badge
                                key={theme.id}
                                style={{ backgroundColor: theme.color }}
                                className="text-white px-3 py-2 text-sm flex items-center gap-2"
                            >
                                {theme.name}
                                <button
                                    onClick={() => removeTheme(theme.id)}
                                    className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>

                    {themes.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Nenhum tema adicionado ainda. Adicione pelo menos 2 temas para começar.
                        </p>
                    )}
                </CardContent>
            </Card>

            {themes.length >= 2 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <RotateCw className="w-5 h-5 text-blue-500" />
                            Roleta de Temas
                        </CardTitle>
                        <CardDescription>
                            Clique no botão "Girar" ou arraste a roleta com o mouse
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center gap-6">
                            <div className="relative w-full max-w-md">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                                    <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[30px] border-t-red-500 drop-shadow-lg" />
                                </div>

                                <div className="relative aspect-square w-full max-w-md mx-auto">
                                    <svg
                                        ref={wheelRef}
                                        viewBox="0 0 400 400"
                                        className={`w-full h-full drop-shadow-2xl ${isDragging ? 'cursor-grabbing' : 'cursor-grab'
                                            } ${isSpinning ? 'pointer-events-none' : ''}`}
                                        style={{
                                            transform: `rotate(${rotation}deg)`,
                                            transition: isDragging || isSpinning ? 'none' : 'transform 0.1s ease-out'
                                        }}
                                        onMouseDown={handleMouseDown}
                                    >
                                        {themes.map((theme, index) => {
                                            const segmentAngle = 360 / themes.length;
                                            const startAngle = index * segmentAngle - 90;
                                            const endAngle = startAngle + segmentAngle;

                                            const startRad = (startAngle * Math.PI) / 180;
                                            const endRad = (endAngle * Math.PI) / 180;

                                            const radius = 200;
                                            const centerX = 200;
                                            const centerY = 200;

                                            const x1 = centerX + radius * Math.cos(startRad);
                                            const y1 = centerY + radius * Math.sin(startRad);
                                            const x2 = centerX + radius * Math.cos(endRad);
                                            const y2 = centerY + radius * Math.sin(endRad);

                                            const largeArcFlag = segmentAngle > 180 ? 1 : 0;
                                            const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                                            const textAngle = startAngle + segmentAngle / 2;
                                            const textRad = (textAngle * Math.PI) / 180;
                                            const textRadius = radius * 0.65;
                                            const textX = centerX + textRadius * Math.cos(textRad);
                                            const textY = centerY + textRadius * Math.sin(textRad);

                                            return (
                                                <g key={theme.id}>
                                                    <path
                                                        d={pathData}
                                                        fill={theme.color}
                                                        stroke="white"
                                                        strokeWidth="2"
                                                    />
                                                    <text
                                                        x={textX}
                                                        y={textY}
                                                        fill="white"
                                                        fontSize="16"
                                                        fontWeight="bold"
                                                        textAnchor="middle"
                                                        dominantBaseline="middle"
                                                        transform={`rotate(${textAngle + 90}, ${textX}, ${textY})`}
                                                        style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
                                                    >
                                                        {theme.name}
                                                    </text>
                                                </g>
                                            );
                                        })}

                                        <circle cx="200" cy="200" r="40" fill="white" stroke="#e5e7eb" strokeWidth="4" />
                                        <circle cx="200" cy="200" r="20" fill="#eab308" opacity="0.3" />
                                        <text x="200" y="200" fontSize="24" textAnchor="middle" dominantBaseline="middle">✨</text>
                                    </svg>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <Button
                                    onClick={spinWheel}
                                    disabled={isSpinning || themes.length < 2}
                                    size="lg"
                                    className="gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                                >
                                    <RotateCw className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
                                    {isSpinning ? 'Girando...' : 'Girar Roleta'}
                                </Button>

                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <MousePointer2 className="w-4 h-4" />
                                    <span>ou arraste a roleta</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {showResult && selectedTheme && (
                <Card className="border-4 animate-in fade-in zoom-in duration-500" style={{ borderColor: selectedTheme.color }}>
                    <CardHeader className="text-center">
                        <div className="flex justify-center mb-4">
                            <div
                                className="w-24 h-24 rounded-full flex items-center justify-center shadow-2xl animate-bounce"
                                style={{ backgroundColor: selectedTheme.color }}
                            >
                                <Sparkles className="w-12 h-12 text-white" />
                            </div>
                        </div>
                        <CardTitle className="text-3xl font-bold">🎉 Tema Sorteado! 🎉</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <div
                            className="inline-block px-8 py-4 rounded-lg text-white text-2xl font-bold shadow-xl"
                            style={{ backgroundColor: selectedTheme.color }}
                        >
                            {selectedTheme.name}
                        </div>
                        <p className="text-muted-foreground">
                            Parabéns! Este é o tema escolhido pela roleta.
                        </p>
                        <Button
                            onClick={() => {
                                setShowResult(false);
                                setSelectedTheme(null);
                            }}
                            variant="outline"
                            className="mt-4"
                        >
                            Fechar
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
