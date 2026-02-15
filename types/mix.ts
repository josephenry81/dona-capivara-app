// ======================================================
// TYPE DEFINITIONS - MIX DE GELADINHOS SYSTEM
// ======================================================

import { AdditionGroup, SelectedAddition } from './additions';

/**
 * Individual flavor option available for mix selection
 */
export interface Flavor {
    id: string;
    name: string;
    category: string;
    price: number;
    stock_status: 'available' | 'out_of_stock';
    image_url: string | null;
}

/**
 * Complete mix product with available flavors and additions
 */
export interface Mix {
    id: string;
    name: string;
    type: 'mix';
    base_price: number;
    price_per_flavor: number;
    max_flavors: number;
    category_id: string;
    category_name: string;
    stock: number;
    flavors: Flavor[];
    addition_groups: AdditionGroup[];
}

/**
 * Selected flavor with metadata for cart/order
 */
export interface SelectedFlavor {
    flavor_id: string;
    flavor_name: string;
    flavor_price: number;
}

/**
 * Price breakdown for mix calculation
 */
export interface MixPriceBreakdown {
    base: number;
    flavors_total: number;
    additions_total: number;
    unit_total: number;
}

/**
 * Input data for mix price calculation
 */
export interface MixPriceCalculation {
    mixId: string;
    basePrice: number;
    pricePerFlavor: number;
    selectedFlavors: string[];
    selectedAdditions: SelectedAddition[];
    quantity: number;
}

/**
 * Backend response for mix price validation/calculation
 */
export interface MixPriceCalculationResult {
    success: boolean;
    error?: string;
    base_price?: number;
    flavors_count?: number;
    flavors_subtotal?: number;
    additions_subtotal?: number;
    unit_price?: number;
    quantity?: number;
    total_price?: number;
    validated_flavors?: SelectedFlavor[];
    validated_additions?: SelectedAddition[];
}

/**
 * Mix cart item with complete selection details
 */
export interface MixCartItem {
    cart_item_id: string;
    product_id: string;
    product_name: string;
    product_type: 'mix';
    base_price: number;
    quantity: number;
    selected_flavors: SelectedFlavor[];
    selected_additions: SelectedAddition[];
    price_breakdown: MixPriceBreakdown;
    item_total: number;
    notes?: string;
}

/**
 * Validation result for flavor selection
 */
export interface FlavorValidationResult {
    valid: boolean;
    error?: string;
}

/**
 * Props for flavor selection components
 */
export interface FlavorSelectorProps {
    flavors: Flavor[];
    maxFlavors: number;
    selectedFlavors: string[];
    onSelectionChange: (flavorIds: string[]) => void;
}

export interface FlavorOptionProps {
    flavor: Flavor;
    isSelected: boolean;
    isDisabled: boolean;
    onToggle: () => void;
}

/**
 * Props for mix price calculator component
 */
export interface MixPriceCalculatorProps {
    basePrice: number;
    pricePerFlavor: number;
    selectedFlavorsCount: number;
    selectedFlavors: SelectedFlavor[];
    additionsTotal: number;
    selectedAdditions: SelectedAddition[];
    quantity: number;
}

/**
 * Props for mix detail view
 */
export interface MixDetailViewProps {
    mix: Mix;
    onBack: () => void;
}

/**
 * Props for mix cart item component
 */
export interface MixCartItemProps {
    item: MixCartItem;
    onQuantityChange: (newQuantity: number) => void;
    onRemove: () => void;
}
