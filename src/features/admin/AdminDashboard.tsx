import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import AnalyticsEditor from './components/AnalyticsEditor';
import BranchesEditor from './components/BranchesEditor';
import CalendarEditor from './components/CalendarEditor';
import CampusMapEditor from './components/CampusMapEditor';
import CollegeInfoEditor from './components/CollegeInfoEditor';
import DirectoryEditor from './components/DirectoryEditor';
import FormsEditor from './components/FormsEditor';
import HostelsEditor from './components/HostelsEditor';
import QuickLinksEditor from './components/QuickLinksEditor';
import QuotesEditor from './components/QuotesEditor';
import { useAdminConfig } from './hooks/useAdminConfig';
import { useAuth } from '../auth/hooks/useAuth';
import { AdminTab } from './types';
import './styles.css';

import CoursesEditor from './components/CoursesEditor';
import StudentDirectoryEditor from './components/StudentDirectoryEditor';
import SupportEditor from './components/SupportEditor';
import GradingEditor from './components/GradingEditor';
import LocationAnalyticsEditor from './components/LocationAnalyticsEditor';
import AdminFooter from './components/AdminFooter';
import AdminSearch from './components/AdminSearch';

import BroadcastEditor from './components/BroadcastEditor';
import GradeAnalyticsEditor from './components/GradeAnalyticsEditor';

import { BuildingIcon, AcademicCapIcon, MapPinIcon, HomeIcon, LinkIcon, SparklesIcon, DocumentIcon, CalendarIcon, UsersIcon, BookOpenIcon, UserGroupIcon, ChartBarIcon, SpeakerphoneIcon } from './components/AdminIcons';

// Categorized menu sections
const menuSections = {
  institution: [
    {
      id: 'college-info' as AdminTab,
      path: '/admin/college-info',
      label: 'College Info',
      icon: <BuildingIcon />,
    },
  ],
  academic: [
    {
      id: 'branches' as AdminTab,
      path: '/admin/branches',
      label: 'Branches',
      icon: <AcademicCapIcon />,
    },
    { id: 'courses' as AdminTab, path: '/admin/courses', label: 'Courses', icon: <BookOpenIcon /> },
    {
      id: 'grading' as AdminTab,
      path: '/admin/grading',
      label: 'Grading Scale',
      icon: <ChartBarIcon />,
    },
    {
      id: 'calendar' as AdminTab,
      path: '/admin/calendar',
      label: 'Calendar',
      icon: <CalendarIcon />,
    },
  ],
  people: [
    {
      id: 'directory' as AdminTab,
      path: '/admin/directory',
      label: 'Faculty Directory',
      icon: <UsersIcon />,
    },
    {
      id: 'students' as AdminTab,
      path: '/admin/students',
      label: 'Student Directory',
      icon: <UserGroupIcon />,
    },
  ],
  campus: [
    { id: 'hostels' as AdminTab, path: '/admin/hostels', label: 'Hostels', icon: <HomeIcon /> },
    {
      id: 'campus-map' as AdminTab,
      path: '/admin/campus-map',
      label: 'Campus Map',
      icon: <MapPinIcon />,
    },
  ],
  content: [
    {
      id: 'quick-links' as AdminTab,
      path: '/admin/quick-links',
      label: 'Quick Links',
      icon: <LinkIcon />,
    },
    { id: 'forms' as AdminTab, path: '/admin/forms', label: 'Forms', icon: <DocumentIcon /> },
    { id: 'quotes' as AdminTab, path: '/admin/quotes', label: 'Quotes', icon: <SparklesIcon /> },
  ],
  communication: [
    {
      id: 'broadcasts' as AdminTab,
      path: '/admin/broadcasts',
      label: 'Broadcasts',
      icon: <SpeakerphoneIcon />,
    }
  ],
  monitoring: [
    {
      id: 'analytics' as AdminTab,
      path: '/admin/analytics',
      label: 'User Analytics',
      icon: <ChartBarIcon />,
    },
    {
      id: 'grade-analytics' as AdminTab,
      path: '/admin/grade-analytics',
      label: 'Learning Analytics',
      icon: <AcademicCapIcon />,
    },
    {
      id: 'location-analytics' as AdminTab,
      path: '/admin/location-analytics',
      label: 'Location Insights',
      icon: <MapPinIcon />,
    },
  ],
};

// Flatten tabs for path matching
const allTabs = Object.values(menuSections).flat();

// Get active tab from current path
const getActiveTabFromPath = (pathname: string): AdminTab => {
  const segment = pathname.replace('/admin/', '').replace('/admin', '');
  // Handle special routes
  if (segment === 'support') return 'support';
  const tab = allTabs.find((t) => t.id === segment);
  return tab?.id || 'college-info';
};

