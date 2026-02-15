import React from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: string;
    color: string;
}

export default function StatCard({ title, value, icon, color }: StatCardProps) {
    return (
        <div
            className="bg-white p-4 rounded-2xl shadow-sm border-l-4 flex items-center gap-4"
            style={{ borderLeftColor: color }}
        >
            <div className="p-3 rounded-full text-2xl" style={{ backgroundColor: `${color}20`, color: color }}>
                {icon}
            </div>
            <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">{title}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
        </div>
    );
}
