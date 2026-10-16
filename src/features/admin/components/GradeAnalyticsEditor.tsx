import { BarChart3, ChevronRight, Search } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';

import { AXIS_COLOR, TOOLTIP_STYLE } from '../chartTheme';
import { useAllUsers } from '../hooks/useAllUsers';
import { usePagination } from '../hooks/usePagination';
import { admissionYear } from '../utils';
import { AdminHeader, AdminPageLayout, Pagination } from './ui';

import { User } from '@/types';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
const CGPA_BUCKETS = ['9-10', '8-9', '7-8', '6-7', '< 6'];

const cgpaBucket = (cgpa: number) =>
  cgpa >= 9 ? '9-10' : cgpa >= 8 ? '8-9' : cgpa >= 7 ? '7-8' : cgpa >= 6 ? '6-7' : '< 6';
const hasGrades = (user: User) => typeof user.gradesData?.cgpa !== 'undefined';
const batchOf = (user: User) => user.year?.trim() || admissionYear(user.email);
const normalizedBranch = (user: User) => (user.branch || 'Unknown').trim().toUpperCase();
const isPassing = (grade: string) => grade !== 'F' && grade !== 'W';

// Prefer the stored total; otherwise sum each passed course once across semesters
const calculateTotalCredits = (user: User): number | 'N/A' => {
  if (user.gradesData?.earnedCredits !== undefined) return user.gradesData.earnedCredits;
  const seen = new Set<string>();
  let credits = 0;
  user.gradesData?.semesters?.forEach((sem) =>
    sem.grades?.forEach((g) => {
      if (!seen.has(g.subjectCode) && isPassing(g.grade)) {
        seen.add(g.subjectCode);
        credits += g.credits || 0;
      }
    })
  );
  return credits > 0 ? credits : 'N/A';
};

const passPercentage = (user: User) => {
  const grades = user.gradesData?.semesters?.flatMap((sem) => sem.grades ?? []);
  if (!grades?.length) return 'N/A';
  return `${Math.round((grades.filter((g) => isPassing(g.grade)).length / grades.length) * 100)}%`;
};

const Avatar: React.FC<{ user: User; className: string }> = ({ user, className }) => (
  <div
    className={`rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white overflow-hidden ${className}`}
  >
    {user.profilePicture ? (
      <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
    ) : (
      user.name.charAt(0)
    )}
  </div>
);

