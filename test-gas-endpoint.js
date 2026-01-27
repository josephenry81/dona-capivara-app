/* eslint-disable @typescript-eslint/no-require-imports */
const https = require('https');

const API_URL =
    'https://script.google.com/macros/s/AKfycbxsShwfocez3scNzHeoIn0vaX4-3oOHGajiVT_KlCoOJsirpxTaC-sGkHMObi3R7BtxoA/exec';

function testEndpoint(label, data) {
    return new Promise((resolve, reject) => {
        const url = `${API_URL}?action=calculateDelivery`;
        const payload = JSON.stringify(data);

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': payload.length
            }
        };

        const req = https.request(url, options, res => {
            let body = '';
            res.on('data', chunk => (body += chunk));
            res.on('end', () => {
                // GAS redireciona (302) às vezes, mas fetch segue. https.request não segue redirect automaticamente se for cross-domain auth,
                // mas para exec web app anonimo costuma ser 200 direto ou 302 para conteúdo.
                // Se receber 302, precisamos seguir.
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    console.log(`Checking Redirect for ${label}...`);
                    https.get(res.headers.location, res2 => {
                        let body2 = '';
                        res2.on('data', c => (body2 += c));
                        res2.on('end', () => {
                            resolve({ label, status: res2.statusCode, body: body2 });
                        });
                    });
                    return;
                }
                resolve({ label, status: res.statusCode, body });
            });
        });

        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

async function run() {
    console.log('Testing GAS Endpoint...');

    // Test FAR
    try {
        const resFar = await testEndpoint('FAR (Centro)', {
            deliveryType: 'FAR',
            addressData: { rua: 'Centro Civico', numero: '1', cep: '80530908', bairro: 'Centro Civico' }
        });
        console.log(`\n[${resFar.label}] Status: ${resFar.status}`);
        console.log('Body:', resFar.body.substring(0, 500)); // Limit output
    } catch (e) {
        console.error('Error FAR:', e);
    }

    // Test NEAR
    try {
        const resNear = await testEndpoint('NEAR (Pinheirinho)', {
            deliveryType: 'NEIGHBOR',
            addressData: { rua: 'Rua Reinaldo Stocco', numero: '300', cep: '81820020', bairro: 'Pinheirinho' }
        });
        console.log(`\n[${resNear.label}] Status: ${resNear.status}`);
        console.log('Body:', resNear.body.substring(0, 500));
    } catch (e) {
        console.error('Error NEAR:', e);
    }
}

run();
