import { ExternalLink, Link, Plus, Trash2 } from 'lucide-react';
import React, { useState } from 'react';

import { AdminConfigApi } from '../hooks/useAdminConfig';
import { AdminQuickLink } from '../types';
import { AdminHeader, AdminPageLayout, FormModal, SearchInput } from './ui';

type Props = Pick<AdminConfigApi, 'config' | 'quickLinks'>;
type Draft = Omit<AdminQuickLink, 'id'> & { id?: string };

const ICON_OPTIONS = [
  { value: 'website', label: '🌐 Website' },
  { value: 'cloud', label: '☁️ Cloud' },
  { value: 'video', label: '📹 Video' },
  { value: 'code', label: '💻 Code' },
  { value: 'chat', label: '💬 Chat' },
  { value: 'document', label: '📄 Document' },
  { value: 'music', label: '🎵 Music' },
  { value: 'shopping', label: '🛒 Shopping' },
  { value: 'photo', label: '📷 Photo' },
  { value: 'calculator', label: '🔢 Calculator' },
  { value: 'game', label: '🎮 Game' },
  { value: 'bookmark', label: '🔖 Bookmark' },
  { value: 'newspaper', label: '📰 News' },
];

const COLOR_OPTIONS = [
  { value: 'text-blue-600 dark:text-blue-400', label: 'Blue', class: 'bg-blue-500' },
  { value: 'text-red-600 dark:text-red-400', label: 'Red', class: 'bg-red-500' },
  { value: 'text-green-600 dark:text-green-400', label: 'Green', class: 'bg-green-500' },
  { value: 'text-purple-600 dark:text-purple-400', label: 'Purple', class: 'bg-purple-500' },
  { value: 'text-orange-600 dark:text-orange-400', label: 'Orange', class: 'bg-orange-500' },
  { value: 'text-indigo-600 dark:text-indigo-400', label: 'Indigo', class: 'bg-indigo-500' },
  { value: 'text-teal-600 dark:text-teal-400', label: 'Teal', class: 'bg-teal-500' },
  { value: 'text-pink-600 dark:text-pink-400', label: 'Pink', class: 'bg-pink-500' },
  { value: 'text-cyan-600 dark:text-cyan-400', label: 'Cyan', class: 'bg-cyan-500' },
  { value: 'text-yellow-600 dark:text-yellow-400', label: 'Yellow', class: 'bg-yellow-500' },
];

const EMPTY_LINK: Draft = {
  name: '',
  href: '',
  color: 'text-blue-600 dark:text-blue-400',
  icon: 'website',
};

const getIconEmoji = (iconValue: string) =>
  ICON_OPTIONS.find((opt) => opt.value === iconValue)?.label.split(' ')[0] || '🌐';

const QuickLinksEditor: React.FC<Props> = ({ config, quickLinks }) => {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = () => {
    if (!draft?.name.trim() || !draft.href.trim()) return;
    const data = {
      name: draft.name.trim(),
      href: draft.href.startsWith('http') ? draft.href : `https://${draft.href}`,
      color: draft.color,
      icon: draft.icon,
    };
    if (draft.id) quickLinks.update(draft.id, data);
    else quickLinks.add(data);
    setDraft(null);
  };

  const query = searchQuery.toLowerCase();
  const filteredLinks = (config.quickLinks || []).filter(
    (link) => link.name.toLowerCase().includes(query) || link.href.toLowerCase().includes(query)
  );

  return (
    <AdminPageLayout>
      <AdminHeader
        icon={Link}
        title="Quick Links"
        subtitle="Default institutional links shown on the dashboard"
      >
        <button
          onClick={() => setDraft(EMPTY_LINK)}
          className="admin-btn admin-btn-primary text-xs sm:text-sm"
        >
          <Plus className="w-5 h-5" />
          Add Link
        </button>
      </AdminHeader>

      <SearchInput placeholder="Search links..." value={searchQuery} onChange={setSearchQuery} />

      {/* Links Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {filteredLinks.map((link) => {
          const color = COLOR_OPTIONS.find((c) => c.value === link.color);
          return (
            <div key={link.id} className="admin-card">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center text-xl sm:text-2xl flex-shrink-0">
                  {getIconEmoji(link.icon)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium text-sm sm:text-base truncate">
                    {link.name}
                  </h4>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 text-xs sm:text-sm hover:text-indigo-300 flex items-center gap-1 truncate"
                  >
                    <ExternalLink className="w-5 h-5" />
                    <span className="truncate">{link.href}</span>
                  </a>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`w-3 h-3 rounded-full ${color?.class || 'bg-blue-500'}`}
                    ></span>
                    <span className="text-indigo-400 text-xs">{color?.label || 'Blue'}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 sm:gap-2 flex-shrink-0">
                  <button
                    onClick={() => setDraft(link)}
                    className="admin-btn admin-btn-secondary text-xs sm:text-sm px-2 sm:px-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => quickLinks.remove(link.id)}
                    className="admin-btn admin-btn-danger text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredLinks.length === 0 && (
          <div className="col-span-full text-center py-8 sm:py-12 text-indigo-400 text-sm sm:text-base admin-card">
            {searchQuery
              ? 'No links match your search'
              : 'No quick links added. Click "Add Link" to create one.'}
          </div>
        )}
      </div>

      {draft && (
        <FormModal
          title={draft.id ? 'Edit Quick Link' : 'Add Quick Link'}
          editing={!!draft.id}
          addLabel="Add Link"
          onSubmit={handleSubmit}
          onClose={() => setDraft(null)}
        >
          <div>
            <label className="admin-label">Link Name</label>
            <input
              type="text"
              className="admin-input"
              placeholder="e.g., MIS Portal"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </div>
          <div>
            <label className="admin-label">URL</label>
            <input
              type="url"
              className="admin-input"
              placeholder="https://example.com"
              value={draft.href}
              onChange={(e) => setDraft({ ...draft, href: e.target.value })}
            />
          </div>
          <div>
            <label className="admin-label">Icon</label>
            <select
              className="admin-select"
              value={draft.icon}
              onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
            >
              {ICON_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="admin-label">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setDraft({ ...draft, color: color.value })}
                  className={`w-8 h-8 rounded-full ${color.class} ${
                    draft.color === color.value
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900'
                      : ''
                  }`}
                  title={color.label}
                />
              ))}
            </div>
          </div>
        </FormModal>
      )}
    </AdminPageLayout>
  );
};

export default QuickLinksEditor;
