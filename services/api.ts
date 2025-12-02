import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_GOOGLE_SHEET_API_URL || '';

export const API = {

    // --- CATALOG ---
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
        } catch (error) { return { products: [], categories: [], banners: [] }; }
    },

    // --- AUTH ---
    async login(phone: string, password: string) {
        if (phone.toLowerCase().trim() === 'admin' && password.trim() === 'Jxd701852@') {
            return { success: true, customer: { id: 'ADMIN', name: 'Administrador', phone: 'admin', isAdmin: true, adminKey: 'Jxd701852@' } };
        }
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

                // --- CRITICAL: EXPLICIT MAPPING ---
                data.customer = {
                    id: data.customer.ID_Cliente || data.customer.id, // Ensure ID is captured
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
                if (data.customer.isAdmin) { data.customer.isGuest = false; data.customer.adminKey = data.customer.adminKey; }
            }
            return data;
        } catch (error) { return { success: false, message: "Erro de conexão" }; }
    },

    async registerCustomer(userData: any) {
        try {
            const response = await fetch(API_URL + '?action=createCustomer', { method: 'POST', body: JSON.stringify(userData) });
            const data = await response.json();
            // Normalize Register ID too
            if (data.success && data.customer) {
                data.customer.id = data.customer.id || data.customer.ID_Cliente;
                data.customer.isGuest = false;
            }
            return data;
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
        try { await fetch(API_URL + '?action=createOrder', { method: 'POST', body: JSON.stringify(orderData) }); return { success: true }; } catch (e) { return { success: false }; }
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

    // --- ADMIN FUNCTIONS (ROBUST DATA MAPPING) ---
    async getAdminOrders(adminKey: string) {
        if (!API_URL) return [];
        try {
            const timestamp = Date.now();
            const response = await fetch(`${API_URL}?action=getAdminOrders&adminKey=${adminKey}&_t=${timestamp}`, { cache: 'no-store' });
            const data = await response.json();

            if (data.error || data.success === false) return null;
            const list = data.orders || (Array.isArray(data) ? data : []);

            return list.map((order: any) => {
                // 1. NAME MAPPING (Try all possible keys)
                const rawName = order.Cliente || order.Nome || order.Cliente_Nome || order.customerName || order.name;
                const customerName = rawName && rawName !== 'undefined' ? rawName : 'Visitante';

                // 2. ADDRESS MAPPING
                const torre = order.Torre;
                // Try all keys for Apartment
                const apto = order.Ap || order.Apto || order.Apartamento;

                let addressDisplay = 'Retirada';
                if (torre) {
                    addressDisplay = `Torre ${torre}, Ap ${apto || '?'}`;
                } else if (order.Endereco) {
                    addressDisplay = order.Endereco;
                }

                // 3. PAYMENT MAPPING
                const payment = order.Forma_de_Pagamento || order.Pagamento || order.Forma_Pagamento || '-';

                return {
                    id: order.ID_Venda,
                    date: order.Data_Venda,
                    customerName: customerName,
                    // IDs for Receipt
                    customerId: order.ID_Cliente || 'GUEST',
                    deliveryFee: Number(order.Taxa_Entrega || order.Entregar || 0),
                    discount: Number(order.Desconto || 0),

                    total: Number(order.Total_Venda || 0),
                    status: order.Status || 'Pendente',
                    payment: payment,
                    address: addressDisplay,
                    scheduling: order.Agendamento || ''
                };
            });
        } catch (error) { return null; }
    },

    async getOrderItems(adminKey: string, orderId: string) {
        if (!API_URL) return [];
        try {
            const response = await fetch(`${API_URL}?action=getOrderItems&orderId=${orderId}&adminKey=${adminKey}&_t=${Date.now()}`);
            return await response.json();
        } catch (error) { return []; }
    },

    // Analytics
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
    }
};