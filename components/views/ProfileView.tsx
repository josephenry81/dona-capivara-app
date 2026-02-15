import React, { useState, useEffect } from 'react';
import { API } from '../../services/api';
import { useModal } from '../ui/Modal';

interface ProfileViewProps {
    user: any;
    onLogout: () => void;
    onNavigate: (view: string) => void;
    onUpdateUser?: (user: any) => void;
}

export default function ProfileView({ user, onLogout, onNavigate, onUpdateUser }: ProfileViewProps) {
    const currentUser = user || { name: 'Visitante', phone: '', points: 0 };
    const safePoints = isNaN(currentUser.points) ? 0 : currentUser.points;
    const inviteCode = currentUser.inviteCode || '---';
    const { confirm, alert, Modal: CustomModal } = useModal();

    // Raffle state
    const [raffleData, setRaffleData] = useState<any>(null);
    const [_loadingRaffle, setLoadingRaffle] = useState(false);

    // Resolve user ID consistently with page.tsx logic
    const userId = currentUser?.isGuest ? 'GUEST' : currentUser.id || currentUser.ID_Cliente || 'GUEST';

    // Load raffle data
    useEffect(() => {
        console.log('🎬 [ProfileView] User ID:', userId, 'Full user:', currentUser);
        if (userId && userId !== 'GUEST') {
            loadRaffleData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    const loadRaffleData = async () => {
        setLoadingRaffle(true);
        try {
            console.log('🎬 [ProfileView] Calling getMinhasChances with ID:', userId);
            const data = await API.getMinhasChances(userId);
            console.log('🎬 [ProfileView] API Response:', data);
            if (data.success) {
                setRaffleData(data);
            }
        } catch (error) {
            console.error('Error loading raffle data:', error);
        } finally {
            setLoadingRaffle(false);
        }
    };

    const getLevelInfo = (pts: number) => {
        if (pts >= 1000) return { name: '💎 Platina', color: 'from-cyan-400 to-blue-500', next: 10000, max: true };
        if (pts >= 500) return { name: '👑 Ouro', color: 'from-yellow-400 to-yellow-600', next: 1000, max: false };
        if (pts >= 200) return { name: '🥈 Prata', color: 'from-gray-300 to-gray-500', next: 500, max: false };
        return { name: '🥉 Bronze', color: 'from-orange-300 to-orange-500', next: 200, max: false };
    };

    const level = getLevelInfo(safePoints);
    const progressPercent = level.max ? 100 : Math.min(100, (safePoints / level.next) * 100);

    const copyCode = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(inviteCode);
            alert('📋 Código Copiado', 'O código de indicação foi copiado para sua área de transferência.', 'success');
        }
    };

    const shareReferralLink = async () => {
        const link = `https://dona-capivara-app.vercel.app/?ref=${inviteCode}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Dona Capivara - Geladinhos Deliciosos!',
                    text: `Use meu código ${inviteCode} e ganhe 50 pontos! 🎁`,
                    url: link
                });
            } catch (_err) {
                // User cancelled share
            }
        } else {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(link);
                alert(
                    '🔗 Link Copiado',
                    'O link de indicação foi copiado. Compartilhe com seus amigos para ganharem pontos!',
                    'success'
                );
            }
        }
    };

    const handleSync = async () => {
        if (user.phone && onUpdateUser) {
            const _res = await API.login(user.phone, 'HIDDEN');
            API.clearCacheAndReload();
        } else {
            API.clearCacheAndReload();
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F6FA] pb-24">
            <CustomModal />
            {/* Header */}
            <div className="bg-gradient-to-r from-[#FF4B82] to-[#FF9E3D] text-white pt-10 pb-24 px-6 rounded-b-[40px] shadow-lg">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-white/80 text-sm font-medium">Bem-vindo(a)</p>
                        <h1 className="text-3xl font-bold mt-1">{currentUser.name}</h1>
                        <p className="text-white/70 text-xs mt-1">{currentUser.phone}</p>
                    </div>
                    <button onClick={onLogout} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition">
                        ⚙️
                    </button>
                </div>
            </div>

            {/* Gamification */}
            <div className="mx-6 -mt-16 bg-white rounded-2xl shadow-xl p-5 relative z-10">
                <div className="flex justify-between items-center mb-3">
                    <span className={`text-lg font-bold bg-gradient-to-r ${level.color} bg-clip-text text-transparent`}>
                        {level.name}
                    </span>
                    <span className="text-[#FF9E3D] font-bold text-xl">
                        {safePoints} <span className="text-xs text-gray-400">pts</span>
                    </span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full bg-gradient-to-r ${level.color} transition-all duration-1000`}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Invite Card */}
            <div className="mx-6 mt-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-2xl p-4 flex flex-col items-center text-center shadow-sm">
                <h3 className="text-[#FF4B82] font-bold text-sm mb-1">🎁 Indique e Ganhe 50 pts!</h3>
                <p className="text-gray-500 text-xs mb-3">Seu código de amigo:</p>
                <button
                    onClick={copyCode}
                    className="flex items-center gap-3 bg-white px-6 py-3 rounded-xl border border-dashed border-[#FF4B82] active:scale-95 transition shadow-sm w-full justify-center mb-2"
                >
                    <span className="font-mono font-bold text-lg text-gray-700 tracking-widest">{inviteCode}</span>
                    <span className="text-xs bg-[#FF4B82] text-white px-2 py-1 rounded">COPIAR</span>
                </button>
                <button
                    onClick={shareReferralLink}
                    className="flex items-center gap-2 bg-gradient-to-r from-[#FF4B82] to-[#FF9E3D] text-white px-6 py-3 rounded-xl active:scale-95 transition shadow-md w-full justify-center font-medium text-sm"
                >
                    <span>🔗</span>
                    <span>Compartilhar Link de Indicação</span>
                </button>
            </div>

            {/* Raffle/Promotion Card */}
            {currentUser.id &&
                currentUser.id !== 'GUEST' &&
                raffleData &&
                raffleData.success &&
                raffleData.promocao?.ativa && (
                    <div className="mx-6 mt-4 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-2xl p-5 shadow-lg">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <span>{raffleData.promocao?.icone || '🎁'}</span>
                                <span>{raffleData.promocao?.nome || 'Promoção'}</span>
                            </h3>
                            {raffleData.numeros.length > 0 && (
                                <span className="bg-yellow-400 text-purple-900 font-bold text-xs px-3 py-1 rounded-full">
                                    {raffleData.numeros.length} {raffleData.numeros.length === 1 ? 'número' : 'números'}
                                </span>
                            )}
                        </div>

                        {raffleData.promocao?.descricao && (
                            <p className="text-xs opacity-90 mb-3">{raffleData.promocao.descricao}</p>
                        )}

                        {/* Progress */}
                        <div className="bg-white/20 rounded-xl p-3 mb-3">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="opacity-90">Gasto acumulado:</span>
                                <span className="font-bold">R$ {raffleData.gastoAtual.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="opacity-90">Faltam para próximo:</span>
                                <span className="font-bold">R$ {raffleData.faltam.toFixed(2)}</span>
                            </div>
                            <div className="bg-white/30 rounded-full h-2.5 overflow-hidden mt-2">
                                <div
                                    className="bg-yellow-400 h-full transition-all duration-500"
                                    style={{
                                        width: `${((raffleData.gastoAtual % raffleData.metaAtual) / raffleData.metaAtual) * 100}%`
                                    }}
                                />
                            </div>
                        </div>

                        {/* Numbers */}
                        {raffleData.numeros.length > 0 ? (
                            <div>
                                <p className="text-xs opacity-75 mb-2">Seus números da sorte:</p>
                                <div className="grid grid-cols-4 gap-2">
                                    {raffleData.numeros.slice(0, 8).map((numero: any, index: number) => (
                                        <div
                                            key={index}
                                            className={`
                                            rounded-lg p-2 text-center font-bold text-sm
                                            ${
                                                numero.ganhou
                                                    ? 'bg-yellow-400 text-purple-900'
                                                    : 'bg-white/20 text-white'
                                            }
                                        `}
                                        >
                                            {numero.numero}
                                        </div>
                                    ))}
                                </div>
                                {raffleData.numeros.length > 8 && (
                                    <p className="text-xs opacity-75 mt-2 text-center">
                                        +{raffleData.numeros.length - 8} mais
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm opacity-90 text-center">
                                Compre mais R$ {raffleData.metaAtual.toFixed(2)} para ganhar sua primeira chance! 🎁
                            </p>
                        )}
                    </div>
                )}

            {/* Menu */}
            <div className="px-6 space-y-3 mt-6">
                <button
                    onClick={() => onNavigate('orders')}
                    className="w-full bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center hover:bg-gray-50"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-[#FF4B82]">📦</span>
                        <span className="text-gray-700 font-medium text-sm">Meus Pedidos</span>
                    </div>
                    <span className="text-gray-300">›</span>
                </button>

                <button
                    onClick={() => {
                        const phone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '5541991480096';
                        const message = encodeURIComponent('Olá! Preciso de ajuda 💬');

                        // Detectar se é mobile para usar protocolo nativo
                        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

                        if (isMobile) {
                            // Protocolo nativo - abre direto no app
                            window.location.href = `whatsapp://send?phone=${phone}&text=${message}`;
                        } else {
                            // Desktop - abre WhatsApp Web
                            window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
                        }
                    }}
                    className="w-full bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center hover:bg-green-50"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-green-500">💬</span>
                        <span className="text-gray-700 font-medium text-sm">Fale com a Dona Capivara</span>
                    </div>
                    <span className="text-gray-300">›</span>
                </button>

                <button
                    onClick={handleSync}
                    className="w-full bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center hover:bg-blue-50"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-blue-500">🔄</span>
                        <span className="text-gray-700 font-medium text-sm">Atualizar App (Limpar Cache)</span>
                    </div>
                    <span className="text-gray-300">›</span>
                </button>

                {/* Help & Support Section */}
                <div className="pt-2">
                    <p className="text-xs text-gray-400 font-medium px-1 mb-2">Ajuda & Suporte</p>

                    <button
                        onClick={() => {
                            localStorage.removeItem('dcap_onboarding_done');
                            localStorage.removeItem('dcap_tour_done');
                            window.location.reload();
                        }}
                        className="w-full bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center hover:bg-purple-50 mb-2"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-purple-500">📖</span>
                            <span className="text-gray-700 font-medium text-sm">Rever Tutorial</span>
                        </div>
                        <span className="text-gray-300">›</span>
                    </button>

                    <details className="bg-white rounded-2xl shadow-sm overflow-hidden mb-2">
                        <summary className="p-4 flex justify-between items-center hover:bg-gray-50 cursor-pointer">
                            <div className="flex items-center gap-3">
                                <span className="text-amber-500">❓</span>
                                <span className="text-gray-700 font-medium text-sm">Perguntas Frequentes</span>
                            </div>
                            <span className="text-gray-300 transition-transform">▼</span>
                        </summary>
                        <div className="px-4 pb-4 space-y-3">
                            <div className="bg-gray-50 rounded-xl p-3">
                                <p className="font-medium text-gray-700 text-sm mb-1">Como faço um pedido?</p>
                                <p className="text-gray-500 text-xs">
                                    Navegue pelos produtos, adicione ao carrinho, e clique em &quot;Finalizar
                                    Pedido&quot;.
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3">
                                <p className="font-medium text-gray-700 text-sm mb-1">Qual o prazo de entrega?</p>
                                <p className="text-gray-500 text-xs">
                                    Entregas no condomínio são imediatas. Para outros locais, até 40 minutos.
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3">
                                <p className="font-medium text-gray-700 text-sm mb-1">Quais formas de pagamento?</p>
                                <p className="text-gray-500 text-xs">
                                    Aceitamos PIX, Cartão de Crédito/Débito e Dinheiro.
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3">
                                <p className="font-medium text-gray-700 text-sm mb-1">Como ganho pontos?</p>
                                <p className="text-gray-500 text-xs">
                                    A cada R$1 em compras você ganha 1 ponto. Com 500 pontos troque por descontos!
                                </p>
                            </div>
                        </div>
                    </details>
                </div>

                <button
                    onClick={async () => {
                        const confirmed = await confirm(
                            '🚪 Sair da Conta?',
                            'Tem certeza que deseja sair da sua conta?'
                        );
                        if (confirmed) onLogout();
                    }}
                    className="w-full bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center hover:bg-red-50 mt-4 mb-8"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-red-400">🚪</span>
                        <span className="text-red-500 font-medium text-sm">Sair da Conta</span>
                    </div>
                </button>

                <p className="text-center text-[10px] text-gray-300 pb-4">Versão 1.5.0 • Dona Capivara</p>
            </div>
        </div>
    );
}
