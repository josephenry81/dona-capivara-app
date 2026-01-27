'use client';

import React from 'react';

interface RatingStarsProps {
    rating: number; // 0-5
    size?: 'sm' | 'md' | 'lg'; // Tamanho
    interactive?: boolean; // Clicável?
    onChange?: (rating: number) => void;
}

export default function RatingStars({ rating, size = 'md', interactive = false, onChange }: RatingStarsProps) {
    const sizeClasses = {
        sm: 'text-sm',
        md: 'text-xl',
        lg: 'text-3xl'
    };

    const handleClick = (index: number) => {
        if (interactive && onChange) {
            onChange(index + 1);
        }
    };

    return (
        <div className={`flex gap-1 ${sizeClasses[size]}`}>
            {[0, 1, 2, 3, 4].map(index => (
                <button
                    key={index}
                    type="button"
                    onClick={() => handleClick(index)}
                    disabled={!interactive}
                    className={`${interactive ? 'cursor-pointer hover:scale-110 transition' : 'cursor-default'}`}
                >
                    <span className={index < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}>
                        {index < Math.floor(rating) ? '⭐️' : '☆'}
                    </span>
                </button>
            ))}
        </div>
    );
}
