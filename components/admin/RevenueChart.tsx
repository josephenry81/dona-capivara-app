import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function RevenueChart({ data }: { data: any[] }) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm h-64 w-full">
      <h3 className="text-sm font-bold text-gray-700 mb-4">Faturamento (7 Dias)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
            cursor={{ fill: '#F3F4F6' }}
          />
          <Bar dataKey="receita" fill="#FF4B82" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
