// ======================================================
// PROMO HELPER - SISTEMA DE SORTEIOS
// ======================================================

/**
 * Obt the active promotion configuration
 */
function getPromoConfig() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = ss.getSheetByName('CONFIGURACAO_PROMO');
  
  if (!configSheet) {
    return {
      id: 'PROMO_DEFAULT',
      nome: 'Promoção Cinema',
      icone: '🎬',
      descricao: 'Ganhe ingressos comprando!',
      valorMeta: 18,
      ativa: true
    };
  }
  
  const configs = sheetToJSON(configSheet);
  const promoAtiva = configs.find(c => String(c.Promocao_Ativa).toUpperCase() === 'TRUE');
  
  if (!promoAtiva) {
    return {
      id: 'PROMO_DEFAULT',
      nome: 'Promoção',
      icone: '🎁',
      valorMeta: 18,
      ativa: false
    };
  }
  
  return {
    id: promoAtiva.ID_Config || 'PROMO_DEFAULT',
    nome: promoAtiva.Nome_Promocao || 'Promoção',
    icone: promoAtiva.Icone || '🎁',
    descricao: promoAtiva.Descricao_Curta || '',
    valorMeta: Number(promoAtiva.Valor_Meta || 18),
    ativa: true
  };
}

/**
 * Updates customer accumulated spending and registers raffle number
 * when reaching R$ 18.00 threshold
 */
function atualizarGastoPromoClienteComRegistroSorteio(customerId, valorCompra) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const clientesSheet = ss.getSheetByName('CLIENTES');
  const sorteiosSheet = ss.getSheetByName('SORTEIOS');
  
  if (!clientesSheet || !sorteiosSheet) return { success: false, numerosGanhos: [] };

  const clientes = sheetToJSON(clientesSheet);
  const cliente = clientes.find(c => String(c.ID_Cliente).trim() === String(customerId).trim());
  if (!cliente) return { success: false, numerosGanhos: [] };

  const gastoAtual = Number(cliente.Gasto_Acumulado_Promo || 0);
  const novoGasto = gastoAtual + valorCompra;
  const promoConfig = getPromoConfig();
  const META_POR_NUMERO = promoConfig.valorMeta;

  const numerosGanhos = Math.floor(novoGasto / META_POR_NUMERO);
  const numerosAnteriores = Math.floor(gastoAtual / META_POR_NUMERO);
  const novosNumeros = numerosGanhos - numerosAnteriores;

  const clienteData = clientesSheet.getDataRange().getValues();
  const headers = clienteData[0];
  const idIdx = headers.indexOf('ID_Cliente');
  const gastoIdx = headers.indexOf('Gasto_Acumulado_Promo');
  if (idIdx === -1 || gastoIdx === -1) return { success: false, numerosGanhos: [] };

  for (let i = 1; i < clienteData.length; i++) {
    if (String(clienteData[i][idIdx]).trim() === String(customerId).trim()) {
      clientesSheet.getRange(i + 1, gastoIdx + 1).setValue(novoGasto);
      break;
    }
  }

  const numerosRegistrados = [];
  const promoId = promoConfig.id;

  for (let i = 0; i < novosNumeros; i++) {
    const numeroSorte = gerarNumeroSorte(promoId);
    const idSorteio = Utilities.getUuid();
    sorteiosSheet.appendRow([
      idSorteio,
      promoId,
      customerId,
      cliente.Nome || 'Cliente',
      numeroSorte,
      '',
      cliente.Email || '',
      cliente.Telefone || '',
      'Ativo',
      new Date(),
      '',
      false,
      '',
      '',
      ''
    ]);
    numerosRegistrados.push(numeroSorte);
  }

  return { success: true, numerosGanhos: numerosRegistrados, gastoTotal: novoGasto };
}

/**
 * Generates unique 5-character raffle number
 */
function gerarNumeroSorte(promoId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sorteiosSheet = ss.getSheetByName('SORTEIOS');
  if (!sorteiosSheet) return gerarCodigoAleatorio();

  const sorteios = sheetToJSON(sorteiosSheet);
  const numerosExistentes = sorteios
    .filter(s => String(s.ID_Promo).trim() === String(promoId).trim())
    .map(s => String(s.Numero_Sorte));

  let tentativas = 0;
  let codigo;
  do {
    codigo = gerarCodigoAleatorio();
    tentativas++;
    if (tentativas > 1000) {
      codigo = gerarCodigoAleatorio() + String(Date.now()).slice(-2);
      break;
    }
  } while (numerosExistentes.includes(codigo));

  return codigo;
}

/**
 * Generates random 5-character code (letters + numbers)
 */
function gerarCodigoAleatorio() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const usados = new Set();
  let codigo = '';
  while (codigo.length < 5) {
    const idx = Math.floor(Math.random() * chars.length);
    const char = chars[idx];
    if (!usados.has(char)) {
      if (codigo.length > 0) {
        const ultimo = codigo[codigo.length - 1];
        const indexUltimo = chars.indexOf(ultimo);
        const indexAtual = chars.indexOf(char);
        if (Math.abs(indexAtual - indexUltimo) === 1) continue;
      }
      usados.add(char);
      codigo += char;
    }
  }
  return codigo;
}

