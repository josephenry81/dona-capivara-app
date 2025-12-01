import React from 'react';

interface TopFlavorsChartProps {
    data: { name: string; value: number }[];
}

export default function TopFlavorsChart({ data }: TopFlavorsChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4">🏆 Top Sabores</h3>
                <p className="text-gray-400 text-center py-10">Sem dados disponíveis</p>
            </div>
        );
    }

    const maxValue = Math.max(...data.map(item => item.value));
    const colors = ['#FF4B82', '#FF6B9D', '#FF8BB8'];

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">🏆 Top Sabores</h3>
            <div className="space-y-4">
                {data.slice(0, 3).map((item, index) => {
                    const percentage = (item.value / maxValue) * 100;
                    return (
                        <div key={index}>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-semibold text-gray-700">
                                    {index + 1}. {item.name}
                                </span>
                                <span className="text-sm font-bold" style={{ color: colors[index] }}>
                                    {item.value} vendas
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div
                                    className="h-3 rounded-full transition-all duration-500"
                                    style={{
                                        width: `${percentage}%`,
                                        backgroundColor: colors[index]
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
