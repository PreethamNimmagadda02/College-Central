import React, { useState, useEffect, useMemo } from 'react';
import { CampusEvent, Announcement, NewsItem } from '../types';
import { subscribeToAllNewsAndEvents } from '../services/api';
import { RefreshIcon } from '../components/icons/SidebarIcons';

// Helper to format dates nicely
const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
    }

    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
};

// Helper to check if event is upcoming, ongoing, or past
const getEventStatus = (dateString: string): 'upcoming' | 'today' | 'past' => {
    const eventDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);

    if (eventDate > today) return 'upcoming';
    if (eventDate.getTime() === today.getTime()) return 'today';
    return 'past';
};

const EventCard: React.FC<{ event: CampusEvent }> = ({ event }) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);
    
    const status = getEventStatus(event.date);
    const isNew = () => {
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - 3); // Consider new if added in last 3 days
        return true; // Since we don't have createdAt timestamp, we'll skip this for now
    };

    // Validate and provide fallback for sourceUrl
    const getValidSourceUrl = (url: string | undefined): string | null => {
        if (!url) return null;
        
        // Check if URL is from the old broken paths
        const brokenPaths = [
            'all-active-notices',
            'dept-event-list', 
            'seminar-1',
            '~mbc/mbcpress_release.php'
        ];
        
        const hasBrokenPath = brokenPaths.some(path => url.includes(path));
        if (hasBrokenPath) {
            // Redirect to main website instead
            return 'https://www.iitism.ac.in/';
        }
        
        return url;
    };

    const validSourceUrl = getValidSourceUrl(event.sourceUrl);

    const cardContent = (
        <>
            <div className="relative">
                {imageLoading && !imageError && (
                    <div className="w-full h-44 bg-slate-200 dark:bg-slate-700 animate-pulse flex items-center justify-center">
                        <div className="text-slate-400 dark:text-slate-500">Loading...</div>
                    </div>
                )}
                <img
                    src={event.imageUrl}
                    alt={event.title}
                    className={`w-full h-44 object-cover ${imageLoading ? 'hidden' : ''}`}
                    onLoad={() => setImageLoading(false)}
                    onError={(e) => {
                        setImageError(true);
                        setImageLoading(false);
                        e.currentTarget.src = '/logo.svg';
                        e.currentTarget.className = 'w-full h-44 object-contain bg-slate-100 dark:bg-slate-800 p-4';
                    }}
                    loading="lazy"
                />
                {imageError && (
                    <div className="w-full h-44 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <img src="/logo.svg" alt="Fallback" className="w-16 h-16 opacity-50" />
                    </div>
                )}
                {status === 'today' && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                        TODAY
                    </div>
                )}
                {status === 'upcoming' && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        UPCOMING
                    </div>
                )}
            </div>
            <div className="p-5 flex flex-col flex-grow">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold bg-primary/10 text-primary dark:bg-secondary/20 dark:text-secondary py-1.5 px-3 rounded-full">
                        {event.category}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                        📅 {formatDate(event.date)}
                    </span>
                </div>
                <h3 className="text-lg font-bold mt-1 mb-2 line-clamp-2 min-h-[3.5rem]">
                    {event.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    🏢 {event.organizer}
                </p>
                <div className="mt-auto space-y-2 text-sm text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-slate-700 pt-3">
                    <div className="flex items-center gap-2">
                        <span className="text-primary dark:text-secondary">🕐</span>
                        <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-primary dark:text-secondary">📍</span>
                        <span className="line-clamp-1">{event.location}</span>
                    </div>
                </div>
                {validSourceUrl && (
                    <div className="mt-3 flex items-center gap-1 text-xs text-primary dark:text-secondary font-medium">
                        <span>View Details</span>
                        <span>→</span>
                    </div>
                )}
            </div>
        </>
    );

    const cardClasses = `bg-white dark:bg-dark-card rounded-xl shadow-md hover:shadow-xl overflow-hidden flex flex-col h-full border border-slate-200 dark:border-slate-700 transition-all duration-300 ${
        status === 'past' ? 'opacity-60' : ''
    }`;

    if (validSourceUrl) {
        return (
            <a
                href={validSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${cardClasses} transform hover:-translate-y-2 block group`}
            >
                {cardContent}
            </a>
        );
    }

    return <div className={cardClasses}>{cardContent}</div>;
};

const AnnouncementCard: React.FC<{ announcement: Announcement }> = ({ announcement }) => {
    // Validate and provide fallback for sourceUrl
    const getValidSourceUrl = (url: string | undefined): string | null => {
        if (!url) return null;
        
        // Check if URL is from the old broken paths
        const brokenPaths = [
            'all-active-notices',
            'dept-event-list', 
            'seminar-1',
            '~mbc/mbcpress_release.php'
        ];
        
        const hasBrokenPath = brokenPaths.some(path => url.includes(path));
        if (hasBrokenPath) {
            // Redirect to main website instead
            return 'https://www.iitism.ac.in/';
        }
        
        return url;
    };

    const validSourceUrl = getValidSourceUrl(announcement.sourceUrl);

    const cardContent = (
        <div className="p-5 flex flex-col h-full">
            <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-lg font-bold group-hover:text-primary transition-colors flex-grow line-clamp-2">
                    {announcement.title}
                </h3>
                <span className="text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 py-1.5 px-3 rounded-full whitespace-nowrap flex-shrink-0">
                    {announcement.category}
                </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
                <span>✍️ {announcement.author}</span>
                <span>•</span>
                <span>📅 {formatDate(announcement.date)}</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 flex-grow line-clamp-4">
                {announcement.content}
            </p>
            {validSourceUrl && (
                <div className="mt-4 flex items-center gap-1 text-xs text-primary dark:text-secondary font-medium">
                    <span>Read More</span>
                    <span>→</span>
                </div>
            )}
        </div>
    );

    const cardClasses = "bg-gradient-to-br from-white to-slate-50 dark:from-dark-card dark:to-slate-800/50 rounded-xl shadow-md hover:shadow-xl flex flex-col h-full border border-slate-200 dark:border-slate-700 transition-all duration-300";

    if (validSourceUrl) {
        return (
            <a
                href={validSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${cardClasses} block group transform hover:-translate-y-2`}
            >
                {cardContent}
            </a>
        );
    }

    return <div className={cardClasses}>{cardContent}</div>;
};

