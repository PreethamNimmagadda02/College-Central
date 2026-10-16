import { Megaphone, Users } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

import { useAllUsers } from '../hooks/useAllUsers';
import { admissionYear } from '../utils';
import { AdminHeader, AdminPageLayout } from './ui';

import { sendBroadcast } from '@/services/notificationService';
import { NotificationFilter } from '@/types';

type BroadcastType = 'info' | 'warning' | 'success' | 'error' | 'event';

// [option label, preview classes]
const TYPES: Record<BroadcastType, [string, string]> = {
  info: ['Information (Blue)', 'bg-blue-500/10 border-blue-500/20 text-blue-100'],
  warning: ['Warning (Yellow)', 'bg-yellow-500/10 border-yellow-500/20 text-yellow-100'],
  error: ['Urgent/Error (Red)', 'bg-red-500/10 border-red-500/20 text-red-100'],
  success: ['Success (Green)', 'bg-emerald-500/10 border-emerald-500/20 text-emerald-100'],
  event: ['Event (Purple)', 'bg-purple-500/10 border-purple-500/20 text-purple-100'],
};

// Mock data for dropdowns (ideally fetched from config)
const BRANCHES = [
  'All',
  'Computer Science and Engineering',
  'Mathematics and Computing',
  'Electronics and Communication Engineering',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Mining Engineering',
  'Petroleum Engineering',
  'Chemical Engineering',
  'Civil Engineering',
  'Applied Geology',
  'Applied Geophysics',
  'Physics',
  'Mathematics',
  'Chemistry',
];
const HOSTELS = [
  'All',
  'Amber',
  'Diamond',
  'Jasper',
  'Opal',
  'Rosaline',
  'Ruby',
  'Sapphire',
  'Topaz',
];
const YEARS = ['All', '2026', '2025', '2024', '2023', 'Other'];

const fieldClass =
  'w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500';
const labelClass = 'block text-sm font-medium text-slate-400 mb-1';

const BroadcastEditor: React.FC = () => {
  const { users, loading: fetchingCount } = useAllUsers();
  const [sending, setSending] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState<BroadcastType>('info');
  const [link, setLink] = useState('');

  // Audience filters
  const [branch, setBranch] = useState('All');
  const [year, setYear] = useState('All');
  const [hostel, setHostel] = useState('All');
  const [courseOption, setCourseOption] = useState<'CBCS' | 'NEP' | 'All'>('All');

  // Same matching rules as sendBroadcast (case-insensitive branch/hostel, year from email)
  const recipientCount = users.filter(
    (user) =>
      (branch === 'All' || user.branch?.toLowerCase() === branch.toLowerCase()) &&
      (hostel === 'All' || user.hostel?.toLowerCase() === hostel.toLowerCase()) &&
      (courseOption === 'All' || user.courseOption === courseOption) &&
      (year === 'All' || (admissionYear(user.email) ?? 'Other') === year)
  ).length;

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('Please enter a title and message');
      return;
    }
    if (
      !window.confirm(`Are you sure you want to send this broadcast to ${recipientCount} users?`)
    ) {
      return;
    }

    setSending(true);
    const filter: NotificationFilter = {
      branch: branch === 'All' ? undefined : branch,
      year: year === 'All' ? undefined : year,
      hostel: hostel === 'All' ? undefined : hostel,
      courseOption: courseOption === 'All' ? undefined : courseOption,
    };
    const result = await sendBroadcast(filter, title, body, type, link);

    if (result.success) {
      toast.success(`Broadcast sent to ${result.count} users successfully!`);
      setTitle('');
      setBody('');
      setLink('');
      setType('info');
    } else {
      toast.error(`Failed to send broadcast: ${result.error}`);
    }
    setSending(false);
  };

  const disabled = sending || recipientCount === 0;

  return (
    <AdminPageLayout>
      <AdminHeader
        icon={Megaphone}
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
                <label className={labelClass}>Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Important: Semester Registration"
                  className={fieldClass}
                />
              </div>

              <div>
                <label className={labelClass}>Message Body</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={6}
                  placeholder="Enter your message here..."
                  className={fieldClass}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as BroadcastType)}
                    className={fieldClass}
                  >
                    {Object.entries(TYPES).map(([value, [label]]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Link (Optional)</label>
                  <input
                    type="text"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="https://..."
                    className={fieldClass}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleSend}
                  disabled={disabled}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${
                    disabled
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/20'
                  }`}
                >
                  {sending && (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
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
                <Users className="w-6 h-6" />
                <span className="text-sm font-medium text-blue-400">
                  {fetchingCount ? '...' : recipientCount} recipients
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelClass}>Admission Year</label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className={fieldClass}
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Course Type</label>
                <select
                  value={courseOption}
                  onChange={(e) => setCourseOption(e.target.value as 'CBCS' | 'NEP' | 'All')}
                  className={fieldClass}
                >
                  <option value="All">All Courses</option>
                  <option value="CBCS">CBCS (Old)</option>
                  <option value="NEP">NEP (New)</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Branch</label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className={fieldClass}
                >
                  {BRANCHES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Hostel</label>
                <select
                  value={hostel}
                  onChange={(e) => setHostel(e.target.value)}
                  className={fieldClass}
                >
                  {HOSTELS.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="admin-card bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
            <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">
              Preview
            </h3>
            <div className={`p-4 rounded-xl border ${TYPES[type][1]}`}>
              <h4 className="font-semibold mb-1">{title || 'Message Title'}</h4>
              <p className="text-sm opacity-90">{body || 'Message body will appear here...'}</p>
              {link && <div className="mt-2 text-xs opacity-75 underline truncate">{link}</div>}
            </div>
          </div>
        </div>
      </div>
    </AdminPageLayout>
  );
};

export default BroadcastEditor;
