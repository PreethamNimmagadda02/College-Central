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
  onHoverChange?: (isHovering: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed, onHoverChange }) => {
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

  // Handle edge hover detection
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const handleMouseMove = (e: MouseEvent) => {
      if (sidebarCollapsed) {
        // When sidebar is visible (hovering), keep it visible if mouse is within sidebar width
        // Otherwise, detect if mouse is within edge detection area to trigger show
        const sidebarWidth = 256; // w-64 = 256px
        const edgeDetectionWidth = 100; // Wide area to make sidebar easily accessible

        const shouldShowSidebar = isHoveringEdge
          ? e.clientX <= sidebarWidth // Keep visible if within sidebar area
          : e.clientX <= edgeDetectionWidth; // Show if near left edge

        if (shouldShowSidebar !== isHoveringEdge) {
          setIsHoveringEdge(shouldShowSidebar);
          onHoverChange?.(shouldShowSidebar);
        }
      }
    };

    if (sidebarCollapsed) {
      document.addEventListener('mousemove', handleMouseMove, { passive: true });
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
      };
    } else {
      // Reset hover state when sidebar is not collapsed
      if (isHoveringEdge) {
        setIsHoveringEdge(false);
        onHoverChange?.(false);
      }
    }
  }, [sidebarCollapsed, isHoveringEdge, onHoverChange]);

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
      {/* Edge hover marker for collapsed sidebar */}
      {sidebarCollapsed && (
        <div
          className={`hidden lg:flex fixed top-1/2 -translate-y-1/2 z-50 items-center justify-center w-6 h-16 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-r-lg shadow-lg transition-all duration-300 pointer-events-none ${
            isHoveringEdge && sidebarCollapsed ? 'left-64' : 'left-0'
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
            onHoverChange?.(true);
          }
        }}
        onMouseLeave={() => {
          // The global mousemove handler will handle hiding the sidebar
          // when the cursor moves beyond the sidebar boundary
        }}
        className={`fixed left-0 top-16 bottom-0 z-40 flex flex-col
          ${sidebarCollapsed && isHoveringEdge ? 'bg-white/10 dark:bg-slate-900/10' : 'bg-white/95 dark:bg-slate-900/95'} backdrop-blur-xl
          border-r border-slate-200/50 dark:border-slate-700/50
          duration-300 ease-in-out transition-all overflow-visible
          ${sidebarCollapsed && !isHoveringEdge ? 'w-64 -translate-x-full' : 'w-64'}
          ${sidebarOpen ? 'translate-x-0' : sidebarCollapsed ? '' : '-translate-x-full lg:translate-x-0'}
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
          <ul className="flex flex-col gap-1">
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

          {/* Spacer to push bottom actions to the end */}
          <div className="flex-1"></div>

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