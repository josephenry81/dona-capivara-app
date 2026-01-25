import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import ShareButton from '../ui/ShareButton';
import RatingStars from '../product/RatingStars';
import ReviewForm from '../product/ReviewForm';
import ReviewsList from '../product/ReviewsList';
import AdditionGroup from '../product/AdditionGroup';
import PriceCalculator from '../product/PriceCalculator';
import VariantSelector, { ProductVariant } from '../product/VariantSelector';
import { ReviewService, Review } from '../../services/reviews';
import { API } from '../../services/api';
import { ProductWithAdditions, SelectedAddition, AdditionGroup as AdditionGroupType } from '../../types/additions';
import { useModal } from '../ui/Modal';
import { getSiblingProductIds, hasVariations } from '../../config/productGroups';


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
    hasAdditions?: boolean;
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

    // 📦 VARIANTS STATE
    const [variants, setVariants] = useState<ProductVariant[]>([]);
    const [selectedVariantId, setSelectedVariantId] = useState<string>(product.id);

    // 🧠 DERIVED: Use fetched data for display (supports loading hidden products)
    const displayProduct = productWithAdditions || product;
    const isMix = (displayProduct as any).ID_Categoria === 'MIX' || displayProduct.id?.includes('MIX') || displayProduct.nome?.toLowerCase().includes('mix');
    const basePrice = displayProduct.price;



    const handleIncrement = () => {
        if (quantity < displayProduct.estoque) {
            setQuantity(q => q + 1);
        } else {
            alert('⚠️ Limite de Estoque', `Ops! Temos apenas ${displayProduct.estoque} unidades disponíveis.`, 'warning');
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

                // ⚡ OPTIMIZATION: Only fetch if product has additions
                if ((product as any).hasAdditions === false) {
                    setLoadingAdditions(false);
                    return;
                }

                setLoadingAdditions(true);

                // Fetch additions with cache support
                try {
                    const productData = await API.getProductWithAdditions(product.id);
                    if (productData && !productData.error) {
                        // 🧠 NORMALIZE: Map backend keys to frontend interface if needed
                        // This allows loading "Hidden/Test" products that aren't in the initial catalog
                        const normalizedData = {
                            ...productData,
                            id: productData.id || productData.ID_Geladinho || product.id,
                            nome: productData.nome || productData.Nome_Geladinho || product.nome,
                            price: Number(productData.price || productData.Preco_Venda || product.price),
                            imagem: productData.imagem || productData.URL_IMAGEM_CACHE || product.imagem,
                            descricao: productData.descricao || productData.Descricao || product.descricao,
                            estoque: Number(productData.estoque || productData.Estoque_Atual || product.estoque),
                            ingredientes: productData.ingredientes || productData.Ingredientes || product.ingredientes,
                            peso: productData.peso || productData.Peso || product.peso,
                            calorias: productData.calorias || productData.Calorias || product.calorias,
                            addition_groups: productData.addition_groups || []
                        };
                        setProductWithAdditions(normalizedData);
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

                // 📦 LOAD VARIANTS: Check if product has siblings
                if (hasVariations(product.id)) {
                    const siblingIds = getSiblingProductIds(product.id);
                    console.log('📦 [Variants] Loading siblings:', siblingIds);

                    const siblingProducts = await API.getProductsByIds(siblingIds);
                    if (siblingProducts.length > 0) {
                        const variantList: ProductVariant[] = siblingProducts.map((p: any) => ({
                            id: p.id || p.ID_Geladinho,
                            label: p.peso || p.Peso || extractSizeFromName(p.nome || p.Nome_Geladinho) || 'Padrão',
                            price: Number(p.price || p.Preco_Venda || 0),
                            stock: Number(p.estoque || p.Estoque_Atual || 0),
                            isSelected: (p.id || p.ID_Geladinho) === product.id
                        }));
                        setVariants(variantList);
                        console.log('📦 [Variants] Loaded:', variantList);
                    }
                }
            }
        }
        fetchProductData();
    }, [product]);

    // 📦 VARIANT SELECTION HANDLER
    const handleVariantSelect = async (variantId: string) => {
        setSelectedVariantId(variantId);
        setQuantity(1); // Reset quantity on variant change

        // Find the variant data and update displayProduct
        const selectedVariant = variants.find(v => v.id === variantId);
        if (selectedVariant) {
            // Update variants selection state
            setVariants(prev => prev.map(v => ({
                ...v,
                isSelected: v.id === variantId
            })));

            // Fetch full product data for the new variant
            try {
                const variantData = await API.getProductWithAdditions(variantId);
                if (variantData && !variantData.error) {
                    const normalizedData = {
                        ...variantData,
                        id: variantData.id || variantData.ID_Geladinho || variantId,
                        nome: variantData.nome || variantData.Nome_Geladinho,
                        price: Number(variantData.price || variantData.Preco_Venda || selectedVariant.price),
                        imagem: variantData.imagem || variantData.URL_IMAGEM_CACHE,
                        descricao: variantData.descricao || variantData.Descricao,
                        estoque: Number(variantData.estoque || variantData.Estoque_Atual || selectedVariant.stock),
                        ingredientes: variantData.ingredientes || variantData.Ingredientes,
                        peso: variantData.peso || variantData.Peso,
                        calorias: variantData.calorias || variantData.Calorias,
                        addition_groups: variantData.addition_groups || []
                    };
                    setProductWithAdditions(normalizedData);
                }
            } catch (error) {
                console.error('Error loading variant data:', error);
            }
        }
    };

    // Helper to extract size from product name (e.g., "Cuscuz 500g" -> "500g")
    function extractSizeFromName(name: string): string | null {
        if (!name) return null;
        const match = name.match(/(\d+(?:g|kg|ml|l|un))/i);
        return match ? match[1] : null;
    }

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
        if (displayProduct.estoque < 1) {
            alert('🚫 Produto Esgotado', 'Desculpe, este produto acabou de esgotar.', 'warning');
            return;
        }
        if (quantity > displayProduct.estoque) {
            alert('⚠️ Estoque Insuficiente', `Temos apenas ${displayProduct.estoque} unidades disponíveis.`, 'warning');
            setQuantity(displayProduct.estoque);
            return;
        }
        onAddToCart(displayProduct, quantity, selectedAdditions.length > 0 ? selectedAdditions : undefined);
    };

    const hasAdditions = productWithAdditions?.addition_groups && productWithAdditions.addition_groups.length > 0;

    // ============================================
    // MIX PRODUCT HANDLING (V16.0 Integration)
    // ============================================

    if (isMix && productWithAdditions && productWithAdditions.addition_groups) {
        // Separar grupo de sabores (GRP-003) dos outros
        const flavorGroup = productWithAdditions.addition_groups.find(
            (g: any) => g.id === 'GRP-003'
        );

        const otherGroups = productWithAdditions.addition_groups.filter(
            (g: any) => g.id !== 'GRP-003'
        );

        const additionsTotal = selectedAdditions.reduce((sum, add) => sum + add.option_price, 0);
        const unitPrice = displayProduct.price + additionsTotal;
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
                        <h1 className="text-4xl font-bold mb-2">🍦 {displayProduct.nome}</h1>
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
                                <p className="text-sm text-gray-600">{displayProduct.descricao || 'Personalize do seu jeito!'}</p>
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

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* HEADER - Fundo Rosa com Imagem */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="relative bg-gradient-to-br from-[#FF4B82] to-[#FF9E3D] pt-4 pb-24">

                {/* Botão Voltar */}
                <button
                    onClick={onBack}
                    className="absolute top-4 left-4 z-50 bg-white/20 backdrop-blur-md p-3 rounded-full hover:bg-white/30 transition active:scale-95"
                    aria-label="Voltar"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                {/* Botão Share/Menu */}
                <div className="absolute top-4 right-4 z-50">
                    <ShareButton product={product} variant="icon" />
                </div>

                {/* Imagem do Produto - Centralizada com Sombra */}
                <div className="flex justify-center mt-8">
                    <div className="relative w-64 h-64 lg:w-80 lg:h-80">
                        <Image
                            src={displayProduct.imagem || 'https://via.placeholder.com/500'}
                            alt={displayProduct.nome}
                            fill
                            sizes="(max-width: 1024px) 256px, 320px"
                            className="object-cover rounded-3xl shadow-2xl"
                            quality={85}
                            priority
                        />
                    </div>
                </div>
            </div>

            {/* Botão Favorito - Posição Absoluta na borda */}
            <button
                className="absolute top-[280px] lg:top-[340px] right-6 z-30 bg-white p-3 rounded-full shadow-lg hover:scale-110 transition-all active:scale-95 border border-gray-100"
                title="Favoritar"
            >
                🤍
            </button>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* CONTENT BODY - Fundo Branco */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="flex-1 bg-white -mt-8 rounded-t-[35px] relative z-10 px-6 pt-8 pb-32">

                {/* Handle decorativo */}
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 opacity-50"></div>

                {/* Título do Produto */}
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-1">{displayProduct.nome}</h1>

                {/* Subtítulo / Categoria */}
                <p className="text-gray-400 text-sm mb-4">Geladinho Gourmet • Dona Capivara</p>

                {/* Bloco de Avaliações */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="flex items-center gap-1">
                        <RatingStars rating={averageRating || 5} size="sm" />
                        <span className="text-sm font-semibold text-gray-700 ml-1">
                            {averageRating > 0 ? averageRating.toFixed(1) : '5.0'}
                        </span>
                    </div>
                    <span className="text-gray-300">|</span>
                    <span className="text-sm text-gray-500">
                        {reviews.length > 0 ? `${reviews.length} avaliações` : 'Novo produto'}
                    </span>
                    {displayProduct.estoque > 0 && displayProduct.estoque < 10 && (
                        <>
                            <span className="text-gray-300">|</span>
                            <span className="text-sm text-orange-500 font-medium">Restam {displayProduct.estoque}!</span>
                        </>
                    )}
                </div>

                {/* 📦 VARIANT SELECTOR - Only shows if product has variants */}
                {variants.length > 1 && (
                    <VariantSelector
                        variants={variants}
                        onSelect={handleVariantSelect}
                        disabled={loadingAdditions}
                    />
                )}

                {/* Row: Preço e Quantidade (Pill) */}
                <div className="flex items-center justify-between mb-8 bg-gray-50 p-4 rounded-2xl">
                    <div>
                        <p className="text-sm text-gray-400 mb-1">Preço unitário</p>
                        <p className="text-3xl font-bold text-[#FF4B82]">
                            R$ {basePrice.toFixed(2).replace('.', ',')}
                        </p>
                        {hasAdditions && selectedAdditions.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                                + R$ {selectedAdditions.reduce((sum, a) => sum + a.option_price, 0).toFixed(2).replace('.', ',')} em adicionais
                            </p>
                        )}
                    </div>

                    {/* Pill de Quantidade */}
                    <div className="flex items-center bg-white rounded-full px-2 py-2 shadow-md border border-gray-100">
                        <button
                            onClick={handleDecrement}
                            className="w-10 h-10 rounded-full bg-[#FF4B82] text-white text-xl font-bold flex items-center justify-center hover:bg-[#e03a6d] transition active:scale-90"
                        >
                            −
                        </button>
                        <span className="w-12 text-center font-bold text-gray-800 text-xl">{quantity}</span>
                        <button
                            onClick={handleIncrement}
                            className="w-10 h-10 rounded-full bg-[#FF4B82] text-white text-xl font-bold flex items-center justify-center hover:bg-[#e03a6d] transition active:scale-90"
                        >
                            +
                        </button>
                    </div>
                </div>

                {/* Sobre o Produto */}
                <div className="mb-6">
                    <h3 className="font-bold text-gray-800 text-lg mb-3">📝 Sobre o Produto</h3>
                    <p className="text-gray-600 leading-relaxed">
                        {displayProduct.descricao || 'Sabor inigualável da Dona Capivara. Feito com ingredientes selecionados e muito amor!'}
                    </p>
                </div>

                {/* Ingredientes */}
                {displayProduct.ingredientes && (
                    <div className="mb-6">
                        <h3 className="font-bold text-gray-800 text-lg mb-3">🧾 Ingredientes</h3>
                        <p className="text-gray-500 text-sm leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                            {displayProduct.ingredientes}
                        </p>
                    </div>
                )}

                {/* Info Badges */}
                {(displayProduct.calorias || displayProduct.peso) && (
                    <div className="flex gap-3 mb-6 flex-wrap">
                        {displayProduct.calorias && (
                            <div className="bg-orange-50 border border-orange-100 px-4 py-3 rounded-xl flex items-center gap-2">
                                <span className="text-xl">🔥</span>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Calorias</p>
                                    <p className="text-sm font-bold text-orange-500">{displayProduct.calorias}</p>
                                </div>
                            </div>
                        )}
                        {displayProduct.peso && (
                            <div className="bg-blue-50 border border-blue-100 px-4 py-3 rounded-xl flex items-center gap-2">
                                <span className="text-xl">⚖️</span>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Peso</p>
                                    <p className="text-sm font-bold text-blue-500">{displayProduct.peso}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

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
                        <h3 className="font-bold text-gray-800 text-lg mb-3">🎨 Personalize seu pedido</h3>
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

                {/* Seção de Avaliações */}
                {reviews.length > 0 && (
                    <div className="mb-6">
                        <h3 className="font-bold text-gray-800 text-lg mb-4">⭐ Avaliações dos Clientes</h3>
                        <ReviewsList reviews={reviews} averageRating={averageRating} />
                    </div>
                )}

                {/* Review Button */}
                {user && user.id && !user.isGuest && (
                    <button
                        onClick={() => setShowReviewForm(true)}
                        className="w-full bg-white border-2 border-[#FF4B82] text-[#FF4B82] font-bold py-3 rounded-xl mb-6 hover:bg-[#FFF0F5] transition active:scale-95"
                    >
                        ⭐️ Avaliar este Produto
                    </button>
                )}
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* FOOTER - Botão Adicionar ao Carrinho (Fixo) */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 p-4 pb-8 z-40 shadow-[0_-5px_20px_rgba(0,0,0,0.08)]">
                <button
                    onClick={handleAddToCart}
                    disabled={product.estoque < 1}
                    className={`w-full h-14 font-bold rounded-2xl shadow-lg transition flex justify-center items-center gap-3 active:scale-[0.98] ${product.estoque > 0
                        ? 'bg-[#FF4B82] text-white hover:bg-[#e03a6d] shadow-pink-200'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                        }`}
                >
                    {product.estoque > 0 ? (
                        <>
                            <img src="/cart-icon-white.png" alt="" className="w-5 h-5" />
                            <span>Adicionar ao Carrinho</span>
                            <span className="bg-white/20 px-3 py-1 rounded-lg text-sm font-bold ml-2">
                                R$ {((basePrice + selectedAdditions.reduce((sum, a) => sum + a.option_price, 0)) * quantity).toFixed(2).replace('.', ',')}
                            </span>
                        </>
                    ) : (
                        <span>Produto Esgotado</span>
                    )}
                </button>
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
