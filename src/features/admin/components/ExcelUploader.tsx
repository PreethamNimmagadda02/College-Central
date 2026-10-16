import { Upload, X } from 'lucide-react';
import React, { useId, useState } from 'react';
import * as XLSX from 'xlsx';

const PREVIEW_ROWS = 50;

// Tailwind needs literal class names, so each accent is spelled out
const ACCENTS = {
  indigo: {
    dragging: 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20',
    idle: 'hover:border-indigo-400',
    icon: 'text-indigo-500',
    button: 'bg-indigo-600 hover:bg-indigo-700',
    spinner: 'border-indigo-600',
  },
  emerald: {
    dragging: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
    idle: 'hover:border-emerald-400',
    icon: 'text-emerald-500',
    button: 'bg-emerald-600 hover:bg-emerald-700',
    spinner: 'border-emerald-600',
  },
};

// First non-empty value among the spreadsheet's possible column names
export const pickColumn = (row: Record<string, unknown>, keys: string[]) =>
  String(keys.map((key) => row[key]).find(Boolean) ?? '').trim();

interface ExcelUploaderProps<T> {
  title: string;
  subtitle: string;
  dropHint: string;
  accent: keyof typeof ACCENTS;
  format: { columns: string[]; example: string[] };
  // Throws with a user-facing message when the sheet has nothing usable
  parse: (sheet: XLSX.WorkSheet) => T[];
  // Plural, lower-case: "students"
  noun: string;
  summary?: (items: T[]) => string;
  columns: { label: string; className: string; render: (item: T) => React.ReactNode }[];
  onImport: (items: T[]) => void;
  onClose: () => void;
}

function ExcelUploader<T>({
  title,
  subtitle,
  dropHint,
  accent,
  format,
  parse,
  noun,
  summary,
  columns,
  onImport,
  onClose,
}: ExcelUploaderProps<T>) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<T[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputId = useId();
  const colors = ACCENTS[accent];

  const processFile = async (file: File) => {
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      setError('Please upload an Excel file (.xlsx, .xls) or CSV');
      return;
    }
    setIsProcessing(true);
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0] ?? ''];
      if (!sheet) throw new Error('No sheets found in the workbook');
      setItems(parse(sheet));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
      setItems([]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {items.length === 0 && (
            <>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files[0];
                  if (file) processFile(file);
                }}
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                  isDragging
                    ? colors.dragging
                    : `border-gray-300 dark:border-gray-600 ${colors.idle}`
                }`}
              >
                <div className="flex flex-col items-center">
                  <Upload
                    strokeWidth={1.5}
                    className={`w-12 h-12 mb-4 ${isDragging ? colors.icon : 'text-gray-400'}`}
                  />
                  <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {isDragging ? 'Drop your file here' : dropHint}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    or click to browse
                  </p>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) processFile(file);
                    }}
                    className="hidden"
                    id={inputId}
                  />
                  <label
                    htmlFor={inputId}
                    className={`px-6 py-2 text-white rounded-lg cursor-pointer transition-colors ${colors.button}`}
                  >
                    Select File
                  </label>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Expected Format:
                </h4>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-mono overflow-x-auto">
                  <table className="min-w-full text-left">
                    <thead>
                      <tr className="border-b dark:border-gray-600">
                        {format.columns.map((column) => (
                          <th key={column} className="py-1 px-2">
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {format.example.map((value, i) => (
                          <td key={i} className="py-1 px-2">
                            {value}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {isProcessing && (
            <div className="flex items-center justify-center py-8">
              <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${colors.spinner}`} />
              <span className="ml-3 text-gray-600 dark:text-gray-400">Processing file...</span>
            </div>
          )}

          {items.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Preview ({items.length.toLocaleString()} {noun} found)
                  </h3>
                  {summary && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{summary(items)}</p>
                  )}
                </div>
                <button
                  onClick={() => setItems([])}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
                >
                  Upload different file
                </button>
              </div>

              <div className="border dark:border-gray-600 rounded-lg overflow-hidden">
                <div className="max-h-[300px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                      <tr>
                        {columns.map((column) => (
                          <th
                            key={column.label}
                            className="px-4 py-2 text-left text-gray-600 dark:text-gray-300"
                          >
                            {column.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                      {items.slice(0, PREVIEW_ROWS).map((item, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          {columns.map((column) => (
                            <td key={column.label} className={`px-4 py-2 ${column.className}`}>
                              {column.render(item)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {items.length > PREVIEW_ROWS && (
                  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 text-sm text-gray-500">
                    Showing first {PREVIEW_ROWS} of {items.length.toLocaleString()} {noun}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onImport(items);
              onClose();
            }}
            disabled={items.length === 0}
            className={`px-6 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${colors.button}`}
          >
            Import {items.length.toLocaleString()} {noun.charAt(0).toUpperCase() + noun.slice(1)}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExcelUploader;
