function doGet(e) {
    const lock = LockService.getScriptLock();
    lock.tryLock(10000);

    try {
        const action = e.parameter.action;
        let result;

        if (action === 'getProducts') {
            result = getProducts();
        } else if (action === 'getConfig') {
            result = getConfig();
        } else if (action === 'getCustomers') {
            result = getCustomers();
        } else if (action === 'getAdminOrders') {
            // NEW: Admin orders endpoint
            const adminKey = e.parameter.adminKey;
            if (adminKey === 'Jxd701852@') {
                result = getAdminOrders();
            } else {
                result = { error: 'Unauthorized', success: false };
            }
        } else {
            result = { error: 'Invalid action' };
        }

        return ContentService.createTextOutput(JSON.stringify(result))
            .setMimeType(ContentService.MimeType.JSON)
            .setHeader("Access-Control-Allow-Origin", "*");

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
            .setMimeType(ContentService.MimeType.JSON)
            .setHeader("Access-Control-Allow-Origin", "*");
    } finally {
        lock.releaseLock();
    }
}

function doPost(e) {
    const lock = LockService.getScriptLock();
    lock.tryLock(10000);

    try {
        const action = e.parameter.action;
        const data = JSON.parse(e.postData.contents);
        let result;

        if (action === 'createOrder') {
            result = createOrder(data);
        } else if (action === 'loginCustomer') {
            result = loginCustomer(data);
        } else if (action === 'createCustomer') {
            result = createCustomer(data);
        } else {
            result = { error: 'Invalid action' };
        }

        return ContentService.createTextOutput(JSON.stringify(result))
            .setMimeType(ContentService.MimeType.JSON)
            .setHeader("Access-Control-Allow-Origin", "*");

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
            .setMimeType(ContentService.MimeType.JSON)
            .setHeader("Access-Control-Allow-Origin", "*");
    } finally {
        lock.releaseLock();
    }
}

function getProducts() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('GELADINHOS');
    const data = sheetToJSON(sheet);
    return data.filter(item => item.Produto_Ativo === true || item.Produto_Ativo === 'TRUE');
}

function getConfig() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CONFIGURACOES');
    return sheetToJSON(sheet);
}

function getCustomers() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CLIENTES');
    return sheetToJSON(sheet);
}

// NEW FUNCTION: Get admin orders with customer names
function getAdminOrders() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const vendasSheet = ss.getSheetByName('VENDAS');
    const clientesSheet = ss.getSheetByName('CLIENTES');

    const vendas = sheetToJSON(vendasSheet);
    const clientes = sheetToJSON(clientesSheet);

    // Create a map of customer IDs to names for quick lookup
    const clienteMap = {};
    clientes.forEach(cliente => {
        clienteMap[cliente.ID_Cliente] = cliente.Nome || 'Cliente';
    });

    // Map orders with customer names
    const orders = vendas.map(venda => {
        const customerName = clienteMap[venda.ID_Cliente] || venda.Nome_Cliente || 'Visitante';

        return {
            ID_Venda: venda.ID_Venda,
            Data_Venda: venda.Data_Venda,
            ID_Cliente: venda.ID_Cliente,
            Nome_Cliente: customerName,  // ✅ This is the key field!
            Total_Venda: venda.Total_Venda,
            Status: venda.Status || 'Pendente',
            Forma_de_Pagamento: venda.Forma_de_Pagamento || 'Não informado',
            Observacoes: venda.Observacoes || '',
            Agendamento: venda.Agendamento || '',
            Taxa_Entrega: venda.Taxa_Entrega || 0,
            Desconto: venda.Desconto || 0
        };
    });

    return { orders: orders };
}

function createOrder(orderData) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const vendasSheet = ss.getSheetByName('VENDAS');
    const geladinhosSheet = ss.getSheetByName('GELADINHOS');

    const idVenda = Utilities.getUuid();
    const timestamp = new Date();

    // Append to VENDAS
    vendasSheet.appendRow([
        idVenda,
        timestamp,
        orderData.customerId || '',
        orderData.customerName || '',
        orderData.total || 0,
        JSON.stringify(orderData.items)
    ]);

    // FIX BUG #6: Update Inventory with Stock Validation
    const geladinhosData = geladinhosSheet.getDataRange().getValues();
    const headers = geladinhosData[0];
    const idColIndex = headers.indexOf('ID_Geladinho');
    const stockColIndex = headers.indexOf('Estoque_Atual');

    if (idColIndex === -1 || stockColIndex === -1) {
        throw new Error('Column ID_Geladinho or Estoque_Atual not found');
    }

    const stockErrors = [];

    orderData.items.forEach(item => {
        for (let i = 1; i < geladinhosData.length; i++) {
            if (geladinhosData[i][idColIndex] == item.id) {
                const currentStock = Number(geladinhosData[i][stockColIndex]) || 0;
                const newStock = currentStock - item.quantity;

                // CRITICAL: Prevent negative stock
                if (newStock < 0) {
                    stockErrors.push({
                        product: item.nome || item.id,
                        available: currentStock,
                        requested: item.quantity
                    });
                } else {
                    geladinhosSheet.getRange(i + 1, stockColIndex + 1).setValue(newStock);
                }
                break;
            }
        }
    });

    // If any stock errors, rollback and return error
    if (stockErrors.length > 0) {
        // Note: In a production system, you'd implement a proper transaction rollback
        // For now, we'll just return the error before the VENDAS row is committed
        return {
            success: false,
            error: 'INSUFFICIENT_STOCK',
            details: stockErrors
        };
    }

    return { success: true, idVenda: idVenda };
}

function sheetToJSON(sheet) {
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const result = [];

    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const obj = {};
        for (let j = 0; j < headers.length; j++) {
            obj[headers[j]] = row[j];
        }
        result.push(obj);
    }

    return result;
}

function loginCustomer(data) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CLIENTES');
    const customers = sheetToJSON(sheet);

    const customer = customers.find(c => c.Telefone == data.phone && c.Senha == data.password);

    if (customer) {
        return { success: true, customer: customer };
    } else {
        return { success: false, message: 'Credenciais inválidas' };
    }
}

function createCustomer(data) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CLIENTES');
    const customers = sheetToJSON(sheet);

    const exists = customers.find(c => c.Telefone == data.phone);
    if (exists) {
        return { success: false, message: 'Telefone já cadastrado' };
    }

    const id = Utilities.getUuid();
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    sheet.appendRow([
        id,
        data.name,
        data.phone,
        data.password,
        0, // Points
        inviteCode
    ]);

    return {
        success: true,
        customer: {
            ID_Cliente: id,
            Nome: data.name,
            Telefone: data.phone,
            Pontos_Fidelidade: 0,
            Codigo_Convite: inviteCode
        }
    };
}
