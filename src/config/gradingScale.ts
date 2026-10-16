import { AdminGradeDefinition } from '@features/admin/types';

// Default grading scale, used until an admin configures one
export const DEFAULT_GRADING_SCALE: AdminGradeDefinition[] = [
  {
    id: 'grade-1',
    grade: 'A+',
    points: 10,
    color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
  },
  {
    id: 'grade-2',
    grade: 'A',
    points: 9,
    color: 'text-emerald-800 bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200',
  },
  {
    id: 'grade-3',
    grade: 'B+',
    points: 8,
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    id: 'grade-4',
    grade: 'B',
    points: 7,
    color: 'text-sky-700 bg-sky-200 dark:bg-sky-900/40 dark:text-sky-300',
  },
  {
    id: 'grade-5',
    grade: 'C+',
    points: 6,
    color: 'text-amber-700 bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300',
  },
  {
    id: 'grade-6',
    grade: 'C',
    points: 5,
    color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  {
    id: 'grade-7',
    grade: 'D',
    points: 4,
    color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400',
  },
  {
    id: 'grade-8',
    grade: 'F',
    points: 0,
    color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400',
  },
];
