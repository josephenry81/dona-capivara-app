import React, { useState, useEffect } from 'react';
import { API } from '../../services/api';
import { useModal } from '../ui/Modal';


interface Flavor {
    id: string;
    name: string;
    category: string;
    price: number;
    stock_status: 'available' | 'out_of_stock';
    image_url: string | null;
}

interface AdditionOption {
    id: string;
    name: string;
    price: number;
    stock_status: string;
    image_url: string | null;
}

interface AdditionGroup {
    id: string;
    name: string;
    type: 'single' | 'multiple';
    required: boolean;
    min: number;
    max: number;
    options: AdditionOption[];
}

interface MixGourmetViewProps {
    mixId: string;
    onBack: () => void;
    onAddToCart: (mixData: any) => void;
}

export default function MixGourmetView({ mixId, onBack, onAddToCart }: MixGourmetViewProps) {
    const [mix, setMix] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Selections
    const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
    const [selectedAdditions, setSelectedAdditions] = useState<any[]>([]);
    const [quantity, setQuantity] = useState(1);
    const { alert, Modal: CustomModal } = useModal();


    useEffect(() => {
        loadMixData();
    }, [mixId]);

    const loadMixData = async () => {
        setLoading(true);
        try {
            const data = await API.getMixWithFlavorAndAdditions(mixId);
            if (data) {
                setMix(data);
            }
        } catch (error) {
            console.error('Error loading mix:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handle flavor selection (max 2)
    const toggleFlavor = (flavorId: string) => {
        setSelectedFlavors(prev => {
            if (prev.includes(flavorId)) {
                return prev.filter(id => id !== flavorId);
            }
            if (prev.length >= 2) {
                return [...prev.slice(1), flavorId];
            }
            return [...prev, flavorId];
        });
    };

    // Handle addition toggle
    const toggleAddition = (groupId: string, option: AdditionOption) => {
        setSelectedAdditions(prev => {
            const existingIndex = prev.findIndex(
                a => a.group_id === groupId && a.option_id === option.id
            );

            if (existingIndex >= 0) {
                return prev.filter((_, i) => i !== existingIndex);
            }

            return [...prev, {
                group_id: groupId,
                group_name: mix.addition_groups.find((g: any) => g.id === groupId)?.name || '',
                option_id: option.id,
                option_name: option.name,
                option_price: option.price
            }];
        });
    };

    // Calculate totals
    const calculatePrice = () => {
        if (!mix) return { base: 0, flavors: 0, additions: 0, total: 0 };

        const base = mix.base_price || 0;
        const flavorsTotal = selectedFlavors.length * (mix.price_per_flavor || 0);
        const additionsTotal = selectedAdditions.reduce((sum, a) => sum + a.option_price, 0);
        const unitTotal = base + flavorsTotal + additionsTotal;

        return {
            base,
            flavors: flavorsTotal,
            additions: additionsTotal,
            unit: unitTotal,
            total: unitTotal * quantity
        };
    };

    const price = calculatePrice();

    // Handle add to cart
    const handleAddToCart = async () => {
        if (selectedFlavors.length === 0) {
            alert(
                '⚠️ Escolha um Sabor',
                'Por favor, selecione pelo menos 1 sabor para o seu Mix antes de adicionar ao carrinho.',
                'warning'
            );
            return;
        }

        const mixData = {
            id: mix.id,
            nome: mix.name,
            price: mix.base_price,
            quantity,
            selected_flavors: selectedFlavors.map(id => {
                const flavor = mix.flavors.find((f: Flavor) => f.id === id);
                return {
                    flavor_id: flavor.id,
                    flavor_name: flavor.name,
                    flavor_price: mix.price_per_flavor
                };
            }),
            selected_additions: selectedAdditions,
            unit_price: price.unit,
            cart_item_id: `mix-${Date.now()}`
        };

        onAddToCart(mixData);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center">
                <CustomModal />
                <div className="text-center">
                    <div className="w-20 h-20 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-bold">Carregando sabores deliciosos...</p>
                </div>
            </div>
        );
    }

    if (!mix) {
        return (
            <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center p-6">
                <CustomModal />
                <div className="text-center">
                    <p className="text-6xl mb-4">😢</p>
                    <p className="text-gray-600 font-bold">Mix não encontrado</p>
                    <button onClick={onBack} className="mt-4 bg-pink-500 text-white px-6 py-2 rounded-full font-bold">
                        Voltar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex flex-col relative">
            <CustomModal />
            {/* Header */}
            <div className="relative h-[18vh] w-full bg-gradient-to-br from-pink-400 via-purple-400 to-orange-400 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/10"></div>
                <button
                    onClick={onBack}
                    className="absolute top-4 left-4 bg-white/90 backdrop-blur-md p-2 rounded-full shadow-lg hover:scale-110 transition active:scale-95"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div className="relative text-center text-white z-10">
                    <h1 className="text-3xl font-bold">🍦 {mix.name}</h1>
                    <p className="text-sm opacity-90">Monte sua combinação perfeita!</p>
                </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 p-4 flex flex-col -mt-6 bg-white rounded-t-[30px] relative z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] pb-32">
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 opacity-50"></div>

                {/* Titulo Monte o Seu */}
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">🎨</span>
                    <h2 className="text-lg font-bold text-gray-800">Monte o Seu Mix</h2>
                </div>

                {/* Custom Tab Content */}
                <div className="space-y-6">
                    {/* Flavors Section */}
                    <section className="bg-white rounded-2xl shadow-sm p-4">
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="font-bold text-gray-800 flex items-center gap-2">
                                <span>🍓</span>
                                <span>Escolha até 2 Sabores</span>
                            </h2>
                            <span className="bg-[pink-50] text-pink-500 font-bold text-sm px-3 py-1 rounded-full">
                                {selectedFlavors.length}/2
                            </span>
                        </div>
                        <div className="space-y-2">
                            {mix.flavors.map((flavor: Flavor) => {
                                const isSelected = selectedFlavors.includes(flavor.id);
                                const isAvailable = flavor.stock_status === 'available';

                                return (
                                    <label
                                        key={flavor.id}
                                        className={`
                                            flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer
                                            ${!isAvailable
                                                ? 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed'
                                                : isSelected
                                                    ? 'bg-[pink-50] border-pink-500 shadow-sm'
                                                    : 'bg-white border-gray-200 hover:border-pink-500/50 hover:shadow-sm'
                                            }
                                        `}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => isAvailable && toggleFlavor(flavor.id)}
                                            disabled={!isAvailable}
                                            className="w-5 h-5 text-pink-500 accent-pink-500 focus:ring-pink-500 rounded"
                                        />

                                        {flavor.image_url ? (
                                            <img
                                                src={flavor.image_url}
                                                alt={flavor.name}
                                                className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[pink-50] to-orange-50 flex items-center justify-center text-2xl">
                                                🍦
                                            </div>
                                        )}

                                        <div className="flex-1">
                                            <p className={`font-semibold text-sm ${!isAvailable ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                                {flavor.name}
                                            </p>
                                            {flavor.category && (
                                                <p className="text-xs text-gray-400">{flavor.category}</p>
                                            )}
                                        </div>

                                        {!isAvailable ? (
                                            <span className="text-xs text-red-500 font-bold bg-red-50 px-2 py-1 rounded">
                                                Indisponível
                                            </span>
                                        ) : (
                                            <span className="text-pink-500 font-bold text-sm whitespace-nowrap">
                                                +R$ {(mix.price_per_flavor || 0).toFixed(2)}
                                            </span>
                                        )}
                                    </label>
                                );
                            })}
                        </div>
                    </section>

                    {/* Additions Sections */}
                    {mix.addition_groups && mix.addition_groups.map((group: AdditionGroup) => (
                        <section key={group.id} className="bg-white rounded-2xl shadow-sm p-4">
                            <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                                <span>{group.name.includes('Calda') ? '🍯' : '🎂'}</span>
                                <span>{group.name}</span>
                                {group.required ? (
                                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold">
                                        Obrigatório
                                    </span>
                                ) : (
                                    <span className="text-xs text-gray-400 font-normal">(Opcional)</span>
                                )}
                            </h3>
                            <div className="space-y-2">
                                {group.options.map((option: AdditionOption) => {
                                    const isSelected = selectedAdditions.some(
                                        a => a.group_id === group.id && a.option_id === option.id
                                    );
                                    const isAvailable = option.stock_status === 'available';

                                    return (
                                        <label
                                            key={option.id}
                                            className={`
                                                flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer
                                                ${!isAvailable
                                                    ? 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed'
                                                    : isSelected
                                                        ? 'bg-orange-50 border-orange-400 shadow-sm'
                                                        : 'bg-white border-gray-200 hover:border-orange-400/50 hover:shadow-sm'
                                                }
                                            `}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => isAvailable && toggleAddition(group.id, option)}
                                                disabled={!isAvailable}
                                                className="w-5 h-5 text-orange-400 accent-orange-400 focus:ring-orange-400 rounded"
                                            />

                                            {option.image_url ? (
                                                <img
                                                    src={option.image_url}
                                                    alt={option.name}
                                                    className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center text-2xl">
                                                    🧁
                                                </div>
                                            )}

                                            <div className="flex-1">
                                                <p className={`font-semibold text-sm ${!isAvailable ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                                    {option.name}
                                                </p>
                                            </div>

                                            {!isAvailable ? (
                                                <span className="text-xs text-red-500 font-bold bg-red-50 px-2 py-1 rounded">
                                                    Indisponível
                                                </span>
                                            ) : (
                                                <span className="text-orange-400 font-bold text-sm whitespace-nowrap">
                                                    +R$ {option.price.toFixed(2)}
                                                </span>
                                            )}
                                        </label>
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                </div>

                {/* Bottom Bar */}
                <>
                    {/* Bottom Bar - Same as ProductDetailView */}
                    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 p-4 pb-8 flex items-center gap-4 z-40 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                        {/* Quantity Selector */}
                        <div className="flex items-center bg-gray-100 rounded-xl px-3 py-2 h-14">
                            <button
                                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                className="w-8 text-xl font-bold text-gray-500 hover:text-pink-500 transition"
                            >
                                -
                            </button>
                            <span className="w-8 text-center font-bold text-gray-800 text-lg">{quantity}</span>
                            <button
                                onClick={() => setQuantity(q => q + 1)}
                                className="w-8 text-xl font-bold text-gray-500 hover:text-pink-500 transition"
                            >
                                +
                            </button>
                        </div>

                        {/* Add to Cart Button */}
                        <button
                            onClick={handleAddToCart}
                            disabled={selectedFlavors.length === 0}
                            className="flex-1 h-14 bg-gradient-to-r from-[#FF4B82] to-[#FF9E3D] text-white font-bold rounded-xl shadow-lg shadow-orange-200 hover:opacity-90 transition flex justify-between items-center px-6 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span>Adicionar</span>
                            <span className="bg-white/20 px-2 py-1 rounded text-sm">
                                R$ {price.total.toFixed(2)}
                            </span>
                        </button>
                    </div>
                </>
            </div>
        </div>
    );
}


