const ADMIN_LOGIN = "admin";
const ADMIN_PASS = "Jxd701852@";

// ============================================================================
// 🚀 SUPABASE SYNC - Configuração
// ============================================================================
const SUPABASE_URL = 'https://zuecbccyuflfkczzyrpd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1ZWNiY2N5dWZsZmtjenp5cnBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2NjgxNDcsImV4cCI6MjA4MzI0NDE0N30.vkyybk9_KXieXKJLEHrGWS29dR8RDdUfE6B1lD5bdcE';

// 📍 GEOAPIFY CONFIG
const GEOAPIFY_API_KEY = 'd27379dd6767460a889d57258635842f'; 
const STORE_LOCATION = {
  lat: -25.53427,
  lon: -49.29026,
  address: 'Rua Reinaldo Stocco, 274 - Pinheirinho, Curitiba - PR'
};

// 💰 CONFIGURAÇÃO DE PREÇOS DE ENTREGA (Estilo Uber)
const DELIVERY_PRICING = {
  BASE_FEE: 3.50,       // Taxa inicial para cobrir deslocamento
  KM_RATE: 1.20,        // Valor por km rodado
  MIN_FEE: 5.00,        // Valor mínimo da corrida
  NEIGHBOR_DISCOUNT: 0.5 // 50% off para vizinhos próximos (<= 3km)
};

/**
 * =====================================================
 * 🔄 SUPABASE SYNC SYSTEM
 * =====================================================
 */

/**
 * 🗑️ Busca IDs existentes no Supabase e deleta os que não existem mais no Google Sheets
 */
function deleteOrphanedFromSupabase(tableName, currentIds) {
  if (SUPABASE_URL.includes('SEU_PROJECT')) return;
  if (!currentIds || currentIds.length === 0) return;
  
  try {
    const response = UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=id`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() !== 200) {
      Logger.log(`⚠️ Erro ao buscar IDs do Supabase (${tableName}): ${response.getContentText()}`);
      return;
    }
    
    const supabaseData = JSON.parse(response.getContentText());
    const supabaseIds = supabaseData.map(item => String(item.id));
    const currentIdsSet = new Set(currentIds.map(id => String(id)));
    const orphanedIds = supabaseIds.filter(id => !currentIdsSet.has(id));
    
    if (orphanedIds.length === 0) return;
    
    Logger.log(`🗑️ [${tableName}] Deletando ${orphanedIds.length} itens órfãos`);
    
    for (const orphanId of orphanedIds) {
      UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/${tableName}?id=eq.${encodeURIComponent(orphanId)}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        muteHttpExceptions: true
      });
    }
  } catch (error) {
    Logger.log(`❌ Erro ao deletar órfãos de ${tableName}: ${error.toString()}`);
  }
}

/**
 * 🔄 Sincroniza TODOS os cupons para o Supabase
 */
function syncAllCouponsToSupabase() {
  if (SUPABASE_URL.includes('SEU_PROJECT')) return;

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CUPONS');
  if (!sheet) return;

  // 🔥 CORREÇÃO: Flush para garantir leitura atualizada
  SpreadsheetApp.flush();

  const cupons = sheetToJSON(sheet);
  if (cupons.length === 0) return;

  const supabaseData = cupons.map(c => ({
    code: String(c.Codigo || '').trim().toUpperCase(),
    type: String(c.Tipo || 'VALOR_FIXO'),
    value: Number(c.Valor || 0),
    usage_type: String(c.Tipo_Uso || c['Tipo_Uso (UNICO ou MULTIPLO)'] || 'MULTIPLO').toUpperCase(),
    min_value: Number(c.Valor_Minimo_Pedido || 0),
    active: String(c.Ativo).toUpperCase() === 'TRUE' || c.Ativo === true,
    valid_until: c.Data_Validade ? new Date(c.Data_Validade).toISOString() : null,
    max_usage: Number(c.Uso_Maximo || 0),
    updated_at: new Date().toISOString()
  })).filter(c => c.code);

  if (supabaseData.length === 0) return;

  try {
    UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/coupons`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      payload: JSON.stringify(supabaseData),
      muteHttpExceptions: true
    });
    deleteOrphanedCouponsFromSupabase(supabaseData.map(c => c.code));
  } catch (error) {
    Logger.log(`❌ Erro cupons: ${error.toString()}`);
  }
}

function syncSingleCouponToSupabase(coupon) {
  if (SUPABASE_URL.includes('SEU_PROJECT') || !coupon || !coupon.Codigo) return;

  const supabaseData = {
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
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      payload: JSON.stringify([supabaseData]),
      muteHttpExceptions: true
    });
  } catch (error) {
    Logger.log(`⚠️ Erro single cupom: ${error.toString()}`);
  }
}

function deleteCouponFromSupabase(code) {
  if (SUPABASE_URL.includes('SEU_PROJECT') || !code) return;
  try {
    UrlFetchApp.fetch(
      `${SUPABASE_URL}/rest/v1/coupons?code=eq.${encodeURIComponent(String(code).trim().toUpperCase())}`, 
      {
        method: 'DELETE',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
        muteHttpExceptions: true
      }
    );
  } catch (e) {}
}

