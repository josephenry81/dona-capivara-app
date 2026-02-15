import React, { useState, useEffect, useCallback } from 'react';
import { API } from '../../services/api';
import Toast from '../ui/Toast';
import { useModal } from '../ui/Modal';

import Receipt from '../Receipt';
import html2canvas from 'html2canvas';
import StatCard from '../admin/StatCard';
import RevenueChart from '../admin/RevenueChart';
import TopFlavorsChart from '../admin/TopFlavorsChart';

import GoalTracker from '../admin/GoalTracker';
import DeliveryHeatmap from '../admin/DeliveryHeatmap';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminViewProps {
    onLogout: () => void;
    adminKey: string;
}

export default function AdminView({ onLogout, adminKey }: AdminViewProps) {
    const [activeTab, setActiveTab] = useState<'orders' | 'analytics' | 'export'>('orders');
    const [orders, setOrders] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const [printOrder, setPrintOrder] = useState<any>(null);
    const [printItems, setPrintItems] = useState<any[]>([]);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as any });
    const [updatingOrderIds, setUpdatingOrderIds] = useState<Set<string>>(new Set());
    const { confirm, alert: _alert, Modal: CustomModal } = useModal();

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ visible: true, message: msg, type });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    };

    const normalizeOrder = (order: any) => ({
        id: order.ID_Venda,
        status: order.Status || 'Pendente',
        customerName: order.Nome_Cliente || 'Cliente',
        address:
            order.Torre && order.Apartamento
                ? `Torre ${order.Torre} - Apto ${order.Apartamento}`
                : order.Endereco || 'Sem endereço',
        date: order.Data_Venda,
        payment: order.Forma_Pagamento || order.Forma_de_Pagamento || 'N/A',
        total: Number(order.Total_Venda || 0),
        scheduling: order.Agendamento || 'Imediata',
        deliveryFee: Number(order.deliveryFee || 0),
        discount: Number(order.discount || 0)
    });

    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            const [ordersResponse, statsData] = await Promise.all([
                API.getAdminOrders(adminKey),
                API.getDashboardStats(adminKey)
            ]);

            if (ordersResponse?.orders) {
                const normalized = ordersResponse.orders.map(normalizeOrder);
                setOrders(normalized);
            } else {
                showToast('Erro de autenticação', 'error');
                setTimeout(onLogout, 2000);
            }

            if (statsData) setStats(statsData);
        } catch (_error) {
            showToast('Erro ao carregar dados.', 'error');
        } finally {
            setLoading(false);
        }
    }, [adminKey, onLogout]);

    useEffect(() => {
        if (adminKey) loadAll();
    }, [adminKey, loadAll]);

    const changeStatus = async (orderId: string, currentStatus: string) => {
        if (updatingOrderIds.has(orderId)) return;
        setUpdatingOrderIds(prev => new Set(prev).add(orderId));

        const newStatus = currentStatus === 'Pendente' ? 'Entregue' : 'Pendente';

        if (newStatus === 'Entregue') {
            const confirmed = await confirm(
                '✅ Marcar como Entregue?',
                `Tem certeza que o pedido de ${orders.find(o => o.id === orderId)?.customerName} foi entregue?`
            );
            if (!confirmed) {
                setUpdatingOrderIds(prev => {
                    const next = new Set(prev);
                    next.delete(orderId);
                    return next;
                });
                return;
            }
        }

        setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status: newStatus } : o)));
        const success = await API.updateOrderStatus(adminKey, orderId, newStatus);

        setUpdatingOrderIds(prev => {
            const next = new Set(prev);
            next.delete(orderId);
            return next;
        });

        if (success) showToast('Pedido atualizado!');
        else {
            showToast('Erro ao atualizar.', 'error');
            loadAll();
        }
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
                    } catch (_err) {
                        showToast('Erro ao criar imagem.', 'error');
                    }
                }
            }, 500);
        } else {
            showToast('Não foi possível carregar itens.', 'error');
        }
    };

    const handleExportCSV = async () => {
        setLoading(true);
        const data = await API.getExportData(adminKey);
        if (data && data.vendas) {
            const headers = Object.keys(data.vendas[0]).join(',');
            const rows = data.vendas
                .map((v: any) =>
                    Object.values(v)
                        .map(val => `"${val}"`)
                        .join(',')
                )
                .join('\n');
            const csv = `${headers}\n${rows}`;
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('hidden', '');
            a.setAttribute('href', url);
            a.setAttribute('download', `Vendas_DonaCapivara_${new Date().toLocaleDateString()}.csv`);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            showToast('Exportado com sucesso!');
        } else {
            showToast('Erro ao exportar data.', 'error');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 pb-24">
            <CustomModal />
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.visible}
                onClose={() => setToast({ ...toast, visible: false })}
            />

            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-3xl shadow-sm sticky top-0 z-10 border border-gray-100">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Dona Capivara Pro 💎</h1>
                        <div className="flex gap-4 mt-2 text-sm overflow-x-auto pb-1 no-scrollbar">
                            <button
                                onClick={() => setActiveTab('orders')}
                                className={`font-bold transition-all whitespace-nowrap ${activeTab === 'orders' ? 'text-[#FF4B82]' : 'text-gray-400'}`}
                            >
                                📦 Pedidos
                            </button>
                            <button
                                onClick={() => setActiveTab('analytics')}
                                className={`font-bold transition-all whitespace-nowrap ${activeTab === 'analytics' ? 'text-[#FF4B82]' : 'text-gray-400'}`}
                            >
                                📊 Dashboard
                            </button>
                            <button
                                onClick={() => setActiveTab('export')}
                                className={`font-bold transition-all whitespace-nowrap ${activeTab === 'export' ? 'text-[#FF4B82]' : 'text-gray-400'}`}
                            >
                                📤 Exportar
                            </button>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={loadAll}
                            className="bg-gray-100 p-3 rounded-full text-xl hover:scale-110 active:scale-95 transition"
                        >
                            🔄
                        </button>
                        <button
                            onClick={onLogout}
                            className="bg-red-50 p-3 rounded-full text-xl hover:scale-110 active:scale-95 transition"
                        >
                            🚪
                        </button>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'analytics' && stats && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-4"
                        >
                            <div className="grid grid-cols-2 gap-4">
                                <StatCard
                                    title="Receita Real"
                                    value={`R$ ${(stats.totalRevenue || 0).toFixed(2)}`}
                                    icon="💰"
                                    color="#10B981"
                                />
                                <StatCard
                                    title="Lucro Estimado"
                                    value={`R$ ${(stats.totalProfit || 0).toFixed(2)}`}
                                    icon="📈"
                                    color="#4F46E5"
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <GoalTracker
                                    title="Meta de Vendas"
                                    current={stats.goals.currentSales}
                                    target={stats.goals.sales}
                                />
                                <GoalTracker
                                    title="Meta de Lucro"
                                    current={stats.goals.currentProfit}
                                    target={stats.goals.profit}
                                    color="#10B981"
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <RevenueChart data={stats.weeklyChart || []} />
                                <TopFlavorsChart data={stats.topFlavors || []} />
                            </div>

                            <DeliveryHeatmap data={stats.heatmap || []} />
                        </motion.div>
                    )}

                    {activeTab === 'orders' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-3"
                        >
                            {loading && (
                                <p className="text-center text-gray-400 py-10 animate-pulse">Consultando pedidos...</p>
                            )}

                            {!loading && orders.length === 0 && (
                                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100">
                                    <p className="text-6xl mb-4">✨</p>
                                    <p className="text-gray-500 font-bold text-lg">Tudo limpo por aqui!</p>
                                    <p className="text-gray-400 text-sm mt-2">
                                        Novos pedidos aparecerão instantaneamente.
                                    </p>
                                </div>
                            )}

                            {!loading &&
                                orders.length > 0 &&
                                orders.map(order => (
                                    <motion.div
                                        layout
                                        key={order.id}
                                        className={`bg-white p-5 rounded-3xl shadow-sm border-l-4 transition-all ${order.status === 'Pendente' ? 'border-orange-400' : 'border-green-500 hover:shadow-md'}`}
                                    >
                                        <div className="flex justify-between mb-2">
                                            <span className="font-mono text-[10px] text-gray-300 bg-gray-50 px-2 py-1 rounded-full uppercase">
                                                #{order.id.slice(0, 8)}
                                            </span>
                                            <span className="text-xs font-bold text-gray-400">
                                                {new Date(order.date).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>

                                        <h3 className="font-bold text-gray-800 text-lg">{order.customerName}</h3>
                                        <p className="text-sm text-gray-500 mb-1">{order.address}</p>

                                        {order.scheduling && order.scheduling !== 'Imediata' && (
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full mb-3 w-fit">
                                                <span>📅</span> {order.scheduling}
                                            </div>
                                        )}

                                        <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-50">
                                            <div>
                                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">
                                                    Pagamento em {order.payment}
                                                </p>
                                                <p className="text-xl text-[#FF4B82] font-black">
                                                    R$ {order.total.toFixed(2)}
                                                </p>
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleGenerateImage(order)}
                                                    className="bg-blue-50 text-blue-600 p-3 rounded-2xl hover:bg-blue-100 transition active:scale-90"
                                                    title="Baixar Imagem"
                                                >
                                                    🖨️
                                                </button>

                                                <button
                                                    onClick={() => changeStatus(order.id, order.status)}
                                                    disabled={updatingOrderIds.has(order.id)}
                                                    className={`px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95 ${
                                                        updatingOrderIds.has(order.id)
                                                            ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400'
                                                            : order.status === 'Pendente'
                                                              ? 'bg-[#FF4B82] text-white shadow-lg shadow-pink-100'
                                                              : 'bg-green-500 text-white shadow-lg shadow-green-100'
                                                    }`}
                                                >
                                                    {updatingOrderIds.has(order.id)
                                                        ? 'Processando'
                                                        : order.status === 'Pendente'
                                                          ? 'Entregar'
                                                          : 'Entregue ✅'}
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                        </motion.div>
                    )}

                    {activeTab === 'export' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 text-center"
                        >
                            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                                📊
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Exportar Dados</h2>
                            <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                                Baixe todo o histórico de vendas e itens em formato CSV para abrir no Excel ou Planilhas
                                Google.
                            </p>

                            <button
                                onClick={handleExportCSV}
                                disabled={loading}
                                className="w-full bg-green-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-green-100 hover:bg-green-600 transition active:scale-95 disabled:opacity-50"
                            >
                                {loading ? 'Gerando arquivo...' : 'Baixar Relatório Completo (.csv)'}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <Receipt order={printOrder} items={printItems} id="receipt-content" />
        </div>
    );
}
