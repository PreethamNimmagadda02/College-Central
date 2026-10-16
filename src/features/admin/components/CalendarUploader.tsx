import {
  extractWithWorkflow,
  ExtractionProgress,
  ExtractionStats,
} from '@services/aiExtractionWorkflow';
import { calendarExtractionConfig } from '@services/extractionSchemas';
import { Check, CheckCircle, Upload, X } from 'lucide-react';
import React, { useState } from 'react';
import * as XLSX from 'xlsx';

import { AdminCalendarEvent } from '../types';

type EventType = AdminCalendarEvent['type'];
type CalendarEvent = Omit<AdminCalendarEvent, 'id'>;

interface Props {
  onImport: (events: CalendarEvent[]) => void;
  onClose: () => void;
}

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  'Start of Semester': 'bg-green-500',
  'Mid-Semester Exams': 'bg-yellow-500',
  'End-Semester Exams': 'bg-red-500',
  Holiday: 'bg-purple-500',
  Other: 'bg-blue-500',
};

// Detect event type based on description keywords
const detectEventType = (description: string): EventType => {
  if (
    /holiday|diwali|holi|christmas|independence\s*day|republic\s*day|jayanti|purnima|eid|id-e|idu'l|muharram|puja|mahavir|buddha|guru\s*nanak|good\s*friday|vacation|break/i.test(
      description
    )
  ) {
    return 'Holiday';
  }
  if (/mid.?semester.?exam/i.test(description)) return 'Mid-Semester Exams';
  if (/end.?semester.?exam/i.test(description)) return 'End-Semester Exams';
  if (/commencement.*class|start\s*of\s*semester/i.test(description)) return 'Start of Semester';
  return 'Other';
};

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

// Accepts Excel dates, Excel serial numbers, DD-MM-YYYY, YYYY-MM-DD or anything Date can parse
const parseDate = (value: unknown): string | null => {
  if (value instanceof Date) return toIsoDate(value);
  // Excel serial dates count days from 1899-12-30
  if (typeof value === 'number') return toIsoDate(new Date((value - 25569) * 86400 * 1000));
  if (typeof value !== 'string') return null;

  const dateStr = value.trim();
  const dmy = dateStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmy?.[1] && dmy[2] && dmy[3]) {
    return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : toIsoDate(parsed);
};

const processExcelFile = (buffer: ArrayBuffer): CalendarEvent[] => {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0] ?? ''];
  if (!sheet) throw new Error('No sheets found in the workbook');

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: null,
    raw: false,
  });
  if (rows.length < 2) throw new Error('File appears to be empty or has no data rows');

  // Find the header row by looking for date/description-like column names
  let headerRowIndex = 0;
  let dateColIndex = -1;
  let endDateColIndex = -1;
  let descColIndex = -1;

  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;

    row.forEach((value, j) => {
      const cell = String(value || '').toLowerCase();
      if (cell.includes('date') && !cell.includes('end')) {
        dateColIndex = j;
        headerRowIndex = i;
      }
      if (cell.includes('end') && cell.includes('date')) endDateColIndex = j;
      if (/description|event|activity|details/.test(cell)) descColIndex = j;
    });
    if (dateColIndex >= 0 && descColIndex >= 0) break;
  }

  // No headers: assume Date, End Date (optional), Description
  if (dateColIndex < 0) {
    const hasEndDate = (rows[0]?.length ?? 0) > 2;
    dateColIndex = 0;
    descColIndex = hasEndDate ? 2 : 1;
    if (hasEndDate) endDateColIndex = 1;
  }

  return rows.slice(headerRowIndex + 1).flatMap((row) => {
    if (!Array.isArray(row) || row.length === 0) return [];
    const date = parseDate(row[dateColIndex]);
    const endDate = endDateColIndex >= 0 ? parseDate(row[endDateColIndex]) : null;
    const descVal = row[descColIndex];
    const description = descVal ? String(descVal).trim() : '';
    if (!date || !description) return [];

    const event: CalendarEvent = { date, description, type: detectEventType(description) };
    if (endDate && endDate !== date) event.endDate = endDate;
    return [event];
  });
};

