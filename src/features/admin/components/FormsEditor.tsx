import { Download, FileText, Plus, Trash2 } from 'lucide-react';
import React, { useState } from 'react';

import { AdminConfigApi } from '../hooks/useAdminConfig';
import { usePagination } from '../hooks/usePagination';
import { AdminForm } from '../types';
import { AdminHeader, AdminPageLayout, FormModal, Pagination, SearchInput } from './ui';

type Props = Pick<AdminConfigApi, 'config' | 'forms'>;
type Draft = Omit<AdminForm, 'id'> & { id?: string };

const CATEGORIES: { value: AdminForm['category']; label: string; color: string }[] = [
  { value: 'general', label: 'General Forms', color: 'from-blue-500 to-blue-600' },
  { value: 'ug', label: 'UG Forms', color: 'from-green-500 to-green-600' },
  { value: 'pg', label: 'PG Forms', color: 'from-purple-500 to-purple-600' },
  { value: 'phd', label: 'Ph.D Forms', color: 'from-orange-500 to-orange-600' },
];

const FormsEditor: React.FC<Props> = ({ config, forms }) => {
  const [activeCategory, setActiveCategory] = useState<AdminForm['category']>('general');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = () => {
    // New forms also need a download link
    if (!draft?.title.trim() || !draft.formNumber.trim()) return;
    if (!draft.id && !draft.downloadLink.trim()) return;
    const data = {
      title: draft.title.trim(),
      formNumber: draft.formNumber.trim(),
      downloadLink: draft.downloadLink.trim(),
      submitTo: draft.submitTo.trim(),
      category: draft.category,
    };
    if (draft.id) forms.update(draft.id, data);
    else forms.add(data);
    setDraft(null);
  };

  const allForms = config.forms || [];
  const query = searchQuery.toLowerCase();
  const filteredForms = allForms.filter(
    (form) =>
      form.category === activeCategory &&
      (form.title.toLowerCase().includes(query) || form.formNumber.toLowerCase().includes(query))
  );
  const pager = usePagination(filteredForms, 20);
  const emptyText = searchQuery ? 'No forms match your search' : 'No forms in this category yet';

  return (
    <AdminPageLayout>
      <AdminHeader
        icon={FileText}
        title="Academic Forms"
        subtitle="Manage downloadable forms for students"
      >
        <button
          onClick={() =>
            setDraft({
              title: '',
              formNumber: '',
              downloadLink: '',
              submitTo: '',
              category: activeCategory,
            })
          }
          className="admin-btn admin-btn-primary text-xs sm:text-sm"
        >
          <Plus className="w-5 h-5" />
          Add Form
        </button>
      </AdminHeader>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => {
              setActiveCategory(cat.value);
              pager.setPage(1);
            }}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              activeCategory === cat.value
                ? `bg-gradient-to-r ${cat.color} text-white shadow-lg`
                : 'bg-slate-800/50 text-indigo-300 hover:bg-slate-700/50'
            }`}
          >
            {cat.label} ({allForms.filter((f) => f.category === cat.value).length})
          </button>
        ))}
      </div>

      <SearchInput
        className="flex-1 max-w-2xl"
        placeholder="Search forms..."
        value={searchQuery}
        onChange={(value) => {
          setSearchQuery(value);
          pager.setPage(1);
        }}
      />

      {/* Forms Table - Desktop */}
      <div className="admin-card overflow-hidden p-0 hidden md:block">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Form #</th>
              <th>Title</th>
              <th>Submit To</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pager.pageItems.map((form) => (
              <tr key={form.id}>
                <td>
                  <span className="admin-badge admin-badge-info">{form.formNumber}</span>
                </td>
                <td>{form.title}</td>
                <td className="text-indigo-400">{form.submitTo || '—'}</td>
                <td>
                  <div className="flex gap-2">
                    <a
                      href={form.downloadLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-btn admin-btn-secondary text-sm"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => setDraft(form)}
                      className="admin-btn admin-btn-secondary text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => forms.remove(form.id)}
                      className="admin-btn admin-btn-danger text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredForms.length === 0 && (
          <div className="text-center py-12 text-indigo-400">{emptyText}</div>
        )}
      </div>

      {/* Forms Cards - Mobile */}
      <div className="space-y-3 md:hidden">
        {pager.pageItems.map((form) => (
          <div key={form.id} className="admin-card">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <span className="admin-badge admin-badge-info text-xs">{form.formNumber}</span>
                <h4 className="text-white font-medium text-sm mt-2 break-words">{form.title}</h4>
                {form.submitTo && (
                  <p className="text-indigo-400 text-xs mt-1">Submit to: {form.submitTo}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <a
                href={form.downloadLink}
                target="_blank"
                rel="noopener noreferrer"
                className="admin-btn admin-btn-secondary text-xs flex-1 justify-center"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
              <button
                onClick={() => setDraft(form)}
                className="admin-btn admin-btn-secondary text-xs px-3"
              >
                Edit
              </button>
              <button
                onClick={() => forms.remove(form.id)}
                className="admin-btn admin-btn-danger text-xs px-3"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {filteredForms.length === 0 && (
          <div className="text-center py-8 text-indigo-400 text-sm admin-card">{emptyText}</div>
        )}
      </div>

      <Pagination {...pager} label="forms" />

      {draft && (
        <FormModal
          title={draft.id ? 'Edit Form' : 'Add New Form'}
          editing={!!draft.id}
          addLabel="Add Form"
          onSubmit={handleSubmit}
          onClose={() => setDraft(null)}
        >
          <div>
            <label className="admin-label">Form Number</label>
            <input
              type="text"
              className="admin-input"
              placeholder="e.g., A1, UG5"
              value={draft.formNumber}
              onChange={(e) => setDraft({ ...draft, formNumber: e.target.value })}
            />
          </div>
          <div>
            <label className="admin-label">Title</label>
            <input
              type="text"
              className="admin-input"
              placeholder="Form title..."
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </div>
          <div>
            <label className="admin-label">Download Link</label>
            <input
              type="url"
              className="admin-input"
              placeholder="https://example.com/form.pdf"
              value={draft.downloadLink}
              onChange={(e) => setDraft({ ...draft, downloadLink: e.target.value })}
            />
          </div>
          <div>
            <label className="admin-label">Submit To</label>
            <input
              type="text"
              className="admin-input"
              placeholder="e.g., Academic Section"
              value={draft.submitTo}
              onChange={(e) => setDraft({ ...draft, submitTo: e.target.value })}
            />
          </div>
          <div>
            <label className="admin-label">Category</label>
            <select
              className="admin-select"
              value={draft.category}
              onChange={(e) =>
                setDraft({ ...draft, category: e.target.value as AdminForm['category'] })
              }
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </FormModal>
      )}
    </AdminPageLayout>
  );
};

export default FormsEditor;
