import React from 'react';
import Image from 'next/image';

interface BannerProps {
    imageUrl: string;
    altText: string;
    title: string;
    subtitle?: string;
    ctaText: string;
    onCtaClick?: () => void;
    priority?: boolean;
}

export default function Banner({
    imageUrl,
    altText,
    title,
    subtitle,
    ctaText,
    onCtaClick,
    priority = false
}: BannerProps) {
    // Normalize image URL - ensure it has a protocol
    const normalizedImageUrl =
        imageUrl.startsWith('http://') || imageUrl.startsWith('https://') ? imageUrl : `https://${imageUrl}`;

    return (
        <div className="w-full relative overflow-hidden rounded-2xl shadow-lg my-6">
            {/* Fixed Height Container: 700-900px range */}
            <div className="relative w-full h-[800px] min-h-[700px] max-h-[900px] bg-gradient-to-r from-[#FF4B82] to-[#FF9E3D]">
                {/* Optimized Image */}
                <Image
                    src={normalizedImageUrl}
                    alt={altText}
                    fill
                    priority={priority}
                    className="object-cover mix-blend-overlay opacity-90"
                    sizes="(max-width: 768px) 100vw, 80vw"
                />

                {/* Dark Gradient Overlay for Text Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

                {/* Centered Content */}
                <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-6 z-10">
                    <h2 className="text-3xl md:text-5xl font-bold text-white drop-shadow-md mb-2 max-w-prose leading-tight">
                        {title}
                    </h2>

                    {subtitle && (
                        <p className="text-white/95 text-base md:text-lg mb-6 font-medium drop-shadow-sm max-w-md">
                            {subtitle}
                        </p>
                    )}

                    <button
                        onClick={onCtaClick}
                        className="px-8 py-3 bg-white text-[#FF4B82] font-bold rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 uppercase tracking-wide text-sm md:text-base"
                    >
                        {ctaText}
                    </button>
                </div>
            </div>
        </div>
    );
}
