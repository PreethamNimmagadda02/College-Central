import React, { useState, useMemo } from 'react';
import { useCalendar } from '../contexts/CalendarContext';
import { AcademicCalendarData, CalendarEvent, CalendarEventType } from '../types';

const getEventTypeIcon = (type: CalendarEventType) => {
    switch (type) {
        case 'Start of Semester': return '🚀';
        case 'End-Semester Exams':
        case 'Mid-Semester Exams': return '📝';
        case 'Holiday': return '🎉';
        default: return '🗓️'; 
    }
};

const getEventTypeColor = (type: CalendarEventType) => {
    switch (type) {
        case 'Start of Semester': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
        case 'End-Semester Exams': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
        case 'Mid-Semester Exams': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
        case 'Holiday': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
};

const AcademicCalendar: React.FC = () => {
    const {
        calendarData,
        setCalendarData,
        loading: calendarLoading,
        addUserEvent,
        updateUserEvent,
        deleteUserEvent,
        reminderPreferences,
        toggleReminderPreference,
        getEventKey
    } = useCalendar();
    
    const [viewMode, setViewMode] = useState<'timeline' | 'grid' | 'list'>('timeline');
    const [filterType, setFilterType] = useState<CalendarEventType | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddEventModal, setShowAddEventModal] = useState(false);
    const [showEditEventModal, setShowEditEventModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [selectedEventIndex, setSelectedEventIndex] = useState<number | null>(null);
    const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
    const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
        date: '',
        endDate: '',
        description: '',
        type: 'Other',
        remindMe: false
    });

    const filteredEvents = useMemo(() => {
        if (!calendarData) return [];
        
        let events = [...calendarData.events];
        
        // Apply type filter
        if (filterType !== 'all') {
            events = events.filter(event => event.type === filterType);
        }
        
        // Apply search filter
        if (searchTerm) {
            events = events.filter(event => 
                event.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        return events;
    }, [calendarData, filterType, searchTerm]);

    const groupedEvents = useMemo(() => {
        return filteredEvents.reduce((acc, event) => {
            const month = new Date(event.date).toLocaleString('default', { month: 'long', year: 'numeric' });
            if (!acc[month]) {
                acc[month] = [];
            }
            acc[month].push(event);
            return acc;
        }, {} as Record<string, CalendarEvent[]>);
    }, [filteredEvents]);

    const upcomingEvents = useMemo(() => {
        if (!calendarData) return [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
    
        const relevantKeywords = [
            'b. tech', 'm. tech', 'ug', 'pg', 'dual degree', 'all students', 'int. m. tech'
        ];
        // List of keywords that make an event "specific" to any group
        const specificGroupKeywords = [
            ...relevantKeywords,
            'ph. d', 'executive m. tech', 'executive mba', 'part-time', 'm. sc', 'ma students', 'scholars'
        ];
    
        const futureAndOngoingEvents = calendarData.events
          .filter(event => new Date(event.endDate || event.date) >= today);
    
        const relevantEvents = futureAndOngoingEvents.filter(event => {
            const desc = event.description.toLowerCase();
            
            // Is it explicitly relevant?
            const isForRelevantGroup = relevantKeywords.some(kw => desc.includes(kw));
            if (isForRelevantGroup) {
                return true;
            }
    
            // Is it a general holiday?
            if (event.type === 'Holiday') {
                return true;
            }
    
            // Is it a general event (doesn't mention any specific group)?
            const isSpecificToAnyGroup = specificGroupKeywords.some(kw => desc.includes(kw));
            if (!isSpecificToAnyGroup) {
                return true; // It's a general event like CONVOCATION
            }
    
            // Otherwise, it's for a specific, non-relevant group
            return false;
        });
        
        // Sort events by their start date to get the soonest ones first
        relevantEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
        return relevantEvents.slice(0, 3);
    }, [calendarData]);

    const getDaysUntil = (date: string) => {
        const eventDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        eventDate.setHours(0, 0, 0, 0);
        const diffTime = eventDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const handleExportPDF = () => {
        if (!calendarData) return;

        // Create a printable HTML version
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Academic Calendar - ${new Date(calendarData.semesterStartDate).getFullYear()}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        padding: 40px;
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    h1 {
                        color: #2563eb;
                        border-bottom: 3px solid #2563eb;
                        padding-bottom: 10px;
                    }
                    .semester-info {
                        background: #f1f5f9;
                        padding: 15px;
                        border-radius: 8px;
                        margin: 20px 0;
                    }
                    .event {
                        padding: 15px;
                        margin: 10px 0;
                        border-left: 4px solid #2563eb;
                        background: #f8fafc;
                    }
                    .event-date {
                        font-weight: bold;
                        color: #1e40af;
                    }
                    .event-type {
                        display: inline-block;
                        padding: 4px 12px;
                        background: #dbeafe;
                        border-radius: 12px;
                        font-size: 12px;
                        margin-left: 10px;
                    }
                    @media print {
                        body { padding: 20px; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <h1>Academic Calendar</h1>
                <div class="semester-info">
                    <p><strong>Semester Period:</strong> ${new Date(calendarData.semesterStartDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} - ${new Date(calendarData.semesterEndDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    <p><strong>Total Events:</strong> ${calendarData.events.length}</p>
                </div>
                <h2>Important Events</h2>
                ${calendarData.events.map(event => `
                    <div class="event">
                        <span class="event-date">${new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} ${ event.endDate ? ' - ' + new Date(event.endDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : ''}, ${new Date(event.date).getFullYear()}</span>
                        <span class="event-type">${event.type}</span>
                        <p style="margin: 8px 0 0 0;">${event.description}</p>
                    </div>
                `).join('')}
                <div class="no-print" style="margin-top: 30px; text-align: center;">
                    <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer;">Print/Save as PDF</button>
                    <button onclick="window.close()" style="padding: 10px 20px; background: #64748b; color: white; border: none; border-radius: 6px; cursor: pointer; margin-left: 10px;">Close</button>
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    };

    const handleSyncGoogleCalendar = () => {
        if (!calendarData) return;

        // Generate .ics file content
        const icsEvents = calendarData.events.map(event => {
            const startDateStr = event.date.replace(/-/g, '');
            // For all-day events, DTEND must be the day AFTER the last day of the event
            const endDateStr = event.endDate ? new Date(new Date(event.endDate).getTime() + 86400000).toISOString().split('T')[0].replace(/-/g, '') : new Date(new Date(event.date).getTime() + 86400000).toISOString().split('T')[0].replace(/-/g, '');

            return [
                'BEGIN:VEVENT',
                `DTSTART;VALUE=DATE:${startDateStr}`,
                `DTEND;VALUE=DATE:${endDateStr}`,
                `SUMMARY:${event.description}`,
                `DESCRIPTION:${event.type}`,
                `UID:${new Date(event.date).getTime()}@academichub`,
                'END:VEVENT'
            ].filter(Boolean).join('\r\n');
        }).join('\r\n');

        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Academic Hub//Academic Calendar//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            icsEvents,
            'END:VCALENDAR'
        ].join('\r\n');

        // Create and download .ics file
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'academic-calendar.ics';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        // Show success message
        alert('Calendar file downloaded! You can now import it to Google Calendar:\n1. Open Google Calendar\n2. Click Settings (gear icon)\n3. Select "Import & export"\n4. Choose the downloaded .ics file');
    };

    const handleSetReminders = () => {
        if (!calendarData) return;

        // Check if browser supports notifications
        if (!('Notification' in window)) {
            alert('Your browser does not support notifications.');
            return;
        }

        // Request permission
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                // Find next upcoming event
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const upcomingEvent = calendarData.events.find((event: CalendarEvent) => new Date(event.endDate || event.date) >= today);

                if (upcomingEvent) {
                    const daysUntil = getDaysUntil(upcomingEvent.date);

                    // Show confirmation
                    const message = `Reminders enabled! You'll be notified about upcoming events.\n\nNext event: ${upcomingEvent.description} in ${daysUntil} days.`;
                    alert(message);

                    // Store reminder preference in localStorage
                    localStorage.setItem('calendar-reminders-enabled', 'true');
                    localStorage.setItem('calendar-data', JSON.stringify(calendarData));

                    // Show a test notification
                    new Notification('Academic Calendar Reminder', {
                        body: `Next event: ${upcomingEvent.description} on ${new Date(upcomingEvent.date).toLocaleDateString()}`,
                        icon: '📅'
                    });
                } else {
                    alert('No upcoming events to set reminders for.');
                }
            } else {
                alert('Notification permission denied. Please enable notifications in your browser settings.');
            }
        });
    };

    const handleAddEvent = async () => {
        if (!newEvent.date || !newEvent.description) {
            alert('Please fill in all required fields.');
            return;
        }

        try {
            await addUserEvent(newEvent as CalendarEvent);

            // If reminder was checked, add to reminder preferences
            if (newEvent.remindMe) {
                const eventKey = getEventKey(newEvent as CalendarEvent);
                await toggleReminderPreference(eventKey);
            }

            setNewEvent({ date: '', endDate: '', description: '', type: 'Other', remindMe: false });
            setShowAddEventModal(false);
        } catch (error) {
            console.error('Error adding event:', error);
            alert('Failed to add event. Please try again.');
        }
    };

    const handleEditEvent = async () => {
        if (!selectedEvent || !selectedEvent.id) return;

        try {
            await updateUserEvent(selectedEvent.id, selectedEvent);
            setShowEditEventModal(false);
            setSelectedEvent(null);
            setSelectedEventIndex(null);
        } catch (error) {
            console.error('Error updating event:', error);
            alert('Failed to update event. Please try again.');
        }
    };

    const handleDeleteEvent = async (event: CalendarEvent) => {
        if (!event.id || !event.userId) {
            alert('Cannot delete system events');
            return;
        }

        if (confirm('Are you sure you want to delete this event?')) {
            try {
                await deleteUserEvent(event.id);
            } catch (error) {
                console.error('Error deleting event:', error);
                alert('Failed to delete event. Please try again.');
            }
        }
    };

    const handleSetEventReminder = async (event: CalendarEvent) => {
        const eventKey = getEventKey(event);
        const isCurrentlyReminded = reminderPreferences.includes(eventKey);
        const isUserEvent = !!event.userId && !!event.id;

        try {
            if (isUserEvent) {
                // For user-created events, update both remindMe flag and reminderPreferences
                await updateUserEvent(event.id!, {
                    ...event,
                    remindMe: !isCurrentlyReminded
                });
            } else {
                // For preloaded events, only toggle reminderPreferences
                await toggleReminderPreference(eventKey);
            }
            alert(isCurrentlyReminded ? 'Reminder removed!' : 'Reminder set! This event will appear in your Dashboard.');
        } catch (error) {
            console.error('Error toggling reminder:', error);
            alert('Failed to update reminder. Please try again.');
        }
    };

    const handleSetEventReminderOld = (event: CalendarEvent) => {
        if (!('Notification' in window)) {
            alert('Your browser does not support notifications.');
            return;
        }

        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                const daysUntil = getDaysUntil(event.date);

                if (daysUntil < 0) {
                    alert('This event has already passed.');
                    return;
                }

                // Save reminder to localStorage
                const reminders = JSON.parse(localStorage.getItem('event-reminders') || '[]');
                const newReminder = {
                    eventDate: event.date,
                    eventDescription: event.description,
                    reminderDate: new Date().toISOString()
                };
                reminders.push(newReminder);
                localStorage.setItem('event-reminders', JSON.stringify(reminders));

                new Notification('Reminder Set', {
                    body: `You'll be reminded about: ${event.description}`,
                    icon: '⏰'
                });

                alert(`Reminder set for: ${event.description}\nDate: ${new Date(event.date).toLocaleDateString()}`);
            } else {
                alert('Please enable notifications to set reminders.');
            }
        });
    };

    const handleAddToPersonalCalendar = (event: CalendarEvent) => {
        const startDateStr = event.date.replace(/-/g, '');
        // For all-day events, DTEND must be the day AFTER the last day of the event
        const endDateStr = event.endDate ? new Date(new Date(event.endDate).getTime() + 86400000).toISOString().split('T')[0].replace(/-/g, '') : new Date(new Date(event.date).getTime() + 86400000).toISOString().split('T')[0].replace(/-/g, '');
    
        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Academic Hub//Event//EN',
            'BEGIN:VEVENT',
            `DTSTART;VALUE=DATE:${startDateStr}`,
            `DTEND;VALUE=DATE:${endDateStr}`,
            `SUMMARY:${event.description}`,
            `DESCRIPTION:${event.type}`,
            `UID:${new Date(event.date).getTime()}@academichub`,
            'END:VEVENT',
            'END:VCALENDAR'
        ].filter(Boolean).join('\r\n');

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${event.description.replace(/\s+/g, '-').toLowerCase()}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    const handleShowEventDetails = (event: CalendarEvent, index: number) => {
        setSelectedEvent(event);
        setSelectedEventIndex(index);
        setShowEventDetailsModal(true);
    };

    const openEditModal = (event: CalendarEvent, index: number) => {
        setSelectedEvent({ ...event });
        setSelectedEventIndex(index);
        setShowEditEventModal(true);
        setShowEventDetailsModal(false);
    };

    if (calendarLoading || !calendarData) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="w-16 h-16 border-4 border-t-transparent border-primary rounded-full animate-spin"></div>
                <p className="text-slate-600 dark:text-slate-400 animate-pulse">Loading calendar data...</p>
            </div>
        );
    }
    
    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        Academic Calendar
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        {new Date(calendarData.semesterStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {new Date(calendarData.semesterEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2 md:gap-3">
                    <button
                        onClick={handleExportPDF}
                        className="group px-3 md:px-5 py-2 md:py-2.5 text-xs md:text-sm font-medium rounded-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5 hover:scale-105 active:scale-95"
                    >
                        <div className="flex items-center space-x-1.5 md:space-x-2">
                            <svg className="w-3.5 h-3.5 md:w-4 md:h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="hidden sm:inline">Export PDF</span>
                            <span className="sm:hidden">Export</span>
                        </div>
                    </button>
                    <button
                        onClick={() => setShowAddEventModal(true)}
                        className="group px-3 md:px-5 py-2 md:py-2.5 text-xs md:text-sm font-medium rounded-lg bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5 hover:scale-105 active:scale-95"
                    >
                        <div className="flex items-center space-x-1.5 md:space-x-2">
                            <svg className="w-3.5 h-3.5 md:w-4 md:h-4 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="hidden sm:inline">Add Event</span>
                            <span className="sm:hidden">Add</span>
                        </div>
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 md:p-5 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-105">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-xs md:text-sm font-semibold">Total Events</p>
                            <p className="text-2xl md:text-3xl font-black mt-1 group-hover:scale-110 transition-transform origin-left">{calendarData.events.length}</p>
                        </div>
                        <div className="text-2xl md:text-3xl opacity-70 group-hover:opacity-100 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">📅</div>
                    </div>
                </div>

                <div className="group relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 text-white p-4 md:p-5 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-105">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-xs md:text-sm font-semibold">Days Remaining</p>
                            <p className="text-2xl md:text-3xl font-black mt-1 group-hover:scale-110 transition-transform origin-left">{getDaysUntil(calendarData.semesterEndDate)}</p>
                        </div>
                        <div className="text-2xl md:text-3xl opacity-70 group-hover:opacity-100 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">⏳</div>
                    </div>
                </div>

                <div className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 md:p-5 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-105">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-xs md:text-sm font-semibold">Upcoming</p>
                            <p className="text-2xl md:text-3xl font-black mt-1 group-hover:scale-110 transition-transform origin-left">{upcomingEvents.length}</p>
                        </div>
                        <div className="text-2xl md:text-3xl opacity-70 group-hover:opacity-100 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">🎯</div>
                    </div>
                </div>

                <div
                    onClick={() => setFilterType(filterType === 'Holiday' ? 'all' : 'Holiday')}
                    className="group relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 md:p-5 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-105 active:scale-95 cursor-pointer"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-xs md:text-sm font-semibold">Holidays</p>
                            <p className="text-2xl md:text-3xl font-black mt-1 group-hover:scale-110 transition-transform origin-left">
                                {calendarData.events.filter(e => e.type === 'Holiday').length}
                            </p>
                        </div>
                        <div className="text-2xl md:text-3xl opacity-70 group-hover:opacity-100 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">🎉</div>
                    </div>
                    {filterType === 'Holiday' && (
                        <div className="absolute top-2 right-2 bg-white/30 backdrop-blur-sm rounded-full p-1">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </div>
                    )}
                </div>
            </div>

            {/* Upcoming Events Widget */}
            {upcomingEvents.length > 0 && (
                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 p-4 md:p-6 rounded-xl border border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300">
                    <h3 className="text-base md:text-lg font-semibold mb-4 flex items-center">
                        <span className="mr-2 text-xl md:text-2xl">⚡</span> Upcoming Events
                    </h3>
                    <div className="space-y-3">
                        {upcomingEvents.map((event, index) => {
                            const daysUntil = getDaysUntil(event.date);
                            // Find the global index for this event in filteredEvents
                            const globalIndex = filteredEvents.findIndex(e =>
                                e.date === event.date &&
                                e.description === event.description &&
                                e.type === event.type
                            );
                            return (
                                <div
                                    key={index}
                                    onClick={() => handleShowEventDetails(event, globalIndex)}
                                    className="group relative overflow-hidden flex items-center justify-between bg-white dark:bg-dark-card p-3 md:p-4 rounded-lg hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="relative z-10 flex items-center space-x-3 flex-1 min-w-0">
                                        <span className="text-2xl md:text-3xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0">{getEventTypeIcon(event.type)}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm md:text-base group-hover:text-primary transition-colors truncate">{event.description}</p>
                                            <p className="text-xs md:text-sm text-slate-500 truncate">
                                                {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                {event.endDate && ` - ${new Date(event.endDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="relative z-10 text-right flex-shrink-0 ml-3">
                                        {daysUntil < 0 ? (
                                            <p className="text-sm md:text-lg font-bold text-green-600 dark:text-green-400">Ongoing</p>
                                        ) : daysUntil === 0 ? (
                                            <p className="text-sm md:text-lg font-bold text-orange-500 dark:text-orange-400">Today</p>
                                        ) : (
                                            <>
                                                <p className="text-xl md:text-2xl font-bold text-primary group-hover:scale-110 transition-transform">{daysUntil}</p>
                                                <p className="text-xs text-slate-500">days left</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className="bg-white dark:bg-dark-card p-4 md:p-5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
                <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0 lg:space-x-4">
                    {/* View Mode Selector */}
                    <div className="flex items-center space-x-2 w-full lg:w-auto">
                        <span className="text-xs md:text-sm font-medium text-slate-600 dark:text-slate-400">View:</span>
                        <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1 flex-1 lg:flex-initial">
                            {(['timeline', 'grid', 'list'] as const).map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    className={`flex-1 lg:flex-initial px-3 py-1.5 text-xs md:text-sm font-medium rounded-md transition-all duration-300 ${
                                        viewMode === mode
                                            ? 'bg-white dark:bg-slate-600 text-primary shadow-md scale-105'
                                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:scale-105'
                                    }`}
                                >
                                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                        {/* Search */}
                        <div className="relative w-full sm:w-auto">
                            <input
                                type="text"
                                placeholder="Search events..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full sm:w-auto pl-9 pr-3 py-2 text-xs md:text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-slate-700 transition-all hover:border-primary/50"
                            />
                            <svg className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        {/* Type Filter */}
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as CalendarEventType | 'all')}
                            className="w-full sm:w-auto px-3 py-2 text-xs md:text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-slate-700 transition-all hover:border-primary/50 cursor-pointer"
                        >
                            <option value="all">All Types</option>
                            <option value="Start of Semester">Start of Semester</option>
                            <option value="Mid-Semester Exams">Mid-Semester Exams</option>
                            <option value="End-Semester Exams">End-Semester Exams</option>
                            <option value="Holiday">Holidays</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>
            </div>
            
            {/* Calendar Content */}
            <div className="bg-white dark:bg-dark-card rounded-xl shadow-lg overflow-hidden">
                {viewMode === 'timeline' && (
                    <div className="p-6">
                        <h2 className="text-xl font-semibold mb-6 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Timeline View
                        </h2>
                        {Object.entries(groupedEvents).map(([month, events]) => (
                            <div key={month} className="mb-8 last:mb-0">
                                <h3 className="text-lg font-bold text-primary dark:text-secondary border-b-2 border-primary/20 dark:border-secondary/20 pb-2 mb-4">
                                    {month}
                                </h3>
                                <div className="space-y-4">
                                    {(events as CalendarEvent[]).map((event, monthIndex) => {
                                        const daysUntil = getDaysUntil(event.date);
                                        const isUrgent = daysUntil >= 0 && daysUntil <= 3;
                                        const isUpcoming = daysUntil > 3 && daysUntil <= 7;
                                        const hasReminder = reminderPreferences.includes(getEventKey(event));
                                        // Find the global index for this event
                                        const globalIndex = filteredEvents.findIndex(e =>
                                            e.date === event.date &&
                                            e.description === event.description &&
                                            e.type === event.type
                                        );

                                        return (
                                            <div
                                                key={`${month}-${monthIndex}`}
                                                onClick={() => handleShowEventDetails(event, globalIndex)}
                                                className={`
                                                    relative flex group cursor-pointer
                                                    bg-gradient-to-br from-white to-slate-50/50
                                                    dark:from-slate-800/50 dark:to-slate-800/30
                                                    hover:from-blue-50 hover:to-purple-50
                                                    dark:hover:from-slate-800/90 dark:hover:to-slate-700/90
                                                    rounded-xl transition-all duration-200 ease-out
                                                    hover:shadow-xl
                                                    hover:-translate-y-0.5
                                                    active:scale-[0.99]
                                                    p-4 mb-3 border-2
                                                    ${isUrgent ? 'border-red-300 dark:border-red-600/50' :
                                                      isUpcoming ? 'border-amber-300 dark:border-amber-600/50' :
                                                      'border-slate-200 dark:border-slate-700'}
                                                    hover:border-primary/50 dark:hover:border-primary/50
                                                `}
                                            >
                                                <div className="flex-shrink-0 w-36 text-center flex flex-col justify-center relative z-10">
                                                    {event.endDate ? (
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <div className="text-center bg-gradient-to-br from-primary/15 to-secondary/15 dark:from-primary/25 dark:to-secondary/25 group-hover:from-primary/30 group-hover:to-secondary/30 rounded-lg p-2.5 shadow transition-all duration-200">
                                                                <div className="text-2xl font-extrabold text-slate-800 dark:text-white group-hover:text-primary dark:group-hover:text-secondary transition-colors">
                                                                    {new Date(event.date).getDate()}
                                                                </div>
                                                                <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">{new Date(event.date).toLocaleString('en-US', { month: 'short' })}</div>
                                                            </div>
                                                            <div className="text-primary dark:text-secondary text-lg font-bold px-0.5">→</div>
                                                            <div className="text-center bg-gradient-to-br from-primary/15 to-secondary/15 dark:from-primary/25 dark:to-secondary/25 group-hover:from-primary/30 group-hover:to-secondary/30 rounded-lg p-2.5 shadow transition-all duration-200">
                                                                <div className="text-2xl font-extrabold text-slate-800 dark:text-white group-hover:text-primary dark:group-hover:text-secondary transition-colors">
                                                                    {new Date(event.endDate).getDate()}
                                                                </div>
                                                                <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">{new Date(event.endDate).toLocaleString('en-US', { month: 'short' })}</div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="bg-gradient-to-br from-primary/15 to-secondary/15 dark:from-primary/25 dark:to-secondary/25 group-hover:from-primary/30 group-hover:to-secondary/30 rounded-xl p-3.5 shadow-md group-hover:shadow-lg transition-all duration-200">
                                                            <div className="text-4xl font-black text-slate-800 dark:text-white group-hover:text-primary dark:group-hover:text-secondary transition-colors">
                                                                {new Date(event.date).getDate()}
                                                            </div>
                                                            <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-0.5 uppercase tracking-wide">
                                                                {new Date(event.date).toLocaleString('default', { weekday: 'short' })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1 pl-6 border-l-4 border-slate-300 dark:border-slate-600 group-hover:border-primary dark:group-hover:border-primary transition-all duration-200 relative z-10">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start gap-3 mb-2">
                                                                <div className="flex-shrink-0">
                                                                    <span className="text-3xl group-hover:scale-110 transition-transform duration-200 inline-block">
                                                                        {getEventTypeIcon(event.type)}
                                                                    </span>
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-bold text-slate-900 dark:text-white text-lg group-hover:text-primary dark:group-hover:text-secondary transition-colors duration-200 leading-snug mb-2">
                                                                        {event.description}
                                                                    </p>
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <span className={`inline-flex items-center text-xs font-bold py-1.5 px-3 rounded-full shadow-sm ${getEventTypeColor(event.type)}`}>
                                                                            {event.type}
                                                                        </span>
                                                                        <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-lg ${
                                                                            isUrgent ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                                                                            isUpcoming ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' :
                                                                            'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                                                        }`}>
                                                                            {daysUntil >= 0
                                                                                ? daysUntil === 0 ? '📍 Today' : `📅 ${daysUntil}d`
                                                                                : `✓ ${Math.abs(daysUntil)}d ago`
                                                                            }
                                                                        </span>
                                                                        {hasReminder && (
                                                                            <div className="inline-flex items-center gap-1 bg-purple-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md animate-pulse">
                                                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                                                                    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                                                                </svg>
                                                                                <span className="text-xs">Reminder</span>
                                                                            </div>
                                                                        )}
                                                                        {isUrgent && daysUntil >= 0 && (
                                                                            <span className="inline-flex items-center text-xs font-bold bg-red-500 text-white px-2.5 py-1 rounded-full shadow-md">
                                                                                ⚠️ URGENT
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex-shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-4 group-hover:translate-x-0">
                                                            <div className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                                                                <span className="text-xs font-bold whitespace-nowrap">Details</span>
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {viewMode === 'grid' && (
                    <div className="p-6">
                        <h2 className="text-xl font-semibold mb-6 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                            Grid View
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredEvents.map((event: CalendarEvent, index: number) => {
                                const daysUntil = getDaysUntil(event.date);
                                const isUrgent = daysUntil >= 0 && daysUntil <= 3;
                                const isUpcoming = daysUntil > 3 && daysUntil <= 7;
                                const hasReminder = reminderPreferences.includes(getEventKey(event));

                                return (
                                    <div
                                        key={index}
                                        onClick={() => handleShowEventDetails(event, index)}
                                        className={`
                                            relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-800/30
                                            rounded-xl p-5 shadow-md hover:shadow-2xl
                                            transition-all duration-300 ease-out
                                            hover:-translate-y-2 hover:scale-[1.02]
                                            active:scale-[0.98]
                                            cursor-pointer group
                                            border-2 border-transparent hover:border-primary/30
                                            ${isUrgent ? 'ring-2 ring-red-400/50 dark:ring-red-500/50' : ''}
                                            ${isUpcoming ? 'ring-2 ring-amber-400/50 dark:ring-amber-500/50' : ''}
                                        `}
                                    >
                                        {/* Animated background gradient on hover */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                        {/* Reminder indicator */}
                                        {hasReminder && (
                                            <div className="absolute top-2 right-2 bg-purple-500 text-white rounded-full p-1.5 shadow-lg animate-pulse">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                                </svg>
                                            </div>
                                        )}

                                        {/* Urgency indicator */}
                                        {isUrgent && daysUntil >= 0 && (
                                            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                                                URGENT
                                            </div>
                                        )}

                                        <div className="relative z-10">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="text-4xl group-hover:scale-110 transition-transform duration-300">
                                                    {getEventTypeIcon(event.type)}
                                                </div>
                                                <span className={`text-xs font-semibold py-1 px-3 rounded-full shadow-sm ${getEventTypeColor(event.type)}`}>
                                                    {event.type}
                                                </span>
                                            </div>

                                            <h4 className="font-bold text-slate-900 dark:text-white mb-3 text-lg group-hover:text-primary dark:group-hover:text-secondary transition-colors duration-200 line-clamp-2">
                                                {event.description}
                                            </h4>

                                            <div className="flex items-center text-sm text-slate-600 dark:text-slate-400 mb-3">
                                                <svg className="w-4 h-4 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span className="font-medium">
                                                    {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    {event.endDate && ` - ${new Date(event.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                                                </span>
                                            </div>

                                            <div className="pt-3 border-t-2 border-slate-200 dark:border-slate-700 group-hover:border-primary/30 transition-colors duration-200">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-2">
                                                        {daysUntil >= 0 ? (
                                                            <>
                                                                <div className={`
                                                                    text-2xl font-extrabold
                                                                    ${isUrgent ? 'text-red-600 dark:text-red-400' :
                                                                      isUpcoming ? 'text-amber-600 dark:text-amber-400' :
                                                                      'text-primary dark:text-secondary'}
                                                                `}>
                                                                    {daysUntil}
                                                                </div>
                                                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                                                    <div className="font-semibold">days</div>
                                                                    <div>remaining</div>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                                                Completed
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0">
                                                        <span className="text-xs font-semibold text-primary dark:text-secondary">View</span>
                                                        <svg className="w-5 h-5 text-primary dark:text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {viewMode === 'list' && (
                    <div className="p-6">
                        <h2 className="text-xl font-semibold mb-6 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            List View
                        </h2>
                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800/50">
                                    <tr className="border-b-2 border-slate-300 dark:border-slate-600">
                                        <th className="text-left py-4 px-6 font-bold text-slate-800 dark:text-slate-200 uppercase text-xs tracking-wider">Date</th>
                                        <th className="text-left py-4 px-6 font-bold text-slate-800 dark:text-slate-200 uppercase text-xs tracking-wider">Event</th>
                                        <th className="text-left py-4 px-6 font-bold text-slate-800 dark:text-slate-200 uppercase text-xs tracking-wider">Type</th>
                                        <th className="text-left py-4 px-6 font-bold text-slate-800 dark:text-slate-200 uppercase text-xs tracking-wider">Status</th>
                                        <th className="text-left py-4 px-6 font-bold text-slate-800 dark:text-slate-200 uppercase text-xs tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {filteredEvents.map((event: CalendarEvent, index: number) => {
                                        const daysUntil = getDaysUntil(event.date);
                                        const isPast = getDaysUntil(event.endDate || event.date) < 0;
                                        const isUrgent = daysUntil >= 0 && daysUntil <= 3;
                                        const isUpcoming = daysUntil > 3 && daysUntil <= 7;
                                        const hasReminder = reminderPreferences.includes(getEventKey(event));

                                        return (
                                            <tr
                                                key={index}
                                                onClick={() => handleShowEventDetails(event, index)}
                                                className={`
                                                    group cursor-pointer
                                                    bg-white dark:bg-slate-900/30
                                                    hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50
                                                    dark:hover:from-slate-800/80 dark:hover:to-slate-800/60
                                                    transition-all duration-300 ease-out
                                                    hover:shadow-lg hover:shadow-primary/5
                                                    hover:scale-[1.01] hover:-translate-y-0.5
                                                    active:scale-[0.99] active:translate-y-0
                                                    ${isUrgent ? 'border-l-4 border-l-red-500 bg-red-50/30 dark:bg-red-900/10' :
                                                      isUpcoming ? 'border-l-4 border-l-amber-500 bg-amber-50/30 dark:bg-amber-900/10' :
                                                      'border-l-4 border-l-transparent hover:border-l-primary'}
                                                `}
                                            >
                                                <td className="py-5 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 rounded-lg p-2 transition-colors">
                                                            <div className="text-center">
                                                                <p className="text-2xl font-black text-slate-800 dark:text-white group-hover:text-primary dark:group-hover:text-secondary transition-colors">
                                                                    {new Date(event.date).getDate()}
                                                                </p>
                                                                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                                                                    {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-700 dark:text-slate-300">
                                                                {event.endDate && `${new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(event.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                                                                {!event.endDate && new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                                , {new Date(event.date).getFullYear()}
                                                            </p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                                                {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long' })}
                                                                {event.endDate && ` - ${new Date(event.endDate).toLocaleDateString('en-US', { weekday: 'long' })}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-5 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-3xl group-hover:scale-125 transition-transform duration-300">
                                                            {getEventTypeIcon(event.type)}
                                                        </span>
                                                        <div className="flex-1">
                                                            <p className="font-bold text-slate-900 dark:text-white group-hover:text-primary dark:group-hover:text-secondary transition-colors line-clamp-1">
                                                                {event.description}
                                                            </p>
                                                            {hasReminder && (
                                                                <div className="inline-flex items-center gap-1 mt-1 bg-purple-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                                                        <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                                                    </svg>
                                                                    <span>Reminder</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-5 px-6">
                                                    <span className={`inline-flex text-xs font-bold py-2 px-3 rounded-full shadow-sm group-hover:shadow-md transition-all ${getEventTypeColor(event.type)}`}>
                                                        {event.type}
                                                    </span>
                                                </td>
                                                <td className="py-5 px-6">
                                                    {isPast ? (
                                                        <span className="inline-flex items-center text-sm font-semibold text-slate-500 dark:text-slate-400">
                                                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                            Completed
                                                        </span>
                                                    ) : daysUntil <= 0 ? (
                                                        <span className="inline-flex items-center text-sm font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-3 py-1.5 rounded-full">
                                                            <span className="animate-pulse mr-1.5">●</span>
                                                            Ongoing
                                                        </span>
                                                    ) : isUrgent ? (
                                                        <span className="inline-flex items-center text-sm font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-3 py-1.5 rounded-full">
                                                            ⚠️ {daysUntil} day{daysUntil === 1 ? '' : 's'}
                                                        </span>
                                                    ) : isUpcoming ? (
                                                        <span className="inline-flex items-center text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-3 py-1.5 rounded-full">
                                                            📅 {daysUntil} days
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-3 py-1.5 rounded-full">
                                                            In {daysUntil} days
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-5 px-6">
                                                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                                                        <button
                                                            onClick={(e: React.MouseEvent) => {
                                                                e.stopPropagation();
                                                                handleShowEventDetails(event, index);
                                                            }}
                                                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg shadow-md hover:shadow-lg transition-all group/btn"
                                                        >
                                                            <span className="text-sm font-bold">Details</span>
                                                            <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Event Modal */}
            {showAddEventModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Add New Event</h2>
                            <button
                                onClick={() => setShowAddEventModal(false)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Event Description *
                                </label>
                                <input
                                    type="text"
                                    value={newEvent.description}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEvent({ ...newEvent, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-slate-800"
                                    placeholder="e.g., Project Submission Deadline"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Start Date *
                                </label>
                                <input
                                    type="date"
                                    value={newEvent.date}
                                    min="2020-01-01"
                                    max="2099-12-31"
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEvent({ ...newEvent, date: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-slate-800"
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    End Date (optional)
                                </label>
                                <input
                                    type="date"
                                    value={newEvent.endDate || ''}
                                    min="2020-01-01"
                                    max="2099-12-31"
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Event Type
                                </label>
                                <select
                                    value={newEvent.type}
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewEvent({ ...newEvent, type: e.target.value as CalendarEventType })}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-slate-800"
                                >
                                    <option value="Other">Other</option>
                                    <option value="Start of Semester">Start of Semester</option>
                                    <option value="Mid-Semester Exams">Mid-Semester Exams</option>
                                    <option value="End-Semester Exams">End-Semester Exams</option>
                                    <option value="Holiday">Holiday</option>
                                </select>
                            </div>
                            <div className="flex items-center space-x-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                <input
                                    type="checkbox"
                                    id="remindMe"
                                    checked={newEvent.remindMe || false}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEvent({ ...newEvent, remindMe: e.target.checked })}
                                    className="w-4 h-4 text-purple-600 bg-white border-slate-300 rounded focus:ring-purple-500"
                                />
                                <label htmlFor="remindMe" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                                    🔔 Remind me about this event
                                </label>
                            </div>
                            <div className="flex space-x-3 pt-4">
                                <button
                                    onClick={handleAddEvent}
                                    className="flex-1 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white font-medium rounded-lg hover:shadow-lg transition-all"
                                >
                                    Add Event
                                </button>
                                <button
                                    onClick={() => setShowAddEventModal(false)}
                                    className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Event Modal */}
            {showEditEventModal && selectedEvent && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Event</h2>
                            <button
                                onClick={() => setShowEditEventModal(false)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Event Description
                                </label>
                                <input
                                    type="text"
                                    value={selectedEvent.description}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedEvent({ ...selectedEvent, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={selectedEvent.date}
                                    min="2020-01-01"
                                    max="2099-12-31"
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedEvent({ ...selectedEvent, date: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-slate-800"
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    End Date (optional)
                                </label>
                                <input
                                    type="date"
                                    value={selectedEvent.endDate || ''}
                                    min="2020-01-01"
                                    max="2099-12-31"
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedEvent({ ...selectedEvent, endDate: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Event Type
                                </label>
                                <select
                                    value={selectedEvent.type}
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedEvent({ ...selectedEvent, type: e.target.value as CalendarEventType })}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-slate-800"
                                >
                                    <option value="Other">Other</option>
                                    <option value="Start of Semester">Start of Semester</option>
                                    <option value="Mid-Semester Exams">Mid-Semester Exams</option>
                                    <option value="End-Semester Exams">End-Semester Exams</option>
                                    <option value="Holiday">Holiday</option>
                                </select>
                            </div>
                            <div className="flex space-x-3 pt-4">
                                <button
                                    onClick={handleEditEvent}
                                    className="flex-1 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white font-medium rounded-lg hover:shadow-lg transition-all"
                                >
                                    Save Changes
                                </button>
                                <button
                                    onClick={() => setShowEditEventModal(false)}
                                    className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Event Details Modal */}
            {showEventDetailsModal && selectedEvent && selectedEventIndex !== null && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl max-w-lg w-full p-6">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center space-x-3">
                                <span className="text-4xl">{getEventTypeIcon(selectedEvent.type)}</span>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedEvent.description}</h2>
                                    <span className={`inline-block text-xs font-semibold py-1 px-3 rounded-full mt-2 ${getEventTypeColor(selectedEvent.type)}`}>
                                        {selectedEvent.type}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowEventDetailsModal(false)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div className="flex items-center space-x-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Date</p>
                                    <p className="font-medium text-slate-900 dark:text-white">
                                        {new Date(selectedEvent.date).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            month: 'long',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                        {selectedEvent.endDate && ` to ${new Date(selectedEvent.endDate).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            month: 'long',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}`}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{selectedEvent.endDate ? 'Duration' : 'Status'}</p>
                                    <p className="font-medium text-slate-900 dark:text-white">
                                        {selectedEvent.endDate 
                                            ? `${Math.ceil((new Date(selectedEvent.endDate).getTime() - new Date(selectedEvent.date).getTime()) / (1000 * 60 * 60 * 24)) + 1} days`
                                            : (getDaysUntil(selectedEvent.date) > 0
                                                ? `In ${getDaysUntil(selectedEvent.date)} days`
                                                : getDaysUntil(selectedEvent.date) === 0 ? 'Today'
                                                : `Completed ${Math.abs(getDaysUntil(selectedEvent.date))} days ago`
                                            )
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => handleSetEventReminder(selectedEvent)}
                                className={`flex items-center justify-center space-x-2 py-2.5 px-4 font-medium rounded-lg transition-all ${
                                    reminderPreferences.includes(getEventKey(selectedEvent))
                                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                        : 'bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                                }`}
                            >
                                <svg className="w-4 h-4" fill={reminderPreferences.includes(getEventKey(selectedEvent)) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                <span className="text-sm">{reminderPreferences.includes(getEventKey(selectedEvent)) ? 'Reminder Set ✓' : 'Set Reminder'}</span>
                            </button>

                            <button
                                onClick={() => handleAddToPersonalCalendar(selectedEvent)}
                                className="flex items-center justify-center space-x-2 py-2.5 px-4 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium rounded-lg transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                </svg>
                                <span className="text-sm">Export</span>
                            </button>

                            <button
                                onClick={() => openEditModal(selectedEvent, selectedEventIndex)}
                                disabled={!selectedEvent.userId}
                                className={`flex items-center justify-center space-x-2 py-2.5 px-4 font-medium rounded-lg transition-all ${
                                    selectedEvent.userId
                                        ? 'bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300 cursor-pointer'
                                        : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400 cursor-not-allowed border-2 border-slate-400 dark:border-slate-600'
                                }`}
                                title={!selectedEvent.userId ? 'Cannot edit preloaded events' : 'Edit this event'}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                <span className="text-sm">Edit</span>
                            </button>

                            <button
                                onClick={() => {
                                    handleDeleteEvent(selectedEvent);
                                    setShowEventDetailsModal(false);
                                }}
                                disabled={!selectedEvent.userId}
                                className={`flex items-center justify-center space-x-2 py-2.5 px-4 font-medium rounded-lg transition-all ${
                                    selectedEvent.userId
                                        ? 'bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 cursor-pointer'
                                        : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400 cursor-not-allowed border-2 border-slate-400 dark:border-slate-600'
                                }`}
                                title={!selectedEvent.userId ? 'Cannot delete preloaded events' : 'Delete this event'} 
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span className="text-sm">Delete</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AcademicCalendar;