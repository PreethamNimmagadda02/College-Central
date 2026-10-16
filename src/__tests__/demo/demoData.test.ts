import { describe, expect, it, vi } from 'vitest';

// generateDefaultConfig lives in AppConfigContext, which pulls in Firebase and useAuth
vi.mock('@lib/firebase', () => ({ db: {}, auth: {}, storage: {} }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }));
vi.mock('@codetrix-studio/capacitor-google-auth', () => ({ GoogleAuth: { initialize: vi.fn() } }));

import { CAMPUS_LOCATIONS } from '@config/campusMap';
import { allForms } from '@config/forms';
import { NEP_TIMETABLE_DATA } from '@config/nepCourseData';
import { STUDENT_DIRECTORY } from '@config/studentDirectory';
import { generateDefaultConfig } from '@contexts/AppConfigContext';
import {
  createDemoSeed,
  DEMO_GRADE_POINTS,
  demoBatchYear,
  pickDemoCourses,
} from '@features/demo/demoData';
import { DEMO_UID } from '@features/demo/demoSession';

const NOW = new Date(2026, 9, 16, 11, 0); // 16 October 2026, 11:00 local time

describe('createDemoSeed', () => {
  it('is deterministic for a given moment', () => {
    expect(createDemoSeed(NOW)).toEqual(createDemoSeed(new Date(NOW)));
  });

  it('makes the guest a third-year NEP student in the current batch', () => {
    const { profile } = createDemoSeed(NOW);
    expect(profile.id).toBe(DEMO_UID);
    expect(profile.admissionNumber).toBe('24JE9001');
    expect(profile.courseOption).toBe('NEP');
    expect(demoBatchYear(new Date(2027, 1, 1))).toBe(2024); // February is the same academic year
    expect(demoBatchYear(new Date(2027, 6, 1))).toBe(2025); // a new batch starts in July
  });

  it('keeps grades internally consistent', () => {
    const gradesData = createDemoSeed(NOW).profile.gradesData!;
    const all = gradesData.semesters.flatMap((s) => s.grades);
    const credits = all.reduce((sum, g) => sum + g.credits, 0);
    const points = all.reduce((sum, g) => sum + DEMO_GRADE_POINTS[g.grade]! * g.credits, 0);

    expect(gradesData.semesters).toHaveLength(4);
    expect(gradesData.cgpa).toBeCloseTo(points / credits, 2);
    expect(gradesData.totalCredits).toBe(credits);
    expect(gradesData.semesters.at(-1)!.cgpa).toBe(gradesData.cgpa);
  });

  it('uses the same grade points as the default grading scale', () => {
    const scale = Object.fromEntries(
      generateDefaultConfig().gradingScale.map((g) => [g.grade, g.points])
    );
    expect(DEMO_GRADE_POINTS).toEqual(scale);
  });

  it('builds a clash-free timetable from real bundled courses', () => {
    const picked = pickDemoCourses(NEP_TIMETABLE_DATA);
    expect(picked.length).toBeGreaterThanOrEqual(5);

    const slots = picked.flatMap((c) => c.slots);
    slots.forEach((a, i) =>
      slots.slice(i + 1).forEach((b) => {
        const clash = a.day === b.day && a.startTime < b.endTime && b.startTime < a.endTime;
        expect(clash).toBe(false);
      })
    );

    const codes = new Set(NEP_TIMETABLE_DATA.map((c) => c.courseCode));
    createDemoSeed(NOW)
      .profile.scheduleData!.filter((s) => !s.isCustomTask)
      .forEach((s) => expect(codes.has(s.courseCode)).toBe(true));
  });

  it('dates personal events relative to now and reminds only for upcoming ones', () => {
    const seed = createDemoSeed(NOW);
    expect(seed.userEvents.map((e) => e.date)).toEqual([
      '2026-10-13',
      '2026-10-18',
      '2026-10-21',
      '2026-10-28',
    ]);
    expect(seed.reminderEventKeys).toEqual([
      '2026-10-18-Advanced DBMS lab viva',
      '2026-10-21-Coding club contest',
    ]);
  });

  it('references real saved places and forms', () => {
    const seed = createDemoSeed(NOW);
    const placeIds = new Set(CAMPUS_LOCATIONS.map((l) => l.id));
    seed.profile.savedCampusPlaces!.forEach((id) => expect(placeIds.has(id)).toBe(true));

    const formNumbers = new Set(allForms.map((f) => f.formNumber));
    seed.userForms.favorites.forEach((n) => expect(formNumbers.has(n)).toBe(true));
  });

  it('never reuses a real student name or admission number', () => {
    const seed = createDemoSeed(NOW);
    const realNames = new Set(STUDENT_DIRECTORY.map((s) => s.name.toUpperCase()));
    const realAdmissionNumbers = new Set(STUDENT_DIRECTORY.map((s) => s.admNo));

    expect(seed.directory).toHaveLength(31);
    seed.directory.forEach((entry) => {
      expect(realNames.has(entry.name)).toBe(false);
      expect(realAdmissionNumbers.has(entry.admNo)).toBe(false);
    });
  });

  it('gives six classmates full profiles that appear in the directory', () => {
    const seed = createDemoSeed(NOW);
    const admissionNumbers = new Set(seed.directory.map((d) => d.admNo));
    expect(seed.classmates).toHaveLength(6);
    seed.classmates.forEach((c) => expect(admissionNumbers.has(c.admissionNumber)).toBe(true));
  });

  it('has two unread notifications and activity newest first', () => {
    const seed = createDemoSeed(NOW);
    expect(seed.notifications.filter((n) => !n.read)).toHaveLength(2);

    const times = seed.activity.map((a) => a.timestamp.seconds);
    expect([...times].sort((a, b) => b - a)).toEqual(times);
  });
});
