import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSchedule } from '../contexts/ScheduleContext';
import { useUser } from '../contexts/UserContext';
import { ClassSchedule, TimeTableCourse } from '../types';
import { TIMETABLE_DATA } from '../data/courseData';
import { useAuth } from '../hooks/useAuth';
import { logActivity } from '../services/activityService';
import { calculateCreditsFromLTP } from '../utils/creditCalculator';
import jsPDF from 'jspdf';

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

const getClassColor = (courseCode: string, isCustomTask?: boolean) => {
    // Custom tasks get a distinctive teal/cyan color scheme
    if (isCustomTask) {
        return 'bg-teal-500/25 border-2 border-teal-600 text-teal-800 dark:text-teal-200';
    }

    // Carefully curated color palette with maximum visual distinction and appeal
    // Colors chosen to be easily distinguishable from each other with vibrant, pleasing tones
    const colors = [
        'bg-blue-500/25 border-2 border-blue-600 text-blue-800 dark:text-blue-200',        // Bright Blue
        'bg-emerald-500/25 border-2 border-emerald-600 text-emerald-800 dark:text-emerald-200',  // Fresh Green
        'bg-purple-500/25 border-2 border-purple-600 text-purple-800 dark:text-purple-200',      // Rich Purple
        'bg-orange-500/25 border-2 border-orange-600 text-orange-800 dark:text-orange-200',      // Warm Orange
        'bg-rose-500/25 border-2 border-rose-600 text-rose-800 dark:text-rose-200',              // Soft Rose
        'bg-indigo-500/25 border-2 border-indigo-600 text-indigo-800 dark:text-indigo-200',      // Deep Indigo
        'bg-amber-500/25 border-2 border-amber-600 text-amber-800 dark:text-amber-200',          // Golden Amber
        'bg-cyan-500/25 border-2 border-cyan-600 text-cyan-800 dark:text-cyan-200',              // Bright Cyan
        'bg-fuchsia-500/25 border-2 border-fuchsia-600 text-fuchsia-800 dark:text-fuchsia-200',  // Vibrant Fuchsia
        'bg-lime-500/25 border-2 border-lime-600 text-lime-800 dark:text-lime-200',              // Electric Lime
        'bg-violet-500/25 border-2 border-violet-600 text-violet-800 dark:text-violet-200',      // Royal Violet
        'bg-sky-500/25 border-2 border-sky-600 text-sky-800 dark:text-sky-200',                  // Sky Blue
        'bg-pink-500/25 border-2 border-pink-600 text-pink-800 dark:text-pink-200',              // Hot Pink
        'bg-green-500/25 border-2 border-green-600 text-green-800 dark:text-green-200',          // Classic Green
        'bg-red-500/25 border-2 border-red-600 text-red-800 dark:text-red-200',                  // Bold Red
        'bg-yellow-500/25 border-2 border-yellow-600 text-yellow-800 dark:text-yellow-200',      // Sunny Yellow
    ];

    // Use a better hash function for more uniform distribution
    let hash = 0;
    for (let i = 0; i < courseCode.length; i++) {
        hash = ((hash << 5) - hash) + courseCode.charCodeAt(i);
        hash = hash & hash; // Convert to 32-bit integer
    }
    hash = Math.abs(hash);

    return colors[hash % colors.length];
};

