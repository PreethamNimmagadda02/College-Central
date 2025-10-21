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

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen, sidebarCollapsed }) => {
  const trigger = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLElement>(null);
  const { logout } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const [isHoveringEdge, setIsHoveringEdge] = React.useState(false);

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
    ${!sidebarCollapsed || isHoveringEdge ? 'hidden' : ''}
  `;

  return (
    <>
      <style>{`
        .sidebar-nav::-webkit-scrollbar {
          display: none;
        }
      `}</style>
       {/* Edge hover detector and arrow marker for collapsed sidebar */}
       {sidebarCollapsed && (
         <>
           <div
             className="hidden lg:block fixed left-0 top-16 w-12 h-[calc(100vh-4rem)] z-30"
             onMouseEnter={() => setIsHoveringEdge(true)}
             onMouseLeave={() => setIsHoveringEdge(false)}
           />
           <div
             className={`hidden lg:flex fixed top-1/2 -translate-y-1/2 z-50 items-center justify-center w-6 h-16 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-r-lg shadow-lg transition-all duration-300 pointer-events-none ${
               isHoveringEdge ? 'left-72' : 'left-0'
             }`}
             aria-label="Sidebar marker"
           >
             <svg
               className={`w-4 h-4 transition-transform duration-300 ${isHoveringEdge ? 'rotate-180' : ''}`}
               fill="none"
               viewBox="0 0 24 24"
               stroke="currentColor"
               strokeWidth={2.5}
             >
               <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
             </svg>
           </div>
         </> 
       )}

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
        onMouseEnter={() => {
          if (sidebarCollapsed) {
            setIsHoveringEdge(true);
          }
        }}
        onMouseLeave={(e: React.MouseEvent) => {
          if (sidebarCollapsed) {
            setIsHoveringEdge(false);
          }
        }}
        className={`fixed left-0 top-16 z-40 flex h-[calc(100vh-4rem)] flex-col
          ${isHoveringEdge && sidebarCollapsed
            ? 'bg-white/40 dark:bg-slate-900/40 backdrop-blur-md'
            : 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl'
          }
          border-r border-slate-200/50 dark:border-slate-700/50
          shadow-xl
          duration-300 ease-in-out transition-all overflow-visible
          ${sidebarCollapsed && !isHoveringEdge ? 'w-20' : 'w-72'}
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${sidebarCollapsed && !isHoveringEdge ? 'lg:opacity-0 lg:-translate-x-[calc(100%-1.5rem)]' : ''}
        `}
      >
        <nav
          className={`sidebar-nav flex flex-col flex-1 px-3 py-4 ${!sidebarCollapsed || isHoveringEdge ? 'overflow-y-auto' : ''}`}
          style={!sidebarCollapsed || isHoveringEdge ? {
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          } as React.CSSProperties : {}}
        >
          {/* Academics Section */}
          {(!sidebarCollapsed || isHoveringEdge) && (
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
                      sidebarCollapsed && !isHoveringEdge ? 'px-3 justify-center' : 'px-3'
                    } ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30 scale-[1.02]'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 hover:scale-[1.01]'
                    }`
                  }
                  onClick={() => sidebarOpen && setSidebarOpen(false)}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${sidebarCollapsed && !isHoveringEdge ? 'lg:w-0 lg:opacity-0' : 'lg:w-auto lg:opacity-100'}`}>{item.label}</span>
                  <span className={tooltipClasses}>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Campus Section */}
          {(!sidebarCollapsed || isHoveringEdge) && (
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
                      sidebarCollapsed && !isHoveringEdge ? 'px-3 justify-center' : 'px-3'
                    } ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30 scale-[1.02]'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 hover:scale-[1.01]'
                    }`
                  }
                  onClick={() => sidebarOpen && setSidebarOpen(false)}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${sidebarCollapsed && !isHoveringEdge ? 'lg:w-0 lg:opacity-0' : 'lg:w-auto lg:opacity-100'}`}>{item.label}</span>
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
                        sidebarCollapsed && !isHoveringEdge ? 'px-3 justify-center' : 'px-3'
                      } ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30 scale-[1.02]'
                          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 hover:scale-[1.01]'
                      }`
                    }
                  >
                    <span className="shrink-0"><ProfileIcon /></span>
                    <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${sidebarCollapsed && !isHoveringEdge ? 'lg:w-0 lg:opacity-0' : 'lg:w-auto lg:opacity-100'}`}>Profile</span>
                    <span className={tooltipClasses}>Profile</span>
                  </NavLink>
                </li>
                <li>
                  <button
                    onClick={handleLogout}
                    className={`relative group flex items-center gap-3 w-full rounded-lg py-2.5
                      text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20
                      font-medium transition-all duration-200 hover:scale-[1.01] ${
                        sidebarCollapsed && !isHoveringEdge ? 'px-3 justify-center' : 'px-3'
                      }`}
                  >
                    <span className="shrink-0"><LogoutIcon /></span>
                    <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${sidebarCollapsed && !isHoveringEdge ? 'lg:w-0 lg:opacity-0' : 'lg:w-auto lg:opacity-100'}`}>Logout</span>
                    <span className={tooltipClasses}>Logout</span>
                  </button>
                </li>
            </ul>
          </div>
        </nav>

      </aside>
    </>
  );
};

export default Sidebar;