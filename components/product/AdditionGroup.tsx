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
    onSelectionChange
}: AdditionGroupProps) {
    const inputType = group.type === 'single' ? 'radio' : 'checkbox';

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
