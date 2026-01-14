import React, { useState } from 'react';
import Image from 'next/image';
import { useModal } from './ui/Modal';


interface Product {
    id: string;
    nome: string;
    price: number;
    imagem?: string;
    estoque: number;
    descricao?: string;
    [key: string]: any;
}

interface ProductCardProps {
    product: Product;
    isFavorite?: boolean;
    onToggleFavorite?: (id: string) => void;
    onAddToCart?: (product: Product, quantity?: number) => void;
    onProductClick?: (product: Product) => void;
}

export default function ProductCard({ product, isFavorite, onToggleFavorite, onAddToCart, onProductClick }: ProductCardProps) {
    const { alert, Modal: CustomModal } = useModal();
    const [quantity, setQuantity] = useState(0);
    const price = Number(product.price || 0);

    const stock = Number(product.estoque || 0);
    const hasStock = stock > 0;
    const isMix = (product as any).isMix === true || (product as any).ID_Tipo_Produto === 'TP-003' || (product as any).nome?.toLowerCase().includes('mix');

    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onToggleFavorite) {
            onToggleFavorite(product.id);
        } else {
            console.warn("onToggleFavorite not provided");
        }
    };

    const handleIncrement = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (quantity < stock) {
            setQuantity(prev => prev + 1);
        }
    };

    const handleDecrement = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (quantity > 0) {
            setQuantity(prev => prev - 1);
        }
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        e.stopPropagation();

        // For Mix products, open the configuration view instead of adding to cart
        if (isMix && onProductClick) {
            onProductClick(product);
            return;
        }

        const qtdToAdd = quantity > 0 ? quantity : 1;

        if (onAddToCart) {
            onAddToCart(product, qtdToAdd);
            setQuantity(0); // Reset quantity after adding
        } else {
            console.error("onAddToCart function is missing!");
            alert(
                '❌ Erro no Carrinho',
                'Ocorreu um erro interno ao tentar adicionar este produto. Por favor, tente novamente mais tarde.',
                'error'
            );
        }
    };

    return (
        <div data-tour="product-card" className="flex flex-col bg-white rounded-2xl shadow-md overflow-hidden relative h-full hover:shadow-lg transition-shadow group">
            <CustomModal />

            {/* TOPO - Badges e Favorito */}
            <div className="absolute top-2 left-2 z-20 flex flex-col gap-1 pointer-events-none">
                {!hasStock && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow">Esgotado</span>}
                {hasStock && stock < 5 && <span className="bg-orange-400 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow">Últimas {stock} unid!</span>}
            </div>

            {/* Favorite Button */}
            {onToggleFavorite && (
                <button
                    onClick={handleFavoriteClick}
                    className="absolute top-2 right-2 z-20 bg-white/90 p-2 rounded-full shadow-md hover:bg-white hover:scale-110 transition-all cursor-pointer active:scale-90"
                    title="Favoritar"
                >
                    {isFavorite ? '❤️' : '🤍'}
                </button>
            )}

            {/* MEIO - Imagem do Produto */}
            <div
                onClick={() => onProductClick?.(product)}
                className="w-full h-44 bg-gradient-to-br from-gray-50 to-gray-100 relative cursor-pointer overflow-hidden"
            >
                <Image
                    src={product.imagem || 'https://via.placeholder.com/150'}
                    alt={product.nome}
                    fill
                    loading="lazy"
                    sizes="(max-width: 768px) 50vw, 300px"
                    className={`object-cover transition-transform duration-500 group-hover:scale-110 ${!hasStock ? 'grayscale opacity-70' : ''}`}
                    quality={75}
                />
            </div>

            {/* RODAPÉ - Informações e Ações */}
            <div className="p-4 flex flex-col flex-grow">
                {/* Nome do Produto */}
                <h3 className="font-bold text-gray-800 text-base mb-1 line-clamp-2 leading-tight">{product.nome}</h3>

                {/* Descrição do Produto */}
                {product.descricao && (
                    <p className="text-gray-500 text-sm mb-2 line-clamp-2 leading-snug">
                        {product.descricao}
                    </p>
                )}

                {/* Preço */}
                <div className="mt-auto">
                    {isMix ? (
                        <p className="text-xl font-bold text-[#FF4B82] mb-1">A partir de R$ {price.toFixed(2).replace('.', ',')}</p>
                    ) : (
                        <p className="text-xl font-bold text-[#FF4B82] mb-1">R$ {price.toFixed(2).replace('.', ',')}</p>
                    )}

                    {/* Estoque Info */}
                    {hasStock && (
                        <p className="text-xs text-gray-400 mb-3">Estoque: {stock}</p>
                    )}

                    {/* Controles de Quantidade */}
                    {hasStock && !isMix && (
                        <div className="flex items-center justify-between mb-3">
                            <button
                                onClick={handleDecrement}
                                disabled={quantity === 0}
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold transition-all active:scale-90 ${quantity === 0
                                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                    : 'bg-[#FF4B82] text-white shadow-md hover:bg-[#e03a6d]'
                                    }`}
                            >
                                −
                            </button>

                            <span className="text-xl font-bold text-gray-700 min-w-[40px] text-center">
                                {quantity}
                            </span>

                            <button
                                onClick={handleIncrement}
                                disabled={quantity >= stock}
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold transition-all active:scale-90 ${quantity >= stock
                                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                    : 'bg-[#FF4B82] text-white shadow-md hover:bg-[#e03a6d]'
                                    }`}
                            >
                                +
                            </button>
                        </div>
                    )}

                    {/* Botão Adicionar ao Carrinho */}
                    <button
                        onClick={handleAddToCart}
                        disabled={!hasStock}
                        data-tour="add-to-cart"
                        className={`w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${hasStock
                            ? 'bg-[#FF4B82] text-white hover:bg-[#e03a6d] shadow-lg shadow-pink-200/50'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        {hasStock ? (
                            isMix ? (
                                <>🎨 Monte o Seu</>
                            ) : (
                                <><img src="/cart-icon-white.png" alt="" className="w-5 h-5 inline-block mr-1" /> Adicionar ao Carrinho</>
                            )
                        ) : (
                            'Indisponível'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
