import { MessageSquareQuote, Plus, Sparkles, Trash2 } from 'lucide-react';
import React, { useState } from 'react';

import { AdminConfigApi } from '../hooks/useAdminConfig';
import { usePagination } from '../hooks/usePagination';
import { AdminQuote } from '../types';
import { AdminHeader, AdminPageLayout, FormModal, Pagination, SearchInput } from './ui';

type Props = Pick<AdminConfigApi, 'config' | 'quotes'>;
type Draft = Omit<AdminQuote, 'id'> & { id?: string };

const QuotesEditor: React.FC<Props> = ({ config, quotes }) => {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = () => {
    if (!draft?.text.trim() || !draft.author.trim()) return;
    const data = { text: draft.text.trim(), author: draft.author.trim() };
    if (draft.id) quotes.update(draft.id, data);
    else quotes.add(data);
    setDraft(null);
  };

  const query = searchQuery.toLowerCase();
  const filteredQuotes = (config.quotes || []).filter(
    (quote) =>
      quote.text.toLowerCase().includes(query) || quote.author.toLowerCase().includes(query)
  );
  const pager = usePagination(filteredQuotes, 20);

  return (
    <AdminPageLayout>
      <AdminHeader
        icon={Sparkles}
        title="Motivational Quotes"
        subtitle="Quotes displayed on the student dashboard"
      >
        <button
          onClick={() => setDraft({ text: '', author: '' })}
          className="admin-btn admin-btn-primary text-xs sm:text-sm"
        >
          <Plus className="w-5 h-5" />
          Add Quote
        </button>
      </AdminHeader>

      <SearchInput
        className="flex-1 max-w-2xl"
        placeholder="Search quotes..."
        value={searchQuery}
        onChange={(value) => {
          setSearchQuery(value);
          pager.setPage(1);
        }}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="admin-stat-card p-3 sm:p-6">
          <div className="admin-stat-value text-xl sm:text-3xl">{config.quotes?.length || 0}</div>
          <div className="admin-stat-label text-xs">Total Quotes</div>
        </div>
        <div className="admin-stat-card p-3 sm:p-6">
          <div className="admin-stat-value text-xl sm:text-3xl">
            {new Set((config.quotes || []).map((q) => q.author)).size}
          </div>
          <div className="admin-stat-label text-xs">Unique Authors</div>
        </div>
      </div>

      {/* Quotes List */}
      <div className="space-y-3 sm:space-y-4">
        {pager.pageItems.map((quote) => (
          <div key={quote.id} className="admin-card">
            <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
                <MessageSquareQuote className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm sm:text-lg italic break-words">"{quote.text}"</p>
                <p className="text-indigo-400 text-xs sm:text-base mt-2">— {quote.author}</p>
              </div>
              <div className="flex sm:flex-col gap-2 mt-2 sm:mt-0">
                <button
                  onClick={() => setDraft(quote)}
                  className="admin-btn admin-btn-secondary text-xs sm:text-sm flex-1 sm:flex-none justify-center"
                >
                  Edit
                </button>
                <button
                  onClick={() => quotes.remove(quote.id)}
                  className="admin-btn admin-btn-danger text-xs sm:text-sm flex-1 sm:flex-none justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredQuotes.length === 0 && (
          <div className="text-center py-8 sm:py-12 text-indigo-400 text-sm sm:text-base admin-card">
            {searchQuery
              ? 'No quotes match your search'
              : 'No quotes added. Click "Add Quote" to create one.'}
          </div>
        )}
      </div>

      <Pagination {...pager} label="quotes" />

      {draft && (
        <FormModal
          title={draft.id ? 'Edit Quote' : 'Add New Quote'}
          editing={!!draft.id}
          addLabel="Add Quote"
          onSubmit={handleSubmit}
          onClose={() => setDraft(null)}
        >
          <div>
            <label className="admin-label">Quote Text</label>
            <textarea
              className="admin-input min-h-[100px]"
              placeholder="Enter the quote..."
              value={draft.text}
              onChange={(e) => setDraft({ ...draft, text: e.target.value })}
            />
          </div>
          <div>
            <label className="admin-label">Author</label>
            <input
              type="text"
              className="admin-input"
              placeholder="e.g., Albert Einstein"
              value={draft.author}
              onChange={(e) => setDraft({ ...draft, author: e.target.value })}
            />
          </div>
        </FormModal>
      )}
    </AdminPageLayout>
  );
};

export default QuotesEditor;
