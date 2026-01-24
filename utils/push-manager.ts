/**
 * Gerenciador de Push Notifications
 */

const VAPID_PUBLIC_KEY = 'BCX_t-DIn87pS0_bE4mNoNoU6X_zE6i9c9K8g7Y8K_L_G9K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8'; // Exemplo, o usuário deve trocar

/**
 * Converte base64 para Uint8Array para o subscribe do push
 */
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export const PushManager = {
    /**
     * Solicita permissão e subscreve o usuário
     */
    subscribe: async (userId: string) => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('Push notifications não suportadas');
            return null;
        }

        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                console.warn('Permissão de notificação negada');
                return null;
            }

            const registration = await navigator.serviceWorker.ready;

            // Verifica se já existe uma subscrição
            let subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                });
            }

            console.log('Push subscription:', subscription);

            // Enviar para o backend
            // await API.savePushSubscription(userId, subscription);

            return subscription;
        } catch (error) {
            console.error('Erro ao subscrever push:', error);
            return null;
        }
    }
};
