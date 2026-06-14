import React, { useState, useEffect } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    Cell
} from 'recharts';
import { db } from '@lib/firebase';
import { User } from '@/types';
import { AdminHeader, ChartBarIcon } from './AdminIcons';
import AdminPageLayout from './AdminPageLayout';

// Mock data for development if needed, but we'll fetch real data
// const MOCK_DATA = ...

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// Helper to calculate total credits consistently
const calculateTotalCredits = (user: User): number | 'N/A' => {
    if (user.gradesData?.earnedCredits !== undefined) {
        return user.gradesData.earnedCredits;
    }
    // Fallback: Calculate from semesters if available
    if (user.gradesData?.semesters && user.gradesData.semesters.length > 0) {
        const uniqueCourses = new Set<string>();
        let calculatedCredits = 0;

        user.gradesData.semesters.forEach(sem => {
            sem.grades?.forEach(g => {
                // Simple unique check by subject code
                if (!uniqueCourses.has(g.subjectCode) && g.grade !== 'F' && g.grade !== 'W') {
                    uniqueCourses.add(g.subjectCode);
                    calculatedCredits += (g.credits || 0);
                }
            });
        });
        return calculatedCredits > 0 ? calculatedCredits : 'N/A';
    }
    return 'N/A';
};

const GradeAnalyticsEditor: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedStudent, setSelectedStudent] = useState<User | null>(null);

    // Analytics State
    const [stats, setStats] = useState({
        averageCGPA: 0,
        highestCGPA: 0,
        totalStudentsWithGrades: 0,
        batchDistribution: [] as { name: string; avgCGPA: number; count: number }[],
        branchDistribution: [] as { name: string; avgCGPA: number; count: number }[],
        cgpaDistribution: [] as { name: string; value: number }[],
    });

    const [filterBatch, setFilterBatch] = useState('All');
    const [filterBranch, setFilterBranch] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof User | 'cgpa'; direction: 'asc' | 'desc' }>({ key: 'cgpa', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // In a real app with thousands of users, we'd want pagination or backend aggregation
            // For now, fetching all users to process client-side as requested
            const snapshot = await db.collection('users').get();
            const fetchedUsers: User[] = [];

            snapshot.forEach(doc => {
                const data = doc.data() as User;

                // Include all users to match User Analytics count
                // The analytics processing will handle users without grades (showing N/A)
                fetchedUsers.push({ ...data, id: doc.id });
            });

            setUsers(fetchedUsers);
            processAnalytics(fetchedUsers);
        } catch (err) {
            console.error("Error fetching users:", err);
            setError("Failed to load student data");
        } finally {
            setLoading(false);
        }
    };

    const processAnalytics = (data: User[]) => {
        // Filter users who have at least some grade data structure
        // We'll be more lenient here to catch users with 0 CGPA if valid
        const studentsWithGrades = data.filter(u => u.gradesData && typeof u.gradesData.cgpa !== 'undefined');

        // 1. Overall Stats
        const totalCGPA = studentsWithGrades.reduce((sum, u) => sum + (u.gradesData?.cgpa || 0), 0);
        const averageCGPA = studentsWithGrades.length > 0 ? totalCGPA / studentsWithGrades.length : 0;
        const highestCGPA = Math.max(...studentsWithGrades.map(u => u.gradesData?.cgpa || 0), 0);

        // 2. Branch Distribution
        const branchMap: Record<string, { totalCGPA: number; count: number }> = {};
        studentsWithGrades.forEach(u => {
            // Normalize branch: trim and uppercase
            const rawBranch = u.branch || 'Unknown';
            const branch = rawBranch.trim().toUpperCase();

            if (!branchMap[branch]) branchMap[branch] = { totalCGPA: 0, count: 0 };
            branchMap[branch]!.totalCGPA += (u.gradesData?.cgpa || 0);
            branchMap[branch]!.count += 1;
        });

        const branchDistribution = Object.entries(branchMap).map(([name, data]) => ({
            name,
            avgCGPA: parseFloat((data.totalCGPA / data.count).toFixed(2)),
            count: data.count
        })).sort((a, b) => b.avgCGPA - a.avgCGPA);

        // 3. Batch (Year) Distribution
        const batchMap: Record<string, { totalCGPA: number; count: number }> = {};
        studentsWithGrades.forEach(u => {
            // Infer batch from Other data if year is not explicitly set, or email
            let year = u.year || 'Unknown';
            if (year === 'Unknown' && u.email) {
                // Try to extract from email like '22je...' -> 2022
                const match = u.email.match(/^(\d{2})/);
                if (match) year = '20' + match[1];
            }
            // Normalize year just in case
            year = year.trim();

            if (!batchMap[year]) batchMap[year] = { totalCGPA: 0, count: 0 };
            batchMap[year]!.totalCGPA += (u.gradesData?.cgpa || 0);
            batchMap[year]!.count += 1;
        });

        const batchDistribution = Object.entries(batchMap).map(([name, data]) => ({
            name,
            avgCGPA: parseFloat((data.totalCGPA / data.count).toFixed(2)),
            count: data.count
        })).sort((a, b) => a.name.localeCompare(b.name));

        // 4. CGPA Range Distribution
        const ranges = {
            '9-10': 0,
            '8-9': 0,
            '7-8': 0,
            '6-7': 0,
            '< 6': 0
        };
        studentsWithGrades.forEach(u => {
            const cgpa = u.gradesData?.cgpa || 0;
            if (cgpa >= 9) ranges['9-10']++;
            else if (cgpa >= 8) ranges['8-9']++;
            else if (cgpa >= 7) ranges['7-8']++;
            else if (cgpa >= 6) ranges['6-7']++;
            else ranges['< 6']++;
        });

        const cgpaDistribution = Object.entries(ranges).map(([name, value]) => ({ name, value }));

        setStats({
            averageCGPA,
            highestCGPA,
            totalStudentsWithGrades: studentsWithGrades.length,
            branchDistribution,
            batchDistribution,
            cgpaDistribution
        });
    };

    const getFilteredUsers = () => {
        let filtered = [...users];

        // Only show students with valid grade data (uploaded gradesheets/parsed data)
        filtered = filtered.filter(u => u.gradesData && typeof u.gradesData.cgpa !== 'undefined');

        // Apply filters
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(u =>
                u.name.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q) ||
                (u.admissionNumber && u.admissionNumber.toLowerCase().includes(q))
            );
        }

        if (filterBranch !== 'All') {
            filtered = filtered.filter(u => {
                const b = u.branch ? u.branch.trim().toUpperCase() : 'UNKNOWN';
                return b === filterBranch;
            });
        }
        if (filterBatch !== 'All') {
            filtered = filtered.filter(u => {
                // Same batch inference logic as above, or ensure data quality
                let year = u.year;
                if (!year && u.email) {
                    const match = u.email.match(/^(\d{2})/);
                    if (match) year = '20' + match[1];
                }
                return year ? year.trim() === filterBatch : false;
            });
        }

        // Sort
        filtered.sort((a, b) => {
            let aVal: any = a[sortConfig.key as keyof User];
            let bVal: any = b[sortConfig.key as keyof User];

            if (sortConfig.key === 'cgpa') {
                aVal = a.gradesData?.cgpa || -1; // -1 for no grades so they go to bottom in desc
                bVal = b.gradesData?.cgpa || -1;
            }

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    };

    const filteredUsers = getFilteredUsers();

    // Pagination Logic
    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterBranch, filterBatch]);

    // Unique branches and batches for filter dropdowns - NORMALIZED
    const uniqueBranches = Array.from(new Set(users.map(u => u.branch ? u.branch.trim().toUpperCase() : '').filter(Boolean))).sort();
    const uniqueBatches = Array.from(new Set(users.map(u => {
        if (u.year) return u.year.trim();
        if (u.email) {
            const match = u.email.match(/^(\d{2})/);
            if (match) return '20' + match[1];
        }
        return null;
    }).filter(Boolean))).sort() as string[];


    if (error) {
        return (
            <div className="p-8 text-center text-red-400 bg-red-900/10 rounded-xl border border-red-900/20">
                <p className="text-xl font-bold mb-2">Error</p>
                <p>{error}</p>
                <button
                    onClick={fetchData}
                    className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <AdminPageLayout>
            <AdminHeader
                icon={<ChartBarIcon />}
                title="Learning Analytics"
                subtitle="Insights into student academic performance across the institution"
            >
                <button
                    onClick={fetchData}
                    className="admin-btn admin-btn-secondary text-sm"
                    disabled={loading}
                >
                    {loading ? 'Refreshing...' : 'Refresh Data'}
                </button>
            </AdminHeader>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="admin-card p-6 border-l-4 border-slate-500">
                    <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Total Users</p>
                    <h3 className="text-3xl font-bold text-white mt-1">{users.length}</h3>
                    <p className="text-slate-400 text-xs mt-2">Fetched records</p>
                </div>
                <div className="admin-card p-6 border-l-4 border-blue-500">
                    <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Average CGPA</p>
                    <h3 className="text-3xl font-bold text-white mt-1">{stats.averageCGPA.toFixed(2)}</h3>
                    <p className="text-blue-400 text-xs mt-2">Institution-wide</p>
                </div>
                <div className="admin-card p-6 border-l-4 border-emerald-500">
                    <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Top Performer</p>
                    <h3 className="text-3xl font-bold text-white mt-1">{stats.highestCGPA.toFixed(2)}</h3>
                    <p className="text-emerald-400 text-xs mt-2">Highest recorded CGPA</p>
                </div>
                <div className="admin-card p-6 border-l-4 border-purple-500">
                    <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Students Tracked</p>
                    <h3 className="text-3xl font-bold text-white mt-1">{stats.totalStudentsWithGrades}</h3>
                    <p className="text-purple-400 text-xs mt-2">with uploaded grade data</p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* CGPA Distribution */}
                <div className="admin-card">
                    <h3 className="text-lg font-semibold text-white mb-6">CGPA Distribution</h3>
                    <div style={{ width: '100%', minHeight: 300 }}>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stats.cgpaDistribution}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                                <XAxis dataKey="name" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                    itemStyle={{ color: '#f8fafc' }}
                                />
                                <Bar dataKey="value" fill="#8884d8" name="Students">
                                    {stats.cgpaDistribution.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Branch / Batch Performance */}
                <div className="admin-card">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-white">Performance by Branch</h3>
                        {/* Could add a toggle here for Branch vs Batch charts if needed */}
                    </div>

                    <div style={{ width: '100%', height: Math.max(400, stats.branchDistribution.length * 35) }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.branchDistribution} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} horizontal={true} vertical={true} />
                                <XAxis type="number" domain={[0, 10]} stroke="#94a3b8" />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={220}
                                    stroke="#94a3b8"
                                    fontSize={11}
                                    tick={{ fontSize: 11 }}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                    formatter={(value: any) => [Number(value).toFixed(2), 'Avg CGPA']}
                                />
                                <Bar dataKey="avgCGPA" fill="#82ca9d" radius={[0, 4, 4, 0]} barSize={24}>
                                    <Cell fill="#10b981" />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Student List Table */}
            <div className="admin-card overflow-hidden">
                <div className="p-4 border-b border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
                        <h3 className="text-lg font-semibold text-white whitespace-nowrap">Student List</h3>

                        {/* Search Bar - Moved to Left */}
                        <div className="relative w-full sm:w-96 group">
                            <input
                                type="text"
                                placeholder="Search student by name, email, or ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="admin-input !pl-12 pr-4 py-2.5 w-full bg-slate-800/50 focus:bg-slate-800 border-slate-600 focus:border-blue-500 transition-all shadow-sm group-hover:shadow-md"
                            />
                            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                        <select
                            value={filterBranch}
                            onChange={(e) => setFilterBranch(e.target.value)}
                            className="admin-input py-2.5 px-3 w-full md:w-44 cursor-pointer bg-slate-800/50 hover:bg-slate-800 transition-colors border-slate-600"
                        >
                            <option value="All">All Branches</option>
                            {uniqueBranches.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>

                        <select
                            value={filterBatch}
                            onChange={(e) => setFilterBatch(e.target.value)}
                            className="admin-input py-2.5 px-3 w-full md:w-44 cursor-pointer bg-slate-800/50 hover:bg-slate-800 transition-colors border-slate-600"
                        >
                            <option value="All">Batches</option>
                            {uniqueBatches.map(b => <option key={b} value={b}>{b}</option>)}
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
                            {paginatedUsers.map((user) => (
                                <div
                                    key={user.id}
                                    className="bg-slate-800/40 border border-slate-700 rounded-xl p-5 hover:border-blue-500/50 hover:bg-slate-800/60 transition-all group relative overflow-hidden"
                                >
                                    {/* Header: Avatar & Basic Info */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white shadow-lg overflow-hidden shrink-0">
                                                {user.profilePicture ? (
                                                    <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    user.name.charAt(0)
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-slate-200 text-sm truncate pr-2 group-hover:text-blue-400 transition-colors">
                                                    {user.name}
                                                </h4>
                                                <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs mb-4">
                                        <div>
                                            <span className="block text-slate-500 mb-0.5">Branch</span>
                                            <span className="font-medium text-slate-300">{user.branch || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="block text-slate-500 mb-0.5">Batch</span>
                                            <span className="font-medium text-slate-300">
                                                {(() => {
                                                    if (user.year) return user.year;
                                                    if (user.email) {
                                                        const match = user.email.match(/^(\d{2})/);
                                                        if (match) return '20' + match[1];
                                                    }
                                                    return 'N/A';
                                                })()}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="block text-slate-500 mb-0.5">Credits</span>
                                            <span className="font-medium text-slate-300">{calculateTotalCredits(user)}</span>
                                        </div>
                                        <div>
                                            <span className="block text-slate-500 mb-0.5">CGPA</span>
                                            {typeof user.gradesData?.cgpa === 'number' ? (
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${user.gradesData.cgpa >= 8.5 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                    user.gradesData.cgpa >= 7.0 ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                    }`}>
                                                    {user.gradesData.cgpa.toFixed(2)}
                                                </span>
                                            ) : (
                                                <span className="text-slate-500 italic">N/A</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Footer */}
                                    <div className="pt-3 border-t border-slate-700/50 flex justify-end">
                                        <button
                                            onClick={() => setSelectedStudent(user)}
                                            className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 opacity-80 group-hover:opacity-100"
                                        >
                                            View Details
                                            <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
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
                                    onClick={() => setSortConfig({ key: 'cgpa', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                                >
                                    CGPA
                                    {sortConfig.key === 'cgpa' && (
                                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                    )}
                                </th>
                                <th className="p-4 font-semibold text-right hidden lg:table-cell">Credits</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/50">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">No students found matching filters.</td>
                                </tr>
                            ) : (
                                paginatedUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-700/30 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                                                    {user.profilePicture ? (
                                                        <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        user.name.charAt(0)
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-200">{user.name}</div>
                                                    <div className="text-xs text-gray-500 hidden sm:block">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-300 hidden md:table-cell">{user.branch || '-'}</td>
                                        <td className="p-4 text-sm text-gray-300 hidden md:table-cell">
                                            {(() => {
                                                if (user.year) return user.year;
                                                if (user.email) {
                                                    const match = user.email.match(/^(\d{2})/);
                                                    if (match) return '20' + match[1];
                                                }
                                                return '-';
                                            })()}
                                        </td>
                                        <td className="p-4">
                                            {typeof user.gradesData?.cgpa === 'number' ? (
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.gradesData.cgpa >= 8.5 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                    user.gradesData.cgpa >= 7.0 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                    }`}>
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

                {/* Pagination could go here */}
                <div className="p-4 border-t border-gray-700 bg-slate-800/30 text-xs text-gray-500 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <span>
                        Showing <span className="font-medium text-white">{Math.min(startIndex + 1, filteredUsers.length)}</span> to <span className="font-medium text-white">{Math.min(startIndex + ITEMS_PER_PAGE, filteredUsers.length)}</span> of <span className="font-medium text-white">{filteredUsers.length}</span> students
                    </span>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-white transition-colors"
                        >
                            Previous
                        </button>
                        <span className="text-slate-400">Page <span className="text-white font-medium">{currentPage}</span> of {totalPages || 1}</span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-white transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Student Details Modal */}
            {selectedStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedStudent(null)}>
                    <div
                        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-700 bg-slate-800/50 flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white overflow-hidden shadow-lg">
                                    {selectedStudent.profilePicture ? (
                                        <img src={selectedStudent.profilePicture} alt={selectedStudent.name} className="w-full h-full object-cover" />
                                    ) : (
                                        selectedStudent.name.charAt(0)
                                    )}
                                </div>
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

                        {/* Modal Content - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                    <div className="text-slate-400 text-xs uppercase mb-1">Pass Percentage</div>
                                    <div className="text-xl font-bold text-white">
                                        {(() => {
                                            if (!selectedStudent.gradesData?.semesters) return 'N/A';
                                            let total = 0;
                                            let passed = 0;
                                            selectedStudent.gradesData.semesters.forEach(sem => {
                                                sem.grades?.forEach(g => {
                                                    total++;
                                                    if (g.grade !== 'F' && g.grade !== 'W') passed++;
                                                });
                                            });
                                            return total ? Math.round((passed / total) * 100) + '%' : 'N/A';
                                        })()}
                                    </div>
                                </div>
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                    <div className="text-slate-400 text-xs uppercase mb-1">Total Credits</div>
                                    <div className="text-xl font-bold text-white">
                                        {calculateTotalCredits(selectedStudent)}
                                    </div>
                                </div>
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                    <div className="text-slate-400 text-xs uppercase mb-1">Semesters</div>
                                    <div className="text-xl font-bold text-white">
                                        {selectedStudent.gradesData?.semesters?.length || 0}
                                    </div>
                                </div>
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                    <div className="text-slate-400 text-xs uppercase mb-1">Updates</div>
                                    <div className="text-xl font-bold text-white">
                                        {selectedStudent.gradesData?.semesters?.length || 0}
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Semester List */}
                            <div className="space-y-6">
                                {selectedStudent.gradesData?.semesters?.map((sem, idx) => (
                                    <div key={idx} className="bg-slate-800/30 rounded-xl border border-slate-700 overflow-hidden">
                                        <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex justify-between items-center">
                                            <div>
                                                <h3 className="font-bold text-white">Semester {sem.semester}</h3>
                                                <p className="text-xs text-slate-400">{sem.sessionType} {sem.sessionYear}</p>
                                            </div>
                                            <div className="flex gap-4 text-right">
                                                <div>
                                                    <div className="text-lg font-bold text-white">{typeof sem.sgpa === 'number' ? sem.sgpa.toFixed(2) : 'N/A'}</div>
                                                    <div className="text-[10px] text-slate-400 uppercase">SGPA</div>
                                                </div>
                                                <div>
                                                    <div className="text-lg font-bold text-slate-300">{typeof sem.cgpa === 'number' ? sem.cgpa.toFixed(2) : 'N/A'}</div>
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
                                                                <span className={`inline-block w-8 py-0.5 rounded text-xs font-bold ${grade.grade === 'F' ? 'bg-red-900/50 text-red-400 border border-red-900' :
                                                                    grade.grade === 'A+' || grade.grade === 'A' ? 'bg-green-900/30 text-green-400 border border-green-900/50' :
                                                                        'bg-slate-700 text-slate-300 border border-slate-600'
                                                                    }`}>
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

                        {/* Footer */}
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
