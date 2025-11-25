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
import FloatingWhatsApp from '../components/ui/FloatingWhatsApp'; // Import new component
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

    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as any, ts: 0 });

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ visible: true, message, type, ts: Date.now() });
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

    const addToCart = (product: any, qtyToAdd = 1) => {
        setCart(prev => {
            const existingItem = prev.find(item => item.id === product.id);
            const currentQty = existingItem ? existingItem.quantity : 0;

            if (currentQty + qtyToAdd > product.estoque) {
                showToast(`Estoque insuficiente! Apenas ${product.estoque} disponíveis.`, 'error');
                return prev;
            }

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

    const handleHeaderAction = () => {
        const action = user?.isGuest ? 'fazer login' : 'sair';
        if (confirm(`Deseja ${action}?`)) {
            localStorage.removeItem('donaCapivaraUser');
            setUser(null);
        }
    };

    const handleSubmitOrder = async (orderData: any) => {
        showToast("Preparando WhatsApp...", "info");

        // 1. Construct Message IMMEDIATELY (Client-side)
        const shortId = Math.random().toString(36).substr(2, 8).toUpperCase();
        const pointsEarned = (!user?.isGuest) ? Math.floor(orderData.total) + (orderData.bonusPoints || 0) : 0;

        let msg = `*Novo Pedido Dona Capivara* 🐹\n`;
        msg += `ID: ${shortId}\n`;
        msg += `----------------\n`;

        orderData.cart.forEach((item: any) => {
            msg += `${item.quantity}x ${item.nome}\n`;
        });

        msg += `\n*Total: R$ ${orderData.total.toFixed(2)}*\n`;
        msg += `Cliente: ${orderData.customer.name}\n`;

        if (orderData.customer.fullAddress) {
            msg += `Endereço: ${orderData.customer.fullAddress}\n`;
        } else {
            msg += `Torre: ${orderData.customer.details.torre} - Apto: ${orderData.customer.details.apto}\n`;
        }

        msg += `Pgto: ${orderData.paymentMethod}\n`;

        if (!user?.isGuest) {
            msg += `✨ Pontos Ganhos: +${pointsEarned}\n`;
            if (orderData.referralCode) msg += `🎟️ Cupom: ${orderData.referralCode}\n`;
        }

        // 2. Generate Link
        const phone = '5541991480096';
        const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;

        // 3. Open WhatsApp (Primary Action)
        // We do this slightly delayed to allow the toast to render, but NOT dependent on API success
        setTimeout(() => {
            window.open(whatsappUrl, '_blank');
        }, 1000);

        // 4. Save to Backend (Background Action)
        // We still try to save, but if it fails, the user has already sent the order via WhatsApp!
        const finalOrder = {
            ...orderData,
            customer: user?.isGuest ? { id: 'GUEST', name: orderData.customer.name } : { ...orderData.customer, id: user.id_Cliente || user.id }
        };

        try {
            await API.submitOrder(finalOrder);
            showToast(`Pedido registrado no sistema!`, 'success');
            setCart([]);
            setActiveTab('home');
        } catch (e) {
            console.error("Backend save failed, but WhatsApp opened", e);
            // We don't show error to user since WhatsApp likely worked
            setCart([]);
            setActiveTab('home');
        }
    };

    if (!user) return <AuthView onLogin={setUser} onGuest={() => setUser({ isGuest: true })} />;

    return (
        <main className="min-h-screen bg-[#F5F6FA] relative">
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.visible}
                onClose={() => setToast({ ...toast, visible: false })}
            />

            {/* ADD FLOATING BUTTON HERE */}
            <FloatingWhatsApp />

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
