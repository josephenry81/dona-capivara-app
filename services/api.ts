// Keeping all other functions, but providing the full file for safety
const API_URL = process.env.NEXT_PUBLIC_GOOGLE_SHEET_API_URL || '';

export const API = {

    async fetchCatalogData() {
        try {
            if (!API_URL) throw new Error("API URL missing");
            const timestamp = Date.now();
            const [productsRes, categoriesRes, bannersRes] = await Promise.all([
                fetch(`${API_URL}?action=getProducts&_t=${timestamp}`),
                fetch(`${API_URL}?action=getCategories&_t=${timestamp}`),
                fetch(`${API_URL}?action=getBanners&_t=${timestamp}`)
            ]);
            const productsRaw = await productsRes.json();
            const categoriesRaw = await categoriesRes.json();
            const bannersRaw = await bannersRes.json();

            const products = productsRaw.map((p: any) => ({
                id: p.ID_Geladinho,
                nome: p.Nome_Geladinho || 'Produto sem nome',
                price: Number(p.Preco_Venda || 0),
                imagem: p.URL_IMAGEM_CACHE || '',
                estoque: Number(p[' Estoque_Atual'] || p.Estoque_Atual || 0),
                categoriaId: p.ID_Categoria,
                descricao: p.Descricao,
                peso: p.Peso || 'N/A',
                calorias: p.Calorias || 'N/A',
                ingredientes: p.Ingredientes || 'N/A',
                tempo: p.Tempo_Preparo || 'N/A'
            }));
            const categories = categoriesRaw.map((c: any) => ({ id: c.ID_Categoria, nome: c.Nome_Categoria }));
            const banners = Array.isArray(bannersRaw) ? bannersRaw.map((b: any) => ({ id: b.ID_Banner, image: b.Imagem_URL, title: b.Titulo || '', subtitle: b.Subtitulo || '', ctaText: b.Texto_Botao || '' })) : [];

            return { products, categories, banners };
        } catch (error) { return { products: [], categories: [], banners: [] }; }
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
            console.error('💥 [API] getAdminOrders error:', error);
            return { orders: [] };
        }
    },

    async registerCustomer(userData: any) {
        try {
            const response = await fetch(API_URL + '?action=createCustomer', { method: 'POST', body: JSON.stringify(userData) });
            return await response.json();
        } catch (e) { return { success: false }; }
    },
    async validateCoupon(code: string) {
        try {
            const response = await fetch(`${API_URL}?action=validateCoupon&code=${code}`);
            return await response.json();
        } catch (e) { return { success: false }; }
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
            return data.map((order: any) => ({
                id: order.ID_Venda,
                date: order.Data_Venda,
                total: Number(order.Total_Venda || 0),
                status: order.Status || 'Pendente',
                paymentMethod: order.Forma_de_Pagamento || 'Não informado'
            }));
        } catch (e) { return []; }
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
    // WHEEL / GAMIFICATION API FUNCTIONS
    // ========================================

    /**
     * Girar roleta e obter prêmio garantido
     */
    async spinWheel(userId: string, spinNumber: number) {
        console.log('🎰 [API] spinWheel:', { userId, spinNumber });
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'spinWheel',
                    userId,
                    spinNumber
                })
            });
            const data = await response.json();
            console.log('🎰 [API] spinWheel response:', data);
            return data;
        } catch (error) {
            console.error('💥 [API] spinWheel error:', error);
            return { success: false, message: 'Erro ao girar roleta' };
        }
    },

    /**
     * Obter prêmios pendentes do usuário
     */
    async getUserPrizes(userId: string) {
        console.log('🎁 [API] getUserPrizes:', userId);
        try {
            const timestamp = Date.now();
            const response = await fetch(`${API_URL}?action=getUserPrizes&userId=${userId}&_t=${timestamp}`);
            const data = await response.json();
            console.log('🎁 [API] getUserPrizes response:', data);
            return data;
        } catch (error) {
            console.error('💥 [API] getUserPrizes error:', error);
            return [];
        }
    },

    /**
     * Resgatar prêmio em um pedido
     */
    async redeemPrize(userId: string, prizeId: string, orderId: string) {
        console.log('✅ [API] redeemPrize:', { userId, prizeId, orderId });
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'redeemPrize',
                    userId,
                    prizeId,
                    orderId
                })
            });
            const data = await response.json();
            console.log('✅ [API] redeemPrize response:', data);
            return data;
        } catch (error) {
            console.error('💥 [API] redeemPrize error:', error);
            return { success: false, message: 'Erro ao resgatar prêmio' };
        }
    },

    /**
     * Obter número de giros disponíveis
     */
    async getUserSpins(userId: string) {
        console.log('🎲 [API] getUserSpins:', userId);
        try {
            const timestamp = Date.now();
            const response = await fetch(`${API_URL}?action=getUserSpins&userId=${userId}&_t=${timestamp}`);
            const data = await response.json();
            console.log('🎲 [API] getUserSpins response:', data);
            return data;
        } catch (error) {
            console.error('💥 [API] getUserSpins error:', error);
            return { success: false, spins: 0 };
        }
    }
};