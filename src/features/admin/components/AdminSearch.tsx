import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminConfig } from '../hooks/useAdminConfig';

interface SearchResult {
    id: string;
    type: 'course' | 'faculty' | 'student' | 'form' | 'event' | 'link';
    title: string;
    subtitle: string;
    path: string;
}

interface AdminSearchProps {
    isOpen: boolean;
    onClose: () => void;
}

const typeIcons: Record<SearchResult['type'], React.ReactNode> = {
    course: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
    ),
    faculty: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    ),
    student: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
    ),
    form: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    ),
    event: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    ),
    link: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
    ),
};

const typeLabels: Record<SearchResult['type'], string> = {
    course: 'Course',
    faculty: 'Faculty',
    student: 'Student',
    form: 'Form',
    event: 'Event',
    link: 'Quick Link',
};

const typeColors: Record<SearchResult['type'], string> = {
    course: 'bg-blue-500/20 text-blue-400',
    faculty: 'bg-green-500/20 text-green-400',
    student: 'bg-purple-500/20 text-purple-400',
    form: 'bg-amber-500/20 text-amber-400',
    event: 'bg-pink-500/20 text-pink-400',
    link: 'bg-cyan-500/20 text-cyan-400',
};

const AdminSearch: React.FC<AdminSearchProps> = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState<SearchResult['type'] | 'all'>('all');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const { config } = useAdminConfig();

    // Build search index from config
    const searchIndex = useMemo((): SearchResult[] => {
        const results: SearchResult[] = [];

        // Courses
        (config.courses || []).forEach((course) => {
            results.push({
                id: course.id,
                type: 'course',
                title: `${course.courseCode} - ${course.courseName}`,
                subtitle: `${course.credits} credits • ${course.courseType}`,
                path: '/admin/courses',
            });
        });

        // Faculty/Directory
        (config.directory || []).forEach((entry) => {
            results.push({
                id: entry.id,
                type: 'faculty',
                title: entry.name,
                subtitle: `${entry.designation} • ${entry.department}`,
                path: '/admin/directory',
            });
        });

        // Students
        (config.students || []).forEach((student) => {
            results.push({
                id: student.id,
                type: 'student',
                title: student.name,
                subtitle: `${student.admNo} • ${student.branch}`,
                path: '/admin/students',
            });
        });

        // Forms
        (config.forms || []).forEach((form) => {
            results.push({
                id: form.id,
                type: 'form',
                title: form.title,
                subtitle: `${form.formNumber} • ${form.category.toUpperCase()}`,
                path: '/admin/forms',
            });
        });

        // Calendar Events
        (config.calendar?.events || []).forEach((event) => {
            results.push({
                id: event.id,
                type: 'event',
                title: event.description,
                subtitle: `${new Date(event.date).toLocaleDateString()} • ${event.type}`,
                path: '/admin/calendar',
            });
        });

        // Quick Links
        (config.quickLinks || []).forEach((link) => {
            results.push({
                id: link.id,
                type: 'link',
                title: link.name,
                subtitle: link.href,
                path: '/admin/quick-links',
            });
        });

        return results;
    }, [config]);

    // Filter results based on query and filter
    const filteredResults = useMemo(() => {
        let results = searchIndex;

        // Apply type filter
        if (selectedFilter !== 'all') {
            results = results.filter((r) => r.type === selectedFilter);
        }

        // Apply search query
        if (query.trim()) {
            const lowerQuery = query.toLowerCase();
            results = results.filter(
                (r) =>
                    r.title.toLowerCase().includes(lowerQuery) ||
                    r.subtitle.toLowerCase().includes(lowerQuery)
            );
        }

        return results.slice(0, 20); // Limit to 20 results
    }, [searchIndex, query, selectedFilter]);

    // Reset selection when results change
    useEffect(() => {
        setSelectedIndex(0);
    }, [filteredResults]);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedFilter('all');
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex((prev) => Math.min(prev + 1, filteredResults.length - 1));
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex((prev) => Math.max(prev - 1, 0));
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (filteredResults[selectedIndex]) {
                        navigate(filteredResults[selectedIndex].path);
                        onClose();
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    onClose();
                    break;
            }
        },
        [filteredResults, selectedIndex, navigate, onClose]
    );

    // Handle result click
    const handleResultClick = (result: SearchResult) => {
        navigate(result.path);
        onClose();
    };

    if (!isOpen) return null;

    const filterTypes: (SearchResult['type'] | 'all')[] = ['all', 'course', 'faculty', 'student', 'form', 'event', 'link'];

    return (
        <div className="fixed inset-0 z-[100]" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className="absolute top-[10%] left-1/2 -translate-x-1/2 w-full max-w-2xl mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="admin-card overflow-hidden shadow-2xl">
                    {/* Search Input */}
                    <div className="p-4 border-b border-slate-700/50">
                        <div className="relative">
                            <svg
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Search courses, faculty, forms, events..."
                                className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                <kbd className="px-2 py-0.5 text-xs bg-slate-700 text-slate-300 rounded">esc</kbd>
                            </div>
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex flex-wrap gap-2 mt-3">
                            {filterTypes.map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setSelectedFilter(type)}
                                    className={`px-3 py-1 text-xs rounded-full transition-colors ${selectedFilter === type
                                            ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                                            : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 border border-transparent'
                                        }`}
                                >
                                    {type === 'all' ? 'All' : typeLabels[type]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Results */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {filteredResults.length > 0 ? (
                            <div className="p-2">
                                {filteredResults.map((result, index) => (
                                    <button
                                        key={`${result.type}-${result.id}`}
                                        onClick={() => handleResultClick(result)}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${index === selectedIndex
                                                ? 'bg-purple-500/20 border border-purple-500/30'
                                                : 'hover:bg-slate-700/30 border border-transparent'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${typeColors[result.type]}`}>
                                            {typeIcons[result.type]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-medium truncate">{result.title}</p>
                                            <p className="text-xs text-slate-400 truncate">{result.subtitle}</p>
                                        </div>
                                        <span className="text-xs text-slate-500 flex-shrink-0">
                                            {typeLabels[result.type]}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-slate-400">
                                {query ? (
                                    <>
                                        <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p>No results found for "{query}"</p>
                                        <p className="text-sm mt-1">Try a different search term</p>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        <p>Start typing to search</p>
                                        <p className="text-sm mt-1">Search across all admin modules</p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-slate-700 rounded">↑</kbd>
                                <kbd className="px-1.5 py-0.5 bg-slate-700 rounded">↓</kbd>
                                to navigate
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-slate-700 rounded">enter</kbd>
                                to select
                            </span>
                        </div>
                        <span>{filteredResults.length} results</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSearch;
