'use client';
import React, { useState, useRef, useEffect } from 'react';
import { getSpinResult, SpinResult } from '../../services/wheel';

interface ScratchCardProps {
    user: any;
    hasPendingPrize: boolean;
    onScratchComplete: (result: SpinResult) => void;
    onClose: () => void;
    onNavigateToMenu?: () => void;
}

export default function ScratchCard({ user, hasPendingPrize, onScratchComplete, onClose, onNavigateToMenu }: ScratchCardProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [scratchNumber, setScratchNumber] = useState(1);
    const [scratchPercent, setScratchPercent] = useState(0);
    const [result, setResult] = useState<SpinResult | null>(null);
    const [showResult, setShowResult] = useState(false);

    // ✅ FIX: Resetar canvas quando scratchNumber muda
    useEffect(() => {
        console.log('🎴 [ScratchCard] Inicializando canvas para raspadinha', scratchNumber);
        setScratchPercent(0);
        setShowResult(false);
        setResult(null);
        initCanvas();
    }, [scratchNumber]);

    const initCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // ✅ FIX: Limpar canvas completamente antes de redesenhar
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Desenhar fundo "prateado" da raspadinha
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#CCCCCC');
        gradient.addColorStop(0.5, '#FFFFFF');
        gradient.addColorStop(1, '#999999');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Adicionar textura de "raspável"
        ctx.fillStyle = 'rgba(119, 119, 119, 0.3)';
        ctx.font = '20px Arial';
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            ctx.fillText('✨', x, y);
        }

        // Texto instrucional
        ctx.fillStyle = '#555555';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('RASPE AQUI!', canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '16px Arial';
        ctx.fillStyle = '#777777';
        ctx.fillText('🖱️ Toque e arraste', canvas.width / 2, canvas.height / 2 + 20);
    };

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };

    const handleScratch = (e: React.MouseEvent | React.TouchEvent) => {
        if (showResult) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { x, y } = getCoordinates(e);

        // Raspar área circular
        const radius = 30;
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Calcular percentual raspado
        calculateScratchedPercentage(ctx);
    };

    const calculateScratchedPercentage = (ctx: CanvasRenderingContext2D) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        let transparentPixels = 0;
        const totalPixels = pixels.length / 4;

        for (let i = 0; i < pixels.length; i += 4) {
            if (pixels[i + 3] === 0) {
                transparentPixels++;
            }
        }

        const percent = (transparentPixels / totalPixels) * 100;
        setScratchPercent(percent);

        // Revelar aos 60%
        if (percent >= 60 && !showResult) {
            revealResult();
        }
    };

    const revealResult = () => {
        const spinResult = getSpinResult(user.id || user.phone, scratchNumber, hasPendingPrize);
        setResult(spinResult);
        setShowResult(true);
        onScratchComplete(spinResult);
    };

    const autoScratch = () => {
        const canvas = canvasRef.current;
        if (!canvas || showResult) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Limpar canvas completamente
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setScratchPercent(100);

        // Revelar resultado
        revealResult();
    };

    const handleContinue = () => {
        if (scratchNumber < 3) {
            // Próxima raspadinha
            setScratchNumber(prev => prev + 1);
        } else {
            // Terminou as 3 chances
            onClose();
        }
    };

    const getScratchTitle = () => {
        switch (scratchNumber) {
            case 1: return '🎴 Primeira Raspadinha';
            case 2: return '✨ Segunda Raspadinha';
            case 3: return '🌟 Terceira Raspadinha';
            default: return '🎴 Raspadinha Mágica';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay de fundo */}
            <div
                className="fixed inset-0 bg-black/60"
                onClick={onClose}
            />

            {/* Modal responsivo - TAMANHO FIXADO PARA MOBILE */}
            <div className="relative z-10 w-full max-w-sm mx-auto">
                {/* Cabeçalho */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-t-2xl p-4">
                    <h2 className="text-xl font-bold text-white text-center">
                        {getScratchTitle()}
                    </h2>
                    <p className="text-white/80 text-sm text-center mt-1">
                        {scratchNumber}/3 - Raspe para descobrir!
                    </p>
                </div>

                {/* Área da raspadinha - TAMANHO FIXO PARA MOBILE */}
                <div className="bg-white p-4 rounded-b-2xl">
                    <div className="relative mx-auto"
                        style={{
                            width: '280px',
                            height: '280px'
                        }}>

                        {/* Canvas da raspadinha */}
                        {!showResult && (
                            <canvas
                                ref={canvasRef}
                                width={280}
                                height={280}
                                className="absolute inset-0 w-full h-full rounded-xl border-4 border-yellow-400 shadow-lg"
                                onMouseDown={handleScratch}
                                onMouseMove={(e) => e.buttons === 1 && handleScratch(e)}
                                onTouchStart={handleScratch}
                                onTouchMove={handleScratch}
                                style={{
                                    touchAction: 'none',
                                    cursor: 'pointer'
                                }}
                            />
                        )}

                        {/* Área Revelada (Resultado) */}
                        {showResult && result && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-white to-yellow-50 rounded-xl border-4 border-yellow-400 p-4 animate-in zoom-in duration-500">
                                {result.prize ? (
                                    // ✅ PRÊMIO GANHO
                                    <>
                                        <div className="text-6xl mb-3 animate-bounce">
                                            {result.prize.emoji}
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-800 mb-1 text-center">
                                            {result.prize.name}
                                        </h3>
                                        <p className="text-gray-600 text-center text-xs">
                                            {result.prize.description}
                                        </p>

                                        {/* Confetti */}
                                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                            {[...Array(10)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="absolute text-xl animate-ping"
                                                    style={{
                                                        left: `${Math.random() * 100}%`,
                                                        top: `${Math.random() * 100}%`,
                                                        animationDelay: `${Math.random() * 2}s`,
                                                        animationDuration: `${1 + Math.random()}s`
                                                    }}
                                                >
                                                    🎉
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    // ❌ GIRO VAZIO
                                    <>
                                        <div className="text-6xl mb-3">
                                            {scratchNumber === 1 ? '🎯' : scratchNumber === 2 ? '✨' : '🌟'}
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-600 mb-1 text-center">
                                            {result.message}
                                        </h3>
                                        <p className="text-gray-500 text-center text-xs">
                                            {scratchNumber < 3 ? 'Continue raspando!' : 'Você já tem um prêmio!'}
                                        </p>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Indicador de progresso */}
                        {!showResult && (
                            <div className="absolute -bottom-8 left-0 right-0 text-center">
                                <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow">
                                    <span className="text-sm font-medium text-gray-700">
                                        {Math.round(scratchPercent)}%
                                    </span>
                                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                                            style={{ width: `${scratchPercent}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Instruções para mobile */}
                    <div className="mt-10 text-center text-sm text-gray-600">
                        {!showResult ? (
                            <>
                                <p className="mb-1">📱 <strong>Toque e arraste</strong> para raspar</p>
                                <p className="text-xs">Precisa raspar pelo menos <strong>60%</strong> para revelar</p>
                            </>
                        ) : result?.prize ? (
                            <p className="text-green-600 font-bold">
                                🎉 Prêmio revelado! Use na sua próxima compra!
                            </p>
                        ) : (
                            <p className="text-blue-600 font-bold">
                                {scratchNumber < 3 ? 'Continue raspando as próximas!' : 'Você já tem um prêmio!'}
                            </p>
                        )}
                    </div>

                    {/* Botões de ação */}
                    <div className="mt-4 flex gap-2">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition text-sm"
                        >
                            Fechar
                        </button>

                        {!showResult ? (
                            <button
                                onClick={autoScratch}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-bold hover:opacity-90 transition text-sm"
                            >
                                🎴 Auto-Raspar
                            </button>
                        ) : scratchNumber < 3 ? (
                            <button
                                onClick={handleContinue}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-bold hover:opacity-90 transition text-sm"
                            >
                                Próxima ({3 - scratchNumber})
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    console.log('🛒 [ScratchCard] Navegando para cardápio');
                                    onClose();
                                    if (onNavigateToMenu) {
                                        onNavigateToMenu();
                                    }
                                }}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-bold hover:opacity-90 transition text-sm"
                            >
                                🛒 Cardápio
                            </button>
                        )}
                    </div>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-white hover:text-gray-200 text-2xl z-10 w-8 h-8 flex items-center justify-center"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}
