import React from 'react';
import { SelectedAddition } from '../../types/additions';

interface CartItemAdditionsProps {
    additions: SelectedAddition[];
}

export default function CartItemAdditions({ additions }: CartItemAdditionsProps) {
    if (!additions || additions.length === 0) {
        return null;
    }

    return (
        <div className="mt-2 space-y-1">
            {additions.map((addition, index) => (
                <div
                    key={`${addition.group_id}-${addition.option_id}-${index}`}
                    className="flex items-center gap-2 text-xs text-gray-600"
                >
                    <span className="text-pink-500">+</span>
                    <span className="flex-1">{addition.option_name}</span>
                    <span className="font-semibold">R$ {addition.option_price.toFixed(2)}</span>
                </div>
            ))}
        </div>
    );
}
