// CONFIG
const PRICING = {
    BASE: 3.5,
    KM_RATE: 1.2,
    MIN: 5.0,
    DISCOUNT: 0.5
};

function calculate(type, dist) {
    let raw = PRICING.BASE + dist * PRICING.KM_RATE;
    let fee = Math.max(raw, PRICING.MIN);

    if (type === 'NEIGHBOR' && dist <= 3) {
        fee = fee * PRICING.DISCOUNT;
    }

    // Round to 0.50
    fee = Math.ceil(fee * 2) / 2;

    return fee;
}

console.log('🧪 TESTE PRECIFICAÇÃO DINÂMICA (UBER STYLE)');
console.log('-----------------------------------------');

const cases = [
    { type: 'NEIGHBOR', dist: 1.0, label: 'Vizinho 1km' },
    { type: 'NEIGHBOR', dist: 2.5, label: 'Vizinho 2.5km' },
    { type: 'NEIGHBOR', dist: 3.0, label: 'Vizinho 3km (Limit)' },
    { type: 'NEIGHBOR', dist: 3.1, label: 'Vizinho 3.1km (>3km)' },
    { type: 'FAR', dist: 2.0, label: 'Outros 2km (Perto mas Outros)' },
    { type: 'FAR', dist: 10.0, label: 'Outros 10km' },
    { type: 'FAR', dist: 20.0, label: 'Outros 20km (Longe)' }
];

cases.forEach(c => {
    const fee = calculate(c.type, c.dist);
    console.log(`[${c.label}] ${c.dist}km (${c.type}) => R$ ${fee.toFixed(2)}`);
});
