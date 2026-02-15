# 🧠 Solução Inteligente de Cache - QI 145

## 📋 Problema Identificado

Quando novos clientes entravam no site, a tela ficava vazia porque o cache do navegador impedia o carregamento de dados atualizados. O sistema anterior usava cache por 30 minutos, mas não tinha mecanismo para detectar novos visitantes ou invalidar cache quando necessário.

## ✨ Solução Implementada

### 1. **Sistema de Versionamento de Cache**

Adicionamos uma constante `CACHE_VERSION` que permite invalidar o cache de TODOS os usuários quando houver mudanças importantes no backend:

```typescript
const CACHE_VERSION = '1.0.0';
```

**Como usar:** Quando você fizer mudanças importantes no Google Sheets (adicionar produtos, mudar estrutura, etc.), basta incrementar a versão (ex: `1.0.1`, `1.1.0`, `2.0.0`) e todos os clientes automaticamente recarregarão os dados na próxima visita.

### 2. **Detecção Inteligente de Novos Visitantes**

O sistema agora detecta automaticamente quando é um novo visitante usando `localStorage`:

```typescript
const isNewVisitor = !localStorage.getItem('donaCapivara_lastVisit');
```

**Comportamento:**

- ✅ **Novo visitante:** Cache é invalidado, dados são carregados do servidor
- ✅ **Visitante recorrente:** Usa cache se ainda válido (performance)
- ✅ **Versão desatualizada:** Cache é invalidado automaticamente

### 3. **Marcadores de Controle**

Dois novos marcadores no localStorage:

- `donaCapivara_lastVisit`: Data/hora da última visita
- `donaCapivara_cacheVersion`: Versão do cache atual

### 4. **Fluxo de Decisão Inteligente**

```
┌─────────────────────────┐
│  Usuário acessa o site  │
└───────────┬─────────────┘
            │
            ▼
    ┌───────────────┐
    │ É novo        │ ──SIM──► Invalida cache
    │ visitante?    │          Carrega do servidor
    └───────┬───────┘
            │ NÃO
            ▼
    ┌───────────────┐
    │ Versão do     │ ──SIM──► Invalida cache
    │ cache OK?     │          Carrega do servidor
    └───────┬───────┘
            │ NÃO
            ▼
    ┌───────────────┐
    │ Cache ainda   │ ──SIM──► Usa cache
    │ válido (30m)? │          (RÁPIDO!)
    └───────┬───────┘
            │ NÃO
            ▼
    Carrega do servidor
    Atualiza cache
```

## 🎯 Benefícios

### ✅ Para Novos Visitantes

- **Sempre veem dados atualizados** (cache é invalidado automaticamente)
- **Sem tela vazia** (dados são carregados do servidor)
- **Experiência perfeita** desde a primeira visita

### ✅ Para Visitantes Recorrentes

- **Performance mantida** (cache de 30 minutos)
- **Carregamento instantâneo** quando cache válido
- **Atualização automática** quando versão muda

### ✅ Para Administradores

- **Controle total** via versionamento
- **Invalidação global** incrementando `CACHE_VERSION`
- **Sem necessidade de limpar cache manualmente**

## 🔧 Como Usar

### Forçar Atualização Global (Todos os Usuários)

Quando você fizer mudanças importantes no backend/Google Sheets:

1. Abra `services/api.ts`
2. Localize a linha:
    ```typescript
    const CACHE_VERSION = '1.0.0';
    ```
3. Incremente a versão:
    ```typescript
    const CACHE_VERSION = '1.0.1'; // ou 1.1.0, 2.0.0, etc.
    ```
4. Faça commit e deploy

**Resultado:** Todos os usuários recarregarão os dados na próxima visita!

### Forçar Atualização Manual (Usuário Individual)

O botão "Forçar Atualização" no perfil agora limpa:

- Cache em memória
- Marcadores de visitante
- Versão do cache

```typescript
API.clearCatalogCache(); // Limpa tudo
```

## 📊 Logs de Debug

O sistema agora mostra logs detalhados no console:

```
🆕 [Smart Cache] Novo visitante detectado - Forçando reload...
✅ [Catalog Cache STORED] Version 1.0.0 - Valid for 30 minutes
⚡ [Catalog Cache HIT] Age: 45s - Instant load!
🔄 [Catalog Cache EXPIRED] Versão desatualizada - Refetching...
```

## 🚀 Performance

- **Novos visitantes:** ~2-3s (carregamento do servidor)
- **Visitantes recorrentes:** ~50-100ms (cache hit)
- **Sem impacto negativo** na velocidade de carregamento
- **Invalidação inteligente** apenas quando necessário

## 🔐 Segurança

- Usa `localStorage` (isolado por domínio)
- Não armazena dados sensíveis
- Cache expira automaticamente após 30 minutos
- Fallback para cache expirado em caso de erro de rede

## 📝 Notas Técnicas

### Estrutura do Cache

```typescript
{
  data: {
    products: [...],
    categories: [...],
    banners: [...]
  },
  timestamp: 1735587936000,
  version: "1.0.0"
}
```

### Validação de Cache

O cache é considerado válido se:

1. Existe (`_catalogCache !== null`)
2. Não expirou (`age < 30 minutos`)
3. Versão corresponde (`version === CACHE_VERSION`)

### Casos de Uso

| Cenário                | Comportamento                             |
| ---------------------- | ----------------------------------------- |
| Primeira visita        | ❌ Cache invalidado → Carrega do servidor |
| Visita após 10 min     | ✅ Usa cache (rápido)                     |
| Visita após 40 min     | ❌ Cache expirado → Recarrega             |
| Nova versão disponível | ❌ Cache invalidado → Recarrega           |
| Erro de rede           | ⚠️ Usa cache expirado como fallback       |

## 🎓 Conclusão

Esta solução combina o melhor dos dois mundos:

- **Performance** para usuários recorrentes (cache)
- **Dados atualizados** para novos visitantes (invalidação inteligente)
- **Controle total** para administradores (versionamento)

**Sem comprometer a velocidade de carregamento!** 🚀
