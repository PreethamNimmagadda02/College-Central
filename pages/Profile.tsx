import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, ActivityItem, Form, CampusLocation, CalendarEvent } from '../types';
import { useUser } from '../contexts/UserContext';
import { useAuth } from '../hooks/useAuth';
import { useForms } from '../contexts/FormsContext';
import { useCampusMap } from '../contexts/CampusMapContext';
import { useCalendar } from '../contexts/CalendarContext';
import { HOSTEL_OPTIONS, BRANCH_OPTIONS } from '../data/profileOptions';
import { db } from '../firebaseConfig';
import 'firebase/firestore';
import { X, Download, Calendar, Bell, MapPin } from 'lucide-react';
import { allForms } from '../data/formsData';

const formatTimeAgo = (timestamp: { seconds: number; nanoseconds: number } | null) => {
    if (!timestamp) return '...';
    const now = new Date();
    const activityDate = new Date(timestamp.seconds * 1000);
    const diffSeconds = Math.floor((now.getTime() - activityDate.getTime()) / 1000);

    if (diffSeconds < 60) return 'just now';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return activityDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const Profile: React.FC = () => {
    const { user, updateUser, uploadProfilePicture, loading } = useUser();
    const { currentUser, logout } = useAuth();
    const { userFormsData, addRecentDownload } = useForms();
    const { savedPlaces, locations } = useCampusMap();
    const { reminderPreferences, calendarData, getEventKey } = useCalendar();

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<User>>({});
    const [activeTab, setActiveTab] = useState<'overview' | 'activity'>('overview');
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [imageError, setImageError] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [isImageExpanded, setIsImageExpanded] = useState(false);
    const [showModalContent, setShowModalContent] = useState(false);
    const [modalData, setModalData] = useState<{
        title: string;
        data: any[];
        type: 'forms' | 'events' | 'reminders' | 'places';
        link: string;
        linkText: string;
    } | null>(null);

    const [activity, setActivity] = useState<ActivityItem[]>([]);
    const [activityLoading, setActivityLoading] = useState(true);
    const [showAllActivity, setShowAllActivity] = useState(false);
    const [activitySearch, setActivitySearch] = useState('');
    const [activitySortBy, setActivitySortBy] = useState<'recent' | 'oldest' | 'type'>('recent');
    const [activityFilterType, setActivityFilterType] = useState<string>('all');

    // Calculate stats for overview
    const savedFormsCount = userFormsData?.favorites?.length ?? 0;
    const userAddedEventsCount = calendarData?.events.filter(e => e.userId === currentUser?.uid).length ?? 0;
    const remindersCount = reminderPreferences?.length ?? 0;
    const savedPlacesCount = savedPlaces?.length ?? 0;

    // Get unique activity types for filter
    const activityTypes = ['all', ...Array.from(new Set(activity.map(item => item.type)))];

    // Filter, search, and sort activities
    const filteredAndSortedActivities = React.useMemo(() => {
        let filtered = [...activity];

        // Apply type filter
        if (activityFilterType !== 'all') {
            filtered = filtered.filter(item => item.type === activityFilterType);
        }

        // Apply search
        if (activitySearch.trim()) {
            const searchLower = activitySearch.toLowerCase();
            filtered = filtered.filter(item =>
                item.title.toLowerCase().includes(searchLower) ||
                item.description.toLowerCase().includes(searchLower) ||
                item.type.toLowerCase().includes(searchLower)
            );
        }

        // Apply sorting
        if (activitySortBy === 'recent') {
            filtered.sort((a, b) => {
                const timeA = a.timestamp?.seconds || 0;
                const timeB = b.timestamp?.seconds || 0;
                return timeB - timeA;
            });
        } else if (activitySortBy === 'oldest') {
            filtered.sort((a, b) => {
                const timeA = a.timestamp?.seconds || 0;
                const timeB = b.timestamp?.seconds || 0;
                return timeA - timeB;
            });
        } else if (activitySortBy === 'type') {
            filtered.sort((a, b) => a.type.localeCompare(b.type));
        }

        return filtered;
    }, [activity, activityFilterType, activitySearch, activitySortBy]);

    useEffect(() => {
        if (!currentUser) {
            setActivityLoading(false);
            return;
        }

        const activityQuery = db.collection('users').doc(currentUser.uid).collection('activity').orderBy('timestamp', 'desc').limit(20);

        const unsubscribe = activityQuery.onSnapshot((snapshot) => {
            const activities = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as ActivityItem));
            setActivity(activities);
            setActivityLoading(false);
        }, (error: any) => {
            console.error("Error fetching activity: ", error);
            if (error.code === 'permission-denied') {
                console.error(
                    "Firestore Security Rules Error: The current user does not have permission to read their own activity log. " +
                    "Please ensure your Firestore rules allow reads on the 'users/{userId}/activity/{activityId}' path for authenticated users."
                );
            }
            setActivityLoading(false);
        });

        return () => unsubscribe();

    }, [currentUser]);

    useEffect(() => {
        if (user) {
            setFormData(user);
        }
    }, [user]);

    useEffect(() => {
        if (user?.profilePicture) {
            setImageError(false);
        }
    }, [user?.profilePicture]);

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'phone') {
            setFormData(prev => ({ ...prev, [name]: value.replace(/\D/g, '') }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSave = async () => {
        try {
            await updateUser(formData);
            setIsEditing(false);
            showNotification('Profile updated successfully!', 'success');
        } catch (error) {
            showNotification('Failed to update profile', 'error');
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsUploading(true);
            showNotification('Uploading picture...', 'success');
            try {
                await uploadProfilePicture(file);
                showNotification('Profile picture updated!', 'success');
            } catch (error: any) {
                console.error(error);
                showNotification(error instanceof Error ? error.message : 'Upload failed. Please try again.', 'error');
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleLogout = async () => {
        if (window.confirm('Are you sure you want to logout?')) {
            await logout();
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };
    
    const openModal = () => {
        if (user?.profilePicture && !imageError) {
            setIsImageExpanded(true);
            setTimeout(() => setShowModalContent(true), 50); // a tiny delay to ensure transition works on mount
        }
    };

    const closeModal = () => {
        setShowModalContent(false);
        setTimeout(() => {
            setIsImageExpanded(false);
        }, 300); // should match the transition duration
    };

    const handlePictureClick = () => {
        if (isEditing) {
            if (!isUploading) {
                fileInputRef.current?.click();
            }
        } else {
            openModal();
        }
    };

    if (loading || !user) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-t-transparent border-primary rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-slate-600 dark:text-slate-400">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-4 lg:p-6">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-primary to-secondary rounded-xl shadow-lg overflow-hidden">
                <div className="p-8 relative">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0" style={{
                            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                            backgroundSize: '20px 20px'
                        }}></div>
                    </div>

                    <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6">
                        {/* Profile Picture */}
                        <div
                            className={`relative group ${isEditing ? 'cursor-pointer' : (user.profilePicture && !imageError ? 'cursor-zoom-in' : 'cursor-default')}`}
                            onClick={handlePictureClick}
                        >
                            {user.profilePicture && !imageError ? (
                                <img
                                    className="h-32 w-32 rounded-full ring-4 ring-white/50 shadow-xl object-cover"
                                    src={user.profilePicture}
                                    alt="Profile"
                                    onError={() => setImageError(true)}
                                />
                            ) : (
                                <div className="h-32 w-32 rounded-full bg-white text-primary flex items-center justify-center text-4xl font-bold ring-4 ring-white/50 shadow-xl">
                                    {getInitials(user.name)}
                                </div>
                            )}
                            {isEditing && (
                                <>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        hidden
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        disabled={isUploading}
                                    />
                                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                                        {isUploading ? (
                                            <div className="w-8 h-8 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
                                        ) : (
                                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 text-center md:text-left text-white">
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name || ''}
                                    onChange={handleInputChange}
                                    className="text-3xl font-bold bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-4 py-2 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 w-full mb-2"
                                    placeholder="Your Name"
                                />
                            ) : (
                                <h1 className="text-3xl md:text-4xl font-bold mb-2">{user.name}</h1>
                            )}

                            {isEditing ? (
                                <select
                                    name="branch"
                                    value={formData.branch || ''}
                                    onChange={handleInputChange}
                                    className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50 w-full"
                                >
                                    <option value="" className="text-slate-800">Select a branch...</option>
                                    {BRANCH_OPTIONS.map(branch => (
                                        <option key={branch} value={branch} className="text-slate-800">{branch}</option>
                                    ))}
                                </select>
                            ) : (
                                <p className="text-lg text-white/90 mb-4">{user.branch}</p>
                            )}

                            <div className="flex flex-wrap gap-3 justify-center md:justify-start mt-4">
                                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                    <span className="text-sm font-medium">{user.hostel}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                    <span className="text-sm font-medium">{user.admissionNumber}</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={handleSave}
                                        className="px-6 py-2.5 bg-white text-primary rounded-lg font-medium hover:bg-white/90 transition-all shadow-lg flex items-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Save Changes
                                    </button>
                                    <button
                                        onClick={() => { setIsEditing(false); setFormData(user); }}
                                        className="px-6 py-2.5 bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-lg font-medium hover:bg-white/30 transition-all"
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-6 py-2.5 bg-white text-primary rounded-lg font-medium hover:bg-white/90 transition-all shadow-lg flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit Profile
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="bg-white dark:bg-dark-card rounded-xl shadow-lg overflow-hidden">
                <div className="flex border-b border-slate-200 dark:border-slate-700">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`flex-1 px-6 py-4 font-medium transition-all flex items-center justify-center gap-2 ${
                            activeTab === 'overview'
                                ? 'text-primary border-b-2 border-primary bg-primary/5'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('activity')}
                        className={`flex-1 px-6 py-4 font-medium transition-all flex items-center justify-center gap-2 ${
                            activeTab === 'activity'
                                ? 'text-primary border-b-2 border-primary bg-primary/5'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Activity
                    </button>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Personal Information Card */}
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-900 dark:text-blue-100">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Personal Information
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-medium text-blue-700 dark:text-blue-300">Email Address</label>
                                            {isEditing ? (
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email || ''}
                                                    onChange={handleInputChange}
                                                    className="w-full mt-1 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                                />
                                            ) : (
                                                <p className="text-sm text-slate-800 dark:text-white mt-1 flex items-center gap-2">
                                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                    {user.email}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-blue-700 dark:text-blue-300">Phone Number</label>
                                            {isEditing ? (
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={formData.phone || ''}
                                                    onChange={handleInputChange}
                                                    className="w-full mt-1 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                                    placeholder="Enter phone number"
                                                    maxLength={15}
                                                />
                                            ) : (
                                                <p className="text-sm text-slate-800 dark:text-white mt-1 flex items-center gap-2">
                                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                    </svg>
                                                    {user.phone}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Academic Information Card */}
                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-purple-900 dark:text-purple-100">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                        Academic Details
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-medium text-purple-700 dark:text-purple-300">Admission Number</label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    name="admissionNumber"
                                                    value={formData.admissionNumber || ''}
                                                    onChange={handleInputChange}
                                                    className="w-full mt-1 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                                />
                                            ) : (
                                                <p className="text-sm font-mono text-slate-800 dark:text-white mt-1 flex items-center gap-2">
                                                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    {user.admissionNumber}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-purple-700 dark:text-purple-300">Hostel</label>
                                            {isEditing ? (
                                                <select
                                                    name="hostel"
                                                    value={formData.hostel || ''}
                                                    onChange={handleInputChange}
                                                    className="w-full mt-1 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                                >
                                                    <option value="">Select a hostel...</option>
                                                    {HOSTEL_OPTIONS.map(hostel => (
                                                        <option key={hostel} value={hostel}>{hostel}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <p className="text-sm text-slate-800 dark:text-white mt-1 flex items-center gap-2">
                                                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                    </svg>
                                                    {user.hostel}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                                <button onClick={() => {
                                        const favoriteForms = allForms.filter(form => userFormsData?.favorites?.includes(form.formNumber));
                                        setModalData({ title: 'Saved Forms', data: favoriteForms, type: 'forms', link: '/college-forms', linkText: 'Forms' });
                                    }} className="w-full text-left group relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-4 md:p-5 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-105 active:scale-95">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="relative z-10 flex items-center justify-between">
                                        <div>
                                            <p className="text-green-100 text-xs md:text-sm font-medium mb-1">Saved Forms</p>
                                            <p className="text-2xl md:text-3xl font-black group-hover:scale-110 transition-transform origin-left">{savedFormsCount}</p>
                                        </div>
                                        <div className="bg-white/20 backdrop-blur-sm p-2 md:p-3 rounded-xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                                            <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                    </div>
                                </button>

                                <button onClick={() => {
                                        const userEvents = calendarData?.events.filter(e => e.userId === currentUser?.uid) ?? [];
                                        setModalData({ title: 'Your Events', data: userEvents, type: 'events', link: '/academic-calendar', linkText: 'Calendar' });
                                    }} className="w-full text-left group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4 md:p-5 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-105 active:scale-95">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="relative z-10 flex items-center justify-between">
                                        <div>
                                            <p className="text-blue-100 text-xs md:text-sm font-medium mb-1">Events</p>
                                            <p className="text-2xl md:text-3xl font-black group-hover:scale-110 transition-transform origin-left">{userAddedEventsCount}</p>
                                        </div>
                                        <div className="bg-white/20 backdrop-blur-sm p-2 md:p-3 rounded-xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                                            <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    </div>
                                </button>

                                <button onClick={() => {
                                    const reminderEvents = calendarData?.events.filter(event => reminderPreferences.includes(getEventKey(event))) ?? [];
                                    setModalData({ title: 'Active Reminders', data: reminderEvents, type: 'reminders', link: '/academic-calendar', linkText: 'Calendar' });
                                }} className="w-full text-left group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-4 md:p-5 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-105 active:scale-95">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="relative z-10 flex items-center justify-between">
                                        <div>
                                            <p className="text-purple-100 text-xs md:text-sm font-medium mb-1">Reminders</p>
                                            <p className="text-2xl md:text-3xl font-black group-hover:scale-110 transition-transform origin-left">{remindersCount}</p>
                                        </div>
                                        <div className="bg-white/20 backdrop-blur-sm p-2 md:p-3 rounded-xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                                            <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                            </svg>
                                        </div>
                                    </div>
                                </button>

                                <button onClick={() => {
                                    const userSavedPlaces = locations.filter(loc => savedPlaces.includes(loc.id));
                                    setModalData({ title: 'Saved Places', data: userSavedPlaces, type: 'places', link: '/campus-map', linkText: 'Map' });
                                }} className="w-full text-left group relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-4 md:p-5 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-105 active:scale-95">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="relative z-10 flex items-center justify-between">
                                        <div>
                                            <p className="text-orange-100 text-xs md:text-sm font-medium mb-1">Saved Places</p>
                                            <p className="text-2xl md:text-3xl font-black group-hover:scale-110 transition-transform origin-left">{savedPlacesCount}</p>
                                        </div>
                                        <div className="bg-white/20 backdrop-blur-sm p-2 md:p-3 rounded-xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                                            <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'activity' && (
                       <div className="space-y-4">
                            <div className="flex flex-col gap-4">
                                {/* Header */}
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold">Recent Activity</h3>
                                </div>

                                {/* Search, Filter, and Sort Controls */}
                                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-3">
                                    {/* Search Bar */}
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={activitySearch}
                                            onChange={(e) => setActivitySearch(e.target.value)}
                                            placeholder="Search activities..."
                                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                                        />
                                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        {activitySearch && (
                                            <button
                                                onClick={() => setActivitySearch('')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>

                                    {/* Filter and Sort Row */}
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        {/* Filter by Type */}
                                        <div className="flex-1">
                                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Filter by Type</label>
                                            <select
                                                value={activityFilterType} 
                                                onChange={(e) => setActivityFilterType(e.target.value)}
                                                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm"
                                            >
                                                {activityTypes.map((type: string) => (
                                                    <option key={type} value={type}>
                                                        {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Sort By */}
                                        <div className="flex-1">
                                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Sort By</label>
                                            <select
                                                value={activitySortBy}
                                                onChange={(e) => setActivitySortBy(e.target.value as 'recent' | 'oldest' | 'type')}
                                                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm"
                                            >
                                                <option value="recent">Most Recent</option>
                                                <option value="oldest">Oldest First</option>
                                                <option value="type">By Type</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Results Count */}
                                    {(activitySearch || activityFilterType !== 'all') && (
                                        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                {filteredAndSortedActivities.length} {filteredAndSortedActivities.length === 1 ? 'result' : 'results'} found
                                            </p>
                                            {(activitySearch || activityFilterType !== 'all') && (
                                                <button
                                                    onClick={() => {
                                                        setActivitySearch('');
                                                        setActivityFilterType('all');
                                                        setActivitySortBy('recent');
                                                    }}
                                                    className="text-sm text-primary hover:text-primary-dark font-medium flex items-center gap-1"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                    </svg>
                                                    Clear All
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {activityLoading ? (
                                <div className="text-center py-8">
                                    <div className="w-8 h-8 border-2 border-t-transparent border-primary rounded-full animate-spin mx-auto"></div>
                                    <p className="mt-2 text-sm text-slate-500">Loading activity...</p>
                                </div>
                            ) : filteredAndSortedActivities.length > 0 ? (
                                <>
                                    <div className="space-y-2">
                                        {(showAllActivity ? filteredAndSortedActivities : filteredAndSortedActivities.slice(0, 10)).map((activityItem: ActivityItem) => {
                                            const content = (
                                                <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:shadow-md transition-all w-full">
                                                    <div className="text-2xl pt-1">{activityItem.icon}</div>
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-slate-900 dark:text-white">{activityItem.title}</h4>
                                                        <p className="text-sm text-slate-600 dark:text-slate-400">{activityItem.description}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">{formatTimeAgo(activityItem.timestamp)}</p>
                                                    </div>
                                                    <span className={`self-start px-2 py-1 text-xs font-medium rounded-full ${
                                                        activityItem.type === 'reminder' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                                                        activityItem.type === 'form' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                        activityItem.type === 'event' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                        activityItem.type === 'login' || activityItem.type === 'logout' ? 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' :
                                                        'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                                    }`}>
                                                        {activityItem.type}
                                                    </span>
                                                </div>
                                            );

                                            return activityItem.link ? (
                                                <Link to={activityItem.link} key={activityItem.id} className="block">
                                                    {content}
                                                </Link>
                                            ) : (
                                                <div key={activityItem.id}>
                                                    {content}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    
                                    {filteredAndSortedActivities.length > 10 && (
                                        <div className="text-center pt-4">
                                            <button
                                                onClick={() => setShowAllActivity(!showAllActivity)}
                                                className="text-sm text-primary hover:text-primary-dark font-medium flex items-center gap-1 transition-colors mx-auto"
                                            >
                                                {showAllActivity ? (
                                                    <>
                                                        <span>Show Less</span>
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                        </svg>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>View All ({filteredAndSortedActivities.length})</span>
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="text-slate-400 mb-3">
                                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 12h.01M12 12h.01M12 12h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                                        {activitySearch || activityFilterType !== 'all'
                                            ? 'No activities found matching your criteria'
                                            : 'No recent activity to display'}
                                    </p>
                                    {(activitySearch || activityFilterType !== 'all') && (
                                        <button
                                            onClick={() => {
                                                setActivitySearch('');
                                                setActivityFilterType('all');
                                            }}
                                            className="mt-4 text-primary hover:text-primary-dark font-medium"
                                        >
                                            Clear filters
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Expanded Image Modal */}
            {isImageExpanded && user.profilePicture && (
                <div
                    className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out ${showModalContent ? 'opacity-100' : 'opacity-0'}`}
                    onClick={closeModal}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Expanded profile picture view"
                >
                    {/* Full-screen blurred background of the same image */}
                    <img
                        src={user.profilePicture}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover filter blur-xl scale-110"
                    />
                    {/* Semi-transparent overlay for contrast */}
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
            
                    <button
                        className="absolute top-6 right-6 text-white/70 hover:text-white hover:scale-110 transition-all z-[101]"
                        aria-label="Close image view"
                        onClick={closeModal}
                    >
                        <X size={32} />
                    </button>
                    <div
                        className={`relative transition-all duration-300 ease-out ${showModalContent ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={user.profilePicture}
                            alt="Expanded profile"
                            className="w-[70vmin] h-[70vmin] max-w-lg max-h-lg object-cover rounded-full shadow-2xl ring-4 ring-white/20"
                        />
                    </div>
                </div>
            )}
            
            {/* Data Modal */}
            {modalData && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity duration-300" onClick={() => setModalData(null)} role="dialog" aria-modal="true">
                    <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all max-h-[90vh] flex flex-col" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center flex-shrink-0">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{modalData.title}</h2>
                            <button onClick={() => setModalData(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-3 overflow-y-auto">
                            {modalData.data.length === 0 ? (
                                <p className="text-center text-slate-500 dark:text-slate-400 py-8">No items to display.</p>
                            ) : modalData.type === 'forms' ? (
                                modalData.data.map((form: Form) => (
                                    <div key={form.formNumber} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                        <div>
                                            <p className="font-semibold text-slate-800 dark:text-white">{form.title}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Form No: {form.formNumber}</p>
                                        </div>
                                        <a href={form.downloadLink} target="_blank" rel="noopener noreferrer" onClick={() => addRecentDownload(form)} className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary-dark transition-colors">
                                            <Download className="w-4 h-4" /> Download
                                        </a>
                                    </div>
                                ))
                            ) : modalData.type === 'events' ? (
                                modalData.data.map((event: CalendarEvent) => (
                                    <div key={event.id} className="flex items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                        <Calendar className="w-5 h-5 mr-3 text-primary" />
                                        <div>
                                            <p className="font-semibold text-slate-800 dark:text-white">{event.description}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(event.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))
                            ) : modalData.type === 'reminders' ? (
                                modalData.data.map((event: CalendarEvent) => (
                                    <div key={getEventKey(event)} className="flex items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                        <Bell className="w-5 h-5 mr-3 text-primary" />
                                        <div>
                                            <p className="font-semibold text-slate-800 dark:text-white">{event.description}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(event.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))
                            ) : modalData.type === 'places' ? (
                                modalData.data.map((place: CampusLocation) => (
                                     <div key={place.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{place.icon}</span>
                                            <div>
                                                <p className="font-semibold text-slate-800 dark:text-white">{place.name}</p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">{place.category}</p>
                                            </div>
                                        </div>
                                        <a href={`https://www.google.com/maps/search/?api=1&query=${place.coordinates.lat},${place.coordinates.lng}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary-dark transition-colors">
                                            <MapPin className="w-4 h-4" /> Directions
                                        </a>
                                    </div>
                                ))
                            ) : null}
                        </div>

                        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0 text-center">
                            <Link to={modalData.link} onClick={() => setModalData(null)} className="text-sm font-medium text-primary hover:underline">
                                View all in {modalData.linkText} page →
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
