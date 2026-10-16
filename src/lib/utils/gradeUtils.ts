import { Grade, Semester } from '@/types';

export type LatestGrade = Grade & { semester: number };

/**
 * Latest attempt of each course, keyed by subject code. A retake in a later
 * semester supersedes earlier attempts, so only it counts towards CGPA.
 */
export const getLatestGrades = (semesters: Semester[]): Record<string, LatestGrade> => {
  const latest: Record<string, LatestGrade> = {};
  semesters.forEach((sem) => {
    sem.grades.forEach((grade) => {
      const existing = latest[grade.subjectCode];
      if (!existing || sem.semester > existing.semester) {
        latest[grade.subjectCode] = { ...grade, semester: sem.semester };
      }
    });
  });
  return latest;
};
