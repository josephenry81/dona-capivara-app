'use client';
import React, { useState } from 'react';
import { PRIZES, Prize, getGuaranteedPrize, calculateRotation } from '../../services/wheel';

interface MagicWheelProps {
    user: any;
    spinsAvailable: number;
    onPrizeWon: (prize: Prize) => void;
    onClose: () => void;
}

export default function MagicWheel({ user, spinsAvailable, onPrizeWon, onClose }: MagicWheelProps) {
    const [rotation, setRotation] = useState(0);
    const [isSpinning, setIsSpinning] = useState(false);
    const [wonPrize, setWonPrize] = useState<Prize | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [currentSpin, setCurrentSpin] = useState(1);

    const handleSpin = () => {
        if (isSpinning || spinsAvailable <= 0) return;

        console.log('🎰 Iniciando giro...');
        setIsSpinning(true);

        // 1. Determinar prêmio garantido
        const prize = getGuaranteedPrize(user.id || user.phone, currentSpin);
        console.log('🎰 Prêmio determinado:', prize);

        // 2. Calcular rotação para parar no prêmio
        const targetRotation = calculateRotation(prize.id);

        // 3. Aplicar rotação
        setRotation(targetRotation);

        // 4. Após animação, mostrar resultado
        setTimeout(() => {
            setWonPrize(prize);
            setShowResult(true);
            setIsSpinning(false);
            setCurrentSpin(prev => prev + 1);
            onPrizeWon(prize);
        }, 4000); // 4 segundos de animação
    };

    const handleClaimLater = () => {
        setShowResult(false);
        setWonPrize(null);
        if (spinsAvailable - currentSpin + 1 <= 0) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full relative">
                {/* Header */}
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">🎰 Roleta Mágica</h2>
                    <p className="text-gray-600">Gire e ganhe prêmios incríveis!</p>
                    <div className="mt-2 inline-block bg-purple-100 text-purple-700 px-4 py-2 rounded-full font-bold">
                        {spinsAvailable - currentSpin + 1} giro(s) disponível(is)
                    </div>
                </div>

                {/* Wheel Container */}
                <div className="relative w-full aspect-square mb-6">
                    {/* Pointer */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
                        <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[30px] border-t-red-500"></div>
                    </div>

                    {/* Wheel */}
                    <div className="relative w-full h-full">
                        <div
                            className="absolute inset-0 rounded-full shadow-2xl transition-transform duration-[4000ms] ease-out"
                            style={{
                                transform: `rotate(${rotation}deg)`,
                                background: `conic-gradient(
                  ${PRIZES.map((prize, i) => {
                                    const start = (i / PRIZES.length) * 360;
                                    const end = ((i + 1) / PRIZES.length) * 360;
                                    return `${prize.color} ${start}deg ${end}deg`;
                                }).join(', ')}
                )`
                            }}
                        >
                            {/* Prize Sections */}
                            {PRIZES.map((prize, index) => {
                                const angle = (360 / PRIZES.length) * index;
                                const radius = 45; // percentage

                                return (
                                    <div
                                        key={prize.id}
                                        className="absolute top-1/2 left-1/2 origin-left"
                                        style={{
                                            transform: `rotate(${angle + 22.5}deg) translateX(${radius}%)`,
                                            width: '20%',
                                        }}
                                    >
                                        <div className="text-center">
                                            <div className="text-3xl mb-1">{prize.emoji}</div>
                                            <div className="text-xs font-bold text-gray-800 whitespace-nowrap">
                                                {prize.name}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Center Circle */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-yellow-400">
                                <span className="text-2xl">🎰</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Spin Button */}
                <button
                    onClick={handleSpin}
                    disabled={isSpinning || spinsAvailable - currentSpin + 1 <= 0}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition ${isSpinning || spinsAvailable - currentSpin + 1 <= 0
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 active:scale-95'
                        }`}
                >
                    {isSpinning ? '🎰 Girando...' : 'GIRAR AGORA!'}
                </button>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
                >
                    ✕
                </button>
            </div>

            {/* Prize Result Modal */}
            {showResult && wonPrize && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center relative animate-in zoom-in duration-300">
                        {/* Confetti Effect */}
                        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                            {[...Array(20)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute animate-ping"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        top: `${Math.random() * 100}%`,
                                        animationDelay: `${Math.random() * 2}s`,
                                    }}
                                >
                                    🎉
                                </div>
                            ))}
                        </div>

                        <div className="relative z-10">
                            <h3 className="text-3xl font-bold text-gray-800 mb-4">
                                🎉 PARABÉNS! 🎉
                            </h3>

                            <div className="text-8xl mb-4">{wonPrize.emoji}</div>

                            <h4 className="text-2xl font-bold text-purple-600 mb-2">
                                {wonPrize.name}
                            </h4>

                            <p className="text-gray-600 mb-6">
                                {wonPrize.description}
                            </p>

                            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4 mb-6">
                                <p className="text-sm font-bold text-yellow-800">
                                    ⚡ Resgate na sua PRÓXIMA compra!
                                </p>
                            </div>

                            <button
                                onClick={handleClaimLater}
                                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 rounded-xl hover:from-purple-600 hover:to-pink-600 transition"
                            >
                                Entendi! 🎁
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
