// ======================================================
// BACKEND DONA CAPIVARA - V17.1 CONFIGURÁVEL
// Mix como Produto Único + Sistema de Adicionais + Promoção Cinema Configurável
// ======================================================

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

    // Admin Check
    if (['getAdminOrders', 'updateOrderStatus', 'getOrderItems', 'getDashboardStats', 'getAdminReviews', 'updateReviewStatus', 'realizarSorteio', 'concederPremio', 'getParticipantesSorteio'].includes(action)) {
      const providedKey = e.parameter.adminKey || data.adminKey;
      if (String(providedKey).trim() !== ADMIN_PASS) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Unauthorized" })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    let result;

    switch (action) {
      // --- LEITURA ---
      case 'getProducts': result = getProducts(); break;
      case 'getCategories': result = getCategories(); break;
      case 'getBanners': result = getBanners(); break;
      case 'getConfig': result = getConfig(); break;
      case 'getOrders': result = getOrders(e.parameter.customerId); break;

      // Cupons
      case 'validateCoupon':
        if (e.postData && e.postData.contents) {
          result = validateCouponWithContext(data);
        } else {
          result = validateCoupon(e.parameter.code);
        }
        break;

      // Reviews
      case 'getReviews': result = getProductReviews(e.parameter.productId); break;

      // --- PRODUCT WITH ADDITIONS (Funciona para todos, incluindo Mix)
      case 'getProductWithAdditions': result = getProductWithAdditions(e.parameter.productId); break;
      case 'calculateItemPrice': result = validateAndCalculatePrice(data); break;

      // --- PROMOÇÃO / SORTEIOS (CONFIGURÁVEL) ---
      case 'getMinhasChances': result = getMinhasChances(e.parameter.customerId); break;
      case 'getParticipantesSorteio': result = getParticipantesSorteio(e.parameter.promoId); break;
      case 'realizarSorteio': result = realizarSorteioAPI(data); break;
      case 'concederPremio': result = concederPremioAPI(data); break;

      // --- ADMIN LEITURA ---
      case 'getAdminOrders': result = getAdminOrders(); break;
      case 'getOrderItems': result = getOrderItems(e.parameter.orderId); break;
      case 'getDashboardStats': result = getDashboardStats(); break;
      case 'getAdminReviews': result = getAdminReviews(); break;

      // --- ESCRITA ---
      case 'createCustomer': result = createCustomer(data); break;
      case 'loginCustomer': result = loginCustomer(data); break;
      case 'createOrder': result = createOrder(data); break;
      case 'updateFavorites': result = updateFavorites(data); break;
      case 'updateOrderStatus': result = updateOrderStatus(data); break;
      case 'createReview': result = createReview(data); break;
      case 'updateReviewStatus': result = updateReviewStatus(data); break;

      // --- MIX GOURMET ---
      case 'getMixWithFlavorAndAdditions': result = getMixWithFlavorAndAdditions(e.parameter.mixId); break;
      case 'calculateMixPrice': result = calculateMixPrice(data); break;

      default: result = { error: 'Ação inválida' };
    }

    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Erro: " + error.toString() })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// ======================================================
// FUNÇÕES BÁSICAS E AUXILIARES
// ======================================================

function getProducts() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('GELADINHOS');
  if (!sheet) return [];
  return sheetToJSON(sheet).filter(i => String(i.Produto_Ativo).toUpperCase() === 'TRUE');
}

function getCategories() {
  return sheetToJSON(SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CATEGORIAS_GELADINHO'));
}

/**
 * Busca todos os banners ativos do Google Sheets
 * Retorna array de banners ordenados pela coluna "Ordem"
 */
function getBanners() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('BANNERS');
    
    // Se não encontrar a aba, retorna array vazio (frontend usará fallback)
    if (!sheet) {
      Logger.log('⚠️ Aba BANNERS não encontrada. Retornando array vazio.');
      return { 
        success: true, 
        banners: [] 
      };
    }
    
    const data = sheetToJSON(sheet);
    
    // Filtra apenas banners ativos e ordena
    const banners = data
      .filter(b => {
        const ativo = String(b.Ativo || '').toUpperCase();
        return ativo === 'TRUE' || ativo === 'VERDADEIRO' || ativo === '1';
      })
      .sort((a, b) => {
        const ordemA = Number(a.Ordem) || 0;
        const ordemB = Number(b.Ordem) || 0;
        return ordemA - ordemB;
      })
      .map(b => ({
        id: b.ID_Banner || '',
        image: b.URL_Imagem || '',
        title: b.Titulo || '',
        subtitle: b.Subtitulo || '',
        ctaText: b.Texto_CTA || ''
      }));
    
    Logger.log(`✅ getBanners: ${banners.length} banners ativos encontrados`);
    
    return { 
      success: true, 
      banners: banners
    };
    
  } catch (err) {
    Logger.log(`❌ Erro em getBanners: ${err.message}`);
    return { 
      success: false, 
      error: err.message,
      banners: []
    };
  }
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

