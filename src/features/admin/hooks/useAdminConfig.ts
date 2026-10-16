import { generateDefaultConfig } from '@contexts/AppConfigContext';
import { updateConfigSection, subscribeToConfig } from '@services/configService';
import { useState, useEffect, useCallback, useMemo } from 'react';

import {
  AdminConfig,
  AdminQuote,
  AdminQuickLink,
  AdminForm,
  AdminCalendarEvent,
  AdminDirectoryEntry,
  AdminCourse,
  AdminStudentEntry,
  AdminGradeDefinition,
} from '../types';

const STORAGE_KEY = 'admin_config';

type Apply<T> = (fn: (items: T[]) => T[]) => void;

// add/update/remove for a list of records keyed by `id`
const listOps = <T extends { id: string }>(apply: Apply<T>, idPrefix: string) => ({
  add: (item: Omit<T, 'id'>) =>
    apply((items) => [...items, { ...item, id: `${idPrefix}-${Date.now()}` } as T]),
  update: (id: string, patch: Partial<T>) =>
    apply((items) => items.map((i) => (i.id === id ? { ...i, ...patch } : i))),
  remove: (id: string) => apply((items) => items.filter((i) => i.id !== id)),
  removeMany: (ids: string[]) => {
    const idSet = new Set(ids);
    apply((items) => items.filter((i) => !idSet.has(i.id)));
  },
  clear: () => apply(() => []),
  set: (items: T[]) => apply(() => items),
});

// add/update/remove by position for plain string lists
const stringListOps = (apply: Apply<string>, normalize = (s: string) => s) => ({
  add: (value: string) => apply((items) => [...items, normalize(value)]),
  update: (index: number, value: string) =>
    apply((items) => items.map((v, i) => (i === index ? normalize(value) : v))),
  remove: (index: number) => apply((items) => items.filter((_, i) => i !== index)),
  set: (items: string[]) => apply(() => items),
});

