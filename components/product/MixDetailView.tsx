'use client';

import { useState, useEffect } from 'react';
import { Mix, SelectedFlavor, MixPriceBreakdown, MixCartItem } from '@/types/mix';
import { SelectedAddition } from '@/types/additions';
import FlavorSelector from './FlavorSelector';
import AdditionGroup from './AdditionGroup';
import MixPriceCalculator from './MixPriceCalculator';
import { v4 as uuidv4 } from 'uuid';

interface MixDetailViewProps {
    mix: Mix;
    onBack: () => void;
    onAddToCart: (item: MixCartItem) => void;
}

export default function MixDetailView({ mix, onBack, onAddToCart }: MixDetailViewProps) {
    const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
    const [selectedAdditions, setSelectedAdditions] = useState<SelectedAddition[]>([]);
    const [selectedOptionsByGroup, setSelectedOptionsByGroup] = useState<Record<string, string[]>>({});
    const [quantity, setQuantity] = useState(1);
    const [validationError, setValidationError] = useState<string | null>(null);

    // Convert selectedOptionsByGroup to selectedAdditions whenever it changes
    useEffect(() => {
        if (!mix.addition_groups) return;

        const additions: SelectedAddition[] = [];

        mix.addition_groups.forEach(group => {
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
    }, [selectedOptionsByGroup, mix.addition_groups]);

    // Handle addition selection from AdditionGroup
    const handleAdditionSelection = (groupId: string, optionId: string) => {
        const group = mix.addition_groups.find(g => g.id === groupId);
        if (!group) return;

        setSelectedOptionsByGroup(prev => {
            const currentSelections = prev[groupId] || [];

            if (group.type === 'single') {
                // Radio: replace selection
                const newSelections = currentSelections.includes(optionId) ? [] : [optionId];
                return { ...prev, [groupId]: newSelections };
            } else {
                // Checkbox: toggle selection
                const newSelections = currentSelections.includes(optionId)
                    ? currentSelections.filter(id => id !== optionId)
                    : [...currentSelections, optionId];
                return { ...prev, [groupId]: newSelections };
            }
        });
    };

    // Calculate price breakdown
    const calculatePriceBreakdown = (): MixPriceBreakdown => {
        const flavorsTotal = selectedFlavors.length * mix.price_per_flavor;
        const additionsTotal = selectedAdditions.reduce((sum, add) => sum + add.option_price, 0);
        const unitTotal = mix.base_price + flavorsTotal + additionsTotal;

        return {
            base: mix.base_price,
            flavors_total: flavorsTotal,
            additions_total: additionsTotal,
            unit_total: unitTotal
        };
    };

    const priceBreakdown = calculatePriceBreakdown();
    const additionsTotal = selectedAdditions.reduce((sum, add) => sum + add.option_price, 0);

    // Get selected flavors with full metadata
    const getSelectedFlavorsMetadata = (): SelectedFlavor[] => {
        return selectedFlavors.map(flavorId => {
            const flavor = mix.flavors.find(f => f.id === flavorId);
            return {
                flavor_id: flavorId,
                flavor_name: flavor?.name || 'Unknown',
                flavor_price: mix.price_per_flavor
            };
        });
    };

    // Validate selection
    const validateSelection = (): boolean => {
        setValidationError(null);

        // Check for duplicates (shouldn't happen with UI, but double-check)
        const uniqueFlavors = new Set(selectedFlavors);
        if (uniqueFlavors.size !== selectedFlavors.length) {
            setValidationError('Não é permitido selecionar o mesmo sabor 2 vezes');
            return false;
        }

        // Check max limit
        if (selectedFlavors.length > mix.max_flavors) {
            setValidationError(`Selecione no máximo ${mix.max_flavors} ${mix.max_flavors === 1 ? 'sabor' : 'sabores'}`);
            return false;
        }

        // Check if any selected flavor is out of stock
        const outOfStock = selectedFlavors.find(id => {
            const flavor = mix.flavors.find(f => f.id === id);
            return flavor?.stock_status === 'out_of_stock';
        });

        if (outOfStock) {
            setValidationError('Um ou mais sabores selecionados estão indisponíveis');
            return false;
        }

        return true;
    };

    // Handle add to cart
    const handleAddToCart = () => {
        if (!validateSelection()) {
            return;
        }

        const cartItem: MixCartItem = {
            cart_item_id: uuidv4(),
            product_id: mix.id,
            product_name: mix.name,
            product_type: 'mix',
            base_price: mix.base_price,
            quantity: quantity,
            selected_flavors: getSelectedFlavorsMetadata(),
            selected_additions: selectedAdditions,
            price_breakdown: priceBreakdown,
            item_total: priceBreakdown.unit_total * quantity,
            notes: ''
        };

        onAddToCart(cartItem);
    };

    // Handle quantity change
    const handleQuantityChange = (delta: number) => {
        const newQty = quantity + delta;
        if (newQty >= 1 && newQty <= 99) {
            setQuantity(newQty);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white pb-20">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white shadow-md">
                <div className="flex items-center gap-4 p-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Voltar"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">{mix.name}</h1>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
                {/* Mix Info */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="p-6 space-y-4">
                        <h2 className="text-2xl font-bold text-gray-800">{mix.name}</h2>
                        <div className="flex items-baseline gap-2">
                            <span className="text-sm text-gray-600">Base:</span>
                            <span className="text-xl font-bold text-pink-600">R$ {mix.base_price.toFixed(2)}</span>
                            <span className="text-sm text-gray-600">
                                + R$ {mix.price_per_flavor.toFixed(2)} por sabor
                            </span>
                        </div>
                        <p className="text-gray-600">
                            Escolha até {mix.max_flavors} {mix.max_flavors === 1 ? 'sabor' : 'sabores diferentes'}
                        </p>
                        {mix.stock > 0 && (
                            <div className="text-sm text-gray-500">
                                {mix.stock} {mix.stock === 1 ? 'unidade disponível' : 'unidades disponíveis'}
                            </div>
                        )}
                    </div>
                </div>

                {/* Flavor Selector */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <FlavorSelector
                        flavors={mix.flavors}
                        maxFlavors={mix.max_flavors}
                        selectedFlavors={selectedFlavors}
                        onSelectionChange={setSelectedFlavors}
                    />
                </div>

                {/* Addition Groups */}
                {mix.addition_groups && mix.addition_groups.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
                        <h3 className="text-lg font-bold text-gray-800">Personalize seu Mix</h3>
                        {mix.addition_groups.map(group => (
                            <AdditionGroup
                                key={group.id}
                                group={group}
                                selectedOptions={selectedOptionsByGroup[group.id] || []}
                                onSelectionChange={optionId => handleAdditionSelection(group.id, optionId)}
                            />
                        ))}
                    </div>
                )}

                {/* Price Calculator */}
                <MixPriceCalculator
                    basePrice={mix.base_price}
                    pricePerFlavor={mix.price_per_flavor}
                    selectedFlavorsCount={selectedFlavors.length}
                    selectedFlavors={getSelectedFlavorsMetadata()}
                    additionsTotal={additionsTotal}
                    selectedAdditions={selectedAdditions}
                    quantity={quantity}
                />

                {/* Quantity Selector */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Quantidade</label>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => handleQuantityChange(-1)}
                            disabled={quantity <= 1}
                            className="w-12 h-12 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xl transition-colors"
                        >
                            −
                        </button>
                        <span className="text-2xl font-bold text-gray-800 w-12 text-center">{quantity}</span>
                        <button
                            onClick={() => handleQuantityChange(1)}
                            disabled={quantity >= 99}
                            className="w-12 h-12 rounded-full bg-pink-500 hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xl transition-colors"
                        >
                            +
                        </button>
                    </div>
                </div>

                {/* Validation Error */}
                {validationError && (
                    <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 text-red-700 font-medium">
                        ⚠️ {validationError}
                    </div>
                )}

                {/* Add to Cart Button */}
                <button
                    onClick={handleAddToCart}
                    disabled={selectedFlavors.length === 0}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-lg py-4 rounded-2xl shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                        />
                    </svg>
                    Adicionar ao Carrinho
                </button>
            </div>
        </div>
    );
}