// ======================================================
// SISTEMA DE CUPONS
// ======================================================

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

// ======================================================
// SISTEMA DE AVALIAÇÕES
// ======================================================

function createReview(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const avaliacoesSheet = ss.getSheetByName('AVALIACOES');
  const vendasSheet = ss.getSheetByName('VENDAS');
  const itensSheet = ss.getSheetByName('ITENS_VENDA');

  if (!avaliacoesSheet) {
    return { success: false, message: 'Sistema de avaliações não configurado' };
  }

  const productId = String(data.productId || '').trim();
  const customerId = String(data.customerId || '').trim();
  const rating = Number(data.rating || 0);

  if (!productId || !customerId || customerId === 'GUEST') {
    return { success: false, message: 'Dados inválidos' };
  }

  if (rating < 1 || rating > 5) {
    return { success: false, message: 'Avaliação deve ser entre 1 e 5 estrelas' };
  }

  const vendas = sheetToJSON(vendasSheet);
  const itens = sheetToJSON(itensSheet);

  const vendasDoCliente = vendas.filter(v =>
    String(v.ID_Cliente).trim() === customerId
  );

  let hasOrder = false;
  for (const venda of vendasDoCliente) {
    const itensVenda = itens.filter(i =>
      String(i.ID_Venda).trim() === String(venda.ID_Venda).trim()
    );

    if (itensVenda.some(item => String(item.ID_Geladinho).trim() === productId)) {
      hasOrder = true;
      break;
    }
  }

  if (!hasOrder) {
    return { success: false, message: 'Você precisa comprar este produto para avaliá-lo' };
  }

  const avaliacoes = sheetToJSON(avaliacoesSheet);
  const jaAvaliou = avaliacoes.some(a =>
    String(a.ID_Cliente).trim() === customerId &&
    String(a.ID_Produto).trim() === productId
  );

  if (jaAvaliou) {
    return { success: false, message: 'Você já avaliou este produto' };
  }

  const id = Utilities.getUuid();
  avaliacoesSheet.appendRow([
    id,
    customerId,
    productId,
    '',
    data.customerName || 'Cliente',
    rating,
    data.comment || '',
    new Date(),
    'Pendente'
  ]);

  return { success: true, reviewId: id };
}

function getProductReviews(productId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('AVALIACOES');

  if (!sheet) return [];

  const reviews = sheetToJSON(sheet);
  const pid = String(productId || '').trim();

  return reviews
    .filter(r =>
      String(r.ID_Produto).trim() === pid &&
      String(r.Status).toUpperCase() === 'APROVADA'
    )
    .map(r => ({
      id: r.ID_Avaliacao,
      customerName: r.Nome_Cliente || 'Anônimo',
      rating: Number(r.Rating || 0),
      comment: r.Comentario || '',
      date: r.Data_Avaliacao
    }));
}

function getAdminReviews() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('AVALIACOES');
  const produtosSheet = ss.getSheetByName('GELADINHOS');

  if (!sheet) return [];

  const reviews = sheetToJSON(sheet);
  const produtos = sheetToJSON(produtosSheet);

  return reviews.map(r => {
    const produto = produtos.find(p =>
      String(p.ID_Geladinho).trim() === String(r.ID_Produto).trim()
    );

    return {
      id: r.ID_Avaliacao,
      productName: produto ? produto.Nome_Geladinho : 'Produto excluído',
      customerName: r.Nome_Cliente || 'Anônimo',
      rating: Number(r.Rating || 0),
      comment: r.Comentario || '',
      date: r.Data_Avaliacao,
      status: r.Status || 'Pendente'
    };
  }).reverse();
}

function updateReviewStatus(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('AVALIACOES');

  if (!sheet) return { success: false };

  const vals = sheet.getDataRange().getValues();
  const idIdx = vals[0].indexOf('ID_Avaliacao');
  const statusIdx = vals[0].indexOf('Status');

  if (idIdx === -1 || statusIdx === -1) return { success: false };

  for (let i = 1; i < vals.length; i++) {
    if (String(vals[i][idIdx]) === String(data.reviewId)) {
      sheet.getRange(i + 1, statusIdx + 1).setValue(data.newStatus);
      return { success: true };
    }
  }

  return { success: false };
}

