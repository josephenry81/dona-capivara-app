'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { generatePixPayload, formatPixKey } from '../../utils/pix';

interface PixPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    amount: number;
    orderId: string;
}

// PIX Configuration from environment
const PIX_KEY = process.env.NEXT_PUBLIC_PIX_KEY || '';
const PIX_NAME = process.env.NEXT_PUBLIC_PIX_NAME || 'DONA CAPIVARA';
const PIX_CITY = process.env.NEXT_PUBLIC_PIX_CITY || 'CURITIBA';

export default function PixPaymentModal({ isOpen, onClose, amount, orderId }: PixPaymentModalProps) {
    const [copied, setCopied] = useState(false);
    const [pixCode, setPixCode] = useState('');

    useEffect(() => {
        if (isOpen && amount > 0) {
            const code = generatePixPayload({
                pixKey: PIX_KEY,
                merchantName: PIX_NAME,
                merchantCity: PIX_CITY,
                amount: amount,
                txid: `DCAP${orderId}`,
                description: `Pedido ${orderId}`
            });
            setPixCode(code);
        }
    }, [isOpen, amount, orderId]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(pixCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        } catch (_err) {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = pixCode;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        }
    };

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#00D4AA] to-[#00B894] p-6 rounded-t-3xl text-white text-center">
                    <div className="text-5xl mb-2">💳</div>
                    <h2 className="text-2xl font-bold">Pagamento PIX</h2>
                    <p className="text-white/80 text-sm mt-1">Escaneie ou copie o código</p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Amount */}
                    <div className="text-center bg-gray-50 p-4 rounded-2xl">
                        <p className="text-sm text-gray-500 mb-1">Valor do pedido</p>
                        <p className="text-3xl font-bold text-[#2D3436]">{formatCurrency(amount)}</p>
                        <p className="text-xs text-gray-400 mt-1">Pedido #{orderId}</p>
                    </div>

                    {/* QR Code */}
                    <div className="flex justify-center">
                        <div className="bg-white p-4 rounded-2xl shadow-lg border-2 border-gray-100">
                            {pixCode ? (
                                <QRCodeSVG
                                    value={pixCode}
                                    size={200}
                                    level="M"
                                    includeMargin={true}
                                    bgColor="#FFFFFF"
                                    fgColor="#000000"
                                />
                            ) : (
                                <div className="w-[200px] h-[200px] flex items-center justify-center">
                                    <div className="w-8 h-8 border-4 border-[#00D4AA] border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="bg-[#E8F8F5] border border-[#00D4AA]/30 p-4 rounded-xl">
                        <h4 className="font-bold text-[#00866D] text-sm mb-2">📱 Como pagar:</h4>
                        <ol className="text-sm text-gray-600 space-y-1">
                            <li>1. Abra o app do seu banco</li>
                            <li>2. Escolha pagar com PIX</li>
                            <li>3. Escaneie o QR Code ou use o código abaixo</li>
                            <li>4. Confirme o pagamento</li>
                        </ol>
                    </div>

                    {/* Copy Code Button */}
                    <div className="space-y-2">
                        <p className="text-xs text-gray-400 text-center">Ou copie o código PIX:</p>
                        <button
                            onClick={handleCopy}
                            className={`w-full py-4 px-4 rounded-xl font-bold text-sm transition-all transform active:scale-[0.98] ${copied ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {copied ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span>✓</span> Código copiado!
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <span>📋</span> Copiar Código PIX
                                </span>
                            )}
                        </button>

                        {/* Show truncated code */}
                        {pixCode && (
                            <p className="text-xs text-gray-400 text-center font-mono break-all px-4">
                                {pixCode.substring(0, 50)}...
                            </p>
                        )}
                    </div>

                    {/* Recipient Info */}
                    <div className="bg-gray-50 p-3 rounded-xl text-center">
                        <p className="text-xs text-gray-400">Recebedor</p>
                        <p className="text-sm font-bold text-gray-700">{PIX_NAME}</p>
                        <p className="text-xs text-gray-400 mt-1">Chave: {formatPixKey(PIX_KEY)}</p>
                    </div>

                    {/* Warning */}
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
                        <p className="text-xs text-amber-700 text-center">
                            ⚠️ <strong>Importante:</strong> O valor está travado. Após o pagamento, enviaremos a
                            confirmação por WhatsApp.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 pt-0 space-y-3">
                    <button
                        onClick={onClose}
                        className="w-full bg-gradient-to-r from-[#00D4AA] to-[#00B894] text-white font-bold py-4 rounded-xl hover:shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        ✅ Já Paguei
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full text-gray-400 text-sm py-2 hover:text-gray-600 transition"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}
