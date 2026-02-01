import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface Banner {
    id?: string;
    image: string;
    title: string;
    subtitle?: string;
    ctaText?: string;
}

interface BannerCarouselProps {
    banners: Banner[];
    onCtaClick?: () => void;
    autoPlayInterval?: number; // milliseconds
    priority?: boolean;
}

export default function BannerCarousel({
    banners,
    onCtaClick,
    autoPlayInterval = 5000,
    priority = false
}: BannerCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Auto-play logic
    useEffect(() => {
        if (!isAutoPlaying || banners.length <= 1) return;

        intervalRef.current = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % banners.length);
        }, autoPlayInterval);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isAutoPlaying, banners.length, autoPlayInterval]);

    // Reset to first banner when banners array changes
    useEffect(() => {
        setCurrentIndex(0);
    }, [banners]);

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
        // Reset auto-play timer
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsAutoPlaying(true);
    };

    const handlePrevious = () => {
        setCurrentIndex(prev => (prev - 1 + banners.length) % banners.length);
    };

    const handleNext = () => {
        setCurrentIndex(prev => (prev + 1) % banners.length);
    };

    // Touch handlers for swipe
    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const minSwipeDistance = 50;

        if (distance > minSwipeDistance) {
            handleNext();
        } else if (distance < -minSwipeDistance) {
            handlePrevious();
        }

        setTouchStart(0);
        setTouchEnd(0);
    };

    if (!banners || banners.length === 0) return null;

    const currentBanner = banners[currentIndex];

    return (
        <div
            className="relative w-full mt-6 mb-6 rounded-3xl overflow-hidden shadow-xl group"
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Banner Container - Configuração responsiva sem bordas 
                Mobile: 16:9 com object-cover para preencher sem bordas
                Desktop: 16:9 mantém proporção ideal
                Imagem padrão pode ser alterada via banco de dados (ver HomeView.tsx)
            */}
            <div className="relative w-full aspect-[16/9] sm:aspect-[16/9] md:aspect-[16/9] bg-yellow-400">
                {/* Background Image with Fade Animation */}
                <div className="absolute inset-0">
                    {banners.map((banner, index) => (
                        <div
                            key={banner.id || index}
                            className={`absolute inset-0 transition-opacity duration-700 ${index === currentIndex ? 'opacity-100' : 'opacity-0'}`}
                        >
                            <Image
                                src={banner.image || 'https://via.placeholder.com/800x400?text=Banner'}
                                alt={banner.title}
                                fill
                                priority={priority && index === 0}
                                sizes="(max-width: 768px) 100vw, 80vw"
                                className="object-cover object-center"
                                quality={90}
                            />
                        </div>
                    ))}
                </div>

                {/* Gradient Overlay - Apenas sutil no bottom para não escurecer a imagem */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />

                {/* Content - Oculto para banners locais que já possuem texto integrado */}
                {!currentBanner.image.startsWith('/') && (
                    <div className="relative h-full flex flex-col justify-end p-6 text-white z-10">
                        {/* Title with Slide Animation */}
                        <h2
                            key={`title-${currentIndex}`}
                            className="text-2xl md:text-3xl font-bold mb-2 pr-20 animate-in slide-in-from-bottom-4 fade-in duration-500"
                        >
                            {currentBanner.title}
                        </h2>

                        {/* Subtitle */}
                        {currentBanner.subtitle && (
                            <p
                                key={`subtitle-${currentIndex}`}
                                className="text-sm md:text-base text-white/90 mb-4 pr-20 animate-in slide-in-from-bottom-2 fade-in duration-500 delay-100"
                            >
                                {currentBanner.subtitle}
                            </p>
                        )}

                        {/* CTA Button */}
                        {currentBanner.ctaText && (
                            <button
                                key={`cta-${currentIndex}`}
                                onClick={onCtaClick}
                                className="self-start bg-gradient-to-r from-[#FF4B82] to-[#FF9E3D] text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all active:scale-95 animate-in slide-in-from-bottom fade-in duration-500 delay-200"
                            >
                                {currentBanner.ctaText}
                            </button>
                        )}
                    </div>
                )}

                {/* Navigation Arrows (Desktop) */}
                {banners.length > 1 && (
                    <>
                        <button
                            onClick={handlePrevious}
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 hidden md:flex"
                            aria-label="Banner anterior"
                        >
                            ‹
                        </button>
                        <button
                            onClick={handleNext}
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 hidden md:flex"
                            aria-label="Próximo banner"
                        >
                            ›
                        </button>
                    </>
                )}
            </div>

            {/* Dots Navigation */}
            {banners.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    {banners.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`transition-all duration-300 rounded-full ${
                                index === currentIndex ? 'w-8 h-2 bg-white' : 'w-2 h-2 bg-white/50 hover:bg-white/75'
                            }`}
                            aria-label={`Ir para banner ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
