'use client';

import React, { useEffect, useState } from 'react';
import AppSidebar from './AppSidebar';
import AppTopBar from './AppTopBar';
import GlobalSearchModal from './GlobalSearchModal';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [theme, setTheme] = useState<'riskwatch' | 'monochrome'>('riskwatch');

  useEffect(() => {
    try {
      if (localStorage.getItem('riskwatch_app_theme') === 'monochrome') {
        setTheme('monochrome');
      }
    } catch (error) {
      console.error('Unable to load the saved app theme.', error);
    }
  }, []);

  const handleThemeChange = (nextTheme: 'riskwatch' | 'monochrome') => {
    setTheme(nextTheme);
    try {
      localStorage.setItem('riskwatch_app_theme', nextTheme);
    } catch (error) {
      console.error('Unable to save the selected app theme.', error);
    }
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div className="app-root" data-theme={theme}>
      <AppSidebar />
      <div className="app-content-area">
        <AppTopBar
          onOpenSearch={() => setSearchOpen(true)}
          theme={theme}
          onThemeChange={handleThemeChange}
        />
        <main style={{ flex: 1 }}>{children}</main>
      </div>
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
