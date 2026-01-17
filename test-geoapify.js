const https = require('https');

// CONFIG
const GEOAPIFY_API_KEY = 'd27379dd6767460a889d57258635842f';
const STORE_LOCATION = {
    lat: -25.53427,
    lon: -49.29026
};

// Endereço de teste (Pode mudar aqui)
const TEST_ADDRESS = 'Centro Civico, Curitiba, PR';

console.log('🧪 TESTE GEOAPIFY DELIVERY');
console.log('==========================');
console.log(`📍 Loja: ${STORE_LOCATION.lat}, ${STORE_LOCATION.lon}`);
console.log(`🏠 Cliente: ${TEST_ADDRESS}`);
console.log('🔑 Key: ...' + GEOAPIFY_API_KEY.slice(-4));
console.log('\nProcessando...');

// 1. Geocoding
function getCoordinates(address) {
    return new Promise((resolve, reject) => {
        const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(address)}&apiKey=${GEOAPIFY_API_KEY}&limit=1`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (!json.features || json.features.length === 0) resolve(null);
                    else {
                        const [lon, lat] = json.features[0].geometry.coordinates;
                        resolve({ lat, lon });
                    }
                } catch (e) { reject(e); }
            });
        }).on('error', reject);
    });
}

// 2. Matrix
function getDistance(origin, destination) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify({
            mode: 'drive',
            sources: [{ location: [origin.lon, origin.lat] }],
            targets: [{ location: [destination.lon, destination.lat] }]
        });

        const options = {
            hostname: 'api.geoapify.com',
            path: `/v1/routematrix?apiKey=${GEOAPIFY_API_KEY}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': payload.length
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (!json.sources_to_targets) resolve(null);
                    else {
                        const meters = json.sources_to_targets[0][0].distance;
                        resolve(meters / 1000);
                    }
                } catch (e) { reject(e); }
            });
        });

        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

async function run() {
    try {
        console.log('1️⃣ Geocoding...');
        const coords = await getCoordinates(TEST_ADDRESS);
        if (!coords) {
            console.error('❌ Geocoding falhou (Endereço não encontrado)');
            return;
        }
        console.log(`✅ Coordenadas encontradas: ${coords.lat}, ${coords.lon}`);

        console.log('2️⃣ Calculando rota (Matrix)...');
        const km = await getDistance(STORE_LOCATION, coords);

        if (km === null) {
            console.error('❌ Cálculo de rota falhou');
            return;
        }

        console.log(`✅ Distância Real: ${km.toFixed(2)} km`);

        // Regra
        console.log('\n💰 CÁLCULO TX ENTREGA:');
        if (km <= 3) {
            console.log('🎉 GRÁTIS (<= 3km)');
        } else {
            console.log('💵 R$ 5,00 (> 3km)');
        }

    } catch (error) {
        console.error('❌ Erro Fatal:', error);
    }
}

run();
