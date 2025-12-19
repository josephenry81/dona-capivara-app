# 🍦 MixGourmetView - Documentação Completa

## 📋 Visão Geral

Componente premium para **montagem personalizada de Mix de Geladinhos** com duas abordagens:
1. **🎨 Monte o Seu** - Personalização total (sabores + adicionais)
2. **⚡ Combos Prontos** - Seleções pré-definidas para compra rápida

---

## 🎯 Funcionalidades Principais

### ✅ **Montagem Personalizada**
- Seleção de até 2 sabores
- Escolha de adicionais (caldas, toppings, coberturas)
- Cálculo automático de preço
- Validação de estoque
- Resumo flutuante
- Quantidade ajustável

### ✅ **Combos Prontos**
- 3 combos pré-configurados
- Compra com 1 clique
- Preços fixos
- Descriçõe detalhadas

### ✅ **UX Premium**
- Loading states elegantes
- Transições suaves
- Feedback visual instantâneo
- Animações de scale/hover
- Sticky headers
- Bottom bar fixo

---

## 📂 Localização

```
components/
└── views/
    └── MixGourmetView.tsx
```

---

## 🔧 Props

```typescript
interface MixGourmetViewProps {
    mixId: string;              // ID do produto Mix
    onBack: () => void;         // Callback para voltar
    onAddToCart: (mixData: any) => void;  // Callback ao adicionar ao carrinho
}
```

---

## 💾 Estrutura de Dados

### **Mix Object (do backend):**

```typescript
{
    id: string;
    name: string;
    base_price: number;
    price_per_flavor: number;
    flavors: Flavor[];
    addition_groups: AdditionGroup[];
}
```

### **Flavor Object:**

```typescript
{
    id: string;
    name: string;
    category: string;
    price: number;
    stock_status: 'available' | 'out_of_stock';
    image_url: string | null;
}
```

### **Addition Group:**

```typescript
{
    id: string;
    name: string;  // ex: "Caldas", "Toppings"
    type: 'single' | 'multiple';
    required: boolean;
    min: number;
    max: number;
    options: AdditionOption[];
}
```

---

## 🎨 Design System

