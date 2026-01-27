'use client';

import React from 'react';
import RatingStars from './RatingStars';
import { Review } from '../../services/reviews';

interface ReviewsListProps {
    reviews: Review[];
    averageRating: number;
}

export default function ReviewsList({ reviews, averageRating }: ReviewsListProps) {
    if (reviews.length === 0) {
        return (
            <div className="text-center py-8">
                <div className="text-4xl mb-2">📝</div>
                <p className="text-gray-500 text-sm">Ainda não há avaliações</p>
                <p className="text-gray-400 text-xs mt-1">Seja o primeiro a avaliar!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Summary */}
            <div className="bg-gradient-to-r from-[#FF4B82] to-[#FF9E3D] text-white p-4 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm opacity-90">Avaliação Média</p>
                        <p className="text-3xl font-bold">{averageRating.toFixed(1)}</p>
                    </div>
                    <RatingStars rating={averageRating} size="lg" />
                </div>
                <p className="text-xs opacity-75 mt-2">
                    Baseado em {reviews.length} {reviews.length === 1 ? 'avaliação' : 'avaliações'}
                </p>
            </div>

            {/* Reviews List */}
            <div className="space-y-3">
                {reviews.map(review => (
                    <div key={review.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <p className="font-bold text-gray-800 text-sm">{review.customerName}</p>
                                <RatingStars rating={review.rating} size="sm" />
                            </div>
                            <p className="text-xs text-gray-400">
                                {new Date(review.date).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                })}
                            </p>
                        </div>

                        {review.comment && (
                            <p className="text-sm text-gray-600 mt-2 leading-relaxed">{review.comment}</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
