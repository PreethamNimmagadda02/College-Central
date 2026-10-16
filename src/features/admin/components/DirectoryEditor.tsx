import { Building, Edit2, Mail, Phone, Trash2, Users } from 'lucide-react';
import React, { useState } from 'react';

import { AdminConfigApi } from '../hooks/useAdminConfig';
import { usePagination } from '../hooks/usePagination';
import { AdminDirectoryEntry } from '../types';
import DirectoryUploader from './DirectoryUploader';
import {
  AdminHeader,
  AdminPageLayout,
  BulkActions,
  FormModal,
  Pagination,
  SearchInput,
} from './ui';

type Props = Pick<AdminConfigApi, 'config' | 'directory' | 'importDirectoryEntries'>;
type Draft = Omit<AdminDirectoryEntry, 'id'> & { id?: string };

const EMPTY_ENTRY: Draft = { name: '', department: '', designation: '', email: '', phone: '' };

const DirectoryEditor: React.FC<Props> = ({ config, directory, importDirectoryEntries }) => {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');

  const entries = config.directory || [];
  const departments = Array.from(new Set(entries.map((e) => e.department))).sort();

  const query = searchQuery.toLowerCase();
  const filteredEntries = entries.filter(
    (entry) =>
      (entry.name.toLowerCase().includes(query) ||
        entry.email.toLowerCase().includes(query) ||
        entry.designation.toLowerCase().includes(query)) &&
      (filterDepartment === 'all' || entry.department === filterDepartment)
  );
  const pager = usePagination(filteredEntries, 20);

  const isFiltered = !!searchQuery || filterDepartment !== 'all';
  const emptyText = isFiltered
    ? 'No entries match your filters'
    : 'No directory entries yet. Add your first entry.';

  const handleSubmit = () => {
    if (!draft?.name.trim() || !draft.department.trim()) return;
    const data = {
      name: draft.name.trim(),
      department: draft.department.trim(),
      designation: draft.designation.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
    };
    if (draft.id) directory.update(draft.id, data);
    else directory.add(data);
    setDraft(null);
  };

  const actionButtons = (entry: AdminDirectoryEntry) => (
    <>
      <button
        onClick={() => setDraft(entry)}
        className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
      >
        <Edit2 className="w-4 h-4" />
      </button>
      <button
        onClick={() => directory.remove(entry.id)}
        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </>
  );

  return (
    <AdminPageLayout>
      <AdminHeader
        icon={Users}
        title="Faculty & Staff Directory"
        subtitle="Manage faculty, staff, and department contacts"
      >
        <BulkActions
          noun="faculty entries"
          total={entries.length}
          filtered={isFiltered ? filteredEntries : undefined}
          onDeleteMany={directory.removeMany}
          onClear={directory.clear}
          onUpload={() => setShowUploader(true)}
          onAdd={() => setDraft(EMPTY_ENTRY)}
          addLabel="Add Entry"
        />
      </AdminHeader>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <SearchInput
          className="flex-1"
          placeholder="Search by name, email, or designation..."
          value={searchQuery}
          onChange={(value) => {
            setSearchQuery(value);
            pager.setPage(1);
          }}
        />
        <select
          className="admin-select w-full sm:w-auto sm:min-w-[200px]"
          value={filterDepartment}
          onChange={(e) => {
            setFilterDepartment(e.target.value);
            pager.setPage(1);
          }}
        >
          <option value="all">All Departments ({entries.length})</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept} ({entries.filter((e) => e.department === dept).length})
            </option>
          ))}
        </select>
      </div>

      {/* Directory Table - Desktop */}
      <div className="admin-card p-0 overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Profile</th>
                <th>Contact Info</th>
                <th>Designation</th>
                <th>Department</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pager.pageItems.map((entry) => (
                <tr key={entry.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-semibold border border-slate-600">
                        {entry.name.charAt(0)}
                      </div>
                      <div className="font-medium text-white">{entry.name}</div>
                    </div>
                  </td>
                  <td>
                    <div className="space-y-1">
                      {entry.email && (
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Mail className="w-3 h-3" />
                          <span className="truncate max-w-[180px]">{entry.email}</span>
                        </div>
                      )}
                      {entry.phone && (
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Phone className="w-3 h-3" />
                          <span>{entry.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="text-blue-400 text-sm">{entry.designation}</td>
                  <td>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      <Building className="w-3 h-3" />
                      {entry.department}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">{actionButtons(entry)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEntries.length === 0 && (
          <div className="text-center py-12 text-slate-500">{emptyText}</div>
        )}
      </div>

      {/* Directory Cards - Mobile */}
      <div className="space-y-3 md:hidden">
        {pager.pageItems.map((entry) => (
          <div key={entry.id} className="admin-card p-4">
            {/* Header with avatar, name and actions */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-semibold border border-slate-600 flex-shrink-0">
                  {entry.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-white text-sm truncate">{entry.name}</h4>
                  <p className="text-blue-400 text-xs">{entry.designation}</p>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">{actionButtons(entry)}</div>
            </div>

            <div className="mb-3">
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Building className="w-3 h-3" />
                {entry.department}
              </span>
            </div>

            <div className="space-y-1">
              {entry.email && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Mail className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{entry.email}</span>
                </div>
              )}
              {entry.phone && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Phone className="w-3 h-3 flex-shrink-0" />
                  <span>{entry.phone}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredEntries.length === 0 && (
          <div className="text-center py-12 text-slate-500 admin-card">{emptyText}</div>
        )}
      </div>

      <Pagination {...pager} label="entries" />

      {draft && (
        <FormModal
          title={draft.id ? 'Edit Directory Entry' : 'Add Directory Entry'}
          editing={!!draft.id}
          addLabel="Add Entry"
          onSubmit={handleSubmit}
          onClose={() => setDraft(null)}
        >
          <div>
            <label className="admin-label">Name</label>
            <input
              type="text"
              className="admin-input"
              placeholder="Full name..."
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </div>
          <div>
            <label className="admin-label">Department</label>
            <input
              type="text"
              className="admin-input"
              placeholder="e.g., Computer Science and Engineering"
              value={draft.department}
              onChange={(e) => setDraft({ ...draft, department: e.target.value })}
              list="departments-list"
            />
            <datalist id="departments-list">
              {departments.map((dept) => (
                <option key={dept} value={dept} />
              ))}
            </datalist>
          </div>
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
            <div>
              <label className="admin-label">Designation</label>
              <input
                type="text"
                className="admin-input"
                placeholder="e.g., Professor"
                value={draft.designation}
                onChange={(e) => setDraft({ ...draft, designation: e.target.value })}
              />
            </div>
            <div>
              <label className="admin-label">Phone</label>
              <input
                type="text"
                className="admin-input"
                placeholder="+91-XXX-XXX-XXXX"
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="admin-label">Email</label>
            <input
              type="email"
              className="admin-input"
              placeholder="email@example.com"
              value={draft.email}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
            />
          </div>
        </FormModal>
      )}

      {showUploader && (
        <DirectoryUploader
          onImport={importDirectoryEntries}
          onClose={() => setShowUploader(false)}
        />
      )}
    </AdminPageLayout>
  );
};

export default DirectoryEditor;