function deleteOrphanedCouponsFromSupabase(currentCodes) {
  if (SUPABASE_URL.includes('SEU_PROJECT') || !currentCodes || currentCodes.length === 0) return;
  try {
    const response = UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/coupons?select=code`, {
      method: 'GET',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
      muteHttpExceptions: true
    });
    if (response.getResponseCode() !== 200) return;
    const supabaseCoupons = JSON.parse(response.getContentText());
    const supabaseCodes = supabaseCoupons.map(c => c.code);
    const currentCodesSet = new Set(currentCodes.map(c => String(c).toUpperCase()));
    const orphanCodes = supabaseCodes.filter(code => !currentCodesSet.has(code));

    for (const code of orphanCodes) deleteCouponFromSupabase(code);
  } catch (error) {}
}

function getCouponFromSupabase(code) {
  if (SUPABASE_URL.includes('SEU_PROJECT') || !code) return null;
  try {
    const response = UrlFetchApp.fetch(
      `${SUPABASE_URL}/rest/v1/coupons?code=eq.${encodeURIComponent(String(code).trim().toUpperCase())}&select=*`,
      {
        method: 'GET',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
        muteHttpExceptions: true
      }
    );
    if (response.getResponseCode() === 200) {
      const data = JSON.parse(response.getContentText());
      if (data && data.length > 0) return data[0];
    }
  } catch (error) {}
  return null;
}

function syncCouponHistoryToSupabase() {
  if (SUPABASE_URL.includes('SEU_PROJECT')) return;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CUPONS_HISTORICO');
  if (!sheet) return;
  
  // 🔥 CORREÇÃO: Flush
  SpreadsheetApp.flush();
  
  const history = sheetToJSON(sheet);
  if (history.length === 0) return;

  const supabaseData = history.map(h => ({
    id: String(h.ID_Historico || Utilities.getUuid()),
    coupon_code: String(h.Codigo_Cupom || '').trim().toUpperCase(),
    customer_id: String(h.ID_Cliente || '').trim(),
    order_id: String(h.ID_Venda || '').trim(),
    used_at: h.Data_Uso ? new Date(h.Data_Uso).toISOString() : new Date().toISOString(),
    discount_amount: Number(h.Valor_Desconto || 0)
  })).filter(h => h.coupon_code && h.customer_id);

  if (supabaseData.length === 0) return;

  const BATCH_SIZE = 100;
  for (let i = 0; i < supabaseData.length; i += BATCH_SIZE) {
    const batch = supabaseData.slice(i, i + BATCH_SIZE);
    try {
      UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/coupon_history`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        payload: JSON.stringify(batch),
        muteHttpExceptions: true
      });
    } catch (e) {}
  }
}

function syncSingleUsageToSupabase(usageData) {
  if (SUPABASE_URL.includes('SEU_PROJECT')) return;
  try {
    UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/coupon_history`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      payload: JSON.stringify([{
        id: String(usageData.ID_Historico),
        coupon_code: String(usageData.Codigo_Cupom).trim().toUpperCase(),
        customer_id: String(usageData.ID_Cliente).trim(),
        order_id: String(usageData.ID_Venda).trim(),
        used_at: new Date(usageData.Data_Uso).toISOString(),
        discount_amount: Number(usageData.Valor_Desconto)
      }]),
      muteHttpExceptions: true
    });
  } catch (e) {}
}

/**
 * 🔄 Sincroniza TODOS os produtos para o Supabase
 */
function syncProductsToSupabase() {
  if (SUPABASE_URL.includes('SEU_PROJECT')) return;
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('GELADINHOS');
  if (!sheet) return;
  
  // 🔥 CORREÇÃO CRÍTICA: Garante que o script leia os dados MAIS RECENTES da planilha (após baixa de estoque)
  SpreadsheetApp.flush();
  
  const allProducts = sheetToJSON(sheet);
  if (allProducts.length === 0) return;
  
  const supabaseData = allProducts.map(p => {
    // Tratamento robusto para Booleano (Ativo/Inativo)
    let isActive = false;
    const ativoValue = p.Produto_Ativo;
    if (ativoValue === true || ativoValue === 1) {
      isActive = true;
    } else if (ativoValue !== null && ativoValue !== undefined) {
      const strVal = String(ativoValue).toUpperCase().trim();
      isActive = ['TRUE', 'SIM', 'YES', '1', 'S', 'OK'].includes(strVal);
    }
    
    let showInCatalog = true;
    const showValue = p.Mostrar_Catalogo;
    if (showValue !== null && showValue !== undefined && showValue !== '') {
      const showStr = String(showValue).toUpperCase().trim();
      showInCatalog = ['TRUE', 'SIM', 'YES', '1', 'S'].includes(showStr);
    }
    
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
  }).filter(p => p.id); // Garante que tem ID

  // Remover duplicatas de ID para evitar erro 500
  const uniqueProducts = [];
  const seenIds = new Set();
  supabaseData.forEach(p => {
    if(!seenIds.has(p.id)){
      seenIds.add(p.id);
      uniqueProducts.push(p);
    }
  });
  
  Logger.log(`📦 Syncing ${uniqueProducts.length} products to Supabase`);

  try {
    const response = UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/products`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      payload: JSON.stringify(uniqueProducts),
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() >= 200 && response.getResponseCode() < 300) {
      deleteOrphanedFromSupabase('products', uniqueProducts.map(p => p.id));
    } else {
      Logger.log(`❌ Error syncing products: ${response.getContentText()}`);
    }
  } catch (error) {
    Logger.log(`❌ Exception syncing products: ${error.toString()}`);
  }
}

function syncCategoriesToSupabase() {
  if (SUPABASE_URL.includes('SEU_PROJECT')) return;
  
  // 🔥 CORREÇÃO: Flush
  SpreadsheetApp.flush();

  const categories = getCategories();
  const supabaseData = categories.map((c, idx) => ({
    id: String(c.ID_Categoria).trim(),
    nome: c.Nome_Categoria,
    ordem: idx
  }));
  
  try {
    UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/categories`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      payload: JSON.stringify(supabaseData),
      muteHttpExceptions: true
    });
    deleteOrphanedFromSupabase('categories', supabaseData.map(c => c.id));
  } catch (e) {}
}

function syncBannersToSupabase() {
  if (SUPABASE_URL.includes('SEU_PROJECT')) return;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('BANNERS');
  if (!sheet) return;

  // 🔥 CORREÇÃO: Flush
  SpreadsheetApp.flush();
  
  const allBanners = sheetToJSON(sheet);
  const supabaseData = allBanners.map((b, idx) => {
    let isActive = false;
    const ativoValue = b.Ativo;
    if (ativoValue === true) {
      isActive = true;
    } else if (ativoValue !== null && ativoValue !== undefined) {
      const strVal = String(ativoValue).toUpperCase().trim();
      isActive = ['TRUE', 'SIM', 'YES', '1', 'S', 'OK'].includes(strVal);
    }
    
    return {
      id: b.ID_Banner || `banner-${idx}`,
      titulo: b.Titulo || '',
      subtitulo: b.Subtitulo || '',
      imagem_url: normalizarUrlImagem(b) || '',
      cta_text: b.Texto_CTA || '',
      ativo: isActive,
      ordem: idx
    };
  });
  
  try {
    UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/banners`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      payload: JSON.stringify(supabaseData),
      muteHttpExceptions: true
    });
    deleteOrphanedFromSupabase('banners', supabaseData.map(b => b.id));
  } catch (e) {}
}

function fullSyncToSupabase() {
  syncProductsToSupabase();
  syncCategoriesToSupabase();
  syncBannersToSupabase();
  syncAllCouponsToSupabase();
  syncCouponHistoryToSupabase();
}

