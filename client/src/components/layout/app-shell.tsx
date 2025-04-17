import React from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { useLocation } from "wouter";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [location] = useLocation();

  // Close sidebar when location changes on mobile
  React.useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [location]);

  // Close sidebar when clicking outside on mobile
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('sidebar');
      const menuToggle = document.getElementById('menu-toggle');
      
      if (
        isSidebarOpen && 
        window.innerWidth < 1024 && 
        sidebar && 
        !sidebar.contains(event.target as Node) && 
        menuToggle && 
        !menuToggle.contains(event.target as Node)
      ) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isSidebarOpen]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header toggleSidebar={toggleSidebar} />
      <div className="flex flex-1">
        <Sidebar isOpen={isSidebarOpen} />
        <main className="flex-1 lg:ml-64 pt-4 px-4 md:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
