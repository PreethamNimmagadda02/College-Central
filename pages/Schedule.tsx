import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSchedule } from '../contexts/ScheduleContext';
import { ClassSchedule, TimeTableCourse } from '../types';
import { TIMETABLE_DATA } from '../data/courseData';
import { useAuth } from '../hooks/useAuth';
import { logActivity } from '../services/activityService';

const ChevronDownIcon: React.FC = () => (
    <svg className="w-5 h-5 ml-2 -mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

// Format time from 24-hour to 12-hour with AM/PM
const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

const getClassColor = (courseCode: string) => {
    const colors = [
        'bg-blue-400/20 border-blue-500 text-blue-700 dark:text-blue-300',
        'bg-green-400/20 border-green-500 text-green-700 dark:text-green-300',
        'bg-purple-400/20 border-purple-500 text-purple-700 dark:text-purple-300',
        'bg-orange-400/20 border-orange-500 text-orange-700 dark:text-orange-300',
        'bg-pink-400/20 border-pink-500 text-pink-700 dark:text-pink-300',
        'bg-yellow-400/20 border-yellow-500 text-yellow-700 dark:text-yellow-300',
        'bg-indigo-400/20 border-indigo-500 text-indigo-700 dark:text-indigo-300',
        'bg-red-400/20 border-red-500 text-red-700 dark:text-red-300',
    ];
    
    const hash = courseCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
};

const Schedule: React.FC = () => {
    const { scheduleData, setScheduleData, loading: scheduleLoading } = useSchedule();
    const { currentUser } = useAuth();
    
    const [selectedCourseCodes, setSelectedCourseCodes] = useState<string[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingItem, setEditingItem] = useState<ClassSchedule | null>(null);
    const [newVenue, setNewVenue] = useState('');
    const [newInstructor, setNewInstructor] = useState('');
    const [newDay, setNewDay] = useState('');
    const [newStartTime, setNewStartTime] = useState('');
    const [newEndTime, setNewEndTime] = useState('');
    const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
    const [hasConflict, setHasConflict] = useState(false);
    const [conflictingClasses, setConflictingClasses] = useState<ClassSchedule[]>([]);
    const [applyInstructorToAll, setApplyInstructorToAll] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [history, setHistory] = useState<ClassSchedule[][]>([]);
    const isInitialized = useRef(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
    const [filterCourse, setFilterCourse] = useState<string>('all');
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const timeSlots = Array.from({ length: 13 }, (_, i) => `${(8 + i).toString().padStart(2, '0')}:00`);
    const currentDayIndex = new Date().getDay();
    const today = days[currentDayIndex - 1] || '';

    useEffect(() => {
        if (editingItem) {
            setNewVenue(editingItem.location);
            setNewInstructor(editingItem.instructor);
            setNewDay(editingItem.day);
            setNewStartTime(editingItem.startTime);
            setNewEndTime(editingItem.endTime);
            setValidationErrors({});
            setHasConflict(false);
            setConflictingClasses([]);
            setApplyInstructorToAll(true); // Default to updating all classes
        }
    }, [editingItem]);

    // Check for conflicts whenever day or time changes
    useEffect(() => {
        if (editingItem && scheduleData && newDay && newStartTime && newEndTime) {
            checkForConflicts();
        }
    }, [newDay, newStartTime, newEndTime]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!editingItem) return;

            if (e.key === 'Escape') {
                setEditingItem(null);
            } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                handleUpdateClassDetails();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [editingItem, newVenue, newInstructor, newDay, newStartTime, newEndTime]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Initialize and sync selectedCourseCodes with scheduleData
    useEffect(() => {
        if (scheduleData && scheduleData.length > 0) {
            const currentCodesInSchedule = [...new Set(scheduleData.map((item: any) => item.courseCode))];

            // On first load, just set the codes
            if (!isInitialized.current) {
                setSelectedCourseCodes(currentCodesInSchedule);
                isInitialized.current = true;
            } else {
                // After initialization, only update if different
                const currentSorted = currentCodesInSchedule.sort().join(',');
                const selectedSorted = [...selectedCourseCodes].sort().join(',');

                if (currentSorted !== selectedSorted) {
                    setSelectedCourseCodes(currentCodesInSchedule);
                }
            }
        } else if (!scheduleLoading && scheduleData && scheduleData.length === 0) {
            // If schedule is empty, initialize as empty
            if (!isInitialized.current) {
                isInitialized.current = true;
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scheduleData, scheduleLoading]);

    // Calculate unique courses from actual schedule data
    const uniqueCoursesFromSchedule = useMemo(() => {
        if (!scheduleData) return [];
        return [...new Set(scheduleData.map(item => item.courseCode))];
    }, [scheduleData]);

    // Display the actual count from schedule, not just selected codes
    const displayCoursesCount = uniqueCoursesFromSchedule.length || selectedCourseCodes.length;

    const totalCredits = useMemo(() => {
        // Use courses from actual schedule data
        const coursesToCount = uniqueCoursesFromSchedule.length > 0 ? uniqueCoursesFromSchedule : selectedCourseCodes;
        return coursesToCount.reduce((acc, code) => {
            const course = TIMETABLE_DATA.find(c => c.courseCode === code);
            return acc + (course?.credits || 0);
        }, 0);
    }, [uniqueCoursesFromSchedule, selectedCourseCodes]);

    const todaysClasses = useMemo(() => {
        if (!scheduleData || !today) return [];
        return scheduleData.filter(item => item.day === today)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
    }, [scheduleData, today]);

    const upcomingClass = useMemo(() => {
        if (!todaysClasses.length) return null;
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        return todaysClasses.find(cls => cls.startTime > currentTime);
    }, [todaysClasses]);
    
    const selectedCoursesForFilter = useMemo(() => {
        if (!scheduleData) return [];
        const uniqueCodes = [...new Set(scheduleData.map(item => item.courseCode))];
        return uniqueCodes.map(code => {
            const course = TIMETABLE_DATA.find(c => c.courseCode === code);
            return {
                code: code,
                name: course ? `${code} - ${course.courseName}` : code,
            };
        }).sort((a, b) => (a.code as string).localeCompare(b.code as string));
    }, [scheduleData]);

    const handleCourseSelection = (courseCode: string) => {
        const newSelectedCodes = selectedCourseCodes.includes(courseCode) 
            ? selectedCourseCodes.filter(code => code !== courseCode)
            : [...selectedCourseCodes, courseCode];
        
        setSelectedCourseCodes(newSelectedCodes);

        const selectedCourses = TIMETABLE_DATA.filter(course => newSelectedCodes.includes(course.courseCode));
        
        const newScheduleData: ClassSchedule[] = selectedCourses.flatMap(course => 
            course.slots.map((slot, index) => ({
                slotId: `${course.courseCode}-${slot.day}-${slot.startTime}-${index}`,
                day: slot.day as ClassSchedule['day'],
                startTime: slot.startTime,
                endTime: slot.endTime,
                courseName: course.courseName,
                courseCode: course.courseCode,
                instructor: 'TBA',
                location: slot.venue,
            }))
        );

        setScheduleData(newScheduleData);
        if (currentUser) {
            logActivity(currentUser.uid, {
                type: 'schedule',
                title: 'Courses Updated',
                description: `Updated schedule to ${newSelectedCodes.length} courses.`,
                icon: '📚',
                link: '/schedule'
            });
        }
        setHistory([]);
    };
    
    const handleResetSchedule = () => {
        const selectedCourses = TIMETABLE_DATA.filter(course => selectedCourseCodes.includes(course.courseCode));
        
        const newScheduleData: ClassSchedule[] = selectedCourses.flatMap(course => 
            course.slots.map((slot, index) => ({
                slotId: `${course.courseCode}-${slot.day}-${slot.startTime}-${index}`,
                day: slot.day as ClassSchedule['day'],
                startTime: slot.startTime,
                endTime: slot.endTime,
                courseName: course.courseName,
                courseCode: course.courseCode,
                instructor: 'TBA',
                location: slot.venue,
            }))
        );

        setScheduleData(newScheduleData);
        if (currentUser) {
            logActivity(currentUser.uid, {
                type: 'schedule',
                title: 'Schedule Reset',
                description: 'Schedule was reset to its original state.',
                icon: '🔄',
                link: '/schedule'
            });
        }
        setHistory([]);
    };

    const handleUndo = () => {
        if (history.length === 0) return;
        const previousState = history[history.length - 1];
        setScheduleData(previousState);
        setHistory(prev => prev.slice(0, -1));
    };

    // Validation function
    const validateForm = (): boolean => {
        const errors: {[key: string]: string} = {};

        if (!newVenue.trim()) {
            errors.venue = 'Venue is required';
        }
        if (!newInstructor.trim()) {
            errors.instructor = 'Instructor name is required';
        }
        if (!newStartTime) {
            errors.startTime = 'Start time is required';
        }
        if (!newEndTime) {
            errors.endTime = 'End time is required';
        }
        if (newStartTime && newEndTime && newStartTime >= newEndTime) {
            errors.time = 'End time must be after start time';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Check for scheduling conflicts
    const checkForConflicts = () => {
        if (!editingItem || !scheduleData) return;

        const conflicts = scheduleData.filter(item => {
            // Skip the current editing item
            if (item.slotId === editingItem.slotId) return false;

            // Check if same day
            if (item.day !== newDay) return false;

            // Check time overlap
            const itemStart = item.startTime;
            const itemEnd = item.endTime;

            // Check if times overlap
            const hasOverlap = (newStartTime < itemEnd && newEndTime > itemStart);

            return hasOverlap;
        });

        setConflictingClasses(conflicts);
        setHasConflict(conflicts.length > 0);
    };

    // Handle update with validation
    const handleUpdateClassDetails = () => {
        if (!editingItem || !scheduleData || !currentUser) return;

        // Validate form
        if (!validateForm()) {
            return;
        }

        setHistory(prev => [...prev, scheduleData]);

        // Check if instructor changed
        const instructorChanged = newInstructor.trim() !== editingItem.instructor;

        const updatedSchedule = scheduleData.map(item => {
            // Always update the current editing item
            if (item.slotId === editingItem.slotId) {
                return {
                    ...item,
                    location: newVenue.trim(),
                    instructor: newInstructor.trim(),
                    day: newDay as ClassSchedule['day'],
                    startTime: newStartTime,
                    endTime: newEndTime
                };
            }

            // If instructor changed and applyToAll is true, update all classes of same course
            if (instructorChanged && applyInstructorToAll && item.courseCode === editingItem.courseCode) {
                return {
                    ...item,
                    instructor: newInstructor.trim()
                };
            }

            return item;
        });
        setScheduleData(updatedSchedule);

        const changes = [];
        if (newVenue !== editingItem.location) changes.push('venue');
        if (instructorChanged) {
            if (applyInstructorToAll) {
                changes.push('instructor (all classes)');
            } else {
                changes.push('instructor');
            }
        }
        if (newDay !== editingItem.day) changes.push('day');
        if (newStartTime !== editingItem.startTime || newEndTime !== editingItem.endTime) changes.push('time');

        logActivity(currentUser.uid, {
            type: 'schedule',
            title: 'Class Details Updated',
            description: `Updated ${changes.join(', ')} for ${editingItem.courseCode}.`,
            icon: '✏️',
            link: '/schedule'
        });
        setEditingItem(null);
    };

    // Duplicate class function
    const handleDuplicateClass = () => {
        if (!editingItem || !scheduleData || !currentUser) return;

        // Validate form first
        if (!validateForm()) {
            return;
        }

        setHistory(prev => [...prev, scheduleData]);

        const newClass: ClassSchedule = {
            slotId: `${editingItem.courseCode}-${newDay}-${newStartTime}-${Date.now()}`,
            day: newDay as ClassSchedule['day'],
            startTime: newStartTime,
            endTime: newEndTime,
            courseName: editingItem.courseName,
            courseCode: editingItem.courseCode,
            instructor: newInstructor.trim(),
            location: newVenue.trim(),
        };

        const updatedSchedule = [...scheduleData, newClass];
        setScheduleData(updatedSchedule);

        logActivity(currentUser.uid, {
            type: 'schedule',
            title: 'Class Duplicated',
            description: `Created duplicate of ${editingItem.courseCode} on ${newDay} at ${newStartTime}.`,
            icon: '📋',
            link: '/schedule'
        });
        setEditingItem(null);
    };

    const handleDeleteSlot = () => {
        if (!editingItem || !scheduleData || !currentUser) return;
        setHistory(prev => [...prev, scheduleData]);
        const updatedSchedule = scheduleData.filter(item => item.slotId !== editingItem.slotId);
        setScheduleData(updatedSchedule);
        logActivity(currentUser.uid, {
            type: 'schedule',
            title: 'Class Slot Removed',
            description: `Removed a class slot for ${editingItem.courseName}.`,
            icon: '🗑️',
            link: '/schedule'
        });
        setEditingItem(null);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetDay: string, targetStartTime: string) => {
        e.preventDefault();
        if (!scheduleData || !currentUser) return;
        setHistory(prev => [...prev, scheduleData]);
        const itemToMove: ClassSchedule = JSON.parse(e.dataTransfer.getData('application/json'));

        const start = new Date(`1970-01-01T${itemToMove.startTime}:00`);
        const end = new Date(`1970-01-01T${itemToMove.endTime}:00`);
        const durationMs = end.getTime() - start.getTime();

        const newStart = new Date(`1970-01-01T${targetStartTime}:00`);
        const newEnd = new Date(newStart.getTime() + durationMs);
        const newEndTime = `${String(newEnd.getHours()).padStart(2, '0')}:${String(newEnd.getMinutes()).padStart(2, '0')}`;

        const updatedSchedule = scheduleData.map(item => {
            if (item.slotId === itemToMove.slotId) {
                return {
                    ...item,
                    day: targetDay as ClassSchedule['day'],
                    startTime: targetStartTime,
                    endTime: newEndTime
                };
            }
            return item;
        });
        setScheduleData(updatedSchedule);
        logActivity(currentUser.uid, {
            type: 'schedule',
            title: 'Class Rescheduled',
            description: `Rescheduled ${itemToMove.courseName} to ${targetDay} at ${targetStartTime}.`,
            icon: '🔄',
            link: '/schedule'
        });
    };

    const filteredCourses = useMemo(() => {
        return TIMETABLE_DATA.filter(course =>
            `${course.courseCode} ${course.courseName}`.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    const filteredSchedule = useMemo(() => {
        if (!scheduleData) return [];
        if (filterCourse === 'all') return scheduleData;
        return scheduleData.filter(item => item.courseCode === filterCourse);
    }, [scheduleData, filterCourse]);

    const getGridPosition = (item: ClassSchedule) => {
        const startHour = parseInt(item.startTime.split(':')[0]);
        const endHour = parseInt(item.endTime.split(':')[0]);
        const startMinute = parseInt(item.startTime.split(':')[1]);
        
        const rowStart = (startHour - 8) * 2 + (startMinute >= 30 ? 1 : 0) + 2;
        const durationMinutes = (endHour * 60 + parseInt(item.endTime.split(':')[1])) - (startHour * 60 + startMinute);
        const rowSpan = Math.ceil(durationMinutes / 30);
        
        const colStart = days.indexOf(item.day) + 2;
        return { gridColumn: colStart, gridRow: `${rowStart} / span ${rowSpan}` };
    };
    
    if (scheduleLoading && !isInitialized.current) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="w-16 h-16 border-4 border-t-transparent border-primary rounded-full animate-spin"></div>
                <p className="text-slate-600 dark:text-slate-400 animate-pulse">Loading your schedule...</p>
            </div>
        );
    }
    
    return (
        <div className="max-w-full mx-auto space-y-6 p-4 sm:p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        Weekly Schedule
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Manage your classes and track your academic progress
                    </p>
                </div>
                {today && (
                    <div className="text-right">
                        <p className="text-sm text-slate-500">Today is</p>
                        <p className="text-lg font-semibold text-primary">{today}</p>
                    </div>
                )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-105 active:scale-95 cursor-pointer">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-semibold mb-1">Total Courses</p>
                            <p className="text-4xl font-black group-hover:scale-110 transition-transform origin-left">{displayCoursesCount}</p>
                        </div>
                        <svg className="w-12 h-12 opacity-70 group-hover:opacity-100 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                </div>

                <div className="group relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-105 active:scale-95 cursor-pointer">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm font-semibold mb-1">Total Credits</p>
                            <p className="text-4xl font-black group-hover:scale-110 transition-transform origin-left">{totalCredits}</p>
                        </div>
                        <svg className="w-12 h-12 opacity-70 group-hover:opacity-100 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                    </div>
                </div>

                <div className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-105 active:scale-95 cursor-pointer">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm font-semibold mb-1">Today's Classes</p>
                            <p className="text-4xl font-black group-hover:scale-110 transition-transform origin-left">{todaysClasses.length}</p>
                        </div>
                        <svg className="w-12 h-12 opacity-70 group-hover:opacity-100 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>

                <div className="group relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-105 active:scale-95 cursor-pointer">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-sm font-semibold mb-1">Total Classes</p>
                            <p className="text-4xl font-black group-hover:scale-110 transition-transform origin-left">{scheduleData?.length || 0}</p>
                        </div>
                        <svg className="w-12 h-12 opacity-70 group-hover:opacity-100 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Upcoming Class Alert */}
            {upcomingClass && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </div>
                        <div className="ml-3 flex-1">
                            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">Next Class Alert</h3>
                            <p className="text-sm text-blue-700 dark:text-blue-400">
                                <span className="font-semibold">{upcomingClass.courseName}</span> at {formatTime(upcomingClass.startTime)} in {upcomingClass.location}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Course Selection and Controls */}
            <div className="bg-white dark:bg-dark-card rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Course Management
                </h2>
                
                <div className="space-y-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div ref={dropdownRef} className="relative flex-grow">
                            <button
                                type="button"
                                className="w-full flex justify-between items-center px-4 py-3 bg-gradient-to-r from-primary/10 to-secondary/10 hover:from-primary/20 hover:to-secondary/20 border border-primary/30 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 transition-all duration-200"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            >
                                <span className="flex items-center">
                                    <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                    {displayCoursesCount > 0 ? (
                                        <>
                                            <span className="font-semibold">{displayCoursesCount}</span>
                                            <span className="ml-1">course{displayCoursesCount !== 1 ? 's' : ''} selected</span>
                                        </>
                                    ) : 'Select your courses'}
                                </span>
                                <ChevronDownIcon />
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute z-50 mt-2 w-full bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                    <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Search courses..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                            />
                                            <svg className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <ul className="max-h-64 overflow-y-auto">
                                        {filteredCourses.map(course => (
                                            <li key={course.courseCode}>
                                                <label className="flex items-center px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                                                        checked={selectedCourseCodes.includes(course.courseCode)}
                                                        onChange={() => handleCourseSelection(course.courseCode)}
                                                    />
                                                    <div className="ml-3 flex-1">
                                                        <p className="font-medium text-slate-900 dark:text-white">{course.courseCode}</p>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400">{course.courseName}</p>
                                                        <p className="text-xs text-slate-400 dark:text-slate-500">{course.credits} credits</p>
                                                    </div>
                                                </label>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleUndo}
                                disabled={history.length === 0}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                title="Undo last change"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                </svg>
                                Undo
                            </button>
                            <button
                                onClick={handleResetSchedule}
                                disabled={!scheduleData || scheduleData.length === 0}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                title="Reset to original schedule"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Reset
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* View Controls */}
            <div className="bg-white dark:bg-dark-card rounded-xl shadow-lg p-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">View:</span>
                        <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                            {(['grid', 'list', 'compact'] as const).map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                                        viewMode === mode 
                                            ? 'bg-white dark:bg-slate-600 text-primary shadow-sm' 
                                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                    }`}
                                >
                                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Filter:</span>
                        <select
                            value={filterCourse}
                            onChange={(e) => setFilterCourse(e.target.value)}
                            className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-slate-700"
                        >
                            <option value="all">All Courses</option>
                            {selectedCoursesForFilter.map(course => (
                                <option key={course.code} value={course.code}>{course.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Schedule Content */}
            <div className="bg-white dark:bg-dark-card rounded-xl shadow-lg overflow-hidden">
                {(!scheduleData || scheduleData.length === 0) ? (
                    <div className="text-center py-20 px-4">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Classes Scheduled</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-4">Start by selecting your courses from the dropdown above</p>
                        <button
                            onClick={() => setIsDropdownOpen(true)}
                            className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors"
                        >
                            Add Courses
                        </button>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="p-6">
                        <div className="overflow-x-auto">
                            <div className="relative grid gap-px min-w-[900px]" style={{ gridTemplateColumns: 'auto repeat(5, minmax(180px, 1fr))', gridTemplateRows: `auto repeat(${timeSlots.length * 2}, 2.5rem)` }}>
                                {/* Corner cell */}
                                <div className="sticky left-0 top-0 z-20 bg-slate-50 dark:bg-slate-800 rounded-tl-lg"></div>
                                
                                {/* Time labels */}
                                {timeSlots.flatMap((time, index) => {
                                    const hour = 8 + index;
                                    const halfHourTime = `${String(hour).padStart(2, '0')}:30`;

                                    return [
                                        // Full hour label
                                        <div
                                            key={`${time}-full`}
                                            className="sticky left-0 z-10 text-right pr-3 text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 flex items-start justify-end pt-1"
                                            style={{ gridColumn: 1, gridRow: index * 2 + 2 }}
                                        >
                                            {formatTime(time)}
                                        </div>,
                                        // Half hour mark
                                        <div
                                            key={`${time}-half`}
                                            className="sticky left-0 z-10 text-right pr-3 text-xs text-slate-500 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 flex items-start justify-end pt-1"
                                            style={{ gridColumn: 1, gridRow: index * 2 + 3 }}
                                        >
                                            {formatTime(halfHourTime)}
                                        </div>
                                    ];
                                })}

                                {/* Day headers */}
                                {days.map((day, index) => (
                                    <div key={day} className={`sticky top-0 z-10 text-center font-semibold p-3 bg-slate-50 dark:bg-slate-800 ${day === today ? 'text-primary dark:text-secondary bg-primary/10 dark:bg-primary/20' : ''}`} style={{ gridColumn: index + 2, gridRow: 1 }}>
                                        <p className="text-sm uppercase tracking-wider">{day}</p>
                                        {day === today && <p className="text-xs mt-1">Today</p>}
                                    </div>
                                ))}
                                
                                {/* Grid cells */}
                                {days.map((day, dayIndex) => 
                                    timeSlots.flatMap((_, hourIndex) => {
                                        const baseHour = 8 + hourIndex;
                                        const time1 = `${String(baseHour).padStart(2, '0')}:00`;
                                        const time2 = `${String(baseHour).padStart(2, '0')}:30`;
                                        const isToday = day === today;

                                        return [
                                            <div
                                                key={`${day}-h${hourIndex}-m0`}
                                                className={`border-r border-b ${isToday ? 'bg-primary/5 dark:bg-primary/10' : ''} border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors`}
                                                style={{ gridColumn: dayIndex + 2, gridRow: hourIndex * 2 + 2 }}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={(e) => handleDrop(e, day, time1)}
                                            ></div>,
                                            <div
                                                key={`${day}-h${hourIndex}-m30`}
                                                className={`border-r border-b ${isToday ? 'bg-primary/5 dark:bg-primary/10' : ''} border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors`}
                                                style={{ gridColumn: dayIndex + 2, gridRow: hourIndex * 2 + 3 }}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={(e) => handleDrop(e, day, time2)}
                                            ></div>
                                        ];
                                    })
                                )}
                                
                                {/* Class blocks */}
                                {filteredSchedule.map((item) => {
                                    const colorClass = getClassColor(item.courseCode);
                                    return (
                                        <div
                                            key={item.slotId}
                                            draggable={true}
                                            onDragStart={(e) => e.dataTransfer.setData('application/json', JSON.stringify(item))}
                                            onClick={() => setEditingItem(item)}
                                            className={`group relative flex flex-col p-3 m-1 rounded-xl border-2 text-xs shadow-lg hover:shadow-2xl transition-all duration-300 cursor-move hover:-translate-y-1 hover:scale-105 active:scale-95 overflow-hidden ${colorClass}`}
                                            style={getGridPosition(item)}
                                        >
                                            {/* Animated gradient background on hover */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                            <div className="relative z-10 h-full flex flex-col">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="font-black text-sm group-hover:scale-105 transition-transform">{item.courseCode}</div>
                                                    <svg className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </div>
                                                <div className="text-xs font-bold mb-2 leading-snug line-clamp-2 flex-grow">{item.courseName}</div>
                                                <div className="mt-auto flex items-center justify-between">
                                                    <div className="flex items-center opacity-90 group-hover:opacity-100 transition-opacity min-w-0">
                                                        <svg className="w-3.5 h-3.5 mr-1 flex-shrink-0 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                        <span className="text-[10px] truncate font-semibold">{item.location}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ) : viewMode === 'list' ? (
                    <div className="p-6">
                        <div className="space-y-4">
                            {days.map(day => {
                                const dayClasses = filteredSchedule.filter(item => item.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
                                if (dayClasses.length === 0 && filterCourse !== 'all') return null;
                                
                                return (
                                    <div key={day} className={`border-2 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 ${day === today ? 'border-primary/50 bg-primary/5 dark:bg-primary/10 ring-2 ring-primary/20' : 'border-slate-200 dark:border-slate-700'}`}>
                                        <div className={`px-5 py-3 font-bold text-lg ${day === today ? 'bg-gradient-to-r from-primary/30 to-secondary/30 text-primary dark:text-secondary' : 'bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800/50'}`}>
                                            {day} {day === today && <span className="text-sm ml-2 bg-primary text-white px-2 py-0.5 rounded-full">Today</span>}
                                        </div>
                                        {dayClasses.length > 0 ? (
                                            <div className="divide-y-2 divide-slate-200 dark:divide-slate-700">
                                                {dayClasses.map(item => {
                                                    const colorClass = getClassColor(item.courseCode);
                                                    return (
                                                        <div
                                                            key={item.slotId}
                                                            className="group p-5 hover:bg-gradient-to-r hover:from-slate-50 hover:to-white dark:hover:from-slate-800/70 dark:hover:to-slate-800/50 transition-all duration-300 cursor-pointer hover:scale-[1.01] hover:shadow-lg active:scale-[0.99]"
                                                            onClick={() => setEditingItem(item)}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-3 mb-2">
                                                                        <div className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-primary dark:group-hover:text-secondary transition-colors">
                                                                            {formatTime(item.startTime)} - {formatTime(item.endTime)}
                                                                        </div>
                                                                        <div className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm group-hover:shadow-md transition-all ${colorClass}`}>
                                                                            {item.courseCode}
                                                                        </div>
                                                                    </div>
                                                                    <div className="mt-1 font-bold text-slate-700 dark:text-slate-300">{item.courseName}</div>
                                                                    <div className="mt-2 text-sm text-slate-500 dark:text-slate-400 flex items-center">
                                                                        <svg className="w-4 h-4 mr-1.5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                        </svg>
                                                                        <span className="font-medium">{item.location}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                                                                    <button className="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2">
                                                                        <span className="font-bold text-sm">Edit</span>
                                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                                                No classes scheduled
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    // Compact View
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredSchedule.sort((a, b) => {
                                const dayOrder = days.indexOf(a.day) - days.indexOf(b.day);
                                if (dayOrder !== 0) return dayOrder;
                                return a.startTime.localeCompare(b.startTime);
                            }).map(item => {
                                const colorClass = getClassColor(item.courseCode);
                                return (
                                    <div
                                        key={item.slotId}
                                        className={`group relative overflow-hidden border-2 rounded-xl p-5 hover:shadow-2xl transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:scale-105 active:scale-95 ${colorClass}`}
                                        onClick={() => setEditingItem(item)}
                                    >
                                        {/* Hover gradient overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="font-extrabold text-base group-hover:scale-110 transition-transform origin-left">{item.courseCode}</div>
                                                <div className="text-xs font-bold px-2 py-1 bg-white/50 dark:bg-black/20 rounded-full">{item.day}</div>
                                            </div>
                                            <div className="text-sm font-bold mb-3 leading-tight">{item.courseName}</div>
                                            <div className="text-xs space-y-2">
                                                <div className="flex items-center gap-1.5 font-semibold">
                                                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    {formatTime(item.startTime)} - {formatTime(item.endTime)}
                                                </div>
                                                <div className="flex items-center gap-1.5 font-semibold">
                                                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    {item.location}
                                                </div>
                                            </div>
                                            {/* Edit indicator */}
                                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
            
            {/* Edit Modal */}
            {editingItem && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={() => setEditingItem(null)}>
                    <div className="bg-white dark:bg-dark-card rounded-xl shadow-2xl w-full max-w-2xl transform transition-all max-h-[90vh] overflow-y-auto" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="sticky top-0 bg-white dark:bg-dark-card border-b border-slate-200 dark:border-slate-700 p-6 rounded-t-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Edit Class Details</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                        {editingItem.courseCode} - {editingItem.courseName}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setEditingItem(null)}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-6">
                            {/* Course Info - Read Only */}
                            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Course Information</p>
                                </div>
                                <p className="text-slate-700 dark:text-slate-300">
                                    <span className="font-semibold">{editingItem.courseCode}</span> - {editingItem.courseName}
                                </p>
                            </div>

                            {/* Editable Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Instructor */}
                                <div className="md:col-span-2">
                                    <label htmlFor="instructor" className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Instructor
                                    </label>
                                    <input
                                        type="text"
                                        id="instructor"
                                        value={newInstructor}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewInstructor(e.target.value)}
                                        className={`w-full px-4 py-3 rounded-lg border-2 ${
                                            validationErrors.instructor
                                                ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                                                : 'border-slate-300 dark:border-slate-600 focus:border-primary focus:ring-primary/20'
                                        } dark:bg-slate-700 transition-colors`}
                                        placeholder="e.g., Dr. John Smith"
                                    />
                                    {validationErrors.instructor && (
                                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {validationErrors.instructor}
                                        </p>
                                    )}

                                    {/* Apply to all classes checkbox */}
                                    {scheduleData && scheduleData.filter(item => item.courseCode === editingItem?.courseCode).length > 1 && (
                                        <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                            <label className="flex items-start gap-3 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={applyInstructorToAll}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApplyInstructorToAll(e.target.checked)}
                                                    className="mt-0.5 h-5 w-5 rounded border-blue-300 text-primary focus:ring-primary cursor-pointer"
                                                />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-blue-900 dark:text-blue-200 group-hover:text-primary transition-colors">
                                                        Apply to all classes of {editingItem?.courseCode}
                                                    </p>
                                                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                                        This will update the instructor for all {scheduleData.filter(item => item.courseCode === editingItem?.courseCode).length} class sessions of this course
                                                    </p>
                                                </div>
                                            </label>
                                        </div>
                                    )}
                                </div>

                                {/* Venue */}
                                <div className="md:col-span-2">
                                    <label htmlFor="venue" className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        Venue / Location
                                    </label>
                                    <input
                                        type="text"
                                        id="venue"
                                        value={newVenue}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewVenue(e.target.value)}
                                        className={`w-full px-4 py-3 rounded-lg border-2 ${
                                            validationErrors.venue
                                                ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                                                : 'border-slate-300 dark:border-slate-600 focus:border-primary focus:ring-primary/20'
                                        } dark:bg-slate-700 transition-colors`}
                                        placeholder="e.g., Room 101, Main Building"
                                    />
                                    {validationErrors.venue && (
                                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {validationErrors.venue}
                                        </p>
                                    )}
                                </div>

                                {/* Day */}
                                <div>
                                    <label htmlFor="day" className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        Day
                                    </label>
                                    <select
                                        id="day"
                                        value={newDay}
                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewDay(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 dark:border-slate-600 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-slate-700 transition-colors"
                                    >
                                        {days.map(day => (
                                            <option key={day} value={day}>{day}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Time Range */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Time Range
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="time"
                                            value={newStartTime}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewStartTime(e.target.value)}
                                            className={`flex-1 px-3 py-3 rounded-lg border-2 ${
                                                validationErrors.time || validationErrors.startTime
                                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                                                    : 'border-slate-300 dark:border-slate-600 focus:border-primary focus:ring-primary/20'
                                            } dark:bg-slate-700 transition-colors`}
                                        />
                                        <span className="text-slate-500 dark:text-slate-400 font-medium">to</span>
                                        <input
                                            type="time"
                                            value={newEndTime}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEndTime(e.target.value)}
                                            className={`flex-1 px-3 py-3 rounded-lg border-2 ${
                                                validationErrors.time || validationErrors.endTime
                                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                                                    : 'border-slate-300 dark:border-slate-600 focus:border-primary focus:ring-primary/20'
                                            } dark:bg-slate-700 transition-colors`}
                                        />
                                    </div>
                                    {(validationErrors.time || validationErrors.startTime || validationErrors.endTime) && (
                                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {validationErrors.time || validationErrors.startTime || validationErrors.endTime}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Duration Display */}
                            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    <span className="font-semibold">Duration:</span> {
                                        (() => {
                                            const start = new Date(`1970-01-01T${newStartTime}`);
                                            const end = new Date(`1970-01-01T${newEndTime}`);
                                            const diff = (end.getTime() - start.getTime()) / (1000 * 60);
                                            return diff > 0 ? `${Math.floor(diff / 60)}h ${diff % 60}m` : 'Invalid';
                                        })()
                                    }
                                </p>
                            </div>

                            {/* Conflict Warning */}
                            {hasConflict && (
                                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0">
                                            <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                                                ⚠️ Schedule Conflict Detected
                                            </h4>
                                            <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-2">
                                                This time slot overlaps with {conflictingClasses.length} other class{conflictingClasses.length !== 1 ? 'es' : ''}:
                                            </p>
                                            <ul className="space-y-1">
                                                {conflictingClasses.map(cls => (
                                                    <li key={cls.slotId} className="text-sm text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <span className="font-medium">{cls.courseCode}</span> - {formatTime(cls.startTime)} to {formatTime(cls.endTime)}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Keyboard Shortcuts Help */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span><strong>Tip:</strong> Press <kbd className="px-2 py-1 bg-white dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600 text-xs font-mono">Esc</kbd> to close, <kbd className="px-2 py-1 bg-white dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600 text-xs font-mono">Ctrl+Enter</kbd> to save</span>
                                </p>
                            </div>
                        </div>
 
                        {/* Footer */}
                        <div className="sticky bottom-0 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 p-6 rounded-b-xl">
                            <div className="flex flex-col gap-3">
                                {/* Top Row - Destructive and Special Actions */}
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={handleDeleteSlot}
                                        className="w-full sm:w-auto px-5 py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors flex items-center justify-center shadow-lg hover:shadow-xl"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Delete Class
                                    </button>
                                    <button
                                        onClick={handleDuplicateClass}
                                        className="w-full sm:w-auto px-5 py-3 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-semibold transition-colors flex items-center justify-center shadow-lg hover:shadow-xl"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        Duplicate as New Class
                                    </button>
                                </div>

                                {/* Bottom Row - Primary Actions */}
                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={() => setEditingItem(null)}
                                        className="flex-1 px-5 py-3 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 font-semibold transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleUpdateClassDetails}
                                        className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-secondary-dark text-white font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Schedule;