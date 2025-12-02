'use client';
import React, { useState, useEffect } from 'react';
import HomeView from '../components/views/HomeView';
import CartView from '../components/views/CartView';
import ProfileView from '../components/views/ProfileView';
import FavoritesView from '../components/views/FavoritesView';
import AuthView from '../components/views/AuthView';
import OrderHistoryView from '../components/views/OrderHistoryView';
import ProductDetailView from '../components/views/ProductDetailView';
import AdminView from '../components/views/AdminView';
import BottomNav from '../components/navigation/BottomNav';
import Toast from '../components/ui/Toast';
import InstallPrompt from '../components/ui/InstallPrompt';
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
            try {
                const parsed = JSON.parse(savedUser);
                setUser(parsed);
                if (parsed.favorites) setFavorites(parsed.favorites);
            } catch (e) { localStorage.removeItem('donaCapivaraUser'); }
        }

        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const refCode = params.get('ref');
            if (refCode) localStorage.setItem('donaCapivaraRef', refCode);
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
            if (existingItem) newCart = prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + qtyToAdd } : item);
            else newCart = [...prev, { ...product, quantity: qtyToAdd }];
            showToast(`Adicionado ao carrinho!`, 'success');
            return newCart;
        });
    };

    const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));

    const toggleFavorite = (productId: string) => {
        setFavorites(prev => {
            let newFavs;
            if (prev.includes(productId)) {
                showToast('Removido dos favoritos', 'info');
                newFavs = prev.filter(id => id !== productId);
            } else {
                showToast('Salvo nos favoritos!', 'success');
                newFavs = [...prev, productId];
            }
            if (user && !user.isGuest) {
                API.syncFavorites(user.phone, newFavs);
                const updated = { ...user, favorites: newFavs };
                setUser(updated);
                localStorage.setItem('donaCapivaraUser', JSON.stringify(updated));
            }
            return newFavs;
        });
    };

    const handleHeaderAction = () => {
        if (confirm(`Deseja ${user?.isGuest ? 'fazer login' : 'sair'}?`)) {
            localStorage.removeItem('donaCapivaraUser');
            setUser(null);
            setFavorites([]);
        }
    };

    const handleSubmitOrder = async (orderData: any) => {
        // --- CRITICAL FIX: ID RESOLUTION ---
        const userId = user?.isGuest ? 'GUEST' : (user.id || user.ID_Cliente || 'GUEST');

        const finalOrder = {
            ...orderData,
            customer: {
                ...orderData.customer,
                id: userId // Force correct ID
            }
        };

        showToast("Enviando pedido...", "info");

        try {
            const response: any = await API.submitOrder(finalOrder);

            if (response && response.success) {
                const shortId = (response.idVenda || 'PENDENTE').slice(0, 8).toUpperCase();

                let msg = `*Novo Pedido Dona Capivara* 🐹\nID: ${shortId}\n----------------\n`;
                if (orderData.scheduling && orderData.scheduling !== 'Imediata') msg += `📅 *AGENDADO:* ${orderData.scheduling}\n\n`;

                orderData.cart.forEach((item: any) => msg += `${item.quantity}x ${item.nome}\n`);
                msg += `\n*Total: R$ ${orderData.total.toFixed(2)}*\nCliente: ${orderData.customer.name}\n`;

                if (orderData.discountValue > 0) msg += `🎁 Desconto: R$ ${orderData.discountValue.toFixed(2)}\n`;

                if (orderData.customer.fullAddress) msg += `Endereço: ${orderData.customer.fullAddress}\n`;
                else msg += `Torre: ${orderData.customer.details.torre} - Apto: ${orderData.customer.details.apto}\n`;

                msg += `Pgto: ${orderData.paymentMethod}\n`;

                let earned = 0;
                if (userId !== 'GUEST') {
                    earned = Math.floor(orderData.total) + (orderData.bonusPoints || 0);
                    msg += `✨ Pontos Ganhos: +${earned}\n`;
                }

                window.open(`https://wa.me/5541991480096?text=${encodeURIComponent(msg)}`, '_blank');

                showToast(`Pedido ${shortId} enviado!`, 'success');
                setCart([]);
                setActiveTab('home');

                if (userId !== 'GUEST') {
                    const redeemed = Number(orderData.pointsRedeemed || 0);
                    const currentPts = Number(user.points || 0);
                    const updatedUser = {
                        ...user,
                        points: Math.max(0, currentPts + earned - redeemed),
                        savedAddress: orderData.customer.details
                    };
                    setUser(updatedUser);
                    localStorage.setItem('donaCapivaraUser', JSON.stringify(updatedUser));
                }

            } else { showToast(response.message || 'Erro ao salvar.', 'error'); }
        } catch (e) { showToast('Erro de conexão.', 'error'); }
    };

    const handleLogin = (u: any) => {
        setUser(u);
        if (u.favorites && Array.isArray(u.favorites)) setFavorites(u.favorites);
    };

    if (!user) return <AuthView onLogin={handleLogin} onGuest={() => setUser({ isGuest: true })} />;

    if (user.isAdmin) {
        return <AdminView onLogout={() => { localStorage.removeItem('donaCapivaraUser'); setUser(null); }} adminKey={user.adminKey} />;
    }

    return (
        <main className="min-h-screen bg-[#F5F6FA] relative">
            <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />
            <InstallPrompt />

            {selectedProduct ? (
                <ProductDetailView product={selectedProduct} onBack={() => setSelectedProduct(null)} onAddToCart={(p, q) => { addToCart(p, q); setSelectedProduct(null); }} />
            ) : (
                <>
                    {activeTab === 'home' && <HomeView user={user} products={products} categories={categories} banners={banners} favorites={favorites} onAddToCart={addToCart} onToggleFavorite={toggleFavorite} onProductClick={setSelectedProduct} onHeaderAction={handleHeaderAction} />}
                    {activeTab === 'favorites' && <FavoritesView products={products} favorites={favorites} onAddToCart={addToCart} onToggleFavorite={toggleFavorite} onProductClick={setSelectedProduct} />}
                    {activeTab === 'cart' && <CartView cart={cart} user={user} addToCart={addToCart} removeFromCart={removeFromCart} onSubmitOrder={handleSubmitOrder} />}
                    {activeTab === 'profile' && !user.isGuest && <ProfileView user={user} onLogout={() => { localStorage.removeItem('donaCapivaraUser'); setUser(null); setFavorites([]); }} onNavigate={setActiveTab} onUpdateUser={setUser} />}
                    {activeTab === 'orders' && !user.isGuest && <OrderHistoryView user={user} onBack={() => setActiveTab('profile')} />}
                    {activeTab !== 'orders' && <BottomNav activeTab={activeTab} onTabChange={setActiveTab} cartCount={cart.length} favoriteCount={favorites.length} isGuest={user.isGuest} />}
                </>
            )}
        </main>
    );
}
