// ======================================================
// ATUALIZAÇ\u00c3O PARA Code.js - Fun\u00e7\u00e3o getMinhasChances com Config
// ======================================================

/**
 * Substitua a fun\u00e7\u00e3o getMinhasChances existente no seu Code.js por esta vers\u00e3o:
 */

function getMinhasChances(customerId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sorteiosSheet = ss.getSheetByName('SORTEIOS');
  const clientesSheet = ss.getSheetByName('CLIENTES');
  
  // Obt\u00e9m configura\u00e7\u00e3o da promo\u00e7\u00e3o ativa
  const promoConfig = getPromoConfig();
  
  if (!sorteiosSheet || !customerId || customerId === 'GUEST') {
    return { 
      success: true, 
      numeros: [],
      gastoAtual: 0,
      metaAtual: promoConfig.valorMeta,
      faltam: promoConfig.valorMeta,
      // Configura\u00e7\u00e3o da promo\u00e7\u00e3o (NOVO)
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
    // Configura\u00e7\u00e3o da promo\u00e7\u00e3o (NOVO)
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
