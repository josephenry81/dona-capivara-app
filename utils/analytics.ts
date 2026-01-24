/**
 * Utilitário para Google Analytics 4 (GA4)
 * Permite disparar eventos de forma tipada e segura.
 */

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

// Declaração global para evitar erros de tipagem com o window.gtag
declare global {
    interface Window {
        gtag: (command: string, action: string, params?: any) => void;
    }
}

/**
 * Dispara um evento personalizado para o GA4
 */
export const trackEvent = (action: string, params?: any) => {
    if (typeof window !== 'undefined' && window.gtag && GA_ID) {
        window.gtag('event', action, params);
    }
};

/**
 * Eventos pré-definidos para o e-commerce
 */
export const Analytics = {
    // Visualização de produto
    viewItem: (product: any) => {
        trackEvent('view_item', {
            currency: 'BRL',
            value: product.price,
            items: [{
                item_id: product.id,
                item_name: product.nome,
                price: product.price,
                item_category: product.categoriaId
            }]
        });
    },

    // Adição ao carrinho
    addToCart: (product: any, quantity: number) => {
        trackEvent('add_to_cart', {
            currency: 'BRL',
            value: product.price * quantity,
            items: [{
                item_id: product.id,
                item_name: product.nome,
                price: product.price,
                quantity: quantity
            }]
        });
    },

    // Finalização de compra
    purchase: (order: any) => {
        trackEvent('purchase', {
            transaction_id: order.idVenda || order.id,
            value: order.total,
            currency: 'BRL',
            items: order.cart.map((item: any) => ({
                item_id: item.id,
                item_name: item.nome,
                price: item.price,
                quantity: item.quantity
            }))
        });
    },

    // Login
    login: (method: string) => {
        trackEvent('login', { method });
    }
};
