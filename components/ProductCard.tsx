import React from 'react';

interface Product {
    id: string;
    nome: string;
    price: number;
    imagem?: string;
    estoque: number;
    [key: string]: any;
}

interface ProductCardProps {
    product: Product;
    isFavorite?: boolean;
    onToggleFavorite?: (id: string) => void;
    onAddToCart?: (product: Product) => void;
    onProductClick?: (product: Product) => void;
}

export default function ProductCard({ product, isFavorite, onToggleFavorite, onAddToCart, onProductClick }: ProductCardProps) {
    const price = Number(product.price || 0);
    const stock = Number(product.estoque || 0);
    const hasStock = stock > 0;

    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onToggleFavorite) {
            onToggleFavorite(product.id);
        } else {
            console.warn("onToggleFavorite not provided");
        }
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onAddToCart) {
            onAddToCart(product);
        } else {
            console.error("onAddToCart function is missing!");
            alert("Erro interno: Função de carrinho indisponível.");
        }
    };

    return (
        <div className="flex flex-col bg-white rounded-2xl shadow-md overflow-hidden relative h-full hover:shadow-lg transition-shadow group">
            {/* Badges */}
            <div className="absolute top-2 left-2 z-20 flex flex-col gap-1 pointer-events-none">
                {!hasStock && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">Esgotado</span>}
                {hasStock && stock < 5 && <span className="bg-orange-400 text-white text-[10px] font-bold px-2 py-1 rounded-full">Estoque baixo!</span>}
            </div>

            {/* Favorite Button - Always Visible */}
            <button
                onClick={handleFavoriteClick}
                className="absolute top-2 right-2 z-20 bg-white/80 p-1.5 rounded-full shadow-sm hover:bg-white transition cursor-pointer active:scale-90"
                title="Favoritar"
            >
                {isFavorite ? '❤️' : '🤍'}
            </button>

            {/* Image Area */}
            <div
                onClick={() => onProductClick?.(product)}
                className="w-full h-40 bg-gray-100 relative cursor-pointer overflow-hidden"
            >
                <img
                    src={product.imagem || 'https://via.placeholder.com/150'}
                    alt={product.nome}
                    className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${!hasStock ? 'grayscale' : ''}`}
                />
            </div>

            {/* Content */}
            <div className="p-3 flex flex-col flex-grow justify-between">
                <h3 className="font-bold text-gray-800 text-sm mb-1 line-clamp-2 leading-tight">{product.nome}</h3>

                <div className="mt-2">
                    <p className="text-lg font-bold text-[#FF4B82]">R$ {price.toFixed(2)}</p>

                    <button
                        onClick={handleAddToCart}
                        disabled={!hasStock}
                        className={`w-full mt-2 py-2 rounded-lg font-bold text-sm transition-all active:scale-95 ${hasStock
                            ? 'bg-gradient-to-r from-[#FF4B82] to-[#FF9E3D] text-white hover:opacity-90 shadow-md shadow-orange-100'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        {hasStock ? '+ Adicionar' : 'Indisponível'}
                    </button>
                </div>
            </div>
        </div>
    );
}
