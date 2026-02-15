'use client';

import { FlavorSelectorProps } from '@/types/mix';
import FlavorOption from './FlavorOption';

export default function FlavorSelector({
    flavors,
    maxFlavors,
    selectedFlavors,
    onSelectionChange
}: FlavorSelectorProps) {
    const handleToggle = (flavorId: string) => {
        const isCurrentlySelected = selectedFlavors.includes(flavorId);

        if (isCurrentlySelected) {
            // Remove flavor
            onSelectionChange(selectedFlavors.filter(id => id !== flavorId));
        } else {
            // Add flavor if under limit and not duplicate
            if (selectedFlavors.length < maxFlavors && !selectedFlavors.includes(flavorId)) {
                onSelectionChange([...selectedFlavors, flavorId]);
            }
        }
    };

    const isFlavorDisabled = (flavorId: string) => {
        const flavor = flavors.find(f => f.id === flavorId);

        // Disabled if out of stock
        if (flavor?.stock_status === 'out_of_stock') {
            return true;
        }

        // Disabled if not selected and limit reached
        if (!selectedFlavors.includes(flavorId) && selectedFlavors.length >= maxFlavors) {
            return true;
        }

        return false;
    };

    return (
        <div className="space-y-4">
            {/* Header with counter */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">🍓 Sabores Disponíveis</h3>
                <div
                    className={`
                    px-3 py-1 rounded-full text-sm font-medium
                    ${selectedFlavors.length === maxFlavors ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-700'}
                `}
                >
                    {selectedFlavors.length} / {maxFlavors}
                </div>
            </div>

            <p className="text-sm text-gray-600">
                Selecione até {maxFlavors} {maxFlavors === 1 ? 'sabor' : 'sabores diferentes'}
            </p>

            {/* Flavor grid */}
            <div className="space-y-3">
                {flavors.map(flavor => (
                    <FlavorOption
                        key={flavor.id}
                        flavor={flavor}
                        isSelected={selectedFlavors.includes(flavor.id)}
                        isDisabled={isFlavorDisabled(flavor.id)}
                        onToggle={() => handleToggle(flavor.id)}
                    />
                ))}
            </div>

            {/* Validation messages */}
            {selectedFlavors.length === maxFlavors && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                    ✓ Limite de {maxFlavors} {maxFlavors === 1 ? 'sabor atingido' : 'sabores atingido'}
                </div>
            )}

            {flavors.filter(f => f.stock_status === 'out_of_stock').length > 0 && (
                <div className="text-xs text-gray-500 italic">* Alguns sabores estão temporariamente indisponíveis</div>
            )}
        </div>
    );
}
