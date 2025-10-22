import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { SunIcon, MoonIcon, LogoIcon } from './icons/SidebarIcons';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const [isDark, setIsDark] = React.useState(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      return storedTheme === 'dark';
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const { user, updateUser } = useUser();
  const [isTogglingCourse, setIsTogglingCourse] = useState(false);

  React.useEffect(() => {
    const root = document.documentElement;
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      if (themeColorMeta) {
        themeColorMeta.setAttribute('content', '#0f172a');
      }
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      if (themeColorMeta) {
        themeColorMeta.setAttribute('content', '#f1f5f9');
      }
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const toggleCourseOption = async () => {
    if (!user || isTogglingCourse) return;

    setIsTogglingCourse(true);
    const newCourseOption = user.courseOption === 'CBCS' ? 'NEP' : 'CBCS';

    try {
      await updateUser({ courseOption: newCourseOption });
    } catch (error) {
      console.error('Error updating course option:', error);
    } finally {
      setIsTogglingCourse(false);
    }
  };

  return (
    <header className="fixed top-0 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl z-50 border-b border-slate-200/50 dark:border-slate-700/50 shadow-lg">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Header: Left side */}
          <div className="flex items-center gap-4">
            {/* Hamburger button */}
            <button
              className="text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              aria-controls="sidebar"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <span className="sr-only">Open sidebar</span>
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="5" width="16" height="2" rx="1" />
                <rect x="4" y="11" width="16" height="2" rx="1" />
                <rect x="4" y="17" width="16" height="2" rx="1" />
              </svg>
            </button>

            {/* Logo and Brand */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
                <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-1.5 rounded-lg shadow-md">
                  <LogoIcon className="w-6 h-6 text-white" />
                </div>
              </div> 
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                  College Central
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 -mt-0.5">IIT (ISM) Dhanbad</p>
              </div>
            </Link>
          </div>

          {/* Header: Right side */}
          <div className="flex items-center gap-2">
            {/* Course Type Toggle */}
            {user && user.courseOption && (
              <button
                onClick={toggleCourseOption}
                disabled={isTogglingCourse}
                className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
                title={`Switch to ${user.courseOption === 'CBCS' ? 'NEP' : 'CBCS'}`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {user.courseOption === 'CBCS' ? '📖' : '📚'}
                  </span>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {user.courseOption || 'CBCS'}
                  </span>
                </div>
                <svg className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="relative w-10 h-10 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none transition-all duration-300 group"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <div className="relative w-full h-full flex items-center justify-center">
                <SunIcon className={`absolute inset-0 w-full h-full text-amber-500 transition-all duration-500 ease-in-out transform ${isDark ? 'opacity-0 rotate-180 scale-0' : 'opacity-100 rotate-0 scale-100'}`} />
                <MoonIcon className={`absolute inset-0 w-full h-full text-blue-400 transition-all duration-500 ease-in-out transform ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-180 scale-0'}`} />
              </div>
            </button>

            {/* User Profile */}
            {user && (
              <Link
                to="/profile"
                className="flex items-center gap-3 group cursor-pointer px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                title="View your profile"
              >
                <div className="hidden lg:block text-right">
                  <p className="font-semibold text-sm text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {user.fullName || user.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {user.rollNumber || user.admissionNumber}
                  </p>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur opacity-0 group-hover:opacity-40 transition-opacity"></div>
                  {user.profilePicture ? (
                    <img
                      className="relative w-9 h-9 rounded-full ring-2 ring-slate-200 dark:ring-slate-700 group-hover:ring-blue-500 transition-all object-cover"
                      src={user.profilePicture}
                      alt="User avatar"
                    />
                  ) : (
                    <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-slate-200 dark:ring-slate-700 group-hover:ring-blue-500 transition-all">
                      {user.fullName?.charAt(0) || user.name.charAt(0)}
                    </div>
                  )}
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;