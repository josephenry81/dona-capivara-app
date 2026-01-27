import React from 'react';
import Image from 'next/image';
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
                group relative flex items-center gap-4 p-4 rounded-[24px] border transition-all duration-300 cursor-pointer
                ${
                    isDisabled
                        ? 'bg-gray-50 border-gray-100 opacity-50 cursor-not-allowed'
                        : isSelected
                          ? 'bg-pink-50/50 border-pink-200 shadow-lg shadow-pink-100/50 ring-2 ring-pink-400/20'
                          : 'bg-white border-gray-100 hover:border-pink-200 hover:shadow-xl hover:shadow-gray-200/30'
                }
            `}
        >
            {/* Selection Indicator Ring (Decorative) */}
            {!isDisabled && isSelected && (
                <div className="absolute inset-0 rounded-[24px] bg-pink-500/5 animate-pulse"></div>
            )}

            {/* Input Element (Hidden but accessible) */}
            <div className="relative flex items-center justify-center">
                <input type={type} checked={isSelected} onChange={onToggle} disabled={isDisabled} className="sr-only" />
                <div
                    className={`
                    w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center
                    ${
                        isSelected
                            ? 'bg-pink-500 border-pink-500 scale-110'
                            : 'bg-white border-gray-200 group-hover:border-pink-300'
                    }
                `}
                >
                    {isSelected && (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-white"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                            />
                        </svg>
                    )}
                </div>
            </div>

            {option.image_url && (
                <div className="relative w-14 h-14 shrink-0 rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                    <Image
                        src={option.image_url}
                        alt={option.name}
                        fill
                        className="object-cover transition-transform group-hover:scale-110 duration-500"
                    />
                </div>
            )}

            <div className="flex-1 min-w-0">
                <p
                    className={`font-black text-sm tracking-tight truncate ${isOutOfStock ? 'line-through text-gray-400' : 'text-gray-900'}`}
                >
                    {option.name}
                </p>
                {option.sku && (
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider truncate">
                        Ref: {option.sku}
                    </p>
                )}
            </div>

            {isOutOfStock ? (
                <div className="shrink-0 bg-red-50 px-3 py-1.5 rounded-full">
                    <span className="text-[10px] text-red-500 font-black uppercase tracking-widest">Esgotado</span>
                </div>
            ) : (
                <div className="shrink-0 flex flex-col items-end">
                    <span className="text-pink-600 font-black text-sm whitespace-nowrap tabular-nums">
                        +R$ {option.price.toFixed(2).replace('.', ',')}
                    </span>
                </div>
            )}
        </label>
    );
}
