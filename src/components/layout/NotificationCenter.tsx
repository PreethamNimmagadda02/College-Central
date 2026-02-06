
import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '@contexts/UserContext';
import { db } from '@lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { Notification } from '@/types';
import { Link } from 'react-router-dom';

const NotificationCenter: React.FC = () => {
    const { user } = useUser();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [expandedNotifId, setExpandedNotifId] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setExpandedNotifId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Listen to notifications
    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, `users/${user.id}/notifications`),
            orderBy('createdAt', 'desc'),
            limit(20)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Notification[];

            setNotifications(notifs);
            setUnreadCount(notifs.filter(n => !n.read).length);
        });

        return () => unsubscribe();
    }, [user]);

    const markAsRead = async (notificationId: string) => {
        if (!user) return;
        try {
            const notifRef = doc(db, `users/${user.id}/notifications`, notificationId);
            await updateDoc(notifRef, { read: true });
        } catch (err) {
            console.error("Error marking notification as read:", err);
        }
    };

    const markAllAsRead = async () => {
        if (!user || unreadCount === 0) return;
        try {
            const batch = writeBatch(db);
            notifications.filter(n => !n.read).forEach(n => {
                const notifRef = doc(db, `users/${user.id}/notifications`, n.id);
                batch.update(notifRef, { read: true });
            });
            await batch.commit();
        } catch (err) {
            console.error("Error marking all as read:", err);
        }
    };

    const handleViewDetails = (notif: Notification) => {
        // Toggle expansion
        if (expandedNotifId === notif.id) {
            setExpandedNotifId(null);
        } else {
            setExpandedNotifId(notif.id);
            // Mark as read when expanding
            if (!notif.read) {
                markAsRead(notif.id);
            }
        }
    };

    if (!user) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (isOpen) setExpandedNotifId(null);
                }}
                className="relative w-10 h-10 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300 group"
                aria-label="Notifications"
            >
                <svg
                    className="w-6 h-6 text-slate-500 dark:text-slate-400 group-hover:text-blue-500 transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>

                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
                )}
            </button>

            {isOpen && (
                <div className="fixed top-[72px] left-2 right-2 sm:left-4 sm:right-4 md:absolute md:top-full md:left-auto md:right-0 md:mt-2 md:w-96 bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl shadow-xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden z-50 origin-top-right animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur-sm">
                        <h3 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-[10px] sm:text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[60vh] sm:max-h-[70vh] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-6 sm:p-8 text-center text-slate-500 dark:text-slate-400">
                                <p className="text-xs sm:text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {notifications.map((notif) => {
                                    const isExpanded = expandedNotifId === notif.id;
                                    return (
                                        <div
                                            key={notif.id}
                                            className={`p-3 sm:p-4 transition-all duration-200 ${!notif.read
                                                ? 'bg-blue-50/50 dark:bg-blue-900/10'
                                                : ''
                                                } ${isExpanded ? 'bg-slate-100/80 dark:bg-slate-800/80' : ''}`}
                                        >
                                            <div className="flex gap-2 sm:gap-3">
                                                <div className={`mt-1 flex-shrink-0 w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full transition-colors ${!notif.read ? 'bg-blue-500' : 'bg-transparent'}`} />
                                                <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-2">
                                                    <div className="flex justify-between items-start gap-1 sm:gap-2">
                                                        <p className={`text-xs sm:text-sm font-medium leading-tight ${!notif.read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                                                            {notif.title}
                                                        </p>
                                                        <span className="text-[9px] sm:text-[10px] text-slate-400 whitespace-nowrap flex-shrink-0">
                                                            {notif.createdAt?.seconds ? new Date(notif.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                                                        </span>
                                                    </div>

                                                    {/* Notification body - truncated or full based on expanded state */}
                                                    <p className={`text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 transition-all duration-200 ${isExpanded ? 'whitespace-pre-wrap break-words' : 'line-clamp-2'
                                                        }`}>
                                                        {notif.body}
                                                    </p>

                                                    {/* When collapsed: Show "View Details" button */}
                                                    {!isExpanded && (
                                                        <button
                                                            onClick={() => handleViewDetails(notif)}
                                                            className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                                                        >
                                                            View Details
                                                            <svg
                                                                className="w-2.5 sm:w-3 h-2.5 sm:h-3"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
                                                            >
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </button>
                                                    )}

                                                    {/* When expanded: Show link first (if any), then "Show Less" button */}
                                                    {isExpanded && (
                                                        <>
                                                            {/* Show link if notification has one */}
                                                            {notif.link && (
                                                                <div className="mt-1.5 sm:mt-2 p-1.5 sm:p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md sm:rounded-lg border border-blue-200 dark:border-blue-800">
                                                                    <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1">Associated Link:</p>
                                                                    <Link
                                                                        to={notif.link}
                                                                        className="inline-flex items-start gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors break-all"
                                                                        onClick={() => setIsOpen(false)}
                                                                    >
                                                                        <svg className="w-3 sm:w-3.5 h-3 sm:h-3.5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                                        </svg>
                                                                        <span className="break-all">{notif.link}</span>
                                                                    </Link>
                                                                </div>
                                                            )}

                                                            {/* Show Less button at the bottom */}
                                                            <button
                                                                onClick={() => handleViewDetails(notif)}
                                                                className="inline-flex items-center gap-1 mt-1.5 sm:mt-2 text-[11px] sm:text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                                                            >
                                                                Show Less
                                                                <svg
                                                                    className="w-2.5 sm:w-3 h-2.5 sm:h-3 rotate-180"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                >
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                </svg>
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
