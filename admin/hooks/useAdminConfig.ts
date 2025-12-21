import { useState, useEffect, useCallback } from 'react';
import { AdminConfig, AdminQuote, AdminQuickLink, AdminForm, AdminCalendarEvent, AdminDirectoryEntry, AdminCourse, AdminStudentEntry } from '../types';
import { updateConfig as updateFirestoreConfig, updateConfigSection, subscribeToConfig } from '../../services/configService';
import { generateDefaultConfig } from '../../contexts/AppConfigContext';

const STORAGE_KEY = 'admin_config';

export const useAdminConfig = () => {
  const [config, setConfig] = useState<AdminConfig>(generateDefaultConfig);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to Firestore config on mount
  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToConfig((firestoreConfig) => {
      if (firestoreConfig) {
        setConfig(firestoreConfig);
        // Also save to localStorage as backup
        localStorage.setItem(STORAGE_KEY, JSON.stringify(firestoreConfig));
      } else {
        // Try localStorage fallback
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            setConfig(JSON.parse(saved));
          } catch {
            setConfig(generateDefaultConfig());
          }
        } else {
          setConfig(generateDefaultConfig());
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Save config to Firestore
  const saveToFirestore = useCallback(async (newConfig: AdminConfig) => {
    setSaving(true);
    setError(null);
    try {
      const success = await updateFirestoreConfig(newConfig);
      if (success) {
        setHasChanges(false);
        // Also save to localStorage as backup
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
      } else {
        setError('Failed to save to Firestore');
      }
    } catch (err) {
      console.error('Error saving config:', err);
      setError('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  }, []);

  // Save specific section to Firestore
  const saveSection = useCallback(async <K extends keyof AdminConfig>(section: K, data: AdminConfig[K]) => {
    setSaving(true);
    setError(null);
    try {
      const success = await updateConfigSection(section, data);
      if (success) {
        setHasChanges(true);
        // Optimistically update local state
        setConfig(prev => ({ ...prev, [section]: data }));
      } else {
        setError(`Failed to save ${section}`);
      }
    } catch (err) {
      console.error(`Error saving ${section}:`, err);
      setError(`Failed to save ${section}`);
    } finally {
      setSaving(false);
    }
  }, []);

  // Helper to update config and auto-save to Firestore
  const updateConfigAndSave = useCallback((updater: (prev: AdminConfig) => AdminConfig) => {
    setConfig(prev => {
      const newConfig = updater(prev);
      // Auto-save to Firestore
      saveToFirestore(newConfig);
      return newConfig;
    });
    setHasChanges(true);
  }, [saveToFirestore]);

  // Update functions for each config section
  const updateCollegeInfo = useCallback((updates: Partial<AdminConfig['collegeInfo']>) => {
    updateConfigAndSave(prev => ({
      ...prev,
      collegeInfo: { ...prev.collegeInfo, ...updates },
    }));
  }, [updateConfigAndSave]);

  const updateAppConstants = useCallback((updates: Partial<AdminConfig['appConstants']>) => {
    updateConfigAndSave(prev => ({
      ...prev,
      appConstants: { ...prev.appConstants, ...updates },
    }));
  }, [updateConfigAndSave]);

  // Branches CRUD
  const addBranch = useCallback((branch: string) => {
    updateConfigAndSave(prev => ({
      ...prev,
      branches: [...prev.branches, branch],
    }));
  }, [updateConfigAndSave]);

  const updateBranch = useCallback((index: number, branch: string) => {
    updateConfigAndSave(prev => ({
      ...prev,
      branches: prev.branches.map((b, i) => i === index ? branch : b),
    }));
  }, [updateConfigAndSave]);

  const deleteBranch = useCallback((index: number) => {
    updateConfigAndSave(prev => ({
      ...prev,
      branches: prev.branches.filter((_, i) => i !== index),
    }));
  }, [updateConfigAndSave]);

  const reorderBranches = useCallback((branches: string[]) => {
    updateConfigAndSave(prev => ({ ...prev, branches }));
  }, [updateConfigAndSave]);

  // Hostels CRUD
  const addHostel = useCallback((hostel: string) => {
    updateConfigAndSave(prev => ({
      ...prev,
      hostels: [...prev.hostels, hostel],
    }));
  }, [updateConfigAndSave]);

  const updateHostel = useCallback((index: number, hostel: string) => {
    updateConfigAndSave(prev => ({
      ...prev,
      hostels: prev.hostels.map((h, i) => i === index ? hostel : h),
    }));
  }, [updateConfigAndSave]);

  const deleteHostel = useCallback((index: number) => {
    updateConfigAndSave(prev => ({
      ...prev,
      hostels: prev.hostels.filter((_, i) => i !== index),
    }));
  }, [updateConfigAndSave]);

  // Quotes CRUD
  const addQuote = useCallback((quote: Omit<AdminQuote, 'id'>) => {
    updateConfigAndSave(prev => ({
      ...prev,
      quotes: [...prev.quotes, { ...quote, id: `quote-${Date.now()}` }],
    }));
  }, [updateConfigAndSave]);

  const updateQuote = useCallback((id: string, quote: Partial<AdminQuote>) => {
    updateConfigAndSave(prev => ({
      ...prev,
      quotes: prev.quotes.map(q => q.id === id ? { ...q, ...quote } : q),
    }));
  }, [updateConfigAndSave]);

  const deleteQuote = useCallback((id: string) => {
    updateConfigAndSave(prev => ({
      ...prev,
      quotes: prev.quotes.filter(q => q.id !== id),
    }));
  }, [updateConfigAndSave]);

  // Quick Links CRUD
  const addQuickLink = useCallback((link: Omit<AdminQuickLink, 'id'>) => {
    updateConfigAndSave(prev => ({
      ...prev,
      quickLinks: [...prev.quickLinks, { ...link, id: `link-${Date.now()}` }],
    }));
  }, [updateConfigAndSave]);

  const updateQuickLink = useCallback((id: string, link: Partial<AdminQuickLink>) => {
    updateConfigAndSave(prev => ({
      ...prev,
      quickLinks: prev.quickLinks.map(l => l.id === id ? { ...l, ...link } : l),
    }));
  }, [updateConfigAndSave]);

  const deleteQuickLink = useCallback((id: string) => {
    updateConfigAndSave(prev => ({
      ...prev,
      quickLinks: prev.quickLinks.filter(l => l.id !== id),
    }));
  }, [updateConfigAndSave]);

  // Forms CRUD
  const addForm = useCallback((form: Omit<AdminForm, 'id'>) => {
    updateConfigAndSave(prev => ({
      ...prev,
      forms: [...prev.forms, { ...form, id: `form-${Date.now()}` }],
    }));
  }, [updateConfigAndSave]);

  const updateForm = useCallback((id: string, form: Partial<AdminForm>) => {
    updateConfigAndSave(prev => ({
      ...prev,
      forms: prev.forms.map(f => f.id === id ? { ...f, ...form } : f),
    }));
  }, [updateConfigAndSave]);

  const deleteForm = useCallback((id: string) => {
    updateConfigAndSave(prev => ({
      ...prev,
      forms: prev.forms.filter(f => f.id !== id),
    }));
  }, [updateConfigAndSave]);

  // Calendar CRUD
  const updateCalendarDates = useCallback((dates: { semesterStartDate?: string; semesterEndDate?: string; semesterName?: string }) => {
    updateConfigAndSave(prev => ({
      ...prev,
      calendar: { ...prev.calendar, ...dates },
    }));
  }, [updateConfigAndSave]);

  const addCalendarEvent = useCallback((event: Omit<AdminCalendarEvent, 'id'>) => {
    updateConfigAndSave(prev => ({
      ...prev,
      calendar: {
        ...prev.calendar,
        events: [...prev.calendar.events, { ...event, id: `event-${Date.now()}` }],
      },
    }));
  }, [updateConfigAndSave]);

  const updateCalendarEvent = useCallback((id: string, event: Partial<AdminCalendarEvent>) => {
    updateConfigAndSave(prev => ({
      ...prev,
      calendar: {
        ...prev.calendar,
        events: prev.calendar.events.map(e => e.id === id ? { ...e, ...event } : e),
      },
    }));
  }, [updateConfigAndSave]);

  const deleteCalendarEvent = useCallback((id: string) => {
    updateConfigAndSave(prev => ({
      ...prev,
      calendar: {
        ...prev.calendar,
        events: prev.calendar.events.filter(e => e.id !== id),
      },
    }));
  }, [updateConfigAndSave]);

  const clearAllCalendarEvents = useCallback(() => {
    updateConfigAndSave(prev => ({
      ...prev,
      calendar: {
        ...prev.calendar,
        events: [],
      },
    }));
  }, [updateConfigAndSave]);

  const importCalendarEvents = useCallback((events: Omit<AdminCalendarEvent, 'id'>[]) => {
    updateConfigAndSave(prev => ({
      ...prev,
      calendar: {
        ...prev.calendar,
        events: events.map((e, i) => ({ ...e, id: `event-${Date.now()}-${i}` })),
      },
    }));
  }, [updateConfigAndSave]);

  // Directory CRUD
  const addDirectoryEntry = useCallback((entry: Omit<AdminDirectoryEntry, 'id'>) => {
    updateConfigAndSave(prev => ({
      ...prev,
      directory: [...prev.directory, { ...entry, id: `dir-${Date.now()}` }],
    }));
  }, [updateConfigAndSave]);

  const updateDirectoryEntry = useCallback((id: string, entry: Partial<AdminDirectoryEntry>) => {
    updateConfigAndSave(prev => ({
      ...prev,
      directory: prev.directory.map(d => d.id === id ? { ...d, ...entry } : d),
    }));
  }, [updateConfigAndSave]);

  const deleteDirectoryEntry = useCallback((id: string) => {
    updateConfigAndSave(prev => ({
      ...prev,
      directory: prev.directory.filter(d => d.id !== id),
    }));
  }, [updateConfigAndSave]);

  // Bulk delete directory entries by IDs (avoids race conditions)
  const deleteDirectoryEntriesByIds = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    updateConfigAndSave(prev => ({
      ...prev,
      directory: prev.directory.filter(d => !idSet.has(d.id)),
    }));
  }, [updateConfigAndSave]);

  const clearAllDirectoryEntries = useCallback(() => {
    updateConfigAndSave(prev => ({
      ...prev,
      directory: [],
    }));
  }, [updateConfigAndSave]);

  const importDirectoryEntries = useCallback((entries: Omit<AdminDirectoryEntry, 'id'>[]) => {
    updateConfigAndSave(prev => {
      // Create a map of existing entries by email for deduplication
      const existingEntriesMap = new Map(prev.directory.map(d => [d.email.toLowerCase(), d]));
      
      // Process new entries (only those not already existing)
      const newEntries = entries.filter(e => !existingEntriesMap.has(e.email.toLowerCase()))
        .map((e, i) => ({ ...e, id: `dir-${Date.now()}-${i}` }));
      
      return {
        ...prev,
        directory: [...prev.directory, ...newEntries],
      };
    });
  }, [updateConfigAndSave]);

  // Course CRUD operations
  const addCourse = useCallback((course: Omit<AdminCourse, 'id'>) => {
    updateConfigAndSave(prev => ({
      ...prev,
      courses: [...prev.courses, { ...course, id: `course-${Date.now()}` }],
    }));
  }, [updateConfigAndSave]);

  const updateCourse = useCallback((id: string, course: Partial<AdminCourse>) => {
    updateConfigAndSave(prev => ({
      ...prev,
      courses: prev.courses.map(c => c.id === id ? { ...c, ...course } : c),
    }));
  }, [updateConfigAndSave]);

  const deleteCourse = useCallback((id: string) => {
    updateConfigAndSave(prev => ({
      ...prev,
      courses: prev.courses.filter(c => c.id !== id),
    }));
  }, [updateConfigAndSave]);

  // Bulk delete courses by IDs (avoids race conditions)
  const deleteCoursesByIds = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    updateConfigAndSave(prev => ({
      ...prev,
      courses: prev.courses.filter(c => !idSet.has(c.id)),
    }));
  }, [updateConfigAndSave]);

  const clearAllCourses = useCallback(() => {
    updateConfigAndSave(prev => ({
      ...prev,
      courses: [],
    }));
  }, [updateConfigAndSave]);

  const importCourses = useCallback((courses: Omit<AdminCourse, 'id'>[]) => {
    updateConfigAndSave(prev => {
      // Create a map of existing courses by code for easy lookup
      const existingCoursesMap = new Map(prev.courses.map(c => [c.courseCode, c]));
      
      // Process new courses
      const newCourses = courses.filter(c => !existingCoursesMap.has(c.courseCode))
        .map((c, i) => ({ ...c, id: `course-${Date.now()}-${i}` }));
      
      // Optional: Update existing courses if needed? For now, we'll just append new ones
      // and keep existing ones to preserve IDs and potential edits.
      // If we wanted to update, we'd need to merge.
      // Given "don't delete", appending strictly new ones + keeping old is safest.
      
      return {
        ...prev,
        courses: [...prev.courses, ...newCourses],
      };
    });
  }, [updateConfigAndSave]);

  // Student CRUD operations
  const addStudent = useCallback((student: Omit<AdminStudentEntry, 'id'>) => {
    updateConfigAndSave(prev => ({
      ...prev,
      students: [...prev.students, { ...student, id: student.admNo || `student-${Date.now()}` }],
    }));
  }, [updateConfigAndSave]);

  const updateStudent = useCallback((id: string, student: Partial<AdminStudentEntry>) => {
    updateConfigAndSave(prev => ({
      ...prev,
      students: prev.students.map(s => s.id === id ? { ...s, ...student } : s),
    }));
  }, [updateConfigAndSave]);

  const deleteStudent = useCallback((id: string) => {
    updateConfigAndSave(prev => ({
      ...prev,
      students: prev.students.filter(s => s.id !== id),
    }));
  }, [updateConfigAndSave]);

  // Bulk delete students by IDs (avoids race conditions)
  const deleteStudentsByIds = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    updateConfigAndSave(prev => ({
      ...prev,
      students: prev.students.filter(s => !idSet.has(s.id)),
    }));
  }, [updateConfigAndSave]);

  const clearAllStudents = useCallback(() => {
    updateConfigAndSave(prev => ({
      ...prev,
      students: [],
    }));
  }, [updateConfigAndSave]);

  const importStudents = useCallback((students: Omit<AdminStudentEntry, 'id'>[]) => {
    updateConfigAndSave(prev => {
      // Create a map of existing students by admNo for easy lookup
      const existingStudentsMap = new Map(prev.students.map(s => [s.admNo, s]));
      
      // Process new students (only those not already existing)
      const newStudents = students.filter(s => !existingStudentsMap.has(s.admNo))
        .map(s => ({ ...s, id: s.admNo || `student-${Date.now()}` }));
      
      return {
        ...prev,
        students: [...prev.students, ...newStudents],
      };
    });
  }, [updateConfigAndSave]);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    const defaultConfig = generateDefaultConfig();
    updateConfigAndSave(() => defaultConfig);
  }, [updateConfigAndSave]);

  // Mark as saved (for UI feedback)
  const markAsSaved = useCallback(() => {
    setHasChanges(false);
  }, []);

  return {
    config,
    hasChanges,
    loading,
    saving,
    error,
    // College Info
    updateCollegeInfo,
    updateAppConstants,
    // Branches
    addBranch,
    updateBranch,
    deleteBranch,
    reorderBranches,
    // Hostels
    addHostel,
    updateHostel,
    deleteHostel,
    // Quotes
    addQuote,
    updateQuote,
    deleteQuote,
    // Quick Links
    addQuickLink,
    updateQuickLink,
    deleteQuickLink,
    // Forms
    addForm,
    updateForm,
    deleteForm,
    // Calendar
    updateCalendarDates,
    addCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    clearAllCalendarEvents,
    importCalendarEvents,
    // Directory
    addDirectoryEntry,
    updateDirectoryEntry,
    deleteDirectoryEntry,
    deleteDirectoryEntriesByIds,
    clearAllDirectoryEntries,
    importDirectoryEntries,
    // Courses
    addCourse,
    updateCourse,
    deleteCourse,
    deleteCoursesByIds,
    clearAllCourses,
    importCourses,
    // Students
    addStudent,
    updateStudent,
    deleteStudent,
    deleteStudentsByIds,
    clearAllStudents,
    importStudents,
    // Utility
    // Utility
    resetToDefaults,
    markAsSaved,
    saveSection,
  };
};

