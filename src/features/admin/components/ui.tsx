import { type LucideIcon, Plus, Search, Trash2, Upload } from 'lucide-react';
import React from 'react';

import { usePagination } from '../hooks/usePagination';

export const AdminPageLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">{children}</div>
);

interface AdminHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  icon: Icon,
  title,
  subtitle,
  children,
}) => (
  <div className="admin-card flex items-center justify-between">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
      </div>
    </div>
    {children && <div className="flex items-center gap-3">{children}</div>}
  </div>
);

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder,
  className = '',
}) => (
  <div className={`admin-search ${className}`}>
    <Search className="admin-search-icon w-5 h-5" />
    <input
      type="text"
      className="admin-input"
      style={{ paddingLeft: '48px' }}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

type PaginationProps = Omit<ReturnType<typeof usePagination>, 'pageItems'> & { label: string };

export const Pagination: React.FC<PaginationProps> = ({
  page,
  setPage,
  totalPages,
  pageSize,
  total,
  label,
}) =>
  totalPages > 1 ? (
    <div className="admin-card">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-sm text-slate-400">
          Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} of{' '}
          {total.toLocaleString()} {label}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="admin-btn admin-btn-secondary text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="flex items-center px-3 text-sm text-slate-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            className="admin-btn admin-btn-secondary text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  ) : null;

interface BulkActionsProps {
  noun: string;
  total: number;
  // Only passed while a search or filter is narrowing the list
  filtered?: { id: string }[];
  onDeleteMany: (ids: string[]) => void;
  onClear: () => void;
  onUpload: () => void;
  onAdd: () => void;
  addLabel: string;
}

const toolbarBtn = 'admin-btn text-xs sm:text-sm px-3 sm:px-4';
const toolbarIcon = 'w-3 h-3 sm:w-4 sm:h-4';

export const BulkActions: React.FC<BulkActionsProps> = ({
  noun,
  total,
  filtered,
  onDeleteMany,
  onClear,
  onUpload,
  onAdd,
  addLabel,
}) => (
  <div className="flex flex-wrap gap-2 sm:gap-3">
    {filtered && filtered.length > 0 && (
      <button
        onClick={() =>
          confirm(
            `Are you sure you want to delete all ${filtered.length} filtered ${noun}? This action cannot be undone.`
          ) && onDeleteMany(filtered.map((item) => item.id))
        }
        className={`${toolbarBtn} bg-red-600 hover:bg-red-700 text-white`}
      >
        <Trash2 className={toolbarIcon} />
        Delete {filtered.length}
      </button>
    )}
    {total > 0 && (
      <button
        onClick={() =>
          confirm(
            `Are you sure you want to delete ALL ${total} ${noun}? This action cannot be undone.`
          ) && onClear()
        }
        className={`${toolbarBtn} bg-red-900 hover:bg-red-800 text-white border border-red-700`}
      >
        <Trash2 className={toolbarIcon} />
        Clear All ({total.toLocaleString()})
      </button>
    )}
    <button onClick={onUpload} className={`${toolbarBtn} admin-btn-secondary`}>
      <Upload className={toolbarIcon} />
      Upload Excel
    </button>
    <button onClick={onAdd} className={`${toolbarBtn} admin-btn-primary`}>
      <Plus className={toolbarIcon} />
      {addLabel}
    </button>
  </div>
);

interface FormModalProps {
  title: string;
  editing: boolean;
  addLabel: string;
  onSubmit: () => void;
  onClose: () => void;
  children: React.ReactNode;
}

// Shared add/edit dialog: fields go in children, submit reads "Save Changes" when editing
export const FormModal: React.FC<FormModalProps> = ({
  title,
  editing,
  addLabel,
  onSubmit,
  onClose,
  children,
}) => (
  <div className="admin-modal-overlay" onClick={onClose}>
    <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
      <h3 className="admin-modal-title">{title}</h3>
      <div className="space-y-4">
        {children}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onSubmit}
            className={`admin-btn flex-1 ${editing ? 'admin-btn-success' : 'admin-btn-primary'}`}
          >
            {editing ? 'Save Changes' : addLabel}
          </button>
          <button onClick={onClose} className="admin-btn admin-btn-secondary flex-1">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
);
