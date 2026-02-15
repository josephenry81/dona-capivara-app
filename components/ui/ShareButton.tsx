'use client';

import React, { useState } from 'react';
import { shareManager } from '../../services/share';

interface ShareButtonProps {
    product?: {
        id: string;
        nome: string;
        price: number;
        imagem?: string;
    };
    referralCode?: string;
    userId?: string;
    userName?: string;
    variant?: 'icon' | 'full';
    className?: string;
    onShareComplete?: (success: boolean, message: string) => void;
}

export default function ShareButton({
    product,
    referralCode,
    userId,
    userName,
    variant = 'icon',
    className = '',
    onShareComplete
}: ShareButtonProps) {
    const [isSharing, setIsSharing] = useState(false);

    const handleShare = async () => {
        setIsSharing(true);

        try {
            let result;

            if (product) {
                // Share product
                result = await shareManager.shareProduct(product, referralCode);

                // Track analytics for product share
                if (typeof window !== 'undefined' && (window as any).gtag) {
                    (window as any).gtag('event', 'share', {
                        content_type: 'product',
                        item_id: product.id,
                        method: result.method
                    });
                }
            } else if (referralCode && userId) {
                // Share referral code
                result = await shareManager.shareWithReferral(userId, referralCode, userName);

                // Track analytics for referral share
                if (typeof window !== 'undefined' && (window as any).gtag) {
                    (window as any).gtag('event', 'share', {
                        content_type: 'referral',
                        item_id: referralCode,
                        method: result.method
                    });
                }
            } else {
                setIsSharing(false);
                return;
            }

            // Callback with result
            if (onShareComplete) {
                onShareComplete(result.success, result.message || '');
            } else if (result.success && result.method === 'clipboard') {
                // Show default alert if no callback provided
                alert(result.message);
            }
        } catch (error) {
            console.error('Share error:', error);
            if (onShareComplete) {
                onShareComplete(false, 'Erro ao compartilhar');
            }
        } finally {
            setIsSharing(false);
        }
    };

    if (variant === 'icon') {
        return (
            <button
                onClick={handleShare}
                disabled={isSharing}
                className={`bg-white/20 backdrop-blur-md text-white p-2 rounded-xl hover:bg-white/30 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
                aria-label="Compartilhar"
                title="Compartilhar"
            >
                {isSharing ? (
                    <svg
                        className="animate-spin h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        ></circle>
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                    </svg>
                ) : (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                        />
                    </svg>
                )}
            </button>
        );
    }

    // Full variant with text
    return (
        <button
            onClick={handleShare}
            disabled={isSharing}
            className={`bg-gradient-to-r from-[#FF4B82] to-[#FF9E3D] text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${className}`}
        >
            {isSharing ? (
                <>
                    <svg
                        className="animate-spin h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        ></circle>
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                    </svg>
                    <span>Compartilhando...</span>
                </>
            ) : (
                <>
                    <span>🔗</span>
                    <span>Compartilhar</span>
                </>
            )}
        </button>
    );
}