// ======================================================
// SYSTEM DE ADICIONAIS
// Funciona para TODOS os produtos (regulares e Mix)
// ======================================================

function getProductWithAdditions(productId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const produtosSheet = ss.getSheetByName('GELADINHOS');
  const gruposSheet = ss.getSheetByName('GRUPOS_ADICIONAIS');
  const adicionaisSheet = ss.getSheetByName('ADICIONAIS');

  const produtos = sheetToJSON(produtosSheet);
  const produto = produtos.find(p => String(p.ID_Geladinho).trim() === String(productId).trim());

  if (!produto) {
    return { error: 'Produto não encontrado' };
  }

  if (!produto.Tem_Adicionais || String(produto.Tem_Adicionais).toUpperCase() !== 'TRUE') {
    return produto;
  }

  const grupoIds = String(produto.IDs_Grupos_Adicionais || '').split(',').map(id => id.trim()).filter(id => id);

  if (grupoIds.length === 0) {
    return produto;
  }

  const grupos = sheetToJSON(gruposSheet)
    .filter(g => grupoIds.includes(String(g.ID_Grupo).trim()) && String(g.Ativo).toUpperCase() === 'TRUE')
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

  if (produto.error) {
    return { success: false, error: produto.error };
  }

  let additionsTotal = 0;
  const validatedAdditions = [];

  if (!produto.addition_groups || produto.addition_groups.length === 0) {
    const basePrice = Number(produto.Preco_Venda);
    return {
      success: true,
      base_price: basePrice,
      additions_subtotal: 0,
      unit_price: basePrice,
      quantity: quantity,
      total_price: basePrice * quantity,
      validated_additions: []
    };
  }

  for (const selection of (selectedAdditions || [])) {
    const grupo = produto.addition_groups.find(g => g.id === selection.group_id);
    if (!grupo) {
      return { success: false, error: `Grupo ${selection.group_id} não encontrado` };
    }

    const opcao = grupo.options.find(o => o.id === selection.option_id);
    if (!opcao) {
      return { success: false, error: `Opção ${selection.option_id} não encontrada` };
    }

    if (opcao.stock_status === 'out_of_stock') {
      return {
        success: false,
        error: `${opcao.name} está indisponível`
      };
    }

    additionsTotal += opcao.price;
    validatedAdditions.push({
      group_id: grupo.id,
      group_name: grupo.name,
      option_id: opcao.id,
      option_sku: opcao.sku,
      option_name: opcao.name,
      option_price: opcao.price
    });
  }

  for (const grupo of produto.addition_groups) {
    const selectionsInGroup = validatedAdditions.filter(a => a.group_id === grupo.id);

    if (grupo.min > 0 && selectionsInGroup.length < grupo.min) {
      return {
        success: false,
        error: `${grupo.name} requer pelo menos ${grupo.min} seleção(ões)`
      };
    }

    if (grupo.max < 99 && selectionsInGroup.length > grupo.max) {
      return {
        success: false,
        error: `${grupo.name} permite no máximo ${grupo.max} seleção(ões)`
      };
    }
  }

  const basePrice = Number(produto.Preco_Venda);
  const unitPrice = basePrice + additionsTotal;
  const totalPrice = unitPrice * quantity;

  return {
    success: true,
    base_price: basePrice,
    additions_subtotal: additionsTotal,
    unit_price: unitPrice,
    quantity: quantity,
    total_price: totalPrice,
    validated_additions: validatedAdditions
  };
}

// ======================================================
// CONFIGURAÇÃO DE PROMOÇÃO (NOVO - DINÂMICA)
// ======================================================

/**
 * Obtém a configuração ativa da promoção do Google Sheets
 * IMPORTANTE: Esta função permite alterar nome, ícone, valor sem tocar no código!
 */
