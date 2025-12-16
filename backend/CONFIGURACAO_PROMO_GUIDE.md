# Sistema de Promoção Configurável - Guia de Configuração

## 📋 Nova Sheet: CONFIGURACAO_PROMO

### Estrutura da Planilha

Crie uma nova aba chamada **CONFIGURACAO_PROMO** com os seguintes cabeçalhos:

| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| `ID_Config` | `Promocao_Ativa` | `Nome_Promocao` | `Icone` | `Descricao_Curta` | `Valor_Meta` | `Mensagem_Progresso` | `Mensagem_Sem_Numeros` |

### Exemplo de Configuração

| ID_Config | Promocao_Ativa | Nome_Promocao | Icone | Descricao_Curta | Valor_Meta | Mensagem_Progresso | Mensagem_Sem_Numeros |
|-----------|----------------|---------------|-------|-----------------|------------|-------------------|---------------------|
| PROMO_001 | TRUE | Promoção Cinema | 🎬 | Ganhe ingressos comprando! | 18 | Faltam para próxima chance | Compre para ganhar sua primeira chance! |

### Campos Explicados

1. **ID_Config** (PROMO_001): Identificador único da configuração
2. **Promocao_Ativa** (TRUE/FALSE): Se TRUE, mostra a promoção no app
3. **Nome_Promocao** (texto): Nome exibido no app (ex: "Promoção Cinema", "Sorteio Netflix", "Concurso Spotify")
4. **Icone** (emoji): Emoji exibido (🎬, 🎁, 🎉, 🎮, etc.)
5. **Descricao_Curta** (texto): Subtítulo da promoção
6. **Valor_Meta** (número): Valor em R$ para ganhar 1 número (ex: 18, 25, 50)
7. **Mensagem_Progresso** (texto): Texto antes do valor faltante
8. **Mensagem_Sem_Numeros** (texto): Frase quando cliente ainda não tem números

---

## 🎯 Exemplos de Uso

### Exemplo 1: Promoção Cinema
```
ID_Config: PROMO_CINEMA_JAN2025
Promocao_Ativa: TRUE
Nome_Promocao: Promoção Cinema
Icone: 🎬
Descricao_Curta: Ganhe ingressos de cinema!
Valor_Meta: 18
Mensagem_Progresso: Faltam para próximo ingresso
Mensagem_Sem_Numeros: Compre R$ 18,00 e ganhe 1 número da sorte!
```

### Exemplo 2: Sorteio Netflix
```
ID_Config: PROMO_NETFLIX_FEV2025
Promocao_Ativa: TRUE
Nome_Promocao: Sorteio Netflix
Icone: 🎯
Descricao_Curta: Concorra a 3 meses de Netflix!
Valor_Meta: 25
Mensagem_Progresso: Faltam para concorrer
Mensagem_Sem_Numeros: A cada R$ 25,00 você ganha uma chance!
```

### Exemplo 3: Black Friday
```
ID_Config: PROMO_BLACK_NOV2025
Promocao_Ativa: TRUE
Nome_Promocao: Black Friday Dona Capivara
Icone: 🎁
Descricao_Curta: Super prêmios te esperam!
Valor_Meta: 15
Mensagem_Progresso: Faltam para seu número
Mensagem_Sem_Numeros: Participe da maior promoção do ano!
```

---

## 🔧 Como Trocar de Promoção

### Método 1: Desativar Atual e Ativar Nova

1. Abra CONFIGURACAO_PROMO
2. Mude a promoção atual:
   - `Promocao_Ativa` → FALSE
3. Mude a nova promoção:
   - `Promocao_Ativa` → TRUE
4. Salve a planilha
5. O app atualiza automaticamente!

### Método 2: Editar a Mesma Linha (Rápido)

Se você tem apenas uma promoção rodando:

1. Abra CONFIGURACAO_PROMO (linha 2)
2. Edite diretamente os campos:
   - Nome_Promocao: "Sorteio Netflix"
   - Icone: 🎯
   - Descricao_Curta: "Concorra a Netflix!"
   - Valor_Meta: 25
3. Salve
4. Pronto! App atualiza sozinho

---

## 💡 Dicas Importantes

### ✅ Boas Práticas

1. **Sempre mantenha apenas 1 promoção ativa** (Promocao_Ativa = TRUE)
2. **Use emojis únicos** para cada promoção facilitar identificação
3. **Meta realista**: Valores entre R$ 15-50 funcionam bem
4. **Mensagens claras**: Seja direto sobre o que o cliente ganha

### ⚠️ Cuidados

1. **Não delete a config ativa**: Primeiro desative, depois delete
2. **Valor_Meta = 0**: Causará divisão por zero, use no mínimo 1
3. **Textos muito longos**: Podem quebrar no mobile, seja conciso

---

## 🎨 Emojis Sugeridos por Tipo de Promoção

| Tipo | Emoji | Exemplo |
|------|-------|---------|
| Cinema | 🎬 🎞️ 🍿 | Ingressos de cinema |
| Streaming | 📺 🎯 ▶️ | Netflix, Spotify |
| Produtos | 🎁 📦 🛍️ | Brindes físicos |
| Vale-compra | 💰 💵 💳 | Cupons de desconto |
| Viagem | ✈️ 🌴 🏖️ | Pacotes turísticos |
| Tecnologia | 📱 💻 🎮 | Eletrônicos, games |
| Festival | 🎉 🎊 🎆 | Eventos especiais |

---

## 🔄 Fluxo de Atualização

```
1. Admin edita CONFIGURACAO_PROMO no Google Sheets
           ↓
2. Backend lê configuração ao processar getMinhasChances
           ↓
3. API retorna config junto com dados do cliente
           ↓
4. Frontend renderiza com nome/ícone/textos dinâmicos
           ↓
5. Cliente vê a nova promoção automaticamente!
```

**Tempo de atualização:** Instantâneo! Não precisa recarregar app ou fazer deploy.

---

## 📊 Múltiplas Promoções (Histórico)

Você pode manter várias promoções na planilha:

| ID_Config | Promocao_Ativa | Nome_Promocao | ... |
|-----------|----------------|---------------|-----|
| PROMO_CINEMA_JAN | FALSE | Promoção Cinema | ... |
| PROMO_NETFLIX_FEV | FALSE | Sorteio Netflix | ... |
| PROMO_PASCOA_MAR | TRUE | Páscoa Premiada | ← Ativa |
| PROMO_BLACK_NOV | FALSE | Black Friday | ... |

- Sistema sempre pega a primeira linha com `Promocao_Ativa = TRUE`
- Mantém histórico de promoções passadas
- Fácil reativar promoções anteriores

---

## ✨ Vantagens do Sistema Configurável

✅ **Zero código**: Mude promoções direto no Google Sheets
✅ **Instantâneo**: Não precisa fazer deploy ou recarregar app
✅ **Flexível**: Nome, ícone, valor - tudo personalizável
✅ **Histórico**: Mantém registro de promoções passadas
✅ **Multi-promoção**: Suporta várias promoções simultâneas (se quiser)

---

## 🎯 Próximos Passos

1. ✅ Criar sheet CONFIGURACAO_PROMO
2. ✅ Adicionar primeira linha de configuração
3. ✅ Testar mudando o nome da promoção
4. ✅ Verificar se app atualiza automaticamente

**Tempo estimado:** 5 minutos para configurar a primeira vez!
