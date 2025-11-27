'use client';
import React, { useState, useEffect } from 'react';
import { API } from '../../services/api';
import Toast from '../../components/ui/Toast';

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [adminKey, setAdminKey] = useState('');
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as any });

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ visible: true, message: msg, type });
        setTimeout(() => setToast({ ...toast, visible: false }), 3000);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const data = await API.getAdminOrders(adminKey);
        setLoading(false);

        if (data) {
            setOrders(data);
            setIsAuthenticated(true);
            localStorage.setItem('capivaraAdminKey', adminKey);
        } else {
            showToast('Senha Mestra incorreta!', 'error');
        }
    };

    useEffect(() => {
        const savedKey = localStorage.getItem('capivaraAdminKey');
        if (savedKey) {
            setAdminKey(savedKey);
            API.getAdminOrders(savedKey).then(data => {
                if (data) { setOrders(data); setIsAuthenticated(true); }
            });
        }
    }, []);

    const refreshOrders = async () => {
        setLoading(true);
        const data = await API.getAdminOrders(adminKey);
        if (data) setOrders(data);
        setLoading(false);
    };

    const changeStatus = async (orderId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'Pendente' ? 'Entregue' : 'Pendente';
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o)); // Optimistic

        const success = await API.updateOrderStatus(adminKey, orderId, newStatus);
        if (success) showToast(`Pedido atualizado para ${newStatus}!`);
        else {
            showToast('Erro ao atualizar.', 'error');
            refreshOrders();
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />
                <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
                    <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Painel Admin 🔒</h1>
                    <input
                        type="password"
                        placeholder="Senha Mestra"
                        value={adminKey}
                        onChange={e => setAdminKey(e.target.value)}
                        className="w-full p-4 border rounded-xl mb-4 text-lg outline-none focus:border-[#FF4B82]"
                    />
                    <button disabled={loading} className="w-full bg-gradient-to-r from-[#FF4B82] to-[#FF9E3D] text-white font-bold py-4 rounded-xl transition">
                        {loading ? 'Verificando...' : 'Acessar Sistema'}
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 pb-24">
            <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />

            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8 sticky top-0 bg-gray-50 py-4 z-10">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Pedidos</h1>
                        <p className="text-gray-500 text-sm">Gestão Dona Capivara</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={refreshOrders} className="bg-white p-3 rounded-full shadow hover:scale-105 transition text-[#FF4B82]">🔄</button>
                        <button onClick={() => { setIsAuthenticated(false); localStorage.removeItem('capivaraAdminKey'); }} className="bg-red-100 text-red-500 p-3 rounded-full shadow hover:scale-105 transition">🚪</button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-blue-400">
                        <p className="text-xs text-gray-400 font-bold uppercase">Total Pedidos</p>
                        <p className="text-2xl font-bold text-gray-800">{orders.length}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-orange-400">
                        <p className="text-xs text-gray-400 font-bold uppercase">Pendentes</p>
                        <p className="text-2xl font-bold text-orange-500">{orders.filter(o => o.status === 'Pendente').length}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {orders.map(order => (
                        <div key={order.id} className={`bg-white p-5 rounded-2xl shadow-sm border-l-8 ${order.status === 'Pendente' ? 'border-orange-400' : 'border-green-500'} flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in slide-in-from-bottom-2`}>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-mono text-xs text-gray-400">#{order.id.slice(0, 8)}</span>
                                    <span className="text-xs font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-500">
                                        {new Date(order.date).toLocaleDateString('pt-BR')} {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <h3 className="font-bold text-lg text-gray-800">{order.customerName}</h3>
                                <p className="text-sm text-gray-500">{order.address}</p>
                                <p className="text-sm font-medium text-[#FF4B82] mt-1">{order.payment} • R$ {order.total.toFixed(2)}</p>
                            </div>

                            <button
                                onClick={() => changeStatus(order.id, order.status)}
                                className={`px-6 py-3 rounded-xl font-bold text-sm shadow-sm transition-all w-full md:w-auto ${order.status === 'Pendente'
                                        ? 'bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100'
                                        : 'bg-green-50 text-green-600 border border-green-200 hover:bg-green-100'
                                    }`}
                            >
                                {order.status === 'Pendente' ? '⏳ Marcar Entregue' : '✅ Concluído'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
