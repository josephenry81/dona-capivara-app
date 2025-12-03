/**
 * ShareManager - Social Share Service
 * Handles Web Share API + Clipboard fallback for product and referral sharing
 */

interface ShareProductData {
    id: string;
    nome: string;
    price: number;
    imagem?: string;
}

interface ShareResult {
    success: boolean;
    method: 'web_share_api' | 'clipboard' | 'failed';
    message?: string;
}

export class ShareManager {
    private baseUrl: string;

    constructor() {
        this.baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    }

    /**
     * Check if Web Share API is available
     */
    canShare(): boolean {
        return typeof navigator !== 'undefined' && !!navigator.share;
    }

    /**
     * Generate UTM-tagged URL for product sharing
     */
    private generateProductUrl(productId: string, referralCode?: string): string {
        const params = new URLSearchParams({
            product: productId,
            utm_source: 'share',
            utm_medium: 'social',
            utm_campaign: 'product_share'
        });

        if (referralCode) {
            params.append('ref', referralCode);
        }

        return `${this.baseUrl}/?${params.toString()}`;
    }

    /**
     * Generate UTM-tagged URL for referral sharing
     */
    private generateReferralUrl(referralCode: string): string {
        const params = new URLSearchParams({
            ref: referralCode,
            utm_source: 'share',
            utm_medium: 'social',
            utm_campaign: 'referral_share'
        });

        return `${this.baseUrl}/?${params.toString()}`;
    }

    /**
     * Share a product using Web Share API or clipboard fallback
     */
    async shareProduct(product: ShareProductData, referralCode?: string): Promise<ShareResult> {
        const shareUrl = this.generateProductUrl(product.id, referralCode);
        const shareTitle = `Dona Capivara - ${product.nome}`;
        const shareText = `Confira este delicioso geladinho: ${product.nome} por R$ ${product.price.toFixed(2)}! 🍦`;

        try {
            if (this.canShare()) {
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: shareUrl
                });

                return {
                    success: true,
                    method: 'web_share_api',
                    message: 'Compartilhado com sucesso!'
                };
            } else {
                // Fallback to clipboard
                await this.copyToClipboard(shareUrl);
                return {
                    success: true,
                    method: 'clipboard',
                    message: 'Link copiado! Cole e compartilhe com seus amigos.'
                };
            }
        } catch (error: any) {
            // User cancelled or error occurred
            if (error.name === 'AbortError') {
                return {
                    success: false,
                    method: 'failed',
                    message: 'Compartilhamento cancelado'
                };
            }

            // Try clipboard as last resort
            try {
                await this.copyToClipboard(shareUrl);
                return {
                    success: true,
                    method: 'clipboard',
                    message: 'Link copiado!'
                };
            } catch {
                return {
                    success: false,
                    method: 'failed',
                    message: 'Não foi possível compartilhar'
                };
            }
        }
    }

    /**
     * Share referral code using Web Share API or clipboard fallback
     */
    async shareWithReferral(userId: string, referralCode: string, userName?: string): Promise<ShareResult> {
        const shareUrl = this.generateReferralUrl(referralCode);
        const shareTitle = 'Dona Capivara - Geladinhos Deliciosos!';
        const shareText = `${userName ? userName + ' te convidou! ' : ''}Use o código ${referralCode} e ganhe 50 pontos! 🎁`;

        try {
            if (this.canShare()) {
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: shareUrl
                });

                return {
                    success: true,
                    method: 'web_share_api',
                    message: 'Compartilhado com sucesso!'
                };
            } else {
                // Fallback to clipboard
                await this.copyToClipboard(shareUrl);
                return {
                    success: true,
                    method: 'clipboard',
                    message: 'Link copiado! Compartilhe com seus amigos.'
                };
            }
        } catch (error: any) {
            // User cancelled or error occurred
            if (error.name === 'AbortError') {
                return {
                    success: false,
                    method: 'failed',
                    message: 'Compartilhamento cancelado'
                };
            }

            // Try clipboard as last resort
            try {
                await this.copyToClipboard(shareUrl);
                return {
                    success: true,
                    method: 'clipboard',
                    message: 'Link copiado!'
                };
            } catch {
                return {
                    success: false,
                    method: 'failed',
                    message: 'Não foi possível compartilhar'
                };
            }
        }
    }

    /**
     * Copy text to clipboard
     */
    private async copyToClipboard(text: string): Promise<void> {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            try {
                document.execCommand('copy');
            } finally {
                document.body.removeChild(textArea);
            }
        }
    }
}

// Export singleton instance
export const shareManager = new ShareManager();
