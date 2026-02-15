# Code.gs Atualizado - PARTE 1 de 2

> **Instrução:** Copie o conteúdo JavaScript da PARTE 1 e da PARTE 2, junte tudo em sequência, e cole no seu Code.gs.
> **Única alteração:** função `createReview` agora credita pontos de fidelidade.

```javascript
const ADMIN_LOGIN = 'admin';
const ADMIN_PASS = 'Jxd701852@';

const SUPABASE_URL = 'https://zuecbccyuflfkczzyrpd.supabase.co';
const SUPABASE_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1ZWNiY2N5dWZsZmtjenp5cnBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2NjgxNDcsImV4cCI6MjA4MzI0NDE0N30.vkyybk9_KXieXKJLEHrGWS29dR8RDdUfE6B1lD5bdcE';

const STORE_LOCATION = {
    lat: -25.53427,
    lon: -49.29026,
    address: 'Rua Reinaldo Stocco, 274 - Pinheirinho, Curitiba - PR'
};

const DELIVERY_PRICING = {
    BASE_FEE: 3.5,
    KM_RATE: 1.2,
    MIN_FEE: 5.0,
    FREE_SHIPPING_MIN: 30.00,
    FREE_SHIPPING_KM: 3,
    NEIGHBOR_DISCOUNT: 0.5
};

const VOICEMONKEY_CONFIG = {
    ENABLED: true,
    TOKEN: '10d5fc98d60558c5e04dc8dc4069cae5_01cd022527ea005eb4a8da96d4d104cf',
    DEVICE: 'echo-dot-de-jose',
    BASE_URL: 'https://api-v2.voicemonkey.io/announcement'
};

const IFOOD_CONFIG = {
    ENABLED: true, 
    MERCHANT_ID: 'SEU_MERCHANT_ID_AQUI', 
    CLIENT_ID: 'SEU_CLIENT_ID_AQUI',
    CLIENT_SECRET: 'SEU_CLIENT_SECRET_AQUI',
    AUTH_URL: 'https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token',
    API_URL: 'https://merchant-api.ifood.com.br/merchant/v1.0'
};

function notifyAlexaNewOrder(orderData) {
    if (!VOICEMONKEY_CONFIG.ENABLED || !orderData) return;
    try {
        const nomeCliente = orderData.nomeCliente || 'Cliente';
        const total = Number(orderData.total || 0).toFixed(2).replace('.', ',');
        const qtdItens = orderData.qtdItens || 0;
        const textoMensagem = `Novo pedido de ${nomeCliente}. São ${qtdItens} itens, total de ${total} reais.`;
        const url = `${VOICEMONKEY_CONFIG.BASE_URL}?token=${VOICEMONKEY_CONFIG.TOKEN}&device=${VOICEMONKEY_CONFIG.DEVICE}&text=${encodeURIComponent(textoMensagem)}`;
        const response = UrlFetchApp.fetch(url, { method: 'GET', muteHttpExceptions: true });
        const responseCode = response.getResponseCode();
        const responseBody = response.getContentText();
        if (responseCode === 200) {
            Logger.log(`🔊 Alexa notificada com sucesso: "${textoMensagem}"`);
        } else {
            Logger.log(`⚠️ Erro ao notificar Alexa (Code ${responseCode}): ${responseBody}`);
        }
    } catch (error) {
        Logger.log(`⚠️ Erro Crítico Alexa: ${error.toString()}`);
    }
}

function testAlexaNotification() {
    notifyAlexaNewOrder({ nomeCliente: 'Teste Rápido', total: 15.50, qtdItens: 3 });
}

function getIfoodAccessToken() {
    const cache = CacheService.getScriptCache();
    const cachedToken = cache.get('IFOOD_TOKEN');
    if (cachedToken) return cachedToken;
    try {
        const payload = {
            grantType: "client_credentials",
            clientId: IFOOD_CONFIG.CLIENT_ID,
            clientSecret: IFOOD_CONFIG.CLIENT_SECRET
        };
        const response = UrlFetchApp.fetch(IFOOD_CONFIG.AUTH_URL, {
            method: 'POST',
            contentType: 'application/x-www-form-urlencoded',
            payload: payload,
            muteHttpExceptions: true
        });
        const json = JSON.parse(response.getContentText());
        if (json.accessToken) {
            cache.put('IFOOD_TOKEN', json.accessToken, 3000); 
            return json.accessToken;
        } else {
            Logger.log('❌ Erro Auth iFood: ' + JSON.stringify(json));
            return null;
        }
    } catch (e) {
        Logger.log('❌ Erro Conexão iFood: ' + e);
        return null;
    }
}

function syncStockToIfood(products) {
    if (!IFOOD_CONFIG.ENABLED) return;
    const token = getIfoodAccessToken();
    if (!token) return;
    products.forEach(p => {
        try {
            const status = p.estoque > 0 ? 'AVAILABLE' : 'UNAVAILABLE';
            const url = `${IFOOD_CONFIG.API_URL}/merchants/${IFOOD_CONFIG.MERCHANT_ID}/products/${p.id}/status`;
            const response = UrlFetchApp.fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                payload: JSON.stringify({ status: status }),
                muteHttpExceptions: true
            });
            if (response.getResponseCode() >= 200 && response.getResponseCode() < 300) {
                Logger.log(`🍕 iFood Sync: ${p.id} definido como ${status}`);
            }
        } catch (e) {
            Logger.log(`⚠️ Erro loop iFood: ${e}`);
        }
    });
}

function deleteOrphanedFromSupabase(tableName, currentIds) {
    if (SUPABASE_URL.includes('SEU_PROJECT') || !currentIds || currentIds.length === 0) return;
    try {
        const response = UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=id`, {
            method: 'GET',
            headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
            muteHttpExceptions: true
        });
        if (response.getResponseCode() !== 200) return;
        const supabaseData = JSON.parse(response.getContentText());
        const supabaseIds = supabaseData.map(item => String(item.id));
        const currentIdsSet = new Set(currentIds.map(id => String(id)));
        const orphanedIds = supabaseIds.filter(id => !currentIdsSet.has(id));
        if (orphanedIds.length === 0) return;
        Logger.log(`🗑️ Deletando ${orphanedIds.length} órfãos de ${tableName}`);
        for (const orphanId of orphanedIds) {
            UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/${tableName}?id=eq.${encodeURIComponent(orphanId)}`, {
                method: 'DELETE',
                headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
                muteHttpExceptions: true
            });
        }
    } catch (error) {
        Logger.log(`❌ Erro delete órfãos: ${error}`);
    }
}

function syncUpdatedProductsToSupabase(productsData) {
    if (SUPABASE_URL.includes('SEU_PROJECT') || !productsData || productsData.length === 0) return;
    try {
        const payload = productsData.map(p => ({
            id: String(p.id).trim(),
            nome: p.nome,
            preco: Number(p.preco),
            estoque: Number(p.estoque),
            categoria_id: p.categoria_id,
            descricao: p.descricao,
            imagem_url: p.imagem_url,
            ativo: p.estoque > 0, 
            mostrar_catalogo: true,
            updated_at: new Date().toISOString()
        }));
        UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/products`, {
            method: 'POST',
            headers: {
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                Prefer: 'resolution=merge-duplicates'
            },
            payload: JSON.stringify(payload),
            muteHttpExceptions: true
        });
        Logger.log(`🚀 Sync Rápido: ${payload.length} produtos atualizados.`);
    } catch (error) {
        Logger.log(`⚠️ Sync Rápido falhou: ${error}`);
    }
}

