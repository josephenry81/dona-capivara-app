'use client';
import React, { useState, useRef, useEffect } from 'react';
import { getSpinResult, SpinResult } from '../../services/wheel';

interface ScratchCardProps {
    user: any;
    hasPendingPrize: boolean;
    onScratchComplete: (result: SpinResult) => void;
    onClose: () => void;
    onNavigateToMenu?: () => void; // ✅ NOVO: navegação para cardápio
}

export default function ScratchCard({ user, hasPendingPrize, onScratchComplete, onClose, onNavigateToMenu }: ScratchCardProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [scratchNumber, setScratchNumber] = useState(1);
    const [scratchPercent, setScratchPercent] = useState(0);
    const [result, setResult] = useState<SpinResult | null>(null);
    const [showResult, setShowResult] = useState(false);

    useEffect(() => {
        initCanvas();
    }, [scratchNumber]);

    const initCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

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
        ctx.fillText('🖱️ Use o mouse ou dedo para raspar', canvas.width / 2, canvas.height / 2 + 20);
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
        // ✅ NOVA LÓGICA: usar getSpinResult
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
            setScratchPercent(0);
            setShowResult(false);
            setResult(null);
            initCanvas();
        } else {
            // Terminou as 3 chances
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 text-white">
                    <h2 className="text-2xl font-bold text-center">🎴 Raspadinha Mágica</h2>
                    <p className="text-sm opacity-90 text-center">Raspe para revelar seu prêmio!</p>
                    <div className="mt-2 flex justify-between items-center text-sm">
                        <span>Raspadinha #{scratchNumber} de 3</span>
                        <span className="bg-white/20 px-3 py-1 rounded-full">
                            {Math.round(scratchPercent)}% raspado
                        </span>
                    </div>
                </div>

                {/* Área da Raspadinha */}
                <div className="p-6">
                    <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl p-4 shadow-inner">
                        {/* Canvas de Raspagem */}
                        <canvas
                            ref={canvasRef}
                            width={400}
                            height={300}
                            className="w-full h-64 touch-none cursor-crosshair rounded-lg border-4 border-yellow-400 shadow-lg"
                            onMouseDown={handleScratch}
                            onMouseMove={(e) => e.buttons === 1 && handleScratch(e)}
                            onTouchStart={handleScratch}
                            onTouchMove={handleScratch}
                            style={{ display: showResult ? 'none' : 'block' }}
                        />

                        {/* Área Revelada (Resultado) */}
                        {showResult && result && (
                            <div className="w-full h-64 flex flex-col items-center justify-center bg-gradient-to-br from-white to-yellow-50 rounded-lg border-4 border-yellow-400 p-6 animate-in zoom-in duration-500">
                                {result.prize ? (
                                    // ✅ PRÊMIO GANHO (1º giro)
                                    <>
                                        <div className="text-7xl mb-4 animate-bounce">
                                            {result.prize.emoji}
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                                            {result.prize.name}
                                        </h3>
                                        <p className="text-gray-600 text-center text-sm mb-4">
                                            {result.prize.description}
                                        </p>

                                        {/* Confetti */}
                                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                            {[...Array(15)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="absolute text-2xl animate-ping"
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
                                    // ❌ GIRO VAZIO (2º e 3º giros)
                                    <>
                                        <div className="text-7xl mb-4">
                                            {scratchNumber === 2 ? '🎯' : '✨'}
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-600 mb-2 text-center">
                                            {result.message}
                                        </h3>
                                        <p className="text-gray-500 text-center text-sm">
                                            {scratchNumber < 3 ? 'Continue raspando!' : 'Você já tem um prêmio pendente!'}
                                        </p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Condições de Resgate (apenas se ganhou prêmio) */}
                    {showResult && result?.prize && (
                        <div className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4">
                            <h4 className="font-bold text-green-800 mb-2 flex items-center gap-2">
                                <span>📋</span> Condições de Resgate:
                            </h4>
                            <ul className="text-sm text-green-700 space-y-1">
                                <li>✅ Válido apenas na <strong>próxima compra</strong></li>
                                <li>✅ Pedido mínimo: <strong>R$ 15,00</strong></li>
                                <li>✅ Não acumula com outros descontos</li>
                                <li>✅ Válido por <strong>7 dias</strong></li>
                            </ul>
                        </div>
                    )}

                    {/* Progresso */}
                    {!showResult && (
                        <div className="mt-4">
                            <div className="flex justify-between text-sm text-gray-700 mb-1">
                                <span>Progresso da raspagem:</span>
                                <span className="font-bold">{Math.round(scratchPercent)}%</span>
                            </div>
                            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-300"
                                    style={{ width: `${scratchPercent}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Instruções */}
                    <div className="mt-4 text-center text-gray-600 text-sm">
                        {!showResult ? (
                            <p>🖱️ Clique e arraste ou use o dedo para raspar a área prateada</p>
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
                </div>

                {/* Footer */}
                <div className="bg-gray-50 p-4 border-t flex justify-between gap-2">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                    >
                        Fechar
                    </button>

                    {!showResult ? (
                        <button
                            onClick={autoScratch}
                            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-bold hover:opacity-90 transition"
                        >
                            🎴 Raspar Automaticamente
                        </button>
                    ) : scratchNumber < 3 ? (
                        <button
                            onClick={handleContinue}
                            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-bold hover:opacity-90 transition"
                        >
                            Próxima Raspadinha ({3 - scratchNumber} restante(s))
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                console.log('🛒 [ScratchCard] Navegando para cardápio');
                                onClose(); // Fechar modal primeiro
                                if (onNavigateToMenu) {
                                    onNavigateToMenu(); // Navegar para menu
                                }
                            }}
                            className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-bold hover:opacity-90 transition"
                        >
                            🛒 Ir para Cardápio
                        </button>
                    )}
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white hover:text-gray-200 text-2xl z-10"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}
