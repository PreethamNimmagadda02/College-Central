import { BookOpen, ChevronDown, ChevronUp, Clock, Edit, Trash2, X } from 'lucide-react';
import React, { useState, useMemo } from 'react';

import { AdminConfigApi } from '../hooks/useAdminConfig';
import { usePagination } from '../hooks/usePagination';
import { AdminCourse, AdminCourseSlot } from '../types';
import CourseUploader from './CourseUploader';
import { AdminHeader, AdminPageLayout, BulkActions, Pagination, SearchInput } from './ui';

type Props = Pick<AdminConfigApi, 'config' | 'courses' | 'importCourses'>;

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const EMPTY_SLOT: AdminCourseSlot = { day: 'Monday', startTime: '', endTime: '', venue: '' };

const TYPE_BADGE: Record<AdminCourse['courseType'], string> = {
  CBCS: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  NEP: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
};

// Day / start / end / venue inputs, shared by the "edit slot" and "new slot" rows
const SlotFields: React.FC<{
  slot: AdminCourseSlot;
  onChange: (patch: Partial<AdminCourseSlot>) => void;
}> = ({ slot, onChange }) => (
  <>
    <select
      value={slot.day}
      onChange={(e) => onChange({ day: e.target.value })}
      className="admin-select text-sm py-2 col-span-1 xs:col-span-2"
    >
      {DAYS.map((d) => (
        <option key={d} value={d}>
          {d}
        </option>
      ))}
    </select>
    <input
      type="time"
      value={slot.startTime}
      onChange={(e) => onChange({ startTime: e.target.value })}
      className="admin-input text-sm py-2"
    />
    <input
      type="time"
      value={slot.endTime}
      onChange={(e) => onChange({ endTime: e.target.value })}
      className="admin-input text-sm py-2"
    />
    <input
      type="text"
      placeholder="Venue (optional)"
      value={slot.venue}
      onChange={(e) => onChange({ venue: e.target.value })}
      className="admin-input text-sm py-2 col-span-1 xs:col-span-2"
    />
  </>
);