function syncProductsToSupabase() {
    if (SUPABASE_URL.includes('SEU_PROJECT')) return;
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('GELADINHOS');
    if (!sheet) return;
    SpreadsheetApp.flush();
    const allProducts = sheetToJSON(sheet);
    if (allProducts.length === 0) return;
    const supabaseData = allProducts
        .map(p => {
            let isActive = false;
            const ativoValue = p.Produto_Ativo;
            if (ativoValue === true || ativoValue === 1) isActive = true;
            else if (ativoValue)
                isActive = ['TRUE', 'SIM', 'YES', '1', 'S', 'OK'].includes(String(ativoValue).toUpperCase().trim());
            let showInCatalog = true;
            const showValue = p.Mostrar_Catalogo;
            if (showValue !== null && showValue !== undefined && showValue !== '')
                showInCatalog = ['TRUE', 'SIM', 'YES', '1', 'S'].includes(String(showValue).toUpperCase().trim());
            return {
                id: String(p.ID_Geladinho).trim(),
                nome: p.Nome_Geladinho,
                preco: Number(p.Preco_Venda) || 0,
                estoque: Number(p.Estoque_Atual) || 0,
                categoria_id: p.ID_Categoria,
                descricao: p.Descricao || '',
                imagem_url: normalizarUrlImagem(p) || '',
                ativo: isActive,
                mostrar_catalogo: showInCatalog,
                updated_at: new Date().toISOString()
            };
        })
        .filter(p => p.id);
    const uniqueProducts = [];
    const seenIds = new Set();
    supabaseData.forEach(p => {
        if (!seenIds.has(p.id)) {
            seenIds.add(p.id);
            uniqueProducts.push(p);
        }
    });
    try {
        UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/products`, {
            method: 'POST',
            headers: {
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                Prefer: 'resolution=merge-duplicates'
            },
            payload: JSON.stringify(uniqueProducts),
            muteHttpExceptions: true
        });
        deleteOrphanedFromSupabase('products', uniqueProducts.map(p => p.id));
    } catch (e) {
        Logger.log(`❌ Erro sync produtos: ${e}`);
    }
}

function syncAllCouponsToSupabase() {
    if (SUPABASE_URL.includes('SEU_PROJECT')) return;
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CUPONS');
    if (!sheet) return;
    SpreadsheetApp.flush();
    const cupons = sheetToJSON(sheet);
    const supabaseData = cupons
        .map(c => ({
            code: String(c.Codigo || '').trim().toUpperCase(),
            type: String(c.Tipo || 'VALOR_FIXO'),
            value: Number(c.Valor || 0),
            usage_type: String(c.Tipo_Uso || c['Tipo_Uso (UNICO ou MULTIPLO)'] || 'MULTIPLO').toUpperCase(),
            min_value: Number(c.Valor_Minimo_Pedido || 0),
            active: String(c.Ativo).toUpperCase() === 'TRUE' || c.Ativo === true,
            valid_until: c.Data_Validade ? new Date(c.Data_Validade).toISOString() : null,
            max_usage: Number(c.Uso_Maximo || 0),
            updated_at: new Date().toISOString()
        }))
        .filter(c => c.code);
    if (supabaseData.length === 0) return;
    try {
        UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/coupons`, {
            method: 'POST',
            headers: {
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                Prefer: 'resolution=merge-duplicates'
            },
            payload: JSON.stringify(supabaseData),
            muteHttpExceptions: true
        });
        deleteOrphanedCouponsFromSupabase(supabaseData.map(c => c.code));
    } catch (e) {
        Logger.log(`❌ Erro cupons: ${e}`);
    }
}

