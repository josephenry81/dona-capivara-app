// Sistema de Roleta Mágica - Vitória Garantida
// Baseado em princípios de gamificação Disney + Reciprocidade

export interface Prize {
    id: number;
    name: string;
    emoji: string;
    value: number | string;
    type: 'cookie' | 'drink' | 'discount' | 'side' | 'burger' | 'premium' | 'combo';
    color: string;
    description: string;
}

// 8 Prêmios - Todos são ganhos garantidos
export const PRIZES: Prize[] = [
    {
        id: 1,
        name: "Biscoito Grátis",
        emoji: "🍪",
        value: 0.5,
        type: "cookie",
        color: "#FFE5B4",
        description: "1 biscoito delicioso na sua próxima compra"
    },
    {
        id: 2,
        name: "Refri 300ml",
        emoji: "🥤",
        value: 1.5,
        type: "drink",
        color: "#FFB6C1",
        description: "Refrigerante 300ml grátis"
    },
    {
        id: 3,
        name: "10% OFF",
        emoji: "🎁",
        value: "10%",
        type: "discount",
        color: "#B0E0E6",
        description: "10% de desconto na próxima compra"
    },
    {
        id: 4,
        name: "Batata Média",
        emoji: "🍟",
        value: 2.0,
        type: "side",
        color: "#FFDAB9",
        description: "Porção média de batata frita"
    },
    {
        id: 5,
        name: "15% OFF",
        emoji: "⭐",
        value: "15%",
        type: "discount",
        color: "#E6E6FA",
        description: "15% de desconto na próxima compra"
    },
    {
        id: 6,
        name: "Hambúrguer",
        emoji: "🍔",
        value: 3.5,
        type: "burger",
        color: "#FFE4B5",
        description: "Hambúrguer simples grátis"
    },
    {
        id: 7,
        name: "20% + Brinde",
        emoji: "🎉",
        value: "20%+",
        type: "premium",
        color: "#FFD700",
        description: "20% OFF + brinde surpresa"
    },
    {
        id: 8,
        name: "Combo Especial",
        emoji: "👑",
        value: 5.0,
        type: "combo",
        color: "#FF6347",
        description: "Combo completo na próxima compra"
    }
];

// Hash simples para criar seed determinístico
const hashCode = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
};

/**
 * Determinar qual raspadinha (1, 2 ou 3) tem o prêmio
 * Baseado no userId e na data atual (consistente durante o dia)
 */
export const getWinningScratchNumber = (userId: string): number => {
    const today = new Date().toDateString();
    const seed = hashCode(userId + today);
    const winningNumber = (seed % 3) + 1;
    console.log('🎲 [Wheel] Raspadinha premiada do dia:', winningNumber);
    return winningNumber;
};

/**
 * Algoritmo de Vitória Garantida
 * - SEMPRE retorna um prêmio
 * - Determinístico mas parece aleatório
 * - Progressão: 1º giro → menor, 3º giro → maior
 */
export const getGuaranteedPrize = (
    userId: string,
    spinNumber: number
): Prize => {
    console.log('🎰 [Wheel] Calculando prêmio garantido...');
    console.log('🎰 [Wheel] userId:', userId);
    console.log('🎰 [Wheel] spinNumber:', spinNumber);

    // 1. Criar seed baseado em userId + spinNumber + timestamp
    const seed = hashCode(userId) + spinNumber + (Date.now() % 1000);
    console.log('🎰 [Wheel] seed:', seed);

    // 2. Selecionar prêmio base (parece aleatório)
    const baseIndex = Math.abs(seed) % PRIZES.length;
    console.log('🎰 [Wheel] baseIndex:', baseIndex);

    // 3. Progressão: quanto mais giros, melhor o prêmio
    // 1º giro: +0, 2º giro: +1, 3º giro: +2
    const progressionBonus = Math.min(spinNumber - 1, 3);
    console.log('🎰 [Wheel] progressionBonus:', progressionBonus);

    // 4. Ajustar índice com progressão (não ultrapassar array)
    const adjustedIndex = Math.min(baseIndex + progressionBonus, PRIZES.length - 1);
    console.log('🎰 [Wheel] adjustedIndex:', adjustedIndex);

    const prize = PRIZES[adjustedIndex];
    console.log('🎰 [Wheel] Prêmio selecionado:', prize.name);

    return prize;
};

/**
 * Calcular rotação da roleta para parar no prêmio
 */
