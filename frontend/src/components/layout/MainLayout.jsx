import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useQuantum } from '../../context/QuantumContext';

export default function MainLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { backendHealth } = useQuantum();

  return (
    <div className="min-h-screen flex bg-[var(--lab-bg)] text-[var(--lab-text)]">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        backendOnline={backendHealth?.online}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          onOpenMobileMenu={() => setMobileOpen(true)}
          sidebarCollapsed={collapsed}
        />
        <main className="flex-1 p-4 sm:p-6 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
