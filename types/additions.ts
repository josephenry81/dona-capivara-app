// ======================================================
// TYPE DEFINITIONS - ADDITIONS SYSTEM
// ======================================================

/**
 * Individual addition option (e.g., Calda de Chocolate)
 */
export interface AdditionOption {
    id: string;
    sku: string;
    name: string;
    price: number;
    stock_status: 'available' | 'out_of_stock';
    image_url: string | null;
    order: number;
}

/**
 * Group of related additions (e.g., Caldas, Toppings)
 */
export interface AdditionGroup {
    id: string;
    name: string;
    type: 'single' | 'multiple';
    required: boolean;
    min: number;
    max: number;
    order: number;
    options: AdditionOption[];
}

/**
 * Product extended with addition groups
 */
export interface ProductWithAdditions {
    id: string;
    nome: string;
    price: number;
    imagem?: string;
    descricao: string;
    estoque: number;
    peso?: string;
    calorias?: string;
    ingredientes?: string;
    tempo?: string;
    tem_adicionais?: boolean;
    addition_groups?: AdditionGroup[];
    [key: string]: any;
}

/**
 * User's selected addition with full metadata
 */
export interface SelectedAddition {
    group_id: string;
    group_name: string;
    option_id: string;
    option_sku: string;
    option_name: string;
    option_price: number;
}

/**
 * Cart item including selected additions
 */
export interface CartItemWithAdditions {
    id: string;
    nome: string;
    price: number; // Base price
    imagem?: string;
    quantity: number;
    selected_additions?: SelectedAddition[];
    additions_subtotal?: number;
    unit_price?: number; // Base + additions
    item_total?: number; // unit_price * quantity
}

/**
 * Price calculation result from backend
 */
export interface PriceCalculationResult {
    success: boolean;
    error?: string;
    base_price?: number;
    additions_subtotal?: number;
    unit_price?: number;
    quantity?: number;
    total_price?: number;
    validated_additions?: SelectedAddition[];
}