export const calculateRotation = (prizeId: number): number => {
    const prizeIndex = PRIZES.findIndex(p => p.id === prizeId);
    const degreesPerSection = 360 / PRIZES.length; // 45 graus por seção
    const targetDegrees = (prizeIndex * degreesPerSection) + (degreesPerSection / 2);

    // Adicionar 5 voltas completas para efeito visual
    const totalRotation = 360 * 5 + targetDegrees;

    console.log('🎰 [Wheel] Rotação calculada:', totalRotation, 'graus');
    return totalRotation;
};

/**
 * Validar giros disponíveis
 * ✅ TEMPORÁRIO: Hardcode 3 giros para todos os usuários (testes)
 */
export const getAvailableSpins = (user: any): number => {
    // ✅ TEMPORÁRIO: Dar 3 giros para testes
    console.log('🎰 [MODO TESTE] Retornando 3 giros para todos os usuários');
    return 3;

    // PRODUÇÃO: Descomentar quando backend estiver pronto
    // const baseSpins = user.wheelSpins || 0;
    // const maxSpins = 3;
    // return Math.min(baseSpins, maxSpins);
};

/**
 * Formatar valor do prêmio para exibição
 */
export const formatPrizeValue = (prize: Prize): string => {
    if (typeof prize.value === 'string') {
        return prize.value;
    }
    return `R$ ${prize.value.toFixed(2)}`;
};

// ========================================
// NOVA MECÂNICA: PRÊMIO ALEATÓRIO
// ========================================

export interface SpinResult {
    success: boolean;
    prize: Prize | null;
    message: string;
    spinsLeft: number;
    alreadyHasPrize?: boolean;
    isWinningScratch?: boolean;
}

/**
 * Obter resultado da raspadinha com prêmio aleatório
 * O prêmio pode estar na 1ª, 2ª ou 3ª raspadinha
 */
export const getScratchResult = (
    userId: string,
    scratchNumber: number,
    hasPendingPrize: boolean
): SpinResult => {
    console.log('🎴 [Scratch] getScratchResult:', { userId, scratchNumber, hasPendingPrize });

    // Se já tem prêmio pendente, todas as raspadinhas são vazias
    if (hasPendingPrize) {
        const messages = [
            '🎯 Você já tem um prêmio pendente!',
            '✨ Resgate seu prêmio para jogar novamente!',
            '🌟 Prêmio já garantido!'
        ];
        return {
            success: true,
            prize: null,
            isWinningScratch: false,
            message: messages[scratchNumber - 1],
            spinsLeft: 3 - scratchNumber,
            alreadyHasPrize: true
        };
    }

    // Determinar qual raspadinha tem o prêmio
    const winningScratch = getWinningScratchNumber(userId);
    console.log('🎲 [Scratch] Raspadinha atual:', scratchNumber, '| Premiada:', winningScratch);

    // Verificar se esta raspadinha é a premiada
    if (scratchNumber === winningScratch) {
        // É a premiada! Dar o prêmio garantido
        const prize = getGuaranteedPrize(userId, scratchNumber);
        console.log('🎁 [Scratch] PRÊMIO ENCONTRADO!', prize.name);
        return {
            success: true,
            prize: prize,
            isWinningScratch: true,
            message: '🎉 PARABÉNS! Você encontrou o prêmio!',
            spinsLeft: 3 - scratchNumber
        };
    } else if (scratchNumber < winningScratch) {
        // Ainda não chegou na raspadinha premiada
        const message = scratchNumber === 1
            ? '🎯 Continue raspando! O prêmio pode estar na próxima!'
            : '✨ Quase lá! Raspe a próxima!';
        console.log('🎴 [Scratch] Vazia - Continue (prêmio na', winningScratch, ')');
        return {
            success: true,
            prize: null,
            isWinningScratch: false,
            message: message,
            spinsLeft: 3 - scratchNumber
        };
    } else {
        // Já passou da raspadinha premiada (raspou depois de já ter o prêmio)
        console.log('🎴 [Scratch] Vazia - Já passou (prêmio estava na', winningScratch, ')');
        return {
            success: true,
            prize: null,
            isWinningScratch: false,
            message: '🌟 Você já encontrou o prêmio em uma raspadinha anterior!',
            spinsLeft: 3 - scratchNumber
        };
    }
};

// Manter getSpinResult como alias para compatibilidade
export const getSpinResult = getScratchResult;
