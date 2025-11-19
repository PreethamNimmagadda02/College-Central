import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useRef } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';


const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [sidebarHovering, setSidebarHovering] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();


  // Initialize sidebar state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sidebar-collapsed');
      const initialCollapsed = stored !== null ? stored === 'true' : true;
      setSidebarCollapsed(initialCollapsed);
    }
  }, []);

  // Save sidebar state to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-collapsed', String(sidebarCollapsed));
    }
  }, [sidebarCollapsed]);

  // Scroll to top of content when path changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo(0, 0);
    }
  }, [pathname]);



  return (
    <div className="flex h-screen overflow-hidden bg-light-bg dark:bg-dark-bg">

      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        onHoverChange={setSidebarHovering}
      />

      <div 
        ref={scrollContainerRef}
        className="relative flex-1 flex flex-col pt-16 overflow-y-auto overflow-x-hidden"
      >
        <div className={`flex-1 transition-all duration-300 ease-in-out ${sidebarCollapsed ? (sidebarHovering ? 'lg:pl-64' : 'lg:pl-0') : 'lg:pl-64'}`}>
          <main className="flex-1">
            <div className="px-3 sm:px-6 lg:px-8 py-6 sm:py-8 w-full max-w-9xl mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
