'use client';

import React, { useState, useEffect } from 'react';
import HomeView from '../components/views/HomeView';
import CartView from '../components/views/CartView';
import ProfileView from '../components/views/ProfileView';
import FavoritesView from '../components/views/FavoritesView';
import AuthView from '../components/views/AuthView';
import OrderHistoryView from '../components/views/OrderHistoryView';
import ProductDetailView from '../components/views/ProductDetailView';
import BottomNav from '../components/navigation/BottomNav';
import Toast from '../components/ui/Toast';
import { API } from '../services/api';

export default function Page() {
    const [user, setUser] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('home');
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [banners, setBanners] = useState<any[]>([]);
    const [cart, setCart] = useState<any[]>([]);
    const [favorites, setFavorites] = useState<string[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as any });

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ visible: true, message, type });
    };

    useEffect(() => {
        const savedUser = localStorage.getItem('donaCapivaraUser');
        if (savedUser) {
            try { setUser(JSON.parse(savedUser)); } catch (e) { localStorage.removeItem('donaCapivaraUser'); }
        }
        API.fetchCatalogData().then(data => {
            setProducts(data.products);
            setCategories(data.categories);
            setBanners(data.banners);
        });
    }, []);

    const addToCart = (product: any, qty = 1) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing && (existing.quantity + qty > product.estoque)) {
                showToast('Estoque insuficiente!', 'error'); return prev;
            }
            showToast('Adicionado ao carrinho!', 'success');
            if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + qty } : item);
            return [...prev, { ...product, quantity: qty }];
        });
    };

    const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));
    const toggleFavorite = (id: string) => setFavorites(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

    const handleHeaderAction = () => {
        const action = user?.isGuest ? 'fazer login' : 'sair';
        if (confirm(`Deseja ${action}?`)) {
            localStorage.removeItem('donaCapivaraUser');
            setUser(null);
        }
    };

    const handleSubmitOrder = async (orderData: any) => {
        const finalOrder = {
            ...orderData,
            customer: user?.isGuest ? { id: 'GUEST', name: orderData.customer.name } : { ...orderData.customer, id: user.id_Cliente || user.id }
        };

        showToast("Enviando pedido...", "info");

        try {
            const response: any = await API.submitOrder(finalOrder);

            if (response && response.success) {
                const shortId = (response.idVenda || 'PENDENTE').slice(0, 8).toUpperCase();
                let msg = `*Novo Pedido Dona Capivara* 🐹\nID: ${shortId}\n----------------\n`;
                orderData.cart.forEach((item: any) => msg += `${item.quantity}x ${item.nome}\n`);
                msg += `\n*Total: R$ ${orderData.total.toFixed(2)}*\nCliente: ${orderData.customer.name}\n`;
                if (orderData.customer.fullAddress) msg += `Endereço: ${orderData.customer.fullAddress}\n`;
                else msg += `Torre: ${orderData.customer.details.torre} - Apto: ${orderData.customer.details.apto}\n`;
                msg += `Pgto: ${orderData.paymentMethod}\n`;
                if (!user.isGuest) {
                    const pointsEarned = Math.floor(orderData.total) + (orderData.bonusPoints || 0);
                    msg += `✨ Pontos Ganhos: +${pointsEarned}\n`;
                }

                window.open(`https://wa.me/5541991480096?text=${encodeURIComponent(msg)}`, '_blank');
                showToast(`Pedido ${shortId} enviado!`, 'success');
                setCart([]);
                setActiveTab('home');
            } else {
                showToast(response.message || 'Erro ao salvar pedido.', 'error');
            }
        } catch (e) { showToast('Erro de conexão.', 'error'); }
    };

    if (!user) return <AuthView onLogin={setUser} onGuest={() => setUser({ isGuest: true })} />;

    return (
        <main className="min-h-screen bg-[#F5F6FA] relative">
            <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />

            {/* FLOATING BUTTON REMOVED FROM HERE */}

            {selectedProduct ? (
                <ProductDetailView
                    product={selectedProduct}
                    onBack={() => setSelectedProduct(null)}
                    onAddToCart={(p, q) => { addToCart(p, q); setSelectedProduct(null); }}
                />
            ) : (
                <>
                    {activeTab === 'home' && (
                        <HomeView
                            user={user} products={products} categories={categories} banners={banners} favorites={favorites}
                            onAddToCart={addToCart} onToggleFavorite={toggleFavorite} onProductClick={setSelectedProduct}
                            onHeaderAction={handleHeaderAction}
                        />
                    )}

                    {activeTab === 'favorites' && (
                        <FavoritesView products={products} favorites={favorites} onAddToCart={addToCart} onToggleFavorite={toggleFavorite} onProductClick={setSelectedProduct} />
                    )}

                    {activeTab === 'cart' && (
                        <CartView cart={cart} addToCart={addToCart} removeFromCart={removeFromCart} onSubmitOrder={handleSubmitOrder} />
                    )}

                    {activeTab === 'profile' && !user.isGuest && (
                        <ProfileView user={user} onLogout={() => { localStorage.removeItem('donaCapivaraUser'); setUser(null); }} onNavigate={setActiveTab} />
                    )}

                    {activeTab === 'orders' && !user.isGuest && (
                        <OrderHistoryView user={user} onBack={() => setActiveTab('profile')} />
                    )}

                    {activeTab !== 'orders' && (
                        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} cartCount={cart.length} favoriteCount={favorites.length} isGuest={user.isGuest} />
                    )}
                </>
            )}
        </main>
    );
}
