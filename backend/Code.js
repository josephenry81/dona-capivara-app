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
      // Handle Login
      result = loginCustomer(data);
    } else if (action === 'createCustomer') {
      // Handle Register
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
  // Filter for active products
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

function createOrder(orderData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const vendasSheet = ss.getSheetByName('VENDAS');
  const geladinhosSheet = ss.getSheetByName('GELADINHOS');

  const idVenda = Utilities.getUuid();
  const timestamp = new Date();

  // Append to VENDAS
  // Assuming orderData contains keys that match VENDAS columns or we just dump the JSON
  // For a proper relational structure, we usually have VENDAS (Header) and ITENS_VENDA (Details)
  // But based on the prompt "Append a new row to the 'VENDAS' tab", I'll assume a flat structure or a summary.
  // However, to update inventory, we need the items.
  // Let's assume orderData has { items: [{id: '...', quantity: 1}], total: 100, customerId: '...' }

  // We'll store the main order info. Adjust columns as needed.
  // Columns: ID_Venda, Data, Cliente, Total, ItemsJSON (simplified for single table)
  vendasSheet.appendRow([
    idVenda,
    timestamp,
    orderData.customerId || '',
    orderData.customerName || '',
    orderData.total || 0,
    JSON.stringify(orderData.items)
  ]);

  // Update Inventory
  const geladinhosData = geladinhosSheet.getDataRange().getValues();
  const headers = geladinhosData[0];
  const idColIndex = headers.indexOf('ID_Geladinho');
  const stockColIndex = headers.indexOf('Estoque_Atual');

  if (idColIndex === -1 || stockColIndex === -1) {
    throw new Error('Column ID_Geladinho or Estoque_Atual not found');
  }

  orderData.items.forEach(item => {
    // Find the row with the matching ID
    for (let i = 1; i < geladinhosData.length; i++) {
      if (geladinhosData[i][idColIndex] == item.id) {
        const currentStock = geladinhosData[i][stockColIndex];
        const newStock = currentStock - item.quantity;
        geladinhosSheet.getRange(i + 1, stockColIndex + 1).setValue(newStock);
        break;
      }
    }
  });

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

  // Find customer by Phone and Password
  // Note: In production, passwords should be hashed. This is a simple demo.
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

  // Check if already exists
  const exists = customers.find(c => c.Telefone == data.phone);
  if (exists) {
    return { success: false, message: 'Telefone já cadastrado' };
  }

  const id = Utilities.getUuid();
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  // Append Row: ID_Cliente, Nome, Telefone, Senha, Pontos_Fidelidade, Codigo_Convite
  // Adjust order based on your actual sheet columns. Assuming standard order.
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
