import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { useUser } from '../contexts/UserContext';
import { HOSTEL_OPTIONS, BRANCH_OPTIONS } from '../data/profileOptions';

const Profile: React.FC = () => {
    const { user, updateUser, loading } = useUser();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<User>>({});

    useEffect(() => {
        if (user) {
            setFormData(user);
        }
    }, [user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        updateUser(formData);
        setIsEditing(false);
    };

    if (loading || !user) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-16 h-16 border-4 border-t-transparent border-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Student Profile</h1>
            <div className="bg-white dark:bg-dark-card p-8 rounded-lg shadow-lg">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                    <img
                        className="h-32 w-32 rounded-full ring-4 ring-primary"
                        src={`https://picsum.photos/seed/${user.id}/200`}
                        alt="Profile"
                    />
                    <div className="flex-1 w-full">
                        <div className="flex justify-between items-center mb-1">
                             {isEditing ? (
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name || ''}
                                    onChange={handleInputChange}
                                    className="text-2xl font-bold bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary flex-grow mr-4"
                                />
                            ) : (
                                <h2 className="text-2xl font-bold">{user.name}</h2>
                            )}
                            {isEditing ? (
                                <div className="space-x-2 flex-shrink-0">
                                    <button onClick={() => { setIsEditing(false); setFormData(user); }} className="px-4 py-2 text-sm rounded-lg bg-slate-200 dark:bg-slate-600">Cancel</button>
                                    <button onClick={handleSave} className="px-4 py-2 text-sm rounded-lg bg-primary text-white">Save</button>
                                </div>
                            ) : (
                                <button onClick={() => setIsEditing(true)} className="px-4 py-2 text-sm rounded-lg bg-primary/10 text-primary dark:bg-secondary/20 dark:text-secondary">Edit</button>
                            )}
                        </div>
                        
                        {isEditing ? (
                            <select
                                name="branch"
                                value={formData.branch || ''}
                                onChange={handleInputChange}
                                className="w-full text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="" disabled>Select a branch...</option>
                                {BRANCH_OPTIONS.map(branch => (
                                    <option key={branch} value={branch}>{branch}</option>
                                ))}
                            </select>
                        ) : (
                             <p className="text-slate-500 dark:text-slate-400">{user.branch}</p>
                        )}


                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Admission Number</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="admissionNumber"
                                        value={formData.admissionNumber || ''}
                                        onChange={handleInputChange}
                                        className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                ) : (
                                    <p className="text-lg text-slate-800 dark:text-white">{user.admissionNumber}</p>
                                )}
                            </div>
                           <div>
                                <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Hostel</label>
                                {isEditing ? (
                                    <select
                                        name="hostel"
                                        value={formData.hostel || ''}
                                        onChange={handleInputChange}
                                        className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="" disabled>Select a hostel...</option>
                                        {HOSTEL_OPTIONS.map(hostel => (
                                            <option key={hostel} value={hostel}>{hostel}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <p className="text-lg text-slate-800 dark:text-white">{user.hostel}</p>
                                )}
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Email Address</label>
                                {isEditing ? (
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email || ''}
                                        onChange={handleInputChange}
                                        className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                ) : (
                                    <p className="text-lg text-slate-800 dark:text-white">{user.email}</p>
                                )}
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Phone Number</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="phone"
                                        value={formData.phone || ''}
                                        onChange={handleInputChange}
                                        className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                ) : (
                                    <p className="text-lg text-slate-800 dark:text-white">{user.phone}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
