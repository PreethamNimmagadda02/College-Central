import React, { useState, useRef, useEffect } from 'react';
import { User, SocialLinks } from '@/types';
import { Github, Linkedin, Instagram, Twitter, Globe, MapPin, Mail, Camera, Save, X, Loader2 } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'sonner';

interface PublicProfileProps {
    user: User;
    isOwnProfile?: boolean;
    onEdit?: () => void; // Triggered when entering edit mode, if needed by parent
    isEditing?: boolean; // Controlled by parent
    onSave?: () => void; // Triggered after successful save
    onCancel?: () => void; // Triggered on cancel
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

export const PublicProfile: React.FC<PublicProfileProps> = ({
    user,
    isOwnProfile,
    onEdit,
    isEditing: parentIsEditing,
    onSave,
    onCancel
}) => {
    const { updateUser, uploadProfilePicture } = useUser();

    // Local state for editing form
    const [bio, setBio] = useState(user.bio || '');
    const [interests, setInterests] = useState<string[]>(user.interests || []);
    const [newInterest, setNewInterest] = useState('');
    const [socialLinks, setSocialLinks] = useState<SocialLinks>(user.socialLinks || {});
    const [saving, setSaving] = useState(false);

    // Image upload state
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync state when entering edit mode
    useEffect(() => {
        if (parentIsEditing) {
            setBio(user.bio || '');
            setInterests(user.interests || []);
            setSocialLinks(user.socialLinks || {});
            setPreviewImage(null);
        }
    }, [parentIsEditing, user]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateUser({
                bio,
                interests,
                socialLinks
            });
            toast.success('Profile updated successfully!');
            onSave?.();
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const objectUrl = URL.createObjectURL(file);
        setPreviewImage(objectUrl);
        setIsUploadingImage(true);

        try {
            await uploadProfilePicture(file);
            toast.success('Profile picture updated!');
        } catch (error) {
            console.error('Failed to upload image', error);
            toast.error('Failed to upload image.');
            setPreviewImage(null);
        } finally {
            setIsUploadingImage(false);
        }
    };

    const addInterest = () => {
        if (newInterest.trim() && !interests.includes(newInterest.trim())) {
            setInterests([...interests, newInterest.trim()]);
            setNewInterest('');
        }
    };

    const removeInterest = (interest: string) => {
        setInterests(interests.filter(i => i !== interest));
    };

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
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in-95 duration-500 relative">

            {/* Edit/Save/Cancel Controls */}
            {isOwnProfile && (
                <div className="absolute top-4 right-4 z-50 flex gap-2 animate-in fade-in duration-300">
                    {parentIsEditing ? (
                        <>
                            <button
                                onClick={onCancel}
                                disabled={saving}
                                className="px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-600 rounded-full text-xs font-semibold text-gray-700 dark:text-gray-300 shadow-sm hover:bg-white dark:hover:bg-gray-700 transition-all flex items-center gap-2"
                            >
                                <X size={14} />
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white border border-transparent rounded-full text-xs font-semibold shadow-md transition-all flex items-center gap-2"
                            >
                                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                Save Changes
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onEdit}
                            className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 rounded-full text-xs font-semibold text-white transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Edit Profile
                        </button>
                    )}
                </div>
            )}

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

                <div className="px-6 pb-12 relative flex flex-col items-center text-center">
                    {/* Profile Picture with Edit Overlay */}
                    <div className="-mt-20 md:-mt-24 mb-6 relative shrink-0 animate-in slide-in-from-bottom-8 duration-700 delay-150 z-10 group/avatar">
                        <div
                            className={`relative ${getFrameClass(user.profileFrame)} bg-white dark:bg-gray-900 transition-transform duration-300 ${parentIsEditing ? 'scale-105 ring-4 ring-blue-500/30' : 'hover:scale-105'} cursor-pointer`}
                            onClick={() => parentIsEditing && fileInputRef.current?.click()}
                        >
                            {/* Edit Overlay */}
                            {parentIsEditing && (
                                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity backdrop-blur-[2px]">
                                    <Camera className="w-8 h-8 text-white drop-shadow-md" />
                                </div>
                            )}

                            {/* Loading Overlay */}
                            {isUploadingImage && (
                                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 rounded-full backdrop-blur-sm">
                                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                                </div>
                            )}

