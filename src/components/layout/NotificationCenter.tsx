/**
 * @fileoverview Notification Center component for the header
 *
 * Features:
 * - Bell icon with unread notification count badge
 * - Dropdown list showing recent notifications
 * - Centered modal overlay when clicking a notification (like weather modal)
 * - Real-time notifications from Firestore
 * - Prevents background scroll when modal is open
 *
 * @module components/NotificationCenter
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useUser } from '@contexts/UserContext';
import { db } from '@lib/firebase';
import {
    collection,
    query,
    orderBy,
    limit,
    onSnapshot,
    doc,
    updateDoc,
    writeBatch,
    deleteDoc,
} from 'firebase/firestore';
import { Notification } from '@/types';
import { Link } from 'react-router-dom';

const NotificationCenter: React.FC = () => {
    const { user } = useUser();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
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
            const notifs = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Notification[];

            setNotifications(notifs);
            setUnreadCount(notifs.filter((n) => !n.read).length);
        });

        return () => unsubscribe();
    }, [user]);

    // Prevent background scroll when modal is open
    useEffect(() => {
        if (selectedNotification) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [selectedNotification]);

    const markAsRead = async (notificationId: string) => {
        if (!user) return;
        try {
            const notifRef = doc(db, `users/${user.id}/notifications`, notificationId);
            await updateDoc(notifRef, { read: true });
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    const markAllAsRead = async () => {
        if (!user || unreadCount === 0) return;
        try {
            const batch = writeBatch(db);
            notifications
                .filter((n) => !n.read)
                .forEach((n) => {
                    const notifRef = doc(db, `users/${user.id}/notifications`, n.id);
                    batch.update(notifRef, { read: true });
                });
            await batch.commit();
        } catch (err) {
            console.error('Error marking all as read:', err);
        }
    };

    const deleteNotification = async (notificationId: string) => {
        if (!user) return;
        try {
            const notifRef = doc(db, `users/${user.id}/notifications`, notificationId);
            await deleteDoc(notifRef);
            // Close modal if the deleted notification was being viewed
            if (selectedNotification?.id === notificationId) {
                setSelectedNotification(null);
            }
        } catch (err) {
            console.error('Error deleting notification:', err);
        }
    };

    const clearAllNotifications = async () => {
        if (!user || notifications.length === 0) return;
        try {
            const batch = writeBatch(db);
            notifications.forEach((notif) => {
                const notifRef = doc(db, `users/${user.id}/notifications`, notif.id);
                batch.delete(notifRef);
            });
            await batch.commit();
            setSelectedNotification(null);
        } catch (err) {
            console.error('Error clearing all notifications:', err);
        }
    };

    // Format relative time
    const formatTime = (createdAt: any) => {
        if (!createdAt?.seconds) return 'Just now';
        const date = new Date(createdAt.seconds * 1000);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    // Format full date for modal
    const formatFullDate = (createdAt: any) => {
        if (!createdAt?.seconds) return 'Just now';
        const date = new Date(createdAt.seconds * 1000);
        return date.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Get notification type styles
    const getTypeStyles = (type: Notification['type']) => {
        switch (type) {
            case 'success':
                return {
                    border: 'border-l-green-500',
                    bg: 'bg-green-50/50 dark:bg-green-900/20',
                    headerBg: 'from-green-50 to-emerald-50 dark:from-green-900/40 dark:to-emerald-900/40',
                    text: 'text-green-600 dark:text-green-400',
                };
            case 'warning':
                return {
                    border: 'border-l-amber-500',
                    bg: 'bg-amber-50/50 dark:bg-amber-900/20',
                    headerBg: 'from-amber-50 to-orange-50 dark:from-amber-900/40 dark:to-orange-900/40',
                    text: 'text-amber-600 dark:text-amber-400',
                };
            case 'error':
                return {
                    border: 'border-l-red-500',
                    bg: 'bg-red-50/50 dark:bg-red-900/20',
                    headerBg: 'from-red-50 to-rose-50 dark:from-red-900/40 dark:to-rose-900/40',
                    text: 'text-red-600 dark:text-red-400',
                };
            case 'event':
                return {
                    border: 'border-l-purple-500',
                    bg: 'bg-purple-50/50 dark:bg-purple-900/20',
                    headerBg: 'from-purple-50 to-pink-50 dark:from-purple-900/40 dark:to-pink-900/40',
                    text: 'text-purple-600 dark:text-purple-400',
                };
            case 'info':
            default:
                return {
                    border: 'border-l-blue-500',
                    bg: 'bg-blue-50/50 dark:bg-blue-900/20',
                    headerBg: 'from-blue-50 to-sky-50 dark:from-blue-900/40 dark:to-sky-900/40',
                    text: 'text-blue-600 dark:text-blue-400',
                };
        }
    };

    // Get notification type icon
    const getTypeIcon = (type: Notification['type']) => {
        switch (type) {
            case 'success':
                return '✅';
            case 'warning':
                return '⚠️';
            case 'error':
                return '❌';
            case 'event':
                return '📅';
            case 'info':
            default:
                return 'ℹ️';
        }
    };

    // Handle notification click - open modal
    const handleNotificationClick = (notif: Notification) => {
        if (!notif.read) {
            markAsRead(notif.id);
        }
        setSelectedNotification(notif);
        setIsDropdownOpen(false);
    };

    if (!user) return null;

    return (
        <>
            {/* Notification Bell Button & Dropdown */}
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="relative w-10 h-10 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300 group"
                    aria-label="Notifications"
                >
                    <svg
                        className="w-6 h-6 text-slate-500 dark:text-slate-400 group-hover:text-blue-500 transition-colors"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                    </svg>

                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </button>

                {/* Dropdown */}
                {isDropdownOpen && (
                    <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden z-50 origin-top-right animate-in fade-in zoom-in-95 duration-200">
                        {/* Dropdown Header */}
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur-sm">
                            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                <span>🔔</span> Notifications
                            </h3>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                                    >
                                        Mark all read
                                    </button>
                                )}
                                {notifications.length > 0 && (
                                    <>
                                        <span className="text-slate-300 dark:text-slate-600">|</span>
                                        <button
                                            onClick={clearAllNotifications}
                                            className="text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                                        >
                                            Clear all
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-[60vh] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                                    <span className="text-4xl block mb-2">🔕</span>
                                    <p className="text-sm font-medium">No notifications</p>
                                    <p className="text-xs mt-1">You're all caught up!</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {notifications.map((notif) => {
                                        const styles = getTypeStyles(notif.type);
                                        return (
                                            <div
                                                key={notif.id}
                                                className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer border-l-4 ${styles.border} ${!notif.read ? styles.bg : ''
                                                    }`}
                                                onClick={() => handleNotificationClick(notif)}
                                            >
                                                <div className="flex gap-3">
                                                    <span className="text-lg flex-shrink-0">{getTypeIcon(notif.type)}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start gap-2">
                                                            <p
                                                                className={`text-sm font-medium truncate ${!notif.read
                                                                    ? 'text-slate-900 dark:text-white'
                                                                    : 'text-slate-600 dark:text-slate-300'
                                                                    }`}
                                                            >
                                                                {notif.title}
                                                            </p>
                                                            {!notif.read && (
                                                                <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                                                            {notif.body}
                                                        </p>
                                                        <span className="text-[10px] text-slate-400 mt-1 block">
                                                            {formatTime(notif.createdAt)}
                                                        </span>
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

            {/* Notification Detail Modal - Using Portal to render outside Header's stacking context */}
            {selectedNotification && createPortal(
                <div
                    className="fixed inset-0 z-[100] overflow-hidden"
                    aria-labelledby="notification-modal"
                    role="dialog"
                    aria-modal="true"
                >
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setSelectedNotification(null)}
                    />

                    {/* Center wrapper - positions modal in exact center */}
                    <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
                        <div
                            className="pointer-events-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div
                                className={`sticky top-0 bg-gradient-to-br ${getTypeStyles(selectedNotification.type).headerBg} backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 p-6 rounded-t-2xl z-10`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div className="text-5xl drop-shadow-lg">
                                            {getTypeIcon(selectedNotification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h2
                                                className={`text-xl font-bold ${getTypeStyles(selectedNotification.type).text}`}
                                            >
                                                {selectedNotification.title}
                                            </h2>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                {formatFullDate(selectedNotification.createdAt)}
                                            </p>
                                            {selectedNotification.sender && (
                                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                                    From: {selectedNotification.sender}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedNotification(null)}
                                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6 space-y-4">
                                {/* Notification Body */}
                                <div
                                    className={`${getTypeStyles(selectedNotification.type).bg} p-4 rounded-xl border ${getTypeStyles(selectedNotification.type).border} border-l-4`}
                                >
                                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                        {selectedNotification.body}
                                    </p>
                                </div>

                                {/* Link if available */}
                                {selectedNotification.link && (
                                    <Link
                                        to={selectedNotification.link}
                                        onClick={() => setSelectedNotification(null)}
                                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${getTypeStyles(selectedNotification.type).bg} ${getTypeStyles(selectedNotification.type).text} font-medium hover:opacity-80 transition-opacity`}
                                    >
                                        <span>View Details</span>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 5l7 7-7 7"
                                            />
                                        </svg>
                                    </Link>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="sticky bottom-0 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-4 rounded-b-2xl flex justify-end gap-3">
                                <button
                                    onClick={() => {
                                        deleteNotification(selectedNotification.id);
                                    }}
                                    className="px-4 py-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg font-medium transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                    </svg>
                                    Delete
                                </button>
                                <button
                                    onClick={() => setSelectedNotification(null)}
                                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default NotificationCenter;