function getPromoConfig() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = ss.getSheetByName('CONFIGURACAO_PROMO');
  
  // Se não encontrar a sheet, retorna configuração padrão
  if (!configSheet) {
    Logger.log('⚠️ Sheet CONFIGURACAO_PROMO não encontrada, usando valores padrão');
    return {
      id: 'PROMO_DEFAULT',
      nome: 'Promoção Cinema',
      icone: '🎬',
      descricao: 'Ganhe ingressos comprando!',
      valorMeta: 18,
      mensagemProgresso: 'Faltam para próxima chance',
      mensagemSemNumeros: 'Compre para ganhar sua primeira chance!',
      ativa: true
    };
  }
  
  const configs = sheetToJSON(configSheet);
  
  // Procura a primeira promoção ativa
  const promoAtiva = configs.find(c => 
    String(c.Promocao_Ativa).toUpperCase() === 'TRUE'
  );
  
  if (!promoAtiva) {
    Logger.log('⚠️ Nenhuma promoção ativa encontrada, usando valores padrão');
    return {
      id: 'PROMO_DEFAULT',
      nome: 'Promoção',
      icone: '🎁',
      descricao: 'Participe da promoção!',
      valorMeta: 18,
      mensagemProgresso: 'Faltam',
      mensagemSemNumeros: 'Faça compras para participar!',
      ativa: false
    };
  }
  
  return {
    id: promoAtiva.ID_Config || 'PROMO_DEFAULT',
    nome: promoAtiva.Nome_Promocao || 'Promoção',
    icone: promoAtiva.Icone || '🎁',
    descricao: promoAtiva.Descricao_Curta || '',
    valorMeta: Number(promoAtiva.Valor_Meta || 18),
    mensagemProgresso: promoAtiva.Mensagem_Progresso || 'Faltam',
    mensagemSemNumeros: promoAtiva.Mensagem_Sem_Numeros || 'Participe!',
    ativa: true
  };
}

// ======================================================
// SISTEMA DE PROMOÇÃO - CINEMA CONFIGURÁVEL (ATUALIZADO)
// ======================================================

/**
 * Retorna as chances de sorteio de um cliente
 * CORRIGIDO: Agora retorna objeto config com configurações dinâmicas
 */
function getMinhasChances(customerId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sorteiosSheet = ss.getSheetByName('SORTEIOS');
  const clientesSheet = ss.getSheetByName('CLIENTES');
  
  // ✅ OBTÉM CONFIGURAÇÃO DINÂMICA DA PROMOÇÃO
  const promoConfig = getPromoConfig();
  
  if (!sorteiosSheet || !customerId || customerId === 'GUEST') {
    return { 
      success: true, 
      numeros: [],
      gastoAtual: 0,
      metaAtual: promoConfig.valorMeta,
      faltam: promoConfig.valorMeta,
      // ✅ RETORNA CONFIG DINÂMICA
      config: {
        nome: promoConfig.nome,
        icone: promoConfig.icone,
        descricao: promoConfig.descricao,
        mensagemProgresso: promoConfig.mensagemProgresso,
        mensagemSemNumeros: promoConfig.mensagemSemNumeros,
        ativa: promoConfig.ativa
      }
    };
  }
  
  const sorteios = sheetToJSON(sorteiosSheet);
  const clientes = sheetToJSON(clientesSheet);
  
  const minhasSortes = sorteios.filter(s => 
    String(s.ID_Cliente).trim() === String(customerId).trim()
  );
  
  const cliente = clientes.find(c => 
    String(c.ID_Cliente).trim() === String(customerId).trim()
  );
  
  const gastoAtual = cliente ? Number(cliente.Gasto_Acumulado_Promo || 0) : 0;
  const metaAtual = promoConfig.valorMeta;
  const faltam = metaAtual - (gastoAtual % metaAtual);
  
  return {
    success: true,
    numeros: minhasSortes.map(s => ({
      numero: s.Numero_Sorte,
      promoId: s.ID_Promo,
      dataGanho: s.Data_Ganho,
      status: s.Status_Sorteio,
      ganhou: s.Ganhou === 'TRUE' || s.Ganhou === true,
      premio: s.Tipo_Premio || null
    })),
    gastoAtual: gastoAtual,
    metaAtual: metaAtual,
    faltam: Math.max(0, faltam),
    // ✅ RETORNA CONFIG DINÂMICA
    config: {
      nome: promoConfig.nome,
      icone: promoConfig.icone,
      descricao: promoConfig.descricao,
      mensagemProgresso: promoConfig.mensagemProgresso,
      mensagemSemNumeros: promoConfig.mensagemSemNumeros,
      ativa: promoConfig.ativa
    }
  };
}

/**
 * Retorna todos os participantes de uma promoção (Admin)
 */
