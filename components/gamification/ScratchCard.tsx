'use client';
import React, { useState, useRef, useEffect } from 'react';
import { getSpinResult, SpinResult } from '../../services/wheel';
import { API } from '../../services/api';

interface ScratchCardProps {
    user: any;
    hasPendingPrize: boolean;
    onScratchComplete: (result: SpinResult) => void;
    onClose: () => void;
    onNavigateToMenu?: () => void;
}

export default function ScratchCard({ user, hasPendingPrize, onScratchComplete, onClose, onNavigateToMenu }: ScratchCardProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isScratching, setIsScratching] = useState(false);
    const [scratchNumber, setScratchNumber] = useState(1);
    const [scratchPercent, setScratchPercent] = useState(0);
    const [result, setResult] = useState<SpinResult | null>(null);
    const [showResult, setShowResult] = useState(false);

    const CANVAS_SIZE = 280;
    const REVEAL_THRESHOLD = 60;

    // ✅ Reset quando scratchNumber muda
    useEffect(() => {
        console.log('🎴 Inicializando canvas para raspadinha', scratchNumber);
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

        // ✅ Limpar canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Desenhar camada prateada
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#C0C0C0');
        gradient.addColorStop(0.5, '#E8E8E8');
        gradient.addColorStop(1, '#C0C0C0');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Textura
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (let i = 0; i < 50; i++) {
            ctx.fillRect(
                Math.random() * canvas.width,
                Math.random() * canvas.height,
                Math.random() * 3,
                Math.random() * 3
            );
        }

        // Texto "RASPE AQUI"
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('RASPE AQUI', canvas.width / 2, canvas.height / 2);
    };

    const scratch = (x: number, y: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.fill();

        calculateScratchPercent();
    };

    const calculateScratchPercent = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let transparent = 0;

        for (let i = 3; i < imageData.data.length; i += 4) {
            if (imageData.data[i] === 0) transparent++;
        }

        const percent = (transparent / (imageData.data.length / 4)) * 100;
        setScratchPercent(percent);

        if (percent > REVEAL_THRESHOLD && !showResult) {
            revealResult();
        }
    };

    const revealResult = async () => {
        const spinResult = getSpinResult(user.id || user.phone, scratchNumber, hasPendingPrize);
        setResult(spinResult);
        setShowResult(true);

        // ✅ Salvar prêmio no backend se ganhou
        if (spinResult.prize && (user.id || user.phone)) {
            console.log('🎁 [ScratchCard] Salvando prêmio no backend:', spinResult.prize);
            try {
                await API.saveScratchPrize(user.id || user.phone, spinResult.prize);
                console.log('✅ [ScratchCard] Prêmio salvo com sucesso!');
            } catch (error) {
                console.error('💥 [ScratchCard] Erro ao salvar prêmio:', error);
            }
        }

        onScratchComplete(spinResult);
    };

    const autoScratch = () => {
        const canvas = canvasRef.current;
        if (!canvas || showResult) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setScratchPercent(100);
        revealResult();
    };

    const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        setIsScratching(true);
        const pos = getPosition(e);
        scratch(pos.x, pos.y);
    };

    const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isScratching) return;
        e.preventDefault();
        const pos = getPosition(e);
        scratch(pos.x, pos.y);
    };

    const handleEnd = () => {
        setIsScratching(false);
    };

    const getPosition = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        if ('touches' in e) {
            return {
                x: (e.touches[0].clientX - rect.left) * scaleX,
                y: (e.touches[0].clientY - rect.top) * scaleY
            };
        }

        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    };

    const handleContinue = () => {
        if (scratchNumber < 3) {
            setScratchNumber(prev => prev + 1);
        } else {
            onClose();
        }
    };

    const getScratchTitle = () => {
        switch (scratchNumber) {
            case 1: return '🎴 Primeira Raspadinha';
            case 2: return '✨ Segunda Raspadinha';
            case 3: return '🌟 Terceira Raspadinha';
            default: return '🎴 Raspadinha';
        }
    };

    const getPrizeIcon = () => {
        if (!result?.prize) return '🎯';
        switch (result.prize.type) {
            case 'discount': return '🎁';
            case 'cookie': return '🍪';
            case 'drink': return '🥤';
            case 'side': return '🍟';
            case 'burger': return '🍔';
            case 'premium': return '🎉';
            case 'combo': return '👑';
            default: return '⭐';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-sm mx-auto">
                <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 p-1 rounded-3xl shadow-2xl">
                    <div className="bg-white rounded-3xl p-6">
                        {/* Header */}
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800">
                                {getScratchTitle()}
                            </h2>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 text-2xl w-8 h-8 flex items-center justify-center"
                            >
                                ×
                            </button>
                        </div>

                        {/* Progress Indicator */}
                        {!showResult && (
                            <div className="mb-4 flex justify-center">
                                <div className="inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full">
                                    <span className="text-sm font-bold text-gray-700">
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

                        {/* Canvas Container */}
                        <div className="flex justify-center mb-4">
                            <div
                                className="relative rounded-2xl overflow-hidden shadow-xl"
                                style={{ width: `${CANVAS_SIZE}px`, height: `${CANVAS_SIZE}px` }}
                            >
                                {!showResult && (
                                    <canvas
                                        ref={canvasRef}
                                        width={CANVAS_SIZE}
                                        height={CANVAS_SIZE}
                                        onMouseDown={handleStart}
                                        onMouseMove={handleMove}
                                        onMouseUp={handleEnd}
                                        onMouseLeave={handleEnd}
                                        onTouchStart={handleStart}
                                        onTouchMove={handleMove}
                                        onTouchEnd={handleEnd}
                                        className="cursor-pointer"
                                        style={{
                                            touchAction: 'none',
                                            width: '100%',
                                            height: '100%'
                                        }}
                                    />
                                )}

                                {/* Result Display */}
                                {showResult && result && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-white to-yellow-50 rounded-xl p-4 animate-in zoom-in duration-500">
                                        {result.prize ? (
                                            <>
                                                <div className="text-6xl mb-3 animate-bounce">
                                                    {getPrizeIcon()}
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
                            </div>
                        </div>

                        {/* Instructions */}
                        {!showResult && (
                            <div className="text-center space-y-2 mb-4">
                                <p className="text-sm text-gray-600">
                                    📱 <strong>Toque e arraste</strong> para raspar
                                </p>
                                <p className="text-xs text-gray-500">
                                    Precisa raspar pelo menos <strong>{REVEAL_THRESHOLD}%</strong> para revelar
                                </p>
                            </div>
                        )}

                        {/* Result Message */}
                        {showResult && result && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                                {result.prize && (
                                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-2xl text-center">
                                        <p className="text-lg font-bold text-gray-800 mb-1">
                                            Parabéns!
                                        </p>
                                        <p className="text-sm text-green-600 font-bold">
                                            🎉 Prêmio revelado! Use na sua próxima compra!
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={onClose}
                                className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl text-sm hover:bg-gray-200 transition"
                            >
                                Fechar
                            </button>

                            {!showResult ? (
                                <button
                                    onClick={autoScratch}
                                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 rounded-xl text-sm hover:opacity-90 transition"
                                >
                                    🎴 Auto-Raspar
                                </button>
                            ) : scratchNumber < 3 ? (
                                <button
                                    onClick={handleContinue}
                                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 rounded-xl text-sm hover:shadow-lg transition"
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
                                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 rounded-xl text-sm hover:shadow-lg transition"
                                >
                                    🛒 Cardápio
                                </button>
                            )}
                        </div>

                        {/* Info Footer */}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-xs text-center text-gray-500">
                                Raspadinha {scratchNumber} de 3 • Dona Capivara 🍹
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
