import React from 'react';

export default function CompactBanner() {
    return (
        <div className="mx-6 h-[120px] rounded-2xl bg-gradient-to-r from-[#FF4B82] to-[#FF85A2] flex items-center justify-center relative overflow-hidden shadow-lg animate-in fade-in zoom-in-95 duration-500 mb-6">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl transform -translate-x-5 translate-y-5"></div>

            <div className="text-center z-10 px-6">
                <h2 className="font-bold text-white text-xl mb-1 drop-shadow-md tracking-tight">
                    🎁 Ganhe Pontos!
                </h2>
                <p className="text-white/90 text-xs font-medium leading-tight max-w-[200px] mx-auto">
                    R$1 = 1 ponto. Troque por descontos incríveis no Clube Capivara!
                </p>
            </div>

            {/* Dots Indicator */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 opacity-80">
                <div className="w-4 h-1.5 bg-white rounded-full transition-all duration-300"></div>
                <div className="w-1.5 h-1.5 bg-white/50 rounded-full hover:bg-white/80 transition-all duration-300"></div>
                <div className="w-1.5 h-1.5 bg-white/50 rounded-full hover:bg-white/80 transition-all duration-300"></div>
            </div>
        </div>
    );
}
