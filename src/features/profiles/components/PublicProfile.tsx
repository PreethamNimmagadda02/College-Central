import React from 'react';
import { User } from '@/types';
import { Github, Linkedin, Instagram, Twitter, Globe, MapPin, Mail } from 'lucide-react';

interface PublicProfileProps {
    user: User;
    isOwnProfile?: boolean;
    onEdit?: () => void;
}

// Frame options copied from Profile.tsx for consistency
const FRAME_OPTIONS = [
    { id: 'none', name: 'None', class: 'ring-4 ring-white/50 rounded-full' },
    {
        id: 'gradient-blue',
        name: 'Ocean',
        class: 'p-1 bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 rounded-full',
    },
    {
        id: 'gradient-purple',
        name: 'Nebula',
        class: 'p-1 bg-gradient-to-br from-fuchsia-500 via-purple-600 to-indigo-500 shadow-lg shadow-purple-500/30 rounded-full',
    },
    {
        id: 'gradient-gold',
        name: 'Gold',
        class: 'p-1 bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-700 shadow-lg shadow-yellow-500/40 border border-yellow-300 rounded-full',
    },
    {
        id: 'neon-green',
        name: 'Cyber',
        class: 'ring-4 ring-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.6)] bg-black rounded-full',
    },
    {
        id: 'royal',
        name: 'Royal',
        class: 'p-1 bg-gradient-to-tr from-amber-700 via-yellow-500 to-amber-700 shadow-xl border border-yellow-600 rounded-full',
    },
    {
        id: 'holographic',
        name: 'Holo',
        class: 'p-1 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 animate-gradient-x shadow-lg rounded-full',
    },
    {
        id: 'neon-blue',
        name: 'Tron',
        class: 'ring-4 ring-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.6)] bg-slate-900 rounded-full',
    },
    {
        id: 'minimal',
        name: 'Minimal',
        class: 'ring-1 ring-white/80 offset-4 offset-black rounded-full',
    },
];

