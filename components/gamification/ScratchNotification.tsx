import React, { useState, useEffect } from 'react';

interface ScratchNotificationProps {
    trigger: {
        type: string;
        scratchCount: number;
        message: string;
        premiumPrize?: boolean;
        badge?: string;
        specialTheme?: string;
    };
    onAccept: () => void;
    onLater: () => void;
}

export default function ScratchNotification({ trigger, onAccept, onLater }: ScratchNotificationProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Animação de entrada
        setTimeout(() => setIsVisible(true), 100);
    }, []);

    const getThemeColors = () => {
        if (trigger.specialTheme === 'christmas') {
            return {
                gradient: 'from-red-500 via-green-500 to-red-500',
                icon: '🎄',
                effect: '❄️'
            };
        }
        if (trigger.specialTheme === 'black_friday') {
            return {
                gradient: 'from-black via-yellow-500 to-black',
                icon: '🛍️',
                effect: '💥'
            };
        }
        if (trigger.premiumPrize) {
            return {
                gradient: 'from-purple-500 via-pink-500 to-orange-500',
                icon: '👑',
                effect: '✨'
            };
        }
        return {
            gradient: 'from-[#FF4B82] to-[#FF9E3D]',
            icon: '🎴',
            effect: '⭐'
        };
    };

    const theme = getThemeColors();

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            {/* Overlay com confete animado */}
            <div className="fixed inset-0 bg-black/70 backdrop-blur-md">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute text-2xl animate-bounce"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 2}s`,
                            animationDuration: `${2 + Math.random() * 2}s`
                        }}
                    >
                        {theme.effect}
                    </div>
                ))}
            </div>

            {/* Card de Notificação */}
            <div className={`relative z-10 transform transition-all duration-500 ${isVisible ? 'scale-100' : 'scale-50'}`}>
                <div className={`bg-gradient-to-br ${theme.gradient} p-1 rounded-3xl shadow-2xl animate-pulse`}>
                    <div className="bg-white rounded-3xl p-8 max-w-md">
                        {/* Ícone Principal */}
                        <div className="text-center mb-6">
                            <div className="text-8xl mb-4 animate-bounce">
                                {theme.icon}
                            </div>

                            {/* Badge especial se houver */}
                            {trigger.badge && (
                                <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-bold mb-4">
                                    <span>🏆</span>
                                    <span>{trigger.badge === 'ambassador' ? 'Embaixador' : 'Badge Especial'}</span>
                                </div>
                            )}

                            {/* Contador de Raspadinhas */}
                            <div className="flex justify-center gap-2 mb-4">
                                {[...Array(Math.min(trigger.scratchCount, 5))].map((_, i) => (
                                    <div
                                        key={i}
                                        className="w-12 h-16 bg-gradient-to-br from-gray-300 to-gray-500 rounded-lg shadow-lg transform rotate-3 hover:rotate-0 transition"
                                        style={{ animationDelay: `${i * 100}ms` }}
                                    >
                                        <div className="w-full h-full flex items-center justify-center text-2xl">
                                            🎴
                                        </div>
                                    </div>
                                ))}
                                {trigger.scratchCount > 5 && (
                                    <div className="flex items-center justify-center text-3xl font-bold text-purple-600">
                                        +{trigger.scratchCount - 5}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Mensagem */}
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                Parabéns!
                            </h2>
                            <p className="text-lg text-gray-700 leading-relaxed">
                                {trigger.message}
                            </p>
                        </div>

                        {/* Info Premium */}
                        {trigger.premiumPrize && (
                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4 mb-6">
                                <div className="flex items-center gap-2 text-purple-700">
                                    <span className="text-2xl">💎</span>
                                    <p className="text-sm font-bold">
                                        Prêmio Premium Garantido!
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Botões de Ação */}
                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    setIsVisible(false);
                                    setTimeout(onAccept, 300);
                                }}
                                className={`w-full bg-gradient-to-r ${theme.gradient} text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition`}
                            >
                                🎉 Resgatar Agora!
                            </button>

                            <button
                                onClick={() => {
                                    setIsVisible(false);
                                    setTimeout(onLater, 300);
                                }}
                                className="w-full bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition"
                            >
                                Guardar para Depois
                            </button>
                        </div>

                        {/* Disclaimer */}
                        <p className="text-xs text-center text-gray-500 mt-4">
                            {trigger.scratchCount === 999
                                ? '♾️ Raspadinhas ilimitadas por 30 dias'
                                : `Você tem ${trigger.scratchCount} raspadinha${trigger.scratchCount > 1 ? 's' : ''} disponível${trigger.scratchCount > 1 ? 'is' : ''}`
                            }
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