/**
 * 🎯 TRIGGER AUTOMÁTICO
 * Necessário configurar no painel do Apps Script: Acionadores > onSheetChange > Ao alterar
 */
function onSheetChange(e) {
  if (SUPABASE_URL.includes('SEU_PROJECT')) return;
  
  const sheetName = e.source.getActiveSheet().getName();
  if (['GELADINHOS', 'CATEGORIAS_GELADINHO', 'BANNERS', 'CUPONS'].includes(sheetName)) {
    // Aguarda 3 segundos para garantir que a edição terminou
    Utilities.sleep(3000);
    
    switch(sheetName) {
      case 'GELADINHOS': syncProductsToSupabase(); break;
      case 'CATEGORIAS_GELADINHO': syncCategoriesToSupabase(); break;
      case 'BANNERS': syncBannersToSupabase(); break;
      case 'CUPONS': syncAllCouponsToSupabase(); break;
    }
  }
}

/**
 * Atualiza o status Produto_Ativo de produtos específicos
 */
function atualizarProdutosEspecificos(productIds) {
  if (!productIds || productIds.length === 0) return;
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('GELADINHOS');
    if (!sheet) return;
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf('ID_Geladinho');
    const estoqueIndex = headers.indexOf('Estoque_Atual');
    const ativoIndex = headers.indexOf('Produto_Ativo');
    
    if (idIndex === -1 || estoqueIndex === -1 || ativoIndex === -1) return;
    
    let atualizados = 0;
    
    productIds.forEach(prodId => {
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][idIndex]).trim() === String(prodId).trim()) {
          const estoqueAtual = Number(data[i][estoqueIndex]) || 0;
          const novoStatus = estoqueAtual > 0;
          sheet.getRange(i + 1, ativoIndex + 1).setValue(novoStatus);
          atualizados++;
          break;
        }
      }
    });
    
    // Força gravação para garantir que o sync pegue o status novo
    SpreadsheetApp.flush();
    
  } catch (error) {
    Logger.log('⚠️ Erro ao atualizar Produto_Ativo: ' + error.toString());
  }
}

// ============================================================================
// API ENTRY POINTS
// ============================================================================

function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  try { lock.waitLock(30000); } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Servidor ocupado." })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    const action = e.parameter.action;
    let data = {};
    if (e.postData && e.postData.contents) {
      try { data = JSON.parse(e.postData.contents); } catch (err) { }
    }

    if (['getAdminOrders', 'updateOrderStatus', 'getOrderItems', 'getDashboardStats', 'getAdminReviews', 'updateReviewStatus'].includes(action)) {
      const providedKey = e.parameter.adminKey || data.adminKey;
      if (String(providedKey).trim() !== ADMIN_PASS) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Unauthorized" })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    let result;

    switch (action) {
      case 'getCatalogData': result = getCatalogData(); break;
      case 'getProducts': result = getProducts(); break;
      case 'getCategories': result = getCategories(); break;
      case 'getBanners': result = getBanners(); break;
      case 'getConfig': result = getConfig(); break;
      case 'getOrders': result = getOrders(e.parameter.customerId); break;
      case 'validateCoupon':
        if (e.postData && e.postData.contents) {
          result = validateCouponWithContext(data);
        } else {
          result = validateCoupon(e.parameter.code);
        }
        break;
      case 'getReviews': result = getProductReviews(e.parameter.productId); break;
      case 'getProductWithAdditions': result = getProductWithAdditions(e.parameter.productId); break;
      case 'calculateItemPrice': result = validateAndCalculatePrice(data); break;
      case 'getAdminOrders': result = getAdminOrders(); break;
      case 'getOrderItems': result = getOrderItems(e.parameter.orderId); break;
      case 'getDashboardStats': result = getDashboardStats(); break;
      case 'getAdminReviews': result = getAdminReviews(); break;
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
      case 'forceSync': // Endpoint para forçar sync via URL se precisar
         fullSyncToSupabase();
         result = { success: true, message: "Sync forced" };
         break;

      default: result = { error: 'Ação inválida' };
    }

    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Erro: " + error.toString() })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// ============================================================================
// HELPERS & CORE LOGIC
// ============================================================================

function normalizarUrlImagem(row) {
  const possiveisColunas = ['Imagem_Geladinho', 'Imagem_URL', 'URL_IMAGEM_CACHE', 'URL_Imagem', 'Imagem', 'URL_Imagem_Cache'];
  for (const coluna of possiveisColunas) {
    const valor = row[coluna];
    if (!valor) continue;
    const valorStr = String(valor).trim();
    if (!valorStr) continue;
    if (valorStr.startsWith('http://') || valorStr.startsWith('https://')) return valorStr;
    if (valorStr.includes('/') || valorStr.includes('_Images')) {
      try {
        const fileName = valorStr.split('/').pop();
        const files = DriveApp.getFilesByName(fileName);
        if (files.hasNext()) {
          const file = files.next();
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          return `https://drive.google.com/thumbnail?id=${file.getId()}&sz=w1000`;
        }
      } catch (e) {}
    }
  }
  return '';
}

function getProducts() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('GELADINHOS');
  if (!sheet) return [];
  
  // 🔥 CORREÇÃO: Flush para leitura limpa
  SpreadsheetApp.flush();
  
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const ativoIndex = headers.indexOf('Produto_Ativo');
  
  if (ativoIndex === -1) {
    const data = sheetToJSON(sheet);
    return data.map(p => ({ ...p, URL_IMAGEM_CACHE: normalizarUrlImagem(p) }));
  }
  
  const activeProducts = [];
  for (let i = 1; i < values.length; i++) {
    const ativoValue = values[i][ativoIndex];
    let isActive = false;
    
    if (ativoValue === true) {
      isActive = true;
    } else if (ativoValue !== null && ativoValue !== undefined) {
      const strVal = String(ativoValue).toUpperCase().trim();
      isActive = ['TRUE', 'SIM', 'YES', '1', 'S', 'OK'].includes(strVal);
    }
    
    if (isActive) {
      const obj = {};
      headers.forEach((h, idx) => { if (h) obj[h] = values[i][idx]; });
      activeProducts.push(obj);
    }
  }
  
  return activeProducts.map(p => ({
    ...p,
    URL_IMAGEM_CACHE: normalizarUrlImagem(p)
  }));
}

