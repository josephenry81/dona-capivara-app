# 🎨 Sistema de Banner Configurável via Banco de Dados

## 📋 Visão Geral

Este documento explica como trocar o banner padrão do aplicativo através do banco de dados (Google Sheets), sem precisar alterar o código.

## 🎯 Como Funciona Atualmente

**Localização do código**: `components/views/HomeView.tsx` (linhas 88-107)

O sistema usa uma lógica simples:

```typescript
banners={banners && banners.length > 0 ? banners : [banner_padrão]}
```

- **Se houver banners do backend**: Exibe os banners do Google Sheets
- **Se NÃO houver banners**: Exibe o banner padrão (clube-capivara-banner.jpg)

## 🔧 Opção 1: Adicionar Banner Padrão na Planilha BANNERS

### Passo 1: Configurar no Google Sheets

Na sua planilha **BANNERS**, adicione uma nova linha:

| ID            | Titulo                             | Subtitulo                                            | Imagem                       | CTA_Texto    | Ordem | Ativo | Tipo   |
| ------------- | ---------------------------------- | ---------------------------------------------------- | ---------------------------- | ------------ | ----- | ----- | ------ |
| banner-padrao | Ganhe Pontos Toda Vez Que Comprar! | Cada R$1 vira ponto. Troque por descontos e brindes. | https://drive.google.com/... | Ver Cardápio | 999   | TRUE  | PADRAO |

**Importante**:

- Use `Ordem: 999` para garantir que apareça por último
- Marque `Ativo: TRUE`
- Use `Tipo: PADRAO` para identificar facilmente

### Passo 2: Fazer Upload da Imagem

1. Faça upload da imagem no Google Drive
2. Configure o compartilhamento como "Qualquer pessoa com o link pode visualizar"
3. Copie o link e cole na coluna `Imagem`

### Passo 3: Pronto!

O sistema já vai carregar automaticamente do banco de dados. Não precisa alterar código!

---

## 🔧 Opção 2: Criar Endpoint Separado (Mais Avançado)

Se você quiser ter um controle mais específico, pode criar um endpoint separado no Google Apps Script.

### Passo 1: Criar nova aba no Google Sheets

Crie uma aba chamada **CONFIG_BANNER_PADRAO** com as colunas:

| Chave     | Valor                              |
| --------- | ---------------------------------- |
| imagem    | https://drive.google.com/...       |
| titulo    | Ganhe Pontos Toda Vez Que Comprar! |
| subtitulo | Cada R$1 vira ponto...             |
| cta_texto | Ver Cardápio                       |
| ativo     | TRUE                               |

### Passo 2: Adicionar função no Google Apps Script

```javascript
function getBannerPadrao() {
    try {
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CONFIG_BANNER_PADRAO');
        const data = sheet.getDataRange().getValues();

        const config = {};
        for (let i = 1; i < data.length; i++) {
            config[data[i][0]] = data[i][1];
        }

        if (config.ativo !== 'TRUE') {
            return ContentService.createTextOutput(
                JSON.stringify({
                    success: false,
                    message: 'Banner padrão desativado'
                })
            ).setMimeType(ContentService.MimeType.JSON);
        }

        return ContentService.createTextOutput(
            JSON.stringify({
                success: true,
                banner: {
                    id: 'default-clube-capivara',
                    image: config.imagem,
                    title: config.titulo,
                    subtitle: config.subtitulo,
                    ctaText: config.cta_texto
                }
            })
        ).setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
        return ContentService.createTextOutput(
            JSON.stringify({
                success: false,
                error: error.toString()
            })
        ).setMimeType(ContentService.MimeType.JSON);
    }
}
```

### Passo 3: Adicionar rota no doGet

```javascript
function doGet(e) {
    const action = e.parameter.action;

    // ... suas rotas existentes ...

    if (action === 'getBannerPadrao') {
        return getBannerPadrao();
    }

    // ... resto do código ...
}
```

### Passo 4: Atualizar o HomeView.tsx

```typescript
// Adicionar no início do componente
const [defaultBanner, setDefaultBanner] = useState(null);

// Adicionar useEffect para carregar banner padrão
useEffect(() => {
  const loadDefaultBanner = async () => {
    try {
      const response = await fetch(`${API_URL}?action=getBannerPadrao`);
      const data = await response.json();
      if (data.success) {
        setDefaultBanner(data.banner);
      }
    } catch (error) {
      console.error('Erro ao carregar banner padrão:', error);
    }
  };

  loadDefaultBanner();
}, []);

// Usar no BannerCarousel
<BannerCarousel
  banners={banners && banners.length > 0 ? banners : (defaultBanner ? [defaultBanner] : [
    {
      id: 'default-clube-capivara',
      image: '/clube-capivara-banner.jpg',
      title: 'Ganhe Pontos Toda Vez Que Comprar!',
      subtitle: 'Cada R$1 vira ponto. Troque por descontos e brindes.',
      ctaText: 'Ver Cardápio'
    }
  ])}
/>
```

---

## 🎨 Configurações de Exibição (Já Implementadas)

As seguintes configurações já estão otimizadas e **não precisam ser alteradas**:

### Mobile

- **Aspect Ratio**: 16:9
- **Object Fit**: `cover` (preenche sem bordas)
- **Background**: Amarelo (#FBBF24) para harmonizar

### Desktop

- **Aspect Ratio**: 16:9
- **Object Fit**: `cover`
- **Qualidade**: 90%

### Comportamento do Texto Overlay

- **Banners locais** (começam com `/`): Texto oculto (imagem já tem texto integrado)
- **Banners do backend** (URLs completas): Texto exibido normalmente

---

## 📝 Recomendações de Imagem

Para melhor resultado visual:

- **Dimensões ideais**: 1920x1080 (16:9)
- **Formato**: JPG (menor tamanho) ou PNG (se precisar transparência)
- **Tamanho máximo**: 500KB (para carregamento rápido)
- **Design**: Coloque informações importantes no centro (evite cantos)

---

## ✅ Checklist de Implementação

### Opção 1 (Mais Simples - Recomendada)

- [ ] Adicionar linha na planilha BANNERS
- [ ] Fazer upload da imagem no Google Drive
- [ ] Configurar compartilhamento público
- [ ] Copiar link da imagem
- [ ] Testar no aplicativo

### Opção 2 (Mais Controle)

- [ ] Criar aba CONFIG_BANNER_PADRAO
- [ ] Adicionar função getBannerPadrao no Apps Script
- [ ] Adicionar rota no doGet
- [ ] Deploy do Apps Script
- [ ] Atualizar HomeView.tsx
- [ ] Testar no aplicativo

---

## 🆘 Troubleshooting

### Banner não aparece

1. Verifique se a coluna `Ativo` está como `TRUE`
2. Confirme que o link da imagem está público
3. Teste o link da imagem diretamente no navegador

### Imagem com bordas brancas no mobile

- Certifique-se de que a imagem tem proporção 16:9
- Use dimensões como 1920x1080, 1280x720, etc.

### Texto sobreposto na imagem

- Se a imagem já tem texto integrado, use uma URL local (começando com `/`)
- Ou deixe os campos `title`, `subtitle` e `ctaText` vazios no banco

---

## 📞 Suporte

Se precisar de ajuda, consulte:

- `components/common/BannerCarousel.tsx` - Componente do banner
- `components/views/HomeView.tsx` - Lógica de carregamento
- Este documento para instruções detalhadas
