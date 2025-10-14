import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSchedule } from '../contexts/ScheduleContext';
import { ClassSchedule, TimeTableCourse } from '../types';
import { TIMETABLE_DATA } from '../data/courseData';

const ChevronDownIcon: React.FC = () => (
    <svg className="w-5 h-5 ml-2 -mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

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
    
    const [selectedCourseCodes, setSelectedCourseCodes] = useState<string[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingItem, setEditingItem] = useState<ClassSchedule | null>(null);
    const [newVenue, setNewVenue] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [history, setHistory] = useState<ClassSchedule[][]>([]);
    const isInitialized = useRef(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
    const [filterDay, setFilterDay] = useState<string>('all');
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const timeSlots = Array.from({ length: 13 }, (_, i) => `${(8 + i).toString().padStart(2, '0')}:00`);
    const currentDayIndex = new Date().getDay();
    const today = days[currentDayIndex - 1] || '';

    useEffect(() => {
        if (editingItem) {
            setNewVenue(editingItem.location);
        }
    }, [editingItem]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (!scheduleLoading && !isInitialized.current) {
            if (scheduleData && scheduleData.length > 0) {
                const codesFromFirestore = [...new Set(scheduleData.map(item => item.courseCode))];
                setSelectedCourseCodes(codesFromFirestore);
            }
            isInitialized.current = true;
        }
    }, [scheduleLoading, scheduleData]);

    const totalCredits = useMemo(() => {
        return selectedCourseCodes.reduce((acc, code) => {
            const course = TIMETABLE_DATA.find(c => c.courseCode === code);
            return acc + (course?.credits || 0);
        }, 0);
    }, [selectedCourseCodes]);

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
        setHistory([]);
    };

    const handleUndo = () => {
        if (history.length === 0) return;
        const previousState = history[history.length - 1];
        setScheduleData(previousState);
        setHistory(prev => prev.slice(0, -1));
    };

    const handleUpdateVenue = () => {
        if (!editingItem || !scheduleData) return;
        setHistory(prev => [...prev, scheduleData]);
        const updatedSchedule = scheduleData.map(item => 
            item.slotId === editingItem.slotId ? { ...item, location: newVenue } : item
        );
        setScheduleData(updatedSchedule);
        setEditingItem(null);
    };

    const handleDeleteSlot = () => {
        if (!editingItem || !scheduleData) return;
        setHistory(prev => [...prev, scheduleData]);
        const updatedSchedule = scheduleData.filter(item => item.slotId !== editingItem.slotId);
        setScheduleData(updatedSchedule);
        setEditingItem(null);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetDay: string, targetStartTime: string) => {
        e.preventDefault();
        if (!scheduleData) return;
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
    };

    const filteredCourses = useMemo(() => {
        return TIMETABLE_DATA.filter(course =>
            `${course.courseCode} ${course.courseName}`.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    const filteredSchedule = useMemo(() => {
        if (!scheduleData) return [];
        if (filterDay === 'all') return scheduleData;
        return scheduleData.filter(item => item.day === filterDay);
    }, [scheduleData, filterDay]);

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-xl shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm">Total Courses</p>
                            <p className="text-3xl font-bold">{selectedCourseCodes.length}</p>
                        </div>
                        <svg className="w-10 h-10 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-xl shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm">Total Credits</p>
                            <p className="text-3xl font-bold">{totalCredits}</p>
                        </div>
                        <svg className="w-10 h-10 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-xl shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm">Today's Classes</p>
                            <p className="text-3xl font-bold">{todaysClasses.length}</p>
                        </div>
                        <svg className="w-10 h-10 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 rounded-xl shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-sm">Total Classes</p>
                            <p className="text-3xl font-bold">{scheduleData?.length || 0}</p>
                        </div>
                        <svg className="w-10 h-10 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                <span className="font-semibold">{upcomingClass.courseName}</span> at {upcomingClass.startTime} in {upcomingClass.location}
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
                                    {selectedCourseCodes.length > 0 ? (
                                        <>
                                            <span className="font-semibold">{selectedCourseCodes.length}</span>
                                            <span className="ml-1">course{selectedCourseCodes.length !== 1 ? 's' : ''} selected</span>
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
                            value={filterDay}
                            onChange={(e) => setFilterDay(e.target.value)}
                            className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-slate-700"
                        >
                            <option value="all">All Days</option>
                            {days.map(day => (
                                <option key={day} value={day}>{day}</option>
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
                                {timeSlots.map((time, index) => (
                                    <div key={time} className="sticky left-0 z-10 text-right pr-3 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 flex items-center justify-end" style={{ gridColumn: 1, gridRow: index * 2 + 2, gridRowEnd: index * 2 + 4 }}>
                                        {time}
                                    </div>
                                ))}

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
                                            className={`relative flex flex-col p-2 m-1 rounded-lg border-2 text-xs shadow-md hover:shadow-lg transition-all cursor-move hover:-translate-y-0.5 ${colorClass}`} 
                                            style={getGridPosition(item)}
                                        >
                                            <div className="font-bold truncate">{item.courseCode}</div>
                                            <div className="text-xs opacity-90 truncate">{item.courseName}</div>
                                            <div className="mt-auto flex items-center opacity-80">
                                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                <span className="text-xs truncate">{item.location}</span>
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
                                if (dayClasses.length === 0 && filterDay !== 'all') return null;
                                
                                return (
                                    <div key={day} className={`border rounded-lg overflow-hidden ${day === today ? 'border-primary/30 bg-primary/5 dark:bg-primary/10' : 'border-slate-200 dark:border-slate-700'}`}>
                                        <div className={`px-4 py-2 font-semibold ${day === today ? 'bg-primary/20 text-primary dark:text-secondary' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                            {day} {day === today && <span className="text-xs ml-2">(Today)</span>}
                                        </div>
                                        {dayClasses.length > 0 ? (
                                            <div className="divide-y divide-slate-200 dark:divide-slate-700">
                                                {dayClasses.map(item => {
                                                    const colorClass = getClassColor(item.courseCode);
                                                    return (
                                                        <div key={item.slotId} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => setEditingItem(item)}>
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="text-lg font-semibold">{item.startTime} - {item.endTime}</div>
                                                                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
                                                                            {item.courseCode}
                                                                        </div>
                                                                    </div>
                                                                    <div className="mt-1 font-medium">{item.courseName}</div>
                                                                    <div className="mt-1 text-sm text-slate-500 flex items-center">
                                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                        </svg>
                                                                        {item.location}
                                                                    </div>
                                                                </div>
                                                                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                                                                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                    </svg>
                                                                </button>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredSchedule.sort((a, b) => {
                                const dayOrder = days.indexOf(a.day) - days.indexOf(b.day);
                                if (dayOrder !== 0) return dayOrder;
                                return a.startTime.localeCompare(b.startTime);
                            }).map(item => {
                                const colorClass = getClassColor(item.courseCode);
                                return (
                                    <div key={item.slotId} className={`border-2 rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer ${colorClass}`} onClick={() => setEditingItem(item)}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-bold text-sm">{item.courseCode}</div>
                                            <div className="text-xs opacity-80">{item.day}</div>
                                        </div>
                                        <div className="text-sm font-medium mb-1">{item.courseName}</div>
                                        <div className="text-xs opacity-90">
                                            <div className="flex items-center gap-1 mb-1">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {item.startTime} - {item.endTime}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                {item.location}
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
                    <div className="bg-white dark:bg-dark-card rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold">Edit Class Details</h3>
                            <button onClick={() => setEditingItem(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Course</p>
                                <p className="font-semibold">{editingItem.courseCode} - {editingItem.courseName}</p>
                            </div>
                            
                            <div>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Schedule</p>
                                <p className="font-semibold">{editingItem.day}, {editingItem.startTime} - {editingItem.endTime}</p>
                            </div>
                            
                            <div>
                                <label htmlFor="venue" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Venue / Location
                                </label>
                                <input
                                    type="text"
                                    id="venue"
                                    value={newVenue}
                                    onChange={(e) => setNewVenue(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-slate-700"
                                    placeholder="Enter venue or room number"
                                    autoFocus
                                />
                            </div>
                        </div>
                        
                        <div className="flex justify-between items-center gap-3 mt-6">
                            <button 
                                onClick={handleDeleteSlot} 
                                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors flex items-center"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                            </button>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setEditingItem(null)} 
                                    className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-700 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleUpdateVenue} 
                                    className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white font-medium transition-colors flex items-center"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Schedule;