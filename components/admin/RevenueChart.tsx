import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function RevenueChart({ data }: { data: any[] }) {
    return (
        <div className="bg-white p-4 rounded-2xl shadow-sm w-full">
            <h3 className="text-sm font-bold text-gray-700 mb-4">Faturamento (7 Dias)</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} stroke="#9CA3AF" />
                        <YAxis
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            stroke="#9CA3AF"
                            tickFormatter={value => `R$${value}`}
                        />
                        <Tooltip
                            contentStyle={{
                                borderRadius: '12px',
                                fontSize: '12px',
                                border: '1px solid #e5e7eb',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                            formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, 'Receita']}
                            cursor={{ fill: '#F3F4F6' }}
                        />
                        <Bar dataKey="receita" fill="#FF4B82" radius={[8, 8, 0, 0]} maxBarSize={60} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
