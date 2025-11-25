import React, { useState } from 'react';
import ProductCard from '../ProductCard';
import LoadingCapybara from '../ui/LoadingCapybara';
import Banner from '../common/Banner';

interface HomeViewProps {
    user: any;
    products: any[];
    categories: any[];
    banners: any[];
    favorites: string[];
    onAddToCart: (product: any) => void;
    onToggleFavorite: (id: string) => void;
    onProductClick: (product: any) => void;
    onHeaderAction: () => void; // NEW PROP
}

export default function HomeView({
    user, products, categories, banners, favorites,
    onAddToCart, onToggleFavorite, onProductClick, onHeaderAction
}: HomeViewProps) {

    const [activeCategory, setActiveCategory] = useState('todos');
    const [searchTerm, setSearchTerm] = useState('');

    // Defensive check
    const filteredProducts = (products || []).filter(p => {
        const name = p.nome || p.Nome_Geladinho || '';
        if (!name) return false;
        const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = activeCategory === 'todos' || (p.categoriaId || p.ID_Categoria)?.toString() === activeCategory;
        return matchesSearch && matchesCategory;
    });

    if (!products || products.length === 0) return <LoadingCapybara />;

    const handleBannerClick = () => {
        const el = document.getElementById('products-grid');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-[#F5F6FA] pb-24">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#FF4B82] to-[#FF9E3D] pt-12 pb-24 px-6 rounded-b-[40px]">
                <div className="flex justify-between items-start text-white">
                    <div>
                        <p className="text-sm opacity-90">Bem-vindo(a)!</p>
                        <h2 className="text-2xl font-bold">{user?.name || 'Dona Capivara'}</h2>
                    </div>

                    {/* --- SMART AUTH BUTTON --- */}
                    <button
                        onClick={onHeaderAction}
                        className="bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition flex items-center justify-center w-10 h-10 shadow-sm"
                        title={user?.isGuest ? "Fazer Login" : "Sair da Conta"}
                    >
                        {user?.isGuest ? (
                            <span className="text-lg">🔐</span> // Guest sees Login
                        ) : (
                            <span className="text-lg">🚪</span> // User sees Logout
                        )}
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="-mt-8 mx-6 relative z-20">
                <div className="bg-white rounded-full shadow-lg flex items-center p-4">
                    <span className="text-gray-400 mr-2">🔍</span>
                    <input
                        type="text"
                        placeholder="Buscar geladinho..."
                        className="flex-1 outline-none text-gray-700 bg-transparent"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Banner */}
            <div className="mx-6">
                {banners && banners.length > 0 ? (
                    <Banner
                        imageUrl={banners[0].image}
                        altText={banners[0].title}
                        title={banners[0].title}
                        subtitle={banners[0].subtitle}
                        ctaText={banners[0].ctaText}
                        onCtaClick={handleBannerClick}
                        priority={true}
                    />
                ) : (
                    <Banner
                        imageUrl="https://img.freepik.com/free-vector/flat-design-food-sale-banner_23-2149137947.jpg"
                        altText="Banner Padrão"
                        title="Bem-vindo à Dona Capivara"
                        subtitle="Os melhores geladinhos da cidade!"
                        ctaText="Ver Cardápio"
                        onCtaClick={handleBannerClick}
                    />
                )}
            </div>

            {/* Points Banner (Registered Only) */}
            {!user?.isGuest && (
                <div className="mx-6 mb-6 bg-white p-4 rounded-2xl shadow-sm border-l-4 border-[#FF4B82] flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-sm text-gray-800">Clube Capivara</h3>
                        <p className="text-xs text-gray-500">Você tem <span className="text-[#FF4B82] font-bold">{user?.points || 0}</span> pontos</p>
                    </div>
                </div>
            )}

            {/* Categories */}
            <div className="flex gap-3 overflow-x-auto px-6 pb-4 scrollbar-hide">
                <button onClick={() => setActiveCategory('todos')} className={`px-6 py-2 rounded-full whitespace-nowrap font-bold text-sm transition-all ${activeCategory === 'todos' ? 'bg-[#FF4B82] text-white shadow-md' : 'bg-white text-gray-500 border border-gray-100'}`}>🔥 Todos</button>
                {categories.map(cat => (
                    <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`px-6 py-2 rounded-full whitespace-nowrap font-bold text-sm transition-all ${activeCategory === cat.id ? 'bg-[#FF4B82] text-white shadow-md' : 'bg-white text-gray-500 border border-gray-100'}`}>{cat.nome}</button>
                ))}
            </div>

            {/* Grid */}
            <div id="products-grid" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-6 mt-4">
                {filteredProducts.map(product => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        isFavorite={favorites.includes(product.id)}
                        onToggleFavorite={onToggleFavorite}
                        onAddToCart={onAddToCart}
                        onProductClick={onProductClick}
                    />
                ))}
            </div>
        </div>
    );
}
