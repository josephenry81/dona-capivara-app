'use client';

import { MixCartItemProps } from '@/types/mix';

export default function CartItemMix({ item, onQuantityChange, onRemove }: MixCartItemProps) {
    const handleQuantityChange = (delta: number) => {
        const newQty = item.quantity + delta;
        if (newQty >= 1 && newQty <= 99) {
            onQuantityChange(newQty);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg p-4 space-y-3">
            {/* Header */}
            <div className="flex items-start gap-3">
                <div className="flex-1">
                    <h3 className="font-bold text-gray-800 text-lg">{item.product_name}</h3>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                        Mix Personalizado
                    </span>
                </div>
                <button
                    onClick={onRemove}
                    className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition-colors"
                    aria-label="Remover item"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                    </svg>
                </button>
            </div>

            {/* Price Breakdown */}
            <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-4 space-y-2">
                {/* Base Price */}
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                        Base Mix:
                        {item.price_breakdown.flavors_total === 0 && item.selected_flavors.length > 0 && (
                            <span className="text-green-600 text-xs ml-1">
                                (inclui {item.selected_flavors.length} sabores)
                            </span>
                        )}
                    </span>
                    <span className="text-gray-800 font-medium">R$ {item.base_price.toFixed(2)}</span>
                </div>

                {/* Flavors - Only show if they have a cost */}
                {item.selected_flavors.length > 0 && item.price_breakdown.flavors_total > 0 && (
                    <div className="space-y-1">
                        <div className="flex justify-between text-sm font-medium text-gray-700">
                            <span>🍓 Sabores ({item.selected_flavors.length}):</span>
                            <span>R$ {item.price_breakdown.flavors_total.toFixed(2)}</span>
                        </div>
                        <div className="pl-4 space-y-0.5">
                            {item.selected_flavors.map((flavor, index) => (
                                <div key={index} className="flex justify-between text-xs text-gray-600">
                                    <span>• {flavor.flavor_name}</span>
                                    <span>R$ {flavor.flavor_price.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Additions */}
                {item.selected_additions.length > 0 && (
                    <div className="space-y-1">
                        <div className="flex justify-between text-sm font-medium text-gray-700">
                            <span>🍫 Adicionais ({item.selected_additions.length}):</span>
                            <span>R$ {item.price_breakdown.additions_total.toFixed(2)}</span>
                        </div>
                        <div className="pl-4 space-y-0.5">
                            {item.selected_additions.map((addition, index) => (
                                <div key={index} className="flex justify-between text-xs text-gray-600">
                                    <span>• {addition.option_name}</span>
                                    <span>R$ {addition.option_price.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Divider */}
                <div className="border-t border-pink-200 pt-2">
                    <div className="flex justify-between text-sm font-medium">
                        <span className="text-gray-700">Preço Unitário:</span>
                        <span className="text-gray-900">R$ {item.price_breakdown.unit_total.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => handleQuantityChange(-1)}
                        disabled={item.quantity <= 1}
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg transition-colors flex items-center justify-center"
                    >
                        −
                    </button>
                    <span className="text-xl font-bold text-gray-800 w-8 text-center">{item.quantity}</span>
                    <button
                        onClick={() => handleQuantityChange(1)}
                        disabled={item.quantity >= 99}
                        className="w-8 h-8 rounded-full bg-pink-500 hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg transition-colors flex items-center justify-center"
                    >
                        +
                    </button>
                </div>

                {/* Subtotal */}
                <div className="text-right">
                    <div className="text-xs text-gray-500">Subtotal</div>
                    <div className="text-xl font-bold text-pink-600">R$ {item.item_total.toFixed(2)}</div>
                </div>
            </div>

            {/* Notes (if any) */}
            {item.notes && item.notes.trim() !== '' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                    <span className="font-medium text-yellow-800">Observações: </span>
                    <span className="text-yellow-700">{item.notes}</span>
                </div>
            )}
        </div>
    );
}