function getCatalogData() {
  const cache = CacheService.getScriptCache();
  const CACHE_KEY = 'catalog_data_v3'; 
  const CACHE_TTL = 300; 
  
  const cached = cache.get(CACHE_KEY);
  if (cached) return JSON.parse(cached);
  
  const products = getProducts();
  const categories = getCategories();
  const banners = getBanners();
  
  const catalogData = { products, categories, banners, _cached_at: new Date().toISOString() };
  if (products.length > 0) cache.put(CACHE_KEY, JSON.stringify(catalogData), CACHE_TTL);
  
  return catalogData;
}

function getCategories() {
  return sheetToJSON(SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CATEGORIAS_GELADINHO'));
}

function getBanners() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('BANNERS');
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const ativoIndex = headers.indexOf('Ativo');
  
  if (ativoIndex === -1) {
    const data = sheetToJSON(sheet);
    return data.map(banner => ({ ...banner, URL_Imagem: normalizarUrlImagem(banner) || banner.URL_Imagem || '' }));
  }
  
  const activeBanners = [];
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][ativoIndex]).toUpperCase() === 'TRUE' || values[i][ativoIndex] === true) {
      const obj = {};
      headers.forEach((h, idx) => { if (h) obj[h] = values[i][idx]; });
      activeBanners.push(obj);
    }
  }
  
  return activeBanners.map(banner => ({
    ...banner,
    URL_Imagem: normalizarUrlImagem(banner) || banner.URL_Imagem || ''
  }));
}

function getConfig() {
  return sheetToJSON(SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CONFIGURACOES'));
}

function getOrders(cid) {
  return sheetToJSON(SpreadsheetApp.getActiveSpreadsheet().getSheetByName('VENDAS'))
    .filter(o => String(o.ID_Cliente).trim() === String(cid).trim()).reverse();
}

function getAdminOrders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const vendas = sheetToJSON(ss.getSheetByName('VENDAS'));
  const clientes = sheetToJSON(ss.getSheetByName('CLIENTES'));
  const clienteMap = {};
  clientes.forEach(cliente => {
    if (cliente.ID_Cliente) clienteMap[String(cliente.ID_Cliente).trim()] = cliente.Nome || 'Cliente';
  });
  const ordersWithNames = vendas.map(venda => {
    const clienteId = String(venda.ID_Cliente || '').trim();
    const customerName = clienteMap[clienteId] || venda.Nome_Cliente || 'Visitante';
    return { ...venda, Nome_Cliente: customerName };
  });
  return { orders: ordersWithNames.reverse() };
}

