
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ClassSchedule, CampusEvent, Announcement, NewsItem, CalendarEvent } from '../types';
// FIX: Changed import from fetchLatestNewsAndEvents to subscribeToLatestNewsAndEvents.
import { subscribeToLatestNewsAndEvents } from '../services/api';
import { useUser } from '../contexts/UserContext';
import { useGrades } from '../contexts/GradesContext';
import { useSchedule } from '../contexts/ScheduleContext';
import { useCalendar } from '../contexts/CalendarContext';
import { useAuth } from '../hooks/useAuth';
import { GoogleGenAI } from '@google/genai';
import {
    InstructorIcon, LocationIcon, LibraryIcon, GymkhanaIcon,
    PortalIcon, CalendarCheckIcon, HealthIcon, FeeIcon,
    WebsiteIcon, EmailIcon, LmsIcon, CdcIcon, MapIcon, RefreshIcon, ScholarshipIcon, DirectoryIcon
} from '../components/icons/SidebarIcons';

interface QuickLink {
    id: string;
    name: string;
    href: string;
    icon: React.ReactNode;
    isExternal: boolean;
    color: string;
    isCustom?: boolean;
}

interface WeatherData {
    temp: string;
    desc: string;
    icon: string;
}

interface DetailedWeatherData extends WeatherData {
    humidity: number;
    windSpeed: number;
    windDirection: number;
    pressure: number;
    feelsLike: number;
    uvIndex: number;
    visibility: number;
    precipitation: number;
}

// Helper function to interpret WMO weather codes from Open-Meteo
const getWeatherInfoFromCode = (code: number, isDay: number): { desc: string, icon: string } => {
    const is_day = isDay === 1;
    switch (code) {
        case 0: return { desc: 'Clear sky', icon: is_day ? '☀️' : '🌙' };
        case 1: return { desc: 'Mainly clear', icon: is_day ? '🌤️' : '☁️' };
        case 2: return { desc: 'Partly cloudy', icon: is_day ? '⛅️' : '☁️' };
        case 3: return { desc: 'Overcast', icon: '☁️' };
        case 45:
        case 48: return { desc: 'Fog', icon: '🌫️' };
        case 51:
        case 53:
        case 55: return { desc: 'Drizzle', icon: '🌦️' };
        case 56:
        case 57: return { desc: 'Freezing Drizzle', icon: '🌨️' };
        case 61:
        case 63:
        case 65: return { desc: 'Rain', icon: '🌧️' };
        case 66:
        case 67: return { desc: 'Freezing Rain', icon: '🌨️' };
        case 71:
        case 73:
        case 75: return { desc: 'Snow fall', icon: '❄️' };
        case 77: return { desc: 'Snow grains', icon: '❄️' };
        case 80:
        case 81:
        case 82: return { desc: 'Rain showers', icon: '🌧️' };
        case 85:
        case 86: return { desc: 'Snow showers', icon: '🌨️' };
        case 95: return { desc: 'Thunderstorm', icon: '⛈️' };
        case 96:
        case 99: return { desc: 'Thunderstorm with hail', icon: '⛈️' };
        default: return { desc: 'Cloudy', icon: '☁️' };
    }
};

// Helper function to convert wind direction degrees to compass direction
const getWindDirection = (degrees: number): string => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
};

// Default quick links
const defaultQuickLinks: QuickLink[] = [
    { id: '1', name: 'MIS Portal', href: 'https://mis.iitism.ac.in/', icon: <PortalIcon />, isExternal: true, color: 'text-blue-600 dark:text-blue-400', isCustom: false },
    { id: '2', name: 'Abhikalp Portal', href: 'https://abhikalp.iitism.ac.in/', icon: <PortalIcon />, isExternal: true, color: 'text-red-600 dark:text-red-400', isCustom: false },
    { id: '3', name: 'ARK Portal', href: 'https://ark.iitism.ac.in/', icon: <PortalIcon />, isExternal: true, color: 'text-indigo-600 dark:text-indigo-400', isCustom: false },
    { id: '4', name: 'CDC Portal', href: 'https://www.iitism.ac.in/career-development-centre', icon: <CdcIcon />, isExternal: true, color: 'text-green-600 dark:text-green-400', isCustom: false },
    { id: '5', name: 'Central Library', href: 'https://library.iitism.ac.in/', icon: <LibraryIcon />, isExternal: true, color: 'text-purple-600 dark:text-purple-400', isCustom: false },
    { id: '6', name: 'Fee Payment/Pre-Registration', href: 'https://pre-registration.iitism.ac.in/login/', icon: <FeeIcon />, isExternal: true, color: 'text-orange-600 dark:text-orange-400', isCustom: false },
    { id: '7', name: 'Scholarships', href: 'https://www.iitism.ac.in/name-of-scholarships', icon: <ScholarshipIcon />, isExternal: true, color: 'text-teal-600 dark:text-teal-400', isCustom: false },
    { id: '8', name: 'Health Centre', href: 'https://people.iitism.ac.in/~healthcenter/index.php', icon: <HealthIcon />, isExternal: true, color: 'text-pink-600 dark:text-pink-400', isCustom: false },
    { id: '9', name: 'IIT(ISM) Website', href: 'https://www.iitism.ac.in/', icon: <WebsiteIcon />, isExternal: true, color: 'text-cyan-600 dark:text-cyan-400', isCustom: false },
    { id: '10', name: 'College Directory', href: 'https://share.google/YnDiJNPeoRC7UMl5t', icon: <DirectoryIcon />, isExternal: true, color: 'text-yellow-600 dark:text-yellow-400', isCustom: false },
];

