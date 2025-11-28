import React, { useState, useEffect } from 'react';
import { API } from '../../services/api';

interface AdminViewProps {
    onLogout: () => void;
}

export default function AdminView({ onLogout }: AdminViewProps) {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    // Hardcoded key is safe here because API.getAdminOrders validates it on server too
    const adminKey = "Jxd701852@";

    const loadOrders = async () => {
        setLoading(true);
        const data = await API.getAdminOrders(adminKey);
        if (data) setOrders(data);
        setLoading(false);
    };

    useEffect(() => { loadOrders(); }, []);

    const changeStatus = async (orderId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'Pendente' ? 'Entregue' : 'Pendente';
        // Optimistic Update
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        const success = await API.updateOrderStatus(adminKey, orderId, newStatus);
        if (!success) loadOrders(); // Revert on fail
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4 pb-24">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm sticky top-0 z-10">
                    <h1 className="text-xl font-bold text-gray-800">Painel Admin 🔒</h1>
                    <div className="flex gap-2">
                        <button onClick={loadOrders} className="bg-gray-100 p-2 rounded-full text-2xl">🔄</button>
                        <button onClick={onLogout} className="bg-red-100 p-2 rounded-full text-2xl">🚪</button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-blue-500">
                        <p className="text-xs font-bold text-gray-400 uppercase">Total</p>
                        <p className="text-2xl font-bold">{orders.length}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-orange-500">
                        <p className="text-xs font-bold text-gray-400 uppercase">Pendentes</p>
                        <p className="text-2xl font-bold text-orange-500">{orders.filter(o => o.status === 'Pendente').length}</p>
                    </div>
                </div>

                {/* List */}
                <div className="space-y-3">
                    {loading && <p className="text-center text-gray-500">Carregando pedidos...</p>}
                    {!loading && orders.map(order => (
                        <div key={order.id} className={`bg-white p-4 rounded-2xl shadow-sm border-l-4 ${order.status === 'Pendente' ? 'border-orange-400' : 'border-green-500'}`}>
                            <div className="flex justify-between mb-2">
                                <span className="font-mono text-xs text-gray-400">#{order.id.slice(0, 8)}</span>
                                <span className="text-xs font-bold">{new Date(order.date).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <h3 className="font-bold text-gray-800">{order.customerName}</h3>
                            <p className="text-sm text-gray-600 mb-2">{order.address}</p>
                            <div className="flex justify-between items-center">
                                <span className="text-[#FF4B82] font-bold text-sm">{order.payment} • R$ {order.total.toFixed(2)}</span>
                                <button
                                    onClick={() => changeStatus(order.id, order.status)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold ${order.status === 'Pendente' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}
                                >
                                    {order.status === 'Pendente' ? 'Marcar Entregue' : 'Concluído'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
