// Keeping all other functions, but providing the full file for safety
const API_URL = process.env.NEXT_PUBLIC_GOOGLE_SHEET_API_URL || '';

// 🧠 CACHE VERSION - Incrementar quando houver mudanças importantes no backend
// Isso força todos os clientes a recarregar dados quando necessário
const CACHE_VERSION = '1.0.0';

export const API = {

    // ========================================
    // CATALOG CACHE (30 min TTL) - ⚡ OTIMIZADO
    // ========================================
    _catalogCache: null as { data: any; timestamp: number; version: string } | null,
    _catalogTTL: 30 * 60 * 1000, // 30 minutes (aumentado de 10min)

    async fetchCatalogData(useCache = true) {
        // 🧠 SMART CACHE: Detecta se é novo visitante ou versão desatualizada
        // Só executa no cliente (não no SSR)
        if (typeof window !== 'undefined') {
            const isNewVisitor = !localStorage.getItem('donaCapivara_lastVisit');
            const cachedVersion = localStorage.getItem('donaCapivara_cacheVersion');
            const isOutdatedVersion = cachedVersion !== CACHE_VERSION;

            // Se é novo visitante ou versão desatualizada, força reload
            if (isNewVisitor || isOutdatedVersion) {
                console.log(`🆕 [Smart Cache] ${isNewVisitor ? 'Novo visitante detectado' : 'Versão desatualizada'} - Forçando reload...`);
                this._catalogCache = null; // Invalida cache
                localStorage.setItem('donaCapivara_lastVisit', new Date().toISOString());
                localStorage.setItem('donaCapivara_cacheVersion', CACHE_VERSION);
            }
        }

        // Check cache first
        if (useCache && this._catalogCache) {
            const age = Date.now() - this._catalogCache.timestamp;
            const isVersionValid = this._catalogCache.version === CACHE_VERSION;

            if (age < this._catalogTTL && isVersionValid) {
                console.log(`⚡ [Catalog Cache HIT] Age: ${Math.round(age / 1000)}s - Instant load!`);
                return this._catalogCache.data;
            } else {
                const reason = !isVersionValid ? 'Versão desatualizada' : `Expirado (${Math.round(age / 1000)}s)`;
                console.log(`🔄 [Catalog Cache EXPIRED] ${reason} - Refetching...`);
            }
        }

        // 🚀 OTIMIZAÇÃO: Usar endpoint consolidado ao invés de 3 chamadas separadas
        console.log('🌐 [Catalog Cache MISS] Fetching from Google Sheets...');
        try {
            if (!API_URL) throw new Error("API URL missing");
            const timestamp = Date.now();

            // Uma única chamada ao invés de 3! + Timeout de 8s
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 segundos

            const response = await fetch(`${API_URL}?action=getCatalogData&_t=${timestamp}`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            const catalogData = await response.json();

            console.log('🔍 [API] Raw catalog data:', JSON.stringify(catalogData).substring(0, 500) + '...');

            if (!catalogData || (!catalogData.products && !catalogData.categories)) {
                console.error('❌ [API] Malformed catalog data response:', catalogData);
                return { products: [], categories: [], banners: [] };
            }

            // Processar produtos
            const products = (catalogData.products || []).map((p: any) => {
                const imagemUrl = p.URL_IMAGEM_CACHE || '';

                if (imagemUrl && !imagemUrl.startsWith('http')) {
                    console.warn(`⚠️ [Image Debug] Imagem inválida para "${p.Nome_Geladinho}":`, imagemUrl);
                }

                return {
                    id: p.ID_Geladinho,
                    nome: p.Nome_Geladinho || 'Produto sem nome',
                    price: Number(p.Preco_Venda || 0),
                    imagem: imagemUrl,
                    estoque: Number(p[' Estoque_Atual'] || p.Estoque_Atual || 0),
                    categoriaId: p.ID_Categoria,
                    descricao: p.Descricao,
                    peso: p.Peso || 'N/A',
                    calorias: p.Calorias || 'N/A',
                    ingredientes: p.Ingredientes || 'N/A',
                    tempo: p.Tempo_Preparo || 'N/A'
                };
            });

            // Processar categorias
            const categories = (catalogData.categories || []).map((c: any) => ({
                id: c.ID_Categoria,
                nome: c.Nome_Categoria
            }));

            // Processar banners
            const banners = (catalogData.banners || []).map((b: any) => ({
                id: b.id || b.ID_Banner || '',
                image: b.image || b.URL_Imagem || '',
                title: b.title || b.Titulo || '',
                subtitle: b.subtitle || b.Subtitulo || '',
                ctaText: b.ctaText || b.Texto_CTA || ''
            }));

            console.log(`✅ [API] ${products.length} produtos, ${categories.length} categorias, ${banners.length} banners`);

            const finalData = { products, categories, banners };

            // Store in cache with version
            this._catalogCache = {
                data: finalData,
                timestamp: Date.now(),
                version: CACHE_VERSION
            };
            console.log(`✅ [Catalog Cache STORED] Version ${CACHE_VERSION} - Valid for 30 minutes`);

            return finalData;
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.error('⏱️ [API] Timeout: Requisição demorou mais de 8s');
            } else {
                console.error('❌ [API] Error fetching catalog:', error);
            }

            // Se tiver cache antigo, retornar ele mesmo expirado
            if (this._catalogCache) {
                console.warn('⚠️ [API] Usando cache expirado como fallback');
                return this._catalogCache.data;
            }

            return { products: [], categories: [], banners: [] };
        }
    },

    async login(phone: string, password: string) {
        if (String(phone).toLowerCase().trim() === 'admin' && password.trim() === 'Jxd701852@') {
            return { success: true, customer: { id: 'ADMIN', name: 'Administrador', isAdmin: true, adminKey: 'Jxd701852@' } };
        }
        try {
            const response = await fetch(API_URL + '?action=loginCustomer', { method: 'POST', body: JSON.stringify({ phone, password }) });
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
        } catch (error) { return { success: false, message: "Erro de conexão" }; }
    },

    // CRITICAL FIX: Return {orders: [...]} format expected by AdminView
    async getAdminOrders(adminKey: string) {
        console.log('🔍 [API] getAdminOrders chamado com adminKey:', adminKey);
        if (!API_URL) return { orders: [] };
        try {
            const response = await fetch(`${API_URL}?action=getAdminOrders&adminKey=${adminKey}&_t=${Date.now()}`, { cache: 'no-store' });
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
                const address = torre ? `Torre ${torre}, Ap ${apto}` : (order.Endereco || order.Endereco_Completo || 'Retirada');

                const customerName = order.Nome_Cliente_Pedido ||
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
            const response = await fetch(API_URL + '?action=createCustomer', { method: 'POST', body: JSON.stringify(userData) });
            return await response.json();
        } catch (e) { return { success: false }; }
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
                message: e instanceof Error && e.name === 'TimeoutError'
                    ? 'Timeout ao validar cupom. Tente novamente.'
                    : 'Erro ao validar cupom. Verifique sua conexão.'
            };
        }
    },

    /**
     * 🔥 NOVA FUNÇÃO: Validar cupom com contexto completo
     * Verifica histórico de uso, valor mínimo, etc.
     */
    async validateCouponWithContext(data: {
        code: string;
        customerId: string;
        subtotal: number;
    }) {
        const normalizedCode = data.code.trim().toUpperCase();

        console.log(`🔍 [Validação Contextual] Cupom: ${normalizedCode}, Cliente: ${data.customerId}, Subtotal: R$ ${data.subtotal}`);

        try {
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
                console.log(`✅ [Cupom Válido] Tipo: ${result.type}, Valor: ${result.value}, Tipo Uso: ${result.tipoUso}`);
            } else {
                console.warn(`⚠️ [Cupom Inválido] ${result.message}`);
            }

            return result;
        } catch (e) {
            console.error('❌ [Coupon Context Validation Error]:', e);
            return {
                success: false,
                message: e instanceof Error && e.name === 'TimeoutError'
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
    async syncFavorites(phone: string, favorites: string[]) {
        try { await fetch(API_URL + '?action=updateFavorites', { method: 'POST', body: JSON.stringify({ phone, favorites: favorites.join(',') }) }); } catch (e) { }
    },
    async submitOrder(orderData: any) {
        try {
            const response = await fetch(API_URL + '?action=createOrder', { method: 'POST', body: JSON.stringify(orderData) });
            return await response.json();
        } catch (e) { return { success: false }; }
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
        } catch (e) {
            console.error('❌ [API] Erro ao carregar pedidos do cliente:', e);
            return [];
        }
    },

    async getOrderItems(adminKey: string, orderId: string) {
        try {
            const response = await fetch(`${API_URL}?action=getOrderItems&orderId=${orderId}&adminKey=${adminKey}&_t=${Date.now()}`);
            return await response.json();
        } catch (error) { return []; }
    },
    async getDashboardStats(adminKey: string) {
        try {
            const response = await fetch(`${API_URL}?action=getDashboardStats&adminKey=${adminKey}&_t=${Date.now()}`, { cache: 'no-store' });
            return await response.json();
        } catch (e) { return null; }
    },
    async updateOrderStatus(adminKey: string, orderId: string, newStatus: string) {
        try {
            const response = await fetch(API_URL + '?action=updateOrderStatus', { method: 'POST', body: JSON.stringify({ adminKey, orderId, newStatus }) });
            return (await response.json()).success;
        } catch (e) { return false; }
    },
    async getProductReviews(productId: string) {
        try {
            const response = await fetch(`${API_URL}?action=getReviews&productId=${productId}&_t=${Date.now()}`);
            const data = await response.json();
            return Array.isArray(data) ? data : [];
        } catch (e) {
            console.error('Error fetching reviews:', e);
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
        } catch (e) {
            return { success: false, message: 'Erro de conexão' };
        }
    },
    async clearCacheAndReload() {
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const reg of registrations) await reg.unregister();
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
    async calculateItemPrice(data: {
        productId: string;
        selectedAdditions: any[];
        quantity: number;
    }) {
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
    // CINEMA PROMOTION / RAFFLE SYSTEM
    // ========================================

    /**
     * Get customer's raffle numbers and promotion progress
     */
    async getMinhasChances(customerId: string) {
        try {
            const timestamp = Date.now();
            const response = await fetch(
                `${API_URL}?action=getMinhasChances&customerId=${customerId}&_t=${timestamp}`
            );
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
