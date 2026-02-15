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
            <div className="p-6 rounded-[32px] bg-white/50 backdrop-blur-sm border border-white/40 shadow-sm animate-pulse">
                <div className="flex items-center justify-between mb-6">
                    <div className="h-6 bg-gray-200 rounded-full w-40"></div>
                    <div className="h-4 bg-gray-100 rounded-full w-24"></div>
                </div>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div
                            key={i}
                            className="flex items-center gap-4 p-3 border border-dashed border-gray-100 rounded-2xl"
                        >
                            <div className="w-6 h-6 bg-gray-200 rounded-lg"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded-full w-3/4"></div>
                                <div className="h-3 bg-gray-100 rounded-full w-1/2"></div>
                            </div>
                            <div className="h-4 bg-gray-200 rounded-full w-12"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-transparent">
            {/* Group Header */}
            <div className="flex items-center justify-between mb-5 px-1">
                <div className="flex flex-col">
                    <h3 className="font-black text-gray-900 text-base flex items-center gap-2 tracking-tight">
                        {group.name}
                        {group.required && (
                            <span className="text-[8px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                                obrigatório
                            </span>
                        )}
                    </h3>

                    {/* Constraints info */}
                    {group.min > 0 || (group.max < 99 && group.type === 'multiple') ? (
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                            {group.min > 0 && `Mín: ${group.min}`}
                            {group.min > 0 && group.max < 99 && ' • '}
                            {group.max < 99 && group.type === 'multiple' && `Máx: ${group.max}`}
                        </p>
                    ) : (
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">
                            {group.type === 'single' ? 'Escolha uma opção' : 'Opcional'}
                        </p>
                    )}
                </div>

                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                        />
                    </svg>
                </div>
            </div>

            <div className="space-y-3">
                {group.options.map(option => {
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
