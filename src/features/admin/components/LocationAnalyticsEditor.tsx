import React, { useState, useEffect, useCallback } from 'react';
import {
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
  getPeakAnalysis,
  getRetentionMetrics,
  getZoneCorrelations,
  getHeatmapComparison,
  AnalyticsSummary,
  PeakAnalysis,
  RetentionMetric,
  ZoneCorrelation,
  HeatmapComparison,
} from '@/services/locationAnalyticsService';

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
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const TrendingUpIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
    />
  </svg>
);

const LocationAnalyticsEditor: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [peakAnalysis, setPeakAnalysis] = useState<PeakAnalysis | null>(null);
  const [retentionMetrics, setRetentionMetrics] = useState<RetentionMetric[]>([]);
  const [zoneCorrelations, setZoneCorrelations] = useState<ZoneCorrelation | null>(null);
  const [heatmapComparison, setHeatmapComparison] = useState<HeatmapComparison | null>(null);
  const [selectedCorrelationZone, setSelectedCorrelationZone] = useState<string>('');
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

      const [analyticsData, peak, retention, heatmap] = await Promise.all([
        getAggregatedAnalytics(startDate, endDate).catch((err) => {
          console.error('Analytics error:', err);
          return null;
        }),
        getPeakAnalysis(startDate, endDate).catch((err) => {
          console.error('Peak error:', err);
          return null;
        }),
        getRetentionMetrics(startDate, endDate).catch((err) => {
          console.error('Retention error:', err);
          return [];
        }),
        getHeatmapComparison(startDate, endDate).catch((err) => {
          console.error('Heatmap error:', err);
          return null;
        }),
      ]);

      setAnalytics(analyticsData);
      setPeakAnalysis(peak);
      setRetentionMetrics(retention || []);
      setHeatmapComparison(heatmap);

      // Default correlation zone to most popular if not set
      if (
        analyticsData?.mostPopularZone &&
        !selectedCorrelationZone &&
        analyticsData.zoneAnalytics &&
        analyticsData.zoneAnalytics.length > 0
      ) {
        const topZoneId = analyticsData.zoneAnalytics[0].zoneId;
        setSelectedCorrelationZone(topZoneId);
      }
    } catch (error) {
      console.error('Error fetching location analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle window resize for chart responsiveness
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch correlations when selected zone changes
  useEffect(() => {
    if (!selectedCorrelationZone) {
      setZoneCorrelations(null);
      return;
    }

    const fetchCorrelations = async () => {
      try {
        // Calculate dates again (or memoize them)
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

        const correlations = await getZoneCorrelations(selectedCorrelationZone, startDate, endDate);
        setZoneCorrelations(correlations);
      } catch (error) {
        console.error('Error fetching correlations:', error);
        setZoneCorrelations(null);
      }
    };

    fetchCorrelations();
  }, [selectedCorrelationZone, dateRange]);

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-800 text-white p-5 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-1/4 -translate-y-1/4">
              <TrendingUpIcon />
            </div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Visits</p>
                <p className="text-3xl font-black tracking-tight mt-1">
                  {analytics?.totalVisits || 0}
                </p>
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
                <p className="text-3xl font-black tracking-tight mt-1">
                  {analytics?.uniqueVisitors || 0}
                </p>
              </div>
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <UsersIcon />
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
                <p className="text-3xl font-black tracking-tight mt-1">
                  {formatHour(analytics?.peakHour || 0)}
                </p>
              </div>
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <ClockIcon />
              </div>
            </div>
          </div>
        </div>

        {/* Consent Stats */}
        {/* Consent Stats Removed */}

        {/* Charts Row 1 */}
        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hourly Traffic Removed */}

          {/* Daily/Hourly Trends */}
          <div className="admin-card col-span-2">
            <h3 className="text-lg font-semibold mb-4">
              {dateRange === 'today' ? 'Hourly Activity (Today)' : 'Weekly Pattern'}
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart
                data={
                  dateRange === 'today'
                    ? analytics?.hourlyAnalytics || []
                    : analytics?.dailyAnalytics || []
                }
                margin={{ left: 10, right: 20, top: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
                <XAxis
                  dataKey={dateRange === 'today' ? 'hour' : 'dayName'}
                  tickFormatter={(val) => (dateRange === 'today' ? formatHour(Number(val)) : val)}
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  stroke="#94a3b8"
                  axisLine={{ stroke: '#475569' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  stroke="#94a3b8"
                  axisLine={{ stroke: '#475569' }}
                  label={{ value: 'Visits', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(value) => Math.round(value).toString()}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid rgba(96, 165, 250, 0.3)',
                    borderRadius: '12px',
                    color: '#f8fafc',
                  }}
                  formatter={(value) => [`${value ?? 0} visits`, 'Activity']}
                  labelFormatter={(label) => (dateRange === 'today' ? formatHour(Number(label)) : label)}
                />
                <Line
                  type="monotone"
                  dataKey="visits"
                  stroke="#a855f7"
                  strokeWidth={3}
                  dot={{ fill: '#a855f7', r: 5 }}
                  activeDot={{ r: 8 }}
                  name="Activity"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peak Analysis Row */}
        <div className="grid grid-cols-1 gap-6">
          {/* Dwell Time Analysis Removed */}

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
                  <p className="text-xs text-orange-500">
                    {peakAnalysis?.peakHourVisits || 0} visits
                  </p>
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
                  <p className="text-xs text-green-500">
                    {peakAnalysis?.quietHourVisits || 0} visits
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Category Distribution - Takes more space now */}
          <div className="admin-card lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Category Distribution</h3>
            <ResponsiveContainer width="100%" height={isMobile ? 400 : 320}>
              <PieChart>
                <Pie
                  data={analytics?.categoryDistribution || []}
                  dataKey="count"
                  nameKey="category"
                  cx={isMobile ? '50%' : '35%'}
                  cy="50%"
                  outerRadius={isMobile ? 120 : 105}
                  innerRadius={isMobile ? 60 : 55}
                  paddingAngle={3}
                  stroke="#1e293b"
                  strokeWidth={2}
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                    if ((percent ?? 0) < 0.05) return null; // Don't show label for <5%
                    const RADIAN = Math.PI / 180;
                    // proper safety checks for all coordinates
                    const safeInner = innerRadius ?? 0;
                    const safeOuter = outerRadius ?? 0;
                    const safeCx = cx ?? 0;
                    const safeCy = cy ?? 0;
                    const safeMidAngle = midAngle ?? 0;

                    const radius = safeInner + (safeOuter - safeInner) * 0.5;
                    const x = safeCx + radius * Math.cos(-safeMidAngle * RADIAN);
                    const y = safeCy + radius * Math.sin(-safeMidAngle * RADIAN);
                    return (
                      <text
                        x={x}
                        y={y}
                        fill="#fff"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={13}
                        fontWeight={600}
                      >
                        {`${((percent ?? 0) * 100).toFixed(0)}%`}
                      </text>
                    );
                  }}
                  labelLine={false}
                >
                  {(analytics?.categoryDistribution || []).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        CATEGORY_COLORS[entry.category] || CHART_COLORS[index % CHART_COLORS.length]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid rgba(96, 165, 250, 0.3)',
                    borderRadius: '12px',
                    color: '#f8fafc',
                    padding: '10px 14px',
                  }}
                  itemStyle={{ color: '#f8fafc' }}
                  formatter={(value, name) => [`${value ?? 0} visits`, name]}
                />
                <Legend
                  layout={isMobile ? 'horizontal' : 'vertical'}
                  align={isMobile ? 'center' : 'right'}
                  verticalAlign={isMobile ? 'bottom' : 'middle'}
                  wrapperStyle={
                    isMobile
                      ? { paddingTop: '20px', fontSize: '13px' }
                      : { paddingLeft: '10px', fontSize: '13px', lineHeight: '28px' }
                  }
                  iconType="circle"
                  iconSize={10}
                  formatter={(value) => <span style={{ color: '#e2e8f0' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Popular Locations - Now takes 1 column */}
          <div className="admin-card">
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
                    <p className="font-medium text-white truncate">{zone.zoneName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {zone.uniqueVisitors} unique visitors • Avg. {Math.round(zone.avgDwellTime)}{' '}
                      min
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

        {/* Advanced Metrics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Retention / Loyalty */}
          <div className="admin-card">
            <h3 className="text-lg font-semibold mb-4">Top Sticky Zones (Loyalty)</h3>
            <div className="space-y-4">
              {retentionMetrics.length > 0 ? (
                retentionMetrics.map((zone) => (
                  <div key={zone.zoneId} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-slate-200">{zone.zoneName}</span>
                      <span className="text-emerald-400 font-bold">
                        {zone.returnRate.toFixed(1)}% Return Rate
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full"
                        style={{ width: `${zone.returnRate}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500">{zone.visitCount} total visits</p>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-sm">No retention data available yet.</p>
              )}
            </div>
          </div>

          {/* Cross-Correlation */}
          <div className="admin-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Zone Correlations</h3>
              <select
                className="bg-slate-700 border-none text-sm rounded-lg px-2 py-1 focus:ring-2 focus:ring-primary"
                value={selectedCorrelationZone}
                onChange={(e) => setSelectedCorrelationZone(e.target.value)}
              >
                <option value="" disabled>
                  Select Zone
                </option>
                {analytics?.zoneAnalytics.map((z) => (
                  <option key={z.zoneId} value={z.zoneId}>
                    {z.zoneName}
                  </option>
                ))}
              </select>
            </div>

            {zoneCorrelations ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-400">
                  Visitors of{' '}
                  <span className="text-primary font-medium">
                    {zoneCorrelations.sourceZoneName}
                  </span>{' '}
                  also visited:
                </p>
                {zoneCorrelations.correlatedZones.map((zone) => (
                  <div key={zone.zoneId} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-slate-200">{zone.zoneName}</span>
                      <span className="text-blue-400 font-bold">
                        {zone.correlation.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${zone.correlation}%` }}
                      />
                    </div>
                  </div>
                ))}
                {zoneCorrelations.correlatedZones.length === 0 && (
                  <p className="text-slate-500 text-sm italic">No strong correlations found.</p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-slate-500 text-sm">
                {selectedCorrelationZone
                  ? 'Loading correlations...'
                  : 'Select a zone to view correlations'}
              </div>
            )}
          </div>
        </div>

        {/* Heatmap Comparison */}
        <div className="admin-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Activity Heatmap (vs Last Period)</h3>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-indigo-500 rounded-sm"></div>
                <span className="text-slate-400">Increased</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                <span className="text-slate-400">No Change</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                <span className="text-slate-400">Decreased</span>
              </div>
            </div>
          </div>
          {heatmapComparison ? (
            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                {/* Hour labels (X-axis) */}
                <div className="flex">
                  <div className="w-12 flex-shrink-0"></div>
                  <div className="flex-1 grid grid-cols-24 gap-px">
                    {Array.from({ length: 24 }).map((_, hour) => (
                      <div
                        key={hour}
                        className="text-[10px] text-slate-500 text-center"
                      >
                        {hour % 3 === 0 ? formatHour(hour) : ''}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Heatmap grid with day labels */}
                <div className="flex flex-col gap-px mt-1">
                  {(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const).map((dayName, dayIndex) => (
                    <div key={dayName} className="flex items-center">
                      {/* Day label (Y-axis) */}
                      <div className="w-12 flex-shrink-0 text-xs text-slate-400 font-medium pr-2 text-right">
                        {dayName}
                      </div>
                      {/* Hour cells for this day */}
                      <div className="flex-1 grid grid-cols-24 gap-px bg-slate-800 rounded overflow-hidden">
                        {Array.from({ length: 24 }).map((_, hourIndex) => {
                          const currVal =
                            heatmapComparison.currentPeriod.find(
                              (d) => d.day === dayIndex && d.hour === hourIndex
                            )?.value || 0;
                          const prevVal =
                            heatmapComparison.previousPeriod.find(
                              (d) => d.day === dayIndex && d.hour === hourIndex
                            )?.value || 0;

                          const diff = currVal - prevVal;
                          // Color based on current value intensity + diff indicator
                          // Use current value for base intensity, diff for color
                          const maxVal = Math.max(
                            ...heatmapComparison.currentPeriod.map((d) => d.value),
                            1
                          );
                          const intensity = Math.round((currVal / maxVal) * 100);

                          let bgColor = 'bg-slate-900';
                          if (currVal > 0) {
                            if (diff > 0) {
                              bgColor = `bg-indigo-500`;
                            } else if (diff < 0) {
                              bgColor = `bg-red-500`;
                            } else {
                              bgColor = `bg-blue-500`;
                            }
                          }

                          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

                          return (
                            <div
                              key={`${dayIndex}-${hourIndex}`}
                              className={`h-7 ${bgColor} flex items-center justify-center text-[8px] text-transparent hover:text-white transition-all cursor-crosshair`}
                              style={{
                                opacity: currVal > 0 ? Math.max(0.2, intensity / 100) : 0.1,
                              }}
                              title={`${dayNames[dayIndex]}, ${formatHour(hourIndex)}: ${currVal} visits${diff !== 0 ? ` (${diff > 0 ? '+' : ''}${diff} vs last period)` : ''}`}
                            >
                              {currVal > 0 && currVal}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No heatmap data available.</p>
          )}
        </div>
        {/* Info Footer */}
        <div className="bg-blue-900/20 rounded-xl p-4 border border-blue-800">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium">About Location Analytics</p>
              <p className="text-blue-600 dark:text-blue-400">
                This data is collected from users who have opted in to location tracking. Individual
                user data is anonymized - only aggregated patterns are shown here. Data is
                automatically deleted after 90 days.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminPageLayout>
  );
};

export default LocationAnalyticsEditor;
