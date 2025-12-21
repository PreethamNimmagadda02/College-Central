import React, { useState } from 'react';
import { AdminConfig } from '../types';
import { AdminHeader, HomeIcon } from './AdminIcons';

interface Props {
  config: AdminConfig;
  addHostel: (hostel: string) => void;
  updateHostel: (index: number, hostel: string) => void;
  deleteHostel: (index: number) => void;
}

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const HostelsEditor: React.FC<Props> = ({ config, addHostel, updateHostel, deleteHostel }) => {
  const [newHostel, setNewHostel] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleAddHostel = () => {
    if (newHostel.trim()) {
      addHostel(newHostel.trim());
      setNewHostel('');
    }
  };

  const handleStartEdit = (index: number, value: string) => {
    setEditingIndex(index);
    setEditValue(value);
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null && editValue.trim()) {
      updateHostel(editingIndex, editValue.trim());
      setEditingIndex(null);
      setEditValue('');
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  return (
    <div className="space-y-8">
      <AdminHeader 
        icon={<HomeIcon />} 
        title="Hostels" 
        subtitle="Manage available hostel options for students" 
      />

      {/* Add New Hostel */}
      <div className="admin-card">
        <h3 className="text-lg font-semibold text-white mb-4">Add New Hostel</h3>
        <div className="flex gap-4">
          <input
            type="text"
            className="admin-input flex-1"
            placeholder="Enter hostel name..."
            value={newHostel}
            onChange={e => setNewHostel(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleAddHostel()}
          />
          <button onClick={handleAddHostel} className="admin-btn admin-btn-primary">
            <PlusIcon />
            Add Hostel
          </button>
        </div>
      </div>

      {/* Hostels Grid */}
      <div className="admin-card">
        <h3 className="text-lg font-semibold text-white mb-6">
          All Hostels ({config.hostels?.length || 0})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(config.hostels || []).map((hostel, index) => (
            <div key={index} className="admin-list-item">
              {editingIndex === index ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    className="admin-input"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSaveEdit()}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSaveEdit} className="admin-btn admin-btn-success text-sm flex-1">
                      Save
                    </button>
                    <button onClick={handleCancelEdit} className="admin-btn admin-btn-secondary text-sm flex-1">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                    <HomeIcon />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{hostel}</p>
                    <p className="text-indigo-400 text-sm">Hostel #{index + 1}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStartEdit(index, hostel)}
                      className="admin-btn admin-btn-secondary text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteHostel(index)}
                      className="admin-btn admin-btn-danger text-sm"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {(config.hostels?.length || 0) === 0 && (
            <div className="col-span-full text-center py-12 text-indigo-400">
              No hostels added yet. Add your first hostel above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HostelsEditor;