const Dashboard: React.FC = () => {
    const [latestItems, setLatestItems] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [weatherLoading, setWeatherLoading] = useState(true);
    const [weatherError, setWeatherError] = useState<string | null>(null);
    const [detailedWeather, setDetailedWeather] = useState<DetailedWeatherData | null>(null);
    const [showWeatherModal, setShowWeatherModal] = useState(false);
    const { user, loading: userLoading } = useUser();
    const { gradesData, loading: gradesLoading } = useGrades();
    const { scheduleData, loading: scheduleLoading } = useSchedule();
    const { calendarData, loading: calendarLoading, reminderPreferences, getEventKey, toggleReminderPreference, updateUserEvent } = useCalendar();
    const { currentUser } = useAuth();
    
    // AI Weather Recommendation State
    const [recommendation, setRecommendation] = useState<string | null>(null);
    const [recommendationLoading, setRecommendationLoading] = useState(false);
    const [recommendationError, setRecommendationError] = useState<string | null>(null);

    // Weather advice cache interface
    interface WeatherAdviceCache {
        advice: string;
        temp: number;
        weatherCode: number;
        timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
        timestamp: number;
    }


    // Quick Links state management
    const [quickLinks, setQuickLinks] = useState<QuickLink[]>([]);
    const [isManagingLinks, setIsManagingLinks] = useState(false);
    const [editingLink, setEditingLink] = useState<QuickLink | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newLink, setNewLink] = useState({ name: '', href: '', color: 'text-blue-600 dark:text-blue-400' });
    const [selectedDate, setSelectedDate] = useState(() => {
        // Try to load selected date from localStorage, fallback to today
        const savedDate = localStorage.getItem('dashboardSelectedDate');
        if (savedDate) {
            try {
                return new Date(savedDate);
            } catch (e) {
                console.warn('Invalid saved date, using today');
            }
        }
        return new Date();
    });
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Helper function to format a Date object into 'YYYY-MM-DD' string for the input
    const toInputDateString = (date: Date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    // Handler for date picker changes
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const dateString = e.target.value;
        if (dateString) {
            // Splitting the string is more robust against timezone shifts than new Date(string)
            const [year, month, day] = dateString.split('-').map(Number);
            const newDate = new Date(year, month - 1, day);
            setSelectedDate(newDate);
            
            // Save to localStorage to persist across page refreshes
            localStorage.setItem('dashboardSelectedDate', newDate.toISOString());
        }
    };

    // Reset to today's date
    const handleResetToToday = () => {
        const today = new Date();
        setSelectedDate(today);
        localStorage.setItem('dashboardSelectedDate', today.toISOString());
    };

    // Navigate to previous day
    const handlePreviousDay = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() - 1);
        setSelectedDate(newDate);
        localStorage.setItem('dashboardSelectedDate', newDate.toISOString());
    };

    // Navigate to next day
    const handleNextDay = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + 1);
        setSelectedDate(newDate);
        localStorage.setItem('dashboardSelectedDate', newDate.toISOString());
    };

    // Navigate by weeks
    const handlePreviousWeek = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() - 7);
        setSelectedDate(newDate);
        localStorage.setItem('dashboardSelectedDate', newDate.toISOString());
    };

    const handleNextWeek = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + 7);
        setSelectedDate(newDate);
        localStorage.setItem('dashboardSelectedDate', newDate.toISOString());
    };

    // Load quick links from localStorage on mount
    useEffect(() => {
        const savedLinks = localStorage.getItem('customQuickLinks');
        if (savedLinks) {
            try {
                const parsed = JSON.parse(savedLinks);
                // Reconstruct icons for saved links
                const linksWithIcons = parsed.map((link: QuickLink) => ({
                    ...link,
                    icon: link.isCustom ? <WebsiteIcon /> : getDefaultIcon(link.id)
                }));
                setQuickLinks(linksWithIcons);
            } catch (e) {
                setQuickLinks(defaultQuickLinks);
            }
        } else {
            setQuickLinks(defaultQuickLinks);
        }
    }, []);

    // Save quick links to localStorage
    const saveQuickLinks = (links: QuickLink[]) => {
        const linksToSave = links.map(link => ({
            ...link,
            icon: null // Don't save React nodes
        }));
        localStorage.setItem('customQuickLinks', JSON.stringify(linksToSave));
        setQuickLinks(links);
    };

    // Get default icon for preloaded links
    const getDefaultIcon = (id: string) => {
        const defaultLink = defaultQuickLinks.find(link => link.id === id);
        return defaultLink?.icon || <WebsiteIcon />;
    };

    // Add new quick link
    const handleAddLink = () => {
        if (newLink.name && newLink.href) {
            const link: QuickLink = {
                id: Date.now().toString(),
                name: newLink.name,
                href: newLink.href.startsWith('http') ? newLink.href : `https://${newLink.href}`,
                icon: <WebsiteIcon />,
                isExternal: true,
                color: newLink.color,
                isCustom: true
            };
            const updatedLinks = [...quickLinks, link];
            saveQuickLinks(updatedLinks);
            setNewLink({ name: '', href: '', color: 'text-blue-600 dark:text-blue-400' });
            setShowAddModal(false);
        }
    };

    // Remove quick link
    const handleRemoveLink = (id: string) => {
        const updatedLinks = quickLinks.filter(link => link.id !== id);
        saveQuickLinks(updatedLinks);
    };

    // Edit quick link
    const handleEditLink = (link: QuickLink) => {
        if (editingLink && editingLink.id === link.id) {
            const updatedLinks = quickLinks.map(l =>
                l.id === editingLink.id
                    ? { ...editingLink, href: editingLink.href.startsWith('http') ? editingLink.href : `https://${editingLink.href}` }
                    : l
            );
            saveQuickLinks(updatedLinks);
            setEditingLink(null);
        } else {
            setEditingLink({ ...link });
        }
    };

    // Reset to default links
    const handleResetToDefault = () => {
        saveQuickLinks(defaultQuickLinks);
        setIsManagingLinks(false);
    };

    const scheduleInfo = useMemo(() => {
        const defaultState = {
            title: "Today's Schedule",
            classes: [] as ClassSchedule[],
            isHoliday: false,
            isExam: false,
            holidayDescription: null as string | null,
            infoMessage: null as string | null,
        };
    
        if (!calendarData) { // scheduleData can be null if not yet uploaded
            return defaultState;
        }
    
        const dateToDisplay = selectedDate;
        const today = new Date();
        const isToday = toInputDateString(dateToDisplay) === toInputDateString(today);
    
        // Create a YYYY-MM-DD string for the selected date for reliable comparison
        const displayDateString = toInputDateString(dateToDisplay);
        const displayWeekday = dateToDisplay.toLocaleDateString('en-US', { weekday: 'long' });
    
        // Check for academic calendar events on the selected date
        const todayEvents = calendarData.events.filter(e => {
            const startDate = e.date;
            const endDate = e.endDate || e.date; // Use start date if end date is missing
            const isOnDate = displayDateString >= startDate && displayDateString <= endDate;
            
            if (!isOnDate) return false;
            
            // Filter for BTech-relevant events only
            const description = e.description.toLowerCase();
            
            // Always include holidays, exams, and timetable changes
            if (e.type === 'Holiday' || 
                e.type === 'Mid-Semester Exams' || 
                e.type === 'End-Semester Exams' ||
                description.includes('timetable') ||
                description.includes('working as per') ||
                description.includes('working as') ||
                description.includes('afternoon working') ||
                description.includes('morning working')) {
                return true;
            }
            
            // Include events that mention BTech students specifically
            if (description.includes('b. tech') || 
                description.includes('btech') ||
                description.includes('b tech') ||
                description.includes('ug students') ||
                description.includes('undergraduate') ||
                description.includes('final year ug') ||
                description.includes('1st year ug') ||
                description.includes('2nd year') ||
                description.includes('3rd year') ||
                description.includes('4th year') ||
                description.includes('int. m. tech') ||
                description.includes('dual degree') ||
                description.includes('bs-ms')) {
                return true;
            }
            
            // Include general academic events that affect all students
            if (description.includes('all students') ||
                description.includes('semester classes') ||
                description.includes('semester start') ||
                description.includes('semester end') ||
                description.includes('convocation') ||
                description.includes('foundation day') ||
                description.includes('srijan') ||
                description.includes('concetto') ||
                description.includes('parakram') ||
                description.includes('basant') ||
                description.includes('sports meet') ||
                description.includes('orientation') ||
                description.includes('registration') ||
                description.includes('fee payment') ||
                description.includes('pre-registration')) {
                return true;
            }
            
            // Exclude PG-only, PhD-only, Executive-only events
            if (description.includes('pg students') ||
                description.includes('ph. d') ||
                description.includes('phd') ||
                description.includes('m. tech') ||
                description.includes('m. sc') ||
                description.includes('mba') ||
                description.includes('executive') ||
                description.includes('part-time') ||
                description.includes('research proposal') ||
                description.includes('supervisor') ||
                description.includes('project guide') ||
                description.includes('thesis') ||
                description.includes('dissertation')) {
                return false;
            }
            
            // Include other general events by default
            return true;
        });

        let titleText = isToday ? "Today's Schedule" : `${dateToDisplay.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}'s Schedule`;
    
        // Check for exam periods FIRST (before holidays)
        const examEvent = todayEvents.find(e =>
            e.type === 'Mid-Semester Exams' ||
            e.type === 'End-Semester Exams'
        );

        if (examEvent) {
            return {
                ...defaultState,
                title: "Exam Period 📝",
                isHoliday: true,
                isExam: true,
                holidayDescription: examEvent.description,
            };
        }

        // Check for holidays and special events - suspend classes for ALL holidays, breaks, vacations
        const holidayEvent = todayEvents.find(e =>
            e.type === 'Holiday' ||
            e.description.toLowerCase().includes('semester break') ||
            e.description.toLowerCase().includes('mid semester break') ||
            e.description.toLowerCase().includes('winter break') ||
            e.description.toLowerCase().includes('summer break') ||
            e.description.toLowerCase().includes('no class')
        );

        if (holidayEvent) {
            return {
                ...defaultState,
                title: "It's a Holiday! 🎉",
                isHoliday: true,
                holidayDescription: holidayEvent.description,
            };
        }

        // Check for semester start/end
        const semesterEvent = todayEvents.find(e => 
            e.type === 'Start of Semester' || 
            e.description.toLowerCase().includes('semester start') ||
            e.description.toLowerCase().includes('semester end')
        );

        if (semesterEvent) {
            return {
                ...defaultState,
                title: "Semester Event 📚",
                isHoliday: true,
                holidayDescription: `${semesterEvent.description} - Check with your department for schedule changes.`,
            };
        }
    
        // Check for timetable changes or special scheduling
        const timetableEvent = todayEvents.find(e => 
            e.description.toLowerCase().includes('timetable') ||
            e.description.toLowerCase().includes('schedule change') ||
            e.description.toLowerCase().includes('class schedule') ||
            e.description.toLowerCase().includes('working as per') ||
            e.description.toLowerCase().includes('working as') ||
            e.description.toLowerCase().includes('afternoon working') ||
            e.description.toLowerCase().includes('morning working')
        );

        let effectiveDay = displayWeekday;
        let infoMessage: string | null = null;
        const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
        if (timetableEvent) {
            const desc = timetableEvent.description.toLowerCase();
            
            // Check for specific day timetable changes
            for (const day of weekdays) {
                if (desc.includes(`${day} timetable`) || desc.includes(`${day} schedule`)) {
                    effectiveDay = day.charAt(0).toUpperCase() + day.slice(1);
                    infoMessage = `📅 This day follows ${effectiveDay}'s schedule as per the academic calendar.`;
                    break;
                }
            }
            
            // Check for "working as per [day] timetable" patterns
            if (!infoMessage) {
                for (const day of weekdays) {
                    if (desc.includes(`working as per ${day}`) || desc.includes(`as per ${day}`)) {
                        effectiveDay = day.charAt(0).toUpperCase() + day.slice(1);
                        infoMessage = `📅 This day follows ${effectiveDay}'s schedule as per the academic calendar.`;
                        break;
                    }
                }
            }
            
            // Check for afternoon/morning working patterns
            if (!infoMessage) {
                if (desc.includes('afternoon working')) {
                    infoMessage = `📅 ${timetableEvent.description}`;
                } else if (desc.includes('morning working')) {
                    infoMessage = `📅 ${timetableEvent.description}`;
                } else if (desc.includes('working as per')) {
                    infoMessage = `📅 ${timetableEvent.description}`;
                }
            }
            
            // If no specific pattern matched, show general timetable change message
            if (!infoMessage) {
                infoMessage = `📅 ${timetableEvent.description}`;
            }
        }

        // Check for special events - BTech specific OR general college events
        const specialEvents = todayEvents.filter(e => {
            const desc = e.description.toLowerCase();

            // Must be type 'Other' and not timetable/holiday/exam
            if (e.type !== 'Other') return false;
            if (desc.includes('timetable') || desc.includes('holiday') ||
                desc.includes('exam') || desc.includes('working as')) return false;

            // Explicitly exclude PG/PhD/Executive/Part-time ONLY events
            const isPGPhDOnly = (
                (desc.includes('pg students') || desc.includes('ph. d') ||
                 desc.includes('phd') || desc.includes('m. tech') ||
                 desc.includes('m. sc') || desc.includes('mba') ||
                 desc.includes('executive') || desc.includes('part-time') ||
                 desc.includes('research') || desc.includes('supervisor') ||
                 desc.includes('thesis') || desc.includes('dissertation')) &&
                // Not if it also mentions BTech/UG
                !(desc.includes('b. tech') || desc.includes('btech') ||
                  desc.includes('b tech') || desc.includes('ug students') ||
                  desc.includes('undergraduate') || desc.includes('all students'))
            );

            if (isPGPhDOnly) return false;

            // Include if it's BTech-specific OR a general college event
            const isBTechSpecific = (
                desc.includes('b. tech') || desc.includes('btech') ||
                desc.includes('b tech') || desc.includes('ug students') ||
                desc.includes('undergraduate') || desc.includes('1st year ug') ||
                desc.includes('2nd year') || desc.includes('3rd year') ||
                desc.includes('4th year') || desc.includes('final year ug') ||
                desc.includes('int. m. tech') || desc.includes('dual degree') ||
                desc.includes('bs-ms')
            );

            const isGeneralCollegeEvent = (
                desc.includes('all students') ||
                desc.includes('convocation') || desc.includes('foundation day') ||
                desc.includes('srijan') || desc.includes('concetto') ||
                desc.includes('parakram') || desc.includes('basant') ||
                desc.includes('sports meet') || desc.includes('cultural') ||
                desc.includes('fest') || desc.includes('techno-management') ||
                desc.includes('orientation') || desc.includes('registration') ||
                desc.includes('fee payment') || desc.includes('pre-registration') ||
                desc.includes('semester classes')
            );

            return isBTechSpecific || isGeneralCollegeEvent;
        });

        if (specialEvents.length > 0 && !infoMessage) {
            const eventDescriptions = specialEvents.map(e => e.description).join(', ');
            infoMessage = `🎉 Special Event: ${eventDescriptions}`;
        }


        // Check for other academic events - BTech specific OR general college events
        const otherEvents = todayEvents.filter(e => {
            const desc = e.description.toLowerCase();

            // Must be type 'Other' and not timetable/holiday/exam and not already in specialEvents
            if (e.type !== 'Other') return false;
            if (desc.includes('timetable') || desc.includes('holiday') ||
                desc.includes('exam') || desc.includes('working as')) return false;
            if (specialEvents.includes(e)) return false;

            // Explicitly exclude PG/PhD/Executive/Part-time ONLY events
            const isPGPhDOnly = (
                (desc.includes('pg students') || desc.includes('ph. d') ||
                 desc.includes('phd') || desc.includes('m. tech') ||
                 desc.includes('m. sc') || desc.includes('mba') ||
                 desc.includes('executive') || desc.includes('part-time') ||
                 desc.includes('research') || desc.includes('supervisor') ||
                 desc.includes('thesis') || desc.includes('dissertation')) &&
                // Not if it also mentions BTech/UG
                !(desc.includes('b. tech') || desc.includes('btech') ||
                  desc.includes('b tech') || desc.includes('ug students') ||
                  desc.includes('undergraduate') || desc.includes('all students'))
            );

            if (isPGPhDOnly) return false;

            // Include if it's BTech-specific OR a general college event
            const isBTechSpecific = (
                desc.includes('b. tech') || desc.includes('btech') ||
                desc.includes('b tech') || desc.includes('ug students') ||
                desc.includes('undergraduate') || desc.includes('1st year ug') ||
                desc.includes('2nd year') || desc.includes('3rd year') ||
                desc.includes('4th year') || desc.includes('final year ug') ||
                desc.includes('int. m. tech') || desc.includes('dual degree') ||
                desc.includes('bs-ms')
            );

            const isGeneralCollegeEvent = (
                desc.includes('all students') ||
                desc.includes('semester start') || desc.includes('semester end')
            );

            return isBTechSpecific || isGeneralCollegeEvent;
        });

        if (otherEvents.length > 0 && !infoMessage) {
            const eventDescriptions = otherEvents.map(e => e.description).join(', ');
            infoMessage = `📋 Academic Event: ${eventDescriptions}`;
        }
        
        const classesForDay = (scheduleData || [])
            .filter(c => c.day.toLowerCase() === effectiveDay.toLowerCase())
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

        // Update title based on events and schedule changes
        if (infoMessage) {
            if (timetableEvent) {
                titleText = `Schedule for ${dateToDisplay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} (${effectiveDay})`;
            } else if (specialEvents.length > 0) {
                titleText = `${dateToDisplay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - Special Day`;
            } else if (otherEvents.length > 0) {
                titleText = `${dateToDisplay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - Academic Day`;
            }
        }
    
        return {
            ...defaultState,
            classes: classesForDay,
            infoMessage,
            title: titleText,
        };
    
    }, [calendarData, scheduleData, selectedDate]);

    // Helper to determine time of day
    const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' | 'night' => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 17) return 'afternoon';
        if (hour >= 17 && hour < 21) return 'evening';
        return 'night';
    };

    // Helper to check if cached advice is still valid
    const getCachedAdvice = (temp: number, weatherCode: number): string | null => {
        try {
            const cached = localStorage.getItem('weatherAdviceCache');
            if (!cached) return null;

            const cacheData: WeatherAdviceCache = JSON.parse(cached);
            const now = Date.now();
            const cacheAge = now - cacheData.timestamp;
            const threeHours = 3 * 60 * 60 * 1000; // 3 hours in milliseconds

            // Cache is invalid if older than 3 hours
            if (cacheAge > threeHours) {
                localStorage.removeItem('weatherAdviceCache');
                return null;
            }

            const currentTimeOfDay = getTimeOfDay();
            const tempDiff = Math.abs(temp - cacheData.temp);

            // Reuse cache if:
            // 1. Same time of day
            // 2. Temperature difference is less than 3°C
            // 3. Same weather condition (code)
            if (
                cacheData.timeOfDay === currentTimeOfDay &&
                tempDiff < 3 &&
                cacheData.weatherCode === weatherCode
            ) {
                console.log('Using cached weather advice (saved API call)');
                return cacheData.advice;
            }

            return null;
        } catch (err) {
            console.error('Cache read error:', err);
            return null;
        }
    };

    // Save advice to cache
    const cacheAdvice = (advice: string, temp: number, weatherCode: number) => {
        try {
            const cacheData: WeatherAdviceCache = {
                advice,
                temp,
                weatherCode,
                timeOfDay: getTimeOfDay(),
                timestamp: Date.now()
            };
            localStorage.setItem('weatherAdviceCache', JSON.stringify(cacheData));
        } catch (err) {
            console.error('Cache write error:', err);
        }
    };

    const fetchWeatherRecommendation = async (weatherData: WeatherData, weatherCode: number) => {
        setRecommendationLoading(true);
        setRecommendationError(null);
        setRecommendation(null);

        try {
            const temp = parseFloat(weatherData.temp);

            // Check cache first
            const cachedAdvice = getCachedAdvice(temp, weatherCode);
            if (cachedAdvice) {
                setRecommendation(cachedAdvice);
                setRecommendationLoading(false);
                return;
            }

            // No valid cache, fetch from API
            const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
            const prompt = `The current weather at my college campus in Dhanbad, India is ${weatherData.temp}°C and ${weatherData.desc}. Provide 1 short, actionable recommendation for a student keeping in the time of the day. For example, what to wear, what activities to do, or what to carry. Keep the tone friendly and concise, using bullet points with emojis. Do not use markdown formatting.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            const advice = response.text;
            setRecommendation(advice);

            // Cache the new advice
            cacheAdvice(advice, temp, weatherCode);
            console.log('Fetched new weather advice from API');
        } catch (err) {
            console.error("AI recommendation error:", err);
            setRecommendationError("Couldn't get weather advices right now.");
        } finally {
            setRecommendationLoading(false);
        }
    };

    const fetchWeather = async () => {
        setWeatherError(null);
        setWeatherLoading(true);
        setRecommendation(null);
        setRecommendationLoading(true);
        setRecommendationError(null);

        try {
            const lat = 23.79;
            const lon = 86.43;
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day,relative_humidity_2m,wind_speed_10m,wind_direction_10m,surface_pressure,apparent_temperature,precipitation,uv_index&timezone=Asia/Kolkata`;

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Weather API failed with status: ${response.status}`);
            }
            const data = await response.json();

            if (!data.current) {
                throw new Error('Invalid weather data received.');
            }

            const {
                temperature_2m,
                weather_code,
                is_day,
                relative_humidity_2m,
                wind_speed_10m,
                wind_direction_10m,
                surface_pressure,
                apparent_temperature,
                precipitation,
                uv_index
            } = data.current;
            const { desc, icon } = getWeatherInfoFromCode(weather_code, is_day);

            const weatherData: WeatherData = {
                temp: temperature_2m.toFixed(0),
                desc: desc,
                icon: icon
            };
            setWeather(weatherData);

            // Store detailed weather data
            const detailedData: DetailedWeatherData = {
                ...weatherData,
                humidity: relative_humidity_2m || 0,
                windSpeed: wind_speed_10m || 0,
                windDirection: wind_direction_10m || 0,
                pressure: surface_pressure || 0,
                feelsLike: apparent_temperature || parseFloat(weatherData.temp),
                uvIndex: uv_index || 0,
                visibility: 10, // Open-Meteo doesn't provide visibility in free tier
                precipitation: precipitation || 0
            };
            setDetailedWeather(detailedData);

            await fetchWeatherRecommendation(weatherData, weather_code);

        } catch (err) {
            setWeatherError('Could not load weather.');
            setRecommendationError(null);
            setRecommendationLoading(false);
            console.error("Weather fetch error:", err);
        } finally {
            setWeatherLoading(false);
        }
    };

    // FIX: Replaced fetchLatestNewsAndEvents with a subscription model.
    useEffect(() => {
        setLoading(true);
        setError(null);
        const unsubscribe = subscribeToLatestNewsAndEvents(5, (items, err) => {
            setLatestItems(items);
            setError(err || null);
            setLoading(false);
        });
        
        fetchWeather();

        return () => unsubscribe();
    }, []);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        // FIX: The latest news and events are now subscribed in real-time. 
        // The refresh button will now only refresh the weather data.
        await fetchWeather();
        setIsRefreshing(false);
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return { emoji: '🌅', text: 'Good Morning' };
        if (hour < 17) return { emoji: '☀️', text: 'Good Afternoon' };
        return { emoji: '🌆', text: 'Good Evening' };
    };

    const getMotivationalQuote = () => {
        const quotes = [
            { text: "Arise, awake and stop not until the goal is reached", author: "Swami Vivekananda" },
            { text: "The future belongs to those who believe in the beauty of their dreams", author: "Eleanor Roosevelt" },
            { text: "Excellence is not a skill, it's an attitude", author: "Ralph Marston" },
            { text: "Your only limit is your mind", author: "Anonymous" },
            { text: "Dream big, work hard, stay focused", author: "Anonymous" },
            { text: "Success is the sum of small efforts repeated day in and day out", author: "Robert Collier" },
            { text: "Don't watch the clock; do what it does. Keep going", author: "Sam Levenson" }
        ];
        return quotes[Math.floor(Math.random() * quotes.length)];
    };

    const overallLoading = userLoading || gradesLoading || scheduleLoading || calendarLoading;

    const displayCgpa = gradesData?.cgpa;
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Check if the selected date is today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateOnly = new Date(selectedDate);
    selectedDateOnly.setHours(0, 0, 0, 0);
    const isSelectedDateToday = selectedDateOnly.getTime() === today.getTime();

    // Only calculate upcoming class if viewing today's schedule
    const upcomingClassIndex = isSelectedDateToday
        ? scheduleInfo.classes.findIndex(c => c.endTime > currentTime)
        : -1;

    // Check if all classes are completed for today
    const allClassesCompleted = isSelectedDateToday &&
                                scheduleInfo.classes.length > 0 &&
                                upcomingClassIndex === -1;

    const { semesterProgress, currentWeek } = (() => {
        const defaultStartDate = new Date(now.getFullYear(), 0, 15);
        const defaultEndDate = new Date(now.getFullYear(), 4, 15);

        let semesterStartDate = defaultStartDate;
        let semesterEndDate = defaultEndDate;

        if (calendarData?.semesterStartDate && calendarData?.semesterEndDate) {
            semesterStartDate = new Date(calendarData.semesterStartDate);
            semesterEndDate = new Date(calendarData.semesterEndDate);
        }

        if (semesterStartDate > semesterEndDate) return { semesterProgress: 0, currentWeek: 1 };
        
        const totalMs = semesterEndDate.getTime() - semesterStartDate.getTime();
        const elapsedMs = now.getTime() - semesterStartDate.getTime();
        const progress = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
        const week = Math.max(1, Math.ceil(elapsedMs / (1000 * 60 * 60 * 24 * 7)));
        return { semesterProgress: progress, currentWeek: week };
    })();

    if (overallLoading || loading || !user) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-t-transparent border-primary rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-slate-500 dark:text-slate-400">Loading your dashboard...</p>
                </div>
            </div>
        );
    }
    
    const greeting = getGreeting();
    const quote = getMotivationalQuote();

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Hero Section - Greeting & Progress */}
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
                <div className="p-6 md:p-8">
                    {/* Greeting Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-30"></div>
                                <div className="relative text-5xl md:text-6xl bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-2xl shadow-lg">
                                    {greeting.emoji}
                                </div>
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-1">
                                    {greeting.text},
                                </h1>
                                <p className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white">
                                    {user.fullName?.split(' ')[0] || user.name.split(' ')[0]}
                                </p>
                            </div>
                        </div>

                        {/* Quick Stats Pills */}
                        <div className="flex flex-wrap gap-3">
                            <div className="group bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-800 dark:to-slate-700 px-5 py-3 rounded-xl border border-blue-200 dark:border-slate-600 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105">
                                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">Today</p>
                                <p className="text-sm font-bold text-slate-800 dark:text-white">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                            </div>
                            <div className="group bg-gradient-to-br from-purple-50 to-purple-100 dark:from-slate-800 dark:to-slate-700 px-5 py-3 rounded-xl border border-purple-200 dark:border-slate-600 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105">
                                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">Week</p>
                                <p className="text-sm font-bold text-slate-800 dark:text-white">#{currentWeek}</p>
                            </div>
                        </div>
                    </div>

                    {/* Motivational Quote */}
                    <div className="group bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800/50 dark:to-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl p-5 mb-6 hover:shadow-md transition-all duration-200">
                        <div className="flex items-start gap-3">
                            <div className="text-2xl bg-gradient-to-br from-amber-400 to-orange-500 p-2 rounded-lg shadow-sm">💡</div>
                            <div className="flex-1">
                                <p className="text-slate-700 dark:text-slate-200 text-base font-medium italic leading-relaxed">
                                    "{quote.text}"
                                </p>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium">
                                    — {quote.author}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Semester Progress */}
                    <div className="bg-gradient-to-br from-slate-50 to-purple-50 dark:from-slate-800/50 dark:to-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2.5 rounded-xl shadow-md">
                                    <span className="text-2xl">🎯</span>
                                </div>
                                <h3 className="text-slate-800 dark:text-white font-bold text-lg">Semester Progress</h3>
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    {Math.round(semesterProgress)}%
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Complete</p>
                            </div>
                        </div> 

                        {/* Progress Bar */}
                        <div className="relative">
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden shadow-inner">
                                <div
                                    className="bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 h-full rounded-full transition-all duration-1000 ease-out relative group"
                                    style={{ width: `${semesterProgress}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 group-hover:bg-white/30 transition-all"></div>
                                </div>
                            </div>
                            {/* Milestone markers */}
                            <div className="flex justify-between mt-3 text-xs font-semibold">
                                <span className={`${semesterProgress >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>🚀 Start</span>
                                <span className={`${semesterProgress >= 50 ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400 dark:text-slate-500'}`}>⚡ Midpoint</span>
                                <span className={`${semesterProgress >= 100 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>🎓 Finals</span>
                            </div>
                        </div>

                        {calendarData ? null : (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center">
                                Using default dates • <Link to="/academic-calendar" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">Upload your calendar</Link>
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <Link to="/schedule" className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-105 active:scale-95 cursor-pointer">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-blue-100 font-semibold mb-1">Today's Classes</p>
                            <p className="text-5xl font-black text-white mt-2 group-hover:scale-110 transition-transform origin-left">{scheduleInfo.classes.length}</p>
                        </div>
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                            <span className="text-4xl">📚</span>
                        </div>
                    </div>
                </Link>
                <Link to="/grades" className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-105 active:scale-95 cursor-pointer">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-purple-100 font-semibold mb-1">CGPA</p>
                            <p className="text-5xl font-black text-white mt-2 group-hover:scale-110 transition-transform origin-left">{displayCgpa != null ? displayCgpa.toFixed(2) : 'N/A'}</p>
                        </div>
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                            <span className="text-4xl">🎯</span>
                        </div>
                    </div>
                </Link>
                <Link to="/grades" className="group relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-105 active:scale-95 cursor-pointer">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-green-100 font-semibold mb-1">Credits Achieved</p>
                            <p className="text-5xl font-black text-white mt-2 group-hover:scale-110 transition-transform origin-left">{gradesData?.totalCredits ?? 'N/A'}</p>
                        </div>
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                            <span className="text-4xl">✨</span>
                        </div>
                    </div>
                </Link>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 md:gap-6">
                {/* Left Column - 2/3 width */}
                <div className="xl:col-span-2 space-y-5 md:space-y-6">
                    {/* Today's Classes - Enhanced */}
                    <div className="group bg-white dark:bg-dark-card p-4 sm:p-6 rounded-2xl shadow-lg hover:shadow-xl border-2 border-slate-200 dark:border-slate-700 hover:border-primary/30 transition-all duration-300">
                        <div className="flex flex-col justify-between items-start mb-6 gap-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-4">
                                <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">{scheduleInfo.title}</h2>
                                <Link to="/schedule" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-dark bg-primary/10 hover:bg-primary/20 px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap">
                                    <span>Full Schedule</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            </div>

                            {/* Enhanced Date Navigation */}
                            <div className="w-full space-y-3">
                                {/* Day of week and date - Always visible */}
                                <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                                    <div className="flex-1">
                                        <div className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
                                            {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
                                        </div>
                                        <div className="text-sm md:text-base text-slate-600 dark:text-slate-400 font-medium">
                                            {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                        </div>
                                    </div>
                                </div>

                                {/* Main date navigation and quick actions */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        onClick={handlePreviousDay}
                                        className="p-2.5 md:p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                                        title="Previous day (←)"
                                        aria-label="Previous day"
                                    >
                                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>

                                    <div className="relative">
                                        <button
                                            onClick={() => setShowDatePicker(!showDatePicker)}
                                            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-medium transition-colors flex items-center gap-2 min-w-[150px]"
                                            title="Click to pick a date"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            Jump to date
                                        </button>

                                        {showDatePicker && (
                                            <div className="absolute top-full left-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3 z-10 min-w-[250px]">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <select
                                                        value={selectedDate.getMonth()}
                                                        onChange={(e) => {
                                                            const newDate = new Date(selectedDate);
                                                            newDate.setMonth(parseInt(e.target.value));
                                                            setSelectedDate(newDate);
                                                            localStorage.setItem('dashboardSelectedDate', newDate.toISOString());
                                                        }}
                                                        className="flex-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                                    >
                                                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, idx) => (
                                                            <option key={idx} value={idx}>{month}</option>
                                                        ))}
                                                    </select>
                                                    <input
                                                        type="number"
                                                        min="2000"
                                                        max="2100"
                                                        value={selectedDate.getFullYear()}
                                                        onChange={(e) => {
                                                            const year = parseInt(e.target.value);
                                                            if (!isNaN(year) && year >= 2000 && year <= 2100) {
                                                                const newDate = new Date(selectedDate);
                                                                newDate.setFullYear(year);
                                                                setSelectedDate(newDate);
                                                                localStorage.setItem('dashboardSelectedDate', newDate.toISOString());
                                                            }
                                                        }}
                                                        placeholder="YYYY"
                                                        className="w-20 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none text-center"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-7 gap-1 mb-2">
                                                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                                        <div key={day} className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 py-1">
                                                            {day}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="grid grid-cols-7 gap-1">
                                                    {(() => {
                                                        const year = selectedDate.getFullYear();
                                                        const month = selectedDate.getMonth();
                                                        const firstDay = new Date(year, month, 1).getDay();
                                                        const daysInMonth = new Date(year, month + 1, 0).getDate();
                                                        const days = [];

                                                        // Empty cells for days before month starts
                                                        for (let i = 0; i < firstDay; i++) {
                                                            days.push(<div key={`empty-${i}`} />);
                                                        }

                                                        // Days of the month
                                                        for (let day = 1; day <= daysInMonth; day++) {
                                                            const isSelected = day === selectedDate.getDate();
                                                            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
                                                            days.push(
                                                                <button
                                                                    key={day}
                                                                    onClick={() => {
                                                                        const newDate = new Date(year, month, day);
                                                                        setSelectedDate(newDate);
                                                                        localStorage.setItem('dashboardSelectedDate', newDate.toISOString());
                                                                        setShowDatePicker(false);
                                                                    }}
                                                                    className={`
                                                                        text-sm py-1.5 rounded transition-colors
                                                                        ${isSelected ? 'bg-primary text-white font-bold' :
                                                                          isToday ? 'bg-blue-100 dark:bg-blue-900/30 text-primary font-semibold' :
                                                                          'hover:bg-slate-100 dark:hover:bg-slate-700'}
                                                                    `}
                                                                >
                                                                    {day}
                                                                </button>
                                                            );
                                                        }

                                                        return days;
                                                    })()}
                                                </div>
                                                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                                                    <button
                                                        onClick={() => setShowDatePicker(false)}
                                                        className="px-3 py-1 text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors"
                                                    >
                                                        Close
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleNextDay}
                                        className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                        title="Next day (→)"
                                        aria-label="Next day"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>

                                    <button
                                        onClick={handleResetToToday}
                                        className="px-3 py-2 text-xs bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors font-medium"
                                        title="Jump to today (T)"
                                    >
                                        Today
                                    </button>
                                </div>

                                {/* Week navigation */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Quick jump:</span>
                                    <button
                                        onClick={handlePreviousWeek}
                                        className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded transition-colors"
                                        title="Previous week"
                                    >
                                        ← Week
                                    </button>
                                    <button
                                        onClick={handleNextWeek}
                                        className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded transition-colors"
                                        title="Next week"
                                    >
                                        Week →
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        {scheduleInfo.isHoliday ? (
                             <div className="text-center py-12">
                                {scheduleInfo.isExam ? (
                                    <>
                                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 mb-4">
                                            <span className="text-4xl">📝</span>
                                        </div>
                                        <h3 className="text-lg font-medium text-slate-900 dark:text-white">{scheduleInfo.holidayDescription}</h3>
                                        <p className="mt-1 text-slate-600 dark:text-slate-400 font-medium">Classes are suspended - Focus on exam preparation! 📚</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                                            <span className="text-4xl">🎉</span>
                                        </div>
                                        <h3 className="text-lg font-medium text-slate-900 dark:text-white">{scheduleInfo.holidayDescription}</h3>
                                        <p className="mt-1 text-slate-500 dark:text-slate-400">Enjoy your day off!</p>
                                    </>
                                )}
                            </div>
                        ) : (
                            <>
                                {scheduleInfo.infoMessage && (
                                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg flex items-start gap-3">
                                        <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-sm text-blue-700 dark:text-blue-300">{scheduleInfo.infoMessage}</p>
                                    </div>
                                )}
                                {scheduleInfo.classes.length > 0 ? (
                                    <div className="relative">
                                        <ul className="space-y-3">
                                            {scheduleInfo.classes.map((c, index) => {
                                                const isPast = upcomingClassIndex !== -1 && index < upcomingClassIndex;
                                                const isCurrentOrNext = index === upcomingClassIndex;
                                                const isCurrent = isCurrentOrNext && c.startTime <= currentTime;
                                                const isNext = isCurrentOrNext && !isCurrent;
                                                const isLastClass = index === scheduleInfo.classes.length - 1;

                                                return (
                                                    <li key={c.slotId} className={`relative pl-8 transition-all duration-700 ease-out ${
                                                        allClassesCompleted ? 'opacity-50' : isPast ? 'opacity-35' : ''
                                                    }`}>
                                                        {/* Timeline segment for this class */}
                                                        {index < scheduleInfo.classes.length - 1 && (
                                                            <div
                                                                className={`absolute left-2.5 w-0.5 transition-all duration-700 ease-out ${
                                                                    allClassesCompleted || isPast
                                                                        ? 'bg-emerald-500/80 dark:bg-emerald-400/80'
                                                                        : 'bg-slate-300 dark:bg-slate-600'
                                                                }`}
                                                                style={{
                                                                    top: '20px',
                                                                    height: 'calc(100% + 12px)' // Extends to next item (space-y-3 = 12px)
                                                                }}
                                                            />
                                                        )}

                                                        <div className={`absolute left-0 top-2.5 h-5 w-5 rounded-full flex items-center justify-center transition-all duration-500 ease-out ${
                                                            isCurrent ? 'bg-primary ring-4 ring-primary/20 scale-110 shadow-md' :
                                                            isNext ? 'bg-amber-500 ring-4 ring-amber-500/20 scale-110 shadow-md' :
                                                            isPast || allClassesCompleted ? 'bg-emerald-500/90 ring-4 ring-emerald-500/15 dark:bg-emerald-400/90 dark:ring-emerald-400/15' :
                                                            'bg-slate-300 dark:bg-slate-600 ring-4 ring-slate-200 dark:ring-slate-700'
                                                        }`}>
                                                            {isPast || allClassesCompleted ? (
                                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                                                                    <path strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            ) : (
                                                                <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                                                            )}
                                                        </div>

                                                        <div className={`transition-all duration-500 ease-out ${
                                                            isCurrent ? 'bg-primary/5 border-l-2 border-primary pl-4 pr-3 py-3 rounded-r-lg' :
                                                            isNext ? 'bg-amber-50 dark:bg-amber-900/10 border-l-2 border-amber-500 pl-4 pr-3 py-3 rounded-r-lg' :
                                                            'py-2'
                                                        }`}>
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className={`text-xs font-semibold transition-colors duration-500 ${
                                                                            isCurrent ? 'text-primary' :
                                                                            isPast || allClassesCompleted ? 'text-emerald-600/80 dark:text-emerald-400/80' :
                                                                            'text-slate-500 dark:text-slate-400'
                                                                        }`}>
                                                                            {c.startTime} - {c.endTime}
                                                                        </span>
                                                                        {isCurrent && (
                                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-bold bg-primary text-white animate-pulse">
                                                                                NOW
                                                                            </span>
                                                                        )}
                                                                        {isNext && (
                                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-bold bg-amber-500 text-white">
                                                                                NEXT
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className={`font-semibold text-sm mb-2 transition-all duration-500 ${
                                                                        isPast || allClassesCompleted ? 'text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'
                                                                    }`}>{c.courseName}</p>
                                                                    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs transition-colors duration-500 ${
                                                                        isPast || allClassesCompleted ? 'text-slate-400 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400'
                                                                    }`}>
                                                                        <span className="flex items-center gap-1">
                                                                            <InstructorIcon className="w-3.5 h-3.5" />
                                                                            {c.instructor}
                                                                        </span>
                                                                        <span className="flex items-center gap-1">
                                                                            <LocationIcon className="w-3.5 h-3.5" />
                                                                            {c.location}
                                                                        </span>
                                                                        <span className={`px-1.5 py-0.5 rounded text-xs transition-colors duration-500 ${
                                                                            isPast || allClassesCompleted ? 'bg-slate-100/50 dark:bg-slate-700/50' : 'bg-slate-100 dark:bg-slate-700'
                                                                        }`}>
                                                                            {c.courseCode}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                                            <CalendarCheckIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                                        </div>
                                        <h3 className="text-lg font-medium text-slate-900 dark:text-white">No Classes Scheduled!</h3>
                                        <p className="mt-1 text-slate-500 dark:text-slate-400">Enjoy your free day or catch up on assignments.</p>
                                    </div>
                                )}
                             </>
                        )}
                    </div>

                    {/* Upcoming Deadlines Widget - From Calendar Reminders */}
                    <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-xl font-semibold">Upcoming Reminders</h2>
                                {calendarData && calendarData.events && (() => {
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    const count = calendarData.events.filter(event => {
                                        const eventKey = getEventKey(event);
                                        const isUserCreatedWithReminder = event.remindMe === true && !!event.userId;
                                        const isPreloadedWithReminder = !event.userId && reminderPreferences.includes(eventKey);
                                        if (!isUserCreatedWithReminder && !isPreloadedWithReminder) return false;
                                        const eventDate = new Date(event.date);
                                        eventDate.setHours(0, 0, 0, 0);
                                        return eventDate >= today;
                                    }).length;
                                    return count > 0 ? (
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                            {count} {count === 1 ? 'reminder' : 'reminders'} active
                                        </p>
                                    ) : null;
                                })()}
                            </div>
                            <Link to="/academic-calendar" className="text-sm text-primary hover:text-primary-dark">View Calendar →</Link>
                        </div>
                        <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
                            {(() => {
                                if (!calendarData || !calendarData.events) {
                                    return (
                                        <div className="text-center py-8">
                                            <p className="text-slate-500 dark:text-slate-400 text-sm">Loading reminders...</p>
                                        </div>
                                    );
                                }

                                const today = new Date();
                                today.setHours(0, 0, 0, 0);


                                const reminderEvents = calendarData.events
                                    .filter((event: CalendarEvent) => {
                                        const eventKey = getEventKey(event);

                                        // Show if: user-created event with remindMe OR preloaded event in user's preferences
                                        const isUserCreatedWithReminder = event.remindMe === true && !!event.userId;
                                        const isPreloadedWithReminder = !event.userId && reminderPreferences.includes(eventKey);

                                        if (!isUserCreatedWithReminder && !isPreloadedWithReminder) return false;

                                        // Check if event is upcoming
                                        const eventDate = new Date(event.date);
                                        eventDate.setHours(0, 0, 0, 0);
                                        const isUpcoming = eventDate >= today;

                                        return isUpcoming;
                                    })
                                    .sort((a: CalendarEvent, b: CalendarEvent) => new Date(a.date).getTime() - new Date(b.date).getTime());

                                if (reminderEvents.length === 0) {
                                    return (
                                        <div className="text-center py-8">
                                            <p className="text-slate-500 dark:text-slate-400 text-sm">No upcoming reminders</p>
                                            <p className="text-xs text-slate-400 mt-2">Total events: {calendarData.events.length}</p>
                                            <Link to="/academic-calendar" className="text-sm text-primary hover:text-primary-dark mt-2 inline-block">
                                                Add events with "Remind Me" →
                                            </Link>
                                        </div>
                                    );
                                }

                                return reminderEvents.map((event, index) => {
                                    const eventDate = new Date(event.date);
                                    eventDate.setHours(0, 0, 0, 0);
                                    const todayDate = new Date();
                                    todayDate.setHours(0, 0, 0, 0);
                                    const daysUntil = Math.ceil((eventDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
                                    const isUrgent = daysUntil <= 2;
                                    const isWarning = daysUntil > 2 && daysUntil <= 7;
                                    const isUserEvent = !!event.userId;

                                    return (
                                        <div
                                            key={event.id || index}
                                            className={`group flex items-center justify-between p-3 rounded-lg border-l-4 ${
                                                isUrgent ? 'bg-red-50 dark:bg-red-900/20 border-red-500' :
                                                isWarning ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500' :
                                                'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                                            }`}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium truncate">{event.description}</p>
                                                    {isUserEvent && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" title="User-created event">
                                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                            </svg>
                                                            Personal
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-600 dark:text-slate-400">{event.type}</p>
                                            </div>
                                            <div className="flex items-center flex-shrink-0 ml-4">
                                                <div className="text-right">
                                                    <p className={`text-sm font-semibold ${
                                                        isUrgent ? 'text-red-600' :
                                                        isWarning ? 'text-amber-600' :
                                                        'text-blue-600'
                                                    }`}>
                                                        {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            // For user-defined events, turn off remindMe flag and toggle preference
                                                            if (event.userId && event.id) {
                                                                await updateUserEvent(event.id, {
                                                                    ...event,
                                                                    remindMe: false
                                                                });
                                                                // Also toggle the reminder preference for consistency
                                                                const eventKey = getEventKey(event);
                                                                if (reminderPreferences.includes(eventKey)) {
                                                                    await toggleReminderPreference(eventKey);
                                                                }
                                                            } else {
                                                                // For preloaded events, just toggle the reminder preference
                                                                await toggleReminderPreference(getEventKey(event));
                                                            }
                                                        } catch (error) {
                                                            console.error('Error removing reminder:', error);
                                                            alert('Failed to remove reminder');
                                                        }
                                                    }}
                                                    className="ml-2 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Remove reminder"
                                                    aria-label="Remove reminder"
                                                >
                                                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>
                </div>

                {/* Right Column - 1/3 width */}
                <div className="space-y-6">
                    {/* Quick Links - Enhanced Grid */}
                    <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Quick Access</h3>
                            <button
                                onClick={() => setIsManagingLinks(!isManagingLinks)}
                                className="text-sm text-primary hover:text-primary-dark font-medium transition-colors"
                            >
                                {isManagingLinks ? 'Done' : 'Manage'}
                            </button>
                        </div>

                        {isManagingLinks && (
                            <div className="mb-4 space-y-2">
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="w-full py-2 px-4 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors text-sm font-medium"
                                >
                                    + Add New Link
                                </button>
                                <button
                                    onClick={handleResetToDefault}
                                    className="w-full py-2 px-4 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors text-sm font-medium"
                                >
                                    Reset to Default
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            {quickLinks.map(link => (
                                <div key={link.id} className="relative group">
                                    {editingLink?.id === link.id ? (
                                        <div className="p-3 rounded-lg border-2 border-primary bg-slate-50 dark:bg-slate-800 space-y-2">
                                            <input
                                                type="text"
                                                value={editingLink.name}
                                                onChange={(e) => setEditingLink({ ...editingLink, name: e.target.value })}
                                                className="w-full px-2 py-1 text-xs border rounded dark:bg-slate-700 dark:border-slate-600"
                                                placeholder="Name"
                                            />
                                            <input
                                                type="text"
                                                value={editingLink.href}
                                                onChange={(e) => setEditingLink({ ...editingLink, href: e.target.value })}
                                                className="w-full px-2 py-1 text-xs border rounded dark:bg-slate-700 dark:border-slate-600"
                                                placeholder="URL"
                                            />
                                            <button
                                                onClick={() => handleEditLink(link)}
                                                className="w-full py-1 bg-primary text-white rounded text-xs font-medium"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    ) : (
                                        <a
                                            href={link.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex flex-col items-center p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:shadow-md"
                                        >
                                            <div className={`text-2xl mb-2 ${link.color} group-hover:scale-110 transition-transform`}>
                                                {link.icon}
                                            </div>
                                            <span className="text-xs text-center text-slate-600 dark:text-slate-300 group-hover:text-primary dark:group-hover:text-secondary">
                                                {link.name}
                                            </span>
                                        </a>
                                    )}

                                    {isManagingLinks && editingLink?.id !== link.id && (
                                        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEditLink(link)}
                                                className="p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 shadow-md"
                                                title="Edit"
                                            >
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleRemoveLink(link.id)}
                                                className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md"
                                                title="Remove"
                                            >
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Weather Widget - Enhanced & Interactive */}
                    <div
                        onClick={() => weather && setShowWeatherModal(true)}
                        className="group bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 p-4 sm:p-6 rounded-2xl shadow-md border border-sky-200 dark:border-sky-700/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex-1">
                                <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                                    <span className="text-sky-500 text-xl sm:text-2xl animate-pulse">🌤️</span>
                                    <span className="bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">Campus Weather</span>
                                </h3>
                                <p className="text-xs text-sky-600/60 dark:text-sky-400/60 mt-1 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                                    Click for detailed weather info
                                </p>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    fetchWeather();
                                }}
                                disabled={weatherLoading}
                                className="p-2 rounded-lg hover:bg-sky-100 dark:hover:bg-sky-800/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group-hover:rotate-180"
                                title="Refresh weather"
                            >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600 dark:text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>
                        </div>
                        {weatherLoading ? (
                            <div className="flex flex-col items-center justify-center h-32 space-y-3">
                                <div className="w-12 h-12 border-4 border-t-transparent border-sky-500 rounded-full animate-spin"></div>
                                <p className="text-xs text-sky-600 dark:text-sky-400 animate-pulse">Fetching weather...</p>
                            </div>
                        ) : weatherError ? (
                            <div className="text-center py-6">
                                <p className="text-red-500 text-sm mb-3">⚠️ {weatherError}</p>
                                <button
                                    onClick={fetchWeather}
                                    className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm transition-colors"
                                >
                                    Retry
                                </button>
                            </div>
                        ) : weather ? (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-baseline gap-2">
                                            <p className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-br from-sky-600 to-blue-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">
                                                {weather.temp}°
                                            </p>
                                            <span className="text-2xl sm:text-3xl font-semibold text-sky-500/60">C</span>
                                        </div>
                                        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2 font-medium">{weather.desc}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                            </svg>
                                            Dhanbad, Jharkhand
                                        </p>
                                    </div>
                                    <div className="text-6xl sm:text-7xl md:text-8xl drop-shadow-2xl group-hover:scale-110 transition-transform duration-300">
                                        {weather.icon}
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-sky-300/50 dark:border-sky-700/50">
                                    {recommendationLoading ? (
                                        <div className="animate-pulse flex space-x-3">
                                            <div className="text-base font-medium text-sky-700 dark:text-sky-300">✨</div>
                                            <div className="flex-1 space-y-3 py-1">
                                                <div className="h-3 bg-sky-200/50 dark:bg-sky-700/50 rounded"></div>
                                                <div className="h-3 bg-sky-200/50 dark:bg-sky-700/50 rounded w-5/6"></div>
                                                <div className="h-3 bg-sky-200/50 dark:bg-sky-700/50 rounded w-4/6"></div>
                                            </div>
                                        </div>
                                    ) : recommendationError ? (
                                        <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                                            <span>⚠️</span> {recommendationError}
                                        </p>
                                    ) : recommendation && (
                                        <div className="bg-sky-100/50 dark:bg-sky-900/30 rounded-xl p-3 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors">
                                            <h4 className="text-xs sm:text-sm font-semibold text-sky-800 dark:text-sky-200 mb-2 flex items-center gap-2">
                                                <span className="text-base">✨</span>
                                                <span>AI Weather Advice</span>
                                            </h4>
                                            <p className="text-xs sm:text-sm text-sky-700 dark:text-sky-300 whitespace-pre-line leading-relaxed">
                                                {recommendation}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Weather Details Modal */}
            {showWeatherModal && detailedWeather && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowWeatherModal(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/40 dark:to-blue-900/40 backdrop-blur-sm border-b border-sky-200 dark:border-sky-700 p-6 rounded-t-2xl">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="text-6xl drop-shadow-lg">{detailedWeather.icon}</div>
                                    <div>
                                        <h2 className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
                                            {detailedWeather.temp}°C
                                        </h2>
                                        <p className="text-slate-600 dark:text-slate-400 font-medium">{detailedWeather.desc}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-500 flex items-center gap-1 mt-1">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                            </svg>
                                            Dhanbad, Jharkhand
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowWeatherModal(false)}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
                            {/* Feels Like Temperature */}
                            <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-4 rounded-xl border border-orange-200 dark:border-orange-700/50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="text-3xl">🌡️</div>
                                        <div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Feels Like</p>
                                            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{detailedWeather.feelsLike.toFixed(1)}°C</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Weather Details Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Humidity */}
                                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-700/50">
                                    <div className="flex items-center gap-3">
                                        <div className="text-3xl">💧</div>
                                        <div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Humidity</p>
                                            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{detailedWeather.humidity}%</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Wind Speed */}
                                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-700/50">
                                    <div className="flex items-center gap-3">
                                        <div className="text-3xl">💨</div>
                                        <div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Wind Speed</p>
                                            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{detailedWeather.windSpeed.toFixed(1)} km/h</p>
                                            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">{getWindDirection(detailedWeather.windDirection)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Pressure */}
                                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-700/50">
                                    <div className="flex items-center gap-3">
                                        <div className="text-3xl">🎚️</div>
                                        <div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Pressure</p>
                                            <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{detailedWeather.pressure.toFixed(0)} hPa</p>
                                        </div>
                                    </div>
                                </div>

                                {/* UV Index */}
                                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-700/50">
                                    <div className="flex items-center gap-3">
                                        <div className="text-3xl">☀️</div>
                                        <div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">UV Index</p>
                                            <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{detailedWeather.uvIndex.toFixed(1)}</p>
                                            <p className="text-xs text-yellow-600/70 dark:text-yellow-400/70">
                                                {detailedWeather.uvIndex < 3 ? 'Low' : detailedWeather.uvIndex < 6 ? 'Moderate' : detailedWeather.uvIndex < 8 ? 'High' : 'Very High'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Precipitation */}
                                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-4 rounded-xl border border-indigo-200 dark:border-indigo-700/50">
                                    <div className="flex items-center gap-3">
                                        <div className="text-3xl">🌧️</div>
                                        <div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Precipitation</p>
                                            <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{detailedWeather.precipitation.toFixed(1)} mm</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Visibility */}
                                <div className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                                    <div className="flex items-center gap-3">
                                        <div className="text-3xl">👁️</div>
                                        <div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Visibility</p>
                                            <p className="text-xl font-bold text-slate-600 dark:text-slate-400">{detailedWeather.visibility} km</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* AI Recommendation in Modal */}
                            {recommendation && (
                                <div className="bg-sky-100/50 dark:bg-sky-900/30 rounded-xl p-4 border border-sky-200 dark:border-sky-700/50">
                                    <h4 className="text-sm font-semibold text-sky-800 dark:text-sky-200 mb-3 flex items-center gap-2">
                                        <span className="text-xl">✨</span>
                                        <span>Weather Advice</span>
                                    </h4>
                                    <p className="text-sm text-sky-700 dark:text-sky-300 whitespace-pre-line leading-relaxed">
                                        {recommendation}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="sticky bottom-0 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-4 rounded-b-2xl flex justify-end gap-3">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    fetchWeather();
                                }}
                                disabled={weatherLoading}
                                className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <svg className={`w-4 h-4 ${weatherLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Refresh
                            </button>
                            <button
                                onClick={() => setShowWeatherModal(false)}
                                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Link Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">Add Quick Link</h3>
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setNewLink({ name: '', href: '', color: 'text-blue-600 dark:text-blue-400' });
                                }}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Link Name</label>
                                <input
                                    type="text"
                                    value={newLink.name}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewLink({ ...newLink, name: e.target.value })}
                                    placeholder="e.g., Google Drive"
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">URL</label>
                                <input
                                    type="text"
                                    value={newLink.href}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewLink({ ...newLink, href: e.target.value })}
                                    placeholder="e.g., drive.google.com"
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-primary"
                                />
                                <p className="text-xs text-slate-500 mt-1">https:// will be added automatically if not provided</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Color</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[
                                        { name: 'Blue', value: 'text-blue-600 dark:text-blue-400' },
                                        { name: 'Red', value: 'text-red-600 dark:text-red-400' },
                                        { name: 'Green', value: 'text-green-600 dark:text-green-400' },
                                        { name: 'Purple', value: 'text-purple-600 dark:text-purple-400' },
                                        { name: 'Orange', value: 'text-orange-600 dark:text-orange-400' },
                                        { name: 'Teal', value: 'text-teal-600 dark:text-teal-400' },
                                        { name: 'Pink', value: 'text-pink-600 dark:text-pink-400' },
                                        { name: 'Indigo', value: 'text-indigo-600 dark:text-indigo-400' },
                                    ].map(color => (
                                        <button
                                            key={color.value}
                                            onClick={() => setNewLink({ ...newLink, color: color.value })}
                                            className={`p-2 rounded-lg border-2 transition-all ${
                                                newLink.color === color.value
                                                    ? 'border-primary bg-primary/10'
                                                    : 'border-slate-200 dark:border-slate-600 hover:border-primary/50'
                                            }`}
                                        >
                                            <div className={`${color.value} text-2xl`}>
                                                <WebsiteIcon />
                                            </div>
                                        </button>
                                    ))}
                                </div> 
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setNewLink({ name: '', href: '', color: 'text-blue-600 dark:text-blue-400' });
                                    }}
                                    className="flex-1 py-2 px-4 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddLink}
                                    disabled={!newLink.name || !newLink.href}
                                    className="flex-1 py-2 px-4 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Add Link
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;