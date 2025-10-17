import React, { useState, useEffect } from 'react';
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
    WebsiteIcon, EmailIcon, LmsIcon, CdcIcon, MapIcon, RefreshIcon, ScholarshipIcon
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

// Default quick links
const defaultQuickLinks: QuickLink[] = [
    { id: '1', name: 'MIS Portal', href: 'https://mis.iitism.ac.in/', icon: <PortalIcon />, isExternal: true, color: 'text-blue-600 dark:text-blue-400', isCustom: false },
    { id: '2', name: 'Student Email', href: 'https://outlook.office.com/mail/', icon: <EmailIcon />, isExternal: true, color: 'text-red-600 dark:text-red-400', isCustom: false },
    { id: '3', name: 'CDC Portal', href: 'https://www.iitism.ac.in/career-development-centre', icon: <CdcIcon />, isExternal: true, color: 'text-green-600 dark:text-green-400', isCustom: false },
    { id: '4', name: 'Central Library', href: 'https://library.iitism.ac.in/', icon: <LibraryIcon />, isExternal: true, color: 'text-purple-600 dark:text-purple-400', isCustom: false },
    { id: '5', name: 'Fee Payment/Pre-Registration', href: 'https://pre-registration.iitism.ac.in/login/', icon: <FeeIcon />, isExternal: true, color: 'text-orange-600 dark:text-orange-400', isCustom: false },
    { id: '6', name: 'Scholarships', href: 'https://www.iitism.ac.in/name-of-scholarships', icon: <ScholarshipIcon />, isExternal: true, color: 'text-teal-600 dark:text-teal-400', isCustom: false },
    { id: '7', name: 'Student Gymkhana', href: 'https://sgiitism.in/', icon: <GymkhanaIcon />, isExternal: true, color: 'text-indigo-600 dark:text-indigo-400', isCustom: false },
    { id: '8', name: 'Health Centre', href: 'https://people.iitism.ac.in/~healthcenter/index.php', icon: <HealthIcon />, isExternal: true, color: 'text-pink-600 dark:text-pink-400', isCustom: false },
    { id: '9', name: 'IIT(ISM) Website', href: 'https://www.iitism.ac.in/', icon: <WebsiteIcon />, isExternal: true, color: 'text-cyan-600 dark:text-cyan-400', isCustom: false },
];

