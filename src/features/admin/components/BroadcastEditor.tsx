
import React, { useState, useEffect } from 'react';
import { AdminHeader, SpeakerphoneIcon, UsersIcon } from './AdminIcons';
import AdminPageLayout from './AdminPageLayout';
import { sendBroadcast } from '@/services/notificationService';
import { db } from '@lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { NotificationFilter } from '@/types';
import { toast } from 'sonner';

const BroadcastEditor: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [fetchingCount, setFetchingCount] = useState(false);
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [type, setType] = useState<'info' | 'warning' | 'success' | 'error' | 'event'>('info');
    const [link, setLink] = useState('');

    // Filter state
    const [branch, setBranch] = useState('All');
    const [year, setYear] = useState('All');
    const [hostel, setHostel] = useState('All');
    const [courseOption, setCourseOption] = useState<'CBCS' | 'NEP' | 'All'>('All');

    const [recipientCount, setRecipientCount] = useState<number | null>(null);
    const [allUsersCache, setAllUsersCache] = useState<any[]>([]);

    // Fetch all users once for client-side filtering (optimization for <1000 users)
    useEffect(() => {
        const fetchUsers = async () => {
            setFetchingCount(true);
            try {
                const snapshot = await getDocs(collection(db, 'users'));
                const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAllUsersCache(users);
            } catch (err) {
                console.error('Failed to fetch users for count preview:', err);
            } finally {
                setFetchingCount(false);
            }
        };
        fetchUsers();
    }, []);

    // Update recipient count when filters change
    useEffect(() => {
        if (allUsersCache.length === 0) return;

        const filtered = allUsersCache.filter(user => {
            // Branch (Case insensitive)
            if (branch !== 'All' && user.branch?.toLowerCase() !== branch.toLowerCase()) return false;
            // Hostel (Case insensitive)
            if (hostel !== 'All' && user.hostel?.toLowerCase() !== hostel.toLowerCase()) return false;
            // Course Option
            if (courseOption !== 'All' && user.courseOption !== courseOption) return false;

            // Year (Email parsing logic reused from notificationService)
            if (year !== 'All') {
                const email = user.email || '';
                const prefix = email.split('@')[0];
                const yearMatch = prefix.match(/^(\d{2})/);
                if (yearMatch && yearMatch[1]) {
                    const yearNum = parseInt(yearMatch[1], 10);
                    const fullYear = yearNum < 50 ? 2000 + yearNum : 1900 + yearNum;
                    if (String(fullYear) !== year) return false;
                } else if (year !== 'Other') {
                    return false;
                }
            }
            return true;
        });

        setRecipientCount(filtered.length);
    }, [branch, year, hostel, courseOption, allUsersCache]);

    const handleSend = async () => {
        if (!title.trim() || !body.trim()) {
            toast.error('Please enter a title and message');
            return;
        }

        // Confirm dialog
        if (!window.confirm(`Are you sure you want to send this broadcast to ${recipientCount} users?`)) {
            return;
        }

        setLoading(true);
        const filter: NotificationFilter = {
            branch: branch === 'All' ? undefined : branch,
            year: year === 'All' ? undefined : year,
            hostel: hostel === 'All' ? undefined : hostel,
            courseOption: courseOption === 'All' ? undefined : courseOption as 'CBCS' | 'NEP',
        };

        const result = await sendBroadcast(filter, title, body, type, link);

        if (result.success) {
            toast.success(`Broadcast sent to ${result.count} users successfully!`);
            // Reset form
            setTitle('');
            setBody('');
            setLink('');
            setType('info');
        } else {
            toast.error(`Failed to send broadcast: ${result.error}`);
        }
        setLoading(false);
    };

    // Mock data for dropdowns (ideally fetched from config)
    const branches = ['All', 'Computer Science and Engineering', 'Mathematics and Computing', 'Electronics and Communication Engineering', 'Electrical Engineering', 'Mechanical Engineering', 'Mining Engineering', 'Petroleum Engineering', 'Chemical Engineering', 'Civil Engineering', 'Applied Geology', 'Applied Geophysics', 'Physics', 'Mathematics', 'Chemistry'];
    const hostels = ['All', 'Amber', 'Diamond', 'Jasper', 'Opal', 'Rosaline', 'Ruby', 'Sapphire', 'Topaz']; // Example list
    const years = ['All', '2026', '2025', '2024', '2023', 'Other'];

    return (
        <AdminPageLayout>
            <AdminHeader
                icon={<SpeakerphoneIcon />}
                title="Broadcast Messages"
                subtitle="Send targeted notifications to students"
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Compose */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="admin-card">
                        <h3 className="text-lg font-semibold text-white mb-4">Compose Message</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g., Important: Semester Registration"
                                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Message Body</label>
                                <textarea
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    rows={6}
                                    placeholder="Enter your message here..."
                                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Type</label>
                                    <select
                                        value={type}
                                        onChange={(e) => setType(e.target.value as any)}
                                        className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                                    >
                                        <option value="info">Information (Blue)</option>
                                        <option value="warning">Warning (Yellow)</option>
                                        <option value="error">Urgent/Error (Red)</option>
                                        <option value="success">Success (Green)</option>
                                        <option value="event">Event (Purple)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Link (Optional)</label>
                                    <input
                                        type="text"
                                        value={link}
                                        onChange={(e) => setLink(e.target.value)}
                                        placeholder="https://..."
                                        className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button
                                    onClick={handleSend}
                                    disabled={loading || recipientCount === 0}
                                    className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${loading || recipientCount === 0
                                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/20'
                                        }`}
                                >
                                    {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                    Send Broadcast
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Audience Filters & Preview */}
                <div className="space-y-6">
                    <div className="admin-card">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">Target Audience</h3>
                            <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
                                <UsersIcon />
                                <span className="text-sm font-medium text-blue-400">
                                    {fetchingCount ? '...' : (recipientCount ?? 0)} recipients
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Admission Year</label>
                                <select
                                    value={year}
                                    onChange={(e) => setYear(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                                >
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Course Type</label>
                                <select
                                    value={courseOption}
                                    onChange={(e) => setCourseOption(e.target.value as any)}
                                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                                >
                                    <option value="All">All Courses</option>
                                    <option value="CBCS">CBCS (Old)</option>
                                    <option value="NEP">NEP (New)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Branch</label>
                                <select
                                    value={branch}
                                    onChange={(e) => setBranch(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                                >
                                    {branches.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Hostel</label>
                                <select
                                    value={hostel}
                                    onChange={(e) => setHostel(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                                >
                                    {hostels.map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Live Preview Card */}
                    <div className="admin-card bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
                        <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Preview</h3>
                        <div className={`p-4 rounded-xl border ${type === 'info' ? 'bg-blue-500/10 border-blue-500/20 text-blue-100' :
                            type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-100' :
                                type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-100' :
                                    type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-100' :
                                        'bg-purple-500/10 border-purple-500/20 text-purple-100'
                            }`}>
                            <div className="flex items-start gap-3">
                                <div className="flex-1">
                                    <h4 className="font-semibold mb-1">{title || 'Message Title'}</h4>
                                    <p className="text-sm opacity-90">{body || 'Message body will appear here...'}</p>
                                    {link && (
                                        <div className="mt-2 text-xs opacity-75 underline truncate">
                                            {link}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminPageLayout>
    );
};

export default BroadcastEditor;
