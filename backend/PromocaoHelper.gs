// ======================================================
// PROMOCAO HELPER - SISTEMA DE SORTEIOS CONFIGURÁVEL
// ======================================================

/**
 * Obtém a configuração ativa da promoção
 * 
 * @returns {object} Configuração da promoção ativa
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

/**
 * Atualiza o gasto acumulado do cliente e registra número da sorte
 * quando atingir o limite de R$ 18.00
 * 
 * @param {string} customerId - ID do cliente
 * @param {number} valorCompra - Valor da compra atual
 * @returns {object} Informações sobre números da sorte ganhos
 */
function atualizarGastoPromoClienteComRegistroSorteio(customerId, valorCompra) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const clientesSheet = ss.getSheetByName('CLIENTES');
  const sorteiosSheet = ss.getSheetByName('SORTEIOS');
  
  if (!clientesSheet || !sorteiosSheet) {
    Logger.log('⚠️ Sheets necessárias não encontradas');
    return { success: false, numerosGanhos: [] };
  }
  
  const clientes = sheetToJSON(clientesSheet);
  const cliente = clientes.find(c => 
    String(c.ID_Cliente).trim() === String(customerId).trim()
  );
  
  if (!cliente) {
    Logger.log('⚠️ Cliente não encontrado: ' + customerId);
    return { success: false, numerosGanhos: [] };
  }
  
  // Pega gasto atual acumulado
  const gastoAtual = Number(cliente.Gasto_Acumulado_Promo || 0);
  const novoGasto = gastoAtual + valorCompra;
  
  // Pega configuração da promoção para obter o valor da meta
  const promoConfig = getPromoConfig();
  const META_POR_NUMERO = promoConfig.valorMeta;
  
  // Calcula quantos números da sorte o cliente ganhou
  const numerosGanhos = Math.floor(novoGasto / META_POR_NUMERO);
  const numerosAnteriores = Math.floor(gastoAtual / META_POR_NUMERO);
  const novosNumeros = numerosGanhos - numerosAnteriores;
  
  // Atualiza gasto acumulado no cliente
  const clienteData = clientesSheet.getDataRange().getValues();
  const headers = clienteData[0];
  const idIdx = headers.indexOf('ID_Cliente');
  const gastoIdx = headers.indexOf('Gasto_Acumulado_Promo');
  
  if (idIdx === -1 || gastoIdx === -1) {
    Logger.log('⚠️ Colunas necessárias não encontradas');
    return { success: false, numerosGanhos: [] };
  }
  
  for (let i = 1; i < clienteData.length; i++) {
    if (String(clienteData[i][idIdx]).trim() === String(customerId).trim()) {
      clientesSheet.getRange(i + 1, gastoIdx + 1).setValue(novoGasto);
      break;
    }
  }
  
  // Registra novos números da sorte
  const numerosRegistrados = [];
  const promoId = promoConfig.id; // ID da promoção atual (dinâmico)
  
  for (let i = 0; i < novosNumeros; i++) {
    const numeroSorte = gerarNumeroSorte(promoId);
    const idSorteio = Utilities.getUuid();
    
    sorteiosSheet.appendRow([
      idSorteio,
      customerId,
      cliente.Nome || 'Cliente',
      cliente.Telefone || '',
      numeroSorte,
      promoId,
      new Date(),
      'Ativo',
      false, // Ganhou
      '', // Numero_Sorteado
      '', // Tipo_Premio
      '', // Valor_Premio
      ''  // Codigo_Cupom
    ]);
    
    numerosRegistrados.push(numeroSorte);
  }
  
  if (numerosRegistrados.length > 0) {
    Logger.log(`✅ Cliente ${customerId} ganhou ${numerosRegistrados.length} número(s): ${numerosRegistrados.join(', ')}`);
  }
  
  return {
    success: true,
    numerosGanhos: numerosRegistrados,
    gastoTotal: novoGasto,
    proximoNumeroEm: META_POR_NUMERO - (novoGasto % META_POR_NUMERO)
  };
}

