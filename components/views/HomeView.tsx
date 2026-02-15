import React, { useState } from 'react';
import ProductCard from '../ProductCard';
import SkeletonHomeView from '../ui/SkeletonHomeView';
import BannerCarousel from '../common/BannerCarousel';
import QuickStats from '../common/QuickStats'; // KOMBAI

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
    averageRatings?: Record<string, number>;
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
    onRetry,
    averageRatings = {}
}: HomeViewProps) {
    const [activeCategory, setActiveCategory] = useState('todos');
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [activeFilters, setActiveFilters] = useState<string[]>([]);

    // --- EXTRACT ALL UNIQUE SUBCATEGORIES AS FILTER OPTIONS ---
    const allFilterOptions = React.useMemo(() => {
        const subs = new Set<string>();
        (products || []).forEach(p => {
            if (p.subcategoria) {
                p.subcategoria.split(',').forEach((s: string) => {
                    const trimmed = s.trim();
                    if (trimmed) subs.add(trimmed);
                });
            }
        });
        return Array.from(subs).sort();
    }, [products]);

    // --- FILTER LOGIC ---
    const filteredProducts = (products || []).filter(p => {
        const name = p.nome || p.Nome_Geladinho || '';
        if (!name) return false;

        const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory =
            activeCategory === 'todos' || (p.categoriaId || p.ID_Categoria)?.toString() === activeCategory;

        // Check dietary/attribute filters
        let matchesFilters = true;
        if (activeFilters.length > 0) {
            const productSubs = (p.subcategoria || '').toLowerCase();
            // The following line was syntactically incorrect in the instruction.
            // Assuming the intent was to keep the original logic for matchesFilters
            // and the `} catch (_err) {` was a misplaced snippet or typo.
            matchesFilters = activeFilters.some(filter => productSubs.includes(filter.toLowerCase()));
        }

        return matchesSearch && matchesCategory && matchesFilters;
    });

    const handleCategoryChange = (catId: string) => {
        setActiveCategory(catId);
    };

    const toggleFilter = (filter: string) => {
        setActiveFilters(prev => (prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]));
    };

    const clearAllFilters = () => {
        setActiveFilters([]);
    };

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

            {/* 🆕 REDESIGNED SEARCH BAR + FILTER BUTTON */}
            <div className="-mt-8 mx-6 relative z-20">
                <div className="bg-white rounded-full shadow-lg flex items-center p-1.5 border border-gray-100 group focus-within:border-pink-200 focus-within:shadow-xl transition-all">
                    <div className="pl-4 text-gray-400 group-focus-within:text-[#FF4B82] transition-colors">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.3-4.3" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar geladinho..."
                        className="flex-1 outline-none text-gray-700 bg-transparent font-medium px-3 py-3 placeholder:text-gray-400"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />

                    <div className="h-8 w-[1px] bg-gray-100 mx-1"></div>

                    <button
                        onClick={() => setShowFilterModal(true)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 relative ${activeFilters.length > 0
                            ? 'bg-[#FF4B82] text-white shadow-md shadow-pink-200'
                            : 'text-gray-400 hover:text-[#FF4B82] hover:bg-pink-50'
                            }`}
                        title="Filtrar"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="4" x2="4" y1="21" y2="14" />
                            <line x1="4" x2="4" y1="10" y2="3" />
                            <line x1="12" x2="12" y1="21" y2="12" />
                            <line x1="12" x2="12" y1="8" y2="3" />
                            <line x1="20" x2="20" y1="21" y2="16" />
                            <line x1="20" x2="20" y1="12" y2="3" />
                            <line x1="2" x2="6" y1="14" y2="14" />
                            <line x1="10" x2="14" y1="8" y2="8" />
                            <line x1="18" x2="22" y1="16" y2="16" />
                        </svg>
                        {activeFilters.length > 0 && (
                            <span className="absolute top-2 right-2 bg-white text-[#FF4B82] border-2 border-[#FF4B82] w-3 h-3 rounded-full shadow-sm"></span>
                        )}
                    </button>
                </div>
            </div>

            {/* Active Filters Display (MOVED UP FOR KOMBAI LAYOUT) */}
            {activeFilters.length > 0 && (
                <div className="mx-6 mt-4 flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    {activeFilters.map(filter => (
                        <span
                            key={filter}
                            className="inline-flex items-center gap-1 bg-pink-50 text-[#FF4B82] text-xs font-bold px-3 py-1.5 rounded-full border border-pink-100"
                        >
                            {filter}
                            <button onClick={() => toggleFilter(filter)} className="ml-1 hover:text-pink-700">
                                ✕
                            </button>
                        </span>
                    ))}
                    <button
                        onClick={clearAllFilters}
                        className="text-xs font-bold text-gray-400 hover:text-gray-600 underline"
                    >
                        Limpar todos
                    </button>
                </div>
            )}

            {/* 🆕 TEXT-BASED CATEGORY PILLS */}
            <div className="mt-6 px-6" data-tour="categories">
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {/* "Todos" Pill */}
                    <button
                        onClick={() => handleCategoryChange('todos')}
                        className={`px-6 py-3 rounded-full whitespace-nowrap font-bold text-sm transition-all ${activeCategory === 'todos'
                            ? 'bg-[#FF4B82] text-white shadow-lg shadow-pink-200'
                            : 'bg-white text-gray-500 border border-gray-200 hover:border-pink-200'
                            }`}
                    >
                        Todos
                    </button>

                    {/* Dynamic Category Pills */}
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => handleCategoryChange(cat.id)}
                            className={`px-6 py-3 rounded-full whitespace-nowrap font-bold text-sm transition-all ${activeCategory === cat.id
                                ? 'bg-[#FF4B82] text-white shadow-lg shadow-pink-200'
                                : 'bg-white text-gray-500 border border-gray-200 hover:border-pink-200'
                                }`}
                        >
                            {cat.nome}
                        </button>
                    ))}
                </div>
            </div>



            {/* QUICK STATS (Pontos) - Mantido do Kombai */}
            {!user?.isGuest && (
                <QuickStats points={user?.points || user?.pontos || 0} nextLevel={500} />
            )}

            {/* ORIGINAL GITHUB BANNER (Carousel) - Restored */}
            <div className="mx-6 mt-6">
                <BannerCarousel
                    banners={
                        banners && banners.length > 0
                            ? banners
                            : [
                                {
                                    id: 'default-clube-capivara',
                                    image: '/clube-capivara-banner.jpg',
                                    title: 'Ganhe Pontos Toda Vez Que Comprar!',
                                    subtitle:
                                        'Cada R$1 vira ponto. Troque por descontos e brindes. Indicou amigo? Ganhe +50 pontos!',
                                    ctaText: 'Ver Cardápio'
                                }
                            ]
                    }
                    onCtaClick={handleBannerClick}
                    autoPlayInterval={5000}
                    priority={true}
                />
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

            {/* Empty State */}
            {!hasError && filteredProducts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 px-6">
                    <div className="text-8xl mb-4">😔</div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                        {searchTerm || activeFilters.length > 0
                            ? 'Nenhum produto encontrado'
                            : 'Sem estoque no momento'}
                    </h3>
                    <p className="text-gray-500 text-center mb-6 max-w-md">
                        {searchTerm
                            ? `Não encontramos produtos com "${searchTerm}". Tente buscar por outro termo.`
                            : activeFilters.length > 0
                                ? 'Nenhum produto corresponde aos filtros selecionados.'
                                : 'Todos os nossos produtos estão esgotados no momento. Estamos reabastecendo! Volte em breve.'}
                    </p>
                    {(searchTerm || activeFilters.length > 0) && (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                clearAllFilters();
                            }}
                            className="bg-gradient-to-r from-[#FF4B82] to-[#FF9E3D] text-white px-6 py-3 rounded-full font-bold shadow-lg hover:opacity-90 transition"
                        >
                            Limpar Filtros
                        </button>
                    )}
                    {!searchTerm && activeFilters.length === 0 && activeCategory !== 'todos' && (
                        <button
                            onClick={() => setActiveCategory('todos')}
                            className="bg-gradient-to-r from-[#FF4B82] to-[#FF9E3D] text-white px-6 py-3 rounded-full font-bold shadow-lg hover:opacity-90 transition"
                        >
                            Ver Todas as Categorias
                        </button>
                    )}
                </div>
            )}

            {/* Product Grid */}
            {filteredProducts.length > 0 && (
                <div id="products-grid" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-6 mt-6">
                    {filteredProducts.map(product => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            isFavorite={favorites.includes(product.id)}
                            onToggleFavorite={!user?.isGuest ? onToggleFavorite : undefined}
                            onAddToCart={onAddToCart}
                            onProductClick={onProductClick}
                            isCondoUser={!!user?.savedAddress?.torre || user?.condominio === true}
                            averageRating={
                                averageRatings[
                                product.id?.toString() || (product.ID_Geladinho || product.ID_Produto)?.toString()
                                ]
                            }
                        />
                    ))}
                </div>
            )}

            {/* 🆕 FILTER MODAL */}
            {showFilterModal && (
                <div
                    className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setShowFilterModal(false)}
                >
                    <div
                        className="bg-white w-full max-w-lg rounded-t-[40px] p-8 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-300"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>

                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-gray-900">Filtrar Produtos</h3>
                            <button
                                onClick={() => setShowFilterModal(false)}
                                className="text-gray-400 hover:text-gray-600 text-2xl"
                            >
                                ✕
                            </button>
                        </div>

                        <p className="text-sm text-gray-500 mb-4">Selecione os tipos de produto que deseja ver:</p>

                        {allFilterOptions.length === 0 ? (
                            <p className="text-gray-400 text-center py-8">Nenhuma opção de filtro disponível.</p>
                        ) : (
                            <div className="flex flex-wrap gap-3 mb-8">
                                {allFilterOptions.map(option => (
                                    <button
                                        key={option}
                                        onClick={() => toggleFilter(option)}
                                        className={`px-5 py-3 rounded-full font-bold text-sm transition-all border-2 ${activeFilters.includes(option)
                                            ? 'bg-[#FF4B82] border-[#FF4B82] text-white shadow-lg shadow-pink-100'
                                            : 'bg-white border-gray-200 text-gray-500 hover:border-pink-200'
                                            }`}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={clearAllFilters}
                                className="flex-1 py-4 rounded-2xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                                Limpar
                            </button>
                            <button
                                onClick={() => setShowFilterModal(false)}
                                className="flex-1 py-4 rounded-2xl font-bold text-white bg-[#FF4B82] shadow-lg shadow-pink-200 hover:bg-pink-600 transition-colors"
                            >
                                Aplicar Filtros
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
