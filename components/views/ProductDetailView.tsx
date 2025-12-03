import React, { useState, useEffect } from 'react';
import ShareButton from '../ui/ShareButton';
import RatingStars from '../product/RatingStars';
import ReviewForm from '../product/ReviewForm';
import ReviewsList from '../product/ReviewsList';
import { ReviewService, Review } from '../../services/reviews';

interface Product {
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
}

interface ProductDetailProps {
    product: Product;
    onBack: () => void;
    onAddToCart: (product: Product, quantity: number) => void;
    user?: any;
}

export default function ProductDetailView({ product, onBack, onAddToCart, user }: ProductDetailProps) {
    const [quantity, setQuantity] = useState(1);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [averageRating, setAverageRating] = useState(0);

    const handleIncrement = () => {
        if (quantity < product.estoque) setQuantity(q => q + 1);
    };

    const handleDecrement = () => {
        if (quantity > 1) setQuantity(q => q - 1);
    };

    useEffect(() => {
        if (product?.id) {
            ReviewService.getProductReviews(product.id).then((data) => {
                setReviews(data);
                setAverageRating(ReviewService.calculateAverageRating(data));
            });
        }
    }, [product]);

    const handleSubmitReview = async (rating: number, comment: string) => {
        // FIX: Validação mais robusta
        if (!user || !user.id || user.isGuest) {
            alert('Você precisa estar logado para avaliar');
            return;
        }

        const result = await ReviewService.submitReview(
            product.id,
            product.nome,
            rating,
            comment,
            user
        );

        if (result.success) {
            alert('✅ Avaliação enviada! Aguarde aprovação do admin.');
            setShowReviewForm(false);
            const updatedReviews = await ReviewService.getProductReviews(product.id);
            setReviews(updatedReviews);
            setAverageRating(ReviewService.calculateAverageRating(updatedReviews));
        } else {
            alert(result.message || 'Erro ao enviar avaliação');
        }
    };

    // FIX: Detectar logout durante avaliação (race condition)
    useEffect(() => {
        if (showReviewForm && (!user || !user.id || user.isGuest)) {
            setShowReviewForm(false);
            alert('Sessão expirada. Faça login novamente para avaliar.');
        }
    }, [user, showReviewForm]);

    return (
        <div className="min-h-screen bg-white flex flex-col relative animate-in slide-in-from-right duration-300">

            {/* --- FIXED NAVIGATION BUTTON (The Fix) --- */}
            <button
                onClick={onBack}
                className="fixed top-4 left-4 z-50 bg-white/90 backdrop-blur-md p-3 rounded-full shadow-lg border border-gray-100 hover:scale-110 transition active:scale-95"
                aria-label="Voltar"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            {/* Hero Image */}
            <div className="relative h-[40vh] w-full bg-gray-200 flex-shrink-0">
                <img
                    src={product.imagem || 'https://via.placeholder.com/500'}
                    alt={product.nome}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/5"></div>
            </div>

            {/* Content Body */}
            <div className="flex-1 p-6 flex flex-col -mt-8 bg-white rounded-t-[35px] relative z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">

                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 opacity-50"></div>

                <div className="flex justify-between items-start mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 w-3/4 leading-tight">{product.nome}</h1>
                    <div className="text-right">
                        <span className="text-2xl font-bold text-[#FF4B82]">R$ {product.price.toFixed(2)}</span>
                    </div>
                </div>

                {/* Badges */}
                <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                    {[
                        { icon: '🔥', label: 'Calorias', val: product.calorias, color: 'orange' },
                        { icon: '⚖️', label: 'Peso', val: product.peso, color: 'blue' },
                        { icon: '⚡', label: 'Entrega', val: product.tempo || 'Imediata', color: 'green' }
                    ].map((badge, idx) => (
                        <div key={idx} className={`bg-${badge.color}-50 border border-${badge.color}-100 px-3 py-2 rounded-xl flex items-center gap-3 min-w-[110px]`}>
                            <span className="text-xl">{badge.icon}</span>
                            <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">{badge.label}</p>
                                <p className={`text-sm font-bold text-${badge.color}-500`}>{badge.val}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <h3 className="font-bold text-gray-800 mb-2">Descrição</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">
                    {product.descricao || 'Sabor inigualável da Dona Capivara.'}
                </p>

                <h3 className="font-bold text-gray-800 mb-2">Ingredientes</h3>
                <p className="text-gray-500 text-xs leading-relaxed mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    {product.ingredientes || 'Informação não disponível.'}
                </p>

                {/* Rating Summary */}
                {averageRating > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                        <RatingStars rating={averageRating} size="md" />
                        <span className="text-sm text-gray-600">
                            ({reviews.length} {reviews.length === 1 ? 'avaliação' : 'avaliações'})
                        </span>
                    </div>
                )}

                {/* Review Button */}
                {/* FIX: Validação mais robusta com user.id */}
                {user && user.id && !user.isGuest && (
                    <button
                        onClick={() => setShowReviewForm(true)}
                        className="w-full bg-white border-2 border-[#FF4B82] text-[#FF4B82] font-bold py-3 rounded-xl mb-4 hover:bg-[#FFF0F5] transition active:scale-95"
                    >
                        ⭐️ Avaliar Produto
                    </button>
                )}

                {/* Reviews Section */}
                <div className="mb-24">
                    <h3 className="font-bold text-gray-800 mb-3">Avaliações</h3>
                    <ReviewsList reviews={reviews} averageRating={averageRating} />
                </div>

                {/* Review Form Modal */}
                {showReviewForm && (
                    <ReviewForm
                        productId={product.id}
                        productName={product.nome}
                        user={user}
                        onSubmit={handleSubmitReview}
                        onCancel={() => setShowReviewForm(false)}
                    />
                )}

                {/* Footer Actions */}
                <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 p-4 pb-8 flex items-center gap-4 z-40 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center bg-gray-100 rounded-xl px-3 py-2 h-14">
                        <button onClick={handleDecrement} className="w-8 text-xl font-bold text-gray-500 hover:text-[#FF4B82] transition">-</button>
                        <span className="w-8 text-center font-bold text-gray-800 text-lg">{quantity}</span>
                        <button onClick={handleIncrement} className="w-8 text-xl font-bold text-gray-500 hover:text-[#FF4B82] transition">+</button>
                    </div>

                    <ShareButton
                        product={product}
                        variant="icon"
                    />

                    <button
                        onClick={() => onAddToCart(product, quantity)}
                        className="flex-1 h-14 bg-gradient-to-r from-[#FF4B82] to-[#FF9E3D] text-white font-bold rounded-xl shadow-lg shadow-orange-200 hover:opacity-90 transition flex justify-between items-center px-6 active:scale-95"
                    >
                        <span>Adicionar</span>
                        <span className="bg-white/20 px-2 py-1 rounded text-sm">R$ {(product.price * quantity).toFixed(2)}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
