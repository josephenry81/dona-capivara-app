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

    // --- ROBUST ADMIN MAPPING (BUG #2 FIXED) ---
    async getAdminOrders(adminKey: string) {
        if (!API_URL) return null;
        try {
            const response = await fetch(`${API_URL}?action=getAdminOrders&adminKey=${adminKey}&_t=${Date.now()}`, { cache: 'no-store' });
            const data = await response.json();
            if (data.error || data.success === false) return null;
            const list = data.orders || (Array.isArray(data) ? data : []);

            return list.map((order: any) => {
                // DEBUG: Log raw order to see what fields are available
                console.log('🔍 Raw order from backend:', order);

                // FIX: Handle all possible apartment field variations + Backend V14 normalized field
                const apto = order.Apartamento_Cliente || order.Ap || order.Apto || order.Apartamento || '-';
                const torre = order.Torre_Cliente || order.Torre || '';
                const address = torre ? `Torre ${torre}, Ap ${apto}` : (order.Endereco || order.Endereco_Completo || 'Retirada');

                // EXPANDED: Try all possible customer name fields from backend
                const customerName = order.Nome_Cliente_Pedido ||
                    order.Nome_Cliente ||
                    order.Cliente ||
                    order.customerName ||
                    order.Nome ||
                    order.nome ||
                    order.Customer_Name ||
                    order.NomeCliente ||
                    'Visitante';

                console.log('✅ Mapped customerName:', customerName);

                return {
                    id: order.ID_Venda,
                    date: order.Data_Venda,
                    customerName: customerName,
                    customerId: order.ID_Cliente || 'GUEST',
                    deliveryFee: Number(order.Taxa_Entrega || order.Entregar || 0),
                    discount: Number(order.Desconto || 0),
                    total: Number(order.Total_Venda || 0),
                    status: order.Status || 'Pendente',
                    payment: order.Forma_de_Pagamento || order.Pagamento || order.Metodo_Pagamento || '-',
                    address: address,
                    scheduling: order.Agendamento || ''
                };
            });
        } catch (error) {
            console.error('getAdminOrders error:', error);
            return null;
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
    }
};