function getOrderItems(oid) {
  const iData = sheetToJSON(SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ITENS_VENDA'));
  const pData = sheetToJSON(SpreadsheetApp.getActiveSpreadsheet().getSheetByName('GELADINHOS'));
  const items = iData.filter(i => String(i.ID_Venda).trim() === String(oid).trim());
  return items.map(i => {
    const p = pData.find(pid => String(pid.ID_Geladinho).trim() === String(i.ID_Geladinho).trim());
    return { nome: p ? p.Nome_Geladinho : 'Item excluído', qtd: i.Quantidade, total: i.Total_Item };
  });
}

function validateCoupon(code) {
  const data = sheetToJSON(SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CUPONS'));
  const cp = data.find(c => String(c.Codigo).trim().toUpperCase() === String(code).trim().toUpperCase());
  if (cp && (String(cp.Ativo).toUpperCase() === 'TRUE' || cp.Ativo === true)) return { success: true, type: cp.Tipo, value: Number(cp.Valor) };
  return { success: false, message: 'Inválido' };
}

function validateCouponWithContext(data) {
  const code = String(data.code || '').trim().toUpperCase();
  const customerId = String(data.customerId || '').trim();
  const subtotal = Number(data.subtotal || 0);

  if (!code) return { success: false, message: 'Código do cupom não informado' };

  // 1️⃣ TENTAR SUPABASE PRIMEIRO
  const supabaseCoupon = getCouponFromSupabase(code);
  if (supabaseCoupon) {
    const validation = validateCouponRulesFromCache(supabaseCoupon, code, customerId, subtotal);
    if (validation) return validation;
  }

  // 2️⃣ FALLBACK: GOOGLE SHEETS
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const cuponsSheet = ss.getSheetByName('CUPONS');
  const historicoSheet = ss.getSheetByName('CUPONS_HISTORICO');
  if (!cuponsSheet) return { success: false, message: 'Sistema de cupons indisponível' };

  const cupons = sheetToJSON(cuponsSheet);
  const historico = sheetToJSON(historicoSheet);
  const coupon = cupons.find(c =>
    String(c.Codigo).trim().toUpperCase() === code &&
    (String(c.Ativo).toUpperCase() === 'TRUE' || c.Ativo === true)
  );

  if (!coupon) return { success: false, message: 'Cupom inválido ou inativo' };

  if (coupon.Data_Validade) {
    const validade = new Date(coupon.Data_Validade);
    if (new Date() > validade) return { success: false, message: 'Cupom expirado' };
  }

  const valorMinimo = Number(coupon.Valor_Minimo_Pedido || 0);
  if (valorMinimo > 0 && subtotal < valorMinimo) return { success: false, message: `Valor mínimo: R$ ${valorMinimo.toFixed(2)}` };

  if (String(coupon.Tipo_Uso).toUpperCase() === 'UNICO') {
    if (!customerId || customerId === 'GUEST') return { success: false, message: 'Faça login para usar este cupom' };
    const jaUsou = historico.some(h => String(h.Codigo_Cupom).trim().toUpperCase() === code && String(h.ID_Cliente).trim() === customerId);
    if (jaUsou) return { success: false, message: 'Cupom já utilizado por você' };
  }

  const usoMaximo = Number(coupon.Uso_Maximo || 0);
  if (usoMaximo > 0) {
    const totalUsos = historico.filter(h => String(h.Codigo_Cupom).trim().toUpperCase() === code).length;
    if (totalUsos >= usoMaximo) return { success: false, message: 'Cupom esgotado' };
  }

  syncSingleCouponToSupabase(coupon);
  return { success: true, type: coupon.Tipo, value: Number(coupon.Valor || 0), codigo: code, tipoUso: coupon.Tipo_Uso };
}

function validateCouponRulesFromCache(supabaseCoupon, code, customerId, subtotal) {
  try {
    if (!supabaseCoupon.active) return { success: false, message: 'Cupom inválido ou inativo' };
    if (supabaseCoupon.valid_until && new Date() > new Date(supabaseCoupon.valid_until)) return { success: false, message: 'Cupom expirado' };
    const valorMinimo = Number(supabaseCoupon.min_value || 0);
    if (valorMinimo > 0 && subtotal < valorMinimo) return { success: false, message: `Valor mínimo: R$ ${valorMinimo.toFixed(2)}` };

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const historicoSheet = ss.getSheetByName('CUPONS_HISTORICO');
    if (!historicoSheet) return null;
    const historico = sheetToJSON(historicoSheet);

    if (String(supabaseCoupon.usage_type).toUpperCase() === 'UNICO') {
      if (!customerId || customerId === 'GUEST') return { success: false, message: 'Faça login para usar este cupom' };
      const jaUsou = historico.some(h => String(h.Codigo_Cupom).trim().toUpperCase() === code && String(h.ID_Cliente).trim() === customerId);
      if (jaUsou) return { success: false, message: 'Cupom já utilizado por você' };
    }

    const usoMaximo = Number(supabaseCoupon.max_usage || 0);
    if (usoMaximo > 0) {
      const totalUsos = historico.filter(h => String(h.Codigo_Cupom).trim().toUpperCase() === code).length;
      if (totalUsos >= usoMaximo) return { success: false, message: 'Cupom esgotado' };
    }
    return { success: true, type: supabaseCoupon.type, value: Number(supabaseCoupon.value || 0), codigo: code, tipoUso: supabaseCoupon.usage_type };
  } catch (error) { return null; }
}

function loginCustomer(d) {
  if (String(d.phone).trim().toLowerCase() === ADMIN_LOGIN && String(d.password).trim() === ADMIN_PASS)
    return { success: true, customer: { ID_Cliente: 'ADMIN', Nome: 'Admin', isAdmin: true, adminKey: ADMIN_PASS } };

  const users = sheetToJSON(SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CLIENTES'));
  const u = users.find(c => String(c.Telefone).replace(/\D/g, '') === String(d.phone).replace(/\D/g, ''));

  if (u && String(u.Senha) === String(d.password)) {
    return {
      success: true, customer: {
        ID_Cliente: u.ID_Cliente,
        Nome: u.Nome,
        Telefone: u.Telefone,
        Pontos_Fidelidade: Number(u.Pontos_Fidelidade) || 0,
        Codigo_Convite: u.Codigo_Convite,
        Favoritos: u.Favoritos || '',
        Endereco: u.Endereco || '',
        Torre: u.Torre || '',
        Apartamento: u.Apartamento || ''
      }
    };
  }
  return { success: false, message: 'Dados inválidos.' };
}

function createCustomer(d) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('CLIENTES');
  const users = sheetToJSON(sheet);

  if (users.find(c => String(c.Telefone).replace(/\D/g, '') === String(d.phone).replace(/\D/g, '')))
    return { success: false };

  const id = 'CLI-' + Math.floor(Math.random() * 90000 + 10000);
  const code = 'DCAP-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  sheet.appendRow([id, d.name, d.phone, '', '', '', '', '', 0, new Date(), 'SIM', d.password, code, '', '']);
  return { success: true, customer: { id, name: d.name, phone: d.phone, points: 0, inviteCode: code, favorites: [] } };
}

function validateReferralCode(code, customerId) {
  if (!code || !customerId || customerId === 'GUEST') return { valid: false, message: 'Dados inválidos', alreadyUsed: false };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('CLIENTES');
  const clients = sheetToJSON(sheet);
  const headers = sheet.getDataRange().getValues()[0];
  
  const normalizedCode = String(code).trim().toUpperCase();
  const normalizedCustomerId = String(customerId).trim();
  
  const indicadoPorIdx = headers.indexOf('Indicado_Por');
  
  let codeExists = false;
  let ownerName = '';
  
  for (const client of clients) {
    if (String(client.Codigo_Convite || '').trim().toUpperCase() === normalizedCode) {
      if (String(client.ID_Cliente || '').trim() === normalizedCustomerId) return { valid: false, message: 'Você não pode usar seu próprio código', alreadyUsed: false };
      codeExists = true;
      ownerName = client.Nome || 'Cliente';
      break;
    }
  }
  
  if (!codeExists) return { valid: false, message: 'Código de indicação não encontrado', alreadyUsed: false };
  
  for (const client of clients) {
    if (String(client.ID_Cliente || '').trim() === normalizedCustomerId) {
      if (indicadoPorIdx > -1 && String(client.Indicado_Por || '').trim() !== '') {
        return { valid: false, message: 'Você já utilizou um código de indicação anteriormente', alreadyUsed: true, usedCode: client.Indicado_Por };
      }
      break;
    }
  }
  return { valid: true, message: `Código válido!`, alreadyUsed: false, ownerName: ownerName };
}

function updateFavorites(d) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CLIENTES');
  const vals = sheet.getDataRange().getValues();
  const telIdx = vals[0].indexOf('Telefone');
  const favIdx = vals[0].indexOf('Favoritos') > -1 ? vals[0].indexOf('Favoritos') : 14;
  const target = String(d.phone).replace(/\D/g, '');

  for (let i = 1; i < vals.length; i++) {
    if (String(vals[i][telIdx]).replace(/\D/g, '') === target) {
      sheet.getRange(i + 1, favIdx + 1).setValue(d.favorites);
      return { success: true };
    }
  }
  return { success: false };
}

function getDashboardStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const vendas = sheetToJSON(ss.getSheetByName('VENDAS'));
  const itens = sheetToJSON(ss.getSheetByName('ITENS_VENDA'));
  const produtos = sheetToJSON(ss.getSheetByName('GELADINHOS'));

  const totalRev = vendas.reduce((acc, v) => acc + (Number(v.Total_Venda) || 0), 0);
  const totalOrds = vendas.length;
  const avg = totalOrds > 0 ? (totalRev / totalOrds) : 0;

  const today = new Date();
  const sevenDaysAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
  const daily = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo.getFullYear(), sevenDaysAgo.getMonth(), sevenDaysAgo.getDate() + i);
    daily[Utilities.formatDate(d, Session.getScriptTimeZone(), "dd/MM")] = 0;
  }
  vendas.forEach(v => {
    const d = new Date(v.Data_Venda);
    if (d >= sevenDaysAgo) {
      const key = Utilities.formatDate(d, Session.getScriptTimeZone(), "dd/MM");
      if (daily[key] !== undefined) daily[key] += Number(v.Total_Venda || 0);
    }
  });
  const chart = Object.keys(daily).map(k => ({ name: k, receita: daily[k] }));

  const counts = {};
  itens.forEach(item => {
    const pid = String(item.ID_Geladinho).trim();
    const qtd = Number(item.Quantidade || 0);
    if (pid && qtd > 0) counts[pid] = (counts[pid] || 0) + qtd;
  });

  const ranking = Object.keys(counts).map(id => {
    const prod = produtos.find(p => String(p.ID_Geladinho).trim() === String(id).trim());
    return { name: prod ? prod.Nome_Geladinho : `Apagado (${id})`, value: counts[id] };
  });

  return { avgTicket: avg, totalRevenue: totalRev, totalOrders: totalOrds, weeklyChart: chart, topFlavors: ranking.sort((a, b) => b.value - a.value).slice(0, 3) };
}

