'use client'; // <--- CRITICAL FIX

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

    // Toast State
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as any, ts: 0 });

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ visible: true, message, type, ts: Date.now() });
    };

    // Initial Load
    useEffect(() => {
        // Auth Persistence
        const savedUser = localStorage.getItem('donaCapivaraUser');
        if (savedUser) {
            try {
                const parsed = JSON.parse(savedUser);
                setUser(parsed);
            } catch (e) { localStorage.removeItem('donaCapivaraUser'); }
        }

        // Data Fetching
        API.fetchCatalogData().then(data => {
            console.log("Catalog Loaded", data);
            setProducts(data.products);
            setCategories(data.categories);
            setBanners(data.banners);
        });
    }, []);

    // --- HANDLERS ---

    const addToCart = (product: any, qtyToAdd = 1) => {
        setCart(prev => {
            const existingItem = prev.find(item => item.id === product.id);
            const currentQty = existingItem ? existingItem.quantity : 0;

            // Stock Validation
            if (currentQty + qtyToAdd > product.estoque) {
                showToast(`Estoque insuficiente! Apenas ${product.estoque} disponíveis.`, 'error');
                return prev;
            }

            // Add/Update Cart
            let newCart;
            if (existingItem) {
                newCart = prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + qtyToAdd } : item);
            } else {
                newCart = [...prev, { ...product, quantity: qtyToAdd }];
            }

            const finalQty = currentQty + qtyToAdd;
            showToast(`Adicionado! (Total: ${finalQty})`, 'success');

            return newCart;
        });
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.id !== productId));
        showToast('Item removido', 'info');
    };

    const toggleFavorite = (productId: string) => {
        setFavorites(prev => {
            if (prev.includes(productId)) {
                showToast('Removido dos favoritos', 'info');
                return prev.filter(id => id !== productId);
            } else {
                showToast('Salvo nos favoritos!', 'success');
                return [...prev, productId];
            }
        });
    };

    const handleSubmitOrder = async (orderData: any) => {
        const finalOrder = {
            ...orderData,
            customer: user?.isGuest ? { id: 'GUEST', name: orderData.customer.name } : { ...orderData.customer, id: user.id_Cliente || user.id }
        };

        showToast("Processando...", "info");

        try {
            const response: any = await API.submitOrder(finalOrder);

            if (response && response.success) {
                const shortId = (response.idVenda || 'PENDENTE').slice(0, 8).toUpperCase();

                // WhatsApp Msg Construction
                let msg = `*Novo Pedido Dona Capivara* 🦫\nID: ${shortId}\n----------------\n`;
                orderData.cart.forEach((item: any) => msg += `${item.quantity}x ${item.nome}\n`);
                msg += `\n*Total: R$ ${orderData.total.toFixed(2)}*\nCliente: ${orderData.customer.name}\n`;

                if (orderData.customer.fullAddress) msg += `Endereço: ${orderData.customer.fullAddress}\n`;
                else msg += `Torre: ${orderData.customer.details.torre} - Apto: ${orderData.customer.details.apto}\n`;

                msg += `Pgto: ${orderData.paymentMethod}\n`;

                if (!user.isGuest) {
                    const pointsEarned = Math.floor(orderData.total) + (orderData.bonusPoints || 0);
                    msg += `💎 Pontos Ganhos: +${pointsEarned}\n`;
                }

                window.open(`https://wa.me/5541991480096?text=${encodeURIComponent(msg)}`, '_blank');

                showToast(`Pedido ${shortId} enviado!`, 'success');
                setCart([]);
                setActiveTab('home');
            } else {
                showToast(response.message || 'Erro ao salvar pedido.', 'error');
            }
        } catch (e) {
            showToast('Erro de conexão.', 'error');
        }
    };

    // --- NEW HANDLER ---
    const handleHeaderAction = () => {
        const action = user?.isGuest ? 'fazer login' : 'sair';
        if (confirm(`Deseja ${action}?`)) {
            localStorage.removeItem('donaCapivaraUser');
            setUser(null);
            // Note: Cart is preserved in state until page reload!
        }
    };

    // --- RENDER ---

    if (!user) return <AuthView onLogin={setUser} onGuest={() => setUser({ isGuest: true })} />;

    return (
        <main className="min-h-screen bg-[#F5F6FA] relative">
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.visible}
                onClose={() => setToast({ ...toast, visible: false })}
            />

            {selectedProduct ? (
                <ProductDetailView
                    product={selectedProduct}
                    onBack={() => setSelectedProduct(null)}
                    onAddToCart={(p, qty) => { addToCart(p, qty); setSelectedProduct(null); }}
                />
            ) : (
                <>
                    {activeTab === 'home' && (
                        <HomeView
                            user={user}
                            products={products}
                            categories={categories}
                            banners={banners}
                            favorites={favorites}
                            onAddToCart={addToCart}
                            onToggleFavorite={toggleFavorite}
                            onProductClick={setSelectedProduct}
                            onHeaderAction={handleHeaderAction}
                        />
                    )}

                    {activeTab === 'favorites' && (
                        <FavoritesView
                            products={products}
                            favorites={favorites}
                            onAddToCart={addToCart}
                            onToggleFavorite={toggleFavorite}
                            onProductClick={setSelectedProduct}
                        />
                    )}

                    {activeTab === 'cart' && (
                        <CartView
                            cart={cart}
                            addToCart={addToCart}
                            removeFromCart={removeFromCart}
                            onSubmitOrder={handleSubmitOrder}
                        />
                    )}

                    {activeTab === 'profile' && !user.isGuest && (
                        <ProfileView
                            user={user}
                            onLogout={() => { localStorage.removeItem('donaCapivaraUser'); setUser(null); }}
                            onNavigate={(view) => setActiveTab(view)}
                        />
                    )}

                    {activeTab === 'orders' && !user.isGuest && (
                        <OrderHistoryView
                            user={user}
                            onBack={() => setActiveTab('profile')}
                        />
                    )}

                    {activeTab !== 'orders' && (
                        <BottomNav
                            activeTab={activeTab}
                            onTabChange={setActiveTab}
                            cartCount={cart.length}
                            favoriteCount={favorites.length}
                            isGuest={user.isGuest}
                        />
                    )}
                </>
            )}
        </main>
    );
}
