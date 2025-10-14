import React from 'react';
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
  
  const { user } = useUser();

  React.useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <header className="fixed top-0 w-full bg-white dark:bg-dark-card z-20 border-b border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Header: Left side */}
          <div className="flex items-center gap-4">
            {/* Hamburger button */}
            <button
              className="text-slate-500 hover:text-slate-600 lg:hidden"
              aria-controls="sidebar"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <span className="sr-only">Open sidebar</span>
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="5" width="16" height="2" />
                <rect x="4" y="11" width="16" height="2" />
                <rect x="4" y="17" width="16" height="2" />
              </svg>
            </button>
             <Link to="/" className="flex items-center gap-2">
                <LogoIcon className="w-8 h-8 text-primary" />
                <h1 className="hidden sm:block text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    IIT(ISM) Student Hub
                </h1>
            </Link>
          </div>

          {/* Header: Right side */}
          <div className="flex items-center space-x-3">
            <button
                onClick={toggleTheme}
                className="w-10 h-10 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none transition-colors duration-300"
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
                <div className="relative w-full h-full flex items-center justify-center">
                    <SunIcon className={`absolute inset-0 w-full h-full text-slate-600 transition-all duration-300 ease-in-out transform ${isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`} />
                    <MoonIcon className={`absolute inset-0 w-full h-full text-yellow-300 transition-all duration-300 ease-in-out transform ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}`} />
                </div>
            </button>
            {user && (
              <Link to="/profile" className="flex items-center group cursor-pointer p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title="View your profile">
                <div className="text-right mr-3">
                  <p className="font-semibold text-sm group-hover:text-primary dark:group-hover:text-secondary transition-colors">{user.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{user.admissionNumber}</p>
                </div>
                <img className="h-8 w-8 rounded-full ring-2 ring-transparent group-hover:ring-primary dark:group-hover:ring-secondary transition-all" src={`https://picsum.photos/seed/${user.id}/100`} alt="User avatar" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;