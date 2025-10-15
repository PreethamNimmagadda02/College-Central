import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { useUser } from '../contexts/UserContext';
import { useAuth } from '../hooks/useAuth';
import { HOSTEL_OPTIONS, BRANCH_OPTIONS } from '../data/profileOptions';

interface ActivityItem {
    id: string;
    type: 'event' | 'reminder' | 'form' | 'update';
    title: string;
    description: string;
    timestamp: string;
    icon: string;
}

const Profile: React.FC = () => {
    const { user, updateUser, loading } = useUser();
    const { currentUser, logout } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<User>>({});
    const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'settings'>('overview');
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [imageError, setImageError] = useState(false);

    // Mock activity data - in real app, this would come from backend
    const recentActivity: ActivityItem[] = [
        {
            id: '1',
            type: 'reminder',
            title: 'Mid-Sem Exams',
            description: 'Upcoming in 5 days',
            timestamp: '2 hours ago',
            icon: '📚'
        },
        {
            id: '2',
            type: 'form',
            title: 'Downloaded Scholarship Form',
            description: 'From College Forms section',
            timestamp: '1 day ago',
            icon: '📄'
        },
        {
            id: '3',
            type: 'event',
            title: 'Added Personal Event',
            description: 'Project Submission - CS301',
            timestamp: '2 days ago',
            icon: '📅'
        },
        {
            id: '4',
            type: 'update',
            title: 'Profile Updated',
            description: 'Changed hostel information',
            timestamp: '1 week ago',
            icon: '✏️'
        }
    ];

    useEffect(() => {
        if (user) {
            setFormData(user);
        }
    }, [user]);

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
                        <div className="relative group">
                            {imageError || !currentUser?.photoURL ? (
                                <div className="h-32 w-32 rounded-full bg-white text-primary flex items-center justify-center text-4xl font-bold ring-4 ring-white/50 shadow-xl">
                                    {getInitials(user.name)}
                                </div>
                            ) : (
                                <img
                                    className="h-32 w-32 rounded-full ring-4 ring-white/50 shadow-xl object-cover"
                                    src={currentUser.photoURL}
                                    alt="Profile"
                                    onError={() => setImageError(true)}
                                />
                            )}
                            {isEditing && (
                                <button className="absolute bottom-0 right-0 bg-white text-primary p-2 rounded-full shadow-lg hover:shadow-xl transition-all">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </button>
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
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`flex-1 px-6 py-4 font-medium transition-all flex items-center justify-center gap-2 ${
                            activeTab === 'settings'
                                ? 'text-primary border-b-2 border-primary bg-primary/5'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
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
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-4 shadow-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-green-100 text-xs">Saved Forms</p>
                                            <p className="text-2xl font-bold">12</p>
                                        </div>
                                        <svg className="w-10 h-10 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4 shadow-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-blue-100 text-xs">Events</p>
                                            <p className="text-2xl font-bold">8</p>
                                        </div>
                                        <svg className="w-10 h-10 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-4 shadow-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-purple-100 text-xs">Reminders</p>
                                            <p className="text-2xl font-bold">5</p>
                                        </div>
                                        <svg className="w-10 h-10 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-4 shadow-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-orange-100 text-xs">Saved Places</p>
                                            <p className="text-2xl font-bold">6</p>
                                        </div>
                                        <svg className="w-10 h-10 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'activity' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Recent Activity</h3>
                                <button className="text-sm text-primary hover:underline">View All</button>
                            </div>
                            {recentActivity.map(activity => (
                                <div key={activity.id} className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:shadow-md transition-all">
                                    <div className="text-3xl">{activity.icon}</div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-slate-900 dark:text-white">{activity.title}</h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">{activity.description}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">{activity.timestamp}</p>
                                    </div>
                                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                        activity.type === 'reminder' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                                        activity.type === 'form' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                        activity.type === 'event' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                        'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                    }`}>
                                        {activity.type}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="space-y-6">
                            {/* Account Settings */}
                            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    Account Settings
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-700 rounded-lg">
                                        <div>
                                            <p className="font-medium">Email Notifications</p>
                                            <p className="text-sm text-slate-500">Receive email updates about events</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" defaultChecked />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-700 rounded-lg">
                                        <div>
                                            <p className="font-medium">Calendar Reminders</p>
                                            <p className="text-sm text-slate-500">Get notified about upcoming events</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" defaultChecked />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-700 rounded-lg">
                                        <div>
                                            <p className="font-medium">Dark Mode</p>
                                            <p className="text-sm text-slate-500">Toggle dark mode theme</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Privacy & Security */}
                            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    Privacy & Security
                                </h3>
                                <div className="space-y-3">
                                    <button className="w-full text-left p-3 bg-white dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-all flex items-center justify-between">
                                        <span className="font-medium">Change Password</span>
                                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                    <button className="w-full text-left p-3 bg-white dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-all flex items-center justify-between">
                                        <span className="font-medium">Two-Factor Authentication</span>
                                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                    <button className="w-full text-left p-3 bg-white dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-all flex items-center justify-between">
                                        <span className="font-medium">Privacy Settings</span>
                                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Danger Zone */}
                            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border border-red-200 dark:border-red-800">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-900 dark:text-red-100">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    Danger Zone
                                </h3>
                                <div className="space-y-3">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full p-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        Logout
                                    </button>
                                    <button className="w-full p-3 bg-white dark:bg-slate-700 border-2 border-red-500 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                                        Delete Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
                    notification.type === 'success'
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                } animate-slide-in-right`}>
                    <div className="flex items-center gap-2">
                        {notification.type === 'success' ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                        <span className="font-medium">{notification.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
};
 
export default Profile;