import React from 'react';

interface BottomNavProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    cartCount: number;
    favoriteCount: number;
    isGuest?: boolean; // NEW PROP
}

export default function BottomNav({ activeTab, onTabChange, cartCount, favoriteCount, isGuest }: BottomNavProps) {
    // Define all items first
    const allItems = [
        { id: 'home', label: 'Início', icon: '🏠' },
        { id: 'favorites', label: 'Favoritos', icon: '❤️', badge: favoriteCount },
        { id: 'cart', label: 'Carrinho', icon: '🛒', badge: cartCount },
        { id: 'profile', label: 'Perfil', icon: '👤' }
    ];

    // FILTER: If isGuest is true, remove the 'profile' item
    const navItems = allItems.filter(item => !(isGuest && item.id === 'profile'));

    return (
        <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-[0_-5px_10px_rgba(0,0,0,0.05)] z-50 h-16">
            <div className="flex justify-around items-center h-full max-w-md mx-auto">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={`relative flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${isActive ? 'text-[#FF4B82]' : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            {/* Icon Container */}
                            <div className="relative">
                                <span className={`text-2xl ${isActive ? 'scale-110 transform' : ''} transition-transform`}>
                                    {item.icon}
                                </span>

                                {/* Badge Logic */}
                                {item.badge !== undefined && item.badge > 0 && (
                                    <span className="absolute -top-2 -right-3 bg-[#FF4B82] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] flex justify-center shadow-sm border border-white">
                                        {item.badge}
                                    </span>
                                )}
                            </div>

                            {/* Label */}
                            <span className="text-[10px] font-medium mt-1">
                                {item.label}
                            </span>

                            {/* Active Indicator */}
                            {isActive && (
                                <span className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-[#FF4B82] to-[#FF9E3D] rounded-b-md" />
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
