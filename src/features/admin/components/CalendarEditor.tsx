import { Calendar, Plus, Trash2, Upload } from 'lucide-react';
import React, { useState } from 'react';

import { AdminConfigApi } from '../hooks/useAdminConfig';
import { usePagination } from '../hooks/usePagination';
import { AdminCalendarEvent } from '../types';
import CalendarUploader from './CalendarUploader';
import { AdminHeader, AdminPageLayout, FormModal, Pagination, SearchInput } from './ui';

type Props = Pick<
  AdminConfigApi,
  'config' | 'calendarEvents' | 'importCalendarEvents' | 'updateCalendarDates'
>;
type Draft = Omit<AdminCalendarEvent, 'id'> & { id?: string };

const EVENT_TYPES: AdminCalendarEvent['type'][] = [
  'Start of Semester',
  'Mid-Semester Exams',
  'End-Semester Exams',
  'Holiday',
  'Other',
];

const EVENT_TYPE_COLORS: Record<AdminCalendarEvent['type'], string> = {
  'Start of Semester': 'bg-green-500',
  'Mid-Semester Exams': 'bg-yellow-500',
  'End-Semester Exams': 'bg-red-500',
  Holiday: 'bg-purple-500',
  Other: 'bg-blue-500',
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

const CalendarEditor: React.FC<Props> = ({
  config,
  calendarEvents,
  importCalendarEvents,
  updateCalendarDates,
}) => {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<AdminCalendarEvent['type'] | 'all'>('all');

  // Semester name editing state
  const [editingSemesterName, setEditingSemesterName] = useState(false);
  const [tempSemesterName, setTempSemesterName] = useState(config.calendar.semesterName || '');

  const handleSubmit = () => {
    if (!draft?.date || !draft.description.trim()) return;
    const data: Omit<AdminCalendarEvent, 'id'> = {
      date: draft.date,
      description: draft.description.trim(),
      type: draft.type,
    };
    // Only include endDate if it has a value (Firestore doesn't accept undefined)
    if (draft.endDate) data.endDate = draft.endDate;
    if (draft.id) calendarEvents.update(draft.id, data);
    else calendarEvents.add(data);
    setDraft(null);
  };

  const { events } = config.calendar;
  const filteredEvents = events
    .filter((event) => {
      const matchesSearch =
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.date.includes(searchQuery);
      return matchesSearch && (filterType === 'all' || event.type === filterType);
    })
    .sort((a, b) => a.date.localeCompare(b.date));
  const pager = usePagination(filteredEvents, 20);

  // Semester dates are auto-detected from events
  const detectedStart = events
    .filter((e) => e.type === 'Start of Semester')
    .sort((a, b) => a.date.localeCompare(b.date))[0]?.date;
  const lastEndExam = events
    .filter((e) => e.type === 'End-Semester Exams')
    .sort((a, b) => (a.endDate || a.date).localeCompare(b.endDate || b.date))
    .at(-1);
  const detectedEnd = lastEndExam?.endDate || lastEndExam?.date;

  return (
    <AdminPageLayout>
      <AdminHeader
        icon={Calendar}
        title="Academic Calendar"
        subtitle="Manage semester dates and calendar events"
      >
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button
            onClick={() => setShowUploader(true)}
            className="admin-btn admin-btn-secondary text-xs sm:text-sm"
          >
            <Upload className="w-5 h-5" />
            <span className="hidden xs:inline">Upload</span> Calendar
          </button>
          <button
            onClick={() => setDraft({ date: '', endDate: '', description: '', type: 'Other' })}
            className="admin-btn admin-btn-primary text-xs sm:text-sm"
          >
            <Plus className="w-5 h-5" />
            Add Event
          </button>
        </div>
      </AdminHeader>

      {/* Ongoing Semester Name */}
      <div className="admin-card">
        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-white">Ongoing Semester</h3>
          <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            Displayed in Dashboard
          </span>
        </div>
        <p className="text-indigo-300 text-sm mb-4">
          Set the name of the current/ongoing semester. This will be displayed in the user
          dashboard's semester progress section.
        </p>
        <div className="p-4 rounded-xl bg-slate-700/50 border border-slate-600/50">
          <label className="text-indigo-400 text-xs font-medium mb-2 block">Semester Name</label>

          {editingSemesterName ? (
            <div className="space-y-3">
              <input
                type="text"
                className="admin-input"
                placeholder='e.g., "Monsoon 2025-26" or "Winter 2025-26"'
                value={tempSemesterName}
                onChange={(e) => setTempSemesterName(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    updateCalendarDates({ semesterName: tempSemesterName.trim() || undefined });
                    setEditingSemesterName(false);
                  }}
                  className="admin-btn admin-btn-success text-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingSemesterName(false)}
                  className="admin-btn admin-btn-secondary text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-white text-lg font-medium">
                {config.calendar.semesterName || (
                  <span className="text-slate-400 italic">Auto-detect from events</span>
                )}
              </p>
              <button
                onClick={() => {
                  setTempSemesterName(config.calendar.semesterName || '');
                  setEditingSemesterName(true);
                }}
                className="admin-btn admin-btn-secondary text-sm"
              >
                Edit
              </button>
            </div>
          )}

          <p className="text-slate-400 text-xs mt-3">
            💡 Leave empty to auto-detect from "Start of Semester" events
          </p>
        </div>
      </div>

      {/* Semester Dates - Auto-detected */}
      <div className="admin-card">
        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-white">Academic Year Dates</h3>
          <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
            Auto-detected
          </span>
        </div>
        <p className="text-indigo-300 text-sm mb-4">
          These dates are automatically detected from "Start of Semester" and "End-Semester Exams"
          events.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { label: 'Year Start Date', date: detectedStart, eventType: 'Start of Semester' },
            { label: 'Year End Date', date: detectedEnd, eventType: 'End-Semester Exams' },
          ].map(({ label, date, eventType }) => (
            <div key={label} className="p-4 rounded-xl bg-slate-700/50 border border-slate-600/50">
              <label className="text-indigo-400 text-xs font-medium mb-2 block">{label}</label>
              <p className="text-white text-lg font-medium">
                {date ? (
                  formatDate(date)
                ) : (
                  <span className="text-slate-400 italic">No "{eventType}" event found</span>
                )}
              </p>
            </div>
          ))}
        </div>
        {(!detectedStart || !detectedEnd) && (
          <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <p className="text-amber-400 text-sm">
              💡 Add events with type "Start of Semester" and "End-Semester Exams" for automatic
              detection.
            </p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4">
        {EVENT_TYPES.map((type) => (
          <div key={type} className="admin-stat-card p-3 sm:p-6">
            <div className="admin-stat-value text-xl sm:text-3xl">
              {events.filter((e) => e.type === type).length}
            </div>
            <div className="admin-stat-label text-xs leading-tight">{type}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <SearchInput
          className="flex-1"
          placeholder="Search events..."
          value={searchQuery}
          onChange={(value) => {
            setSearchQuery(value);
            pager.setPage(1);
          }}
        />
        <select
          className="admin-select w-full sm:w-auto"
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value as AdminCalendarEvent['type'] | 'all');
            pager.setPage(1);
          }}
        >
          <option value="all">All Types</option>
          {EVENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {pager.pageItems.map((event) => (
          <div
            key={event.id}
            className="admin-list-item flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
          >
            {/* Top row on mobile: color dot, date, and type */}
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              <div
                className={`w-3 h-3 rounded-full flex-shrink-0 ${EVENT_TYPE_COLORS[event.type]}`}
              />
              <div className="text-indigo-400 text-xs sm:text-sm sm:w-32 flex-shrink-0">
                {formatDate(event.date)}
                {event.endDate && event.endDate !== event.date && (
                  <span className="block sm:inline"> - {formatDate(event.endDate)}</span>
                )}
              </div>
              <div className="flex-1 min-w-0 hidden sm:block">
                <p className="text-white text-sm sm:text-base break-words">{event.description}</p>
                <span className="text-indigo-400 text-xs">{event.type}</span>
              </div>
            </div>
            {/* Description on mobile - separate row */}
            <div className="flex-1 min-w-0 sm:hidden pl-6">
              <p className="text-white text-sm break-words">{event.description}</p>
              <span className="text-indigo-400 text-xs">{event.type}</span>
            </div>
            <div className="flex gap-2 ml-auto sm:ml-0 flex-shrink-0">
              <button
                onClick={() => setDraft(event)}
                className="admin-btn admin-btn-secondary text-xs sm:text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => calendarEvents.remove(event.id)}
                className="admin-btn admin-btn-danger text-xs sm:text-sm"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {filteredEvents.length === 0 && (
          <div className="text-center py-12 text-indigo-400 admin-card">
            {searchQuery || filterType !== 'all'
              ? 'No events match your filters'
              : 'No calendar events yet. Add your first event.'}
          </div>
        )}
      </div>

      <Pagination {...pager} label="events" />

      {draft && (
        <FormModal
          title={draft.id ? 'Edit Calendar Event' : 'Add Calendar Event'}
          editing={!!draft.id}
          addLabel="Add Event"
          onSubmit={handleSubmit}
          onClose={() => setDraft(null)}
        >
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
            <div>
              <label className="admin-label">Start Date</label>
              <input
                type="date"
                className="admin-input"
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              />
            </div>
            <div>
              <label className="admin-label">End Date (optional)</label>
              <input
                type="date"
                className="admin-input"
                value={draft.endDate || ''}
                onChange={(e) => setDraft({ ...draft, endDate: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="admin-label">Event Type</label>
            <select
              className="admin-select"
              value={draft.type}
              onChange={(e) =>
                setDraft({ ...draft, type: e.target.value as AdminCalendarEvent['type'] })
              }
            >
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="admin-label">Description</label>
            <textarea
              className="admin-input min-h-[80px]"
              placeholder="Event description..."
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </div>
        </FormModal>
      )}

      {showUploader && (
        <CalendarUploader onImport={importCalendarEvents} onClose={() => setShowUploader(false)} />
      )}
    </AdminPageLayout>
  );
};

export default CalendarEditor;
