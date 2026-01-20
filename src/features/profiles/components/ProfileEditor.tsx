import React, { useState, useRef } from 'react';
import { useUser } from '@/contexts/UserContext';
import { User, SocialLinks } from '@/types';
import { Loader2, Save, Github, Linkedin, Instagram, Twitter, Globe, X, Camera } from 'lucide-react';

interface ProfileEditorProps {
    initialData: User;
    onClose: () => void;
    onSave: () => void;
}

export const ProfileEditor: React.FC<ProfileEditorProps> = ({ initialData, onClose, onSave }) => {
    const { updateUser, uploadProfilePicture, loading: userLoading } = useUser();

    // Form State
    const [bio, setBio] = useState(initialData.bio || '');
    const [interests, setInterests] = useState<string[]>(initialData.interests || []);
    const [newInterest, setNewInterest] = useState('');
    const [socialLinks, setSocialLinks] = useState<SocialLinks>(initialData.socialLinks || {});
    const [saving, setSaving] = useState(false);

    // Image Upload State
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateUser({
                bio,
                interests,
                socialLinks
            });
            onSave();
            onClose();
        } catch (error) {
            console.error('Error updating profile:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Simple preview immediately
        const objectUrl = URL.createObjectURL(file);
        setPreviewImage(objectUrl);
        setIsUploadingImage(true);

        try {
            await uploadProfilePicture(file);
            // Success! The context updates the user object, so the parent might refresh.
        } catch (error) {
            console.error('Failed to upload image', error);
            // Revert preview on error? 
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Profile</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-8">
                    {/* Avatar Upload Section */}
                    <div className="flex flex-col items-center">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-gray-700 shadow-lg bg-gray-100">
                                <img
                                    src={previewImage || initialData.profilePicture}
                                    className={`w-full h-full object-cover transition-opacity ${isUploadingImage ? 'opacity-50' : ''}`}
                                    alt="Profile"
                                />
                            </div>
                            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="text-white" size={24} />
                            </div>
                            {isUploadingImage && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 className="animate-spin text-white" size={24} />
                                </div>
                            )}
                        </div>
                        <button
                            className="mt-2 text-sm text-blue-600 font-medium hover:underline"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            Change Photo
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            hidden
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={isUploadingImage}
                        />
                    </div>

                    {/* Bio Section */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bio</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            className="w-full rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
                            placeholder="Tell us about yourself..."
                            maxLength={160}
                        />
                        <p className="text-xs text-gray-500 mt-1 text-right">{bio.length}/160</p>
                    </div>

                    {/* Interests Section */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Interests</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {interests.map(interest => (
                                <span key={interest} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                    {interest}
                                    <button onClick={() => removeInterest(interest)} className="ml-1.5 hover:text-red-500">
                                        <X size={14} />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newInterest}
                                onChange={(e) => setNewInterest(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addInterest()}
                                className="flex-1 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Add an interest (e.g., Coding, Music)"
                            />
                            <button
                                onClick={addInterest}
                                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600"
                            >
                                Add
                            </button>
                        </div>
                    </div>

                    {/* Social Links Section */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Social Links</label>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <Github size={20} className="text-gray-600 dark:text-gray-400" />
                                <input
                                    type="text"
                                    value={socialLinks.github || ''}
                                    onChange={(e) => setSocialLinks({ ...socialLinks, github: e.target.value })}
                                    className="flex-1 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    placeholder="GitHub Profile URL"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <Linkedin size={20} className="text-blue-600" />
                                <input
                                    type="text"
                                    value={socialLinks.linkedin || ''}
                                    onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
                                    className="flex-1 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    placeholder="LinkedIn Profile URL"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <Instagram size={20} className="text-pink-600" />
                                <input
                                    type="text"
                                    value={socialLinks.instagram || ''}
                                    onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                                    className="flex-1 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    placeholder="Instagram Profile URL"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <Twitter size={20} className="text-sky-500" />
                                <input
                                    type="text"
                                    value={socialLinks.twitter || ''}
                                    onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                                    className="flex-1 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    placeholder="Twitter/X Profile URL"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <Globe size={20} className="text-gray-600 dark:text-gray-400" />
                                <input
                                    type="text"
                                    value={socialLinks.website || ''}
                                    onChange={(e) => setSocialLinks({ ...socialLinks, website: e.target.value })}
                                    className="flex-1 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    placeholder="Portfolio/Website URL"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};
