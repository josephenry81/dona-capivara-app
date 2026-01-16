import React, { useState, useEffect, useCallback } from 'react';
import { API } from '../../services/api';
import Toast from '../ui/Toast';
import { useModal } from '../ui/Modal';

import Receipt from '../Receipt';
import html2canvas from 'html2canvas';
import StatCard from '../admin/StatCard';
import RevenueChart from '../admin/RevenueChart';
import TopFlavorsChart from '../admin/TopFlavorsChart';
import CouponLinkGenerator from '../admin/CouponLinkGenerator';

interface AdminViewProps {
    onLogout: () => void;
    adminKey: string;
}

export default function AdminView({ onLogout, adminKey }: AdminViewProps) {
    const [activeTab, setActiveTab] = useState<'orders' | 'analytics' | 'coupons'>('orders');
    const [orders, setOrders] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const [printOrder, setPrintOrder] = useState<any>(null);
    const [printItems, setPrintItems] = useState<any[]>([]);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as any });
    // FIX Bug #7: Estado para rastrear pedidos sendo atualizados
    const [updatingOrderIds, setUpdatingOrderIds] = useState<Set<string>>(new Set());
    const { confirm, alert, Modal: CustomModal } = useModal();


    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ visible: true, message: msg, type });
        // FIX: Usar função updater para evitar closure stale
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    };

    // FIX: Normalizar dados da API para formato esperado
    const normalizeOrder = (order: any) => ({
        id: order.ID_Venda,
        status: order.Status || 'Pendente',
        customerName: order.Nome_Cliente || 'Cliente',
        address: order.Torre && order.Apartamento
            ? `Torre ${order.Torre} - Apto ${order.Apartamento}`
            : (order.Endereco || 'Sem endereço'),
        date: order.Data_Venda,
        payment: order.Forma_Pagamento || 'N/A',
        total: Number(order.Total_Venda || 0),
        scheduling: order.Agendamento || 'Imediata'
    });

    // FIX Bug #5: useCallback para evitar warning de dependência
    const loadAll = useCallback(async () => {
        console.log('🔍 [AdminView] loadAll iniciado');
        console.log('🔍 [AdminView] adminKey recebido:', adminKey);

        setLoading(true);
        try {
            console.log('🔍 [AdminView] Chamando APIs...');
            const [ordersResponse, statsData] = await Promise.all([
                API.getAdminOrders(adminKey),
                API.getDashboardStats(adminKey)
            ]);

            console.log('🔍 [AdminView] ordersResponse:', ordersResponse);
            console.log('🔍 [AdminView] ordersResponse?.orders:', ordersResponse?.orders);
            console.log('🔍 [AdminView] statsData:', statsData);

            // FIX: Backend retorna { orders: [...] }, não [...]
            if (ordersResponse?.orders) {
                console.log('✅ [AdminView] Orders encontrados, normalizando...');
                const normalized = ordersResponse.orders.map(normalizeOrder);
                setOrders(normalized);
                console.log('✅ [AdminView] Orders normalizados:', normalized.length);
            } else {
                console.error('❌ [AdminView] ordersResponse.orders é falsy!');
                console.error('❌ [AdminView] Tipo de ordersResponse:', typeof ordersResponse);
                console.error('❌ [AdminView] ordersResponse completo:', JSON.stringify(ordersResponse));
                showToast('Erro de autenticação', 'error');
                setTimeout(onLogout, 2000);
            }

            if (statsData) setStats(statsData);
        } catch (error) {
            console.error('💥 [AdminView] Erro ao carregar dados:', error);
            showToast('Erro ao carregar dados. Tente novamente.', 'error');
        } finally {
            // FIX: Sempre desativa loading, mesmo em caso de erro
            setLoading(false);
        }
    }, [adminKey, onLogout]); // Dependências necessárias

    // FIX Bug #5: Adicionar loadAll como dependência
    useEffect(() => { if (adminKey) loadAll(); }, [adminKey, loadAll]);

    // FIX Bug #7: Prevenir múltiplos cliques com loading state
    const changeStatus = async (orderId: string, currentStatus: string) => {
        // Previne cliques múltiplos
        if (updatingOrderIds.has(orderId)) return;

        // Adiciona ID ao set de pedidos sendo atualizados
        setUpdatingOrderIds(prev => new Set(prev).add(orderId));

        const newStatus = currentStatus === 'Pendente' ? 'Entregue' : 'Pendente';

        // Custom confirmation for delivery
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

        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

        const success = await API.updateOrderStatus(adminKey, orderId, newStatus);

        // Remove ID do set após conclusão
        setUpdatingOrderIds(prev => {
            const next = new Set(prev);
            next.delete(orderId);
            return next;
        });

        if (success) showToast('Pedido atualizado!');
        else { showToast('Erro ao atualizar.', 'error'); loadAll(); }
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
                        // FIX: Usar campos normalizados
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
            <CustomModal />
            <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />

            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm sticky top-0 z-10">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Painel Admin 🔒</h1>
                        <div className="flex gap-4 mt-2 text-sm">
                            <button
                                onClick={() => setActiveTab('orders')}
                                className={`font-bold ${activeTab === 'orders' ? 'text-[#FF4B82]' : 'text-gray-400'}`}
                            >
                                📦 Pedidos
                            </button>
                            <button
                                onClick={() => setActiveTab('analytics')}
                                className={`font-bold ${activeTab === 'analytics' ? 'text-[#FF4B82]' : 'text-gray-400'}`}
                            >
                                📊 Relatórios
                            </button>
                            <button
                                onClick={() => setActiveTab('coupons')}
                                className={`font-bold ${activeTab === 'coupons' ? 'text-[#FF4B82]' : 'text-gray-400'}`}
                            >
                                🎟️ Cupons
                            </button>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={loadAll} className="bg-gray-100 p-3 rounded-full text-xl hover:bg-blue-50">🔄</button>
                        <button onClick={onLogout} className="bg-red-100 p-3 rounded-full text-xl hover:bg-red-200">🚪</button>
                    </div>
                </div>

                {activeTab === 'analytics' && stats && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <StatCard
                                title="Faturamento Total"
                                value={`R$ ${(stats.totalRevenue || 0).toFixed(2)}`}
                                icon="💰"
                                color="#10B981"
                            />
                            <StatCard
                                title="Ticket Médio"
                                value={`R$ ${(stats.avgTicket || 0).toFixed(2)}`}
                                icon="🎫"
                                color="#4F46E5"
                            />
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <RevenueChart data={stats.weeklyChart || []} />
                            <TopFlavorsChart data={stats.topFlavors || []} />
                        </div>
                    </div>
                )}

                {activeTab === 'coupons' && (
                    <div className="space-y-4">
                        <CouponLinkGenerator />

                        {/* Dicas de uso */}
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-2xl border border-purple-100">
                            <h4 className="font-bold text-purple-800 mb-2 flex items-center gap-2">
                                <span>💡</span> Dica Rápida
                            </h4>
                            <p className="text-sm text-purple-700">
                                Compartilhe links de cupom nas suas redes sociais ou grupos de WhatsApp.
                                Quando o cliente clicar, o desconto é aplicado automaticamente no carrinho!
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div className="space-y-3">
                        {loading && <p className="text-center text-gray-500 py-10">Carregando pedidos...</p>}

                        {/* FIX: Adicionar estado vazio */}
                        {!loading && orders.length === 0 && (
                            <div className="text-center py-20">
                                <p className="text-6xl mb-4">📦</p>
                                <p className="text-gray-500 font-bold text-lg">Nenhum pedido encontrado</p>
                                <p className="text-gray-400 text-sm mt-2">Os pedidos aparecerão aqui quando forem realizados</p>
                            </div>
                        )}

                        {!loading && orders.length > 0 && orders.map(order => (
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
                                            disabled={updatingOrderIds.has(order.id)}
                                            className={`px-3 py-2 rounded-lg text-xs font-bold uppercase transition ${updatingOrderIds.has(order.id)
                                                ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-500'
                                                : order.status === 'Pendente'
                                                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                }`}
                                        >
                                            {updatingOrderIds.has(order.id)
                                                ? '⏳'
                                                : order.status === 'Pendente' ? 'Entregar' : 'OK'
                                            }
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Receipt order={printOrder} items={printItems} id="receipt-content" />
        </div>
    );
}
