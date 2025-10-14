import React, { useState, useEffect, useMemo } from 'react';
import { CampusEvent, Announcement, NewsItem } from '../types';
// FIX: Changed import from fetchAllNewsAndEvents to subscribeToAllNewsAndEvents.
import { subscribeToAllNewsAndEvents } from '../services/api';
import { RefreshIcon } from '../components/icons/SidebarIcons';

const EventCard: React.FC<{ event: CampusEvent }> = ({ event }) => {
    const cardContent = (
        <>
            <img src={event.imageUrl} alt={event.title} className="w-full h-40 object-cover" />
            <div className="p-4 flex flex-col flex-grow">
                <span className="text-xs font-semibold bg-primary/10 text-primary dark:bg-secondary/20 dark:text-secondary py-1 px-2 rounded-full self-start">{event.category}</span>
                <h3 className="text-lg font-bold mt-2">{event.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex-grow">{event.organizer}</p>
                <div className="mt-4 text-sm space-y-1 text-slate-600 dark:text-slate-300">
                    <p><strong>Date:</strong> {event.date}</p>
                    <p><strong>Time:</strong> {event.time}</p>
                    <p><strong>Venue:</strong> {event.location}</p>
                </div>
            </div>
        </>
    );

    const cardClasses = "bg-white dark:bg-dark-card rounded-lg shadow-lg overflow-hidden flex flex-col h-full";

    if (event.sourceUrl) {
        return (
            <a
                href={event.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${cardClasses} transform hover:-translate-y-1 transition-transform duration-300 block`}
            >
                {cardContent}
            </a>
        );
    }

    return <div className={cardClasses}>{cardContent}</div>;
};

const AnnouncementCard: React.FC<{ announcement: Announcement }> = ({ announcement }) => {
    const cardContent = (
        <div className="p-5 flex flex-col h-full">
            <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold group-hover:text-primary transition-colors flex-grow pr-2">{announcement.title}</h3>
                <span className="text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 py-1 px-2 rounded-full whitespace-nowrap">{announcement.category}</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">By {announcement.author} on {announcement.date}</p>
            <p className="mt-3 text-slate-600 dark:text-slate-300 flex-grow">{announcement.content}</p>
        </div>
    );
    
    const cardClasses = "bg-white dark:bg-dark-card rounded-lg shadow-lg flex flex-col h-full";

    if (announcement.sourceUrl) {
        return (
            <a 
                href={announcement.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${cardClasses} block group transform hover:-translate-y-1 transition-transform duration-300`}
            >
                {cardContent}
            </a>
        );
    }

    return <div className={cardClasses}>{cardContent}</div>;
};


const NewsAndEvents: React.FC = () => {
    const [items, setItems] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);

    // FIX: Replaced one-time fetch with a real-time subscription model.
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

    // FIX: Data is now real-time. Refresh button provides UX feedback but does not re-fetch.
    const handleRefresh = () => {
        if (loading || isRefreshing) return;
        setIsRefreshing(true);
        // Data is real-time via Firestore snapshots, so we can't force a refresh in the same way.
        // For UX, we'll just show the spinner for a moment. The listener will catch any new data.
        setTimeout(() => setIsRefreshing(false), 1000);
    };
    
    const filteredItems = useMemo(() => {
        if (!searchTerm) return items;
        const lowercasedTerm = searchTerm.toLowerCase();
        return items.filter(item => {
            const titleMatch = item.title.toLowerCase().includes(lowercasedTerm);
            if (item.type === 'event') {
                const event = item as CampusEvent;
                return titleMatch || event.organizer.toLowerCase().includes(lowercasedTerm) || event.description.toLowerCase().includes(lowercasedTerm);
            } else {
                const announcement = item as Announcement;
                return titleMatch || announcement.author.toLowerCase().includes(lowercasedTerm) || announcement.content.toLowerCase().includes(lowercasedTerm);
            }
        });
    }, [searchTerm, items]);

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center h-64">
                    <div className="w-16 h-16 border-4 border-t-transparent border-primary rounded-full animate-spin"></div>
                </div>
            );
        }

        if (error) {
            return <div className="text-center p-10 text-red-500 bg-red-50 dark:bg-red-900/10 rounded-lg">{error}</div>;
        }

        if (filteredItems.length === 0) {
            return <div className="text-center p-10 text-slate-500 dark:text-slate-400">No updates found matching your criteria.</div>
        }

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map(item => (
                    item.type === 'event'
                        ? <EventCard key={`event-${item.id}`} event={item as CampusEvent} />
                        : <AnnouncementCard key={`announcement-${item.id}`} announcement={item as Announcement} />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold">News & Events</h1>
                <div className="flex items-center gap-4">
                    <input
                        type="text"
                        placeholder="Search updates..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="px-4 py-2 bg-white dark:bg-dark-card border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button 
                        onClick={handleRefresh} 
                        disabled={loading || isRefreshing} 
                        className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Refresh events"
                    >
                        <RefreshIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                    </button>
                </div>
            </div>
            
            {renderContent()}
        </div>
    );
};

export default NewsAndEvents;