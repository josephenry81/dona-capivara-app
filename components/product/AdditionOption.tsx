import React from 'react';
import { AdditionOption } from '../../types/additions';

interface AdditionOptionProps {
    option: AdditionOption;
    isSelected: boolean;
    onToggle: () => void;
    disabled?: boolean;
    type: 'radio' | 'checkbox';
}

export default function AdditionOptionComponent({
    option,
    isSelected,
    onToggle,
    disabled = false,
    type
}: AdditionOptionProps) {
    const isOutOfStock = option.stock_status === 'out_of_stock';
    const isDisabled = disabled || isOutOfStock;

    return (
        <label
            className={`
        flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer
        ${isDisabled
                    ? 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed'
                    : isSelected
                        ? 'bg-pink-50 border-pink-400 shadow-sm'
                        : 'bg-white border-gray-200 hover:border-pink-300 hover:shadow-sm'
                }
      `}
        >
            <input
                type={type}
                checked={isSelected}
                onChange={onToggle}
                disabled={isDisabled}
                className="w-4 h-4 text-pink-600 focus:ring-pink-500"
            />

            {option.image_url && (
                <img
                    src={option.image_url}
                    alt={option.name}
                    className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                />
            )}

            <div className="flex-1">
                <p className={`font-semibold text-sm ${isOutOfStock ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {option.name}
                </p>
                {option.sku && (
                    <p className="text-xs text-gray-400">SKU: {option.sku}</p>
                )}
            </div>

            {isOutOfStock ? (
                <span className="text-xs text-red-500 font-bold bg-red-50 px-2 py-1 rounded">
                    Indisponível
                </span>
            ) : (
                <span className="text-pink-600 font-bold text-sm whitespace-nowrap">
                    +R$ {option.price.toFixed(2)}
                </span>
            )}
        </label>
    );
}
