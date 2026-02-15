import React, { useState } from 'react';
import Image from 'next/image';
import { useModal } from './ui/Modal';
import { useDynamicPricing } from '../hooks/useDynamicPricing';
import { useCountdown } from '../hooks/useCountdown';
import RatingStars from './product/RatingStars';

interface Product {
    id: string;
    nome: string;
    price: number;
    imagem?: string;
    estoque: number;
    descricao?: string;
    dataLancamento?: string | null;
    [key: string]: any;
}

interface ProductCardProps {
    product: Product;
    isFavorite?: boolean;
    onToggleFavorite?: (id: string) => void;
    onAddToCart?: (product: Product, quantity?: number) => void;
    onProductClick?: (product: Product) => void;
    averageRating?: number;
    isCondoUser?: boolean;
}

export default function ProductCard({
    product,
    isFavorite,
    onToggleFavorite,
    onAddToCart,
    onProductClick,
    averageRating = 0,
    isCondoUser = false
}: ProductCardProps) {
    const { alert, Modal: CustomModal } = useModal();
    const [quantity, setQuantity] = useState(0);
    const { isLocal, loading: geoLoading } = useDynamicPricing();

    // 🔥 Countdown timer de lançamento
    const countdown = useCountdown(product.dataLancamento);
    const isLaunching = countdown.isActive; // Timer ativo = produto bloqueado

    // Geo-Pricing: 
    // - Condo Users (isCondoUser): ALWAYS Base Price (Protected)
    // - Non-Condo + Outside Radius: +16.67%
    // - Non-Condo + Inside Radius: Base Price

    // Condição para aplicar preço externo: NÃO é condômino, Geo carregou E está longe.
    const shouldUseExternalPrice = !isCondoUser && !geoLoading && isLocal === false;

    const dynamicPrice = shouldUseExternalPrice
        ? Number(product.price || 0) * 1.1667
        : Number(product.price || 0);
    // const price = Number(product.price || 0); // Unused
    const stock = Number(product.estoque || 0);
    const hasStock = stock > 0;
    const isMix =
        (product as any).isMix === true ||
        (product as any).ID_Tipo_Produto === 'TP-003' ||
        (product as any).nome?.toLowerCase().includes('mix');

    const handleIncrement = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isLaunching) return;
        if (quantity < stock) {
            setQuantity(prev => prev + 1);
        } else {
            alert('⚠️ Estoque Máximo', 'Não temos mais unidades deste produto no momento.', 'warning');
        }
    };

    const handleDecrement = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isLaunching) return;
        if (quantity > 0) setQuantity(prev => prev - 1);
    };

    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleFavorite?.(product.id);
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        e.stopPropagation();

        if (isLaunching) {
            alert(
                '⏳ Em breve!',
                `Este produto estará disponível em ${countdown.formatted}. Fique de olho!`,
                'warning'
            );
            return;
        }

        if (isMix && onProductClick) {
            onProductClick(product);
            return;
        }

        const qty = quantity > 0 ? quantity : 1;
        // Pass dynamic price to cart
        onAddToCart?.({ ...product, price: dynamicPrice }, qty);
        setQuantity(0); // Reset after adding
    };

    return (
        <div
            onClick={() => {
                if (isLaunching) {
                    alert(
                        '⏳ Lançamento em breve!',
                        `Este produto estará disponível em ${countdown.formatted}. Adicione aos favoritos para não perder!`,
                        'warning'
                    );
                    return;
                }
                onProductClick?.(product);
            }}
            data-tour="product-card"
            className={`group flex flex-col bg-white rounded-[20px] overflow-hidden relative h-full transition-all duration-500 border cursor-pointer active:scale-[0.98] ${isLaunching
                ? 'border-amber-200/80 shadow-[0_0_30px_-5px_rgba(255,158,61,0.15)] hover:shadow-[0_0_40px_-5px_rgba(255,158,61,0.25)]'
                : 'border-gray-100/60 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.12)]'
                }`}
        >
            <CustomModal />

            {/* Top Badges & Actions */}
            <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start pointer-events-none">
                <div className="flex flex-col gap-2">
                    {!hasStock && !isLaunching && (
                        <span className="bg-red-500 text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-lg uppercase tracking-wider">
                            Esgotado
                        </span>
                    )}

                    {/* 🔥 Badge de Lançamento */}
                    {isLaunching && (
                        <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-lg uppercase tracking-wider animate-pulse">
                            ⏳ Em breve
                        </span>
                    )}
                </div>

                {onToggleFavorite && (
                    <button
                        onClick={handleFavoriteClick}
                        className={`pointer-events-auto p-2.5 rounded-full shadow-lg transition-all duration-300 active:scale-90 ${isFavorite
                            ? 'bg-pink-500 text-white shadow-pink-200'
                            : 'bg-white/90 backdrop-blur-md text-gray-400 hover:text-pink-500'
                            }`}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill={isFavorite ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Product Image */}
            <div className={`relative w-full h-48 bg-gray-50 overflow-hidden ${isLaunching ? 'after:absolute after:inset-0 after:bg-gradient-to-t after:from-amber-900/30 after:to-transparent after:z-10' : ''}`}>
                <Image
                    src={product.imagem || '/product-placeholder.png'}
                    alt={product.nome}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className={`object-cover transition-transform duration-700 group-hover:scale-110 ${!hasStock && !isLaunching ? 'grayscale opacity-70' : ''
                        } ${isLaunching ? 'scale-105' : ''}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                {/* 🔥 Timer Overlay na Imagem */}
                {isLaunching && (
                    <div className="absolute bottom-0 left-0 right-0 z-20 p-3">
                        {/* Barra de progresso */}
                        <div className="w-full h-1 bg-white/20 rounded-full mb-2 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-1000 ease-linear"
                                style={{ width: `${countdown.percentage}%` }}
                            />
                        </div>

                        {/* Timer display */}
                        <div className="flex items-center justify-center gap-1">
                            {/* Horas */}
                            <div className="flex flex-col items-center">
                                <div className="bg-black/60 backdrop-blur-md rounded-lg px-2.5 py-1.5 min-w-[40px] text-center border border-white/10">
                                    <span className="text-white font-black text-lg tabular-nums leading-none">
                                        {String(countdown.hours).padStart(2, '0')}
                                    </span>
                                </div>
                                <span className="text-white/70 text-[8px] font-bold mt-0.5 uppercase tracking-wider">hrs</span>
                            </div>

                            <span className="text-white/80 font-black text-lg mb-3 animate-pulse">:</span>

                            {/* Minutos */}
                            <div className="flex flex-col items-center">
                                <div className="bg-black/60 backdrop-blur-md rounded-lg px-2.5 py-1.5 min-w-[40px] text-center border border-white/10">
                                    <span className="text-white font-black text-lg tabular-nums leading-none">
                                        {String(countdown.minutes).padStart(2, '0')}
                                    </span>
                                </div>
                                <span className="text-white/70 text-[8px] font-bold mt-0.5 uppercase tracking-wider">min</span>
                            </div>

                            <span className="text-white/80 font-black text-lg mb-3 animate-pulse">:</span>

                            {/* Segundos */}
                            <div className="flex flex-col items-center">
                                <div className="bg-black/60 backdrop-blur-md rounded-lg px-2.5 py-1.5 min-w-[40px] text-center border border-white/10">
                                    <span className="text-amber-300 font-black text-lg tabular-nums leading-none">
                                        {String(countdown.seconds).padStart(2, '0')}
                                    </span>
                                </div>
                                <span className="text-white/70 text-[8px] font-bold mt-0.5 uppercase tracking-wider">seg</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="p-5 flex flex-col flex-grow">
                <div className="mb-3">
                    <h3 className="font-semibold text-gray-800 text-base leading-tight">{product.nome}</h3>
                </div>

                <div className="flex flex-col mb-2">
                    {isLaunching ? (
                        /* Preço com efeito blur durante lançamento */
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-semibold text-gray-300 tabular-nums blur-[3px] select-none">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dynamicPrice)}
                            </span>
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                🔒 Aguarde
                            </span>
                        </div>
                    ) : (
                        <span className="text-xl font-semibold text-[#FF4B82] tabular-nums transition-all duration-500">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dynamicPrice)}
                        </span>
                    )}

                    {hasStock && !isLaunching && <span className="text-xs text-gray-400 mt-1">Estoque: {stock}</span>}
                </div>

                {/* Rating Stars */}
                {(averageRating > 0) && (
                    <div className="mb-4 flex items-center gap-2">
                        <RatingStars rating={averageRating} size="sm" />
                        <span className="text-xs text-gray-400 font-medium">({averageRating.toFixed(1)})</span>
                    </div>
                )}

                {/* Actions */}
                <div className="mt-auto pt-3 flex items-center justify-between gap-2 border-t border-gray-50/50">
                    {!isMix && hasStock && !isLaunching && (
                        <div className="flex items-center bg-gray-50 rounded-lg p-0.5 border border-gray-100 h-8">
                            <button
                                onClick={handleDecrement}
                                className="w-7 h-full flex items-center justify-center text-gray-400 hover:bg-white hover:text-[#FF4B82] rounded-md transition-colors font-bold active:scale-95"
                            >
                                −
                            </button>
                            <span className="w-5 text-center text-xs font-bold text-gray-700 tabular-nums">
                                {quantity}
                            </span>
                            <button
                                onClick={handleIncrement}
                                className="w-7 h-full flex items-center justify-center text-gray-400 hover:bg-white hover:text-[#FF4B82] rounded-md transition-colors font-bold active:scale-95"
                            >
                                +
                            </button>
                        </div>
                    )}

                    {isLaunching ? (
                        /* Botão bloqueado durante lançamento */
                        <button
                            onClick={handleAddToCart}
                            className="flex-1 h-8 rounded-lg flex items-center justify-center gap-1.5 font-bold text-[11px] transition-all bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-md hover:from-amber-500 hover:to-orange-500 active:scale-[0.97]"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                            </svg>
                            <span>Disponível em breve</span>
                        </button>
                    ) : (
                        <button
                            onClick={handleAddToCart}
                            disabled={!hasStock}
                            className={`flex-1 h-8 rounded-lg flex items-center justify-center gap-1.5 font-bold text-[11px] transition-all active:scale-[0.97] ${hasStock
                                ? 'bg-[#FF4B82] text-white shadow-md hover:bg-[#ff3370] hover:shadow-lg hover:shadow-pink-200'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            {isMix ? (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                                    <span>Personalizar</span>
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
                                    <span>Adicionar</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
