import { Edit, Trash2, UsersRound, X } from 'lucide-react';
import React, { useState, useMemo } from 'react';

import { AdminConfigApi } from '../hooks/useAdminConfig';
import { usePagination } from '../hooks/usePagination';
import { AdminStudentEntry } from '../types';
import { admissionYear } from '../utils';
import StudentUploader from './StudentUploader';
import { AdminHeader, AdminPageLayout, BulkActions, Pagination, SearchInput } from './ui';

type Props = Pick<AdminConfigApi, 'config' | 'students' | 'importStudents'>;

const getYear = (admNo: string) => admissionYear(admNo) ?? 'Unknown';

const StudentDirectoryEditor: React.FC<Props> = ({ config, students, importStudents }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState<string>('All');
  const [yearFilter, setYearFilter] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [editingStudent, setEditingStudent] = useState<AdminStudentEntry | null>(null);

  const { branches, years } = useMemo(
    () => ({
      branches: Array.from(new Set(config.students.map((s) => s.branch))).sort(),
      years: Array.from(new Set(config.students.map((s) => getYear(s.admNo)))).sort(),
    }),
    [config.students]
  );

  const filteredStudents = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return config.students.filter(
      (student) =>
        (student.name.toLowerCase().includes(query) ||
          student.admNo.toLowerCase().includes(query)) &&
        (branchFilter === 'All' || student.branch === branchFilter) &&
        (yearFilter === 'All' || getYear(student.admNo) === yearFilter)
    );
  }, [config.students, searchTerm, branchFilter, yearFilter]);
  const pager = usePagination(filteredStudents, 25);

  const isFiltered = !!searchTerm || branchFilter !== 'All' || yearFilter !== 'All';

  const openModal = (student: AdminStudentEntry | null) => {
    setEditingStudent(student);
    setShowAddModal(true);
  };
  const closeModal = () => {
    setShowAddModal(false);
    setEditingStudent(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const studentData = {
      admNo: formData.get('admNo') as string,
      name: formData.get('name') as string,
      branch: formData.get('branch') as string,
    };
    if (editingStudent) students.update(editingStudent.id, studentData);
    else students.add(studentData);
    closeModal();
  };

  const actionButtons = (student: AdminStudentEntry) => (
    <>
      <button
        onClick={() => openModal(student)}
        className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
      >
        <Edit className="w-4 h-4" />
      </button>
      <button
        onClick={() => students.remove(student.id)}
        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </>
  );

  return (
    <AdminPageLayout>
      <AdminHeader
        icon={UsersRound}
        title="Student Directory"
        subtitle="Manage student records and information"
      >
        <BulkActions
          noun="students"
          total={config.students.length}
          filtered={isFiltered ? filteredStudents : undefined}
          onDeleteMany={students.removeMany}
          onClear={students.clear}
          onUpload={() => setShowUploader(true)}
          onAdd={() => openModal(null)}
          addLabel="Add Student"
        />
      </AdminHeader>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <SearchInput
          className="w-full"
          placeholder="Search by name or admission number..."
          value={searchTerm}
          onChange={(value) => {
            setSearchTerm(value);
            pager.setPage(1);
          }}
        />

        <div className="flex flex-col xs:flex-row gap-2 sm:gap-3">
          <select
            value={yearFilter}
            onChange={(e) => {
              setYearFilter(e.target.value);
              pager.setPage(1);
            }}
            className="admin-select w-full xs:flex-1 sm:w-auto sm:min-w-[180px]"
          >
            <option value="All">All Years</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year} ({config.students.filter((s) => getYear(s.admNo) === year).length})
              </option>
            ))}
          </select>
          <select
            value={branchFilter}
            onChange={(e) => {
              setBranchFilter(e.target.value);
              pager.setPage(1);
            }}
            className="admin-select w-full xs:w-[140px] sm:w-auto sm:min-w-[140px]"
          >
            <option value="All">All Branches ({config.students.length})</option>
            {branches.map((branch) => (
              <option key={branch} value={branch}>
                {branch} ({config.students.filter((s) => s.branch === branch).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Student Table - Desktop */}
      <div className="admin-card p-0 overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Adm No</th>
                <th>Name</th>
                <th>Branch</th>
                <th>Year</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pager.pageItems.map((student) => (
                <tr key={student.id}>
                  <td className="font-mono text-cyan-400">{student.admNo}</td>
                  <td>{student.name}</td>
                  <td className="text-slate-400 max-w-[200px] truncate">{student.branch}</td>
                  <td className="text-slate-400">{getYear(student.admNo)}</td>
                  <td>
                    <div className="flex gap-2">{actionButtons(student)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Cards - Mobile */}
      <div className="space-y-3 md:hidden">
        {pager.pageItems.map((student) => (
          <div key={student.id} className="admin-card p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <span className="font-mono text-cyan-400 text-sm">{student.admNo}</span>
                <span className="text-slate-500 text-xs ml-2">({getYear(student.admNo)})</span>
              </div>
              <div className="flex gap-1 flex-shrink-0">{actionButtons(student)}</div>
            </div>
            <h4 className="font-medium text-white text-sm mb-2 break-words">{student.name}</h4>
            <p className="text-slate-400 text-xs truncate">{student.branch}</p>
          </div>
        ))}
      </div>

      <Pagination {...pager} label="students" />

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="admin-modal-title">
                {editingStudent ? 'Edit Student' : 'Add Student'}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="admin-label">Admission Number</label>
                <input
                  type="text"
                  name="admNo"
                  required
                  defaultValue={editingStudent?.admNo}
                  className="admin-input"
                  placeholder="e.g., 23JE0653"
                />
              </div>
              <div>
                <label className="admin-label">Student Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingStudent?.name}
                  className="admin-input"
                  placeholder="e.g., JOHN DOE"
                />
              </div>
              <div>
                <label className="admin-label">Branch</label>
                <select
                  name="branch"
                  required
                  defaultValue={editingStudent?.branch || ''}
                  className="admin-select"
                >
                  <option value="">Select Branch</option>
                  {branches.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="w-full admin-btn admin-btn-primary py-3">
                {editingStudent ? 'Update Student' : 'Add Student'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showUploader && (
        <StudentUploader onImport={importStudents} onClose={() => setShowUploader(false)} />
      )}
    </AdminPageLayout>
  );
};

export default StudentDirectoryEditor;