/**
 * Gera um código único de 5 caracteres alfanuméricos para o sorteio
 * Formato: Mistura de letras e números, sem repetições, sem sequências
 * 
 * @param {string} promoId - ID da promoção
 * @returns {string} Código da sorte formatado (ex: "A7K3M")
 */
function gerarNumeroSorte(promoId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sorteiosSheet = ss.getSheetByName('SORTEIOS');
  
  if (!sorteiosSheet) {
    return gerarCodigoAleatorio();
  }
  
  const sorteios = sheetToJSON(sorteiosSheet);
  const numerosExistentes = sorteios
    .filter(s => String(s.ID_Promo).trim() === String(promoId).trim())
    .map(s => String(s.Numero_Sorte));
  
  // Tenta gerar um código único
  let tentativas = 0;
  let codigo;
  
  do {
    codigo = gerarCodigoAleatorio();
    tentativas++;
    
    if (tentativas > 1000) {
      // Fallback: adiciona timestamp no final
      codigo = gerarCodigoAleatorio() + String(Date.now()).slice(-2);
      break;
    }
  } while (numerosExistentes.includes(codigo));
  
  return codigo;
}

/**
 * Gera código aleatório de 5 caracteres (letras + números)
 * Sem repetições e sem sequências previsíveis
 */
function gerarCodigoAleatorio() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Remove I, O, 0, 1 para evitar confusão
  const usados = new Set();
  let codigo = '';
  
  while (codigo.length < 5) {
    const idx = Math.floor(Math.random() * chars.length);
    const char = chars[idx];
    
    if (!usados.has(char)) {
      // Verifica se não forma sequência
      if (codigo.length > 0) {
        const ultimo = codigo[codigo.length - 1];
        const indexUltimo = chars.indexOf(ultimo);
        const indexAtual = chars.indexOf(char);
        
        // Evita sequências consecutivas (diferença de 1)
        if (Math.abs(indexAtual - indexUltimo) === 1) {
          continue;
        }
      }
      
      usados.add(char);
      codigo += char;
    }
  }
  
  return codigo;
}

/**
 * Realiza o sorteio e seleciona um vencedor aleatório
 * 
 * @param {string} promoId - ID da promoção
 * @returns {object} Dados do vencedor ou null
 */