export const PublicProfile: React.FC<PublicProfileProps> = ({ user, isOwnProfile, onEdit }) => {
    const getFrameClass = (frameId?: string) => {
        const frame = FRAME_OPTIONS.find((f) => f.id === frameId);
        return frame ? frame.class : 'ring-4 ring-white/50 rounded-full';
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((word) => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
            {/* Header Section */}
            <div className="relative group/banner">
                {/* Banner Image */}
                <div
                    className={`h-48 md:h-64 w-full transition-all duration-700 ${user.bannerGradient || 'bg-gradient-to-r from-blue-600 to-violet-600'}`}
                >
                    {/* Overlay for better text readability */}
                    <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]"></div>

                    {/* Default Pattern if no banner */}
                    {!user.bannerGradient && (
                        <div className="absolute inset-0 opacity-20">
                            <div
                                className="absolute inset-0"
                                style={{
                                    backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                                    backgroundSize: '1.5rem 1.5rem',
                                }}
                            ></div>
                        </div>
                    )}
                </div>

                {/* Edit Button (Absolute Top Right for symmetry) */}
                {isOwnProfile && (
                    <div className="absolute top-4 right-4 z-20 animate-in fade-in duration-700 delay-500">
                        <button
                            onClick={onEdit}
                            className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 rounded-full text-xs font-semibold text-white transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Edit
                        </button>
                    </div>
                )}

                <div className="px-6 pb-12 relative flex flex-col items-center text-center">
                    {/* Profile Picture */}
                    <div className="-mt-20 md:-mt-24 mb-6 relative shrink-0 animate-in slide-in-from-bottom-8 duration-700 delay-150 z-10">
                        <div className={`relative ${getFrameClass(user.profileFrame)} bg-white dark:bg-gray-900 transition-transform duration-300 hover:scale-105`}>
                            {user.profilePicture ? (
                                <img
                                    src={user.profilePicture}
                                    alt={user.name}
                                    className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white dark:border-gray-900 shadow-md"
                                />
                            ) : (
                                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center text-4xl font-bold text-gray-400 dark:text-gray-500 border-4 border-white dark:border-gray-900 shadow-md">
                                    {getInitials(user.name)}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Name and Basic Info */}
                    <div className="w-full max-w-2xl animate-in slide-in-from-bottom-8 duration-700 delay-200">
                        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
                            {user.name}
                        </h1>
                        <div className="flex flex-wrap items-center justify-center gap-3 text-gray-500 dark:text-gray-400 font-medium text-lg">
                            <span className="px-4 py-1 bg-gray-50 dark:bg-gray-800/80 rounded-full text-base border border-gray-100 dark:border-gray-700">
                                {user.branch}
                            </span>
                            <span className="hidden md:inline w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                            <span className="font-mono text-base opacity-90 tracking-wide">{user.admissionNumber}</span>
                        </div>
                    </div>

                    {/* Bio */}
                    {user.bio && (
                        <div className="mt-8 max-w-xl animate-in slide-in-from-bottom-4 duration-700 delay-300">
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg font-light italic">
                                "{user.bio}"
                            </p>
                        </div>
                    )}

                    {/* Info Chips (Centered Row) */}
                    <div className="flex flex-wrap justify-center gap-4 mt-8 animate-in slide-in-from-bottom-4 duration-700 delay-400">
                        {user.hostel && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 px-4 py-2 rounded-full border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
                                <MapPin size={16} className="text-rose-500" />
                                <span className="text-sm font-medium">{user.hostel}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 px-4 py-2 rounded-full border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
                            <Mail size={16} className="text-indigo-500" />
                            <span className="text-sm font-medium">{user.email}</span>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="w-24 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent my-10"></div>

                    {/* Social Links */}
                    {user.socialLinks && Object.values(user.socialLinks).some(link => link) && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-700 delay-500">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Connect</h3>
                            <div className="flex flex-wrap justify-center gap-4">
                                {user.socialLinks.github && (
                                    <a href={user.socialLinks.github} target="_blank" rel="noopener noreferrer" className="size-14 flex items-center justify-center bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-2xl hover:scale-110 hover:-rotate-3 hover:bg-[#24292e] hover:text-white dark:hover:bg-white dark:hover:text-[#24292e] shadow-sm hover:shadow-xl transition-all duration-300">
                                        <Github size={26} />
                                    </a>
                                )}
                                {user.socialLinks.linkedin && (
                                    <a href={user.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="size-14 flex items-center justify-center bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-2xl hover:scale-110 hover:-rotate-3 hover:bg-[#0077b5] hover:text-white transition-all duration-300 hover:shadow-xl hover:shadow-[#0077b5]/20">
                                        <Linkedin size={26} />
                                    </a>
                                )}
                                {user.socialLinks.twitter && (
                                    <a href={user.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="size-14 flex items-center justify-center bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-2xl hover:scale-110 hover:-rotate-3 hover:bg-[#1DA1F2] hover:text-white transition-all duration-300 hover:shadow-xl hover:shadow-[#1DA1F2]/20">
                                        <Twitter size={26} />
                                    </a>
                                )}
                                {user.socialLinks.instagram && (
                                    <a href={user.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="size-14 flex items-center justify-center bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-2xl hover:scale-110 hover:-rotate-3 hover:bg-gradient-to-tr hover:from-yellow-400 hover:via-red-500 hover:to-purple-500 hover:text-white transition-all duration-300 hover:shadow-xl hover:shadow-pink-500/20">
                                        <Instagram size={26} />
                                    </a>
                                )}
                                {user.socialLinks.website && (
                                    <a href={user.socialLinks.website} target="_blank" rel="noopener noreferrer" className="size-14 flex items-center justify-center bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-2xl hover:scale-110 hover:-rotate-3 hover:bg-emerald-500 hover:text-white transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/20">
                                        <Globe size={26} />
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Interests */}
                    {user.interests && user.interests.length > 0 && (
                        <div className="mt-12 animate-in slide-in-from-bottom-4 duration-700 delay-500">
                            <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
                                {user.interests.map(interest => (
                                    <span key={interest} className="px-5 py-2 bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/50 text-gray-600 dark:text-gray-300 rounded-full text-sm font-medium shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 cursor-default">
                                        {interest}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
