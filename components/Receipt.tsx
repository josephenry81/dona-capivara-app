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
        width: '380px',
        backgroundColor: 'white',
        color: 'black',
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: '12px',
        lineHeight: '1.2',
        padding: '10px',
        boxSizing: 'border-box',
        position: 'relative'
    };

    const borderStyle: React.CSSProperties = {
        borderBottom: '2px dashed black',
        margin: '8px 0'
    };

    const tableStyle: React.CSSProperties = {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '12px'
    };

    return (
        <div className="fixed top-0 left-0 z-[-10] opacity-0 pointer-events-none">
            <div id={id} style={containerStyle}>

                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>DONA CAPIVARA</h1>
                    <p style={{ fontSize: '10px', margin: 0 }}>Gourmet Geladinhos</p>
                </div>

                <div style={borderStyle}></div>

                <div style={{ marginBottom: '5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>PEDIDO:</span>
                        <span style={{ fontWeight: 'bold' }}>#{order.id.slice(0, 8)}</span>
                    </div>
                    <div>{new Date(order.date).toLocaleString('pt-BR')}</div>

                    <div style={{ marginTop: '8px' }}>
                        <span>CLIENTE:</span><br />
                        <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{order.customerName}</span>
                    </div>
                </div>

                <div style={borderStyle}></div>

                <table style={tableStyle}>
                    <tbody>
                        {items.map((item, idx) => (
                            <tr key={idx}>
                                <td style={{ width: '25px', verticalAlign: 'top', paddingBottom: '4px' }}>{item.qtd}x</td>
                                <td style={{ verticalAlign: 'top', paddingBottom: '4px' }}>
                                    {item.nome}
                                </td>
                                <td style={{ width: '60px', textAlign: 'right', verticalAlign: 'top', fontWeight: 'bold', paddingBottom: '4px' }}>
                                    {Number(item.total).toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div style={borderStyle}></div>

                <table style={tableStyle}>
                    <tbody>
                        <tr>
                            <td>Subtotal:</td>
                            <td style={{ textAlign: 'right' }}>{itemsTotal.toFixed(2)}</td>
                        </tr>
                        {deliveryFee > 0 && (
                            <tr>
                                <td>+ Entrega:</td>
                                <td style={{ textAlign: 'right' }}>{deliveryFee.toFixed(2)}</td>
                            </tr>
                        )}
                        {discount > 0 && (
                            <tr>
                                <td>- Descontos:</td>
                                <td style={{ textAlign: 'right' }}>{discount.toFixed(2)}</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <div style={{ ...borderStyle, borderBottom: '2px solid black' }}></div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '5px 0' }}>
                    <span style={{ fontSize: '16px', fontWeight: 'bold' }}>TOTAL</span>
                    <span style={{ fontSize: '22px', fontWeight: 'bold' }}>R$ {finalTotal.toFixed(2)}</span>
                </div>

                <div style={{ marginTop: '10px', fontSize: '11px' }}>
                    <p><strong>Forma Pgto:</strong> {order.payment}</p>
                    <p style={{ marginTop: '5px' }}><strong>Local de Entrega:</strong></p>
                    <p style={{ lineHeight: '1.4' }}>{order.address}</p>

                    {order.scheduling && order.scheduling !== 'Imediata' && (
                        <div style={{ marginTop: '10px', border: '2px solid black', padding: '5px', textAlign: 'center' }}>
                            <p style={{ margin: 0, fontWeight: 'bold' }}>AGENDAMENTO</p>
                            <p style={{ margin: 0, fontSize: '14px' }}>{order.scheduling}</p>
                        </div>
                    )}
                </div>

                <div style={{ textAlign: 'center', marginTop: '15px', fontSize: '10px' }}>
                    <p>Obrigado pela preferência!</p>
                    <p>www.donacapivara.app</p>
                </div>

            </div>
        </div>
    );
}
