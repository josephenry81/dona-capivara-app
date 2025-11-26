import React, { useState, useEffect } from 'react';

interface Product { id: string; nome: string; price: number; imagem?: string; quantity: number; }

interface CartViewProps {
    cart: Product[];
    user: any; // NEW PROP
    addToCart: (product: any) => void;
    removeFromCart: (productId: string) => void;
    onSubmitOrder: (orderData: any) => void;
}

export default function CartView({ cart, user, addToCart, removeFromCart, onSubmitOrder }: CartViewProps) {
    const [referralCode, setReferralCode] = useState('');
    const [bonusPoints, setBonusPoints] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [deliveryType, setDeliveryType] = useState<'CONDO' | 'NEIGHBOR' | 'FAR'>('CONDO');

    const [addressData, setAddressData] = useState({
        nome: '', torre: '', apto: '', rua: '', numero: '', bairro: '', complemento: ''
    });

    // --- AUTO-FILL LOGIC ---
    useEffect(() => {
        if (user && !user.isGuest) {
            // Pre-fill name
            const startName = user.name || '';

            // Pre-fill address if available
            const saved = user.savedAddress || {};

            setAddressData(prev => ({
                ...prev,
                nome: startName,
                torre: saved.torre || '',
                apto: saved.apto || ''
            }));

            // Smart Selection: If we have a saved Tower, default to CONDO
            if (saved.torre) setDeliveryType('CONDO');
        }
    }, [user]);

    useEffect(() => { if (referralCode.length > 3) setBonusPoints(50); else setBonusPoints(0); }, [referralCode]);

    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const deliveryFee = deliveryType === 'FAR' ? 5.00 : 0.00;
    const total = subtotal + deliveryFee;
    const totalPoints = Math.floor(total) + bonusPoints;

    const handleInputChange = (e: any) => setAddressData({ ...addressData, [e.target.name]: e.target.value });

    const handleFinalize = (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentMethod) return alert('Selecione uma forma de pagamento');

        let finalAddress = '';
        if (deliveryType === 'CONDO') finalAddress = `Condomínio - Torre ${addressData.torre}, Apto ${addressData.apto}`;
        else finalAddress = `${addressData.rua}, ${addressData.numero} - ${addressData.bairro} (${deliveryType === 'NEIGHBOR' ? 'Vizinhança' : 'Entrega Externa'})`;

        onSubmitOrder({
            cart, total, referralCode, bonusPoints, paymentMethod, deliveryFee,
            customer: { name: addressData.nome, fullAddress: finalAddress, details: addressData }
        });
    };

    return (
        <div className="min-h-screen bg-[#F5F6FA] pb-32">
            <div className="bg-white p-6 shadow-sm sticky top-0 z-10">
                <h2 className="text-2xl font-bold text-[#2D3436]">Meu Carrinho</h2>
                <p className="text-sm text-gray-400">{cart.length} itens</p>
            </div>

            <div className="p-6 space-y-6">
                {cart.length === 0 ? <div className="text-center py-10 text-gray-400">Carrinho vazio</div> : cart.map((item) => (
                    <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm flex gap-4 items-center">
                        <img src={item.imagem || 'https://via.placeholder.com/80'} alt={item.nome} className="w-16 h-16 rounded-xl object-cover bg-gray-100" />
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-800 text-sm line-clamp-1">{item.nome}</h3>
                            <p className="text-[#FF4B82] font-bold">R$ {item.price.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-2 py-1">
                            <button onClick={() => removeFromCart(item.id)} className="text-gray-400 font-bold px-2">-</button>
                            <span className="text-sm font-bold">{item.quantity}</span>
                            <button onClick={() => addToCart(item)} className="text-[#FF4B82] font-bold px-2">+</button>
                        </div>
                    </div>
                ))}

                {cart.length > 0 && (
                    <>
                        <div className="bg-white p-4 rounded-2xl shadow-sm">
                            <h3 className="font-bold text-gray-700 mb-3">Entrega</h3>
                            <div className="grid gap-3">
                                {[{ id: 'CONDO', icon: '🏢', label: 'Condomínio', sub: 'Grátis' }, { id: 'NEIGHBOR', icon: '🏡', label: 'Vizinhança', sub: 'Grátis' }, { id: 'FAR', icon: '🛵', label: 'Outros', sub: 'R$ 5,00' }].map((zone) => (
                                    <button key={zone.id} type="button" onClick={() => setDeliveryType(zone.id as any)} className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${deliveryType === zone.id ? 'border-[#FF4B82] bg-[#FFF0F5]' : 'border-gray-200'}`}>
                                        <span className="text-2xl">{zone.icon}</span>
                                        <div><p className="font-bold text-sm text-gray-800">{zone.label}</p><p className="text-xs text-gray-500">{zone.sub}</p></div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <form onSubmit={handleFinalize} className="space-y-4">
                            <div className="bg-white p-4 rounded-2xl shadow-sm space-y-4 w-full">
                                <h3 className="font-bold text-gray-700">Dados</h3>
                                {/* --- NEW LABEL --- */}
                                <label className="text-xs font-bold text-gray-400 ml-1 uppercase">Como gostaria de ser chamado?</label>
                                <input required name="nome" placeholder="Ex: João da Silva" value={addressData.nome} onChange={handleInputChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF4B82]" />

                                {deliveryType === 'CONDO' ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        <input required name="torre" placeholder="Torre" value={addressData.torre} onChange={handleInputChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF4B82]" />
                                        <input required name="apto" placeholder="Apto" value={addressData.apto} onChange={handleInputChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF4B82]" />
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-3 gap-3">
                                            <input required name="rua" placeholder="Rua" value={addressData.rua} onChange={handleInputChange} className="col-span-2 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF4B82]" />
                                            <input required name="numero" placeholder="Nº" value={addressData.numero} onChange={handleInputChange} className="col-span-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF4B82]" />
                                        </div>
                                        <input required name="bairro" placeholder="Bairro" value={addressData.bairro} onChange={handleInputChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF4B82]" />
                                    </>
                                )}

                                <div className="mt-4 bg-[#FFF8E1] border border-[#FFE082] p-3 rounded-xl">
                                    <input type="text" placeholder="Código de Indicação (Opcional)" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} className="w-full bg-white border border-[#FFE082] rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-[#FFB300]" />
                                    {bonusPoints > 0 && <div className="text-[#F57F17] text-xs font-bold mt-1">✨ +{bonusPoints} pontos!</div>}
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-2xl shadow-sm space-y-2 text-sm">
                                <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>R$ {subtotal.toFixed(2)}</span></div>
                                <div className="flex justify-between text-gray-500"><span>Entrega</span><span className={deliveryFee === 0 ? 'text-[#28a745]' : 'text-red-500'}>{deliveryFee === 0 ? 'Grátis' : `R$ ${deliveryFee.toFixed(2)}`}</span></div>
                                <div className="border-t border-gray-100 my-2 pt-2 flex justify-between text-lg font-bold text-[#2D3436]"><span>Total</span><span>R$ {total.toFixed(2)}</span></div>
                                <div className="bg-[#FFF0F5] text-[#FF4B82] text-center py-2 rounded-lg font-bold text-xs">💎 Ganhe {totalPoints} pontos</div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                {['PIX', 'Cartão', 'Dinheiro'].map((method) => (
                                    <button key={method} type="button" onClick={() => setPaymentMethod(method)} className={`py-3 rounded-xl text-sm font-bold border ${paymentMethod === method ? 'bg-[#FF4B82] text-white border-[#FF4B82]' : 'bg-white text-gray-500 border-gray-200'}`}>{method}</button>
                                ))}
                            </div>

                            <button type="submit" disabled={!paymentMethod} className="w-full bg-gradient-to-r from-[#FF4B82] to-[#FF9E3D] text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-200 mt-6 disabled:opacity-50">Finalizar Pedido</button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
