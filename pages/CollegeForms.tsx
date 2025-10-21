import React, { useState, useMemo, useEffect } from 'react';
import { useForms } from '../contexts/FormsContext';
import { Form, UserFormsData } from '../types';
import { allForms, generalForms, ugForms, pgForms, phdForms } from '../data/formsData';
import { logActivity } from '../services/activityService';

const DownloadIcon: React.FC = () => (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

const SearchIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const BookmarkIcon: React.FC<{ filled?: boolean }> = ({ filled = false }) => (
    <svg className="w-5 h-5" fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
);

const StarIcon: React.FC = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

const ClockIcon: React.FC = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const InfoIcon: React.FC = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const FormCard: React.FC<{
    form: Form;
    isFavorite: boolean;
    onToggleFavorite: (formNumber: string) => void;
    onDownload: (form: Form) => void;
}> = ({ form, isFavorite, onToggleFavorite, onDownload }) => (
    <div className="bg-white dark:bg-dark-card p-4 sm:p-6 rounded-lg shadow-md flex flex-col h-full transition-all duration-300 hover:shadow-xl border-2 border-transparent hover:border-primary/20">
        <div className="flex justify-between items-start mb-2">
            <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-white flex-grow pr-2">{form.title}</h3>
            <div className="flex items-center gap-2">
                {form.formNumber && <span className="text-xs sm:text-sm font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 py-1 px-2 rounded-full whitespace-nowrap">{form.formNumber}</span>}
                <button
                    onClick={() => onToggleFavorite(form.formNumber)}
                    className={`p-2 rounded-lg transition-all ${isFavorite ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : 'text-slate-400 hover:text-yellow-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                    title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                    <BookmarkIcon filled={isFavorite} />
                </button>
            </div>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 flex-grow">
           <strong>Submit to:</strong> {form.submitTo}
        </p>
        <button
            onClick={() => onDownload(form)}
            className="mt-4 inline-flex items-center justify-center px-4 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors duration-200 text-sm"
        >
            <DownloadIcon />
            Download PDF
        </button>
    </div>
);

const CollegeForms: React.FC = () => {
    const { userFormsData, loading, toggleFavorite, addRecentDownload } = useForms();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');

    const safeUserFormsData = userFormsData || { favorites: [], recentDownloads: [] };

    const filters = ['All', 'Favorites', 'General', 'UG', 'PG', 'PhD'];
    
    // Handle download
    const handleDownload = async (form: Form) => {
        window.open(form.downloadLink, '_blank');
        await addRecentDownload(form);
    };

    const filterForms = (forms: Form[]) => {
        let filtered = forms;

        // Apply favorites filter
        if (activeFilter === 'Favorites') {
            filtered = filtered.filter(form => safeUserFormsData.favorites.includes(form.formNumber));
        }

        // Apply search filter
        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(form =>
                form.title.toLowerCase().includes(lowercasedTerm) ||
                form.formNumber.toLowerCase().includes(lowercasedTerm) ||
                form.submitTo.toLowerCase().includes(lowercasedTerm)
            );
        }

        return filtered;
    };
    
    const favoriteForms = useMemo(() =>
        allForms.filter(form => safeUserFormsData.favorites.includes(form.formNumber)),
        [safeUserFormsData.favorites]
    );

    const filteredGeneralForms = useMemo(() => filterForms(generalForms), [searchTerm, safeUserFormsData.favorites, activeFilter]);
    const filteredUgForms = useMemo(() => filterForms(ugForms), [searchTerm, safeUserFormsData.favorites, activeFilter]);
    const filteredPgForms = useMemo(() => filterForms(pgForms), [searchTerm, safeUserFormsData.favorites, activeFilter]);
    const filteredPhdForms = useMemo(() => filterForms(phdForms), [searchTerm, safeUserFormsData.favorites, activeFilter]);

    const getFilterLabel = (filter: string) => {
        switch (filter) {
            case 'UG': return 'Undergraduate (UG)';
            case 'PG': return 'Postgraduate (PG)';
            case 'PhD': return 'Doctoral (PhD)';
            default: return filter;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header with gradient */}
            <div className="relative bg-gradient-to-r from-primary to-secondary p-8 rounded-xl shadow-lg text-white">
                <h1 className="text-4xl font-bold mb-2">College Forms</h1>
                <p className="text-blue-100">
                    Find and download important academic and administrative forms
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Total Forms</p>
                            <p className="text-3xl font-bold text-primary mt-1">{allForms.length}</p>
                        </div>
                        <div className="bg-primary/10 p-3 rounded-lg">
                            <DownloadIcon />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Your Favorites</p>
                            <p className="text-3xl font-bold text-yellow-500 mt-1">{safeUserFormsData.favorites.length}</p>
                        </div>
                        <div className="bg-yellow-500/10 p-3 rounded-lg text-yellow-500">
                            <StarIcon />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Recent Downloads</p>
                            <p className="text-3xl font-bold text-secondary mt-1">{safeUserFormsData.recentDownloads.length}</p>
                        </div>
                        <div className="bg-secondary/10 p-3 rounded-lg text-secondary">
                            <ClockIcon />
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4 bg-white dark:bg-dark-card p-4 rounded-lg shadow-md">
                 <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by form name, number, or submission office..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
                 <div className="flex flex-wrap gap-2">
                    {filters.map(filter => (
                        <button 
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${activeFilter === filter ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                        >
                            {getFilterLabel(filter)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Favorites Section */}
            {activeFilter === 'Favorites' && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center gap-2">
                        <StarIcon />
                        Your Favorite Forms
                    </h2>
                    {favoriteForms.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                            {favoriteForms.map((form, index) => (
                                <FormCard
                                    key={`favorite-${index}`}
                                    form={form}
                                    isFavorite={true}
                                    onToggleFavorite={toggleFavorite}
                                    onDownload={handleDownload}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white dark:bg-dark-card rounded-lg">
                            <div className="text-slate-300 dark:text-slate-600 mb-4">
                                <StarIcon />
                            </div>
                            <p className="text-slate-500 dark:text-slate-400">No favorite forms yet. Click the bookmark icon to save forms!</p>
                        </div>
                    )}
                </div>
            )}

            {/* General Forms */}
            {(activeFilter === 'All' || activeFilter === 'General') && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold border-b border-slate-200 dark:border-slate-700 pb-2">General Academic Forms</h2>
                     {filteredGeneralForms.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                            {filteredGeneralForms.map((form, index) => (
                                <FormCard
                                    key={`general-${index}`}
                                    form={form}
                                    isFavorite={safeUserFormsData.favorites.includes(form.formNumber)}
                                    onToggleFavorite={toggleFavorite}
                                    onDownload={handleDownload}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 bg-white dark:bg-dark-card rounded-lg">
                            <p className="text-slate-500 dark:text-slate-400">No general forms match your search.</p>
                        </div>
                    )}
                </div>
            )}

            {/* UG Forms */}
            {(activeFilter === 'All' || activeFilter === 'UG') && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold border-b border-slate-200 dark:border-slate-700 pb-2">Undergraduate (UG) Forms</h2>
                     {filteredUgForms.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                            {filteredUgForms.map((form, index) => (
                                <FormCard
                                    key={`ug-${index}`}
                                    form={form}
                                    isFavorite={safeUserFormsData.favorites.includes(form.formNumber)}
                                    onToggleFavorite={toggleFavorite}
                                    onDownload={handleDownload}
                                />
                            ))}
                        </div>
                     ) : (
                        <div className="text-center py-8 bg-white dark:bg-dark-card rounded-lg">
                            <p className="text-slate-500 dark:text-slate-400">No UG forms match your search.</p>
                        </div>
                    )}
                </div>
            )}

            {/* PG Forms */}
            {(activeFilter === 'All' || activeFilter === 'PG') && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold border-b border-slate-200 dark:border-slate-700 pb-2">Postgraduate (PG) Forms</h2>
                     {filteredPgForms.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                            {filteredPgForms.map((form: Form, index: number) => (
                                <FormCard
                                    key={`pg-${index}`}
                                    form={form}
                                    isFavorite={safeUserFormsData.favorites.includes(form.formNumber)}
                                    onToggleFavorite={toggleFavorite}
                                    onDownload={handleDownload}
                                />
                            ))}
                        </div>
                     ) : (
                        <div className="text-center py-8 bg-white dark:bg-dark-card rounded-lg">
                            <p className="text-slate-500 dark:text-slate-400">No PG forms match your search.</p>
                        </div>
                    )}
                </div>
            )}

            {/* PhD Forms */}
            {(activeFilter === 'All' || activeFilter === 'PhD') && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold border-b border-slate-200 dark:border-slate-700 pb-2">Doctoral (PhD) Forms</h2>
                     {filteredPhdForms.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                            {filteredPhdForms.map((form: Form, index: number) => (
                                <FormCard
                                    key={`phd-${index}`}
                                    form={form}
                                    isFavorite={safeUserFormsData.favorites.includes(form.formNumber)}
                                    onToggleFavorite={toggleFavorite}
                                    onDownload={handleDownload}
                                />
                            ))}
                        </div>
                     ) : (
                        <div className="text-center py-8 bg-white dark:bg-dark-card rounded-lg">
                            <p className="text-slate-500 dark:text-slate-400">No PhD forms match your search.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CollegeForms;