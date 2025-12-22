const ADMIN_LOGIN = "admin";
const ADMIN_PASS = "Jxd701852@";

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

      // --- MIX GOURMET SYSTEM ---
      case 'getMixWithFlavorAndAdditions': result = getMixWithFlavorAndAdditions(e.parameter.mixId); break;
      case 'calculateMixPrice': result = calculateMixPrice(data); break;

      // --- PROMOTION/RAFFLE SYSTEM ---
      case 'getMinhasChances': result = getMinhasChances(e.parameter.customerId); break;

      default: result = { error: 'Ação inválida' };
    }

    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Erro: " + error.toString() })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Normaliza URL de imagem, detectando se é URL completa ou path relativo do AppSheet
 * @param {Object} row - Linha da planilha com possíveis colunas de imagem
 * @returns {string} URL normalizada ou string vazia
 */
function normalizarUrlImagem(row) {
  // Lista de possíveis colunas de imagem em ordem de prioridade
  const possiveisColunas = [
    'Imagem_Geladinho',    // Nome real da coluna na planilha GELADINHOS
    'Imagem_URL',          // Usado em MIX_SABORES e ADICIONAIS
    'URL_IMAGEM_CACHE',
    'URL_Imagem',
    'Imagem',
    'URL_Imagem_Cache'
  ];
  
  // Tentar cada coluna até encontrar um valor válido
  for (const coluna of possiveisColunas) {
    const valor = row[coluna];
    if (!valor) continue;
    
    const valorStr = String(valor).trim();
    if (!valorStr) continue;
    
    // Se já for uma URL completa, retornar
    if (valorStr.startsWith('http://') || valorStr.startsWith('https://')) {
      return valorStr;
    }
    
    // Se for path relativo do AppSheet (ex: GELADINHOS_Images/arquivo.jpg)
    // Tentar converter para URL pública do Google Drive
    if (valorStr.includes('/') || valorStr.includes('_Images')) {
      Logger.log('🔍 Path AppSheet detectado: ' + valorStr + ' - Tentando converter...');
      
      try {
        // Extrair nome do arquivo do path
        const fileName = valorStr.split('/').pop();
        
        // Tentar encontrar o arquivo no Google Drive
        const files = DriveApp.getFilesByName(fileName);
        
        if (files.hasNext()) {
          const file = files.next();
          
          // Garantir que o arquivo está compartilhado publicamente
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          
          // Gerar URL pública usando thumbnail ID (mais confiável que uc?export=view)
          const fileId = file.getId();
          const publicUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
          
          Logger.log('✅ Convertido com sucesso: ' + publicUrl);
          return publicUrl;
        } else {
          Logger.log('⚠️ Arquivo não encontrado no Drive: ' + fileName);
          return '';
        }
      } catch (e) {
        Logger.log('❌ Erro ao converter path: ' + e.toString());
        return '';
      }
    }
  }
  
  return '';
}

function getProducts() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('GELADINHOS');
  if (!sheet) return [];
  
  // 🔥 OTIMIZAÇÃO: Filtrar produtos ativos ANTES de processar imagens
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const ativoIndex = headers.indexOf('Produto_Ativo');
  
  // Se coluna não existe, usar abordagem antiga
  if (ativoIndex === -1) {
    Logger.log('⚠️ Coluna Produto_Ativo não encontrada, usando fallback');
    const data = sheetToJSON(sheet);
    return data.map(p => ({
      ...p,
      URL_IMAGEM_CACHE: normalizarUrlImagem(p)
    }));
  }
  
  const activeProducts = [];
  for (let i = 1; i < values.length; i++) {
    // Filtrar produtos inativos imediatamente
    if (String(values[i][ativoIndex]).toUpperCase() === 'TRUE') {
      const obj = {};
      headers.forEach((h, idx) => {
        if (h) obj[h] = values[i][idx];
      });
      activeProducts.push(obj);
    }
  }
  
  Logger.log(`✅ Produtos ativos carregados: ${activeProducts.length}/${values.length - 1}`);
  
  // Processar imagens apenas para produtos ativos
  return activeProducts.map(p => {
    const urlImagem = normalizarUrlImagem(p);
    return {
      ...p,
      URL_IMAGEM_CACHE: urlImagem
    };
  });
}

