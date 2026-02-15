'use client';

/**
 * 🔔 Push Notification Service
 * Uses browser Notification API for abandoned cart reminders
 * No server required - works entirely client-side
 */

const CART_ABANDON_KEY = 'dona_capivara_cart_timestamp';
const NOTIFICATION_SENT_KEY = 'dona_capivara_notification_sent';
const ABANDON_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

export class NotificationService {
    private static permissionGranted = false;

    /**
     * Request notification permission from user
     */
    static async requestPermission(): Promise<boolean> {
        if (!('Notification' in window)) {
            console.log('🔔 Notifications not supported');
            return false;
        }

        if (Notification.permission === 'granted') {
            this.permissionGranted = true;
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            this.permissionGranted = permission === 'granted';
            return this.permissionGranted;
        }

        return false;
    }

    /**
     * Check if notifications are enabled
     */
    static isEnabled(): boolean {
        return 'Notification' in window && Notification.permission === 'granted';
    }

    /**
     * Track cart activity - call when user adds item
     */
    static trackCartActivity(cartItemCount: number): void {
        if (cartItemCount > 0) {
            localStorage.setItem(CART_ABANDON_KEY, Date.now().toString());
            localStorage.removeItem(NOTIFICATION_SENT_KEY);
        } else {
            localStorage.removeItem(CART_ABANDON_KEY);
        }
    }

    /**
     * Clear cart tracking - call when order is completed
     */
    static clearCartTracking(): void {
        localStorage.removeItem(CART_ABANDON_KEY);
        localStorage.removeItem(NOTIFICATION_SENT_KEY);
    }

    /**
     * Check for abandoned cart and send notification
     * Call this on page load/visibility change
     */
    static checkAbandonedCart(): void {
        if (!this.isEnabled()) return;

        const timestamp = localStorage.getItem(CART_ABANDON_KEY);
        const alreadySent = localStorage.getItem(NOTIFICATION_SENT_KEY);

        if (!timestamp || alreadySent) return;

        const timeSinceActivity = Date.now() - parseInt(timestamp);

        if (timeSinceActivity >= ABANDON_THRESHOLD_MS) {
            this.sendAbandonedCartNotification();
            localStorage.setItem(NOTIFICATION_SENT_KEY, 'true');
        }
    }

    /**
     * Send abandoned cart notification
     */
    private static sendAbandonedCartNotification(): void {
        const notification = new Notification('🛒 Esqueceu algo?', {
            body: 'Você tem itens no carrinho esperando por você! Complete seu pedido agora.',
            icon: '/icons/android-icon-192x192.png',
            badge: '/icons/android-icon-72x72.png',
            tag: 'abandoned-cart',
            requireInteraction: true
        });

        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    }

    /**
     * Send order confirmation notification
     */
    static sendOrderConfirmation(orderId: string): void {
        if (!this.isEnabled()) return;

        new Notification('✅ Pedido Confirmado!', {
            body: `Seu pedido #${orderId.slice(-6)} foi recebido. Aguarde a preparação!`,
            icon: '/icons/android-icon-192x192.png',
            tag: 'order-confirmed'
        });
    }

    /**
     * Schedule a reminder notification
     */
    static scheduleReminder(message: string, delayMs: number): void {
        if (!this.isEnabled()) return;

        setTimeout(() => {
            new Notification('🔔 Lembrete Dona Capivara', {
                body: message,
                icon: '/icons/android-icon-192x192.png',
                tag: 'reminder'
            });
        }, delayMs);
    }
}

/**
 * Hook for React components
 */
export function useNotifications() {
    const requestPermission = async () => {
        return NotificationService.requestPermission();
    };

    const trackCart = (itemCount: number) => {
        NotificationService.trackCartActivity(itemCount);
    };

    const clearCart = () => {
        NotificationService.clearCartTracking();
    };

    const isEnabled = NotificationService.isEnabled();

    return { requestPermission, trackCart, clearCart, isEnabled };
}
