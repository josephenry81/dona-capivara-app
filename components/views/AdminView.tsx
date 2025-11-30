import React, { useState, useEffect } from 'react';
import { API } from '../../services/api';
import Toast from '../ui/Toast';
import Receipt from '../Receipt';
import html2canvas from 'html2canvas';

interface AdminViewProps {
    onLogout: () => void;
    adminKey: string;
}

export default function AdminView({ onLogout, adminKey }: AdminViewProps) {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as any });

    const [printOrder, setPrintOrder] = useState<any>(null);
    const [printItems, setPrintItems] = useState<any[]>([]);

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ visible: true, message: msg, type });
        setTimeout(() => setToast({ ...toast, visible: false }), 3000);
    };

    const loadOrders = async () => {
        setLoading(true);
        const data = await API.getAdminOrders(adminKey);
        if (data) setOrders(data);
        else { showToast('Erro de autenticação.', 'error'); setTimeout(onLogout, 2000); }
        setLoading(false);
    };

    useEffect(() => { if (adminKey) loadOrders(); }, [adminKey]);

    const changeStatus = async (orderId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'Pendente' ? 'Entregue' : 'Pendente';
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        const success = await API.updateOrderStatus(adminKey, orderId, newStatus);
        if (success) showToast(`Pedido atualizado!`);
        else { showToast('Erro ao atualizar.', 'error'); loadOrders(); }
    };

    const handleGenerateImage = async (order: any) => {
        showToast('Gerando imagem...', 'success');
        const items = await API.getOrderItems(adminKey, order.id);

        if (items && items.length > 0) {
            setPrintOrder(order);
            setPrintItems(items);

            setTimeout(async () => {
                const element = document.getElementById('receipt-content');
                if (element) {
                    try {
                        const canvas = await html2canvas(element, {
                            scale: 3,
                            backgroundColor: '#ffffff',
                            logging: false
                        });

                        const link = document.createElement('a');
                        link.download = `Pedido-${order.customerName}-${order.id.slice(0, 4)}.png`;
                        link.href = canvas.toDataURL('image/png');
                        link.click();

                        showToast('Imagem baixada!', 'success');
                    } catch (err) {
                        console.error(err);
                        showToast('Erro ao criar imagem.', 'error');
                    }
                }
            }, 500);
        } else {
            showToast('Não foi possível carregar itens.', 'error');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4 pb-24">
            <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />

            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm sticky top-0 z-10">
                    <div><h1 className="text-xl font-bold text-gray-800">Painel Admin 🔒</h1></div>
                    <div className="flex gap-2">
                        <button onClick={loadOrders} className="bg-gray-100 p-3 rounded-full text-xl hover:bg-blue-50">🔄</button>
                        <button onClick={onLogout} className="bg-red-100 p-3 rounded-full text-xl hover:bg-red-200">🚪</button>
                    </div>
                </div>

                <div className="space-y-3">
                    {loading && <p className="text-center text-gray-500 py-10">Carregando pedidos...</p>}

                    {!loading && orders.map(order => (
                        <div key={order.id} className={`bg-white p-4 rounded-2xl shadow-sm border-l-4 ${order.status === 'Pendente' ? 'border-orange-400' : 'border-green-500'}`}>
                            <div className="flex justify-between mb-2">
                                <span className="font-mono text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">#{order.id.slice(0, 8)}</span>
                                <span className="text-xs font-bold text-gray-600">{new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>

                            <h3 className="font-bold text-gray-800">{order.customerName}</h3>
                            <p className="text-sm text-gray-600 mb-1">{order.address}</p>
                            {order.scheduling && order.scheduling !== 'Imediata' && (
                                <p className="text-xs font-bold text-blue-600 bg-blue-50 p-1 rounded mb-2 inline-block">📅 {order.scheduling}</p>
                            )}

                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-50">
                                <p className="text-xs text-[#FF4B82] font-bold">{order.payment} • R$ {order.total.toFixed(2)}</p>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleGenerateImage(order)}
                                        className="bg-blue-50 text-blue-600 p-2 rounded-lg hover:bg-blue-100 transition"
                                        title="Baixar Imagem do Pedido"
                                    >
                                        🖨️
                                    </button>

                                    <button
                                        onClick={() => changeStatus(order.id, order.status)}
                                        className={`px-3 py-2 rounded-lg text-xs font-bold uppercase transition ${order.status === 'Pendente' ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                                    >
                                        {order.status === 'Pendente' ? 'Entregar' : 'OK'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Receipt id="receipt-content" order={printOrder} items={printItems} />
        </div>
    );
}