/**
 * ✅ NEW: Gets customer's raffle numbers and promotion progress
 */
function getMinhasChances(customerId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const clientesSheet = ss.getSheetByName('CLIENTES');
  const sorteiosSheet = ss.getSheetByName('SORTEIOS');
  
  if (!clientesSheet || !sorteiosSheet) {
    return {
      success: false,
      message: 'Sistema de promoção não configurado'
    };
  }

  const promoConfig = getPromoConfig();
  
  // If promotion is not active, return early
  if (!promoConfig.ativa) {
    return {
      success: true,
      promocao: promoConfig,
      numeros: [],
      gastoAtual: 0,
      metaAtual: promoConfig.valorMeta,
      faltam: promoConfig.valorMeta
    };
  }

  // Get customer data
  const clientes = sheetToJSON(clientesSheet);
  const cliente = clientes.find(c => String(c.ID_Cliente).trim() === String(customerId).trim());
  
  if (!cliente) {
    return {
      success: false,
      message: 'Cliente não encontrado'
    };
  }

  const gastoAtual = Number(cliente.Gasto_Acumulado_Promo || 0);
  const META_POR_NUMERO = promoConfig.valorMeta;
  const numerosTotais = Math.floor(gastoAtual / META_POR_NUMERO);
  const proximaMeta = (numerosTotais + 1) * META_POR_NUMERO;
  const faltam = proximaMeta - gastoAtual;

  // Get customer's raffle numbers
  const sorteios = sheetToJSON(sorteiosSheet);
  const numeros = sorteios
    .filter(s => 
      String(s.ID_Cliente).trim() === String(customerId).trim() &&
      String(s.ID_Promo).trim() === String(promoConfig.id).trim() &&
      String(s.Status_Sorteio).toUpperCase() === 'ATIVO'
    )
    .map(s => ({
      id: s.ID_Sorteio,
      numero: s.Numero_Sorte,
      data: s.Data_Sorteio
    }))
    .sort((a, b) => new Date(b.data) - new Date(a.data));

  return {
    success: true,
    promocao: promoConfig,
    numeros: numeros,
    gastoAtual: gastoAtual,
    metaAtual: META_POR_NUMERO,
    faltam: Math.max(0, faltam),
    proximoNumero: numerosTotais + 1
  };
}

/**
 * Performs the raffle and selects a random winner
 */
function realizarSorteio(promoId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sorteiosSheet = ss.getSheetByName('SORTEIOS');
  
  if (!sorteiosSheet) {
    Logger.log('⚠️ Sheet SORTEIOS não encontrada');
    return null;
  }
  
  const sorteios = sheetToJSON(sorteiosSheet);
  const participantes = sorteios.filter(s => 
    String(s.ID_Promo).trim() === String(promoId).trim() &&
    String(s.Status_Sorteio).toUpperCase() === 'ATIVO' &&
    (s.Ganhou !== true && String(s.Ganhou).toUpperCase() !== 'TRUE')
  );
  
  if (participantes.length === 0) {
    Logger.log('⚠️ Nenhum participante encontrado para a promoção: ' + promoId);
    return null;
  }
  
  const indiceVencedor = Math.floor(Math.random() * participantes.length);
  const vencedor = participantes[indiceVencedor];
  
  const sorteioData = sorteiosSheet.getDataRange().getValues();
  const headers = sorteioData[0];
  const idIdx = headers.indexOf('ID_Sorteio');
  const ganhouIdx = headers.indexOf('Ganhou');
  const numeroSorteadoIdx = headers.indexOf('Numero_Sorteado');
  
  if (idIdx === -1 || ganhouIdx === -1) {
    Logger.log('⚠️ Colunas necessárias não encontradas');
    return null;
  }
  
  for (let i = 1; i < sorteioData.length; i++) {
    if (String(sorteioData[i][idIdx]) === String(vencedor.ID_Sorteio)) {
      sorteiosSheet.getRange(i + 1, ganhouIdx + 1).setValue(true);
      if (numeroSorteadoIdx !== -1) {
        sorteiosSheet.getRange(i + 1, numeroSorteadoIdx + 1).setValue(new Date());
      }
      break;
    }
  }
  
  Logger.log(`🎉 Vencedor sorteado: ${vencedor.Nome_Cliente} - Número: ${vencedor.Numero_Sorte}`);
  
  return {
    ID_Sorteio: vencedor.ID_Sorteio,
    Nome_Cliente: vencedor.Nome_Cliente,
    Telefone_Cliente: vencedor.Telefone_Cliente,
    Numero_Sorte: vencedor.Numero_Sorte,
    ID_Cliente: vencedor.ID_Cliente
  };
}
