# Code.gs Atualizado - PARTE 2 de 2

> **Cole este conteúdo logo após a PARTE 1 no seu Code.gs**
> **A função `createReview` abaixo é a ÚNICA com alteração (pontos de fidelidade adicionados)**

```javascript
function getProductWithAdditions(productId) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const produtosSheet = ss.getSheetByName('GELADINHOS');
    const gruposSheet = ss.getSheetByName('GRUPOS_ADICIONAIS');
    const adicionaisSheet = ss.getSheetByName('ADICIONAIS');
    const produtos = sheetToJSON(produtosSheet);
    const produto = produtos.find(p => String(p.ID_Geladinho).trim() === String(productId).trim());
    if (!produto) return { success: false, error: 'Produto não encontrado' };
    produto.URL_IMAGEM_CACHE = normalizarUrlImagem(produto);
    if (
        !produto.Tem_Adicionais ||
        (String(produto.Tem_Adicionais).toUpperCase() !== 'TRUE' && produto.Tem_Adicionais !== true)
    ) {
        return produto;
    }
    const grupoIds = String(produto.IDs_Grupos_Adicionais || '').split(',').map(id => id.trim()).filter(id => id);
    if (grupoIds.length === 0) return produto;
    const grupos = sheetToJSON(gruposSheet)
        .filter(g => grupoIds.includes(String(g.ID_Grupo).trim()) && (String(g.Ativo).toUpperCase() === 'TRUE' || g.Ativo === true))
        .sort((a, b) => Number(a.Ordem) - Number(b.Ordem));
    const adicionais = sheetToJSON(adicionaisSheet);
    produto.addition_groups = grupos.map(grupo => ({
        id: grupo.ID_Grupo, name: grupo.Nome_Grupo, type: grupo.Tipo,
        required: Number(grupo.Min) > 0, min: Number(grupo.Min), max: Number(grupo.Max), order: Number(grupo.Ordem),
        options: adicionais
            .filter(a => String(a.ID_Grupo).trim() === String(grupo.ID_Grupo).trim())
            .sort((a, b) => Number(a.Ordem) - Number(b.Ordem))
            .map(a => ({
                id: a.ID_Adicional, sku: a.SKU, name: a.Nome, price: Number(a.Preco),
                stock_status: a.Status_Estoque, image_url: a.Imagem_URL || null, order: Number(a.Ordem)
            }))
    }));
    return produto;
}

function validateAndCalculatePrice(data) {
    const { productId, selectedAdditions, quantity } = data;
    const produto = getProductWithAdditions(productId);
    if (produto.error) return { success: false, error: produto.error };
    let additionsTotal = 0;
    const validatedAdditions = [];
    if (!produto.addition_groups || produto.addition_groups.length === 0) {
        const basePrice = Number(produto.Preco_Venda);
        return {
            success: true, base_price: basePrice, additions_subtotal: 0, unit_price: basePrice,
            quantity: quantity, total_price: basePrice * quantity, validated_additions: []
        };
    }
    for (const selection of selectedAdditions || []) {
        const grupo = produto.addition_groups.find(g => g.id === selection.group_id);
        if (!grupo) return { success: false, error: `Grupo ${selection.group_id} não encontrado` };
        const opcao = grupo.options.find(o => o.id === selection.option_id);
        if (!opcao) return { success: false, error: `Opção ${selection.option_id} não encontrada` };
        if (opcao.stock_status === 'out_of_stock') return { success: false, error: `${opcao.name} está indisponível` };
        additionsTotal += opcao.price;
        validatedAdditions.push({
            group_id: grupo.id, group_name: grupo.name, option_id: opcao.id,
            option_sku: opcao.sku, option_name: opcao.name, option_price: opcao.price
        });
    }
    const basePrice = Number(produto.Preco_Venda);
    const unitPrice = basePrice + additionsTotal;
    return {
        success: true, base_price: basePrice, additions_subtotal: additionsTotal, unit_price: unitPrice,
        quantity: quantity, total_price: unitPrice * quantity, validated_additions: validatedAdditions
    };
}

function getMixWithFlavorAndAdditions(mixId) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const mixSheet = ss.getSheetByName('MIX_PRODUTOS');
    const saboresSheet = ss.getSheetByName('MIX_SABORES');
    const gruposSheet = ss.getSheetByName('GRUPOS_ADICIONAIS');
    const adicionaisSheet = ss.getSheetByName('ADICIONAIS');
    if (!mixSheet || !saboresSheet) return { error: 'Sheets MIX_PRODUTOS ou MIX_SABORES não encontradas' };
    const mixes = sheetToJSON(mixSheet);
    const mix = mixes.find(m => String(m.ID_Mix).trim() === String(mixId).trim());
    if (!mix) return { error: 'Mix não encontrado' };
    const sabores = sheetToJSON(saboresSheet);
    const availableFlavors = sabores
        .filter(s => String(s.Ativo).toUpperCase() === 'TRUE' || s.Ativo === true)
        .map(s => ({
            id: s.ID_Sabor, name: s.Nome_Sabor, category: s.Categoria || 'Geral',
            price: Number(s.Preco_Adicional || 0),
            stock_status: String(s.Status_Estoque).toLowerCase() === 'disponivel' ? 'available' : 'out_of_stock',
            image_url: normalizarUrlImagem(s) || null
        }))
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    let additionGroups = [];
    if (mix.IDs_Grupos_Adicionais) {
        const grupoIds = String(mix.IDs_Grupos_Adicionais).split(',').map(id => id.trim()).filter(id => id);
        if (grupoIds.length > 0 && gruposSheet && adicionaisSheet) {
            const grupos = sheetToJSON(gruposSheet);
            const adicionais = sheetToJSON(adicionaisSheet);
            additionGroups = grupos
                .filter(g => grupoIds.includes(String(g.ID_Grupo).trim()) && (String(g.Ativo).toUpperCase() === 'TRUE' || g.Ativo === true))
                .map(grupo => ({
                    id: grupo.ID_Grupo, name: grupo.Nome_Grupo, type: grupo.Tipo,
                    required: Number(grupo.Min) > 0, min: Number(grupo.Min), max: Number(grupo.Max), order: Number(grupo.Ordem),
                    options: adicionais
                        .filter(a => String(a.ID_Grupo).trim() === String(grupo.ID_Grupo).trim())
                        .map(a => ({
                            id: a.ID_Adicional, sku: a.SKU, name: a.Nome, price: Number(a.Preco),
                            stock_status: a.Status_Estoque, image_url: normalizarUrlImagem(a) || null, order: Number(a.Ordem)
                        }))
                        .sort((a, b) => a.order - b.order)
                }))
                .sort((a, b) => a.order - b.order);
        }
    }
    return {
        id: mix.ID_Mix, name: mix.Nome_Mix, type: 'mix',
        base_price: Number(mix.Preco_Base || 0), price_per_flavor: Number(mix.Preco_Por_Sabor || 0),
        max_flavors: Number(mix.Max_Sabores || 2), category_id: mix.ID_Categoria,
        category_name: mix.Nome_Categoria || 'Mix', stock: Number(mix.Estoque || 0),
        flavors: availableFlavors, addition_groups: additionGroups
    };
}

function calculateMixPrice(data) {
    const { mixId, selectedFlavors, selectedAdditions, quantity } = data;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const mixSheet = ss.getSheetByName('MIX_PRODUTOS');
    const saboresSheet = ss.getSheetByName('MIX_SABORES');
    if (!mixSheet || !saboresSheet) return { success: false, error: 'Configuração incompleta' };
    const mixes = sheetToJSON(mixSheet);
    const mix = mixes.find(m => String(m.ID_Mix).trim() === String(mixId).trim());
    if (!mix) return { success: false, error: 'Mix não encontrado' };
    const basePrice = Number(mix.Preco_Base || 0);
    const pricePerFlavor = Number(mix.Preco_Por_Sabor || 0);
    const sabores = sheetToJSON(saboresSheet);
    const validatedFlavors = [];
    for (const flavorId of selectedFlavors || []) {
        const sabor = sabores.find(s => String(s.ID_Sabor).trim() === String(flavorId).trim());
        if (sabor)
            validatedFlavors.push({ flavor_id: sabor.ID_Sabor, flavor_name: sabor.Nome_Sabor, flavor_price: pricePerFlavor });
    }
    let additionsSubtotal = 0;
    const validatedAdditions = [];
    if (selectedAdditions && selectedAdditions.length > 0) {
        const adicionaisSheet = ss.getSheetByName('ADICIONAIS');
        if (adicionaisSheet) {
            const adicionais = sheetToJSON(adicionaisSheet);
            for (const addition of selectedAdditions) {
                const adicional = adicionais.find(a => String(a.ID_Adicional).trim() === String(addition.option_id).trim());
                if (adicional) {
                    additionsSubtotal += Number(adicional.Preco);
                    validatedAdditions.push({
                        group_id: addition.group_id, group_name: addition.group_name,
                        option_id: adicional.ID_Adicional, option_name: adicional.Nome, option_price: Number(adicional.Preco)
                    });
                }
            }
        }
    }
    const unitPrice = basePrice + validatedFlavors.length * pricePerFlavor + additionsSubtotal;
    return {
        success: true, base_price: basePrice, unit_price: unitPrice, total_price: unitPrice * quantity,
        validated_flavors: validatedFlavors, validated_additions: validatedAdditions
    };
}

function getProductReviews(productId) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('AVALIACOES');
    if (!sheet) return [];
    const reviews = sheetToJSON(sheet);
    const approvedReviews = reviews.filter(review => {
        const pidReview = String(review.ID_Produto || review.ID_Geladinho || '').trim();
        const pidSearch = String(productId).trim();
        return pidReview === pidSearch && String(review.Status || '').toUpperCase() === 'APROVADA';
    });
    return approvedReviews.map(review => ({
        id: review.ID_Avaliacao,
        customerName: review.Nome_Cliente || 'Anônimo',
        rating: Number(review.Rating || review.Nota || 0),
        comment: review.Comentario || review.Comment || '',
        date: review.Data_Avaliacao
    }));
}

// ✅ FUNÇÃO ATUALIZADA COM PONTOS DE FIDELIDADE
function createReview(data) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('AVALIACOES');
    if (!sheet) return { success: false, message: 'Erro sistema' };
    if (!data.customerId || !data.productId || !data.rating) return { success: false, message: 'Dados incompletos' };
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const columnMap = {};
    headers.forEach((header, index) => {
        if (header) columnMap[String(header).trim()] = index;
    });

    let pontosMensagem = '';
    if (data.pointsEarned && Number(data.pointsEarned) > 0) {
        try {
            const clientesSheet = ss.getSheetByName('CLIENTES');
            if (clientesSheet) {
                const cData = clientesSheet.getDataRange().getValues();
                const h = cData[0].map(x => String(x).trim());
                const idIdx = h.indexOf('ID_Cliente');
                const ptsIdx = h.indexOf('Pontos_Fidelidade');
                if (idIdx > -1 && ptsIdx > -1) {
                    for (let i = 1; i < cData.length; i++) {
                        if (String(cData[i][idIdx]) === String(data.customerId)) {
                            const pontosAtuais = Number(cData[i][ptsIdx]) || 0;
                            const novosPontos = pontosAtuais + Number(data.pointsEarned);
                            clientesSheet.getRange(i + 1, ptsIdx + 1).setValue(novosPontos);
                            pontosMensagem = ` Você ganhou +${data.pointsEarned} pontos de fidelidade!`;
                            Logger.log(`💎 Pontos review: +${data.pointsEarned} para ${data.customerId}. Total: ${novosPontos}`);
                            break;
                        }
                    }
                }
            }
        } catch (error) {
            Logger.log('⚠️ Erro ao creditar pontos de review: ' + error.toString());
        }
    }

    const reviewId = 'REV-' + Utilities.getUuid().substring(0, 8);
    const row = new Array(headers.length).fill('');
    if (columnMap['ID_Avaliacao'] !== undefined) row[columnMap['ID_Avaliacao']] = reviewId;
    if (columnMap['ID_Cliente'] !== undefined) row[columnMap['ID_Cliente']] = data.customerId;
    if (columnMap['ID_Produto'] !== undefined) row[columnMap['ID_Produto']] = data.productId;
    if (columnMap['ID_Venda'] !== undefined) row[columnMap['ID_Venda']] = data.orderId || '';
    if (columnMap['Nome_Cliente'] !== undefined) row[columnMap['Nome_Cliente']] = data.customerName || 'Cliente';
    if (columnMap['Rating'] !== undefined) row[columnMap['Rating']] = Number(data.rating);
    const comentarioCol = columnMap['Comentario'] || columnMap['Comentário'] || columnMap['Comment'];
    if (comentarioCol !== undefined) row[comentarioCol] = data.comment || '';
    if (columnMap['Data_Avaliacao'] !== undefined) row[columnMap['Data_Avaliacao']] = new Date();
    if (columnMap['Status'] !== undefined) row[columnMap['Status']] = 'Pendente';
    sheet.appendRow(row);
    return { success: true, message: 'Avaliação enviada!' + pontosMensagem, reviewId: reviewId };
}

function getAdminReviews() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('AVALIACOES');
    if (!sheet) return [];
    const reviews = sheetToJSON(sheet);
    return reviews
        .map(review => ({
            id: review.ID_Avaliacao,
            productId: review.ID_Produto || review.ID_Geladinho,
            productName: review.Nome_Geladinho || 'Produto',
            customerId: review.ID_Cliente,
            customerName: review.Nome_Cliente || 'Cliente',
            rating: Number(review.Rating || review.Nota || 0),
            comment: review.Comentario || '',
            date: review.Data_Avaliacao,
            status: review.Status || 'Pendente'
        }))
        .reverse();
}

function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
    const lock = LockService.getScriptLock();
    try { lock.waitLock(30000); } catch (e) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Busy' })).setMimeType(ContentService.MimeType.JSON);
    }
    try {
        const action = e.parameter.action;
        let data = {};
        if (e.postData && e.postData.contents) {
            try { data = JSON.parse(e.postData.contents); } catch (err) {}
        }
        if (['getAdminOrders','updateOrderStatus','getOrderItems','getDashboardStats','getAdminReviews','updateReviewStatus'].includes(action)) {
            if ((e.parameter.adminKey || data.adminKey) !== ADMIN_PASS)
                return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Unauthorized' })).setMimeType(ContentService.MimeType.JSON);
        }
        let result = { error: 'Invalid Action' };
        switch (action) {
            case 'getCatalogData': result = getCatalogData(); break;
            case 'getProducts': result = getProducts(); break;
            case 'getCategories': result = getCategories(); break;
            case 'getBanners': result = getBanners(); break;
            case 'getConfig': result = getConfig(); break;
            case 'getOrders': result = getOrders(e.parameter.customerId); break;
            case 'validateCoupon': result = data.code ? validateCouponWithContext(data) : validateCoupon(e.parameter.code); break;
            case 'getReviews': result = getProductReviews(e.parameter.productId); break;
            case 'getProductWithAdditions': result = getProductWithAdditions(e.parameter.productId); break;
            case 'calculateItemPrice': result = validateAndCalculatePrice(data); break;
            case 'getAdminOrders': result = getAdminOrders(); break;
            case 'getOrderItems': result = getOrderItems(e.parameter.orderId); break;
            case 'getDashboardStats': result = getDashboardStats(); break;
            case 'getAdminReviews': result = getAdminReviews(); break;
            case 'getExportData': result = getExportData(); break;
            case 'createCustomer': result = createCustomer(data); break;
            case 'loginCustomer': result = loginCustomer(data); break;
            case 'createOrder': result = createOrder(data); break;
            case 'updateFavorites': result = updateFavorites(data); break;
            case 'updateOrderStatus': result = updateOrderStatus(data); break;
            case 'createReview': result = createReview(data); break;
            case 'updateReviewStatus': result = updateReviewStatus(data); break;
            case 'getMixWithFlavorAndAdditions': result = getMixWithFlavorAndAdditions(e.parameter.mixId); break;
            case 'calculateMixPrice': result = calculateMixPrice(data); break;
            case 'getMinhasChances': result = getMinhasChances(e.parameter.customerId); break;
            case 'validateReferralCode': result = validateReferralCode(e.parameter.code, e.parameter.customerId); break;
            case 'calculateDelivery': result = calculateDeliveryFee(data); break;
            case 'forceSync': fullSyncToSupabase(); result = { success: true }; break;
        }
        return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
    } finally {
        lock.releaseLock();
    }
}

function getCatalogData() {
    const cache = CacheService.getScriptCache();
    const cached = cache.get('catalog_data_v3');
    if (cached) return JSON.parse(cached);
    const data = { products: getProducts(), categories: getCategories(), banners: getBanners(), _cached_at: new Date() };
    if (data.products.length > 0) cache.put('catalog_data_v3', JSON.stringify(data), 300);
    return data;
}

function getProducts() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('GELADINHOS');
    if (!sheet) return [];
    SpreadsheetApp.flush();
    const raw = sheetToJSON(sheet);
    return raw.map(p => {
        let isActive = p.Produto_Ativo === true || p.Produto_Ativo === 1 || ['TRUE', 'SIM'].includes(String(p.Produto_Ativo).toUpperCase().trim());
        let hasAdditions = p.Tem_Adicionais === true || p.Tem_Adicionais === 1 || ['TRUE', 'SIM'].includes(String(p.Tem_Adicionais).toUpperCase().trim());
        return { ...p, Produto_Ativo: isActive, Tem_Adicionais: hasAdditions, URL_IMAGEM_CACHE: normalizarUrlImagem(p) };
    }).filter(p => p.Produto_Ativo);
}

function getCategories() { return sheetToJSON(SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CATEGORIAS_GELADINHO')); }

function getBanners() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('BANNERS');
    if (!sheet) return [];
    return sheetToJSON(sheet).filter(b => b.Ativo === true || String(b.Ativo).toUpperCase() === 'TRUE').map(b => ({ ...b, URL_Imagem: normalizarUrlImagem(b) }));
}

function getConfig() { return sheetToJSON(SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CONFIGURACOES')); }

function getOrders(cid) {
    return sheetToJSON(SpreadsheetApp.getActiveSpreadsheet().getSheetByName('VENDAS')).filter(o => String(o.ID_Cliente).trim() === String(cid).trim()).reverse();
}

function getAdminOrders() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const v = sheetToJSON(ss.getSheetByName('VENDAS'));
    const c = sheetToJSON(ss.getSheetByName('CLIENTES'));
    const cMap = {};
    c.forEach(cl => (cMap[String(cl.ID_Cliente).trim()] = cl.Nome));
    return {
        orders: v.map(o => ({
            ...o, Nome_Cliente: cMap[String(o.ID_Cliente).trim()] || o.Nome_Cliente || 'Visitante',
            deliveryFee: o.Taxa_Entrega, discount: o.Desconto
        })).reverse()
    };
}

function getOrderItems(oid) {
    const iData = sheetToJSON(SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ITENS_VENDA'));
    const pData = sheetToJSON(SpreadsheetApp.getActiveSpreadsheet().getSheetByName('GELADINHOS'));
    return iData.filter(i => String(i.ID_Venda).trim() === String(oid).trim()).map(i => {
        const p = pData.find(pid => String(pid.ID_Geladinho).trim() === String(i.ID_Geladinho).trim());
        return { nome: p ? p.Nome_Geladinho : 'Item excluído', qtd: i.Quantidade, total: i.Total_Item, details: i.Detalhes ? JSON.parse(i.Detalhes) : null };
    });
}

function updateOrderStatus(d) {
    const s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('VENDAS');
    const v = s.getDataRange().getValues();
    const idx = v[0].indexOf('ID_Venda');
    const st = v[0].indexOf('Status');
    for (let i = 1; i < v.length; i++) {
        if (String(v[i][idx]) === String(d.orderId)) { s.getRange(i + 1, st + 1).setValue(d.newStatus); return { success: true }; }
    }
    return { success: false };
}

function updateReviewStatus(d) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('AVALIACOES');
    const data = sheet.getDataRange().getValues();
    const idIdx = data[0].indexOf('ID_Avaliacao');
    const stIdx = data[0].indexOf('Status');
    for (let i = 1; i < data.length; i++) {
        if (String(data[i][idIdx]) === String(d.reviewId)) { sheet.getRange(i + 1, stIdx + 1).setValue(d.newStatus); return { success: true }; }
    }
    return { success: false };
}

function loginCustomer(d) {
    if (String(d.phone).trim().toLowerCase() === ADMIN_LOGIN && String(d.password).trim() === ADMIN_PASS)
        return { success: true, customer: { ID_Cliente: 'ADMIN', Nome: 'Admin', isAdmin: true, adminKey: ADMIN_PASS } };
    const users = sheetToJSON(SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CLIENTES'));
    const u = users.find(c => String(c.Telefone).replace(/\D/g, '') === String(d.phone).replace(/\D/g, ''));
    if (u && String(u.Senha) === String(d.password)) return { success: true, customer: { ...u, Senha: '' } };
    return { success: false, message: 'Dados inválidos.' };
}

function createCustomer(d) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CLIENTES');
    const users = sheetToJSON(sheet);
    if (users.find(c => String(c.Telefone).replace(/\D/g, '') === String(d.phone).replace(/\D/g, ''))) return { success: false };
    const id = 'CLI-' + Math.floor(Math.random() * 90000 + 10000);
    const code = 'DCAP-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    sheet.appendRow([id, d.name, d.phone, '', '', '', '', '', 0, new Date(), 'SIM', d.password, code, '', '']);
    return { success: true, customer: { id, name: d.name } };
}

function validateReferralCode(code, cid) {
    if (!code || !cid || cid === 'GUEST') return { valid: false };
    const clients = sheetToJSON(SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CLIENTES'));
    const normalizedCode = String(code).trim().toUpperCase();
    const owner = clients.find(c => String(c.Codigo_Convite).toUpperCase() === normalizedCode);
    if (!owner) return { valid: false, message: 'Código não encontrado' };
    if (String(owner.ID_Cliente) === String(cid)) return { valid: false, message: 'Código próprio' };
    const me = clients.find(c => String(c.ID_Cliente) === String(cid));
    if (me && me.Indicado_Por) return { valid: false, message: 'Já utilizou indicação' };
    return { valid: true, message: 'Válido!' };
}

function updateFavorites(d) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CLIENTES');
    const data = sheet.getDataRange().getValues();
    const telIdx = data[0].indexOf('Telefone');
    const favIdx = data[0].indexOf('Favoritos') > -1 ? data[0].indexOf('Favoritos') : 14;
    for (let i = 1; i < data.length; i++) {
        if (String(data[i][telIdx]).replace(/\D/g, '') === String(d.phone).replace(/\D/g, '')) {
            sheet.getRange(i + 1, favIdx + 1).setValue(d.favorites); return { success: true };
        }
    }
    return { success: false };
}

function getDashboardStats() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const vendas = sheetToJSON(ss.getSheetByName('VENDAS'));
    const itens = sheetToJSON(ss.getSheetByName('ITENS_VENDA'));
    const prods = sheetToJSON(ss.getSheetByName('GELADINHOS'));
    const adds = sheetToJSON(ss.getSheetByName('ADICIONAIS'));
    const metasSheet = ss.getSheetByName('METAS');
    const metas = metasSheet ? sheetToJSON(metasSheet) : [];
    const now = new Date();
    const currentMonthStr = Utilities.formatDate(now, 'GMT-3', 'MMMM yyyy');
    const monthMetas = metas.find(m => String(m.Mes).toLowerCase().includes(currentMonthStr.split(' ')[0].toLowerCase())) || { Meta_Vendas: 0, Meta_Lucro: 0 };
    let totalRev = 0;
    let totalProfit = 0;
    const costMap = {};
    prods.forEach(p => (costMap[String(p.ID_Geladinho).trim()] = Number(p.Preco_Custo || 0)));
    const addCostMap = {};
    adds.forEach(a => (addCostMap[String(a.ID_Adicional).trim()] = Number(a.Preco_Custo || 0)));
    vendas.forEach(v => {
        const rev = Number(v.Total_Venda) || 0;
        totalRev += rev;
        let orderCost = 0;
        const orderItems = itens.filter(i => String(i.ID_Venda).trim() === String(v.ID_Venda).trim());
        orderItems.forEach(item => {
            const unitCost = costMap[String(item.ID_Geladinho).trim()] || 0;
            orderCost += unitCost * (Number(item.Quantidade) || 0);
        });
        totalProfit += rev - orderCost;
    });
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        last7Days.push({ date: d, label: Utilities.formatDate(d, 'GMT-3', 'dd/MM'), revenue: 0, profit: 0 });
    }
    vendas.forEach(v => {
        const vDate = new Date(v.Data_Venda);
        const day = last7Days.find(d => d.date.getDate() === vDate.getDate() && d.date.getMonth() === vDate.getMonth());
        if (day) {
            const rev = Number(v.Total_Venda) || 0;
            day.revenue += rev;
            let orderCost = 0;
            itens.filter(i => String(i.ID_Venda).trim() === String(v.ID_Venda).trim()).forEach(it => {
                orderCost += (costMap[String(it.ID_Geladinho).trim()] || 0) * (Number(it.Quantidade) || 0);
            });
            day.profit += rev - orderCost;
        }
    });
    const finalWeeklyChart = last7Days.map(d => ({ name: d.label, revenue: d.revenue, profit: d.profit }));
    const hours = new Array(24).fill(0);
    vendas.forEach(v => { hours[new Date(v.Data_Venda).getHours()]++; });
    const peakHours = hours.map((count, h) => ({ hour: `${h}h`, count }));
    const locations = {};
    vendas.forEach(v => { const loc = v.Condominio || (v.Torre ? `Torre ${v.Torre}` : 'Outros'); locations[loc] = (locations[loc] || 0) + 1; });
    const heatmap = Object.keys(locations).map(name => ({ name, value: locations[name] })).sort((a, b) => b.value - a.value);
    const counts = {};
    itens.forEach(i => (counts[i.ID_Geladinho] = (counts[i.ID_Geladinho] || 0) + Number(i.Quantidade)));
    const ranking = Object.keys(counts).map(id => {
        const p = prods.find(x => String(x.ID_Geladinho) === String(id));
        return { name: p ? p.Nome_Geladinho : id, value: counts[id] };
    }).sort((a, b) => b.value - a.value).slice(0, 5);
    return {
        totalRevenue: totalRev, totalProfit: totalProfit, totalOrders: vendas.length,
        avgTicket: vendas.length > 0 ? totalRev / vendas.length : 0, topFlavors: ranking,
        weeklyChart: finalWeeklyChart, peakHours: peakHours, heatmap: heatmap,
        goals: { sales: Number(monthMetas.Meta_Vendas || 0), profit: Number(monthMetas.Meta_Lucro || 0), currentSales: totalRev, currentProfit: totalProfit }
    };
}

function getExportData() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const v = sheetToJSON(ss.getSheetByName('VENDAS'));
    const i = sheetToJSON(ss.getSheetByName('ITENS_VENDA'));
    const c = sheetToJSON(ss.getSheetByName('CLIENTES'));
    const cMap = {};
    c.forEach(u => (cMap[String(u.ID_Cliente).trim()] = u.Nome));
    return {
        vendas: v.map(o => ({ ...o, Nome_Cliente: cMap[String(o.ID_Cliente).trim()] || o.Nome_Cliente || 'Visitante' })),
        itens: i
    };
}

function getMinhasChances(cid) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('SORTEIOS');
    if (!sheet) return { chances: [] };
    return { chances: sheetToJSON(sheet).filter(r => String(r.ID_Cliente) === String(cid)) };
}

function calculateDeliveryFee(data) {
    const { deliveryType, addressData } = data;
    if (deliveryType === 'CONDO') return { success: true, fee: 0, message: 'Grátis' };
    const cepFormatado = addressData.cep ? addressData.cep.replace(/(\d{5})(\d{3})/, '$1-$2') : '';
    const fullAddr = `${addressData.rua}, ${addressData.numero}, ${addressData.bairro}, ${cepFormatado}, Curitiba, PR, Brazil`;
    const coords = getGeoapifyCoordinates(fullAddr);
    if (!coords) return { success: true, fee: 5, message: 'Taxa Fixa' };
    const dist = getGeoapifyDistanceKm(STORE_LOCATION, coords);
    if (dist === null) return { success: true, fee: 5, message: 'Taxa Fixa' };
    let fee = Math.max(DELIVERY_PRICING.MIN_FEE, DELIVERY_PRICING.BASE_FEE + dist * DELIVERY_PRICING.KM_RATE);
    if (deliveryType === 'NEIGHBOR' && dist <= 3) fee *= DELIVERY_PRICING.NEIGHBOR_DISCOUNT;
    return { success: true, fee: Math.ceil(fee * 2) / 2, distanceKm: dist };
}

function getGeoapifyCoordinates(addr) {
    try {
        const response = Maps.newGeocoder().setLanguage('pt-BR').setRegion('br').geocode(addr);
        if (response.status === 'OK' && response.results && response.results.length > 0) {
            const location = response.results[0].geometry.location;
            return { lat: location.lat, lon: location.lng };
        }
    } catch (e) { Logger.log('Erro geocoding: ' + e); }
    return null;
}

function getGeoapifyDistanceKm(origin, dest) {
    try {
        const directions = Maps.newDirectionFinder()
            .setOrigin(origin.lat, origin.lon).setDestination(dest.lat, dest.lon)
            .setMode(Maps.DirectionFinder.Mode.DRIVING).getDirections();
        if (directions.status === 'OK' && directions.routes && directions.routes.length > 0) {
            const route = directions.routes[0];
            if (route.legs && route.legs.length > 0) return route.legs[0].distance.value / 1000;
        }
    } catch (e) { Logger.log('Erro distância: ' + e); }
    return null;
}

function sheetToJSON(s) {
    if (!s) return [];
    const v = s.getDataRange().getValues();
    const h = v[0];
    const r = [];
    for (let i = 1; i < v.length; i++) {
        const o = {};
        for (let j = 0; j < h.length; j++) if (h[j]) o[h[j]] = v[i][j];
        r.push(o);
    }
    return r;
}

function normalizarUrlImagem(row) {
    const cols = ['Imagem_Geladinho', 'Imagem_URL', 'URL_IMAGEM_CACHE', 'URL_Imagem', 'Imagem'];
    for (const c of cols) {
        const val = String(row[c] || '').trim();
        if (val.startsWith('http')) return val;
        if (val.includes('/')) {
            try {
                const f = DriveApp.getFilesByName(val.split('/').pop());
                if (f.hasNext()) {
                    const file = f.next();
                    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
                    return `https://drive.google.com/thumbnail?id=${file.getId()}&sz=w1000`;
                }
            } catch (e) {}
        }
    }
    return '';
}
```