function deleteOrphanedCouponsFromSupabase(currentCodes) {
    if (SUPABASE_URL.includes('SEU_PROJECT') || !currentCodes) return;
    try {
        const response = UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/coupons?select=code`, {
            method: 'GET',
            headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
        });
        if (response.getResponseCode() !== 200) return;
        const dbCodes = JSON.parse(response.getContentText()).map(c => c.code);
        const sheetCodes = new Set(currentCodes.map(c => String(c).toUpperCase()));
        const orphans = dbCodes.filter(c => !sheetCodes.has(c));
        orphans.forEach(c => {
            UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/coupons?code=eq.${encodeURIComponent(c)}`, {
                method: 'DELETE',
                headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
            });
        });
    } catch (e) {}
}

function syncSingleCouponToSupabase(coupon) {
    if (SUPABASE_URL.includes('SEU_PROJECT') || !coupon || !coupon.Codigo) return;
    const data = {
        code: String(coupon.Codigo).trim().toUpperCase(),
        type: String(coupon.Tipo || 'VALOR_FIXO'),
        value: Number(coupon.Valor || 0),
        usage_type: String(coupon.Tipo_Uso || 'MULTIPLO'),
        min_value: Number(coupon.Valor_Minimo_Pedido || 0),
        active: String(coupon.Ativo).toUpperCase() === 'TRUE' || coupon.Ativo === true,
        valid_until: coupon.Data_Validade ? new Date(coupon.Data_Validade).toISOString() : null,
        max_usage: Number(coupon.Uso_Maximo || 0),
        updated_at: new Date().toISOString()
    };
    try {
        UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/coupons`, {
            method: 'POST',
            headers: {
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                Prefer: 'resolution=merge-duplicates'
            },
            payload: JSON.stringify([data]),
            muteHttpExceptions: true
        });
    } catch (e) {}
}

function getCouponFromSupabase(code) {
    if (SUPABASE_URL.includes('SEU_PROJECT') || !code) return null;
    try {
        const res = UrlFetchApp.fetch(
            `${SUPABASE_URL}/rest/v1/coupons?code=eq.${encodeURIComponent(String(code).trim().toUpperCase())}&select=*`,
            {
                method: 'GET',
                headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
            }
        );
        if (res.getResponseCode() === 200) {
            const data = JSON.parse(res.getContentText());
            if (data && data.length > 0) return data[0];
        }
    } catch (e) {}
    return null;
}

function syncCouponHistoryToSupabase() {
    if (SUPABASE_URL.includes('SEU_PROJECT')) return;
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CUPONS_HISTORICO');
    if (!sheet) return;
    SpreadsheetApp.flush();
    const history = sheetToJSON(sheet);
    if (history.length === 0) return;
    const supabaseData = history
        .map(h => ({
            id: String(h.ID_Historico || Utilities.getUuid()),
            coupon_code: String(h.Codigo_Cupom || '').trim().toUpperCase(),
            customer_id: String(h.ID_Cliente || '').trim(),
            order_id: String(h.ID_Venda || '').trim(),
            used_at: h.Data_Uso ? new Date(h.Data_Uso).toISOString() : new Date().toISOString(),
            discount_amount: Number(h.Valor_Desconto || 0)
        }))
        .filter(h => h.coupon_code && h.customer_id);
    if (supabaseData.length === 0) return;
    for (let i = 0; i < supabaseData.length; i += 100) {
        const batch = supabaseData.slice(i, i + 100);
        try {
            UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/coupon_history`, {
                method: 'POST',
                headers: {
                    apikey: SUPABASE_KEY,
                    Authorization: `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    Prefer: 'resolution=merge-duplicates'
                },
                payload: JSON.stringify(batch),
                muteHttpExceptions: true
            });
        } catch (e) {}
    }
}

function syncSingleUsageToSupabase(d) {
    if (SUPABASE_URL.includes('SEU_PROJECT')) return;
    try {
        UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/coupon_history`, {
            method: 'POST',
            headers: {
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                Prefer: 'resolution=merge-duplicates'
            },
            payload: JSON.stringify([
                {
                    id: String(d.ID_Historico),
                    coupon_code: String(d.Codigo_Cupom).trim().toUpperCase(),
                    customer_id: String(d.ID_Cliente).trim(),
                    order_id: String(d.ID_Venda).trim(),
                    used_at: new Date(d.Data_Uso).toISOString(),
                    discount_amount: Number(d.Valor_Desconto)
                }
            ]),
            muteHttpExceptions: true
        });
    } catch (e) {}
}

function syncCategoriesToSupabase() {
    if (SUPABASE_URL.includes('SEU_PROJECT')) return;
    SpreadsheetApp.flush();
    const cats = getCategories();
    const data = cats.map((c, idx) => ({ id: String(c.ID_Categoria).trim(), nome: c.Nome_Categoria, ordem: idx }));
    try {
        UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/categories`, {
            method: 'POST',
            headers: {
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                Prefer: 'resolution=merge-duplicates'
            },
            payload: JSON.stringify(data),
            muteHttpExceptions: true
        });
        deleteOrphanedFromSupabase('categories', data.map(c => c.id));
    } catch (e) {}
}

function syncBannersToSupabase() {
    if (SUPABASE_URL.includes('SEU_PROJECT')) return;
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('BANNERS');
    if (!sheet) return;
    SpreadsheetApp.flush();
    const banners = sheetToJSON(sheet);
    const data = banners.map((b, idx) => ({
        id: b.ID_Banner || `banner-${idx}`,
        titulo: b.Titulo || '',
        subtitulo: b.Subtitulo || '',
        imagem_url: normalizarUrlImagem(b) || '',
        cta_text: b.Texto_CTA || '',
        ativo: b.Ativo === true || ['TRUE', 'SIM'].includes(String(b.Ativo).toUpperCase()),
        ordem: idx
    }));
    try {
        UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/banners`, {
            method: 'POST',
            headers: {
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                Prefer: 'resolution=merge-duplicates'
            },
            payload: JSON.stringify(data),
            muteHttpExceptions: true
        });
        deleteOrphanedFromSupabase('banners', data.map(b => b.id));
    } catch (e) {}
}

