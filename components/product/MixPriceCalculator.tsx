'use client';

import { MixPriceCalculatorProps } from '@/types/mix';

export default function MixPriceCalculator({
    basePrice,
    pricePerFlavor,
    selectedFlavorsCount,
    selectedFlavors,
    additionsTotal,
    selectedAdditions,
    quantity
}: MixPriceCalculatorProps) {
    const flavorsSubtotal = selectedFlavorsCount * pricePerFlavor;
    const unitPrice = basePrice + flavorsSubtotal + additionsTotal;
    const totalPrice = unitPrice * quantity;

    return (
        <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-6 border-2 border-pink-200 shadow-lg">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">💰 Resumo do Pedido</h3>

            <div className="space-y-3">
                {/* Base Price */}
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Base Mix:</span>
                    <span className="font-medium text-gray-800">R$ {basePrice.toFixed(2)}</span>
                </div>

                {/* Flavors */}
                {selectedFlavorsCount > 0 && (
                    <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                                Sabores ({selectedFlavorsCount}x R$ {pricePerFlavor.toFixed(2)}):
                            </span>
                            <span className="font-medium text-gray-800">R$ {flavorsSubtotal.toFixed(2)}</span>
                        </div>
                        {selectedFlavors.length > 0 && (
                            <div className="pl-4 space-y-1">
                                {selectedFlavors.map((flavor, index) => (
                                    <div key={index} className="text-xs text-gray-500">
                                        • {flavor.flavor_name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Additions */}
                {selectedAdditions.length > 0 && (
                    <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Adicionais:</span>
                            <span className="font-medium text-gray-800">R$ {additionsTotal.toFixed(2)}</span>
                        </div>
                        <div className="pl-4 space-y-1">
                            {selectedAdditions.map((addition, index) => (
                                <div key={index} className="flex justify-between text-xs text-gray-500">
                                    <span>• {addition.option_name}</span>
                                    <span>R$ {addition.option_price.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Divider */}
                <div className="border-t-2 border-pink-300 pt-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Preço Unitário:</span>
                        <span className="font-medium text-gray-800">R$ {unitPrice.toFixed(2)}</span>
                    </div>
                </div>

                {/* Quantity multiplier */}
                {quantity > 1 && (
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Quantidade:</span>
                        <span>× {quantity}</span>
                    </div>
                )}

                {/* Total */}
                <div className="bg-white rounded-xl p-3 shadow-md">
                    <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-800">Total:</span>
                        <span className="text-2xl font-bold text-pink-600">R$ {totalPrice.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Helpful note */}
            {selectedFlavorsCount === 0 && (
                <div className="mt-4 text-xs text-gray-500 italic text-center">
                    Selecione sabores para ver o preço total
                </div>
            )}
        </div>
    );
}
