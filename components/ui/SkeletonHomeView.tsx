import React from 'react';

// 🎨 Componente Shimmer - efeito de brilho deslizante
const Shimmer = ({ className }: { className?: string }) => (
    <div
        className={`bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer ${className || ''}`}
    ></div>
);

export default function SkeletonHomeView() {
    return (
        <div className="min-h-screen bg-[#F5F6FA] pb-24">
            {/* Header Skeleton - Mantém gradiente original para identidade visual */}
            <div className="bg-gradient-to-r from-[#FF4B82] to-[#FF9E3D] pt-12 pb-24 px-6 rounded-b-[40px]">
                <div className="flex justify-between items-start">
                    <div className="space-y-2">
                        <div className="h-4 w-24 bg-white/30 rounded animate-pulse"></div>
                        <div className="h-6 w-32 bg-white/40 rounded animate-pulse"></div>
                    </div>
                    <div className="w-10 h-10 bg-white/30 rounded-full animate-pulse"></div>
                </div>
            </div>

            {/* Search Skeleton */}
            <div className="-mt-8 mx-6 relative z-20">
                <Shimmer className="rounded-full shadow-lg h-14" />
            </div>

            {/* Banner Skeleton - Com shimmer effect */}
            <div className="mx-6 mt-6">
                <Shimmer className="rounded-2xl h-48" />
            </div>

            {/* Categories Skeleton */}
            <div className="flex gap-3 px-6 pb-4 mt-6 overflow-x-auto">
                {[1, 2, 3, 4].map(i => (
                    <Shimmer key={i} className="h-10 w-24 rounded-full flex-shrink-0" />
                ))}
            </div>

            {/* Products Grid Skeleton - Com shimmer effect premium */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-6 mt-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="bg-white rounded-2xl p-4 space-y-3 shadow-sm">
                        <Shimmer className="w-full h-32 rounded-xl" />
                        <Shimmer className="h-4 rounded" />
                        <Shimmer className="h-3 w-3/4 rounded" />
                        <Shimmer className="h-8 rounded-lg mt-2" />
                    </div>
                ))}
            </div>

            {/* Loading Text - Animação mais suave */}
            <div className="text-center mt-8">
                <p className="text-[#FF4B82] font-bold animate-pulse">Carregando delícias...</p>
            </div>

            {/* CSS para animação shimmer */}
            <style jsx>{`
                @keyframes shimmer {
                    0% {
                        background-position: 200% 0;
                    }
                    100% {
                        background-position: -200% 0;
                    }
                }
                :global(.animate-shimmer) {
                    animation: shimmer 1.5s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
