import { db } from '@lib/firebase';
import {
  AlertCircle,
  BarChart3,
  Calendar,
  FileText,
  RefreshCw,
  Search,
  Trash2,
  TrendingUp,
  TriangleAlert,
  Users,
  X,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

import { AXIS_COLOR, CHART_COLORS, GRID_COLOR, TOOLTIP_STYLE } from '../chartTheme';
import { useAllUsers } from '../hooks/useAllUsers';
import { usePagination } from '../hooks/usePagination';
import { admissionYear } from '../utils';
import { AdminHeader, AdminPageLayout, Pagination } from './ui';

import { User } from '@/types';

type Count = { name: string; count: number };

const DAY_MS = 24 * 60 * 60 * 1000;
const USERS_PER_PAGE = 10;

// Title Case so "COMPUTER SCIENCE" and "computer science" group together
const toTitleCase = (str: string) =>
  str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

// Firestore Timestamp (or a plain {seconds}) → Date
const toDate = (createdAt: User['createdAt']): Date | null => {
  if (!createdAt) return null;
  try {
    return createdAt.toDate?.() || new Date(createdAt.seconds * 1000);
  } catch {
    return null;
  }
};

const yearOf = (user: User) => admissionYear(user.email) ?? 'Other';

const countBy = (users: User[], key: (user: User) => string): Count[] => {
  const counts: Record<string, number> = {};
  users.forEach((user) => {
    const k = key(user);
    counts[k] = (counts[k] || 0) + 1;
  });
  return Object.entries(counts).map(([name, count]) => ({ name, count }));
};

const CountBarCard: React.FC<{
  title: string;
  data: Count[];
  emptyText: string;
  labelWidth: number;
  fontSize: number;
  gradient: [string, string];
  onSelect: (name: string) => void;
}> = ({ title, data, emptyText, labelWidth, fontSize, gradient, onSelect }) => {
  const gradientId = `${title.replace(/\W/g, '')}-gradient`;
  return (
    <div className="admin-card">
      <h3 className="text-base sm:text-lg font-semibold text-white mb-4">{title}</h3>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} layout="vertical">
            <XAxis type="number" stroke={AXIS_COLOR} />
            <YAxis
              type="category"
              dataKey="name"
              stroke={AXIS_COLOR}
              width={labelWidth}
              tick={{ fontSize }}
            />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar
              dataKey="count"
              fill={`url(#${gradientId})`}
              radius={[0, 4, 4, 0]}
              cursor="pointer"
              onClick={(entry) => entry.name && onSelect(entry.name)}
            />
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={gradient[0]} />
                <stop offset="100%" stopColor={gradient[1]} />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-indigo-400 text-center py-8">{emptyText}</p>
      )}
    </div>
  );
};

