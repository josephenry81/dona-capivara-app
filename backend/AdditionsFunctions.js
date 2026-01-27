// ======================================================
// ADDITIONS SYSTEM - BACKEND FUNCTIONS
// To be integrated into Code.js
// ======================================================

/**
 * Get product with its addition groups and options
 * @param {string} productId - ID of the product
 * @returns {object} Product with addition_groups array
 */
function getProductWithAdditions(productId) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const produtosSheet = ss.getSheetByName('GELADINHOS');
    const gruposSheet = ss.getSheetByName('GRUPOS_ADICIONAIS');
    const adicionaisSheet = ss.getSheetByName('ADICIONAIS');

    // Get product data
    const produtos = sheetToJSON(produtosSheet);
    const produto = produtos.find(p => String(p.ID_Geladinho).trim() === String(productId).trim());

    if (!produto) {
        return { error: 'Produto não encontrado' };
    }

    // Check if product has additions enabled
    if (!produto.Tem_Adicionais || String(produto.Tem_Adicionais).toUpperCase() !== 'TRUE') {
        return produto; // Return product without additions
    }

    // Get addition groups for this product
    const grupoIds = String(produto.IDs_Grupos_Adicionais || '')
        .split(',')
        .map(id => id.trim())
        .filter(id => id);

    if (grupoIds.length === 0) {
        return produto; // No groups configured
    }

    const grupos = sheetToJSON(gruposSheet)
        .filter(g => grupoIds.includes(String(g.ID_Grupo).trim()) && String(g.Ativo).toUpperCase() === 'TRUE')
        .sort((a, b) => Number(a.Ordem) - Number(b.Ordem));

    // Get additions for each group
    const adicionais = sheetToJSON(adicionaisSheet);

    produto.addition_groups = grupos.map(grupo => ({
        id: grupo.ID_Grupo,
        name: grupo.Nome_Grupo,
        type: grupo.Tipo,
        required: Number(grupo.Min) > 0,
        min: Number(grupo.Min),
        max: Number(grupo.Max),
        order: Number(grupo.Ordem),
        options: adicionais
            .filter(a => String(a.ID_Grupo).trim() === String(grupo.ID_Grupo).trim())
            .sort((a, b) => Number(a.Ordem) - Number(b.Ordem))
            .map(a => ({
                id: a.ID_Adicional,
                sku: a.SKU,
                name: a.Nome,
                price: Number(a.Preco),
                stock_status: a.Status_Estoque,
                image_url: a.Imagem_URL || null,
                order: Number(a.Ordem)
            }))
    }));

    return produto;
}

/**
 * Validate additions selection and calculate price
 * @param {object} data - { productId, selectedAdditions, quantity }
 * @returns {object} Validation result with calculated prices
 */
function validateAndCalculatePrice(data) {
    const { productId, selectedAdditions, quantity } = data;

    const produto = getProductWithAdditions(productId);

    if (produto.error) {
        return { success: false, error: produto.error };
    }

    let additionsTotal = 0;
    const validatedAdditions = [];

    // If product doesn't have additions, just calculate base price
    if (!produto.addition_groups || produto.addition_groups.length === 0) {
        const basePrice = Number(produto.Preco_Venda);
        return {
            success: true,
            base_price: basePrice,
            additions_subtotal: 0,
            unit_price: basePrice,
            quantity: quantity,
            total_price: basePrice * quantity,
            validated_additions: []
        };
    }

    // Validate each selected addition
    for (const selection of selectedAdditions || []) {
        const grupo = produto.addition_groups.find(g => g.id === selection.group_id);
        if (!grupo) {
            return { success: false, error: `Grupo ${selection.group_id} não encontrado` };
        }

        const opcao = grupo.options.find(o => o.id === selection.option_id);
        if (!opcao) {
            return { success: false, error: `Opção ${selection.option_id} não encontrada` };
        }

        // Check stock status
        if (opcao.stock_status === 'out_of_stock') {
            return {
                success: false,
                error: `${opcao.name} está indisponível`
            };
        }

        additionsTotal += opcao.price;
        validatedAdditions.push({
            group_id: grupo.id,
            group_name: grupo.name,
            option_id: opcao.id,
            option_sku: opcao.sku,
            option_name: opcao.name,
            option_price: opcao.price
        });
    }

    // Validate group constraints (min/max)
    for (const grupo of produto.addition_groups) {
        const selectionsInGroup = validatedAdditions.filter(a => a.group_id === grupo.id);

        // Check minimum
        if (grupo.min > 0 && selectionsInGroup.length < grupo.min) {
            return {
                success: false,
                error: `${grupo.name} requer pelo menos ${grupo.min} seleção(ões)`
            };
        }

        // Check maximum
        if (grupo.max < 99 && selectionsInGroup.length > grupo.max) {
            return {
                success: false,
                error: `${grupo.name} permite no máximo ${grupo.max} seleção(ões)`
            };
        }
    }

    const basePrice = Number(produto.Preco_Venda);
    const unitPrice = basePrice + additionsTotal;
    const totalPrice = unitPrice * quantity;

    return {
        success: true,
        base_price: basePrice,
        additions_subtotal: additionsTotal,
        unit_price: unitPrice,
        quantity: quantity,
        total_price: totalPrice,
        validated_additions: validatedAdditions
    };
}
