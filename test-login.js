// Using global fetch
// Actually, standard node 18+ has fetch. I'll assume node 18+.

const API_URL = 'https://script.google.com/macros/s/AKfycbzYKa4938hs11o5whaK-ZgKyWNd-4Bfu3AFoN-9miMHmz_kcSmxX3Eyql_1iVnfaRX-OA/exec';

async function testMaria() {
    // Register Maria Teste first
    console.log("Registering Maria Teste...");
    try {
        const response = await fetch(`${API_URL}?action=createCustomer`, {
            method: 'POST',
            body: JSON.stringify({
                name: "Maria Teste",
                phone: "41999998888",
                password: "123456"
            })
        });
        const text = await response.text();
        console.log("Raw Register Response:", text);
        try {
            const data = JSON.parse(text);
            console.log("Maria Teste Register JSON:", JSON.stringify(data, null, 2));
        } catch (e) {
            console.error("Register JSON Parse Error", e);
        }

    } catch (error) {
        console.error("Maria Teste Register Error:", error);
    }

    // Test Maria Teste login
    console.log("Testing Maria Teste Login...");
    try {
        const response = await fetch(`${API_URL}?action=loginCustomer`, {
            method: 'POST',
            body: JSON.stringify({
                phone: "41999998888",
                password: "123456"
            })
        });
        const text = await response.text();
        console.log("Raw Login Response:", text);
        try {
            const data = JSON.parse(text);
            console.log("Maria Teste Login JSON:", JSON.stringify(data, null, 2));
        } catch (e) {
            console.error("Login JSON Parse Error:", e);
        }
    } catch (error) {
        console.error("Maria Teste Login Error:", error);
    }
}

(async () => {
    await testMaria();
})();
