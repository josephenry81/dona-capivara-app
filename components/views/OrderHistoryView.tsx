import React, { useEffect, useState } from 'react';
import { API } from '../../services/api';

interface Order {
    id: string;
    date: string;
    total: number;
    status: string;
    paymentMethod: string;
}

interface OrderHistoryProps {
    user: any;
    onBack: () => void;
}

export default function OrderHistoryView({ user, onBack }: OrderHistoryProps) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id) {
            API.getCustomerOrders(user.id)
                .then(data => setOrders(data))
                .finally(() => setLoading(false));
        }
    }, [user]);

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateString;
        }
    };

    const getStatusColor = (status: string) => {
        const s = (status || '').toLowerCase();
        if (s.includes('entregue') || s.includes('concluído')) return 'bg-green-100 text-green-600';
        if (s.includes('cancelado')) return 'bg-red-100 text-red-600';
        return 'bg-orange-100 text-orange-600';
    };

    return (
        <div className="min-h-screen bg-[#F5F6FA] pb-24">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#FF4B82] to-[#FF9E3D] text-white p-6 pt-12 pb-12 rounded-b-[30px] shadow-lg sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    {/* --- NEW STYLED BACK BUTTON --- */}
                    <button
                        onClick={onBack}
                        className="bg-white/20 backdrop-blur-md p-2 rounded-full hover:bg-white/40 transition active:scale-95 flex items-center justify-center"
                        aria-label="Voltar"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <h1 className="text-2xl font-bold">Histórico de Pedidos</h1>
                </div>
            </div>

            <div className="p-6 -mt-6 space-y-4">
                {loading ? (
                    <div className="text-center text-gray-400 mt-10 flex flex-col items-center gap-2">
                        <span className="animate-spin h-6 w-6 border-2 border-[#FF4B82] border-t-transparent rounded-full"></span>
                        Carregando...
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center text-gray-400 mt-10">Nenhum pedido encontrado. 📦</div>
                ) : (
                    orders.map(order => (
                        <div
                            key={order.id}
                            className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 animate-in slide-in-from-bottom-4 duration-500"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold text-gray-400">#{order.id.slice(0, 8)}</span>
                                <span
                                    className={`text-xs font-bold px-2 py-1 rounded-full ${getStatusColor(order.status)}`}
                                >
                                    {order.status}
                                </span>
                            </div>

                            <div className="mb-3">
                                <p className="text-sm text-gray-600">{formatDate(order.date)}</p>
                                <p className="text-xs text-gray-400 mt-1">{order.paymentMethod}</p>
                            </div>

                            <div className="flex justify-between items-center border-t border-gray-50 pt-3">
                                <span className="text-sm font-medium text-gray-500">Total</span>
                                <span className="text-lg font-bold text-[#FF4B82]">R$ {order.total.toFixed(2)}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
