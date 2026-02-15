import React from 'react';

interface QuickStatsProps {
    points?: number;
    nextLevel?: number;
}

export default function QuickStats({ points = 450, nextLevel = 500 }: QuickStatsProps) {
    const progress = Math.min((points / nextLevel) * 100, 100);
    const missing = Math.max(0, nextLevel - points);

    return (
        <div className="mx-6 mt-4 p-4 rounded-xl border-l-4 border-[#FF4B82] bg-white shadow-sm flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Clube Capivara 👑</p>
                <p className="text-xl font-black text-gray-800">{points} <span className="text-sm font-medium text-gray-500">pontos</span></p>
            </div>
            <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 mb-1">Faltam {missing} pts</p>
                <p className="text-xs font-bold text-[#FF4B82]">para Gold+ 🏆</p>
                {/* Micro Progress Bar */}
                <div className="w-20 h-1.5 bg-gray-100 rounded-full mt-1 ml-auto overflow-hidden">
                    <div className="h-full bg-[#FF4B82] transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
        </div>
    );
}