function getCategories() {
  return sheetToJSON(SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CATEGORIAS_GELADINHO'));
}

function getBanners() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('BANNERS');
  if (!sheet) return [];
  
  // 🔥 OTIMIZAÇÃO: Filtrar banners ativos ANTES de processar imagens
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const ativoIndex = headers.indexOf('Ativo');
  
  if (ativoIndex === -1) {
    Logger.log('⚠️ Coluna Ativo não encontrada em BANNERS, usando fallback');
    const data = sheetToJSON(sheet);
    return data.map(banner => ({
      ...banner,
      URL_Imagem: normalizarUrlImagem(banner) || banner.URL_Imagem || ''
    }));
  }
  
  const activeBanners = [];
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][ativoIndex]).toUpperCase() === 'TRUE') {
      const obj = {};
      headers.forEach((h, idx) => {
        if (h) obj[h] = values[i][idx];
      });
      activeBanners.push(obj);
    }
  }
  
  Logger.log(`✅ Banners ativos carregados: ${activeBanners.length}/${values.length - 1}`);
  
  return activeBanners.map(banner => {
    const urlImagem = normalizarUrlImagem(banner);
    return {
      ...banner,
      URL_Imagem: urlImagem || banner.URL_Imagem || ''
    };
  });
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
    if (cliente.ID_Cliente) {
      clienteMap[String(cliente.ID_Cliente).trim()] = cliente.Nome || 'Cliente';
    }
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
  if (cp && String(cp.Ativo).toUpperCase() === 'TRUE') return { success: true, type: cp.Tipo, value: Number(cp.Valor) };
  return { success: false, message: 'Inválido' };
}

