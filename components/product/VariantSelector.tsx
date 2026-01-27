'use client';

import React from 'react';

export interface ProductVariant {
    id: string;
    label: string; // e.g., "200g", "500g", "1kg"
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
        <div className="mb-8">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                Opções Disponíveis
            </h3>

            <div className="flex flex-wrap gap-4">
                {variants.map(variant => {
                    const isOutOfStock = variant.stock <= 0;
                    const isDisabled = disabled || isOutOfStock;

                    return (
                        <button
                            key={variant.id}
                            onClick={() => !isDisabled && onSelect(variant.id)}
                            disabled={isDisabled}
                            className={`
                                relative flex flex-col items-start justify-center
                                min-w-[110px] p-4 rounded-[24px] border-2 transition-all duration-300
                                ${
                                    variant.isSelected
                                        ? 'border-pink-500 bg-pink-50 shadow-xl shadow-pink-100/50 scale-[1.05] z-10'
                                        : 'border-gray-100 bg-white hover:border-pink-200 hover:shadow-lg'
                                }
                                ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                            `}
                        >
                            {/* Selection flag */}
                            {variant.isSelected && (
                                <div className="absolute top-2 right-2">
                                    <div className="w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-pink-500/40 animate-in zoom-in-50 duration-300">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-3 w-3 text-white"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            )}

                            {/* Variant label */}
                            <span
                                className={`
                                text-sm font-black tracking-tight mb-1
                                ${variant.isSelected ? 'text-pink-600' : 'text-gray-900'}
                            `}
                            >
                                {variant.label}
                            </span>

                            {/* Price */}
                            <span
                                className={`
                                text-xs font-bold tabular-nums
                                ${variant.isSelected ? 'text-pink-400' : 'text-gray-400'}
                            `}
                            >
                                {formatPrice(variant.price)}
                            </span>

                            {/* Stock status */}
                            {isOutOfStock ? (
                                <div className="mt-2 text-[8px] font-black uppercase tracking-widest text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                                    Esgotado
                                </div>
                            ) : variant.stock <= 5 ? (
                                <div className="mt-2 text-[8px] font-black uppercase tracking-widest text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
                                    Apenas {variant.stock}
                                </div>
                            ) : null}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
