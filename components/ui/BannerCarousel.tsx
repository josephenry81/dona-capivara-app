import React, { useState, useEffect } from 'react';
import Banner from '../common/Banner';

export default function BannerCarousel({ banners }: { banners: any[] }) {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        if (!banners || banners.length <= 1) return;
        const timer = setInterval(() => {
            setCurrent(prev => (prev + 1) % banners.length);
        }, 5000); // 5 seconds per slide for better readability
        return () => clearInterval(timer);
    }, [banners]);

    if (!banners || banners.length === 0) return null;

    return (
        <div className="mx-6 relative">
            {banners.map((banner, idx) => (
                <div
                    key={banner.id || idx}
                    className={`transition-opacity duration-1000 ${idx === current ? 'block' : 'hidden'}`}
                >
                    <Banner
                        imageUrl={banner.image}
                        altText={banner.title}
                        title={banner.title}
                        subtitle="Sabor inigualável!" // Default subtitle or from data if available
                        ctaText="Peça Agora"
                        onCtaClick={() => {
                            const productsSection = document.getElementById('produtos');
                            if (productsSection) {
                                productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                        }}
                        priority={idx === 0}
                    />
                </div>
            ))}

            {/* Dots Indicators (Overlay) */}
            {banners.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
                    {banners.map((_, idx) => (
                        <div
                            key={idx}
                            className={`w-2 h-2 rounded-full transition-all shadow-sm ${idx === current ? 'bg-white w-4' : 'bg-white/50'}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