export const useAdminConfig = () => {
  const [config, setConfig] = useState<AdminConfig>(generateDefaultConfig);
  const [hasChanges, setHasChanges] = useState(false);

  // Subscribe to Firestore config on mount
  useEffect(() => {
    const unsubscribe = subscribeToConfig((firestoreConfig) => {
      if (firestoreConfig) {
        setConfig(firestoreConfig);
        // Also save to localStorage as backup
        localStorage.setItem(STORAGE_KEY, JSON.stringify(firestoreConfig));
        return;
      }
      // Try localStorage fallback
      const saved = localStorage.getItem(STORAGE_KEY);
      try {
        setConfig(saved ? JSON.parse(saved) : generateDefaultConfig());
      } catch {
        setConfig(generateDefaultConfig());
      }
    });
    return unsubscribe;
  }, []);

  // Save specific sections to Firestore
  const saveChangedSections = useCallback(
    async (sections: Array<keyof AdminConfig>, newConfig: AdminConfig) => {
      try {
        const results = await Promise.all(
          sections.map((section) => updateConfigSection(section, newConfig[section]))
        );
        if (results.every(Boolean)) {
          setHasChanges(false);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
        }
      } catch (err) {
        console.error('Error saving sections:', err);
      }
    },
    []
  );

  // Save one section straight to Firestore, then mirror it locally. Already persisted,
  // so this doesn't raise hasChanges.
  const saveSection = useCallback(
    async <K extends keyof AdminConfig>(section: K, data: AdminConfig[K]) => {
      try {
        if (await updateConfigSection(section, data)) {
          setConfig((prev) => ({ ...prev, [section]: data }));
        }
      } catch (err) {
        console.error(`Error saving ${section}:`, err);
      }
    },
    []
  );

  // Update local config and auto-save the sections that changed
  const updateConfigAndSave = useCallback(
    (updater: (prev: AdminConfig) => AdminConfig) => {
      setConfig((prev) => {
        const newConfig = updater(prev);
        const changedSections = (Object.keys(newConfig) as Array<keyof AdminConfig>).filter(
          (key) => newConfig[key] !== prev[key]
        );
        if (changedSections.length > 0) {
          // Next tick: no side effects inside the state updater
          setTimeout(() => saveChangedSections(changedSections, newConfig), 0);
        }
        return newConfig;
      });
      setHasChanges(true);
    },
    [saveChangedSections]
  );

  const ops = useMemo(() => {
    const section =
      <K extends keyof AdminConfig>(key: K) =>
      (fn: (value: AdminConfig[K]) => AdminConfig[K]) =>
        updateConfigAndSave((prev) => ({ ...prev, [key]: fn(prev[key]) }));

    const setCalendar = section('calendar');
    const setDirectory = section('directory');
    const setCourses = section('courses');
    const setStudents = section('students');
    const students = listOps<AdminStudentEntry>(setStudents, 'student');

    return {
      updateCollegeInfo: (updates: Partial<AdminConfig['collegeInfo']>) =>
        section('collegeInfo')((info) => ({ ...info, ...updates })),
      updateAppConstants: (updates: Partial<AdminConfig['appConstants']>) =>
        section('appConstants')((constants) => ({ ...constants, ...updates })),
      updateCalendarDates: (dates: Partial<Omit<AdminConfig['calendar'], 'events'>>) =>
        setCalendar((calendar) => ({ ...calendar, ...dates })),

      branches: stringListOps(section('branches'), (b) => b.trim().toUpperCase()),
      hostels: stringListOps(section('hostels')),
      quotes: listOps<AdminQuote>(section('quotes'), 'quote'),
      quickLinks: listOps<AdminQuickLink>(section('quickLinks'), 'link'),
      forms: listOps<AdminForm>(section('forms'), 'form'),
      directory: listOps<AdminDirectoryEntry>(setDirectory, 'dir'),
      courses: listOps<AdminCourse>(setCourses, 'course'),
      grades: listOps<AdminGradeDefinition>(
        (fn) => section('gradingScale')((scale) => fn(scale || [])),
        'grade'
      ),
      calendarEvents: listOps<AdminCalendarEvent>(
        (fn) => setCalendar((calendar) => ({ ...calendar, events: fn(calendar.events) })),
        'event'
      ),
      // A student's id is their admission number
      students: {
        ...students,
        add: (student: Omit<AdminStudentEntry, 'id'>) =>
          setStudents((items) => [
            ...items,
            { ...student, id: student.admNo || `student-${Date.now()}` },
          ]),
      },

      // Replaces all events
      importCalendarEvents: (events: Omit<AdminCalendarEvent, 'id'>[]) =>
        setCalendar((calendar) => ({
          ...calendar,
          events: events.map((e, i) => ({ ...e, id: `event-${Date.now()}-${i}` })),
        })),

      // Appends entries whose email is not already in the directory
      importDirectoryEntries: (entries: Omit<AdminDirectoryEntry, 'id'>[]) =>
        setDirectory((directory) => {
          const existing = new Set(directory.map((d) => d.email.toLowerCase()));
          const added = entries
            .filter((e) => !existing.has(e.email.toLowerCase()))
            .map((e, i) => ({ ...e, id: `dir-${Date.now()}-${i}` }));
          return [...directory, ...added];
        }),

      // Merges into courses with the same code, appends the rest
      importCourses: (incoming: Omit<AdminCourse, 'id'>[]) =>
        setCourses((courses) => {
          const byCode = new Map(incoming.map((c) => [c.courseCode, c]));
          const existingCodes = new Set(courses.map((c) => c.courseCode));
          const merged = courses.map((c) => ({ ...c, ...byCode.get(c.courseCode) }));
          const added = incoming
            .filter((c) => !existingCodes.has(c.courseCode))
            .map((c, i) => ({ ...c, id: `course-${Date.now()}-${i}` }));
          return [...merged, ...added];
        }),

      // Appends students whose admission number is not already present
      importStudents: (incoming: Omit<AdminStudentEntry, 'id'>[]) =>
        setStudents((existing) => {
          const admNos = new Set(existing.map((s) => s.admNo));
          const added = incoming
            .filter((s) => !admNos.has(s.admNo))
            .map((s) => ({ ...s, id: s.admNo || `student-${Date.now()}` }));
          return [...existing, ...added];
        }),
    };
  }, [updateConfigAndSave]);

  return { config, hasChanges, saveSection, ...ops };
};

export type AdminConfigApi = ReturnType<typeof useAdminConfig>;
