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
    averageRating?: number;
}

export default function ProductCard({ product, isFavorite, onToggleFavorite, onAddToCart, onProductClick, averageRating }: ProductCardProps) {
    const { alert, Modal: CustomModal } = useModal();
    const [quantity, setQuantity] = useState(0);
    const price = Number(product.price || 0);
    const stock = Number(product.estoque || 0);
    const hasStock = stock > 0;
    const isMix = (product as any).isMix === true || (product as any).ID_Tipo_Produto === 'TP-003' || (product as any).nome?.toLowerCase().includes('mix');

    const handleIncrement = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (quantity < stock) {
            setQuantity(prev => prev + 1);
        } else {
            alert('⚠️ Estoque Máximo', 'Não temos mais unidades deste produto no momento.', 'warning');
        }
    };

    const handleDecrement = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (quantity > 0) setQuantity(prev => prev - 1);
    };

    // Marketplace Practice: Detect New Products
    const creationDate = product.criado_em || product.Data || (product as any).createdAt;
    const isNew = creationDate ? (new Date().getTime() - new Date(creationDate).getTime()) < (30 * 24 * 60 * 60 * 1000) : true;

    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleFavorite?.(product.id);
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isMix && onProductClick) {
            onProductClick(product);
            return;
        }

        const qty = quantity > 0 ? quantity : 1;
        onAddToCart?.(product, qty);
        setQuantity(0); // Reset after adding
    };

    return (
        <div
            onClick={() => onProductClick?.(product)}
            data-tour="product-card"
            className="group flex flex-col bg-white rounded-[32px] overflow-hidden relative h-full transition-all duration-500 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.12)] border border-gray-100/60 cursor-pointer active:scale-[0.98]"
        >
            <CustomModal />

            {/* Top Badges & Actions */}
            <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start pointer-events-none">
                <div className="flex flex-col gap-2">
                    {!hasStock && (
                        <span className="bg-red-500 text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-lg uppercase tracking-wider">Esgotado</span>
                    )}
                    {hasStock && stock < 5 && (
                        <span className="bg-orange-500 text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-lg uppercase tracking-wider animate-pulse">Últimas {stock}!</span>
                    )}
                    {hasStock && isNew && (
                        <span className="bg-[#FF4B82] text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-lg uppercase tracking-wider">Novo</span>
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
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
                    </button>
                )}
            </div>

            {/* Product Image */}
            <div className="relative w-full h-48 bg-gray-50 overflow-hidden">
                <Image
                    src={product.imagem || '/product-placeholder.png'}
                    alt={product.nome}
                    fill
                    loading="lazy"
                    sizes="(max-width: 768px) 50vw, 300px"
                    className={`object-cover transition-transform duration-700 group-hover:scale-110 ${!hasStock ? 'grayscale opacity-70' : ''}`}
                    quality={85}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>

            {/* Content Area */}
            <div className="p-5 flex flex-col flex-grow">
                <div className="mb-2">
                    <h3 className="font-black text-gray-900 text-lg leading-tight mb-1">
                        {product.nome}
                    </h3>
                    {product.descricao && (
                        <p className="text-gray-400 text-xs font-medium leading-relaxed line-clamp-2">
                            {product.descricao}
                        </p>
                    )}
                </div>

                <div className="flex flex-col mb-4">
                    <div className="flex items-baseline gap-2">
                        {isMix && <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest">A partir de</span>}
                        <span className="text-2xl font-black text-[#FF4B82] tabular-nums">
                            R$ {price.toFixed(2).replace('.', ',')}
                        </span>
                    </div>
                    {hasStock && (
                        <span className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-wide">
                            Estoque: {stock}
                        </span>
                    )}
                </div>

                {/* Quantity Selector & Add Button Block */}
                <div className="mt-auto space-y-3">
                    {!isMix && hasStock && (
                        <div className="flex items-center justify-between bg-gray-50/50 p-2 rounded-[24px] border border-gray-100">
                            <button
                                onClick={handleDecrement}
                                className="w-10 h-10 flex items-center justify-center bg-white text-[#FF4B82] rounded-full shadow-sm hover:scale-110 active:scale-95 transition-all text-xl font-black border border-gray-100"
                            >
                                −
                            </button>
                            <span className="font-black text-gray-800 text-lg tabular-nums">
                                {quantity}
                            </span>
                            <button
                                onClick={handleIncrement}
                                className="w-10 h-10 flex items-center justify-center bg-[#FF4B82] text-white rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all text-xl font-black"
                            >
                                +
                            </button>
                        </div>
                    )}

                    <button
                        onClick={handleAddToCart}
                        disabled={!hasStock}
                        className={`w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-black text-sm transition-all active:scale-[0.97] shadow-lg ${hasStock
                            ? 'bg-[#FF4B82] text-white shadow-pink-100 hover:shadow-pink-200'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>
                        {isMix ? 'Personalizar' : 'Adicionar ao Carrinho'}
                    </button>
                </div>
            </div>
        </div>
    );
}
