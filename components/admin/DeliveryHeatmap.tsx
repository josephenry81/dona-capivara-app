import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DeliveryHeatmapProps {
    data: { name: string; value: number }[];
}

export default function DeliveryHeatmap({ data }: DeliveryHeatmapProps) {
    return (
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-50">
            <h3 className="text-gray-500 text-sm font-bold mb-4 uppercase tracking-wider">🔥 Densidade de Pedidos</h3>

            <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={data} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#9CA3AF' }} width={100} />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{
                                borderRadius: '15px',
                                border: 'none',
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                            }}
                        />
                        <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={20}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? '#FF4B82' : '#FF93B5'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
