import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { API } from '../../services/api';
import CartItemAdditions from '../cart/CartItemAdditions';
import { useModal } from '../ui/Modal';
import CouponModal from '../modals/CouponModal';

// Helper para formatação de moeda BRL (R$ X,XX com vírgula)
const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

interface Product {
    id: string;
    nome: string;
    price: number;
    imagem?: string;
    quantity: number;
    // Additions support
    cart_item_id?: string;
    selected_additions?: any[];
    additions_subtotal?: number;
    unit_price?: number;
    estoque: number;
}
interface CartViewProps {
    cart: Product[];
    user: any;
    addToCart: (product: any) => void;
    decreaseQuantity: (item: any) => void;
    removeFromCart: (productId: string) => void;
    onSubmitOrder: (orderData: any) => void;
}

export default function CartView({ cart, user, addToCart, decreaseQuantity, removeFromCart, onSubmitOrder }: CartViewProps) {
    const [referralCode, setReferralCode] = useState('');
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponFeedback, setCouponFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
    const [bonusPoints, setBonusPoints] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [deliveryType, setDeliveryType] = useState<'CONDO' | 'NEIGHBOR' | 'FAR'>('CONDO');
    const [usePoints, setUsePoints] = useState(false);
    const [isScheduled, setIsScheduled] = useState(false);
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');
    const [addressData, setAddressData] = useState({ nome: '', torre: '', apto: '', rua: '', numero: '', bairro: '', complemento: '', cep: '', observacoes: '' });
    const [cepLoading, setCepLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { confirm, alert, Modal: CustomModal } = useModal();

    // Debounce timer ref
    const cepTimerRef = useRef<NodeJS.Timeout | null>(null);

    // 🚚 FRETE AUTOMÁTICO
    const [deliveryFee, setDeliveryFee] = useState(0);
    const [isCalculatingFee, setIsCalculatingFee] = useState(false);

    useEffect(() => {
        const calculateFee = async () => {
            if (deliveryType === 'CONDO') {
                setDeliveryFee(0);
                return;
            }

            // Exige endereço mínimo para calcular
            const hasAddress = addressData.rua && addressData.numero && addressData.bairro && addressData.cep && addressData.cep.length === 8;

            if (!hasAddress) {
                // Feedback visual provisório enquanto digita
                setDeliveryFee(deliveryType === 'NEIGHBOR' ? 0 : 5);
                return;
            }

            setIsCalculatingFee(true);
            try {
                // Chama backend (Code.gs -> Geoapify)
                const res = await API.calculateDelivery({ deliveryType, addressData });

                if (res.success) {
                    setDeliveryFee(res.fee);
                } else {
                    // Fallback seguro em caso de erro
                    setDeliveryFee(deliveryType === 'NEIGHBOR' ? 0 : 5);
                }
            } catch (error) {
                console.error('Erro ao calcular frete:', error);
                setDeliveryFee(deliveryType === 'NEIGHBOR' ? 0 : 5);
            } finally {
                setIsCalculatingFee(false);
            }
        };

        // Debounce de 1.5s para evitar chamadas excessivas enquanto digita
        const timer = setTimeout(calculateFee, 1500);
        return () => clearTimeout(timer);
    }, [deliveryType, addressData.rua, addressData.numero, addressData.bairro, addressData.cep]);

    useEffect(() => {
        if (user && !user.isGuest) {
            const startName = user.name || '';
            const saved = user.savedAddress || {};
            setAddressData(prev => ({ ...prev, nome: startName, torre: saved.torre || '', apto: saved.apto || '', rua: saved.fullAddress?.split(',')[0] || '' }));
            if (saved.torre) setDeliveryType('CONDO');
        }
        const savedRef = localStorage.getItem('donaCapivaraRef');
        if (savedRef && !referralCode) {
            setReferralCode(savedRef);
            localStorage.removeItem('donaCapivaraRef');
        }
    }, [user]);

    // 🔒 VALIDAÇÃO DE CÓDIGO DE INDICAÇÃO VIA BACKEND
    const [referralLoading, setReferralLoading] = useState(false);
    const [referralFeedback, setReferralFeedback] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
    const referralTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Limpar timer anterior
        if (referralTimerRef.current) clearTimeout(referralTimerRef.current);

        // Resetar estados se código vazio
        if (referralCode.length < 4) {
            setBonusPoints(0);
            setReferralFeedback(null);
            return;
        }

        const normalizedCode = referralCode.toUpperCase().trim();
        const userCode = user?.inviteCode?.toUpperCase().trim();

        // Validação local rápida: auto-indicação
        if (userCode && normalizedCode === userCode) {
            setBonusPoints(0);
            setReferralFeedback({ type: 'error', message: 'Você não pode usar seu próprio código' });
            return;
        }

        // Validação local rápida: formato inválido
        if (!/^[A-Z0-9-]+$/.test(normalizedCode)) {
            setBonusPoints(0);
            setReferralFeedback({ type: 'error', message: 'Código inválido' });
            return;
        }

        // Visitante não pode usar indicação
        if (user?.isGuest) {
            setBonusPoints(0);
            setReferralFeedback({ type: 'warning', message: 'Faça login para usar indicação' });
            return;
        }

        // Debounce: chamar API após 500ms
        setReferralLoading(true);
        referralTimerRef.current = setTimeout(async () => {
            try {
                const customerId = user?.id || user?.ID_Cliente || 'GUEST';
                const result = await API.validateReferralCode(normalizedCode, customerId);

                if (result.valid) {
                    setBonusPoints(50);
                    setReferralFeedback({ type: 'success', message: result.message });
                } else {
                    setBonusPoints(0);
                    // Feedback específico para quem já usou indicação
                    if (result.alreadyUsed) {
                        setReferralFeedback({ type: 'warning', message: result.message });
                    } else {
                        setReferralFeedback({ type: 'error', message: result.message });
                    }
                }
            } catch (error) {
                console.error('Erro ao validar código:', error);
                setBonusPoints(0);
                setReferralFeedback({ type: 'error', message: 'Erro ao validar código' });
            } finally {
                setReferralLoading(false);
            }
        }, 500);
    }, [referralCode, user]);

    // OPTIMIZED: Debounced CEP lookup (500ms delay)
    const handleCepChange = (value: string) => {
        const cleanCep = value.replace(/\D/g, '').slice(0, 8);
        setAddressData(prev => ({ ...prev, cep: cleanCep }));

        // Clear previous timer
        if (cepTimerRef.current) clearTimeout(cepTimerRef.current);

        // Only search if 8 digits
        if (cleanCep.length === 8) {
            setCepLoading(true);
            cepTimerRef.current = setTimeout(async () => {
                try {
                    const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                    const data = await res.json();
                    if (!data.erro) {
                        setAddressData(prev => ({
                            ...prev,
                            rua: data.logradouro,
                            bairro: data.bairro
                        }));
                    }
                } catch (e) {
                    console.error('ViaCEP Error:', e);
                } finally {
                    setCepLoading(false);
                }
            }, 500); // 500ms debounce
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (cepTimerRef.current) clearTimeout(cepTimerRef.current);
        };
    }, []);

    // --- CALCULATIONS ---
    // ⚡ MEMOIZED: Expensive calculations only run when dependencies change
    // Updated to account for items with additions
    const subtotal = useMemo(() => {
        return cart.reduce((acc, item) => {
            const itemPrice = item.unit_price || item.price; // Use unit_price if has additions
            return acc + (itemPrice * item.quantity);
        }, 0);
    }, [cart]);


    const userPoints = user?.points || 0;
    const isGoldPlus = userPoints >= 500;

    const couponDiscount = useMemo(() => {
        if (!appliedCoupon) return 0;
        return appliedCoupon.type === 'PORCENTAGEM'
            ? subtotal * (appliedCoupon.value / 100)
            : appliedCoupon.value;
    }, [appliedCoupon, subtotal]);

    const { discountValue, pointsRedeemed } = useMemo(() => {
        if (!usePoints || !isGoldPlus) return { discountValue: 0, pointsRedeemed: 0 };

        const maxDiscount = (subtotal - couponDiscount) * 0.5;
        const ptsDiscount = Math.floor(Math.min(maxDiscount, userPoints / 20));

        if (ptsDiscount > 0) {
            return { discountValue: ptsDiscount, pointsRedeemed: ptsDiscount * 20 };
        }
        return { discountValue: 0, pointsRedeemed: 0 };
    }, [usePoints, isGoldPlus, subtotal, couponDiscount, userPoints]);

    const totalDiscount = useMemo(() => couponDiscount + discountValue, [couponDiscount, discountValue]);

    const total = useMemo(() => Math.max(0, subtotal + deliveryFee - totalDiscount), [subtotal, deliveryFee, totalDiscount]);

    const totalPointsEarned = useMemo(() => Math.floor(total) + bonusPoints, [total, bonusPoints]);

    // ⚡ MEMOIZED: Coupon validation with context
    const handleApplyCoupon = useCallback(async () => {
        if (!couponCode.trim()) {
            setCouponFeedback({ type: 'error', message: 'Digite um código de cupom' });
            setTimeout(() => setCouponFeedback(null), 3000);
            return;
        }

        setCouponLoading(true);
        setCouponFeedback(null);

        try {
            // 🔥 CORREÇÃO: Usar validateCouponWithContext para verificar histórico
            const customerId = user?.id || user?.ID_Cliente || 'GUEST';

            const res = await API.validateCouponWithContext({
                code: couponCode,
                customerId: customerId,
                subtotal: subtotal
            });

            if (res.success) {
                setAppliedCoupon(res);
                const discount = res.type === 'PORCENTAGEM' ? `${res.value}%` : formatCurrency(res.value);
                setCouponFeedback({
                    type: 'success',
                    message: `Cupom aplicado! Desconto de ${discount}`
                });
                // Clear success message after 5 seconds
                setTimeout(() => setCouponFeedback(null), 5000);
            } else {
                setAppliedCoupon(null);
                setCouponFeedback({
                    type: 'error',
                    message: res.message || 'Cupom inválido ou expirado'
                });
                // Clear error message after 4 seconds
                setTimeout(() => setCouponFeedback(null), 4000);
            }
        } catch (error) {
            setAppliedCoupon(null);
            setCouponFeedback({
                type: 'error',
                message: 'Erro ao validar cupom. Tente novamente.'
            });
            setTimeout(() => setCouponFeedback(null), 4000);
        } finally {
            setCouponLoading(false);
        }
    }, [couponCode, user, subtotal]);

    // Handler para aplicar cupom do modal
    const handleCouponApply = useCallback((coupon: { code: string; discount: number; type: string; value: number }) => {
        setAppliedCoupon(coupon);
        setCouponCode(coupon.code);
        setIsCouponModalOpen(false);
        setCouponFeedback({
            type: 'success',
            message: `Cupom aplicado! Desconto de ${coupon.type === 'PORCENTAGEM' ? `${coupon.value}%` : formatCurrency(coupon.discount)}`
        });
        setTimeout(() => setCouponFeedback(null), 5000);
    }, []);

    const handleInputChange = (e: any) => {
        const { name, value } = e.target;
        if (name === 'cep') {
            handleCepChange(value);
        } else {
            setAddressData({ ...addressData, [name]: value });
        }
    };

    const handleFinalize = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!paymentMethod) {
            alert(
                '⚠️ Forma de Pagamento',
                'Por favor, selecione uma forma de pagamento para continuar com seu pedido.',
                'warning'
            );
            return;
        }

        const confirmed = await confirm(
            '🛒 Confirmar Pedido?',
            `Você está prestes a finalizar um pedido no valor de ${formatCurrency(total)}. Deseja continuar?`
        );
        if (!confirmed) return;

        setIsSubmitting(true);

        try {
            let schedulingInfo = 'Imediata';
            if (isScheduled) {
                if (!scheduleDate || !scheduleTime) {
                    alert(
                        '📅 Agendamento Incompleto',
                        'Por favor, preencha a data e o horário desejados para a entrega.',
                        'warning'
                    );
                    setIsSubmitting(false);
                    return;
                }
                const d = scheduleDate.split('-');
                schedulingInfo = `${d[2]}/${d[1]} às ${scheduleTime}`;
            }

            let finalAddress = '';
            if (deliveryType === 'CONDO') {
                finalAddress = `Condomínio - Torre ${addressData.torre}, Apto ${addressData.apto}`;
            } else {
                finalAddress = `${addressData.rua}, ${addressData.numero} - ${addressData.bairro} (CEP: ${addressData.cep})`;
            }

            await onSubmitOrder({
                cart, total, referralCode, bonusPoints, paymentMethod, deliveryFee, scheduling: schedulingInfo,
                pointsRedeemed,
                discountValue: totalDiscount, // Valor total para o banco (compatibilidade)
                pointsDiscount: discountValue, // Detalhe para WhatsApp
                couponDiscount: couponDiscount, // Detalhe para WhatsApp
                couponCode: appliedCoupon ? couponCode : '',
                observacoes: addressData.observacoes || '',
                customer: { name: addressData.nome, fullAddress: finalAddress, details: addressData }
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Empty state
    if (cart.length === 0) {
        return (
            <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center p-6">
                <CustomModal />
                <div className="text-center">
                    <div className="text-6xl mb-4">🛒</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Carrinho Vazio</h2>
                    <p className="text-gray-500 mb-6">Adicione produtos deliciosos!</p>
                    <div className="w-48 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#FF4B82] to-[#FF9E3D] w-0 animate-pulse"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F6FA] pb-32">
            <CustomModal />
            <div className="bg-white p-6 shadow-sm sticky top-0 z-10">
                <h2 className="text-2xl font-bold text-[#2D3436]">Meu Carrinho</h2>
                <p className="text-sm text-gray-500 mt-1">{cart.length} {cart.length === 1 ? 'item' : 'itens'}</p>
            </div>

            <div className="p-6 space-y-6">
                {/* Cart Items with Animation */}
                <div className="space-y-3">
                    {cart.map((item, index) => (
                        <div
                            key={item.cart_item_id || item.id}
                            className="bg-white p-4 rounded-2xl shadow-sm flex gap-4 items-start transition-all hover:shadow-md"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                                <Image
                                    src={item.imagem || 'https://via.placeholder.com/150'}
                                    alt={item.nome}
                                    fill
                                    sizes="64px"
                                    className="object-cover"
                                    quality={75}
                                />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-800 text-sm">{item.nome}</h3>
                                <p className="text-[#FF4B82] font-bold">
                                    {formatCurrency(item.price)}
                                    {item.selected_additions && item.selected_additions.length > 0 && (
                                        <span className="text-xs text-gray-400 ml-1">(base)</span>
                                    )}
                                </p>
                                {/* Show additions if present */}
                                <CartItemAdditions additions={item.selected_additions || []} />
                                {/* Show total if has additions */}
                                {item.unit_price && item.unit_price !== item.price && (
                                    <p className="text-sm text-gray-600 mt-1 font-semibold">
                                        Unitário: {formatCurrency(item.unit_price)}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-2 py-1">
                                <button
                                    onClick={() => decreaseQuantity(item)}
                                    className="text-gray-400 font-bold w-8 h-8 flex items-center justify-center hover:bg-red-50 hover:text-red-500 rounded transition"
                                >
                                    -
                                </button>
                                <div className="flex flex-col items-center">
                                    <span className="text-sm font-bold min-w-[20px] text-center">{item.quantity}</span>
                                    {/* QI 145: Aviso de limite de estoque atingido */}
                                    {item.quantity >= (item.estoque || 0) && (
                                        <span className="text-[10px] text-orange-500 font-bold leading-none mt-0.5">Limite</span>
                                    )}
                                </div>
                                <button
                                    onClick={() => {
                                        if (item.quantity < (item.estoque || 999)) {
                                            addToCart(item);
                                        } else {
                                            alert?.('⚠️ Limite Atingido', `Ops! Temos apenas ${item.estoque} unidades deste produto em estoque.`, 'warning');
                                        }
                                    }}
                                    disabled={item.quantity >= (item.estoque || 999)}
                                    className={`font-bold w-8 h-8 flex items-center justify-center rounded transition ${item.quantity >= (item.estoque || 0)
                                        ? 'text-gray-300 cursor-not-allowed'
                                        : 'text-[#FF4B82] hover:bg-pink-50'
                                        }`}
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Loyalty Points */}
                {!user.isGuest && (
                    <div className={`p-4 rounded-2xl border transition-all ${usePoints ? 'bg-yellow-50 border-yellow-400' : 'bg-white border-gray-200'}`}>
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">👑</span>
                                <div>
                                    <p className="font-bold text-sm text-gray-800">Usar pontos</p>
                                    <p className="text-xs text-gray-500">Saldo: {userPoints} pts</p>
                                </div>
                            </div>
                            {isGoldPlus ? (
                                <button
                                    type="button"
                                    onClick={() => setUsePoints(!usePoints)}
                                    className={`w-12 h-6 rounded-full p-1 transition-colors ${usePoints ? 'bg-green-500' : 'bg-gray-300'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${usePoints ? 'translate-x-6' : ''}`} />
                                </button>
                            ) : (
                                <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">Mín. 500 pts</span>
                            )}
                        </div>
                        {usePoints && (
                            <div className="text-sm text-gray-600 mt-2 border-t border-yellow-200 pt-2 animate-in fade-in slide-in-from-top-1">
                                <p>Usando <span className="font-bold text-red-500">{pointsRedeemed} pts</span></p>
                                <p>Desconto: <span className="font-bold text-green-600">{formatCurrency(discountValue)}</span></p>
                            </div>
                        )}
                    </div>
                )}

                {/* Coupon Section - Botão para abrir modal */}
                <div className="bg-white p-4 rounded-2xl shadow-sm">
                    {appliedCoupon ? (
                        <>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">🎟️</span>
                                    <div>
                                        <p className="font-bold text-sm text-green-600">Cupom aplicado!</p>
                                        <p className="text-xs text-gray-500">
                                            {couponCode} • {appliedCoupon.type === 'PORCENTAGEM' ? `${appliedCoupon.value}%` : formatCurrency(appliedCoupon.value || appliedCoupon.discount)} OFF
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setAppliedCoupon(null);
                                        setCouponCode('');
                                        setCouponFeedback(null);
                                        API.clearCouponCache(couponCode);
                                    }}
                                    className="bg-red-100 text-red-500 px-3 py-2 rounded-lg text-xs font-bold hover:bg-red-200 transition"
                                >
                                    Remover
                                </button>
                            </div>
                        </>
                    ) : (
                        <button
                            onClick={() => setIsCouponModalOpen(true)}
                            className="w-full py-3 px-4 bg-gradient-to-r from-[#FF6B35] to-[#F7931E] text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <span className="text-lg">🎟️</span>
                            APLICAR CUPOM
                        </button>
                    )}

                    {/* Feedback quando cupom é aplicado via modal */}
                    {couponFeedback && (
                        <div
                            className={`mt-3 p-2 rounded-lg text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1 ${couponFeedback.type === 'success'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                                }`}
                        >
                            <span className="text-base">
                                {couponFeedback.type === 'success' ? '✓' : '⚠️'}
                            </span>
                            <span>{couponFeedback.message}</span>
                        </div>
                    )}
                </div>

                {/* Coupon Modal */}
                <CouponModal
                    isOpen={isCouponModalOpen}
                    onClose={() => setIsCouponModalOpen(false)}
                    onApplyCoupon={handleCouponApply}
                    cartTotal={subtotal}
                    customerId={user?.id || user?.ID_Cliente}
                />

                {/* Scheduling */}
                <div className="bg-white p-4 rounded-2xl shadow-sm">
                    <h3 className="font-bold text-gray-700 mb-3">⏰ Quando entregar?</h3>
                    <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
                        <button
                            type="button"
                            onClick={() => setIsScheduled(false)}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isScheduled ? 'bg-white text-[#FF4B82] shadow-sm' : 'text-gray-400'}`}
                        >
                            Agora ⚡
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsScheduled(true)}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isScheduled ? 'bg-white text-[#FF4B82] shadow-sm' : 'text-gray-400'}`}
                        >
                            Agendar 📅
                        </button>
                    </div>
                    {isScheduled && (
                        <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                            <input
                                type="date"
                                className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF4B82] transition"
                                value={scheduleDate}
                                onChange={(e) => setScheduleDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                            />
                            <input
                                type="time"
                                className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF4B82] transition"
                                value={scheduleTime}
                                onChange={(e) => setScheduleTime(e.target.value)}
                            />
                        </div>
                    )}
                </div>

                {/* Delivery Type */}
                <div className="bg-white p-4 rounded-2xl shadow-sm">
                    <h3 className="font-bold text-gray-700 mb-3">🚚 Entrega</h3>
                    <div className="grid gap-3">
                        {[
                            { id: 'CONDO', icon: '🏢', label: 'Condomínio', sub: 'Grátis' },
                            { id: 'NEIGHBOR', icon: '🏡', label: 'Vizinhança', sub: 'Até 3km' },
                            { id: 'FAR', icon: '🛵', label: 'Outros', sub: 'Sob consulta' }
                        ].map((zone) => (
                            <button
                                key={zone.id}
                                type="button"
                                onClick={() => setDeliveryType(zone.id as any)}
                                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all hover:shadow-md ${deliveryType === zone.id ? 'border-[#FF4B82] bg-[#FFF0F5] shadow-sm' : 'border-gray-200'}`}
                            >
                                <span className="text-2xl">{zone.icon}</span>
                                <div>
                                    <p className="font-bold text-sm text-gray-800">{zone.label}</p>
                                    <p className="text-xs text-gray-500">{zone.sub}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Address Form */}
                <form onSubmit={handleFinalize} className="space-y-4">
                    <div className="bg-white p-4 rounded-2xl shadow-sm space-y-4 w-full">
                        <h3 className="font-bold text-gray-700">📋 Dados de Entrega</h3>
                        <div>
                            <label className="text-xs font-bold text-gray-400 ml-1 uppercase block mb-2">Como gostaria de ser chamado?</label>
                            <input
                                required
                                name="nome"
                                value={addressData.nome}
                                onChange={handleInputChange}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF4B82] transition"
                                placeholder="Seu nome"
                            />
                        </div>

                        {deliveryType === 'CONDO' ? (
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    required
                                    name="torre"
                                    placeholder="Torre"
                                    value={addressData.torre}
                                    onChange={handleInputChange}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF4B82] transition"
                                />
                                <input
                                    required
                                    name="apto"
                                    placeholder="Apto"
                                    value={addressData.apto}
                                    onChange={handleInputChange}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF4B82] transition"
                                />
                            </div>
                        ) : (
                            <>
                                <div className="relative">
                                    <input
                                        name="cep"
                                        placeholder="CEP (ex: 12345678)"
                                        value={addressData.cep}
                                        onChange={handleInputChange}
                                        maxLength={8}
                                        pattern="[0-9]{8}"
                                        title="Digite apenas números (8 dígitos)"
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF4B82] transition"
                                    />
                                    {cepLoading && (
                                        <div className="absolute right-3 top-3">
                                            <div className="w-5 h-5 border-2 border-[#FF4B82] border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                    {!cepLoading && addressData.cep.length === 8 && addressData.rua && (
                                        <span className="absolute right-3 top-3 text-green-500 text-lg">✓</span>
                                    )}
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <input
                                        required
                                        name="rua"
                                        placeholder="Rua"
                                        value={addressData.rua}
                                        onChange={handleInputChange}
                                        className="col-span-2 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF4B82] transition"
                                    />
                                    <input
                                        required
                                        name="numero"
                                        placeholder="Nº"
                                        value={addressData.numero}
                                        onChange={handleInputChange}
                                        className="col-span-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF4B82] transition"
                                    />
                                </div>
                                <input
                                    required
                                    name="bairro"
                                    placeholder="Bairro"
                                    value={addressData.bairro}
                                    onChange={handleInputChange}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF4B82] transition"
                                />
                            </>
                        )}

                        {/* 
                        ════════════════════════════════════════════════════════════════════
                        CÓDIGO DE INDICAÇÃO - OCULTO TEMPORARIAMENTE
                        Motivo: Clientes confundem com campo de cupom
                        Para reativar: Descomente este bloco
                        ════════════════════════════════════════════════════════════════════
                        
                        <div className="mt-4 bg-[#FFF8E1] border border-[#FFE082] p-3 rounded-xl">
                            <label className="text-xs font-bold text-[#F57F17] mb-2 block">🎁 Código de Indicação (Opcional)</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Ex: DCAP-XXXX"
                                    value={referralCode}
                                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                                    maxLength={12}
                                    className="w-full bg-white border border-[#FFE082] rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-[#FFB300] transition pr-10"
                                />
                                {referralLoading && (
                                    <div className="absolute right-3 top-2.5">
                                        <div className="w-4 h-4 border-2 border-[#F57F17] border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                                {!referralLoading && bonusPoints > 0 && (
                                    <span className="absolute right-3 top-2 text-green-500 text-lg">✓</span>
                                )}
                            </div>

                            {referralFeedback && (
                                <div className={`text-xs font-bold mt-2 flex items-center gap-1 ${referralFeedback.type === 'success' ? 'text-green-600' :
                                    referralFeedback.type === 'warning' ? 'text-orange-500' :
                                        'text-red-500'
                                    }`}>
                                    <span className="text-base">
                                        {referralFeedback.type === 'success' ? '✨' :
                                            referralFeedback.type === 'warning' ? '⚠️' : '❌'}
                                    </span>
                                    {referralFeedback.message}
                                    {bonusPoints > 0 && ` (+${bonusPoints} pts)`}
                                </div>
                            )}
                        </div>
                        */}

                        {/* Observações do Pedido */}
                        <div className="mt-4">
                            <label className="text-xs font-bold text-gray-400 ml-1 uppercase block mb-2">📝 Observações (Opcional)</label>
                            <textarea
                                name="observacoes"
                                value={addressData.observacoes}
                                onChange={handleInputChange}
                                maxLength={500}
                                rows={3}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF4B82] transition resize-none"
                                placeholder="Ex: Deixar na portaria com fulano, retirar ingrediente X do pedido..."
                            />
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm space-y-2 text-sm">
                        <div className="flex justify-between text-gray-500">
                            <span>Subtotal</span>
                            <span>{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                            <span>Entrega</span>
                            <span className={deliveryFee === 0 ? 'text-[#28a745] font-bold' : 'text-red-500'}>
                                {deliveryFee === 0 ? 'Grátis ✓' : formatCurrency(deliveryFee)}
                            </span>
                        </div>
                        {couponDiscount > 0 && (
                            <div className="flex justify-between text-purple-600 font-bold">
                                <span>Cupom 🎟️</span>
                                <span>- {formatCurrency(couponDiscount)}</span>
                            </div>
                        )}
                        {discountValue > 0 && (
                            <div className="flex justify-between text-green-600 font-bold">
                                <span>Pontos 👑</span>
                                <span>- {formatCurrency(discountValue)}</span>
                            </div>
                        )}
                        <div className="border-t border-gray-100 my-2 pt-2 flex justify-between text-lg font-bold text-[#2D3436]">
                            <span>Total</span>
                            <span className="text-[#FF4B82]">{formatCurrency(total)}</span>
                        </div>
                        <div className="bg-[#FFF0F5] text-[#FF4B82] text-center py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1">
                            <span className="text-base">💎</span> Ganhe {totalPointsEarned} pontos neste pedido
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="grid grid-cols-3 gap-2">
                        {['PIX', 'Cartão', 'Dinheiro'].map((method) => (
                            <button
                                key={method}
                                type="button"
                                onClick={() => setPaymentMethod(method)}
                                className={`py-3 rounded-xl text-sm font-bold border transition-all ${paymentMethod === method
                                    ? 'bg-[#FF4B82] text-white border-[#FF4B82] shadow-lg scale-105'
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-[#FF4B82]'
                                    }`}
                            >
                                {method}
                            </button>
                        ))}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={!paymentMethod || isSubmitting}
                        className="w-full bg-gradient-to-r from-[#FF4B82] to-[#FF9E3D] text-white font-bold py-4 rounded-2xl mt-6 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Processando...
                            </span>
                        ) : (
                            '🎉 Finalizar Pedido'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}