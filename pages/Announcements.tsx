import React, { useState, useEffect, useMemo } from 'react';
import { Announcement, NewsItem } from '../types';
import { subscribeToAllNewsAndEvents } from '../services/api';
import { RefreshIcon } from '../components/icons/SidebarIcons';

const AnnouncementItem: React.FC<{ announcement: Announcement }> = ({ announcement }) => {
    const itemContent = (
        <>
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{announcement.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">By {announcement.author} on {announcement.date}</p>
                </div>
                <span className="text-xs font-semibold bg-primary/10 text-primary dark:bg-secondary/20 dark:text-secondary py-1 px-2 rounded-full whitespace-nowrap">{announcement.category}</span>
            </div>
            <p className="mt-3 text-slate-600 dark:text-slate-300">{announcement.content}</p>
        </>
    );

    if (announcement.sourceUrl) {
        return (
            <a 
                href={announcement.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white dark:bg-dark-card p-5 rounded-lg shadow-md block group hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
                {itemContent}
            </a>
        );
    }

    return (
        <div className="bg-white dark:bg-dark-card p-5 rounded-lg shadow-md">
            {itemContent}
        </div>
    );
};


const Announcements: React.FC = () => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('All');
    const [error, setError] = useState<string | null>(null);

    // FIX: Replaced one-time fetch with a real-time subscription.
    useEffect(() => {
        setLoading(true);
        setError(null);
        const unsubscribe = subscribeToAllNewsAndEvents((items: NewsItem[], err?: string) => {
            // Filter for announcements only
            const announcementsOnly = items.filter(
                (item): item is Announcement & { type: 'announcement' } => item.type === 'announcement'
            );
            setAnnouncements(announcementsOnly);
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
        // For UX, we'll just show the spinner for a moment.
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    const categories = useMemo(() => {
        if (announcements.length === 0) return ['All'];
        const uniqueCategories = [...new Set(announcements.map(ann => ann.category))];
        return ['All', ...uniqueCategories];
    }, [announcements]);
    
    const filteredAnnouncements = useMemo(() => {
        return announcements
            .filter(ann => categoryFilter === 'All' || ann.category === categoryFilter)
            .filter(ann => ann.title.toLowerCase().includes(searchTerm.toLowerCase()) || ann.content.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [announcements, searchTerm, categoryFilter]);

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

        if (filteredAnnouncements.length === 0) {
            return <p className="text-center text-slate-500 dark:text-slate-400 py-10">No announcements found matching your criteria.</p>
        }

        return (
            <div className="space-y-4">
                {filteredAnnouncements.map(ann => <AnnouncementItem key={ann.id} announcement={ann} />)}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold">Announcements</h1>
                 <button 
                    onClick={handleRefresh} 
                    disabled={loading || isRefreshing} 
                    className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Refresh announcements"
                >
                    <RefreshIcon className={`w-6 h-6 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                    type="text"
                    placeholder="Search announcements..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="md:col-span-2 w-full px-4 py-2 bg-white dark:bg-dark-card border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-dark-card border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
            </div>

            {renderContent()}
        </div>
    );
};

export default Announcements;