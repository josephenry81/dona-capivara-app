'use client';

import { FlavorOptionProps } from '@/types/mix';
import Image from 'next/image';

export default function FlavorOption({ flavor, isSelected, isDisabled, onToggle }: FlavorOptionProps) {
    const handleClick = () => {
        if (!isDisabled) {
            onToggle();
        }
    };

    return (
        <label
            className={`
                flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer
                transition-all duration-200
                ${isSelected ? 'border-pink-500 bg-pink-50' : 'border-gray-200 bg-white'}
                ${isDisabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'hover:border-pink-300 hover:shadow-md'}
            `}
        >
            <input
                type="checkbox"
                checked={isSelected}
                disabled={isDisabled}
                onChange={handleClick}
                className="w-5 h-5 accent-pink-500 cursor-pointer disabled:cursor-not-allowed"
            />

            {flavor.image_url && (
                <div className="relative w-12 h-12 flex-shrink-0">
                    <Image
                        src={flavor.image_url}
                        alt={flavor.name}
                        fill
                        className={`object-cover rounded-lg ${isDisabled ? 'opacity-50' : ''}`}
                        sizes="48px"
                    />
                </div>
            )}

            <div className="flex-1 min-w-0">
                <div className={`font-medium ${isDisabled ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                    {flavor.name}
                </div>
                <div className="text-sm text-gray-500">
                    {flavor.stock_status === 'out_of_stock' ? (
                        <span className="text-red-500">Indisponível</span>
                    ) : (
                        flavor.category
                    )}
                </div>
            </div>

            {!isDisabled && (
                <span className="text-pink-600 font-bold flex-shrink-0">+R$ {flavor.price.toFixed(2)}</span>
            )}
        </label>
    );
}
