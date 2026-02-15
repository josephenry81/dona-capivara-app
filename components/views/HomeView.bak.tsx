import React, { useState } from 'react';
import ProductCard from '../ProductCard';
import SkeletonHomeView from '../ui/SkeletonHomeView';
import BannerCarousel from '../common/BannerCarousel';

interface HomeViewProps {
    user: any;
    products: any[];
    categories: any[];
    banners: any[];
    favorites: string[];
    onAddToCart: (product: any) => void;
    onToggleFavorite: (id: string) => void;
    onProductClick: (product: any) => void;
    onHeaderAction: () => void;
    isLoading?: boolean;
    hasError?: boolean;
    onRetry?: () => void;
}

export default function HomeView({
    user,
    products,
    categories,
    banners,
    favorites,
    onAddToCart,
    onToggleFavorite,
    onProductClick,
    onHeaderAction,
    isLoading = false,
    hasError = false,
    onRetry
}: HomeViewProps) {
    const [activeCategory, setActiveCategory] = useState('todos');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProducts = (products || []).filter(p => {
        const name = p.nome || p.Nome_Geladinho || '';
        if (!name) return false;
        const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory =
            activeCategory === 'todos' || (p.categoriaId || p.ID_Categoria)?.toString() === activeCategory;
        return matchesSearch && matchesCategory;
    });

    // 🔥 OTIMIZAÇÃO: Mostrar skeleton apenas durante o carregamento inicial
    if (isLoading) return <SkeletonHomeView />;

    const handleBannerClick = () => {
        const el = document.getElementById('products-grid');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-[#F5F6FA] pb-24">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#FF4B82] to-[#FF9E3D] pt-12 pb-24 px-6 rounded-b-[40px] relative z-0">
                <div className="flex justify-between items-start text-white relative z-10">
                    <div>
                        <p className="text-sm opacity-90">Bem-vindo(a)!</p>
                        <h2 className="text-2xl font-bold">{user?.name || 'Dona Capivara'}</h2>
                    </div>

                    {/* --- FIXED BUTTON --- */}
                    <button
                        onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            onHeaderAction();
                        }}
                        className="bg-white/20 backdrop-blur-md p-2 rounded-full hover:bg-white/30 transition flex items-center justify-center w-10 h-10 shadow-md cursor-pointer z-50 pointer-events-auto"
                        title={user?.isGuest ? 'Fazer Login' : 'Sair da Conta'}
                    >
                        {user?.isGuest ? <span className="text-xl">🔐</span> : <span className="text-xl">🚪</span>}
                    </button>
                </div>
            </div>

            {/* Search - Lower Z-Index to not block header */}
            <div className="-mt-8 mx-6 relative z-20">
                <div className="bg-white rounded-full shadow-lg flex items-center p-4">
                    <span className="text-gray-400 mr-2">🔍</span>
                    <input
                        type="text"
                        placeholder="Buscar geladinho..."
                        className="flex-1 outline-none text-gray-700 bg-transparent"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Banner Carousel - Sistema Configurável
                IMPORTANTE: Para trocar o banner padrão via banco de dados:
                1. Adicione um campo "banner_padrao" na sua tabela de configurações
                2. Retorne esse banner junto com os outros banners da API
                3. Ou crie um endpoint separado: /getBannerPadrao
                4. O banner padrão só aparece quando não há banners do backend
                
                Configuração atual do banner padrão (pode ser movida para o banco):
            */}
            <div className="mx-6">
                <BannerCarousel
                    banners={
                        banners && banners.length > 0
                            ? banners
                            : [
                                  {
                                      id: 'default-clube-capivara',
                                      image: '/clube-capivara-banner.jpg', // TROCAR: Pode vir do banco de dados
                                      title: 'Ganhe Pontos Toda Vez Que Comprar!', // TROCAR: Pode vir do banco
                                      subtitle:
                                          'Cada R$1 vira ponto. Troque por descontos e brindes. Indicou amigo? Ganhe +50 pontos!', // TROCAR: Pode vir do banco
                                      ctaText: 'Ver Cardápio' // TROCAR: Pode vir do banco
                                  }
                              ]
                    }
                    onCtaClick={handleBannerClick}
                    autoPlayInterval={5000}
                    priority={true}
                />
            </div>

            {/* Points Banner (Registered Only) */}
            {!user?.isGuest && (
                <div className="mx-6 mb-6 bg-white p-4 rounded-2xl shadow-sm border-l-4 border-[#FF4B82] flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-sm text-gray-800">Clube Capivara</h3>
                        <p className="text-xs text-gray-500">
                            Você tem <span className="text-[#FF4B82] font-bold">{user?.points || 0}</span> pontos
                        </p>
                    </div>
                </div>
            )}

            {/* Categories */}
            <div data-tour="categories" className="flex gap-3 overflow-x-auto px-6 pb-4 scrollbar-hide">
                <button
                    onClick={() => setActiveCategory('todos')}
                    className={`px-6 py-2 rounded-full whitespace-nowrap font-bold text-sm transition-all ${activeCategory === 'todos' ? 'bg-[#FF4B82] text-white shadow-md' : 'bg-white text-gray-500 border border-gray-100'}`}
                >
                    🔥 Todos
                </button>
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`px-6 py-2 rounded-full whitespace-nowrap font-bold text-sm transition-all ${activeCategory === cat.id ? 'bg-[#FF4B82] text-white shadow-md' : 'bg-white text-gray-500 border border-gray-100'}`}
                    >
                        {cat.nome}
                    </button>
                ))}
            </div>

            {/* Error State */}
            {hasError && (
                <div className="flex flex-col items-center justify-center py-20 px-6">
                    <div className="text-8xl mb-6">📡</div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2 text-center">Ops! Problema de Conexão</h3>
                    <p className="text-gray-500 text-center mb-8 max-w-md">
                        Não conseguimos carregar o cardápio. Isso pode ser instabilidade no servidor ou na sua internet.
                    </p>
                    <button
                        onClick={onRetry}
                        className="bg-gradient-to-r from-[#FF4B82] to-[#FF9E3D] text-white px-8 py-4 rounded-full font-bold shadow-xl hover:scale-105 transition-transform flex items-center gap-2"
                    >
                        <span>🔄</span> Tentar Novamente
                    </button>
                    <p className="text-xs text-gray-400 mt-6 animate-pulse">
                        Dica: Verifique sua conexão e tente carregar novamente.
                    </p>
                </div>
            )}

            {/* Empty State - No Products Available (ONLY if NOT error) */}
            {!hasError && filteredProducts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 px-6">
                    <div className="text-8xl mb-4">😔</div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                        {searchTerm ? 'Nenhum produto encontrado' : 'Sem estoque no momento'}
                    </h3>
                    <p className="text-gray-500 text-center mb-6 max-w-md">
                        {searchTerm
                            ? `Não encontramos produtos com "${searchTerm}". Tente buscar por outro termo.`
                            : 'Todos os nossos produtos estão esgotados no momento. Estamos reabastecendo! Volte em breve.'}
                    </p>
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="bg-gradient-to-r from-[#FF4B82] to-[#FF9E3D] text-white px-6 py-3 rounded-full font-bold shadow-lg hover:opacity-90 transition"
                        >
                            Limpar Busca
                        </button>
                    )}
                    {!searchTerm && activeCategory !== 'todos' && (
                        <button
                            onClick={() => setActiveCategory('todos')}
                            className="bg-gradient-to-r from-[#FF4B82] to-[#FF9E3D] text-white px-6 py-3 rounded-full font-bold shadow-lg hover:opacity-90 transition"
                        >
                            Ver Todas as Categorias
                        </button>
                    )}
                </div>
            )}

            {/* Grid */}
            {filteredProducts.length > 0 && (
                <div id="products-grid" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-6 mt-4">
                    {filteredProducts.map(product => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            isFavorite={favorites.includes(product.id)}
                            onToggleFavorite={!user?.isGuest ? onToggleFavorite : undefined}
                            onAddToCart={onAddToCart}
                            onProductClick={onProductClick}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