const Schedule: React.FC = () => {
    const { scheduleData, setScheduleData, loading: scheduleLoading } = useSchedule();
    const { currentUser } = useAuth();
    const { user } = useUser();
    const courseOption = user?.courseOption || 'CBCS';

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
    const [isCreatingCustomTask, setIsCreatingCustomTask] = useState(false);
    const [customTaskName, setCustomTaskName] = useState('');
    const [customTaskDescription, setCustomTaskDescription] = useState('');
    
    const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    // Extended time slots: 6 AM to 11 PM (more flexible for custom tasks)
    const timeSlots = Array.from({ length: 17 }, (_, i) => `${(6 + i).toString().padStart(2, '0')}:00`);
    const currentDayIndex = new Date().getDay();
    const today = allDays[currentDayIndex === 0 ? 6 : currentDayIndex - 1] || '';

    // Determine which days to display based on schedule data
    const daysWithContent = useMemo(() => {
        if (!scheduleData) return allDays.slice(0, 5); // Default to weekdays only
        const daysInSchedule = new Set(scheduleData.map(item => item.day));

        // Always show weekdays
        const displayDays = allDays.slice(0, 5);

        // Add weekend days if they have content
        if (daysInSchedule.has('Saturday')) displayDays.push('Saturday');
        if (daysInSchedule.has('Sunday')) displayDays.push('Sunday');

        return displayDays;
    }, [scheduleData]);

    const days = daysWithContent;

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

    // Calculate unique courses from actual schedule data (excluding custom tasks)
    const uniqueCoursesFromSchedule = useMemo(() => {
        if (!scheduleData) return [];
        return [...new Set(scheduleData.filter(item => !item.isCustomTask).map(item => item.courseCode))];
    }, [scheduleData]);

    // Calculate custom tasks count
    const customTasksCount = useMemo(() => {
        if (!scheduleData) return 0;
        return scheduleData.filter(item => item.isCustomTask).length;
    }, [scheduleData]);

    // Display the actual count from schedule, not just selected codes
    const displayCoursesCount = uniqueCoursesFromSchedule.length || selectedCourseCodes.length;

    const totalCredits = useMemo(() => {
        // Use courses from actual schedule data
        const coursesToCount = uniqueCoursesFromSchedule.length > 0 ? uniqueCoursesFromSchedule : selectedCourseCodes;
        return coursesToCount.reduce((acc, code) => {
            const course = TIMETABLE_DATA.find(c => c.courseCode === code);
            if (!course) return acc;
            const credits = calculateCreditsFromLTP(course.ltp, courseOption);
            return acc + credits;
        }, 0);
    }, [uniqueCoursesFromSchedule, selectedCourseCodes, courseOption]);

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
        const uniqueCodes = [...new Set(scheduleData.filter(item => !item.isCustomTask).map(item => item.courseCode))];
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

        const newCourses: ClassSchedule[] = selectedCourses.flatMap(course =>
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

        // Preserve existing custom tasks
        const existingTasks = scheduleData?.filter(item => item.isCustomTask) || [];
        setScheduleData([...newCourses, ...existingTasks]);
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

        const courseScheduleData: ClassSchedule[] = selectedCourses.flatMap(course =>
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

        // Preserve custom tasks when resetting course schedule
        const customTasks = scheduleData?.filter(item => item.isCustomTask) || [];
        const newScheduleData = [...courseScheduleData, ...customTasks];

        setScheduleData(newScheduleData);
        if (currentUser) {
            logActivity(currentUser.uid, {
                type: 'schedule',
                title: 'Courses Reset',
                description: 'Academic courses were reset to their original state. Custom tasks preserved.',
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

    const handleResetTasks = () => {
        if (!scheduleData || !currentUser) return;

        // Keep only courses, remove all custom tasks
        const coursesOnly = scheduleData.filter(item => !item.isCustomTask);
        setScheduleData(coursesOnly);

        logActivity(currentUser.uid, {
            type: 'schedule',
            title: 'Custom Tasks Cleared',
            description: 'All custom tasks have been removed from the schedule.',
            icon: '🗑️',
            link: '/schedule'
        });
    };

    // Export schedule as PDF
    const handleExportPDF = () => {
        if (!scheduleData || scheduleData.length === 0) return;

        const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Title
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Weekly Schedule', pageWidth / 2, 12, { align: 'center' });

        // User info
        if (currentUser && user) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`${user.name} - ${user.admissionNumber}`, pageWidth / 2, 19, { align: 'center' });
        }

        // Grid setup - with time column on left
        const timeColWidth = 20;
        const startX = 10 + timeColWidth;
        const startY = 28;
        const numDays = daysWithContent.length;
        const dayColumnWidth = (pageWidth - 20 - timeColWidth) / numDays;
        const cellHeight = 18;
        const headerHeight = 8;

        // Get all unique time slots from schedule and sort them
        const allTimeSlots = new Set<string>();
        scheduleData.forEach(item => {
            allTimeSlots.add(item.startTime);
        });
        const sortedTimes = Array.from(allTimeSlots).sort();

        // Draw header row (days)
        doc.setFillColor(41, 128, 185); // Blue
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);

        // Empty cell for time column header
        doc.setFillColor(52, 73, 94); // Dark blue-grey
        doc.rect(10, startY, timeColWidth, headerHeight, 'F');
        doc.text('Time', 10 + timeColWidth / 2, startY + 5.5, { align: 'center' });

        // Day headers
        daysWithContent.forEach((day, index) => {
            const x = startX + (index * dayColumnWidth);
            doc.setFillColor(41, 128, 185);
            doc.setTextColor(255, 255, 255);
            doc.rect(x, startY, dayColumnWidth, headerHeight, 'F');
            doc.text(day, x + dayColumnWidth / 2, startY + 5.5, { align: 'center' });
        });

        // Group schedule by day and time
        const scheduleGrid: { [key: string]: { [key: string]: ClassSchedule[] } } = {};
        daysWithContent.forEach(day => {
            scheduleGrid[day] = {};
        });

        scheduleData.forEach(item => {
            if (!scheduleGrid[item.day]) {
                scheduleGrid[item.day] = {};
            }
            if (!scheduleGrid[item.day][item.startTime]) {
                scheduleGrid[item.day][item.startTime] = [];
            }
            scheduleGrid[item.day][item.startTime].push(item);
        });

        let currentY = startY + headerHeight;

        // Draw rows for each time slot
        sortedTimes.forEach((time, timeIndex) => {
            // Check if we need a new page
            if (currentY + cellHeight > pageHeight - 15) {
                doc.addPage('l');
                currentY = 15;

                // Redraw headers
                doc.setFillColor(52, 73, 94);
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10);
                doc.rect(10, currentY, timeColWidth, headerHeight, 'F');
                doc.text('Time', 10 + timeColWidth / 2, currentY + 5.5, { align: 'center' });

                daysWithContent.forEach((day, index) => {
                    const x = startX + (index * dayColumnWidth);
                    doc.setFillColor(41, 128, 185);
                    doc.setTextColor(255, 255, 255);
                    doc.rect(x, currentY, dayColumnWidth, headerHeight, 'F');
                    doc.text(day, x + dayColumnWidth / 2, currentY + 5.5, { align: 'center' });
                });

                currentY += headerHeight;
            }

            // Time column
            doc.setFillColor(236, 240, 241); // Light grey
            doc.setTextColor(0, 0, 0);
            doc.rect(10, currentY, timeColWidth, cellHeight, 'FD');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.text(formatTime(time), 10 + timeColWidth / 2, currentY + cellHeight / 2 + 1, { align: 'center' });

            // Draw cells for each day
            daysWithContent.forEach((day, dayIndex) => {
                const x = startX + (dayIndex * dayColumnWidth);
                const items = scheduleGrid[day][time] || [];

                // Draw cell border
                doc.setDrawColor(189, 195, 199);
                doc.setLineWidth(0.3);
                doc.rect(x, currentY, dayColumnWidth, cellHeight);

                // Fill cell if it has content
                if (items.length > 0) {
                    items.forEach((item, itemIndex) => {
                        const contentY = currentY + 3 + (itemIndex * (cellHeight / Math.max(items.length, 1)));

                        // Background color for custom tasks
                        if (item.isCustomTask) {
                            doc.setFillColor(209, 242, 235); // Light teal
                            doc.rect(x + 0.5, currentY + 0.5, dayColumnWidth - 1, cellHeight - 1, 'F');
                        }

                        // Course code
                        doc.setFont('helvetica', 'bold');
                        doc.setFontSize(7);
                        doc.setTextColor(0, 0, 0);
                        doc.text(item.courseCode, x + 1.5, contentY + 2, { maxWidth: dayColumnWidth - 3 });

                        // Course name
                        doc.setFont('helvetica', 'normal');
                        doc.setFontSize(6.5);
                        doc.text(item.courseName, x + 1.5, contentY + 5, { maxWidth: dayColumnWidth - 3 });

                        // Time range
                        doc.setFontSize(6);
                        doc.setTextColor(52, 73, 94);
                        doc.text(`${formatTime(item.startTime)} - ${formatTime(item.endTime)}`, x + 1.5, contentY + 8);

                        // Location
                        doc.setFontSize(6);
                        doc.setTextColor(0, 0, 0);
                        doc.text(item.location, x + 1.5, contentY + 11, { maxWidth: dayColumnWidth - 3 });

                        // Instructor
                        if (item.instructor && item.instructor !== '-') {
                            doc.setFontSize(6);
                            doc.setTextColor(0, 0, 0);
                            doc.text(item.instructor, x + 1.5, contentY + 14, { maxWidth: dayColumnWidth - 3 });
                        }
                    });
                }
            });

            currentY += cellHeight;
        });

        // Legend
        const legendY = Math.min(currentY + 5, pageHeight - 10);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);

        // Academic courses
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(189, 195, 199);
        doc.rect(startX, legendY, 6, 4, 'FD');
        doc.text('Academic Courses', startX + 8, legendY + 3);

        // Custom tasks
        doc.setFillColor(209, 242, 235);
        doc.rect(startX + 50, legendY, 6, 4, 'FD');
        doc.text('Custom Tasks', startX + 58, legendY + 3);

        // Footer
        const currentDate = new Date().toLocaleDateString();
        doc.setFontSize(8);
        doc.setTextColor(149, 165, 166);
        doc.text(`Generated on ${currentDate} via IIT(ISM) College Central`, pageWidth / 2, pageHeight - 5, { align: 'center' });

        // Save the PDF
        doc.save(`weekly-schedule-${new Date().toISOString().split('T')[0]}.pdf`);

        // Log activity
        if (currentUser) {
            logActivity(currentUser.uid, {
                type: 'schedule',
                title: 'Schedule Exported',
                description: 'Weekly schedule exported as PDF.',
                icon: '📄',
                link: '/schedule'
            });
        }
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
            isCustomTask: editingItem.isCustomTask, // Preserve custom task status when duplicating
        };

        const updatedSchedule = [...scheduleData, newClass];
        setScheduleData(updatedSchedule);

        logActivity(currentUser.uid, {
            type: 'schedule',
            title: editingItem.isCustomTask ? 'Custom Task Duplicated' : 'Class Duplicated',
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
            title: editingItem.isCustomTask ? 'Custom Task Removed' : 'Class Slot Removed',
            description: `Removed ${editingItem.isCustomTask ? 'custom task' : 'a class slot for'} ${editingItem.courseName}.`,
            icon: '🗑️',
            link: '/schedule'
        });
        setEditingItem(null);
    };

    const handleCreateCustomTask = () => {
        if (!scheduleData || !currentUser) return;

        // Custom validation for tasks (different from course validation)
        const errors: { [key: string]: string } = {};

        if (!customTaskName.trim()) {
            errors.customTaskName = 'Task name is required';
        }

        if (!newVenue.trim()) {
            errors.venue = 'Location is required';
        }

        // Time validation
        if (newStartTime >= newEndTime) {
            errors.time = 'End time must be after start time';
        }

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }

        setHistory(prev => [...prev, scheduleData]);

        const newTask: ClassSchedule = {
            slotId: `custom-task-${Date.now()}`,
            day: newDay as ClassSchedule['day'],
            startTime: newStartTime,
            endTime: newEndTime,
            courseName: customTaskName.trim(),
            courseCode: customTaskDescription.trim() || 'Personal',
            instructor: newInstructor.trim() || '-', // Optional, default to dash if empty
            location: newVenue.trim(),
            isCustomTask: true,
        };

        const updatedSchedule = [...scheduleData, newTask];
        setScheduleData(updatedSchedule);

        logActivity(currentUser.uid, {
            type: 'schedule',
            title: 'Custom Task Created',
            description: `Created custom task "${customTaskName}" on ${newDay} at ${newStartTime}.`,
            icon: '➕',
            link: '/schedule'
        });

        // Reset form
        setIsCreatingCustomTask(false);
        setCustomTaskName('');
        setCustomTaskDescription('');
        setNewVenue('');
        setNewInstructor('');
        setNewDay('Monday');
        setNewStartTime('09:00');
        setNewEndTime('10:00');
        setValidationErrors({});
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
        if (filterCourse === 'courses-only') return scheduleData.filter(item => !item.isCustomTask);
        if (filterCourse === 'tasks-only') return scheduleData.filter(item => item.isCustomTask);
        return scheduleData.filter(item => item.courseCode === filterCourse);
    }, [scheduleData, filterCourse]);

    const getGridPosition = (item: ClassSchedule) => {
        const startHour = parseInt(item.startTime.split(':')[0]);
        const endHour = parseInt(item.endTime.split(':')[0]);
        const startMinute = parseInt(item.startTime.split(':')[1]);

        // Calculate row start based on 6 AM start time (instead of 8 AM)
        const rowStart = (startHour - 6) * 2 + (startMinute >= 30 ? 1 : 0) + 2;
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
                <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-105">
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

                <div className="group relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-105">
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

                <div className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-105">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm font-semibold mb-1">Today's Activities</p>
                            <p className="text-4xl font-black group-hover:scale-110 transition-transform origin-left">{todaysClasses.length}</p>
                        </div>
                        <svg className="w-12 h-12 opacity-70 group-hover:opacity-100 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>

                <div className="group relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-105">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-sm font-semibold mb-1">Course Classes</p>
                            <p className="text-4xl font-black group-hover:scale-110 transition-transform origin-left">{scheduleData?.filter(item => !item.isCustomTask).length || 0}</p>
                        </div>
                        <svg className="w-12 h-12 opacity-70 group-hover:opacity-100 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                </div>

                <div className="group relative overflow-hidden bg-gradient-to-br from-teal-500 to-cyan-600 text-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-105">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <p className="text-teal-100 text-sm font-semibold mb-1">Custom Tasks</p>
                            <p className="text-4xl font-black group-hover:scale-110 transition-transform origin-left">{customTasksCount}</p>
                        </div>
                        <svg className="w-12 h-12 opacity-70 group-hover:opacity-100 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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
            <div className="bg-white dark:bg-dark-card rounded-xl shadow-lg p-6 border-2 border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        Academic Course Management
                    </h2>
                    <span className="text-xs px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full font-semibold">
                        📚 Courses Only
                    </span>
                </div>
                
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
                                                        <p className="text-xs text-slate-400 dark:text-slate-500">{calculateCreditsFromLTP(course.ltp, courseOption)} credits • {course.ltp}</p>
                                                    </div>
                                                </label>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={handleResetSchedule}
                                disabled={!scheduleData || scheduleData.filter(item => !item.isCustomTask).length === 0}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                title="Reset all courses to original schedule"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Reset Courses
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Tasks Management */}
            <div className="bg-white dark:bg-dark-card rounded-xl shadow-lg p-6 border-2 border-teal-200 dark:border-teal-800">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center">
                        <svg className="w-5 h-5 mr-2 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Personal Tasks
                    </h2>
                    <span className="text-xs px-3 py-1 bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 rounded-full font-semibold">
                        ➕ Custom Tasks
                    </span>
                </div>

                <div className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Add your personal activities like study sessions, gym time, club meetings, or any other commitments to your schedule.
                    </p>

                    <div className="flex flex-wrap justify-between items-center gap-3">
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => {
                                    setIsCreatingCustomTask(true);
                                    setNewDay('Monday');
                                    setNewStartTime('09:00');
                                    setNewEndTime('10:00');
                                    setNewVenue('');
                                    setNewInstructor('');
                                    setCustomTaskName('');
                                    setCustomTaskDescription('');
                                    setValidationErrors({});
                                }}
                                className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-lg font-semibold text-sm transition-all shadow-md hover:shadow-lg flex items-center"
                                title="Add a custom task to your schedule"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add New Task
                            </button>

                            {customTasksCount > 0 && (
                                <div className="flex items-center px-4 py-2 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-800">
                                    <svg className="w-5 h-5 mr-2 text-teal-600 dark:text-teal-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-sm font-semibold text-teal-700 dark:text-teal-300">
                                        {customTasksCount} task{customTasksCount !== 1 ? 's' : ''} added
                                    </span>
                                </div>
                            )}
                        </div>

                        {customTasksCount > 0 && (
                            <button
                                onClick={handleResetTasks}
                                disabled={customTasksCount === 0}
                                className="px-4 py-2 bg-teal-50 hover:bg-teal-100 dark:bg-teal-900/20 dark:hover:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center border border-teal-200 dark:border-teal-800"
                                title="Clear all custom tasks"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Clear All Tasks
                            </button>
                        )}
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

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Filter:</span>
                            <select
                                value={filterCourse}
                                onChange={(e) => setFilterCourse(e.target.value)}
                                className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-slate-700"
                            >
                                <option value="all">All Items</option>
                                <option value="courses-only" className="font-semibold">📚 Academic Courses Only</option>
                                <option value="tasks-only" className="font-semibold">➕ Custom Tasks Only</option>
                                {selectedCoursesForFilter.length > 0 && <option disabled>──────────</option>}
                                {selectedCoursesForFilter.map(course => (
                                    <option key={course.code} value={course.code}>{course.name}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={handleExportPDF}
                            disabled={!scheduleData || scheduleData.length === 0}
                            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            title="Export schedule as PDF"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Export PDF
                        </button>
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
                            <div className="relative grid gap-px min-w-[900px]" style={{ gridTemplateColumns: `auto repeat(${days.length}, minmax(180px, 1fr))`, gridTemplateRows: `auto repeat(${timeSlots.length * 2}, 2.5rem)` }}>
                                {/* Corner cell */}
                                <div className="sticky left-0 top-0 z-20 bg-slate-50 dark:bg-slate-800 rounded-tl-lg"></div>
                                
                                {/* Time labels */}
                                {timeSlots.flatMap((time, index) => {
                                    const hour = 6 + index; // Start from 6 AM
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
                                        const baseHour = 6 + hourIndex; // Start from 6 AM
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
                                    const colorClass = getClassColor(item.courseCode, item.isCustomTask);
                                    return (
                                        <div
                                            key={item.slotId}
                                            draggable={true}
                                            onDragStart={(e) => e.dataTransfer.setData('application/json', JSON.stringify(item))}
                                            onClick={() => setEditingItem(item)}
                                            className={`group relative flex flex-col p-2 m-0.5 rounded-lg border-2 shadow-md hover:shadow-xl transition-all duration-300 cursor-move hover:-translate-y-0.5 hover:scale-[1.02] active:scale-95 overflow-hidden ${colorClass} ${item.isCustomTask ? 'ring-2 ring-teal-400 dark:ring-teal-500' : ''}`}
                                            style={getGridPosition(item)}
                                        >
                                            {/* Custom Task Banner */}
                                            {item.isCustomTask && (
                                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-400"></div>
                                            )}

                                            {/* Animated gradient background on hover */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                            {/* Subtle pattern for custom tasks */}
                                            {item.isCustomTask && (
                                                <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, currentColor 10px, currentColor 11px)' }}></div>
                                            )}

                                            <div className="relative z-10 h-full flex flex-col justify-between gap-0.5">
                                                {/* Course Code - Always visible */}
                                                <div className="flex items-center justify-between gap-1">
                                                    <div className="font-extrabold text-xs leading-tight truncate flex items-center gap-1">
                                                        {item.isCustomTask && (
                                                            <svg className="w-3 h-3 flex-shrink-0 text-teal-600 dark:text-teal-400" fill="currentColor" viewBox="0 0 20 20" title="Custom Task">
                                                                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" />
                                                            </svg>
                                                        )}
                                                        <span className="truncate">{item.courseCode}</span>
                                                    </div>
                                                </div>

                                                {/* Course Name - Line clamp based on available space */}
                                                <div className="text-[10px] font-semibold leading-tight line-clamp-3 flex-grow overflow-hidden">
                                                    {item.courseName}
                                                </div>

                                                {/* Location - Always visible at bottom */}
                                                <div className="flex items-center gap-0.5 text-[9px] font-medium opacity-80 group-hover:opacity-100 transition-opacity mt-auto">
                                                    <svg className="w-2.5 h-2.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    <span className="truncate">{item.location}</span>
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
                            {allDays.map(day => {
                                const dayClasses = filteredSchedule.filter(item => item.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
                                // Skip days with no content (unless filtering by course)
                                if (dayClasses.length === 0) return null;
                                
                                return (
                                    <div key={day} className={`border-2 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 ${day === today ? 'border-primary/50 bg-primary/5 dark:bg-primary/10 ring-2 ring-primary/20' : 'border-slate-200 dark:border-slate-700'}`}>
                                        <div className={`px-5 py-3 font-bold text-lg ${day === today ? 'bg-gradient-to-r from-primary/30 to-secondary/30 text-primary dark:text-secondary' : 'bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800/50'}`}>
                                            {day} {day === today && <span className="text-sm ml-2 bg-primary text-white px-2 py-0.5 rounded-full">Today</span>}
                                        </div>
                                        {dayClasses.length > 0 ? (
                                            <div className="divide-y-2 divide-slate-200 dark:divide-slate-700">
                                                {dayClasses.map(item => {
                                                    const colorClass = getClassColor(item.courseCode, item.isCustomTask);
                                                    return (
                                                        <div
                                                            key={item.slotId}
                                                            className={`group p-5 hover:bg-gradient-to-r hover:from-slate-50 hover:to-white dark:hover:from-slate-800/70 dark:hover:to-slate-800/50 transition-all duration-300 cursor-pointer hover:scale-[1.01] hover:shadow-lg active:scale-[0.99] relative ${item.isCustomTask ? 'border-l-4 border-teal-400 dark:border-teal-500 bg-teal-50/30 dark:bg-teal-900/10' : ''}`}
                                                            onClick={() => setEditingItem(item)}
                                                        >
                                                            {/* Custom Task Label */}
                                                            {item.isCustomTask && (
                                                                <div className="absolute top-2 right-2">
                                                                    <span className="text-[10px] px-2 py-0.5 bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 rounded-full font-bold">
                                                                        CUSTOM TASK
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-3 mb-2">
                                                                        <div className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-primary dark:group-hover:text-secondary transition-colors">
                                                                            {formatTime(item.startTime)} - {formatTime(item.endTime)}
                                                                        </div>
                                                                        <div className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm group-hover:shadow-md transition-all flex items-center gap-1.5 ${colorClass} ${item.isCustomTask ? 'ring-2 ring-teal-400/50' : ''}`}>
                                                                            {item.isCustomTask && (
                                                                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" title="Custom Task">
                                                                                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" />
                                                                                </svg>
                                                                            )}
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
                                const colorClass = getClassColor(item.courseCode, item.isCustomTask);
                                return (
                                    <div
                                        key={item.slotId}
                                        className={`group relative overflow-hidden border-2 rounded-xl p-5 hover:shadow-2xl transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:scale-105 active:scale-95 ${colorClass} ${item.isCustomTask ? 'ring-2 ring-teal-400 dark:ring-teal-500' : ''}`}
                                        onClick={() => setEditingItem(item)}
                                    >
                                        {/* Custom Task Top Banner */}
                                        {item.isCustomTask && (
                                            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-400"></div>
                                        )}

                                        {/* Hover gradient overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                        {/* Subtle pattern for custom tasks */}
                                        {item.isCustomTask && (
                                            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, currentColor 10px, currentColor 11px)' }}></div>
                                        )}

                                        <div className="relative z-10">
                                            {/* Custom Task Badge */}
                                            {item.isCustomTask && (
                                                <div className="absolute -top-2 -right-2">
                                                    <div className="bg-teal-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold shadow-md">
                                                        TASK
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-1.5">
                                                    {item.isCustomTask && (
                                                        <svg className="w-4 h-4 flex-shrink-0 text-teal-600 dark:text-teal-400" fill="currentColor" viewBox="0 0 20 20" title="Custom Task">
                                                            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" />
                                                        </svg>
                                                    )}
                                                    <div className="font-extrabold text-base group-hover:scale-110 transition-transform origin-left">{item.courseCode}</div>
                                                </div>
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
                        <div className={`sticky top-0 border-b border-slate-200 dark:border-slate-700 p-6 rounded-t-xl ${editingItem.isCustomTask ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white' : 'bg-white dark:bg-dark-card'}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className={`text-2xl font-bold ${editingItem.isCustomTask ? 'text-white' : 'text-slate-800 dark:text-white'}`}>
                                        {editingItem.isCustomTask ? 'Edit Custom Task' : 'Edit Class Details'}
                                    </h3>
                                    <p className={`text-sm mt-1 ${editingItem.isCustomTask ? 'text-teal-100' : 'text-slate-500 dark:text-slate-400'}`}>
                                        {editingItem.isCustomTask ? editingItem.courseName : `${editingItem.courseCode} - ${editingItem.courseName}`}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setEditingItem(null)}
                                    className={`p-2 rounded-lg transition-colors ${editingItem.isCustomTask ? 'hover:bg-white/20' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                >
                                    <svg className={`w-6 h-6 ${editingItem.isCustomTask ? 'text-white' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-6">
                            {/* Task/Course Info - Read Only */}
                            <div className={`bg-gradient-to-br rounded-lg p-4 ${
                                editingItem.isCustomTask
                                    ? 'from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border border-teal-200 dark:border-teal-800'
                                    : 'from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800'
                            }`}>
                                <div className="flex items-center gap-2 mb-2">
                                    {editingItem.isCustomTask ? (
                                        <svg className="w-5 h-5 text-teal-600 dark:text-teal-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    )}
                                    <p className={`text-sm font-medium ${
                                        editingItem.isCustomTask
                                            ? 'text-teal-800 dark:text-teal-300'
                                            : 'text-blue-800 dark:text-blue-300'
                                    }`}>
                                        {editingItem.isCustomTask ? 'Task Information' : 'Course Information'}
                                    </p>
                                </div>
                                <p className="text-slate-700 dark:text-slate-300">
                                    <span className="font-semibold">{editingItem.courseCode}</span> - {editingItem.courseName}
                                </p>
                            </div>

                            {/* Editable Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Instructor / Person/Organizer */}
                                <div className="md:col-span-2">
                                    <label htmlFor="instructor" className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        {editingItem.isCustomTask ? 'Person/Organizer (Optional)' : 'Instructor'}
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
                                        placeholder={editingItem.isCustomTask ? 'e.g., Study Group, Self, Club Name' : 'e.g., Dr. John Smith'}
                                    />
                                    {validationErrors.instructor && (
                                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {validationErrors.instructor}
                                        </p>
                                    )}

                                    {/* Apply to all classes checkbox - only for courses, not custom tasks */}
                                    {!editingItem.isCustomTask && scheduleData && scheduleData.filter(item => item.courseCode === editingItem?.courseCode && !item.isCustomTask).length > 1 && (
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
                                                        This will update the instructor for all {scheduleData.filter(item => item.courseCode === editingItem?.courseCode && !item.isCustomTask).length} class sessions of this course
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
                                        {allDays.map(day => (
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
                                        {editingItem.isCustomTask ? 'Delete Task' : 'Delete Class'}
                                    </button>
                                    <button
                                        onClick={handleDuplicateClass}
                                        className="w-full sm:w-auto px-5 py-3 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-semibold transition-colors flex items-center justify-center shadow-lg hover:shadow-xl"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        {editingItem.isCustomTask ? 'Duplicate as New Task' : 'Duplicate as New Class'}
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
                                        className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center ${
                                            editingItem.isCustomTask
                                                ? 'bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white'
                                                : 'bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-secondary-dark text-white'
                                        }`}
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        {editingItem.isCustomTask ? 'Save Task' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Task Creation Modal */}
            {isCreatingCustomTask && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={() => setIsCreatingCustomTask(false)}>
                    <div className="bg-white dark:bg-dark-card rounded-xl shadow-2xl w-full max-w-2xl transform transition-all max-h-[90vh] overflow-y-auto" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="sticky top-0 bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-t-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold flex items-center">
                                        <svg className="w-7 h-7 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Create Custom Task
                                    </h3>
                                    <p className="text-sm text-green-100 mt-1">
                                        Add a personalized task to your weekly schedule
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsCreatingCustomTask(false)}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-6">
                            {/* Task Info */}
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-sm font-medium text-green-800 dark:text-green-300">Custom Task</p>
                                </div>
                                <p className="text-sm text-green-700 dark:text-green-300">
                                    Create custom tasks for study sessions, club meetings, gym time, or any personal activities.
                                </p>
                            </div>

                            {/* Editable Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Task Name */}
                                <div className="md:col-span-2">
                                    <label htmlFor="taskName" className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Task Name *
                                    </label>
                                    <input
                                        type="text"
                                        id="taskName"
                                        value={customTaskName}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomTaskName(e.target.value)}
                                        className={`w-full px-4 py-3 rounded-lg border-2 ${
                                            validationErrors.customTaskName
                                                ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                                                : 'border-slate-300 dark:border-slate-600 focus:border-primary focus:ring-primary/20'
                                        } dark:bg-slate-700 transition-colors`}
                                        placeholder="e.g., Study Session, Gym, Club Meeting"
                                    />
                                    {validationErrors.customTaskName && (
                                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {validationErrors.customTaskName}
                                        </p>
                                    )}
                                </div>

                                {/* Task Description/Category */}
                                <div className="md:col-span-2">
                                    <label htmlFor="taskDescription" className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                        </svg>
                                        Category/Label (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        id="taskDescription"
                                        value={customTaskDescription}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomTaskDescription(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 dark:border-slate-600 focus:border-primary focus:ring-primary/20 dark:bg-slate-700 transition-colors"
                                        placeholder="e.g., Personal, Study, Sports, Club Activity"
                                    />
                                </div>

                                {/* Location */}
                                <div className="md:col-span-2">
                                    <label htmlFor="taskVenue" className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        Location *
                                    </label>
                                    <input
                                        type="text"
                                        id="taskVenue"
                                        value={newVenue}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewVenue(e.target.value)}
                                        className={`w-full px-4 py-3 rounded-lg border-2 ${
                                            validationErrors.venue
                                                ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                                                : 'border-slate-300 dark:border-slate-600 focus:border-primary focus:ring-primary/20'
                                        } dark:bg-slate-700 transition-colors`}
                                        placeholder="e.g., Library, Gym, Room 101"
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

                                {/* Person/Organizer (Optional) */}
                                <div className="md:col-span-2">
                                    <label htmlFor="taskOrganizer" className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Person/Organizer (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        id="taskOrganizer"
                                        value={newInstructor}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewInstructor(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 dark:border-slate-600 focus:border-primary focus:ring-primary/20 dark:bg-slate-700 transition-colors"
                                        placeholder="e.g., Study Group, Club Name, Self"
                                    />
                                </div>

                                {/* Day */}
                                <div>
                                    <label htmlFor="taskDay" className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        Day *
                                    </label>
                                    <select
                                        id="taskDay"
                                        value={newDay}
                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewDay(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 dark:border-slate-600 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-slate-700 transition-colors"
                                    >
                                        {allDays.map(day => (
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
                                        Time Range *
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
                                                This time slot overlaps with {conflictingClasses.length} other item{conflictingClasses.length !== 1 ? 's' : ''}:
                                            </p>
                                            <ul className="space-y-1">
                                                {conflictingClasses.map(cls => (
                                                    <li key={cls.slotId} className="text-sm text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <span className="font-medium">{cls.courseName}</span> - {formatTime(cls.startTime)} to {formatTime(cls.endTime)}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="sticky bottom-0 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 p-6 rounded-b-xl">
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setIsCreatingCustomTask(false)}
                                    className="flex-1 px-5 py-3 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 font-semibold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateCustomTask}
                                    className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Create Task
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