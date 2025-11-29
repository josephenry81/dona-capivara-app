import React, { useState } from 'react';
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
    const [toast, setToast] = useState({ visible: false, message: '', type: 'error' as any });

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
            console.error("🔥 Auth Error:", err);
            showToast('Erro de conexão. Verifique sua internet ou contate o suporte.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#FF4B82] to-[#FF9E3D] flex flex-col items-center justify-center p-6 relative overflow-hidden">

            <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />

            {/* Logo Section */}
            <div className="flex-1 flex flex-col items-center justify-center w-full z-10">
                <div className="w-48 h-48 bg-white/20 backdrop-blur-sm rounded-full p-4 shadow-2xl mb-6 animate-[bounce_3s_infinite]">
                    <img
                        src="/loading-logo.jpg"
                        alt="Dona Capivara Logo"
                        className="w-full h-full object-cover rounded-full border-4 border-white shadow-inner"
                    />
                </div>
                <h1 className="text-white text-4xl font-extrabold drop-shadow-lg tracking-wide">Dona Capivara</h1>
            </div>

            {/* Auth Card */}
            <div className="w-full max-w-sm bg-white rounded-[2rem] shadow-2xl p-8 z-10 mb-4">
                <div className="flex mb-6 bg-gray-100 p-1 rounded-xl">
                    <button type="button" onClick={() => setIsSignup(false)} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${!isSignup ? 'bg-white text-[#FF4B82] shadow-sm' : 'text-gray-400'}`}>Entrar</button>
                    <button type="button" onClick={() => setIsSignup(true)} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${isSignup ? 'bg-white text-[#FF4B82] shadow-sm' : 'text-gray-400'}`}>Cadastrar</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isSignup && (
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-400 ml-1">NOME</label>
                            <input type="text" placeholder="Seu Nome" required={isSignup} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF4B82]" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                    )}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 ml-1">TELEFONE</label>
                        <input type="tel" placeholder="(XX) 99999-9999" required className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF4B82]" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 ml-1">SENHA</label>
                        <input type="password" placeholder="******" required className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF4B82]" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                    </div>

                    <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-[#FF4B82] to-[#FF9E3D] text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-200 mt-4 disabled:opacity-70">
                        {isLoading ? 'Processando...' : (isSignup ? 'Criar Conta' : 'Acessar Conta')}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button onClick={onGuest} className="text-gray-400 text-xs font-bold hover:text-[#FF4B82]">QUERO APENAS OLHAR O CARDÁPIO</button>
                </div>
            </div>
        </div>
    );
}
