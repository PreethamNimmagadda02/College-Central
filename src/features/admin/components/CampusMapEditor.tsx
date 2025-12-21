import React, { useState } from 'react';
import { AdminConfig } from '../types';
import { CampusLocation, CampusLocationCategory, QuickRoute } from '../types';
import { useAdminConfig } from '@features/admin/hooks/useAdminConfig';
import { Search, Plus, Trash2, MapPin, Edit2, X, Save, Navigation } from 'lucide-react';
import { AdminHeader, MapPinIcon } from './AdminIcons';

interface Props {
  config: AdminConfig;
}

const CATEGORIES: CampusLocationCategory[] = ['academic', 'residential', 'facilities', 'dining', 'administration'];

type Tab = 'locations' | 'routes';

const CampusMapEditor: React.FC<Props> = ({ config }) => {
  const { saveSection } = useAdminConfig();
  const [activeTab, setActiveTab] = useState<Tab>('locations');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Location Form state
  const [locationForm, setLocationForm] = useState<Partial<CampusLocation>>({
    name: '',
    category: 'academic',
    coordinates: { lat: 23.814, lng: 86.441 },
    description: '',
    icon: '📍',
    details: {}
  });

  // Route Form state
  const [routeForm, setRouteForm] = useState<Partial<QuickRoute>>({
    from: '',
    to: '',
    time: '',
    distance: '',
    steps: []
  });
  const [stepsInput, setStepsInput] = useState('');

  const filteredLocations = (config.campusMap || []).filter(loc =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRoutes = (config.quickRoutes || []).filter(route =>
    route.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.to.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setLocationForm({
      name: '',
      category: 'academic',
      coordinates: { lat: 23.814, lng: 86.441 },
      description: '',
      icon: '📍',
      details: {}
    });
    setRouteForm({
      from: '',
      to: '',
      time: '',
      distance: '',
      steps: []
    });
    setStepsInput('');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEditLocation = (loc: CampusLocation) => {
    setLocationForm(loc);
    setEditingId(loc.id);
    setIsAdding(true);
  };

  const handleEditRoute = (route: QuickRoute) => {
    setRouteForm(route);
    setStepsInput(route.steps?.join('\n') || '');
    setEditingId(route.id);
    setIsAdding(true);
  };

  const handleDeleteLocation = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this location?')) {
      const updatedLocations = config.campusMap.filter(l => l.id !== id);
      await saveSection('campusMap', updatedLocations);
    }
  };

  const handleDeleteRoute = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this route?')) {
      const updatedRoutes = config.quickRoutes.filter(r => r.id !== id);
      await saveSection('quickRoutes', updatedRoutes);
    }
  };

  const handleSubmitLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationForm.name || !locationForm.coordinates) return;

    const newLocation: CampusLocation = {
      id: editingId || `loc-${Date.now()}`,
      name: locationForm.name!,
      category: locationForm.category as CampusLocationCategory,
      coordinates: {
        lat: Number(locationForm.coordinates.lat),
        lng: Number(locationForm.coordinates.lng)
      },
      description: locationForm.description || '',
      icon: locationForm.icon || '📍',
      details: locationForm.details
    };

    let updatedLocations: CampusLocation[];
    if (editingId) {
      updatedLocations = config.campusMap.map(l => l.id === editingId ? newLocation : l);
    } else {
      updatedLocations = [...(config.campusMap || []), newLocation];
    }
    
    await saveSection('campusMap', updatedLocations);
    resetForm();
  };

  const handleSubmitRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeForm.from || !routeForm.to) return;

    const newRoute: QuickRoute = {
      id: editingId || `route-${Date.now()}`,
      from: routeForm.from!,
      to: routeForm.to!,
      time: routeForm.time || '',
      distance: routeForm.distance || '',
      steps: stepsInput.split('\n').filter(s => s.trim())
    };

    let updatedRoutes: QuickRoute[];
    if (editingId) {
      updatedRoutes = config.quickRoutes.map(r => r.id === editingId ? newRoute : r);
    } else {
      updatedRoutes = [...(config.quickRoutes || []), newRoute];
    }

    await saveSection('quickRoutes', updatedRoutes);
    resetForm();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminHeader 
        icon={<MapPinIcon />} 
        title="Campus Map" 
        subtitle="Manage locations and navigation routes"
      >
        <div className="flex bg-slate-800/50 rounded-lg p-1 border border-blue-500/20">
          <button
            onClick={() => { setActiveTab('locations'); resetForm(); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'locations'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Locations
          </button>
          <button
            onClick={() => { setActiveTab('routes'); resetForm(); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'routes'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Quick Routes
          </button>
        </div>
      </AdminHeader>

      {/* Search and Add */}
      <div className="flex justify-between items-center admin-card">
        <div className="admin-search flex-1 max-w-md">
          <Search className="admin-search-icon" size={20} />
          <input
            type="text"
            placeholder={`Search ${activeTab === 'locations' ? 'locations' : 'routes'}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-input"
            style={{ paddingLeft: '48px' }}
          />
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="ml-4 admin-btn admin-btn-primary"
        >
          <Plus size={20} />
          Add {activeTab === 'locations' ? 'Location' : 'Route'}
        </button>
      </div>

      {/* Add/Edit Form */}
      {(isAdding) && (
        <div className="admin-card mb-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-white">
              {editingId ? `Edit ${activeTab === 'locations' ? 'Location' : 'Route'}` : `New ${activeTab === 'locations' ? 'Location' : 'Route'}`}
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
                    onChange={e => setLocationForm({ ...locationForm, name: e.target.value })}
                    className="admin-input"
                    required
                  />
                </div>
                <div>
                  <label className="admin-label">Category</label>
                  <select
                    value={locationForm.category}
                    onChange={e => setLocationForm({ ...locationForm, category: e.target.value as CampusLocationCategory })}
                    className="admin-select"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="admin-label">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={locationForm.coordinates?.lat}
                    onChange={e => setLocationForm({ ...locationForm, coordinates: { ...locationForm.coordinates!, lat: parseFloat(e.target.value) } })}
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
                    onChange={e => setLocationForm({ ...locationForm, coordinates: { ...locationForm.coordinates!, lng: parseFloat(e.target.value) } })}
                    className="admin-input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="admin-label">Description</label>
                <textarea
                  value={locationForm.description}
                  onChange={e => setLocationForm({ ...locationForm, description: e.target.value })}
                  className="admin-input"
                  rows={2}
                />
              </div>

              <div>
                <label className="admin-label">Icon (Emoji)</label>
                <input
                  type="text"
                  value={locationForm.icon}
                  onChange={e => setLocationForm({ ...locationForm, icon: e.target.value })}
                  className="admin-input w-24"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="admin-btn admin-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                >
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
                     onChange={e => setRouteForm({ ...routeForm, from: e.target.value })}
                     className="admin-input"
                     required
                   />
                 </div>
                 <div>
                   <label className="admin-label">To</label>
                   <input
                     type="text"
                     value={routeForm.to}
                     onChange={e => setRouteForm({ ...routeForm, to: e.target.value })}
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
                     onChange={e => setRouteForm({ ...routeForm, time: e.target.value })}
                     className="admin-input"
                   />
                 </div>
                 <div>
                   <label className="admin-label">Distance</label>
                   <input
                     type="text"
                     placeholder="e.g., 350m"
                     value={routeForm.distance}
                     onChange={e => setRouteForm({ ...routeForm, distance: e.target.value })}
                     className="admin-input"
                   />
                 </div>
               </div>

               <div>
                 <label className="admin-label">Steps (One per line)</label>
                 <textarea
                   value={stepsInput}
                   onChange={e => setStepsInput(e.target.value)}
                   className="admin-input"
                   rows={5}
                   placeholder="Exit Main Building&#10;Walk towards dining area&#10;Barista on left"
                 />
               </div>

               <div className="flex justify-end gap-3 pt-4">
                 <button
                   type="button"
                   onClick={resetForm}
                   className="admin-btn admin-btn-secondary"
                 >
                   Cancel
                 </button>
                 <button
                   type="submit"
                   className="admin-btn admin-btn-primary"
                 >
                   <Save size={18} />
                   {editingId ? 'Update Route' : 'Save Route'}
                 </button>
               </div>
            </form>
          )}
        </div>
      )}

      {/* Locations Grid */}
      {activeTab === 'locations' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLocations.map((location) => (
            <div key={location.id} className="admin-card hover:border-blue-500/40 transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl" role="img" aria-label="icon">{location.icon}</span>
                  <div>
                    <h3 className="font-semibold text-white">{location.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      location.category === 'academic' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      location.category === 'residential' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      location.category === 'facilities' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                      location.category === 'dining' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                      'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                    }`}>
                      {location.category.charAt(0).toUpperCase() + location.category.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => handleEditLocation(location)} 
                    className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDeleteLocation(location.id)} 
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-slate-400 line-clamp-2 mb-3">{location.description}</p>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <MapPin size={12} />
                <span>{location.coordinates.lat.toFixed(6)}, {location.coordinates.lng.toFixed(6)}</span>
              </div>
            </div>
          ))}
          {filteredLocations.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500">No locations found.</div>
          )}
        </div>
      ) : (
        /* Routes List */
        <div className="space-y-3">
          {filteredRoutes.map((route) => (
            <div key={route.id} className="admin-card flex justify-between items-center hover:border-blue-500/40 transition-all">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-3 rounded-xl text-blue-400 border border-blue-500/20">
                  <Navigation size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white">{route.from}</span>
                    <span className="text-blue-400">→</span>
                    <span className="font-semibold text-white">{route.to}</span>
                  </div>
                  <div className="flex gap-4 text-sm text-slate-400">
                    <span>{route.time}</span>
                    <span className="text-slate-600">•</span>
                    <span>{route.distance}</span>
                    <span className="text-slate-600">•</span>
                    <span>{route.steps?.length || 0} steps</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => handleEditRoute(route)} 
                  className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => handleDeleteRoute(route.id)} 
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {filteredRoutes.length === 0 && (
            <div className="text-center py-12 text-slate-500">No routes found.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default CampusMapEditor;
