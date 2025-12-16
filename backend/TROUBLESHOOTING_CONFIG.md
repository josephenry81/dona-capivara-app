# 🔧 Correção: Config Não Aparece

## ❌ Problema Identificado

A API está retornando:
```json
{
  success: true,
  numeros: Array(6),
  gastoAtual: 17.5,
  metaAtual: 18,
  faltam: 0.5
  // ❌ FALTANDO: config object
}
```

**Esperado:**
```json
{
  success: true,
  numeros: [...],
  gastoAtual: 17.5,
  metaAtual: 18,
  faltam: 0.5,
  config: {  // ✅ ESTE OBJETO ESTÁ FALTANDO!
    nome: "Promoção Cinema",
    icone: "🎬",
    descricao: "...",
    mensagemProgresso: "...",
    mensagemSemNumeros: "...",
    ativa: true
  }
}
```

---

## 🎯 Causa Raiz

A função `getMinhasChances` no backend **NÃO foi atualizada** para retornar o objeto `config`.

---

## ✅ Solução - Atualizar Code.js

### Passo 1: Abrir Google Apps Script

1. Acesse: https://script.google.com
2. Abra o projeto da planilha Dona Capivara
3. Localize o arquivo **Code.js**

### Passo 2: Localizar função getMinhasChances

Procure por `function getMinhasChances` no Code.js

### Passo 3: Substituir por Esta Versão

```javascript
function getMinhasChances(customerId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sorteiosSheet = ss.getSheetByName('SORTEIOS');
  const clientesSheet = ss.getSheetByName('CLIENTES');
  
  // Obtém configuração da promoção ativa
  const promoConfig = getPromoConfig();
  
  if (!sorteiosSheet || !customerId || customerId === 'GUEST') {
    return { 
      success: true, 
      numeros: [],
      gastoAtual: 0,
      metaAtual: promoConfig.valorMeta,
      faltam: promoConfig.valorMeta,
      // Configuração da promoção (NOVO)
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
    // Configuração da promoção (NOVO)
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
```

### Passo 4: Verificar se getPromoConfig Existe

Se você NÃO tem a função `getPromoConfig` no Code.js ou PromocaoHelper.gs, adicione-a:

```javascript
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
```

### Passo 5: Fazer Deploy

1. No Google Apps Script: **Implantar** > **Nova implantação**
2. Tipo: **Aplicativo da Web**
3. Clique em **Implantar**
4. **COPIE A NOVA URL** e atualize no `.env.local`

---

## 🧪 Como Testar Depois da Correção

1. Após fazer deploy do backend atualizado
2. Atualizar URL no `.env.local` (se mudou)
3. Recarregar http://localhost:3000
4. Abrir console (F12)
5. Ver Profile
6. Log deve mostrar:
```
🎬 [ProfileView] API Response: {
  success: true,
  numeros: [...],
  config: {  // ✅ AGORA DEVE APARECER!
    nome: "...",
    icone: "...",
    ...
  }
}
```

---

## ✅ Checklist Rápido

- [ ] Abrir Google Apps Script
- [ ] Localizar `getMinhasChances` no Code.js
- [ ] Substituir pela versão que retorna `config`
- [ ] Verificar se `getPromoConfig` existe (se não, adicionar)
- [ ] Fazer deploy (Nova implantação)
- [ ] Atualizar URL no `.env.local` se mudou
- [ ] Testar no navegador

---

## 📸 Como Ficará

**Antes (Atual):**
```
// API Response sem config
{success: true, numeros: [...], gastoAtual: 17.5, ...}
// Promoção NÃO aparece no perfil
```

**Depois (Correto):**
```
// API Response COM config
{success: true, numeros: [...], config: {...}}
// Promoção APARECE no perfil com nome/ícone dinâmicos!
```

---

**Tempo estimado:** 5 minutos para corrigir
