# 🎟️ Resumo: Localização das Funções de Cupom

## 📂 Estrutura do Projeto

```
dona-capivara-app/
├── components/views/CartView.tsx    # Interface do cupom (frontend)
├── services/api.ts                  # Chamadas API de cupom (frontend)
└── [Backend] Code.gs                # Validação do cupom (Google Apps Script)
```

---

## 1️⃣ Frontend: Interface do Usuário

### `components/views/CartView.tsx`
- **O que faz:** Tela do carrinho onde o cliente digita o código do cupom
- **Componentes:**
  - Campo de input para digitar o cupom
  - Botão de aplicar
  - Mensagem de feedback (sucesso/erro)
  - Exibição do desconto aplicado

---

## 2️⃣ Frontend: Serviço de API

### `services/api.ts` (linhas ~310-440)

| Função | Descrição |
|--------|-----------|
| `validateCoupon(code)` | Validação simples com cache (só verifica se existe) |
| `validateCouponWithContext({code, customerId, subtotal})` | Validação completa (verifica uso único + cliente + valor mínimo) |
| `prefetchCoupon(code)` | Pré-carrega validação em background |
| `clearCouponCache(code?)` | Limpa cache de cupons |

**Cache:**
- `_couponsCache` - Map para armazenar validações
- `_couponCacheTTL` - TTL de 5 minutos

---

## 3️⃣ Backend: Google Apps Script

### `Code.gs` (deploy como Web App)

**Endpoint:** `POST ?action=validateCoupon`

**Funções no backend:**
| Função | Descrição |
|--------|-----------|
| `validateCoupon(code)` | Verifica se cupom existe na planilha CUPONS |
| `validateCouponWithContext(data)` | Validação completa com verificação de uso único |

**Planilhas utilizadas:**
| Planilha | Uso |
|----------|-----|
| `CUPONS` | Lista de cupons ativos (código, tipo, valor, Tipo_Uso) |
| `CUPONS_HISTORICO` | Registro de uso (cliente + cupom + data) |

---

## 4️⃣ Fluxo de Validação

```
Cliente digita cupom (CartView.tsx)
        ↓
Chama API.validateCouponWithContext() (api.ts)
        ↓
POST para Google Apps Script (Code.gs)
        ↓
Backend verifica:
  1. Cupom existe na planilha CUPONS?
  2. Cupom está ativo?
  3. Se Tipo_Uso = "UNICO", cliente já usou? (consulta CUPONS_HISTORICO)
  4. Subtotal atinge valor mínimo?
        ↓
Retorna: { success, type, value, message }
        ↓
Frontend exibe resultado e aplica desconto
```

---

## 5️⃣ Tipos de Cupom

| Tipo | Descrição | Exemplo |
|------|-----------|---------|
| `PORCENTAGEM` | Desconto em % | 10% off |
| `VALOR_FIXO` | Desconto em R$ | R$ 5,00 off |

| Tipo_Uso | Descrição |
|----------|-----------|
| `UNICO` | Pode ser usado apenas 1 vez por cliente |
| `MULTIPLO` | Pode ser usado várias vezes |

---

## 📋 Arquivos de Documentação Existentes

- `CORRECAO_CUPONS_UNICOS.md` - Correção do bug de cupons únicos
- `CORRECAO_ERRO_CUPOM.md` - Correção de erros de validação
