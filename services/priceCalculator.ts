// ======================================================
// PRICE CALCULATOR UTILITY
// ======================================================

import { SelectedAddition } from '../types/additions';

/**
 * Calculate item price from base price and additions
 */
export function calculateItemPrice(
    basePrice: number,
    selectedAdditions: SelectedAddition[],
    quantity: number
): {
    base_price: number;
    additions_subtotal: number;
    unit_price: number;
    total_price: number;
} {
    const additionsSubtotal = selectedAdditions.reduce((sum, addition) => sum + addition.option_price, 0);

    const unitPrice = basePrice + additionsSubtotal;
    const totalPrice = unitPrice * quantity;

    return {
        base_price: basePrice,
        additions_subtotal: additionsSubtotal,
        unit_price: unitPrice,
        total_price: totalPrice
    };
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
}

/**
 * Validate selection constraints for a group
 */
export function validateGroupSelection(
    groupType: 'single' | 'multiple',
    min: number,
    max: number,
    selectedCount: number
): { valid: boolean; error?: string } {
    // Check type constraint
    if (groupType === 'single' && selectedCount > 1) {
        return { valid: false, error: 'Selecione apenas uma opção' };
    }

    // Check minimum
    if (min > 0 && selectedCount < min) {
        return { valid: false, error: `Selecione no mínimo ${min} opção(ões)` };
    }

    // Check maximum
    if (max < 99 && selectedCount > max) {
        return { valid: false, error: `Selecione no máximo ${max} opção(ões)` };
    }

    return { valid: true };
}
