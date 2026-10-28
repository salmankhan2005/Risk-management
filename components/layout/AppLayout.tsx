'use client';

import React, { useEffect, useState } from 'react';
import AppSidebar from './AppSidebar';
import AppTopBar from './AppTopBar';
import GlobalSearchModal from './GlobalSearchModal';
import { useRiskWatch } from '@/lib/store';

type AppTheme = 'riskwatch' | 'monochrome' | 'smoky';
const APP_THEME_STORAGE_KEY = 'riskwatch_app_theme';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const {
    workspaceSyncStatus,
    workspaceError,
    workspaceConfigurationMissing,
    retryWorkspaceSync,
  } = useRiskWatch();
  const [searchOpen, setSearchOpen] = useState(false);
  const [theme, setTheme] = useState<AppTheme>('riskwatch');

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(APP_THEME_STORAGE_KEY);
      if (savedTheme === 'riskwatch' || savedTheme === 'monochrome' || savedTheme === 'smoky') {
        setTheme(savedTheme);
      }
    } catch (error) {
      console.error('Unable to load the saved app theme.', error);
    }
  }, []);

  const handleThemeChange = (nextTheme: AppTheme) => {
    setTheme(nextTheme);
    try {
      localStorage.setItem(APP_THEME_STORAGE_KEY, nextTheme);
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
        <main style={{ flex: 1 }}>
          {/* Show sync error banner but NEVER block page content */}
          {workspaceSyncStatus === 'error' && (
            <div className="workspace-sync-warning" role="alert">
              <span>
                {workspaceConfigurationMissing
                  ? 'Workspace saving needs NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.'
                  : workspaceError || 'Workspace sync is unavailable; changes may not be saved.'}
              </span>
              {!workspaceConfigurationMissing && (
                <button type="button" onClick={retryWorkspaceSync}>
                  Retry
                </button>
              )}
            </div>
          )}
          {children}
        </main>
      </div>
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
