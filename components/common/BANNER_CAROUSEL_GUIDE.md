# 🎠 BannerCarousel - Guia de Uso

Este componente foi criado em: `components/BannerCarousel.tsx`

---

## ✨ Funcionalidades

✅ **Auto-play automático** (5 segundos por padrão)
✅ **Navegação por swipe/toque** (mobile-friendly)
✅ **Navegação por setas** (desktop - aparecem no hover)
✅ **Navegação por bolinhas** (dots)
✅ **Contador de banners** (ex: 1/3)
✅ **Pausa no hover** (desktop)
✅ **Animações suaves** (fade + slide)
✅ **Lazy loading de imagens**
✅ **Gradient overlay para legibilidade**
✅ **Botão CTA opcional**
✅ **Responsivo** (mobile + desktop)

---

## 📝 Como Usar

### 1️⃣ Importar o Componente

```tsx
import BannerCarousel from '@/components/BannerCarousel';
```

### 2️⃣ Preparar os Dados

```tsx
const banners = [
  {
    id: '1',
    image: 'https://exemplo.com/banner1.jpg',
    title: 'Promoção de Verão! 🌞',
    subtitle: '20% OFF em todos os geladinhos',
    ctaText: 'Ver Ofertas'
  },
  {
    id: '2',
    image: 'https://exemplo.com/banner2.jpg',
    title: 'Novos Sabores Chegaram!',
    subtitle: 'Experimente Morango com Chocolate',
    ctaText: 'Comprar Agora'
  },
  {
    id: '3',
    image: 'https://exemplo.com/banner3.jpg',
    title: 'Programa de Fidelidade',
    subtitle: 'Acumule pontos e ganhe prêmios!'
  }
];
```

### 3️⃣ Usar no JSX

```tsx
export default function HomePage() {
  const handleCtaClick = () => {
    console.log('CTA clicado!');
    // Redirecionar, abrir modal, etc.
  };

  return (
    <div className="container mx-auto px-4">
      <BannerCarousel 
        banners={banners}
        onCtaClick={handleCtaClick}
        autoPlayInterval={5000}
        priority={true}
      />
    </div>
  );
}
```

---

## 🔧 Props

| Prop | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|--------|-----------|
| `banners` | `Banner[]` | ✅ Sim | - | Array de banners |
| `onCtaClick` | `() => void` | ❌ Não | - | Callback ao clicar no CTA |
| `autoPlayInterval` | `number` | ❌ Não | `5000` | Intervalo em ms entre slides |
| `priority` | `boolean` | ❌ Não | `false` | Se true, primeiro banner carrega com eager |

### Interface Banner

```typescript
interface Banner {
  id?: string;           // ID único (opcional)
  image: string;         // URL da imagem (obrigatório)
  title: string;         // Título principal (obrigatório)
  subtitle?: string;     // Subtítulo (opcional)
  ctaText?: string;      // Texto do botão CTA (opcional)
}
```

---

## 🎨 Personalização

### Alterar Cores do CTA

Edite a linha 142 no arquivo:

```tsx
// Atual (gradiente rosa/laranja)
className="... bg-gradient-to-r from-[#FF4B82] to-[#FF9E3D] ..."

// Exemplo: Azul
className="... bg-gradient-to-r from-blue-500 to-blue-700 ..."

// Exemplo: Verde
className="... bg-gradient-to-r from-green-500 to-green-700 ..."
```

### Alterar Altura do Banner

Edite a linha 99:

```tsx
// Atual
className="relative h-48 md:h-64 ..."

// Maior
className="relative h-64 md:h-80 ..."

// Menor
className="relative h-40 md:h-56 ..."
```

### Alterar Tempo de Auto-play

```tsx
<BannerCarousel 
  banners={banners}
  autoPlayInterval={3000} // 3 segundos
/>
```

---

## 💡 Exemplo de Integração com HomeView

