import React from 'react';
import * as XLSX from 'xlsx';

import { AdminCourse } from '../types';
import ExcelUploader from './ExcelUploader';

type Course = Omit<AdminCourse, 'id'>;

interface Props {
  onImport: (courses: Course[]) => void;
  onClose: () => void;
}

// NEP: L + T + 0.5P, CBCS: 3L + 2T + P
const calculateCredits = (ltp: string, isNep: boolean): number => {
  const match = ltp.match(/^(\d+)-(\d+)-(\d+)$/);
  if (!match) return 0;
  const [L = 0, T = 0, P = 0] = match.slice(1).map(Number);
  return isNep ? L + T + 0.5 * P : 3 * L + 2 * T + P;
};

// To 24h "HH:MM"; times without AM/PM before 8 are assumed to be afternoon
const normalizeTime = (timeStr: string): string => {
  if (!timeStr.includes(':')) return timeStr;
  const isPM = timeStr.toUpperCase().includes('PM');
  const isAM = timeStr.toUpperCase().includes('AM');
  const parts = timeStr
    .replace(/\s*(AM|PM)/gi, '')
    .trim()
    .split(':');
  if (parts.length < 2) return timeStr;

  let h = parseInt(parts[0] || '0', 10);
  const m = parts[1] || '00';
  if (isPM && h !== 12) h += 12;
  if (isAM && h === 12) h = 0;
  if (!isPM && !isAM && h < 8) h += 12;
  return `${h.toString().padStart(2, '0')}:${m}`;
};

// "CSC305\n(Computer Networks)" or "CSC305 (Computer Networks)" → code + name
const splitCourseCell = (cell: string): [string, string] => {
  const clean = (s: string) => s.replace(/[()]/g, '').trim();
  if (cell.includes('\n')) {
    const [code = '', ...rest] = cell.split('\n');
    return [code.trim(), clean(rest.join(' '))];
  }
  const match = cell.match(/^([A-Z0-9]+)\s*[\n(]?(.*?)[)]?$/i);
  if (match) return [match[1]?.trim() || '', clean(match[2] || '')];
  const [code = '', ...rest] = cell.split(' ');
  return [code, clean(rest.join(' '))];
};

// Timetable layout: Sl No (col B), Course (col C), LTP (col H), Day/Time/Venue (cols I-K).
// A row with a Sl No starts a course; the rows after it add that course's slots.
const parseTimetable = (sheet: XLSX.WorkSheet): Course[] => {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });
  const coursesMap = new Map<string, Course>();
  let currentCourse: Course | null = null;

  // Keep the first occurrence of each course code
  const commit = () => {
    if (currentCourse && !coursesMap.has(currentCourse.courseCode)) {
      coursesMap.set(currentCourse.courseCode, currentCourse);
    }
  };

  // The first 5 rows are headers
  for (const row of rows.slice(5)) {
    if (!Array.isArray(row)) continue;
    const [, slNo, courseCell] = row;
    const ltp = row[7];

    if (slNo && courseCell && typeof slNo === 'number') {
      commit();
      const [rawCode, name] = splitCourseCell(String(courseCell).trim());
      const code = rawCode.toUpperCase();
      const ltpStr = ltp ? String(ltp).trim() : '3-0-0';
      const isNep = code.startsWith('N');
      currentCourse = {
        courseCode: code,
        courseName: name || 'Unknown Course',
        ltp: ltpStr,
        credits: calculateCredits(ltpStr, isNep),
        courseType: isNep ? 'NEP' : 'CBCS',
        slots: [],
      };
      continue;
    }

    const [day, timeStr, venue] = [row[8], row[9], row[10]];
    if (currentCourse && day && day !== 'Day' && timeStr) {
      const time = String(timeStr).trim();
      const [start, end] = time.split('-');
      const isRange = start && end;
      currentCourse.slots.push({
        day: String(day).trim(),
        startTime: normalizeTime(isRange ? start.trim() : time),
        endTime: isRange ? normalizeTime(end.trim()) : '',
        venue: venue ? String(venue).trim() : '',
      });
    }
  }
  commit();

  const courses = Array.from(coursesMap.values());
  if (courses.length === 0) {
    throw new Error(
      'No courses found. Make sure your Excel has the timetable format: Sl No (col B), Course (col C), LTP (col H), Day/Time/Venue (cols I-K)'
    );
  }
  return courses;
};

const CourseUploader: React.FC<Props> = ({ onImport, onClose }) => (
  <ExcelUploader
    title="Upload Timetable"
    subtitle="Import courses from timetable Excel file"
    dropHint="Drag & drop your timetable Excel file"
    accent="indigo"
    format={{
      columns: [
        'Course Code',
        'Course Name',
        'L-T-P',
        'Credits',
        'Type',
        'Slots (Day Time-Range Venue)',
      ],
      example: [
        'CSC305',
        'Computer Networks',
        '3-0-0',
        '9',
        'CBCS',
        'Mon 10:00-11:00 LH1; Tue 14:00-15:00 LH1',
      ],
    }}
    parse={parseTimetable}
    noun="courses"
    columns={[
      {
        label: 'Code',
        className: 'font-mono text-gray-900 dark:text-white',
        render: (c) => c.courseCode,
      },
      { label: 'Name', className: 'text-gray-700 dark:text-gray-300', render: (c) => c.courseName },
      { label: 'LTP', className: 'text-gray-500 dark:text-gray-400', render: (c) => c.ltp },
      { label: 'Credits', className: 'text-gray-500 dark:text-gray-400', render: (c) => c.credits },
      {
        label: 'Type',
        className: '',
        render: (c) => (
          <span
            className={`px-2 py-0.5 rounded text-xs ${
              c.courseType === 'CBCS'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            }`}
          >
            {c.courseType}
          </span>
        ),
      },
    ]}
    onImport={onImport}
    onClose={onClose}
  />
);

export default CourseUploader;
