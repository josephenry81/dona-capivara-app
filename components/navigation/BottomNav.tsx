import React from 'react';

interface BottomNavProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    cartCount: number;
    favoriteCount: number;
    isGuest?: boolean;
}

export default function BottomNav({ activeTab, onTabChange, cartCount, favoriteCount, isGuest }: BottomNavProps) {
    const navItems = [
        {
            id: 'home',
            label: 'Início',
            icon: (active: boolean) => (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill={active ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
            )
        },
        {
            id: 'favorites',
            label: 'Favoritos',
            badge: favoriteCount,
            icon: (active: boolean) => (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill={active ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
            )
        },
        {
            id: 'cart',
            label: 'Carrinho',
            badge: cartCount,
            icon: (active: boolean) => (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill={active ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="8" cy="21" r="1" />
                    <circle cx="19" cy="21" r="1" />
                    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                </svg>
            )
        },
        {
            id: 'profile',
            label: 'Perfil',
            icon: (active: boolean) => (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill={active ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                </svg>
            )
        }
    ].filter(item => !(isGuest && (item.id === 'profile' || item.id === 'favorites')));

    return (
        <div className="fixed bottom-6 left-0 w-full px-6 z-50 flex justify-center pointer-events-none">
            <nav
                className={`bg-white/80 backdrop-blur-2xl border border-white/40 shadow-[0_20px_40px_rgba(0,0,0,0.1)] rounded-[32px] h-20 w-full flex items-center px-4 pointer-events-auto transition-all duration-300 ${isGuest ? 'max-w-[240px] justify-center gap-12' : 'max-w-[400px] justify-around'
                    }`}
            >
                {navItems.map(item => {
                    const isActive = activeTab === item.id;
                    const tourId = item.id === 'home' ? 'home-tab' : `${item.id}-icon`;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            data-tour={tourId}
                            className={`relative flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 group ${isActive ? 'text-[#FF4B82]' : 'text-gray-400'
                                }`}
                        >
                            {/* Glow Effect for active */}
                            {isActive && (
                                <div className="absolute inset-0 bg-pink-50/50 rounded-2xl -z-10 blur-xl opacity-50"></div>
                            )}

                            <div
                                className={`relative transition-all duration-300 ${isActive ? 'scale-110 -translate-y-1' : 'group-hover:scale-110'}`}
                            >
                                {item.icon(isActive)}

                                {item.badge !== undefined && item.badge > 0 && (
                                    <span className="absolute -top-1.5 -right-2 bg-[#FF4B82] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center shadow-lg border-2 border-white animate-in zoom-in-50 duration-300">
                                        {item.badge}
                                    </span>
                                )}
                            </div>

                            <span
                                className={`text-[11px] font-black mt-1.5 transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-0 scale-75 h-0'}`}
                            >
                                {item.label}
                            </span>

                            {isActive && (
                                <div className="absolute bottom-3 w-1.5 h-1.5 rounded-full bg-[#FF4B82] shadow-[0_0_10px_rgba(255,75,130,0.5)]"></div>
                            )}
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}
