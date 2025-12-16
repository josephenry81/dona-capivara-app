import React from 'react';
import { AdditionGroup as AdditionGroupType } from '../../types/additions';
import AdditionOptionComponent from './AdditionOption';

interface AdditionGroupProps {
    group: AdditionGroupType;
    selectedOptions: string[]; // Array of selected option IDs
    onSelectionChange: (optionId: string) => void;
}

export default function AdditionGroup({
    group,
    selectedOptions,
    onSelectionChange,
    loading = false
}: AdditionGroupProps & { loading?: boolean }) {
    const inputType = group.type === 'single' ? 'radio' : 'checkbox';

    // ⚡ SKELETON LOADING STATE
    if (loading || !group.options || group.options.length === 0) {
        return (
            <div className="bg-white p-4 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
                    <div className="h-4 bg-gray-100 rounded w-20 animate-pulse"></div>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                            <div className="flex-1 space-y-1">
                                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                                <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse"></div>
                            </div>
                            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-4 rounded-2xl shadow-sm">
            <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                {group.name}
                {group.required && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold">
                        Obrigatório
                    </span>
                )}
                {!group.required && (
                    <span className="text-xs text-gray-400 font-normal">(Opcional)</span>
                )}
            </h3>

            {/* Constraints info */}
            {(group.min > 0 || (group.max < 99 && group.type === 'multiple')) && (
                <p className="text-xs text-gray-500 mb-3">
                    {group.min > 0 && `Mínimo: ${group.min}`}
                    {group.min > 0 && group.max < 99 && ' | '}
                    {group.max < 99 && group.type === 'multiple' && `Máximo: ${group.max}`}
                </p>
            )}

            <div className="space-y-2">
                {group.options.map((option) => {
                    const isSelected = selectedOptions.includes(option.id);

                    return (
                        <AdditionOptionComponent
                            key={option.id}
                            option={option}
                            isSelected={isSelected}
                            onToggle={() => onSelectionChange(option.id)}
                            type={inputType}
                        />
                    );
                })}
            </div>
        </div>
    );
}

