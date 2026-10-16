import {
  uploadHeroImage,
  deleteHeroImage,
  isValidImageFile,
  isValidFileSize,
  MAX_HERO_IMAGE_SIZE,
} from '@services/storageService';
import { AlertCircle, Building2, Check, ImageIcon, Loader2, Pencil, Trash2 } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { AdminHeader, AdminPageLayout } from './ui';
import { AdminConfigApi } from '../hooks/useAdminConfig';

type Props = Pick<AdminConfigApi, 'config' | 'updateCollegeInfo' | 'updateAppConstants'>;

const CollegeInfoEditor: React.FC<Props> = ({ config, updateCollegeInfo, updateAppConstants }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local state for editing (only saved on explicit save)
  const [localCollegeInfo, setLocalCollegeInfo] = useState(config.collegeInfo);
  const [localAppConstants, setLocalAppConstants] = useState(config.appConstants);

  // Sync local state when config changes from external source
  useEffect(() => {
    if (!isEditing) {
      setLocalCollegeInfo(config.collegeInfo);
      setLocalAppConstants(config.appConstants);
    }
  }, [config.collegeInfo, config.appConstants, isEditing]);

  const handleSave = () => {
    updateCollegeInfo(localCollegeInfo);
    updateAppConstants(localAppConstants);
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset to original values
    setLocalCollegeInfo(config.collegeInfo);
    setLocalAppConstants(config.appConstants);
    setIsEditing(false);
  };

  // Display values (from local state when editing, from config when viewing)
  const collegeInfo = isEditing ? localCollegeInfo : config.collegeInfo;
  const appConstants = isEditing ? localAppConstants : config.appConstants;

  return (
    <AdminPageLayout>
      {/* Header with Edit/Save/Cancel buttons */}
      <AdminHeader
        icon={Building2}
        title="College Information"
        subtitle={
          isEditing
            ? 'Make your changes and click Save to apply them'
            : 'Click Edit to modify college information'
        }
      >
        <div className="flex items-center gap-3">
          {isEditing ? (
            <>
              <button onClick={handleCancel} className="admin-btn admin-btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="admin-btn admin-btn-success flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Save Changes
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="admin-btn admin-btn-primary flex items-center gap-2"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>
      </AdminHeader>

      {/* College Names Section */}
      <div className={`admin-card ${isEditing ? 'border-blue-500/40' : ''}`}>
        <h3 className="text-lg font-semibold text-white mb-4">College Names</h3>
        <div className="space-y-4">
          <div>
            <label className="admin-label">Full Name</label>
            <input
              type="text"
              disabled={!isEditing}
              className={`admin-input ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
              value={collegeInfo.name.full}
              onChange={(e) =>
                setLocalCollegeInfo((prev) => ({
                  ...prev,
                  name: { ...prev.name, full: e.target.value },
                }))
              }
            />
          </div>
          <div>
            <label className="admin-label">Short Name</label>
            <input
              type="text"
              disabled={!isEditing}
              className={`admin-input ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
              value={collegeInfo.name.short}
              onChange={(e) =>
                setLocalCollegeInfo((prev) => ({
                  ...prev,
                  name: { ...prev.name, short: e.target.value },
                }))
              }
            />
          </div>
          <div>
            <label className="admin-label">Abbreviation</label>
            <input
              type="text"
              disabled={!isEditing}
              className={`admin-input ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
              value={collegeInfo.name.abbreviation}
              onChange={(e) =>
                setLocalCollegeInfo((prev) => ({
                  ...prev,
                  name: { ...prev.name, abbreviation: e.target.value },
                }))
              }
            />
          </div>
        </div>
      </div>

      {/* Email Settings Section */}
      <div className={`admin-card ${isEditing ? 'border-blue-500/40' : ''}`}>
        <h3 className="text-lg font-semibold text-white mb-4">Email Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="admin-label">Email Domain</label>
            <input
              type="text"
              disabled={!isEditing}
              className={`admin-input ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
              value={collegeInfo.email.domain}
              onChange={(e) =>
                setLocalCollegeInfo((prev) => ({
                  ...prev,
                  email: { ...prev.email, domain: e.target.value },
                }))
              }
            />
          </div>
          <div>
            <label className="admin-label">Allowed Domain (for login)</label>
            <input
              type="text"
              disabled={!isEditing}
              className={`admin-input ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
              value={collegeInfo.email.allowedDomain}
              onChange={(e) =>
                setLocalCollegeInfo((prev) => ({
                  ...prev,
                  email: { ...prev.email, allowedDomain: e.target.value },
                }))
              }
              placeholder="@example.edu"
            />
          </div>
        </div>
      </div>

      {/* Website Section */}
      <div className={`admin-card ${isEditing ? 'border-blue-500/40' : ''}`}>
        <h3 className="text-lg font-semibold text-white mb-4">Website</h3>
        <div className="space-y-4">
          <div>
            <label className="admin-label">Website URL</label>
            <input
              type="url"
              disabled={!isEditing}
              className={`admin-input ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
              value={collegeInfo.website.url}
              onChange={(e) =>
                setLocalCollegeInfo((prev) => ({
                  ...prev,
                  website: { ...prev.website, url: e.target.value },
                }))
              }
            />
          </div>
          <div>
            <label className="admin-label">Website Name</label>
            <input
              type="text"
              disabled={!isEditing}
              className={`admin-input ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
              value={collegeInfo.website.name}
              onChange={(e) =>
                setLocalCollegeInfo((prev) => ({
                  ...prev,
                  website: { ...prev.website, name: e.target.value },
                }))
              }
            />
          </div>
        </div>
      </div>

      {/* Location Section */}
      <div className={`admin-card ${isEditing ? 'border-blue-500/40' : ''}`}>
        <h3 className="text-lg font-semibold text-white mb-4">Location</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="admin-label">City</label>
            <input
              type="text"
              disabled={!isEditing}
              className={`admin-input ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
              value={collegeInfo.location.city}
              onChange={(e) =>
                setLocalCollegeInfo((prev) => ({
                  ...prev,
                  location: { ...prev.location, city: e.target.value },
                }))
              }
            />
          </div>
          <div>
            <label className="admin-label">State</label>
            <input
              type="text"
              disabled={!isEditing}
              className={`admin-input ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
              value={collegeInfo.location.state}
              onChange={(e) =>
                setLocalCollegeInfo((prev) => ({
                  ...prev,
                  location: { ...prev.location, state: e.target.value },
                }))
              }
            />
          </div>
          <div>
            <label className="admin-label">Country</label>
            <input
              type="text"
              disabled={!isEditing}
              className={`admin-input ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
              value={collegeInfo.location.country}
              onChange={(e) =>
                setLocalCollegeInfo((prev) => ({
                  ...prev,
                  location: { ...prev.location, country: e.target.value },
                }))
              }
            />
          </div>
        </div>
      </div>

      {/* Hero Image Section */}
      <div className={`admin-card ${isEditing ? 'border-blue-500/40' : ''}`}>
        <h3 className="text-lg font-semibold text-white mb-4">Login Page Hero Image</h3>
        <p className="text-sm text-slate-400 mb-4">
          This image is displayed as the background on the login page.
        </p>

        {/* Current Image Preview */}
        <div className="mb-4">
          <label className="admin-label mb-2">Current Image</label>
          <div className="relative w-full max-w-md aspect-video bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
            <img
              src={collegeInfo.heroImageUrl || '/iitism_banner_new.gif'}
              alt="Hero preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/iitism_banner_new.gif';
              }}
            />
            {!collegeInfo.heroImageUrl && (
              <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white/80">
                Default Image
              </div>
            )}
          </div>
        </div>

        {/* Upload Controls */}
        {isEditing && (
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                setUploadError(null);

                if (!isValidImageFile(file)) {
                  setUploadError(
                    'Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.'
                  );
                  return;
                }

                if (!isValidFileSize(file)) {
                  setUploadError(
                    `File too large. Maximum size is ${MAX_HERO_IMAGE_SIZE / (1024 * 1024)}MB.`
                  );
                  return;
                }

                try {
                  setUploadProgress(0);
                  const url = await uploadHeroImage(file, setUploadProgress);
                  setLocalCollegeInfo((prev) => ({ ...prev, heroImageUrl: url }));
                  setUploadProgress(null);
                } catch (error) {
                  console.error('Upload failed:', error);
                  setUploadError('Failed to upload image. Please try again.');
                  setUploadProgress(null);
                }

                // Reset input
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
            />

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadProgress !== null}
                className="admin-btn admin-btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {uploadProgress !== null ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4" />
                    Uploading... {uploadProgress}%
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4" />
                    Upload New Image
                  </>
                )}
              </button>

              {collegeInfo.heroImageUrl && (
                <button
                  type="button"
                  onClick={async () => {
                    if (
                      window.confirm(
                        'Are you sure you want to remove the custom hero image? The default image will be used.'
                      )
                    ) {
                      try {
                        if (collegeInfo.heroImageUrl) {
                          await deleteHeroImage(collegeInfo.heroImageUrl);
                        }
                        setLocalCollegeInfo((prev) => ({ ...prev, heroImageUrl: undefined }));
                      } catch (error) {
                        console.error('Failed to delete image:', error);
                        // Still remove from config even if storage delete fails
                        setLocalCollegeInfo((prev) => ({ ...prev, heroImageUrl: undefined }));
                      }
                    }
                  }}
                  className="admin-btn admin-btn-danger flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove Custom Image
                </button>
              )}
            </div>

            {uploadError && (
              <div className="text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {uploadError}
              </div>
            )}

            <p className="text-xs text-slate-500">
              Accepted formats: JPEG, PNG, GIF, WebP. Maximum file size: 5MB.
            </p>
          </div>
        )}
      </div>

      {/* App Constants Section */}
      <div className={`admin-card ${isEditing ? 'border-blue-500/40' : ''}`}>
        <h3 className="text-lg font-semibold text-white mb-4">App Constants</h3>

        {/* Greeting Times */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-slate-400 mb-3">Greeting Times (24h format)</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Morning Ends At</label>
              <input
                type="number"
                min="0"
                max="23"
                disabled={!isEditing}
                className={`admin-input text-sm ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                value={appConstants.greetingTimes.morningEnd}
                onChange={(e) =>
                  setLocalAppConstants((prev) => ({
                    ...prev,
                    greetingTimes: {
                      ...prev.greetingTimes,
                      morningEnd: parseInt(e.target.value) || 12,
                    },
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Afternoon Ends At</label>
              <input
                type="number"
                min="0"
                max="23"
                disabled={!isEditing}
                className={`admin-input text-sm ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                value={appConstants.greetingTimes.afternoonEnd}
                onChange={(e) =>
                  setLocalAppConstants((prev) => ({
                    ...prev,
                    greetingTimes: {
                      ...prev.greetingTimes,
                      afternoonEnd: parseInt(e.target.value) || 17,
                    },
                  }))
                }
              />
            </div>
          </div>
        </div>

        {/* Weather Location */}
        <div>
          <h4 className="text-sm font-medium text-slate-400 mb-3">Weather Location</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Latitude</label>
              <input
                type="number"
                step="0.0001"
                disabled={!isEditing}
                className={`admin-input text-sm ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                value={appConstants.weather.lat}
                onChange={(e) =>
                  setLocalAppConstants((prev) => ({
                    ...prev,
                    weather: { ...prev.weather, lat: parseFloat(e.target.value) || 0 },
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Longitude</label>
              <input
                type="number"
                step="0.0001"
                disabled={!isEditing}
                className={`admin-input text-sm ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                value={appConstants.weather.lon}
                onChange={(e) =>
                  setLocalAppConstants((prev) => ({
                    ...prev,
                    weather: { ...prev.weather, lon: parseFloat(e.target.value) || 0 },
                  }))
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Edit Mode Indicator */}
      {isEditing && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full shadow-lg shadow-blue-500/30 flex items-center gap-3 z-50">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="font-medium">Editing Mode</span>
          <span className="text-blue-200">|</span>
          <span className="text-sm text-blue-100">Remember to save your changes</span>
        </div>
      )}
    </AdminPageLayout>
  );
};

export default CollegeInfoEditor;