function fullSyncToSupabase() {
    syncProductsToSupabase();
    syncCategoriesToSupabase();
    syncBannersToSupabase();
    syncAllCouponsToSupabase();
    syncCouponHistoryToSupabase();
}

function onSheetChange(e) {
    if (SUPABASE_URL.includes('SEU_PROJECT')) return;
    const sheetName = e.source.getActiveSheet().getName();
    if (['GELADINHOS', 'CATEGORIAS_GELADINHO', 'BANNERS', 'CUPONS'].includes(sheetName)) {
        Utilities.sleep(3000);
        switch (sheetName) {
            case 'GELADINHOS': syncProductsToSupabase(); break;
            case 'CATEGORIAS_GELADINHO': syncCategoriesToSupabase(); break;
            case 'BANNERS': syncBannersToSupabase(); break;
            case 'CUPONS': syncAllCouponsToSupabase(); break;
        }
    }
}

function createOrder(d) {
    const lock = LockService.getScriptLock();
    try {
        lock.waitLock(8000);
    } catch (e) {
        return { success: false, message: 'Sistema ocupado. Tente novamente.' };
    }
    try {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const V = ss.getSheetByName('VENDAS');
        const I = ss.getSheetByName('ITENS_VENDA');
        const G = ss.getSheetByName('GELADINHOS');
        const C = ss.getSheetByName('CLIENTES');
        const H = ss.getSheetByName('CUPONS_HISTORICO');
        const id = Utilities.getUuid();
        const now = new Date();
        const disc = Number(d.discountValue || 0);
        const pts = Number(d.pointsRedeemed || 0);
        let obs = pts > 0 ? `Usou ${pts} pts` : d.referralCode ? `Ref: ${d.referralCode}` : '';
        if (d.couponCode) obs += ` | Cupom: ${d.couponCode}`;
        const productsToUpdateInSupabase = [];
        const productsToUpdateIfood = [];
        if (d.cart) {
            const gData = G.getDataRange().getValues();
            const headers = gData[0].map(h => String(h).trim());
            const idIdx = headers.indexOf('ID_Geladinho');
            const stkIdx = headers.indexOf('Estoque_Atual');
            const nomeIdx = headers.indexOf('Nome_Geladinho');
            const precoIdx = headers.indexOf('Preco_Venda');
            const imgIdx = headers.indexOf('Imagem_Geladinho');
            const ativoIdx = headers.indexOf('Produto_Ativo');
            if (idIdx === -1 || stkIdx === -1) return { success: false, message: 'Erro estrutural: Estoque.' };
            const stockMap = {};
            for (let i = 1; i < gData.length; i++) {
                const pId = String(gData[i][idIdx]).trim();
                if (pId)
                    stockMap[pId] = {
                        current: Number(gData[i][stkIdx]) || 0,
                        row: i + 1,
                        nome: gData[i][nomeIdx] || pId,
                        preco: gData[i][precoIdx],
                        imagem_raw: gData[i][imgIdx]
                    };
            }
            for (const item of d.cart) {
                const qtdPedida = Number(item.quantity) || 1;
                const prodId = String(item.id).trim();
                const info = stockMap[prodId];
                if (!info) return { success: false, message: `Produto inválido: ${item.nome}` };
                if (info.current < qtdPedida)
                    return { success: false, message: `Estoque insuficiente: ${info.nome} (Restam: ${info.current})` };
            }
            const newItemsRows = [];
            d.cart.forEach(item => {
                const qtd = Number(item.quantity) || 1;
                const pId = String(item.id).trim();
                const info = stockMap[pId];
                newItemsRows.push([
                    Utilities.getUuid(), id, pId, qtd, item.price, qtd * item.price,
                    item.details ? JSON.stringify(item.details) : ''
                ]);
                const novoEstoque = info.current - qtd;
                G.getRange(info.row, stkIdx + 1).setValue(novoEstoque);
                if (novoEstoque <= 0 && ativoIdx > -1) {
                    G.getRange(info.row, ativoIdx + 1).setValue(false);
                }
                productsToUpdateInSupabase.push({
                    id: pId, nome: info.nome, preco: info.preco, estoque: novoEstoque,
                    categoria_id: '', descricao: '',
                    imagem_url: normalizarUrlImagem({ Imagem_Geladinho: info.imagem_raw })
                });
                productsToUpdateIfood.push({ id: pId, estoque: novoEstoque });
            });
            if (newItemsRows.length > 0) {
                I.getRange(I.getLastRow() + 1, 1, newItemsRows.length, newItemsRows[0].length).setValues(newItemsRows);
            }
            SpreadsheetApp.flush();
        }
        const nomeCliente = d.customer?.name || d.customer?.details?.nome || 'Visitante';
        const telCliente = d.customer?.details?.telefone || '';
        const isGuest = !d.customer?.id || d.customer?.id === 'GUEST';
        V.appendRow([
            id, now, isGuest ? 'GUEST' : d.customer.id, obs, d.total, d.total, 'Pendente', disc,
            pts > 0, d.deliveryFee, nomeCliente, d.customer?.details?.torre, d.customer?.details?.apto,
            d.paymentMethod, d.scheduling || 'Imediata', telCliente
        ]);
        if (H && d.couponCode && !isGuest) {
            try {
                const idHist = Utilities.getUuid();
                H.appendRow([idHist, d.couponCode, d.customer.id, id, now, disc]);
                syncSingleUsageToSupabase({
                    ID_Historico: idHist, Codigo_Cupom: d.couponCode, ID_Cliente: d.customer.id,
                    ID_Venda: id, Data_Uso: now, Valor_Desconto: disc
                });
            } catch (e) {}
        }
        if (!isGuest) processLoyaltyAndReferral(C, d, pts);
        if (productsToUpdateInSupabase.length > 0) {
            try { syncUpdatedProductsToSupabase(productsToUpdateInSupabase); } catch (syncError) {
                Logger.log('⚠️ Sync parcial falhou (não crítico): ' + syncError.toString());
            }
            try { syncStockToIfood(productsToUpdateIfood); } catch (ifoodError) {
                Logger.log('⚠️ iFood Sync falhou: ' + ifoodError.toString());
            }
        }
        try {
            const qtdTotal = d.cart ? d.cart.reduce((a, b) => a + (Number(b.quantity) || 1), 0) : 0;
            notifyAlexaNewOrder({ nomeCliente: nomeCliente, total: d.total, qtdItens: qtdTotal });
        } catch (e) {}
        return { success: true, idVenda: id };
    } catch (error) {
        return { success: false, message: 'Erro: ' + error.toString() };
    } finally {
        lock.releaseLock();
    }
}

