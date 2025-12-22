'use client';
import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import HomeView from '../components/views/HomeView';
import FavoritesView from '../components/views/FavoritesView';
import AuthView from '../components/views/AuthView';
import OrderHistoryView from '../components/views/OrderHistoryView';
import BottomNav from '../components/navigation/BottomNav';
import Toast from '../components/ui/Toast';
import InstallPrompt from '../components/ui/InstallPrompt';
import LoadingCapybara from '../components/ui/LoadingCapybara';
import { API } from '../services/api';
import { useModal } from '../components/ui/Modal';

// ⚡ DYNAMIC IMPORTS - Lazy load heavy components
const CartView = dynamic(() => import('../components/views/CartView'), {
    loading: () => <LoadingCapybara />,
    ssr: false
});

const ProductDetailView = dynamic(() => import('../components/views/ProductDetailView'), {
    loading: () => <LoadingCapybara />,
    ssr: false
});

const MixGourmetView = dynamic(() => import('../components/views/MixGourmetView'), {
    loading: () => <LoadingCapybara />,
    ssr: false
});

const AdminView = dynamic(() => import('../components/views/AdminView'), {
    loading: () => <LoadingCapybara />,
    ssr: false
});

const ProfileView = dynamic(() => import('../components/views/ProfileView'), {
    loading: () => <LoadingCapybara />,
    ssr: false
});


