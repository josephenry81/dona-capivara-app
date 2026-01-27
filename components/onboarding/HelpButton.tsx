'use client';

import React, { useState } from 'react';

interface HelpButtonProps {
    onRestartTutorial: () => void;
    whatsappNumber?: string;
}

export default function HelpButton({ onRestartTutorial, whatsappNumber = '5511999999999' }: HelpButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [showFAQ, setShowFAQ] = useState(false);

    const handleRestartTutorial = () => {
        // Clear localStorage flags to restart
        localStorage.removeItem('dcap_onboarding_done');
        localStorage.removeItem('dcap_tour_done');
        setIsOpen(false);
        onRestartTutorial();
    };

    const handleWhatsApp = () => {
        const message = encodeURIComponent('Olá! Preciso de ajuda com meu pedido na Dona Capivara 🍦');
        window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
        setIsOpen(false);
    };

    const faqItems = [
        {
            question: 'Como faço um pedido?',
            answer: 'Navegue pelos produtos, adicione ao carrinho, e clique em "Finalizar Pedido". Simples assim!'
        },
        {
            question: 'Qual o prazo de entrega?',
            answer: 'Entregas no condomínio são imediatas. Para outros locais, em até 40 minutos.'
        },
        {
            question: 'Quais formas de pagamento?',
            answer: 'Aceitamos PIX, Cartão de Crédito/Débito e Dinheiro.'
        },
        {
            question: 'Como ganho pontos?',
            answer: 'A cada R$1 em compras você ganha 1 ponto. Com 500 pontos você pode trocar por descontos!'
        },
        {
            question: 'Posso agendar minha entrega?',
            answer: 'Sim! No carrinho, escolha a opção "Agendar" e selecione data e horário.'
        }
    ];

    return (
        <>
            {/* FAB Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-24 right-4 z-[100] w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 active:scale-90 ${
                    isOpen
                        ? 'bg-gray-700 rotate-45'
                        : 'bg-gradient-to-r from-[#FF4B82] to-[#FF9E3D] hover:shadow-xl hover:scale-105'
                }`}
            >
                <span className="text-2xl text-white">{isOpen ? '✕' : '❓'}</span>
            </button>

            {/* Menu Dropdown */}
            {isOpen && !showFAQ && (
                <div className="fixed bottom-40 right-4 z-[100] bg-white rounded-2xl shadow-2xl overflow-hidden w-64 animate-in slide-in-from-bottom-2 fade-in duration-200">
                    <div className="p-3 bg-gradient-to-r from-[#FF4B82] to-[#FF9E3D]">
                        <h3 className="text-white font-bold text-center">Como podemos ajudar?</h3>
                    </div>

                    <div className="p-2">
                        <button
                            onClick={handleRestartTutorial}
                            className="w-full p-3 rounded-xl hover:bg-gray-50 flex items-center gap-3 transition"
                        >
                            <span className="text-2xl">📖</span>
                            <div className="text-left">
                                <p className="font-bold text-gray-800 text-sm">Rever Tutorial</p>
                                <p className="text-xs text-gray-500">Aprenda a usar o app</p>
                            </div>
                        </button>

                        <button
                            onClick={() => setShowFAQ(true)}
                            className="w-full p-3 rounded-xl hover:bg-gray-50 flex items-center gap-3 transition"
                        >
                            <span className="text-2xl">❓</span>
                            <div className="text-left">
                                <p className="font-bold text-gray-800 text-sm">Perguntas Frequentes</p>
                                <p className="text-xs text-gray-500">Dúvidas comuns</p>
                            </div>
                        </button>

                        <button
                            onClick={handleWhatsApp}
                            className="w-full p-3 rounded-xl hover:bg-green-50 flex items-center gap-3 transition"
                        >
                            <span className="text-2xl">💬</span>
                            <div className="text-left">
                                <p className="font-bold text-green-600 text-sm">Falar no WhatsApp</p>
                                <p className="text-xs text-gray-500">Suporte ao vivo</p>
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {/* FAQ Modal */}
            {showFAQ && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="p-4 bg-gradient-to-r from-[#FF4B82] to-[#FF9E3D] flex items-center justify-between">
                            <h2 className="text-white font-bold text-lg">❓ Perguntas Frequentes</h2>
                            <button
                                onClick={() => {
                                    setShowFAQ(false);
                                    setIsOpen(false);
                                }}
                                className="text-white/80 hover:text-white text-2xl"
                            >
                                ✕
                            </button>
                        </div>

                        {/* FAQ List */}
                        <div className="p-4 overflow-y-auto max-h-[60vh] space-y-3">
                            {faqItems.map((item, index) => (
                                <details key={index} className="bg-gray-50 rounded-xl overflow-hidden group">
                                    <summary className="p-4 font-bold text-gray-800 cursor-pointer flex justify-between items-center hover:bg-gray-100 transition">
                                        <span className="text-sm pr-4">{item.question}</span>
                                        <span className="text-[#FF4B82] group-open:rotate-180 transition-transform">
                                            ▼
                                        </span>
                                    </summary>
                                    <div className="px-4 pb-4 text-gray-600 text-sm leading-relaxed">{item.answer}</div>
                                </details>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t bg-gray-50">
                            <button
                                onClick={handleWhatsApp}
                                className="w-full py-3 bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-green-600 transition active:scale-95"
                            >
                                💬 Ainda tem dúvidas? Fale conosco!
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
