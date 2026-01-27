import React, { useState } from 'react';
import Image from 'next/image';
import { Geladinho, OrderPayload } from '../types/googleSheetTypes';

interface CartItem extends Geladinho {
    quantity: number;
}

interface CartModalProps {
    isOpen: boolean;
    onClose: () => void;
    cartItems: CartItem[];
    onUpdateQuantity: (id: string, delta: number) => void;
    total: number;
    onCheckout: (orderData: OrderPayload) => void;
    isProcessing: boolean;
    promotionActive: boolean;
}

export default function CartModal({
    isOpen,
    onClose,
    cartItems,
    onUpdateQuantity,
    total,
    onCheckout,
    isProcessing,
    promotionActive
}: CartModalProps) {
    const [formData, setFormData] = useState({
        nome: '',
        torre: '',
        apartamento: '',
        pagamento: '',
        entrega: ''
    });

    if (!isOpen) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const orderData: OrderPayload = {
            itens: cartItems.map(i => ({
                id: i.ID_Geladinho,
                nome: i.Nome_Geladinho,
                price:
                    typeof i.Preco_Venda === 'string'
                        ? parseFloat((i.Preco_Venda as string).replace(',', '.'))
                        : i.Preco_Venda,
                quantity: i.quantity
            })),
            total: total,
            nome: formData.nome,
            torre: formData.torre,
            apartamento: formData.apartamento,
            pagamento: formData.pagamento,
            entrega: formData.entrega,
            observacoes: `App Pedido.${promotionActive ? ' (Promo Ativa)' : ''}`
        };

        onCheckout(orderData);
    };

    const formatPrice = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="cart-header">
                    <span className="back-btn" onClick={onClose}>
                        ←
                    </span>
                    <h2>Carrinho</h2>
                </div>

                <div className="cart-body">
                    {cartItems.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '50px', color: '#888' }}>
                            <h3>🛒</h3>
                            <p>Seu carrinho está vazio</p>
                        </div>
                    ) : (
                        cartItems.map(item => (
                            <div key={item.ID_Geladinho} className="cart-item-card">
                                <div className="relative w-[60px] h-[60px] flex-shrink-0 overflow-hidden rounded-lg">
                                    <Image
                                        src={
                                            item.Imagem_URL || item.URL_IMAGEM_CACHE || 'https://via.placeholder.com/60'
                                        }
                                        alt={item.Nome_Geladinho}
                                        fill
                                        sizes="60px"
                                        className="object-cover"
                                        quality={75}
                                    />
                                </div>
                                <div className="cart-info">
                                    <h4 style={{ fontSize: '0.9rem', marginBottom: '5px' }}>{item.Nome_Geladinho}</h4>
                                    <div style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>
                                        {typeof item.Preco_Venda === 'number'
                                            ? formatPrice(item.Preco_Venda)
                                            : item.Preco_Venda}
                                    </div>
                                </div>
                                <div className="cart-controls">
                                    <button className="qty-btn" onClick={() => onUpdateQuantity(item.ID_Geladinho, -1)}>
                                        -
                                    </button>
                                    <span style={{ fontWeight: 'bold', width: '20px', textAlign: 'center' }}>
                                        {item.quantity}
                                    </span>
                                    <button className="qty-btn" onClick={() => onUpdateQuantity(item.ID_Geladinho, 1)}>
                                        +
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {cartItems.length > 0 && (
                    <div className="cart-footer">
                        {promotionActive && (
                            <div className="promotion-active">🎉 Promoção Ativa! Itens de 5,90 por 5,00</div>
                        )}
                        <div className="summary-row">
                            <span>Subtotal</span>
                            <span>{formatPrice(total)}</span>
                        </div>
                        <div className="summary-row">
                            <span>Entrega</span>
                            <span>A calcular</span>
                        </div>
                        <div className="summary-total">
                            <span>Total</span>
                            <span className="total-val">{formatPrice(total)}</span>
                        </div>

                        <form className="checkout-form" onSubmit={handleSubmit}>
                            <input
                                type="text"
                                id="nome"
                                placeholder="Nome Completo *"
                                required
                                value={formData.nome}
                                onChange={handleInputChange}
                            />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <input
                                    type="text"
                                    id="torre"
                                    placeholder="Torre *"
                                    required
                                    value={formData.torre}
                                    onChange={handleInputChange}
                                />
                                <input
                                    type="text"
                                    id="apartamento"
                                    placeholder="Apto *"
                                    required
                                    value={formData.apartamento}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <select id="pagamento" required value={formData.pagamento} onChange={handleInputChange}>
                                <option value="" disabled>
                                    Forma de Pagamento *
                                </option>
                                <option value="PIX">PIX</option>
                                <option value="Dinheiro">Dinheiro</option>
                                <option value="Cartão">Cartão</option>
                            </select>
                            <input
                                type="text"
                                id="entrega"
                                placeholder="Local de Entrega (Ex: Portaria)"
                                value={formData.entrega}
                                onChange={handleInputChange}
                            />

                            <button type="submit" className="checkout-btn-lg" disabled={isProcessing}>
                                {isProcessing ? 'Processando...' : 'Finalizar Pedido'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
