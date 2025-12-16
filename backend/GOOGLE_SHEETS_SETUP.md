# Google Sheets Setup Guide - Cinema Promotion System

## Overview
This guide explains how to set up the Google Sheets structure for the Cinema Promotion System (V17.0).

## Required Sheets

### 1. CLIENTES Sheet - Add New Column

Add the following column to your existing CLIENTES sheet:

| Column | Header Name | Type | Description | Default Value |
|--------|-------------|------|-------------|---------------|
| O | `Gasto_Acumulado_Promo` | Number | Accumulated spending toward next raffle number | 0 |

**Instructions:**
1. Open your CLIENTES sheet
2. Insert a new column O (or after the last existing column)
3. Set header: `Gasto_Acumulado_Promo`
4. Set default value to `0` for all existing customers

---

### 2. SORTEIOS Sheet - Create New Sheet

Create a new sheet named **SORTEIOS** with the following structure:

| Column | Header Name | Type | Description | Example |
|--------|-------------|------|-------------|---------|
| A | `ID_Sorteio` | Text | Unique UUID for each entry | `abc123-def456` |
| B | `ID_Cliente` | Text | Customer ID reference | `CLI-12345` |
| C | `Nome_Cliente` | Text | Customer name (denormalized) | `João Silva` |
| D | `Telefone_Cliente` | Text | Customer phone | `(11) 99999-9999` |
| E | `Numero_Sorte` | Text | 6-digit raffle number | `123456` |
| F | `ID_Promo` | Text | Promotion cycle ID | `PROMO_CINEMA_2025` |
| G | `Data_Ganho` | Date | When number was awarded | `2025-12-15 20:30:00` |
| H | `Status_Sorteio` | Text | Entry status | `Ativo`, `Premiado`, `Cancelado` |
| I | `Ganhou` | Boolean | Was this number drawn? | `TRUE` / `FALSE` |
| J | `Numero_Sorteado` | Date | When drawn (if winner) | `2025-12-20 15:00:00` |
| K | `Tipo_Premio` | Text | Prize type | `Cinema`, `Cupom`, `Produto`, `Pontos` |
| L | `Valor_Premio` | Number | Prize value (if applicable) | `100` |
| M | `Codigo_Cupom` | Text | Coupon code (if prize is coupon) | `CINEMA50` |

**Instructions:**
1. Create a new sheet in your spreadsheet
2. Name it exactly: `SORTEIOS`
3. Add the headers in Row 1 exactly as shown above
4. Leave rows below empty (system will populate automatically)

---

## How It Works

### Earning Raffle Numbers

1. **Customer makes a purchase** → Order is created
2. **System checks accumulated spending**:
   - Current accumulated: R$ 10.00
   - New purchase: R$ 15.00
   - Total: R$ 25.00
3. **System awards raffle numbers**:
   - Every R$ 18.00 = 1 raffle number
   - R$ 25.00 ÷ R$ 18.00 = 1 number (with R$ 7.00 remaining)
4. **New entry created in SORTEIOS**:
   - Unique 6-digit number generated
   - Status: `Ativo`
   - Linked to customer
5. **Customer's accumulated spending updated**:
   - `Gasto_Acumulado_Promo` = R$ 25.00

### Performing a Raffle (Admin Only)

1. **Admin accesses Sorteios tab** in admin dashboard
2. **Clicks "Realizar Sorteio"** button
3. **System randomly selects** one active entry
4. **Winner's entry updated**:
   - `Ganhou` → `TRUE`
   - `Numero_Sorteado` → Current timestamp
5. **Admin awards prize** by selecting:
   - Prize type
   - Value (if applicable)
   - Coupon code (if applicable)
6. **System updates**:
   - `Status_Sorteio` → `Premiado`
   - `Tipo_Premio`, `Valor_Premio`, `Codigo_Cupom` filled
   - If prize is "Pontos", automatically added to customer account

---

## Promotion Cycle Management

### Current Promotion ID
- Default: `PROMO_CINEMA_2025`
- Defined in `PromocaoHelper.gs`

### To Create a New Promotion Cycle:
1. Change `promoId` in `PromocaoHelper.gs` line 53
2. New purchases will use the new promotion ID
3. Previous raffle numbers remain in system
4. Can run separate raffles for each promotion ID

---

## Data Validation (Optional but Recommended)

### SORTEIOS Sheet Validations:

**Column H (Status_Sorteio):**
- Data validation → List from range
- Values: `Ativo`, `Premiado`, `Cancelado`

**Column I (Ganhou):**
- Data validation → Checkbox

**Column K (Tipo_Premio):**
- Data validation → List from range
- Values: `Cinema`, `Cupom`, `Produto`, `Pontos`

---

## Testing the System

### Test Scenario 1: Customer Earns First Number
1. Create test customer with R$ 0 accumulated
2. Create order worth R$ 20.00
3. Check SORTEIOS sheet → Should have 1 new entry
4. Check CLIENTES → `Gasto_Acumulado_Promo` = R$ 20.00

### Test Scenario 2: Customer Earns Multiple Numbers
1. Customer with R$ 10.00 accumulated
2. Create order worth R$ 30.00
3. Check SORTEIOS → Should have 2 new entries (R$ 40 total ÷ R$ 18)
4. Check CLIENTES → `Gasto_Acumulado_Promo` = R$ 40.00

### Test Scenario 3: Perform Raffle
1. Ensure multiple customers have raffle numbers
2. Use admin dashboard → Sorteios tab
3. Click "Realizar Sorteio"
4. Verify winner selected
5. Award prize
6. Check SORTEIOS → Winner's status updated

---

## Troubleshooting

### Issue: Raffle numbers not being generated
**Solution:**
1. Verify SORTEIOS sheet exists and is named exactly `SORTEIOS`
2. Check column `Gasto_Acumulado_Promo` exists in CLIENTES
3. Review Apps Script logs for errors

### Issue: Duplicate raffle numbers
**Solution:**
- System automatically prevents duplicates within same promotion
- If duplicates occur, check `gerarNumeroSorte()` function logs

### Issue: Winner not being selected
**Solution:**
1. Verify at least one entry has `Status_Sorteio` = "Ativo"
2. Verify `Ganhou` = FALSE for eligible entries
3. Check promotion ID matches

---

## Maintenance

### Resetting Customer's Accumulated Spending (Manual)
1. Open CLIENTES sheet
2. Find customer row
3. Set `Gasto_Acumulado_Promo` to `0`

### Canceling a Raffle Entry
1. Open SORTEIOS sheet
2. Find entry row
3. Change `Status_Sorteio` to `Cancelado`

### Viewing All Winners
1. Open SORTEIOS sheet
2. Filter by `Ganhou` = TRUE
3. Or filter by `Status_Sorteio` = "Premiado"

---

## Security Notes

- Only admin users can access raffle management
- Customer can only view their own raffle numbers
- All raffle draws are logged with timestamps
- Prize allocation is tracked and auditable
