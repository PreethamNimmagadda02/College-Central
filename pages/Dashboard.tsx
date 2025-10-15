import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClassSchedule, CampusEvent, Announcement, NewsItem, CalendarEvent } from '../types';
// FIX: Changed import from fetchLatestNewsAndEvents to subscribeToLatestNewsAndEvents.
import { subscribeToLatestNewsAndEvents } from '../services/api';
import { useUser } from '../contexts/UserContext';
import { useGrades } from '../contexts/GradesContext';
import { useSchedule } from '../contexts/ScheduleContext';
import { useCalendar } from '../contexts/CalendarContext';
import { 
    InstructorIcon, LocationIcon, LibraryIcon, GymkhanaIcon, 
    PortalIcon, CalendarCheckIcon, HealthIcon, FeeIcon, 
    WebsiteIcon, EmailIcon, LmsIcon, CdcIcon, MapIcon, RefreshIcon, ScholarshipIcon
} from '../components/icons/SidebarIcons';

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
    const { calendarData, loading: calendarLoading, reminderPreferences, getEventKey, toggleReminderPreference } = useCalendar();

    // Quick Links with better organization
    const quickLinks = [
        { name: 'MIS Portal', href: 'https://mis.iitism.ac.in/', icon: <PortalIcon />, isExternal: true, color: 'text-blue-600 dark:text-blue-400' },
        { name: 'Student Email', href: 'https://outlook.office.com/mail/', icon: <EmailIcon />, isExternal: true, color: 'text-red-600 dark:text-red-400' },
        { name: 'CDC Portal', href: 'https://www.iitism.ac.in/career-development-centre', icon: <CdcIcon />, isExternal: true, color: 'text-green-600 dark:text-green-400' },
        { name: 'Central Library', href: 'https://library.iitism.ac.in/', icon: <LibraryIcon />, isExternal: true, color: 'text-purple-600 dark:text-purple-400' },
        { name: 'Fee Payment/Pre-Registration', href: 'https://pre-registration.iitism.ac.in/login/', icon: <FeeIcon />, isExternal: true, color: 'text-orange-600 dark:text-orange-400' },
        { name: 'Scholarships', href: 'https://www.iitism.ac.in/name-of-scholarships', icon: <ScholarshipIcon />, isExternal: true, color: 'text-teal-600 dark:text-teal-400' },
        { name: 'Student Gymkhana', href: 'https://sgiitism.in/', icon: <GymkhanaIcon />, isExternal: true, color: 'text-indigo-600 dark:text-indigo-400' },
        { name: 'Health Centre', href: 'https://people.iitism.ac.in/~healthcenter/index.php', icon: <HealthIcon />, isExternal: true, color: 'text-pink-600 dark:text-pink-400' },
        { name: 'IIT(ISM) Website', href: 'https://www.iitism.ac.in/', icon: <WebsiteIcon />, isExternal: true, color: 'text-cyan-600 dark:text-cyan-400' },
    ];

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

    const fetchWeather = async () => {
        setWeatherError(null);
        setWeatherLoading(true);

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

        } catch (err) {
            setWeatherError('Could not load weather.');
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
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const getMotivationalQuote = () => {
        const quotes = [
            "Keep pushing forward, success is near!",
            "Every class is a step toward your dreams.",
            "Your dedication today shapes your tomorrow.",
            "Knowledge is the passport to the future.",
            "Excellence is not a skill, it's an attitude."
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
    
    // The rest of the component remains largely the same, as it consumes data from contexts.
    // ... (rest of JSX is identical to the original)
    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Enhanced Header with Stats Bar */}
            <div className="bg-gradient-to-r from-primary to-primary-dark dark:from-dark-card dark:to-dark-background rounded-2xl p-6 text-white shadow-xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">{getGreeting()}, {user.name.split(' ')[0]}! 👋</h1>
                        <p className="text-white/80 mt-1">{getMotivationalQuote()}</p>
                    </div>
                    <div className="flex gap-6 text-sm">
                        <div className="text-center">
                            <p className="text-white/70">Today</p>
                            <p className="font-semibold">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-white/70">Week</p>
                            <p className="font-semibold">Week {currentWeek}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-white/70">Semester</p>
                            <p className="font-semibold">{Math.round(semesterProgress)}%</p>
                        </div>
                    </div>
                </div>
                
                {/* Semester Progress Bar */}
                <div className="mt-4">
                    <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                        <div 
                            className="bg-white/80 h-full rounded-full transition-all duration-500"
                            style={{ width: `${semesterProgress}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-white/60 mt-1">
                        {calendarData ? "Semester Progress" : <span>Semester Progress (using default dates - <Link to="/academic-calendar" className="underline">upload calendar</Link>)</span>}
                    </p>
                </div>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-dark-card p-4 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Today's Classes</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{todaysClasses.length}</p>
                </div>
                <div className="bg-white dark:bg-dark-card p-4 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-slate-500 dark:text-slate-400">CGPA</p>
                    <p className="text-2xl font-bold text-primary dark:text-secondary">{displayCgpa != null ? displayCgpa.toFixed(2) : 'N/A'}</p>
                </div>
                <div className="bg-white dark:bg-dark-card p-4 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Credits</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{gradesData?.totalCredits ?? 'N/A'}</p>
                </div>
                <div className="bg-white dark:bg-dark-card p-4 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Attendance</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">92%</p>
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
                            <h2 className="text-xl font-semibold">Upcoming Reminders</h2>
                            <Link to="/academic-calendar" className="text-sm text-primary hover:text-primary-dark">View Calendar →</Link>
                        </div>
                        <div className="space-y-3">
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
                                    .filter(event => {
                                        const eventKey = getEventKey(event);

                                        // Show if: user-created event with remindMe OR preloaded event in user's preferences
                                        const isUserCreatedWithReminder = event.remindMe && event.userId;
                                        const isPreloadedWithReminder = !event.userId && reminderPreferences.includes(eventKey);

                                        if (!isUserCreatedWithReminder && !isPreloadedWithReminder) return false;

                                        const eventDate = new Date(event.date);
                                        eventDate.setHours(0, 0, 0, 0);
                                        const isUpcoming = eventDate >= today;
                                        return isUpcoming;
                                    })
                                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                    .slice(0, 5);

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
                                                <p className="font-medium truncate">{event.description}</p>
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
                                                    onClick={() => toggleReminderPreference(getEventKey(event))}
                                                    className="ml-2 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Remove reminder"
                                                    aria-label="Remove reminder"
                                                >
                                                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
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
                        <h3 className="text-lg font-semibold mb-4">Quick Access</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {quickLinks.map(link => (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex flex-col items-center p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:shadow-md group"
                                >
                                    <div className={`text-2xl mb-2 ${link.color} group-hover:scale-110 transition-transform`}>
                                        {link.icon}
                                    </div>
                                    <span className="text-xs text-center text-slate-600 dark:text-slate-300 group-hover:text-primary dark:group-hover:text-secondary">
                                        {link.name}
                                    </span>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* New: Weather Widget */}
                    <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-semibold mb-3">Campus Weather</h3>
                        {weatherLoading ? (
                            <div className="flex items-center justify-center h-20">
                                <div className="w-8 h-8 border-2 border-t-transparent border-primary rounded-full animate-spin"></div>
                            </div>
                        ) : weatherError ? (
                            <div className="text-center text-red-500">{weatherError}</div>
                        ) : weather ? (
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-3xl font-bold">{weather.temp}°C</p>
                                    <p className="text-sm text-slate-500">{weather.desc}</p>
                                </div>
                                <div className="text-5xl">{weather.icon}</div>
                            </div>
                        ) : null}
                    </div>
 
                    {/* New: Study Streak */}
                    <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-semibold mb-3">Study Streak</h3>
                        <div className="text-center">
                            <p className="text-4xl mb-2">🔥</p>
                            <p className="text-3xl font-bold text-orange-500">7 Days</p>
                            <p className="text-sm text-slate-500 mt-1">Keep it going!</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;