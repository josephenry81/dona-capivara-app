// REMOVED AXIOS IMPORT - USING NATIVE FETCH
const API_URL = process.env.NEXT_PUBLIC_GOOGLE_SHEET_API_URL || '';

export const API = {

    // --- PUBLIC CATALOG ---
    async fetchCatalogData() {
        try {
            if (!API_URL) throw new Error("API URL missing");
            // Cache Busting
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
                nome: p.Nome_Geladinho || p.Nome || p.nome || 'Produto sem nome',
                price: Number(p.Preco_Venda || 0),
                imagem: p.URL_IMAGEM_CACHE || p.Imagem_Geladinho || '',
                estoque: Number(p[' Estoque_Atual'] || p.Estoque_Atual || 0),
                categoriaId: p.ID_Categoria,
                descricao: p.Descricao,
                peso: p.Peso || '120g',
                calorias: p.Calorias || 'N/A',
                ingredientes: p.Ingredientes || 'Ingredientes não informados.',
                tempo: p.Tempo_Preparo || 'Pronta Entrega'
            }));

            const categories = categoriesRaw.map((c: any) => ({ id: c.ID_Categoria, nome: c.Nome_Categoria }));
            const banners = Array.isArray(bannersRaw) ? bannersRaw.map((b: any) => ({ id: b.ID_Banner, image: b.Imagem_URL, title: b.Titulo || '', subtitle: b.Subtitulo || '', ctaText: b.Texto_Botao || 'Ver Mais' })) : [];

            return { products, categories, banners };
        } catch (error) {
            console.error("Sync Error", error);
            return { products: [], categories: [], banners: [] };
        }
    },

    // --- AUTH ---
    async login(phone: string, password: string) {
        if (!API_URL) return { success: false, message: "Config Error" };
        try {
            const response = await fetch(API_URL + '?action=loginCustomer', {
                method: 'POST',
                body: JSON.stringify({ phone, password })
            });
            const data = await response.json();

            if (data.success && data.customer) {
                const favString = data.customer.Favoritos || '';
                const favArray = favString ? favString.split(',') : [];

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

    async registerCustomer(userData: any) {
        if (!API_URL) return { success: false, message: "Config Error" };
        try {
            const response = await fetch(API_URL + '?action=createCustomer', { method: 'POST', body: JSON.stringify(userData) });
            return await response.json();
        } catch (error) { return { success: false, message: "Erro de conexão" }; }
    },

    async syncFavorites(phone: string, favorites: string[]) {
        if (!API_URL) return;
        try { await fetch(API_URL + '?action=updateFavorites', { method: 'POST', body: JSON.stringify({ phone, favorites: favorites.join(',') }) }); } catch (e) { }
    },

    // --- ORDERS ---
    async submitOrder(orderData: any) {
        if (!API_URL) return;
        try { await fetch(API_URL + '?action=createOrder', { method: 'POST', body: JSON.stringify(orderData) }); return { success: true }; }
        catch (e) { return { success: false }; }
    },

    async getCustomerOrders(customerId: string) {
        if (!API_URL) return [];
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
        } catch (error) { return []; }
    },

    // --- ADMIN FUNCTIONS (V7) ---
    async getAdminOrders(adminKey: string) {
        if (!API_URL) return [];
        try {
            const timestamp = Date.now();
            const response = await fetch(`${API_URL}?action=getAdminOrders&adminKey=${adminKey}&_t=${timestamp}`, { cache: 'no-store' });

            const data = await response.json();
            if (data.error || data.success === false) return null;

            const list = data.orders || (Array.isArray(data) ? data : []);

            return list.map((order: any) => ({
                id: order.ID_Venda,
                date: order.Data_Venda,
                customerName: order.Cliente || order.Nome || 'Cliente',
                total: Number(order.Total_Venda || 0),
                status: order.Status || 'Pendente',
                payment: order.Forma_de_Pagamento || '-',
                address: order.Torre ? `Torre ${order.Torre}, Ap ${order.Ap}` : (order.Endereco || 'Retirada')
            }));
        } catch (error) {
            console.error("Admin Fetch Error", error);
            return null;
        }
    },

    async updateOrderStatus(adminKey: string, orderId: string, newStatus: string) {
        if (!API_URL) return false;
        try {
            const response = await fetch(API_URL + '?action=updateOrderStatus', {
                method: 'POST',
                body: JSON.stringify({ adminKey, orderId, newStatus })
            });
            const res = await response.json();
            return res.success;
        } catch (e) { return false; }
    }
};
