import { Calendar, Clock, Info, MapPin, RefreshCw, TrendingUp, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

import { AXIS_COLOR, CHART_COLORS, GRID_COLOR, TOOLTIP_STYLE } from '../chartTheme';
import { AdminHeader, AdminPageLayout } from './ui';

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

type DateRange = 'today' | 'week' | 'month';

const RANGES: Record<DateRange, { label: string; days: number }> = {
  today: { label: 'Today', days: 0 },
  week: { label: 'Last 7 Days', days: 6 },
  month: { label: 'Last 30 Days', days: 29 },
};

// From midnight `days` ago until now
const getRange = (range: DateRange) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - RANGES[range].days);
  startDate.setHours(0, 0, 0, 0);
  return { startDate, endDate: new Date() };
};

const CATEGORY_COLORS: Record<string, string> = {
  academic: '#3b82f6',
  residential: '#22c55e',
  facilities: '#a855f7',
  dining: '#f97316',
  administration: '#6366f1',
};

const TONES = {
  red: ['bg-red-900/20', 'text-red-400', 'text-red-300', 'text-red-500'],
  emerald: ['bg-emerald-900/20', 'text-emerald-400', 'text-emerald-300', 'text-emerald-500'],
  orange: ['bg-orange-900/20', 'text-orange-400', 'text-orange-300', 'text-orange-500'],
  green: ['bg-green-900/20', 'text-green-400', 'text-green-300', 'text-green-500'],
};

const formatHour = (hour: number): string => {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
};

