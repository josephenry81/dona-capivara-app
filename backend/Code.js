// ======================================================
// BACKEND DONA CAPIVARA - V14.2 (REFERRAL LINK SYSTEM)
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
    if (['getAdminOrders', 'updateOrderStatus', 'getOrderItems', 'getDashboardStats'].includes(action)) {
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
      case 'validateCoupon': result = validateCoupon(e.parameter.code); break;

      // --- ADMIN LEITURA ---
      case 'getAdminOrders': result = getAdminOrders(); break;
      case 'getOrderItems': result = getOrderItems(e.parameter.orderId); break;
      case 'getDashboardStats': result = getDashboardStats(); break;

      // --- ESCRITA ---
      case 'createCustomer': result = createCustomer(data); break;
      case 'loginCustomer': result = loginCustomer(data); break;
      case 'createOrder': result = createOrder(data); break;
      case 'updateFavorites': result = updateFavorites(data); break;
      case 'updateOrderStatus': result = updateOrderStatus(data); break;

      default: result = { error: 'Ação inválida' };
    }

    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Erro: " + error.toString() })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// --- FUNÇÕES BÁSICAS ---
function getProducts() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('GELADINHOS');
  if (!sheet) return [];
  return sheetToJSON(sheet).filter(i => String(i.Produto_Ativo).toUpperCase() === 'TRUE');
}
function getCategories() { return sheetToJSON(SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CATEGORIAS_GELADINHO')); }
function getBanners() { return sheetToJSON(SpreadsheetApp.getActiveSpreadsheet().getSheetByName('BANNERS')).filter(i => String(i.Ativo).toUpperCase() === 'TRUE'); }
function getConfig() { return sheetToJSON(SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CONFIGURACOES')); }
function getOrders(cid) {
  return sheetToJSON(SpreadsheetApp.getActiveSpreadsheet().getSheetByName('VENDAS'))
    .filter(o => String(o.ID_Cliente).trim() === String(cid).trim()).reverse();
}

// ✅ UPDATED: getAdminOrders with customer names
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

    return {
      ...venda,
      Nome_Cliente: customerName
    };
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

// --- AUTH & CLIENTES ---
function loginCustomer(d) {
  if (String(d.phone).trim().toLowerCase() === ADMIN_LOGIN && String(d.password).trim() === ADMIN_PASS)
    return { success: true, customer: { ID_Cliente: 'ADMIN', Nome: 'Admin', isAdmin: true, adminKey: ADMIN_PASS } };

  const users = sheetToJSON(SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CLIENTES'));
  const u = users.find(c => String(c.Telefone).replace(/\D/g, '') === String(d.phone).replace(/\D/g, ''));

  if (u && String(u.Senha) === String(d.password)) {
    return {
      success: true, customer: {
        ID_Cliente: u.ID_Cliente, Nome: u.Nome, Telefone: u.Telefone,
        Pontos_Fidelidade: Number(u.Pontos_Fidelidade) || 0, Codigo_Convite: u.Codigo_Convite,
        Favoritos: u.Favoritos || '', Endereco: u.Endereco || '', Torre: u.Torre || '', Apartamento: u.Apartamento || ''
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

// --- ANALYTICS ---
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

// ✅ UPDATED: createOrder - Save referral code WITHOUT awarding points
function createOrder(d) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const V = ss.getSheetByName('VENDAS');
  const I = ss.getSheetByName('ITENS_VENDA');
  const G = ss.getSheetByName('GELADINHOS');
  const C = ss.getSheetByName('CLIENTES');

  const id = Utilities.getUuid();
  const now = new Date();
  const disc = Number(d.discountValue || 0);
  const pts = Number(d.pointsRedeemed || 0);

  let obs = pts > 0 ? `Usou ${pts} pts` : '';
  if (d.couponCode) obs += (obs ? ' | ' : '') + `Cupom: ${d.couponCode}`;

  // ✅ NEW: Save referral code in observations
  const refCode = d.referralCode || '';
  if (refCode) obs += (obs ? ' | ' : '') + `Ref: ${refCode}`;

  // Log Venda - IMPORTANT: Ensure your VENDAS sheet has a "Codigo_Indicacao" column
  // If not, you'll need to add it or use Observacoes field
  V.appendRow([
    id, now, d.customer?.id || 'GUEST', obs,
    d.total, d.total, 'Pendente', disc, pts > 0,
    d.deliveryFee, d.customer?.name, d.customer?.details?.torre,
    d.customer?.details?.apto, d.paymentMethod, d.scheduling || 'Imediata',
    refCode  // ✅ NEW COLUMN: Codigo_Indicacao (add this column to your sheet!)
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

  // Update Customer Points (earned from purchase, minus redeemed)
  // ✅ CHANGED: Do NOT award referral bonus here
  if (d.customer?.id && String(d.customer.id) !== 'GUEST') {
    const cData = C.getDataRange().getValues();
    const h = cData[0].map(x => String(x).trim());
    const idIdx = h.indexOf('ID_Cliente');
    const ptsIdx = h.indexOf('Pontos_Fidelidade');

    if (idIdx > -1 && ptsIdx > -1) {
      const earned = Math.floor(Number(d.total));
      let bonus = Number(d.bonusPoints || 0);

      for (let i = 1; i < cData.length; i++) {
        if (String(cData[i][idIdx]) === String(d.customer.id)) {
          const cur = Number(cData[i][ptsIdx] || 0);
          C.getRange(i + 1, ptsIdx + 1).setValue(Math.max(0, cur + earned + bonus - pts));

          // Persist Address
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
  return { success: true, idVenda: id };
}

// ✅ NEW: updateOrderStatus - Award referral points when status changes to "Entregue"
function updateOrderStatus(d) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const V = ss.getSheetByName('VENDAS');
  const C = ss.getSheetByName('CLIENTES');

  const vData = V.getDataRange().getValues();
  const vHeaders = vData[0].map(h => String(h).trim());
  const idIdx = vHeaders.indexOf('ID_Venda');
  const statusIdx = vHeaders.indexOf('Status');
  const refCodeIdx = vHeaders.indexOf('Codigo_Indicacao');
  const clienteIdIdx = vHeaders.indexOf('ID_Cliente');

  for (let i = 1; i < vData.length; i++) {
    if (String(vData[i][idIdx]) === String(d.orderId)) {
      const oldStatus = vData[i][statusIdx];
      const newStatus = d.newStatus;

      // Update status
      V.getRange(i + 1, statusIdx + 1).setValue(newStatus);

      // ✅ REFERRAL POINTS - Only when delivered
      if (newStatus === 'Entregue' && oldStatus !== 'Entregue') {
        const refCode = refCodeIdx > -1 ? vData[i][refCodeIdx] : '';
        const clienteId = vData[i][clienteIdIdx];

        if (refCode && String(refCode).trim() !== '') {
          const cData = C.getDataRange().getValues();
          const cHeaders = cData[0].map(h => String(h).trim());
          const cIdIdx = cHeaders.indexOf('ID_Cliente');
          const cCodeIdx = cHeaders.indexOf('Codigo_Convite');
          const cPtsIdx = cHeaders.indexOf('Pontos_Fidelidade');

          // Award 50 points to referrer (who shared the code)
          for (let k = 1; k < cData.length; k++) {
            if (String(cData[k][cCodeIdx]).trim() === String(refCode).trim()) {
              const currentPts = Number(cData[k][cPtsIdx] || 0);
              C.getRange(k + 1, cPtsIdx + 1).setValue(currentPts + 50);
              break;
            }
          }

          // Award 50 points to referee (who used the code)
          if (clienteId && String(clienteId) !== 'GUEST') {
            for (let k = 1; k < cData.length; k++) {
              if (String(cData[k][cIdIdx]) === String(clienteId)) {
                const currentPts = Number(cData[k][cPtsIdx] || 0);
                C.getRange(k + 1, cPtsIdx + 1).setValue(currentPts + 50);
                break;
              }
            }
          }
        }
      }

      return { success: true };
    }
  }
  return { success: false };
}

// --- HELPERS ---
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