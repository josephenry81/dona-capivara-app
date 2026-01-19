'use client';

import React from 'react';

export interface ProductVariant {
    id: string;
    label: string;      // e.g., "200g", "500g", "1kg"
    price: number;
    stock: number;
    isSelected: boolean;
}

interface VariantSelectorProps {
    variants: ProductVariant[];
    onSelect: (variantId: string) => void;
    disabled?: boolean;
}

/**
 * 📦 VariantSelector Component
 * 
 * Displays a horizontal selector for product variations (sizes, weights, etc.)
 * Each variant shows its label, price, and stock status.
 */
export default function VariantSelector({ variants, onSelect, disabled = false }: VariantSelectorProps) {
    if (!variants || variants.length <= 1) {
        return null; // Don't show selector for single-variant products
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price);
    };

    return (
        <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="text-lg">📏</span>
                Escolha o Tamanho
            </h3>

            <div className="flex flex-wrap gap-3">
                {variants.map((variant) => {
                    const isOutOfStock = variant.stock <= 0;
                    const isDisabled = disabled || isOutOfStock;

                    return (
                        <button
                            key={variant.id}
                            onClick={() => !isDisabled && onSelect(variant.id)}
                            disabled={isDisabled}
                            className={`
                                relative flex flex-col items-center justify-center
                                min-w-[90px] p-3 rounded-xl border-2 transition-all duration-200
                                ${variant.isSelected
                                    ? 'border-pink-500 bg-pink-50 shadow-md scale-105'
                                    : 'border-gray-200 bg-white hover:border-pink-300 hover:bg-pink-25'
                                }
                                ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                ${isOutOfStock ? 'bg-gray-100' : ''}
                            `}
                        >
                            {/* Selection indicator */}
                            <div className={`
                                absolute -top-1 -right-1 w-5 h-5 rounded-full
                                flex items-center justify-center text-xs
                                transition-all duration-200
                                ${variant.isSelected
                                    ? 'bg-pink-500 text-white scale-100'
                                    : 'bg-gray-200 text-gray-400 scale-75'
                                }
                            `}>
                                {variant.isSelected ? '✓' : '○'}
                            </div>

                            {/* Variant label (weight/size) */}
                            <span className={`
                                text-sm font-bold mb-1
                                ${variant.isSelected ? 'text-pink-600' : 'text-gray-800'}
                            `}>
                                {variant.label}
                            </span>

                            {/* Price */}
                            <span className={`
                                text-xs font-medium
                                ${variant.isSelected ? 'text-pink-500' : 'text-gray-600'}
                            `}>
                                {formatPrice(variant.price)}
                            </span>

                            {/* Stock status */}
                            {isOutOfStock ? (
                                <span className="text-[10px] text-red-500 mt-1 font-medium">
                                    Esgotado
                                </span>
                            ) : variant.stock <= 5 ? (
                                <span className="text-[10px] text-orange-500 mt-1">
                                    Últimas {variant.stock}
                                </span>
                            ) : null}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
