import React from 'react';

interface ProfileViewProps {
    user: any;
    onLogout: () => void;
    onNavigate: (view: string) => void;
}

export default function ProfileView({ user, onLogout, onNavigate }: ProfileViewProps) {
    const currentUser = user || { name: 'Visitante', phone: '', points: 0 };
    const safePoints = isNaN(currentUser.points) ? 0 : currentUser.points;
    const inviteCode = currentUser.inviteCode || '---';

    const getLevelInfo = (pts: number) => {
        if (pts >= 1000) return { name: '💎 Platina', color: 'from-cyan-400 to-blue-500', next: 10000, max: true };
        if (pts >= 500) return { name: '👑 Ouro', color: 'from-yellow-400 to-yellow-600', next: 1000, max: false };
        if (pts >= 200) return { name: '🥈 Prata', color: 'from-gray-300 to-gray-500', next: 500, max: false };
        return { name: '🥉 Bronze', color: 'from-orange-300 to-orange-500', next: 200, max: false };
    };
    const level = getLevelInfo(safePoints);
    const progressPercent = level.max ? 100 : Math.min(100, (safePoints / level.next) * 100);

    // --- COPY LINK LOGIC ---
    const copyLink = () => {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const link = `${origin}/?ref=${inviteCode}`;

        if (navigator.clipboard) {
            navigator.clipboard.writeText(link);
            alert('Link copiado! Envie no WhatsApp.');
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F6FA] pb-24">
            <div className="bg-gradient-to-r from-[#FF4B82] to-[#FF9E3D] text-white pt-10 pb-24 px-6 rounded-b-[40px] shadow-lg">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-white/80 text-sm font-medium">Bem-vindo(a)</p>
                        <h1 className="text-3xl font-bold mt-1">{currentUser.name}</h1>
                        <p className="text-white/70 text-xs mt-1">{currentUser.phone}</p>
                    </div>
                    <button onClick={onLogout} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition">⚙️</button>
                </div>
            </div>

            <div className="mx-6 -mt-16 bg-white rounded-2xl shadow-xl p-5 relative z-10">
                <div className="flex justify-between items-center mb-3">
                    <span className={`text-lg font-bold bg-gradient-to-r ${level.color} bg-clip-text text-transparent`}>{level.name}</span>
                    <span className="text-[#FF9E3D] font-bold text-xl">{safePoints} <span className="text-xs text-gray-400">pts</span></span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${level.color} transition-all duration-1000`} style={{ width: `${progressPercent}%` }} />
                </div>
            </div>

            {/* --- INVITE CARD WITH SHAREABLE LINK --- */}
            <div className="mx-6 mt-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-2xl p-4 flex flex-col items-center text-center shadow-sm">
                <h3 className="text-[#FF4B82] font-bold text-sm mb-1">🎁 Indique e Ganhe 50 pts!</h3>
                <p className="text-gray-500 text-xs mb-3">Envie seu link para amigos ganharem pontos na 1ª compra.</p>

                <button
                    onClick={copyLink}
                    className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-dashed border-[#FF4B82] active:scale-95 transition shadow-sm w-full justify-center hover:bg-pink-50"
                >
                    <span className="text-2xl">🔗</span>
                    <div className="text-left">
                        <p className="text-[10px] text-gray-400 font-bold">SEU LINK:</p>
                        <p className="font-mono font-bold text-sm text-gray-700 truncate max-w-[200px]">dona-capivara.app/?ref={inviteCode}</p>
                    </div>
                </button>
            </div>

            <div className="px-6 space-y-3 mt-6">
                <button onClick={() => onNavigate('orders')} className="w-full bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center hover:bg-gray-50">
                    <div className="flex items-center gap-3"><span className="text-[#FF4B82]">📦</span><span className="text-gray-700 font-medium text-sm">Meus Pedidos</span></div>
                    <span className="text-gray-300">›</span>
                </button>
                <button onClick={() => window.open('https://wa.me/5541991480096?text=Suporte', '_blank')} className="w-full bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center hover:bg-green-50">
                    <div className="flex items-center gap-3"><span className="text-green-500">💬</span><span className="text-gray-700 font-medium text-sm">Fale com a Dona Capivara</span></div>
                    <span className="text-gray-300">›</span>
                </button>
                <button onClick={onLogout} className="w-full bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center hover:bg-red-50 mt-4">
                    <div className="flex items-center gap-3"><span className="text-red-400">🚪</span><span className="text-red-500 font-medium text-sm">Sair da Conta</span></div>
                </button>
            </div>
        </div>
    );
}
