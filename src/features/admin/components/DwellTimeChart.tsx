import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { DwellTimeInsights } from '@/services/locationAnalyticsService';

interface DwellTimeChartProps {
    data: DwellTimeInsights[];
}

const DwellTimeChart: React.FC<DwellTimeChartProps> = ({ data }) => {
    const sortedData = [...data].sort((a, b) => b.avgDwell - a.avgDwell).slice(0, 10);

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart
                data={sortedData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
                <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={true}
                    vertical={true}
                    stroke="rgba(148, 163, 184, 0.15)"
                />
                <XAxis
                    type="number"
                    unit="min"
                    stroke="#94a3b8"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                />
                <YAxis
                    dataKey="zoneName"
                    type="category"
                    width={100}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    stroke="#94a3b8"
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid rgba(96, 165, 250, 0.3)',
                        borderRadius: '12px',
                        color: '#f8fafc',
                    }}
                    cursor={{ fill: 'rgba(96, 165, 250, 0.1)' }}
                />
                <Legend wrapperStyle={{ color: '#94a3b8' }} />
                <Bar dataKey="avgDwell" name="Avg Time (min)" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
        </ResponsiveContainer>
    );
};

export default DwellTimeChart;