type ViewMode = 'all' | 'events' | 'announcements';
type SortOption = 'date-desc' | 'date-asc' | 'category';
type FilterCategory = 'all' | 'Academic' | 'Technical' | 'Cultural' | 'Sports' | 'General';

const NewsAndEvents: React.FC = () => {
    const [items, setItems] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('all');
    const [sortBy, setSortBy] = useState<SortOption>('date-desc');
    const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
    const [showOnlyUpcoming, setShowOnlyUpcoming] = useState(false);

    useEffect(() => {
        setLoading(true);
        setError(null);
        const unsubscribe = subscribeToAllNewsAndEvents((allItems, err) => {
            setItems(allItems);
            setError(err || null);
            setLoading(false);
            setIsRefreshing(false);
        });

        return () => unsubscribe();
    }, []);

    const handleRefresh = () => {
        if (loading || isRefreshing) return;
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    const filteredAndSortedItems = useMemo(() => {
        let result = [...items];

        // Filter by view mode
        if (viewMode === 'events') {
            result = result.filter(item => item.type === 'event');
        } else if (viewMode === 'announcements') {
            result = result.filter(item => item.type === 'announcement');
        }

        // Filter by search term
        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            result = result.filter(item => {
                const titleMatch = item.title.toLowerCase().includes(lowercasedTerm);
                if (item.type === 'event') {
                    const event = item as CampusEvent;
                    return titleMatch ||
                           event.organizer.toLowerCase().includes(lowercasedTerm) ||
                           event.description.toLowerCase().includes(lowercasedTerm) ||
                           event.category.toLowerCase().includes(lowercasedTerm);
                } else {
                    const announcement = item as Announcement;
                    return titleMatch ||
                           announcement.author.toLowerCase().includes(lowercasedTerm) ||
                           announcement.content.toLowerCase().includes(lowercasedTerm) ||
                           announcement.category.toLowerCase().includes(lowercasedTerm);
                }
            });
        }

        // Filter by category
        if (filterCategory !== 'all') {
            result = result.filter(item => {
                if (item.type === 'event') {
                    return (item as CampusEvent).category === filterCategory;
                } else {
                    return (item as Announcement).category === filterCategory;
                }
            });
        }

        // Filter by upcoming only (events only)
        if (showOnlyUpcoming) {
            result = result.filter(item => {
                if (item.type === 'event') {
                    return getEventStatus((item as CampusEvent).date) !== 'past';
                }
                return true; // Keep all announcements
            });
        }

        // Sort
        result.sort((a, b) => {
            if (sortBy === 'date-desc') {
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            } else if (sortBy === 'date-asc') {
                return new Date(a.date).getTime() - new Date(b.date).getTime();
            } else if (sortBy === 'category') {
                const catA = a.type === 'event' ? (a as CampusEvent).category : (a as Announcement).category;
                const catB = b.type === 'event' ? (b as CampusEvent).category : (b as Announcement).category;
                return catA.localeCompare(catB);
            }
            return 0;
        });

        return result;
    }, [items, searchTerm, viewMode, sortBy, filterCategory, showOnlyUpcoming]);

    const stats = useMemo(() => {
        const events = items.filter(item => item.type === 'event') as CampusEvent[];
        const announcements = items.filter(item => item.type === 'announcement');
        const upcomingEvents = events.filter(e => getEventStatus(e.date) !== 'past');

        return {
            totalEvents: events.length,
            totalAnnouncements: announcements.length,
            upcomingEvents: upcomingEvents.length,
        };
    }, [items]);

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <div className="w-16 h-16 border-4 border-t-transparent border-primary rounded-full animate-spin"></div>
                    <p className="text-slate-500 dark:text-slate-400">Loading latest updates...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="text-center p-10 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800">
                    <p className="text-red-600 dark:text-red-400 text-lg font-semibold mb-2">⚠️ Error Loading Data</p>
                    <p className="text-red-500 dark:text-red-300">{error}</p>
                </div>
            );
        }

        if (filteredAndSortedItems.length === 0) {
            return (
                <div className="text-center p-16 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="text-6xl mb-4">🔍</div>
                    <p className="text-slate-600 dark:text-slate-400 text-lg font-medium mb-2">No updates found</p>
                    <p className="text-slate-500 dark:text-slate-500 text-sm">Try adjusting your filters or search terms</p>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredAndSortedItems.map(item => (
                    item.type === 'event'
                        ? <EventCard key={`event-${item.id}`} event={item as CampusEvent} />
                        : <AnnouncementCard key={`announcement-${item.id}`} announcement={item as Announcement} />
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        News & Events
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Stay updated with the latest from IIT Dhanbad
                    </p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={loading || isRefreshing}
                    className="bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg text-white font-semibold py-2.5 px-5 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                    aria-label="Refresh events"
                >
                    <RefreshIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-5 rounded-xl shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium">Total Events</p>
                            <p className="text-3xl font-bold mt-1">{stats.totalEvents}</p>
                        </div>
                        <div className="text-5xl opacity-20">📅</div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-5 rounded-xl shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm font-medium">Upcoming</p>
                            <p className="text-3xl font-bold mt-1">{stats.upcomingEvents}</p>
                        </div>
                        <div className="text-5xl opacity-20">🎯</div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-5 rounded-xl shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm font-medium">Announcements</p>
                            <p className="text-3xl font-bold mt-1">{stats.totalAnnouncements}</p>
                        </div>
                        <div className="text-5xl opacity-20">📢</div>
                    </div>
                </div>
            </div>

            {/* Filters and Controls */}
            <div className="bg-white dark:bg-dark-card p-5 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 space-y-4">
                {/* Search Bar */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="🔍 Search events, announcements, organizers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap gap-3">
                    {/* View Mode */}
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('all')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                viewMode === 'all'
                                    ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setViewMode('events')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                viewMode === 'events'
                                    ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                        >
                            Events
                        </button>
                        <button
                            onClick={() => setViewMode('announcements')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                viewMode === 'announcements'
                                    ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                        >
                            Announcements
                        </button>
                    </div>

                    {/* Category Filter */}
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value as FilterCategory)}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border-0 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                    >
                        <option value="all">All Categories</option>
                        <option value="Academic">Academic</option>
                        <option value="Technical">Technical</option>
                        <option value="Cultural">Cultural</option>
                        <option value="Sports">Sports</option>
                        <option value="General">General</option>
                    </select>

                    {/* Sort By */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border-0 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                    >
                        <option value="date-desc">Latest First</option>
                        <option value="date-asc">Oldest First</option>
                        <option value="category">By Category</option>
                    </select>

                    {/* Upcoming Only Toggle */}
                    <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <input
                            type="checkbox"
                            checked={showOnlyUpcoming}
                            onChange={(e) => setShowOnlyUpcoming(e.target.checked)}
                            className="w-4 h-4 text-primary bg-slate-300 border-slate-400 rounded focus:ring-primary focus:ring-2"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Upcoming Only
                        </span>
                    </label>
                </div>

                {/* Active Filters Info */}
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <span>Showing {filteredAndSortedItems.length} results</span>
                    {(searchTerm || filterCategory !== 'all' || viewMode !== 'all' || showOnlyUpcoming) && (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setFilterCategory('all');
                                setViewMode('all');
                                setShowOnlyUpcoming(false);
                            }}
                            className="text-primary hover:text-primary-dark font-medium underline"
                        >
                            Clear all filters
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            {renderContent()}
        </div>
    );
};

export default NewsAndEvents;
