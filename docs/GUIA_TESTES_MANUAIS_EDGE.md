# 🧪 GUIA DE TESTES MANUAIS - MICROSOFT EDGE

**Data:** 2026-01-02  
**Versão:** 1.0.0  
**Navegador:** Microsoft Edge  
**URL:** http://localhost:3000  
**Objetivo:** Validar correções da auditoria de segurança

---

## ⚙️ PRÉ-REQUISITOS

### Antes de Começar

- [ ] Servidor está rodando (`npm run dev`)
- [ ] Console do navegador aberto (F12)
- [ ] Aba "Network" visível para monitorar requisições
- [ ] Aba "Console" visível para verificar logs

### Ferramentas Necessárias

- Microsoft Edge (versão atualizada)
- Ferramenta de decodificação de URL (pode usar: https://www.urldecoder.org/)
- Bloco de notas para registrar resultados

---

## 📋 CENÁRIO 1: Pedido Simples com PIX

### Objetivo

Validar fluxo básico de checkout e formatação de mensagem WhatsApp.

### Passos

1. **Acessar a aplicação**
    - Abrir Edge
    - Navegar para `http://localhost:3000`
    - ✅ **VALIDAR:** Página carrega sem erros no console

2. **Selecionar produto**
    - Clicar em qualquer produto "Geladão"
    - ✅ **VALIDAR:** Modal de detalhes abre

3. **Adicionar ao carrinho**
    - Clicar em "Adicionar ao Carrinho"
    - ✅ **VALIDAR:** Contador do carrinho aumenta
    - ✅ **VALIDAR:** Toast de sucesso aparece

4. **Ir para o carrinho**
    - Clicar no ícone do carrinho (canto superior direito)
    - ✅ **VALIDAR:** Tela do carrinho abre
    - ✅ **VALIDAR:** Produto aparece na lista

5. **Preencher dados de entrega**
    - Nome: `Teste QA Edge`
    - Tipo de entrega: `Condomínio`
    - Torre: `1`
    - Apartamento: `101`
    - Forma de pagamento: `PIX`
    - ✅ **VALIDAR:** Todos os campos aceitam entrada

6. **Observar valor total**
    - ✅ **VALIDAR:** Formato é `R$ X,XX` (com vírgula, não ponto)
    - ✅ **VALIDAR:** Cálculo está correto
    - 📝 **ANOTAR:** Valor total exibido: **\*\***\_**\*\***

7. **Finalizar pedido**
    - Clicar em "Finalizar Pedido"
    - ⏱️ **AGUARDAR:** 2-3 segundos
    - ✅ **VALIDAR:** Modal de sucesso aparece
    - ✅ **VALIDAR:** Nova aba do WhatsApp abre automaticamente

8. **Validar URL do WhatsApp**
    - Ir para a nova aba do WhatsApp
    - Copiar a URL completa da barra de endereço
    - ✅ **VALIDAR:** URL começa com `https://wa.me/5541991480096`
    - ✅ **VALIDAR:** URL contém `?text=`
    - 📝 **COPIAR:** URL completa para análise

9. **Decodificar mensagem**
    - Copiar tudo após `?text=`
    - Colar em https://www.urldecoder.org/
    - ✅ **VALIDAR:** Mensagem contém:
        - `*Novo Pedido Dona Capivara* 🧉`
        - `ID: XXXXXXXX` (8 caracteres)
        - Nome do produto
        - Quantidade
        - `Total Item: R$ X,XX` (com vírgula)
        - `*Total: R$ X,XX*`
        - `Cliente: Teste QA Edge`
        - `Torre: 1 - Apto: 101`
        - `Pgto: PIX`
    - ✅ **VALIDAR:** Emojis aparecem corretamente (🧉)
    - ✅ **VALIDAR:** Formatação de moeda usa vírgula

10. **Verificar console**
    - Voltar para a aba da aplicação
    - Abrir console (F12)
    - ✅ **VALIDAR:** Mensagem `✅ Pedido XXXXXXXX processado com sucesso`
    - ✅ **VALIDAR:** Sem erros em vermelho

### Resultado Esperado

- ✅ Pedido finalizado com sucesso
- ✅ WhatsApp abre em nova aba
- ✅ Mensagem formatada corretamente
- ✅ Moeda em formato BRL (R$ X,XX)
- ✅ Emojis renderizados

### 📸 Evidências

- [ ] Screenshot da tela do carrinho com valor total
- [ ] Screenshot da URL do WhatsApp
- [ ] Screenshot da mensagem decodificada
- [ ] Screenshot do console sem erros

---

## 📋 CENÁRIO 2: Teste de Idempotência (Duplo Clique)

### Objetivo

Validar que a correção de idempotência previne dupla submissão.

### Passos

1. **Limpar carrinho**
    - Voltar para a página principal
    - Se houver itens no carrinho, removê-los

2. **Adicionar novo produto**
    - Selecionar qualquer produto
    - Adicionar ao carrinho

3. **Ir para checkout**
    - Abrir carrinho
    - Preencher dados:
        - Nome: `Teste Duplo Clique`
        - Torre: `2`
        - Apto: `202`
        - Pagamento: `Dinheiro`

4. **Preparar para teste**
    - Abrir console (F12)
    - Posicionar cursor sobre o botão "Finalizar Pedido"
    - **NÃO CLICAR AINDA**

5. **Executar duplo clique rápido**
    - Clicar DUAS VEZES rapidamente no botão "Finalizar Pedido"
    - ⏱️ Intervalo entre cliques: < 500ms

6. **Observar comportamento**
    - ✅ **VALIDAR:** Apenas UMA aba do WhatsApp abre
    - ✅ **VALIDAR:** Console mostra mensagem:
        ```
        ⚠️ Pedido já está sendo processado. Ignorando nova tentativa.
        ```
    - ✅ **VALIDAR:** Não há erro de "duplicação"
    - ✅ **VALIDAR:** Botão fica desabilitado após primeiro clique

7. **Verificar no console**
    - ✅ **VALIDAR:** Apenas UM log de `✅ Pedido XXXXXXXX processado`
    - ✅ **VALIDAR:** Mensagem de warning aparece no segundo clique

### Resultado Esperado

- ✅ Apenas 1 aba do WhatsApp aberta
- ✅ Warning no console sobre tentativa duplicada
- ✅ Sistema não trava ou apresenta erro

### 📸 Evidências

- [ ] Screenshot do console mostrando warning
- [ ] Confirmação de que apenas 1 aba foi aberta

---

## 📋 CENÁRIO 3: Mix Gourmet com Sabores

### Objetivo

Validar que sabores do Mix aparecem na mensagem WhatsApp.

### Passos

1. **Acessar Mix Gourmet**
    - Na página principal, procurar produto "Mix Gourmet"
    - Clicar no produto

2. **Selecionar sabores**
    - Escolher 3 sabores diferentes
    - Exemplo: Morango, Chocolate, Limão
    - ✅ **VALIDAR:** Contador de sabores atualiza
    - ✅ **VALIDAR:** Preço total calcula corretamente

3. **Adicionar ao carrinho**
    - Clicar em "Adicionar ao Carrinho"
    - Ir para o carrinho

4. **Finalizar pedido**
    - Preencher dados de entrega
    - Finalizar pedido
    - Aguardar abertura do WhatsApp

5. **Validar mensagem**
    - Copiar URL do WhatsApp
    - Decodificar o parâmetro `text`
    - ✅ **VALIDAR:** Mensagem contém:
        ```
        1x Mix Gourmet
          *Sabores:*
          - Morango
          - Chocolate
          - Limão
          Total Item: R$ X,XX
        ```
    - ✅ **VALIDAR:** Todos os sabores aparecem listados

### Resultado Esperado

- ✅ Sabores listados individualmente
- ✅ Formatação correta com bullets (-)
- ✅ Preço total do item correto

### 📸 Evidências

- [ ] Screenshot da seleção de sabores
- [ ] Screenshot da mensagem decodificada com sabores

---

## 📋 CENÁRIO 4: Desconto com Cupom

### Objetivo

Validar separação de descontos (cupom vs pontos) na mensagem.

### Passos

1. **Fazer login (se necessário)**
    - Se houver sistema de login, fazer login
    - Caso contrário, prosseguir como guest

2. **Adicionar produto ao carrinho**
    - Selecionar produto
    - Adicionar ao carrinho

3. **Aplicar cupom**
    - No carrinho, localizar campo "Cupom"
    - Digitar: `BEMVINDO`
    - Clicar em "Aplicar"
    - ✅ **VALIDAR:** Mensagem de sucesso
    - ✅ **VALIDAR:** Valor do desconto aparece
    - ✅ **VALIDAR:** Total atualiza corretamente
    - 📝 **ANOTAR:** Valor do desconto: **\*\***\_**\*\***

4. **Finalizar pedido**
    - Preencher dados de entrega
    - Finalizar

5. **Validar mensagem WhatsApp**
    - Decodificar URL
    - ✅ **VALIDAR:** Mensagem contém:
        ```
        *Total: R$ X,XX*
        Cliente: Nome
        🎁 Cupom: BEMVINDO (-R$ X,XX)
        ```
    - ✅ **VALIDAR:** Emoji 🎁 aparece
    - ✅ **VALIDAR:** Valor do desconto está correto

### Resultado Esperado

- ✅ Cupom aplicado com sucesso
- ✅ Desconto aparece separadamente na mensagem
- ✅ Emoji de presente renderizado

### 📸 Evidências

- [ ] Screenshot do carrinho com cupom aplicado
- [ ] Screenshot da mensagem com desconto

---

## 📋 CENÁRIO 5: Caracteres Especiais no Endereço

### Objetivo

Validar sanitização de caracteres especiais.

### Passos

1. **Adicionar produto ao carrinho**

2. **Escolher entrega externa**
    - No carrinho, selecionar "Entrega Externa"
    - Preencher CEP: `80010-000` (ou qualquer válido)
    - Aguardar preenchimento automático

3. **Adicionar caracteres especiais**
    - Complemento: `Apto #123 - Bloco *A* - Próx. ao mercado`
    - ✅ **VALIDAR:** Campo aceita os caracteres

4. **Finalizar pedido**
    - Preencher restante dos dados
    - Finalizar

5. **Validar URL do WhatsApp**
    - ✅ **VALIDAR:** URL não quebra
    - ✅ **VALIDAR:** Navegador consegue abrir a aba
    - Decodificar mensagem
    - ✅ **VALIDAR:** Caracteres especiais foram sanitizados:
        - `#` pode aparecer ou ser removido
        - `*` deve ser removido (conflita com markdown)
        - `-` deve permanecer

### Resultado Esperado

- ✅ URL válida gerada
- ✅ Caracteres que quebram markdown são removidos
- ✅ Mensagem legível no WhatsApp

### 📸 Evidências

- [ ] Screenshot do campo com caracteres especiais
- [ ] Screenshot da mensagem decodificada

---

## 📋 CENÁRIO 6: Formatação de Moeda BRL

### Objetivo

Validar que TODOS os valores usam formato brasileiro (R$ X,XX).

### Passos

1. **Adicionar múltiplos produtos**
    - Adicionar 2-3 produtos diferentes ao carrinho
    - Incluir produtos com adicionais (se disponível)

2. **Observar valores no carrinho**
    - ✅ **VALIDAR:** Preço unitário: `R$ X,XX`
    - ✅ **VALIDAR:** Subtotal: `R$ X,XX`
    - ✅ **VALIDAR:** Total: `R$ X,XX`
    - ✅ **VALIDAR:** Todos usam vírgula (,) não ponto (.)

3. **Finalizar pedido**

4. **Validar mensagem WhatsApp**
    - Decodificar URL
    - ✅ **VALIDAR:** TODOS os valores seguem padrão:
        - `Total Item: R$ X,XX`
        - `*Total: R$ X,XX*`
        - Descontos: `(-R$ X,XX)`
    - ✅ **VALIDAR:** Nenhum valor usa formato americano (X.XX)

### Resultado Esperado

- ✅ 100% dos valores em formato BRL
- ✅ Consistência em toda a aplicação

### 📸 Evidências

- [ ] Screenshot do carrinho com múltiplos produtos
- [ ] Screenshot da mensagem completa decodificada

---

## 📋 CENÁRIO 7: Validação de Emojis

### Objetivo

Confirmar que emojis Unicode são renderizados corretamente.

### Passos

1. **Finalizar qualquer pedido**

2. **Decodificar mensagem WhatsApp**

3. **Validar emojis presentes**
    - ✅ **VALIDAR:** `🧉` (Mate) - Título do pedido
    - ✅ **VALIDAR:** `📅` (Calendário) - Se houver agendamento
    - ✅ **VALIDAR:** `🎁` (Presente) - Se houver cupom
    - ✅ **VALIDAR:** `👑` (Coroa) - Se houver desconto de pontos
    - ✅ **VALIDAR:** `🤝` (Aperto de mão) - Se houver código de indicação
    - ✅ **VALIDAR:** `⭐` (Estrela) - Pontos ganhos

4. **Verificar renderização**
    - ✅ **VALIDAR:** Emojis aparecem como símbolos, não como `�` ou código
    - ✅ **VALIDAR:** Emojis estão nas posições corretas

### Resultado Esperado

- ✅ Todos os emojis renderizados
- ✅ Sem caracteres corrompidos

### 📸 Evidências

- [ ] Screenshot da mensagem com emojis visíveis

---

## 📊 TEMPLATE DE RELATÓRIO DE TESTES

```markdown
# Relatório de Testes Manuais - Edge

**Data:** \***\*\_\_\*\***
**Testador:** \***\*\_\_\*\***
**Versão da Aplicação:** \***\*\_\_\*\***

## Resumo Executivo

- Total de cenários: 7
- Passou: \_\_\_
- Falhou: \_\_\_
- Bloqueado: \_\_\_

## Resultados por Cenário

### ✅ CENÁRIO 1: Pedido Simples

- Status: PASSOU / FALHOU / BLOQUEADO
- Observações: \***\*\*\*\*\*\*\***\_\_\_\***\*\*\*\*\*\*\***
- Bugs encontrados: \***\*\*\*\*\***\_\_\***\*\*\*\*\***

### ✅ CENÁRIO 2: Idempotência

- Status: PASSOU / FALHOU / BLOQUEADO
- Observações: \***\*\*\*\*\*\*\***\_\_\_\***\*\*\*\*\*\*\***
- Bugs encontrados: \***\*\*\*\*\***\_\_\***\*\*\*\*\***

### ✅ CENÁRIO 3: Mix Gourmet

- Status: PASSOU / FALHOU / BLOQUEADO
- Observações: \***\*\*\*\*\*\*\***\_\_\_\***\*\*\*\*\*\*\***
- Bugs encontrados: \***\*\*\*\*\***\_\_\***\*\*\*\*\***

### ✅ CENÁRIO 4: Cupom de Desconto

- Status: PASSOU / FALHOU / BLOQUEADO
- Observações: \***\*\*\*\*\*\*\***\_\_\_\***\*\*\*\*\*\*\***
- Bugs encontrados: \***\*\*\*\*\***\_\_\***\*\*\*\*\***

### ✅ CENÁRIO 5: Caracteres Especiais

- Status: PASSOU / FALHOU / BLOQUEADO
- Observações: \***\*\*\*\*\*\*\***\_\_\_\***\*\*\*\*\*\*\***
- Bugs encontrados: \***\*\*\*\*\***\_\_\***\*\*\*\*\***

### ✅ CENÁRIO 6: Formatação BRL

- Status: PASSOU / FALHOU / BLOQUEADO
- Observações: \***\*\*\*\*\*\*\***\_\_\_\***\*\*\*\*\*\*\***
- Bugs encontrados: \***\*\*\*\*\***\_\_\***\*\*\*\*\***

### ✅ CENÁRIO 7: Emojis

- Status: PASSOU / FALHOU / BLOQUEADO
- Observações: \***\*\*\*\*\*\*\***\_\_\_\***\*\*\*\*\*\*\***
- Bugs encontrados: \***\*\*\*\*\***\_\_\***\*\*\*\*\***

## Bugs Encontrados

### BUG #1

- Severidade: CRÍTICO / ALTO / MÉDIO / BAIXO
- Descrição: \***\*\*\*\*\*\*\***\_\_\_\_\***\*\*\*\*\*\*\***
- Passos para reproduzir: **\*\***\_\_\_\_**\*\***
- Screenshot: \***\*\*\*\*\*\*\***\_\_\_\***\*\*\*\*\*\*\***

## Recomendações

---

## Aprovação

- [ ] Aprovado para produção
- [ ] Requer correções

**Assinatura:** \***\*\_\_\*\***
```

---

## 🎯 CRITÉRIOS DE APROVAÇÃO

Para aprovar o sistema para produção, TODOS os itens devem estar ✅:

- [ ] Cenário 1 passou sem erros
- [ ] Cenário 2 confirmou idempotência
- [ ] Cenário 3 mostra sabores do Mix
- [ ] Cenário 4 mostra descontos separados
- [ ] Cenário 5 trata caracteres especiais
- [ ] Cenário 6 usa formato BRL em 100% dos valores
- [ ] Cenário 7 renderiza todos os emojis
- [ ] Console sem erros críticos
- [ ] WhatsApp abre corretamente em todos os testes

---

## 📞 SUPORTE

Se encontrar problemas durante os testes:

1. **Capturar evidências:**
    - Screenshot da tela
    - Screenshot do console (F12)
    - Copiar mensagem de erro completa

2. **Registrar no relatório:**
    - Descrever o que esperava
    - Descrever o que aconteceu
    - Passos para reproduzir

3. **Classificar severidade:**
    - **CRÍTICO:** Sistema não funciona
    - **ALTO:** Funcionalidade principal quebrada
    - **MÉDIO:** Funcionalidade secundária com problema
    - **BAIXO:** Problema visual ou de UX

---

**BOA SORTE NOS TESTES! 🚀**
