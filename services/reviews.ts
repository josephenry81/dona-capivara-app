export interface Review {
    id: string;
    customerName: string;
    rating: number;
    comment?: string;
    date: string;
}

export class ReviewService {
    /**
     * Submit a product review
     */
    static async submitReview(
        productId: string,
        productName: string,
        rating: number,
        comment: string,
        user: any
    ): Promise<{ success: boolean; message?: string }> {
        console.log('🔍 ReviewService.submitReview - INÍCIO');
        console.log('📦 Dados recebidos:', { productId, productName, rating, comment, user });

        // FIX: Validação crítica de usuário
        if (!user || !user.id || user.isGuest) {
            console.error('❌ Validação falhou: user inválido', user);
            return {
                success: false,
                message: 'Usuário não autenticado. Faça login para avaliar.'
            };
        }

        console.log('✅ Validação de user passou');
        console.log('🌐 URL da API:', process.env.NEXT_PUBLIC_GOOGLE_SHEET_API_URL);

        const payload = {
            productId,
            productName,
            customerId: user.id,
            customerName: user.name,
            rating,
            comment
        };

        console.log('📤 Payload a ser enviado:', payload);

        try {
            const url = process.env.NEXT_PUBLIC_GOOGLE_SHEET_API_URL + '?action=createReview';
            console.log('🔗 URL completa:', url);

            const response = await fetch(url, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            console.log('📡 Response status:', response.status);
            console.log('📡 Response ok:', response.ok);

            const result = await response.json();
            console.log('📥 Response data:', result);

            return result;
        } catch (error) {
            console.error('💥 Erro no fetch:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    /**
     * Get all approved reviews for a product
     */
    static async getProductReviews(productId: string): Promise<Review[]> {
        try {
            const url = process.env.NEXT_PUBLIC_GOOGLE_SHEET_API_URL;
            const response = await fetch(`${url}?action=getReviews&productId=${productId}&_t=${Date.now()}`);
            const data = await response.json();
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Error fetching reviews:', error);
            return [];
        }
    }

    /**
     * Calculate average rating from reviews
     */
    static calculateAverageRating(reviews: Review[]): number {
        if (reviews.length === 0) return 0;
        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        return Math.round((sum / reviews.length) * 10) / 10; // Round to 1 decimal
    }

    /**
     * Get rating distribution (for analytics)
     */
    static getRatingDistribution(reviews: Review[]): Record<number, number> {
        const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        reviews.forEach(review => {
            if (review.rating >= 1 && review.rating <= 5) {
                distribution[review.rating]++;
            }
        });
        return distribution;
    }

    /**
     * Get average ratings for all products in one call
     */
    static async getAllAverageRatings(): Promise<Record<string, number>> {
        try {
            const url = process.env.NEXT_PUBLIC_GOOGLE_SHEET_API_URL;
            const response = await fetch(`${url}?action=getAllAverageRatings&_t=${Date.now()}`);
            const data = await response.json();

            if (data && typeof data === 'object') {
                return data;
            }
            return {};
        } catch (error) {
            console.error('Error fetching global ratings:', error);
            return {};
        }
    }
}