/**
 * 🛒 LÓGICA DE CRIAÇÃO DE PEDIDO
 * CORRIGIDA: Inclui SpreadsheetApp.flush() e Sync imediato com Supabase
 */
function createOrder(d) {
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

  let obs = pts > 0 ? `Usou ${pts} pts` : (d.referralCode ? `Ref: ${d.referralCode}` : '');
  if (d.couponCode) obs += ` | Cupom: ${d.couponCode}`;

  // 1. Validar e Baixar Estoque
  if (d.cart) {
    const gData = G.getDataRange().getValues();
    const gHeaders = gData[0].map(h => String(h).trim());
    const idIdx = gHeaders.indexOf('ID_Geladinho');
    const stkIdx = gHeaders.indexOf('Estoque_Atual');
    const nomeIdx = gHeaders.indexOf('Nome_Geladinho');
    const ativoIdx = gHeaders.indexOf('Produto_Ativo'); // Importante para desativar se zerar

    if (idIdx === -1 || stkIdx === -1) return { success: false, message: "Erro interno: Colunas de estoque não encontradas." };

    const stockMap = {};
    for (let i = 1; i < gData.length; i++) {
        const pId = String(gData[i][idIdx]).trim();
        if (pId) stockMap[pId] = { current: Number(gData[i][stkIdx]) || 0, row: i + 1, nome: gData[i][nomeIdx] || pId };
    }

    // Validação
    for (const item of d.cart) {
        const qtdPedida = Number(item.quantity) || 1;
        const prodId = String(item.id).trim();
        const info = stockMap[prodId];
        if (!info) return { success: false, message: `Produto não encontrado: ${item.nome || prodId}` };
        if (info.current < qtdPedida) return { success: false, message: `Estoque insuficiente para ${info.nome}. Disponível: ${info.current}` };
    }

    // Baixa de estoque
    const produtosAlterados = [];
    d.cart.forEach(item => {
      const qtd = Number(item.quantity) || 1;
      const prodId = String(item.id).trim();
      const info = stockMap[prodId];

      I.appendRow([Utilities.getUuid(), id, prodId, qtd, item.price, qtd * item.price]);
      const novoEstoque = info.current - qtd;
      G.getRange(info.row, stkIdx + 1).setValue(novoEstoque);
      
      // Lógica opcional: Se zerar, desativa o produto
      /* 
      if (novoEstoque <= 0 && ativoIdx > -1) {
          G.getRange(info.row, ativoIdx + 1).setValue(false);
      }
      */
      
      produtosAlterados.push(prodId);
    });

    // 🔥 CORREÇÃO ESSENCIAL: Atualiza Produto_Ativo se zerou e FLUSH
    if (produtosAlterados.length > 0) atualizarProdutosEspecificos(produtosAlterados);
    SpreadsheetApp.flush(); // Garante que o disco tem os dados novos
  }

  // 2. Registrar Venda
  // Para clientes GUEST, pegar nome e telefone que preencheram no formulário
  const nomeCliente = d.customer?.name || d.customer?.details?.nome || 'Visitante';
  const telefoneCliente = d.customer?.details?.telefone || '';
  const isGuest = !d.customer?.id || d.customer?.id === 'GUEST';
  
  V.appendRow([
    id, now, isGuest ? 'GUEST' : d.customer.id, obs,
    d.total, d.total, 'Pendente', disc, pts > 0,
    d.deliveryFee, nomeCliente, d.customer?.details?.torre,
    d.customer?.details?.apto, d.paymentMethod, d.scheduling || 'Imediata',
    telefoneCliente
  ]);

  // 3. Registrar Cupom
  if (H && d.couponCode && d.customer?.id && String(d.customer.id) !== 'GUEST') {
    try {
      const idHistorico = Utilities.getUuid();
      H.appendRow([idHistorico, d.couponCode, d.customer.id, id, now, disc]);
      syncSingleUsageToSupabase({ ID_Historico: idHistorico, Codigo_Cupom: d.couponCode, ID_Cliente: d.customer.id, ID_Venda: id, Data_Uso: now, Valor_Desconto: disc });
    } catch (e) {}
  }

  // 4. Pontos de Fidelidade
  if (d.customer?.id && String(d.customer.id) !== 'GUEST') {
    const cData = C.getDataRange().getValues();
    const h = cData[0].map(x => String(x).trim());
    const idIdx = h.indexOf('ID_Cliente');
    const ptsIdx = h.indexOf('Pontos_Fidelidade');
    const codeIdx = h.indexOf('Codigo_Convite');
    const indicadoPorIdx = h.indexOf('Indicado_Por');

    if (idIdx > -1 && ptsIdx > -1) {
      const earned = Math.floor(Number(d.total));
      let bonus = Number(d.bonusPoints || 0);

      if (d.referralCode && codeIdx > -1) {
        let clienteRow = -1;
        let jaUsouIndicacao = false;
        
        for (let i = 1; i < cData.length; i++) {
          if (String(cData[i][idIdx]) === String(d.customer.id)) {
            clienteRow = i;
            if (indicadoPorIdx > -1 && cData[i][indicadoPorIdx]) jaUsouIndicacao = String(cData[i][indicadoPorIdx]).trim() !== '';
            break;
          }
        }
        
        if (!jaUsouIndicacao) {
          for (let k = 1; k < cData.length; k++) {
            if (String(cData[k][codeIdx]).trim() == String(d.referralCode).trim()) {
              if (String(cData[k][idIdx]) !== String(d.customer.id)) {
                C.getRange(k + 1, ptsIdx + 1).setValue(Number(cData[k][ptsIdx] || 0) + 50);
                if (indicadoPorIdx > -1 && clienteRow > 0) C.getRange(clienteRow + 1, indicadoPorIdx + 1).setValue(d.referralCode);
              }
              break;
            }
          }
        }
      }

      for (let i = 1; i < cData.length; i++) {
        if (String(cData[i][idIdx]) === String(d.customer.id)) {
          const cur = Number(cData[i][ptsIdx] || 0);
          C.getRange(i + 1, ptsIdx + 1).setValue(Math.max(0, cur + earned + bonus - pts));
          if (d.customer.details) {
            const det = d.customer.details;
            const tIdx = h.indexOf('Torre');
            const aIdx = h.indexOf('Apartamento');
            const eIdx = h.indexOf('Endereco');
            if (tIdx > -1 && det.torre) C.getRange(i + 1, tIdx + 1).setValue(det.torre);
            if (aIdx > -1 && det.apto) C.getRange(i + 1, aIdx + 1).setValue(det.apto);
            if (eIdx > -1 && det.rua) C.getRange(i + 1, eIdx + 1).setValue(`${det.rua}, ${det.numero} - ${det.bairro}`);
          }
          break;
        }
      }
    }
    
    // Sorteio (Se existir função externa, aqui simula try catch)
    try {
      if (typeof getMinhasChances === 'function' && d.total > 0) {
         // Lógica de sorteio implícita ou chamada futura
      }
    } catch(e) {}
  }

  // 5. 🔥 SYNC IMEDIATO COM SUPABASE
  try {
    syncProductsToSupabase();
  } catch (syncError) {
    Logger.log('⚠️ Erro ao sincronizar Supabase pós-venda: ' + syncError.toString());
  }

  return { success: true, idVenda: id };
}

