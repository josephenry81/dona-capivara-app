import React from 'react';

interface ReceiptProps {
    order: any;
    items: any[];
    id?: string;
}

export default function Receipt({ order, items, id }: ReceiptProps) {
    if (!order || items.length === 0) return null;

    const itemsTotal = items.reduce((acc, i) => acc + (Number(i.total) || 0), 0);
    const deliveryFee = Number(order.deliveryFee || 0);
    const discount = Number(order.discount || 0);
    const finalTotal = Number(order.total);

    const containerStyle: React.CSSProperties = {
        width: '400px',
        backgroundColor: 'white',
        color: '#1a1a1a',
        fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
        padding: '30px 20px',
        boxSizing: 'border-box'
    };

    const flexBetween: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline'
    };

    return (
        <div className="fixed top-0 left-0 z-[-10] opacity-0 pointer-events-none">
            <div id={id} style={containerStyle}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <div style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '-1px', marginBottom: '4px' }}>
                        DONA CAPIVARA
                    </div>
                    <div style={{ fontSize: '14px', color: '#666', textTransform: 'uppercase', letterSpacing: '2px' }}>
                        Culinaria Gourmet
                    </div>
                    <div style={{ borderBottom: '1px solid #eee', margin: '20px auto', width: '60px' }}></div>
                </div>

                {/* Order Details */}
                <div style={{ marginBottom: '25px' }}>
                    <div style={flexBetween}>
                        <span
                            style={{ fontSize: '12px', fontWeight: 'bold', color: '#999', textTransform: 'uppercase' }}
                        >
                            Pedido
                        </span>
                        <span style={{ fontSize: '20px', fontWeight: '900' }}>
                            #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                        {new Date(order.date).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(order.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>

                <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '12px', marginBottom: '30px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#999', textTransform: 'uppercase' }}>
                        Cliente
                    </span>
                    <div style={{ fontSize: '22px', fontWeight: '900', marginTop: '2px' }}>{order.customerName}</div>
                    {order.phone && <div style={{ fontSize: '13px', color: '#666' }}>{order.phone}</div>}
                </div>

                {/* Items */}
                <div style={{ marginBottom: '30px' }}>
                    <div
                        style={{
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: '#999',
                            textTransform: 'uppercase',
                            marginBottom: '15px',
                            borderBottom: '1px solid #eee',
                            paddingBottom: '8px'
                        }}
                    >
                        Itens do Pedido
                    </div>
                    {items.map((item, idx) => (
                        <div key={idx} style={{ marginBottom: '15px' }}>
                            <div style={flexBetween}>
                                <div style={{ fontSize: '15px', fontWeight: '800' }}>
                                    {item.qtd}x {item.nome}
                                </div>
                                <div style={{ fontSize: '15px', fontWeight: '800' }}>
                                    R$ {Number(item.total).toFixed(2)}
                                </div>
                            </div>

                            {/* Detailed Info for Mix or Customizations */}
                            {item.details && (
                                <div style={{ marginTop: '5px', paddingLeft: '28px' }}>
                                    {item.details.flavors && item.details.flavors.length > 0 && (
                                        <div style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
                                            • Sabores: {item.details.flavors.map((f: any) => f.name || f).join(', ')}
                                        </div>
                                    )}
                                    {item.details.selectedAdditions && item.details.selectedAdditions.length > 0 && (
                                        <div
                                            style={{
                                                fontSize: '12px',
                                                color: '#666',
                                                fontStyle: 'italic',
                                                marginTop: '2px'
                                            }}
                                        >
                                            • Adicionais:{' '}
                                            {item.details.selectedAdditions
                                                .map((a: any) => a.option_name || a.name)
                                                .join(', ')}
                                        </div>
                                    )}
                                    {item.details.notes && (
                                        <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                                            Obs: {item.details.notes}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Summary */}
                <div style={{ borderTop: '2px solid #eee', paddingTop: '20px' }}>
                    <div style={{ ...flexBetween, marginBottom: '8px', fontSize: '14px' }}>
                        <span>Subtotal</span>
                        <span>R$ {itemsTotal.toFixed(2)}</span>
                    </div>
                    {deliveryFee > 0 && (
                        <div style={{ ...flexBetween, marginBottom: '8px', fontSize: '14px' }}>
                            <span>Taxa de Entrega</span>
                            <span>R$ {deliveryFee.toFixed(2)}</span>
                        </div>
                    )}
                    {discount > 0 && (
                        <div style={{ ...flexBetween, marginBottom: '8px', fontSize: '14px', color: '#ef4444' }}>
                            <span>Descontos</span>
                            <span>- R$ {discount.toFixed(2)}</span>
                        </div>
                    )}

                    <div
                        style={{
                            ...flexBetween,
                            marginTop: '15px',
                            paddingTop: '15px',
                            borderTop: '2px solid #1a1a1a'
                        }}
                    >
                        <span style={{ fontSize: '20px', fontWeight: '900' }}>TOTAL</span>
                        <span style={{ fontSize: '32px', fontWeight: '900' }}>R$ {finalTotal.toFixed(2)}</span>
                    </div>
                </div>

                {/* Info Footer */}
                <div style={{ marginTop: '35px' }}>
                    <div style={{ marginBottom: '15px' }}>
                        <span
                            style={{ fontSize: '11px', fontWeight: 'bold', color: '#999', textTransform: 'uppercase' }}
                        >
                            Forma de Pagamento
                        </span>
                        <div style={{ fontSize: '15px', fontWeight: '700' }}>{order.payment}</div>
                    </div>

                    <div
                        style={{
                            background: '#f0fdf4',
                            border: '1px solid #dcfce7',
                            padding: '15px',
                            borderRadius: '12px',
                            marginBottom: '20px'
                        }}
                    >
                        <span
                            style={{
                                fontSize: '11px',
                                fontWeight: 'bold',
                                color: '#166534',
                                textTransform: 'uppercase'
                            }}
                        >
                            Endereço de Entrega
                        </span>
                        <div style={{ fontSize: '16px', fontWeight: '800', marginTop: '4px', color: '#166534' }}>
                            {order.address}
                        </div>
                    </div>

                    {order.scheduling && order.scheduling !== 'Imediata' && (
                        <div
                            style={{
                                background: '#eff6ff',
                                border: '1px solid #dbeafe',
                                padding: '15px',
                                borderRadius: '12px',
                                textAlign: 'center'
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    color: '#1e40af',
                                    textTransform: 'uppercase'
                                }}
                            >
                                Agendamento
                            </div>
                            <div style={{ fontSize: '18px', fontWeight: '900', color: '#1e40af', marginTop: '4px' }}>
                                {order.scheduling}
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ textAlign: 'center', marginTop: '40px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#333' }}>Obrigado pela preferência!</div>
                    <div style={{ fontSize: '11px', color: '#aaa', marginTop: '10px' }}>donacapivara.com.br</div>
                </div>
            </div>
        </div>
    );
}