function realizarSorteio(promoId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sorteiosSheet = ss.getSheetByName('SORTEIOS');
  
  if (!sorteiosSheet) {
    Logger.log('⚠️ Sheet SORTEIOS não encontrada');
    return null;
  }
  
  const sorteios = sheetToJSON(sorteiosSheet);
  
  // Filtra apenas números ativos da promoção
  const participantes = sorteios.filter(s => 
    String(s.ID_Promo).trim() === String(promoId).trim() &&
    String(s.Status_Sorteio).toUpperCase() === 'ATIVO' &&
    (s.Ganhou !== true && String(s.Ganhou).toUpperCase() !== 'TRUE')
  );
  
  if (participantes.length === 0) {
    Logger.log('⚠️ Nenhum participante encontrado para a promoção: ' + promoId);
    return null;
  }
  
  // Seleciona vencedor aleatório
  const indiceVencedor = Math.floor(Math.random() * participantes.length);
  const vencedor = participantes[indiceVencedor];
  
  // Atualiza o registro do vencedor
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

/**
 * Concede o prêmio ao vencedor do sorteio
 * 
 * @param {string} sorteioId - ID do registro do sorteio
 * @param {string} tipoPremio - "Cinema", "Cupom", "Produto"
 * @param {number} valorPremio - Valor do prêmio (se aplicável)
 * @param {string} codigoCupom - Código do cupom (se aplicável)
 * @returns {boolean} Sucesso da operação
 */
function concederPremioAoVencedor(sorteioId, tipoPremio, valorPremio, codigoCupom) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sorteiosSheet = ss.getSheetByName('SORTEIOS');
  const clientesSheet = ss.getSheetByName('CLIENTES');
  
  if (!sorteiosSheet) {
    Logger.log('⚠️ Sheet SORTEIOS não encontrada');
    return false;
  }
  
  const sorteioData = sorteiosSheet.getDataRange().getValues();
  const headers = sorteioData[0];
  const idIdx = headers.indexOf('ID_Sorteio');
  const tipoIdx = headers.indexOf('Tipo_Premio');
  const valorIdx = headers.indexOf('Valor_Premio');
  const codigoIdx = headers.indexOf('Codigo_Cupom');
  const statusIdx = headers.indexOf('Status_Sorteio');
  const clienteIdIdx = headers.indexOf('ID_Cliente');
  
  if (idIdx === -1) {
    Logger.log('⚠️ Coluna ID_Sorteio não encontrada');
    return false;
  }
  
  let clienteId = null;
  
  // Atualiza o registro do sorteio com informações do prêmio
  for (let i = 1; i < sorteioData.length; i++) {
    if (String(sorteioData[i][idIdx]) === String(sorteioId)) {
      
      if (tipoIdx !== -1) {
        sorteiosSheet.getRange(i + 1, tipoIdx + 1).setValue(tipoPremio);
      }
      
      if (valorIdx !== -1 && valorPremio) {
        sorteiosSheet.getRange(i + 1, valorIdx + 1).setValue(Number(valorPremio));
      }
      
      if (codigoIdx !== -1 && codigoCupom) {
        sorteiosSheet.getRange(i + 1, codigoIdx + 1).setValue(codigoCupom);
      }
      
      if (statusIdx !== -1) {
        sorteiosSheet.getRange(i + 1, statusIdx + 1).setValue('Premiado');
      }
      
      if (clienteIdIdx !== -1) {
        clienteId = sorteioData[i][clienteIdIdx];
      }
      
      break;
    }
  }
  
  // Se o prêmio for pontos de fidelidade, adiciona ao cliente
  if (tipoPremio === 'Pontos' && valorPremio && clienteId && clientesSheet) {
    const clienteData = clientesSheet.getDataRange().getValues();
    const clienteHeaders = clienteData[0];
    const cIdIdx = clienteHeaders.indexOf('ID_Cliente');
    const pontosIdx = clienteHeaders.indexOf('Pontos_Fidelidade');
    
    if (cIdIdx !== -1 && pontosIdx !== -1) {
      for (let i = 1; i < clienteData.length; i++) {
        if (String(clienteData[i][cIdIdx]).trim() === String(clienteId).trim()) {
          const pontosAtuais = Number(clienteData[i][pontosIdx] || 0);
          clientesSheet.getRange(i + 1, pontosIdx + 1).setValue(pontosAtuais + Number(valorPremio));
          Logger.log(`✅ ${valorPremio} pontos creditados ao cliente ${clienteId}`);
          break;
        }
      }
    }
  }
  
  Logger.log(`🎁 Prêmio concedido: ${tipoPremio} - Sorteio ID: ${sorteioId}`);
  
  return true;
}

/**
 * Reseta o gasto acumulado de um cliente (uso administrativo)
 * 
 * @param {string} customerId - ID do cliente
 * @returns {boolean} Sucesso da operação
 */
function resetarGastoCliente(customerId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const clientesSheet = ss.getSheetByName('CLIENTES');
  
  if (!clientesSheet) {
    return false;
  }
  
  const clienteData = clientesSheet.getDataRange().getValues();
  const headers = clienteData[0];
  const idIdx = headers.indexOf('ID_Cliente');
  const gastoIdx = headers.indexOf('Gasto_Acumulado_Promo');
  
  if (idIdx === -1 || gastoIdx === -1) {
    return false;
  }
  
  for (let i = 1; i < clienteData.length; i++) {
    if (String(clienteData[i][idIdx]).trim() === String(customerId).trim()) {
      clientesSheet.getRange(i + 1, gastoIdx + 1).setValue(0);
      Logger.log(`✅ Gasto resetado para cliente ${customerId}`);
      return true;
    }
  }
  
  return false;
}
