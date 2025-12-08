import React from 'react';
import { SelectedAddition } from '../../types/additions';

interface PriceCalculatorProps {
    basePrice: number;
    selectedAdditions: SelectedAddition[];
    quantity: number;
}

export default function PriceCalculator({
    basePrice,
    selectedAdditions,
    quantity
}: PriceCalculatorProps) {
    const additionsSubtotal = selectedAdditions.reduce(
        (sum, addition) => sum + addition.option_price,
        0
    );

    const unitPrice = basePrice + additionsSubtotal;
    const totalPrice = unitPrice * quantity;

    // Only show breakdown if there are additions
    if (selectedAdditions.length === 0) {
        return (
            <div className="bg-white p-4 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-semibold">Total</span>
                    <span className="text-2xl font-bold text-pink-600">
                        R$ {totalPrice.toFixed(2)}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-4 rounded-2xl shadow-sm space-y-3">
            <h3 className="font-bold text-gray-700 text-sm">Resumo do Pedido</h3>

            {/* Base price */}
            <div className="flex justify-between text-sm text-gray-600">
                <span>Preço base</span>
                <span>R$ {basePrice.toFixed(2)}</span>
            </div>

            {/* Additions */}
            {selectedAdditions.map((addition) => (
                <div key={`${addition.group_id}-${addition.option_id}`} className="flex justify-between text-sm text-gray-600">
                    <span className="text-xs">+ {addition.option_name}</span>
                    <span className="text-xs">R$ {addition.option_price.toFixed(2)}</span>
                </div>
            ))}

            {/* Subtotal line */}
            <div className="border-t border-gray-100 pt-3 flex justify-between text-sm font-semibold text-gray-700">
                <span>Subtotal (unitário)</span>
                <span>R$ {unitPrice.toFixed(2)}</span>
            </div>

            {/* Quantity */}
            {quantity > 1 && (
                <div className="flex justify-between text-sm text-gray-600">
                    <span>Quantidade</span>
                    <span>× {quantity}</span>
                </div>
            )}

            {/* Total */}
            <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                <span className="text-gray-700 font-bold">Total</span>
                <span className="text-2xl font-bold text-pink-600">
                    R$ {totalPrice.toFixed(2)}
                </span>
            </div>
        </div>
    );
}