const CoursesEditor: React.FC<Props> = ({ config, courses, importCourses }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'CBCS' | 'NEP'>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [editingCourse, setEditingCourse] = useState<AdminCourse | null>(null);
  const [editingSlots, setEditingSlots] = useState<AdminCourseSlot[]>([]);
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const [newSlot, setNewSlot] = useState(EMPTY_SLOT);
  const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null);

  const filteredCourses = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return config.courses.filter(
      (course) =>
        (course.courseCode.toLowerCase().includes(query) ||
          course.courseName.toLowerCase().includes(query)) &&
        (typeFilter === 'All' || course.courseType === typeFilter)
    );
  }, [config.courses, searchTerm, typeFilter]);
  const pager = usePagination(filteredCourses, 20);

  const openModal = (course: AdminCourse | null) => {
    setEditingCourse(course);
    setEditingSlots(course?.slots || []);
    setShowAddModal(true);
  };
  const closeModal = () => {
    setShowAddModal(false);
    setEditingCourse(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const ltp = formData.get('ltp') as string;
    if (!/^\d+-\d+-\d+$/.test(ltp)) {
      alert('Invalid L-T-P format. Please use the format: 3-0-0 (Lecture-Tutorial-Practical)');
      return;
    }

    const courseData = {
      courseCode: formData.get('courseCode') as string,
      courseName: formData.get('courseName') as string,
      ltp,
      credits: parseInt(formData.get('credits') as string),
      courseType: formData.get('courseType') as 'CBCS' | 'NEP',
      slots: editingSlots,
    };
    if (editingCourse) courses.update(editingCourse.id, courseData);
    else courses.add(courseData);
    closeModal();
    setNewSlot(EMPTY_SLOT);
  };

  const handleAddSlot = () => {
    if (!newSlot.day || !newSlot.startTime || !newSlot.endTime) {
      alert('Please fill in Day, Start Time, and End Time for the slot.');
      return;
    }
    setEditingSlots((prev) => [...prev, newSlot]);
    // Keep the day for convenience
    setNewSlot((prev) => ({ ...prev, startTime: '', endTime: '', venue: '' }));
  };

  const slotsToggle = (course: AdminCourse) => (
    <button
      onClick={() => setExpandedCourseId(expandedCourseId === course.id ? null : course.id)}
      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30 transition-colors"
    >
      <Clock className="w-3 h-3" />
      {course.slots.length} slot{course.slots.length !== 1 ? 's' : ''}
      {expandedCourseId === course.id ? (
        <ChevronUp className="w-3 h-3" />
      ) : (
        <ChevronDown className="w-3 h-3" />
      )}
    </button>
  );

  const actionButtons = (course: AdminCourse) => (
    <>
      <button
        onClick={() => openModal(course)}
        className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
      >
        <Edit className="w-4 h-4" />
      </button>
      <button
        onClick={() => courses.remove(course.id)}
        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </>
  );

  return (
    <AdminPageLayout>
      <AdminHeader icon={BookOpen} title="Courses" subtitle="Manage course catalog and schedules">
        <BulkActions
          noun="courses"
          total={config.courses.length}
          filtered={searchTerm || typeFilter !== 'All' ? filteredCourses : undefined}
          onDeleteMany={courses.removeMany}
          onClear={courses.clear}
          onUpload={() => setShowUploader(true)}
          onAdd={() => openModal(null)}
          addLabel="Add Course"
        />
      </AdminHeader>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <SearchInput
          className="flex-1"
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(value) => {
            setSearchTerm(value);
            pager.setPage(1);
          }}
        />
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value as 'All' | 'CBCS' | 'NEP');
            pager.setPage(1);
          }}
          className="admin-select w-full sm:w-auto sm:min-w-[120px]"
        >
          <option value="All">All Types</option>
          <option value="CBCS">CBCS</option>
          <option value="NEP">NEP</option>
        </select>
      </div>

      {/* Course Table - Desktop */}
      <div className="admin-card p-0 overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>L-T-P</th>
                <th>Credits</th>
                <th>Type</th>
                <th>Slots</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pager.pageItems.map((course) => (
                <React.Fragment key={course.id}>
                  <tr>
                    <td className="font-mono text-blue-400">{course.courseCode}</td>
                    <td>{course.courseName}</td>
                    <td className="text-slate-400">{course.ltp}</td>
                    <td className="text-slate-400">{course.credits}</td>
                    <td>
                      <span
                        className={`px-2.5 py-1 text-xs font-semibold rounded-full ${TYPE_BADGE[course.courseType]}`}
                      >
                        {course.courseType}
                      </span>
                    </td>
                    <td>
                      {course.slots?.length ? (
                        slotsToggle(course)
                      ) : (
                        <span className="text-xs text-slate-500">No slots</span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-2">{actionButtons(course)}</div>
                    </td>
                  </tr>
                  {expandedCourseId === course.id && course.slots?.length > 0 && (
                    <tr>
                      <td colSpan={7} className="bg-purple-500/5 border-l-2 border-purple-500">
                        <div className="pl-6 py-3 space-y-2">
                          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                            Class Schedule
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {course.slots.map((slot, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-3 bg-slate-800/50 rounded-lg px-3 py-2 text-sm border border-purple-500/20"
                              >
                                <div className="flex-shrink-0 w-20 font-medium text-purple-400">
                                  {slot.day}
                                </div>
                                <div className="flex-1 text-slate-300">
                                  {slot.startTime} - {slot.endTime}
                                </div>
                                {slot.venue && (
                                  <div className="text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded">
                                    {slot.venue}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Course Cards - Mobile */}
      <div className="space-y-3 md:hidden">
        {pager.pageItems.map((course) => (
          <div key={course.id} className="admin-card p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-blue-400 text-sm">{course.courseCode}</span>
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-full ${TYPE_BADGE[course.courseType]}`}
                  >
                    {course.courseType}
                  </span>
                </div>
                <h4 className="text-white text-sm font-medium mt-1 break-words">
                  {course.courseName}
                </h4>
              </div>
              <div className="flex gap-1 flex-shrink-0">{actionButtons(course)}</div>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span>L-T-P: {course.ltp}</span>
              <span>•</span>
              <span>{course.credits} Credits</span>
            </div>

            {course.slots?.length > 0 && (
              <div className="mt-3">
                {slotsToggle(course)}
                {expandedCourseId === course.id && (
                  <div className="mt-3 space-y-2">
                    {course.slots.map((slot, idx) => (
                      <div
                        key={idx}
                        className="flex flex-wrap items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2 text-sm border border-purple-500/20"
                      >
                        <span className="font-medium text-purple-400">{slot.day}</span>
                        <span className="text-slate-300">
                          {slot.startTime} - {slot.endTime}
                        </span>
                        {slot.venue && (
                          <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded">
                            {slot.venue}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <Pagination {...pager} label="courses" />

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="admin-modal-title">{editingCourse ? 'Edit Course' : 'Add Course'}</h3>
              <button
                onClick={closeModal}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="admin-label">Course Code</label>
                <input
                  type="text"
                  name="courseCode"
                  required
                  defaultValue={editingCourse?.courseCode}
                  className="admin-input"
                  placeholder="e.g., CSC305"
                />
              </div>
              <div>
                <label className="admin-label">Course Name</label>
                <input
                  type="text"
                  name="courseName"
                  required
                  defaultValue={editingCourse?.courseName}
                  className="admin-input"
                  placeholder="e.g., Computer Networks"
                />
              </div>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                <div>
                  <label className="admin-label">L-T-P</label>
                  <input
                    type="text"
                    name="ltp"
                    required
                    defaultValue={editingCourse?.ltp}
                    className="admin-input"
                    placeholder="3-0-0"
                    title="Format: Lecture-Tutorial-Practical (e.g., 3-0-0)"
                  />
                  <span className="text-xs text-slate-500 mt-1 block">
                    Format: L-T-P (e.g., 3-0-0)
                  </span>
                </div>
                <div>
                  <label className="admin-label">Credits</label>
                  <input
                    type="number"
                    name="credits"
                    required
                    defaultValue={editingCourse?.credits}
                    className="admin-input"
                    placeholder="9"
                  />
                </div>
              </div>
              <div>
                <label className="admin-label">Class Slots</label>
                <div className="space-y-2 mb-3">
                  {editingSlots.map((slot, idx) => (
                    <div
                      key={idx}
                      className={`p-3 bg-slate-800/50 rounded-lg border ${
                        editingSlotIndex === idx ? 'border-emerald-500/50' : 'border-blue-500/20'
                      }`}
                    >
                      {editingSlotIndex === idx ? (
                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                          <SlotFields
                            slot={slot}
                            onChange={(patch) =>
                              setEditingSlots((prev) =>
                                prev.map((s, i) => (i === idx ? { ...s, ...patch } : s))
                              )
                            }
                          />
                          <button
                            type="button"
                            onClick={() => setEditingSlotIndex(null)}
                            className="col-span-1 xs:col-span-2 admin-btn bg-emerald-600 hover:bg-emerald-700 text-white text-sm py-2"
                          >
                            Done Editing
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="w-24 text-sm font-medium text-blue-400">{slot.day}</div>
                          <div className="text-sm text-slate-300">
                            {slot.startTime} - {slot.endTime}
                          </div>
                          {slot.venue && (
                            <div className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded">
                              {slot.venue}
                            </div>
                          )}
                          <div className="ml-auto flex gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingSlotIndex(idx)}
                              className="text-blue-400 hover:text-blue-300 p-1 hover:bg-blue-500/20 rounded transition-colors"
                              title="Edit slot"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setEditingSlots((prev) => prev.filter((_, i) => i !== idx))
                              }
                              className="text-red-400 hover:text-red-300 p-1 hover:bg-red-500/20 rounded transition-colors"
                              title="Remove slot"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {editingSlots.length === 0 && (
                    <div className="text-sm text-slate-500 italic text-center py-3">
                      No slots added yet
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
                  <SlotFields
                    slot={newSlot}
                    onChange={(patch) => setNewSlot((prev) => ({ ...prev, ...patch }))}
                  />
                  <button
                    type="button"
                    onClick={handleAddSlot}
                    className="col-span-1 xs:col-span-2 mt-1 admin-btn admin-btn-secondary text-sm py-2"
                  >
                    + Add Slot
                  </button>
                </div>
              </div>

              <div>
                <label className="admin-label">Type</label>
                <select
                  name="courseType"
                  defaultValue={editingCourse?.courseType || 'CBCS'}
                  className="admin-select"
                >
                  <option value="CBCS">CBCS</option>
                  <option value="NEP">NEP</option>
                </select>
              </div>
              <button type="submit" className="w-full admin-btn admin-btn-primary py-3">
                {editingCourse ? 'Update Course' : 'Add Course'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showUploader && (
        <CourseUploader onImport={importCourses} onClose={() => setShowUploader(false)} />
      )}
    </AdminPageLayout>
  );
};

export default CoursesEditor;
