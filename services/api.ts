// Keeping all other functions, but providing the full file for safety
import { isSupabaseConfigured, fetchCatalogFromSupabase, supabase } from './supabase';

const API_URL =
    process.env.NEXT_PUBLIC_GOOGLE_SHEET_API_URL ||
    'https://script.google.com/macros/s/AKfycbwNhfinjEKn9Kj0x7RO5gagPm6EgpXESX8o7RNxxs58P80k6JlvyeDVrXqcAN5TwoBYCA/exec';

// 🧠 CACHE VERSION - Incrementar quando houver mudanças importantes no backend
// Isso força todos os clientes a recarregar dados quando necessário
const CACHE_VERSION = '2.0.0';

export const API = {
    supabase,
    isSupabaseConfigured,

    // ========================================
    // CATALOG CACHE - STALE-WHILE-REVALIDATE
    // ========================================
    _catalogCache: null as { data: any; timestamp: number; version: string } | null,
    _catalogTTL: 15 * 60 * 1000, // ⚡ 15 min - dados frescos
    _catalogStaleTTL: 60 * 60 * 1000, // 🔄 1 hora - dados podem ser usados enquanto revalida
    _pendingCatalogFetch: null as Promise<any> | null, // 🧠 SINGLETON PROMISE (Deduplicação)
    _isRevalidating: false, // 🔄 Flag para SWR

    // 🗑️ Função para invalidar cache local (usar após pedido)
    invalidateCatalogCache() {
        console.log('🗑️ [API] Invalidando cache local do catálogo...');
        this._catalogCache = null;
    },

    // 🔄 Revalidação em background (SWR pattern)
    async _revalidateInBackground() {
        try {
            console.log('🔄 [SWR] Iniciando revalidação em background...');
            const data = await this._executeFetchCatalog(false); // Força fetch sem cache
            console.log('✅ [SWR] Cache atualizado em background!');
            return data;
        } catch (error) {
            console.warn('⚠️ [SWR] Falha na revalidação em background:', error);
            // Não propaga erro - revalidação é opcional
        }
    },

    async fetchCatalogData(useCache = true) {
        // 1. Se já existe uma busca em curso, retornar a mesma promessa (Deduplicação)
        if (this._pendingCatalogFetch) {
            console.log('🔄 [API] Requisição em curso detectada. Reutilizando promessa...');
            return this._pendingCatalogFetch;
        }

        this._pendingCatalogFetch = (async () => {
            try {
                return await this._executeFetchCatalog(useCache);
            } finally {
                this._pendingCatalogFetch = null; // Limpa para permitir novas buscas após conclusão
            }
        })();

        return this._pendingCatalogFetch;
    },

    async _executeFetchCatalog(useCache: boolean) {
        // 🧠 SMART CACHE: Detecta se é novo visitante ou versão desatualizada
        if (typeof window !== 'undefined') {
            const isNewVisitor = !localStorage.getItem('donaCapivara_lastVisit');
            const cachedVersion = localStorage.getItem('donaCapivara_cacheVersion');
            const isOutdatedVersion = cachedVersion !== CACHE_VERSION;

            if (isNewVisitor || isOutdatedVersion) {
                console.log(
                    `🆕 [Smart Cache] ${isNewVisitor ? 'Novo visitante' : 'Versão desatualizada'} - Invalida cache local`
                );
                this._catalogCache = null;
                localStorage.setItem('donaCapivara_lastVisit', new Date().toISOString());
                localStorage.setItem('donaCapivara_cacheVersion', CACHE_VERSION);
            }
        }

        // Check internal memory cache with Stale-While-Revalidate
        if (useCache && this._catalogCache) {
            const age = Date.now() - this._catalogCache.timestamp;
            const isVersionValid = this._catalogCache.version === CACHE_VERSION;

            // 🚀 FRESH: Dados dentro do TTL - usar direto
            if (age < this._catalogTTL && isVersionValid) {
                console.log(`⚡ [Cache FRESH] Age: ${Math.round(age / 1000)}s`);
                return this._catalogCache.data;
            }

            // 🔄 STALE-WHILE-REVALIDATE: Dados velhos mas usáveis - retornar E revalidar em background
            if (age < this._catalogStaleTTL && isVersionValid && !this._isRevalidating) {
                console.log(`🔄 [SWR] Retornando dados stale (${Math.round(age / 1000)}s) e revalidando...`);

                // Disparar revalidação em background (não bloqueia)
                this._isRevalidating = true;
                this._revalidateInBackground().finally(() => {
                    this._isRevalidating = false;
                });

                return this._catalogCache.data; // Retorna dados antigos imediatamente
            }
        }

        // 🚀 ESTRATÉGIA: Supabase primeiro (ultra-rápido), GAS como fallback

        // 1️⃣ TENTAR SUPABASE PRIMEIRO (se configurado)
        if (isSupabaseConfigured()) {
            try {
                console.log('⚡ [Supabase] Tentando buscar catálogo...');
                const startTime = Date.now();

                const catalogData = await fetchCatalogFromSupabase();

                const elapsed = Date.now() - startTime;
                console.log(`✅ [Supabase] Catálogo carregado em ${elapsed}ms`);

                // Armazenar no cache local
                this._catalogCache = {
                    data: catalogData,
                    timestamp: Date.now(),
                    version: CACHE_VERSION
                };

                return catalogData;
            } catch (supabaseError: any) {
                console.warn('⚠️ [Supabase] Falha, usando fallback GAS:', supabaseError.message);
                // Continua para o fallback do Google Apps Script
            }
        } else {
            console.log('📁 [Supabase] Não configurado, usando Google Apps Script');
        }

        // 2️⃣ FALLBACK: Google Apps Script (código original)
        let attempts = 0;
        const maxAttempts = 2;
        const timeoutMs = 15000; // ⏱️ Aumentado para 15s (Google Cold Start)

        while (attempts < maxAttempts) {
            attempts++;
            console.log(`🌐 [API] Fetching Catalog (Tentativa ${attempts}/${maxAttempts})...`);

            try {
                if (!API_URL) throw new Error('API URL missing');
                const timestamp = Date.now();
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

                const response = await fetch(`${API_URL}?action=getCatalogData&_t=${timestamp}`, {
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
                const catalogData = await response.json();

                // Validação de dados malformados
                if (!catalogData || (!catalogData.products && !catalogData.categories)) {
                    throw new Error('Malformed catalog data response');
                }

                // Processar produtos
                const products = (catalogData.products || []).map((p: any) => ({
                    id: p.ID_Geladinho,
                    nome: p.Nome_Geladinho || 'Produto sem nome',
                    price: Number(p.Preco_Venda || 0),
                    imagem: p.URL_IMAGEM_CACHE || '',
                    estoque: Number(p[' Estoque_Atual'] || p.Estoque_Atual || 0),
                    categoriaId: p.ID_Categoria,
                    subcategoria: p.Subcategoria || p.ID_Subcategoria || '',
                    hasAdditions: p.Tem_Adicionais || false,
                    descricao: p.Descricao,
                    peso: p.Peso || 'N/A',
                    calorias: p.Calorias || 'N/A',
                    ingredientes: p.Ingredientes || 'N/A',
                    tempo: p.Tempo_Preparo || 'N/A',
                    dataLancamento: p.Data_Lancamento || null
                }));

                const categories = (catalogData.categories || []).map((c: any) => ({
                    id: c.ID_Categoria,
                    nome: c.Nome_Categoria,
                    imagem: c.Imagem_Categoria || ''
                }));

                const banners = (catalogData.banners || []).map((b: any) => ({
                    id: b.id || b.ID_Banner || '',
                    image: b.image || b.URL_Imagem || '',
                    title: b.title || b.Titulo || '',
                    subtitle: b.subtitle || b.Subtitulo || '',
                    ctaText: b.ctaText || b.Texto_CTA || ''
                }));

                const finalData = { products, categories, banners };

                // Store in memory cache
                this._catalogCache = { data: finalData, timestamp: Date.now(), version: CACHE_VERSION };
                console.log(`✅ [API] Sucesso! ${products.length} produtos carregados.`);

                return finalData;
            } catch (error: any) {
                const isTimeout = error.name === 'AbortError';
                console.warn(`⚠️ [API] Falha na tentativa ${attempts}:`, isTimeout ? 'Timeout' : error.message);

                if (attempts < maxAttempts) {
                    console.log('🔄 Aguardando 1s antes do retry...');
                    await new Promise(r => setTimeout(r, 1000));
                    continue;
                }

                // Se todas as tentativas falharem:
                if (this._catalogCache) {
                    console.error('❌ [API] Todas as tentativas falharam. Usando cache expirado de emergência.');
                    return this._catalogCache.data;
                }

                // 🔥 QI 145: Não retornar lista vazia se for erro real de carregamento!
                throw error;
            }
        }
    },

    async login(phone: string, password: string) {
        if (String(phone).toLowerCase().trim() === 'admin' && password.trim() === 'Jxd701852@') {
            return {
                success: true,
                customer: { id: 'ADMIN', name: 'Administrador', isAdmin: true, adminKey: 'Jxd701852@' }
            };
        }
        try {
            const response = await fetch(API_URL + '?action=loginCustomer', {
                method: 'POST',
                body: JSON.stringify({ phone, password })
            });
            const data = await response.json();
            if (data.success && data.customer) {
                const favArray = (data.customer.Favoritos || '').split(',').filter(Boolean);
                data.customer = {
                    id: data.customer.ID_Cliente,
                    name: data.customer.Nome,
                    phone: data.customer.Telefone,
                    points: Number(data.customer.Pontos_Fidelidade || 0),
                    inviteCode: data.customer.Codigo_Convite || '---',
                    favorites: favArray,
                    isGuest: false,
                    savedAddress: {
                        torre: data.customer.Torre || '',
                        apto: data.customer.Apartamento || '',
                        fullAddress: data.customer.Endereco || ''
                    }
                };
            }
            return data;
        } catch (_error) {
            return { success: false, message: 'Erro de conexão' };
        }
    },

    // CRITICAL FIX: Return {orders: [...]} format expected by AdminView
    async getAdminOrders(adminKey: string) {
        console.log('🔍 [API] getAdminOrders chamado com adminKey:', adminKey);
        if (!API_URL) return { orders: [] };
        try {
            const response = await fetch(`${API_URL}?action=getAdminOrders&adminKey=${adminKey}&_t=${Date.now()}`, {
                cache: 'no-store'
            });
            const data = await response.json();

            console.log('🔍 [API] Resposta bruta:', data);
            console.log('🔍 [API] Tipo:', typeof data);
            console.log('🔍 [API] É array?:', Array.isArray(data));

            if (data.error || data.success === false) {
                console.error('❌ [API] Backend retornou erro:', data);
                return { orders: [] };
            }

            const list = data.orders || (Array.isArray(data) ? data : []);
            console.log('✅ [API] Lista de pedidos:', list.length, 'pedidos');

            const normalized = list.map((order: any) => {
                console.log('🔍 Raw order:', order);

                const apto = order.Apartamento_Cliente || order.Ap || order.Apto || order.Apartamento || '-';
                const torre = order.Torre_Cliente || order.Torre || '';
                const address = torre
                    ? `Torre ${torre}, Ap ${apto}`
                    : order.Endereco || order.Endereco_Completo || 'Retirada';

                const customerName =
                    order.Nome_Cliente_Pedido ||
                    order.Nome_Cliente ||
                    order.Cliente ||
                    order.customerName ||
                    order.Nome ||
                    order.nome ||
                    order.Customer_Name ||
                    order.NomeCliente ||
                    'Visitante';

                return {
                    ID_Venda: order.ID_Venda,
                    Data_Venda: order.Data_Venda,
                    Nome_Cliente: customerName,
                    ID_Cliente: order.ID_Cliente || 'GUEST',
                    Taxa_Entrega: Number(order.Taxa_Entrega || order.Entregar || 0),
                    Desconto: Number(order.Desconto || 0),
                    Total_Venda: Number(order.Total_Venda || 0),
                    Status: order.Status || 'Pendente',
                    Forma_Pagamento: order.Forma_de_Pagamento || order.Pagamento || order.Metodo_Pagamento || '-',
                    Endereco: address,
                    Torre: torre,
                    Apartamento: apto,
                    Agendamento: order.Agendamento || ''
                };
            });

            console.log('✅ [API] Retornando {orders: [...]} com', normalized.length, 'pedidos');
            return { orders: normalized };
        } catch (error) {
            console.error('❌ [API] getAdminOrders error:', error);
            return { orders: [] };
        }
    },

    async registerCustomer(userData: any) {
        try {
            const response = await fetch(API_URL + '?action=createCustomer', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
            return await response.json();
        } catch (_e) {
            return { success: false };
        }
    },
    // ========================================
    // COUPON VALIDATION WITH CACHE
    // ========================================

    _couponsCache: new Map<string, { data: any; timestamp: number }>(),
    _couponCacheTTL: 5 * 60 * 1000, // 5 minutes

    async validateCoupon(code: string, useCache = true) {
        const normalizedCode = code.trim().toUpperCase();
        // Check cache first
        if (useCache) {
            const cached = this._couponsCache.get(normalizedCode);
            if (cached && Date.now() - cached.timestamp < this._couponCacheTTL) {
                console.log(`✅ [Cache HIT] Cupom ${normalizedCode} - Validação instantânea!`);
                return cached.data;
            }
        }

        // Fetch from server
        console.log(`🔍 [Cache MISS] Validando cupom ${normalizedCode}`);

        try {
            const response = await fetch(`${API_URL}?action=validateCoupon&code=${normalizedCode}`, {
                signal: AbortSignal.timeout(10000) // 10 second timeout
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();

            // Only cache successful validations
            if (data.success) {
                this._couponsCache.set(normalizedCode, {
                    data,
                    timestamp: Date.now()
                });
                console.log(`✅ [Cache STORE] Cupom ${normalizedCode} armazenado`);
            }

            return data;
        } catch (e) {
            console.error('❌ [Coupon Validation Error]:', e);
            return {
                success: false,
                message:
                    e instanceof Error && e.name === 'TimeoutError'
                        ? 'Timeout ao validar cupom. Tente novamente.'
                        : 'Erro ao validar cupom. Verifique sua conexão.'
            };
        }
    },

    /**
     * 🔥 NOVA FUNÇÃO: Validar cupom com contexto completo
     * Verifica histórico de uso, valor mínimo, etc.
     */
    async validateCouponWithContext(data: { code: string; customerId: string; subtotal: number }) {
        const normalizedCode = data.code.trim().toUpperCase();

        console.log(
            `🔍 [Validação Contextual] Cupom: ${normalizedCode}, Cliente: ${data.customerId}, Subtotal: R$ ${data.subtotal}`
        );

        try {
            // 1️⃣ TENTATIVA SUPABASE RPC (Ultra-rápido)
            if (isSupabaseConfigured() && supabase) {
                try {
                    console.log('⚡ [Supabase] Validando cupom via RPC...');
                    const startTime = Date.now();

                    const { data: rpcResult, error } = await supabase.rpc('validate_coupon', {
                        p_code: normalizedCode,
                        p_customer_id: data.customerId,
                        p_subtotal: data.subtotal
                    });

                    if (!error && rpcResult) {
                        console.log(`✅ [Supabase RPC] Resposta em ${Date.now() - startTime}ms:`, rpcResult);
                        return rpcResult;
                    }
                } catch (rpcError) {
                    console.error('⚠️ [Supabase RPC Exception]:', rpcError);
                }
            }

            // 2️⃣ FALLBACK: GOOGLE APPS SCRIPT
            // 🔧 CORREÇÃO: Google Apps Script lê dados de postData.contents
            const payload = JSON.stringify({
                code: normalizedCode,
                customerId: data.customerId,
                subtotal: data.subtotal
            });

            const response = await fetch(`${API_URL}?action=validateCoupon`, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: payload,
                signal: AbortSignal.timeout(15000)
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const result = await response.json();

            if (result.success) {
                console.log(
                    `✅ [Cupom Válido] Tipo: ${result.type}, Valor: ${result.value}, Tipo Uso: ${result.tipoUso}`
                );
            } else {
                console.warn(`⚠️ [Cupom Inválido] ${result.message}`);
            }

            return result;
        } catch (e) {
            console.error('❌ [Coupon Context Validation Error]:', e);
            return {
                success: false,
                message:
                    e instanceof Error && e.name === 'TimeoutError'
                        ? 'Timeout ao validar cupom. Tente novamente.'
                        : 'Erro ao validar cupom. Verifique sua conexão.'
            };
        }
    },

    /**
     * Prefetch coupon validation (background, non-blocking)
     * Use for optimistic validation
     */
    prefetchCoupon(code: string) {
        this.validateCoupon(code, true).catch(() => {
            // Silent fail - it's just a prefetch
        });
    },

    /**
     * Clear coupon cache
     * @param code - Optional: clear specific coupon, or all if omitted
     */
    clearCouponCache(code?: string) {
        if (code) {
            const normalized = code.trim().toUpperCase();
            this._couponsCache.delete(normalized);
            console.log(`🧹 [Cache CLEAR] Cupom ${normalized} removido`);
        } else {
            this._couponsCache.clear();
            console.log('🧹 [Cache CLEAR] Todos os cupons removidos');
        }
    },

    async calculateDelivery(data: { deliveryType: string; addressData: any; subtotal?: number }) {
        try {
            const response = await fetch(`${API_URL}?action=calculateDelivery`, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (e) {
            console.error('Erro calculo entrega:', e);
            return { success: false, fee: 5, message: 'Erro de conexão' };
        }
    },

    async syncFavorites(phone: string, favorites: string[]) {
        try {
            await fetch(API_URL + '?action=updateFavorites', {
                method: 'POST',
                body: JSON.stringify({ phone, favorites: favorites.join(',') })
            });
        } catch (_e) {
            // Background sync failure is non-critical
        }
    },
    async submitOrder(orderData: any) {
        try {
            // 1. TENTATIVA SUPABASE (Para Realtime e Status 2.0 via n8n)
            if (isSupabaseConfigured() && supabase) {
                const shortId = String(orderData.id || orderData.idVenda || '')
                    .slice(0, 8)
                    .toUpperCase();

                await supabase.from('orders').insert([
                    {
                        short_id: shortId,
                        customer_phone: orderData.userPhone || orderData.customer?.details?.telefone,
                        total: orderData.total,
                        status: 'Aguardando WhatsApp',
                        items: JSON.stringify(orderData.cart),
                        raw_data: orderData
                    }
                ]);
            }

            // 2. ENVIO PADRÃO PARA GOOGLE SHEETS
            const response = await fetch(API_URL + '?action=createOrder', {
                method: 'POST',
                body: JSON.stringify(orderData)
            });
            return await response.json();
        } catch (_e) {
            console.error('❌ [API] Erro ao submeter pedido:', _e);
            return { success: false };
        }
    },

    async getCustomerOrders(customerId: string) {
        try {
            const response = await fetch(`${API_URL}?action=getOrders&customerId=${customerId}&_t=${Date.now()}`);
            const data = await response.json();

            // Suporte a formato { orders: [...] } ou array direto [...]
            const list = data.orders || (Array.isArray(data) ? data : []);

            return list.map((order: any) => ({
                id: order.ID_Venda,
                date: order.Data_Venda,
                total: Number(order.Total_Venda || 0),
                status: order.Status || 'Pendente',
                paymentMethod: order.Forma_de_Pagamento || 'Não informado'
            }));
        } catch (_e) {
            console.error('❌ [API] Erro ao carregar pedidos do cliente:', _e);
            return [];
        }
    },

    async getOrderItems(adminKey: string, orderId: string) {
        try {
            const response = await fetch(
                `${API_URL}?action=getOrderItems&orderId=${orderId}&adminKey=${adminKey}&_t=${Date.now()}`
            );
            return await response.json();
        } catch (_error) {
            return [];
        }
    },
    async getDashboardStats(adminKey: string) {
        try {
            const response = await fetch(`${API_URL}?action=getDashboardStats&adminKey=${adminKey}&_t=${Date.now()}`, {
                cache: 'no-store'
            });
            return await response.json();
        } catch (_e) {
            return null;
        }
    },
    async updateOrderStatus(adminKey: string, orderId: string, newStatus: string) {
        try {
            const response = await fetch(API_URL + '?action=updateOrderStatus', {
                method: 'POST',
                body: JSON.stringify({ adminKey, orderId, newStatus })
            });
            return (await response.json()).success;
        } catch (_e) {
            return false;
        }
    },
    async getExportData(adminKey: string) {
        try {
            const response = await fetch(`${API_URL}?action=getExportData&adminKey=${adminKey}&_t=${Date.now()}`, {
                cache: 'no-store'
            });
            return await response.json();
        } catch (_e) {
            return null;
        }
    },
    async getProductReviews(productId: string) {
        try {
            const response = await fetch(`${API_URL}?action=getReviews&productId=${productId}&_t=${Date.now()}`);
            const data = await response.json();
            return Array.isArray(data) ? data : [];
        } catch (_e) {
            console.error('Error fetching reviews:', _e);
            return [];
        }
    },
    async submitReview(reviewData: any) {
        try {
            const response = await fetch(API_URL + '?action=createReview', {
                method: 'POST',
                body: JSON.stringify(reviewData)
            });
            return await response.json();
        } catch (_e) {
            return { success: false, message: 'Erro de conexão' };
        }
    },
    async clearCacheAndReload() {
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
                await registration.unregister();
            }
        }
        window.location.reload();
    },

    // ========================================
    // GAMIFICATION FUNCTIONS REMOVED
    // ========================================
    // Sistema de raspadinha/roleta foi removido na versão V15.0
    // Funções removidas: spinWheel, getUserPrizes, redeemPrize, getUserSpins, saveScratchPrize
    // Para histórico, ver conversa: c2f372ec-27fb-4e1f-9b61-c3d495f9b260

    // ========================================
    // ADDITIONS SYSTEM API FUNCTIONS
    // ========================================

    /**
     * OPTIMIZED: Get product with additions (now with cache - see line 426)
     * This method has been moved below with caching support
     */

    /**
     * Server-side price calculation and validation
     */
    /**
     * Server-side price calculation and validation
     */
    async calculateItemPrice(data: { productId: string; selectedAdditions: any[]; quantity: number }) {
        try {
            const response = await fetch(API_URL + '?action=calculateItemPrice', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            const result = await response.json();
            return result;
        } catch (e) {
            console.error('Error calculating price:', e);
            return { success: false, error: 'Erro ao calcular preço' };
        }
    },

    // ========================================
    // MIX DE GELADINHOS API FUNCTIONS
    // ========================================

    /**
     * Get mix product with available flavors and addition groups
     */
    async getMixWithFlavorAndAdditions(mixId: string) {
        console.log(`🍪 [API] getMixWithFlavorAndAdditions: ${mixId}`);
        try {
            const response = await fetch(
                `${API_URL}?action=getMixWithFlavorAndAdditions&mixId=${mixId}&_t=${Date.now()}`
            );

            if (!response.ok) {
                console.error(`❌ [API] Error fetching mix: HTTP ${response.status}`);
                return { error: `Erro HTTP ${response.status}` };
            }

            const data = await response.json();
            console.log(`✅ [API] Mix data received:`, data);
            return data;
        } catch (e) {
            console.error('❌ [API] getMixWithFlavorAndAdditions error:', e);
            return { error: 'Erro de conexão com o servidor' };
        }
    },

    /**
     * Validate and calculate mix price on backend
     */
    async calculateMixPrice(data: {
        mixId: string;
        selectedFlavors: string[];
        selectedAdditions: any[];
        quantity: number;
    }) {
        try {
            const response = await fetch(API_URL + '?action=calculateMixPrice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            return result;
        } catch (e) {
            console.error('Error calculating mix price:', e);
            return { success: false, error: 'Erro ao calcular preço do mix' };
        }
    },

    // ✅ ========================================
    // PERFORMANCE OPTIMIZATION - CACHE SYSTEM
    // ========================================

    _additionsCache: new Map<string, { data: any; timestamp: number }>(),
    _cacheTTL: 5 * 60 * 1000, // 5 minutes

    /**
     * Get product with additions (OPTIMIZED with intelligent caching)
     */
    async getProductWithAdditions(productId: string, useCache = true) {
        // Check cache first
        if (useCache) {
            const cached = this._additionsCache.get(productId);
            if (cached && Date.now() - cached.timestamp < this._cacheTTL) {
                console.log(`✅ [Cache HIT] Product ${productId} - Instant load!`);
                return cached.data;
            }
        }

        // Fetch from server
        console.log(`🔍 [Cache MISS] Fetching product ${productId}`);
        const url = `${API_URL}?action=getProductWithAdditions&productId=${productId}&_t=${Date.now()}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            // Store in cache for future requests
            this._additionsCache.set(productId, {
                data,
                timestamp: Date.now()
            });

            return data;
        } catch (error) {
            console.error('Error fetching product additions:', error);
            throw error;
        }
    },

    /**
     * Prefetch product additions (background, non-blocking)
     * Use for hover optimization
     */
    prefetchProductAdditions(productId: string) {
        this.getProductWithAdditions(productId, true).catch(() => {
            // Silent fail - it's just a prefetch
        });
    },

    /**
     * Clear additions cache
     * @param productId - Optional: clear specific product, or all if omitted
     */
    clearAdditionsCache(productId?: string) {
        if (productId) {
            this._additionsCache.delete(productId);
            console.log(`🧹 [Cache CLEAR] Cleared ${productId}`);
        } else {
            this._additionsCache.clear();
            console.log('🧹 [Cache CLEAR] Cleared all cache');
        }
    },

    /**
     * Clear catalog cache
     * Used by Force Update button in ProfileView
     */
    clearCatalogCache() {
        this._catalogCache = null;
        // Também limpa os marcadores de visitante para forçar reload completo
        if (typeof window !== 'undefined') {
            localStorage.removeItem('donaCapivara_lastVisit');
            localStorage.removeItem('donaCapivara_cacheVersion');
        }
        console.log('🧹 [Catalog Cache CLEAR] Cache invalidated + localStorage cleared');
    },

    /**
     * Clear all caches (catalog + coupons + additions)
     * Nuclear option for troubleshooting
     */
    clearAllCaches() {
        this._catalogCache = null;
        this._couponsCache.clear();
        this._additionsCache.clear();
        console.log('🧹 [ALL CACHES CLEARED] Complete cache flush');
    },

    // ========================================
    // PRODUCT VARIANTS SUPPORT
    // ========================================

    /**
     * Get multiple products by their IDs (for variant loading)
     * Uses cached catalog data when available, falls back to direct fetch for hidden products
     */
    async getProductsByIds(productIds: string[]): Promise<any[]> {
        try {
            const results: any[] = [];
            const missingIds: string[] = [];

            // 1. Try to get from cached catalog first
            const catalog = await this.fetchCatalogData(true);
            if (catalog?.products) {
                for (const id of productIds) {
                    const found = catalog.products.find((p: any) => p.id === id || p.ID_Geladinho === id);
                    if (found) {
                        results.push(found);
                    } else {
                        missingIds.push(id);
                    }
                }
            } else {
                missingIds.push(...productIds);
            }

            console.log(`📦 [Variants] Found ${results.length} in cache, ${missingIds.length} missing`);

            // 2. Fetch missing products directly (for hidden products)
            if (missingIds.length > 0) {
                const fetchPromises = missingIds.map(id => this.getProductWithAdditions(id).catch(() => null));
                const fetchedProducts = await Promise.all(fetchPromises);

                for (const product of fetchedProducts) {
                    if (product && !product.error) {
                        // Normalize the product data
                        const normalized = {
                            ...product,
                            id: product.id || product.ID_Geladinho,
                            nome: product.nome || product.Nome_Geladinho,
                            price: Number(product.price || product.Preco_Venda || 0),
                            estoque: Number(product.estoque || product.Estoque_Atual || 0),
                            peso: product.peso || product.Peso,
                            imagem: product.imagem || product.URL_IMAGEM_CACHE
                        };
                        results.push(normalized);
                        console.log(`📦 [Variants] Fetched hidden product: ${normalized.id}`);
                    }
                }
            }

            console.log(`📦 [Variants] Total: ${results.length}/${productIds.length} variants loaded`);
            return results;
        } catch (error) {
            console.error('Error fetching product variants:', error);
            return [];
        }
    },

    // ========================================
    // CINEMA PROMOTION / RAFFLE SYSTEM
    // ========================================

    /**
     * Get customer's raffle numbers and promotion progress
     */
    async getMinhasChances(customerId: string) {
        try {
            const timestamp = Date.now();
            const response = await fetch(`${API_URL}?action=getMinhasChances&customerId=${customerId}&_t=${timestamp}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching raffle chances:', error);
            return {
                success: false,
                numeros: [],
                gastoAtual: 0,
                metaAtual: 18,
                faltam: 18
            };
        }
    },

    // ========================================
    // REFERRAL CODE VALIDATION
    // ========================================

    /**
     * Validate referral code - checks if code exists and if customer hasn't used one before
     * @param code - Referral code to validate
     * @param customerId - ID of the customer trying to use the code
     * @returns { valid: boolean, message: string, alreadyUsed?: boolean }
     */
    async validateReferralCode(
        code: string,
        customerId: string
    ): Promise<{
        valid: boolean;
        message: string;
        alreadyUsed?: boolean;
        ownerName?: string;
    }> {
        try {
            if (!code || !customerId || customerId === 'GUEST') {
                return { valid: false, message: 'Dados inválidos', alreadyUsed: false };
            }

            const timestamp = Date.now();
            const response = await fetch(
                `${API_URL}?action=validateReferralCode&code=${encodeURIComponent(code)}&customerId=${encodeURIComponent(customerId)}&_t=${timestamp}`,
                { cache: 'no-store' }
            );
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error validating referral code:', error);
            return { valid: false, message: 'Erro ao validar código', alreadyUsed: false };
        }
    },

    /**
     * [ADMIN] Get all participants in a promotion/raffle
     */
    async getParticipantesSorteio(promoId: string, adminKey: string) {
        try {
            const timestamp = Date.now();
            const response = await fetch(
                `${API_URL}?action=getParticipantesSorteio&promoId=${promoId}&adminKey=${adminKey}&_t=${timestamp}`,
                { cache: 'no-store' }
            );
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching participants:', error);
            return {
                success: false,
                message: 'Erro ao buscar participantes'
            };
        }
    },

    /**
     * [ADMIN] Perform raffle draw and select winner
     */
    async realizarSorteio(promoId: string, adminKey: string) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'realizarSorteio',
                    promoId,
                    adminKey
                })
            });
            const data = await response.json();
            console.log('🎬 [API] Sorteio realizado:', data);
            return data;
        } catch (error) {
            console.error('Error performing raffle:', error);
            return {
                success: false,
                message: 'Erro ao realizar sorteio'
            };
        }
    },

    /**
     * [ADMIN] Award prize to raffle winner
     */
    async concederPremio(
        sorteioId: string,
        tipoPremio: string,
        adminKey: string,
        valorPremio?: number,
        codigoCupom?: string
    ) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'concederPremio',
                    sorteioId,
                    tipoPremio,
                    valorPremio: valorPremio || 0,
                    codigoCupom: codigoCupom || '',
                    adminKey
                })
            });
            const data = await response.json();
            console.log('🎁 [API] Prêmio concedido:', data);
            return data;
        } catch (error) {
            console.error('Error awarding prize:', error);
            return {
                success: false,
                message: 'Erro ao conceder prêmio'
            };
        }
    }
};