function getParticipantesSorteio(promoId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sorteiosSheet = ss.getSheetByName('SORTEIOS');
  
  if (!sorteiosSheet) {
    return { success: false, message: 'Sheet SORTEIOS não encontrada' };
  }
  
  const sorteios = sheetToJSON(sorteiosSheet);
  const participantes = sorteios.filter(s => 
    String(s.ID_Promo).trim() === String(promoId).trim()
  );
  
  return {
    success: true,
    total: participantes.length,
    participantes: participantes.map(p => ({
      id: p.ID_Sorteio,
      numero: p.Numero_Sorte,
      cliente: p.Nome_Cliente,
      telefone: p.Telefone_Cliente,
      dataGanho: p.Data_Ganho,
      status: p.Status_Sorteio,
      ganhou: p.Ganhou === 'TRUE' || p.Ganhou === true,
      numeroSorteado: p.Numero_Sorteado || null,
      premio: p.Tipo_Premio || null
    }))
  };
}

/**
 * Realiza o sorteio (Admin)
 */
function realizarSorteioAPI(data) {
  const promoId = data.promoId;
  
  try {
    // Chama a função do PromocaoHelper.gs
    const vencedor = realizarSorteio(promoId);
    
    if (!vencedor) {
      return {
        success: false,
        message: 'Nenhum participante encontrado'
      };
    }
    
    return {
      success: true,
      vencedor: {
        id: vencedor.ID_Sorteio,
        nome: vencedor.Nome_Cliente,
        numero: vencedor.Numero_Sorte,
        telefone: vencedor.Telefone_Cliente
      }
    };
    
  } catch (error) {
    return {
      success: false,
      message: 'Erro ao realizar sorteio: ' + error.toString()
    };
  }
}

/**
 * Concede prêmio ao vencedor (Admin)
 */
function concederPremioAPI(data) {
  try {
    const resultado = concederPremioAoVencedor(
      data.sorteioId,
      data.tipoPremio,
      data.valorPremio || 0,
      data.codigoCupom
    );
    
    if (resultado) {
      return { success: true };
    } else {
      return { success: false, message: 'Erro ao conceder prêmio' };
    }
    
  } catch (error) {
    return {
      success: false,
      message: 'Erro: ' + error.toString()
    };
  }
}

// ======================================================
// AUTENTICAÇÃO E CLIENTES
// ======================================================

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
    id, d.name, d.phone, '', '', '', '', '', 0, new Date(), 'SIM', d.password, code, '', '', 0
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

// ======================================================
// ANALYTICS & DASHBOARD
// ======================================================

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

