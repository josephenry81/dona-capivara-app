'use client';

import React, { useState, useEffect } from 'react';
import RatingStars from './RatingStars';
import { useModal } from '../ui/Modal';

interface ReviewFormProps {
    productId: string;
    productName: string;
    user: any;
    onSubmit: (rating: number, comment: string) => Promise<void>;
    onCancel: () => void;
    pointsToEarn?: number;
}

export default function ReviewForm({
    productId: _productId,
    productName,
    user,
    onSubmit,
    onCancel,
    pointsToEarn = 0
}: ReviewFormProps) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { alert, Modal: CustomModal } = useModal();

    // FIX: Validação interna de segurança
    useEffect(() => {
        if (!user || !user.id || user.isGuest) {
            console.error('ReviewForm: user inválido detectado', user);
            onCancel(); // Fecha modal automaticamente
        }
    }, [user, onCancel]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (rating === 0) {
            alert(
                '⭐ Avaliação Necessária',
                'Por favor, selecione uma nota de 1 a 5 estrelas antes de enviar sua avaliação.',
                'warning'
            );
            return;
        }

        setSubmitting(true);
        try {
            await onSubmit(rating, comment);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <CustomModal />
            <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-in slide-in-from-bottom duration-300">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Avaliar Produto</h2>

                {pointsToEarn > 0 && (
                    <div className="bg-gradient-to-r from-pink-50 to-orange-50 border border-pink-100 rounded-xl p-3 mb-4 flex items-center gap-3 animate-pulse">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-sm">
                            💎
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-pink-500 uppercase tracking-widest">Recompensa Exclusiva</p>
                            <p className="text-sm font-medium text-gray-800">
                                Ganhe <span className="text-[#FF4B82] font-black text-lg">+{pointsToEarn} pontos</span> ao avaliar!
                            </p>
                        </div>
                    </div>
                )}

                <div className="bg-gray-50 p-3 rounded-xl mb-4">
                    <p className="text-sm font-bold text-gray-700">{productName}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Sua avaliação:</label>
                        <div className="flex justify-center">
                            <RatingStars rating={rating} size="lg" interactive onChange={setRating} />
                        </div>
                        {rating > 0 && <p className="text-center text-sm text-gray-500 mt-2">{rating} de 5 estrelas</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Comentário (opcional):</label>
                        <textarea
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            placeholder="Conte sua experiência com este produto..."
                            maxLength={500}
                            rows={4}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF4B82] transition resize-none"
                        />
                        <p className="text-xs text-gray-400 mt-1">{comment.length}/500 caracteres</p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={submitting}
                            className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || rating === 0}
                            className="flex-1 bg-gradient-to-r from-[#FF4B82] to-[#FF9E3D] text-white font-bold py-3 rounded-xl hover:shadow-lg transition disabled:opacity-50 active:scale-95"
                        >
                            {submitting ? 'Enviando...' : 'Enviar Avaliação'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
