import {
  BarChart3,
  BookOpen,
  Building2,
  Calendar,
  ChevronRight,
  FileText,
  GraduationCap,
  House,
  Link,
  LogOut,
  type LucideIcon,
  MapPin,
  Megaphone,
  Menu,
  Search,
  Sparkles,
  Users,
  UsersRound,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import AdminFooter from './components/AdminFooter';
import AdminSearch from './components/AdminSearch';
import AnalyticsEditor from './components/AnalyticsEditor';
import BranchesEditor from './components/BranchesEditor';
import BroadcastEditor from './components/BroadcastEditor';
import CalendarEditor from './components/CalendarEditor';
import CampusMapEditor from './components/CampusMapEditor';
import CollegeInfoEditor from './components/CollegeInfoEditor';
import CoursesEditor from './components/CoursesEditor';
import DirectoryEditor from './components/DirectoryEditor';
import FormsEditor from './components/FormsEditor';
import GradeAnalyticsEditor from './components/GradeAnalyticsEditor';
import GradingEditor from './components/GradingEditor';
import HostelsEditor from './components/HostelsEditor';
import LocationAnalyticsEditor from './components/LocationAnalyticsEditor';
import QuickLinksEditor from './components/QuickLinksEditor';
import QuotesEditor from './components/QuotesEditor';
import StudentDirectoryEditor from './components/StudentDirectoryEditor';
import SupportEditor from './components/SupportEditor';
import { AdminConfigApi, useAdminConfig } from './hooks/useAdminConfig';
import { AdminTab } from './types';
import { useAuth } from '../auth/hooks/useAuth';
import './styles.css';

const EDITORS: Record<AdminTab, React.ComponentType<AdminConfigApi>> = {
  'college-info': CollegeInfoEditor,
  branches: BranchesEditor,
  hostels: HostelsEditor,
  'quick-links': QuickLinksEditor,
  quotes: QuotesEditor,
  forms: FormsEditor,
  calendar: CalendarEditor,
  directory: DirectoryEditor,
  courses: CoursesEditor,
  students: StudentDirectoryEditor,
  'campus-map': CampusMapEditor,
  grading: GradingEditor,
  analytics: AnalyticsEditor,
  'grade-analytics': GradeAnalyticsEditor,
  'location-analytics': LocationAnalyticsEditor,
  support: SupportEditor,
  broadcasts: BroadcastEditor,
};

const MENU: {
  label: string;
  gradient: string;
  tabs: { id: AdminTab; label: string; icon: LucideIcon }[];
}[] = [
  {
    label: 'Institution',
    gradient: 'from-purple-500 to-pink-500',
    tabs: [{ id: 'college-info', label: 'College Info', icon: Building2 }],
  },
  {
    label: 'Academic',
    gradient: 'from-blue-500 to-purple-500',
    tabs: [
      { id: 'branches', label: 'Branches', icon: GraduationCap },
      { id: 'courses', label: 'Courses', icon: BookOpen },
      { id: 'grading', label: 'Grading Scale', icon: BarChart3 },
      { id: 'calendar', label: 'Calendar', icon: Calendar },
    ],
  },
  {
    label: 'People',
    gradient: 'from-green-500 to-teal-500',
    tabs: [
      { id: 'directory', label: 'Faculty Directory', icon: Users },
      { id: 'students', label: 'Student Directory', icon: UsersRound },
    ],
  },
  {
    label: 'Campus',
    gradient: 'from-amber-500 to-orange-500',
    tabs: [
      { id: 'hostels', label: 'Hostels', icon: House },
      { id: 'campus-map', label: 'Campus Map', icon: MapPin },
    ],
  },
  {
    label: 'Content',
    gradient: 'from-pink-500 to-rose-500',
    tabs: [
      { id: 'quick-links', label: 'Quick Links', icon: Link },
      { id: 'forms', label: 'Forms', icon: FileText },
      { id: 'quotes', label: 'Quotes', icon: Sparkles },
    ],
  },
  {
    label: 'Communication',
    gradient: 'from-indigo-500 to-violet-500',
    tabs: [{ id: 'broadcasts', label: 'Broadcasts', icon: Megaphone }],
  },
  {
    label: 'Monitoring',
    gradient: 'from-cyan-500 to-blue-500',
    tabs: [
      { id: 'analytics', label: 'User Analytics', icon: BarChart3 },
      { id: 'grade-analytics', label: 'Learning Analytics', icon: GraduationCap },
      { id: 'location-analytics', label: 'Location Insights', icon: MapPin },
    ],
  },
];

// Every admin page lives at /admin/<tab>; anything else falls back to College Info
const getActiveTab = (pathname: string): AdminTab => {
  const segment = pathname.replace(/^\/admin\/?/, '');
  return Object.prototype.hasOwnProperty.call(EDITORS, segment)
    ? (segment as AdminTab)
    : 'college-info';
};

const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const adminConfig = useAdminConfig();
  const { logout } = useAuth();

  const activeTab = getActiveTab(location.pathname);
  const Editor = EDITORS[activeTab];

  // Redirect /admin to /admin/college-info
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
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  return (
    <div
      className={`admin-container min-h-screen flex flex-col ${sidebarOpen ? 'overflow-hidden h-screen' : ''}`}
    >
      {/* Header */}
      <header className="admin-header">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-3 sm:gap-5">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="admin-btn admin-btn-secondary p-2"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div
              className="flex items-center gap-3 sm:gap-4 cursor-pointer group"
              onClick={() => navigate('/admin/college-info')}
            >
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
            <button
              onClick={() => setSearchOpen(true)}
              className="admin-btn admin-btn-secondary p-2 sm:px-4 flex items-center gap-2"
              title="Search (⌘K)"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden lg:inline-flex px-1.5 py-0.5 text-xs bg-slate-700 text-slate-300 rounded">
                ⌘K
              </kbd>
            </button>
            <button
              onClick={() => navigate('/')}
              className="admin-btn admin-btn-secondary p-2 sm:px-4 flex items-center gap-2"
              title="Switch to User Dashboard"
            >
              <House className="w-4 h-4" />
              <span className="hidden sm:inline">User Dashboard</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Wrapper - grows to push footer down */}
      <div className="flex relative flex-1">
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
        )}

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
          <nav className="py-3 sm:py-4 px-2 flex flex-col h-full overflow-y-auto">
            <div className="flex-1 space-y-4">
              {MENU.map((section) => (
                <div key={section.label}>
                  <div className="px-3 pt-2 pb-1 mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-1 h-4 bg-gradient-to-b ${section.gradient} rounded-full`}
                      />
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {section.label}
                      </h3>
                    </div>
                  </div>
                  {section.tabs.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => {
                        navigate(`/admin/${id}`);
                        setSidebarOpen(false);
                      }}
                      className={`admin-tab text-left text-sm sm:text-base ${activeTab === id ? 'active' : ''}`}
                    >
                      <Icon />
                      <span className="truncate">{label}</span>
                      {activeTab === id && (
                        <ChevronRight className="w-4 h-4 ml-auto opacity-70 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            <div className="border-t border-slate-700/50 pt-3 mt-3">
              <button
                onClick={() => {
                  logout();
                  setSidebarOpen(false);
                }}
                className="admin-tab text-left text-sm sm:text-base w-full text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </nav>
        </aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full min-h-[calc(100vh-64px-200px)] sm:min-h-[calc(100vh-72px-200px)] lg:min-h-[calc(100vh-76px-200px)]">
          <div className="admin-fade-in pb-16 sm:pb-20">
            <Editor {...adminConfig} />
          </div>
        </main>
      </div>

      <div className="border-t border-slate-700/50 mx-4 sm:mx-6 lg:mx-8"></div>

      <AdminFooter />

      <AdminSearch
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        config={adminConfig.config}
      />
    </div>
  );
};

export default AdminDashboard;
