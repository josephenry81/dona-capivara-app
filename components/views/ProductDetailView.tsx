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
    onToggleFavorite?: (productId: string) => void;
    favorites?: string[];
    averageRatings?: Record<string, number>;
}

export default function ProductDetailView({
    product,
    onBack,
    onAddToCart,
    user,
    onToggleFavorite,
    favorites = [],
    averageRatings = {}
}: ProductDetailProps) {
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
    const [_selectedVariantId, setSelectedVariantId] = useState<string>(product.id);

    // 🧠 DERIVED: Use fetched data for display (supports loading hidden products)
    const displayProduct = productWithAdditions || product;
    const isMix =
        (displayProduct as any).ID_Categoria === 'MIX' ||
        displayProduct.id?.includes('MIX') ||
        displayProduct.nome?.toLowerCase().includes('mix');
    const basePrice = displayProduct.price;

    const handleIncrement = () => {
        if (quantity < displayProduct.estoque) {
            setQuantity(q => q + 1);
        } else {
            alert(
                '⚠️ Limite de Estoque',
                `Ops! Temos apenas ${displayProduct.estoque} unidades disponíveis.`,
                'warning'
            );
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
                ReviewService.getProductReviews(product.id).then(data => {
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
                    }
                }
            }
        }
        fetchProductData();
    }, [product]);

    // ⚡ NEW: Helper to check if a value is valid for display (not falsy or "N/A")
    const isValidValue = (val: any) => {
        if (!val) return false;
        const stringVal = String(val).trim().toUpperCase();
        return stringVal !== 'N/A' && stringVal !== '"N/A"' && stringVal !== 'NONE';
    };

    //  NEW: Helper to determine if a product is new
    const _getProductBadge = () => {
        const p = displayProduct as any;
        const creationDate = p.Data || p.criado_em || p.createdAt;
        if (!creationDate) return 'Novidade imperdível';

        try {
            const date = new Date(creationDate);
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - date.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return diffDays <= 30 ? 'Novidade imperdível' : 'Favorito da Casa';
        } catch (_e) {
            return 'Novidade imperdível';
        }
    };

    // �📦 VARIANT SELECTION HANDLER
    const handleVariantSelect = async (variantId: string) => {
        setSelectedVariantId(variantId);
        setQuantity(1); // Reset quantity on variant change

        // Find the variant data and update displayProduct
        const selectedVariant = variants.find(v => v.id === variantId);
        if (selectedVariant) {
            // Update variants selection state
            setVariants(prev =>
                prev.map(v => ({
                    ...v,
                    isSelected: v.id === variantId
                }))
            );

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

        // Calculate potential points (1 point per R$ 1.00)
        const pointsToEarn = Math.floor(product.price || 0);

        const result = await ReviewService.submitReview(
            product.id,
            product.nome,
            rating,
            comment,
            user,
            product.price
        );

        if (result.success) {
            alert(
                '🎉 Avaliação Recebida!',
                result.message || `Obrigado! Sua avaliação foi enviada. Você ganhará +${pointsToEarn} pontos assim que ela for aprovada!`,
                'success'
            );
            setShowReviewForm(false);
            const updatedReviews = await ReviewService.getProductReviews(product.id);
            setReviews(updatedReviews);
            setAverageRating(ReviewService.calculateAverageRating(updatedReviews));
        } else {
            alert('⚠️ Erro ao Avaliar', result.message || 'Não foi possível enviar sua avaliação no momento.', 'error');
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
    }, [user, showReviewForm, alert]);

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
        const flavorGroup = productWithAdditions.addition_groups.find((g: any) => g.id === 'GRP-003');

        const otherGroups = productWithAdditions.addition_groups.filter((g: any) => g.id !== 'GRP-003');

        const additionsTotal = selectedAdditions.reduce((sum, add) => sum + add.option_price, 0);
        const unitPrice = displayProduct.price + additionsTotal;
        const totalPrice = unitPrice * quantity;

        return (
            <div className="min-h-screen bg-[#FAFAFA] flex flex-col relative animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CustomModal />

                {/* Fixed Navigation Button */}
                <button
                    onClick={onBack}
                    className="fixed top-6 left-6 z-50 bg-white/80 backdrop-blur-xl p-3.5 rounded-2xl shadow-xl shadow-pink-100/20 border border-white/40 hover:scale-105 transition active:scale-95 group"
                    aria-label="Voltar"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-gray-800 group-hover:text-pink-600 transition-colors"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                {/* Hero Section - Mix */}
                <div className="relative h-[35vh] lg:h-[40vh] w-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#FF4B82] via-[#FF758F] to-[#FF9E3D] animate-gradient-xy"></div>
                    <div className="absolute inset-0 bg-[url('/mesh-gradient.png')] opacity-30 bg-cover mix-blend-overlay"></div>
                    <div className="relative h-full flex flex-col items-center justify-center text-white px-6 text-center">
                        <div className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-medium tracking-widest uppercase mb-4 border border-white/30">
                            Customizável
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-semibold mb-3 drop-shadow-lg">
                            {displayProduct.nome}
                        </h1>
                        <p className="text-sm lg:text-base opacity-90 max-w-xs mx-auto leading-relaxed font-medium">
                            {displayProduct.descricao || 'Crie sua própria combinação de sabores e adicionais!'}
                        </p>
                    </div>
                </div>

                {/* Content Body */}
                <div className="flex-1 px-4 lg:px-8 flex flex-col -mt-10 bg-white/80 backdrop-blur-2xl rounded-t-[40px] relative z-10 border-t border-white/60 shadow-[0_-20px_50px_rgba(0,0,0,0.06)] pb-36">
                    <div className="w-16 h-1.5 bg-gray-200/60 rounded-full mx-auto my-6"></div>

                    <div className="max-w-3xl mx-auto w-full">
                        {/* Mix Header / Summary Card */}
                        <div className="bg-gradient-to-br from-white to-pink-50/30 p-6 rounded-[32px] mb-8 border border-pink-100/50 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-pink-100 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                                        ✨
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-gray-800 tracking-tight">
                                            Monte seu Mix
                                        </h2>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                            Preço base aplicado: R$ {basePrice.toFixed(2).replace('.', ',')}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1">
                                        Valor Unitário
                                    </p>
                                    <div className="text-2xl font-black text-[#FF4B82]">
                                        R$ {unitPrice.toFixed(2).replace('.', ',')}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-8">
                                {/* Flavors Section */}
                                {flavorGroup && (
                                    <section>
                                        <div className="flex items-center justify-between mb-4 px-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-5 w-5"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                    >
                                                        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                                                    </svg>
                                                </div>
                                                <h3 className="text-lg font-bold text-gray-800">{flavorGroup.name}</h3>
                                            </div>
                                            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                                                {selectedOptionsByGroup[flavorGroup.id]?.length || 0}/{flavorGroup.max}
                                            </span>
                                        </div>

                                        <div className="bg-gray-50/50 p-2 rounded-[30px] border border-gray-100/50">
                                            <AdditionGroup
                                                group={flavorGroup}
                                                selectedOptions={selectedOptionsByGroup[flavorGroup.id] || []}
                                                onSelectionChange={optionId =>
                                                    handleAdditionSelection(flavorGroup.id, optionId, flavorGroup)
                                                }
                                            />
                                        </div>
                                    </section>
                                )}

                                {/* Other Addition Groups */}
                                {otherGroups && otherGroups.length > 0 && (
                                    <section className="space-y-6">
                                        <div className="flex items-center gap-3 mb-2 px-2">
                                            <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center text-pink-600">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-5 w-5"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-800">Toppings e Extras</h3>
                                        </div>
                                        <div className="space-y-4">
                                            {otherGroups.map((group: any) => (
                                                <div
                                                    key={group.id}
                                                    className="bg-gray-50/50 p-2 rounded-[30px] border border-gray-100/50"
                                                >
                                                    <AdditionGroup
                                                        group={group}
                                                        selectedOptions={selectedOptionsByGroup[group.id] || []}
                                                        onSelectionChange={optionId =>
                                                            handleAdditionSelection(group.id, optionId, group)
                                                        }
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </div>

                            <div className="space-y-8">
                                {/* Price Breakdown Card */}
                                <section className="sticky top-24">
                                    <div className="bg-white p-8 rounded-[40px] shadow-2xl shadow-pink-100/30 border border-gray-100 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-pink-100 transition-colors"></div>

                                        <h3 className="font-bold text-gray-900 text-xl mb-6 flex items-center gap-2">
                                            <span className="w-2 h-6 bg-pink-500 rounded-full"></span>
                                            Resumo do Pedido
                                        </h3>

                                        <div className="space-y-4 relative z-10">
                                            <div className="flex justify-between items-center text-gray-600">
                                                <span className="font-medium">Base do Mix</span>
                                                <span className="font-bold text-gray-800">
                                                    R$ {basePrice.toFixed(2)}
                                                </span>
                                            </div>

                                            {selectedAdditions.length > 0 && (
                                                <div className="pt-4 border-t border-dashed border-gray-200 space-y-3">
                                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                                                        Adicionais selecionados
                                                    </p>
                                                    {selectedAdditions.map((add, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="flex justify-between items-center group/item transition-all"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-pink-300 group-hover/item:scale-150 transition-transform"></div>
                                                                <span className="text-sm text-gray-500 group-hover/item:text-gray-800 transition-colors">
                                                                    {add.option_name}
                                                                </span>
                                                            </div>
                                                            <span className="text-sm font-semibold text-gray-700">
                                                                R$ {add.option_price.toFixed(2)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                    <div className="flex justify-between items-center pt-2 text-pink-500 font-bold">
                                                        <span className="text-sm">Subtotal Adicionais</span>
                                                        <span>R$ {additionsTotal.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="pt-6 border-t-2 border-gray-100 flex justify-between items-end">
                                                <div>
                                                    <p className="text-xs text-gray-400 font-bold mb-1 uppercase">
                                                        Total por unidade
                                                    </p>
                                                    <div className="text-3xl font-black text-gray-900">
                                                        R$ {unitPrice.toFixed(2)}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <p className="text-xs text-gray-400 font-bold mb-1 uppercase">
                                                        Quantidade
                                                    </p>
                                                    <div className="bg-gray-100 rounded-2xl p-1.5 flex items-center gap-3">
                                                        <button
                                                            onClick={handleDecrement}
                                                            className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center font-bold text-pink-600 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                                        >
                                                            −
                                                        </button>
                                                        <span className="w-6 text-center font-black text-gray-800">
                                                            {quantity}
                                                        </span>
                                                        <button
                                                            onClick={handleIncrement}
                                                            className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center font-bold text-pink-600 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Evaluation Summary */}
                                    {averageRating > 0 && (
                                        <div className="mt-6 flex items-center justify-center gap-4 bg-gray-50/50 p-4 rounded-3xl border border-gray-100">
                                            <RatingStars rating={averageRating} size="md" />
                                            <div className="text-sm">
                                                <span className="font-bold text-gray-800">
                                                    {averageRating.toFixed(1)}
                                                </span>
                                                <span className="text-gray-400 mx-1.5">•</span>
                                                <span className="text-gray-500 font-medium">
                                                    ({reviews.length} avaliações)
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </section>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions - Mix */}
                    <div className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-2xl border-t border-white/50 p-6 pb-10 flex items-center justify-center gap-5 z-40 shadow-[0_-15px_40px_rgba(0,0,0,0.08)]">
                        <div className="max-w-3xl w-full flex items-center gap-4">
                            <ShareButton product={product} variant="icon" />

                            <button
                                onClick={handleAddToCart}
                                disabled={product.estoque < 1}
                                className={`flex-1 h-16 group relative overflow-hidden font-black text-lg rounded-[24px] shadow-2xl transition-all duration-300 active:scale-95 flex items-center justify-center ${product.estoque > 0
                                    ? 'bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 text-white shadow-pink-200'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                                    }`}
                            >
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative flex items-center justify-between w-full px-8">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">🛒</span>
                                        <span>
                                            {product.estoque > 0 ? 'Adicionar ao Carrinho' : 'Produto Esgotado'}
                                        </span>
                                    </div>
                                    {product.estoque > 0 && (
                                        <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl text-base tabular-nums border border-white/20">
                                            R$ {totalPrice.toFixed(2)}
                                        </div>
                                    )}
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    // ============================================
    // END MIX HANDLING - Continue with regular product flow
    // ============================================

    return (
        <div className="min-h-screen bg-[#FAFAFA] flex flex-col relative animate-in fade-in slide-in-from-right-4 duration-500">
            <CustomModal />

            {/* HEADER - Styled with dynamic background */}
            <div className="relative h-[48vh] lg:h-[58vh] w-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF4E76] via-[#FF698B] to-[#FF9E3D]"></div>

                {/* Back Button */}
                <button
                    onClick={onBack}
                    className="absolute top-6 left-6 z-50 bg-white/20 backdrop-blur-xl p-3.5 rounded-2xl hover:bg-white/30 transition-all active:scale-95 border border-white/30 group"
                    aria-label="Voltar"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="group-hover:-translate-x-1 transition-transform"
                    >
                        <path d="m15 18-6-6 6-6" />
                    </svg>
                </button>

                {/* Top Action Buttons */}
                <div className="absolute top-6 right-6 z-50 flex gap-2">
                    <ShareButton product={product} variant="icon" />
                    <button
                        onClick={() => onToggleFavorite?.(product.id)}
                        className="bg-white/20 backdrop-blur-md p-2 rounded-xl hover:bg-white/30 transition-all active:scale-95 text-white"
                        title={favorites.includes(product.id) ? 'Remover dos Favoritos' : 'Favoritar'}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill={favorites.includes(product.id) ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                        </svg>
                    </button>
                </div>

                {/* Product Hero Image */}
                <div className="h-full flex flex-col items-center justify-center p-8 lg:p-12 relative pb-20">
                    <div className="relative w-72 h-72 lg:w-[480px] lg:h-[480px]">
                        <div className="absolute inset-0 bg-black/15 blur-3xl rounded-full scale-90 translate-y-12"></div>
                        <div className="relative w-full h-full rounded-[60px] lg:rounded-[100px] overflow-hidden border-[12px] border-white/20 shadow-2xl">
                            <Image
                                src={
                                    displayProduct.imagem && displayProduct.imagem !== 'N/A'
                                        ? displayProduct.imagem
                                        : '/product-placeholder.png'
                                }
                                alt={displayProduct.nome}
                                fill
                                sizes="(max-width: 1024px) 288px, 480px"
                                className="object-cover"
                                quality={95}
                                priority
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* CONTENT BODY */}
            <div className="flex-1 bg-white -mt-12 rounded-t-[45px] relative z-10 px-6 lg:px-12 pt-10 pb-40 shadow-[0_-20px_60px_rgba(0,0,0,0.08)]">
                <div className="max-w-4xl mx-auto w-full">
                    {/* Decorative Handle */}
                    <div className="w-20 h-1.5 bg-gray-100 rounded-full mx-auto mb-10"></div>

                    <div className="mb-10">
                        <div className="flex-1">
                            {/* Product Title area */}
                            <div className="flex flex-col gap-1 mb-2">
                                <h1 className="text-2xl lg:text-4xl font-semibold text-gray-800 leading-tight">
                                    {displayProduct.nome}
                                </h1>
                            </div>

                            {/* ⭐ Minimalist Rating Row */}
                            <div className="flex items-center gap-2 mb-6 text-sm">
                                <span className="text-yellow-500">★</span>
                                <span className="text-gray-700 font-medium tabular-nums">
                                    {(averageRatings[product.id] || averageRating || 5.0).toFixed(1)}
                                </span>
                                {reviews.length > 0 && (
                                    <>
                                        <span className="text-gray-300">•</span>
                                        <span className="text-gray-500">
                                            {reviews.length} {reviews.length === 1 ? 'avaliação' : 'avaliações'}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div className="space-y-10">
                            {/* 📦 VARIANT SELECTOR */}
                            {variants.length > 1 && (
                                <section>
                                    <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest mb-4">
                                        Selecione o Tamanho
                                    </h3>
                                    <VariantSelector
                                        variants={variants}
                                        onSelect={handleVariantSelect}
                                        disabled={loadingAdditions}
                                    />
                                </section>
                            )}

                            {/* Info Badges Row */}
                            {(isValidValue(displayProduct.calorias) || isValidValue(displayProduct.peso)) && (
                                <section className="flex gap-4">
                                    {isValidValue(displayProduct.calorias) && (
                                        <div className="flex-1 bg-gradient-to-br from-orange-50 to-white p-4 rounded-[24px] border border-orange-100 flex items-center gap-4 group">
                                            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                                🔥
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                                                    Energia
                                                </p>
                                                <p className="text-base font-semibold text-orange-600">
                                                    {displayProduct.calorias}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {isValidValue(displayProduct.peso) && (
                                        <div className="flex-1 bg-gradient-to-br from-blue-50 to-white p-4 rounded-[24px] border border-blue-100 flex items-center gap-4 group">
                                            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                                ⚖️
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                                                    Peso Líq.
                                                </p>
                                                <p className="text-base font-semibold text-blue-600">
                                                    {displayProduct.peso}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </section>
                            )}

                            {/* Description */}
                            <section>
                                <p className="text-gray-600 leading-relaxed text-lg font-medium mb-8">
                                    {displayProduct.descricao ||
                                        'Sabor inigualável da Dona Capivara. Feito com ingredientes selecionados e muito amor para explodir em cada mordida!'}
                                </p>

                                {/* 💳 Price + Quantity Selector Card */}
                                <div className="bg-gray-50/50 rounded-[32px] p-5 flex items-center justify-between border border-gray-100/50 shadow-sm">
                                    <div className="flex flex-col">
                                        <span className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-1">
                                            Preço unitário
                                        </span>
                                        <div className="text-2xl font-semibold text-[#FF4B82] tracking-tight tabular-nums">
                                            R$ {basePrice.toFixed(2).replace('.', ',')}
                                        </div>
                                    </div>

                                    {/* Specialized Quantity Selector for the Card */}
                                    <div className="bg-white rounded-[24px] p-1.5 flex items-center gap-4 shadow-sm border border-gray-100">
                                        <button
                                            onClick={handleDecrement}
                                            className="w-10 h-10 rounded-full bg-[#FF4B82] text-white flex items-center justify-center text-2xl font-black hover:scale-105 active:scale-90 transition-all shadow-md shadow-pink-100"
                                        >
                                            −
                                        </button>
                                        <span className="w-6 text-center font-black text-gray-800 text-lg tabular-nums">
                                            {quantity}
                                        </span>
                                        <button
                                            onClick={handleIncrement}
                                            className="w-10 h-10 rounded-full bg-[#FF4B82] text-white flex items-center justify-center text-2xl font-black hover:scale-105 active:scale-90 transition-all shadow-md shadow-pink-100"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            </section>

                            {/* Ingredients */}
                            {isValidValue(displayProduct.ingredientes) && (
                                <section>
                                    <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest mb-4">
                                        Composição
                                    </h3>
                                    <div className="bg-[#F8F9FB] p-6 rounded-[32px] border border-gray-100">
                                        <p className="text-gray-500 text-sm leading-relaxed font-medium italic">
                                            {displayProduct.ingredientes}
                                        </p>
                                    </div>
                                </section>
                            )}
                        </div>

                        <div className="space-y-10">
                            {/* Additions Section - Condition-based rendering */}
                            {hasAdditions && (
                                <section>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest">
                                            Adicionais e Extras
                                        </h3>
                                        <div className="h-0.5 flex-1 mx-4 bg-gray-100"></div>
                                    </div>

                                    {loadingAdditions && (
                                        <div className="space-y-4">
                                            {[1, 2].map(i => (
                                                <div
                                                    key={i}
                                                    className="h-24 bg-gray-50 rounded-[32px] animate-pulse"
                                                ></div>
                                            ))}
                                        </div>
                                    )}

                                    {!loadingAdditions && (
                                        <div className="space-y-6">
                                            {productWithAdditions!.addition_groups!.map(group => (
                                                <div
                                                    key={group.id}
                                                    className="bg-gray-50/50 p-2 rounded-[35px] border border-gray-100/50 hover:bg-white hover:shadow-xl hover:shadow-gray-200/40 transition-all duration-500"
                                                >
                                                    <AdditionGroup
                                                        group={group}
                                                        selectedOptions={selectedOptionsByGroup[group.id] || []}
                                                        onSelectionChange={optionId =>
                                                            handleAdditionSelection(group.id, optionId, group)
                                                        }
                                                    />
                                                </div>
                                            ))}

                                            <div className="bg-gradient-to-br from-white to-pink-50/50 p-6 rounded-[40px] shadow-xl shadow-pink-100/20 border border-pink-100/50">
                                                <PriceCalculator
                                                    basePrice={basePrice}
                                                    selectedAdditions={selectedAdditions}
                                                    quantity={quantity}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </section>
                            )}

                            {/* Reviews */}
                            {reviews.length > 0 && (
                                <section>
                                    <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest mb-6">
                                        Avaliações de Clientes
                                    </h3>
                                    <ReviewsList reviews={reviews} averageRating={averageRating} />
                                </section>
                            )}

                            {/* Review Button */}
                            {user && user.id && !user.isGuest && (
                                <button
                                    onClick={() => setShowReviewForm(true)}
                                    className="w-full bg-white border-2 border-[#FF4B82] text-[#FF4B82] font-semibold py-4 rounded-[24px] hover:bg-[#FFF0F5] transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
                                >
                                    ✨ Deixar minha Avaliação
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 🆕 FIXED PREMIUM FOOTER (Screenshot 2 Style) */}
            <div className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-3xl border-t border-gray-100 p-6 pb-12 z-40 shadow-[0_-25px_60px_rgba(0,0,0,0.15)] flex justify-center">
                <div className="max-w-4xl w-full flex items-center gap-6">
                    {/* Main CTA with Price Action */}
                    <button
                        onClick={handleAddToCart}
                        data-tour="add-to-cart"
                        disabled={product.estoque < 1}
                        className={`flex-1 h-16 group relative overflow-hidden font-semibold text-lg rounded-[28px] shadow-2xl transition-all duration-300 active:scale-[0.97] flex items-center justify-between px-8 ${product.estoque > 0
                            ? 'bg-[#FF4B82] text-white shadow-pink-200/50'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                            }`}
                    >
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                        <span className="relative flex items-center gap-3">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="22"
                                height="22"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <circle cx="8" cy="21" r="1" />
                                <circle cx="19" cy="21" r="1" />
                                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                            </svg>
                            {product.estoque > 0 ? 'Adicionar' : 'Indisponível'}
                        </span>

                        {product.estoque > 0 && (
                            <div className="relative bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl text-base font-semibold tabular-nums border border-white/20">
                                R${' '}
                                {(
                                    (basePrice + selectedAdditions.reduce((sum, a) => sum + a.option_price, 0)) *
                                    quantity
                                )
                                    .toFixed(2)
                                    .replace('.', ',')}
                            </div>
                        )}
                    </button>
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
                    pointsToEarn={Math.floor(product.price || 0)}
                />
            )}
        </div>
    );
}
