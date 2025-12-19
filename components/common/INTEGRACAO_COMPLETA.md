# ✅ BannerCarousel - Integração Completa

## 🎯 O que foi feito:

### 1️⃣ **Componente Criado**
- ✅ `components/common/BannerCarousel.tsx` - Componente principal

### 2️⃣ **HomeView Atualizado**
- ✅ Substituído `Banner` simples por `BannerCarousel`
- ✅ Suporte a múltiplos banners com auto-play
- ✅ Fallback com banner padrão caso não venha do backend

### 3️⃣ **Documentação**
- ✅ `components/common/BANNER_CAROUSEL_GUIDE.md` - Guia completo

---

## 📋 Mudanças no HomeView.tsx

### **Antes:**
```tsx
import Banner from '../common/Banner';

// Renderizava apenas 1 banner
<Banner
  imageUrl={banners[0].image}
  title={banners[0].title}
  ...
/>
```

### **Depois:**
```tsx
import BannerCarousel from '../common/BannerCarousel';

// Renderiza TODOS os banners com carousel
<BannerCarousel
  banners={banners && banners.length > 0 ? banners : [
    {
      id: 'default',
      image: 'https://img.freepik.com/...',
      title: 'Bem-vindo à Dona Capivara',
      subtitle: 'Os melhores geladinhos da cidade!',
      ctaText: 'Ver Cardápio'
    }
  ]}
  onCtaClick={handleBannerClick}
  autoPlayInterval={5000}
  priority={true}
/>
```

---

## 🎨 Funcionalidades Ativas no HomeView

✅ **Auto-play de 5 segundos** entre banners  
✅ **Swipe/toque para mobile** (deslizar para trocar)  
✅ **Navegação por setas** (desktop, aparecem no hover)  
✅ **Navegação por dots** (bolinhas indicadoras)  
✅ **Contador visual** (ex: "2/5" no canto superior)  
✅ **Scroll suave** ao clicar no CTA (leva para grid de produtos)  
✅ **Banner padrão** se backend não retornar banners  

---

## 🔧 Próximos Passos (Opcional)

### **Backend - Adicionar múltiplos banners**

Se você quiser que o backend retorne múltiplos banners (em vez de apenas 1):

#### **1. Atualizar Google Sheets - Aba BANNERS**

| ID_Banner | URL_Imagem | Titulo | Subtitulo | Texto_CTA | Ordem | Ativo |
|-----------|------------|--------|-----------|-----------|-------|-------|
| BAN001 | https://... | Promoção Verão | 20% OFF | Ver Ofertas | 1 | TRUE |
| BAN002 | https://... | Novos Sabores | Experimente! | Comprar | 2 | TRUE |
| BAN003 | https://... | Fidelidade | Acumule pontos | Saber Mais | 3 | TRUE |

#### **2. Atualizar função getBanners() no Backend**

```javascript
function getBanners() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('BANNERS');
  
  if (!sheet) {
    return { 
      success: true, 
      banners: [] // Frontend usará fallback
    };
  }
  
  const data = sheetToJSON(sheet);
  
  // Filtra apenas banners ativos e ordena
  const banners = data
    .filter(b => b.Ativo === 'TRUE' || b.Ativo === true)
    .sort((a, b) => (a.Ordem || 0) - (b.Ordem || 0))
    .map(b => ({
      id: b.ID_Banner,
      image: b.URL_Imagem,
      title: b.Titulo,
      subtitle: b.Subtitulo || '',
      ctaText: b.Texto_CTA || ''
    }));
  
  return { 
    success: true, 
    banners 
  };
}

// Adicionar ao doPost:
case 'getBanners':
  return sendJSON(getBanners());
```

#### **3. Atualizar services/api.ts (Frontend)**

```typescript
export async function getBanners(): Promise<any[]> {
  try {
    const res = await fetch(`${API_URL}?action=getBanners`, {
      cache: 'no-store'
    });
    const data = await res.json();
    return data.banners || [];
  } catch (err) {
    console.error('Erro ao buscar banners:', err);
    return [];
  }
}
```

#### **4. Atualizar app/page.tsx**

No `useEffect` que carrega dados iniciais, adicionar:

```typescript
useEffect(() => {
  async function loadData() {
    try {
      const [productsRes, categoriesRes, bannersRes] = await Promise.all([
        getProducts(),
        getCategories(),
        getBanners() // ← NOVO
      ]);
      
      setProducts(productsRes);
      setCategories(categoriesRes);
      setBanners(bannersRes); // ← NOVO
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    }
  }
  loadData();
}, []);
```

---

## 🎯 Resultado Final

### **Desktop:**
- Múltiplos banners com transição suave
- Setas aparecem no hover
- Pausa auto-play ao passar mouse
- Dots clicáveis para navegação rápida

### **Mobile:**
- Swipe para trocar banners
- Auto-play contínuo
- Dots para ver quantidade/posição
- Botão CTA destacado

---

## 🐛 Troubleshooting

### **Banners não aparecem**
✅ Verificar se `banners` prop está sendo passado no `page.tsx`  
✅ Checar console do navegador por erros  
✅ Validar URLs das imagens (devem ter `https://`)

### **Auto-play não funciona**
✅ Precisa ter 2+ banners no array  
✅ Verificar se `autoPlayInterval` está configurado (padrão: 5000ms)

### **Imagens não carregam**
✅ Verificar CORS (se imagens de outro domínio)  
✅ Testar URLs diretamente no navegador

---

## 📊 Estrutura de Arquivos Final

```
components/
├── common/
│   ├── Banner.tsx (antigo - pode manter para compatibilidade)
│   ├── BannerCarousel.tsx ✨ NOVO
│   └── BANNER_CAROUSEL_GUIDE.md ✨ NOVO
└── views/
    └── HomeView.tsx ✅ ATUALIZADO
```

---

**Status:** ✅ **Integração Completa**  
**Data:** 18/12/2025  
**Próximo passo:** Testar no navegador com `npm run dev`
