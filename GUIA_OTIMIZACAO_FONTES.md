# 🎨 GUIA DE OTIMIZAÇÃO DE FONTES - Next.js Font Optimization

## 📋 Objetivo

Migrar de Google Fonts CDN para `next/font/google` para melhorar performance e privacidade.

## 🎯 Benefícios

- ✅ **-100ms** no First Contentful Paint
- ✅ **Zero layout shift** (FOUT/FOIT eliminado)
- ✅ **Privacidade**: Fontes hospedadas localmente
- ✅ **Cache automático**: Fontes servidas do mesmo domínio

## 📝 Implementação

### Passo 1: Atualizar `app/layout.tsx`

```typescript
import type { Metadata, Viewport } from "next";
import { Poppins } from 'next/font/google'; // ← ADICIONAR
import "./globals.css";

// ← ADICIONAR configuração da fonte
const poppins = Poppins({
    weight: ['300', '400', '600', '700'],
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-poppins',
});

export const metadata: Metadata = {
    title: "Dona Capivara",
    description: "Os melhores geladinhos gourmet da cidade!",
    manifest: "/manifest.json",
    icons: {
        icon: "/favicon.ico",
        apple: [
            { url: "/icons/apple-icon-57x57.png", sizes: "57x57" },
            { url: "/icons/apple-icon-60x60.png", sizes: "60x60" },
            { url: "/icons/apple-icon-72x72.png", sizes: "72x72" },
            { url: "/icons/apple-icon-76x76.png", sizes: "76x76" },
            { url: "/icons/apple-icon-114x114.png", sizes: "114x114" },
            { url: "/icons/apple-icon-120x120.png", sizes: "120x120" },
            { url: "/icons/apple-icon-144x144.png", sizes: "144x144" },
            { url: "/icons/apple-icon-152x152.png", sizes: "152x152" },
            { url: "/icons/apple-icon-180x180.png", sizes: "180x180" },
        ],
    },
};

export const viewport: Viewport = {
    themeColor: "#FF4B82",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-BR">
            {/* ← ADICIONAR className com a variável da fonte */}
            <body className={poppins.variable}>{children}</body>
        </html>
    );
}
```

### Passo 2: Atualizar `app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ❌ REMOVER esta linha:
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');
*/

body {
    /* ✅ ATUALIZAR para usar a variável CSS */
    font-family: var(--font-poppins), sans-serif;
    background-color: #f5f6fa;
    color: #2d3436;
    padding-bottom: 80px;
    /* Space for bottom nav */
}

/* Hide Scrollbar */
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}

.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
```

### Passo 3: (Opcional) Atualizar `tailwind.config.ts`

Se quiser usar a fonte via Tailwind classes:

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}'
    ],
    theme: {
        extend: {
            fontFamily: {
                // ← ADICIONAR
                poppins: ['var(--font-poppins)', 'sans-serif']
            }
        }
    },
    plugins: []
};
export default config;
```

Uso: `<div className="font-poppins">Texto</div>`

## ✅ Verificação

### Antes da mudança:

1. Abra DevTools → Network
2. Filtre por "fonts.googleapis.com"
3. Você verá requisições externas

### Depois da mudança:

1. Abra DevTools → Network
2. Filtre por "fonts"
3. Fontes serão servidas do próprio domínio (`/_next/static/media/`)

## 🧪 Testes

```bash
# 1. Limpar cache
npm run build

# 2. Iniciar servidor de produção
npm run start

# 3. Verificar no navegador
# - Inspecionar elementos e verificar font-family
# - Verificar Network tab (sem requisições externas)
# - Verificar Lighthouse (score deve melhorar)
```

## 📊 Impacto Esperado

| Métrica                 | Antes | Depois | Melhoria |
| ----------------------- | ----- | ------ | -------- |
| First Contentful Paint  | ~1.2s | ~1.1s  | -100ms   |
| Cumulative Layout Shift | 0.05  | 0.00   | -100%    |
| Requisições externas    | 2     | 0      | -100%    |
| Lighthouse Performance  | 85    | 90+    | +5pts    |

## ⚠️ Notas Importantes

1. **Build Time**: O primeiro build será um pouco mais lento (Next.js baixa e otimiza as fontes)
2. **Cache**: Fontes são cacheadas permanentemente após o primeiro build
3. **Fallback**: O `sans-serif` ainda funciona como fallback
4. **Compatibilidade**: Funciona em todos os navegadores modernos

## 🔄 Rollback (se necessário)

Se algo der errado, basta:

1. Reverter mudanças em `layout.tsx`
2. Restaurar `@import` em `globals.css`
3. Executar `npm run build` novamente

---

**Status:** ⏳ PENDENTE DE IMPLEMENTAÇÃO  
**Prioridade:** 🔴 ALTA  
**Risco:** 🟢 BAIXO  
**Tempo estimado:** 5 minutos
