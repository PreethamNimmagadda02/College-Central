import React, { useState, useRef, useMemo } from 'react';
import { useCampusMap } from '../contexts/CampusMapContext';
import { CampusLocation, CampusLocationCategory } from '../types';

const CampusMap: React.FC = () => {
  const { locations, quickRoutes, loading, error, savedPlaces, toggleSavePlace, getDirections, shareLocation } = useCampusMap();
  const [selectedCategory, setSelectedCategory] = useState<CampusLocationCategory | 'all'>('all');
  const [selectedLocation, setSelectedLocation] = useState<CampusLocation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapView, setMapView] = useState<'map' | 'satellite'>('map');
  const [showDirections, setShowDirections] = useState(false);
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [showEmergency, setShowEmergency] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [savedPlaceForDirections, setSavedPlaceForDirections] = useState<CampusLocation | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Show notification helper
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Handle get directions
  const handleGetDirections = () => {
    if (!fromLocation || !toLocation) {
      showNotification('Please select both locations', 'error');
      return;
    }

    const url = getDirections(fromLocation, toLocation);
    window.open(url, '_blank');
    setShowDirections(false);
    showNotification('Opening directions in Google Maps');
  };

  // Handle share location
  const handleShareLocation = async (locationId: string) => {
    await shareLocation(locationId);
    showNotification('Location shared successfully!');
  };

  // Get all locations based on selected category
  const getFilteredLocations = useMemo(() => {
    if (selectedCategory === 'all') return locations;
    return locations.filter(loc => loc.category === selectedCategory);
  }, [locations, selectedCategory]);

  // Search locations
  const searchedLocations = useMemo(() => {
    return getFilteredLocations.filter(location =>
      location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [getFilteredLocations, searchQuery]);

  // Count locations by category
  const locationCounts = useMemo(() => {
    return {
      academic: locations.filter(loc => loc.category === 'academic').length,
      residential: locations.filter(loc => loc.category === 'residential').length,
      facilities: locations.filter(loc => loc.category === 'facilities').length,
      dining: locations.filter(loc => loc.category === 'dining').length,
    };
  }, [locations]);

  // Get map URL based on view type
  const getMapUrl = () => {
    const baseUrl = "https://www.google.com/maps/embed?pb=";
    const params = "!1m14!1m8!1m3!1d14603.65487739572!2d86.441225!3d23.814333!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f6a3d7a3536633%3A0x1b1b361b7b415951!2sIndian%20Institute%20of%20Technology%20(Indian%20School%20of%20Mines)%2C%20Dhanbad!5e";
    
    const viewType = mapView === 'satellite' ? '1' : '0';
    return `${baseUrl}${params}${viewType}!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading campus map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen p-4">
        <div className="text-center max-w-md">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Failed to Load Campus Map</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Interactive Campus Map
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Navigate IIT (ISM) Dhanbad campus with ease
          </p>
        </div>
        
        {/* Map View Toggles */}
        <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
          {(['map', 'satellite'] as const).map((view) => (
            <button
              key={view}
              onClick={() => setMapView(view)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                mapView === view
                  ? 'bg-white dark:bg-slate-600 text-primary shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs">Academic Buildings</p>
              <p className="text-2xl font-bold">{locationCounts.academic}</p>
            </div>
            <span className="text-3xl opacity-80">🏛️</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-xs">Residentials</p>
              <p className="text-2xl font-bold">{locationCounts.residential}</p>
            </div>
            <span className="text-3xl opacity-80">🏠</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-xs">Facilities</p>
              <p className="text-2xl font-bold">{locationCounts.facilities}</p>
            </div>
            <span className="text-3xl opacity-80">🎯</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-xs">Food & Dining</p>
              <p className="text-2xl font-bold">{locationCounts.dining}</p>
            </div>
            <span className="text-3xl opacity-80">🍽️</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Location Directory */}
        <div className="lg:col-span-1 space-y-4">
          {/* Search Bar */}
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-lg p-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <svg className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Category Filters */}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedCategory === 'all' 
                    ? 'bg-primary text-white' 
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedCategory('academic')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedCategory === 'academic' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Academic
              </button>
              <button
                onClick={() => setSelectedCategory('residential')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedCategory === 'residential' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Residential
              </button>
              <button
                onClick={() => setSelectedCategory('facilities')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedCategory === 'facilities' 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Facilities
              </button>
              <button
                onClick={() => setSelectedCategory('dining')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedCategory === 'dining' 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              > 
                Dining
              </button>
            </div>
          </div>

          {/* Location List */}
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold flex items-center">
                <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Campus Locations
              </h3>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              {searchedLocations.length > 0 ? (
                searchedLocations.map(location => (
                  <div
                    key={location.id}
                    onClick={() => setSelectedLocation(location)}
                    className={`p-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors ${
                      selectedLocation?.id === location.id ? 'bg-primary/10 dark:bg-primary/20' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{location.icon}</span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900 dark:text-white">
                            {location.name}
                          </h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            {location.description}
                          </p>
                          {location.details?.openingHours && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              ⏰ {location.details.openingHours}
                            </p>
                          )}
                          <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                            location.category === 'academic' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            location.category === 'residential' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            location.category === 'facilities' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                            'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                          }`}>
                            {location.category}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSavePlace(location.id);
                        }}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                      >
                        <svg
                          className={`w-5 h-5 ${savedPlaces.includes(location.id) ? 'text-yellow-500 fill-current' : 'text-slate-400'}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500">
                  No locations found
                </div>
              )}
            </div>
          </div>

          {/* Quick Routes */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4">
            <h3 className="font-semibold mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Popular Routes
            </h3>
            <div className="space-y-2">
              {quickRoutes.map((route, index) => (
                <button
                  key={index}
                  onClick={() => {
                    const url = getDirections(route.from, route.to);
                    window.open(url, '_blank');
                    showNotification(`Opening directions from ${route.from} to ${route.to}`);
                  }}
                  className="w-full bg-white dark:bg-dark-card p-3 rounded-lg hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-left">
                      <p className="font-medium">{route.from} → {route.to}</p>
                      <p className="text-xs text-slate-500">{route.distance} • {route.time}</p>
                    </div>
                    <div className="text-primary">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Map */}
        <div className="lg:col-span-2 space-y-4">
          {/* Selected Location Info */}
          {selectedLocation && (
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/30 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{selectedLocation.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedLocation.name}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{selectedLocation.description}</p>
                    {selectedLocation.details && (
                      <div className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                        {selectedLocation.details.openingHours && (
                          <p>⏰ {selectedLocation.details.openingHours}</p>
                        )}
                        {selectedLocation.details.contact && (
                          <p>📞 {selectedLocation.details.contact}</p>
                        )}
                        {selectedLocation.details.capacity && (
                          <p>👥 Capacity: {selectedLocation.details.capacity}</p>
                        )}
                      </div>
                    )}
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => {
                          setToLocation(selectedLocation.name);
                          setShowDirections(true);
                        }}
                        className="px-3 py-1 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                        Get Directions
                      </button>
                      <button
                        onClick={() => handleShareLocation(selectedLocation.id)}
                        className="px-3 py-1 bg-white dark:bg-dark-card text-slate-700 dark:text-slate-300 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-2.796 0-5.29 1.28-6.716 3.284m9.032 4.026a3.001 3.001 0 00-4.632 0" />
                        </svg>
                        Share
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLocation(null)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                >
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Map Container */}
          <div ref={mapRef} className="bg-white dark:bg-dark-card rounded-xl shadow-lg overflow-hidden">
            <div className="relative">
              <iframe
                src={getMapUrl()}
                width="100%"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="IIT(ISM) Dhanbad Campus Map"
                className="h-[600px] w-full"
              ></iframe>
              
              {/* Map Overlay Controls */}
              <div className="absolute top-4 right-4 space-y-2">
                <button className="p-2 bg-white dark:bg-dark-card rounded-lg shadow-lg hover:shadow-xl transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                <button className="p-2 bg-white dark:bg-dark-card rounded-lg shadow-lg hover:shadow-xl transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <button className="p-2 bg-white dark:bg-dark-card rounded-lg shadow-lg hover:shadow-xl transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Map Legend */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                  <span>Academic</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span>Residential</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                  <span>Facilities</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                  <span>Dining</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <button className="p-3 bg-white dark:bg-dark-card rounded-lg shadow hover:shadow-lg transition-all flex flex-col items-center gap-2">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h11M9 21V3m0 0L3 9m6-6L15 9" />
              </svg>
              <span className="text-xs font-medium">Navigate</span>
            </button>
            <button className="p-3 bg-white dark:bg-dark-card rounded-lg shadow hover:shadow-lg transition-all flex flex-col items-center gap-2">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-medium">Schedule</span>
            </button>
            <button className="p-3 bg-white dark:bg-dark-card rounded-lg shadow hover:shadow-lg transition-all flex flex-col items-center gap-2">
              <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-medium">Info</span>
            </button>
            <button
              onClick={() => setShowEmergency(true)}
              className="p-3 bg-white dark:bg-dark-card rounded-lg shadow hover:shadow-lg transition-all flex flex-col items-center gap-2"
            >
              <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-xs font-medium">Emergency</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Features */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Saved Places */}
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-lg p-4">
          <h3 className="font-semibold mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            Saved Places ({savedPlaces.length})
          </h3>
          {savedPlaces.length > 0 ? (
            <div className="space-y-2">
              {locations
                .filter(loc => savedPlaces.includes(loc.id))
                .map(location => (
                  <div key={location.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span>{location.icon}</span>
                        <span className="text-sm font-medium">{location.name}</span>
                      </div>
                      <button
                        onClick={() => toggleSavePlace(location.id)}
                        className="text-yellow-500 hover:text-yellow-600"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        setSavedPlaceForDirections(location);
                      }}
                      className="w-full px-3 py-1.5 bg-primary text-white text-xs rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      Get Directions
                    </button>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">No saved places yet</p>
          )}
        </div>

        {/* Campus Info */}
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-lg p-4">
          <h3 className="font-semibold mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Campus Information
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Total Area</span>
              <span className="font-medium">393 acres</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Main Gate Hours</span>
              <span className="font-medium">24/7</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Emergency</span>
              <span className="font-medium text-red-500">100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Health Centre</span>
              <span className="font-medium">0326-223-5435</span>
            </div>
          </div>
        </div>

        {/* Transport Options */}
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-lg p-4">
          <h3 className="font-semibold mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Transport Options
          </h3>
          <div className="space-y-2">
            <button className="w-full p-2 text-left bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>🚌</span>
                  <span className="text-sm font-medium">Campus Bus</span>
                </div>
                <span className="text-xs text-slate-500">Every 30min</span>
              </div>
            </button>
            <button className="w-full p-2 text-left bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>🚲</span>
                  <span className="text-sm font-medium">Bicycle Stands</span>
                </div>
                <span className="text-xs text-slate-500">12 locations</span>
              </div>
            </button>
            <button className="w-full p-2 text-left bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>🚶</span>
                  <span className="text-sm font-medium">Walking Paths</span>
                </div>
                <span className="text-xs text-slate-500">Well-lit</span>
              </div>
            </button>
          </div>
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

      {/* Emergency Contacts Modal */}
      {showEmergency && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={() => setShowEmergency(false)}>
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Emergency Contacts
              </h3>
              <button onClick={() => setShowEmergency(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-red-700 dark:text-red-400">Police Emergency</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-500">100</p>
                  </div>
                  <a href="tel:100" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors">
                    Call Now
                  </a>
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-blue-700 dark:text-blue-400">Health Centre</p>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-500">0326-223-5435</p>
                  </div>
                  <a href="tel:03262235435" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                    Call Now
                  </a>
                </div>
              </div>

              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-orange-700 dark:text-orange-400">Ambulance</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-500">102</p>
                  </div>
                  <a href="tel:102" className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors">
                    Call Now
                  </a>
                </div>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-purple-700 dark:text-purple-400">Security Control Room</p>
                    <p className="text-xl font-bold text-purple-600 dark:text-purple-500">0326-223-5000</p>
                  </div>
                  <a href="tel:03262235000" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors">
                    Call Now
                  </a>
                </div>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-green-700 dark:text-green-400">Fire Emergency</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-500">101</p>
                  </div>
                  <a href="tel:101" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors">
                    Call Now
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
                <strong>Important:</strong> In case of emergency, call the nearest contact or security immediately
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Directions Modal */}
      {showDirections && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={() => setShowDirections(false)}>
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Get Directions</h3>
              <button onClick={() => setShowDirections(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">From</label>
                <select
                  value={fromLocation}
                  onChange={(e) => setFromLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-slate-700"
                >
                  <option value="">Select starting point...</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.name}>{loc.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">To</label>
                <select
                  value={toLocation}
                  onChange={(e) => setToLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-slate-700"
                >
                  <option value="">Select destination...</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.name}>{loc.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleGetDirections}
                  className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Open in Google Maps
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Saved Place Directions Modal */}
      {savedPlaceForDirections && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={() => setSavedPlaceForDirections(null)}>
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold">Get Directions</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  To: <span className="font-medium text-primary">{savedPlaceForDirections.name}</span>
                </p>
              </div>
              <button onClick={() => setSavedPlaceForDirections(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">From</label>
                <select
                  value={fromLocation}
                  onChange={(e) => setFromLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-slate-700"
                >
                  <option value="">Select starting point...</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.name}>{loc.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (!fromLocation) {
                      showNotification('Please select a starting point', 'error');
                      return;
                    }
                    const url = getDirections(fromLocation, savedPlaceForDirections.name);
                    window.open(url, '_blank');
                    setSavedPlaceForDirections(null);
                    setFromLocation('');
                    showNotification(`Opening directions to ${savedPlaceForDirections.name}`);
                  }}
                  className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Open in Google Maps
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampusMap;