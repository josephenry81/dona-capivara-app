'use client';
import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import HomeView from '@/components/views/HomeView';
import FavoritesView from '@/components/views/FavoritesView';
import AuthView from '@/components/views/AuthView';
import OrderHistoryView from '@/components/views/OrderHistoryView';
import BottomNav from '@/components/navigation/BottomNav';
import Toast from '@/components/ui/Toast';
import InstallPrompt from '@/components/ui/InstallPrompt';
import LoadingCapybara from '@/components/ui/LoadingCapybara';
import { API } from '@/services/api';
import { useModal } from '@/components/ui/Modal';
import { ReviewService } from '@/services/reviews';
import { OnboardingModal, GuidedTour, HelpButton } from '@/components/onboarding';
import { getHiddenProductIds } from '@/config/productGroups';
import PixPaymentModal from '@/components/modals/PixPaymentModal';

// ⚡ DYNAMIC IMPORTS - Lazy load heavy components
const CartView = dynamic(() => import('@/components/views/CartView'), {
    loading: () => <LoadingCapybara />,
    ssr: false
});

const ProductDetailView = dynamic(() => import('@/components/views/ProductDetailView'), {
    loading: () => <LoadingCapybara />,
    ssr: false
});

const MixGourmetView = dynamic(() => import('@/components/views/MixGourmetView'), {
    loading: () => <LoadingCapybara />,
    ssr: false
});

const AdminView = dynamic(() => import('@/components/views/AdminView'), {
    loading: () => <LoadingCapybara />,
    ssr: false
});

const ProfileView = dynamic(() => import('@/components/views/ProfileView'), {
    loading: () => <LoadingCapybara />,
    ssr: false
});

// 🔧 CONFIGURAÇÃO E CONSTANTES
const WHATSAPP_PHONE = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '5541991480096';
const ORDER_ID_LENGTH = 8;
const LINK_CLEANUP_DELAY_MS = 100;
const LOCALE = 'pt-BR';
const _TIMEZONE = 'America/Sao_Paulo';
const CURRENCY = 'BRL';

declare global {
    interface Window {
        donaCapivaraDebug: any;
    }
}

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
    const [hasError, setHasError] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [_currentOrderId, setCurrentOrderId] = useState<string | null>(null);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as any, ts: 0 });
    const [averageRatings, setAverageRatings] = useState<Record<string, number>>({});

    const { modalState: _modalState, hideModal: _hideModal, confirm, alert, Modal: CustomModal } = useModal();

    // 🎓 ONBOARDING STATES
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [showTour, setShowTour] = useState(false);
    const [onboardingComplete, setOnboardingComplete] = useState(true); // Assume complete until checked

    // 💳 PIX PAYMENT MODAL STATES
    const [isPixModalOpen, setIsPixModalOpen] = useState(false);
    const [pixOrderData, setPixOrderData] = useState<{ amount: number; orderId: string } | null>(null);

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ visible: true, message, type, ts: Date.now() });
    }, []);

    useEffect(() => {
        const savedUser = localStorage.getItem('donaCapivaraUser');

        if (savedUser) {
            try {
                const parsed = JSON.parse(savedUser);
                setUser(parsed);
                if (parsed.favorites) setFavorites(parsed.favorites);
            } catch (_e) {
                localStorage.removeItem('donaCapivaraUser');
            }
        }

        // ✅ REFERRAL LINK DETECTION
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const refCode = params.get('ref');
            if (refCode) {
                localStorage.setItem('donaCapivaraRef', refCode);
                showToast(`🎁 Código ${refCode} aplicado!\nCadastre-se e ganhe +50 pts`, 'success');
                // Limpar URL sem recarregar página
                window.history.replaceState({}, '', window.location.pathname);
            }

            // Check if onboarding is complete
            const onboardingDone = localStorage.getItem('dcap_onboarding_done') === 'true';
            setOnboardingComplete(onboardingDone);
        }

        // ⚡ CARREGAMENTO DE CATÁLOGO: Aguarda dados antes de renderizar
        const loadCatalog = async () => {
            setHasError(false);
            setIsLoading(true);
            try {
                const data = await API.fetchCatalogData();
                const fetchedProducts = data.products || [];

                // 🔒 FILTER: Hide products where mostrar_catalogo = FALSE
                // Also apply productGroups filter as fallback
                const hiddenIds = getHiddenProductIds();
                const visibleProducts = fetchedProducts.filter((p: any) => {
                    const productId = p.id || p.ID_Geladinho;

                    // 1. Check mostrar_catalogo from Supabase (priority)
                    if (p.mostrar_catalogo === false) {
                        return false;
                    }

                    // 2. Fallback: check productGroups config
                    if (hiddenIds.has(productId)) {
                        return false;
                    }

                    return true;
                });
                console.log(`📦 [Catalog] Visible: ${visibleProducts.length}/${fetchedProducts.length}`);

                setProducts(visibleProducts);
                setCategories(data.categories || []);
                setBanners(data.banners || []);

                // 🔄 NEW: Fetch all product ratings in parallel
                ReviewService.getAllAverageRatings().then(ratings => {
                    setAverageRatings(ratings);
                    console.log('⭐ [Ratings] Loaded for', Object.keys(ratings).length, 'products');
                });

                // 🔄 SYNC FAVORITES: Remove IDs that don't exist in current catalog
                if (data && (fetchedProducts.length > 0 || data.categories?.length > 0)) {
                    setFavorites(prev => {
                        const validFavs = prev.filter(id => fetchedProducts.some((p: any) => p.id === id));
                        if (validFavs.length !== prev.length) {
                            console.log(`🧹 cleaned ${prev.length - validFavs.length} orphaned favorites`);
                            // Update localStorage if user is logged in
                            const currentUser = localStorage.getItem('donaCapivaraUser');
                            if (currentUser) {
                                try {
                                    const userObj = JSON.parse(currentUser);
                                    if (!userObj.isGuest) {
                                        const updatedUser = { ...userObj, favorites: validFavs };
                                        localStorage.setItem('donaCapivaraUser', JSON.stringify(updatedUser));
                                    }
                                } catch (_e) {
                                    /* JSON parse failed, ignore */
                                }
                            }
                        }
                        return validFavs;
                    });
                }
            } catch (err) {
                console.error('❌ Erro crítico ao carregar catálogo:', err);
                setHasError(true);
            } finally {
                setIsLoading(false);
            }
        };

        loadCatalog();
    }, [showToast]);

    // ⚡ MEMOIZED: Add to cart function
    const addToCart = useCallback(
        (product: any, qtyToAdd = 1, additions?: any[]) => {
            setCart(prev => {
                // Se additions estiverem presentes, tratar como item único, MESMO que seja o mesmo produto base
                const hasAdditions = additions && additions.length > 0;

                // --- QI 145: VALIDAÇÃO DE ESTOQUE UNIFICADA ---
                // Calcular quanto desse produto já existe no carrinho (com ou sem adicionais)
                const currentInCart = prev
                    .filter(item => item.id === product.id)
                    .reduce((total, item) => total + item.quantity, 0);

                if (currentInCart + qtyToAdd > product.estoque) {
                    showToast(
                        `Estoque insuficiente! Você já tem ${currentInCart} no carrinho e o estoque total é ${product.estoque}.`,
                        'error'
                    );
                    return prev;
                }

                // Para itens com adicionais, sempre criar novo item de carrinho (não agrupar)
                if (hasAdditions) {
                    const additionsSubtotal = additions.reduce((sum: number, a: any) => sum + a.option_price, 0);
                    const unitPrice = product.price + additionsSubtotal;

                    const newItem = {
                        ...product,
                        quantity: qtyToAdd,
                        selected_additions: additions,
                        additions_subtotal: additionsSubtotal,
                        unit_price: unitPrice,
                        cart_item_id: `${product.id}-${Date.now()}` // ID único
                    };

                    showToast(`Adicionado ao carrinho!`, 'success');
                    return [...prev, newItem];
                }

                // Para itens sem adicionais, agrupar se já existir
                const existingSimpleItem = prev.find(item => item.id === product.id && !item.selected_additions);

                showToast(`Adicionado ao carrinho!`, 'success');

                if (existingSimpleItem) {
                    return prev.map(item =>
                        item.id === product.id && !item.selected_additions
                            ? { ...item, quantity: item.quantity + qtyToAdd }
                            : item
                    );
                } else {
                    return [...prev, { ...product, quantity: qtyToAdd }];
                }
            });
        },
        [showToast]
    );

    const decreaseQuantity = (itemToDecrease: any) => {
        setCart(prev => {
            const itemId = itemToDecrease.cart_item_id || itemToDecrease.id;

            return prev
                .map(item => {
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
                })
                .filter(item => item !== null) as any[]; // Remove null entries
        });
    };

    const removeFromCart = (id: string) => setCart(prev => prev.filter(i => (i.cart_item_id || i.id) !== id));

    // ⚡ MEMOIZED: Toggle favorite function
    const toggleFavorite = useCallback(
        (productId: string) => {
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
        },
        [user, showToast]
    );

    // 🍪 HANDLE PRODUCT CLICK - Detects Mix products
    // ⚡ MEMOIZED
    const handleProductClick = useCallback((product: any) => {
        const isMix =
            product.ID_Tipo_Produto === 'TP-003' ||
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
            // Recuperar pedido pendente
            const pendingOrder = localStorage.getItem('donaCapivaraPendingOrder');
            if (pendingOrder) setCurrentOrderId(pendingOrder);
        }
    }, []);

    // 🔧 DEBUGGING: Expose hidden features
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.donaCapivaraDebug = {
                openProduct: (id: string) => {
                    console.log(`🔧 Debug: Opening product ${id}`);
                    handleProductClick({
                        id,
                        nome: 'Carregando...',
                        price: 0,
                        estoque: 999,
                        descricao: 'Carregando...',
                        imagem: '',
                        ID_Tipo_Produto: 'TP-001' // Assume standard product
                    });
                }
            };
            console.log('🔧 Debug tools loaded: run window.donaCapivaraDebug.openProduct("ID")');
        }
    }, [handleProductClick]);

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
        // IDEMPOTENCY GUARD: Previne dupla submissão
        if (isSubmitting) {
            console.warn('⚠️ Pedido já está sendo processado. Ignorando nova tentativa.');
            return;
        }

        // --- 🛡️ VALIDAÇÃO DE LANÇAMENTO (TIMER) ---
        // Previne compra de itens bloqueados (ex: adicionados antes do refresh ou via hack)
        const now = Date.now();
        for (const item of orderData.cart) {
            if (item.dataLancamento) {
                const launchTime = new Date(item.dataLancamento).getTime();
                if (!isNaN(launchTime) && launchTime > now) {
                    showToast(`🚫 "${item.nome}" ainda não foi lançado! Remova-o do carrinho.`, 'error');
                    return;
                }
            }
        }

        // --- QI 145: FINAL SAFETY CHECK (FRONTEND) ---
        // Garante que o estado do carrinho ainda é válido contra o estoque carregado
        for (const item of orderData.cart) {
            if (item.quantity > (item.estoque || 0)) {
                showToast(`Erro Crítico: ${item.nome} excedeu o estoque durante a finalização.`, 'error');
                return;
            }
        }

        setIsSubmitting(true);

        // --- CRITICAL FIX: ID RESOLUTION ---
        const userId = user?.isGuest ? 'GUEST' : user.id || user.ID_Cliente || 'GUEST';

        const finalOrder = {
            ...orderData,
            // Send phone to let backend find the real ID
            userPhone: user?.phone || null,
            customer: {
                ...orderData.customer,
                id: userId // Force correct ID
            }
        };

        showToast('Enviando pedido...', 'info');

        try {
            const response: any = await API.submitOrder(finalOrder);

            if (response && response.success) {
                // Garantir que o ID seja string para evitar erro em .slice() se vier como número
                const rawId = response.idVenda || 'PENDENTE';
                const shortId = String(rawId).slice(0, ORDER_ID_LENGTH).toUpperCase();
                setCurrentOrderId(shortId);
                localStorage.setItem('donaCapivaraPendingOrder', shortId);

                // Helper para sanitizar strings e prevenir quebra de formato

                const sanitize = (str: string) => String(str || '').replace(/[*_~`]/g, '');

                // Helper para formatação de moeda BRL
                const formatCurrency = (value: number) =>
                    new Intl.NumberFormat(LOCALE, {
                        style: 'currency',
                        currency: CURRENCY
                    }).format(value);

                // Construção da mensagem baseada em array
                const msgLines = [];
                msgLines.push(`* NOVO PEDIDO - DONA CAPIVARA *`);
                msgLines.push(`ID: ${shortId}`);
                msgLines.push(`----------------`);

                if (orderData.scheduling && orderData.scheduling !== 'Imediata') {
                    msgLines.push(`>> AGENDADO: ${sanitize(orderData.scheduling)}\n`);
                }

                orderData.cart.forEach((item: any) => {
                    const itemName = sanitize(item.nome || 'Produto');
                    msgLines.push(`${item.quantity}x ${itemName}`);

                    // Detalhes de Sabores (Mix Gourmet)
                    if (item.isMix && item.selected_flavors && item.selected_flavors.length > 0) {
                        msgLines.push(`  *Sabores:*`);
                        item.selected_flavors.forEach((flv: any) => {
                            msgLines.push(`  - ${sanitize(flv.flavor_name || flv.nome || flv)}`);
                        });
                    }

                    // Detalhes de Adicionais
                    if (item.selected_additions && item.selected_additions.length > 0) {
                        if (!item.isMix) msgLines.push(`  \u2022 Base: ${formatCurrency(item.price)}`);
                        item.selected_additions.forEach((add: any) => {
                            msgLines.push(
                                `  \u2022 ${sanitize(add.option_name)} (+${formatCurrency(add.option_price)})`
                            );
                        });
                    }

                    if (item.unit_price && (item.selected_additions?.length > 0 || item.isMix)) {
                        msgLines.push(`  Total Item: ${formatCurrency(item.unit_price * item.quantity)}`);
                    } else if (item.price) {
                        msgLines.push(`  Total Item: ${formatCurrency(item.price * item.quantity)}`);
                    }
                    msgLines.push('');
                });

                msgLines.push(`Total: ${formatCurrency(orderData.total)}`);

                msgLines.push(`Cliente: ${sanitize(orderData.customer.name)}`);

                // Telefone do cliente (especialmente importante para guests)
                if (orderData.customer.details?.telefone) {
                    msgLines.push(`📱 Tel: ${sanitize(orderData.customer.details.telefone)}`);
                }

                // Exibição detalhada de descontos
                if (orderData.couponCode && orderData.couponDiscount > 0) {
                    msgLines.push(
                        `[CUPOM] ${sanitize(orderData.couponCode)}: -${formatCurrency(orderData.couponDiscount)}`
                    );
                }

                if (orderData.pointsDiscount > 0) {
                    msgLines.push(`[PONTOS] Desconto: -${formatCurrency(orderData.pointsDiscount)}`);
                }

                if (orderData.referralCode) {
                    msgLines.push(`[INDICACAO] ${sanitize(orderData.referralCode)}`);
                }

                if (orderData.customer.fullAddress) {
                    msgLines.push(`Endereço: ${sanitize(orderData.customer.fullAddress)}`);
                    if (orderData.customer.details?.complemento) {
                        msgLines.push(`Comp: ${sanitize(orderData.customer.details.complemento)}`);
                    }
                } else if (orderData.customer.details) {
                    const addr = [];
                    if (orderData.customer.details.torre)
                        addr.push(`Torre ${sanitize(orderData.customer.details.torre)}`);
                    if (orderData.customer.details.apto) addr.push(`Apto ${sanitize(orderData.customer.details.apto)}`);
                    msgLines.push(`Endereço: ${addr.join(', ')}`);
                }

                msgLines.push(`Pgto: ${sanitize(orderData.paymentMethod)}`);

                // Observações do cliente
                if (orderData.observacoes && orderData.observacoes.trim()) {
                    msgLines.push(`📝 Obs: ${sanitize(orderData.observacoes)}`);
                }

                // Cálculo de pontos fidelidade
                const earned = userId !== 'GUEST' ? Math.floor(orderData.total) + (orderData.bonusPoints || 0) : 0;

                if (userId !== 'GUEST') {
                    msgLines.push(`[+] Pontos Ganhos: ${earned}`);
                }

                console.log(`✅ Pedido ${shortId} processado com sucesso. Tentando auto-envio...`);

                const encodedMsg = encodeURIComponent(msgLines.join('\n'));
                const _customerPhone = orderData.customer.details?.telefone?.replace(/\D/g, '');

                // 💳 PIX: Mostrar modal com QR Code antes de enviar WhatsApp
                if (orderData.paymentMethod === 'PIX') {
                    setPixOrderData({
                        amount: orderData.total,
                        orderId: shortId
                    });
                    setIsPixModalOpen(true);

                    // Limpar carrinho e atualizar catálogo
                    setCart([]);
                    API.invalidateCatalogCache();
                    API.fetchCatalogData(false).then(data => {
                        if (data?.products) setProducts(data.products);
                    });

                    // Atualizar pontos do usuário
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

                    // Armazenar mensagem para enviar depois
                    localStorage.setItem('dcap_pending_whatsapp_msg', encodedMsg);

                    return; // Não redireciona para WhatsApp ainda
                }

                const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
                try {
                    if (isMobile) {
                        window.location.href = `whatsapp://send?phone=${WHATSAPP_PHONE}&text=${encodedMsg}`;
                    } else {
                        const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodedMsg}`;
                        const link = document.createElement('a');
                        link.href = whatsappUrl;
                        link.target = '_blank';
                        link.rel = 'noopener noreferrer';
                        document.body.appendChild(link);
                        link.click();
                        setTimeout(() => document.body.removeChild(link), LINK_CLEANUP_DELAY_MS);
                    }
                } catch (_linkError) {
                    window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${encodedMsg}`, '_blank');
                }

                alert(
                    '🎉 Pedido Enviado!',
                    `Seu pedido ${shortId} foi enviado com sucesso! Você será redirecionado para o WhatsApp.`,
                    'success'
                );
                setCart([]);
                setActiveTab('home');

                // ⚡ REFRESH CATÁLOGO: Invalidar cache e recarregar produtos com estoque atualizado
                API.invalidateCatalogCache();
                API.fetchCatalogData(false).then(data => {
                    if (data?.products) setProducts(data.products);
                    console.log('🔄 Catálogo atualizado após pedido');
                });

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
            } else {
                showToast(response.message || 'Erro ao salvar.', 'error');
            }
        } catch (e) {
            console.error('❌ Erro ao processar pedido:', e);
            showToast('Erro de conexão. Tente novamente.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogin = (u: any) => {
        console.log('🔑 handleLogin called with:', u);

        // CRITICAL FIX: Persist user to localStorage (including adminKey for admin users)
        setUser(u);
        localStorage.setItem('donaCapivaraUser', JSON.stringify(u));

        if (u.favorites && Array.isArray(u.favorites)) setFavorites(u.favorites);

        console.log('✅ User saved to localStorage:', u);
    };

    // ✅ FIXED: Render Toast before AuthView
    if (!user) {
        return (
            <>
                <CustomModal />
                <Toast
                    message={toast.message}
                    type={toast.type}
                    isVisible={toast.visible}
                    onClose={() => setToast({ ...toast, visible: false })}
                />
                <AuthView onLogin={handleLogin} onGuest={() => setUser({ isGuest: true })} />
            </>
        );
    }

    if (user.isAdmin) {
        return (
            <>
                <CustomModal />
                <AdminView onLogout={handleLogout} adminKey={user.adminKey} />
            </>
        );
    }

    return (
        <main className="min-h-screen bg-[#F5F6FA] relative">
            <CustomModal />
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.visible}
                onClose={() => setToast({ ...toast, visible: false })}
            />
            <InstallPrompt />

            {/* 💳 PIX PAYMENT MODAL */}
            {pixOrderData && (
                <PixPaymentModal
                    isOpen={isPixModalOpen}
                    onClose={() => {
                        setIsPixModalOpen(false);

                        // Enviar WhatsApp após fechar o modal
                        const pendingMsg = localStorage.getItem('dcap_pending_whatsapp_msg');
                        if (pendingMsg) {
                            localStorage.removeItem('dcap_pending_whatsapp_msg');
                            const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
                            if (isMobile) {
                                window.location.href = `whatsapp://send?phone=${WHATSAPP_PHONE}&text=${pendingMsg}`;
                            } else {
                                window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${pendingMsg}`, '_blank');
                            }
                        }

                        setActiveTab('home');
                        setPixOrderData(null);
                        showToast('Pedido enviado! Aguardando confirmação de pagamento.', 'success');
                    }}
                    amount={pixOrderData.amount}
                    orderId={pixOrderData.orderId}
                />
            )}

            {activeMixId ? (
                <MixGourmetView
                    mixId={activeMixId}
                    onBack={() => setActiveMixId(null)}
                    onAddToCart={addMixToCart}
                    onToggleFavorite={toggleFavorite}
                    favorites={favorites}
                />
            ) : selectedProduct ? (
                <ProductDetailView
                    product={selectedProduct}
                    onBack={() => setSelectedProduct(null)}
                    onAddToCart={(p, q, additions) => {
                        addToCart(p, q, additions);
                        setSelectedProduct(null);
                    }}
                    user={user}
                    onToggleFavorite={toggleFavorite}
                    favorites={favorites}
                    averageRatings={averageRatings}
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
                            hasError={hasError}
                            averageRatings={averageRatings}
                            onRetry={() => {
                                // A função loadCatalog já está definida no useEffect,
                                // mas precisamos de uma forma de dispará-la novamente.
                                // Já que ela é definida localmente no useEffect,
                                // o mais simples é expor o trigger de recarga via window
                                // ou simplesmente forçar um estado que dispare o useEffect.
                                // mas o useEffect tem [] como deps.
                                // Melhor: disparar uma função global ou recarregar a página?
                                // Não, vamos apenas disparar a mesma lógica de recarga.
                                window.location.reload();
                            }}
                        />
                    )}
                    {activeTab === 'favorites' && (
                        <FavoritesView
                            products={products}
                            favorites={favorites}
                            onAddToCart={addToCart}
                            onToggleFavorite={toggleFavorite}
                            onProductClick={handleProductClick}
                        />
                    )}
                    {activeTab === 'cart' && (
                        <CartView
                            cart={cart}
                            user={user}
                            addToCart={addToCart}
                            decreaseQuantity={decreaseQuantity}
                            removeFromCart={removeFromCart}
                            onSubmitOrder={handleSubmitOrder}
                        />
                    )}
                    {activeTab === 'profile' && !user.isGuest && (
                        <ProfileView
                            user={user}
                            onLogout={handleLogout}
                            onNavigate={setActiveTab}
                            onUpdateUser={setUser}
                        />
                    )}
                    {activeTab === 'orders' && !user.isGuest && (
                        <OrderHistoryView user={user} onBack={() => setActiveTab('profile')} />
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

            {/* 🎓 SISTEMA DE ONBOARDING */}
            <OnboardingModal onComplete={() => setShowOnboarding(false)} onStartTour={() => setShowTour(true)} />

            <GuidedTour isActive={showTour} onComplete={() => setShowTour(false)} />

            {/* Only show floating HelpButton during onboarding/tour */}
            {(!onboardingComplete || showOnboarding || showTour) && (
                <HelpButton
                    onRestartTutorial={() => {
                        setShowOnboarding(true);
                        // Force remount by clearing and setting
                        setTimeout(() => setShowOnboarding(true), 100);
                    }}
                    whatsappNumber={WHATSAPP_PHONE}
                />
            )}
        </main>
    );
}
