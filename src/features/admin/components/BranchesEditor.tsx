import { GraduationCap, GripHorizontal, Plus, Trash2 } from 'lucide-react';
import React, { useState } from 'react';

import { AdminConfigApi } from '../hooks/useAdminConfig';
import { AdminHeader, AdminPageLayout, SearchInput } from './ui';

type Props = Pick<AdminConfigApi, 'config' | 'branches'>;

const BranchesEditor: React.FC<Props> = ({ config, branches }) => {
  const [newBranch, setNewBranch] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleAddBranch = () => {
    if (newBranch.trim()) {
      branches.add(newBranch.trim());
      setNewBranch('');
    }
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null && editValue.trim()) {
      branches.update(editingIndex, editValue.trim());
      setEditingIndex(null);
      setEditValue('');
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newBranches = [...(config.branches || [])];
    const removed = newBranches.splice(draggedIndex, 1)[0];
    if (removed !== undefined) {
      newBranches.splice(index, 0, removed);
      branches.set(newBranches);
      setDraggedIndex(index);
    }
  };

  const filteredBranches = (config.branches || []).filter((branch) =>
    branch.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminPageLayout>
      <AdminHeader
        icon={GraduationCap}
        title="Branches / Departments"
        subtitle="Manage available academic branches for students"
      />

      {/* Add New Branch */}
      <div className="admin-card">
        <h3 className="text-lg font-semibold text-white mb-4">Add New Branch</h3>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <input
            type="text"
            className="admin-input flex-1"
            placeholder="Enter branch name..."
            value={newBranch}
            onChange={(e) => setNewBranch(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddBranch()}
          />
          <button
            onClick={handleAddBranch}
            className="admin-btn admin-btn-primary w-full sm:w-auto justify-center"
          >
            <Plus className="w-5 h-5" />
            Add Branch
          </button>
        </div>
      </div>

      <SearchInput
        className="flex-1 max-w-2xl"
        placeholder="Search branches..."
        value={searchQuery}
        onChange={setSearchQuery}
      />

      {/* Branches List */}
      <div className="admin-card">
        <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-white">
            All Branches ({config.branches?.length || 0})
          </h3>
          <span className="text-indigo-400 text-xs sm:text-sm hidden sm:inline">
            Drag to reorder
          </span>
        </div>

        <div className="space-y-2 sm:space-y-3">
          {filteredBranches.map((branch) => {
            const actualIndex = (config.branches || []).indexOf(branch);
            return (
              <div
                key={actualIndex}
                draggable={!searchQuery}
                onDragStart={() => setDraggedIndex(actualIndex)}
                onDragOver={(e) => handleDragOver(e, actualIndex)}
                onDragEnd={() => setDraggedIndex(null)}
                className={`admin-list-item flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 ${
                  draggedIndex === actualIndex ? 'opacity-50' : ''
                }`}
              >
                {/* Top row with drag handle, number, and branch name */}
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  {!searchQuery && (
                    <span className="cursor-grab text-indigo-400 hover:text-indigo-300 hidden sm:block">
                      <GripHorizontal className="w-4 h-4" />
                    </span>
                  )}
                  <span className="text-indigo-400 text-xs sm:text-sm w-6 sm:w-8 flex-shrink-0">
                    #{actualIndex + 1}
                  </span>

                  {editingIndex === actualIndex ? (
                    <input
                      type="text"
                      className="admin-input flex-1 min-w-0"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                      autoFocus
                    />
                  ) : (
                    <span className="flex-1 text-white text-sm sm:text-base break-words min-w-0">
                      {branch}
                    </span>
                  )}
                </div>

                {/* Action buttons */}
                {editingIndex === actualIndex ? (
                  <div className="flex gap-2 sm:gap-3 ml-auto sm:ml-0">
                    <button
                      onClick={handleSaveEdit}
                      className="admin-btn admin-btn-success text-xs sm:text-sm flex-1 sm:flex-none justify-center"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingIndex(null)}
                      className="admin-btn admin-btn-secondary text-xs sm:text-sm flex-1 sm:flex-none justify-center"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 sm:gap-3 ml-auto sm:ml-0">
                    <button
                      onClick={() => {
                        setEditingIndex(actualIndex);
                        setEditValue(branch);
                      }}
                      className="admin-btn admin-btn-secondary text-xs sm:text-sm flex-1 sm:flex-none justify-center"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => branches.remove(actualIndex)}
                      className="admin-btn admin-btn-danger text-xs sm:text-sm flex-shrink-0 justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {filteredBranches.length === 0 && (
            <div className="text-center py-8 text-indigo-400">
              {searchQuery ? 'No branches match your search' : 'No branches added yet'}
            </div>
          )}
        </div>
      </div>
    </AdminPageLayout>
  );
};

export default BranchesEditor;
