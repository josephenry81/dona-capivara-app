# Google Sheets Setup Guide - Additions System

## Required Manual Steps

Before deploying the updated backend, you must create the new sheets and columns in your Google Sheets document.

---

## Step 1: Create GRUPOS_ADICIONAIS Sheet

1. Open your Google Sheets document
2. Create a new sheet named **GRUPOS_ADICIONAIS**
3. Add the following column headers in Row 1:

```
ID_Grupo | Nome_Grupo | Tipo | Min | Max | Ordem | Ativo
```

4. Add sample data:

```
GRP-001 | Escolha sua Calda | single | 0 | 1 | 1 | TRUE
GRP-002 | Adicione Toppings | multiple | 0 | 99 | 2 | TRUE
```

---

## Step 2: Create ADICIONAIS Sheet

1. In the same document, create a new sheet named **ADICIONAIS**
2. Add the following column headers in Row 1:

```
ID_Adicional | ID_Grupo | SKU | Nome | Preco | Status_Estoque | Imagem_URL | Ordem
```

3. Add sample data for caldas (Grupo GRP-001):

```
ADD-001 | GRP-001 | CALDA-CH | Calda de Chocolate | 2.00 | available | | 1
ADD-002 | GRP-001 | CALDA-MO | Calda de Morango | 2.00 | available | | 2
ADD-003 | GRP-001 | CALDA-CR | Calda de Caramelo | 2.50 | available | | 3
```

4. Add sample data for toppings (Grupo GRP-002):

```
ADD-004 | GRP-002 | TOPP-GRA | Granulado | 1.00 | available | | 1
ADD-005 | GRP-002 | TOPP-CON | Confeitos Coloridos | 1.50 | available | | 2
ADD-006 | GRP-002 | TOPP-PAC | Paçoca Triturada | 1.50 | available | | 3
```

---

## Step 3: Update GELADINHOS Sheet

1. Go to the **GELADINHOS** sheet
2. Add two new columns at the end (after existing columns):

```
Tem_Adicionais | IDs_Grupos_Adicionais
```

3. For all existing products, set **Tem_Adicionais = FALSE**
4. Choose ONE product to test with and update its row:
   - Set `Tem_Adicionais = TRUE`
   - Set `IDs_Grupos_Adicionais = GRP-001,GRP-002`

**Example:** If testing with "Geladão Tequiloka Limão":
```
Tem_Adicionais: TRUE
IDs_Grupos_Adicionais: GRP-001,GRP-002
```

---

## Step 4: Deploy Backend

1. Open Google Apps Script Editor
2. Verify **Code.js** has the new functions (scroll to bottom)
3. Click **Deploy > New deployment**
4. Select **Web app**
5. Set:
   - Description: "V15 - Additions System"
   - Execute as: "Me"
   - Who has access: "Anyone"
6. Click **Deploy**
7. Copy the **Web app URL**
8. Update your `.env.local` file with the new URL:

```
NEXT_PUBLIC_GOOGLE_SHEET_API_URL=<new-url-here>
```

---

## Step 5: Test Backend

Test the new endpoints using the Apps Script editor or browser:

### Test getProductWithAdditions:
```
https://script.google.com/.../exec?action=getProductWithAdditions&productId=<your-test-product-id>
```

**Expected Response:**
```json
{
  "ID_Geladinho": "...",
  "Nome_Geladinho": "Geladão Tequiloka Limão",
  "Preco_Venda": 7.50,
  "Tem_Adicionais": "TRUE",
  "addition_groups": [
    {
      "id": "GRP-001",
      "name": "Escolha sua Calda",
      "type": "single",
      "required": false,
      "min": 0,
      "max": 1,
      "order": 1,
      "options": [
        {
          "id": "ADD-001",
          "sku": "CALDA-CH",
          "name": "Calda de Chocolate",
          "price": 2,
          "stock_status": "available",
          "image_url": null,
          "order": 1
        },
        ...
      ]
    },
    ...
  ]
}
```

---

## Column Descriptions

### GRUPOS_ADICIONAIS
- `ID_Grupo`: Unique identifier (e.g., GRP-001, GRP-002)
- `Nome_Grupo`: Display name shown to customer
- `Tipo`: "single" (radio) or "multiple" (checkbox)
- `Min`: Minimum required selections (0 = optional)
- `Max`: Maximum allowed selections (1 for single, 99 for unlimited multiple)
- `Ordem`: Display order (lower numbers first)
- `Ativo`: TRUE to enable, FALSE to disable

### ADICIONAIS
- `ID_Adicional`: Unique identifier (e.g., ADD-001)
- `ID_Grupo`: Which group this belongs to
- `SKU`: Stock keeping unit code for reference
- `Nome`: Display name
- `Preco`: Price in reais (numeric)
- `Status_Estoque`: "available" or "out_of_stock"
- `Imagem_URL`: Optional image URL (can be empty)
- `Ordem`: Display order within group

### GELADINHOS (new columns)
- `Tem_Adicionais`: TRUE if product supports additions, FALSE otherwise
- `IDs_Grupos_Adicionais`: Comma-separated list of group IDs (e.g., "GRP-001,GRP-002")

---

## Verification Checklist

- [ ] GRUPOS_ADICIONAIS sheet created with correct columns
- [ ] ADICIONAIS sheet created with correct columns
- [ ] GELADINHOS sheet has new columns
- [ ] At least one product configured with Tem_Adicionais=TRUE
- [ ] Backend deployed as new version
- [ ] .env.local updated with new backend URL
- [ ] Endpoint test successful (returns addition_groups)