function updateOrderStatus(d) {
  const s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('VENDAS');
  const v = s.getDataRange().getValues();
  const idx = v[0].indexOf('ID_Venda');
  const st = v[0].indexOf('Status');
  for (let i = 1; i < v.length; i++) {
    if (String(v[i][idx]) === String(d.orderId)) {
      s.getRange(i + 1, st + 1).setValue(d.newStatus);
      return { success: true };
    }
  }
  return { success: false };
}

function getProductWithAdditions(productId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const produtosSheet = ss.getSheetByName('GELADINHOS');
  const gruposSheet = ss.getSheetByName('GRUPOS_ADICIONAIS');
  const adicionaisSheet = ss.getSheetByName('ADICIONAIS');

  const produtos = sheetToJSON(produtosSheet);
  const produto = produtos.find(p => String(p.ID_Geladinho).trim() === String(productId).trim());

  if (!produto) return { success: false, error: 'Produto não encontrado' };

  produto.URL_IMAGEM_CACHE = normalizarUrlImagem(produto);

  if (!produto.Tem_Adicionais || (String(produto.Tem_Adicionais).toUpperCase() !== 'TRUE' && produto.Tem_Adicionais !== true)) {
    return produto;
  }

  const grupoIds = String(produto.IDs_Grupos_Adicionais || '').split(',').map(id => id.trim()).filter(id => id);
  if (grupoIds.length === 0) return produto;

  const grupos = sheetToJSON(gruposSheet)
    .filter(g => grupoIds.includes(String(g.ID_Grupo).trim()) && (String(g.Ativo).toUpperCase() === 'TRUE' || g.Ativo === true))
    .sort((a, b) => Number(a.Ordem) - Number(b.Ordem));

  const adicionais = sheetToJSON(adicionaisSheet);

  produto.addition_groups = grupos.map(grupo => ({
    id: grupo.ID_Grupo,
    name: grupo.Nome_Grupo,
    type: grupo.Tipo,
    required: Number(grupo.Min) > 0,
    min: Number(grupo.Min),
    max: Number(grupo.Max),
    order: Number(grupo.Ordem),
    options: adicionais
      .filter(a => String(a.ID_Grupo).trim() === String(grupo.ID_Grupo).trim())
      .sort((a, b) => Number(a.Ordem) - Number(b.Ordem))
      .map(a => ({
        id: a.ID_Adicional,
        sku: a.SKU,
        name: a.Nome,
        price: Number(a.Preco),
        stock_status: a.Status_Estoque,
        image_url: a.Imagem_URL || null,
        order: Number(a.Ordem)
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
    return { success: true, base_price: basePrice, additions_subtotal: 0, unit_price: basePrice, quantity: quantity, total_price: basePrice * quantity, validated_additions: [] };
  }

  for (const selection of (selectedAdditions || [])) {
    const grupo = produto.addition_groups.find(g => g.id === selection.group_id);
    if (!grupo) return { success: false, error: `Grupo ${selection.group_id} não encontrado` };
    const opcao = grupo.options.find(o => o.id === selection.option_id);
    if (!opcao) return { success: false, error: `Opção ${selection.option_id} não encontrada` };
    if (opcao.stock_status === 'out_of_stock') return { success: false, error: `${opcao.name} está indisponível` };

    additionsTotal += opcao.price;
    validatedAdditions.push({ group_id: grupo.id, group_name: grupo.name, option_id: opcao.id, option_sku: opcao.sku, option_name: opcao.name, option_price: opcao.price });
  }

  const basePrice = Number(produto.Preco_Venda);
  const unitPrice = basePrice + additionsTotal;
  return { success: true, base_price: basePrice, additions_subtotal: additionsTotal, unit_price: unitPrice, quantity: quantity, total_price: unitPrice * quantity, validated_additions: validatedAdditions };
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
      id: s.ID_Sabor,
      name: s.Nome_Sabor,
      category: s.Categoria || 'Geral',
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
          id: grupo.ID_Grupo,
          name: grupo.Nome_Grupo,
          type: grupo.Tipo,
          required: Number(grupo.Min) > 0,
          min: Number(grupo.Min),
          max: Number(grupo.Max),
          order: Number(grupo.Ordem),
          options: adicionais
            .filter(a => String(a.ID_Grupo).trim() === String(grupo.ID_Grupo).trim())
            .map(a => ({
              id: a.ID_Adicional,
              sku: a.SKU,
              name: a.Nome,
              price: Number(a.Preco),
              stock_status: a.Status_Estoque,
              image_url: normalizarUrlImagem(a) || null,
              order: Number(a.Ordem)
            }))
            .sort((a, b) => a.order - b.order)
        }))
        .sort((a, b) => a.order - b.order);
    }
  }

  return {
    id: mix.ID_Mix,
    name: mix.Nome_Mix,
    type: 'mix',
    base_price: Number(mix.Preco_Base || 0),
    price_per_flavor: Number(mix.Preco_Por_Sabor || 0),
    max_flavors: Number(mix.Max_Sabores || 2),
    category_id: mix.ID_Categoria,
    category_name: mix.Nome_Categoria || 'Mix',
    stock: Number(mix.Estoque || 0),
    flavors: availableFlavors,
    addition_groups: additionGroups
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
  
  for (const flavorId of (selectedFlavors || [])) {
    const sabor = sabores.find(s => String(s.ID_Sabor).trim() === String(flavorId).trim());
    if (sabor) validatedFlavors.push({ flavor_id: sabor.ID_Sabor, flavor_name: sabor.Nome_Sabor, flavor_price: pricePerFlavor });
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
          validatedAdditions.push({ group_id: addition.group_id, group_name: addition.group_name, option_id: adicional.ID_Adicional, option_name: adicional.Nome, option_price: Number(adicional.Preco) });
        }
      }
    }
  }
  
  const unitPrice = basePrice + (validatedFlavors.length * pricePerFlavor) + additionsSubtotal;
  return { success: true, base_price: basePrice, unit_price: unitPrice, total_price: unitPrice * quantity, validated_flavors: validatedFlavors, validated_additions: validatedAdditions };
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

