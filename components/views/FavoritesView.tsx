import React from 'react';
import { Geladinho } from '../../types/googleSheetTypes';
import ProductCard from '../ProductCard';

interface FavoritesViewProps {
    products: Geladinho[];
    favorites: string[];
    onAddToCart: (product: any) => void;
    onToggleFavorite: (productId: string) => void;
    onProductClick: (product: any) => void;
}

export default function FavoritesView({
    products,
    favorites,
    onAddToCart,
    onToggleFavorite,
    onProductClick
}: FavoritesViewProps) {
    const favoriteProducts = products.filter(p => favorites.includes(p.id));

    return (
        <div className="min-h-screen bg-gray-50" style={{ paddingBottom: '80px' }}>
            <header className="bg-gradient-to-r from-[#FF4B82] to-[#FF9E3D] pt-12 pb-8 px-6 rounded-b-[40px]">
                <div>
                    <p className="text-white text-sm opacity-90 mb-1">Seus Favoritos</p>
                    <h2 className="text-white text-2xl font-bold">
                        ❤️ {favoriteProducts.length} {favoriteProducts.length === 1 ? 'item' : 'itens'}
                    </h2>
                </div>
            </header>

            {favoriteProducts.length === 0 ? (
                <div className="text-center py-20 px-6">
                    <div className="text-6xl mb-4">💔</div>
                    <h3 className="text-xl font-bold text-gray-700 mb-2">Nenhum favorito ainda</h3>
                    <p className="text-gray-500">
                        Toque no ♥ nos produtos para adicioná-los aos favoritos!
                    </p>
                </div>
            ) : (
                <div className="mt-6 px-6 pb-24">
                    <div className="text-lg font-bold text-gray-800 mb-4">
                        Seus Geladinhos Favoritos
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {favoriteProducts.map(product => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onAddToCart={onAddToCart}
                                onToggleFavorite={onToggleFavorite}
                                onProductClick={onProductClick}
                                isFavorite={true}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
