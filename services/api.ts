

const API_URL = process.env.NEXT_PUBLIC_GOOGLE_SHEET_API_URL || '';

export const API = {

    // --- CATALOG (Preserved) ---
    async fetchCatalogData() {
        try {
            if (!API_URL) throw new Error("API URL missing");
            const [productsRes, categoriesRes, bannersRes] = await Promise.all([
                fetch(`${API_URL}?action=getProducts`),
                fetch(`${API_URL}?action=getCategories`),
                fetch(`${API_URL}?action=getBanners`)
            ]);
            const productsRaw = await productsRes.json();
            const categoriesRaw = await categoriesRes.json();
            const bannersRaw = await bannersRes.json();

            const products = productsRaw.map((p: any) => ({
                id: p.ID_Geladinho,
                nome: p.Nome_Geladinho || p.Nome || p.nome || 'Produto sem nome',
                price: Number(p.Preco_Venda || 0),
                imagem: getGoogleDriveDirectLink(p.URL_IMAGEM_CACHE || p.Imagem_Geladinho || ''),
                estoque: Number(p[' Estoque_Atual'] || p.Estoque_Atual || 0),
                categoriaId: p.ID_Categoria,
                descricao: p.Descricao,
                peso: p.Peso || '120g',
                calorias: p.Calorias || 'N/A',
                ingredientes: p.Ingredientes || 'Ingredientes não informados.',
                tempo: p.Tempo_Preparo || 'Pronta Entrega'
            }));

            const categories = categoriesRaw.map((c: any) => ({
                id: c.ID_Categoria,
                nome: c.Nome_Categoria
            }));

            const banners = Array.isArray(bannersRaw) ? bannersRaw.map((b: any) => ({
                id: b.ID_Banner,
                image: getGoogleDriveDirectLink(b.Imagem_URL || b.Imagem),
                title: b.Titulo || '',
                subtitle: b.Subtitulo || '',
                ctaText: b.Texto_Botao || 'Ver Mais'
            })) : [];

            return { products, categories, banners };
        } catch (error) {
            console.error("Sync Error", error);
            return { products: [], categories: [], banners: [] };
        }
    },

    // --- AUTH (UPDATED MAPPING) ---
    async login(phone: string, password: string) {
        if (!API_URL) return { success: false, message: "Config Error" };
        try {
            const response = await fetch(API_URL + '?action=loginCustomer', {
                method: 'POST',
                body: JSON.stringify({ phone, password })
            });
            const data = await response.json();
            // console.log("LOGIN RAW RESPONSE:", JSON.stringify(data, null, 2)); // DEBUG

            if (data.success && data.customer) {
                // NORMALIZE BACKEND DATA
                data.customer = {
                    id: data.customer.ID_Cliente,
                    name: data.customer.Nome,
                    phone: data.customer.Telefone,
                    points: Number(data.customer.Pontos_Fidelidade || 0),
                    inviteCode: data.customer.Codigo_Convite || data.customer.inviteCode || '---',
                    isGuest: false
                };
            }
            return data;
        } catch (error) { return { success: false, message: "Erro de conexão" }; }
    },

    async registerCustomer(userData: any) {
        if (!API_URL) return { success: false, message: "Config Error" };
        try {
            const response = await fetch(API_URL + '?action=createCustomer', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
            const data = await response.json();

            // DEBUG: Show raw response in alert to capture it via screenshot/DOM
            if (typeof window !== 'undefined') {
                alert("DEBUG REGISTER: " + JSON.stringify(data));
            }

            if (data.success && data.customer) {
                // NORMALIZE: Ensure inviteCode is mapped from backend Codigo_Convite
                data.customer.inviteCode = data.customer.Codigo_Convite || data.customer.inviteCode || '---';
                data.customer.isGuest = false;
            }
            return data;
        } catch (error) { return { success: false, message: "Erro de conexão" }; }
    },

    // --- ORDERS ---
    async submitOrder(orderData: any) {
        if (!API_URL) return;
        try {
            // console.log("SUBMITTING ORDER:", JSON.stringify(orderData, null, 2)); // DEBUG
            const response = await fetch(API_URL + '?action=createOrder', { method: 'POST', body: JSON.stringify(orderData) });
            const result = await response.json();

            // DEBUG: Show raw response in alert
            if (typeof window !== 'undefined') {
                alert("DEBUG ORDER: " + JSON.stringify(result));
            }

            return result;
        } catch (error) {
            if (typeof window !== 'undefined') alert("DEBUG ORDER ERROR: " + error);
            return { success: false };
        }
    },

    async getCustomerOrders(customerId: string) {
        if (!API_URL) return [];
        try {
            const response = await fetch(`${API_URL}?action=getOrders&customerId=${customerId}`);
            const data = await response.json();
            return data.map((order: any) => ({
                id: order.ID_Venda,
                date: order.Data_Venda,
                total: Number(order.Total_Venda || 0),
                status: order.Status || 'Pendente',
                paymentMethod: order.Forma_de_Pagamento || 'Não informado'
            }));
        } catch (error) { return []; }
    }
};

// Helper to transform Google Drive links
function getGoogleDriveDirectLink(url: string): string {
    if (!url) return '';

    // If it's already a direct link or not a Google Drive link, return as is
    if (!url.includes('drive.google.com')) return url;

    // Extract ID from various Google Drive formats
    let id = '';
    const parts = url.split('/');

    // Format: https://drive.google.com/file/d/ID/view...
    if (url.includes('/file/d/')) {
        const index = parts.indexOf('d');
        if (index !== -1 && parts.length > index + 1) {
            id = parts[index + 1];
        }
    }
    // Format: https://drive.google.com/open?id=ID or thumbnail?id=ID
    else if (url.includes('id=')) {
        const match = url.match(/id=([a-zA-Z0-9_-]+)/);
        if (match) id = match[1];
    }

    if (id) {
        // Use lh3 with size param to force display
        return `https://lh3.googleusercontent.com/d/${id}=s1000`;
    }

    return url;
}
