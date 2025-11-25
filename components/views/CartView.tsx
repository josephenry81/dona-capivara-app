import React, { useState, useEffect } from 'react';

interface Product {
    id: string;
    nome: string;
    price: number;
    imagem?: string;
    quantity: number;
}

interface CartViewProps {
    cart: Product[];
    addToCart: (product: any) => void;
    removeFromCart: (productId: string) => void;
    onSubmitOrder: (orderData: any) => void;
}

export default function CartView({ cart, addToCart, removeFromCart, onSubmitOrder }: CartViewProps) {
    const [referralCode, setReferralCode] = useState('');
    const [bonusPoints, setBonusPoints] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('');

    // NEW STATES for Smart Delivery
    const [deliveryType, setDeliveryType] = useState<'CONDO' | 'NEIGHBOR' | 'FAR'>('CONDO');

    // Form States
    const [addressData, setAddressData] = useState({
        nome: '',
        torre: '',
        apto: '',
        rua: '',
        numero: '',
        bairro: '',
        complemento: ''
    });

    // Logic: Referral Bonus
    useEffect(() => {
        if (referralCode.length > 3) {
            setBonusPoints(50);
        } else {
            setBonusPoints(0);
        }
    }, [referralCode]);

    // Logic: Totals
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    // SMART FEE CALCULATION
    const deliveryFee = deliveryType === 'FAR' ? 5.00 : 0.00;

    const total = subtotal + deliveryFee;
    const totalPoints = Math.floor(total) + bonusPoints;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAddressData({ ...addressData, [e.target.name]: e.target.value });
    };

    const handleFinalize = (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentMethod) return alert('Selecione uma forma de pagamento');

        // Construct the final address string based on type
        let finalAddress = '';
        if (deliveryType === 'CONDO') {
            finalAddress = `Condomínio - Torre ${addressData.torre}, Apto ${addressData.apto}`;
        } else {
            finalAddress = `${addressData.rua}, ${addressData.numero} - ${addressData.bairro} (${deliveryType === 'NEIGHBOR' ? 'Vizinhança' : 'Entrega Externa'})`;
            if (addressData.complemento) finalAddress += ` - ${addressData.complemento}`;
        }

        onSubmitOrder({
            cart,
            total,
            referralCode,
            bonusPoints,
            paymentMethod,
            deliveryFee,
            customer: {
                name: addressData.nome,
                fullAddress: finalAddress,
                details: addressData
            }
        });
    };

    return (
        <div className="min-h-screen bg-[#F5F6FA] pb-32">
            {/* Header */}
            <div className="bg-white p-6 shadow-sm sticky top-0 z-10">
                <h2 className="text-2xl font-bold text-[#2D3436]">Meu Carrinho</h2>
                <p className="text-sm text-gray-400">{cart.length} itens adicionados</p>
            </div>

            <div className="p-6 space-y-6">
                {/* Product List */}
                {cart.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">Seu carrinho está vazio 😢</div>
                ) : (
                    <div className="space-y-4">
                        {cart.map((item) => (
                            <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm flex gap-4 items-center">
                                <img
                                    src={item.imagem || 'https://via.placeholder.com/80'}
                                    alt={item.nome}
                                    className="w-20 h-20 rounded-xl object-cover bg-gray-100"
                                />
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-800 text-sm line-clamp-1">{item.nome}</h3>
                                    <p className="text-[#FF4B82] font-bold">R$ {item.price.toFixed(2)}</p>
                                </div>
                                {/* Quantity Controls */}
                                <div className="flex flex-col items-center gap-1 bg-gray-50 rounded-lg p-1">
                                    <button onClick={() => addToCart(item)} className="w-8 h-8 flex items-center justify-center text-[#FF4B82] font-bold">+</button>
                                    <span className="text-xs font-bold">{item.quantity}</span>
                                    <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 flex items-center justify-center text-gray-400">-</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* --- NEW DELIVERY ZONE SELECTOR --- */}
                <div className="bg-white p-4 rounded-2xl shadow-sm">
                    <h3 className="font-bold text-gray-700 mb-3">Onde será a entrega?</h3>
                    <div className="grid gap-3">
                        <button
                            type="button"
                            onClick={() => setDeliveryType('CONDO')}
                            className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${deliveryType === 'CONDO' ? 'border-[#FF4B82] bg-[#FFF0F5]' : 'border-gray-200'}`}
                        >
                            <span className="text-2xl">🏢</span>
                            <div>
                                <p className="font-bold text-sm text-gray-800">Moro no Residencial Allegro</p>
                                <p className="text-xs text-[#28a745] font-bold">Entrega Grátis</p>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => setDeliveryType('NEIGHBOR')}
                            className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${deliveryType === 'NEIGHBOR' ? 'border-[#FF4B82] bg-[#FFF0F5]' : 'border-gray-200'}`}
                        >
                            <span className="text-2xl">🏡</span>
                            <div>
                                <p className="font-bold text-sm text-gray-800">Vizinhança (Raio 1km)</p>
                                <p className="text-xs text-[#28a745] font-bold">Entrega Grátis</p>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => setDeliveryType('FAR')}
                            className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${deliveryType === 'FAR' ? 'border-[#FF4B82] bg-[#FFF0F5]' : 'border-gray-200'}`}
                        >
                            <span className="text-2xl">🛵</span>
                            <div>
                                <p className="font-bold text-sm text-gray-800">Outros Locais</p>
                                <p className="text-xs text-gray-500">Taxa de R$ 5,00</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* --- DYNAMIC ADDRESS FORM --- */}
                <form onSubmit={handleFinalize} className="space-y-4">
                    <div className="bg-white p-4 rounded-2xl shadow-sm space-y-4">
                        <h3 className="font-bold text-gray-700">Dados de Endereço</h3>
                        <input required name="nome" placeholder="Nome Completo" value={addressData.nome} onChange={handleInputChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF4B82]" />

                        {/* CONDITIONAL INPUTS */}
                        {deliveryType === 'CONDO' ? (
                            <div className="grid grid-cols-2 gap-3">
                                <input required name="torre" placeholder="Torre" value={addressData.torre} onChange={handleInputChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF4B82]" />
                                <input required name="apto" placeholder="Apto" value={addressData.apto} onChange={handleInputChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF4B82]" />
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex gap-3">
                                    <input required name="rua" placeholder="Rua" value={addressData.rua} onChange={handleInputChange} className="flex-[2] p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF4B82]" />
                                    <input required name="numero" placeholder="Nº" value={addressData.numero} onChange={handleInputChange} className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF4B82]" />
                                </div>
                                <input required name="bairro" placeholder="Bairro" value={addressData.bairro} onChange={handleInputChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF4B82]" />
                                <input name="complemento" placeholder="Complemento (Opcional)" value={addressData.complemento} onChange={handleInputChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF4B82]" />
                            </div>
                        )}
                    </div>

                    {/* Gamification / Referral */}
                    <div className="bg-[#FFF8E1] border border-[#FFE082] p-4 rounded-xl">
                        <label className="text-xs font-bold text-[#FFB300] uppercase mb-1 block">Código de Indicação (Opcional)</label>
                        <input
                            type="text"
                            placeholder="Ex: AMIGO10"
                            value={referralCode}
                            onChange={(e) => setReferralCode(e.target.value)}
                            className="w-full bg-white border border-[#FFE082] rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-[#FFB300]"
                        />
                        {bonusPoints > 0 && (
                            <div className="flex items-center gap-2 mt-2 text-[#F57F17] text-sm font-bold">
                                <span>✨</span> Você ganhará +{bonusPoints} pontos extras!
                            </div>
                        )}
                    </div>

                    {/* Summary */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm space-y-2 text-sm">
                        <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>R$ {subtotal.toFixed(2)}</span></div>
                        <div className="flex justify-between text-gray-500">
                            <span>Entrega ({deliveryType === 'CONDO' ? 'Condomínio' : deliveryType === 'NEIGHBOR' ? 'Vizinhança' : 'Externa'})</span>
                            <span className={deliveryFee === 0 ? 'text-[#28a745] font-bold' : ''}>
                                {deliveryFee === 0 ? 'Grátis' : `R$ ${deliveryFee.toFixed(2)}`}
                            </span>
                        </div>
                        <div className="border-t border-gray-100 my-2 pt-2 flex justify-between text-lg font-bold text-[#2D3436]">
                            <span>Total</span>
                            <span>R$ {total.toFixed(2)}</span>
                        </div>
                        <div className="bg-[#FFF0F5] text-[#FF4B82] text-center py-2 rounded-lg font-bold text-xs">
                            💎 Você acumula {totalPoints} pontos neste pedido
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <h3 className="font-bold text-gray-700 mt-4">Pagamento</h3>
                    <div className="grid grid-cols-3 gap-2">
                        {['PIX', 'Cartão', 'Dinheiro'].map((method) => (
                            <button
                                key={method}
                                type="button"
                                onClick={() => setPaymentMethod(method)}
                                className={`py-3 rounded-xl text-sm font-bold border transition-all ${paymentMethod === method
                                    ? 'bg-[#FF4B82] text-white border-[#FF4B82]'
                                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                {method}
                            </button>
                        ))}
                    </div>

                    <button
                        type="submit"
                        disabled={cart.length === 0 || !paymentMethod}
                        className="w-full bg-gradient-to-r from-[#FF4B82] to-[#FF9E3D] text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-200 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Finalizar Pedido
                    </button>
                </form>
            </div>
        </div>
    );
}