// ======================================================
// VENDAS & ESTOQUE
// ======================================================

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
          if (String(gData[i][idIdx]).trim() === String(item.id).trim()) {
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
          if (String(cData[k][codeIdx]).trim() === String(d.referralCode).trim()) {
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

  // ========== INTEGRAÇÃO COM SISTEMA DE PROMOÇÃO ==========
  // Atualizar gasto acumulado e verificar se cliente ganhou número da sorte
  if (d.customer?.id && String(d.customer.id) !== 'GUEST') {
    try {
      const valorCompra = Number(d.total || 0);
      atualizarGastoPromoClienteComRegistroSorteio(d.customer.id, valorCompra);
      Logger.log('✅ Promoção atualizada para cliente: ' + d.customer.id);
    } catch (error) {
      Logger.log('⚠️ Erro ao atualizar promoção: ' + error);
      // Não interrompe o pedido se a promoção falhar
    }
  }
  // ========== FIM DA INTEGRAÇÃO ==========

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
// HELPER FUNCTIONS
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

// ======================================================
// MIX GOURMET SYSTEM
// ======================================================

/**
 * Get mix product with available flavors and addition groups
 * @param {string} mixId - ID do produto mix
 * @returns {object} Mix completo com sabores e adicionais
 */
function getMixWithFlavorAndAdditions(mixId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const mixSheet = ss.getSheetByName('MIX_PRODUTOS');
  const saboresSheet = ss.getSheetByName('MIX_SABORES');
  const gruposSheet = ss.getSheetByName('GRUPOS_ADICIONAIS');
  const adicionaisSheet = ss.getSheetByName('ADICIONAIS');
  
  if (!mixSheet || !saboresSheet) {
    return { error: 'Sheets MIX_PRODUTOS ou MIX_SABORES não encontradas' };
  }
  
  // Get mix product
  const mixes = sheetToJSON(mixSheet);
  const mix = mixes.find(m => String(m.ID_Mix).trim() === String(mixId).trim());
  
  if (!mix) {
    return { error: 'Mix não encontrado' };
  }
  
  // Get available flavors
  const sabores = sheetToJSON(saboresSheet);
  const availableFlavors = sabores
    .filter(s => String(s.Ativo).toUpperCase() === 'TRUE')
    .map(s => ({
      id: s.ID_Sabor,
      name: s.Nome_Sabor,
      category: s.Categoria || 'Geral',
      price: Number(s.Preco_Adicional || 0),
      stock_status: String(s.Status_Estoque).toLowerCase() === 'disponivel' ? 'available' : 'out_of_stock',
      image_url: s.Imagem_URL || null
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  
  // Get addition groups if configured
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
            .map(a => ({
              id: a.ID_Adicional,
              sku: a.SKU,
              name: a.Nome,
              price: Number(a.Preco),
              stock_status: a.Status_Estoque,
              image_url: a.Imagem_URL || null,
              order: Number(a.Ordem)
            }))
            .sort((a, b) => a.order - b.order)
        }))
        .sort((a, b) => a.order - b.order);
    }
  }
  
  Logger.log(`✅ Mix ${mixId} carregado: ${availableFlavors.length} sabores, ${additionGroups.length} grupos`);
  
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

/**
 * Validate and calculate mix price
 * @param {object} data - Dados do mix selecionado
 * @returns {object} Validação e cálculo de preço
 */
function calculateMixPrice(data) {
  const { mixId, selectedFlavors, selectedAdditions, quantity } = data;
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const mixSheet = ss.getSheetByName('MIX_PRODUTOS');
  const saboresSheet = ss.getSheetByName('MIX_SABORES');
  
  if (!mixSheet || !saboresSheet) {
    return { success: false, error: 'Configuração incompleta' };
  }
  
  // Get mix
  const mixes = sheetToJSON(mixSheet);
  const mix = mixes.find(m => String(m.ID_Mix).trim() === String(mixId).trim());
  
  if (!mix) {
    return { success: false, error: 'Mix não encontrado' };
  }
  
  const basePrice = Number(mix.Preco_Base || 0);
  const pricePerFlavor = Number(mix.Preco_Por_Sabor || 0);
  const maxFlavors = Number(mix.Max_Sabores || 2);
  
  // Validate flavor count
  if (!selectedFlavors || selectedFlavors.length === 0) {
    return { success: false, error: 'Selecione pelo menos 1 sabor' };
  }
  
  if (selectedFlavors.length > maxFlavors) {
    return { success: false, error: `Máximo de ${maxFlavors} sabores permitidos` };
  }
  
  // Validate flavors exist and are available
  const sabores = sheetToJSON(saboresSheet);
  const validatedFlavors = [];
  
  for (const flavorId of selectedFlavors) {
    const sabor = sabores.find(s => String(s.ID_Sabor).trim() === String(flavorId).trim());
    
    if (!sabor) {
      return { success: false, error: `Sabor ${flavorId} não encontrado` };
    }
    
    if (String(sabor.Ativo).toUpperCase() !== 'TRUE') {
      return { success: false, error: `Sabor ${sabor.Nome_Sabor} está inativo` };
    }
    
    if (String(sabor.Status_Estoque).toLowerCase() !== 'disponivel') {
      return { success: false, error: `Sabor ${sabor.Nome_Sabor} indisponível` };
    }
    
    validatedFlavors.push({
      flavor_id: sabor.ID_Sabor,
      flavor_name: sabor.Nome_Sabor,
      flavor_price: pricePerFlavor
    });
  }
  
  // Calculate flavors total
  const flavorsSubtotal = selectedFlavors.length * pricePerFlavor;
  
  // Validate additions (if any)
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
            group_id: addition.group_id,
            group_name: addition.group_name,
            option_id: adicional.ID_Adicional,
            option_name: adicional.Nome,
            option_price: Number(adicional.Preco)
          });
        }
      }
    }
  }
  
  // Calculate totals
  const unitPrice = basePrice + flavorsSubtotal + additionsSubtotal;
  const totalPrice = unitPrice * quantity;
  
  Logger.log(`✅ Mix price calculated: Base=${basePrice}, Flavors=${flavorsSubtotal}, Additions=${additionsSubtotal}, Total=${totalPrice}`);
  
  return {
    success: true,
    base_price: basePrice,
    flavors_count: selectedFlavors.length,
    flavors_subtotal: flavorsSubtotal,
    additions_subtotal: additionsSubtotal,
    unit_price: unitPrice,
    quantity: quantity,
    total_price: totalPrice,
    validated_flavors: validatedFlavors,
    validated_additions: validatedAdditions
  };
}