```tsx
// components/views/HomeView.tsx
import BannerCarousel from '@/components/BannerCarousel';
import { useEffect, useState } from 'react';

export default function HomeView() {
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    // Buscar banners da API
    fetch('YOUR_API_URL?action=getBanners')
      .then(res => res.json())
      .then(data => setBanners(data.banners || []));
  }, []);

  const handleBannerClick = () => {
    // Scroll para produtos, por exemplo
    document.getElementById('produtos')?.scrollIntoView({ 
      behavior: 'smooth' 
    });
  };

  return (
    <div>
      {/* Banner Carousel */}
      <BannerCarousel
        banners={banners}
        onCtaClick={handleBannerClick}
        priority={true}
      />

      {/* Resto do conteúdo */}
      <div id="produtos">
        {/* Catálogo de produtos */}
      </div>
    </div>
  );
}
```

---

## 🎯 Exemplo de Banners do Backend

Se você quiser adicionar banners no Google Sheets:

### Estrutura da Aba BANNERS

| ID_Banner | URL_Imagem | Titulo | Subtitulo | Texto_CTA | Ativo |
|-----------|------------|--------|-----------|-----------|-------|
| BAN001 | https://... | Promoção | 20% OFF | Ver Mais | TRUE |
| BAN002 | https://... | Novidades | Confira | Comprar | TRUE |

### Função no Backend (Code.js)

```javascript
function getBanners() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('BANNERS');
  
  if (!sheet) return { success: false, banners: [] };
  
  const data = sheetToJSON(sheet);
  
  const banners = data
    .filter(b => b.Ativo === 'TRUE' || b.Ativo === true)
    .map(b => ({
      id: b.ID_Banner,
      image: b.URL_Imagem,
      title: b.Titulo,
      subtitle: b.Subtitulo || '',
      ctaText: b.Texto_CTA || ''
    }));
  
  return { success: true, banners };
}
```

---

## 🚀 Recursos Avançados

### Gestos de Swipe Mobile

- **Deslizar para esquerda** → Próximo banner
- **Deslizar para direita** → Banner anterior
- **Distância mínima:** 50px

### Auto-pause Inteligente

- **Desktop:** Pausa ao passar o mouse (hover)
- **Mobile:** Não pausa (melhor UX)
- **Reset:** Timer reinicia ao clicar nos dots

### Performance

- **Lazy loading:** Apenas primeira imagem carrega eager
- **Transition CSS:** Usa GPU acceleration
- **Render otimizado:** Todos os slides no DOM para transição suave

---

## 🐛 Troubleshooting

### Banners não aparecem

✅ Verificar se `banners.length > 0`
✅ Verificar URLs das imagens
✅ Checar console do navegador

### Auto-play não funciona

✅ Verificar se tem mais de 1 banner
✅ Checar se `autoPlayInterval` está configurado

### Imagens não carregam

✅ Verificar CORS (se forem de domínio diferente)
✅ Adicionar protocolo nas URLs (`https://`)

---

## 🎨 Design System

**Cores usadas:**
- CTA: `#FF4B82` → `#FF9E3D` (gradiente)
- Overlay: `black/70` → `transparent`
- Arrows/Dots: `white/20` (com blur)

**Animações:**
- Fade: `700ms`
- Slide: `500ms`
- Hover: `300ms`

**Espaçamento:**
- Margin top/bottom: `1.5rem` (24px)
- Padding interno: `1.5rem` (24px)
- Border radius: `1.5rem` (24px)

---

## ✅ Checklist de Implementação

- [ ] Componente criado em `components/BannerCarousel.tsx`
- [ ] Adicionada aba BANNERS no Google Sheets
- [ ] Criada função `getBanners()` no backend
- [ ] Integrado no `HomeView.tsx`
- [ ] Testado em mobile (swipe)
- [ ] Testado em desktop (arrows)
- [ ] Verificado auto-play
- [ ] Otimizado URLs de imagens

---

**Criado em:** 18/12/2025  
**Compatível com:** Next.js 14 + React 18 + TypeScript + Tailwind CSS
