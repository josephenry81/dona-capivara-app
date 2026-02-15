import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Label } from 'recharts';

interface GoalTrackerProps {
    title: string;
    current: number;
    target: number;
    unit?: string;
    color?: string;
}

export default function GoalTracker({ title, current, target, unit = 'R$', color = '#FF4B82' }: GoalTrackerProps) {
    const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
    const data = [
        { name: 'Progress', value: percent },
        { name: 'Remaining', value: 100 - percent }
    ];

    return (
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-50 flex flex-col items-center">
            <h3 className="text-gray-500 text-sm font-bold mb-2 uppercase tracking-wider">{title}</h3>

            <div className="w-full h-40 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={50}
                            outerRadius={70}
                            startAngle={90}
                            endAngle={450}
                            paddingAngle={0}
                            dataKey="value"
                        >
                            <Cell key="cell-0" fill={color} strokeWidth={0} />
                            <Cell key="cell-1" fill="#F3F4F6" strokeWidth={0} />
                            <Label
                                value={`${percent}%`}
                                position="center"
                                className="font-bold text-2xl fill-gray-800"
                            />
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-2 text-center">
                <p className="text-gray-400 text-xs">
                    Atual:{' '}
                    <span className="text-gray-800 font-bold">
                        {unit} {current.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                </p>
                <p className="text-gray-400 text-xs">
                    Meta:{' '}
                    <span className="text-gray-600 font-medium">
                        {unit} {target.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                </p>
            </div>
        </div>
    );
}
