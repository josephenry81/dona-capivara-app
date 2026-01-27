'use client';

import React, { useState, useEffect } from 'react';

interface OnboardingSlide {
    icon: string;
    title: string;
    description: string;
    color: string;
}

const slides: OnboardingSlide[] = [
    {
        icon: '🎉',
        title: 'Bem-vindo à Dona Capivara!',
        description:
            'Descubra os melhores geladinhos gourmet da região. Feitos com muito amor e ingredientes selecionados!',
        color: 'from-pink-500 to-rose-500'
    },
    {
        icon: '🍦',
        title: 'Explore Nossos Sabores',
        description: 'Navegue pelas categorias para descobrir sabores incríveis. Temos opções para todos os gostos!',
        color: 'from-purple-500 to-indigo-500'
    },
    {
        icon: '🛒',
        title: 'Monte Seu Pedido',
        description: 'Toque no produto para ver detalhes e clique em "Adicionar ao Carrinho". Simples assim!',
        color: 'from-orange-500 to-amber-500'
    },
    {
        icon: '🎟️',
        title: 'Use Seus Cupons',
        description:
            'Tem cupom de desconto? Digite na área "Possui Cupom?" no carrinho e clique em "Aplicar" para ganhar desconto!',
        color: 'from-blue-500 to-cyan-500'
    },
    {
        icon: '✅',
        title: 'Finalize e Receba',
        description: 'Escolha a forma de entrega e pagamento. Seu pedido chegará rapidinho!',
        color: 'from-green-500 to-emerald-500'
    }
];

interface OnboardingModalProps {
    onComplete: () => void;
    onStartTour?: () => void;
}

export default function OnboardingModal({ onComplete, onStartTour }: OnboardingModalProps) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if onboarding was already completed
        const done = localStorage.getItem('dcap_onboarding_done');
        if (!done) {
            setIsVisible(true);
        }
    }, []);

    const handleNext = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(prev => prev + 1);
        } else {
            handleComplete();
        }
    };

    const handleBack = () => {
        if (currentSlide > 0) {
            setCurrentSlide(prev => prev - 1);
        }
    };

    const handleComplete = () => {
        localStorage.setItem('dcap_onboarding_done', 'true');
        setIsVisible(false);
        onComplete();
        if (onStartTour) {
            // Small delay before starting tour
            setTimeout(onStartTour, 500);
        }
    };

    const handleSkip = () => {
        localStorage.setItem('dcap_onboarding_done', 'true');
        setIsVisible(false);
        onComplete();
    };

    if (!isVisible) return null;

    const slide = slides[currentSlide];
    const isLastSlide = currentSlide === slides.length - 1;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-[90%] max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Skip Button - Mais visível */}
                <button
                    onClick={handleSkip}
                    className="absolute top-4 right-4 z-10 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white font-bold text-sm hover:bg-white/30 transition active:scale-95"
                >
                    ✕ Pular Tutorial
                </button>

                {/* Header with Gradient */}
                <div className={`bg-gradient-to-br ${slide.color} p-8 pb-16 text-center transition-all duration-500`}>
                    <div className="text-6xl mb-4 animate-bounce">{slide.icon}</div>
                    <h2 className="text-2xl font-bold text-white mb-2">{slide.title}</h2>
                </div>

                {/* Content Body */}
                <div className="px-6 pt-8 pb-6 -mt-8 bg-white rounded-t-3xl relative">
                    {/* Description */}
                    <p className="text-gray-600 text-center leading-relaxed mb-8">{slide.description}</p>

                    {/* Dots Indicator */}
                    <div className="flex justify-center gap-2 mb-6">
                        {slides.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentSlide(index)}
                                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                                    index === currentSlide ? 'bg-[#FF4B82] w-8' : 'bg-gray-300 hover:bg-gray-400'
                                }`}
                            />
                        ))}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex gap-3">
                        {currentSlide > 0 && (
                            <button
                                onClick={handleBack}
                                className="flex-1 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition active:scale-95"
                            >
                                ← Voltar
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            className={`flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-[#FF4B82] to-[#FF9E3D] hover:opacity-90 transition active:scale-95 shadow-lg ${
                                currentSlide === 0 ? 'w-full' : ''
                            }`}
                        >
                            {isLastSlide ? '🚀 Começar!' : 'Próximo →'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