function createReview(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('AVALIACOES');
  if (!sheet) return { success: false, message: 'Erro sistema' };

  if (!data.customerId || !data.productId || !data.rating) return { success: false, message: 'Dados incompletos' };

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const columnMap = {};
  headers.forEach((header, index) => { if (header) columnMap[String(header).trim()] = index; });

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
  return { success: true, message: 'Avaliação enviada!', reviewId: reviewId };
}

function getAdminReviews() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('AVALIACOES');
  if (!sheet) return [];
  const reviews = sheetToJSON(sheet);
  return reviews.map(review => ({
    id: review.ID_Avaliacao,
    productId: review.ID_Produto || review.ID_Geladinho,
    productName: review.Nome_Geladinho || 'Produto',
    customerId: review.ID_Cliente,
    customerName: review.Nome_Cliente || 'Cliente',
    rating: Number(review.Rating || review.Nota || 0),
    comment: review.Comentario || '',
    date: review.Data_Avaliacao,
    status: review.Status || 'Pendente'
  })).reverse();
}

function updateReviewStatus(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('AVALIACOES');
  if (!sheet) return { success: false, message: 'Erro' };
  
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idIndex = headers.indexOf('ID_Avaliacao');
  const statusIndex = headers.indexOf('Status');
  
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][idIndex]).trim() === String(data.reviewId).trim()) {
      sheet.getRange(i + 1, statusIndex + 1).setValue(data.newStatus);
      return { success: true, message: `Status atualizado para ${data.newStatus}` };
    }
  }
  return { success: false, message: 'Não encontrado' };
}

function getMinhasChances(customerId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('SORTEIOS');
  if(!sheet) return { chances: [] };
  const data = sheetToJSON(sheet);
  const chances = data.filter(r => String(r.ID_Cliente) === String(customerId)).map(r => ({
      numero: r.Numero_Sorte,
      data: r.Data_Sorteio,
      ganhou: r.Ganhou
  }));
  return { chances: chances };
}

function atualizarGastoPromoClienteComRegistroSorteio(clienteId, valorGasto) {
  // Lógica placeholder para sorteio futuro
  Logger.log(`Processando sorteio para ${clienteId}: R$ ${valorGasto}`);
}

function calculateDeliveryFee(data) {
  const { deliveryType, addressData } = data;
  if (deliveryType === 'CONDO') return { fee: 0, distanceKm: 0, message: 'Grátis (Condomínio)', success: true };
  
  const fullAddress = `${addressData.rua}, ${addressData.numero}, ${addressData.bairro || ''}, ${addressData.cep || ''}, Curitiba, PR, Brazil`;
  const coords = getGeoapifyCoordinates(fullAddress);
  
  if (!coords) return { fee: 5, distanceKm: 0, error: 'Geocoding failed', success: true, message: 'Taxa Fixa' };
  
  const distanceKm = getGeoapifyDistanceKm(STORE_LOCATION, coords);
  if (distanceKm === null) return { fee: 5, distanceKm: 0, error: 'Matrix failed', success: true, message: 'Taxa Fixa' };
  
  let fee = DELIVERY_PRICING.BASE_FEE + (distanceKm * DELIVERY_PRICING.KM_RATE);
  fee = Math.max(fee, DELIVERY_PRICING.MIN_FEE);
  if (deliveryType === 'NEIGHBOR' && distanceKm <= 3) fee = fee * DELIVERY_PRICING.NEIGHBOR_DISCOUNT;
  
  fee = Math.ceil(fee * 2) / 2;
  
  return { success: true, fee: fee, distanceKm: parseFloat(distanceKm.toFixed(2)), message: fee === 0 ? 'Grátis' : `R$ ${fee.toFixed(2).replace('.', ',')}` };
}

function getGeoapifyCoordinates(address) {
  try {
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(address)}&apiKey=${GEOAPIFY_API_KEY}&limit=1`;
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (response.getResponseCode() !== 200) return null;
    const json = JSON.parse(response.getContentText());
    if (!json.features || json.features.length === 0) return null;
    const [lon, lat] = json.features[0].geometry.coordinates;
    return { lat, lon };
  } catch (e) { return null; }
}

function getGeoapifyDistanceKm(origin, destination) {
  try {
    const url = `https://api.geoapify.com/v1/routematrix?apiKey=${GEOAPIFY_API_KEY}`;
    const payload = { mode: 'drive', sources: [{ location: [origin.lon, origin.lat] }], targets: [{ location: [destination.lon, destination.lat] }] };
    const response = UrlFetchApp.fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, payload: JSON.stringify(payload), muteHttpExceptions: true });
    if (response.getResponseCode() !== 200) return null;
    const json = JSON.parse(response.getContentText());
    const meters = json.sources_to_targets[0][0].distance;
    return meters / 1000;
  } catch (e) { return null; }
}

function sheetToJSON(s) {
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