const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const adminConfig = useAdminConfig();
  const { logout } = useAuth();

  // Derive active tab from URL
  const activeTab = getActiveTabFromPath(location.pathname);

  // Redirect /admin to /admin/college-info on mount
  useEffect(() => {
    if (location.pathname === '/admin' || location.pathname === '/admin/') {
      navigate('/admin/college-info', { replace: true });
    }
  }, [location.pathname, navigate]);

  // Global keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  const renderContent = () => {
    switch (activeTab) {
      case 'college-info':
        return <CollegeInfoEditor {...adminConfig} />;
      case 'branches':
        return <BranchesEditor {...adminConfig} />;
      case 'hostels':
        return <HostelsEditor {...adminConfig} />;
      case 'quick-links':
        return <QuickLinksEditor {...adminConfig} />;
      case 'quotes':
        return <QuotesEditor {...adminConfig} />;
      case 'forms':
        return <FormsEditor {...adminConfig} />;
      case 'calendar':
        return <CalendarEditor {...adminConfig} />;
      case 'directory':
        return <DirectoryEditor {...adminConfig} />;
      case 'courses':
        return <CoursesEditor {...adminConfig} />;
      case 'students':
        return <StudentDirectoryEditor {...adminConfig} />;
      case 'campus-map':
        return <CampusMapEditor {...adminConfig} />;
      case 'analytics':
        return <AnalyticsEditor />;
      case 'grade-analytics':
        return <GradeAnalyticsEditor />;
      case 'location-analytics':
        return <LocationAnalyticsEditor />;
      case 'grading':
        return <GradingEditor {...adminConfig} />;
      case 'support':
        return <SupportEditor />;
      case 'broadcasts':
        return <BroadcastEditor />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`admin-container min-h-screen flex flex-col ${sidebarOpen ? 'overflow-hidden h-screen' : ''}`}
    >
      {/* Header */}
      <header className="admin-header">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Menu button - show on all screens */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="admin-btn admin-btn-secondary p-2"
              aria-label="Toggle sidebar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {sidebarOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
            <div
              className="flex items-center gap-3 sm:gap-4 cursor-pointer group"
              onClick={() => navigate('/admin/college-info')}
            >
              {/* Logo/Icon */}
              <img
                src="/logo.svg"
                alt="College Central"
                className="h-10 w-auto sm:h-12 drop-shadow-lg hover:drop-shadow-xl transition-all duration-300 group-hover:scale-110"
              />
              <div className="hidden sm:block">
                <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-3 group-hover:opacity-80 transition-opacity">
                  <span className="admin-header-title">College Central</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 font-medium animate-pulse">
                    {adminConfig.config.collegeInfo?.name?.short || 'Admin'}
                  </span>
                </h1>
                <p className="admin-header-subtitle text-sm mt-0.5">Administrator Panel</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {adminConfig.hasChanges && (
              <span className="admin-badge admin-badge-info flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                <span className="hidden sm:inline">Unsaved Changes</span>
              </span>
            )}


            {/* Search Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="admin-btn admin-btn-secondary p-2 sm:px-4 flex items-center gap-2"
              title="Search (⌘K)"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden lg:inline-flex px-1.5 py-0.5 text-xs bg-slate-700 text-slate-300 rounded">
                ⌘K
              </kbd>
            </button>
            {/* User Dashboard Button */}
            <button
              onClick={() => navigate('/')}
              className="admin-btn admin-btn-secondary p-2 sm:px-4 flex items-center gap-2"
              title="Switch to User Dashboard"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <span className="hidden sm:inline">User Dashboard</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Wrapper - grows to push footer down */}
      <div className="flex relative flex-1">
        {/* Sidebar backdrop - show when sidebar is open */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar - toggleable on all screen sizes */}
        <aside
          className={`
          admin-sidebar w-64
          fixed top-[64px] sm:top-[72px] lg:top-[76px] left-0 z-50
          h-[calc(100vh-64px)] sm:h-[calc(100vh-72px)] lg:h-[calc(100vh-76px)]
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          overflow-y-auto
        `}
        >
          {/* Navigation Tabs */}
          <nav className="py-3 sm:py-4 px-2 flex flex-col h-full overflow-y-auto">
            <div className="flex-1 space-y-4">
              {/* Institution Section */}
              <div>
                <div className="px-3 pt-2 pb-1 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Institution
                    </h3>
                  </div>
                </div>
                {menuSections.institution.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      navigate(tab.path);
                      setSidebarOpen(false);
                    }}
                    className={`admin-tab text-left text-sm sm:text-base ${activeTab === tab.id ? 'active' : ''}`}
                  >
                    {tab.icon}
                    <span className="truncate">{tab.label}</span>
                    {activeTab === tab.id && (
                      <svg
                        className="w-4 h-4 ml-auto opacity-70 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>

              {/* Academic Section */}
              <div>
                <div className="px-3 pt-2 pb-1 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Academic
                    </h3>
                  </div>
                </div>
                {menuSections.academic.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      navigate(tab.path);
                      setSidebarOpen(false);
                    }}
                    className={`admin-tab text-left text-sm sm:text-base ${activeTab === tab.id ? 'active' : ''}`}
                  >
                    {tab.icon}
                    <span className="truncate">{tab.label}</span>
                    {activeTab === tab.id && (
                      <svg
                        className="w-4 h-4 ml-auto opacity-70 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>

              {/* People Section */}
              <div>
                <div className="px-3 pt-2 pb-1 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-gradient-to-b from-green-500 to-teal-500 rounded-full"></div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      People
                    </h3>
                  </div>
                </div>
                {menuSections.people.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      navigate(tab.path);
                      setSidebarOpen(false);
                    }}
                    className={`admin-tab text-left text-sm sm:text-base ${activeTab === tab.id ? 'active' : ''}`}
                  >
                    {tab.icon}
                    <span className="truncate">{tab.label}</span>
                    {activeTab === tab.id && (
                      <svg
                        className="w-4 h-4 ml-auto opacity-70 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>

              {/* Campus Section */}
              <div>
                <div className="px-3 pt-2 pb-1 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full"></div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Campus
                    </h3>
                  </div>
                </div>
                {menuSections.campus.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      navigate(tab.path);
                      setSidebarOpen(false);
                    }}
                    className={`admin-tab text-left text-sm sm:text-base ${activeTab === tab.id ? 'active' : ''}`}
                  >
                    {tab.icon}
                    <span className="truncate">{tab.label}</span>
                    {activeTab === tab.id && (
                      <svg
                        className="w-4 h-4 ml-auto opacity-70 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>

              {/* Content Section */}
              <div>
                <div className="px-3 pt-2 pb-1 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-gradient-to-b from-pink-500 to-rose-500 rounded-full"></div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Content
                    </h3>
                  </div>
                </div>
                {menuSections.content.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      navigate(tab.path);
                      setSidebarOpen(false);
                    }}
                    className={`admin-tab text-left text-sm sm:text-base ${activeTab === tab.id ? 'active' : ''}`}
                  >
                    {tab.icon}
                    <span className="truncate">{tab.label}</span>
                    {activeTab === tab.id && (
                      <svg
                        className="w-4 h-4 ml-auto opacity-70 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>

              {/* Communication Section */}
              <div>
                <div className="px-3 pt-2 pb-1 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-gradient-to-b from-indigo-500 to-violet-500 rounded-full"></div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Communication
                    </h3>
                  </div>
                </div>
                {menuSections.communication.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      navigate(tab.path);
                      setSidebarOpen(false);
                    }}
                    className={`admin-tab text-left text-sm sm:text-base ${activeTab === tab.id ? 'active' : ''}`}
                  >
                    {tab.icon}
                    <span className="truncate">{tab.label}</span>
                    {activeTab === tab.id && (
                      <svg
                        className="w-4 h-4 ml-auto opacity-70 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>

              {/* Monitoring Section */}
              <div>
                <div className="px-3 pt-2 pb-1 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full"></div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Monitoring
                    </h3>
                  </div>
                </div>
                {menuSections.monitoring.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      navigate(tab.path);
                      setSidebarOpen(false);
                    }}
                    className={`admin-tab text-left text-sm sm:text-base ${activeTab === tab.id ? 'active' : ''}`}
                  >
                    {tab.icon}
                    <span className="truncate">{tab.label}</span>
                    {activeTab === tab.id && (
                      <svg
                        className="w-4 h-4 ml-auto opacity-70 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Logout Button */}
            <div className="border-t border-slate-700/50 pt-3 mt-3">
              <button
                onClick={() => {
                  logout();
                  setSidebarOpen(false);
                }}
                className="admin-tab text-left text-sm sm:text-base w-full text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full min-h-[calc(100vh-64px-200px)] sm:min-h-[calc(100vh-72px-200px)] lg:min-h-[calc(100vh-76px-200px)]">
          <div className="admin-fade-in pb-16 sm:pb-20">{renderContent()}</div>
        </main>
      </div>

      {/* Separator line before footer */}
      <div className="border-t border-slate-700/50 mx-4 sm:mx-6 lg:mx-8"></div>

      {/* Footer - positioned properly at bottom */}
      <AdminFooter />

      {/* Search Modal */}
      <AdminSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
};

export default AdminDashboard;