function processLoyaltyAndReferral(C, d, pts) {
    const cData = C.getDataRange().getValues();
    const h = cData[0].map(x => String(x).trim());
    const idIdx = h.indexOf('ID_Cliente');
    const ptsIdx = h.indexOf('Pontos_Fidelidade');
    const codeIdx = h.indexOf('Codigo_Convite');
    const indIdx = h.indexOf('Indicado_Por');
    if (idIdx === -1 || ptsIdx === -1) return;
    let row = -1;
    let client = null;
    for (let i = 1; i < cData.length; i++) {
        if (String(cData[i][idIdx]) === String(d.customer.id)) {
            row = i + 1;
            client = cData[i];
            break;
        }
    }
    if (row > 0) {
        const earned = Math.floor(Number(d.total));
        const bonus = Number(d.bonusPoints || 0);
        const newPts = Math.max(0, (Number(client[ptsIdx]) || 0) + earned + bonus - pts);
        C.getRange(row, ptsIdx + 1).setValue(newPts);
        if (d.customer.details) {
            const det = d.customer.details;
            const tIdx = h.indexOf('Torre');
            const aIdx = h.indexOf('Apartamento');
            const eIdx = h.indexOf('Endereco');
            if (tIdx > -1 && det.torre) C.getRange(row, tIdx + 1).setValue(det.torre);
            if (aIdx > -1 && det.apto) C.getRange(row, aIdx + 1).setValue(det.apto);
            if (eIdx > -1 && det.rua) C.getRange(row, eIdx + 1).setValue(`${det.rua}, ${det.numero} - ${det.bairro}`);
        }
        if (d.referralCode && codeIdx > -1) {
            const jaUsou = indIdx > -1 && String(client[indIdx] || '').trim() !== '';
            if (!jaUsou) {
                for (let k = 1; k < cData.length; k++) {
                    if (
                        String(cData[k][codeIdx]).trim() == String(d.referralCode).trim() &&
                        String(cData[k][idIdx]) !== String(d.customer.id)
                    ) {
                        C.getRange(k + 1, ptsIdx + 1).setValue((Number(cData[k][ptsIdx]) || 0) + 50);
                        if (indIdx > -1) C.getRange(row, indIdx + 1).setValue(d.referralCode);
                        break;
                    }
                }
            }
        }
    }
}
```
