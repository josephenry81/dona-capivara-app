/* eslint-disable @typescript-eslint/no-require-imports */
const https = require('https');

const API_URL =
    'https://script.google.com/macros/s/AKfycbznSCNTIaoc9h_1UzcKLx32WDHgia49TNMhwXpszCnB28htbi9zAWN8DSZewKvq_Odr_A/exec';
const ADMIN_KEY = 'Jxd701852@';

function callAction(action, params = {}) {
    return new Promise((resolve, reject) => {
        let url = `${API_URL}?action=${action}&adminKey=${ADMIN_KEY}`;
        Object.keys(params).forEach(key => (url += `&${key}=${params[key]}`));

        https
            .get(url, res => {
                if (res.statusCode === 302) {
                    https.get(res.headers.location, res2 => {
                        let body = '';
                        res2.on('data', c => (body += c));
                        res2.on('end', () => resolve(JSON.parse(body)));
                    });
                    return;
                }
                let body = '';
                res.on('data', chunk => (body += chunk));
                res.on('end', () => resolve(JSON.parse(body)));
            })
            .on('error', reject);
    });
}

async function verify() {
    console.log('--- VERIFICANDO ADMIN DASHBOARD PRO ---');

    try {
        console.log('1. Testando getDashboardStats...');
        const stats = await callAction('getDashboardStats');
        console.log('✅ Stats recebidos!');
        console.log('- Total Revenue:', stats.totalRevenue);
        console.log('- Total Profit:', stats.totalProfit);
        console.log('- Monthly Goals:', stats.goals);
        console.log('- Heatmap entries:', stats.heatmap?.length);
        console.log('- Peak Hours entries:', stats.peakHours?.length);

        if (stats.totalProfit !== undefined && stats.goals) {
            console.log('\n🚀 SUCESSO: O backend está retornando os novos campos de Analytics!');
        } else {
            console.log(
                '\n⚠️ AVISO: Alguns campos novos não foram encontrados. Verifique se o Code.gs foi salvo corretamente.'
            );
        }

        console.log('\n2. Testando getExportData...');
        const exportData = await callAction('getExportData');
        if (exportData.vendas && Array.isArray(exportData.vendas)) {
            console.log(`✅ ExportData recebido com ${exportData.vendas.length} vendas.`);
        } else {
            console.log('❌ Erro no formato do ExportData.');
        }
    } catch (e) {
        console.error('❌ Erro durante a verificação:', e.message);
    }
}

verify();
