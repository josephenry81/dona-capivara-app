'use client';
import React, { useState } from 'react';

interface CouponLinkGeneratorProps {
    siteUrl?: string;
}

export default function CouponLinkGenerator({ siteUrl }: CouponLinkGeneratorProps) {
    const [couponCode, setCouponCode] = useState('');
    const [generatedLink, setGeneratedLink] = useState('');
    const [copied, setCopied] = useState(false);

    // Use window.location.origin for dynamic base URL
    const getBaseUrl = () => {
        if (siteUrl) return siteUrl;
        if (typeof window !== 'undefined') return window.location.origin;
        return 'https://donacapivara.vercel.app';
    };

    const generateLink = () => {
        if (!couponCode.trim()) return;
        const normalized = couponCode.toUpperCase().trim();
        const baseUrl = getBaseUrl();
        setGeneratedLink(`${baseUrl}/?cupom=${encodeURIComponent(normalized)}`);
    };

    const copyToClipboard = async () => {
        if (!generatedLink) return;
        try {
            await navigator.clipboard.writeText(generatedLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = generatedLink;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const shareWhatsApp = () => {
        if (!generatedLink) return;
        const msg = `🎟️ Use este link para ganhar desconto:\n${generatedLink}`;
        const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    };

    const reset = () => {
        setCouponCode('');
        setGeneratedLink('');
        setCopied(false);
    };

    return (
        <div className="bg-white p-4 rounded-2xl shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-xl">🔗</span>
                Gerar Link de Cupom
            </h3>

            <div className="space-y-3">
                {/* Input para código do cupom */}
                <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">
                        Código do Cupom
                    </label>
                    <input
                        type="text"
                        placeholder="Ex: BEMVINDO"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono uppercase outline-none focus:border-[#FF4B82] transition"
                    />
                </div>

                {/* Botão gerar */}
                <button
                    onClick={generateLink}
                    disabled={!couponCode.trim()}
                    className="w-full bg-gradient-to-r from-[#FF4B82] to-[#FF9E3D] text-white font-bold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition"
                >
                    Gerar Link 🚀
                </button>

                {/* Link gerado */}
                {generatedLink && (
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 animate-in fade-in slide-in-from-top-2">
                        <label className="text-xs font-bold text-gray-500 mb-2 block">
                            Link Gerado (clique para copiar)
                        </label>
                        <div
                            onClick={copyToClipboard}
                            className="bg-white p-2 rounded-lg border border-dashed border-gray-300 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition group"
                        >
                            <p className="text-xs text-blue-600 font-mono break-all group-hover:text-blue-800">
                                {generatedLink}
                            </p>
                        </div>

                        {/* Feedback de cópia */}
                        {copied && (
                            <p className="text-xs text-green-600 font-bold mt-2 flex items-center gap-1 animate-in fade-in">
                                ✓ Link copiado para a área de transferência!
                            </p>
                        )}

                        {/* Ações */}
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={copyToClipboard}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${copied
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                    }`}
                            >
                                {copied ? '✓ Copiado!' : '📋 Copiar'}
                            </button>
                            <button
                                onClick={shareWhatsApp}
                                className="flex-1 bg-green-100 text-green-700 py-2 rounded-lg text-xs font-bold hover:bg-green-200 transition"
                            >
                                📱 WhatsApp
                            </button>
                            <button
                                onClick={reset}
                                className="bg-gray-100 text-gray-600 px-3 py-2 rounded-lg text-xs font-bold hover:bg-gray-200 transition"
                            >
                                ↺
                            </button>
                        </div>
                    </div>
                )}

                {/* Instruções */}
                <div className="bg-blue-50 p-3 rounded-xl text-xs text-blue-700">
                    <p className="font-bold mb-1">💡 Como usar:</p>
                    <ol className="list-decimal list-inside space-y-1">
                        <li>Digite o código do cupom exatamente como cadastrado</li>
                        <li>Clique em "Gerar Link"</li>
                        <li>Compartilhe o link com seus clientes via WhatsApp ou redes sociais</li>
                        <li>Quando acessarem, o cupom será aplicado automaticamente no carrinho!</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
