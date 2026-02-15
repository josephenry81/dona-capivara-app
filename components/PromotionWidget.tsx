'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { API } from '@/services/api';

interface PromotionWidgetProps {
    customerId: string;
    customerName: string;
}

interface RaffleData {
    success: boolean;
    numeros: any[];
    gastoAtual: number;
    metaAtual: number;
    faltam: number;
}

export default function PromotionWidget({ customerId, customerName: _customerName }: PromotionWidgetProps) {
    const [data, setData] = useState<RaffleData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showDetails, setShowDetails] = useState(false);

    const loadRaffleData = useCallback(async () => {
        try {
            const response = await API.getMinhasChances(customerId);
            setData(response);
        } catch (error) {
            console.error('Error loading raffle data:', error);
        } finally {
            setLoading(false);
        }
    }, [customerId]);

    useEffect(() => {
        if (customerId && customerId !== 'GUEST') {
            loadRaffleData();
        } else {
            setLoading(false);
        }
    }, [customerId, loadRaffleData]);

    // Don't show for guest users
    if (!customerId || customerId === 'GUEST' || loading) {
        return null;
    }

    // Don't show if no data
    if (!data || !data.success) {
        return null;
    }

    const progress = ((data.gastoAtual % data.metaAtual) / data.metaAtual) * 100;
    const totalNumbers = data.numeros.length;

    return (
        <>
            {/* Floating Widget */}
            <div
                onClick={() => setShowDetails(true)}
                className="fixed bottom-24 right-6 z-40 cursor-pointer transform transition-all duration-300 hover:scale-105"
            >
                <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-2xl shadow-2xl p-4 w-64 relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/2" />

                    {/* Badge for number count */}
                    {totalNumbers > 0 && (
                        <div className="absolute top-2 right-2 bg-yellow-400 text-purple-900 font-bold text-xs px-2 py-1 rounded-full">
                            {totalNumbers} {totalNumbers === 1 ? 'número' : 'números'}
                        </div>
                    )}

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">🎬</span>
                            <h3 className="font-bold text-sm">Promoção Cinema</h3>
                        </div>

                        <p className="text-xs opacity-90 mb-3">
                            Faltam <span className="font-bold">R$ {data.faltam.toFixed(2)}</span> para sua próxima
                            chance!
                        </p>

                        {/* Progress bar */}
                        <div className="bg-white/20 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-yellow-400 h-full transition-all duration-500 rounded-full"
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        <p className="text-xs mt-2 opacity-75">Toque para ver seus números</p>
                    </div>
                </div>
            </div>

            {/* Details Modal */}
            {showDetails && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setShowDetails(false)}
                >
                    <div
                        className="bg-white rounded-3xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="text-center mb-6">
                            <span className="text-6xl mb-2 block">🎬</span>
                            <h2 className="text-2xl font-bold text-gray-800 mb-1">Promoção Cinema</h2>
                            <p className="text-sm text-gray-600">Ganhe ingressos comprando!</p>
                        </div>

                        {/* Progress Card */}
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 mb-6">
                            <h3 className="font-semibold text-gray-700 mb-3">Seu Progresso</h3>

                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-600">Gasto acumulado:</span>
                                        <span className="font-bold text-purple-600">
                                            R$ {data.gastoAtual.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Próximo número em:</span>
                                        <span className="font-bold text-pink-600">R$ {data.faltam.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div>
                                    <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-500"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 text-center">
                                        {progress.toFixed(0)}% até a próxima chance
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Raffle Numbers */}
                        <div className="mb-6">
                            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <span>🎟️</span>
                                Meus Números da Sorte
                            </h3>

                            {totalNumbers === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p className="text-sm">Você ainda não tem números da sorte.</p>
                                    <p className="text-xs mt-1">
                                        Compre mais R$ 18,00 para ganhar sua primeira chance!
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-3">
                                    {data.numeros.map((numero, index) => (
                                        <div
                                            key={index}
                                            className={`
                        relative rounded-xl p-3 text-center font-bold text-lg
                        ${
                            numero.ganhou
                                ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg'
                                : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700'
                        }
                      `}
                                        >
                                            {numero.ganhou && (
                                                <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                                    ✓
                                                </div>
                                            )}
                                            {numero.numero}
                                            {numero.ganhou && <div className="text-[10px] mt-1">Vencedor!</div>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Rules */}
                        <div className="bg-blue-50 rounded-xl p-4 mb-4">
                            <h4 className="font-semibold text-sm text-blue-900 mb-2">📋 Como Funciona</h4>
                            <ul className="text-xs text-blue-800 space-y-1">
                                <li>
                                    • A cada <strong>R$ 18,00</strong> gastos você ganha 1 número
                                </li>
                                <li>• Números são gerados automaticamente</li>
                                <li>• Acompanhe o sorteio pelo nosso Instagram</li>
                                <li>• Prêmios incríveis te esperam! 🎁</li>
                            </ul>
                        </div>

                        {/* Close button */}
                        <button
                            onClick={() => setShowDetails(false)}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
