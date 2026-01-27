import React from 'react';
import { SelectedAddition } from '../../types/additions';

interface PriceCalculatorProps {
    basePrice: number;
    selectedAdditions: SelectedAddition[];
    quantity: number;
}

export default function PriceCalculator({ basePrice, selectedAdditions, quantity }: PriceCalculatorProps) {
    const additionsSubtotal = selectedAdditions.reduce((sum, addition) => sum + addition.option_price, 0);

    const unitPrice = basePrice + additionsSubtotal;
    const totalPrice = unitPrice * quantity;

    // Only show breakdown if there are additions
    if (selectedAdditions.length === 0) {
        return (
            <div className="bg-white/40 backdrop-blur-md p-6 rounded-[32px] border border-white/60 shadow-sm">
                <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-black uppercase tracking-widest text-[10px]">
                        Total do Pedido
                    </span>
                    <span className="text-3xl font-black text-pink-600 tabular-nums">
                        R$ {totalPrice.toFixed(2).replace('.', ',')}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white/40 backdrop-blur-md p-8 rounded-[40px] border border-white/60 shadow-sm space-y-5">
            <h3 className="font-black text-gray-900 text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-pink-500 rounded-full"></span>
                Resumo do Pedido
            </h3>

            {/* Base price */}
            <div className="flex justify-between text-sm text-gray-500 font-medium">
                <span>Preço Base</span>
                <span className="text-gray-900 font-bold">R$ {basePrice.toFixed(2).replace('.', ',')}</span>
            </div>

            {/* Additions */}
            <div className="space-y-3 pt-2 border-t border-gray-100/50">
                {selectedAdditions.map(addition => (
                    <div
                        key={`${addition.group_id}-${addition.option_id}`}
                        className="flex justify-between items-center text-xs text-gray-400 font-bold"
                    >
                        <span className="flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-pink-300"></span>
                            {addition.option_name}
                        </span>
                        <span className="text-gray-600 font-black tracking-tight">
                            + R$ {addition.option_price.toFixed(2).replace('.', ',')}
                        </span>
                    </div>
                ))}
            </div>

            {/* Subtotal line */}
            <div className="border-t border-gray-100 pt-5 flex justify-between items-center text-sm font-black text-gray-900">
                <span className="uppercase tracking-widest text-[10px]">Subtotal Unitário</span>
                <span className="text-lg">R$ {unitPrice.toFixed(2).replace('.', ',')}</span>
            </div>

            {/* Quantity */}
            {quantity > 1 && (
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-pink-500 bg-pink-50/50 px-4 py-2 rounded-full border border-pink-100/50">
                    <span>Quantidade Selecionada</span>
                    <span>× {quantity} unidades</span>
                </div>
            )}

            {/* Total */}
            <div className="border-t-2 border-pink-100 pt-5 flex justify-between items-center">
                <span className="text-gray-900 font-black uppercase tracking-widest text-[10px]">Total Final</span>
                <span className="text-4xl font-black text-pink-600 tabular-nums tracking-tighter shadow-pink-200">
                    R$ {totalPrice.toFixed(2).replace('.', ',')}
                </span>
            </div>
        </div>
    );
}