const GradeAnalyticsEditor: React.FC = () => {
  const { users, loading, error, refresh } = useAllUsers();
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [filterBatch, setFilterBatch] = useState('All');
  const [filterBranch, setFilterBranch] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortAscending, setSortAscending] = useState(false);

  const stats = useMemo(() => {
    const graded = users.filter(hasGrades);
    const cgpas = graded.map((u) => u.gradesData?.cgpa || 0);

    const branchTotals: Record<string, { total: number; count: number }> = {};
    graded.forEach((u) => {
      const entry = (branchTotals[normalizedBranch(u)] ??= { total: 0, count: 0 });
      entry.total += u.gradesData?.cgpa || 0;
      entry.count += 1;
    });

    return {
      graded,
      averageCGPA: cgpas.length ? cgpas.reduce((a, b) => a + b, 0) / cgpas.length : 0,
      highestCGPA: Math.max(...cgpas, 0),
      branchDistribution: Object.entries(branchTotals)
        .map(([name, { total, count }]) => ({
          name,
          avgCGPA: parseFloat((total / count).toFixed(2)),
          count,
        }))
        .sort((a, b) => b.avgCGPA - a.avgCGPA),
      cgpaDistribution: CGPA_BUCKETS.map((name) => ({
        name,
        value: cgpas.filter((c) => cgpaBucket(c) === name).length,
      })),
    };
  }, [users]);

  const query = searchQuery.toLowerCase();
  const filteredUsers = stats.graded
    .filter(
      (u) =>
        (!query ||
          u.name.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          u.admissionNumber?.toLowerCase().includes(query)) &&
        (filterBranch === 'All' || normalizedBranch(u) === filterBranch) &&
        (filterBatch === 'All' || batchOf(u) === filterBatch)
    )
    .sort((a, b) => {
      // Students without a CGPA sort last when descending
      const diff = (a.gradesData?.cgpa || -1) - (b.gradesData?.cgpa || -1);
      return sortAscending ? diff : -diff;
    });
  const pager = usePagination(filteredUsers, 20);

  const uniqueBranches = [
    ...new Set(users.flatMap((u) => u.branch?.trim().toUpperCase() || [])),
  ].sort();
  const uniqueBatches = [...new Set(users.flatMap((u) => batchOf(u) ?? []))].sort();

  if (error) {
    return (
      <div className="p-8 text-center text-red-400 bg-red-900/10 rounded-xl border border-red-900/20">
        <p className="text-xl font-bold mb-2">Error</p>
        <p>{error}</p>
        <button
          onClick={refresh}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const kpis = [
    {
      label: 'Total Users',
      value: users.length,
      note: 'Fetched records',
      accent: 'border-slate-500',
      noteColor: 'text-slate-400',
    },
    {
      label: 'Average CGPA',
      value: stats.averageCGPA.toFixed(2),
      note: 'Institution-wide',
      accent: 'border-blue-500',
      noteColor: 'text-blue-400',
    },
    {
      label: 'Top Performer',
      value: stats.highestCGPA.toFixed(2),
      note: 'Highest recorded CGPA',
      accent: 'border-emerald-500',
      noteColor: 'text-emerald-400',
    },
    {
      label: 'Students Tracked',
      value: stats.graded.length,
      note: 'with uploaded grade data',
      accent: 'border-purple-500',
      noteColor: 'text-purple-400',
    },
  ];
  const filterSelect =
    'admin-input py-2.5 px-3 w-full md:w-44 cursor-pointer bg-slate-800/50 hover:bg-slate-800 transition-colors border-slate-600';

  return (
    <AdminPageLayout>
      <AdminHeader
        icon={BarChart3}
        title="Learning Analytics"
        subtitle="Insights into student academic performance across the institution"
      >
        <button
          onClick={refresh}
          className="admin-btn admin-btn-secondary text-sm"
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </AdminHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {kpis.map(({ label, value, note, accent, noteColor }) => (
          <div key={label} className={`admin-card p-6 border-l-4 ${accent}`}>
            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">{label}</p>
            <h3 className="text-3xl font-bold text-white mt-1">{value}</h3>
            <p className={`${noteColor} text-xs mt-2`}>{note}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="admin-card">
          <h3 className="text-lg font-semibold text-white mb-6">CGPA Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.cgpaDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis dataKey="name" stroke={AXIS_COLOR} />
              <YAxis stroke={AXIS_COLOR} />
              <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: '#f8fafc' }} />
              <Bar dataKey="value" fill="#8884d8" name="Students">
                {stats.cgpaDistribution.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="admin-card">
          <h3 className="text-lg font-semibold text-white mb-6">Performance by Branch</h3>
          {/* Grows with the number of branches so labels never overlap */}
          <div
            style={{ width: '100%', height: Math.max(400, stats.branchDistribution.length * 35) }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.branchDistribution}
                layout="vertical"
                margin={{ left: 10, right: 30, top: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis type="number" domain={[0, 10]} stroke={AXIS_COLOR} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={220}
                  stroke={AXIS_COLOR}
                  fontSize={11}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value) => [Number(value).toFixed(2), 'Avg CGPA']}
                />
                <Bar dataKey="avgCGPA" fill="#82ca9d" radius={[0, 4, 4, 0]} barSize={24}>
                  <Cell fill="#10b981" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="admin-card overflow-hidden">
        <div className="p-4 border-b border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
            <h3 className="text-lg font-semibold text-white whitespace-nowrap">Student List</h3>
            <div className="relative w-full sm:w-96 group">
              <input
                type="text"
                placeholder="Search student by name, email, or ID..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  pager.setPage(1);
                }}
                className="admin-input !pl-12 pr-4 py-2.5 w-full bg-slate-800/50 focus:bg-slate-800 border-slate-600 focus:border-blue-500 transition-all shadow-sm group-hover:shadow-md"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <select
              value={filterBranch}
              onChange={(e) => {
                setFilterBranch(e.target.value);
                pager.setPage(1);
              }}
              className={filterSelect}
            >
              <option value="All">All Branches</option>
              {uniqueBranches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <select
              value={filterBatch}
              onChange={(e) => {
                setFilterBatch(e.target.value);
                pager.setPage(1);
              }}
              className={filterSelect}
            >
              <option value="All">Batches</option>
              {uniqueBatches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mobile/Tablet Grid View */}
        <div className="p-4 block lg:hidden">
          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-slate-800/20 rounded-xl border border-dashed border-slate-700">
              <p className="text-lg font-medium text-slate-400">No students found</p>
              <p className="text-sm mt-1">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pager.pageItems.map((user) => (
                <div
                  key={user.id}
                  className="bg-slate-800/40 border border-slate-700 rounded-xl p-5 hover:border-blue-500/50 hover:bg-slate-800/60 transition-all group relative overflow-hidden"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar user={user} className="w-10 h-10 text-sm shadow-lg shrink-0" />
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-200 text-sm truncate pr-2 group-hover:text-blue-400 transition-colors">
                        {user.name}
                      </h4>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs mb-4">
                    <div>
                      <span className="block text-slate-500 mb-0.5">Branch</span>
                      <span className="font-medium text-slate-300">{user.branch || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="block text-slate-500 mb-0.5">Batch</span>
                      <span className="font-medium text-slate-300">{batchOf(user) ?? 'N/A'}</span>
                    </div>
                    <div>
                      <span className="block text-slate-500 mb-0.5">Credits</span>
                      <span className="font-medium text-slate-300">
                        {calculateTotalCredits(user)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-500 mb-0.5">CGPA</span>
                      {typeof user.gradesData?.cgpa === 'number' ? (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            user.gradesData.cgpa >= 8.5
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : user.gradesData.cgpa >= 7.0
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {user.gradesData.cgpa.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">N/A</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-700/50 flex justify-end">
                    <button
                      onClick={() => setSelectedStudent(user)}
                      className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 opacity-80 group-hover:opacity-100"
                    >
                      View Details
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-800/50 text-gray-400 text-xs uppercase tracking-wider border-b border-gray-700">
                <th className="p-4 font-semibold">Student</th>
                <th className="p-4 font-semibold hidden md:table-cell">Branch</th>
                <th className="p-4 font-semibold hidden md:table-cell">Batch</th>
                <th
                  className="p-4 font-semibold cursor-pointer hover:text-white flex items-center gap-1"
                  onClick={() => setSortAscending(!sortAscending)}
                >
                  CGPA <span>{sortAscending ? '↑' : '↓'}</span>
                </th>
                <th className="p-4 font-semibold text-right hidden lg:table-cell">Credits</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No students found matching filters.
                  </td>
                </tr>
              ) : (
                pager.pageItems.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-700/30 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar user={user} className="w-8 h-8 text-xs" />
                        <div>
                          <div className="text-sm font-medium text-gray-200">{user.name}</div>
                          <div className="text-xs text-gray-500 hidden sm:block">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-300 hidden md:table-cell">
                      {user.branch || '-'}
                    </td>
                    <td className="p-4 text-sm text-gray-300 hidden md:table-cell">
                      {batchOf(user) ?? '-'}
                    </td>
                    <td className="p-4">
                      {typeof user.gradesData?.cgpa === 'number' ? (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.gradesData.cgpa >= 8.5
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : user.gradesData.cgpa >= 7.0
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}
                        >
                          {user.gradesData.cgpa.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-600 text-xs italic">N/A</span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-gray-400 text-right hidden lg:table-cell">
                      {calculateTotalCredits(user)}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedStudent(user)}
                        className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination {...pager} label="students" />

      {/* Student Details Modal */}
      {selectedStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedStudent(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-700 bg-slate-800/50 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <Avatar user={selectedStudent} className="w-16 h-16 text-xl shadow-lg" />
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedStudent.name}</h2>
                  <div className="flex gap-4 text-sm text-slate-400 mt-1">
                    <span>{selectedStudent.admissionNumber || selectedStudent.email}</span>
                    <span>•</span>
                    <span>{selectedStudent.branch || 'Unknown Branch'}</span>
                    <span>•</span>
                    <span>Batch {selectedStudent.year || 'Unknown'}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">
                  {selectedStudent.gradesData?.cgpa?.toFixed(2) || 'N/A'}
                </div>
                <div className="text-xs text-slate-400 uppercase tracking-wider">CGPA</div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  ['Pass Percentage', passPercentage(selectedStudent)],
                  ['Total Credits', calculateTotalCredits(selectedStudent)],
                  ['Semesters', selectedStudent.gradesData?.semesters?.length || 0],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50"
                  >
                    <div className="text-slate-400 text-xs uppercase mb-1">{label}</div>
                    <div className="text-xl font-bold text-white">{value}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-6">
                {selectedStudent.gradesData?.semesters?.map((sem, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-800/30 rounded-xl border border-slate-700 overflow-hidden"
                  >
                    <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-white">Semester {sem.semester}</h3>
                        <p className="text-xs text-slate-400">
                          {sem.sessionType} {sem.sessionYear}
                        </p>
                      </div>
                      <div className="flex gap-4 text-right">
                        <div>
                          <div className="text-lg font-bold text-white">
                            {typeof sem.sgpa === 'number' ? sem.sgpa.toFixed(2) : 'N/A'}
                          </div>
                          <div className="text-[10px] text-slate-400 uppercase">SGPA</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-slate-300">
                            {typeof sem.cgpa === 'number' ? sem.cgpa.toFixed(2) : 'N/A'}
                          </div>
                          <div className="text-[10px] text-slate-400 uppercase">CGPA</div>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase">
                          <tr>
                            <th className="p-3 font-medium">Course Code</th>
                            <th className="p-3 font-medium">Course Name</th>
                            <th className="p-3 font-medium text-center">Credits</th>
                            <th className="p-3 font-medium text-center">Grade</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                          {sem.grades?.map((grade, gIdx) => (
                            <tr key={gIdx} className="hover:bg-slate-700/20">
                              <td className="p-3 font-mono text-slate-300">{grade.subjectCode}</td>
                              <td className="p-3 text-slate-200">{grade.subjectName}</td>
                              <td className="p-3 text-center text-slate-400">{grade.credits}</td>
                              <td className="p-3 text-center">
                                <span
                                  className={`inline-block w-8 py-0.5 rounded text-xs font-bold ${
                                    grade.grade === 'F'
                                      ? 'bg-red-900/50 text-red-400 border border-red-900'
                                      : grade.grade === 'A+' || grade.grade === 'A'
                                        ? 'bg-green-900/30 text-green-400 border border-green-900/50'
                                        : 'bg-slate-700 text-slate-300 border border-slate-600'
                                  }`}
                                >
                                  {grade.grade}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-12 text-slate-500">
                    No semester data available.
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex justify-end">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
};

export default GradeAnalyticsEditor;