const CalendarUploader: React.FC<Props> = ({ onImport, onClose }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedEvents, setParsedEvents] = useState<CalendarEvent[]>([]);
  const [semesterDates, setSemesterDates] = useState<{ start: string; end: string } | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState<ExtractionProgress | null>(null);
  const [extractionStats, setExtractionStats] = useState<ExtractionStats | null>(null);

  const processPdfFile = async (buffer: ArrayBuffer) => {
    setExtractionProgress({
      phase: 'preparing',
      totalChunks: 0,
      completedChunks: 0,
      currentChunk: 0,
      message: 'Reading PDF...',
    });

    const pdfjsLib = await import('pdfjs-dist');
    // Use local worker to avoid CSP issues with CDN
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    const pageTexts = await Promise.all(
      Array.from({ length: pdf.numPages }, async (_, i) => {
        const page = await pdf.getPage(i + 1);
        const textContent = await page.getTextContent();
        return textContent.items.map((item) => ('str' in item ? item.str : '')).join(' ');
      })
    );

    const result = await extractWithWorkflow(
      pageTexts.join('\n') + '\n',
      calendarExtractionConfig,
      setExtractionProgress
    );
    if (!result.success && result.data.length === 0) {
      throw new Error(result.errors.join('; ') || 'Failed to extract events with AI');
    }
    setExtractionStats(result.stats);
    return result.data;
  };

  const processFile = async (file: File) => {
    setError(null);
    setFileName(file.name);
    setIsExtracting(true);
    setExtractionProgress(null);
    setExtractionStats(null);

    try {
      const buffer = await file.arrayBuffer();
      const events = file.name.endsWith('.pdf')
        ? await processPdfFile(buffer)
        : processExcelFile(buffer);

      if (events.length === 0) {
        setError(
          'No valid events could be extracted from the file. Make sure the file contains dates and descriptions.'
        );
        return;
      }

      events.sort((a, b) => a.date.localeCompare(b.date));

      // Detect semester dates
      const startEvent = events.find((e) => e.type === 'Start of Semester');
      const lastEndExam = events.filter((e) => e.type === 'End-Semester Exams').at(-1);
      const lastEvent = events.at(-1);

      setParsedEvents(events);
      setSemesterDates({
        start: startEvent?.date || events[0]?.date || '',
        end: lastEndExam?.endDate || lastEndExam?.date || lastEvent?.date || '',
      });
    } catch (err) {
      console.error('Error parsing file:', err);
      setError(err instanceof Error ? err.message : 'Failed to parse the file.');
    } finally {
      setIsExtracting(false);
      setExtractionProgress(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && /\.(xlsx|xls|pdf)$/.test(file.name)) {
      processFile(file);
    } else {
      setError('Please upload an Excel file (.xlsx, .xls) or PDF file (.pdf)');
    }
  };

  const resetFile = () => {
    setParsedEvents([]);
    setSemesterDates(null);
    setFileName(null);
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div
        className="admin-modal max-w-4xl w-[90%] max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="admin-modal-title mb-0">Upload Academic Calendar</h3>
          <button onClick={onClose} className="text-indigo-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-4 text-red-200">
            {error}
          </div>
        )}

        {/* Extraction Progress */}
        {isExtracting && extractionProgress && (
          <div className="bg-slate-800/50 rounded-lg p-6 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="animate-spin w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full" />
              <span className="text-white font-medium">Extracting events...</span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-indigo-300 capitalize">{extractionProgress.phase}</span>
                {extractionProgress.totalChunks > 0 && (
                  <span className="text-indigo-400">
                    Chunk {extractionProgress.currentChunk} of {extractionProgress.totalChunks}
                  </span>
                )}
              </div>

              {extractionProgress.totalChunks > 0 && (
                <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full transition-all duration-300"
                    style={{
                      width: `${(extractionProgress.completedChunks / extractionProgress.totalChunks) * 100}%`,
                    }}
                  />
                </div>
              )}

              <p className="text-indigo-400 text-sm">{extractionProgress.message}</p>
            </div>
          </div>
        )}

        {/* Extraction Stats Summary */}
        {!isExtracting && extractionStats && parsedEvents.length > 0 && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4 text-green-300 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>
                Processed {extractionStats.totalChunks} chunk
                {extractionStats.totalChunks !== 1 ? 's' : ''}
                {extractionStats.duplicatesRemoved > 0 &&
                  `, removed ${extractionStats.duplicatesRemoved} duplicate${extractionStats.duplicatesRemoved !== 1 ? 's' : ''}`}
              </span>
            </div>
          </div>
        )}

        {parsedEvents.length === 0 ? (
          <>
            {/* Upload Zone */}
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                isDragging
                  ? 'border-indigo-400 bg-indigo-500/10'
                  : 'border-indigo-500/30 hover:border-indigo-500/50'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <div className="text-indigo-400 mb-4 flex justify-center">
                <Upload strokeWidth={1.5} className="w-12 h-12" />
              </div>
              <p className="text-white text-lg mb-2">Drag & drop your calendar file here</p>
              <p className="text-indigo-400 text-sm mb-4">or click to browse</p>
              <input
                type="file"
                accept=".xlsx,.xls,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) processFile(file);
                }}
                className="hidden"
                id="calendar-file-input"
              />
              <label
                htmlFor="calendar-file-input"
                className="admin-btn admin-btn-primary cursor-pointer inline-flex"
              >
                Select File
              </label>
              <p className="text-indigo-500 text-xs mt-4">Supports: .xlsx, .xls, .pdf files</p>
            </div>

            {/* Format Info */}
            <div className="mt-6 p-4 bg-slate-800/50 rounded-lg">
              <h4 className="text-indigo-300 font-medium mb-2">Expected Format</h4>
              <p className="text-indigo-400 text-sm">
                <strong>Excel files:</strong> Should have columns for <strong>Date</strong> and{' '}
                <strong>Description</strong> (optionally <strong>End Date</strong>).
                <br />
                <strong>PDF files:</strong> Dates and event descriptions will be extracted
                automatically.
                <br />
                Event types are auto-detected based on keywords.
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Preview */}
            <div className="flex items-center gap-3 mb-4 text-indigo-300">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span>
                Extracted <strong className="text-white">{parsedEvents.length}</strong> events from{' '}
                <strong className="text-white">{fileName}</strong>
              </span>
            </div>

            {semesterDates && (
              <div className="flex gap-4 mb-4">
                <div className="flex-1 bg-slate-800/50 rounded-lg p-3">
                  <p className="text-indigo-400 text-xs mb-1">Semester Start</p>
                  <p className="text-white font-medium">{semesterDates.start}</p>
                </div>
                <div className="flex-1 bg-slate-800/50 rounded-lg p-3">
                  <p className="text-indigo-400 text-xs mb-1">Semester End</p>
                  <p className="text-white font-medium">{semesterDates.end}</p>
                </div>
              </div>
            )}

            {/* Events Table */}
            <div className="flex-1 overflow-auto bg-slate-900/50 rounded-lg">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-800">
                  <tr>
                    <th className="text-left p-3 text-indigo-300 font-medium">Date</th>
                    <th className="text-left p-3 text-indigo-300 font-medium">Description</th>
                    <th className="text-left p-3 text-indigo-300 font-medium">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedEvents.map((event, index) => (
                    <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                      <td className="p-3 text-indigo-200 whitespace-nowrap">
                        {event.date}
                        {event.endDate && (
                          <span className="text-indigo-400"> to {event.endDate}</span>
                        )}
                      </td>
                      <td className="p-3 text-white">{event.description}</td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${EVENT_TYPE_COLORS[event.type]} text-white`}
                        >
                          {event.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-700">
              <button onClick={resetFile} className="admin-btn admin-btn-secondary">
                Upload Different File
              </button>
              <div className="flex-1" />
              <button onClick={onClose} className="admin-btn admin-btn-secondary">
                Cancel
              </button>
              <button
                onClick={() => {
                  onImport(parsedEvents);
                  onClose();
                }}
                className="admin-btn admin-btn-success"
              >
                <Check className="w-5 h-5" />
                Import {parsedEvents.length} Events
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CalendarUploader;
