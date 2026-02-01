import React, { useState } from 'react';
import Image from 'next/image';
import { API } from '../../services/api';
import Toast from '../ui/Toast';

interface AuthViewProps {
    onLogin: (user: any) => void;
    onGuest: () => void;
}

export default function AuthView({ onLogin, onGuest }: AuthViewProps) {
    const [isSignup, setIsSignup] = useState(false);
    const [formData, setFormData] = useState({ name: '', phone: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'error' as any });

    // Máscara de telefone: (XX) XXXXX-XXXX
    // Permite texto livre se começar com letra (para login admin)
    const formatPhone = (value: string) => {
        // Se começa com letra, permite texto livre (admin login)
        if (/^[a-zA-Z]/.test(value)) {
            return value;
        }
        const digits = value.replace(/\D/g, '').slice(0, 11);
        if (digits.length <= 2) return digits.length ? `(${digits}` : '';
        if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    };

    const showToast = (msg: string, type: 'error' | 'success' = 'error') => {
        setToast({ visible: true, message: msg, type });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            let result;

            if (isSignup) {
                result = await API.registerCustomer({
                    name: formData.name,
                    phone: formData.phone,
                    password: formData.password
                });
            } else {
                result = await API.login(formData.phone, formData.password);
            }

            console.log('🔐 Login Result:', result); // Debug log

            if (result && result.success) {
                const raw = result.customer;

                // ✅ ADMIN INTERCEPTOR - Handle admin login differently
                if (raw.isAdmin) {
                    const adminUser = {
                        id: raw.id || 'ADMIN',
                        name: raw.name || 'Administrador',
                        phone: formData.phone,
                        isAdmin: true,
                        adminKey: raw.adminKey, // ⚠️ CRITICAL: Save adminKey for API calls
                        isGuest: false,
                        points: 0,
                        inviteCode: '---',
                        favorites: [],
                        savedAddress: {}
                    };
                    console.log('👑 Admin Login Successful:', adminUser);
                    localStorage.setItem('donaCapivaraUser', JSON.stringify(adminUser));
                    onLogin(adminUser);
                    return;
                }

                // Regular Customer Normalization
                const normalizedUser = {
                    id: raw.id || raw.ID_Cliente,
                    name: raw.name || raw.Nome || formData.name || 'Cliente',
                    phone: raw.phone || raw.Telefone || formData.phone,
                    points: Number(raw.points || raw.Pontos_Fidelidade || 0),
                    inviteCode: raw.inviteCode || raw.Codigo_Convite || '---',
                    favorites: raw.favorites || [],
                    savedAddress: raw.savedAddress || {},
                    isGuest: false,
                    isAdmin: false
                };

                console.log('✅ Member Login Successful:', normalizedUser);
                localStorage.setItem('donaCapivaraUser', JSON.stringify(normalizedUser));
                onLogin(normalizedUser);
            } else {
                // Show the EXACT error from backend
                console.error('❌ Login Failed:', result);
                showToast(result?.message || 'Erro desconhecido no servidor.');
            }
        } catch (err: any) {
            console.error('🔥 Auth Error:', err);
            showToast('Erro de conexão. Verifique sua internet ou contate o suporte.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gradient-to-b from-[#FF4B82] to-[#FF9E3D] flex flex-col items-center justify-center p-6 overflow-auto">
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.visible}
                onClose={() => setToast({ ...toast, visible: false })}
            />

            {/* Logo Section */}
            <div className="flex-1 flex flex-col items-center justify-center w-full z-10">
                <div className="w-48 h-48 bg-white/20 backdrop-blur-sm rounded-full p-4 shadow-2xl mb-6">
                    <Image
                        src="/loading-logo.jpg"
                        alt="Dona Capivara Logo"
                        width={192}
                        height={192}
                        className="w-full h-full object-cover rounded-full border-4 border-white shadow-inner"
                    />
                </div>
                <h1 className="text-white text-4xl font-extrabold drop-shadow-lg tracking-wide">Dona Capivara</h1>

                {/* Social Proof */}
                <div className="flex items-center gap-2 mt-3 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                    <span className="text-white/90 text-sm font-medium">⭐ +500 pedidos este mês</span>
                </div>
            </div>

            {/* CTA Primário - Ver Cardápio (hierarquia invertida) */}
            <div className="w-full max-w-sm z-10 mb-4">
                <button
                    onClick={onGuest}
                    className="w-full bg-white text-[#FF4B82] font-bold py-5 rounded-2xl shadow-2xl text-lg flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    <span className="text-2xl">🍦</span>
                    Ver Sabores
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                </button>

                <p className="text-white/80 text-center text-sm mt-3">Explore nosso cardápio sem precisar de conta</p>
            </div>

            {/* Auth Card - Secundário */}
            <div className="w-full max-w-sm bg-white/95 backdrop-blur-md rounded-[2rem] shadow-2xl p-6 z-10 mb-4">
                {/* Benefício do Cadastro */}
                <div className="flex items-center justify-center gap-2 mb-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl py-2.5 px-4">
                    <span className="text-lg">🎁</span>
                    <span className="text-sm font-semibold text-amber-700">Cadastre-se e acumule pontos!</span>
                </div>

                <div className="flex mb-5 bg-gray-100 p-1 rounded-xl">
                    <button
                        type="button"
                        onClick={() => setIsSignup(false)}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isSignup ? 'bg-white text-[#FF4B82] shadow-sm' : 'text-gray-400'}`}
                    >
                        Entrar
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsSignup(true)}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isSignup ? 'bg-white text-[#FF4B82] shadow-sm' : 'text-gray-400'}`}
                    >
                        Cadastrar
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                    {isSignup && (
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-400 ml-1">NOME</label>
                            <input
                                type="text"
                                placeholder="Seu Nome"
                                required={isSignup}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF4B82]"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                    )}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 ml-1">TELEFONE</label>
                        <input
                            type="tel"
                            placeholder="(41) 99999-9999"
                            required
                            maxLength={16}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF4B82]"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 ml-1">SENHA</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="******"
                                required
                                className="w-full p-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF4B82]"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                                aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}
                            >
                                {showPassword ? (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                ) : (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-[#FF4B82] to-[#FF9E3D] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-200 mt-3 disabled:opacity-70"
                    >
                        {isLoading ? 'Processando...' : isSignup ? 'Criar Conta' : 'Acessar Conta'}
                    </button>

                    {/* Link Esqueci Senha - apenas no modo login */}
                    {!isSignup && (
                        <button
                            type="button"
                            onClick={() =>
                                showToast('Entre em contato pelo WhatsApp para redefinir sua senha.', 'success')
                            }
                            className="w-full text-center text-gray-400 text-xs font-medium mt-3 hover:text-[#FF4B82] transition-colors"
                        >
                            Esqueci minha senha
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
}
