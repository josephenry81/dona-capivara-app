'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface TourStep {
    target: string; // CSS selector
    title: string;
    description: string;
    position: 'top' | 'bottom' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
    {
        target: '[data-tour="categories"]',
        title: '📂 Categorias',
        description: 'Toque aqui para navegar entre diferentes tipos de produtos!',
        position: 'bottom'
    },
    {
        target: '[data-tour="product-card"]',
        title: '🍦 Produtos',
        description: 'Clique em qualquer produto para ver mais detalhes e opções.',
        position: 'bottom'
    },
    {
        target: '[data-tour="add-to-cart"]',
        title: '🛒 Adicionar',
        description: 'Use este botão para adicionar o produto ao seu carrinho!',
        position: 'top'
    },
    {
        target: '[data-tour="cart-icon"]',
        title: '📦 Seu Carrinho',
        description: 'Veja seus itens selecionados e finalize seu pedido aqui.',
        position: 'top'
    },
    {
        target: '[data-tour="profile-icon"]',
        title: '👤 Seu Perfil',
        description: 'Acompanhe pedidos, ganhe pontos e veja promoções especiais!',
        position: 'top'
    }
];

interface GuidedTourProps {
    isActive: boolean;
    onComplete: () => void;
}

export default function GuidedTour({ isActive, onComplete }: GuidedTourProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    const handleComplete = useCallback(() => {
        localStorage.setItem('dcap_tour_done', 'true');
        setIsVisible(false);
        onComplete();
    }, [onComplete]);

    const updateTargetPosition = useCallback(() => {
        if (!isActive) return;

        const step = tourSteps[currentStep];
        const element = document.querySelector(step.target);

        if (element) {
            const rect = element.getBoundingClientRect();
            setTargetRect(rect);
            setIsVisible(true);
        } else {
            // Skip to next step if element not found
            if (currentStep < tourSteps.length - 1) {
                setCurrentStep(prev => prev + 1);
            } else {
                handleComplete();
            }
        }
    }, [currentStep, isActive, handleComplete]);

    useEffect(() => {
        if (isActive) {
            updateTargetPosition();
            window.addEventListener('resize', updateTargetPosition);
            window.addEventListener('scroll', updateTargetPosition);

            return () => {
                window.removeEventListener('resize', updateTargetPosition);
                window.removeEventListener('scroll', updateTargetPosition);
            };
        }
    }, [isActive, updateTargetPosition]);

    const handleNext = () => {
        if (currentStep < tourSteps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleComplete();
        }
    };

    const handleSkip = () => {
        localStorage.setItem('dcap_tour_done', 'true');
        setIsVisible(false);
        onComplete();
    };

    if (!isActive || !isVisible || !targetRect) return null;

    const step = tourSteps[currentStep];
    const padding = 8;

    // Calculate tooltip position
    const getTooltipStyle = (): React.CSSProperties => {
        const tooltipWidth = 280;
        const tooltipHeight = 150;

        switch (step.position) {
            case 'bottom':
                return {
                    top: targetRect.bottom + padding + 12,
                    left: Math.max(
                        16,
                        Math.min(
                            targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
                            window.innerWidth - tooltipWidth - 16
                        )
                    )
                };
            case 'top':
                return {
                    top: targetRect.top - tooltipHeight - padding - 12,
                    left: Math.max(
                        16,
                        Math.min(
                            targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
                            window.innerWidth - tooltipWidth - 16
                        )
                    )
                };
            case 'left':
                return {
                    top: targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
                    left: targetRect.left - tooltipWidth - padding - 12
                };
            case 'right':
                return {
                    top: targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
                    left: targetRect.right + padding + 12
                };
            default:
                return { top: targetRect.bottom + padding + 12, left: targetRect.left };
        }
    };

    return (
        <div className="fixed inset-0 z-[9998]">
            {/* Dark overlay with hole */}
            <svg className="absolute inset-0 w-full h-full">
                <defs>
                    <mask id="tour-mask">
                        <rect x="0" y="0" width="100%" height="100%" fill="white" />
                        <rect
                            x={targetRect.left - padding}
                            y={targetRect.top - padding}
                            width={targetRect.width + padding * 2}
                            height={targetRect.height + padding * 2}
                            rx="12"
                            fill="black"
                        />
                    </mask>
                </defs>
                <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.7)" mask="url(#tour-mask)" />
            </svg>

            {/* Highlight border */}
            <div
                className="absolute border-2 border-[#FF4B82] rounded-xl pointer-events-none animate-pulse"
                style={{
                    top: targetRect.top - padding,
                    left: targetRect.left - padding,
                    width: targetRect.width + padding * 2,
                    height: targetRect.height + padding * 2,
                    boxShadow: '0 0 20px rgba(255, 75, 130, 0.5)'
                }}
            />

            {/* Tooltip */}
            <div
                className="absolute bg-white rounded-2xl shadow-2xl p-4 w-[280px] animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={getTooltipStyle()}
            >
                {/* Arrow indicator based on position */}
                {step.position === 'bottom' && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45" />
                )}
                {step.position === 'top' && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45" />
                )}

                <h3 className="font-bold text-gray-800 text-lg mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">{step.description}</p>

                {/* Progress */}
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-400">
                        {currentStep + 1} de {tourSteps.length}
                    </span>
                    <div className="flex gap-1">
                        {tourSteps.map((_, i) => (
                            <div
                                key={i}
                                className={`w-2 h-2 rounded-full ${i <= currentStep ? 'bg-[#FF4B82]' : 'bg-gray-200'}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={handleSkip}
                        className="flex-1 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition"
                    >
                        Pular
                    </button>
                    <button
                        onClick={handleNext}
                        className="flex-1 py-2 bg-[#FF4B82] text-white rounded-lg font-bold text-sm hover:bg-[#e03a6d] transition active:scale-95"
                    >
                        {currentStep === tourSteps.length - 1 ? 'Concluir' : 'Próximo'}
                    </button>
                </div>
            </div>
        </div>
    );
}
