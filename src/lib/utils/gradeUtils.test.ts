import { describe, it, expect } from 'vitest';

import { getLatestGrades } from './gradeUtils';

import { Grade, Semester } from '@/types';

const grade = (subjectCode: string, letter: string, credits = 4): Grade => ({
  subjectCode,
  subjectName: subjectCode,
  credits,
  grade: letter,
  attendance: 90,
});

const semester = (num: number, grades: Grade[]): Semester => ({
  semester: num,
  sessionYear: '2024-25',
  sessionType: 'Monsoon',
  sgpa: 0,
  cgpa: 0,
  grades,
});

describe('getLatestGrades', () => {
  it('keeps one entry per course tagged with its semester', () => {
    const latest = getLatestGrades([semester(1, [grade('CS101', 'A'), grade('MA101', 'B')])]);
    expect(latest).toEqual({
      CS101: { ...grade('CS101', 'A'), semester: 1 },
      MA101: { ...grade('MA101', 'B'), semester: 1 },
    });
  });

  it('lets a later retake supersede the earlier attempt regardless of order', () => {
    const latest = getLatestGrades([
      semester(3, [grade('CS101', 'B+')]),
      semester(1, [grade('CS101', 'F')]),
    ]);
    expect(latest.CS101).toMatchObject({ grade: 'B+', semester: 3 });
  });

  it('keeps the first attempt when two share a semester', () => {
    const latest = getLatestGrades([semester(2, [grade('CS101', 'C'), grade('CS101', 'A')])]);
    expect(latest.CS101?.grade).toBe('C');
  });

  it('returns an empty map without semesters', () => {
    expect(getLatestGrades([])).toEqual({});
  });
});
