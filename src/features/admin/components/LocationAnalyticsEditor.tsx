import React, { useState, useEffect, useCallback } from 'react';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    Legend,
} from 'recharts';

import { AdminHeader } from './AdminIcons';
import AdminPageLayout from './AdminPageLayout';
import {
    getAggregatedAnalytics,
    getConsentStats,
    getPeakAnalysis,
    getDwellTimeInsights,
    AnalyticsSummary,
    PeakAnalysis,
    DwellTimeInsights,
} from '@/services/locationAnalyticsService';
import DwellTimeChart from './DwellTimeChart';

// Chart colors
const CHART_COLORS = [
    '#60a5fa', // blue
    '#a78bfa', // purple
    '#f472b6', // pink
    '#34d399', // emerald
    '#fcd34d', // yellow
    '#fb923c', // orange
];

const CATEGORY_COLORS: Record<string, string> = {
    academic: '#3b82f6',
    residential: '#22c55e',
    facilities: '#a855f7',
    dining: '#f97316',
    administration: '#6366f1',
};

// Icons
const MapPinIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const RefreshIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
);

const UsersIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);

const ClockIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const TrendingUpIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);

const LocationAnalyticsEditor: React.FC = () => {
    const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
    const [consentStats, setConsentStats] = useState<{ opted: number; total: number }>({ opted: 0, total: 0 });
    const [peakAnalysis, setPeakAnalysis] = useState<PeakAnalysis | null>(null);
    const [dwellInsights, setDwellInsights] = useState<DwellTimeInsights[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('week');



    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Calculate date range
            const endDate = new Date();
            const startDate = new Date();

            switch (dateRange) {
                case 'today':
                    startDate.setHours(0, 0, 0, 0);
                    break;
                case 'week':
                    startDate.setDate(startDate.getDate() - 7);
                    break;
                case 'month':
                    startDate.setMonth(startDate.getMonth() - 1);
                    break;
            }

            const [
                analyticsData,
                consent,
                peak,
                dwell
            ] = await Promise.all([
                getAggregatedAnalytics(startDate, endDate).catch(err => { console.error('Analytics error:', err); return null; }),
                getConsentStats().catch(err => { console.error('Consent error:', err); return { opted: 0, total: 0 }; }),
                getPeakAnalysis(startDate, endDate).catch(err => { console.error('Peak error:', err); return null; }),
                getDwellTimeInsights(startDate, endDate).catch(err => { console.error('Dwell error:', err); return []; })
            ]);

            setAnalytics(analyticsData);
            setConsentStats(consent);
            setPeakAnalysis(peak);
            setDwellInsights(dwell);
        } catch (error) {
            console.error('Error fetching location analytics:', error);
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const formatHour = (hour: number): string => {
        if (hour === 0) return '12 AM';
        if (hour === 12) return '12 PM';
        return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
    };

    if (loading) {
        return (
            <AdminPageLayout>
                <AdminHeader icon={<MapPinIcon />} title="Location Insights" />
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                </div>
            </AdminPageLayout>
        );
    }

    return (
        <AdminPageLayout>
            <AdminHeader icon={<MapPinIcon />} title="Location Insights" />
            <div className="space-y-6">
                {/* Controls */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        {(['today', 'week', 'month'] as const).map((range) => (
                            <button
                                key={range}
                                onClick={() => setDateRange(range)}
                                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${dateRange === range
                                    ? 'bg-primary text-white shadow-md'
                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                    }`}
                            >
                                {range === 'today' ? 'Today' : range === 'week' ? 'Last 7 Days' : 'Last 30 Days'}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                    >
                        <RefreshIcon />
                        <span className="text-sm font-medium">Refresh</span>
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-800 text-white p-5 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                        <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-1/4 -translate-y-1/4">
                            <TrendingUpIcon />
                        </div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm font-medium">Total Visits</p>
                                <p className="text-3xl font-black tracking-tight mt-1">{analytics?.totalVisits || 0}</p>
                            </div>
                            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                <TrendingUpIcon />
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-800 text-white p-5 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                        <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-1/4 -translate-y-1/4">
                            <UsersIcon />
                        </div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <p className="text-purple-100 text-sm font-medium">Unique Visitors</p>
                                <p className="text-3xl font-black tracking-tight mt-1">{analytics?.uniqueVisitors || 0}</p>
                            </div>
                            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                <UsersIcon />
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-800 text-white p-5 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                        <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-1/4 -translate-y-1/4">
                            <ClockIcon />
                        </div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <p className="text-emerald-100 text-sm font-medium">Avg. Dwell Time</p>
                                <p className="text-3xl font-black tracking-tight mt-1">{Math.round(analytics?.avgDwellTime || 0)} <span className="text-lg font-normal opacity-80">min</span></p>
                            </div>
                            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                <ClockIcon />
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-800 text-white p-5 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                        <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-1/4 -translate-y-1/4">
                            <ClockIcon />
                        </div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <p className="text-orange-100 text-sm font-medium">Peak Hour</p>
                                <p className="text-3xl font-black tracking-tight mt-1">{formatHour(analytics?.peakHour || 0)}</p>
                            </div>
                            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                <ClockIcon />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Consent Stats */}
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-900/30 rounded-lg text-green-400">
                                <UsersIcon />
                            </div>
                            <div>
                                <p className="font-medium text-white">Tracking Consent</p>
                                <p className="text-sm text-slate-400">
                                    {consentStats.opted} of {consentStats.total} users have opted in ({consentStats.total > 0 ? Math.round((consentStats.opted / consentStats.total) * 100) : 0}%)
                                </p>
                            </div>
                        </div>
                        <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500 rounded-full transition-all"
                                style={{ width: `${consentStats.total > 0 ? (consentStats.opted / consentStats.total) * 100 : 0}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Hourly Traffic */}
                    <div className="admin-card">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <ClockIcon />
                            Hourly Traffic
                        </h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={analytics?.hourlyAnalytics || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
                                <XAxis
                                    dataKey="hour"
                                    tickFormatter={formatHour}
                                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                                    interval={2}
                                    stroke="#94a3b8"
                                />
                                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} stroke="#94a3b8" />
                                <Tooltip
                                    labelFormatter={(label) => formatHour(label as number)}
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: '1px solid rgba(96, 165, 250, 0.3)',
                                        borderRadius: '12px',
                                        color: '#f8fafc',
                                    }}
                                />
                                <Bar dataKey="visits" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Daily Trends */}
                    <div className="admin-card">
                        <h3 className="text-lg font-semibold mb-4">Weekly Pattern</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={analytics?.dailyAnalytics || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
                                <XAxis dataKey="dayName" tick={{ fontSize: 12, fill: '#94a3b8' }} stroke="#94a3b8" />
                                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} stroke="#94a3b8" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: '1px solid rgba(96, 165, 250, 0.3)',
                                        borderRadius: '12px',
                                        color: '#f8fafc',
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="visits"
                                    stroke="#a855f7"
                                    strokeWidth={3}
                                    dot={{ fill: '#a855f7', r: 5 }}
                                    activeDot={{ r: 8 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>


                {/* Dwell Time & Peak Analysis Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">


                    {/* Dwell Time Analysis */}
                    <div className="admin-card">
                        <h3 className="text-lg font-semibold mb-4">Dwell Time Analysis</h3>
                        <DwellTimeChart data={dwellInsights} />
                    </div>

                    {/* Peak Usage Stats */}
                    <div className="admin-card">
                        <h3 className="text-lg font-semibold mb-4">Peak Usage Analysis</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-red-900/20 rounded-lg">
                                <div>
                                    <p className="text-sm text-red-400 font-medium">Busiest Day</p>
                                    <p className="text-2xl font-bold text-red-300">
                                        {peakAnalysis?.peakDay || 'N/A'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-red-500">{peakAnalysis?.peakDayVisits || 0} visits</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-orange-900/20 rounded-lg">
                                <div>
                                    <p className="text-sm text-orange-400 font-medium">Peak Hour</p>
                                    <p className="text-2xl font-bold text-orange-300">
                                        {formatHour(peakAnalysis?.peakHour || 0)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-orange-500">{peakAnalysis?.peakHourVisits || 0} visits</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-green-900/20 rounded-lg">
                                <div>
                                    <p className="text-sm text-green-400 font-medium">Quietest Hour</p>
                                    <p className="text-2xl font-bold text-green-300">
                                        {formatHour(peakAnalysis?.quietHour || 0)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-green-500">{peakAnalysis?.quietHourVisits || 0} visits</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts Row 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Category Distribution */}
                    <div className="admin-card">
                        <h3 className="text-lg font-semibold mb-4">Category Distribution</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={analytics?.categoryDistribution || []}
                                    dataKey="count"
                                    nameKey="category"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label={({ name, percent }) =>
                                        `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                                    }
                                    labelLine={false}
                                >
                                    {(analytics?.categoryDistribution || []).map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={CATEGORY_COLORS[entry.category] || CHART_COLORS[index % CHART_COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Popular Locations */}
                    <div className="admin-card lg:col-span-2">
                        <h3 className="text-lg font-semibold mb-4">Popular Locations</h3>
                        <div className="space-y-3 max-h-[250px] overflow-y-auto">
                            {(analytics?.zoneAnalytics || []).slice(0, 10).map((zone, index) => (
                                <div
                                    key={zone.zoneId}
                                    className="flex items-center gap-4 p-3 bg-slate-800 rounded-lg"
                                >
                                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-white truncate">
                                            {zone.zoneName}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {zone.uniqueVisitors} unique visitors • Avg. {Math.round(zone.avgDwellTime)} min
                                        </p>
                                    </div>
                                    <div className="flex-shrink-0 text-right">
                                        <p className="text-lg font-bold text-primary">{zone.totalVisits}</p>
                                        <p className="text-xs text-slate-500">visits</p>
                                    </div>
                                    <span
                                        className={`flex-shrink-0 px-2 py-1 text-xs font-medium rounded-full ${zone.category === 'academic'
                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                            : zone.category === 'residential'
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : zone.category === 'facilities'
                                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                                    : zone.category === 'dining'
                                                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                                        : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                                            }`}
                                    >
                                        {zone.category}
                                    </span>
                                </div>
                            ))}
                            {(!analytics?.zoneAnalytics || analytics.zoneAnalytics.length === 0) && (
                                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                                    <MapPinIcon />
                                    <p className="mt-2">No location data available yet</p>
                                    <p className="text-sm">Data will appear once users opt in</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Info Footer */}
                <div className="bg-blue-900/20 rounded-xl p-4 border border-blue-800">
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-sm text-blue-700 dark:text-blue-300">
                            <p className="font-medium">About Location Analytics</p>
                            <p className="text-blue-600 dark:text-blue-400">
                                This data is collected from users who have opted in to location tracking. Individual user data is anonymized - only aggregated patterns are shown here. Data is automatically deleted after 90 days.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AdminPageLayout>
    );
};

export default LocationAnalyticsEditor;
