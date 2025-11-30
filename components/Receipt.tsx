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
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontWeight: '600',
        fontSize: '14px',
        lineHeight: '1.25',
        padding: '15px 10px',
        boxSizing: 'border-box',
        position: 'relative'
    };

    const borderStyle: React.CSSProperties = {
        borderBottom: '2px dashed black',
        margin: '12px 0'
    };

    const tableStyle: React.CSSProperties = {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '14px'
    };

    const cellStyle: React.CSSProperties = {
        paddingBottom: '8px',
        verticalAlign: 'top'
    };

    return (
        <div className="fixed top-0 left-0 z-[-10] opacity-0 pointer-events-none">
            <div id={id} style={containerStyle}>

                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <h1 style={{ fontSize: '26px', fontWeight: '900', margin: 0, textTransform: 'uppercase' }}>DONA CAPIVARA</h1>
                    <p style={{ fontSize: '12px', margin: 0 }}>Culinaria Gourmet</p>
                </div>

                <div style={borderStyle}></div>

                <div style={{ marginBottom: '5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span>PEDIDO:</span>
                        <span style={{ fontSize: '18px', fontWeight: '800' }}>#{order.id.slice(0, 8)}</span>
                    </div>
                    <div style={{ fontSize: '12px' }}>{new Date(order.date).toLocaleString('pt-BR')}</div>

                    <div style={{ marginTop: '10px' }}>
                        <span style={{ fontSize: '12px', color: '#333' }}>CLIENTE:</span><br />
                        <span style={{ fontSize: '20px', fontWeight: '800', textTransform: 'uppercase', lineHeight: '1.1' }}>{order.customerName}</span>
                    </div>
                </div>

                <div style={borderStyle}></div>

                <table style={tableStyle}>
                    <tbody>
                        {items.map((item, idx) => (
                            <tr key={idx}>
                                <td style={{ ...cellStyle, width: '35px' }}>{item.qtd}x</td>
                                <td style={cellStyle}>
                                    {item.nome}
                                </td>
                                <td style={{ ...cellStyle, width: '80px', textAlign: 'right', fontSize: '15px' }}>
                                    {Number(item.total).toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div style={borderStyle}></div>

                <table style={{ ...tableStyle, fontSize: '14px' }}>
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

                <div style={{ ...borderStyle, borderBottom: '4px solid black' }}></div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '15px 0' }}>
                    <span style={{ fontSize: '20px', fontWeight: '800' }}>TOTAL</span>
                    <span style={{ fontSize: '32px', fontWeight: '900' }}>R$ {finalTotal.toFixed(2)}</span>
                </div>

                <div style={{ marginTop: '10px', fontSize: '14px' }}>
                    <p style={{ marginBottom: '8px' }}><strong>Forma Pgto:</strong> {order.payment}</p>

                    <div style={{ border: '2px solid #000', padding: '10px', borderRadius: '4px' }}>
                        <strong>ENTREGA:</strong>
                        <p style={{ fontSize: '16px', lineHeight: '1.3', marginTop: '4px', fontWeight: 'bold' }}>{order.address}</p>
                    </div>

                    {order.scheduling && order.scheduling !== 'Imediata' && (
                        <div style={{ marginTop: '10px', background: '#000', color: '#fff', padding: '8px', textAlign: 'center' }}>
                            <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>AGENDAMENTO</p>
                            <p style={{ margin: 0, fontSize: '18px' }}>{order.scheduling}</p>
                        </div>
                    )}
                </div>

                <div style={{ textAlign: 'center', marginTop: '25px', fontSize: '12px' }}>
                    <p>Obrigado pela preferência!</p>
                    <p>www.donacapivara.app</p>
                </div>

            </div>
        </div>
    );
}
