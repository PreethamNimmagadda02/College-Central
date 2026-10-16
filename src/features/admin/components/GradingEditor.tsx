import { DEFAULT_GRADING_SCALE } from '@config/gradingScale';
import {
  ChevronDown,
  ChevronUp,
  Info,
  Pencil,
  Plus,
  Save,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import React, { useState } from 'react';

import { AdminConfigApi } from '../hooks/useAdminConfig';
import { AdminGradeDefinition } from '../types';
import { AdminPageLayout } from './ui';

type Props = Pick<AdminConfigApi, 'config' | 'grades'>;

// Predefined color options for grade display
const COLOR_OPTIONS = [
  {
    name: 'Green (A+)',
    value: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
  },
  {
    name: 'Emerald (A)',
    value: 'text-emerald-800 bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200',
  },
  { name: 'Blue (B+)', value: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
  { name: 'Sky (B)', value: 'text-sky-700 bg-sky-200 dark:bg-sky-900/40 dark:text-sky-300' },
  {
    name: 'Amber (C+)',
    value: 'text-amber-700 bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300',
  },
  {
    name: 'Yellow (C)',
    value: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  {
    name: 'Orange (D)',
    value: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400',
  },
  { name: 'Red (F)', value: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400' },
  {
    name: 'Purple',
    value: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400',
  },
  { name: 'Pink', value: 'text-pink-600 bg-pink-100 dark:bg-pink-900/30 dark:text-pink-400' },
  {
    name: 'Indigo',
    value: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400',
  },
  { name: 'Teal', value: 'text-teal-600 bg-teal-100 dark:bg-teal-900/30 dark:text-teal-400' },
];

const EMPTY_GRADE: Omit<AdminGradeDefinition, 'id'> = {
  grade: '',
  points: 0,
  color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
};

const colorName = (value: string) => COLOR_OPTIONS.find((c) => c.value === value)?.name || 'Custom';

// Field inputs shared by the add form, the desktop table and the mobile cards
interface FieldProps<T> {
  value: T;
  onChange: (value: T) => void;
  className: string;
  placeholder?: string;
}

const LetterInput: React.FC<FieldProps<string>> = ({ value, onChange, className, placeholder }) => (
  <input
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value.toUpperCase())}
    placeholder={placeholder}
    className={`admin-input ${className}`}
    maxLength={3}
  />
);

const PointsInput: React.FC<FieldProps<number>> = ({ value, onChange, className, placeholder }) => (
  <input
    type="number"
    value={value}
    onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
    placeholder={placeholder}
    className={`admin-input ${className}`}
    min="0"
    max="15"
    step="0.5"
  />
);

const ColorSelect: React.FC<FieldProps<string>> = ({ value, onChange, className }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`admin-input ${className}`}
  >
    {COLOR_OPTIONS.map((color) => (
      <option key={color.value} value={color.value}>
        {color.name}
      </option>
    ))}
  </select>
);

const OrderControls: React.FC<{
  index: number;
  count: number;
  onMove: (delta: -1 | 1) => void;
  compact?: boolean;
}> = ({ index, count, onMove, compact }) => {
  const button = `${compact ? 'p-0.5' : 'p-1'} rounded hover:bg-indigo-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-indigo-400`;
  const icon = compact ? 'w-3 h-3' : 'w-4 h-4';
  return (
    <div className={compact ? 'flex flex-col gap-0.5' : 'flex items-center gap-1'}>
      <button onClick={() => onMove(-1)} disabled={index === 0} className={button} title="Move Up">
        <ChevronUp className={icon} />
      </button>
      <span className={`text-indigo-400 text-center ${compact ? 'text-xs' : 'text-sm w-6'}`}>
        {index + 1}
      </span>
      <button
        onClick={() => onMove(1)}
        disabled={index === count - 1}
        className={button}
        title="Move Down"
      >
        <ChevronDown className={icon} />
      </button>
    </div>
  );
};

const GradingEditor: React.FC<Props> = ({ config, grades }) => {
  // Show the built-in scale until one is saved to the config
  const isUsingDefaults = !config.gradingScale?.length;
  const gradingScale = isUsingDefaults ? DEFAULT_GRADING_SCALE : config.gradingScale;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGrade, setNewGrade] = useState(EMPTY_GRADE);

  const handleAddGrade = () => {
    if (!newGrade.grade.trim()) return;
    grades.add(newGrade);
    setNewGrade(EMPTY_GRADE);
    setShowAddForm(false);
  };

  const move = (index: number, delta: -1 | 1) => {
    const next = [...gradingScale];
    const [moved] = next.splice(index, 1);
    if (!moved) return;
    next.splice(index + delta, 0, moved);
    grades.set(next);
  };

  const confirmDelete = (grade: AdminGradeDefinition) => {
    if (window.confirm(`Delete grade "${grade.grade}"? This action cannot be undone.`)) {
      grades.remove(grade.id);
    }
  };

  const editOrDone = (grade: AdminGradeDefinition, doneClass: string) =>
    editingId === grade.id ? (
      <button
        onClick={() => setEditingId(null)}
        className={`admin-btn admin-btn-secondary ${doneClass}`}
      >
        Done
      </button>
    ) : (
      <button
        onClick={() => setEditingId(grade.id)}
        className="p-2 rounded-lg hover:bg-indigo-500/20 transition-colors"
        title="Edit"
      >
        <Pencil className="w-4 h-4 text-indigo-400" />
      </button>
    );

  const deleteButton = (grade: AdminGradeDefinition) => (
    <button
      onClick={() => confirmDelete(grade)}
      className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
      title="Delete"
    >
      <Trash2 className="w-4 h-4 text-red-500" />
    </button>
  );

  const emptyText = 'No grades configured. Click "Add Grade" to get started.';

  return (
    <AdminPageLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold admin-gradient-text">
            Grading Scale Configuration
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Configure letter grades and their corresponding grade points used for SGPA/CGPA
            calculations
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isUsingDefaults && (
            <button
              onClick={() => grades.set(DEFAULT_GRADING_SCALE)}
              className="admin-btn admin-btn-secondary flex items-center gap-2"
              title="Save these default grades to the database"
            >
              <Save className="w-4 h-4" />
              Save Defaults
            </button>
          )}
          <button
            onClick={() => setShowAddForm(true)}
            className="admin-btn admin-btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Grade
          </button>
        </div>
      </div>

      {isUsingDefaults && (
        <div className="admin-card p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <TriangleAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium">Showing Default Grades</p>
              <p className="text-amber-700 dark:text-amber-300 mt-1">
                These are the standard grades. Click "Save Defaults" to save them to the database,
                or customize as needed.
              </p>
            </div>
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="admin-card p-4 sm:p-6 border-2 border-dashed border-blue-500/30">
          <h3 className="text-lg font-semibold mb-4">Add New Grade</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Grade Letter
              </label>
              <LetterInput
                value={newGrade.grade}
                onChange={(grade) => setNewGrade({ ...newGrade, grade })}
                placeholder="e.g., A+"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Grade Points
              </label>
              <PointsInput
                value={newGrade.points}
                onChange={(points) => setNewGrade({ ...newGrade, points })}
                placeholder="e.g., 10"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Display Color
              </label>
              <ColorSelect
                value={newGrade.color}
                onChange={(color) => setNewGrade({ ...newGrade, color })}
                className="w-full"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleAddGrade}
                disabled={!newGrade.grade.trim()}
                className="admin-btn admin-btn-primary flex-1"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewGrade(EMPTY_GRADE);
                }}
                className="admin-btn admin-btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
          {newGrade.grade && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Preview:</span>
              <span className={`px-3 py-1 rounded-lg font-semibold ${newGrade.color}`}>
                {newGrade.grade}
              </span>
              <span className="text-sm text-slate-500">= {newGrade.points} points</span>
            </div>
          )}
        </div>
      )}

      {/* Grade Scale - Desktop Table */}
      <div className="admin-card overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-indigo-500/30">
              <tr>
                {['Order', 'Grade', 'Points', 'Color', 'Preview', 'Actions'].map((heading) => (
                  <th
                    key={heading}
                    className={`px-4 py-3 text-xs font-semibold text-indigo-400 uppercase tracking-wider ${heading === 'Actions' ? 'text-right' : 'text-left'}`}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-500/20">
              {gradingScale.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-indigo-400">
                    {emptyText}
                  </td>
                </tr>
              ) : (
                gradingScale.map((grade, index) => {
                  const editing = editingId === grade.id;
                  return (
                    <tr key={grade.id} className="hover:bg-indigo-500/10 transition-colors">
                      <td className="px-4 py-3">
                        <OrderControls
                          index={index}
                          count={gradingScale.length}
                          onMove={(delta) => move(index, delta)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        {editing ? (
                          <LetterInput
                            value={grade.grade}
                            onChange={(value) => grades.update(grade.id, { grade: value })}
                            className="w-20"
                          />
                        ) : (
                          <span className="font-semibold text-lg text-white">{grade.grade}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editing ? (
                          <PointsInput
                            value={grade.points}
                            onChange={(points) => grades.update(grade.id, { points })}
                            className="w-24"
                          />
                        ) : (
                          <span className="text-white font-medium">{grade.points}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editing ? (
                          <ColorSelect
                            value={grade.color}
                            onChange={(color) => grades.update(grade.id, { color })}
                            className="w-full max-w-[150px]"
                          />
                        ) : (
                          <span className="text-xs text-indigo-400">{colorName(grade.color)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-lg font-semibold ${grade.color}`}>
                          {grade.grade}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {editOrDone(grade, 'text-sm px-3 py-1')}
                          {deleteButton(grade)}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grade Scale - Mobile Cards */}
      <div className="admin-card md:hidden">
        <h3 className="text-lg font-semibold text-white mb-4">
          All Grades ({gradingScale.length})
        </h3>
        <div className="space-y-3">
          {gradingScale.length === 0 ? (
            <div className="text-center py-8 text-indigo-400">{emptyText}</div>
          ) : (
            gradingScale.map((grade, index) => {
              const editing = editingId === grade.id;
              return (
                <div key={grade.id} className="admin-list-item flex flex-col gap-3 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <OrderControls
                        index={index}
                        count={gradingScale.length}
                        onMove={(delta) => move(index, delta)}
                        compact
                      />
                      <span className={`px-4 py-2 rounded-lg font-bold text-lg ${grade.color}`}>
                        {grade.grade}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {editOrDone(grade, 'text-xs px-2 py-1')}
                      {deleteButton(grade)}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-indigo-400">Points: </span>
                      {editing ? (
                        <PointsInput
                          value={grade.points}
                          onChange={(points) => grades.update(grade.id, { points })}
                          className="w-16 text-sm py-1"
                        />
                      ) : (
                        <span className="text-white font-semibold">{grade.points}</span>
                      )}
                    </div>
                    <div>
                      <span className="text-indigo-400">Color: </span>
                      {editing ? (
                        <ColorSelect
                          value={grade.color}
                          onChange={(color) => grades.update(grade.id, { color })}
                          className="text-xs py-1"
                        />
                      ) : (
                        <span className="text-white">{colorName(grade.color)}</span>
                      )}
                    </div>
                  </div>

                  {editing && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-indigo-400">Grade Letter: </span>
                      <LetterInput
                        value={grade.grade}
                        onChange={(value) => grades.update(grade.id, { grade: value })}
                        className="w-16 text-sm py-1"
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="admin-card p-4 border border-indigo-500/30">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-indigo-200">
            <p className="font-medium text-white mb-1">About the Grading Scale</p>
            <ul className="list-disc list-inside space-y-1 text-indigo-300">
              <li>Grade points are used to calculate SGPA and CGPA</li>
              <li>The order of grades matters for display in dropdowns</li>
              <li>Typically, higher grades appear first (A+ → F)</li>
              <li>Changes are reflected immediately on the Grades page</li>
            </ul>
          </div>
        </div>
      </div>
    </AdminPageLayout>
  );
};

export default GradingEditor;