                            {previewImage || user.profilePicture ? (
                                <img
                                    src={previewImage || user.profilePicture}
                                    alt={user.name}
                                    className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white dark:border-gray-900 shadow-md"
                                />
                            ) : (
                                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center text-4xl font-bold text-gray-400 dark:text-gray-500 border-4 border-white dark:border-gray-900 shadow-md">
                                    {getInitials(user.name)}
                                </div>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageUpload}
                                disabled={isUploadingImage}
                            />
                        </div>
                        {parentIsEditing && !isUploadingImage && (
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black/60 text-white text-[10px] rounded-full backdrop-blur-md whitespace-nowrap opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                                Change Photo
                            </div>
                        )}
                    </div>

                    {/* Name and Basic Info (Read Only) */}
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

                    {/* Bio (Editable) */}
                    <div className="mt-8 w-full max-w-xl animate-in slide-in-from-bottom-4 duration-700 delay-300">
                        {parentIsEditing ? (
                            <div className="relative group">
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="Tell us about yourself..."
                                    className="w-full min-h-[100px] p-4 text-center text-lg bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-0 transition-all resize-none italic text-gray-700 dark:text-gray-300"
                                    maxLength={160}
                                />
                                <div className="absolute bottom-2 right-4 text-xs text-gray-400 pointer-events-none">
                                    {bio.length}/160
                                </div>
                            </div>
                        ) : (
                            user.bio && (
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg font-light italic">
                                    "{user.bio}"
                                </p>
                            )
                        )}
                    </div>

                    {/* Info Chips (Centered Row - Read Only as sourced from User object) */}
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

                    {/* Social Links (Editable) */}
                    <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-700 delay-500 w-full max-w-2xl">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Connect</h3>

                        {parentIsEditing ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <Github size={20} className="text-gray-600 dark:text-gray-400 shrink-0" />
                                    <input
                                        value={socialLinks.github || ''}
                                        onChange={e => setSocialLinks({ ...socialLinks, github: e.target.value })}
                                        placeholder="GitHub URL"
                                        className="bg-transparent border-none focus:ring-0 w-full text-sm"
                                    />
                                </div>
                                <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <Linkedin size={20} className="text-[#0077b5] shrink-0" />
                                    <input
                                        value={socialLinks.linkedin || ''}
                                        onChange={e => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
                                        placeholder="LinkedIn URL"
                                        className="bg-transparent border-none focus:ring-0 w-full text-sm"
                                    />
                                </div>
                                <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <Twitter size={20} className="text-[#1DA1F2] shrink-0" />
                                    <input
                                        value={socialLinks.twitter || ''}
                                        onChange={e => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                                        placeholder="Twitter URL"
                                        className="bg-transparent border-none focus:ring-0 w-full text-sm"
                                    />
                                </div>
                                <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <Instagram size={20} className="text-pink-600 shrink-0" />
                                    <input
                                        value={socialLinks.instagram || ''}
                                        onChange={e => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                                        placeholder="Instagram URL"
                                        className="bg-transparent border-none focus:ring-0 w-full text-sm"
                                    />
                                </div>
                                <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 md:col-span-2">
                                    <Globe size={20} className="text-emerald-500 shrink-0" />
                                    <input
                                        value={socialLinks.website || ''}
                                        onChange={e => setSocialLinks({ ...socialLinks, website: e.target.value })}
                                        placeholder="Personal Website URL"
                                        className="bg-transparent border-none focus:ring-0 w-full text-sm"
                                    />
                                </div>
                            </div>
                        ) : (
                            user.socialLinks && Object.values(user.socialLinks).some(link => link) && (
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
                            )
                        )}
                    </div>

                    {/* Interests (Editable) */}
                    <div className="mt-12 animate-in slide-in-from-bottom-4 duration-700 delay-500 w-full max-w-2xl">
                        {(parentIsEditing || (user.interests && user.interests.length > 0)) && (
                            <div className="flex flex-col items-center">
                                {/* Only show title if editing or if there are interests */}
                                {(parentIsEditing || user.interests?.length > 0) && (
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center mb-4">Interests</h3>
                                )}

                                <div className="flex flex-wrap justify-center gap-2">
                                    {interests.map(interest => (
                                        <div key={interest} className="relative group">
                                            <span className="px-5 py-2 bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/50 text-gray-600 dark:text-gray-300 rounded-full text-sm font-medium shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 cursor-default flex items-center gap-2">
                                                {interest}
                                                {parentIsEditing && (
                                                    <button
                                                        onClick={() => removeInterest(interest)}
                                                        className="hover:text-red-500 transition-colors"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </span>
                                        </div>
                                    ))}

                                    {parentIsEditing && (
                                        <div className="flex items-center">
                                            <input
                                                value={newInterest}
                                                onChange={e => setNewInterest(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        addInterest();
                                                    }
                                                }}
                                                placeholder="Add interest..."
                                                className="px-4 py-2 bg-transparent border-b-2 border-dashed border-gray-300 dark:border-gray-600 text-sm focus:border-blue-500 focus:outline-none w-32 text-center"
                                            />
                                            <button
                                                onClick={addInterest}
                                                disabled={!newInterest.trim()}
                                                className="ml-2 p-1 text-blue-500 hover:bg-blue-50 rounded-full disabled:opacity-50"
                                            >
                                                <Save size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
