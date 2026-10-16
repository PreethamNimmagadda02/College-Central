import {
  Check,
  Edit2,
  ExternalLink,
  Link,
  Locate,
  MapPin,
  Navigation,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import React, { useState } from 'react';

import { AdminConfigApi } from '../hooks/useAdminConfig';
import { usePagination } from '../hooks/usePagination';
import { CampusLocation, CampusLocationCategory, QuickRoute } from '../types';
import { AdminHeader, AdminPageLayout, Pagination, SearchInput } from './ui';

type Props = Pick<AdminConfigApi, 'config' | 'saveSection'>;
type Tab = 'locations' | 'routes';
type Coordinates = CampusLocation['coordinates'];

const CATEGORY_BADGE: Record<CampusLocationCategory, string> = {
  academic: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  residential: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  facilities: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  dining: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  administration: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
};
const CATEGORIES = Object.keys(CATEGORY_BADGE) as CampusLocationCategory[];

// Common location emoji icons for quick selection
const LOCATION_ICONS = [
  { emoji: '🏛️', label: 'Academic' },
  { emoji: '🏢', label: 'Office' },
  { emoji: '🏠', label: 'Residential' },
  { emoji: '🍽️', label: 'Dining' },
  { emoji: '☕', label: 'Cafe' },
  { emoji: '📚', label: 'Library' },
  { emoji: '🔬', label: 'Lab' },
  { emoji: '🏥', label: 'Medical' },
  { emoji: '🏟️', label: 'Sports' },
  { emoji: '🎭', label: 'Auditorium' },
  { emoji: '🏪', label: 'Shop' },
  { emoji: '🚌', label: 'Transport' },
  { emoji: '🅿️', label: 'Parking' },
  { emoji: '🏦', label: 'Bank/ATM' },
  { emoji: '⛪', label: 'Temple' },
  { emoji: '🌳', label: 'Garden' },
  { emoji: '📍', label: 'General' },
  { emoji: '🎓', label: 'Convocation' },
];

const DEFAULT_COORDS: Coordinates = { lat: 23.814, lng: 86.441 };
const EMPTY_LOCATION: Partial<CampusLocation> = {
  name: '',
  category: 'academic',
  coordinates: DEFAULT_COORDS,
  description: '',
  icon: '📍',
  details: {},
};
const EMPTY_ROUTE: Partial<QuickRoute> = { from: '', to: '', time: '', distance: '', steps: [] };

// Google Maps URL formats, most precise first: the place pin (!3d/!4d), ?q=, ll=,
// /place/lat,lng, and finally the @lat,lng viewport centre.
const COORD_PATTERNS = [
  /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/,
  /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
  /ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
  /place\/(-?\d+\.?\d*),(-?\d+\.?\d*)/,
  /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
];

const parseGoogleMapsLink = (link: string): Coordinates | null => {
  for (const pattern of COORD_PATTERNS) {
    const match = link.match(pattern);
    if (match?.[1] && match[2]) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
  }
  return null;
};

// Keyed by GeolocationPositionError.code
const GEO_ERRORS: Record<number, string> = {
  1: 'Location access denied. Please allow location access in your browser settings, then try again.',
  2: 'Location unavailable. Your device may not have GPS, or location services are disabled.',
  3: 'Location request timed out. Try again or use a Google Maps link instead.',
};

const upsert = <T extends { id: string }>(items: T[] = [], item: T) =>
  items.some((i) => i.id === item.id)
    ? items.map((i) => (i.id === item.id ? item : i))
    : [...items, item];

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const CampusMapEditor: React.FC<Props> = ({ config, saveSection }) => {
  const [activeTab, setActiveTab] = useState<Tab>('locations');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [locationForm, setLocationForm] = useState(EMPTY_LOCATION);
  const [routeForm, setRouteForm] = useState(EMPTY_ROUTE);
  const [stepsInput, setStepsInput] = useState('');

  // Coordinate helpers state
  const [mapsLink, setMapsLink] = useState('');
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  const query = searchQuery.toLowerCase();
  const filteredLocations = (config.campusMap || []).filter(
    (loc) => loc.name.toLowerCase().includes(query) || loc.description.toLowerCase().includes(query)
  );
  const filteredRoutes = (config.quickRoutes || []).filter(
    (route) => route.from.toLowerCase().includes(query) || route.to.toLowerCase().includes(query)
  );
  const locationPager = usePagination(filteredLocations, 20);
  const routePager = usePagination(filteredRoutes, 20);
  const noun = activeTab === 'locations' ? 'Location' : 'Route';

  const applyCoordinates = (coordinates: Coordinates) => {
    setLocationForm((prev) => ({ ...prev, coordinates }));
    setLinkError('');
    setLinkSuccess(true);
    setTimeout(() => setLinkSuccess(false), 3000);
  };

  const handleParseMapsLink = () => {
    setLinkSuccess(false);
    if (!mapsLink.trim()) {
      setLinkError('Please paste a Google Maps link');
      return;
    }
    const coords = parseGoogleMapsLink(mapsLink);
    if (coords) {
      applyCoordinates(coords);
      setMapsLink('');
    } else {
      setLinkError('Could not extract coordinates. Try copying the full URL from Google Maps.');
    }
  };

  const handleGetCurrentLocation = () => {
    if (!window.isSecureContext) {
      setLinkError(
        'Location requires HTTPS. Use the Google Maps link method instead, or access via localhost.'
      );
      return;
    }
    if (!navigator.geolocation) {
      setLinkError(
        'Geolocation is not supported by your browser. Try using a Google Maps link instead.'
      );
      return;
    }

    setGettingLocation(true);
    setLinkError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGettingLocation(false);
        applyCoordinates({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      (error) => {
        setGettingLocation(false);
        console.error('Geolocation error:', error.code, error.message);
        setLinkError(
          GEO_ERRORS[error.code] ??
            `Location error: ${error.message || 'Unknown error'}. Try using a Google Maps link instead.`
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  };

  const resetForm = () => {
    setLocationForm(EMPTY_LOCATION);
    setRouteForm(EMPTY_ROUTE);
    setStepsInput('');
    setIsAdding(false);
    setEditingId(null);
  };

  const startEditing = (id: string) => {
    setEditingId(id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Are you sure you want to delete this ${noun.toLowerCase()}?`)) return;
    if (activeTab === 'locations') {
      await saveSection(
        'campusMap',
        config.campusMap.filter((l) => l.id !== id)
      );
    } else {
      await saveSection(
        'quickRoutes',
        config.quickRoutes.filter((r) => r.id !== id)
      );
    }
  };

  const handleSubmitLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationForm.name || !locationForm.coordinates) return;
    await saveSection(
      'campusMap',
      upsert(config.campusMap, {
        id: editingId || `loc-${Date.now()}`,
        name: locationForm.name,
        category: locationForm.category as CampusLocationCategory,
        coordinates: {
          lat: Number(locationForm.coordinates.lat),
          lng: Number(locationForm.coordinates.lng),
        },
        description: locationForm.description || '',
        icon: locationForm.icon || '📍',
        details: locationForm.details,
      })
    );
    resetForm();
  };

  const handleSubmitRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeForm.from || !routeForm.to) return;
    await saveSection(
      'quickRoutes',
      upsert(config.quickRoutes, {
        id: editingId || `route-${Date.now()}`,
        from: routeForm.from,
        to: routeForm.to,
        time: routeForm.time || '',
        distance: routeForm.distance || '',
        steps: stepsInput.split('\n').filter((s) => s.trim()),
      })
    );
    resetForm();
  };

  const setCoordinate = (key: keyof Coordinates, value: string) =>
    setLocationForm({
      ...locationForm,
      coordinates: { ...(locationForm.coordinates ?? DEFAULT_COORDS), [key]: parseFloat(value) },
    });

  return (
    <AdminPageLayout>
      <AdminHeader
        icon={MapPin}
        title="Campus Map"
        subtitle="Manage locations and navigation routes"
      >
        <div className="flex bg-slate-800/50 rounded-lg p-1 border border-blue-500/20">
          {(['locations', 'routes'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                resetForm();
              }}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {capitalize(tab)}
            </button>
          ))}
        </div>
      </AdminHeader>

      {/* Search and Add */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 admin-card">
        <SearchInput
          className="flex-1"
          placeholder={`Search ${activeTab}...`}
          value={searchQuery}
          onChange={(value) => {
            setSearchQuery(value);
            locationPager.setPage(1);
            routePager.setPage(1);
          }}
        />
        <button
          onClick={() => setIsAdding(true)}
          className="admin-btn admin-btn-primary w-full sm:w-auto justify-center text-xs sm:text-sm"
        >
          <Plus size={18} />
          Add {noun}
        </button>
      </div>

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="admin-card mb-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-white">
              {editingId ? 'Edit' : 'New'} {noun}
            </h3>
            <button
              onClick={resetForm}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {activeTab === 'locations' ? (
            <form onSubmit={handleSubmitLocation} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="admin-label">Name</label>
                  <input
                    type="text"
                    value={locationForm.name}
                    onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                    className="admin-input"
                    required
                  />
                </div>
                <div>
                  <label className="admin-label">Category</label>
                  <select
                    value={locationForm.category}
                    onChange={(e) =>
                      setLocationForm({
                        ...locationForm,
                        category: e.target.value as CampusLocationCategory,
                      })
                    }
                    className="admin-select"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {capitalize(cat)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Coordinate Input Section */}
              <div className="bg-slate-800/30 border border-blue-500/20 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={18} className="text-blue-400" />
                  <span className="text-sm font-medium text-white">Get Coordinates</span>
                  <span className="text-xs text-slate-400">— Choose your preferred method</span>
                </div>

                {/* Method 1: Google Maps Link */}
                <div className="space-y-2">
                  <label className="admin-label flex items-center gap-2">
                    <Link size={14} className="text-slate-400" />
                    From Google Maps Link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Paste a Google Maps URL here..."
                      value={mapsLink}
                      onChange={(e) => {
                        setMapsLink(e.target.value);
                        setLinkError('');
                      }}
                      className="admin-input flex-1 text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleParseMapsLink}
                      className="admin-btn admin-btn-secondary whitespace-nowrap text-xs"
                    >
                      <Check size={14} />
                      Extract
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Open Google Maps → Right-click on location → "What's here?" → Copy the URL
                  </p>
                </div>

                {/* Method 2: Current Location */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">Or</span>
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={gettingLocation}
                    className="admin-btn admin-btn-secondary text-xs flex items-center gap-2"
                  >
                    <Locate size={14} className={gettingLocation ? 'animate-pulse' : ''} />
                    {gettingLocation ? 'Getting Location...' : 'Use My Current Location'}
                  </button>
                </div>

                {linkError && (
                  <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    <X size={14} />
                    {linkError}
                  </div>
                )}
                {linkSuccess && (
                  <div className="flex items-center gap-2 text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                    <Check size={14} />
                    Coordinates extracted successfully!
                  </div>
                )}

                {/* Manual Coordinate Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-700/50">
                  <div>
                    <label className="admin-label">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={locationForm.coordinates?.lat}
                      onChange={(e) => setCoordinate('lat', e.target.value)}
                      className="admin-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="admin-label">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={locationForm.coordinates?.lng}
                      onChange={(e) => setCoordinate('lng', e.target.value)}
                      className="admin-input"
                      required
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const { lat, lng } = locationForm.coordinates || DEFAULT_COORDS;
                    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
                  }}
                  className="admin-btn admin-btn-secondary w-full text-xs justify-center"
                >
                  <ExternalLink size={14} />
                  Verify Location in Google Maps
                </button>
              </div>

              <div>
                <label className="admin-label">Description</label>
                <textarea
                  value={locationForm.description}
                  onChange={(e) =>
                    setLocationForm({ ...locationForm, description: e.target.value })
                  }
                  className="admin-input"
                  rows={2}
                />
              </div>

              {/* Icon Picker */}
              <div>
                <label className="admin-label">Icon</label>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-slate-700/50 rounded-xl border border-blue-500/30 text-2xl">
                    {locationForm.icon}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    className="admin-btn admin-btn-secondary text-xs"
                  >
                    {showIconPicker ? 'Hide Icons' : 'Choose Icon'}
                  </button>
                  <input
                    type="text"
                    value={locationForm.icon}
                    onChange={(e) => setLocationForm({ ...locationForm, icon: e.target.value })}
                    className="admin-input w-20 text-center text-lg"
                    placeholder="📍"
                  />
                </div>

                {showIconPicker && (
                  <div className="grid grid-cols-6 sm:grid-cols-9 gap-2 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                    {LOCATION_ICONS.map(({ emoji, label }) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setLocationForm({ ...locationForm, icon: emoji });
                          setShowIconPicker(false);
                        }}
                        className={`p-2 rounded-lg text-xl hover:bg-blue-500/20 hover:scale-110 transition-all ${locationForm.icon === emoji ? 'bg-blue-500/30 ring-2 ring-blue-500' : 'bg-slate-700/30'}`}
                        title={label}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={resetForm} className="admin-btn admin-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  <Save size={18} />
                  {editingId ? 'Update Location' : 'Save Location'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmitRoute} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="admin-label">From</label>
                  <input
                    type="text"
                    value={routeForm.from}
                    onChange={(e) => setRouteForm({ ...routeForm, from: e.target.value })}
                    className="admin-input"
                    required
                  />
                </div>
                <div>
                  <label className="admin-label">To</label>
                  <input
                    type="text"
                    value={routeForm.to}
                    onChange={(e) => setRouteForm({ ...routeForm, to: e.target.value })}
                    className="admin-input"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="admin-label">Time Estimate</label>
                  <input
                    type="text"
                    placeholder="e.g., 5 min walk"
                    value={routeForm.time}
                    onChange={(e) => setRouteForm({ ...routeForm, time: e.target.value })}
                    className="admin-input"
                  />
                </div>
                <div>
                  <label className="admin-label">Distance</label>
                  <input
                    type="text"
                    placeholder="e.g., 350m"
                    value={routeForm.distance}
                    onChange={(e) => setRouteForm({ ...routeForm, distance: e.target.value })}
                    className="admin-input"
                  />
                </div>
              </div>

              <div>
                <label className="admin-label">Steps (One per line)</label>
                <textarea
                  value={stepsInput}
                  onChange={(e) => setStepsInput(e.target.value)}
                  className="admin-input"
                  rows={5}
                  placeholder="Exit Main Building&#10;Walk towards dining area&#10;Barista on left"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={resetForm} className="admin-btn admin-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  <Save size={18} />
                  {editingId ? 'Update Route' : 'Save Route'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {activeTab === 'locations' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {locationPager.pageItems.map((location) => (
            <div key={location.id} className="admin-card hover:border-blue-500/40 transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <span className="text-xl sm:text-2xl flex-shrink-0" role="img" aria-label="icon">
                    {location.icon}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white text-sm sm:text-base truncate">
                      {location.name}
                    </h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_BADGE[location.category] ?? CATEGORY_BADGE.administration}`}
                    >
                      {capitalize(location.category)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => {
                      setLocationForm(location);
                      startEditing(location.id);
                    }}
                    className="p-1.5 sm:p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                  >
                    <Edit2 size={14} className="sm:w-4 sm:h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(location.id)}
                    className="p-1.5 sm:p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} className="sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 line-clamp-2 mb-3">
                {location.description}
              </p>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <MapPin size={12} />
                <span className="truncate">
                  {location.coordinates.lat.toFixed(4)}, {location.coordinates.lng.toFixed(4)}
                </span>
              </div>
            </div>
          ))}
          {filteredLocations.length === 0 && (
            <div className="col-span-full text-center py-8 sm:py-12 text-slate-500 text-sm sm:text-base">
              No locations found.
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {routePager.pageItems.map((route) => (
            <div
              key={route.id}
              className="admin-card flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:border-blue-500/40 transition-all"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-2 sm:p-3 rounded-xl text-blue-400 border border-blue-500/20 flex-shrink-0">
                  <Navigation size={18} className="sm:w-5 sm:h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-white text-sm sm:text-base">
                      {route.from}
                    </span>
                    <span className="text-blue-400">→</span>
                    <span className="font-semibold text-white text-sm sm:text-base">
                      {route.to}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-slate-400">
                    <span>{route.time}</span>
                    <span className="text-slate-600 hidden sm:inline">•</span>
                    <span>{route.distance}</span>
                    <span className="text-slate-600 hidden sm:inline">•</span>
                    <span>{route.steps?.length || 0} steps</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1 self-end sm:self-center flex-shrink-0">
                <button
                  onClick={() => {
                    setRouteForm(route);
                    setStepsInput(route.steps?.join('\n') || '');
                    startEditing(route.id);
                  }}
                  className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(route.id)}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {filteredRoutes.length === 0 && (
            <div className="text-center py-8 sm:py-12 text-slate-500 text-sm sm:text-base">
              No routes found.
            </div>
          )}
        </div>
      )}

      <Pagination {...(activeTab === 'locations' ? locationPager : routePager)} label={activeTab} />
    </AdminPageLayout>
  );
};

export default CampusMapEditor;
