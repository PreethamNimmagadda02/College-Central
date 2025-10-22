import React, { useState, useEffect } from 'react';
 import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { App as CapacitorApp } from '@capacitor/app';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Check localStorage for user's preference, default to true (collapsed)
    const stored = localStorage.getItem('sidebar-collapsed');
    return stored !== null ? stored === 'true' : true;
  });
  const [sidebarHovering, setSidebarHovering] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    const registerBackButton = async () => {
      const listener = await CapacitorApp.addListener('backButton', () => {
        if (location.pathname === '/') {
          CapacitorApp.exitApp();
        } else {
          navigate(-1);
        }
      });
      return listener;
    };

    const listenerPromise = registerBackButton();

    return () => {
      const removeListener = async () => {
        const listener = await listenerPromise;
        listener.remove();
      };
      removeListener();
    };
  }, [location.pathname, navigate]);

  return (
    <div className="bg-light-bg dark:bg-dark-bg min-h-screen flex flex-col">
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        onHoverChange={setSidebarHovering}
      />

      <div className="relative flex-1 flex flex-col pt-16">
        <div className={`flex-1 transition-all duration-300 ease-in-out ${sidebarCollapsed ? (sidebarHovering ? 'lg:pl-64' : 'lg:pl-0') : 'lg:pl-64'}`}>
          <main className="flex-1">
            <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
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
