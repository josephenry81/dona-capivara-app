/**
 * 📦 PRODUCT GROUPS CONFIGURATION
 *
 * Define here which product IDs belong to the same product family.
 * Each group represents a product with multiple variations (sizes, weights, etc.)
 *
 * Format:
 * {
 *   groupId: "unique-group-identifier",
 *   name: "Display name for the group",
 *   productIds: ["ID-1", "ID-2", "ID-3"] // IDs from GELADINHOS sheet
 * }
 *
 * Example:
 * {
 *   groupId: "cuscuz-family",
 *   name: "Cuscuz Nordestino",
 *   productIds: ["CUS-200", "CUS-500", "CUS-1000"]
 * }
 */

export interface ProductGroup {
    groupId: string;
    name: string;
    productIds: string[];
}

// 🔧 EDIT THIS ARRAY TO ADD YOUR PRODUCT GROUPS
export const PRODUCT_GROUPS: ProductGroup[] = [
    // 🧪 TESTE: Grupo de variações de exemplo
    {
        groupId: 'teste-variacao',
        name: 'Produto Teste Variação',
        productIds: ['TESTE-P', 'TESTE-M', 'TESTE-G']
    }
];

/**
 * Find the group a product belongs to
 * @param productId - The product ID to search for
 * @returns The ProductGroup if found, or null
 */
export function findProductGroup(productId: string): ProductGroup | null {
    return PRODUCT_GROUPS.find(group => group.productIds.includes(productId)) || null;
}

/**
 * Get all product IDs that are siblings of a given product
 * @param productId - The product ID to find siblings for
 * @returns Array of sibling product IDs (including the original), or empty array if no group
 */
export function getSiblingProductIds(productId: string): string[] {
    const group = findProductGroup(productId);
    return group ? group.productIds : [];
}

/**
 * Check if a product has variations
 * @param productId - The product ID to check
 * @returns true if product belongs to a group with multiple products
 */
export function hasVariations(productId: string): boolean {
    const group = findProductGroup(productId);
    return group !== null && group.productIds.length > 1;
}

/**
 * 🔒 Check if a product should be HIDDEN from catalog
 * Products that are variants (not the first in their group) should be hidden
 * @param productId - The product ID to check
 * @returns true if product should be hidden from catalog
 */
export function shouldHideFromCatalog(productId: string): boolean {
    const group = findProductGroup(productId);
    if (!group) return false; // Not in a group = show normally

    // Hide if it's NOT the first product in the group
    return group.productIds[0] !== productId;
}

/**
 * Get all product IDs that should be hidden from catalog
 * @returns Set of product IDs to hide
 */
export function getHiddenProductIds(): Set<string> {
    const hidden = new Set<string>();

    for (const group of PRODUCT_GROUPS) {
        // Skip the first product (it's the "master"), hide the rest
        for (let i = 1; i < group.productIds.length; i++) {
            hidden.add(group.productIds[i]);
        }
    }

    return hidden;
}
