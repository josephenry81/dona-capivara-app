import React, { useState, useEffect } from 'react';
import { API } from '../../services/api';
import Toast from '../ui/Toast';

interface AdminViewProps {
    onLogout: () => void;
    adminKey: string; // <--- Received from Parent (Page.tsx)
}

export default function AdminView({ onLogout, adminKey }: AdminViewProps) {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as any });

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ visible: true, message: msg, type });
        setTimeout(() => setToast({ ...toast, visible: false }), 3000); // Auto-hide
    };

    const loadOrders = async () => {
        setLoading(true);
        // Use the key passed via props
        const data = await API.getAdminOrders(adminKey);
        if (data) {
            setOrders(data);
        } else {
            showToast('Erro de autenticação. Faça login novamente.', 'error');
            setTimeout(onLogout, 2000); // Auto logout on invalid key
        }
        setLoading(false);
    };

    // Load on mount
    useEffect(() => {
        if (adminKey) loadOrders();
    }, [adminKey]);

    const changeStatus = async (orderId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'Pendente' ? 'Entregue' : 'Pendente';

        // Optimistic Update
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

        const success = await API.updateOrderStatus(adminKey, orderId, newStatus);
        if (success) {
            showToast(`Pedido marcado como ${newStatus}!`, 'success');
        } else {
            showToast('Erro ao atualizar.', 'error');
            loadOrders(); // Revert on error
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4 pb-24">
            <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />

            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm sticky top-0 z-10">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Painel Admin 🔒</h1>
                        <p className="text-xs text-gray-500">Chave ativa</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={loadOrders} className="bg-gray-100 p-3 rounded-full text-xl hover:bg-blue-50 transition">🔄</button>
                        <button onClick={onLogout} className="bg-red-100 p-3 rounded-full text-xl hover:bg-red-200 transition">🚪</button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-blue-500">
                        <p className="text-xs font-bold text-gray-400 uppercase">Total</p>
                        <p className="text-2xl font-bold text-gray-800">{orders.length}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-orange-500">
                        <p className="text-xs font-bold text-gray-400 uppercase">Pendentes</p>
                        <p className="text-2xl font-bold text-orange-500">{orders.filter(o => o.status === 'Pendente').length}</p>
                    </div>
                </div>

                {/* List */}
                <div className="space-y-3">
                    {loading && <p className="text-center text-gray-500 py-10">Carregando pedidos...</p>}

                    {!loading && orders.map(order => (
                        <div key={order.id} className={`bg-white p-4 rounded-2xl shadow-sm border-l-4 ${order.status === 'Pendente' ? 'border-orange-400' : 'border-green-500'} animate-in slide-in-from-bottom-2`}>
                            <div className="flex justify-between mb-2">
                                <span className="font-mono text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">#{order.id.slice(0, 8)}</span>
                                <span className="text-xs font-bold text-gray-600">{new Date(order.date).toLocaleDateString('pt-BR')} {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>

                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-gray-800">{order.customerName}</h3>
                                    <p className="text-sm text-gray-600 mb-1">{order.address}</p>
                                    <p className="text-xs text-[#FF4B82] font-bold">{order.payment} • R$ {order.total.toFixed(2)}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => changeStatus(order.id, order.status)}
                                className={`w-full mt-3 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${order.status === 'Pendente'
                                        ? 'bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200'
                                        : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
                                    }`}
                            >
                                {order.status === 'Pendente' ? '⏳ Marcar como Entregue' : '✅ Pedido Concluído'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