function validateCouponWithContext(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const cuponsSheet = ss.getSheetByName('CUPONS');
  const historicoSheet = ss.getSheetByName('CUPONS_HISTORICO');

  if (!cuponsSheet) return { success: false, message: 'Sistema de cupons indisponível' };
  if (!historicoSheet) return { success: false, message: 'Histórico não configurado' };

  const cupons = sheetToJSON(cuponsSheet);
  const historico = sheetToJSON(historicoSheet);

  const code = String(data.code || '').trim().toUpperCase();
  const customerId = String(data.customerId || '').trim();
  const subtotal = Number(data.subtotal || 0);

  const coupon = cupons.find(c =>
    String(c.Codigo).trim().toUpperCase() === code &&
    String(c.Ativo).toUpperCase() === 'TRUE'
  );

  if (!coupon) {
    return { success: false, message: 'Cupom inválido ou inativo' };
  }

  if (coupon.Data_Validade) {
    const validade = new Date(coupon.Data_Validade);
    const hoje = new Date();
    if (hoje > validade) {
      return { success: false, message: 'Cupom expirado' };
    }
  }

  const valorMinimo = Number(coupon.Valor_Minimo_Pedido || 0);
  if (valorMinimo > 0 && subtotal < valorMinimo) {
    return {
      success: false,
      message: `Valor mínimo: R$ ${valorMinimo.toFixed(2)}`
    };
  }

  if (String(coupon.Tipo_Uso).toUpperCase() === 'UNICO' && customerId && customerId !== 'GUEST') {
    const jaUsou = historico.some(h =>
      String(h.Codigo_Cupom).trim().toUpperCase() === code &&
      String(h.ID_Cliente).trim() === customerId
    );

    if (jaUsou) {
      return { success: false, message: 'Cupom já utilizado por você' };
    }
  }

  const usoMaximo = Number(coupon.Uso_Maximo || 0);
  if (usoMaximo > 0) {
    const totalUsos = historico.filter(h =>
      String(h.Codigo_Cupom).trim().toUpperCase() === code
    ).length;

    if (totalUsos >= usoMaximo) {
      return { success: false, message: 'Cupom esgotado' };
    }
  }

  return {
    success: true,
    type: coupon.Tipo,
    value: Number(coupon.Valor || 0),
    codigo: code,
    tipoUso: coupon.Tipo_Uso
  };
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
  sheet.appendRow([
    id, d.name, d.phone, '', '', '', '', '', 0, new Date(), 'SIM', d.password, code, '', ''
  ]);
  return { success: true, customer: { id, name: d.name, phone: d.phone, points: 0, inviteCode: code, favorites: [] } };
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
    const prodName = prod ? prod.Nome_Geladinho : `Apagado (${id})`;
    return { name: prodName, value: counts[id] };
  });

  return {
    avgTicket: avg,
    totalRevenue: totalRev,
    totalOrders: totalOrds,
    weeklyChart: chart,
    topFlavors: ranking.sort((a, b) => b.value - a.value).slice(0, 3)
  };
}

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

  V.appendRow([
    id, now, d.customer?.id || 'GUEST', obs,
    d.total, d.total, 'Pendente', disc, pts > 0,
    d.deliveryFee, d.customer?.name, d.customer?.details?.torre,
    d.customer?.details?.apto, d.paymentMethod, d.scheduling || 'Imediata'
  ]);

  if (d.cart) {
    const gData = G.getDataRange().getValues();
    const idIdx = gData[0].indexOf('ID_Geladinho');
    const stkIdx = gData[0].findIndex(h => String(h).trim() === 'Estoque_Atual');

    d.cart.forEach(item => {
      const qtd = Number(item.quantity) || 1;
      I.appendRow([Utilities.getUuid(), id, item.id, qtd, item.price, qtd * item.price]);

      if (idIdx > -1 && stkIdx > -1) {
        for (let i = 1; i < gData.length; i++) {
          if (String(gData[i][idIdx]).trim() == String(item.id).trim()) {
            G.getRange(i + 1, stkIdx + 1).setValue(Number(gData[i][stkIdx]) - qtd);
            break;
          }
        }
      }
    });
  }

  if (H && d.couponCode && d.customer?.id && String(d.customer.id) !== 'GUEST') {
    try {
      const idHistorico = Utilities.getUuid();
      H.appendRow([
        idHistorico,
        d.couponCode,
        d.customer.id,
        id,
        new Date(),
        disc
      ]);
    } catch (e) {
      Logger.log('Erro ao registrar histórico de cupom: ' + e);
    }
  }

  if (d.customer?.id && String(d.customer.id) !== 'GUEST') {
    const cData = C.getDataRange().getValues();
    const h = cData[0].map(x => String(x).trim());
    const idIdx = h.indexOf('ID_Cliente');
    const ptsIdx = h.indexOf('Pontos_Fidelidade');
    const codeIdx = h.indexOf('Codigo_Convite');

    if (idIdx > -1 && ptsIdx > -1) {
      const earned = Math.floor(Number(d.total));
      let bonus = Number(d.bonusPoints || 0);

      if (d.referralCode && codeIdx > -1) {
        for (let k = 1; k < cData.length; k++) {
          if (String(cData[k][codeIdx]).trim() == String(d.referralCode).trim()) {
            if (String(cData[k][idIdx]) !== String(d.customer.id)) {
              C.getRange(k + 1, ptsIdx + 1).setValue(Number(cData[k][ptsIdx] || 0) + 50);
            }
            break;
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
  }

  if (d.customer?.id && String(d.customer.id) !== 'GUEST') {
    try {
      const valorCompra = Number(d.total) || 0;
      if (valorCompra > 0) {
        atualizarGastoPromoClienteComRegistroSorteio(d.customer.id, valorCompra);
      }
    } catch (e) {
      Logger.log('Erro sorteio: ' + e.toString());
    }
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

// ======================================================
// MIX GOURMET SYSTEM
// ======================================================

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
    .filter(s => String(s.Ativo).toUpperCase() === 'TRUE')
    .map(s => {
      // Normalizar URL de imagem do sabor
      const imageUrl = normalizarUrlImagem(s);
      
      return {
        id: s.ID_Sabor,
        name: s.Nome_Sabor,
        category: s.Categoria || 'Geral',
        price: Number(s.Preco_Adicional || 0),
        stock_status: String(s.Status_Estoque).toLowerCase() === 'disponivel' ? 'available' : 'out_of_stock',
        image_url: imageUrl || null
      };
    })
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  let additionGroups = [];
  if (mix.IDs_Grupos_Adicionais) {
    const grupoIds = String(mix.IDs_Grupos_Adicionais).split(',').map(id => id.trim()).filter(id => id);
    if (grupoIds.length > 0 && gruposSheet && adicionaisSheet) {
      const grupos = sheetToJSON(gruposSheet);
      const adicionais = sheetToJSON(adicionaisSheet);
      additionGroups = grupos
        .filter(g => grupoIds.includes(String(g.ID_Grupo).trim()) && String(g.Ativo).toUpperCase() === 'TRUE')
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
            .map(a => {
              // Normalizar URL de imagem do adicional
              const imageUrl = normalizarUrlImagem(a);
              
              return {
                id: a.ID_Adicional,
                sku: a.SKU,
                name: a.Nome,
                price: Number(a.Preco),
                stock_status: a.Status_Estoque,
                image_url: imageUrl || null,
                order: Number(a.Ordem)
              };
            })
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
  const maxFlavors = Number(mix.Max_Sabores || 2);
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

// ======================================================
// PRODUCT REVIEWS SYSTEM
// ======================================================

/**
 * Get all approved reviews for a specific product
 * @param {string} productId - ID do produto
 * @returns {Array} Array de avaliações aprovadas
 */
function getProductReviews(productId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('AVALIACOES');
  
  if (!sheet) {
    Logger.log('⚠️ Sheet AVALIACOES não encontrada');
    return [];
  }
  
  const reviews = sheetToJSON(sheet);
  
  Logger.log('='.repeat(80));
  Logger.log(`🔍 getProductReviews CHAMADO`);
  Logger.log(`📌 Product ID procurado: "${productId}"`);
  Logger.log(`📊 Total de reviews na planilha: ${reviews.length}`);
  Logger.log('='.repeat(80));
  
  // Debug: Mostrar todas as reviews e seus IDs
  reviews.forEach((review, index) => {
    Logger.log(`\nReview #${index + 1}:`);
    Logger.log(`  - ID_Avaliacao: ${review.ID_Avaliacao}`);
    Logger.log(`  - ID_Produto: "${review.ID_Produto || 'VAZIO'}"`);
    Logger.log(`  - ID_Geladinho: "${review.ID_Geladinho || 'VAZIO'}"`);
    Logger.log(`  - Status: ${review.Status}`);
    Logger.log(`  - Rating: ${review.Rating}`);
    Logger.log(`  - Cliente: ${review.Nome_Cliente}`);
  });
  
  // Filtrar apenas avaliações aprovadas do produto específico
  const approvedReviews = reviews.filter(review => {
    const productIdFromReview = String(review.ID_Produto || review.ID_Geladinho || '').trim();
    const productIdSearch = String(productId).trim();
    const matchesProduct = productIdFromReview === productIdSearch;
    const isApproved = String(review.Status || '').toUpperCase() === 'APROVADA';
    
    Logger.log(`\n🔎 Comparando Review ${review.ID_Avaliacao}:`);
    Logger.log(`   Review Product ID: "${productIdFromReview}"`);
    Logger.log(`   Search Product ID: "${productIdSearch}"`);
    Logger.log(`   IDs Match? ${matchesProduct}`);
    Logger.log(`   Status: ${review.Status} | Is Approved? ${isApproved}`);
   Logger.log(`   Will Include? ${matchesProduct && isApproved}`);
    
    return matchesProduct && isApproved;
  });
  
  Logger.log('\n' + '='.repeat(80));
  Logger.log(`✅ RESULTADO: Encontradas ${approvedReviews.length} avaliações aprovadas`);
  Logger.log('='.repeat(80));
  
  // Normalizar estrutura para o frontend
  return approvedReviews.map(review => {
    // Suporte para múltiplas variações de nome de coluna
    const rating = Number(review.Rating || review.Nota || 0);
    
    return {
      id: review.ID_Avaliacao,
      customerName: review.Nome_Cliente || 'Anônimo',
      rating: rating,
      comment: review.Comentario || review.Comment || '',
      date: review.Data_Avaliacao
    };
  });
}

/**
 * Create a new product review (status: Pendente)
 * @param {Object} data - Dados da avaliação
 * @returns {Object} Resultado da operação
 */
function createReview(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('AVALIACOES');
  
  if (!sheet) {
    Logger.log('❌ Sheet AVALIACOES não encontrada');
    return { 
      success: false, 
      message: 'Sistema de avaliações não configurado. Contate o administrador.' 
    };
  }
  
  // Validação de dados
  if (!data.customerId || !data.productId || !data.rating) {
    Logger.log('❌ Dados incompletos:');
    Logger.log('customerId: ' + data.customerId);
    Logger.log('productId: ' + data.productId);
    Logger.log('rating: ' + data.rating);
    return { 
      success: false, 
      message: 'Dados incompletos para criar avaliação' 
    };
  }
  
  // ====================================================================
  // ✅ CORREÇÃO CRÍTICA: Ler headers dinamicamente ao invés de assumir posições
  // ====================================================================
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  Logger.log('='.repeat(80));
  Logger.log('📋 HEADERS DA PLANILHA AVALIACOES:');
  Logger.log(JSON.stringify(headers));
  Logger.log('='.repeat(80));
  
  // Mapear índices das colunas
  const columnMap = {};
  headers.forEach((header, index) => {
    if (header) columnMap[String(header).trim()] = index;
  });
  
  Logger.log('🗺️ Mapeamento de colunas:');
  Logger.log(JSON.stringify(columnMap));
  
  // Verificar se colunas obrigatórias existem
  const requiredColumns = ['ID_Avaliacao', 'ID_Cliente', 'ID_Produto', 'Rating', 'Status'];
  const missingColumns = requiredColumns.filter(col => columnMap[col] === undefined);
  
  if (missingColumns.length > 0) {
    Logger.log('❌ Colunas faltando: ' + missingColumns.join(', '));
    return {
      success: false,
      message: 'Planilha AVALIACOES com estrutura incorreta. Contate o administrador.'
    };
  }
  
  // Gerar ID único
  const reviewId = 'REV-' + Utilities.getUuid().substring(0, 8);
  
  // ====================================================================
  // ✅ LOGS DETALHADOS DOS DADOS RECEBIDOS
  // ====================================================================
  Logger.log('='.repeat(80));
  Logger.log('📦 DADOS RECEBIDOS PARA CRIAR REVIEW:');
  Logger.log('customerId: "' + data.customerId + '"');
  Logger.log('productId: "' + data.productId + '"');
  Logger.log('customerName: "' + (data.customerName || 'N/A') + '"');
  Logger.log('rating: ' + data.rating);
  Logger.log('comment: "' + (data.comment || '') + '"');
  Logger.log('='.repeat(80));
  
  // ====================================================================
  // ✅ INSERIR DADOS NAS COLUNAS CORRETAS DINAMICAMENTE
  // ====================================================================
  try {
    // Criar array com número total de colunas (inicializado vazio)
    const row = new Array(headers.length).fill('');
    
    // Preencher apenas as colunas que existem
    if (columnMap['ID_Avaliacao'] !== undefined) {
      row[columnMap['ID_Avaliacao']] = reviewId;
    }
    
    if (columnMap['ID_Cliente'] !== undefined) {
      row[columnMap['ID_Cliente']] = data.customerId;
    }
    
    if (columnMap['ID_Produto'] !== undefined) {
      row[columnMap['ID_Produto']] = data.productId;
    }
    
    // ID_Venda pode não existir ou ser opcional
    if (columnMap['ID_Venda'] !== undefined) {
      row[columnMap['ID_Venda']] = data.orderId || '';
    }
    
    if (columnMap['Nome_Cliente'] !== undefined) {
      row[columnMap['Nome_Cliente']] = data.customerName || 'Cliente';
    }
    
    if (columnMap['Rating'] !== undefined) {
      row[columnMap['Rating']] = Number(data.rating);
    }
    
    // Comentario/Comentário - suporte para variações
    const comentarioCol = columnMap['Comentario'] || columnMap['Comentário'] || columnMap['Comment'];
    if (comentarioCol !== undefined) {
      row[comentarioCol] = data.comment || '';
    }
    
    if (columnMap['Data_Avaliacao'] !== undefined) {
      row[columnMap['Data_Avaliacao']] = new Date();
    }
    
    if (columnMap['Status'] !== undefined) {
      row[columnMap['Status']] = 'Pendente';
    }
    
    Logger.log('='.repeat(80));
    Logger.log('📝 DADOS A SEREM INSERIDOS:');
    Logger.log(JSON.stringify(row));
    Logger.log('='.repeat(80));
    
    // Inserir linha
    sheet.appendRow(row);
    
    Logger.log('✅ Avaliação criada com sucesso: ' + reviewId);
    
    return { 
      success: true, 
      message: 'Avaliação enviada! Aguardando aprovação do administrador.',
      reviewId: reviewId
    };
  } catch (error) {
    Logger.log('❌ Erro ao criar avaliação: ' + error.toString());
    return { 
      success: false, 
      message: 'Erro ao salvar avaliação. Tente novamente.' 
    };
  }
}

/**
 * [ADMIN] Get all reviews (for admin panel)
 * @returns {Array} Array de todas as avaliações
 */
function getAdminReviews() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('AVALIACOES');
  
  if (!sheet) {
    Logger.log('⚠️ Sheet AVALIACOES não encontrada');
    return [];
  }
  
  const reviews = sheetToJSON(sheet);
  
  // Retornar todas as avaliações (pendentes, aprovadas, rejeitadas)
  return reviews.map(review => ({
    id: review.ID_Avaliacao,
    productId: review.ID_Produto || review.ID_Geladinho,  // Suporte para ambas colunas
    productName: review.Nome_Geladinho || 'Produto',
    customerId: review.ID_Cliente,
    customerName: review.Nome_Cliente || 'Cliente',
    rating: Number(review.Rating || review.Nota || 0),    // ✅ CORRIGIDO - Rating é o nome correto
    comment: review.Comentario || '',
    date: review.Data_Avaliacao,
    status: review.Status || 'Pendente'
  })).reverse(); // Mais recentes primeiro
}

/**
 * [ADMIN] Update review status (Aprovar/Rejeitar)
 * @param {Object} data - { reviewId, newStatus }
 * @returns {Object} Resultado da operação
 */
function updateReviewStatus(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('AVALIACOES');
  
  if (!sheet) {
    return { success: false, message: 'Sistema indisponível' };
  }
  
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idIndex = headers.indexOf('ID_Avaliacao');
  const statusIndex = headers.indexOf('Status');
  
  if (idIndex === -1 || statusIndex === -1) {
    return { success: false, message: 'Configuração inválida da planilha' };
  }
  
  // Encontrar e atualizar a avaliação
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][idIndex]).trim() === String(data.reviewId).trim()) {
      sheet.getRange(i + 1, statusIndex + 1).setValue(data.newStatus);
      
      Logger.log(`✅ Status da avaliação ${data.reviewId} atualizado para: ${data.newStatus}`);
      
      return { 
        success: true, 
        message: `Avaliação ${data.newStatus.toLowerCase()} com sucesso!` 
      };
    }
  }
  
  return { success: false, message: 'Avaliação não encontrada' };
}

// ======================================================
// HELPER FUNCTION
// ======================================================

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
