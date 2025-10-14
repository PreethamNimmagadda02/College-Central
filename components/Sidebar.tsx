import React, { useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { DashboardIcon, GradesIcon, ScheduleIcon, EventsIcon, AnnouncementsIcon, DirectoryIcon, ProfileIcon, LogoutIcon, MapIcon, FormsIcon, CalendarIcon } from './icons/SidebarIcons';
import { useAuth } from '../hooks/useAuth';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

const CollapseIcon: React.FC = () => (
    <svg className="w-6 h-6 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
    </svg>
);

const ExpandIcon: React.FC = () => (
    <svg className="w-6 h-6 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
    </svg>
);

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed }) => {
  const trigger = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLElement>(null);
  const { logout } = useAuth();
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
  
  const menuItems = [
    { path: '/', icon: <DashboardIcon />, label: 'Dashboard' },
    { path: '/grades', icon: <GradesIcon />, label: 'Grades' },
    { path: '/schedule', icon: <ScheduleIcon />, label: 'Schedule' },
    { path: '/academic-calendar', icon: <CalendarIcon />, label: 'Academic Calendar' },
    { path: '/news-and-events', icon: <AnnouncementsIcon />, label: 'News & Events' },
    { path: '/directory', icon: <DirectoryIcon />, label: 'Campus Directory' },
    { path: '/campus-map', icon: <MapIcon />, label: 'Campus Map' },
    { path: '/college-forms', icon: <FormsIcon />, label: 'College Forms' },
  ];

  const tooltipClasses = `
    absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 rounded-md
    bg-slate-800 dark:bg-slate-900 text-white text-sm font-medium shadow-lg
    transition-opacity duration-200
    invisible opacity-0 group-hover:visible group-hover:opacity-100
    whitespace-nowrap z-50
    ${!sidebarCollapsed ? 'hidden' : ''}
  `;

  return (
    <>
      {/* Sidebar backdrop (mobile) */}
      <div
        className={`fixed inset-0 bg-slate-900 bg-opacity-30 z-30 lg:hidden lg:z-auto transition-opacity duration-200 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      ></div>

      <aside
        ref={sidebar}
        className={`fixed left-0 top-16 z-40 flex h-[calc(100vh-4rem)] flex-col bg-white dark:bg-dark-card border-r border-slate-200 dark:border-slate-700 duration-300 ease-in-out transition-all overflow-visible
          ${sidebarCollapsed ? 'w-20' : 'w-64'}
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <nav className={`flex flex-col flex-1 px-3 py-4 mt-4 ${!sidebarCollapsed ? 'overflow-y-auto' : ''}`}>
          <ul className="flex flex-col gap-1.5 flex-1">
            {menuItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `relative group flex items-center gap-3 rounded-md py-2 font-medium duration-300 ease-in-out ${
                      sidebarCollapsed ? 'px-2 justify-center' : 'px-4'
                    } ${
                      isActive 
                        ? 'bg-primary/10 text-primary dark:bg-slate-700 dark:text-white border-l-4 border-primary' 
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white'
                    }`
                  }
                  onClick={() => sidebarOpen && setSidebarOpen(false)}
                >
                  {item.icon}
                  <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'lg:w-0 lg:opacity-0' : 'lg:w-auto lg:opacity-100'}`}>{item.label}</span>
                  <span className={tooltipClasses}>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
          {/* Bottom actions */}
          <ul className="flex flex-col gap-1.5 mt-auto">
             <li>
                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    `relative group flex items-center gap-3 rounded-md py-2 font-medium duration-300 ease-in-out ${
                      sidebarCollapsed ? 'px-2 justify-center' : 'px-4'
                    } ${
                      isActive 
                        ? 'bg-primary/10 text-primary dark:bg-slate-700 dark:text-white border-l-4 border-primary' 
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white'
                    }`
                  }
                >
                  <ProfileIcon />
                  <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'lg:w-0 lg:opacity-0' : 'lg:w-auto lg:opacity-100'}`}>Profile</span>
                  <span className={tooltipClasses}>Profile</span>
                </NavLink>
              </li>
              <li>
                <button
                  onClick={handleLogout}
                  className={`relative group flex items-center gap-3 w-full rounded-md py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium duration-300 ease-in-out ${sidebarCollapsed ? 'px-2 justify-center' : 'px-4'}`}
                >
                  <LogoutIcon />
                  <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'lg:w-0 lg:opacity-0' : 'lg:w-auto lg:opacity-100'}`}>Logout</span>
                  <span className={tooltipClasses}>Logout</span>
                </button>
              </li>
          </ul>
        </nav>
        
        {/* Collapse toggle button */}
        <div className="hidden lg:block p-3 border-t border-slate-200 dark:border-slate-700">
            <button 
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className={`relative group flex items-center w-full rounded-md p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 ${sidebarCollapsed ? 'justify-center' : 'justify-start gap-3'}`}
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
                {sidebarCollapsed ? <ExpandIcon/> : <CollapseIcon/>}
                <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>Collapse</span>
                <span className={tooltipClasses}>{sidebarCollapsed ? 'Expand' : 'Collapse'}</span>
            </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;