const Dashboard: React.FC = () => {
    const [todaysClasses, setTodaysClasses] = useState<ClassSchedule[]>([]);
    const [latestItems, setLatestItems] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [weatherLoading, setWeatherLoading] = useState(true);
    const [weatherError, setWeatherError] = useState<string | null>(null);
    const { user, loading: userLoading } = useUser();
    const { gradesData, loading: gradesLoading } = useGrades();
    const { scheduleData, loading: scheduleLoading } = useSchedule();
    const { calendarData, loading: calendarLoading, reminderPreferences, getEventKey, toggleReminderPreference, updateUserEvent } = useCalendar();
    const { currentUser } = useAuth();
    
    // AI Weather Recommendation State
    const [recommendation, setRecommendation] = useState<string | null>(null);
    const [recommendationLoading, setRecommendationLoading] = useState(false);
    const [recommendationError, setRecommendationError] = useState<string | null>(null);


    // Quick Links state management
    const [quickLinks, setQuickLinks] = useState<QuickLink[]>([]);
    const [isManagingLinks, setIsManagingLinks] = useState(false);
    const [editingLink, setEditingLink] = useState<QuickLink | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newLink, setNewLink] = useState({ name: '', href: '', color: 'text-blue-600 dark:text-blue-400' });

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

    useEffect(() => {
        if (scheduleData) {
            const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
            const classes = scheduleData
                .filter(c => c.day === today)
                .sort((a, b) => a.startTime.localeCompare(b.startTime));
            setTodaysClasses(classes);
        } else {
            setTodaysClasses([]);
        }
    }, [scheduleData]);

    const fetchWeatherRecommendation = async (weatherData: WeatherData) => {
        setRecommendationLoading(true);
        setRecommendationError(null);
        setRecommendation(null);

        try {
            const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
            const prompt = `The current weather at my college campus in Dhanbad, India is ${weatherData.temp}°C and ${weatherData.desc}. Provide 1 short, actionable recommendation for a student. For example, what to wear, what activities to do, or what to carry. Keep the tone friendly and concise, using bullet points with emojis. Do not use markdown formatting.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            setRecommendation(response.text);
        } catch (err) {
            console.error("AI recommendation error:", err);
            setRecommendationError("Couldn't get AI tips right now.");
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
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&timezone=Asia/Kolkata`;
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Weather API failed with status: ${response.status}`);
            }
            const data = await response.json();
            
            if (!data.current) {
                throw new Error('Invalid weather data received.');
            }

            const { temperature_2m, weather_code, is_day } = data.current;
            const { desc, icon } = getWeatherInfoFromCode(weather_code, is_day);

            const weatherData: WeatherData = {
                temp: temperature_2m.toFixed(0),
                desc: desc,
                icon: icon
            };
            setWeather(weatherData);
            await fetchWeatherRecommendation(weatherData);

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
    const upcomingClassIndex = todaysClasses.findIndex(c => c.endTime > currentTime);

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
                                    {user.fullName?.split(' ')[0] || user.name.split(' ')[0]}!
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="group bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-blue-100 font-medium">Today's Classes</p>
                            <p className="text-4xl font-bold text-white mt-2">{todaysClasses.length}</p>
                        </div>
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                            <span className="text-3xl">📚</span>
                        </div>
                    </div>
                </div>
                <div className="group bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-purple-100 font-medium">CGPA</p>
                            <p className="text-4xl font-bold text-white mt-2">{displayCgpa != null ? displayCgpa.toFixed(2) : 'N/A'}</p>
                        </div>
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                            <span className="text-3xl">🎯</span>
                        </div>
                    </div>
                </div>
                <div className="group bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-green-100 font-medium">Credits Achieved</p>
                            <p className="text-4xl font-bold text-white mt-2">{gradesData?.totalCredits ?? 'N/A'}</p>
                        </div>
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                            <span className="text-3xl">✨</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - 2/3 width */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Today's Classes - Enhanced */}
                    <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold">Today's Schedule</h2>
                            <Link to="/schedule" className="text-sm text-primary hover:text-primary-dark transition-colors">
                                View Full Schedule →
                            </Link>
                        </div>
                        
                        {scheduleData ? (
                            todaysClasses.length > 0 ? (
                                <div className="relative">
                                    <div className="absolute left-3 top-2 h-[calc(100%-8px)] w-0.5 bg-gradient-to-b from-primary/20 to-transparent" aria-hidden="true"></div>
                                    <ul className="space-y-4">
                                        {todaysClasses.map((c, index) => {
                                            const isPast = upcomingClassIndex !== -1 && index < upcomingClassIndex;
                                            const isCurrentOrNext = index === upcomingClassIndex;
                                            const isCurrent = isCurrentOrNext && c.startTime <= currentTime;
                                            const isNext = isCurrentOrNext && !isCurrent;
                                            
                                            return (
                                                <li key={c.slotId} className={`relative pl-10 transition-all duration-300 ${isPast ? 'opacity-50' : ''}`}>
                                                    <div className={`absolute left-0 top-2 h-6 w-6 rounded-full flex items-center justify-center ring-4 ${
                                                        isCurrent ? 'bg-primary ring-primary/20' : 
                                                        isNext ? 'bg-amber-500 ring-amber-500/20' : 
                                                        isPast ? 'bg-slate-300 ring-slate-200' : 
                                                        'bg-primary/60 ring-primary/10'
                                                    }`}>
                                                        <div className="h-2 w-2 rounded-full bg-white"></div>
                                                    </div>
                                                    
                                                    <div className={`rounded-lg transition-all ${
                                                        isCurrent ? 'bg-primary/5 border-l-4 border-primary p-4 -ml-1 shadow-sm' : 
                                                        isNext ? 'bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-500 p-4 -ml-1' :
                                                        'p-3 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                    }`}>
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-3 mb-1">
                                                                    <p className={`font-semibold ${isCurrent ? 'text-primary' : 'text-slate-600 dark:text-slate-400'}`}>
                                                                        {c.startTime} - {c.endTime}
                                                                    </p>
                                                                    {isCurrent && (
                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-primary text-white animate-pulse">
                                                                            ONGOING
                                                                        </span>
                                                                    )}
                                                                    {isNext && (
                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white">
                                                                            UP NEXT
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="font-bold text-slate-800 dark:text-white">{c.courseName}</p>
                                                                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mt-2">
                                                                    <span className="flex items-center gap-1.5">
                                                                        <InstructorIcon className="w-4 h-4" />
                                                                        {c.instructor}
                                                                    </span>
                                                                    <span className="flex items-center gap-1.5">
                                                                        <LocationIcon className="w-4 h-4" />
                                                                        {c.location}
                                                                    </span>
                                                                    <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
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
                                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">No Classes Today!</h3>
                                    <p className="mt-1 text-slate-500 dark:text-slate-400">Enjoy your free day or catch up on assignments.</p>
                                </div>
                            )
                        ) : (
                            <div className="text-center py-8 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                <CalendarCheckIcon className="mx-auto h-12 w-12 text-slate-400 mb-3" />
                                <p className="text-slate-600 dark:text-slate-400 mb-4">Upload your schedule to see today's classes</p>
                                <Link to="/schedule" className="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors">
                                    Setup Schedule →
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* What's New - Merged */}
                    <div className="bg-white dark:bg-dark-card rounded-xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
                         <div className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                            <h2 className="text-xl font-semibold">What's New</h2>
                            <button 
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Refresh updates"
                            >
                                <RefreshIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                        
                        <div className="p-4">
                            {error ? (
                                <div className="text-center py-6">
                                    <p className="text-red-500">{error}</p>
                                    <button onClick={handleRefresh} className="mt-2 text-sm text-primary hover:underline">Retry</button>
                                </div>
                            ) : (
                                <ul className="space-y-2">
                                    {latestItems.map((item, idx) => {
                                        const isEvent = item.type === 'event';
                                        const content = (
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-slate-800 dark:text-white truncate group-hover:text-primary transition-colors">
                                                        <span className="mr-2">{isEvent ? '📅' : '📢'}</span>
                                                        {item.title}
                                                    </p>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                        {item.date} • {isEvent ? (item as CampusEvent).location : (item as Announcement).author}
                                                    </p>
                                                </div>
                                                {idx === 0 && (
                                                    <span className="ml-2 px-2 py-1 text-xs font-semibold bg-red-100 text-red-600 rounded-full">
                                                        NEW
                                                    </span>
                                                )}
                                            </div>
                                        );

                                        return (
                                            <li key={`${item.type}-${item.id}`} className="group">
                                                {item.sourceUrl ? (
                                                    <a 
                                                        href={item.sourceUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group-hover:shadow-sm"
                                                    >
                                                        {content}
                                                    </a>
                                                ) : (
                                                    <Link 
                                                        to={'/news-and-events'} 
                                                        className="block p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group-hover:shadow-sm"
                                                    >
                                                        {content}
                                                    </Link>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                            
                            <div className="mt-4 text-center">
                                <Link 
                                    to={'/news-and-events'} 
                                    className="text-sm text-primary hover:text-primary-dark font-medium transition-colors"
                                >
                                    View All Updates →
                                </Link>
                            </div>
                        </div>
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

                    {/* Weather Widget - Enhanced */}
                    <div className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 p-6 rounded-2xl shadow-md border border-sky-200 dark:border-sky-700/50 hover:shadow-lg transition-all">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <span className="text-sky-500">🌤️</span>
                            Campus Weather
                        </h3>
                        {weatherLoading ? (
                            <div className="flex items-center justify-center h-24">
                                <div className="w-10 h-10 border-3 border-t-transparent border-sky-500 rounded-full animate-spin"></div>
                            </div>
                        ) : weatherError ? (
                            <div className="text-center py-6">
                                <p className="text-red-500 text-sm">{weatherError}</p>
                            </div>
                        ) : weather ? (
                            <>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-5xl font-bold bg-gradient-to-br from-sky-600 to-blue-600 bg-clip-text text-transparent">
                                            {weather.temp}°C
                                        </p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 font-medium">{weather.desc}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Dhanbad, Jharkhand</p>
                                    </div>
                                    <div className="text-7xl drop-shadow-lg">{weather.icon}</div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-sky-300/50 dark:border-sky-700/50">
                                    {recommendationLoading ? (
                                        <div className="animate-pulse flex space-x-2">
                                            <div className="text-sm font-medium text-sky-700 dark:text-sky-300">✨</div>
                                            <div className="flex-1 space-y-2 py-1">
                                                <div className="h-2 bg-sky-200/50 dark:bg-sky-700/50 rounded"></div>
                                                <div className="h-2 bg-sky-200/50 dark:bg-sky-700/50 rounded w-5/6"></div>
                                            </div>
                                        </div>
                                    ) : recommendationError ? (
                                        <p className="text-xs text-red-600 dark:text-red-400">{recommendationError}</p>
                                    ) : recommendation && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-sky-800 dark:text-sky-200 mb-2 flex items-center gap-2">
                                                ✨ Weather Advice 
                                            </h4>
                                            <p className="text-sm text-sky-700 dark:text-sky-300 whitespace-pre-line leading-relaxed">
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