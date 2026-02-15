// ============================================
// BACKEND CODE - ADICIONAR AO Code.js
// ============================================

// INSTRUÇÕES:
// 1. Criar nova sheet "AVALIACOES" no Google Sheets com as colunas:
//    A: ID_Avaliacao | B: ID_Cliente | C: ID_Produto | D: ID_Venda
//    E: Nome_Cliente | F: Rating | G: Comentario | H: Data_Avaliacao | I: Status

// 2. ADICIONAR estas funções no Code.js:

/**
 * Criar nova avaliação de produto
 * Valida se o cliente comprou o produto antes de permitir avaliação
 */
function createReview(data) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('AVALIACOES');

    if (!sheet) {
        return { success: false, message: 'Sheet AVALIACOES não encontrada' };
    }

    // Validação: Cliente comprou o produto?
    const vendasSheet = ss.getSheetByName('VENDAS');
    const vendas = sheetToJSON(vendasSheet);

    const hasOrder = vendas.some(v => {
        if (v.ID_Cliente !== data.customerId) return false;

        try {
            const items = JSON.parse(v.ItemsJSON || '[]');
            return items.some(item => item.id === data.productId);
        } catch (e) {
            return false;
        }
    });

    if (!hasOrder) {
        return {
            success: false,
            message: 'Você precisa comprar este produto para avaliá-lo'
        };
    }

    // Verificar se já avaliou
    const avaliacoes = sheetToJSON(sheet);
    const jaAvaliou = avaliacoes.some(a => a.ID_Cliente === data.customerId && a.ID_Produto === data.productId);

    if (jaAvaliou) {
        return {
            success: false,
            message: 'Você já avaliou este produto'
        };
    }

    // Criar avaliação
    const id = Utilities.getUuid();
    sheet.appendRow([
        id,
        data.customerId,
        data.productId,
        data.orderId || '',
        data.customerName,
        data.rating,
        data.comment || '',
        new Date(),
        'Pendente' // Status inicial: Pendente (Admin precisa aprovar)
    ]);

    return { success: true, reviewId: id };
}

/**
 * Obter avaliações aprovadas de um produto
 */
function getProductReviews(productId) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('AVALIACOES');

    if (!sheet) {
        return [];
    }

    const reviews = sheetToJSON(sheet);

    return reviews
        .filter(r => r.ID_Produto === productId && r.Status === 'Aprovada')
        .map(r => ({
            id: r.ID_Avaliacao,
            customerName: r.Nome_Cliente,
            rating: Number(r.Rating),
            comment: r.Comentario,
            date: r.Data_Avaliacao
        }));
}

/**
 * Obter todas as avaliações pendentes (para Admin)
 */
function getPendingReviews(adminKey) {
    if (adminKey !== ADMIN_KEY) {
        return { error: 'Unauthorized' };
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('AVALIACOES');

    if (!sheet) {
        return [];
    }

    const reviews = sheetToJSON(sheet);

    return reviews
        .filter(r => r.Status === 'Pendente')
        .map(r => ({
            id: r.ID_Avaliacao,
            productId: r.ID_Produto,
            customerName: r.Nome_Cliente,
            rating: Number(r.Rating),
            comment: r.Comentario,
            date: r.Data_Avaliacao,
            status: r.Status
        }));
}

/**
 * Atualizar status de uma avaliação (Aprovar/Rejeitar)
 */
function updateReviewStatus(adminKey, reviewId, newStatus) {
    if (adminKey !== ADMIN_KEY) {
        return { success: false, message: 'Unauthorized' };
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('AVALIACOES');
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === reviewId) {
            sheet.getRange(i + 1, 9).setValue(newStatus); // Coluna I (Status)
            return { success: true };
        }
    }

    return { success: false, message: 'Review not found' };
}

// ============================================
// 3. ADICIONAR NO doPost (dentro do switch/if):
// ============================================

/*
if (action === 'createReview') {
  result = createReview(data);
}
*/

// ============================================
// 4. ADICIONAR NO doGet (dentro do switch/if):
// ============================================

/*
if (action === 'getReviews') {
  const productId = e.parameter.productId;
  result = getProductReviews(productId);
}

if (action === 'getPendingReviews') {
  const adminKey = e.parameter.adminKey;
  result = getPendingReviews(adminKey);
}
*/

// ============================================
// 5. ADICIONAR NO doPost para moderação:
// ============================================

/*
if (action === 'updateReviewStatus') {
  result = updateReviewStatus(data.adminKey, data.reviewId, data.newStatus);
}
*/
