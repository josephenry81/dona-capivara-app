import React from 'react';
import Image from 'next/image';

interface Category {
    id: string;
    nome: string;
    imagem?: string;
}

interface CategoryGridProps {
    categories: Category[];
    activeCategory: string;
    onCategoryClick: (id: string) => void;
}

export default function CategoryGrid({ categories, activeCategory, onCategoryClick }: CategoryGridProps) {
    return (
        <div data-tour="categories" className="flex gap-4 overflow-x-auto px-6 pb-6 pt-2 scrollbar-hide">
            {/* "Todos" Category Card */}
            <button
                onClick={() => onCategoryClick('todos')}
                className={`flex-shrink-0 flex flex-col items-center p-4 rounded-[30px] transition-all duration-500 border-2 ${
                    activeCategory === 'todos'
                        ? 'bg-white border-[#FF4B82] shadow-xl shadow-pink-100 scale-105'
                        : 'bg-white border-transparent hover:border-pink-100 shadow-sm hover:shadow-md'
                }`}
            >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF4B82] to-[#FF9E3D] flex items-center justify-center text-3xl mb-3 shadow-lg shadow-pink-200">
                    🔥
                </div>
                <span
                    className={`font-black text-[11px] uppercase tracking-wider ${activeCategory === 'todos' ? 'text-[#FF4B82]' : 'text-gray-400'}`}
                >
                    Todos
                </span>
            </button>

            {/* Dynamic Category Cards */}
            {categories.map(cat => (
                <button
                    key={cat.id}
                    onClick={() => onCategoryClick(cat.id)}
                    className={`flex-shrink-0 flex flex-col items-center p-4 rounded-[30px] transition-all duration-500 border-2 ${
                        activeCategory === cat.id
                            ? 'bg-white border-[#FF4B82] shadow-xl shadow-pink-100 scale-105'
                            : 'bg-white border-transparent hover:border-pink-100 shadow-sm hover:shadow-md'
                    }`}
                >
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 overflow-hidden relative mb-3 shadow-inner border border-gray-100/50">
                        {cat.imagem ? (
                            <Image src={cat.imagem} alt={cat.nome} fill className="object-cover" />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-2xl bg-gradient-to-br from-pink-50 to-orange-50 opacity-50">
                                🍦
                            </div>
                        )}
                    </div>
                    <span
                        className={`font-black text-[11px] uppercase tracking-wider text-center leading-tight ${activeCategory === cat.id ? 'text-[#FF4B82]' : 'text-gray-400'}`}
                    >
                        {cat.nome}
                    </span>
                </button>
            ))}
        </div>
    );
}
