/**
 * @fileoverview Application header component - sticky navigation bar
 *
 * Features:
 * - Always visible at top (fixed position with z-50)
 * - Theme toggle (light/dark mode)
 * - Course option switcher (CBCS/NEP)
 * - User profile link with avatar
 * - Responsive hamburger menu for mobile
 * - Glassmorphism design with backdrop blur
 *
 * @module components/Header
 */

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
        themeColorMeta.setAttribute('content', '#ffffff');
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
    <header className="fixed top-0 left-0 right-0 w-full bg-gradient-to-r from-white/95 via-slate-50/95 to-white/95 dark:from-slate-900/95 dark:via-slate-900/90 dark:to-slate-900/95 backdrop-blur-xl z-50 border-b border-slate-200/50 dark:border-slate-700/50 shadow-lg overflow-hidden">
      {/* Animated background accent */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5 dark:from-blue-500/10 dark:via-purple-500/10 dark:to-blue-500/10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent pointer-events-none"></div>

      <div className="px-3 sm:px-6 lg:px-8 relative">
        <div className="flex items-center justify-between h-16">
          {/* Header: Left side */}
          <div className="flex items-center gap-4">
            {/* Hamburger button */}
            <button
              className="relative group text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 lg:hidden p-2 rounded-xl hover:bg-gradient-to-br hover:from-slate-100 hover:to-blue-50 dark:hover:from-slate-800 dark:hover:to-slate-800/70 transition-all duration-200 hover:shadow-md"
              aria-controls="sidebar"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <span className="sr-only">Open sidebar</span>
              <svg className="w-6 h-6 fill-current transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="5" width="16" height="2" rx="1" className="transition-transform duration-200 origin-center group-hover:translate-x-0.5" />
                <rect x="4" y="11" width="16" height="2" rx="1" />
                <rect x="4" y="17" width="16" height="2" rx="1" className="transition-transform duration-200 origin-center group-hover:translate-x-0.5" />
              </svg>
            </button>

            {/* Logo and Brand */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur opacity-40 group-hover:opacity-70 transition-all duration-300 group-hover:scale-110"></div>
                <div className="relative bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 p-2 rounded-xl shadow-lg group-hover:shadow-blue-500/50 transition-all duration-300 group-hover:scale-105">
                  <LogoIcon className="w-6 h-6 text-white transition-transform duration-300 group-hover:rotate-12" />
                </div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent group-hover:from-blue-500 group-hover:via-purple-500 group-hover:to-blue-500 transition-all duration-300">
                  College Central
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 -mt-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">IIT (ISM) Dhanbad</p>
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
                className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gradient-to-br hover:from-slate-100 hover:to-blue-50 dark:hover:from-slate-800 dark:hover:to-slate-800/70 focus:outline-none transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md hover:scale-105 relative overflow-hidden"
                title={`Switch to ${user.courseOption === 'CBCS' ? 'NEP' : 'CBCS'}`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex items-center gap-1.5 relative z-10">
                  <span className="text-base transition-transform duration-300 group-hover:scale-110">
                    {user.courseOption === 'CBCS' ? '📖' : '📚'}
                  </span>
                  <span className="text-sm font-bold bg-gradient-to-r from-slate-700 to-slate-600 dark:from-slate-200 dark:to-slate-300 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:to-purple-600 dark:group-hover:from-blue-400 dark:group-hover:to-purple-400 transition-all">
                    {user.courseOption || 'CBCS'}
                  </span>
                </div>
                <svg className="w-4 h-4 text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-all duration-300 group-hover:rotate-180 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="relative w-10 h-10 p-2 rounded-xl hover:bg-gradient-to-br hover:from-slate-100 hover:to-blue-50 dark:hover:from-slate-800 dark:hover:to-slate-800/70 focus:outline-none transition-all duration-300 group hover:shadow-md hover:scale-105 overflow-hidden"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-blue-500/10 dark:to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative w-full h-full flex items-center justify-center">
                <SunIcon className={`absolute inset-0 w-full h-full text-amber-500 group-hover:text-amber-400 transition-all duration-500 ease-in-out transform ${isDark ? 'opacity-0 rotate-180 scale-0' : 'opacity-100 rotate-0 scale-100 group-hover:rotate-12'}`} />
                <MoonIcon className={`absolute inset-0 w-full h-full text-blue-400 group-hover:text-blue-300 transition-all duration-500 ease-in-out transform ${isDark ? 'opacity-100 rotate-0 scale-100 group-hover:-rotate-12' : 'opacity-0 -rotate-180 scale-0'}`} />
              </div>
            </button>

            {/* User Profile */}
            {user && (
              <Link
                to="/profile"
                className="flex items-center gap-3 group cursor-pointer px-3 py-1.5 rounded-xl hover:bg-gradient-to-br hover:from-slate-100 hover:to-blue-50 dark:hover:from-slate-800 dark:hover:to-slate-800/70 transition-all duration-300 hover:shadow-md hover:scale-105 relative overflow-hidden"
                title="View your profile"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="hidden lg:block text-right relative z-10">
                  <p className="font-bold text-sm bg-gradient-to-r from-slate-700 to-slate-600 dark:from-slate-200 dark:to-slate-300 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:to-purple-600 dark:group-hover:from-blue-400 dark:group-hover:to-purple-400 transition-all">
                    {user.fullName || user.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {user.rollNumber || user.admissionNumber}
                  </p>
                </div>
                <div className="relative z-10">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-md opacity-0 group-hover:opacity-60 transition-all duration-300"></div>
                  {user.profilePicture ? (
                    <img
                      className="relative w-9 h-9 rounded-full ring-2 ring-slate-200 dark:ring-slate-700 group-hover:ring-blue-500 dark:group-hover:ring-purple-500 transition-all duration-300 object-cover group-hover:scale-110"
                      src={user.profilePicture}
                      alt="User avatar"
                    />
                  ) : (
                    <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-slate-200 dark:ring-slate-700 group-hover:ring-blue-500 dark:group-hover:ring-purple-500 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg">
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

export default React.memo(Header);