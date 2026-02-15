import React from 'react';
import Image from 'next/image';

export default function LoadingCapybara() {
    return (
        <div className="flex flex-col items-center justify-center h-[70vh] w-full bg-[#F5F6FA]">
            <div className="relative">
                {/* Animated Capybara */}
                <div className="w-32 h-32 bg-white rounded-full p-2 shadow-xl animate-bounce z-10 relative">
                    <Image
                        src="/loading-logo.jpg"
                        alt="Dona Capivara - Carregando..."
                        width={128}
                        height={128}
                        className="w-full h-full object-cover rounded-full border-2 border-[#FF9E3D]"
                    />
                </div>
                {/* Shadow ripple effect underneath */}
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-20 h-4 bg-black/10 rounded-[100%] blur-sm animate-pulse"></div>
            </div>

            <h3 className="mt-8 text-lg font-bold text-[#FF4B82] animate-pulse tracking-wide">
                Carregando delícias...
            </h3>
        </div>
    );
}
