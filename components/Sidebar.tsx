import React, { useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { DashboardIcon, GradesIcon, ScheduleIcon, EventsIcon, AnnouncementsIcon, DirectoryIcon, ProfileIcon, LogoutIcon, MapIcon, FormsIcon, CalendarIcon } from './icons/SidebarIcons';
import { useAuth } from '../hooks/useAuth';
import { useUser } from '../contexts/UserContext';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

const CollapseIcon: React.FC = () => (
    <svg className="w-5 h-5 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
    </svg>
);

const ExpandIcon: React.FC = () => (
    <svg className="w-5 h-5 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
    </svg>
);

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed }) => {
  const trigger = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLElement>(null);
  const { logout } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
        await logout();
        navigate('/login');
    } catch (error) {
        console.error("Failed to log out:", error);
    }
  }

  // close on click outside
  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!sidebar.current || !trigger.current) return;
      if (!sidebarOpen || sidebar.current.contains(target as Node) || trigger.current.contains(target as Node)) return;
      setSidebarOpen(false);
    };
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  });

  const menuSections = {
    academics: [
      { path: '/', icon: <DashboardIcon />, label: 'Dashboard' },
      { path: '/grades', icon: <GradesIcon />, label: 'Grades' },
      { path: '/schedule', icon: <ScheduleIcon />, label: 'Schedule' },
      { path: '/academic-calendar', icon: <CalendarIcon />, label: 'Academic Calendar' },
    ],
    campus: [
      { path: '/news-and-events', icon: <AnnouncementsIcon />, label: 'News & Events' },
      { path: '/directory', icon: <DirectoryIcon />, label: 'Directory' },
      { path: '/campus-map', icon: <MapIcon />, label: 'Campus Map' },
      { path: '/college-forms', icon: <FormsIcon />, label: 'Forms' },
    ],
  };

  const tooltipClasses = `
    absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 rounded-lg
    bg-slate-900 dark:bg-slate-800 text-white text-xs font-medium shadow-xl
    border border-slate-700 dark:border-slate-600
    transition-all duration-150
    invisible opacity-0 group-hover:visible group-hover:opacity-100
    whitespace-nowrap z-50 pointer-events-none
    before:content-[''] before:absolute before:right-full before:top-1/2 before:-translate-y-1/2
    before:border-4 before:border-transparent before:border-r-slate-900 dark:before:border-r-slate-800
    ${!sidebarCollapsed ? 'hidden' : ''}
  `;

  return (
    <>
      {/* Sidebar backdrop (mobile) */}
      <div
        className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      ></div>

      <aside
        ref={sidebar}
        className={`fixed left-0 top-16 z-40 flex h-[calc(100vh-4rem)] flex-col
          bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl
          border-r border-slate-200/50 dark:border-slate-700/50
          shadow-xl
          duration-300 ease-in-out transition-all overflow-visible
          ${sidebarCollapsed ? 'w-20' : 'w-72'}
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <nav className={`flex flex-col flex-1 px-3 py-4 ${!sidebarCollapsed ? 'overflow-y-auto' : ''} scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600`}>
          {/* Academics Section */}
          {!sidebarCollapsed && (
            <div className="px-3 mb-2">
              <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Academics
              </h3>
            </div>
          )}
          <ul className="flex flex-col gap-1 mb-6">
            {menuSections.academics.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `relative group flex items-center gap-3 rounded-lg py-2.5 font-medium transition-all duration-200 ${
                      sidebarCollapsed ? 'px-3 justify-center' : 'px-3'
                    } ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30 scale-[1.02]'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 hover:scale-[1.01]'
                    }`
                  }
                  onClick={() => sidebarOpen && setSidebarOpen(false)}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'lg:w-0 lg:opacity-0' : 'lg:w-auto lg:opacity-100'}`}>{item.label}</span>
                  <span className={tooltipClasses}>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Campus Section */}
          {!sidebarCollapsed && (
            <div className="px-3 mb-2">
              <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Campus Life
              </h3>
            </div>
          )}
          <ul className="flex flex-col gap-1 flex-1">
            {menuSections.campus.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `relative group flex items-center gap-3 rounded-lg py-2.5 font-medium transition-all duration-200 ${
                      sidebarCollapsed ? 'px-3 justify-center' : 'px-3'
                    } ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30 scale-[1.02]'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 hover:scale-[1.01]'
                    }`
                  }
                  onClick={() => sidebarOpen && setSidebarOpen(false)}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'lg:w-0 lg:opacity-0' : 'lg:w-auto lg:opacity-100'}`}>{item.label}</span>
                  <span className={tooltipClasses}>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Bottom actions */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-3 mt-3">
            <ul className="flex flex-col gap-1">
               <li>
                  <NavLink
                    to="/profile"
                    className={({ isActive }) =>
                      `relative group flex items-center gap-3 rounded-lg py-2.5 font-medium transition-all duration-200 ${
                        sidebarCollapsed ? 'px-3 justify-center' : 'px-3'
                      } ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30 scale-[1.02]'
                          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 hover:scale-[1.01]'
                      }`
                    }
                  >
                    <span className="shrink-0"><ProfileIcon /></span>
                    <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'lg:w-0 lg:opacity-0' : 'lg:w-auto lg:opacity-100'}`}>Profile</span>
                    <span className={tooltipClasses}>Profile</span>
                  </NavLink>
                </li>
                <li>
                  <button
                    onClick={handleLogout}
                    className={`relative group flex items-center gap-3 w-full rounded-lg py-2.5
                      text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20
                      font-medium transition-all duration-200 hover:scale-[1.01] ${
                        sidebarCollapsed ? 'px-3 justify-center' : 'px-3'
                      }`}
                  >
                    <span className="shrink-0"><LogoutIcon /></span>
                    <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'lg:w-0 lg:opacity-0' : 'lg:w-auto lg:opacity-100'}`}>Logout</span>
                    <span className={tooltipClasses}>Logout</span>
                  </button>
                </li>
            </ul>
          </div>
        </nav>

        {/* Collapse toggle button */}
        <div className="hidden lg:block px-3 py-3 border-t border-slate-200 dark:border-slate-700">
            <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className={`relative group flex items-center w-full rounded-lg py-2 px-2.5
                  text-slate-500 dark:text-slate-400
                  hover:bg-slate-100 dark:hover:bg-slate-800
                  transition-all duration-200 hover:scale-[1.02]
                  ${sidebarCollapsed ? 'justify-center' : 'justify-start gap-2'}`}
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
                {sidebarCollapsed ? <ExpandIcon/> : <CollapseIcon/>}
                <span className={`text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                  Collapse
                </span>
                <span className={tooltipClasses}>{sidebarCollapsed ? 'Expand' : 'Collapse'}</span>
            </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;