const AnalyticsEditor: React.FC = () => {
  const { users: rawUsers, loading, error, refresh } = useAllUsers();
  const [selectedFilter, setSelectedFilter] = useState<{ title: string; users: User[] } | null>(
    null
  );
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');

  const users = useMemo(
    () =>
      rawUsers.map((u) => ({
        ...u,
        name: u.name || u.fullName || 'Unknown',
        email: u.email || '',
        branch: u.branch || 'Unknown',
      })),
    [rawUsers]
  );
  const [lastUpdated, setLastUpdated] = useState(new Date());
  useEffect(() => {
    if (!loading) setLastUpdated(new Date());
  }, [loading]);

  const stats = useMemo(() => {
    const now = Date.now();
    const newSince = (days: number) =>
      users.filter((u) => (toDate(u.createdAt)?.getTime() ?? 0) >= now - days * DAY_MS).length;
    return {
      newThisWeek: newSince(7),
      newThisMonth: newSince(30),
      gradesheetsUploaded: users.filter((u) => typeof u.gradesData?.cgpa !== 'undefined').length,
      branchDistribution: countBy(users, (u) => toTitleCase(u.branch)).sort(
        (a, b) => b.count - a.count
      ),
      // "Other" sorts first
      yearDistribution: countBy(users, yearOf).sort(
        (a, b) => (Number(a.name) || 0) - (Number(b.name) || 0)
      ),
    };
  }, [users]);

  const growthData = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);
    const dayKey = (date: Date) =>
      date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const signupsByDate: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      signupsByDate[dayKey(new Date(now.getTime() - i * DAY_MS))] = 0;
    }
    users.forEach((user) => {
      const created = toDate(user.createdAt);
      if (created && created >= thirtyDaysAgo && created <= now) {
        const key = dayKey(created);
        if (signupsByDate[key] !== undefined) signupsByDate[key]++;
      }
    });

    let total = users.length - Object.values(signupsByDate).reduce((a, b) => a + b, 0);
    return Object.entries(signupsByDate).map(([date, signups]) => {
      total += signups;
      return { date, signups, total };
    });
  }, [users]);
  const maxSignups = Math.max(...growthData.map((d) => d.signups), 1);

  const isFiltered = !!searchQuery || branchFilter !== 'all' || yearFilter !== 'all';
  const filteredUsers = users
    .filter((user) => {
      const query = searchQuery.toLowerCase();
      return (
        (!query ||
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)) &&
        // Case-insensitive to match the chart's Title Case grouping
        (branchFilter === 'all' || user.branch.toLowerCase() === branchFilter.toLowerCase()) &&
        (yearFilter === 'all' || yearOf(user) === yearFilter)
      );
    })
    .sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0));
  const pager = usePagination(filteredUsers, USERS_PER_PAGE);

  const branchChartData = useMemo(() => {
    const top5 = stats.branchDistribution.slice(0, 5);
    const otherCount = stats.branchDistribution.slice(5).reduce((sum, b) => sum + b.count, 0);
    return otherCount > 0 ? [...top5, { name: 'Other', count: otherCount }] : top5;
  }, [stats.branchDistribution]);

  const filterByBranch = (branchName: string) => {
    const normalize = (branch: string) => branch.trim().toLowerCase();
    if (branchName === 'Other') {
      // Everyone outside the top 5 bars
      const top5 = new Set(stats.branchDistribution.slice(0, 5).map((b) => normalize(b.name)));
      setSelectedFilter({
        title: 'Users in Other Branches',
        users: users.filter((u) => !top5.has(normalize(u.branch))),
      });
    } else {
      setSelectedFilter({
        title: `Users in ${branchName}`,
        users: users.filter((u) => normalize(u.branch) === normalize(branchName)),
      });
    }
  };

  const filterByYear = (year: string) =>
    setSelectedFilter({
      title: `Users from ${year}`,
      users: users.filter((u) => yearOf(u) === year),
    });

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      await db.collection('users').doc(userToDelete.id).delete();
      setUserToDelete(null);
      await refresh();
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert('Failed to delete user. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-transparent border-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-indigo-300">Loading user analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-card bg-red-500/10 border-red-500/30">
        <div className="flex items-center gap-3 text-red-400">
          <AlertCircle className="w-6 h-6" />
          <div>
            <p className="font-medium">Failed to load analytics</p>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </div>
        <button onClick={refresh} className="admin-btn admin-btn-secondary mt-4">
          <RefreshCw className="w-5 h-5" /> Try Again
        </button>
      </div>
    );
  }

  const kpis = [
    {
      icon: Users,
      color: 'text-blue-400',
      valueColor: '',
      value: users.length,
      label: 'Total Users',
    },
    {
      icon: TrendingUp,
      color: 'text-emerald-400',
      valueColor: 'text-emerald-400',
      value: `+${stats.newThisWeek}`,
      label: 'This Week',
    },
    {
      icon: Calendar,
      color: 'text-cyan-400',
      valueColor: 'text-cyan-400',
      value: `+${stats.newThisMonth}`,
      label: 'This Month',
    },
    {
      icon: FileText,
      color: 'text-purple-400',
      valueColor: 'text-purple-400',
      value: stats.gradesheetsUploaded,
      label: 'Students with Grades',
    },
  ];
  const filterSelect =
    'px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-600 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';

  return (
    <AdminPageLayout>
      <AdminHeader
        icon={BarChart3}
        title="User Analytics"
        subtitle={`Last updated: ${lastUpdated.toLocaleTimeString()}`}
      >
        <button onClick={refresh} className="admin-btn admin-btn-secondary text-xs sm:text-sm">
          <RefreshCw className="w-5 h-5" />
          <span className="hidden xs:inline">Refresh</span>
        </button>
      </AdminHeader>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map(({ icon: Icon, color, valueColor, value, label }) => (
          <div key={label} className="admin-stat-card p-3 sm:p-6">
            <div className={`flex items-center justify-center gap-2 mb-2 ${color}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div className={`admin-stat-value text-xl sm:text-3xl ${valueColor}`}>{value}</div>
            <div className="admin-stat-label text-xs">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <CountBarCard
          title="Users by Branch"
          data={branchChartData}
          emptyText="No branch data available"
          labelWidth={130}
          fontSize={10}
          gradient={['#3b82f6', '#8b5cf6']}
          onSelect={filterByBranch}
        />
        <CountBarCard
          title="Users by Admission Year"
          data={stats.yearDistribution}
          emptyText="No year data available"
          labelWidth={60}
          fontSize={12}
          gradient={['#f472b6', '#a78bfa']}
          onSelect={filterByYear}
        />
      </div>

      {/* User Growth Chart */}
      <div className="admin-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
          <h3 className="text-base sm:text-lg font-semibold text-white">
            User Growth (Last 30 Days)
          </h3>
          <div className="flex items-center gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-400" />
              <span className="text-indigo-300">Cumulative Users</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="text-indigo-300">Daily Signups</span>
            </div>
          </div>
        </div>
        {growthData.some((d) => d.signups > 0) ? (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={growthData} margin={{ top: 5, right: 30, left: 0, bottom: 25 }}>
              <defs>
                <linearGradient id="growthAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.4} />
                  <stop offset="50%" stopColor="#a78bfa" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
              <XAxis
                dataKey="date"
                stroke={AXIS_COLOR}
                tick={{ fontSize: 10, fill: AXIS_COLOR }}
                tickLine={{ stroke: '#475569' }}
                axisLine={{ stroke: '#475569' }}
                interval="preserveStartEnd"
                tickFormatter={(value, index) => (index % 5 === 0 ? value : '')}
                dy={10}
              />
              <YAxis
                yAxisId="left"
                stroke="#475569"
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#22d3ee' }}
                tickLine={{ stroke: '#475569' }}
                axisLine={{ stroke: '#475569' }}
                width={45}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#34d399"
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#34d399' }}
                tickLine={{ stroke: '#475569' }}
                axisLine={{ stroke: '#475569' }}
                domain={[0, Math.max(maxSignups * 2, 5)]}
                width={35}
              />
              <Tooltip
                contentStyle={{
                  ...TOOLTIP_STYLE,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                  padding: '12px 16px',
                }}
                labelStyle={{ color: AXIS_COLOR, marginBottom: '8px', fontWeight: 600 }}
                cursor={{ stroke: 'rgba(148, 163, 184, 0.3)', strokeWidth: 1 }}
                formatter={(value, name) => {
                  const count = value ?? 0;
                  if (name === 'total')
                    return [`${Number(count).toLocaleString()} users`, 'Total Users'];
                  return [`+${count} ${count === 1 ? 'signup' : 'signups'}`, 'New Today'];
                }}
                animationDuration={200}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="total"
                stroke="none"
                fill="url(#growthAreaGradient)"
                animationDuration={1500}
                animationEasing="ease-out"
                legendType="none"
                tooltipType="none"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="signups"
                stroke="#34d399"
                strokeWidth={2}
                dot={{ fill: '#34d399', strokeWidth: 0, r: 3 }}
                activeDot={{
                  fill: '#10b981',
                  strokeWidth: 3,
                  stroke: 'rgba(52, 211, 153, 0.3)',
                  r: 6,
                  style: { filter: 'drop-shadow(0 0 6px rgba(52, 211, 153, 0.5))' },
                }}
                animationDuration={1500}
                animationEasing="ease-out"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="total"
                stroke="#22d3ee"
                strokeWidth={3}
                dot={false}
                activeDot={{
                  fill: '#22d3ee',
                  strokeWidth: 3,
                  stroke: 'rgba(34, 211, 238, 0.3)',
                  r: 8,
                  style: { filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.5))' },
                }}
                animationDuration={2000}
                animationEasing="ease-out"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-indigo-400 text-center py-8">No recent signups in the last 30 days</p>
        )}
      </div>

      {/* All Users */}
      <div className="admin-card">
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base sm:text-lg font-semibold text-white">All Users</h3>
            {isFiltered && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setBranchFilter('all');
                  setYearFilter('all');
                }}
                className="text-xs sm:text-sm text-blue-400 hover:text-blue-300"
              >
                Clear filters
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  pager.setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-800/50 border border-slate-600 text-white placeholder-indigo-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <select
              value={branchFilter}
              onChange={(e) => {
                setBranchFilter(e.target.value);
                pager.setPage(1);
              }}
              className={filterSelect}
            >
              <option value="all">All Branches</option>
              {stats.branchDistribution.map((b) => (
                <option key={b.name} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
            <select
              value={yearFilter}
              onChange={(e) => {
                setYearFilter(e.target.value);
                pager.setPage(1);
              }}
              className={filterSelect}
            >
              <option value="all">All Years</option>
              {stats.yearDistribution.map((y) => (
                <option key={y.name} value={y.name}>
                  {y.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredUsers.length > 0 ? (
          <div className="space-y-3">
            {pager.pageItems.map((user, index) => (
              <div key={user.id} className="admin-list-item flex items-center gap-3 sm:gap-4">
                <div
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-semibold shrink-0 text-sm sm:text-base"
                  style={{
                    backgroundColor:
                      CHART_COLORS[
                        ((pager.page - 1) * USERS_PER_PAGE + index) % CHART_COLORS.length
                      ],
                  }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate text-sm sm:text-base">
                    {user.name}
                  </p>
                  <p className="text-indigo-400 text-xs sm:text-sm truncate">{user.email}</p>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-indigo-300 text-sm">{user.branch}</p>
                  <p className="text-indigo-500 text-xs">
                    {toDate(user.createdAt)?.toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    }) ?? 'Unknown'}
                  </p>
                </div>
                <button
                  onClick={() => setUserToDelete(user)}
                  className="p-1.5 sm:p-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
                  title="Remove user"
                >
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-indigo-400 text-center py-8">
            {isFiltered ? 'No users match your filters' : 'No registered users yet'}
          </p>
        )}
      </div>

      <Pagination {...pager} label="users" />

      {/* Users Modal */}
      {selectedFilter && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedFilter(null)}
        >
          <div
            className="admin-card max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-700">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedFilter.title}</h3>
                <p className="text-indigo-400 text-sm">{selectedFilter.users.length} users</p>
              </div>
              <button
                onClick={() => setSelectedFilter(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[60vh] space-y-2">
              {selectedFilter.users.map((user, index) => (
                <div key={user.id} className="admin-list-item flex items-center gap-3 p-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold shrink-0"
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{user.name}</p>
                    <p className="text-indigo-400 text-sm truncate">{user.email}</p>
                  </div>
                  <div className="text-right text-sm hidden sm:block">
                    <p className="text-indigo-300">{user.branch}</p>
                  </div>
                </div>
              ))}
              {selectedFilter.users.length === 0 && (
                <p className="text-indigo-400 text-center py-8">No users found</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => !deleting && setUserToDelete(null)}
        >
          <div className="admin-card max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <TriangleAlert className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Remove User?</h3>
              <p className="text-indigo-300 mb-6">
                Are you sure you want to remove{' '}
                <span className="font-semibold text-white">{userToDelete.name}</span>?
                <br />
                <span className="text-sm text-indigo-400">{userToDelete.email}</span>
              </p>
              <p className="text-red-400 text-sm mb-6">This action cannot be undone.</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setUserToDelete(null)}
                  disabled={deleting}
                  className="admin-btn admin-btn-secondary disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={deleting}
                  className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {deleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
                      Removing...
                    </>
                  ) : (
                    'Remove User'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
};

export default AnalyticsEditor;
