import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import ShareButton from '../ui/ShareButton';
import RatingStars from '../product/RatingStars';
import ReviewForm from '../product/ReviewForm';
import ReviewsList from '../product/ReviewsList';
import AdditionGroup from '../product/AdditionGroup';
import PriceCalculator from '../product/PriceCalculator';
import { ReviewService, Review } from '../../services/reviews';
import { API } from '../../services/api';
import { ProductWithAdditions, SelectedAddition, AdditionGroup as AdditionGroupType } from '../../types/additions';
import { useModal } from '../ui/Modal';


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
    onAddToCart: (product: Product, quantity: number, additions?: SelectedAddition[]) => void;
    user?: any;
}

export default function ProductDetailView({ product, onBack, onAddToCart, user }: ProductDetailProps) {
    const [quantity, setQuantity] = useState(1);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [averageRating, setAverageRating] = useState(0);

    // Additions state
    const [productWithAdditions, setProductWithAdditions] = useState<ProductWithAdditions | null>(null);
    const [selectedAdditions, setSelectedAdditions] = useState<SelectedAddition[]>([]);
    const [selectedOptionsByGroup, setSelectedOptionsByGroup] = useState<Record<string, string[]>>({});
    const [loadingAdditions, setLoadingAdditions] = useState(false);
    const { alert, Modal: CustomModal } = useModal();


    const handleIncrement = () => {
        if (quantity < product.estoque) {
            setQuantity(q => q + 1);
        } else {
            alert('⚠️ Limite de Estoque', `Ops! Temos apenas ${product.estoque} unidades disponíveis.`, 'warning');
        }
    };

    const handleDecrement = () => {
        if (quantity > 1) setQuantity(q => q - 1);
    };

    // ⚡ OPTIMIZED: Fetch product with additions (with caching and optimistic rendering)
    useEffect(() => {
        async function fetchProductData() {
            if (product?.id) {
                // Fetch reviews (parallel, non-blocking)
                ReviewService.getProductReviews(product.id).then((data) => {
                    setReviews(data);
                    setAverageRating(ReviewService.calculateAverageRating(data));
                });

                // ✅ OPTIMISTIC: Set structure immediately to reduce perceived latency
                setProductWithAdditions({
                    ...product,
                    addition_groups: [] // Empty but structure exists
                } as any);
                setLoadingAdditions(true);

                // Fetch additions with cache support
                try {
                    const productData = await API.getProductWithAdditions(product.id);
                    if (productData && !productData.error) {
                        setProductWithAdditions(productData);
                    } else {
                        // Fallback: product without additions
                        setProductWithAdditions(product as any);
                    }
                } catch (error) {
                    console.error('Error loading additions:', error);
                    setProductWithAdditions(product as any);
                } finally {
                    setLoadingAdditions(false);
                }
            }
        }
        fetchProductData();
    }, [product]);

    const handleSubmitReview = async (rating: number, comment: string) => {
        if (!user || !user.id || user.isGuest) {
            alert(
                '🔐 Login Necessário',
                'Você precisa estar logado na sua conta para avaliar nossos produtos.',
                'info'
            );
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
            alert(
                '✅ Avaliação Enviada!',
                'Sua avaliação foi enviada com sucesso e está aguardando aprovação pelo administrador.',
                'success'
            );
            setShowReviewForm(false);
            const updatedReviews = await ReviewService.getProductReviews(product.id);
            setReviews(updatedReviews);
            setAverageRating(ReviewService.calculateAverageRating(updatedReviews));
        } else {
            alert(
                '⚠️ Erro ao Avaliar',
                result.message || 'Não foi possível enviar sua avaliação no momento.',
                'error'
            );
        }
    };

    useEffect(() => {
        if (showReviewForm && (!user || !user.id || user.isGuest)) {
            setShowReviewForm(false);
            alert(
                '⚠️ Sessão Expirada',
                'Sua sessão expirou. Por favor, faça login novamente para poder avaliar.',
                'warning'
            );
        }
    }, [user, showReviewForm]);

    // Handle addition selection
    const handleAdditionSelection = (groupId: string, optionId: string, group: AdditionGroupType) => {
        setSelectedOptionsByGroup(prev => {
            const currentSelections = prev[groupId] || [];

            if (group.type === 'single') {
                // Radio button behavior: replace selection
                const newSelections = currentSelections.includes(optionId) ? [] : [optionId];
                return { ...prev, [groupId]: newSelections };
            } else {
                // Checkbox behavior: toggle selection
                const newSelections = currentSelections.includes(optionId)
                    ? currentSelections.filter(id => id !== optionId)
                    : [...currentSelections, optionId];
                return { ...prev, [groupId]: newSelections };
            }
        });
    };

    // Update selectedAdditions whenever selectedOptionsByGroup changes
    useEffect(() => {
        if (!productWithAdditions?.addition_groups) return;

        const additions: SelectedAddition[] = [];

        productWithAdditions.addition_groups.forEach(group => {
            const selectedOptions = selectedOptionsByGroup[group.id] || [];
            selectedOptions.forEach(optionId => {
                const option = group.options.find(o => o.id === optionId);
                if (option) {
                    additions.push({
                        group_id: group.id,
                        group_name: group.name,
                        option_id: option.id,
                        option_sku: option.sku,
                        option_name: option.name,
                        option_price: option.price
                    });
                }
            });
        });

        setSelectedAdditions(additions);
    }, [selectedOptionsByGroup, productWithAdditions]);

    const handleAddToCart = () => {
        if (product.estoque < 1) {
            alert('🚫 Produto Esgotado', 'Desculpe, este produto acabou de esgotar.', 'warning');
            return;
        }
        if (quantity > product.estoque) {
            alert('⚠️ Estoque Insuficiente', `Temos apenas ${product.estoque} unidades disponíveis.`, 'warning');
            setQuantity(product.estoque);
            return;
        }
        onAddToCart(product, quantity, selectedAdditions.length > 0 ? selectedAdditions : undefined);
    };

    const hasAdditions = productWithAdditions?.addition_groups && productWithAdditions.addition_groups.length > 0;
    const basePrice = product.price;

    // ============================================
    // MIX PRODUCT HANDLING (V16.0 Integration)
    // ============================================
    const isMix = product && (product as any).ID_Categoria === 'MIX';

    if (isMix && productWithAdditions && productWithAdditions.addition_groups) {
        // Separar grupo de sabores (GRP-003) dos outros
        const flavorGroup = productWithAdditions.addition_groups.find(
            (g: any) => g.id === 'GRP-003'
        );

        const otherGroups = productWithAdditions.addition_groups.filter(
            (g: any) => g.id !== 'GRP-003'
        );

        const additionsTotal = selectedAdditions.reduce((sum, add) => sum + add.option_price, 0);
        const unitPrice = basePrice + additionsTotal;
        const totalPrice = unitPrice * quantity;

        return (
            <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex flex-col relative animate-in slide-in-from-right duration-300">
                <CustomModal />

                {/* Fixed Navigation Button */}
                <button
                    onClick={onBack}
                    className="fixed top-4 left-4 z-50 bg-white/90 backdrop-blur-md p-3 rounded-full shadow-lg border border-gray-100 hover:scale-110 transition active:scale-95"
                    aria-label="Voltar"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                {/* Hero Section - Mix */}
                <div className="relative h-[30vh] w-full bg-gradient-to-br from-pink-400 via-purple-400 to-orange-400 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="relative text-center text-white z-10">
                        <h1 className="text-4xl font-bold mb-2">🍦 {product.nome}</h1>
                        <p className="text-sm opacity-90">Monte sua combinação perfeita!</p>
                    </div>
                </div>

                {/* Content Body */}
                <div className="flex-1 p-6 flex flex-col -mt-8 bg-white rounded-t-[35px] relative z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] pb-32">

                    <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 opacity-50"></div>

                    {/* Mix Info Card */}
                    <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-5 rounded-2xl mb-6 border-2 border-pink-200">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-3xl">🎨</span>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Monte seu Mix</h2>
                                <p className="text-sm text-gray-600">{product.descricao || 'Personalize do seu jeito!'}</p>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2 bg-white p-3 rounded-xl">
                            <span className="text-sm text-gray-600">Preço base:</span>
                            <span className="text-2xl font-bold text-pink-600">R$ {basePrice.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Flavors Section (GRP-003) */}
                    {flavorGroup && (
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-2xl">🍓</span>
                                <h3 className="text-lg font-bold text-gray-800">
                                    {flavorGroup.name}
                                    <span className="text-sm font-normal text-gray-500 ml-2">
                                        (Escolha {flavorGroup.min} a {flavorGroup.max})
                                    </span>
                                </h3>
                            </div>

                            <AdditionGroup
                                group={flavorGroup}
                                selectedOptions={selectedOptionsByGroup[flavorGroup.id] || []}
                                onSelectionChange={(optionId) => handleAdditionSelection(flavorGroup.id, optionId, flavorGroup)}
                            />
                        </div>
                    )}

                    {/* Other Addition Groups (Caldas, Toppings, etc.) */}
                    {otherGroups && otherGroups.length > 0 && (
                        <div className="space-y-4 mb-6">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <span>🎨</span> Personalize ainda mais
                            </h3>
                            {otherGroups.map((group: any) => (
                                <AdditionGroup
                                    key={group.id}
                                    group={group}
                                    selectedOptions={selectedOptionsByGroup[group.id] || []}
                                    onSelectionChange={(optionId) => handleAdditionSelection(group.id, optionId, group)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Price Breakdown */}
                    <div className="bg-gray-50 p-5 rounded-2xl mb-6 space-y-3 border border-gray-200">
                        <h3 className="font-bold text-gray-800 mb-3">💰 Resumo do Pedido</h3>

                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Base Mix:</span>
                            <span className="font-semibold">R$ {basePrice.toFixed(2)}</span>
                        </div>

                        {selectedAdditions.length > 0 && (
                            <div className="space-y-2 border-t pt-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Selecionados ({selectedAdditions.length}):</span>
                                    <span className="font-semibold">R$ {additionsTotal.toFixed(2)}</span>
                                </div>
                                {selectedAdditions.map((add, idx) => (
                                    <div key={idx} className="flex justify-between text-xs text-gray-500 ml-2">
                                        <span>• {add.option_name}</span>
                                        <span>R$ {add.option_price.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="border-t pt-3 flex justify-between items-center">
                            <span className="font-bold text-gray-800">Preço Unitário:</span>
                            <span className="text-xl font-bold text-pink-600">R$ {unitPrice.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Reviews */}
                    {averageRating > 0 && (
                        <div className="mb-24">
                            <div className="flex items-center gap-2 mb-4">
                                <RatingStars rating={averageRating} size="md" />
                                <span className="text-sm text-gray-600">
                                    ({reviews.length} {reviews.length === 1 ? 'avaliação' : 'avaliações'})
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 p-4 pb-8 flex items-center gap-4 z-40 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">

                        {/* Quantity Selector */}
                        <div className="flex items-center bg-gray-100 rounded-xl px-3 py-2 h-14">
                            <button
                                onClick={handleDecrement}
                                className="w-8 text-xl font-bold text-gray-500 hover:text-pink-600 transition"
                            >
                                −
                            </button>
                            <span className="w-8 text-center font-bold text-gray-800 text-lg">{quantity}</span>
                            <button
                                onClick={handleIncrement}
                                className="w-8 text-xl font-bold text-gray-500 hover:text-pink-600 transition"
                            >
                                +
                            </button>
                        </div>

                        <ShareButton product={product} variant="icon" />

                        {/* Add to Cart Button */}
                        <button
                            onClick={handleAddToCart}
                            disabled={product.estoque < 1}
                            className={`flex-1 h-14 font-bold rounded-xl shadow-lg transition flex justify-between items-center px-6 active:scale-95 ${product.estoque > 0
                                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-pink-200 hover:opacity-90'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                                }`}
                        >
                            <span>🛒 {product.estoque > 0 ? 'Adicionar' : 'Esgotado'}</span>
                            {product.estoque > 0 && (
                                <span className="bg-white/20 px-2 py-1 rounded text-sm whitespace-nowrap">
                                    R$ {totalPrice.toFixed(2)}
                                </span>
                            )}
                        </button>
                    </div>

                </div>
            </div>
        );
    }
    // ============================================
    // END MIX HANDLING - Continue with regular product flow
    // ============================================

    return (
        <div className="min-h-screen bg-white flex flex-col relative animate-in slide-in-from-right duration-300">
            <CustomModal />

            {/* Navigation Button */}
            <button
                onClick={onBack}
                className="fixed top-4 left-4 z-50 bg-white/90 backdrop-blur-md p-3 rounded-full shadow-lg border border-gray-100 hover:scale-110 transition active:scale-95"
                aria-label="Voltar"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            {/* main container - Responsive Grid */}
            <div className="flex-1 lg:grid lg:grid-cols-2 lg:gap-8 lg:p-12 lg:max-w-7xl lg:mx-auto lg:items-start">

                {/* Left Column: Image (Desktop) / Top Section (Mobile) */}
                <div className="relative h-[40vh] lg:h-[600px] w-full bg-gray-200 lg:rounded-3xl lg:overflow-hidden lg:shadow-2xl">
                    <Image
                        src={product.imagem || 'https://via.placeholder.com/500'}
                        alt={product.nome}
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover"
                        quality={85}
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/5"></div>
                </div>

                {/* Right Column: Content Body */}
                <div className="flex-1 p-6 lg:p-0 flex flex-col -mt-8 lg:mt-0 bg-white rounded-t-[35px] lg:rounded-none relative z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] lg:shadow-none">

                    {/* Handle for mobile only */}
                    <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 opacity-50 lg:hidden"></div>

                    {/* Header: Name + Price */}
                    <div className="flex justify-between items-start mb-6">
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 w-3/4 leading-tight">{product.nome}</h1>
                        <div className="text-right">
                            <span className="text-2xl lg:text-3xl font-bold text-[#FF4B82] whitespace-nowrap">R$ {basePrice.toFixed(2)}</span>
                            {hasAdditions && <p className="text-xs text-gray-400">base</p>}
                        </div>
                    </div>

                    {/* Badges */}
                    <div className="flex gap-3 mb-6 overflow-x-auto lg:overflow-visible pb-2 scrollbar-hide">
                        {[
                            { icon: '🔥', label: 'Calorias', val: product.calorias, color: 'orange' },
                            { icon: '⚖️', label: 'Peso', val: product.peso, color: 'blue' },
                            { icon: '⚡', label: 'Entrega', val: product.tempo || 'Imediata', color: 'green' }
                        ].map((badge, idx) => (
                            <div key={idx} className={`bg-${badge.color}-50 border border-${badge.color}-100 px-3 py-2 rounded-xl flex items-center gap-3 min-w-[110px] lg:min-w-[120px]`}>
                                <span className="text-xl">{badge.icon}</span>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">{badge.label}</p>
                                    <p className={`text-sm font-bold text-${badge.color}-500 whitespace-nowrap`}>{badge.val}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <h3 className="font-bold text-gray-800 mb-2">Descrição</h3>
                    <p className="text-gray-500 text-sm lg:text-base leading-relaxed mb-6">
                        {product.descricao || 'Sabor inigualável da Dona Capivara.'}
                    </p>

                    <h3 className="font-bold text-gray-800 mb-2">Ingredientes</h3>
                    <p className="text-gray-500 text-xs lg:text-sm leading-relaxed mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        {product.ingredientes || 'Informação não disponível.'}
                    </p>

                    {/* Additions Section - Loading Skeleton */}
                    {loadingAdditions && (
                        <div className="space-y-4 mb-6">
                            <h3 className="font-bold text-gray-800 mb-3">🎨 Personalize seu pedido</h3>
                            <div className="bg-white p-4 rounded-2xl shadow-sm animate-pulse border border-gray-100">
                                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
                                <div className="space-y-2">
                                    <div className="h-12 bg-gray-100 rounded-xl"></div>
                                    <div className="h-12 bg-gray-100 rounded-xl"></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Additions Section - Loaded */}
                    {!loadingAdditions && hasAdditions && (
                        <div className="space-y-4 mb-6">
                            <h3 className="font-bold text-gray-800 mb-3">Personalize seu pedido</h3>
                            {productWithAdditions!.addition_groups!.map(group => (
                                <AdditionGroup
                                    key={group.id}
                                    group={group}
                                    selectedOptions={selectedOptionsByGroup[group.id] || []}
                                    onSelectionChange={(optionId) => handleAdditionSelection(group.id, optionId, group)}
                                />
                            ))}

                            <PriceCalculator
                                basePrice={basePrice}
                                selectedAdditions={selectedAdditions}
                                quantity={quantity}
                            />
                        </div>
                    )}

                    {/* Footer Actions - Integrated on Desktop, Fixed on Mobile */}
                    <div className="lg:mt-auto lg:pt-8 bg-white lg:bg-transparent pb-32 lg:pb-0">

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
                        {user && user.id && !user.isGuest && (
                            <button
                                onClick={() => setShowReviewForm(true)}
                                className="w-full bg-white border-2 border-[#FF4B82] text-[#FF4B82] font-bold py-3 rounded-xl mb-4 hover:bg-[#FFF0F5] transition active:scale-95"
                            >
                                ⭐️ Avaliar Produto
                            </button>
                        )}

                        {/* Main Action Bar */}
                        <div className="flex items-center gap-4 fixed bottom-0 left-0 w-full lg:static lg:w-auto bg-white border-t lg:border-none border-gray-100 p-4 pb-8 lg:p-0 z-40 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] lg:shadow-none">
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
                                onClick={handleAddToCart}
                                disabled={product.estoque < 1}
                                className={`flex-1 h-14 font-bold rounded-xl shadow-lg transition flex justify-between items-center px-6 active:scale-95 ${product.estoque > 0
                                    ? 'bg-gradient-to-r from-[#FF4B82] to-[#FF9E3D] text-white shadow-orange-200 hover:opacity-90'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                                    }`}
                            >
                                <span>{product.estoque > 0 ? 'Adicionar' : 'Esgotado'}</span>
                                {product.estoque > 0 && (
                                    <span className="bg-white/20 px-2 py-1 rounded text-sm whitespace-nowrap">
                                        R$ {((basePrice + selectedAdditions.reduce((sum, a) => sum + a.option_price, 0)) * quantity).toFixed(2)}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Reviews Section at the end on Desktop */}
                    <div className="mt-12 lg:mt-16 pb-12">
                        <h3 className="font-bold text-gray-800 mb-4 text-xl">Avaliações</h3>
                        <ReviewsList reviews={reviews} averageRating={averageRating} />
                    </div>
                </div>
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
        </div>

    );
}