### **Cores:**
- **Primary:** Pink (#FF4B82) / Purple (#A855F7) / Blue (#3B82F6)
- **Accent:** Green (#10B981) para preços
- **Background:** Gradiente pastel (pink-blue-yellow)

### **Animações:**
- **Scale on hover:** 1.02x - 1.05x
- **Active:** 0.95x
- **Bounce:** Botão de resumo flutuante
- **Slide-in:** Painel de resumo

### **Sombras:**
- **Cards:** shadow-xl
- **Hover:** shadow-2xl
- **Botões:** shadow-lg

---

## 📊 Fluxo do Usuário

### **Tab "Monte o Seu":**

```
1. Escolhe até 2 sabores (obrigatório)
   └── Visual feedback: border pink + checkmark + scale
   
2. Escolhe adicionais (opcional)
   └── Visual feedback: border blue + checkmark
   
3. Ajusta quantidade (+/- butttons)
   
4. Vê resumo flutuante (📋 botão)
   └── Breakdown de preço detalhado
   
5. Adiciona ao carrinho
```

### **Tab "Combos Prontos":**

```
1. Vê 3 combos pré-definidos
   
2. Clica em "Quero esse!"
   
3. Item adicionado diretamente ao carrinho
```

---

## 🧮 Cálculo de Preço

```typescript
Total = Base + (N_Sabores × Preço_Por_Sabor) + Σ(Adicionais) × Quantidade

Exemplo:
- Base: R$ 8,00
- 2 Sabores × R$ 3,00 = R$ 6,00
- Adicionais (Calda + Topping): R$ 4,00
- Unitário: R$ 18,00
- Quantidade: 2
- TOTAL: R$ 36,00
```

---

## 🔄 Integração com Backend

### **API Call:**

```typescript
// Carrega dados do Mix
const data = await API.getMixWithFlavorAndAdditions(mixId);

// Retorna:
{
    id: "MIX001",
    name: "Mix de Geladinhos Gourmet",
    base_price: 8.00,
    price_per_flavor: 3.00,
    flavors: [...],
    addition_groups: [...]
}
```

### **Ao Adicionar ao Carrinho:**

```typescript
{
    id: mix.id,
    nome: mix.name,
    price: mix.base_price,
    quantity: 2,
    selected_flavors: [
        { flavor_id: "F001", flavor_name: "Morango", flavor_price: 3.00 },
        { flavor_id: "F002", flavor_name: "Chocolate", flavor_price: 3.00 }
    ],
    selected_additions: [
        { group_id: "G1", option_id: "O1", option_name: "Calda de Chocolate", option_price: 2.00 }
    ],
    unit_price: 18.00,
    cart_item_id: "mix-1734567890123"
}
```

---

## 🎯 Estados do Componente

```typescript
// Data States
const [mix, setMix] = useState<any>(null);
const [loading, setLoading] = useState(true);

// Selection States
const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
const [selectedAdditions, setSelectedAdditions] = useState<any[]>([]);
const [quantity, setQuantity] = useState(1);

// UI States
const [activeTab, setActiveTab] = useState<'custom' | 'ready'>('custom');
const [showSummary, setShowSummary] = useState(false);
```

---

## 📱 Responsividade

### **Mobile (< 768px):**
- Grid: 2 colunas para sabores/adicionais
- Tabs full-width
- Bottom bar fixo
- Swipe-friendly

### **Tablet (768px - 1024px):**
- Grid: 3 colunas
- Mais espaço para cards

### **Desktop (> 1024px):**
- Grid: 4 colunas
- Hover effects mais pronunciados
- Layout mais espaçado

---

## 🛡️ Validações

### **Antes de Adicionar ao Carrinho:**

```typescript
if (selectedFlavors.length === 0) {
    alert('⚠️ Escolha pelo menos 1 sabor!');
    return;
}

// Validação de required groups feita no backend
// via calculateMixPrice()
```

---

## 🎁 Combos Prontos (Hardcoded)

```typescript
const readyMadeCombos = [
    {
        name: '🍓 Combo Frutas Vermelhas',
        flavors: ['Morango', 'Framboesa'],
        toppings: ['Granulado Colorido', 'Chantilly'],
        calda: 'Calda de Morango',
        price: 18.00
    },
    // ... mais 2 combos
];
```

**Nota:** Podem ser convertidos para vir do backend futuramente!

---

## 🔮 Melhorias Futuras

### **Backend Integration:**
- [ ] Carregar combos prontos do Google Sheets
- [ ] Validação de required groups no frontend
- [ ] Cache de dados do mix

### **UX Enhancements:**
- [ ] Animações de transição entre tabs
- [ ] Preview visual do mix montado
- [ ] Sugestões de combinações
- [ ] Histórico de mixs favoritos

### **Features:**
- [ ] Salvar mix personalizado
- [ ] Compartilhar mix via link
- [ ] Avaliar mix após compra
- [ ] Filtros de sabores (frutas, chocolate, etc)

---

## 📦 Uso no App

### **No `app/page.tsx`:**

```typescript
const [currentView, setCurrentView] = useState('home');
const [activeMixId, setActiveMixId] = useState<string | null>(null);

// Ao clicar em produto Mix:
const handleProductClick = (product: any) => {
    if (product.isMix) {
        setActiveMixId(product.id);
        setCurrentView('mixGourmet');
    }
};

// No render:
{currentView === 'mixGourmet' && activeMixId && (
    <MixGourmetView
        mixId={activeMixId}
        onBack={() => setCurrentView('home')}
        onAddToCart={handleAddToCart}
    />
)}
```

---

## ✅ Checklist de Implementação

- [x] Componente criado
- [x] Tipos TypeScript definidos
- [x] Design system aplicado
- [x] Validações implementadas
- [x] Cálculo de preço correto
- [ ] Integrado no app/page.tsx
- [ ] Testado com dados reais
- [ ] Backend getMixWithFlavorAndAdditions funcionando

---

## 🎨 Screenshots

### **Tab "Monte o Seu":**
- Seleção de sabores com visual feedback
- Cards de adicionais organizados por grupo
- Bottom bar com total e botão

### **Tab "Combos Prontos":**
- Cards de combos pré-definidos
- Botão "Quero esse!" para compra rápida

### **Resumo Flutuante:**
- Painel slide-in from bottom
- Breakdown detalhado de preço
- Contador de quantidade
- Botão de adicionar ao carrinho

---

**Criado em:** 18/12/2025  
**Status:** ✅ Pronto para integração  
**Compatível com:** Next.js 14 + React 18 + TypeScript + Tailwind CSS
