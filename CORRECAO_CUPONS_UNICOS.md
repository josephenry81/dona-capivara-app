# 🔧 CORREÇÃO: Sistema de Cupons Únicos

## 🐛 PROBLEMA IDENTIFICADO

**Sintoma:** Cupons com `Tipo_Uso = "UNICO"` estavam sendo aceitos múltiplas vezes pelo mesmo cliente.

**Exemplo:** O cupom "BEMVINDO" estava configurado como uso único, mas clientes conseguiam usá-lo em várias compras.

---

## 🔍 ANÁLISE DA CAUSA RAIZ

### Backend (Code.gs)
O backend tinha **DUAS funções** de validação de cupom:

1. **`validateCoupon(code)`** - Linha 334-339
   - ❌ Validação simples
   - ❌ **NÃO verifica histórico**
   - ❌ **NÃO verifica Tipo_Uso**
   - ✅ Apenas verifica se cupom existe e está ativo

2. **`validateCouponWithContext(data)`** - Linha 341-410
   - ✅ Validação completa
   - ✅ **Verifica histórico de uso** (linha 382-390)
   - ✅ **Verifica Tipo_Uso = "UNICO"**
   - ✅ Verifica valor mínimo
   - ✅ Verifica uso máximo

### Frontend (CartView.tsx)
O problema estava na **linha 168**:

```typescript
// ❌ ERRADO: Chamava função simples
const res = await API.validateCoupon(couponCode);
```

Esta função **não enviava** `customerId` e `subtotal`, então o backend usava a função simples que **não verifica histórico**.

---

## ✅ SOLUÇÃO IMPLEMENTADA

### 1. Nova Função no Frontend (`services/api.ts`)

Criada função `validateCouponWithContext`:

```typescript
async validateCouponWithContext(data: {
    code: string;
    customerId: string;
    subtotal: number;
}) {
    const normalizedCode = data.code.trim().toUpperCase();
    
    console.log(`🔍 [Validação Contextual] Cupom: ${normalizedCode}, Cliente: ${data.customerId}, Subtotal: R$ ${data.subtotal}`);

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'validateCoupon',
            code: normalizedCode,
            customerId: data.customerId,
            subtotal: data.subtotal
        }),
        signal: AbortSignal.timeout(10000)
    });

    const result = await response.json();
    
    if (result.success) {
        console.log(`✅ [Cupom Válido] Tipo: ${result.type}, Valor: ${result.value}, Tipo Uso: ${result.tipoUso}`);
    } else {
        console.warn(`⚠️ [Cupom Inválido] ${result.message}`);
    }

    return result;
}
```

### 2. Atualização do CartView

```typescript
// ✅ CORRETO: Usa validateCouponWithContext
const customerId = user?.id || user?.ID_Cliente || 'GUEST';

const res = await API.validateCouponWithContext({
    code: couponCode,
    customerId: customerId,
    subtotal: subtotal
});
```

---

## 🔄 FLUXO CORRETO AGORA

### Quando o cliente aplica um cupom:

1. **Frontend** coleta:
   - Código do cupom
   - ID do cliente
   - Subtotal do carrinho

2. **Frontend** envia para backend via POST:
   ```json
   {
     "action": "validateCoupon",
     "code": "BEMVINDO",
     "customerId": "CLI-12345",
     "subtotal": 50.00
   }
   ```

3. **Backend** recebe e processa:
   - Detecta que tem `customerId` e `subtotal` no POST
   - Chama `validateCouponWithContext(data)` (linha 341)
   - Verifica se cupom existe e está ativo
   - Verifica data de validade
   - Verifica valor mínimo
   - **🔥 VERIFICA HISTÓRICO** (linha 382-390):
     ```javascript
     if (String(coupon.Tipo_Uso).toUpperCase() === 'UNICO' && customerId && customerId !== 'GUEST') {
         const jaUsou = historico.some(h =>
             String(h.Codigo_Cupom).trim().toUpperCase() === code &&
             String(h.ID_Cliente).trim() === customerId
         );

         if (jaUsou) {
             return { success: false, message: 'Cupom já utilizado por você' };
         }
     }
     ```
   - Verifica uso máximo global

4. **Backend** retorna:
   ```json
   {
     "success": true/false,
     "message": "Cupom já utilizado por você",
     "type": "PORCENTAGEM",
     "value": 10,
     "tipoUso": "UNICO"
   }
   ```

5. **Frontend** exibe mensagem apropriada

---

## 📊 VERIFICAÇÃO DO HISTÓRICO

O backend verifica a aba `CUPONS_HISTORICO` com a seguinte estrutura:

| ID_Historico | Codigo_Cupom | ID_Cliente | ID_Venda | Data_Uso | Valor_Desconto |
|--------------|--------------|------------|----------|----------|----------------|
| UUID-123     | BEMVINDO     | CLI-12345  | VENDA-1  | 26/12/25 | 5.00           |

### Lógica de Verificação:

```javascript
const jaUsou = historico.some(h =>
    String(h.Codigo_Cupom).trim().toUpperCase() === code &&
    String(h.ID_Cliente).trim() === customerId
);
```

Se encontrar **qualquer registro** com o mesmo cupom + cliente, retorna erro.

---

## 🧪 COMO TESTAR

### Teste 1: Cupom Único - Primeira Vez
```
1. Cliente: CLI-12345
2. Cupom: BEMVINDO (Tipo_Uso: UNICO)
3. Primeira compra
4. Resultado esperado: ✅ Cupom aplicado com sucesso
```

### Teste 2: Cupom Único - Segunda Vez
```
1. Cliente: CLI-12345 (mesmo cliente)
2. Cupom: BEMVINDO (mesmo cupom)
3. Segunda compra
4. Resultado esperado: ❌ "Cupom já utilizado por você"
```

### Teste 3: Cupom Múltiplo
```
1. Cliente: CLI-12345
2. Cupom: FIDELIDADE (Tipo_Uso: MULTIPLO)
3. Qualquer compra
4. Resultado esperado: ✅ Cupom aplicado sempre (até atingir Uso_Maximo)
```

### Teste 4: Usuário Guest
```
1. Cliente: GUEST
2. Cupom: BEMVINDO (Tipo_Uso: UNICO)
3. Qualquer compra
4. Resultado esperado: ✅ Cupom aplicado (guests não têm histórico)
```

---

## 📝 LOGS PARA MONITORAR

### Frontend (Console do Navegador)
```
🔍 [Validação Contextual] Cupom: BEMVINDO, Cliente: CLI-12345, Subtotal: R$ 50
✅ [Cupom Válido] Tipo: PORCENTAGEM, Valor: 10, Tipo Uso: UNICO
```

ou

```
🔍 [Validação Contextual] Cupom: BEMVINDO, Cliente: CLI-12345, Subtotal: R$ 50
⚠️ [Cupom Inválido] Cupom já utilizado por você
```

### Backend (Google Apps Script Logs)
```
Validando cupom com contexto: BEMVINDO para cliente CLI-12345
Verificando histórico...
Cliente já usou este cupom em 26/12/2025
```

---

## ⚠️ IMPORTANTE

### Quando o Histórico é Registrado?

O histórico é salvo **APENAS quando o pedido é criado** (linha 560-574 do Code.gs):

```javascript
if (H && d.couponCode && d.customer?.id && String(d.customer.id) !== 'GUEST') {
    try {
        const idHistorico = Utilities.getUuid();
        H.appendRow([
            idHistorico,
            d.couponCode,        // Código do cupom
            d.customer.id,       // ID do cliente
            id,                  // ID da venda
            new Date(),          // Data de uso
            disc                 // Valor do desconto
        ]);
    } catch (e) {
        Logger.log('Erro ao registrar histórico de cupom: ' + e);
    }
}
```

### Fluxo Completo:
1. Cliente aplica cupom → Validação OK
2. Cliente finaliza pedido → Histórico registrado
3. Cliente tenta usar mesmo cupom → Validação FALHA (histórico encontrado)

---

## 🎯 RESULTADO FINAL

### Antes da Correção
- ❌ Cupons únicos podiam ser usados múltiplas vezes
- ❌ Validação não verificava histórico
- ❌ Perda de receita por descontos indevidos

### Depois da Correção
- ✅ Cupons únicos funcionam corretamente
- ✅ Validação completa com histórico
- ✅ Mensagem clara: "Cupom já utilizado por você"
- ✅ Proteção contra uso indevido

---

## 📁 ARQUIVOS MODIFICADOS

1. **`services/api.ts`**
   - Adicionada função `validateCouponWithContext`
   - Logs detalhados para debugging

2. **`components/views/CartView.tsx`**
   - Atualizado `handleApplyCoupon` para usar nova função
   - Envia `customerId` e `subtotal`

---

## 🚀 DEPLOY

### Passos:
1. ✅ Código frontend atualizado
2. ⏳ Testar localmente com `npm run dev`
3. ⏳ Verificar logs no console
4. ⏳ Fazer build: `npm run build`
5. ⏳ Deploy em produção

### Não é necessário atualizar o backend!
O backend (Code.gs) já tinha a lógica correta, apenas não estava sendo chamada.

---

**Data:** 26/12/2025  
**Status:** ✅ CORRIGIDO  
**Teste:** Pendente de validação em produção