export default function Page() {
    const [user, setUser] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('home');
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [banners, setBanners] = useState<any[]>([]);
    const [cart, setCart] = useState<any[]>([]);
    const [favorites, setFavorites] = useState<string[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [activeMixId, setActiveMixId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as any, ts: 0 });
    const { modalState, hideModal, confirm, alert, Modal: CustomModal } = useModal();

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

        // ✅ REFERRAL LINK DETECTION
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const refCode = params.get('ref');
            if (refCode) {
                localStorage.setItem('donaCapivaraRef', refCode);
                showToast(`🎁 Código ${refCode} aplicado! Cadastre-se para ganhar 50 pontos.`, 'success');
                // Limpar URL sem recarregar página
                window.history.replaceState({}, '', window.location.pathname);
            }
        }

        API.fetchCatalogData().then(data => {
            const fetchedProducts = data.products || [];
            setProducts(fetchedProducts);
            setCategories(data.categories || []);
            setBanners(data.banners || []);
            setIsLoading(false);

            // 🔄 SYNC FAVORITES: Remove IDs that don't exist in current catalog
            // Only sync if we got a valid response (even if empty products/categories)
            if (data && (fetchedProducts.length > 0 || data.categories?.length > 0)) {
                setFavorites(prev => {
                    const validFavs = prev.filter(id => fetchedProducts.some((p: any) => p.id === id));
                    if (validFavs.length !== prev.length) {
                        console.log(`🧹 cleaned ${prev.length - validFavs.length} orphaned favorites`);
                        // Update localStorage if user is logged in
                        if (user && !user.isGuest) {
                            const updatedUser = { ...user, favorites: validFavs };
                            localStorage.setItem('donaCapivaraUser', JSON.stringify(updatedUser));
                        }
                    }
                    return validFavs;
                });
            }
        }).catch(err => {
            console.error('Error loading catalog:', err);
            setIsLoading(false);
        });
    }, [user?.id]);

    // ⚡ MEMOIZED: Add to cart function
    const addToCart = useCallback((product: any, qtyToAdd = 1, additions?: any[]) => {
        setCart(prev => {
            // If additions are present, treat as unique item even if same product
            const hasAdditions = additions && additions.length > 0;

            // For items with additions, always create new cart item (no merging)
            if (hasAdditions) {
                const additionsSubtotal = additions.reduce((sum: number, a: any) => sum + a.option_price, 0);
                const unitPrice = product.price + additionsSubtotal;

                const newItem = {
                    ...product,
                    quantity: qtyToAdd,
                    selected_additions: additions,
                    additions_subtotal: additionsSubtotal,
                    unit_price: unitPrice,
                    cart_item_id: `${product.id}-${Date.now()}` // Unique ID for items with additions
                };

                showToast(`Adicionado ao carrinho!`, 'success');
                return [...prev, newItem];
            }

            // For items without additions, merge as before
            const existingItem = prev.find(item => item.id === product.id && !item.selected_additions);
            const currentQty = existingItem ? existingItem.quantity : 0;
            if (currentQty + qtyToAdd > product.estoque) {
                showToast(`Estoque insuficiente! Apenas ${product.estoque} dispon├¡veis.`, 'error');
                return prev;
            }
            let newCart;
            if (existingItem) newCart = prev.map(item => item.id === product.id && !item.selected_additions ? { ...item, quantity: item.quantity + qtyToAdd } : item);
            else newCart = [...prev, { ...product, quantity: qtyToAdd }];
            showToast(`Adicionado ao carrinho!`, 'success');
            return newCart;
        });
    }, [showToast]);

    const decreaseQuantity = (itemToDecrease: any) => {
        setCart(prev => {
            const itemId = itemToDecrease.cart_item_id || itemToDecrease.id;

            return prev.map(item => {
                const currentId = item.cart_item_id || item.id;

                if (currentId === itemId) {
                    const newQuantity = item.quantity - 1;

                    // If quantity would be 0, filter it out
                    if (newQuantity <= 0) {
                        return null; // Mark for removal
                    }

                    // Return item with decreased quantity
                    return { ...item, quantity: newQuantity };
                }

                return item;
            }).filter(item => item !== null) as any[]; // Remove null entries
        });
    };

    const removeFromCart = (id: string) => setCart(prev => prev.filter(i => (i.cart_item_id || i.id) !== id));

    // ⚡ MEMOIZED: Toggle favorite function
    const toggleFavorite = useCallback((productId: string) => {
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
    }, [user, showToast]);

    // 🍪 HANDLE PRODUCT CLICK - Detects Mix products
    // ⚡ MEMOIZED
    const handleProductClick = useCallback((product: any) => {
        const isMix = product.ID_Tipo_Produto === 'TP-003' ||
            product.id?.includes('MIX') ||
            product.nome?.toLowerCase().includes('mix') ||
            product.type === 'mix';

        if (isMix) {
            let mixId = product.ID_Mix || product.id || 'MIX-001';
            if (mixId === 'MIX-GOURMET') {
                mixId = 'MIX-001';
            }
            console.log('🍪 Opening Mix Gourmet with ID:', mixId);
            setActiveMixId(mixId);
        } else {
            setSelectedProduct(product);
        }
    }, []);

    // 🍪 ADD MIX TO CART
    const addMixToCart = (mixData: any) => {
        console.log('🐝 Adding mix to cart:', mixData);
        const cartItem = {
            id: mixData.id,
            nome: mixData.nome,
            price: mixData.price,
            quantity: mixData.quantity,
            imagem: mixData.imagem || 'https://via.placeholder.com/300x300?text=Mix+Gourmet',
            selected_flavors: mixData.selected_flavors,
            selected_additions: mixData.selected_additions,
            unit_price: mixData.unit_price,
            cart_item_id: mixData.cart_item_id || `mix-${Date.now()}`,
            isMix: true,
            isReadyMade: mixData.isReadyMade || false
        };
        setCart(prev => [...prev, cartItem]);
        showToast(`🍪 Mix adicionado ao carrinho!`, 'success');
        setActiveMixId(null);
    };

    const handleLogout = () => {
        localStorage.removeItem('donaCapivaraUser');
        setUser(null);
        setActiveTab('home');
        setCart([]);
        setFavorites([]);
        setSelectedProduct(null);
        setActiveMixId(null);
        showToast('Até logo! 👋', 'info');
    };

    const handleHeaderAction = async () => {
        const confirmed = await confirm(
            user?.isGuest ? '🔑 Fazer Login?' : '🚪 Sair da Conta?',
            user?.isGuest
                ? 'Você está navegando como visitante. Deseja fazer login para salvar seus favoritos?'
                : 'Tem certeza que deseja sair da sua conta?'
        );

        if (confirmed) {
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
            // Send phone to let backend find the real ID
            userPhone: user?.phone || null,
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

                // Mensagem formatada para WhatsApp
                let msg = `*Novo Pedido Dona Capivara* 🧉%0AID: ${shortId}%0A----------------%0A`;

                // Agendamento (se houver)
                if (orderData.scheduling && orderData.scheduling !== 'Imediata') {
                    msg += `📅 *AGENDADO:* ${orderData.scheduling}%0A%0A`;
                }

                // Itens do pedido
                orderData.cart.forEach((item: any) => {
                    msg += `${item.quantity}x ${item.nome}%0A`;

                    // Mostrar adicionais se existirem
                    if (item.selected_additions && item.selected_additions.length > 0) {
                        msg += `  • Base: R$ ${item.price.toFixed(2)}%0A`;
                        item.selected_additions.forEach((add: any) => {
                            msg += `  • ${add.option_name} (+R$ ${add.option_price.toFixed(2)})%0A`;
                        });
                        if (item.unit_price) {
                            msg += `  Subtotal: R$ ${(item.unit_price * item.quantity).toFixed(2)}%0A`;
                        }
                    } else {
                        // Produto sem adicionais: mostrar preço
                        const itemTotal = item.price * item.quantity;
                        msg += `  R$ ${itemTotal.toFixed(2)}%0A`;
                    }
                    msg += `%0A`;
                });

                // Total
                msg += `%0A*Total: R$ ${orderData.total.toFixed(2)}*%0A`;

                // Cliente
                msg += `Cliente: ${orderData.customer.name}%0A`;

                // Cupom (se houver)
                if (orderData.couponCode && orderData.discountValue > 0) {
                    msg += `🎁 Cupom: ${orderData.couponCode} (-R$ ${orderData.discountValue.toFixed(2)})%0A`;
                }

                // Endereço
                if (orderData.customer.fullAddress) {
                    msg += `Endereço: ${orderData.customer.fullAddress}%0A`;
                } else {
                    msg += `Torre: ${orderData.customer.details.torre} - Apto: ${orderData.customer.details.apto}%0A`;
                }

                // Pagamento
                msg += `Pgto: ${orderData.paymentMethod}%0A`;

                // Pontos ganhos (se não for guest)
                let earned = 0;
                if (userId !== 'GUEST') {
                    earned = Math.floor(orderData.total) + (orderData.bonusPoints || 0);
                    msg += `⭐ Pontos Ganhos: +${earned}%0A`;
                }

                // Detecção de plataforma
                const isAndroid = /Android/.test(navigator.userAgent);
                const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                const phone = '5541991480096';

                if (isAndroid) {
                    // Android: tenta whatsapp:// primeiro (abre direto no app)
                    try {
                        window.location.href = `whatsapp://send?phone=${phone}&text=${msg}`;
                    } catch (e) {
                        // Fallback para wa.me se falhar
                        window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
                    }
                } else if (isIOS) {
                    // iOS: usa wa.me com link temporário
                    const whatsappUrl = `https://wa.me/${phone}?text=${msg}`;
                    const link = document.createElement('a');
                    link.href = whatsappUrl;
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } else {
                    // Desktop/outros: abre wa.me em nova aba
                    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
                }

                alert(
                    '🎉 Pedido Enviado!',
                    `Seu pedido ${shortId} foi enviado com sucesso! Você será redirecionado para o WhatsApp.`,
                    'success'
                );
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
        console.log('🔑 handleLogin called with:', u);

        // CRITICAL FIX: Persist user to localStorage (including adminKey for admin users)
        setUser(u);
        localStorage.setItem('donaCapivaraUser', JSON.stringify(u));

        if (u.favorites && Array.isArray(u.favorites)) setFavorites(u.favorites);

        console.log('✅ User saved to localStorage:', u);
    };

    // Ô£à FIXED: Render Toast before AuthView
    if (!user) {
        return (
            <>
                <CustomModal />
                <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />
                <AuthView onLogin={handleLogin} onGuest={() => setUser({ isGuest: true })} />
            </>
        );
    }

    if (user.isAdmin) {
        return (
            <>
                <CustomModal />
                <AdminView onLogout={() => { localStorage.removeItem('donaCapivaraUser'); setUser(null); }} adminKey={user.adminKey} />
            </>
        );
    }

    return (
        <main className="min-h-screen bg-[#F5F6FA] relative">
            <CustomModal />
            <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />
            <InstallPrompt />

            {activeMixId ? (
                <MixGourmetView
                    mixId={activeMixId}
                    onBack={() => setActiveMixId(null)}
                    onAddToCart={addMixToCart}
                />
            ) : selectedProduct ? (
                <ProductDetailView
                    product={selectedProduct}
                    onBack={() => setSelectedProduct(null)}
                    onAddToCart={(p, q, additions) => { addToCart(p, q, additions); setSelectedProduct(null); }}
                    user={user}
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
                            onProductClick={handleProductClick}
                            onHeaderAction={handleHeaderAction}
                            isLoading={isLoading}
                        />
                    )}
                    {activeTab === 'favorites' && <FavoritesView products={products} favorites={favorites} onAddToCart={addToCart} onToggleFavorite={toggleFavorite} onProductClick={handleProductClick} />}
                    {activeTab === 'cart' && <CartView cart={cart} user={user} addToCart={addToCart} decreaseQuantity={decreaseQuantity} removeFromCart={removeFromCart} onSubmitOrder={handleSubmitOrder} />}
                    {activeTab === 'profile' && !user.isGuest && <ProfileView user={user} onLogout={() => { localStorage.removeItem('donaCapivaraUser'); setUser(null); setFavorites([]); }} onNavigate={setActiveTab} onUpdateUser={setUser} />}
                    {activeTab === 'orders' && !user.isGuest && <OrderHistoryView user={user} onBack={() => setActiveTab('profile')} />}
                    {activeTab !== 'orders' && <BottomNav activeTab={activeTab} onTabChange={setActiveTab} cartCount={cart.length} favoriteCount={favorites.length} isGuest={user.isGuest} />}
                </>
            )}
        </main>
    );
}

