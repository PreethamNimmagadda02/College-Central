import React, { useEffect, useState } from 'react';
import { getZonePopularTimes } from '@/services/locationAnalyticsService';

interface PopularTimesChartProps {
    locationId: string;
}

const PopularTimesChart: React.FC<PopularTimesChartProps> = ({ locationId }) => {
    const [data, setData] = useState<{ hour: number; level: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const fetchData = async () => {
            setLoading(true);
            const times = await getZonePopularTimes(locationId);
            if (mounted) {
                setData(times);
                setLoading(false);
            }
        };
        fetchData();
        return () => { mounted = false; };
    }, [locationId]);

    if (loading) {
        return <div className="h-24 flex items-center justify-center text-xs text-slate-400">Loading popular times...</div>;
    }

    const currentHour = new Date().getHours();

    return (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Popular Times</h4>

            {/* Chart Container */}
            <div className="flex items-end justify-between h-24 gap-0.5">
                {data.map((point) => (
                    <div key={point.hour} className="flex-1 flex flex-col items-center group relative">
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-1 bg-black text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10">
                            {point.hour === 0 ? '12 AM' : point.hour === 12 ? '12 PM' : point.hour > 12 ? `${point.hour - 12} PM` : `${point.hour} AM`}: {point.level}% busy
                        </div>

                        {/* Bar */}
                        <div
                            className={`w-full rounded-t-sm transition-all duration-500 ${point.hour === currentHour
                                    ? 'bg-blue-500 dark:bg-blue-400 opacity-100'
                                    : 'bg-blue-200 dark:bg-blue-800 opacity-60 hover:opacity-80'
                                }`}
                            style={{ height: `${Math.max(10, point.level)}%` }}
                        ></div>
                    </div>
                ))}
            </div>

            {/* X-Axis Labels */}
            <div className="flex justify-between mt-1 text-[10px] text-slate-400">
                <span>6 AM</span>
                <span>12 PM</span>
                <span>6 PM</span>
                <span>12 AM</span>
            </div>

            {data.length > 0 && data[currentHour] && (
                <p className="text-xs text-center mt-2 text-slate-500">
                    Typically <span className="font-medium text-slate-900 dark:text-white">{data[currentHour].level > 70 ? 'very busy' : data[currentHour].level > 30 ? 'moderately busy' : 'not too busy'}</span> right now
                </p>
            )}
        </div>
    );
};

export default PopularTimesChart;
