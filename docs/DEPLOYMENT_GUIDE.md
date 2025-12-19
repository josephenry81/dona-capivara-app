# 🚀 Guia de Implantação - Cinema Promotion System V17.0

## Status Atual

✅ **Frontend:** Código implementado e funcionando
❌ **Backend:** Precisa ser implantado no Google Apps Script

## Problema Identificado

O frontend está chamando a nova API `getMinhasChances`, mas o backend atual não tem essa função. Você precisa implantar o código V17.0 no Google Apps Script.

---

## Passo 1: Implantar Backend V17.0

### 1.1 Abrir Google Apps Script

1. Acesse: https://script.google.com
2. Abra o projeto vinculado à sua planilha Dona Capivara

### 1.2 Atualizar Code.gs

**IMPORTANTE:** Faça um backup do código atual antes!

1. Abra o arquivo `Code.gs`
2. Substitua TODO O CONTEÚDO pelo arquivo que você compartilhou (V17.0)
3. Salve (Ctrl+S ou Cmd+S)

### 1.3 Adicionar PromocaoHelper.gs

1. Clique em `+` (Adicionar arquivo)
2. Selecione "Script"
3. Nomeie como `PromocaoHelper`
4. Cole o conteúdo de: [PromocaoHelper.gs](file:///c:/Users/HENRI/Desktop/dona-capivara-app-main/dona-capivara-app/backend/PromocaoHelper.gs)
5. Salve

### 1.4 Fazer Deploy

1. No Google Apps Script, clique em **"Implantar"** > **"Nova implantação"**
2. Tipo: **"Aplicativo da Web"**
3. Configurações:
   - **Executar como:** Eu (seu email)
   - **Quem tem acesso:** Qualquer pessoa
4. Clique em **"Implantar"**
5. **COPIE A URL GERADA** (ela será diferente da atual)

---

## Passo 2: Configurar Google Sheets

### 2.1 Criar Sheet SORTEIOS

1. Abra sua planilha Dona Capivara
2. Crie uma nova aba chamada **SORTEIOS**
3. Adicione os seguintes cabeçalhos na linha 1:

| A | B | C | D | E | F | G | H | I | J | K | L | M |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `ID_Sorteio` | `ID_Cliente` | `Nome_Cliente` | `Telefone_Cliente` | `Numero_Sorte` | `ID_Promo` | `Data_Ganho` | `Status_Sorteio` | `Ganhou` | `Numero_Sorteado` | `Tipo_Premio` | `Valor_Premio` | `Codigo_Cupom` |

### 2.2 Atualizar Sheet CLIENTES

1. Abra a aba **CLIENTES**
2. Adicione uma nova coluna (sugestão: Coluna O)
3. Cabeçalho: `Gasto_Acumulado_Promo`
4. Preencha todas as células de clientes existentes com `0`

### 2.3 (Opcional) Validação de Dados

**Para Sheet SORTEIOS:**
- Coluna H (Status_Sorteio): Lista → `Ativo`, `Premiado`, `Cancelado`
- Coluna I (Ganhou): Checkbox
- Coluna K (Tipo_Premio): Lista → `Cinema`, `Cupom`, `Pontos`, `Produto`

---

## Passo 3: Atualizar URL no Frontend

1. Abra o arquivo `.env.local` no seu projeto
2. Atualize com a **NOVA URL** do deploy (do Passo 1.4):

```env
NEXT_PUBLIC_GOOGLE_SHEET_API_URL=https://script.google.com/macros/s/SEU_NOVO_ID_AQUI/exec
```

3. Salve o arquivo
4. **Reinicie o servidor dev** (Ctrl+C e depois `npm run dev` novamente)

---

## Passo 4: Testar o Sistema

### 4.1 Teste Básico

1. Abra http://localhost:3000
2. Faça login com uma conta de cliente
3. Vá para **Perfil**
4. Verifique se aparece a seção **"Promoção Cinema"** 🎬

### 4.2 Console de Debug

Abra o console do navegador (F12) e procure por:
```
🎬 [ProfileView] User ID: CLI-XXXXX
🎬 [ProfileView] API Response: {success: true, numeros: [], ...}
```

Se ver `{error: 'Ação inválida'}` → Backend ainda não está atualizado

### 4.3 Teste de Compra

1. Faça um pedido de **R$ 20,00** (para testar o limite de R$18)
2. Após o pedido, recarregue a página de Perfil
3. Verifique se:
   - Gasto acumulado = R$ 20,00
   - Você ganhou 1 número da sorte
   - O número aparece na grade

---

## Verificações de Segurança

### ✅ Checklist Antes de Deploy

- [ ] Backup do código atual do Google Apps Script
- [ ] Backup da planilha (File > Make a copy)
- [ ] Senha de admin correta em `ADMIN_PASS`
- [ ] URL da planilha correta no script
- [ ] Permissões configuradas corretamente

---

## Troubleshooting

### Erro: "Ação inválida"
**Causa:** Backend V17 não está implantado
**Solução:** Refazer Passo 1 (Deploy)

### Seção não aparece no Perfil
**Causas possíveis:**
1. URL do .env.local incorreta → Verificar Passo 3
2. User ID não está correto → Ver console: `🎬 [ProfileView] User ID`
3. Sheet SORTEIOS não existe → Criar conforme Passo 2.1

### Números não são gerados após compra
**Causas:**
1. Coluna `Gasto_Acumulado_Promo` não existe em CLIENTES
2. Função `atualizarGastoPromoClienteComRegistroSorteio` não foi adicionada
3. Integração no `createOrder` não está ativa

---

## Próximos Passos (Após Implantação)

1. ✅ Testar geração de números com compras reais
2. ✅ Testar admin: realizar sorteio
3. ✅ Testar admin: conceder prêmio
4. ⏭️  Adicionar admin dashboard (opcional)
5. ⏭️  Adicionar banner no carrinho (opcional)

---

## Suporte

Se precisar de ajuda:
1. Verifique os logs do Google Apps Script (Ver > Logs)\n2. Verifique o console do navegador (F12)
3. Confira a documentação completa: [GOOGLE_SHEETS_SETUP.md](file:///c:/Users/HENRI/Desktop/dona-capivara-app-main/dona-capivara-app/backend/GOOGLE_SHEETS_SETUP.md)

---

**Tempo estimado de implantação:** 15-20 minutos