// "YYYY-MM-DD" → "Jan 5" in local time
const formatDate = (dateStr: string): string => {
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const MetricInfo = ({ text }: { text: string }) => (
  <div className="group relative inline-block ml-1.5 align-middle">
    <Info className="w-3.5 h-3.5 text-slate-400 cursor-help hover:text-white transition-colors opacity-70 hover:opacity-100" />
    <div className="invisible group-hover:visible absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg shadow-xl backdrop-blur-sm pointer-events-none">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
    </div>
  </div>
);

const SectionHeader = ({
  title,
  subtitle,
  first,
}: {
  title: string;
  subtitle: string;
  first?: boolean;
}) => (
  <div className={first ? 'mb-6' : 'mb-6 mt-8'}>
    <h2 className="text-xl font-bold text-white">{title}</h2>
    <p className="text-slate-400 text-sm">{subtitle}</p>
  </div>
);

const SummaryCard = ({
  label,
  info,
  value,
  icon: Icon,
  gradient,
  labelColor,
}: {
  label: string;
  info: string;
  value: React.ReactNode;
  icon: LucideIcon;
  gradient: string;
  labelColor: string;
}) => (
  <div className="relative rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
    <div className={`absolute inset-0 rounded-2xl overflow-hidden bg-gradient-to-br ${gradient}`}>
      <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-1/4 -translate-y-1/4">
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <div className="relative z-10 p-5 text-white flex items-center justify-between">
      <div>
        <p className={`${labelColor} text-sm font-medium`}>
          {label}
          <MetricInfo text={info} />
        </p>
        <p className="text-3xl font-black tracking-tight mt-1">{value}</p>
      </div>
      <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
        <Icon className="w-5 h-5" />
      </div>
    </div>
  </div>
);

const ProgressRow = ({
  label,
  value,
  percent,
  textColor,
  barColor,
  footnote,
}: {
  label: string;
  value: string;
  percent: number;
  textColor: string;
  barColor: string;
  footnote?: string;
}) => (
  <div className="space-y-1">
    <div className="flex justify-between text-sm">
      <span className="font-medium text-slate-200">{label}</span>
      <span className={`${textColor} font-bold`}>{value}</span>
    </div>
    <div className="w-full bg-slate-700 rounded-full h-2">
      <div className={`${barColor} h-2 rounded-full`} style={{ width: `${percent}%` }} />
    </div>
    {footnote && <p className="text-xs text-slate-500">{footnote}</p>}
  </div>
);

const LocationAnalyticsEditor: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [peakAnalysis, setPeakAnalysis] = useState<PeakAnalysis | null>(null);
  const [retentionMetrics, setRetentionMetrics] = useState<RetentionMetric[]>([]);
  const [zoneCorrelations, setZoneCorrelations] = useState<ZoneCorrelation | null>(null);
  const [heatmapComparison, setHeatmapComparison] = useState<HeatmapComparison | null>(null);
  const [selectedCorrelationZone, setSelectedCorrelationZone] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('week');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { startDate, endDate } = getRange(dateRange);
    const logged =
      <T,>(label: string, fallback: T) =>
      (err: unknown) => {
        console.error(`${label} error:`, err);
        return fallback;
      };

    const [analyticsData, peak, retention, heatmap] = await Promise.all([
      getAggregatedAnalytics(startDate, endDate).catch(logged('Analytics', null)),
      getPeakAnalysis(startDate, endDate).catch(logged('Peak', null)),
      getRetentionMetrics(startDate, endDate).catch(logged('Retention', [])),
      getHeatmapComparison(startDate, endDate, dateRange).catch(logged('Heatmap', null)),
    ]);

    setAnalytics(analyticsData);
    setPeakAnalysis(peak);
    setRetentionMetrics(retention || []);
    setHeatmapComparison(heatmap);
    // Default the correlation zone to the most popular one
    const topZone = analyticsData?.zoneAnalytics?.[0];
    if (topZone) setSelectedCorrelationZone((zone) => zone || topZone.zoneId);
    setLoading(false);
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Chart layout switches below 1024px
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!selectedCorrelationZone) {
      setZoneCorrelations(null);
      return;
    }
    const { startDate, endDate } = getRange(dateRange);
    getZoneCorrelations(selectedCorrelationZone, startDate, endDate)
      .then(setZoneCorrelations)
      .catch((error) => {
        console.error('Error fetching correlations:', error);
        setZoneCorrelations(null);
      });
  }, [selectedCorrelationZone, dateRange]);

  // Index heatmap cells by "<zone or day>|<hour>" (first match wins, like .find)
  const heatmap = useMemo(() => {
    if (!heatmapComparison) return null;
    const index = (cells: HeatmapComparison['currentPeriod']) => {
      const map = new Map<string, number>();
      cells.forEach((d) => {
        const key = `${dateRange === 'today' ? d.zoneId : d.day}|${d.hour}`;
        if (!map.has(key)) map.set(key, d.value);
      });
      return map;
    };
    let rows: { label: string; key: string | number }[];
    if (dateRange === 'today') {
      // One row per zone seen today, or the top 5 zones when there is no data yet
      const zones = new Map<string, string>();
      heatmapComparison.currentPeriod.forEach((d) => {
        if (d.zoneId) zones.set(d.zoneId, d.zoneName || d.zoneId);
      });
      if (zones.size === 0) {
        analytics?.zoneAnalytics.slice(0, 5).forEach((z) => zones.set(z.zoneId, z.zoneName));
      }
      rows = Array.from(zones, ([key, label]) => ({ key, label }));
    } else {
      rows = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label, key) => ({
        label,
        key,
      }));
    }
    return {
      rows,
      current: index(heatmapComparison.currentPeriod),
      previous: index(heatmapComparison.previousPeriod),
      maxVal: Math.max(...heatmapComparison.currentPeriod.map((d) => d.value), 1),
    };
  }, [heatmapComparison, dateRange, analytics]);

  if (loading) {
    return (
      <AdminPageLayout>
        <AdminHeader icon={MapPin} title="Location Insights" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
      </AdminPageLayout>
    );
  }

  const peakRows =
    dateRange === 'today'
      ? [
          {
            label: 'Peak Hour',
            value: formatHour(peakAnalysis?.peakHour || 0),
            visits: peakAnalysis?.peakHourVisits,
            tone: TONES.orange,
          },
          {
            label: 'Quietest Hour',
            value: formatHour(peakAnalysis?.quietHour || 0),
            visits: peakAnalysis?.quietHourVisits,
            tone: TONES.green,
          },
        ]
      : dateRange === 'month'
        ? [
            {
              label: 'Busiest Date',
              value: formatDate(peakAnalysis?.peakDate || '') || 'N/A',
              visits: peakAnalysis?.peakDateVisits,
              tone: TONES.red,
            },
            {
              label: 'Quietest Date',
              value: formatDate(peakAnalysis?.quietestDate || '') || 'N/A',
              visits: peakAnalysis?.quietestDateVisits,
              tone: TONES.emerald,
            },
          ]
        : [
            {
              label: 'Busiest Day',
              value: peakAnalysis?.peakDay || 'N/A',
              visits: peakAnalysis?.peakDayVisits,
              tone: TONES.red,
            },
            {
              label: 'Quietest Day',
              value: peakAnalysis?.quietestDay || 'N/A',
              visits: peakAnalysis?.quietestDayVisits,
              tone: TONES.emerald,
            },
          ];

  const busiest = peakRows[0];

  return (
    <AdminPageLayout>
      <AdminHeader icon={MapPin} title="Location Insights" />
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {(Object.keys(RANGES) as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  dateRange === range
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {RANGES[range].label}
              </button>
            ))}
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            <span className="text-sm font-medium">Refresh</span>
          </button>
        </div>

        <SectionHeader
          first
          title="Overview"
          subtitle="Key performance metrics for the selected period"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SummaryCard
            label="Total Visits"
            info="Total number of location pings received during the selected period."
            value={analytics?.totalVisits || 0}
            icon={TrendingUp}
            gradient="from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-800"
            labelColor="text-blue-100"
          />
          <SummaryCard
            label="Unique Visitors"
            info="Number of distinct users detected in the selected period."
            value={analytics?.uniqueVisitors || 0}
            icon={Users}
            gradient="from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-800"
            labelColor="text-purple-100"
          />
          <SummaryCard
            label={busiest?.label ?? ''}
            info="The specific time or day with the highest traffic volume."
            value={dateRange === 'today' ? formatHour(analytics?.peakHour || 0) : busiest?.value}
            icon={dateRange === 'today' ? Clock : Calendar}
            gradient="from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-800"
            labelColor="text-orange-100"
          />
        </div>

        <SectionHeader title="Traffic Trends" subtitle="Visitor activity patterns over time" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="admin-card col-span-2">
            <h3 className="text-lg font-semibold mb-4 text-white">
              {dateRange === 'today' ? 'Hourly Activity (Today)' : 'Activity Trend'}
              <MetricInfo text="Graph showing how visitor volume fluctuates over time." />
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart
                data={
                  dateRange === 'today'
                    ? analytics?.hourlyAnalytics || []
                    : analytics?.trendAnalytics || []
                }
                margin={{ left: 10, right: 20, top: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                <XAxis
                  dataKey={dateRange === 'today' ? 'hour' : 'date'}
                  tickFormatter={(val) => {
                    if (dateRange === 'today') return formatHour(Number(val));
                    if (dateRange === 'week') {
                      return new Date(String(val)).toLocaleDateString('en-US', {
                        weekday: 'short',
                      });
                    }
                    return formatDate(String(val));
                  }}
                  tick={{ fontSize: 12, fill: AXIS_COLOR }}
                  stroke={AXIS_COLOR}
                  axisLine={{ stroke: '#475569' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: AXIS_COLOR }}
                  stroke={AXIS_COLOR}
                  axisLine={{ stroke: '#475569' }}
                  label={{
                    value: 'Visits',
                    angle: -90,
                    position: 'insideLeft',
                    fill: AXIS_COLOR,
                    fontSize: 12,
                  }}
                  tickFormatter={(value) => Math.round(value).toString()}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value) => [`${value ?? 0} visits`, 'Activity']}
                  labelFormatter={(label) =>
                    dateRange === 'today' ? formatHour(Number(label)) : formatDate(String(label))
                  }
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

        <SectionHeader title="Peak Insights" subtitle="High and low traffic analysis" />
        <div className="admin-card">
          <h3 className="text-lg font-semibold mb-4 text-white">
            Peak Usage Analysis
            <MetricInfo text="Insights into the busiest and quietest times to help with resource allocation." />
          </h3>
          <div className="space-y-4">
            {peakRows.map(
              ({ label, value, visits, tone: [bg, labelColor, valueColor, visitsColor] }) => (
                <div
                  key={label}
                  className={`flex items-center justify-between p-3 ${bg} rounded-lg`}
                >
                  <div>
                    <p className={`text-sm ${labelColor} font-medium`}>{label}</p>
                    <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
                  </div>
                  <p className={`text-xs ${visitsColor}`}>{visits || 0} visits</p>
                </div>
              )
            )}
          </div>
        </div>

        <SectionHeader
          title="Location Analysis"
          subtitle="Zone popularity and category distribution"
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="admin-card lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4 text-white">
              Category Distribution
              <MetricInfo text="Breakdown of visits by location type (Academic, Residential, etc.)." />
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={analytics?.categoryDistribution || []}
                  dataKey="count"
                  nameKey="category"
                  cx={isMobile ? '50%' : '35%'}
                  cy="50%"
                  outerRadius={140}
                  innerRadius={80}
                  paddingAngle={3}
                  stroke="#1e293b"
                  strokeWidth={2}
                  label={({
                    cx = 0,
                    cy = 0,
                    midAngle = 0,
                    innerRadius = 0,
                    outerRadius = 0,
                    percent = 0,
                  }) => {
                    if (percent < 0.05) return null; // Don't label slices under 5%
                    const RADIAN = Math.PI / 180;
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    return (
                      <text
                        x={cx + radius * Math.cos(-midAngle * RADIAN)}
                        y={cy + radius * Math.sin(-midAngle * RADIAN)}
                        fill="#fff"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={13}
                        fontWeight={600}
                      >
                        {`${(percent * 100).toFixed(0)}%`}
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
                  contentStyle={{ ...TOOLTIP_STYLE, padding: '10px 14px' }}
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

          <div id="card-popular-locations" className="admin-card">
            <h3 className="text-lg font-semibold mb-3 flex-shrink-0 text-white">
              Popular Locations
              <MetricInfo text="Ranking of zones calculated by total visit count." />
            </h3>
            <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {(analytics?.zoneAnalytics || []).slice(0, 50).map((zone, index) => {
                const color = CATEGORY_COLORS[zone.category] ?? CATEGORY_COLORS.administration;
                return (
                  <div
                    key={zone.zoneId}
                    className="flex items-center gap-2 py-1 px-2 bg-slate-800/50 hover:bg-slate-800 rounded transition-colors"
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
                      className="flex-shrink-0 px-2 py-1 text-xs font-medium rounded-full"
                      style={{ color, backgroundColor: `${color}26` }}
                    >
                      {zone.category}
                    </span>
                  </div>
                );
              })}
              {!analytics?.zoneAnalytics?.length && (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <MapPin className="w-6 h-6 inline-block" />
                  <p className="mt-2">No location data available yet</p>
                  <p className="text-sm">Data will appear once users opt in</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <SectionHeader title="Visitor Behavior" subtitle="Retention rates and zone correlations" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="admin-card">
            <h3 className="text-lg font-semibold mb-4 text-white">
              Top Sticky Zones (Loyalty)
              <MetricInfo text="Zones where users return most frequently. High percentage means high loyalty." />
            </h3>
            <div className="space-y-4">
              {retentionMetrics.length > 0 ? (
                retentionMetrics.map((zone) => (
                  <ProgressRow
                    key={zone.zoneId}
                    label={zone.zoneName}
                    value={`${zone.returnRate.toFixed(1)}% Return Rate`}
                    percent={zone.returnRate}
                    textColor="text-emerald-400"
                    barColor="bg-emerald-500"
                    footnote={`${zone.visitCount} total visits`}
                  />
                ))
              ) : (
                <p className="text-slate-500 text-sm">No retention data available yet.</p>
              )}
            </div>
          </div>

          <div className="admin-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Zone Correlations
                <MetricInfo text="Likelihood of a user visiting specific zones after visiting the selected source zone." />
              </h3>
              <select
                className="bg-slate-700 border-none text-sm rounded-lg px-2 py-1 focus:ring-2 focus:ring-primary max-w-[150px] truncate"
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
                  <ProgressRow
                    key={zone.zoneId}
                    label={zone.zoneName}
                    value={`${zone.correlation.toFixed(1)}%`}
                    percent={zone.correlation}
                    textColor="text-blue-400"
                    barColor="bg-blue-500"
                  />
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
            <h3 className="text-lg font-semibold text-white">
              Activity Heatmap (vs Last Period)
              <MetricInfo text="Visual representation of traffic intensity. Compare current period against previous." />
            </h3>
            <div className="flex items-center gap-3 text-xs">
              {[
                ['bg-indigo-500', 'Increased'],
                ['bg-blue-500', 'No Change'],
                ['bg-red-500', 'Decreased'],
              ].map(([color, label]) => (
                <div key={label} className="flex items-center gap-1">
                  <div className={`w-3 h-3 ${color} rounded-sm`}></div>
                  <span className="text-slate-400">{label}</span>
                </div>
              ))}
            </div>
          </div>
          {heatmap ? (
            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                {/* Hour labels (X-axis) */}
                <div className="flex">
                  <div className="w-12 flex-shrink-0"></div>
                  <div className="flex-1 grid grid-cols-24 gap-px">
                    {Array.from({ length: 24 }, (_, hour) => (
                      <div key={hour} className="text-[10px] text-slate-500 text-center">
                        {hour % 3 === 0 ? formatHour(hour) : ''}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-px mt-1">
                {heatmap.rows.map((row) => (
                  <div key={row.key} className="flex items-center">
                    <div className="w-24 flex-shrink-0 text-xs text-slate-400 font-medium pr-2 text-right truncate">
                      {row.label}
                    </div>
                    <div className="flex-1 grid grid-cols-24 gap-px bg-slate-800 rounded overflow-hidden">
                      {Array.from({ length: 24 }, (_, hour) => {
                        const currVal = heatmap.current.get(`${row.key}|${hour}`) || 0;
                        const diff = currVal - (heatmap.previous.get(`${row.key}|${hour}`) || 0);
                        // Colour shows the change vs last period, opacity the current volume
                        const bgColor =
                          currVal === 0
                            ? 'bg-slate-900'
                            : diff > 0
                              ? 'bg-indigo-500'
                              : diff < 0
                                ? 'bg-red-500'
                                : 'bg-blue-500';
                        return (
                          <div
                            key={hour}
                            className={`h-7 ${bgColor} flex items-center justify-center text-[8px] text-transparent hover:text-white transition-all cursor-crosshair`}
                            style={{
                              opacity: currVal > 0 ? 0.4 + (currVal / heatmap.maxVal) * 0.6 : 1,
                            }}
                            title={`${row.label} @ ${formatHour(hour)}: ${currVal} visits (${diff > 0 ? '+' : ''}${diff} vs prev)`}
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
          ) : (
            <p className="text-slate-500 text-sm">No heatmap data available.</p>
          )}
        </div>

        {/* Info Footer */}
        <div className="bg-blue-900/20 rounded-xl p-4 border border-blue-800">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
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
