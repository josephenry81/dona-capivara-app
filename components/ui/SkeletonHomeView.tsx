import React from 'react';

export default function SkeletonHomeView() {
    return (
        <div className="min-h-screen bg-[#F5F6FA] pb-24">
            {/* Header Skeleton */}
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
                <div className="bg-white rounded-full shadow-lg p-4 h-14 animate-pulse"></div>
            </div>

            {/* Banner Skeleton */}
            <div className="mx-6 mt-6">
                <div className="bg-gray-200 rounded-2xl h-48 animate-pulse"></div>
            </div>

            {/* Categories Skeleton */}
            <div className="flex gap-3 px-6 pb-4 mt-6 overflow-x-auto">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-10 w-24 bg-gray-200 rounded-full animate-pulse flex-shrink-0"></div>
                ))}
            </div>

            {/* Products Grid Skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-6 mt-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="bg-white rounded-2xl p-4 space-y-3 shadow-sm">
                        <div className="w-full h-32 bg-gray-200 rounded-xl animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-3 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-8 bg-gray-200 rounded-lg animate-pulse mt-2"></div>
                    </div>
                ))}
            </div>

            {/* Loading Text */}
            <div className="text-center mt-8">
                <p className="text-[#FF4B82] font-bold animate-pulse">Carregando delícias...</p>
            </div>
        </div>
    );
}
