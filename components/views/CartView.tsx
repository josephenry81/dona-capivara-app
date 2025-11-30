import React, { useState, useEffect } from 'react';
import { API } from '../../services/api';

interface Product { id: string; nome: string; price: number; imagem?: string; quantity: number; }
interface CartViewProps {
    cart: Product[];
    user: any;
    addToCart: (product: any) => void;
    removeFromCart: (productId: string) => void;
    onSubmitOrder: (orderData: any) => void;
}

export default function CartView({ cart, user, addToCart, removeFromCart, onSubmitOrder }: CartViewProps) {
    const [referralCode, setReferralCode] = useState('');
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
    const [bonusPoints, setBonusPoints] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [deliveryType, setDeliveryType] = useState<'CONDO' | 'NEIGHBOR' | 'FAR'>('CONDO');
    const [usePoints, setUsePoints] = useState(false);
    const [isScheduled, setIsScheduled] = useState(false);
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');

    // Address State with CEP
    const [addressData, setAddressData] = useState({
        nome: '', torre: '', apto: '', rua: '', numero: '', bairro: '', complemento: '', cep: ''
    });

    useEffect(() => {
        // 1. Check for Referral Code in LocalStorage
        const savedRef = localStorage.getItem('donaCapivaraRef');
        if (savedRef && !referralCode) {
            setReferralCode(savedRef);
            // Clear it after applying to avoid re-applying on future visits
            localStorage.removeItem('donaCapivaraRef');
        }

        // 2. Auto-fill Address
        if (user && !user.isGuest) {
            const startName = user.name || '';
            const saved = user.savedAddress || {};
            setAddressData(prev => ({
                ...prev,
                nome: startName,
                torre: saved.torre || '',
                apto: saved.apto || ''
            }));
            if (saved.torre) setDeliveryType('CONDO');
        }
    }, [user]);

    useEffect(() => { if (referralCode.length > 3) setBonusPoints(50); else setBonusPoints(0); }, [referralCode]);

    // --- CEP AUTO-COMPLETE LOGIC ---
    const handleCepBlur = async () => {
        const cleanCep = addressData.cep.replace(/\D/g, '');
        if (cleanCep.length === 8) {
            try {
                const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                const data = await res.json();
                if (!data.erro) {
                    setAddressData(prev => ({
                        ...prev,
                        rua: data.logradouro || '',
                        bairro: data.bairro || ''
                    }));
                } else {
                    alert('CEP não encontrado.');
                }
            } catch (e) {
                console.error("CEP Error", e);
            }
        }
    };

    const userPoints = user?.points || 0;
    const isGoldPlus = userPoints >= 500;
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const deliveryFee = deliveryType === 'FAR' ? 5.00 : 0.00;

    let discountValue = 0;
    let pointsRedeemed = 0;
    let couponDiscount = 0;

    if (appliedCoupon) {
        couponDiscount = appliedCoupon.type === 'PORCENTAGEM' ? subtotal * (appliedCoupon.value / 100) : appliedCoupon.value;
    }

    if (usePoints && isGoldPlus) {
        const maxPointsDiscount = (subtotal - couponDiscount) * 0.5;
        const potentialPointsDiscount = userPoints / 20;
        const actualPointsDiscount = Math.min(maxPointsDiscount, potentialPointsDiscount);
        const ptsMoney = Math.floor(actualPointsDiscount);
        if (ptsMoney > 0) {
            discountValue += ptsMoney;
            pointsRedeemed = ptsMoney * 20;
        }
    }

    const totalDiscount = discountValue + couponDiscount;
    const total = Math.max(0, subtotal + deliveryFee - totalDiscount);
    const totalPointsEarned = Math.floor(total) + bonusPoints;

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        const res = await API.validateCoupon(couponCode);
        if (res.success) {
            setAppliedCoupon(res);
            alert(`Cupom aplicado: ${res.type === 'PORCENTAGEM' ? res.value + '%' : 'R$ ' + res.value}`);
        } else {
            setAppliedCoupon(null);
            alert(res.message || 'Cupom inválido');
        }
    };

    const handleInputChange = (e: any) => {
        let value = e.target.value;
        // Apply mask for CEP (only numbers)
        if (e.target.name === 'cep') {
            value = value.replace(/\D/g, '').slice(0, 8);
        }
        setAddressData({ ...addressData, [e.target.name]: value });
    };

    const handleFinalize = (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentMethod) return alert('Selecione uma forma de pagamento');

        let schedulingInfo = 'Imediata';
        if (isScheduled) {
            if (!scheduleDate || !scheduleTime) return alert('Preencha o agendamento.');
            const d = scheduleDate.split('-');
            schedulingInfo = `${d[2]}/${d[1]} às ${scheduleTime}`;
        }

        let finalAddress = '';
        if (deliveryType === 'CONDO') finalAddress = `Condomínio - Torre ${addressData.torre}, Apto ${addressData.apto}`;
        else finalAddress = `${addressData.rua}, ${addressData.numero} - ${addressData.bairro} (CEP: ${addressData.cep})`;

        onSubmitOrder({
            cart, total, referralCode, bonusPoints, paymentMethod, deliveryFee, scheduling: schedulingInfo,
            pointsRedeemed, discountValue: totalDiscount, couponCode: appliedCoupon ? couponCode : '',
            customer: { name: addressData.nome, fullAddress: finalAddress, details: addressData }
        });
    };

    return (
        <div className="min-h-screen bg-[#F5F6FA] pb-32">
            <div className="bg-white p-6 shadow-sm sticky top-0 z-10"><h2 className="text-2xl font-bold text-[#2D3436]">Meu Carrinho</h2></div>
            <div className="p-6 space-y-6">
                {cart.map((item) => (
                    <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm flex gap-4 items-center">
                        <img src={item.imagem} className="w-16 h-16 rounded-xl object-cover bg-gray-100" />
                        <div className="flex-1"><h3 className="font-bold text-gray-800 text-sm">{item.nome}</h3><p className="text-[#FF4B82] font-bold">R$ {item.price.toFixed(2)}</p></div>
                        <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-2 py-1"><button onClick={() => removeFromCart(item.id)} className="text-gray-400 font-bold">-</button><span className="text-sm font-bold">{item.quantity}</span><button onClick={() => addToCart(item)} className="text-[#FF4B82] font-bold">+</button></div>
                    </div>
                ))}

                {cart.length > 0 && (
                    <>
                        {!user.isGuest && (
                            <div className={`p-4 rounded-2xl border transition-all ${usePoints ? 'bg-yellow-50 border-yellow-400' : 'bg-white border-gray-200'}`}>
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2"><span className="text-xl">👑</span><div><p className="font-bold text-sm text-gray-800">Usar pontos</p><p className="text-xs text-gray-500">Saldo: {userPoints} pts</p></div></div>
                                    {isGoldPlus ? (
                                        <button type="button" onClick={() => setUsePoints(!usePoints)} className={`w-12 h-6 rounded-full p-1 transition-colors ${usePoints ? 'bg-green-500' : 'bg-gray-300'}`}><div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${usePoints ? 'translate-x-6' : ''}`} /></button>
                                    ) : (<span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">Mín. 500 pts</span>)}
                                </div>
                                {usePoints && <div className="text-sm text-gray-600 mt-2 border-t border-yellow-200 pt-2"><p>Usando <span className="font-bold text-red-500">{pointsRedeemed} pts</span></p><p>Desconto: <span className="font-bold text-green-600">R$ {discountValue.toFixed(2)}</span></p></div>}
                            </div>
                        )}

                        <div className="bg-white p-4 rounded-2xl shadow-sm">
                            <h3 className="font-bold text-gray-700 mb-2 text-sm">Possui Cupom?</h3>
                            <div className="flex gap-2">
                                <input type="text" placeholder="Digite seu cupom" className="flex-1 p-2 bg-gray-50 border rounded-lg text-sm uppercase" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} disabled={!!appliedCoupon} />
                                {appliedCoupon ? (
                                    <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="bg-red-100 text-red-500 px-4 rounded-lg text-xs font-bold">X</button>
                                ) : (
                                    <button onClick={handleApplyCoupon} className="bg-[#FF4B82] text-white px-4 rounded-lg text-xs font-bold">Aplicar</button>
                                )}
                            </div>
                            {appliedCoupon && <p className="text-green-500 text-xs mt-1 font-bold">Cupom aplicado!</p>}
                        </div>

                        <div className="bg-white p-4 rounded-2xl shadow-sm">
                            <h3 className="font-bold text-gray-700 mb-3">Quando entregar?</h3>
                            <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
                                <button type="button" onClick={() => setIsScheduled(false)} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isScheduled ? 'bg-white text-[#FF4B82] shadow-sm' : 'text-gray-400'}`}>Agora ⚡</button>
                                <button type="button" onClick={() => setIsScheduled(true)} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isScheduled ? 'bg-white text-[#FF4B82] shadow-sm' : 'text-gray-400'}`}>Agendar 📅</button>
                            </div>
                            {isScheduled && (
                                <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                                    <input type="date" className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF4B82]" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                                    <input type="time" className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF4B82]" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} />
                                </div>
                            )}
                        </div>

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
                                <label className="text-xs font-bold text-gray-400 ml-1 uppercase">Como gostaria de ser chamado?</label>
                                <input required name="nome" value={addressData.nome} onChange={handleInputChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF4B82]" />

                                {deliveryType === 'CONDO' ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        <input required name="torre" placeholder="Torre" value={addressData.torre} onChange={handleInputChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF4B82]" />
                                        <input required name="apto" placeholder="Apto" value={addressData.apto} onChange={handleInputChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF4B82]" />
                                    </div>
                                ) : (
                                    <>
                                        {/* --- CEP FIELD WITH AUTO-COMPLETE --- */}
                                        <div className="relative">
                                            <input
                                                name="cep"
                                                placeholder="CEP (ex: 12345678)"
                                                value={addressData.cep}
                                                onChange={handleInputChange}
                                                onBlur={handleCepBlur}
                                                maxLength={8}
                                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF4B82]"
                                            />
                                            {addressData.cep.length === 8 && <span className="absolute right-3 top-3 text-green-500 text-xs">✓</span>}
                                        </div>

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
                                {couponDiscount > 0 && <div className="flex justify-between text-purple-600 font-bold"><span>Cupom</span><span>- R$ {couponDiscount.toFixed(2)}</span></div>}
                                {discountValue > 0 && <div className="flex justify-between text-green-600 font-bold"><span>Pontos</span><span>- R$ {discountValue.toFixed(2)}</span></div>}
                                <div className="border-t border-gray-100 my-2 pt-2 flex justify-between text-lg font-bold text-[#2D3436]"><span>Total</span><span>R$ {total.toFixed(2)}</span></div>
                                <div className="bg-[#FFF0F5] text-[#FF4B82] text-center py-2 rounded-lg font-bold text-xs">💎 Ganhe {totalPointsEarned} pontos</div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                {['PIX', 'Cartão', 'Dinheiro'].map((method) => (
                                    <button key={method} type="button" onClick={() => setPaymentMethod(method)} className={`py-3 rounded-xl text-sm font-bold border ${paymentMethod === method ? 'bg-[#FF4B82] text-white border-[#FF4B82]' : 'bg-white text-gray-500 border-gray-200'}`}>{method}</button>
                                ))}
                            </div>

                            <button type="submit" disabled={!paymentMethod} className="w-full bg-gradient-to-r from-[#FF4B82] to-[#FF9E3D] text-white font-bold py-4 rounded-2xl mt-6 disabled:opacity-50">Finalizar Pedido</button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
